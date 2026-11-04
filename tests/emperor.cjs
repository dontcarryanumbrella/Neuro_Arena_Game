// The Dragon Emperor's three stages: thresholds and gates, each stage's kit, rain, the Five Phases, the pearl, and long fights.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ctx = vm.createContext({ console, assert });
vm.runInContext(['agent', 'sim', 'campaign', 'lore'].map(n => fs.readFileSync(`${__dirname}/../js/${n}.js`, 'utf8')).join('\n') + `
const fresh = (seed = 3) => { const s = new Sim('custom', seed, { roster: ['bandit'] }); s.enemies.length = 0; const e = s.spawnEnemy('emperor', 40, 0); e.state = 'idle'; e.st = 0; return [s, e]; };
const run = (s, sec, act = null) => { for (let i = 0; i < sec * 60; i++) s.step(act); };
const ids = e => e.specials.map(x => x.id).sort().join(',');

{
  const [s, e] = fresh();
  assert.equal(e.def.hp, 900); assert.equal(e.r, 8, 'a man first');
  assert.equal(ids(e), 'clouds,court,dragonclaw,jadeseal,thunder');
  // a huge blow stops at the stage threshold; then the dragon
  s.dealDamage(e, 99999, s.p, 0, 0, 0);
  assert.ok(e.hp > 0 && e.hp < e.maxHp * 0.65, 'gated at 65%');
  s.p.x = -160; run(s, 2.5);
  assert.equal(e.phase, 2); assert.equal(e.stage, 2); assert.equal(e.r, 13);
  for (const id of ['tide', 'dragonfire', 'rain', 'gust', 'court', 'thunder']) assert.ok(e.specials.some(x => x.id === id), 'stage 2 has ' + id);
  assert.equal(s.T(s.p, 'x'), 0);
  // the true body
  s.dealDamage(e, 99999, s.p, 0, 0, 0);
  assert.ok(e.hp > 0 && e.hp < e.maxHp * 0.3, 'gated at 30%');
  run(s, 3);
  assert.equal(e.stage, 3); assert.ok(e.giant && e.r === 26);
  for (const id of ['wuxing', 'pearlorbs', 'ninesons']) assert.ok(e.specials.some(x => x.id === id), 'stage 3 has ' + id);
  e.cds.ult = 0; e.state = 'idle'; s.startUlt(e);
  assert.equal(e.ult.name, 'Dragon Pearl Transforms the Five Phases');
  assert.ok(e.pearlOpenFrom > s.t, 'the pearl will dim when it is spent');
}

// rain soaks his foes and heals him
{
  const [s, e] = fresh(); e.hp = e.maxHp * 0.7;
  s.startRain(e, 3); const h0 = e.hp;
  run(s, 1.2);
  assert.ok(s.p.wetT > 0, 'soaked'); assert.ok(e.hp > h0, 'he heals in his rain');
}

// the five phases come in generating order
{
  const [s, e] = fresh(); s.fx = []; // keep the events this time
  const seen = [];
  for (let i = 0; i < 6; i++) { s.breatheWuxing(e, s.p); seen.push(s.fx.filter(f => f.type === 'wuxing').pop().phase); }
  assert.deepEqual(seen, ['wood', 'fire', 'earth', 'metal', 'water', 'wood']);
}

// pressure, and the bane of the dead
{
  const [s, e] = fresh(); s.p.x = e.x - 20; s.p.y = e.y; run(s, 0.1);
  assert.ok(s.p.pressureT > 0 && Math.abs(s.p.pressure.slow - 0.1) < 1e-9, 'stage 1 pressure');
  assert.ok(isUndead({ type: 'zombie' }) && e.def.nemesis[0] === 1.5);
}

// long fights against him never break
const sane = f => Number.isFinite(f.hp) && Number.isFinite(f.x) && Number.isFinite(f.y);
for (let seed = 1; seed <= 3; seed++) {
  const s = new Sim('custom', seed, { roster: ['emperor'], timeLimit: 120 }), r = mulberry32(seed * 7);
  s.enemies.length = 0; const em = s.spawnEnemy('emperor', 40, 0); em.hp = em.maxHp * 0.5; // start late so every stage is seen
  for (let i = 0; i < 7200 && !s.done; i++) {
    if (i === 1500 && em.hp > em.maxHp * 0.3) em.hp = em.maxHp * 0.31;
    s.step([r() * 2 - 1, r() * 2 - 1, ...Array.from({ length: 7 }, () => r() < 0.12 ? 1 : -1)]);
    for (const f of s.fighters()) assert.ok(sane(f), 'NaN in seed ' + seed);
  }
}
console.log('Emperor: three stages, gates, kits, rain, the Five Phases, the pearl and 3 long fights passed.');
`, ctx);
