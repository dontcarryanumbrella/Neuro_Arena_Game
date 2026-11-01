// The worlds' own foes (stage 6): each new mechanic does what it says, and every one of them lives in some world.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ctx = vm.createContext({ console, assert });
vm.runInContext(['agent', 'sim', 'campaign', 'lore'].map(n => fs.readFileSync(`${__dirname}/../js/${n}.js`, 'utf8')).join('\n') + `
const NEW = ['staffmonk', 'arhat', 'gargoyle', 'ghoul', 'disciple', 'imp', 'hellhound', 'yukionna', 'tengu', 'swarmdrone', 'sentry', 'chronomancer',
  'glitch', 'twin', 'flyhead', 'cspirit', 'ccorpse', 'strawdoll', 'cspeech', 'shikigami', 'cultist', 'byakhee', 'dancer', 'pknight', 'horror'];
const HERO = { hp: 300, energy: 300, energyRegen: 30, posture: 250 };
function room(foes, steps = 90) {
  const sim = new Sim('room', 7, { waves: [foes], timeLimit: 60, fighter: HERO });
  for (let i = 0; i < steps; i++) sim.step(null);
  return sim;
}
const find = (sim, t) => sim.enemies.filter(e => e.type === t && !e.dead);

// every new foe: a world, a Codex line, a technique to learn, words for the panels, a sprite name
for (const t of NEW) {
  assert.ok(ENEMY_TYPES[t] && ROSTER.includes(t), t + ' is a regular foe');
  assert.ok(WORLDS.some(w => worldFoes(w).includes(t)), t + ' lives in a world');
  assert.ok(CODEX_LORE[t], t + ' has a Codex line');
  assert.ok(HERO_ABILITIES[t], t + ' teaches a technique');
  assert.ok(ENEMY_TYPES[t].passive && ENEMY_TYPES[t].active, t + ' has its words');
}

// the Pallid Knight: no posture while masked; three heavies or kicks crack the mask off
{
  const sim = room(['pknight']), k = find(sim, 'pknight')[0];
  assert.equal(k.maskHp, 3);
  sim.receiveHit(k, sim.p, { ...BASE_MOVES.strike }, 1, 0);
  assert.equal(k.posture, 0, 'masked, it takes no posture damage');
  for (let i = 0; i < 3; i++) { k.state = 'idle'; k.guard = false; k.invulnT = 0; sim.receiveHit(k, sim.p, { ...BASE_MOVES.heavy }, 1, 0); }
  assert.equal(k.maskHp, 0, 'three heavies crack the mask');
  assert.ok(k.postureMul > 1, 'and now its posture can break');
}

// the Paradox Twins: always two; one fallen comes back after three seconds, unless both fall within them
{
  const sim = room(['twin']), tw = find(sim, 'twin');
  assert.equal(tw.length, 2, 'a lone twin brings its other');
  assert.equal(tw[0].partner, tw[1]);
  sim.kill(tw[0]);
  assert.equal(sim.rewinds.length, 1);
  for (let i = 0; i < 200; i++) sim.step(null);
  const back = find(sim, 'twin');
  assert.equal(back.length, 2, 'it comes back');
  assert.ok(back.some(t => t.partner === tw[1]), 'bound to its other again');
  sim.kill(back[0]); sim.kill(back[1]);
  assert.equal(sim.rewinds.length, 0, 'both fell within three seconds: nothing comes back');
}

// the Chronomancer turns an ally's clock back once
{
  const sim = room(['chronomancer', 'bandit']), c = find(sim, 'chronomancer')[0], b = find(sim, 'bandit')[0];
  b.x = c.x + 10; b.y = c.y;
  sim.kill(b);
  assert.ok(c.rewound && sim.rewinds.length === 1);
  for (let i = 0; i < 90; i++) sim.step(null);
  const b2 = find(sim, 'bandit')[0];
  assert.ok(b2 && b2.hp <= b2.maxHp * 0.5 + 1, 'the ally returns at half health');
  b2.x = c.x + 10; b2.y = c.y; sim.kill(b2);
  assert.equal(sim.rewinds.length, 0, 'only once a fight');
}

// Ghouls feed on what falls near them
{
  const sim = room(['ghoul', 'bandit']), g = find(sim, 'ghoul')[0], b = find(sim, 'bandit')[0];
  g.hp = 10; b.x = g.x + 8; b.y = g.y;
  sim.kill(b);
  assert.ok(g.hp > 10, 'the ghoul fed');
}

// the Straw Doll: nails stay in you; the doll makes them all resonate, past any guard
{
  const sim = room(['strawdoll']), d = find(sim, 'strawdoll')[0], h = sim.p;
  for (let i = 0; i < 3; i++) sim.applyStatus(h, { nail: 1 }, d);
  assert.equal(h.nails, 3);
  const hp0 = h.hp; h.guard = true;
  d.atk = d.specials.find(s => s.id === 'resonance'); sim.special(d);
  assert.equal(h.nails, 0);
  assert.ok(h.hp < hp0, 'the nails resonate through a guard');
}

// Cursed Speech: a word roots you, and costs the speaker
{
  const sim = room(['cspeech']), s = find(sim, 'cspeech')[0], hp0 = s.hp;
  s.atk = s.specials.find(x => x.id === 'dontmove'); sim.special(s);
  assert.ok(sim.p.rootT > 0, '"Don\\'t move" roots');
  assert.ok(s.hp < hp0, 'and costs it health');
}

// the Glitch copies the last ability you used
{
  const sim = room(['glitch']), g = find(sim, 'glitch')[0];
  const s = g.specials.find(x => x.kind === 'copycat');
  assert.equal(sim.copyAbility(g, s, sim.p), null, 'nothing to copy yet');
  sim.p.lastAbility = HERO_ABILITIES.bandit;
  const c = sim.copyAbility(g, s, sim.p);
  assert.equal(c.kind, 'pounce');
  assert.ok(c.dmg < HERO_ABILITIES.bandit.atk.dmg, 'a little weaker');
}

// conditions that travel: a time mine freezes, the Yellow Sign brings fear
{
  const sim = room(['chronomancer']), c = find(sim, 'chronomancer')[0], h = sim.p;
  sim.hazards.push({ kind: 'mine', team: c.team, src: c, x: h.x, y: h.y, r: 11, arm: 0, life: 5, dmg: 4, t: 1, delay: 1, ...statusOf({ freeze: 1.2 }) });
  sim.step(null);
  assert.ok(h.frozenT > 0, 'the time mine froze him');
}
{
  const sim = room(['cultist']), c = find(sim, 'cultist')[0], h = sim.p;
  c.atk = c.specials.find(x => x.id === 'yellowsign'); sim.special(c);
  const sign = sim.hazards[sim.hazards.length - 1];
  sign.x = h.x; sign.y = h.y;
  for (let i = 0; i < 80; i++) sim.step(null);
  assert.ok(h.fearT > 0 || sim.done, 'the Yellow Sign brings fear');
}

// the Lake Hali Horror's tentacles rise at the rim of the stage
{
  const sim = room(['horror']), e = find(sim, 'horror')[0];
  e.atk = e.specials.find(x => x.id === 'edgetentacles'); sim.special(e);
  const t = sim.hazards.filter(h => h.variant === 'tentacle');
  assert.equal(t.length, 3);
  for (const h of t) assert.ok(Math.abs(Math.hypot(h.x, h.y) - (R - 8)) < 0.5, 'at the edge');
}

// the Outer Disciples fly their swords together; the Chronomancer hastens its allies
{
  const sim = room(['disciple', 'disciple']), [a, b] = find(sim, 'disciple');
  b.x = a.x + 10; b.y = a.y; b.state = 'idle'; b.cds.dswords = 0;
  a.atk = a.specials[0]; sim.special(a);
  assert.ok(b.state === 'wind' && b.atk.echo, 'the other follows');
}
{
  const sim = room(['chronomancer', 'bandit']), c = find(sim, 'chronomancer')[0], b = find(sim, 'bandit')[0];
  b.x = c.x + 10; b.y = c.y;
  const k0 = sim.speedFactor(b);
  c.atk = c.specials.find(x => x.id === 'haste'); sim.special(c);
  assert.ok(b.hasteT > 0 && sim.speedFactor(b) > k0, 'hastened');
}

// and every one of them survives real fights
let ran = 0;
for (const t of NEW) for (let s = 1; s <= 3; s++) {
  const sim = new Sim('room', s, { waves: [[t, t]], timeLimit: 30, fighter: HERO }), r = mulberry32(s);
  let a = null;
  for (let i = 0; !sim.done && i < 1900; i++) { if (i % 4 === 0) a = toSimAction(Math.floor(r() * 9), Math.floor(r() * 8)); sim.step(a); }
  for (const e of sim.enemies) assert.ok(Number.isFinite(e.hp) && Number.isFinite(e.x), t + ' broke');
  ran++;
}
console.log('World foes: ' + NEW.length + ' new foes, their mechanics, and ' + ran + ' fights passed.');
`, ctx);
