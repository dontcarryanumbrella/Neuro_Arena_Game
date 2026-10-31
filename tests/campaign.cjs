// Campaign checks: every world's runs obey the grouping rules, every kind of room (bosses too) plays to an end,
// the story covers every world and foe, and the Sword Immortal of the Peaks teaches instead of killing.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ctx = vm.createContext({ console, assert });
vm.runInContext(['agent', 'sim', 'campaign', 'lore'].map(n => fs.readFileSync(`${__dirname}/../js/${n}.js`, 'utf8')).join('\n') + `
// the grouping rules, over many runs of every world
let rooms = 0;
for (const w of WORLDS) {
  assert.ok(roomPlan(w).length, w.id + ' has rooms');
  for (let seed = 1; seed <= 300; seed++) {
    const run = buildRun(w.id, seed);
    for (const room of run.rooms) {
      rooms++;
      const types = room.foes.map(foeType);
      assert.ok(types.length >= 1, w.id + ': an empty room');
      for (const t of types) assert.ok(isFoeType(t), w.id + ': not a world foe: ' + t);
      if (room.kind === 'boss') { assert.equal(types.length, 1, w.id + ': bosses fight alone'); assert.ok(ENEMY_TYPES[types[0]].boss); continue; }
      assert.ok(types.every(t => !ENEMY_TYPES[t].boss), w.id + ': a boss in a normal room');
      const kinds = new Set(types);
      if (kinds.size === 1) assert.ok(types.length <= 4, w.id + ': more than 4 of one kind');
      else assert.ok(types.length <= 3, w.id + ': a mixed group of more than 3');
      assert.ok(types.filter(t => ENEMY_TYPES[t].role === 'colossus').length <= 2, w.id + ': too many colossi');
      assert.ok(slotsOf(types) <= 4, w.id + ': a group too big for the ring');
      if (room.kind === 'elite') assert.ok(room.foes[0].elite && room.foes[0].hp > 1);
    }
    assert.deepEqual(buildRun(w.id, seed).rooms, run.rooms, 'a run is the same for the same seed');
  }
}
// every boss is a seal, and the hidden worlds hide until the keeper falls
assert.equal(ALL_SEALS.length, 15);
assert.equal(new Set(ALL_SEALS).size, 15);
const c = freshCampaign();
assert.ok(!WORLDS.filter(w => w.hidden).some(w => worldVisible(c, w)));
c.seals.timeadmin = 1;
assert.ok(WORLDS.filter(w => w.hidden).every(w => worldVisible(c, w)));
// the promoted foes: real foes now, with words for the Codex and their boost in the rooms
assert.deepEqual(PROMOTED.slice().sort(), ['bloater', 'brute', 'butcher', 'chessist', 'coffinbearer', 'courtier', 'flutist', 'general', 'inkdragon', 'lampbearer', 'spitter', 'zergling']);
for (const t of PROMOTED) assert.ok(ENEMY_TYPES[t].passive && ENEMY_TYPES[t].active, t + ' needs Codex text');
assert.ok(buildRun('abyss', 3).rooms.some(r => r.foes.some(f => typeof f === 'object' && ['zergling', 'spitter', 'bloater', 'brute'].includes(f.type) && f.hp > 1)) || [1, 2, 4, 5, 6].some(s => buildRun('abyss', s).rooms.some(r => r.foes.some(f => typeof f === 'object' && f.type === 'zergling'))), 'the brood arrives boosted');
// the story: every world has a vignette, every foe a Codex line, and the fragment tracks fit the worlds
for (const w of WORLDS) assert.ok(WORLD_VIGNETTES[w.id], w.id + ' needs a vignette');
for (const t of [...ROSTER, ...BOSSES, ...PROMOTED]) assert.ok(CODEX_LORE[t], t + ' needs a Codex line');
assert.equal(FRAGMENT_TRACKS.outer.length, WORLDS.filter(w => !w.hidden && w.id !== 'timestream').length);
assert.equal(FRAGMENT_TRACKS.hidden.length, WORLDS.filter(w => w.hidden).length);
for (const k of [...FRAGMENT_TRACKS.outer, ...FRAGMENT_TRACKS.hidden, 't']) assert.ok(FRAGMENTS[k], 'missing fragment ' + k);
// recommended levels climb with the tiers
for (const w of WORLDS) for (const o of WORLDS) if (o.tier > w.tier) assert.ok(recommendedLevel(o) > recommendedLevel(w), o.id + ' should expect more than ' + w.id);

// play rooms through the sim: a restless fighter, so the foes get to use everything they have
function play(room, seed, secs) {
  const sim = new Sim('room', seed, { waves: [room.foes], timeLimit: secs, fighter: { hp: 300, energy: 300, energyRegen: 30, posture: 250 } });
  const rand = mulberry32(seed);
  let a = null;
  for (let i = 0; !sim.done && i < secs * 60 + 10; i++) {
    if (i % 4 === 0) a = toSimAction(Math.floor(rand() * 9), Math.floor(rand() * 6));
    sim.step(a);
  }
  assert.ok(sim.done, 'a room must end');
  for (const e of sim.enemies) assert.ok(Number.isFinite(e.hp) && Number.isFinite(e.x), 'a foe broke: ' + e.type);
  return sim;
}
// tuning reaches the foe: a boss arrives with its campaign health
const tuned = new Sim('room', 1, { waves: [[{ type: 'warlord', hp: 0.5, dmg: 0.5 }]], timeLimit: 5 });
for (let i = 0; i < 120; i++) tuned.step(null);
const wl = tuned.enemies.find(e => e.type === 'warlord');
assert.equal(wl.maxHp, Math.round(Math.round(ENEMY_TYPES.warlord.hp * 0.85) * 0.5));
assert.equal(wl.tuneDmg, 0.5);
// the teacher: the Peaks' boss room marks him; he hits with no true damage and yields at a tenth of his health
const peaksBoss = buildRun('peaks', 1).rooms.find(r => r.kind === 'boss');
assert.ok(peaksBoss.foes[0].teacher, 'the Sword Immortal of the Peaks is a teacher');
const lesson = new Sim('room', 2, { waves: [peaksBoss.foes], timeLimit: 30, fighter: { hp: 300, energy: 300, energyRegen: 30, posture: 250 } });
for (let i = 0; i < 90; i++) lesson.step(null);
const si = lesson.enemies.find(e => e.type === 'swordsaint');
assert.ok(si.teacher && si.specials.every(s => s.wind > 0));
lesson.dealDamage(si, si.hp * 0.6, lesson.p, 0, 0, 0);
for (let i = 0; i < 400 && si.phase !== 2; i++) lesson.step(null);
assert.equal(si.phase, 2, 'he takes his second form');
assert.ok(si.specials.every(s => [9, 10, 11, 12].includes(s.sword)), 'the lesson is the Ninth to the Twelfth');
assert.equal(si.specials.find(s => s.sword === 10).count, 14, 'drawn smaller');
lesson.dealDamage(si, si.hp - si.maxHp * 0.05, lesson.p, 0, 0, 0);
assert.ok(si.yielded && si.hp <= 0, 'he yields instead of being held up by the manual');
assert.ok(!si.deathBound, 'no Unfinished Manual for a teacher');
const real = new Sim('room', 2, { waves: [['swordsaint']], timeLimit: 30 });
for (let i = 0; i < 90; i++) real.step(null);
assert.ok(!real.enemies.find(e => e.type === 'swordsaint').teacher, 'elsewhere he is not holding back');
let played = 0, ended = {};
for (const w of WORLDS) {
  const run = buildRun(w.id, 11);
  run.rooms.forEach((room, i) => {
    const sim = play(room, 100 + i, room.kind === 'boss' ? 25 : 15);
    played++; ended[sim.stats.result] = (ended[sim.stats.result] || 0) + 1;
  });
}
console.log('Campaign: ' + rooms + ' rooms rolled within the rules, ' + played + ' rooms played to an end ' + JSON.stringify(ended) + '.');
`, ctx);
