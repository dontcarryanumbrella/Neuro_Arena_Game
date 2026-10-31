// App wiring: one learning fighter, views, settings, chart, trials and saving.

const STORE_KEY = 'neuroArena.v6';
const $ = id => document.getElementById(id);

const REWARD_INFO = [
  ['dmgDealt', 'Damage dealt', -2, 5, 0.1],
  ['kills', 'Foe defeated', -20, 80, 1],
  ['ringOuts', 'Ring-out', -20, 80, 1],
  ['dmgTaken', 'Damage taken', -10, 2, 0.1],
  ['parries', 'Parry', -10, 40, 1],
  ['blocks', 'Block', -10, 10, 0.5],
  ['postureBreaks', 'Posture break', -10, 60, 1],
  ['stunned', 'Got stunned', -60, 0, 1],
  ['evades', 'Evade', -10, 20, 0.5],
  ['whiffs', 'Whiff', -5, 2, 0.1],
  ['fell', 'Fell off', -200, 0, 5],
  ['died', 'Died', -200, 0, 5],
  ['survival', 'Per second alive', -2, 5, 0.1],
];
const PRESETS = {
  Balanced: { ...DEFAULT_REWARDS },
  Aggressive: { ...DEFAULT_REWARDS, dmgDealt: 2, kills: 35, dmgTaken: -0.5, parries: 3 },
  Defensive: { ...DEFAULT_REWARDS, parries: 20, postureBreaks: 20, dmgTaken: -2.5, stunned: -25, blocks: 1 },
  'Ring-outs': { ...DEFAULT_REWARDS, ringOuts: 50, fell: -60 },
};

const state = {
  cfg: {
    fighter: { ...DEFAULT_FIGHTER },
    roster: ['bandit'], atOnce: 1, episode: 40,
    learning: { ...DEFAULT_LEARNING },
    learnAfter: 45, abilityMode: 'auto', manual: [null, null], sound: true, music: true,
    battle: {
      mode: 'teams', time: 120,
      slots: [
        { kind: 'ai', team: 0 }, { kind: 'samurai', team: 0 }, { kind: 'ninja', team: 1 }, { kind: 'bandit', team: 1 },
        { kind: 'empty', team: 0 }, { kind: 'empty', team: 1 }, { kind: 'empty', team: 0 }, { kind: 'empty', team: 1 },
        { kind: 'empty', team: 0 }, { kind: 'empty', team: 1 },
      ],
    },
  },
  mastery: {},          // seconds the hero has fought each foe type
  abStats: {},          // per ability: lives equipped, summed advantage, damage, uses
  loadout: [null, null], livesSincePick: 0, knownAtPick: 0, loadoutNote: '', abilitiesDirty: true,
  rewards: { ...DEFAULT_REWARDS },
  agent: null, trainer: null,
  lives: [],            // one record per life
  training: false, speed: 1, acc: 0,
  trials: {}, vault: [],
  jade: 0, talents: { owned: {}, equipped: [], pity: 0, spins: 0 }, killCounts: {},
  skins: { owned: { classic: 1 }, equipped: 'classic' },
  identity: freshIdentity(),
  campaign: freshCampaign(), // the jar: worlds, seals, finales and the run in progress
  rateLog: [],
  chartDirty: true, savedAtUpdate: 0, lastTrainSim: null,
  view: { mode: 'train', paused: false, sim: null, acc: 0, ticks: 0, action: null, endT: 0, overlay: null, trialId: null, sparType: null, recorded: false },
};

const DEFAULT_BATTLE = JSON.parse(JSON.stringify(state.cfg.battle));

// ---------- persistence ----------
// every foe the fighter (or its summons and allies) has felled, by kind, across training and the fights you watch or play
function countKills(sim, campaign) {
  for (const [t, n] of Object.entries(sim.stats.killsByType || {})) {
    state.killCounts[t] = (state.killCounts[t] || 0) + n;
    if (campaign) state.campaign.kills[t] = (state.campaign.kills[t] || 0) + n; // only the real thing feeds the Gu
  }
  state.killsDirty = true;
  if (campaign) refreshLevel(true);
}

// ---------- level: each different foe or boss felled in the worlds makes the fighter stronger, reaching the caps when all have fallen ----------
const LEVEL_TYPES = [...ROSTER, ...BOSSES];
const MAX_LEVEL = LEVEL_TYPES.length + 1;
const FIGHTER_CAP = { hp: 300, energy: 300, energyRegen: 30, posture: 250 };

function fighterAt(level) {
  const k = (level - 1) / (MAX_LEVEL - 1), f = {};
  for (const s in FIGHTER_CAP) {
    const step = s === 'energyRegen' ? 10 : 1; // regen to a tenth, the rest to whole points
    f[s] = Math.round((DEFAULT_FIGHTER[s] + (FIGHTER_CAP[s] - DEFAULT_FIGHTER[s]) * k) * step) / step;
  }
  return f;
}

function refreshLevel(announce) {
  const level = 1 + LEVEL_TYPES.filter(t => state.campaign.kills[t] > 0).length, was = state.level;
  state.level = level;
  state.cfg.fighter = fighterAt(level);
  if (announce && was && level > was) toast(`Level ${level}! Stronger from the next life.`);
  renderLevel();
}

// the Fighter page: its level and what that level gives it
function renderLevel() {
  const f = state.cfg.fighter, felled = state.level - 1, pct = (v, cap) => (v / cap * 100).toFixed(0) + '%';
  $('fLevel').textContent = state.level + (state.level === MAX_LEVEL ? ' (max)' : '');
  $('fLevelBar').style.width = pct(felled, LEVEL_TYPES.length);
  $('fLevelNote').textContent = `${felled} of ${LEVEL_TYPES.length} different foes and bosses felled in the worlds.` + (felled < LEVEL_TYPES.length ? ' Fell a new one there to level up.' : '');
  for (const [id, s, fmt] of [['fHp', 'hp', Math.round], ['fEnergy', 'energy', Math.round], ['fRegen', 'energyRegen', v => v.toFixed(1)], ['fPosture', 'posture', Math.round]]) {
    $(id + 'Val').textContent = `${fmt(f[s])} / ${FIGHTER_CAP[s]}`;
    $(id + 'Bar').style.width = pct(f[s], FIGHTER_CAP[s]);
  }
}

// the Kills page: bosses first, then foes and creatures, most-felled first
function renderKills() {
  if (!state.killsDirty && $('killList').childElementCount) return;
  state.killsDirty = false;
  const kc = state.killCounts, total = Object.values(kc).reduce((a, b) => a + b, 0);
  const finale = chosenFinale();
  const groups = [['Bosses', t => ENEMY_TYPES[t].boss], ['Foes', t => !ENEMY_TYPES[t].boss && !ENEMY_TYPES[t].summon], ['Summoned creatures', t => !ENEMY_TYPES[t].boss && ENEMY_TYPES[t].summon]];
  const wrap = $('killList'); wrap.innerHTML = '';
  $('killTotal').textContent = total ? `${total.toLocaleString()} felled in all` : 'Nothing felled yet.';
  for (const [title, inGroup] of groups) {
    const types = Object.keys(kc).filter(t => ENEMY_TYPES[t] && inGroup(t)).sort((a, b) => kc[b] - kc[a]);
    if (!types.length) continue;
    const top = kc[types[0]], h = document.createElement('h3'); h.className = 'kill-head'; h.textContent = title; wrap.appendChild(h);
    for (const t of types) {
      const row = document.createElement('div'); row.className = 'kill-row';
      try { row.appendChild(spriteIcon(t)); } catch (e) { row.appendChild(document.createElement('span')); }
      const name = document.createElement('span'); name.className = 'kill-name';
      name.textContent = ENEMY_TYPES[t].name + (finale === t ? ' · finale' : '');
      const bar = document.createElement('span'); bar.className = 'kill-bar'; bar.innerHTML = `<i style="width:${Math.max(3, kc[t] / top * 100).toFixed(0)}%"></i>`;
      const n = document.createElement('b'); n.textContent = kc[t].toLocaleString();
      row.append(name, bar, n); wrap.appendChild(row);
    }
  }
}

function freshIdentity() {
  return { traits: Object.fromEntries(TRAITS.map(t => [t, 0])), lives: 0, awaken: null, special: null,
    stage: 1, lands: 0, synthLands: 0, stableLives: 0, bossKills: {}, decay: 0, pair: null };
}

// everything about the fighter besides its brain: what it has learned, its loadout, identity, talents, jade and skins
const profile = () => ({ mastery: state.mastery, abStats: state.abStats, loadout: state.loadout, manual: state.cfg.manual, abilityMode: state.cfg.abilityMode,
  jade: state.jade, talents: state.talents, identity: state.identity, skins: state.skins, livesTotal: state.livesTotal, killCounts: state.killCounts, campaign: state.campaign });

// take a profile in (from the browser's save or a file), keeping only what this version of the game still has
function applyProfile(saved) {
  state.mastery = saved.mastery || {};
  state.abStats = saved.abStats || {};
  state.loadout = (saved.loadout || [null, null]).map(t => HERO_ABILITIES[t] ? t : null);
  if (saved.manual) state.cfg.manual = saved.manual;
  if (saved.abilityMode === 'auto' || saved.abilityMode === 'manual') state.cfg.abilityMode = saved.abilityMode;
  state.cfg.manual = (state.cfg.manual || [null, null]).map(t => HERO_ABILITIES[t] ? t : null);
  state.jade = saved.jade || 0;
  state.killCounts = Object.fromEntries(Object.entries(saved.killCounts || {}).filter(([t, n]) => ENEMY_TYPES[t] && n > 0));
  state.campaign = loadCampaign(saved.campaign, state.killCounts);
  state.codexDirty = true;
  refreshLevel(false); // a different fighter: its level comes from its own record
  state.identity = freshIdentity();
  if (saved.identity && saved.identity.traits) {
    const si = saved.identity;
    state.identity = { traits: Object.fromEntries(TRAITS.map(t => [t, +si.traits[t] || 0])), lives: si.lives || 0,
      awaken: AWAKENINGS[si.awaken] ? si.awaken : null, special: si.special && HERO_ABILITIES[si.special.primary] && HERO_ABILITIES[si.special.secondary] ? si.special : null,
      stage: Math.min(4, Math.max(1, si.stage || 1)), lands: si.lands || 0, synthLands: si.synthLands || 0, stableLives: si.stableLives || 0,
      bossKills: si.bossKills || {}, decay: si.decay || 0, pair: si.pair && si.pair.every(t => HERO_ABILITIES[t]) ? si.pair : null, lastAwaken: si.lastAwaken || null };
  }
  if (state.identity.special && state.identity.special.stage >= 4) state.identity.special.finale = chosenFinale(); // finales now come from the worlds
  const sk = saved.skins || {};
  state.skins = { owned: { classic: 1, ...Object.fromEntries(Object.keys(sk.owned || {}).filter(id => SKIN_BY_ID[id]).map(id => [id, 1])) }, equipped: SKIN_BY_ID[sk.equipped] && (sk.owned || {})[sk.equipped] ? sk.equipped : 'classic' };
  const st = saved.talents || {};
  state.talents = {
    owned: Object.fromEntries(Object.keys(st.owned || {}).filter(id => TALENT_BY_ID[id]).map(id => [id, 1])),
    equipped: (st.equipped || []).filter(id => TALENT_BY_ID[id]).reduce((eq, id) => (fitsSlots(id, eq) ? eq.concat(id) : eq), []), pity: st.pity || 0, spins: st.spins || 0,
  };
}
const packLife = l => [l.ret, l.kills, l.parries, l.breaks, l.dmgTaken, l.t, l.died].map(x => Math.round(x * 10) / 10);
const unpackLife = a => ({ ret: a[0], kills: a[1], parries: a[2], breaks: a[3], dmgTaken: a[4], t: a[5], died: a[6] });

function saveStore() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      cfg: state.cfg, rewards: state.rewards, agent: state.agent.toJSON(),
      lives: state.lives.slice(-3000).map(packLife), livesTotal: state.livesTotal,
      trials: state.trials, vault: state.vault,
      mastery: state.mastery, abStats: state.abStats, loadout: state.loadout,
      jade: state.jade, talents: state.talents, identity: state.identity, skins: state.skins, killCounts: state.killCounts, campaign: state.campaign,
    }));
  } catch (e) { /* storage unavailable or full: learning still works */ }
}

function loadStore() {
  try { const raw = localStorage.getItem(STORE_KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
}

function validAgentJSON(o) {
  if (!o || !o.actor || !o.critic) return false;
  const s = o.actor.sizes;
  return s[0] === N_INPUTS && s[s.length - 1] === N_MOVE + N_ACT && o.critic.sizes[0] === N_INPUTS;
}

function toast(text) {
  const el = document.createElement('div');
  el.className = 'toast'; el.textContent = text;
  $('toasts').appendChild(el);
  setTimeout(() => el.classList.add('out'), 2200);
  setTimeout(() => el.remove(), 2700);
}

// ---------- the learner ----------
let simSeed = Math.floor(Math.random() * 1e9);
const showingTraining = () => state.view.mode === 'train' && state.speed !== 'max';

function makeTrainingSim() {
  const c = state.cfg;
  return new Sim('custom', simSeed++, { visual: showingTraining(), timeLimit: c.episode, roster: c.roster, atOnce: c.atOnce, fighter: c.fighter, loadout: pickLoadout(), talents: state.talents.equipped, identity: identityOpts(), skin: state.skins.equipped });
}

// ---------- learning foes' abilities ----------
// The Sword Immortal's manual is learned sword by sword: each one takes another half of the usual time fighting him,
// and the one before it has to have been used (3 times) first. The Thirteenth Sword is forbidden.
const MANUAL_STEP = 0.5, MANUAL_PRACTICE = 3;
function abProgress(t) {
  const ab = HERO_ABILITIES[t];
  if (!ab.manual) return { m: state.mastery[t] || 0, need: state.cfg.learnAfter, ok: true };
  const prev = ab.manual > 1 ? 'sword' + (ab.manual - 1) : null;
  const ok = !prev || (isLearned(prev) && ((state.abStats[prev] || {}).uses || 0) >= MANUAL_PRACTICE);
  return { m: state.mastery[ab.foe] || 0, need: state.cfg.learnAfter * MANUAL_STEP * ab.manual, ok, prev };
}
function isLearned(t) { const p = abProgress(t); return p.ok && p.m >= p.need; }
const learned = () => Object.keys(HERO_ABILITIES).filter(isLearned);
// the foe an ability came from (the manual's swords all come from the Sword Immortal)
const abFoe = t => ENEMY_TYPES[(HERO_ABILITIES[t] && HERO_ABILITIES[t].foe) || t];

// Fighting a foe long enough teaches the hero its ability.
function addExposure(sim) {
  const before = new Set(learned());
  for (const [type, secs] of Object.entries(sim.exposure)) {
    if (!HERO_ABILITIES[type] && !(ENEMY_TYPES[type] && ENEMY_TYPES[type].manual)) continue;
    state.mastery[type] = (state.mastery[type] || 0) + secs;
  }
  for (const t of learned()) if (!before.has(t)) { toast(`Learned ${HERO_ABILITIES[t].name} from the ${abFoe(t).name}`); sfx.play('learn'); }
  state.abilitiesDirty = true;
}

// How each equipped ability did this life, measured against the recent average life.
function scoreLoadout(sim, ret) {
  const recent = state.lives.slice(-25);
  const base = recent.length ? recent.reduce((a, l) => a + l.ret, 0) / recent.length : ret;
  for (const type of sim.p.abilities.filter(Boolean).map(a => a.from)) {
    const st = state.abStats[type] || (state.abStats[type] = { n: 0, adv: 0, dmg: 0, uses: 0 });
    st.n++; st.adv += ret - base;
    st.dmg += sim.stats.abilDmg[type] || 0; st.uses += sim.stats.abilUses[type] || 0;
  }
}

// Auto mode: every few lives, keep what works and try what has not been tried (UCB).
function pickLoadout() {
  const known = learned();
  if (state.cfg.abilityMode === 'manual') {
    state.loadout = state.cfg.manual.map(t => known.includes(t) ? t : null);
    state.loadoutNote = '';
    return state.loadout;
  }
  const stale = state.loadout.some(t => t && !known.includes(t));
  if (!stale && state.livesSincePick < 3 && known.length === state.knownAtPick) { state.livesSincePick++; return state.loadout; }
  state.livesSincePick = 1; state.knownAtPick = known.length;
  const rets = state.lives.slice(-50).map(l => l.ret);
  const mean = rets.reduce((a, b) => a + b, 0) / (rets.length || 1);
  const spread = Math.sqrt(rets.reduce((a, b) => a + (b - mean) ** 2, 0) / (rets.length || 1)) || 20;
  const total = known.reduce((a, t) => a + ((state.abStats[t] || {}).n || 0), 0);
  const score = t => {
    const st = state.abStats[t];
    if (!st || !st.n) return Infinity;
    return st.adv / st.n + 0.5 * spread * Math.sqrt(Math.log(total + 1) / st.n);
  };
  const ranked = known.map(t => [t, score(t)]).sort((a, b) => b[1] - a[1]);
  state.loadout = [ranked[0] ? ranked[0][0] : null, ranked[1] ? ranked[1][0] : null];
  state.loadoutNote = state.loadout.filter(Boolean).map(t => {
    const st = state.abStats[t];
    return `${HERO_ABILITIES[t].name} (${!st || !st.n ? 'trying it out' : (st.adv / st.n >= 0 ? '+' : '') + (st.adv / st.n).toFixed(0) + ' vs average'})`;
  }).join(', ');
  state.abilitiesDirty = true;
  return state.loadout;
}

function onLife(sim, ret) {
  const s = sim.stats;
  addExposure(sim);
  scoreLoadout(sim, ret);
  state.lives.push({ ret, kills: s.kills, parries: s.parries, breaks: s.postureBreaks, dmgTaken: s.dmgTaken, t: sim.t, died: s.died });
  if (state.lives.length > 5000) state.lives.splice(0, state.lives.length - 5000);
  state.livesTotal = (state.livesTotal || 0) + 1;
  state.chartDirty = true;
  state.jade += s.bounty * TRAIN_JADE;
  countKills(sim);
  updateIdentity(sim);
}

// ---------- identity: traits drift with every life; an awakening and a special grow out of them ----------
const AWAKEN_AFTER = 20;
const clamp100 = v => Math.max(0, Math.min(100, v));

function lifeTraits(s) {
  const t = Math.max(5, s.time), atks = s.strikes + s.heavies;
  const uses = Object.values(s.abilUses).reduce((a, b) => a + b, 0);
  return {
    aggression: clamp100((s.strikes + s.heavies * 1.5 + s.kicks) / t / 1.2 * 100),
    defense: clamp100((s.blocks + s.parries * 3) / t / 0.5 * 100 + s.guardT / t * 60),
    mobility: clamp100(s.dist / t / 45 * 70 + s.rolls / t / 0.4 * 30),
    precision: clamp100((s.parries * 2 + s.postureBreaks * 3 + s.kills) / Math.max(1, atks) * 150),
    endurance: clamp100(s.lowHpT / t * 150 + s.dmgTaken / t * 4),
    versatility: clamp100(Object.keys(s.abilUses).length * 30 + uses / t * 60),
  };
}

function updateIdentity(sim) {
  const id = state.identity, now = lifeTraits(sim.stats);
  id.lives++;
  const a = Math.max(0.04, 1 / id.lives); // settles slowly: a few odd lives can't change who it is
  for (const k of TRAITS) id.traits[k] += (now[k] - id.traits[k]) * a;
  if (id.lives < AWAKEN_AFTER) return;
  // awakening: the strongest trait, unless the current one is still close
  const top = TRAITS.reduce((b, k) => (id.traits[k] > id.traits[b] ? k : b), TRAITS[0]);
  if (!id.awaken) { id.awaken = top; toast(`Awakening unlocked: ${AWAKENINGS[top].name}`); }
  else if (top !== id.awaken && id.traits[top] > id.traits[id.awaken] + 8) { id.awaken = top; toast(`Its fighting changed. New awakening: ${AWAKENINGS[top].name}`); }
  // special: its two most-used learned abilities (kept unless they fall out of its top three)
  const s = sim.stats;
  id.lands += s.specialLands || 0; id.synthLands += s.synthLands || 0;
  for (const [b, n] of Object.entries(s.bossKills || {})) id.bossKills[b] = (id.bossKills[b] || 0) + n;
  id.stableLives = id.lastAwaken === id.awaken ? id.stableLives + 1 : 0; id.lastAwaken = id.awaken;
  const known = knownByUse(), equipped = equippedPair();
  if (!equipped && known.length < 2) return;
  const had = id.special;
  id.pair = equipped || (id.pair && known.slice(0, 3).includes(id.pair[0]) && known.slice(0, 3).includes(id.pair[1]) ? id.pair : [known[0], known[1]]); // the two it carries; its favourites only when it carries fewer
  // its stage: climbs one step at a time, and slips back only after a long while out of shape
  const want = stageReach(id, known);
  if (want > id.stage) { id.stage++; id.decay = 0; toast(`Ultimate evolved: ${STAGE_NAMES[id.stage - 1]}`); }
  else if (want < id.stage) { if (++id.decay >= 50) { id.stage--; id.decay = 0; toast(`Ultimate fell back to ${STAGE_NAMES[id.stage - 1]}`); } }
  else id.decay = 0;
  id.special = buildSpecial(id, known);
  if (!had) toast('Ultimate Special forged: ' + id.special.name);
  else if (had.name !== id.special.name && had.stage === id.special.stage) toast('Its special changed: ' + id.special.name);
}

// its learned abilities, most used first
const knownByUse = () => learned().filter(t => (state.abStats[t] || {}).uses >= 3).sort((x, y) => state.abStats[y].uses - state.abStats[x].uses);
// the two abilities it has equipped, when both slots hold something it knows
function equippedPair() {
  const known = learned(), eq = state.loadout.filter(t => t && known.includes(t));
  return eq.length === 2 ? eq : null;
}
// re-forge the special straight away when the equipped abilities change (it already has one)
function reforgeSpecial() {
  const id = state.identity, pair = equippedPair();
  if (!id.awaken || !id.special || !pair || (id.pair && pair[0] === id.pair[0] && pair[1] === id.pair[1])) return;
  id.pair = pair; id.special = buildSpecial(id, knownByUse());
  toast('Its special changed: ' + id.special.name);
}

// ---------- the special's four stages ----------
const STAGE_NAMES = ['Manifestation', 'Specialization', 'Synthesis', 'Transcendence'];
const STAGE_RULES = { lands2: 10, lives3: 150, lives4: 400, stable4: 150, synth4: 25 };
const roleOf = t => abFoe(t) && abFoe(t).role;

// a third tradition: its most-used learned ability from a role the other two don't share
function thirdOf(id, known) {
  const [a, b] = id.pair;
  if (roleOf(a) === roleOf(b)) return null;
  return known.find(t => t !== a && t !== b && (state.abStats[t] || {}).uses >= 5 && roleOf(t) !== roleOf(a) && roleOf(t) !== roleOf(b)) || null;
}

function stageChecks(id, known) {
  const third = thirdOf(id, known);
  return {
    2: [[`Special landed ${Math.min(id.lands, STAGE_RULES.lands2)}/${STAGE_RULES.lands2} times`, id.lands >= STAGE_RULES.lands2]],
    3: [[`${Math.min(id.lives, STAGE_RULES.lives3)}/${STAGE_RULES.lives3} lives`, id.lives >= STAGE_RULES.lives3],
        [third ? `Third tradition: ${abFoe(third).name}` : 'A third learned ability from a different role (5+ uses), and its two favourites from different roles', !!third]],
    4: [[`${Math.min(id.lives, STAGE_RULES.lives4)}/${STAGE_RULES.lives4} lives`, id.lives >= STAGE_RULES.lives4],
        [`Same awakening for ${Math.min(id.stableLives, STAGE_RULES.stable4)}/${STAGE_RULES.stable4} lives`, id.stableLives >= STAGE_RULES.stable4],
        [`Synthesized special landed ${Math.min(id.synthLands, STAGE_RULES.synth4)}/${STAGE_RULES.synth4} times`, id.synthLands >= STAGE_RULES.synth4]],
  };
}

function stageReach(id, known) {
  const c = stageChecks(id, known);
  let n = 1;
  for (const k of [2, 3, 4]) { if (c[k].every(x => x[1])) n = k; else break; }
  return n;
}

const SECOND_MOD = { aggression: 'extraCast', defense: 'lifesteal', mobility: 'blinkAll', precision: 'crit', endurance: 'tough', versatility: 'thirdCast' };
const TALENT_MOD = { phoenix: 'phoenixFin', dragonbreath: 'breath', thunderpalm: 'thunder', swordheart: 'qi', voidwalk: 'phase',
  shapeshift: 'beast', kaioken: 'kaioken', starplatinum: 'ora', zawarudo: 'timestop', shadowclone: 'clones', avatar: 'elements', onepunch: 'serious', armament: 'haki', sharingan: 'copy', berserkarmor: 'berserk' };
const MOD_TEXT = { extraCast: 'one more cast', lifesteal: 'heals 30% of its damage', blinkAll: 'blinks before every cast', crit: 'every cast hits 40% harder',
  tough: 'takes 75% less damage while casting', thirdCast: 'adds another learned ability', phoenixFin: 'finisher heals', breath: 'fire breath on every cast',
  thunder: 'golden lightning on every cast', qi: 'sword qi on every cast', phase: 'untouchable while casting',
  beast: 'cast in a beast\'s skin, a claw after every cast', kaioken: 'Kaioken: every cast hits 30% harder, for 5% health', ora: 'a phantom barrage after every cast',
  timestop: 'opens by stopping time', clones: 'two shadow clones join in', elements: 'an element after every cast', serious: 'the finisher is a serious punch',
  haki: 'every cast is true damage', copy: 'copies the target\'s own techniques', berserk: 'heals 50% of its damage, takes 75% less' };
const FUSION_TEXT = { blinkshots: 'fires from every blink', landseals: 'seals open where it lands', firewell: 'fire drags into a gravity well', weave: 'the third tradition answers every cast' };
const TITLE_NOUN = { aggression: 'Warlord', defense: 'Sage', mobility: 'Wind', precision: 'Hawk', endurance: 'Bastion', versatility: 'Myriad' };

function buildSpecial(id, known) {
  const [p1, p2] = id.pair, A = AWAKENINGS[id.awaken], stage = id.stage;
  const sp = makeSpecial(id.awaken, p1, p2);
  sp.stage = stage;
  const second = TRAITS.filter(t => t !== id.awaken).reduce((b, k) => (id.traits[k] > id.traits[b] ? k : b), TRAITS.find(t => t !== id.awaken));
  sp.mods = [SECOND_MOD[second], ...state.talents.equipped.map(t => TALENT_MOD[t]).filter(Boolean)];
  sp.extra = known.find(t => t !== p1 && t !== p2) || null;
  const third = stage >= 3 ? thirdOf(id, known) : null;
  if (third) {
    sp.third = third;
    const kinds = [p1, p2, third].map(t => HERO_ABILITIES[t].atk.kind), has = k => kinds.includes(k), dash = kinds.some(k => ['pounce', 'leap', 'melee', 'vanish', 'flurry'].includes(k));
    sp.fusion = [];
    if (has('shoot') && dash) sp.fusion.push('blinkshots');
    if (has('sigil') && dash) sp.fusion.push('landseals');
    if (has('cone') && (has('vortex') || has('sigil'))) sp.fusion.push('firewell');
    sp.fusion.push('weave');
    const cap = w => w.charAt(0).toUpperCase() + w.slice(1);
    sp.name = `${A.prefix} ${cap(HERO_ABILITIES[p1].atk.id)}-${cap(HERO_ABILITIES[third].atk.id)} ${SPECIAL_SUFFIX[HERO_ABILITIES[p2].atk.kind] || 'Art'}`;
  }
  if (stage >= 4) {
    sp.finale = chosenFinale(); // unlocked by a boss's first defeat in the worlds, chosen at the Tally Wall
    sp.title = `the ${A.prefix} ${TITLE_NOUN[id.awaken]}`;
    sp.name = `${A.prefix} Domain: ${sp.name.split(' ').slice(1).join(' ')}`;
  }
  return sp;
}

const identityOpts = () => ({ awaken: state.identity.awaken, special: state.identity.special });

function renderIdentity() {
  const id = state.identity, top = TRAITS.reduce((b, k) => (id.traits[k] > id.traits[b] ? k : b), TRAITS[0]);
  $('traitBars').innerHTML = TRAITS.map(k => {
    const v = id.traits[k], c = AWAKENINGS[k].color;
    return `<div class="trait${k === top && id.lives ? ' top' : ''}"><span>${k[0].toUpperCase() + k.slice(1)}</span><div class="track"><div class="fill" style="width:${v.toFixed(0)}%;background:${c}"></div></div><span class="v">${v.toFixed(0)}</span></div>`;
  }).join('');
  const A = id.awaken && AWAKENINGS[id.awaken], ac = $('awakenCard');
  ac.className = 'id-card' + (A ? '' : ' locked'); ac.style.borderLeftColor = A ? A.color : '';
  ac.innerHTML = A ? `<div class="k">Awakening</div><div class="n" style="color:${A.color === '#c8ccd2' || A.color === '#bfffd8' ? '#555' : A.color}">${A.name}</div>${A.desc}. Lasts 8s when its gauge fills.`
    : `<div class="k">Awakening</div><div class="n">Locked</div>Appears after ${AWAKEN_AFTER} lives (${Math.min(id.lives, AWAKEN_AFTER)}/${AWAKEN_AFTER}).`;
  const S = id.special, sc = $('specialCard');
  sc.className = 'id-card' + (S ? '' : ' locked'); sc.style.borderLeftColor = S && A ? A.color : '';
  if (S) {
    const stage = S.stage || 1, fin = { nova: 'crimson blast', tide: 'healing tide (answers what it soaked)', blitz: 'four-hit blitz', pierce: 'piercing shot', bulwark: 'iron shockwave', myriad: 'every equipped ability at once' }[AWAKENINGS[S.awaken].finisher];
    const rhythm = { aggression: 'a fast flurry', defense: 'a stance that soaks blows, then answers', mobility: 'blinking round the target', precision: 'a charge, then one perfect cut', endurance: 'slow casts and shockwaves', versatility: 'every form in turn' }[S.awaken];
    const chips = [S.primary, S.secondary, stage >= 3 && S.third].filter(Boolean).map(t => `<span>${abFoe(t).name}: ${HERO_ABILITIES[t].atk.id}</span>`);
    if (stage >= 2) chips.push(...(S.mods || []).map(m => `<span style="background:#eef6ff">${MOD_TEXT[m]}</span>`));
    if (stage >= 3) chips.push(...(S.fusion || []).map(f => `<span style="background:#f4ecff">${FUSION_TEXT[f]}</span>`));
    if (stage >= 4) chips.push(`<span style="background:#fff4d6">finale: ${S.finale ? ENEMY_TYPES[S.finale].name + "'s power" : 'one enormous blast'}</span>`);
    chips.push(`<span>${fin}</span>`);
    const checks = stage < 4 ? stageChecks(id, learned().filter(t => (state.abStats[t] || {}).uses >= 3).sort((x, y) => state.abStats[y].uses - state.abStats[x].uses))[stage + 1] : null;
    sc.innerHTML = `<div class="k">Ultimate Special · stage ${stage} · ${STAGE_NAMES[stage - 1]}</div>${S.title ? `<div class="k" style="color:${A.color}">${S.title}</div>` : ''}<div class="n">${S.name}</div>
      Plays out as ${rhythm}; only while awakened.
      <div class="recipe">${chips.join('')}</div>
      ${checks ? `<div class="k" style="margin-top:8px">Next: ${STAGE_NAMES[stage]}</div>` + checks.map(([t, ok]) => `<div class="mini" style="margin:1px 0;color:${ok ? 'var(--accent)' : 'var(--muted)'}">${ok ? '✓' : '○'} ${t}</div>`).join('') : ''}`;
  } else sc.innerHTML = `<div class="k">Ultimate Special</div><div class="n">Locked</div>${A ? 'Needs two learned abilities it actually uses (3+ uses each).' : 'Needs an awakening first.'}`;
  renderFinales();
}

// the finales unlocked by bosses felled in the worlds; the special ends with the one you pick (from Transcendence)
function renderFinales() {
  const c = state.campaign, fc = $('finaleCard'), pick = chosenFinale();
  if (fc.dataset.key === c.finales.join() + '|' + pick) return; // unchanged: keep the buttons under the pointer
  fc.dataset.key = c.finales.join() + '|' + pick;
  fc.className = 'id-card' + (c.finales.length ? '' : ' locked');
  if (!c.finales.length) { fc.innerHTML = '<div class="k">Transcendence finale</div><div class="n">None yet</div>Each boss you defeat in the worlds for the first time unlocks its finale.'; return; }
  fc.innerHTML = `<div class="k">Transcendence finale</div><div class="n">${ENEMY_TYPES[pick].name}'s power</div><div class="mini">Pick the finale its special ends with at Transcendence.</div><div class="finales">` +
    c.finales.map(b => `<button data-b="${b}" class="${b === pick ? 'on' : ''}">${ENEMY_TYPES[b].name}</button>`).join('') + '</div>';
  fc.querySelectorAll('button').forEach(btn => btn.onclick = () => {
    c.finaleChoice = btn.dataset.b;
    const id = state.identity;
    if (id.special && id.special.stage >= 4) id.special.finale = chosenFinale();
    saveStore(); renderFinales(); state.killsDirty = true;
  });
}

function setAgent(agent) {
  state.agent = agent;
  state.trainer = new Trainer(agent, makeTrainingSim, () => state.rewards, onLife);
  state.savedAtUpdate = agent.updates;
}

function setTraining(on) {
  state.training = on;
  const b = $('trainBtn');
  b.classList.toggle('running', on);
  b.textContent = on ? 'Pause training' : 'Start training';
  state.acc = 0;
  refreshHint();
}

function runTraining(dt, now) {
  const tr = state.trainer, agent = state.agent;
  // apply a new batch size once no update is in flight
  if (!tr.updating && agent.buf.rew.length !== agent.cfg.rollout) agent.allocBuffer();
  if (showingTraining()) {
    if (state.view.paused) return;
    // real time (times the speed): one decision per 4 sim ticks
    const per = DT * ACTION_REPEAT;
    state.acc = Math.min(state.acc + dt * state.speed, per * 8);
    while (state.acc >= per && performance.now() - now < 14) {
      if (tr.tick() === 'step') state.acc -= per;
    }
  } else {
    const budget = state.speed === 'max' ? (state.view.mode === 'train' ? 34 : 20) : 8;
    do tr.tick(); while (performance.now() - now < budget);
  }
  state.rateLog.push([now, agent.steps]);
  while (state.rateLog.length && now - state.rateLog[0][0] > 2000) state.rateLog.shift();
  if (agent.updates - state.savedAtUpdate >= 5) { state.savedAtUpdate = agent.updates; saveStore(); }
}

function decisionsPerSec() {
  const r = state.rateLog;
  if (r.length < 2) return 0;
  return (r[r.length - 1][1] - r[0][1]) / ((r[r.length - 1][0] - r[0][0]) / 1000 || 1);
}

// ---------- other views ----------
const renderer = new Renderer($('game'));
const keys = new Set();

function newViewSim() {
  const v = state.view, c = state.cfg;
  const seed = Math.floor(Math.random() * 1e9);
  const loadout = state.loadout, talents = state.talents.equipped, identity = identityOpts();
  if (v.mode === 'battle' && v.online) v.sim = buildOnlineSim(v.online); // an online match: the same battle on both screens
  else if (v.mode === 'battle') v.sim = new Sim('battle', seed, { visual: true, battle: battleConfig(), fighter: c.fighter, loadout, talents, identity, skin: state.skins.equipped });
  else if (v.mode === 'trial') v.sim = new Sim(v.trialId, seed, { visual: true, fighter: c.fighter, loadout, talents, identity, skin: state.skins.equipped });
  else if (v.mode === 'campaign' && curRoom()) {
    const room = curRoom();
    v.sim = new Sim('room', seed, { visual: true, waves: [room.foes], timeLimit: room.time, fighter: c.fighter, loadout, talents, identity, skin: state.skins.equipped });
  }
  else if (v.mode === 'spar') v.sim = new Sim('custom', seed, { visual: true, timeLimit: 60, roster: [v.sparType], atOnce: 1, fighter: c.fighter, loadout, talents, identity, skin: state.skins.equipped });
  else v.sim = new Sim('custom', seed, { visual: true, timeLimit: c.episode, roster: c.roster, atOnce: c.atOnce, fighter: c.fighter, loadout, talents, identity, skin: state.skins.equipped });
  v.acc = 0; v.ticks = 0; v.action = null; v.endT = 0; v.overlay = null; v.recorded = false; v.paid = false; v.roomResult = null;
  v.introT = v.mode === 'campaign' && curRoom() ? meetFoes(curRoom()) : 0;
  renderer.reset();
}

// [moveX, moveY, strike, heavy, guard, kick, roll, ability1, ability2]
function keyAction() {
  const k = c => keys.has(c), b = x => x ? 1 : -1;
  return [
    (k('KeyD') || k('ArrowRight') ? 1 : 0) - (k('KeyA') || k('ArrowLeft') ? 1 : 0),
    (k('KeyS') || k('ArrowDown') ? 1 : 0) - (k('KeyW') || k('ArrowUp') ? 1 : 0),
    b(k('KeyJ')), b(k('KeyK')), b(k('Space')), b(k('KeyL')), b(k('ShiftLeft') || k('ShiftRight')), b(k('KeyQ')), b(k('KeyE')),
  ];
}

// ---------- battle mode ----------
const teamName = t => 'TEAM ' + (t + 1);

function battleConfig() {
  const b = state.cfg.battle;
  return { timeLimit: b.time, slots: b.slots.map((sl, i) => ({ kind: sl.kind, team: b.mode === 'ffa' ? i : sl.team })) };
}

function battleOverlay(sim) {
  const all = sim.roster;
  const mvp = all.slice().sort((a, b) => b.kills - a.kills || b.dmgOut - a.dmgOut)[0];
  const winners = all.filter(f => f.team === sim.winner);
  const ffa = state.cfg.battle.mode === 'ffa';
  const title = sim.winner == null ? 'DRAW' : ffa ? (winners[0] ? winners[0].label.toUpperCase() : 'WINNER') + ' WINS' : teamName(sim.winner) + ' WINS';
  return {
    title: title.length > 15 ? title.slice(0, 15) : title, color: TEAM_COLORS[sim.winner] || '#ece4d2',
    sub: sim.stats.result === 'time' ? 'TIME UP: MOST HEALTH LEFT' : '',
    sub2: mvp ? `MVP ${mvp.label.toUpperCase()} K${mvp.kills}` : '', sub3: 'R: REMATCH',
  };
}

function stepBattle() {
  const v = state.view, sim = v.sim;
  const think = v.ticks++ % ACTION_REPEAT === 0;
  for (const h of sim.heroes) {
    if (h.dead) continue;
    if (h.controller === 'key') h.action = keyAction();
    else if (think) { const a = (h.brain || state.agent).act(sim.sense(h), false); h.action = toSimAction(a.move, a.act); } // online, each fighter thinks with its own brain
  }
  sim.step(null);
}

function fighterOptions() {
  let html = '<option value="empty">(empty)</option><option value="ai">Your AI fighter</option><option value="you">You (keyboard)</option>';
  for (const role of ROLE_ORDER) {
    html += `<optgroup label="${ROLES[role].name}">` + ROSTER.filter(t => ENEMY_TYPES[t].role === role).map(t => `<option value="${t}">${ENEMY_TYPES[t].name}</option>`).join('') + '</optgroup>';
  }
  html += '<optgroup label="Bosses">' + BOSSES.map(t => `<option value="${t}">${ENEMY_TYPES[t].name}</option>`).join('') + '</optgroup>';
  html += '<optgroup label="Beasts">' + ['tiger', 'bear', 'bunny'].map(t => `<option value="${t}">${ENEMY_TYPES[t].name}</option>`).join('') + '</optgroup>';
  return html;
}

const BATTLE_PRESETS = {
  '1v1': ['ai', 'samurai'],
  '2v2': ['ai', 'paladin', 'ninja', 'gunslinger'],
  '5v5': ['ai', 'samurai', 'paladin', 'gunslinger', 'druid', 'berserker', 'ninja', 'spearmaster', 'sniper', 'necromancer'],
  'Bosses': ['warlord', 'swordsaint', 'abbot', 'vampirelord', 'deadeye', 'lich', 'emperor', 'timeadmin', 'unknown', 'gojo'],
};

function buildBattle() {
  const b = state.cfg.battle;
  document.querySelectorAll('#battleMode button').forEach(btn => {
    btn.classList.toggle('on', btn.dataset.mode === b.mode);
    btn.onclick = () => { b.mode = btn.dataset.mode; buildBattle(); saveStore(); };
  });
  const pre = $('battlePresets');
  pre.innerHTML = '';
  for (const [name, kinds] of Object.entries(BATTLE_PRESETS)) {
    const btn = document.createElement('button');
    btn.textContent = name;
    btn.onclick = () => {
      // fill slots in order; in team mode split them into two halves
      b.slots = Array.from({ length: 10 }, (_, i) => ({ kind: kinds[i] || 'empty', team: i < Math.ceil(kinds.length / 2) ? 0 : 1 }));
      if (name === 'Bosses') { b.mode = 'ffa'; }
      buildBattle(); saveStore();
    };
    pre.appendChild(btn);
  }
  const clear = document.createElement('button');
  clear.textContent = 'Clear';
  clear.onclick = () => { b.slots = b.slots.map(sl => ({ ...sl, kind: 'empty' })); buildBattle(); saveStore(); };
  pre.appendChild(clear);

  const wrap = $('battleSlots');
  wrap.innerHTML = '';
  const opts = fighterOptions();
  b.slots.forEach((sl, i) => {
    const row = document.createElement('div');
    row.className = 'slot-row';
    const team = b.mode === 'ffa' ? i : sl.team;
    row.innerHTML = `<span class="slot-dot" style="background:${sl.kind === 'empty' ? 'transparent' : TEAM_COLORS[team]}"></span><span class="slot-n">${i + 1}</span>` +
      `<select class="slot-kind" aria-label="Fighter ${i + 1}">${opts}</select>` +
      (b.mode === 'teams' ? `<select class="slot-team" aria-label="Team for fighter ${i + 1}">${[0, 1, 2, 3, 4].map(t => `<option value="${t}">Team ${t + 1}</option>`).join('')}</select>` : '');
    const kind = row.querySelector('.slot-kind');
    kind.value = sl.kind;
    kind.onchange = () => {
      // only one fighter can be on the keyboard
      if (kind.value === 'you') b.slots.forEach(o => { if (o.kind === 'you') o.kind = 'ai'; });
      sl.kind = kind.value; buildBattle(); saveStore();
    };
    const tsel = row.querySelector('.slot-team');
    if (tsel) { tsel.value = sl.team; tsel.onchange = () => { sl.team = +tsel.value; buildBattle(); saveStore(); }; }
    wrap.appendChild(row);
  });
  const n = b.slots.filter(sl => sl.kind !== 'empty').length;
  const teams = new Set(b.slots.map((sl, i) => sl.kind === 'empty' ? null : b.mode === 'ffa' ? i : sl.team).filter(t => t !== null)).size;
  $('battleStart').disabled = n < 2 || teams < 2;
  $('battleNote').textContent = n < 2 ? 'Add at least two fighters.' : teams < 2 ? 'Put fighters on at least two teams.' : `${n} fighters, ${teams} ${b.mode === 'ffa' ? 'in a free-for-all' : 'teams'}.`;
}

function renderBoard() {
  const sim = state.view.sim;
  if (!sim || !sim.battle) { $('battleBoard').hidden = true; return; }
  $('battleBoard').hidden = false;
  const rows = sim.roster.slice().sort((a, b) => a.team - b.team || a.slot - b.slot);
  $('battleBoard').innerHTML = '<div class="board-row head"><span></span><span>Fighter</span><span>HP</span><span>K</span><span>Dmg</span></div>' + rows.map(f =>
    `<div class="board-row${f.dead ? ' out' : ''}"><span class="slot-dot" style="background:${TEAM_COLORS[f.team]}"></span><span>${f.label}</span>` +
    `<span>${f.dead ? 'out' : `<i class="hpbar"><b style="width:${Math.round(100 * f.hp / f.maxHp)}%"></b></i>`}</span><span>${f.kills}</span><span>${Math.round(f.dmgOut)}</span></div>`).join('');
}

// ---------- the jar: runs through its worlds ----------
// a saved campaign, keeping only what this version still has; an older save starts one, with everything it felled already met
function loadCampaign(saved, killCounts) {
  const c = freshCampaign();
  const known = o => Object.fromEntries(Object.entries(o || {}).filter(([t, n]) => ENEMY_TYPES[t] && n > 0));
  if (!saved || typeof saved !== 'object') {
    for (const t of Object.keys(killCounts)) if (!ENEMY_TYPES[t].summon) c.met[t] = 1;
    return c;
  }
  c.met = known(saved.met); c.kills = known(saved.kills);
  c.worlds = Object.fromEntries(Object.entries(saved.worlds || {}).filter(([id]) => WORLD_BY_ID[id]));
  c.seals = Object.fromEntries(Object.keys(saved.seals || {}).filter(b => ALL_SEALS.includes(b)).map(b => [b, 1]));
  c.finales = (saved.finales || []).filter(b => ENEMY_TYPES[b]);
  c.finaleChoice = c.finales.includes(saved.finaleChoice) ? saved.finaleChoice : null;
  c.order = (saved.order || []).filter(id => WORLD_BY_ID[id]);
  c.cycle = saved.cycle || 0;
  const r = saved.run;
  if (r && WORLD_BY_ID[r.world] && Array.isArray(r.rooms) && r.rooms[r.idx] && r.rooms.every(rm => rm.foes.every(f => ENEMY_TYPES[foeType(f)]))) c.run = r;
  return c;
}

const curRoom = () => { const r = state.campaign.run; return r && r.rooms[r.idx]; };
const worldRec = id => state.campaign.worlds[id] || (state.campaign.worlds[id] = { rooms: {}, runs: 0 });
const nonBossRooms = w => roomPlan(w).filter(r => r[0] !== 'boss').length;
const ROLE_ONE = { bruiser: 'Bruiser', duelist: 'Duelist', guardian: 'Guardian', trickster: 'Trickster', marksman: 'Marksman', caster: 'Caster', colossus: 'Colossus', beast: 'Beast' };

// the finale the special ends with at Transcendence: your pick, else the latest one unlocked
function chosenFinale() {
  const c = state.campaign;
  return c.finales.includes(c.finaleChoice) ? c.finaleChoice : c.finales[c.finales.length - 1] || null;
}

function enterWorld(id) {
  const c = state.campaign;
  if (c.run && c.run.world !== id && !confirm(`Leave your run through ${WORLD_BY_ID[c.run.world].name}? Rooms you cleared for the first time stay cleared.`)) return;
  if (!c.run || c.run.world !== id) c.run = buildRun(id, Math.floor(Math.random() * 1e9));
  startRoom();
}

function startRoom() {
  if (!curRoom()) return;
  setMode('campaign');
  saveStore(); renderPortal();
}

function nextRoom() {
  const r = state.campaign.run;
  if (!r || !r.cleared[r.idx] || state.view.mode !== 'campaign') return;
  r.idx++;
  startRoom();
}

function leaveRun() {
  state.campaign.run = null;
  saveStore();
  if (state.view.mode === 'campaign') setMode('train');
  renderPortal();
}

// first meetings: an intro card, and the foe goes into the codex
function meetFoes(room) {
  const c = state.campaign, fresh = [...new Set(room.foes.map(foeType))].filter(t => !c.met[t]);
  for (const t of fresh) c.met[t] = 1;
  if (!fresh.length) return 0;
  const w = WORLD_BY_ID[c.run.world], box = $('encounter');
  box.innerHTML = `<div class="enc-k">${fresh.length > 1 ? 'New enemies' : 'New enemy'}</div>` + fresh.slice(0, 3).map(t => {
    const d = ENEMY_TYPES[t];
    return `<div class="enc-row" data-t="${t}"><span class="enc-ic"></span><span><b class="enc-n">${d.name}</b><span class="enc-e">${d.boss ? 'Boss' : ROLE_ONE[d.role] || ''} of ${w.name}</span></span></div>`;
  }).join('');
  box.querySelectorAll('.enc-row').forEach(row => { try { row.querySelector('.enc-ic').appendChild(spriteIcon(row.dataset.t)); } catch (e) { /* no icon */ } });
  box.hidden = false; box.classList.remove('out');
  clearTimeout(meetFoes.timer);
  meetFoes.timer = setTimeout(() => { box.classList.add('out'); meetFoes.timer = setTimeout(() => { box.hidden = true; }, 400); }, 2600);
  state.codexDirty = true;
  return 2.4; // the room waits while the card shows
}

// a room is over: its rewards, its seal, and maybe the whole world
function finishRoom(sim) {
  const c = state.campaign, r = c.run, room = curRoom(), v = state.view;
  if (!room) return;
  const w = WORLD_BY_ID[r.world], rec = worldRec(w.id), cleared = sim.stats.result === 'clear';
  for (const t of Object.keys(sim.stats.killsByType || {})) if (!ENEMY_TYPES[t].summon) c.met[t] = 1; // the Lich's pieces too
  let jade = sim.stats.bounty;
  v.roomResult = { cleared, boss: room.boss || null, sealed: false, worldDone: false, world: w.name, last: r.idx === r.rooms.length - 1 };
  if (cleared) {
    r.cleared[r.idx] = true;
    if (room.kind === 'boss' && !c.seals[room.boss]) {
      c.seals[room.boss] = 1;
      if (!c.finales.includes(room.boss)) c.finales.push(room.boss);
      jade += BOSS_JADE[w.tier];
      v.roomResult.sealed = true;
      toast(`A seal burns away: ${ENEMY_TYPES[room.boss].name}. Finale unlocked: ${ENEMY_TYPES[room.boss].name}'s power.`);
      if (room.boss === HIDDEN_KEY_BOSS) toast('The keeper is gone. Below the Timestream, three hidden worlds come into view.');
    } else if (room.kind !== 'boss' && !rec.rooms[r.idx]) {
      rec.rooms[r.idx] = 1;
      jade += Math.round(EXPLORE_JADE[w.tier] / nonBossRooms(w));
    }
    if (v.roomResult.last) {
      rec.runs = (rec.runs || 0) + 1;
      if (rec.runs === 1) { c.order.push(w.id); toast(`World conquered: ${w.name}`); }
      else jade += Math.round(EXPLORE_JADE[w.tier] * REPEAT_SHARE);
      v.roomResult.worldDone = true;
      c.run = null;
    }
  }
  if (jade > 0) { state.jade += jade; toast(`+${Math.round(jade)} jade`); refreshJade(); }
  state.codexDirty = true;
  saveStore(); renderPortal();
}

function campaignOverlay(sim) {
  const rr = state.view.roomResult || {}, s = sim.stats;
  const line = `K${s.kills} PARRY${s.parries} BREAK${s.postureBreaks}`;
  if (!rr.cleared) return { title: { dead: 'DEFEATED', fell: 'RING OUT', time: 'OUT OF TIME' }[s.result] || 'DEFEATED', color: '#e0603f', sub: line, sub3: 'R: RETRY ROOM' };
  if (rr.worldDone) return { title: 'CONQUERED', color: '#e8c34a', sub: rr.world.toUpperCase().slice(0, 22), sub2: rr.sealed ? 'A SEAL BURNS AWAY' : line, sub3: 'BACK TO THE PORTAL' };
  if (rr.boss) return { title: rr.sealed ? 'SEAL BROKEN' : 'BOSS DOWN', color: '#e8c34a', sub: ENEMY_TYPES[rr.boss].name.toUpperCase().slice(0, 22), sub2: line, sub3: 'N: NEXT ROOM' };
  return { title: 'ROOM CLEARED', color: '#7fc98a', sub: line, sub3: 'N: NEXT ROOM' };
}

const dangerOf = w => {
  const gap = recommendedLevel(w) - (state.level || 1);
  return gap <= -10 ? ['Easy', '#5f5f5f'] : gap <= 2 ? ['Fitting', '#2f6f3a'] : gap <= 12 ? ['Dangerous', '#b8651c'] : ['Deadly', '#c0392b'];
};

// the Portal: the run in progress, then every world you can see, tier by tier
function renderPortal() {
  if (!$('portalPanel')) return;
  const c = state.campaign, broken = ALL_SEALS.filter(b => c.seals[b]).length;
  $('lidLine').innerHTML = `Level <b>${state.level || 1}</b> · Seals broken <b>${broken} / ${ALL_SEALS.length}</b>` + (c.order.length ? ` · Worlds conquered <b>${c.order.length}</b>` : '');
  const r = c.run, rc = $('runCard');
  if (r) {
    const w = WORLD_BY_ID[r.world], room = r.rooms[r.idx], here = state.view.mode === 'campaign';
    const nodes = r.rooms.map((rm, i) => `<span class="rnode${rm.kind === 'boss' ? ' boss' : ''}${r.cleared[i] ? ' done' : ''}${i === r.idx ? ' cur' : ''}" title="${rm.kind === 'boss' ? ENEMY_TYPES[rm.boss].name : rm.kind}">${rm.kind === 'boss' ? '◆' : i + 1}</span>`).join('');
    const what = room.kind === 'boss' ? `Boss: ${ENEMY_TYPES[room.boss].name}` : `${room.kind[0].toUpperCase() + room.kind.slice(1)}: ` + room.foes.map(f => (c.met[foeType(f)] ? ENEMY_TYPES[foeType(f)].name : '???') + (f.elite ? ' (elite)' : '')).join(', ');
    rc.innerHTML = `<div class="run-card" style="border-left-color:${w.color}"><div class="k">Run in progress</div><div class="n">${w.name}</div><div class="rnodes">${nodes}</div>` +
      `<div class="mini">Room ${r.idx + 1} of ${r.rooms.length}. ${what}</div><div class="btns">` +
      (r.cleared[r.idx] ? '<button class="primary" data-act="next">Next room</button>' : `<button class="primary" data-act="fight">${here ? 'Restart room' : 'Fight room ' + (r.idx + 1)}</button>`) +
      '<button data-act="leave">Leave run</button></div></div>';
    rc.querySelector('[data-act="leave"]').onclick = () => { if (confirm('Leave this run? Rooms you cleared for the first time stay cleared.')) leaveRun(); };
    const go = rc.querySelector('[data-act="next"], [data-act="fight"]');
    go.onclick = () => (go.dataset.act === 'next' ? nextRoom() : startRoom());
  } else rc.innerHTML = '';

  const list = $('worldList');
  list.innerHTML = '';
  for (const tier of [1, 2, 3, 4, 5, 6]) {
    const worlds = WORLDS.filter(w => w.tier === tier && worldVisible(c, w));
    if (!worlds.length) continue;
    const h = document.createElement('h3'); h.className = 'kill-head'; h.textContent = TIER_NAMES[tier] + (tier === 5 ? ' · the gate' : ''); list.appendChild(h);
    for (const w of worlds) {
      const rec = c.worlds[w.id] || { rooms: {}, runs: 0 }, plan = roomPlan(w);
      const left = plan.filter((rm, i) => rm[0] !== 'boss' && !rec.rooms[i]).length, nb = nonBossRooms(w);
      const bosses = worldBosses(w), sealsLeft = bosses.filter(b => !c.seals[b]).length;
      const jadeLeft = (nb ? Math.round(EXPLORE_JADE[w.tier] * left / nb) : 0) + sealsLeft * BOSS_JADE[w.tier];
      const [dl, dc] = dangerOf(w), mine = r && r.world === w.id;
      const el = document.createElement('div');
      el.className = 'world-card'; el.style.borderLeftColor = w.color;
      el.innerHTML = `<div class="wc-head"><b>${w.name}</b><span class="danger" style="color:${dc};border-color:${dc}">${dl}</span></div>` +
        `<div class="mini">Level ${recommendedLevel(w)} · ${plan.length} rooms${rec.runs ? ` · conquered${rec.runs > 1 ? ' ×' + rec.runs : ''}` : ''}</div>` +
        `<div class="wc-blurb">${w.blurb}</div>` +
        `<div class="wc-seals">${bosses.map(b => `<span class="seal${c.seals[b] ? ' broken' : ''}" title="${c.seals[b] ? 'Seal broken' : 'Seal intact'}">${c.seals[b] ? '✓ ' : ''}${c.met[b] ? ENEMY_TYPES[b].name : '???'}</span>`).join('')}</div>` +
        `<div class="wc-foot"><span class="mini">${jadeLeft ? `◆ ${jadeLeft.toLocaleString()} in first-time rewards left` : `Repeat runs: bounties + ◆ ${Math.round(EXPLORE_JADE[w.tier] * REPEAT_SHARE)}`}</span><button>${mine ? 'Continue' : 'Enter'}</button></div>`;
      el.querySelector('button').onclick = () => enterWorld(w.id);
      list.appendChild(el);
    }
  }
}

// the Codex: every foe met, world by world (the rest are silhouettes)
function renderCodex() {
  if (!state.codexDirty && $('codexList').childElementCount) return;
  state.codexDirty = false;
  const c = state.campaign, wrap = $('codexList');
  wrap.innerHTML = '';
  const shown = new Set();
  const groups = WORLDS.filter(w => worldVisible(c, w)).map(w => [w.name, [...worldFoes(w), ...worldBosses(w)]]);
  const others = Object.keys(c.met).filter(t => !groups.some(g => g[1].includes(t)));
  if (others.length) groups.push(['Others', others]);
  let met = 0, total = 0;
  for (const [title, types] of groups) {
    const h = document.createElement('h3'); h.className = 'kill-head'; h.textContent = title; wrap.appendChild(h);
    for (const t of types) {
      if (shown.has(t)) continue;
      shown.add(t); total++;
      const d = ENEMY_TYPES[t], row = document.createElement('div');
      if (!c.met[t]) { row.className = 'codex-row unmet'; row.innerHTML = '<span class="cx-ic"></span><span><b>???</b><span class="mini"> Not met yet</span></span>'; wrap.appendChild(row); continue; }
      met++;
      row.className = 'codex-row';
      row.innerHTML = `<span class="cx-ic"></span><span><b>${d.name}</b> <span class="mini">${d.boss ? 'Boss' : ROLE_ONE[d.role] || ''} · felled ${(c.kills[t] || 0).toLocaleString()} in the worlds</span>` +
        `<span class="cx-t"><i>${d.passive[0]}:</i> ${d.passive[1]}</span><span class="cx-t"><i>${d.active[0]}:</i> ${d.active[1]}</span></span>`;
      try { row.querySelector('.cx-ic').appendChild(spriteIcon(t)); } catch (e) { /* no icon */ }
      wrap.appendChild(row);
    }
  }
  $('codexNote').textContent = `${met} of ${total} met. Meeting a foe in a world writes it here.`;
}

function resultOverlay(sim) {
  const s = sim.stats, v = state.view;
  if (v.mode === 'battle') return battleOverlay(sim);
  if (v.mode === 'campaign') return campaignOverlay(sim);
  const line = `K${s.kills} PARRY${s.parries} BREAK${s.postureBreaks}`;
  if (v.mode === 'trial') {
    const sc = SCENARIOS[v.trialId];
    const why = { dead: 'KNOCKED OUT', fell: 'FELL OFF', time: 'OUT OF TIME' }[s.result] || 'GOAL MISSED';
    return s.passed
      ? { title: 'TRIAL PASSED', color: '#7fc98a', sub: line, sub2: 'GOAL: ' + sc.goal }
      : { title: 'TRIAL FAILED', color: '#e0603f', sub: why, sub2: line, sub3: 'GOAL: ' + sc.goal };
  }
  const title = { dead: 'DEFEATED', fell: 'RING OUT', clear: 'CLEARED!', time: 'TIME UP' }[s.result];
  const color = s.result === 'clear' ? '#7fc98a' : s.result === 'time' ? '#b8913c' : '#e0603f';
  return { title, color, sub: line, sub3: v.mode === 'watch' ? '' : 'PRESS R TO GO AGAIN' };
}

function recordTrial(sim) {
  const id = state.view.trialId;
  const t = state.trials[id] || { runs: 0, passes: 0 };
  t.runs++;
  if (sim.stats.passed) { if (!t.passes) toast(`Trial passed: ${SCENARIOS[id].name}`); t.passes++; }
  state.trials[id] = t;
  renderTrials();
  saveStore();
}

function updateView(dt) {
  const v = state.view;
  if (v.sim.done) {
    if (!v.overlay) {
      if (v.mode === 'trial' && !v.recorded) { v.recorded = true; recordTrial(v.sim); }
      if (v.mode !== 'play' && v.mode !== 'battle') addExposure(v.sim); // the hero learns from every fight it takes
      if (!v.paid) {
        v.paid = true;
        // only the worlds pay: battles, sparring, trials and play are memories
        countKills(v.sim, v.mode === 'campaign');
        if (v.mode === 'campaign') finishRoom(v.sim);
        else saveStore();
      }
      v.overlay = resultOverlay(v.sim);
    }
    v.endT += dt;
    if (v.mode === 'watch' && v.endT > 2) newViewSim();
    return;
  }
  if (v.paused) return;
  if (v.introT > 0) { v.introT -= dt; return; } // a new foe's card is showing
  const hasKeys = v.mode === 'play' || (v.mode === 'battle' && v.sim.heroes.some(h => h.controller === 'key' && !h.dead));
  const speed = hasKeys ? 1 : (state.speed === 'max' ? 1 : state.speed);
  v.acc += dt * speed;
  let steps = 0;
  while (v.acc >= DT && !v.sim.done && steps < 600) {
    v.acc -= DT; steps++;
    if (v.mode === 'battle') { stepBattle(); continue; }
    if (v.mode === 'play') {
      v.sim.sense();
      v.sim.step(keyAction());
      continue;
    }
    if (v.ticks++ % ACTION_REPEAT === 0) {
      const a = state.agent.act(v.sim.sense(), false);
      v.action = toSimAction(a.move, a.act);
    }
    v.sim.step(v.action);
  }
}

function refreshHint() {
  const v = state.view, h = $('viewHint');
  if (v.mode === 'train') h.innerHTML = state.training ? '' : 'Press <b>Start training</b> (or <kbd>T</kbd>) and the fighter starts learning.';
  else if (v.mode === 'watch') h.textContent = 'The fighter plays without learning.';
  else if (v.mode === 'play') h.innerHTML = '<kbd>WASD</kbd> move <kbd>J</kbd> strike <kbd>K</kbd> heavy <kbd>Space</kbd> guard <kbd>L</kbd> kick <kbd>Shift</kbd> roll <kbd>Q</kbd> <kbd>E</kbd> abilities <kbd>R</kbd> restart';
  else if (v.mode === 'trial') h.innerHTML = `Trial: <b>${SCENARIOS[v.trialId].name}</b>. ${SCENARIOS[v.trialId].desc}`;
  else if (v.mode === 'spar') h.innerHTML = `Sparring vs <b>${ENEMY_TYPES[v.sparType].name}</b> (no learning). <kbd>R</kbd> again.`;
  else if (v.mode === 'campaign') {
    const r = state.campaign.run;
    h.innerHTML = r ? `<b>${WORLD_BY_ID[r.world].name}</b>, room ${r.idx + 1} of ${r.rooms.length}. Your fighter fights; coach it between rooms. <kbd>N</kbd> next room <kbd>R</kbd> restart room` : 'World conquered. Open the <b>Portal</b> to choose the next one.';
  }
  else if (v.mode === 'battle') h.innerHTML = 'Battle. Set it up in the Battle section. <kbd>R</kbd> rematch' + (state.cfg.battle.slots.some(s => s.kind === 'you') ? '. You: <kbd>WASD</kbd> <kbd>J</kbd> <kbd>K</kbd> <kbd>Space</kbd> <kbd>L</kbd> <kbd>Shift</kbd> <kbd>Q</kbd> <kbd>E</kbd>' : '.');
}

function setMode(mode, arg) {
  const v = state.view;
  v.mode = mode;
  v.trialId = mode === 'trial' ? arg : null;
  v.sparType = mode === 'spar' ? arg : null;
  if (arg !== 'online') v.online = null;
  v.paused = false;
  refreshPauseBtn();
  document.querySelectorAll('#modeSeg button').forEach(b => b.classList.toggle('on', b.dataset.mode === mode));
  if (mode !== 'train') newViewSim();
  else renderer.reset();
  refreshScreen();
  refreshHint();
}

function setSpeed(sp) {
  state.speed = sp;
  document.querySelectorAll('#speedSeg button').forEach(b => b.classList.toggle('on', b.dataset.speed === String(sp)));
  state.acc = 0;
  refreshScreen();
}

// Max speed on the training view swaps the arena for a big live chart.
function refreshScreen() {
  const max = state.view.mode === 'train' && state.speed === 'max';
  $('game').hidden = max;
  $('maxView').hidden = !max;
  // effects are only collected while someone is watching the training fighter
  const sim = state.trainer.sim;
  if (!showingTraining()) sim.fx = null;
  else if (!sim.fx) sim.fx = [];
  state.chartDirty = true;
}

function refreshPauseBtn() {
  $('pauseBtn').textContent = state.view.paused ? 'Resume' : 'Pause';
  $('pauseBtn').classList.toggle('on', state.view.paused);
}

// ---------- chart ----------
const METRIC_SCALE = { died: 100 };

function drawChart(cv) {
  const dpr = window.devicePixelRatio || 1;
  const w = cv.clientWidth, h = cv.clientHeight;
  if (!w || !h) return;
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  const g = cv.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, w, h);
  g.font = '12px system-ui, sans-serif';
  const key = $('metric').value, mul = METRIC_SCALE[key] || 1;
  const all = state.lives;
  if (all.length < 2) {
    g.fillStyle = '#5f5f5f'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('Each life the fighter lives adds a point here.', w / 2, h / 2);
    return;
  }
  const first = Math.max(0, all.length - 3000);
  const data = all.slice(first).map(l => l[key] * mul);
  const ma = [];
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i]; if (i >= 25) sum -= data[i - 25];
    ma.push(sum / Math.min(i + 1, 25));
  }
  let lo = Infinity, hi = -Infinity;
  for (const v of data) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
  if (hi - lo < 1e-6) { hi += 1; lo -= 1; }
  const padL = 44, padR = 8, padT = 8, padB = 22;
  const X = i => padL + i / (data.length - 1) * (w - padL - padR);
  const Y = v => padT + (1 - (v - lo) / (hi - lo)) * (h - padT - padB);
  g.strokeStyle = '#eeeeee'; g.lineWidth = 1;
  g.fillStyle = '#5f5f5f'; g.textAlign = 'right'; g.textBaseline = 'middle';
  for (let k = 0; k <= 4; k++) {
    const v = lo + (hi - lo) * k / 4, y = Y(v);
    g.beginPath(); g.moveTo(padL, y); g.lineTo(w - padR, y); g.stroke();
    g.fillText(Math.abs(hi - lo) > 20 ? v.toFixed(0) : v.toFixed(1), padL - 6, y);
  }
  if (lo < 0 && hi > 0) { g.strokeStyle = '#bbbbbb'; g.beginPath(); g.moveTo(padL, Y(0)); g.lineTo(w - padR, Y(0)); g.stroke(); }
  g.fillStyle = 'rgba(0,0,0,0.18)';
  const stride = Math.max(1, Math.floor(data.length / 1200));
  for (let i = 0; i < data.length; i += stride) g.fillRect(X(i) - 1, Y(data[i]) - 1, 2, 2);
  g.strokeStyle = '#161616'; g.lineWidth = 2; g.beginPath();
  for (let i = 0; i < ma.length; i++) { const x = X(i), y = Y(ma[i]); i ? g.lineTo(x, y) : g.moveTo(x, y); }
  g.stroke();
  g.fillStyle = '#5f5f5f'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  const total = state.livesTotal || all.length, offset = total - all.length + first;
  g.fillText(`life ${offset + 1}`, padL + 24, h - 6);
  g.fillText(`life ${total}`, w - padR - 30, h - 6);
}

// ---------- readouts ----------
function updateReadouts() {
  renderBoard();
  if (state.abilitiesDirty && !$('abilitiesSection').hidden) buildAbilities();
  const agent = state.agent, recent = state.lives.slice(-25);
  const avg = k => recent.length ? recent.reduce((s, l) => s + l[k], 0) / recent.length : 0;
  const parts = [
    `Lives <b>${(state.livesTotal || 0).toLocaleString()}</b>`,
    `Decisions <b>${agent.steps.toLocaleString()}</b>`,
    `Learned <b>${agent.updates}</b> times`,
  ];
  if (state.training) parts.push(`<b>${Math.round(decisionsPerSec()).toLocaleString()}</b> decisions/s`);
  if (recent.length) parts.push(`Last ${recent.length}: defeats <b>${avg('kills').toFixed(1)}</b>, parries <b>${avg('parries').toFixed(1)}</b>, died <b>${Math.round(avg('died') * 100)}%</b>`);
  $('statLine').innerHTML = parts.map(p => `<span>${p}</span>`).join('');
  $('maxRate').textContent = `${Math.round(decisionsPerSec()).toLocaleString()} decisions/s, life ${(state.livesTotal || 0).toLocaleString()}`;
}

function updateBrain() {
  const agent = state.agent;
  $('actBars').innerHTML = ACTIONS.map((name, i) => {
    const p = agent.pa[i];
    return `<div class="pbar"><span>${name}</span><div class="track"><div class="fill" style="width:${(p * 100).toFixed(0)}%"></div></div><span class="v">${Math.round(p * 100)}%</span></div>`;
  }).join('');
  // compass laid out N row on top; MOVE_DIRS index per cell
  const order = [6, 7, 8, 5, 0, 1, 4, 3, 2];
  const mx = Math.max(...agent.pm);
  $('moveGrid').innerHTML = order.map(i => {
    const p = agent.pm[i], k = mx ? p / mx : 0;
    return `<div style="background:rgba(22,22,22,${(0.08 + 0.92 * k).toFixed(2)})" title="${MOVE_LABELS[i]} ${Math.round(p * 100)}%">${Math.round(p * 100)}</div>`;
  }).join('');
}

// ---------- settings ----------
function bindRange(id, get, set, fmt = v => v) {
  const el = $(id), out = $(id + 'Val');
  el.value = get(); out.textContent = fmt(get());
  el.addEventListener('input', () => { set(parseFloat(el.value)); out.textContent = fmt(get()); saveStore(); });
}

function buildSettings() {
  const c = state.cfg, L = state.cfg.learning;
  bindRange('atOnce', () => c.atOnce, v => { c.atOnce = v; });
  bindRange('episode', () => c.episode, v => { c.episode = v; }, v => v + 's');
  bindRange('learnAfter', () => c.learnAfter, v => { c.learnAfter = v; state.abilitiesDirty = true; }, v => v + 's');

  const live = (key, v) => { L[key] = v; state.agent.cfg[key] = v; };
  bindRange('lr', () => L.lr, v => live('lr', v), v => (v * 1000).toFixed(2) + 'e-3');
  bindRange('ent', () => L.entropy, v => live('entropy', v), v => v.toFixed(3));
  bindRange('gamma', () => L.gamma, v => live('gamma', v), v => v.toFixed(3));
  bindRange('rollout', () => L.rollout, v => live('rollout', v));

  $('hidden').value = L.hidden.join(',');
  $('applyArch').addEventListener('click', () => {
    const parts = $('hidden').value.split(',').map(s => parseInt(s.trim(), 10)).filter(n => n > 0 && n <= 256);
    if (!parts.length || parts.length > 4) { alert('Use 1 to 4 layers, e.g. 64,64'); return; }
    if (!confirm('A new network size means starting from scratch. Continue?')) return;
    L.hidden = parts; $('hidden').value = parts.join(',');
    startOver();
  });
  $('resetAgent').addEventListener('click', () => {
    if (confirm('Forget everything the fighter has learned (its abilities, identity and special) and clear the chart? Talents, jade and skins are kept.')) startOver();
  });

  buildFoes();
  buildRewards();
  $('resetRewards').addEventListener('click', () => { state.rewards = { ...DEFAULT_REWARDS }; buildRewards(); saveStore(); });
}

function buildAbilities() {
  document.querySelectorAll('#abilityMode button').forEach(b => {
    b.classList.toggle('on', b.dataset.mode === state.cfg.abilityMode);
    b.onclick = () => {
      state.cfg.abilityMode = b.dataset.mode;
      if (b.dataset.mode === 'manual') state.cfg.manual = state.loadout.slice();
      state.livesSincePick = 99;
      pickLoadout(); reforgeSpecial(); buildAbilities(); saveStore();
    };
  });
  const known = learned();
  [0, 1].forEach(i => {
    const sel = $('slot' + (i + 1));
    sel.innerHTML = '<option value="">(empty)</option>' + known.map(t => `<option value="${t}">${HERO_ABILITIES[t].name}</option>`).join('');
    sel.value = (state.cfg.abilityMode === 'manual' ? state.cfg.manual[i] : state.loadout[i]) || '';
    sel.disabled = state.cfg.abilityMode === 'auto';
    sel.onchange = () => { state.cfg.manual[i] = sel.value || null; pickLoadout(); reforgeSpecial(); saveStore(); refreshAbilityList(); };
  });
  $('autoNote').textContent = state.cfg.abilityMode === 'auto'
    ? (known.length ? (state.loadoutNote ? 'Using ' + state.loadoutNote + '.' : '') : 'Nothing learned yet. Fight foes to learn their abilities.')
    : 'Applies from the next life.';
  refreshAbilityList();
  state.abilitiesDirty = false;
}

function refreshAbilityList() {
  const rows = Object.keys(HERO_ABILITIES).map(t => {
    const ab = HERO_ABILITIES[t], pr = abProgress(t), m = pr.m, done = pr.ok && m >= pr.need, st = state.abStats[t];
    if (!m || (ab.manual && ab.manual > 1 && !isLearned(pr.prev))) return null; // the manual reveals one sword at a time
    const equipped = state.loadout.includes(t);
    const stat = done && st && st.n ? `${st.n} lives, ${(st.adv / st.n >= 0 ? '+' : '') + (st.adv / st.n).toFixed(0)} vs avg, ${(st.uses / st.n).toFixed(1)} uses` : done ? 'not used yet' : '';
    return `<div class="ab-row${equipped ? ' eq' : ''}" title="${ab.desc}"><span class="ab-name">${ab.name}${equipped ? ' ●' : ''}</span>` +
      `<span class="ab-from">${abFoe(t).name}</span>` +
      (done ? `<span class="ab-stat">${stat}</span>` : !pr.ok && m >= pr.need ? `<span class="ab-stat">use ${HERO_ABILITIES[pr.prev].name.split(':')[0]} ${MANUAL_PRACTICE}x first</span>`
        : `<span class="ab-prog"><i style="width:${Math.min(100, m / pr.need * 100).toFixed(0)}%"></i></span>`) + '</div>';
  }).filter(Boolean);
  const unseen = Object.keys(HERO_ABILITIES).filter(t => !HERO_ABILITIES[t].manual && !state.mastery[t]).length;
  $('abilityList').innerHTML = (rows.join('') || '') + (unseen ? `<p class="mini">${unseen} more to discover by fighting new foes.</p>` : '');
}

function startOver() {
  setAgent(new PPOAgent(state.cfg.learning, Math.floor(Math.random() * 1e9)));
  state.lives = []; state.livesTotal = 0; state.chartDirty = true;
  state.mastery = {}; state.abStats = {}; state.loadout = [null, null];
  state.identity = freshIdentity(); // a new fighter: no awakening, no special, until it earns them again
  buildAbilities();
  refreshScreen();
  saveStore();
}

function spriteIcon(type) {
  const s = SPRITE_CACHE[spriteOf(type)];
  const size = Math.max(16, s.w, s.h);
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const g = c.getContext('2d');
  g.drawImage(s.n, Math.floor((size - s.w) / 2), size - s.h);
  return c;
}

const foeTip = t => { const d = ENEMY_TYPES[t]; return `${d.passive[0]}: ${d.passive[1]}\n${d.active[0]}: ${d.active[1]}`; };

// Opponents grouped by combat role, each group with an all-or-none box.
function buildFoes() {
  const wrap = $('foeList');
  wrap.innerHTML = '';
  const groups = ROLE_ORDER.map(role => ({ title: ROLES[role].name, types: ROSTER.filter(t => ENEMY_TYPES[t].role === role) }));
  groups.push({ title: 'Bosses', types: BOSSES });
  for (const grp of groups) {
    const box = document.createElement('div');
    box.className = 'foe-group';
    const head = document.createElement('label');
    head.className = 'foe-head';
    const all = document.createElement('input');
    all.type = 'checkbox';
    const n = grp.types.filter(t => state.cfg.roster.includes(t)).length;
    all.checked = n === grp.types.length; all.indeterminate = n > 0 && n < grp.types.length;
    all.addEventListener('change', () => {
      const set = new Set(state.cfg.roster);
      grp.types.forEach(t => all.checked ? set.add(t) : set.delete(t));
      state.cfg.roster = [...set];
      buildFoes(); saveStore();
    });
    head.append(all, document.createTextNode(grp.title));
    box.appendChild(head);
    const grid = document.createElement('div');
    grid.className = 'foes';
    for (const type of grp.types) {
      const el = document.createElement('div');
      el.className = 'foe' + (state.cfg.roster.includes(type) ? ' in' : '');
      el.title = foeTip(type);
      el.appendChild(spriteIcon(type));
      const lab = document.createElement('label');
      lab.innerHTML = `<input type="checkbox" ${state.cfg.roster.includes(type) ? 'checked' : ''}><span>${ENEMY_TYPES[type].name}</span>`;
      lab.querySelector('input').addEventListener('change', e => {
        const r = state.cfg.roster.filter(t => t !== type);
        if (e.target.checked) r.push(type);
        state.cfg.roster = r;
        buildFoes(); saveStore();
      });
      const spar = document.createElement('button');
      spar.textContent = 'spar'; spar.title = `Watch the fighter vs ${ENEMY_TYPES[type].name}`;
      spar.addEventListener('click', () => setMode('spar', type));
      el.append(lab, spar);
      grid.appendChild(el);
    }
    box.appendChild(grid);
    wrap.appendChild(box);
  }
  $('foeNotes').innerHTML = ROLE_ORDER.map(role => {
    const members = ROSTER.filter(t => ENEMY_TYPES[t].role === role).concat(BOSS_OF[role]);
    return `<p class="role-note"><b>${ROLES[role].name}:</b> ${ROLES[role].habit}</p>` + members.map(t => {
      const d = ENEMY_TYPES[t];
      return `<p class="foe-note"><b>${d.name}</b>${d.boss ? ' (boss)' : ''}: <i>${d.passive[0]}</i>, ${d.passive[1]} <i>${d.active[0]}</i>, ${d.active[1]}</p>`;
    }).join('');
  }).join('');
}

function buildRewards() {
  const wrap = $('rewardRows');
  wrap.innerHTML = '';
  for (const [key, name, min, max, step] of REWARD_INFO) {
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `<label>${name}</label><input type="range" min="${min}" max="${max}" step="${step}" aria-label="${name}"><output></output>`;
    const input = row.querySelector('input'), out = row.querySelector('output');
    const show = () => { const v = state.rewards[key]; out.textContent = (v > 0 ? '+' : '') + (+v.toFixed(2)); };
    input.value = state.rewards[key]; show();
    input.addEventListener('input', () => { state.rewards[key] = parseFloat(input.value); show(); saveStore(); });
    wrap.appendChild(row);
  }
  const pre = $('presets');
  pre.innerHTML = '';
  for (const name of Object.keys(PRESETS)) {
    const b = document.createElement('button');
    b.textContent = name;
    b.addEventListener('click', () => { state.rewards = { ...PRESETS[name] }; buildRewards(); saveStore(); toast(`Rewards: ${name}`); });
    pre.appendChild(b);
  }
}

function renderTrials() {
  const wrap = $('trialList');
  wrap.innerHTML = '';
  for (const [id, sc] of Object.entries(SCENARIOS)) {
    if (sc.custom) continue;
    const t = state.trials[id];
    const el = document.createElement('div');
    el.className = 'trial';
    el.innerHTML = `<div class="tname">${sc.name} ${t && t.passes ? '<span class="ok">passed</span>' : ''}</div><div class="tdesc">${sc.desc}</div>` +
      (t ? `<div class="tstat">${t.passes}/${t.runs} passed</div>` : '');
    const b = document.createElement('button');
    b.textContent = 'Run';
    b.addEventListener('click', () => setMode('trial', id));
    el.appendChild(b);
    wrap.appendChild(el);
  }
}

// ---------- save slots ----------
function renderVault() {
  const wrap = $('vault');
  wrap.innerHTML = '';
  state.vault.forEach((item, i) => {
    const el = document.createElement('div');
    el.className = 'vault-item';
    const label = document.createElement('span');
    label.textContent = item.name + ' ';
    const meta = document.createElement('small');
    meta.textContent = `${item.lives} lives`;
    label.appendChild(meta);
    const load = document.createElement('button'); load.textContent = 'Load';
    load.addEventListener('click', () => {
      if (!confirm(`Load "${item.name}"? The current fighter is replaced.`)) return;
      adopt({ ...item.agent, profile: item.profile }, item.name);
    });
    const del = document.createElement('button'); del.textContent = 'Delete';
    del.addEventListener('click', () => {
      if (!confirm(`Delete "${item.name}"?`)) return;
      state.vault.splice(i, 1); renderVault(); saveStore();
    });
    el.append(label, load, del);
    wrap.appendChild(el);
  });
}

function adopt(json, name) {
  const agent = PPOAgent.fromJSON(json);
  state.cfg.learning = { ...agent.cfg };
  setAgent(agent);
  state.lives = []; state.livesTotal = 0; state.chartDirty = true;
  if (json.profile) { // a whole fighter: its abilities, special, talents, jade and skins come with it (older files carry only the brain)
    applyProfile(json.profile);
    state.livesTotal = json.profile.livesTotal || 0;
    for (const build of [buildAbilities, buildTalents, buildSkins, refreshJade]) try { build(); } catch (e) { console.error(e); }
  }
  $('hidden').value = agent.cfg.hidden.join(',');
  refreshScreen();
  saveStore();
  toast(`Loaded ${name}`);
}

function buildVault() {
  $('saveBrain').addEventListener('click', () => {
    const name = $('saveName').value.trim() || `Fighter after ${state.livesTotal || 0} lives`;
    state.vault.unshift({ name, lives: state.livesTotal || 0, agent: state.agent.toJSON(), profile: JSON.parse(JSON.stringify(profile())) });
    state.vault = state.vault.slice(0, 5);
    $('saveName').value = '';
    renderVault(); saveStore(); toast(`Saved ${name}`);
  });
  $('exportBrain').addEventListener('click', () => {
    const data = JSON.stringify({ app: 'neuro-arena', lives: state.livesTotal || 0, ...state.agent.toJSON(), profile: profile() });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    a.download = `neuro-arena-fighter-${state.livesTotal || 0}-lives.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  $('importBtn').addEventListener('click', () => $('importFile').click());
  $('importFile').addEventListener('change', async e => {
    const f = e.target.files[0]; e.target.value = '';
    if (!f) return;
    try {
      const o = JSON.parse(await f.text());
      if (!validAgentJSON(o)) throw new Error('shape');
      adopt(o, f.name);
    } catch (err) { alert('That file is not a fighter saved by this version of Neuro Arena.'); }
  });
  renderVault();
}

// ---------- input ----------
window.addEventListener('keydown', e => {
  if (e.target instanceof Element && e.target.matches('input, select, textarea')) return;
  const mode = state.view.mode;
  if ((mode === 'play' || mode === 'battle') && ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (e.code === 'KeyR' && mode !== 'train' && mode !== 'watch' && (mode !== 'campaign' || curRoom())) { newViewSim(); refreshHint(); }
  if (e.code === 'KeyN' && mode === 'campaign') nextRoom();
  if (e.code === 'KeyP' && !e.repeat) { state.view.paused = !state.view.paused; refreshPauseBtn(); }
  if (e.code === 'KeyT' && !e.repeat && mode !== 'play') setTraining(!state.training);
  keys.add(e.code);
});
window.addEventListener('keyup', e => keys.delete(e.code));
window.addEventListener('blur', () => keys.clear());
window.addEventListener('beforeunload', saveStore);

// ---------- boot ----------
// ---------- jade and talents ----------
const SPIN_COST = 100, TEN_COST = 900, PITY = 30, TRAIN_JADE = 0.1; // training is for the brain: it pays a tenth
// ten talent slots; stronger talents take up to three of them
const slotsUsed = (eq = state.talents.equipped) => eq.reduce((n, id) => n + (TALENT_BY_ID[id] ? TALENT_BY_ID[id].slots : 0), 0);
const fitsSlots = (id, eq = state.talents.equipped) => slotsUsed(eq) + TALENT_BY_ID[id].slots <= TALENT_SLOTS;
const DUP_REFUND = [10, 15, 25, 40, 70, 150];
let spinning = false, skipNow = false;
const SKIP_KEY = 'neuro-arena-skip-spin';
const skipSpin = () => { try { return localStorage.getItem(SKIP_KEY) === '1'; } catch (e) { return false; } };

// ---------- the skin shop ----------
function buyOrWearSkin(id) {
  const S = state.skins, sk = SKIN_BY_ID[id];
  if (!S.owned[id]) {
    if (state.jade < sk.cost) { toast(`${sk.name} costs ${sk.cost} jade`); return; }
    state.jade -= sk.cost; S.owned[id] = 1; toast(`Bought ${sk.name}`); refreshJade();
  }
  S.equipped = id;
  buildSkins(); saveStore();
}

let skinFrame = 0;
function buildSkins() {
  const S = state.skins, grid = $('skinGrid');
  grid.innerHTML = '';
  for (const sk of HERO_SKINS) {
    const own = !!S.owned[sk.id], eq = S.equipped === sk.id, card = document.createElement('div');
    card.className = 'skin-card' + (eq ? ' eq' : '');
    card.style.setProperty('--skin', sk.color || '#c23b22');
    card.innerHTML = `<canvas width="64" height="36"></canvas><span class="sk-name">${sk.name}</span><span class="sk-desc">${sk.desc}</span>`;
    const btn = document.createElement('button');
    btn.textContent = eq ? 'Wearing' : own ? 'Wear' : `Buy · ◆ ${sk.cost}`;
    btn.disabled = eq || (!own && state.jade < sk.cost);
    if (!own && !btn.disabled) btn.className = 'primary';
    btn.onclick = () => buyOrWearSkin(sk.id);
    card.appendChild(btn);
    grid.appendChild(card);
    card.querySelector('canvas').dataset.skin = sk.id;
  }
  drawSkinPreviews();
}

// the shop's little previews: each skin striking, guarding and walking in turn
function drawSkinPreviews() {
  const poses = ['hero', 'hero_walk', 'hero_punch', 'hero', 'hero_walk', 'hero_heavy', 'hero_guard', 'hero_kick'];
  for (const cv of document.querySelectorAll('#skinGrid canvas')) {
    const g = cv.getContext('2d'), sk = SKIN_BY_ID[cv.dataset.skin], name = skinSprite(poses[Math.floor(skinFrame / 3) % poses.length], sk.id), s = SPRITE_CACHE[name];
    g.imageSmoothingEnabled = false; g.fillStyle = '#1a2238'; g.fillRect(0, 0, 64, 36);
    g.fillStyle = sk.color || '#c23b22'; g.globalAlpha = 0.25; g.fillRect(16, 30, 32, 3); g.globalAlpha = 1;
    g.drawImage(s.n, 32 - s.w, 31 - s.h * 2, s.w * 2, s.h * 2);
  }
}
setInterval(() => { if (!$('skinSection').hidden) { skinFrame++; drawSkinPreviews(); } }, 160);

function refreshJade() {
  const j = Math.floor(state.jade);
  $('jadeBal').textContent = '◆ ' + j.toLocaleString();
  $('spin1').disabled = spinning || j < SPIN_COST;
  $('spin10').disabled = spinning || j < TEN_COST;
  if (!$('skinSection').hidden) buildSkins(); // prices you can now afford
}

function rollTier(min = 0) {
  const pool = TIERS.slice(min), total = pool.reduce((a, t) => a + t.odds, 0);
  let r = Math.random() * total;
  for (let i = 0; i < pool.length; i++) { r -= pool[i].odds; if (r < 0) return min + i; }
  return TIERS.length - 1;
}

function drawTalent() {
  const T = state.talents;
  T.spins++; T.pity++;
  let tier = rollTier();
  if (T.pity >= PITY && tier < 3) tier = rollTier(3); // pity: purple or better
  if (tier >= 3) T.pity = 0;
  const pool = TALENTS.filter(t => t.tier === tier), tal = pool[Math.floor(Math.random() * pool.length)];
  const dup = !!T.owned[tal.id];
  if (dup) state.jade += DUP_REFUND[tier];
  else T.owned[tal.id] = 1;
  return { tal, dup };
}

function spin(n) {
  const cost = n === 10 ? TEN_COST : SPIN_COST;
  if (spinning || state.jade < cost) return;
  state.jade -= cost;
  const results = Array.from({ length: n }, drawTalent);
  // new talents fill any free slots, best first
  for (const r of results.filter(r => !r.dup).sort((x, y) => y.tal.tier - x.tal.tier)) {
    if (fitsSlots(r.tal.id)) state.talents.equipped.push(r.tal.id);
  }
  saveStore();
  const best = results.reduce((a, b) => (b.tal.tier > a.tal.tier ? b : a));
  const box = $('reveal');
  box.hidden = false; spinning = true; skipNow = skipSpin(); refreshJade();
  box.onclick = () => { skipNow = true; }; // a click on the spinning box jumps to the result
  sfx.unlock(); if (!skipNow) sfx.play('riser');
  // flicker through talents, slowing down, then land on the result
  let i = 0;
  const flick = () => {
    const t = TALENTS[Math.floor(Math.random() * TALENTS.length)], c = TIERS[t.tier].color;
    box.className = 'reveal spinning'; box.style.borderColor = c; box.style.boxShadow = 'none';
    box.innerHTML = `<div class="r-tier" style="color:${c}">${TIERS[t.tier].name}</div><div class="r-name">${t.name}</div>`;
    if (++i < 14 && !skipNow) setTimeout(flick, 40 + i * i * 1.5);
    else land();
  };
  const land = () => {
    spinning = false; box.onclick = null;
    const c = TIERS[best.tal.tier].color;
    box.className = 'reveal'; box.style.borderColor = c;
    box.style.boxShadow = best.tal.tier >= 3 ? `0 0 ${6 + best.tal.tier * 4}px ${c}` : 'none';
    let html = `<div class="r-tier" style="color:${c}">${TIERS[best.tal.tier].name}${best.dup ? ' · duplicate +' + DUP_REFUND[best.tal.tier] + ' jade' : ' · new'}</div><div class="r-name" style="color:${best.tal.tier === 0 ? '#555' : c}">${best.tal.name}</div><div class="r-desc">${best.tal.desc}</div>`;
    if (results.length > 1) {
      html += '<div class="chips" style="margin-top:6px">' + results.slice().sort((a, b) => b.tal.tier - a.tal.tier).map(r =>
        `<span class="chip" style="border-color:${TIERS[r.tal.tier].color};color:${r.tal.tier === 0 ? '#555' : TIERS[r.tal.tier].color}">${r.tal.name}${r.dup ? ' ↺' : ''}</span>`).join('') + '</div>';
    }
    box.innerHTML = html;
    sfx.play(best.tal.tier >= 4 ? 'ultboom' : best.tal.tier >= 3 ? 'gong' : best.tal.tier >= 1 ? 'learn' : 'ring');
    if (best.tal.tier >= 4) toast(`${TIERS[best.tal.tier].name} talent: ${best.tal.name}!`);
    buildTalents(); refreshJade();
  };
  if (skipNow) land(); else flick();
}

function toggleTalent(id) {
  const T = state.talents, at = T.equipped.indexOf(id);
  if (at >= 0) T.equipped.splice(at, 1);
  else if (fitsSlots(id)) T.equipped.push(id);
  else { toast(`${TALENT_BY_ID[id].name} needs ${TALENT_BY_ID[id].slots} free slots (${TALENT_SLOTS - slotsUsed()} left): remove something first`); return; }
  buildTalents(); saveStore();
}

function buildTalents() {
  const T = state.talents;
  const slots = $('talSlots');
  slots.innerHTML = '';
  // ten slots: each equipped talent spans as many as it takes
  for (const id of T.equipped) {
    const t = TALENT_BY_ID[id], el = document.createElement('button');
    el.className = 'tal-slot full'; el.style.gridColumn = `span ${t.slots}`; el.style.borderColor = TIERS[t.tier].color;
    el.innerHTML = `<span class="ts-name">${t.name}</span><span class="mini">${t.slots} slot${t.slots > 1 ? 's' : ''} · remove</span>`;
    el.onclick = () => toggleTalent(t.id);
    slots.appendChild(el);
  }
  for (let i = slotsUsed(); i < TALENT_SLOTS; i++) { const el = document.createElement('div'); el.className = 'tal-slot'; el.innerHTML = '<span class="mini">·</span>'; slots.appendChild(el); }
  $('talCap').textContent = `${slotsUsed()} / ${TALENT_SLOTS} slots`;
  const list = $('talentList');
  list.innerHTML = '';
  for (let tier = TIERS.length - 1; tier >= 0; tier--) {
    const all = TALENTS.filter(t => t.tier === tier), got = all.filter(t => T.owned[t.id]);
    const head = document.createElement('div');
    head.className = 'tal-tier'; head.style.color = tier === 0 ? '#888' : TIERS[tier].color;
    head.textContent = `${TIERS[tier].name} ${got.length}/${all.length}`;
    list.appendChild(head);
    for (const t of all) {
      const row = document.createElement('div'), own = !!T.owned[t.id], eq = T.equipped.includes(t.id);
      row.className = 'tal-row' + (own ? '' : ' locked') + (eq ? ' eq' : '');
      row.style.borderLeftColor = own ? TIERS[tier].color : '#e5e5e5';
      const pips = '<span class="tl-slots" title="slots it takes">' + '■'.repeat(t.slots) + '</span>';
      row.innerHTML = own ? `<span class="tl-name">${t.name}${pips}</span><span class="tl-eq">${eq ? 'equipped' : ''}</span><span class="tl-desc">${t.desc}${t.from ? ` <i>(after ${t.from})</i>` : ''}</span>` : `<span class="tl-name">???${pips}</span><span></span>`;
      if (own) row.onclick = () => toggleTalent(t.id);
      list.appendChild(row);
    }
  }
  const total = TIERS.reduce((a, t) => a + t.odds, 0);
  $('talOdds').textContent = TIERS.map(t => `${t.name} ${Math.round(t.odds / total * 1000) / 10}%`).join(', ');
}

// ---------- panels: the dock opens one at a time beside the arena ----------
const PANEL_KEY = 'neuroArena.panel';

function openPanel(id) {
  const cur = document.querySelector('#drawer .panel:not([hidden])');
  const next = cur && cur.id === id ? null : id; // clicking the open one closes it
  document.querySelectorAll('#drawer .panel').forEach(el => { el.hidden = el.id !== next; });
  document.querySelectorAll('#dock button').forEach(b => b.classList.toggle('on', b.dataset.panel === next));
  document.querySelector('.layout').classList.toggle('panel-open', !!next);
  if (next === 'abilitiesSection') buildAbilities();
  if (next === 'skinSection') buildSkins();
  if (next === 'portalPanel') renderPortal();
  if (next === 'codexPanel') renderCodex();
  if (next) $('drawer').scrollTop = 0;
  state.chartDirty = true;
  try { localStorage.setItem(PANEL_KEY, next || ''); } catch (e) { /* remembered only when storage works */ }
}

function bindPanels() {
  document.querySelectorAll('#dock button').forEach(b => b.addEventListener('click', () => openPanel(b.dataset.panel)));
  document.querySelectorAll('#drawer [data-close]').forEach(b => b.addEventListener('click', () => openPanel(b.closest('.panel').id)));
  $('jadeBal').addEventListener('click', () => { if ($('talentSection').hidden) openPanel('talentSection'); });
  window.addEventListener('keydown', e => {
    if (e.code !== 'Escape') return;
    const cur = document.querySelector('#drawer .panel:not([hidden])');
    if (cur) openPanel(cur.id);
  });
  let saved = '';
  try { saved = localStorage.getItem(PANEL_KEY) || ''; } catch (e) { /* none */ }
  if (saved && $(saved)) openPanel(saved);
}

function boot() {
  const saved = loadStore();
  let agent = null;
  if (saved) {
    Object.assign(state.cfg, saved.cfg || {});
    state.cfg.learning = { ...DEFAULT_LEARNING, ...(saved.cfg && saved.cfg.learning) };
    state.cfg.roster = (state.cfg.roster || []).filter(t => ROSTER.includes(t) || BOSSES.includes(t));
    Object.assign(state.rewards, saved.rewards || {});
    state.lives = (saved.lives || []).map(unpackLife);
    state.livesTotal = saved.livesTotal || state.lives.length;
    state.trials = saved.trials || {};
    state.vault = (saved.vault || []).filter(v => validAgentJSON(v.agent));
    const sb = saved.cfg && saved.cfg.battle;
    if (sb && Array.isArray(sb.slots) && sb.slots.length === 10) {
      state.cfg.battle = { ...sb, slots: sb.slots.map(sl => ({ team: sl.team || 0, kind: sl.kind === 'empty' || sl.kind === 'ai' || sl.kind === 'you' || ENEMY_TYPES[sl.kind] ? sl.kind : 'empty' })) };
    } else state.cfg.battle = JSON.parse(JSON.stringify(DEFAULT_BATTLE));
    applyProfile({ ...saved, manual: null, abilityMode: null }); // the browser's save keeps those in its settings
    if (validAgentJSON(saved.agent)) { agent = PPOAgent.fromJSON(saved.agent); Object.assign(agent.cfg, state.cfg.learning); }
  }
  setAgent(agent || new PPOAgent(state.cfg.learning, Math.floor(Math.random() * 1e9)));
  refreshLevel(false);

  // each panel is built on its own: one that trips over an odd save must not stop the fighter from training or fighting
  const safely = (what, fn) => { try { fn(); } catch (e) { console.error(what, e); toast(`Couldn't build ${what}: ${e.message}`); } };
  safely('settings', buildSettings);
  safely('the vault', buildVault);
  safely('trials', renderTrials);
  safely('abilities', buildAbilities);
  safely('talents', buildTalents);
  safely('skins', buildSkins);
  safely('talent spins', () => {
    $('spin1').addEventListener('click', () => spin(1));
    $('spin10').addEventListener('click', () => spin(10));
    $('skipSpin').checked = skipSpin();
    $('skipSpin').addEventListener('change', e => { try { localStorage.setItem(SKIP_KEY, e.target.checked ? '1' : '0'); } catch (err) { /* remembered only when storage works */ } });
  });
  safely('jade', refreshJade);
  safely('the portal', renderPortal);
  safely('battles', buildBattle);
  $('battleStart').addEventListener('click', () => setMode('battle'));
  bindRange('battleTime', () => state.cfg.battle.time, v => { state.cfg.battle.time = v; }, v => v + 's');
  sfx.enabled = state.cfg.sound;
  const soundBtn = $('soundBtn');
  const showSound = () => { soundBtn.textContent = state.cfg.sound ? 'Sound on' : 'Sound off'; soundBtn.classList.toggle('on', state.cfg.sound); };
  showSound();
  soundBtn.addEventListener('click', () => { state.cfg.sound = !state.cfg.sound; sfx.enabled = state.cfg.sound; sfx.unlock(); showSound(); saveStore(); });
  const musicBtn = $('musicBtn');
  const showMusic = () => { musicBtn.textContent = state.cfg.music ? 'Music on' : 'Music off'; musicBtn.classList.toggle('on', state.cfg.music); };
  showMusic();
  musicBtn.addEventListener('click', () => {
    state.cfg.music = !state.cfg.music;
    state.cfg.music ? music.start() : music.stop();
    showMusic(); saveStore();
  });
  // browsers only allow audio after the first click or key press
  const firstGesture = () => { sfx.unlock(); if (state.cfg.music) music.start(); };
  window.addEventListener('pointerdown', firstGesture, { once: true });
  window.addEventListener('keydown', firstGesture, { once: true });
  bindPanels();
  $('trainBtn').addEventListener('click', () => setTraining(!state.training));
  $('pauseBtn').addEventListener('click', () => { state.view.paused = !state.view.paused; refreshPauseBtn(); });
  document.querySelectorAll('#modeSeg button').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
  document.querySelectorAll('#speedSeg button').forEach(b => b.addEventListener('click', () => setSpeed(b.dataset.speed === 'max' ? 'max' : +b.dataset.speed)));
  $('metric').addEventListener('change', () => { state.chartDirty = true; });
  window.addEventListener('resize', () => { state.chartDirty = true; });
  setMode('train');

  let last = performance.now(), lastDom = 0, lastBrain = 0, lastBig = 0;
  function step(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const v = state.view;
    if (state.training) runTraining(dt, now);

    if (v.mode === 'train') {
      if (state.speed !== 'max') {
        const sim = state.trainer.sim;
        if (sim !== state.lastTrainSim) {
          state.lastTrainSim = sim;
          renderer.reset();
          if (state.training) renderer.banner = { text: 'LIFE ' + ((state.livesTotal || 0) + 1), life: 1.0 };
        }
        const label = state.trainer.updating ? 'LEARNING' : 'LIFE ' + ((state.livesTotal || 0) + 1);
        renderer.draw(sim, state.training && !v.paused ? dt : 0, { label, labelColor: state.trainer.updating ? '#e8c34a' : '#ece4d2', paused: v.paused, sound: state.speed <= 4 });
      } else if (now - lastBig > 300) {
        lastBig = now; drawChart($('bigChart'));
      }
    } else {
      updateView(dt);
      const r = state.campaign.run, room = curRoom();
      const label = { watch: 'WATCH', trial: 'TRIAL', spar: 'SPAR', play: 'YOU', battle: v.sim.p && v.sim.p.dead ? 'WATCHING' : 'BATTLE',
        campaign: room ? (room.kind === 'boss' ? 'BOSS' : `ROOM ${r.idx + 1}/${r.rooms.length}`) : 'JAR' }[v.mode];
      renderer.draw(v.sim, v.paused ? 0 : dt, { label, labelColor: v.mode === 'play' ? '#e8c34a' : '#ece4d2', overlay: v.overlay, paused: v.paused, sound: state.speed === 'max' || state.speed <= 4 });
    }

    if (now - lastBrain > 150 && !$('brainSection').hidden) { lastBrain = now; updateBrain(); }
    if (now - lastDom > 300) {
      lastDom = now;
      refreshJade();
      updateReadouts();
      if (!$('identitySection').hidden) renderIdentity();
      if (!$('killsSection').hidden) renderKills();
      if (!$('codexPanel').hidden) renderCodex();
      if (state.chartDirty) { drawChart($('chart')); state.chartDirty = false; }
    }
  }
  // a frame that throws must not stop the game for good: report it (once per kind of error) and carry on
  const reported = new Set();
  function frame(now) {
    try { step(now); } catch (e) {
      console.error(e);
      if (!reported.has(e.message)) { reported.add(e.message); toast(`Something broke: ${e.message}. The game kept going; tell Claude this message.`); }
      try { if (state.training && state.trainer) state.trainer.newEpisode(); } catch (e2) { /* the next frame tries again */ } // a broken fight is dropped; the next one starts fresh
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

boot();
