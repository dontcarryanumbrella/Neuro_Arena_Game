const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ctx = vm.createContext({ console, assert });
vm.runInContext(['agent', 'sim', 'campaign'].map(n => fs.readFileSync(`${__dirname}/../js/${n}.js`, 'utf8')).join('\n') + `
const brain = new PPOAgent({}, 123);
const snapshot = { lives: 50, agent: brain.toJSON(), fighter: { hp: 125, energy: 100, energyRegen: 22, posture: 100 }, loadout: [], talents: [], identity: {}, skin: 'classic' };
const restored = PPOAgent.fromJSON(JSON.parse(JSON.stringify(snapshot.agent)));
const sim = new Sim('battle', 12, { fighter: DEFAULT_FIGHTER, battle: { timeLimit: 180, slots: [{ kind: 'ai', team: 0 }, { kind: 'net', team: 1, card: snapshot }] } });
assert.equal(sim.heroes.length, 2);
assert.equal(sim.heroes[1].maxHp, 125);
assert.equal(sim.heroes[1].team, 1);
sim.heroes[1].brain = restored;
for (let i = 0; i < 1000 && !sim.done; i++) {
  if (i % 4 === 0) for (const h of sim.heroes) if (!h.dead) { const a = (h.brain || brain).act(sim.sense(h), false); h.action = toSimAction(a.move, a.act); }
  sim.step(null);
}
assert.ok(Number.isFinite(sim.heroes[1].hp));
const original = new Sim('room', 42, { waves: [[{type:'timeadmin'}]], timeLimit: 240 });
const finalFight = new Sim('room', 42, { waves: [[{type:'timeadmin', finalKeeper:true}]], timeLimit: 240 });
for (let i = 0; i < 30; i++) { original.step(null); finalFight.step(null); }
const normalKeeper = original.enemies.find(e => e.type === 'timeadmin');
const finalKeeper = finalFight.enemies.find(e => e.type === 'timeadmin');
assert.ok(finalKeeper && normalKeeper);
assert.ok(finalKeeper.maxHp > normalKeeper.maxHp * 1.4);
assert.equal(normalKeeper.finalKeeper, undefined);
assert.ok(finalKeeper.specials.some(a => a.id === 'pastecho'));
assert.equal(finalKeeper.specials.find(a => a.id === 'rift').cd, 4.5);
assert.equal(normalKeeper.specials.find(a => a.id === 'rift').cd, 9);
assert.equal(finalKeeper.def.ult.name, 'The Hour Closes');
finalKeeper.state = 'transform'; finalKeeper.st = 0;
finalFight.updateTransform(finalKeeper);
assert.equal(finalKeeper.phase, 2);
assert.ok(finalKeeper.specials.some(a => a.id === 'yesterday'));
assert.equal(finalKeeper.def.ult2.name, 'A Future Already Written');
finalKeeper.hp = 0;
finalFight.resolveFalls();
assert.equal(finalKeeper.past, true);
assert.equal(finalKeeper.def.ult.name, 'The Life Before');
assert.ok(finalKeeper.specials.some(s => s.id === 'bossrift' && s.projection));
const projection = finalFight.openBossProjection(finalKeeper);
assert.ok(projection && projection.projection && projection.summoner === finalKeeper.id);
assert.ok(projection.maxHp < ENEMY_TYPES[projection.type].hp * 0.35);
assert.ok(projection.specials.length > 0);
assert.equal(projection.def.boss, false);
assert.equal(projection.def.phase2, null);
assert.equal(finalFight.openBossProjection(finalKeeper), null);
projection.hp = 0; projection.lastHitBy = finalFight.p;
finalFight.resolveFalls();
assert.equal(finalFight.stats.killsByType[projection.type], undefined);

assert.ok(finalKeeper.maxHp > normalKeeper.maxHp * 0.9);
assert.equal(ALL_SEALS.length, 20);
assert.equal(WORLD_BY_ID.bottom.id, 'bottom');
assert.equal(freshCampaign().snapshots.length, 0);
for (const w of WORLDS) {
  const basePlan = campaignPlan(w, 0), nextPlan = campaignPlan(w, 1), laterPlan = campaignPlan(w, 3);
  assert.equal(nextPlan.length, basePlan.length + (w.pool.length ? 1 : 0));
  assert.equal(laterPlan.length, basePlan.length + (w.pool.length ? 3 : 0));
  const r = buildRun(w.id, 12, 3);
  assert.ok(r.rooms.every(room => room.foes.length));
  for (const room of r.rooms.filter(room => room.kind !== 'boss')) for (const f of room.foes) {
    assert.ok(f.hp >= 1.45 && f.dmg >= 1.45);
    assert.ok(['shielded', 'swift', 'vampiric', 'explosive'].includes(f.modifier));
  }
}
const oldBoss = buildRun('frontier', 12, 0).rooms.find(r => r.boss === 'warlord').foes[0];
const newBoss = buildRun('frontier', 12, 2).rooms.find(r => r.boss === 'warlord').foes[0];
assert.ok(Math.abs(newBoss.hp / oldBoss.hp - 1.3) < 1e-9);
assert.ok(Math.abs(newBoss.dmg / oldBoss.dmg - 1.3) < 1e-9);

console.log('Finale: snapshot round-trip and opposing brain duel passed.');
`, ctx);

