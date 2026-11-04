// The Red Dust Temple's monkeys and sweeper, and the Nine Heavens' cold and shadow: wired up, and long fights never break.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ctx = vm.createContext({ console, assert });
vm.runInContext(['agent', 'sim', 'campaign', 'lore'].map(n => fs.readFileSync(`${__dirname}/../js/${n}.js`, 'utf8')).join('\n') + `
const HOME = { temple: ['macaque', 'greatape', 'sweepingmonk'], heavens: ['frostmaiden', 'qilin', 'jadetoad', 'tiangou', 'shadeattendant'] };
for (const [w, list] of Object.entries(HOME)) for (const t of list) {
  assert.ok(ENEMY_TYPES[t] && ROSTER.includes(t), t + ' is a regular foe');
  assert.ok(worldFoes(WORLD_BY_ID[w]).includes(t), t + ' lives in ' + w);
  assert.ok(CODEX_LORE[t] && HERO_ABILITIES[t] && ENEMY_TYPES[t].passive && ENEMY_TYPES[t].active, t + ' has its words, lore and technique');
}
const sane = f => Number.isFinite(f.hp) && Number.isFinite(f.x) && Number.isFinite(f.y);
let n = 0;
for (const t of [...HOME.temple, ...HOME.heavens]) for (let seed = 1; seed <= 2; seed++) {
  const s = new Sim('custom', seed, { roster: [t], timeLimit: 60 }), r = mulberry32(seed * 17);
  for (let i = 0; i < 3600 && !s.done; i++) { s.step([r() * 2 - 1, r() * 2 - 1, ...Array.from({ length: 7 }, () => r() < 0.12 ? 1 : -1)]); for (const f of s.fighters()) assert.ok(sane(f), t + ' went NaN'); }
  n++;
}
// the Frost Maiden's lotus slows
{
  const s = new Sim('custom', 3, { roster: ['bandit'] }); s.enemies.length = 0;
  const e = s.spawnEnemy('frostmaiden', 40, 0);
  s.hazards.push({ kind: 'sigil', variant: 'seal', x: s.p.x, y: s.p.y, r: 14, t: 0.01, delay: 0.01, dmg: 10, team: e.team, src: e, slow: 2 });
  for (let i = 0; i < 3; i++) s.step(null);
  assert.ok(s.p.slowT > 0, 'slowed by the frost lotus');
}
console.log('Temple and Heavens: 8 new foes and ' + n + ' fights passed.');
`, ctx);
