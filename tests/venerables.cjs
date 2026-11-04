// The True Sun and True Moon Venerables: one room and one seal, the day/night dial, shelter, the Five Phases, the merge.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ctx = vm.createContext({ console, assert });
vm.runInContext(['agent', 'sim', 'campaign', 'lore'].map(n => fs.readFileSync(`${__dirname}/../js/${n}.js`, 'utf8')).join('\n') + `
assert.ok(ALL_SEALS.includes('sunvenerable') && !ALL_SEALS.includes('moonvenerable'), 'one seal for the pair');
const room = buildRun('heavens', 1).rooms.find(r => r.boss === 'sunvenerable');
assert.deepEqual(room.foes.map(f => f.type), ['sunvenerable', 'moonvenerable'], 'both in one room');

const pair = () => {
  const s = new Sim('custom', 3, { roster: ['bandit'] }); s.enemies.length = 0;
  const a = s.spawnEnemy('sunvenerable', 30, -10), b = s.spawnEnemy('moonvenerable', 50, 10);
  for (const e of [a, b]) { e.state = 'idle'; e.st = 0; }
  s.p.x = -80; s.p.y = 30; s.p.maxHp = s.p.hp = 1e9; s.step(null);
  return [s, a, b];
};
const run = (s, sec) => { for (let i = 0; i < sec * 60; i++) s.step(null); };

// they find each other; the dial turns every 12s and leaves the old ascendant open
{
  const [s, a, b] = pair();
  assert.equal(a.partner, b); assert.equal(b.partner, a);
  assert.ok(s.taijiDial.day && s.ascendant() === a, 'day first: the Sun');
  run(s, 12.2);
  assert.ok(!s.taijiDial.day && s.ascendant() === b, 'then night');
  assert.ok(s.taijiDial.openT > 0 && s.taijiDial.open === a, 'the Sun is open for a moment');
  // the blow on the open Sun near the Moon: open x1.5, shelter x0.7
  a.x = b.x + 20; a.y = b.y;
  assert.ok(Math.abs(s.taijiMult(a, s.p) - 1.5 * 0.7) < 1e-9);
  a.x = b.x + 120;
  assert.ok(Math.abs(s.taijiMult(a, s.p) - 1.5) < 1e-9);
  assert.ok(Math.abs(s.taijiMult(b, s.p) - 0.75) < 1e-9, 'the ascendant Moon takes less');
}

// below 55%: the Five Phases
{
  const [s, a] = pair();
  a.hp = a.maxHp * 0.5; run(s, 2.5);
  assert.equal(a.phase, 2); assert.ok(a.specials.some(x => x.id === 'wuxing'));
}

// one falls: the other becomes the Taiji Venerable, with both arts, at half health or more
{
  const [s, a, b] = pair();
  b.hp = b.maxHp * 0.2;
  a.hp = 0; s.resolveFalls();
  assert.ok(a.dead, 'the Sun falls');
  assert.equal(b.state, 'transform');
  run(s, 3);
  assert.ok(b.taiji && b.stage === 3, 'Taiji Venerable');
  assert.ok(b.hp >= b.maxHp * 0.5 - 1, 'healed to at least half');
  for (const id of ['corona', 'frostlotus', 'wuxing']) assert.ok(b.specials.some(x => x.id === id), 'has ' + id);
  assert.equal(b.spriteNow, 'b_taiji');
  b.cds.ult = 0; b.state = 'idle'; s.startUlt(b); assert.equal(b.ult.name, 'Birth of All Things');
  assert.equal(s.taijiDial, null, 'no dial once they are one');
}

// a long fight never breaks
const sane = f => Number.isFinite(f.hp) && Number.isFinite(f.x) && Number.isFinite(f.y);
for (let seed = 1; seed <= 3; seed++) {
  const s = new Sim('custom', seed, { roster: ['bandit'], timeLimit: 120 }); s.enemies.length = 0;
  s.spawnEnemy('sunvenerable', 30, -10); s.spawnEnemy('moonvenerable', 50, 10);
  const r = mulberry32(seed * 13);
  for (let i = 0; i < 7200 && !s.done; i++) {
    if (i === 2000) for (const e of s.enemies) if (e.def.venerable === 'moon') e.hp = 1;
    s.step([r() * 2 - 1, r() * 2 - 1, ...Array.from({ length: 7 }, () => r() < 0.12 ? 1 : -1)]);
    for (const f of s.fighters()) assert.ok(sane(f), 'NaN, seed ' + seed);
  }
}
console.log('Venerables: one seal, the dial, shelter, the Five Phases, the merge and 3 long fights passed.');
`, ctx);
