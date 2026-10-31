// One learning fighter: a small neural network trained with PPO (proximal policy optimization).
// The fighter plays, dies, and every `rollout` decisions it nudges its network toward the
// choices that earned more reward than it expected.

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rand) {
  let u = 0, v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// Fully connected network: tanh hidden layers, linear output, with backprop and Adam.
class MLP {
  constructor(sizes, rand, outScale = 1) {
    this.sizes = sizes.slice();
    this.L = sizes.length - 1;
    this.W = []; this.b = [];
    for (let l = 0; l < this.L; l++) {
      const nIn = sizes[l], nOut = sizes[l + 1];
      const scale = (l === this.L - 1 ? outScale : 1) / Math.sqrt(nIn);
      const w = new Float32Array(nIn * nOut);
      if (rand) for (let i = 0; i < w.length; i++) w[i] = gaussian(rand) * scale;
      this.W.push(w); this.b.push(new Float32Array(nOut));
    }
    const zeros = arr => arr.map(a => new Float32Array(a.length));
    this.gW = zeros(this.W); this.gb = zeros(this.b);
    this.mW = zeros(this.W); this.mb = zeros(this.b);
    this.vW = zeros(this.W); this.vb = zeros(this.b);
    this.t = 0;
    this.acts = this.newActs();
  }

  newActs() { return this.sizes.map(n => new Float32Array(n)); }

  forward(x, acts = this.acts) {
    acts[0].set(x);
    for (let l = 0; l < this.L; l++) {
      const a = acts[l], out = acts[l + 1], W = this.W[l], b = this.b[l];
      const nIn = a.length, nOut = out.length, last = l === this.L - 1;
      for (let o = 0; o < nOut; o++) {
        let s = b[o];
        const row = o * nIn;
        for (let i = 0; i < nIn; i++) s += W[row + i] * a[i];
        out[o] = last ? s : Math.tanh(s);
      }
    }
    return acts[this.L];
  }

  // Accumulates gradients for one sample, given the activations from forward() and dLoss/dOutput.
  backward(acts, dOut) {
    let delta = dOut;
    for (let l = this.L - 1; l >= 0; l--) {
      const a = acts[l], W = this.W[l], gW = this.gW[l], gb = this.gb[l];
      const nIn = a.length, nOut = delta.length;
      const prev = l > 0 ? new Float32Array(nIn) : null;
      for (let o = 0; o < nOut; o++) {
        const d = delta[o];
        if (d === 0) continue;
        gb[o] += d;
        const row = o * nIn;
        for (let i = 0; i < nIn; i++) {
          gW[row + i] += d * a[i];
          if (prev) prev[i] += W[row + i] * d;
        }
      }
      if (prev) for (let i = 0; i < nIn; i++) prev[i] *= 1 - a[i] * a[i];
      delta = prev;
    }
  }

  zeroGrad() {
    for (const g of this.gW) g.fill(0);
    for (const g of this.gb) g.fill(0);
  }

  gradNormSq() {
    let s = 0;
    for (const g of this.gW) for (let i = 0; i < g.length; i++) s += g[i] * g[i];
    for (const g of this.gb) for (let i = 0; i < g.length; i++) s += g[i] * g[i];
    return s;
  }

  // Adam step on the accumulated gradients, multiplied by `scale` first.
  adam(lr, scale) {
    const b1 = 0.9, b2 = 0.999, eps = 1e-8;
    this.t++;
    const c1 = 1 - Math.pow(b1, this.t), c2 = 1 - Math.pow(b2, this.t);
    const step = (w, g, m, v) => {
      for (let i = 0; i < w.length; i++) {
        const gi = g[i] * scale;
        m[i] = b1 * m[i] + (1 - b1) * gi;
        v[i] = b2 * v[i] + (1 - b2) * gi * gi;
        w[i] -= lr * (m[i] / c1) / (Math.sqrt(v[i] / c2) + eps);
      }
    };
    for (let l = 0; l < this.L; l++) {
      step(this.W[l], this.gW[l], this.mW[l], this.vW[l]);
      step(this.b[l], this.gb[l], this.mb[l], this.vb[l]);
    }
  }

  toJSON() {
    const r = a => Array.from(a, x => Math.round(x * 1e5) / 1e5);
    return { sizes: this.sizes, W: this.W.map(r), b: this.b.map(r) };
  }

  static fromJSON(o) {
    const m = new MLP(o.sizes, null);
    o.W.forEach((w, l) => m.W[l].set(w));
    o.b.forEach((b, l) => m.b[l].set(b));
    return m;
  }
}

// The fighter chooses a direction to move and one action every decision.
const MOVE_DIRS = [[0, 0], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]].map(([x, y]) => {
  const d = Math.hypot(x, y) || 1; return [x / d, y / d];
});
const ACTIONS = ['none', 'strike', 'heavy', 'guard', 'kick', 'roll', 'ability 1', 'ability 2'];
const MOVE_LABELS = ['stay', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];
const N_MOVE = MOVE_DIRS.length, N_ACT = ACTIONS.length;
const ACTION_REPEAT = 4;      // sim ticks per decision (15 decisions a second)
const REWARD_SCALE = 0.05;

// [moveX, moveY, strike, heavy, guard, kick, roll, ability1, ability2] as the sim expects
function toSimAction(move, act) {
  const [mx, my] = MOVE_DIRS[move];
  const a = [mx, my, -1, -1, -1, -1, -1, -1, -1];
  if (act > 0) a[act + 1] = 1;
  return a;
}

function softmaxInto(z, off, n, out) {
  let mx = -Infinity;
  for (let i = 0; i < n; i++) mx = Math.max(mx, z[off + i]);
  let s = 0;
  for (let i = 0; i < n; i++) { out[i] = Math.exp(z[off + i] - mx); s += out[i]; }
  for (let i = 0; i < n; i++) out[i] /= s;
  return out;
}

const DEFAULT_LEARNING = {
  hidden: [64, 64], lr: 0.0003, gamma: 0.99, lambda: 0.95, clip: 0.2, entropy: 0.01,
  rollout: 1024, epochs: 4, minibatch: 256,
};

class PPOAgent {
  constructor(cfg = {}, seed = 1) {
    this.cfg = { ...DEFAULT_LEARNING, ...cfg };
    const rand = mulberry32(seed);
    this.rand = rand;
    this.actor = new MLP([N_INPUTS, ...this.cfg.hidden, N_MOVE + N_ACT], rand, 0.01);
    this.critic = new MLP([N_INPUTS, ...this.cfg.hidden, 1], rand, 1);
    this.pm = new Float32Array(N_MOVE); this.pa = new Float32Array(N_ACT);
    this.updates = 0; this.steps = 0;
    this.lastStats = null;
    this.allocBuffer();
  }

  allocBuffer() {
    const n = this.cfg.rollout;
    this.buf = {
      obs: new Float32Array(n * N_INPUTS), am: new Int8Array(n), aa: new Int8Array(n),
      logp: new Float32Array(n), val: new Float32Array(n), rew: new Float32Array(n), done: new Uint8Array(n),
    };
    this.n = 0;
  }

  // Probabilities for the current observation (also leaves activations for the brain view).
  probs(obs) {
    const z = this.actor.forward(obs);
    softmaxInto(z, 0, N_MOVE, this.pm);
    softmaxInto(z, N_MOVE, N_ACT, this.pa);
    return { pm: this.pm, pa: this.pa };
  }

  value(obs) { return this.critic.forward(obs)[0]; }

  sampleFrom(p) {
    let r = this.rand(), i = 0;
    for (; i < p.length - 1; i++) { r -= p[i]; if (r <= 0) break; }
    return i;
  }

  act(obs, greedy) {
    const { pm, pa } = this.probs(obs);
    const argmax = p => p.indexOf(Math.max(...p));
    const move = greedy ? argmax(pm) : this.sampleFrom(pm);
    const act = greedy ? argmax(pa) : this.sampleFrom(pa);
    return { move, act, logp: Math.log(pm[move] + 1e-8) + Math.log(pa[act] + 1e-8), v: greedy ? 0 : this.value(obs) };
  }

  store(obs, a, r, done) {
    const b = this.buf, i = this.n++;
    b.obs.set(obs, i * N_INPUTS);
    b.am[i] = a.move; b.aa[i] = a.act; b.logp[i] = a.logp; b.val[i] = a.v; b.rew[i] = r; b.done[i] = done ? 1 : 0;
    this.steps++;
  }

  full() { return this.n >= this.cfg.rollout; }

  // A generator so a long update can be spread over several animation frames.
  *update(lastValue) {
    const c = this.cfg, b = this.buf, n = this.n;
    const adv = new Float32Array(n), ret = new Float32Array(n);
    let gae = 0;
    for (let i = n - 1; i >= 0; i--) {
      const nextV = i === n - 1 ? lastValue : b.val[i + 1];
      const nonTerminal = 1 - b.done[i];
      const delta = b.rew[i] + c.gamma * nextV * nonTerminal - b.val[i];
      gae = delta + c.gamma * c.lambda * nonTerminal * gae;
      adv[i] = gae; ret[i] = gae + b.val[i];
    }
    let mean = 0, sq = 0;
    for (let i = 0; i < n; i++) mean += adv[i];
    mean /= n;
    for (let i = 0; i < n; i++) sq += (adv[i] - mean) ** 2;
    const std = Math.sqrt(sq / n) + 1e-8;
    for (let i = 0; i < n; i++) adv[i] = (adv[i] - mean) / std;

    const idx = Array.from({ length: n }, (_, i) => i);
    const aActs = this.actor.newActs(), cActs = this.critic.newActs();
    const pm = new Float32Array(N_MOVE), pa = new Float32Array(N_ACT);
    const dz = new Float32Array(N_MOVE + N_ACT), dv = new Float32Array(1);
    const obs = new Float32Array(N_INPUTS);
    let entSum = 0, klSum = 0, vlSum = 0, clipped = 0, count = 0;

    for (let ep = 0; ep < c.epochs; ep++) {
      for (let i = n - 1; i > 0; i--) { const j = Math.floor(this.rand() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
      for (let start = 0; start < n; start += c.minibatch) {
        const end = Math.min(n, start + c.minibatch), m = end - start;
        this.actor.zeroGrad(); this.critic.zeroGrad();
        for (let k = start; k < end; k++) {
          const i = idx[k];
          obs.set(b.obs.subarray(i * N_INPUTS, (i + 1) * N_INPUTS));
          const z = this.actor.forward(obs, aActs);
          softmaxInto(z, 0, N_MOVE, pm);
          softmaxInto(z, N_MOVE, N_ACT, pa);
          const am = b.am[i], aa = b.aa[i];
          const logp = Math.log(pm[am] + 1e-8) + Math.log(pa[aa] + 1e-8);
          const ratio = Math.exp(logp - b.logp[i]);
          const A = adv[i];
          const active = A >= 0 ? ratio < 1 + c.clip : ratio > 1 - c.clip;
          if (!active) clipped++;
          const g = active ? -A * ratio : 0;
          let hm = 0, ha = 0;
          for (let j = 0; j < N_MOVE; j++) hm -= pm[j] * Math.log(pm[j] + 1e-8);
          for (let j = 0; j < N_ACT; j++) ha -= pa[j] * Math.log(pa[j] + 1e-8);
          for (let j = 0; j < N_MOVE; j++) dz[j] = g * ((j === am ? 1 : 0) - pm[j]) + c.entropy * pm[j] * (Math.log(pm[j] + 1e-8) + hm);
          for (let j = 0; j < N_ACT; j++) dz[N_MOVE + j] = g * ((j === aa ? 1 : 0) - pa[j]) + c.entropy * pa[j] * (Math.log(pa[j] + 1e-8) + ha);
          this.actor.backward(aActs, dz);
          const v = this.critic.forward(obs, cActs)[0];
          dv[0] = v - ret[i];
          this.critic.backward(cActs, dv);
          entSum += hm + ha; klSum += b.logp[i] - logp; vlSum += dv[0] * dv[0]; count++;
        }
        for (const net of [this.actor, this.critic]) {
          const norm = Math.sqrt(net.gradNormSq()) / m;
          const clipScale = norm > 0.5 ? 0.5 / norm : 1;
          net.adam(c.lr, clipScale / m);
        }
        yield;
      }
    }
    this.n = 0;
    this.updates++;
    this.lastStats = { entropy: entSum / count, kl: klSum / count, valueLoss: vlSum / count, clipFrac: clipped / count };
  }

  toJSON() { return { cfg: this.cfg, actor: this.actor.toJSON(), critic: this.critic.toJSON(), updates: this.updates, steps: this.steps }; }

  static fromJSON(o) {
    const a = new PPOAgent(o.cfg);
    a.actor = MLP.fromJSON(o.actor);
    a.critic = MLP.fromJSON(o.critic);
    a.updates = o.updates || 0; a.steps = o.steps || 0;
    return a;
  }
}

// Drives one fighter through episode after episode, learning as it goes.
class Trainer {
  constructor(agent, makeSim, getRewards, onEpisode) {
    this.agent = agent; this.makeSim = makeSim; this.getRewards = getRewards; this.onEpisode = onEpisode;
    this.obs = new Float32Array(N_INPUTS);
    this.updating = null;
    this.newEpisode();
  }

  newEpisode() {
    this.sim = this.makeSim();
    this.obs.set(this.sim.sense());
    this.prevScore = 0; this.epReturn = 0;
  }

  // One unit of work: a decision, or a slice of a pending network update. Returns 'update' or 'step'.
  tick() {
    const agent = this.agent;
    if (this.updating) {
      if (this.updating.next().done) this.updating = null;
      return 'update';
    }
    const sim = this.sim, w = this.getRewards();
    const a = agent.act(this.obs, false);
    const action = toSimAction(a.move, a.act);
    for (let k = 0; k < ACTION_REPEAT && !sim.done; k++) sim.step(action);
    const score = rewardScore(sim.stats, sim.t, w);
    const r = score - this.prevScore;
    this.prevScore = score; this.epReturn += r;
    let rr = r * REWARD_SCALE;
    const next = sim.sense();
    // running out the clock is not a real ending: bootstrap from what the critic expects next
    if (sim.done && sim.stats.result === 'time') rr += agent.cfg.gamma * agent.value(next);
    agent.store(this.obs, a, rr, sim.done);
    if (sim.done) {
      this.onEpisode(sim, this.epReturn);
      this.newEpisode();
    } else this.obs.set(next);
    if (agent.full()) this.updating = agent.update(agent.value(this.obs));
    return 'step';
  }
}
