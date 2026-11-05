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
// Mandate of Heaven: his soldiers come tougher, and his decrees can't be interrupted
{
  const s = new Sim('custom', 3, { roster: ['bandit'] }); s.enemies.length = 0; const e = s.spawnEnemy('emperor', 40, 0);
  const g = s.spawnMinion('general', 10, 10, e); assert.equal(g.maxHp, Math.round(ENEMY_TYPES.general.hp * 1.3));
  assert.ok(e.specials.filter(x => ['thunder', 'dragonclaw', 'jadeseal'].includes(x.id)).every(x => x.steadfast));
}
// the ferries drag; the Ancestor reflects your special in his true form
{
  const s = new Sim('custom', 3, { roster: ['bandit'] }); s.enemies.length = 0; const e = s.spawnEnemy('ancestor', 40, 0);
  s.p.maxHp = s.p.hp = 1e9; s.p.kvx = s.p.kvy = 0;
  s.receiveHit(s.p, e, { id: 'ferry', dmg: 5, unblockable: true, dragA: 0 }, 1, 0);
  assert.ok(s.p.kvx > 200, 'carried along the lane');
  e.phase = 2; e.recentSpecial = { finale: 'lich', stage: 4, mods: [] };
  const h0 = s.hazards.length; e.atk = { id: 'reflection', kind: 'reflection', wind: 0.1, recover: 0.1 }; s.special(e);
  assert.ok(s.hazards.length > h0, 'his reflection of your special');
}
// the Fox's ninth life combines tails
{
  const s = new Sim('custom', 3, { roster: ['bandit'] }); s.enemies.length = 0; const f = s.spawnEnemy('tamamo', 40, 0); s.p.maxHp = s.p.hp = 1e9;
  for (let i = 0; i < 8; i++) { f.hp = 0; s.resolveFalls(); f.invulnT = 0; }
  assert.ok(f.specials.some(x => x.kind === 'foxcombo'));
  s.fx = []; f.atk = { ...f.specials.find(x => x.kind === 'foxcombo') }; s.special(f);
  const ev = s.fx.find(x => x.type === 'ninefold'); assert.ok(ev && ev.n >= 2, 'two or three tails at once');
}
// the Venerables: stances, the wheel, the Two Poles Turn
{
  const s = new Sim('custom', 3, { roster: ['bandit'] }); s.enemies.length = 0;
  const a = s.spawnEnemy('sunvenerable', -20, 0), b = s.spawnEnemy('moonvenerable', 20, 0); s.p.maxHp = s.p.hp = 1e9; s.p.x = -70; s.p.y = 30;
  for (let i = 0; i < 60; i++) s.step(null);
  assert.ok(['unyielding', 'yielding', 'mirror'].includes(a.stance), 'a stance');
  a.stance = 'mirror'; a.state = 'idle'; a.invulnT = 0; const n0 = s.proj.length;
  assert.equal(s.receiveHit(a, s.p, { id: 'arrow', dmg: 10 }, 1, 0, true), 'ward'); assert.ok(s.proj.length > n0, 'shot sent back');
  a.hp = a.maxHp * 0.5; for (let i = 0; i < 200; i++) s.step(null);
  assert.ok(a.phase === 2 && s.wheelIdx != null, 'the wheel turns in Act 2');
  s.ultStep(a, 'twopoles', { dur: 3 }, s.p); s.p.x = 70; s.p.y = 0; const h1 = s.p.hp;
  for (let i = 0; i < 60; i++) s.step(null);
  assert.ok(s.p.hp < h1 || Math.hypot(s.p.x, s.p.y) < 60, 'the turning floor burns');
}
console.log('Leftovers: finales, Codex reveal, petrify, mandate, ferries, reflection, ninefold, stances, wheel and the Two Poles passed.');

`, ctx);
