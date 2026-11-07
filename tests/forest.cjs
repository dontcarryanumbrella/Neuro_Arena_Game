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

// the Life Tree arrives with its elves, heals them, and when struck down the White Stag steps out of it, whole
{
  const s = new Sim('custom', 6, { roster: ['bandit'] }); s.enemies.length = 0;
  const e = s.spawnEnemy('lifetree', 0, -30); e.state = 'idle'; e.st = 0; s.p.maxHp = s.p.hp = 1e9; s.p.x = -70;
  const elves = s.enemies.filter(m => m.summoner === e.id);
  assert.equal(elves.length, 3, 'it never comes alone');
  elves[0].hp = 5; for (let i = 0; i < 120; i++) { s.p.x = -70; s.p.y = 30; s.step(null); }
  e.hp = e.maxHp * 0.4; for (let i = 0; i < 180; i++) { s.p.x = -70; s.p.y = 30; s.step(null); }
  assert.equal(e.phase, 2); assert.ok(e.r === 19 && e.pale, 'awake: taller, and pale');
  e.invulnT = 0; e.state = 'idle'; e.hp = 0; s.resolveFalls();
  assert.ok(!e.dead && e.state === 'transform', 'it does not die');
  assert.ok(!s.enemies.some(m => m.summoner === e.id && !m.dead), 'the elves go back to the light');
  for (let i = 0; i < 240; i++) { s.p.x = -70; s.p.y = 30; s.step(null); }
  assert.ok(e.stag && e.stage === 3 && e.hp === e.maxHp, 'the White Stag, whole');
  assert.ok(!e.specials.some(x => x.kind === 'summon'), 'the Stag does not summon');
  const x0 = e.x; for (let i = 0; i < 300; i++) { s.p.x = -70; s.p.y = 30; s.step(null); } assert.ok(Math.abs(e.x - x0) > 3, 'and it moves');
  e.cds.ult = 0; e.state = 'idle'; s.startUlt(e); assert.equal(e.ult.name, 'Mercy of the White Stag');
  e.hp = e.maxHp * 0.5; const h0 = e.hp; s.celestialDealt(e, s.p, 40); assert.ok(e.hp > h0, 'the Stag heals from its wounds');
}
// the Rabbit's moon: four phases, each its own animal
{
  const s = new Sim('custom', 7, { roster: ['bandit'] }); s.enemies.length = 0;
  const e = s.spawnEnemy('jaderabbit', 30, 0); e.state = 'idle'; e.st = 0; s.p.maxHp = s.p.hp = 1e9;
  s.step(null); assert.equal(e.moonPh, 0);
  assert.ok(Math.abs(s.celestialMult(e, s.p) - 0.5) < 1e-9, 'new moon: it takes half');
  e.moonT = 10; s.step(null); assert.equal(e.moonPh, 2);
  assert.ok(Math.abs(s.celestialMult(s.p, e) - 1.6) < 1e-9 && e.moonSpeed > 1.3, 'full moon: Lunacy');
  assert.ok(s.hazards.some(h => h.variant === 'fullmoon'), 'and a shockwave');
  for (const id of ['mortar', 'hundredhops', 'elixir', 'moonrabbits']) assert.ok(e.specials.some(x => x.id === id), 'has ' + id);
  s.celestialMove(e, { move: 'moonrabbits', count: 2 }, s.p); assert.equal(s.enemies.filter(m => m.moonRabbit).length, 2);
}
console.log('Forest: 11 new foes, the Rabbit and its moon, the Life Tree and its Stag, and ' + (NEW.length + 2) * 2 + ' fights passed.');
`, ctx);
