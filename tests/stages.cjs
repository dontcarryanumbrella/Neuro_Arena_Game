// Shared boss technology: phase gates, a third stage, a dragon's pressure, the nemesis bonus and the wet status.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ctx = vm.createContext({ console, assert });
vm.runInContext(['agent', 'sim'].map(n => fs.readFileSync(`${__dirname}/../js/${n}.js`, 'utf8')).join('\n') + `
// a test boss: the Warlord with every new piece switched on
ENEMY_TYPES.testboss = { ...ENEMY_TYPES.warlord, name: 'Test Boss', phaseGate: true, form3: 'Third Form',
  phase3: { at: 0.3, speedMul: 1.3, cdMul: 0.5, dmgMul: 1.5, heal: 0.3, replace: {}, add: [], flags: {} },
  pressure: [{ r: 60, dmg: 0.1, slow: 0.1, def: 0.1 }, { r: 90, dmg: 0.2, slow: 0.15, def: 0.15 }, { r: 999, dmg: 0.3, slow: 0.25, def: 0.25 }],
  nemesis: [1.5, 1.75, 2], ult: null, ult2: null };
const fresh = () => { const s = new Sim('custom', 3, { roster: ['bandit'] }); s.enemies.length = 0; const e = s.spawnEnemy('testboss', 30, 0); e.state = 'idle'; e.st = 0; return [s, e]; };
const run = (s, sec) => { for (let i = 0; i < sec * 60; i++) s.step([0, 0, -1, -1, -1, -1, -1, -1, -1]); };

// phase gate: one enormous blow at 60% cannot skip the second form
{
  const [s, e] = fresh();
  e.hp = e.maxHp * 0.6;
  s.dealDamage(e, 99999, s.p, 0, 0, 0);
  assert.ok(e.hp >= 1 && e.hp < e.maxHp * 0.5, 'gate holds it just under the threshold: ' + e.hp);
  s.p.x = -150; run(s, 2.5);
  assert.equal(e.phase, 2, 'it transformed'); assert.equal(e.stage, 2);
  // and again for the third stage
  s.dealDamage(e, 99999, s.p, 0, 0, 0);
  assert.ok(!e.dead && e.hp < e.maxHp * 0.3, 'gated before stage 3');
  const before = e.hp;
  run(s, 3);
  assert.equal(e.stage, 3, 'third stage'); assert.equal(e.dmgMul, 1.5);
  assert.ok(e.hp > before, 'healed on entering stage 3');
  // past the last gate it can fall
  s.dealDamage(e, 99999, s.p, 0, 0, 0);
  assert.ok(e.hp <= 0, 'no gate after the last stage');
}

// pressure: near the boss you are slower, softer, and weaker against it
{
  const [s, e] = fresh();
  s.p.x = e.x - 20; s.p.y = e.y;
  run(s, 0.1);
  assert.ok(s.p.pressureT > 0 && s.p.pressureBy === e, 'pressured');
  assert.ok(s.speedFactor(s.p) < 1, 'slowed');
  s.p.x = -200; run(s, 0.5);
  assert.ok(!(s.p.pressureT > 0), 'pressure fades away from it');
}

// nemesis and wet: compare the same blow
{
  const hit = (setup, atk = {}) => {
    const [s, e] = fresh();
    const z = s.spawnEnemy('zombie', 0, 40, 1); z.state = 'idle'; z.team = 9; z.maxHp = z.hp = 1000;
    setup(s, e, z);
    s.receiveHit(z, null, { id: 'test', dmg: 10, unblockable: true, src: e, ...atk }, 1, 0, true);
    return 1000 - z.hp;
  };
  const plain = hit((s, e) => { e.def = { ...e.def, nemesis: null }; });
  const bane = hit(() => {});
  assert.ok(Math.abs(bane / plain - 1.5) < 0.01, 'nemesis x1.5 vs undead: ' + bane + ' / ' + plain);
  const dry = hit((s, e) => { e.def = { ...e.def, nemesis: null }; }, { lightning: true });
  const wet = hit((s, e, z) => { e.def = { ...e.def, nemesis: null }; z.wetT = 2; }, { lightning: true });
  assert.ok(Math.abs(wet / dry - 1.3) < 0.01, 'lightning on wet x1.3');
  const fireWet = hit((s, e, z) => { e.def = { ...e.def, nemesis: null }; z.wetT = 2; }, { fire: true });
  assert.ok(Math.abs(fireWet / dry - 0.7) < 0.01, 'fire on wet x0.7');
}

// a status can make you wet
{
  const [s, e] = fresh();
  s.applyStatus(s.p, { wet: 3 }, e);
  assert.ok(s.p.wetT === 3);
}
console.log('Stages: phase gates, third stage, pressure, nemesis and wet passed.');
`, ctx);
