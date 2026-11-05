// Supporting entries for the new bosses: finales, the sandbox list, the Rabbit's held-back Codex line, Killing Stones petrify.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ctx = vm.createContext({ console, assert });
vm.runInContext(['agent', 'sim', 'campaign', 'lore'].map(n => fs.readFileSync(`${__dirname}/../js/${n}.js`, 'utf8')).join('\n') + `
// every new boss has its own finale: it puts something on the stage
for (const b of ['emperor', 'jaderabbit', 'lifetree', 'sunvenerable', 'moonvenerable', 'ancestor', 'tamamo']) {
  const s = new Sim('custom', 3, { roster: ['bandit'] }); s.enemies.length = 0; const e = s.spawnEnemy('bandit', 40, 0);
  s.p.special = { finale: b, stage: 4, mods: [] };
  const h0 = s.hazards.length, p0 = s.proj.length;
  s.heroFinale(s.p, e);
  assert.ok(s.hazards.length + s.proj.length > h0 + p0, b + ' finale does something');
}
// the Rabbit's line is held back until the Black Sea
assert.notEqual(codexLore('jaderabbit', { order: [] }), CODEX_LORE.jaderabbit);
assert.equal(codexLore('jaderabbit', { order: ['blacksea'] }), CODEX_LORE.jaderabbit);
assert.equal(codexLore('tiger', { order: [] }), CODEX_LORE.tiger);
// Killing Stones: stand by one and you turn to stone
{
  const s = new Sim('custom', 3, { roster: ['bandit'] }); s.enemies.length = 0;
  const f = s.spawnEnemy('tamamo', 60, 0); for (const k in f.cds) f.cds[k] = 99; s.p.maxHp = s.p.hp = 1e9;
  const st = s.spawnMinion('killingstone', s.p.x + 5, s.p.y, f); st.state = 'idle';
  let rooted = false; for (let i = 0; i < 200; i++) { s.step(null); if (s.p.rootT > 0) rooted = true; }
  assert.ok(rooted, 'petrified');
}
console.log('Leftovers: finales, Codex reveal and petrify passed.');
`, ctx);
