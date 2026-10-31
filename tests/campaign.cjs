// Campaign checks: every world's runs obey the grouping rules, and every kind of room (bosses too) plays to an end.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ctx = vm.createContext({ console, assert });
vm.runInContext(['agent', 'sim', 'campaign'].map(n => fs.readFileSync(`${__dirname}/../js/${n}.js`, 'utf8')).join('\n') + `
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
      for (const t of types) assert.ok(ENEMY_TYPES[t] && !ENEMY_TYPES[t].summon, w.id + ': unknown foe ' + t);
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
