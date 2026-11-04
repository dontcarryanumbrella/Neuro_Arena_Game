// The Primordial Forest: its foes are wired up, its two bosses work, and long fights there never break.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ctx = vm.createContext({ console, assert });
vm.runInContext(['agent', 'sim', 'campaign', 'lore'].map(n => fs.readFileSync(`${__dirname}/../js/${n}.js`, 'utf8')).join('\n') + `
const NEW = ['serpent', 'roc', 'drake', 'tortoise', 'raptor', 'triceratops', 'trex', 'elfranger', 'elfsentinel', 'elfspellweaver', 'treant'];
const w = WORLD_BY_ID.forest;
assert.equal(w.tier, 2);
assert.deepEqual(worldBosses(w), ['jaderabbit', 'lifetree']);
assert.ok(!WORLD_BY_ID.temple.pool.some(e => e.type === 'druid'), 'the Druid has gone to the forest');
for (const t of NEW) {
  assert.ok(ENEMY_TYPES[t] && ROSTER.includes(t), t + ' is a regular foe');
  assert.ok(worldFoes(w).includes(t), t + ' lives in the forest');
  assert.ok(CODEX_LORE[t] && HERO_ABILITIES[t] && ENEMY_TYPES[t].passive && ENEMY_TYPES[t].active, t + ' has its words, lore and technique');
}
for (const t of ['tiger', 'bear', 'bunny']) assert.ok(PROMOTED.includes(t) && CODEX_LORE[t] && ENEMY_TYPES[t].passive, t + ' promoted');
for (const b of ['jaderabbit', 'lifetree']) assert.ok(CODEX_LORE[b] && BOSS_TUNE[b] && ENEMY_TYPES[b].ult && ENEMY_TYPES[b].ult2, b + ' complete');
assert.ok(isStrange({ type: 'jaderabbit', def: ENEMY_TYPES.jaderabbit }), 'the Rabbit is strange');
assert.ok(FRAGMENT_TRACKS.outer.length === WORLDS.filter(x => !x.hidden && x.tier < 5).length, 'a memory for every outer world');

const sane = f => Number.isFinite(f.hp) && Number.isFinite(f.x) && Number.isFinite(f.y);
const fight = (type, seed, sec = 60) => {
  const s = new Sim('custom', seed, { roster: [type], timeLimit: sec });
  const r = mulberry32(seed * 31);
  for (let i = 0; i < sec * 60 && !s.done; i++) { s.step([r() * 2 - 1, r() * 2 - 1, ...Array.from({ length: 7 }, () => r() < 0.12 ? 1 : -1)]); for (const f of s.fighters()) assert.ok(sane(f), type + ' went NaN'); if (s.fx) s.fx.length = 0; }
  return s;
};
for (const t of [...NEW, 'jaderabbit', 'lifetree']) for (let seed = 1; seed <= 2; seed++) fight(t, seed);

// the Life Tree never moves, and its guardians come with their arts
{
  const s = new Sim('custom', 4, { roster: ['bandit'] }); s.enemies.length = 0;
  const e = s.spawnEnemy('lifetree', 0, -30); e.state = 'idle'; e.st = 0;
  const x0 = e.x, y0 = e.y;
  for (let i = 0; i < 600; i++) s.step([1, 0, -1, 1, -1, -1, -1, -1, -1]);
  assert.ok(Math.hypot(e.x - x0, e.y - y0) < 3, 'rooted');
  const m = s.spawnMinion('elfranger', 20, 0, e);
  assert.ok(m.specials.length > 0, 'a guardian keeps its arts');
}

// the Rabbit's second form bites for a share of your health
{
  const s = new Sim('custom', 5, { roster: ['bandit'] }); s.enemies.length = 0;
  const e = s.spawnEnemy('jaderabbit', 30, 0); e.state = 'idle';
  e.hp = e.maxHp * 0.4; s.p.x = -150;
  for (let i = 0; i < 180; i++) s.step(null);
  assert.equal(e.phase, 2); assert.equal(e.def.form2, 'Ink-Stained Jade Rabbit');
  const bite = e.specials.find(x => x.id === 'moonbite');
  assert.ok(bite && bite.maxHpPct > 0);
}
console.log('Forest: 11 new foes, the Rabbit, the Life Tree, and ' + (NEW.length + 2) * 2 + ' fights passed.');
`, ctx);
