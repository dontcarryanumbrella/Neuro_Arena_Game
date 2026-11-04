// The Jar: worlds sealed inside it, the rooms of a run through one, and the spawner that fills each room.
// No DOM here (the tests load it with sim.js). Loaded after sim.js; main.js drives the runs.

// How dangerous a foe is alone, roughly: a bandit is 1. A guess from its body and kit (promoted foes are repriced
// with their boost below).
const THREAT = (() => {
  const raw = t => {
    const d = ENEMY_TYPES[t], m = d.moves || BASE_MOVES;
    const body = Math.pow(d.hp / 50, 0.75), hit = (m.strike.dmg + m.heavy.dmg * 0.5) / 21;
    const kit = 1 + 0.12 * (d.specials || []).length, role = { colossus: 0.85, caster: 1.1, trickster: 1.05 }[d.role] || 1; // colossi are big, slow targets
    return body * hit * kit * role;
  };
  const base = raw('bandit'), out = {};
  for (const t of Object.keys(ENEMY_TYPES)) out[t] = Math.round(raw(t) / base * 100) / 100;
  return out;
})();

// A group is worth more than its parts: each extra foe adds 15%.
const GROUP_STEP = 0.15;
const groupThreat = types => types.reduce((s, t) => s + THREAT[t], 0) * (1 + GROUP_STEP * (types.length - 1));
const isColossus = t => ENEMY_TYPES[t].role === 'colossus';

// Campaign tuning per boss: health and damage, so each lands at its tier whatever its base strength.
// The Sword Immortal of the Myriad Sword Peaks is a teacher: he holds back (see Sim.makeTeacher).
const BOSS_TUNE = {
  warlord: { hp: 0.8, dmg: 0.75 }, deadeye: { hp: 0.85, dmg: 0.8 },
  abbot: { hp: 0.9, dmg: 0.9 }, jaderabbit: { hp: 0.9, dmg: 0.8 }, lifetree: { hp: 0.95, dmg: 0.9 }, vampirelord: { hp: 0.95, dmg: 0.9 }, lich: { hp: 0.95, dmg: 0.9 },
  swordsaint: { hp: 0.8, dmg: 0.6 }, zergqueen: { hp: 1, dmg: 1 }, ancestor: { hp: 1, dmg: 0.95 },
  blind: { hp: 1, dmg: 0.95 }, tamamo: { hp: 1, dmg: 1 }, emperor: { hp: 1, dmg: 1 }, sunvenerable: { hp: 1, dmg: 1 }, moonvenerable: { hp: 1, dmg: 1 }, wukong: { hp: 0.9, dmg: 0.9 },
  timeadmin: { hp: 1.15, dmg: 1.1 },
  gojo: { hp: 1.1, dmg: 1.1 }, mahoraga: { hp: 1.05, dmg: 1.05 }, scholar: { hp: 1.1, dmg: 1 }, yellowking: { hp: 1.1, dmg: 1.1 },
};

// The room plans of each tier: kind and threat budget, in order (bosses come after them).
const TIER_ROOMS = {
  2: [['skirmish', 2.6], ['pack', 5], ['warband', 4.2], ['skirmish', 3.8], ['elite', 4.4]],
  3: [['skirmish', 3.2], ['pack', 6.4], ['warband', 5], ['skirmish', 4.6], ['warband', 5.6], ['elite', 5.8]],
  4: [['skirmish', 3.8], ['pack', 7.6], ['warband', 5.8], ['skirmish', 5.4], ['warband', 6.4], ['elite', 6.8]],
  5: [['skirmish', 4.4], ['pack', 8.4], ['warband', 6.4], ['skirmish', 6], ['warband', 7.2], ['pack', 9], ['elite', 7.8]],
  6: [['skirmish', 4.8], ['pack', 9], ['warband', 7], ['skirmish', 6.6], ['warband', 7.8], ['pack', 9.6], ['elite', 8.4]],
};
const EXPLORE_JADE = { 1: 150, 2: 300, 3: 500, 4: 750, 5: 1000, 6: 1200 };   // first clears of a world's rooms, shared between them
const BOSS_JADE = { 1: 400, 2: 700, 3: 1000, 4: 1500, 5: 2000, 6: 2500 };     // a boss's first defeat
const REPEAT_SHARE = 0.25;                                                    // a repeat run pays this much of the exploration jade
const ROOM_TIME = 90, BOSS_TIME = 180, HIDDEN_BOSS_TIME = 240;

// Pool entries: [type, weight, most of it in one room, flags]. 'elite' foes only appear in elite rooms;
// a stretch name keeps a foe to one part of a world (the Last Frontier's badlands and town); hp and dmg boost a foe
// promoted from a boss's retinue to a world's own (a zergling alone is a mouthful, not a fight).
const p = (type, w, pack, o = {}) => ({ type, w, pack, ...o });

const WORLDS = [
  {
    id: 'frontier', name: 'The Last Frontier', tier: 1, color: '#c8873a',
    blurb: 'Badlands where the law ran out, then a frontier town at the end of the road.',
    pool: [
      p('bandit', 4, 4, { stretch: 'badlands' }), p('berserker', 2, 2, { stretch: 'badlands' }), p('boxer', 2, 2, { stretch: 'badlands' }),
      p('bandit', 1, 4, { stretch: 'town' }), p('fencer', 2, 2, { stretch: 'town' }), p('gunslinger', 2, 3, { stretch: 'town' }), p('sniper', 2, 2, { stretch: 'town' }),
      p('archer', 2, 2, { stretch: 'town' }), p('alchemist', 2, 2, { stretch: 'town' }),
      p('crab', 2, 1, { stretch: 'town', elite: true }), p('mutant', 2, 1, { stretch: 'town', elite: true }),
    ],
    // the first world teaches one thing at a time, so its rooms are laid out by hand
    rooms: [['skirmish', 1.2, 'badlands'], ['pack', 2.8, 'badlands'], ['warband', 3, 'badlands'], ['boss', 'warlord'],
      ['skirmish', 2.2, 'town'], ['pack', 5.4, 'town'], ['warband', 3.4, 'town'], ['elite', 3.6, 'town'], ['boss', 'deadeye']],
  },
  {
    id: 'temple', name: 'Red Dust Temple', tier: 3, color: '#d9a441', bosses: ['abbot', 'wukong'],
    blurb: 'A mountain temple above the red dust, where every courtyard is a lesson in patience.',
    pool: [p('buddhist', 3, 3), p('taichi', 3, 2), p('drunk', 2, 2), p('staffmonk', 3, 4), p('arhat', 2, 1), p('macaque', 3, 4), p('greatape', 2, 1), p('sweepingmonk', 2, 1, { elite: true })],
  },
  {
    id: 'night', name: 'Night Country', tier: 2, color: '#9a2a3a', bosses: ['vampirelord', 'lich'],
    blurb: 'A country where the sun stopped rising. Its lords are still at court.',
    pool: [p('zombie', 4, 4), p('werewolf', 2, 2), p('vampire', 2, 2), p('necromancer', 2, 1), p('spider', 2, 1), p('gargoyle', 2, 1), p('ghoul', 3, 4)],
  },
  {
    id: 'forest', name: 'Primordial Forest', tier: 2, color: '#7ab86a',
    blurb: 'A forest older than names: beasts, giants out of deep time, and the elves who keep the Life Tree.',
    pool: [
      p('raptor', 4, 4, { stretch: 'wildwood' }), p('serpent', 3, 3, { stretch: 'wildwood' }), p('roc', 2, 2, { stretch: 'wildwood' }),
      p('tiger', 3, 3, { stretch: 'wildwood', hp: 1.4, dmg: 1.1 }), p('bear', 2, 2, { stretch: 'wildwood', hp: 1.4, dmg: 1.1 }), p('bunny', 2, 4, { stretch: 'wildwood', hp: 2 }),
      p('druid', 2, 1, { stretch: 'wildwood' }), p('triceratops', 1, 1, { stretch: 'wildwood' }),
      p('drake', 2, 1, { stretch: 'wildwood', elite: true }), p('trex', 2, 1, { stretch: 'wildwood', elite: true }), p('tortoise', 2, 1, { stretch: 'wildwood', elite: true }),
      p('elfranger', 3, 3, { stretch: 'grove' }), p('elfsentinel', 3, 2, { stretch: 'grove' }), p('elfspellweaver', 2, 1, { stretch: 'grove' }),
      p('tiger', 1, 2, { stretch: 'grove', hp: 1.4, dmg: 1.1 }), p('treant', 2, 1, { stretch: 'grove', elite: true }),
    ],
    // the Wildwood of beasts and giants, the Rabbit at its edge; then the Elven Grove, and the tree at its heart
    rooms: [['skirmish', 2.6, 'wildwood'], ['pack', 4.6, 'wildwood'], ['warband', 4.2, 'wildwood'], ['elite', 4.4, 'wildwood'], ['boss', 'jaderabbit'],
      ['skirmish', 3.4, 'grove'], ['pack', 5, 'grove'], ['warband', 4.6, 'grove'], ['elite', 4.8, 'grove'], ['boss', 'lifetree']],
  },
  {
    id: 'peaks', name: 'Myriad Sword Peaks', tier: 3, color: '#9fd8ff', bosses: ['swordsaint'],
    blurb: 'Ten thousand peaks, a sword on every one. One old master still teaches here.', teacher: 'swordsaint',
    pool: [p('cultivator', 4, 3), p('talisman', 3, 2), p('formation', 3, 2), p('spearmaster', 3, 2), p('disciple', 4, 4)],
  },
  {
    id: 'abyss', name: 'Netherworld Abyss', tier: 3, color: '#7a3ad9', bosses: ['zergqueen', 'ancestor'],
    blurb: 'A world of pits beneath pits, and the brood that eats its way up.',
    pool: [p('demon', 2, 1), p('westdragon', 1, 1), p('golem', 2, 1), p('reaper', 3, 2), p('imp', 3, 4), p('hellhound', 3, 3),
      p('zergling', 4, 4, { hp: 2.5, dmg: 1.3 }), p('spitter', 2, 3, { hp: 2.5, dmg: 1.2 }), p('bloater', 2, 3, { hp: 2.5, dmg: 1.2 }), p('brute', 2, 2, { hp: 1.5, dmg: 1.1 })],
  },
  {
    id: 'isles', name: 'Eastern Isles', tier: 4, color: '#e86a8a', bosses: ['tamamo', 'blind'],
    blurb: 'Islands of falling petals and old blades. Something with eight heads sleeps in the bay.',
    pool: [p('samurai', 4, 3), p('ninja', 3, 4), p('oni', 2, 1), p('magician', 2, 1), p('hydra', 1, 1), p('shifter', 2, 1), p('yukionna', 2, 1), p('tengu', 2, 2)],
  },
  {
    id: 'heavens', name: 'The Nine Heavens', tier: 4, color: '#ffd84a', bosses: ['emperor', 'sunvenerable'],
    blurb: 'The celestial court, nine layers up. Someone already tore through it once.',
    pool: [p('angel', 3, 2), p('paladin', 3, 2), p('phoenix', 1, 1), p('eastdragon', 1, 1), p('djinn', 2, 2), p('general', 3, 3, { hp: 1.6, dmg: 1.2 }),
      p('frostmaiden', 2, 1), p('tiangou', 3, 2), p('shadeattendant', 2, 2), p('qilin', 2, 1, { elite: true }), p('jadetoad', 2, 1, { elite: true })],
  },
  {
    id: 'timestream', name: 'Timestream', tier: 5, color: '#5fe0e0', bosses: ['timeadmin'],
    blurb: 'A river of broken moments. The keeper of the jar lives here.',
    pool: [p('cyborg', 3, 3), p('gravmage', 3, 2), p('swarmdrone', 4, 4), p('sentry', 3, 2), p('chronomancer', 2, 1), p('glitch', 2, 1), p('twin', 2, 2)],
  },
  {
    id: 'cursed', name: 'Cursed Domain', tier: 6, hidden: true, color: '#3a2a6a', bosses: ['gojo', 'mahoraga'],
    blurb: 'Curses breed where fear pools. Two powers older than the jar wait at its heart.',
    pool: [p('flyhead', 4, 4), p('cspirit', 3, 4), p('ccorpse', 2, 1), p('strawdoll', 2, 1), p('cspeech', 2, 1), p('shikigami', 2, 2)],
  },
  {
    id: 'blacksea', name: 'Black Sea', tier: 6, hidden: true, color: '#1a1a1a', bosses: ['scholar'],
    blurb: 'A shore between worlds. Far out on the water, lights move in the dark.',
    pool: [p('chessist', 3, 2, { hp: 3, dmg: 1.4 }), p('lampbearer', 2, 2, { hp: 3, dmg: 1.4 }), p('butcher', 3, 2, { hp: 3, dmg: 1.4 }),
      p('coffinbearer', 2, 2, { hp: 2.4, dmg: 1.4 }), p('flutist', 2, 2, { hp: 3, dmg: 1.4 }), p('inkdragon', 2, 1, { hp: 3, dmg: 1.3, elite: true })],
  },
  {
    id: 'pallid', name: 'The Pallid Kingdom', tier: 6, hidden: true, color: '#e8d24a', bosses: ['yellowking'],
    blurb: 'A court under twin suns by a lake of cloud. Bells ring. Everyone wears a mask.',
    pool: [p('courtier', 3, 4, { hp: 3, dmg: 1.5 }), p('cultist', 3, 2), p('byakhee', 2, 2), p('dancer', 2, 2), p('pknight', 2, 1), p('horror', 1, 1)],
  },
];
const WORLD_BY_ID = Object.fromEntries(WORLDS.map(w => [w.id, w]));
// The finale is not a world with a seal of its own.
WORLD_BY_ID.bottom = { id: 'bottom', name: 'The Bottom of the Jar', color: '#b9a88d', tier: 6 };
WORLD_BY_ID.summit = { id: 'summit', name: "Heaven's End Summit", color: '#c7def3', tier: 6 };
const HIDDEN_KEY_BOSS = 'timeadmin'; // the keeper: the hidden worlds show themselves once it falls

const worldBosses = w => w.bosses || w.rooms.filter(r => r[0] === 'boss').map(r => r[1]);
const ALL_SEALS = WORLDS.flatMap(worldBosses);
// every foe a world can put in a room (bosses aside)
const worldFoes = w => [...new Set(w.pool.map(e => e.type))];

// Foes promoted from the bosses' retinues to worlds of their own: the Heavenly General, the abyss brood, the
// Scholar's heads and the yellow court's puppet. Everywhere a foe counts (met, felled, level, the Codex), they count.
const PROMOTED = [...new Set(WORLDS.flatMap(worldFoes))].filter(t => ENEMY_TYPES[t].summon);
const isFoeType = t => !!ENEMY_TYPES[t] && (!ENEMY_TYPES[t].summon || PROMOTED.includes(t));
const boostOf = (w, t) => w.pool.find(e => e.type === t && (e.hp || e.dmg));
for (const w of WORLDS) for (const e of w.pool) if (e.hp || e.dmg) THREAT[e.type] = Math.round(THREAT[e.type] * Math.pow(e.hp || 1, 0.75) * (e.dmg || 1) * 100) / 100;
// what the Codex and the Pavilion say about them (as a boss's minions they never needed words)
const PROMOTED_TEXT = {
  general: [['Gatekeeper', 'Holds its ground with a heavenly halberd; drilled to fight beside its own.'], ['Sweep and Thrust', 'Plain, disciplined spear work.']],
  zergling: [['Swarm', 'Small and fast; never alone.'], ['Bite', 'Quick bites that add up.']],
  spitter: [['Back Rank', 'Hangs back behind the swarm.'], ['Spine Spit', 'Spits acid spines from range.']],
  bloater: [['Volatile', 'Swells as it closes in.'], ['Detonate', 'Bursts into acid beside you.']],
  brute: [['Horned Wall', 'Armoured, heavy, hard to stop.'], ['Gore', 'A charging horn that throws you.']],
  chessist: [['Opening Theory', 'Plays the board around you.'], ['Chess Pieces', 'Sets pieces down that strike where they stand.']],
  lampbearer: [['Light in the Ink', 'Keeps its distance, lamp held high.'], ['Lamp Fire', 'Throws fire from the lamp.']],
  butcher: [['Headsman', 'Wades in with a great axe.'], ['Cleave', 'A heavy, sweeping chop.']],
  coffinbearer: [['Pallbearer', 'Hides behind its coffin.'], ['Coffin Slam', 'Brings the coffin down on you.']],
  flutist: [['The Song', 'Plays from afar; the painting listens.'], ['Melody', 'Notes that cut.']],
  courtier: [['Marionette', 'Latches onto a nearby enemy and drains health.'], ['Yellow Strings', 'Drains 2 health every 0.5s while attached; fades after 10s.']],
  tiger: [['Striped Hunter', 'Circles, then pounces through your guard.'], ['Pounce', 'A leap that breaks guard.']],
  bear: [['Heavy Paws', 'Slow, and hits like a falling tree.'], ['Maul', 'Big swings that throw you back.']],
  bunny: [['Quick', 'Small and fast; never alone.'], ['Nibble', 'Tiny bites that add up.']],
  inkdragon: [['One Stroke', 'A dragon painted in one stroke of ink.'], ['Ink Breath', 'Breathes a cone of black ink.']],
};
for (const t of PROMOTED) { const tx = PROMOTED_TEXT[t]; if (tx && !ENEMY_TYPES[t].passive) { ENEMY_TYPES[t].passive = tx[0]; ENEMY_TYPES[t].active = tx[1]; } }
// the room plan of a world: its hand-made list, or its tier's plan with the bosses at the end (an empty pool has only bosses)
const roomPlan = w => w.rooms || [...(w.pool.length ? TIER_ROOMS[w.tier] : []), ...w.bosses.map(b => ['boss', b])];

// The level a world expects: a hero that has felled everything in the earlier tiers arrives at it.
function recommendedLevel(w) {
  const before = new Set();
  for (const o of WORLDS) if (o.tier < w.tier) { worldFoes(o).forEach(t => before.add(t)); worldBosses(o).forEach(t => before.add(t)); }
  return 1 + before.size;
}

function freshCampaign() {
  return { met: {}, kills: {}, worlds: {}, seals: {}, finales: [], finaleChoice: null, order: [], fragments: [], blackSeaArrivalSeen: false, snapshots: [], endingReady: false, endingSeen: false, fourteenthPage: false, swordUpgrade: false, previousSelf: null, finalVictorySnapshot: null, cycleHistory: [], run: null, cycle: 0 };
}

const worldVisible = (c, w) => !w.hidden || !!c.seals[HIDDEN_KEY_BOSS];

// ---------- the spawner ----------
function pickWeighted(list, rand) {
  const total = list.reduce((s, e) => s + e.w, 0);
  let r = rand() * total;
  for (const e of list) { r -= e.w; if (r < 0) return e; }
  return list[list.length - 1];
}

// Slots a group takes: a colossus fills two; at most four slots, and never more than two colossi.
const slotsOf = types => types.reduce((s, t) => s + (isColossus(t) ? 2 : 1), 0);
const fits = (types, budget) => groupThreat(types) <= budget * 1.1 && slotsOf(types) <= 4 && types.filter(isColossus).length <= 2;

// One room's foes, drawn at random within its threat budget and the grouping rules.
function rollRoom(w, kind, budget, stretch, rand) {
  const pool = w.pool.filter(e => (!stretch || e.stretch === stretch) && (kind === 'elite' || !e.elite));
  if (!pool.length) return [];
  const cheapest = pool.reduce((a, e) => (THREAT[e.type] < THREAT[a.type] ? e : a));
  const affordable = (have, list) => list.filter(e => fits([...have, e.type], budget));
  let group = [];
  if (kind === 'pack') {
    // up to four of one kind (as many as the budget allows, at least two)
    const packers = pool.filter(e => e.pack >= 2 && fits([e.type, e.type], budget));
    const e = packers.length ? pickWeighted(packers, rand) : cheapest;
    group = [e.type];
    while (group.length < Math.min(4, e.pack) && fits([...group, e.type], budget)) group.push(e.type);
  } else if (kind === 'warband') {
    // two or three different kinds, side by side
    while (group.length < 3) {
      const next = affordable(group, pool.filter(e => !group.includes(e.type)));
      if (!next.length) break;
      group.push(pickWeighted(next, rand).type);
    }
  } else if (kind === 'elite') {
    // one foe made stronger: the elite-only ones first, else the toughest it can afford are likeliest
    const strong = pool.filter(e => THREAT[e.type] * 1.6 <= budget * 1.1);
    const own = strong.filter(e => e.elite);
    const byThreat = list => list.map(e => ({ ...e, w: THREAT[e.type] ** 2 }));
    const e = own.length ? pickWeighted(own, rand) : strong.length ? pickWeighted(byThreat(strong), rand) : cheapest;
    const b = boostOf(w, e.type) || {};
    return [{ type: e.type, hp: 1.5 * (b.hp || 1), dmg: 1.2 * (b.dmg || 1), elite: true }];
  } else {
    // a skirmish: one foe, and a second if the budget has room
    const first = affordable([], pool);
    group = [(first.length ? pickWeighted(first, rand) : cheapest).type];
    const second = affordable(group, pool);
    if (second.length && rand() < 0.75) group.push(pickWeighted(second, rand).type);
  }
  return boost(w, group.length ? group : [cheapest.type]);
}

// a promoted foe arrives with its boost
const boost = (w, types) => types.map(t => { const e = boostOf(w, t); return e ? { type: t, hp: e.hp || 1, dmg: e.dmg || 1 } : t; });

// A run through a world: every room decided up front (so a retried room is the same room).
function campaignPlan(w, cycle = 0) {
  const plan = roomPlan(w).map(r => r.slice());
  if (cycle > 0 && w.pool.length) {
    const firstBoss = plan.findIndex(r => r[0] === 'boss');
    const source = plan.find(r => r[0] === 'elite') || plan.find(r => r[0] !== 'boss');
    const budget = source ? source[1] * (source[0] === 'elite' ? 1 : 1.5) : 5;
    const stretch = source && source[2];
    plan.splice(firstBoss < 0 ? plan.length : firstBoss, 0, ...Array.from({length: cycle}, () => ['elite', budget, stretch]));
  }
  return plan;
}

function buildRun(worldId, seed, cycle = 0) {
  const w = WORLD_BY_ID[worldId], rand = mulberry32(seed);
  const rooms = campaignPlan(w, cycle).map(([kind, x, stretch]) => {
    if (kind === 'boss') {
      const t = BOSS_TUNE[x] || {};
      const one = type => ({ type, hp: ((BOSS_TUNE[type] || t).hp || 1) * (1 + cycle * 0.15), dmg: ((BOSS_TUNE[type] || t).dmg || 1) * (1 + cycle * 0.15), teacher: w.teacher === type || undefined });
      const pair = ENEMY_TYPES[x].companion; // a pair (the Venerables) is one seal and one room
      return { kind, boss: x, foes: pair ? [one(x), one(pair)] : [one(x)], time: ENEMY_TYPES[x].bossTime || (w.tier >= 6 ? HIDDEN_BOSS_TIME : BOSS_TIME) };
    }
    const foes = rollRoom(w, kind, x * (1 + cycle * 0.1), stretch, rand).map(f => { const o = typeof f === 'string' ? { type: f } : { ...f }; o.hp = (o.hp || 1) * (1 + cycle * 0.15); o.dmg = (o.dmg || 1) * (1 + cycle * 0.15); if (cycle >= 3) o.modifier = ['shielded', 'swift', 'vampiric', 'explosive'][Math.floor(rand() * 4)]; return o; });
    return { kind, foes, time: ROOM_TIME };
  });
  return { world: worldId, seed, rooms, idx: 0, cleared: [] };
}

const foeType = f => typeof f === 'string' ? f : f.type;
