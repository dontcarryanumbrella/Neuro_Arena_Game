// The Yellow Spring Ancestor: forgetting, sealing, the nine springs and reforming from them, Samsara, the fishing line.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ctx = vm.createContext({ console, assert });
vm.runInContext(['agent', 'sim', 'campaign', 'lore'].map(n => fs.readFileSync(`${__dirname}/../js/${n}.js`, 'utf8')).join('\n') + `
assert.deepEqual(worldBosses(WORLD_BY_ID.abyss), ['zergqueen', 'ancestor'], 'the Queen first, then the Ancestor');
assert.ok(CODEX_LORE.ancestor && BOSS_TUNE.ancestor && isUndead({ type: 'ancestor', def: ENEMY_TYPES.ancestor }));
const fresh = () => {
  const s = new Sim('custom', 3, { roster: ['bandit'] }); s.enemies.length = 0;
  const e = s.spawnEnemy('ancestor', 40, 0); e.state = 'idle'; e.st = 0;
  s.p.x = -70; s.p.y = 20; s.p.maxHp = s.p.hp = 1e9;
  s.applyTalents(s.p, ['ripple', 'vampfist', 'dragonbreath'], 'unformed'); s.p.maxHp = s.p.hp = 1e9;
  s.step(null);
  return [s, e];
};
const run = (s, sec) => { for (let i = 0; i < sec * 60; i++) s.step(null); };

// the Broth of Forgetting: 3 stacks takes the weakest talent, 6 the strongest; they come back
{
  const [s, e] = fresh();
  assert.ok(s.T(s.p, 'ripple') > 0 && s.T(s.p, 'dragonBreath') > 0);
  s.addForget(s.p, 3);
  assert.equal(s.T(s.p, 'ripple'), 0, 'tier 1 forgotten at 3');
  assert.ok(s.T(s.p, 'dragonBreath') > 0);
  s.addForget(s.p, 3);
  assert.equal(s.T(s.p, 'dragonBreath'), 0, 'tier 4 forgotten at 6');
  run(s, 8.5);
  assert.ok(s.T(s.p, 'ripple') > 0 && s.T(s.p, 'dragonBreath') > 0, 'remembered after 8s');
}

// Waters of Forgetfulness seal the skill last used
{
  const [s, e] = fresh();
  s.p.abilities = [{ ...HERO_ABILITIES.samurai, cost: 0, cd: 0.1 }, null]; s.p.abCd = [0, 0];
  assert.ok(s.useAbility(s.p, 0)); assert.equal(s.p.lastAbSlot, 0);
  s.applyStatus(s.p, { sealSkill: 4 }, e);
  s.p.abCd[0] = 0; assert.equal(s.useAbility(s.p, 0), false, 'sealed');
}

// the Nine Springs Domain: nine springs; he reforms from one when he falls; with none left he falls
{
  const [s, e] = fresh();
  s.dealDamage(e, 99999, s.p, 0, 0, 0); run(s, 2.5);
  assert.equal(e.phase, 2);
  assert.equal(s.springsOf(e).length, 9, 'nine springs');
  e.hp = 0; s.resolveFalls();
  assert.ok(!e.dead && e.hp > 0, 'reformed from a spring');
  assert.equal(s.springsOf(e).length, 8, 'that spring is dry');
  for (const sp of s.springsOf(e)) { sp.hp = 0; } s.resolveFalls();
  assert.equal(s.springsOf(e).length, 0);
  e.hp = 0; s.resolveFalls();
  assert.ok(e.dead, 'with every spring dry, he falls');
}

// Samsara: a fallen spirit comes back as something else
{
  const [s, e] = fresh();
  const m = s.spawnMinion('zombie', 10, 10, e); m.spirit = true; m.hp = 0; s.resolveFalls();
  run(s, 4.5);
  assert.ok(s.enemies.some(x => !x.dead && x.spirit && x.type !== 'zombie' && x.summoner === e.id), 'reborn as another');
}

// long fights against him never break
const sane = f => Number.isFinite(f.hp) && Number.isFinite(f.x) && Number.isFinite(f.y);
for (let seed = 1; seed <= 3; seed++) {
  const s = new Sim('custom', seed, { roster: ['bandit'], timeLimit: 120 }); s.enemies.length = 0;
  const e = s.spawnEnemy('ancestor', 40, 0); e.hp = e.maxHp * 0.55; s.p.maxHp = s.p.hp = 5000;
  const r = mulberry32(seed * 11);
  for (let i = 0; i < 7200 && !s.done; i++) { s.step([r() * 2 - 1, r() * 2 - 1, ...Array.from({ length: 7 }, () => r() < 0.12 ? 1 : -1)]); for (const f of s.fighters()) assert.ok(sane(f), 'NaN, seed ' + seed); }
}
console.log('Ancestor: forgetting, sealing, nine springs and reforming, Samsara and 3 long fights passed.');
`, ctx);
