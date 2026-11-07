// Tamamo-no-Mae, the Nine-Tailed Fox: nine lives with a tail and an art for each, the dance, the gaze, the lanterns, the end.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ctx = vm.createContext({ console, assert });
vm.runInContext(['agent', 'sim', 'campaign', 'lore'].map(n => fs.readFileSync(`${__dirname}/../js/${n}.js`, 'utf8')).join('\n') + `
assert.deepEqual(worldBosses(WORLD_BY_ID.isles), ['tamamo', 'blind'], 'the Fox first');
assert.equal(ALL_SEALS.length, 20);
assert.ok(CODEX_LORE.tamamo && BOSS_TUNE.tamamo);
const fresh = () => {
  const s = new Sim('custom', 3, { roster: ['bandit'] }); s.enemies.length = 0;
  const e = s.spawnEnemy('tamamo', 40, 0); e.state = 'idle'; e.st = 0;
  s.p.x = -60; s.p.y = 20; s.p.maxHp = s.p.hp = 1e9; s.step(null);
  return [s, e];
};
const run = (s, sec) => { for (let i = 0; i < sec * 60; i++) s.step(null); };

// nine lives: each death brings the next tail, more health and its art; the ninth is the Heavenly Fox; then she falls
{
  const [s, e] = fresh();
  const hp1 = e.maxHp, seen = [];
  for (let life = 1; life < 9; life++) {
    e.hp = 0; s.resolveFalls();
    assert.ok(!e.dead, 'rises again after life ' + life);
    assert.equal(e.tails, life + 1);
    assert.equal(e.hp, e.maxHp);
    seen.push(e.maxHp);
    e.invulnT = 0; e.state = 'idle';
  }
  assert.ok(seen.every((h, i) => h > (i ? seen[i - 1] : hp1)), 'every life is longer than the last');
  for (const id of ['foxfire', 'guise', 'gaze', 'fan', 'lanterns', 'dream', 'cursedmoon', 'stones']) assert.ok(e.specials.some(x => x.id === id), 'has ' + id);
  assert.equal(e.phase, 2); assert.equal(e.spriteNow, 'b_fox2');
  e.cds.ult = 0; s.startUlt(e); assert.equal(e.ult.name, 'The Heavenly Fox Swallows the Moon'); assert.ok(e.r === 12 && e.dmgMul === 1.4, 'the Heavenly Fox is vast, and fiercer');
  e.state = 'idle'; e.ult = null; e.invulnT = 0; e.hp = 0; s.resolveFalls();
  assert.ok(e.dead, 'the ninth life is the last');
}

// the dance only from the fourth tail
{
  const [s, e] = fresh(); e.hp = e.maxHp * 0.3;
  run(s, 3); assert.notEqual(e.ult && e.ult.name, 'Dance of a Hundred Foxes', 'no dance yet');
}

// Bewitching Gaze: facing her, your movement is reversed
{
  const [s, e] = fresh();
  s.p.fx = 1; s.p.fy = 0; e.x = s.p.x + 40; e.y = s.p.y;
  e.atk = { ...FOX_TAILS[3][0] }; s.special(e);
  assert.ok(s.p.confuseT > 0, 'bewitched');
  const x0 = s.p.x; s.updateFighter(s.p, { mx: 1, my: 0 }, 60);
  assert.ok(s.p.x < x0, 'pushing right moves left');
}

// Soul Lanterns drink energy; breaking one gives some back
{
  const [s, e] = fresh();
  e.atk = { ...FOX_TAILS[5][0] }; s.special(e);
  const ls = s.enemies.filter(m => m.type === 'lantern'); assert.equal(ls.length, 3);
  s.p.energy = s.p.energyMax; run(s, 1); assert.ok(s.p.energy < s.p.energyMax, 'drained');
  const before = s.p.energy; ls[0].lastHitBy = s.p; ls[0].hp = 0; s.resolveFalls(); assert.ok(s.p.energy > before, 'released');
}

// Dreamweaver's false hazards hurt no one
{
  const [s, e] = fresh(); s.p.maxHp = s.p.hp = 500;
  s.hazards.push({ kind: 'sigil', variant: 'foxfire', x: s.p.x, y: s.p.y, r: 14, t: 0.01, delay: 0.01, dmg: 30, fake: true, team: e.team, src: e });
  run(s, 0.1); assert.equal(s.p.hp, 500);
}

// a long fight never breaks
const sane = f => Number.isFinite(f.hp) && Number.isFinite(f.x) && Number.isFinite(f.y);
for (let seed = 1; seed <= 3; seed++) {
  const s = new Sim('custom', seed, { roster: ['bandit'], timeLimit: 120 }); s.enemies.length = 0;
  const e = s.spawnEnemy('tamamo', 40, 0); s.p.maxHp = s.p.hp = 5000;
  const r = mulberry32(seed * 19);
  for (let i = 0; i < 7200 && !s.done; i++) {
    if (i % 600 === 300 && !e.dead) e.hp = 1; // push her through her lives
    s.step([r() * 2 - 1, r() * 2 - 1, ...Array.from({ length: 7 }, () => r() < 0.12 ? 1 : -1)]);
    for (const f of s.fighters()) assert.ok(sane(f), 'NaN, seed ' + seed);
  }
}
console.log('Fox: nine lives and tails, the dance gate, the gaze, lanterns, dreams and 3 long fights passed.');
`, ctx);
