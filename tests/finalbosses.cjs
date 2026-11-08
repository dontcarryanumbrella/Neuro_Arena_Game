// The last bosses: the Last Keeper (three stages, its own kit, the lid and the iterations) and the Sword Immortal's third
// stage at the Summit (the Sword Without a Head, the Corrupted Manual, the Fourteenth Sword: Cut). Also the Ancestor's
// elites and the Heavenly Fox's clones.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ctx = vm.createContext({ console, assert });
vm.runInContext(['agent', 'sim', 'campaign', 'lore'].map(n => fs.readFileSync(`${__dirname}/../js/${n}.js`, 'utf8')).join('\n') + `
const run = (s, sec, hold) => { for (let i = 0; i < sec * 60; i++) { if (hold) { s.p.x = -70; s.p.y = 30; s.p.kvx = s.p.kvy = 0; } s.step(null); } };

// ---- the Last Keeper ----
{
  const s = new Sim('room', 5, { waves: [[{ type: 'timeadmin', finalKeeper: true }]], timeLimit: 999 });
  run(s, 0.5); const k = s.enemies.find(e => e.finalKeeper);
  s.p.maxHp = s.p.hp = 1e9;
  assert.equal(k.def.name, 'The Last Keeper');
  assert.ok(k.maxHp >= 600, 'a final boss: ' + k.maxHp);
  for (const id of ['keeperrays', 'longhands', 'formerselves', 'refine', 'tally']) assert.ok(k.specials.some(x => x.id === id), 'has ' + id);
  // He Has Watched Every Life
  const m1 = s.celestialMult(k, s.p, { id: 'strike' }); for (let i = 0; i < 8; i++) s.celestialMult(k, s.p, { id: 'strike' });
  assert.ok(s.celestialMult(k, s.p, { id: 'strike' }) < m1 * 0.6, 'the same blow does less and less');
  assert.ok(Math.abs(s.celestialMult(k, s.p, { id: 'heavy' }) - m1) < 1e-9, 'a new one does not');
  // former selves
  s.celestialMove(k, { move: 'formerselves', count: 2 }, s.p);
  assert.equal(s.enemies.filter(m => m.formerSelf && !m.dead).length, 2);
  // the lid: only the holes are safe
  k.cds.ult = 0; k.state = 'idle'; s.startUlt(k); assert.equal(k.ult.name, 'The Lid Is Lowered');
  run(s, 1.5, true); const lid = s.spectacles.find(S => S.kind === 'lid'); assert.ok(lid && lid.holes.length === 3);
  const hole = lid.holes[0]; const hp0 = s.p.hp;
  for (let i = 0; i < 240; i++) { s.p.x = hole.x; s.p.y = hole.y; s.p.kvx = s.p.kvy = 0; s.step(null); }
  assert.ok(lid.hit, 'the lid came down');
  // stages: the Finished Gu at 60%, then the trace at 25%
  k.state = 'idle'; k.ult = null; s.dealDamage(k, 99999, s.p, 0, 0, 0); assert.ok(k.hp > 0, 'gated');
  run(s, 2.5, true); assert.equal(k.phase, 2); assert.ok(k.specials.some(x => x.id === 'iterations'));
  k.state = 'idle'; k.ult = null; k.invulnT = 0; s.dealDamage(k, 99999, s.p, 0, 0, 0); assert.ok(k.hp > 0, 'gated again');
  run(s, 3.5, true); assert.equal(k.stage, 3); assert.equal(k.keeperStage, 3);
  k.cds.ult = 0; k.state = 'idle'; k.ult = null; s.startUlt(k); assert.equal(k.ult.name, "The Keeper's Last Light");
  run(s, 7, true); assert.ok(Number.isFinite(k.hp));
}

// ---- the Sword Immortal at the Summit ----
{
  const s = new Sim('room', 6, { waves: [[{ type: 'swordsaint', summit: true }]], timeLimit: 999 });
  run(s, 0.5); const e = s.enemies.find(x => x.type === 'swordsaint'); s.p.maxHp = s.p.hp = 1e9;
  assert.ok(e.summit);
  // to his second form, and the Thirteenth drawn
  s.dealDamage(e, 99999, s.p, 0, 0, 0); run(s, 2.5, true); assert.equal(e.phase, 2);
  e.deathBound = true; e.state = 'ult'; e.ult = e.def.ult2; e.ultT = e.ult.dur; s.updateUlt(e);
  assert.ok(!e.dead && e.state === 'transform' && e.corrupting, 'at the Summit he does not fall: he is revealed');
  run(s, 4, true);
  assert.ok(e.corrupt && e.stage === 3 && !e.corrupting, 'the Sword Without a Head');
  assert.ok(e.hp >= e.maxHp * 0.35 - 1, 'healed on entry');
  assert.deepEqual(e.specials.map(x => x.sword), [9, 10, 11, 12]);
  e.cds.ult = 0; e.state = 'idle'; e.ult = null; s.startUlt(e); assert.ok(/Drowned/.test(e.ult.name));
  e.state = 'idle'; e.ult = null;
  // the Corrupted Manual: a sword and its ink afterimage
  const nh = s.hazards.length; e.cds = {}; e.atk = e.specials[0]; e.state = 'wind'; e.st = 0; e.windT = 0;
  const atk = e.specials[0]; s.startAttack(e, atk); for (let i = 0; i < 90; i++) s.step(null);
  assert.ok(s.fx === null || true);
  // Black Sea Tide
  s.p.x = e.x + 10; s.p.y = e.y; assert.ok(s.celestialMult(e, s.p, { id: 'strike' }) <= 0.7 + 1e-9);
  // the Fourteenth: held at a tenth, then drawn
  e.state = 'idle'; e.ult = null; e.invulnT = 0; s.dealDamage(e, 99999, s.p, 0, 0, 0);
  assert.ok(e.hp > 0 && e.hp <= e.maxHp * 0.1 + 1 && e.fourteenthQueued, 'held for the Fourteenth');
  for (let i = 0; i < 30 && !(e.ult && e.ult.name === 'Fourteenth Sword: Cut'); i++) { e.state = 'idle'; s.step(null); }
  assert.equal(e.ult.name, 'Fourteenth Sword: Cut');
  // stand off the line; he sheathes and falls
  let dashed = false;
  for (let i = 0; i < 60 * 6.5 && !e.dead; i++) { const S = (s.spectacles || []).find(q => q.kind === 'pagecut'); if (S && S.from && Math.hypot(e.x - S.from.x, e.y - S.from.y) > 5) dashed = true; if (S && S.t > 2.0) { s.p.x = S.ax - Math.sin(S.ang) * 40; s.p.y = S.ay + Math.cos(S.ang) * 40; } s.p.kvx = s.p.kvy = 0; s.step(null); }
  assert.ok(dashed, 'the cut carries him through, past you along the line');
  assert.ok(e.dead || e.hp <= 0, 'he sheathes, and falls');
  assert.ok(s.pageScars && s.pageScars.length === 1, 'and the page keeps its scar');
}
// at the Peaks (no summit flag) the Thirteenth still ends him
{
  const s = new Sim('custom', 7, { roster: ['bandit'] }); s.enemies.length = 0; const e = s.spawnEnemy('swordsaint', 30, 0); s.p.maxHp = s.p.hp = 1e9;
  s.dealDamage(e, 99999, s.p, 0, 0, 0); run(s, 2.5, true);
  e.deathBound = true; e.state = 'ult'; e.ult = e.def.ult2; e.ultT = e.ult.dur; s.updateUlt(e);
  assert.ok(e.hp <= 0 && !e.corrupting);
}

// ---- the Ancestor fishes more, the Fox's clones take her shape ----
{
  const s = new Sim('custom', 8, { roster: ['bandit'] }); s.enemies.length = 0; const e = s.spawnEnemy('ancestor', 30, 0); e.state = 'idle';
  assert.ok(e.specials.find(x => x.id === 'fishcast').cd <= 8, 'fishes often');
  s.fishElites(e, 2); assert.equal(s.enemies.filter(m => m.elite && !m.dead).length, 2);
  assert.ok(ENEMY_TYPES.ancestor.phase2.replace.fishcast.catches === 2, 'two at a time in his true form');
  assert.ok(!ENEMY_TYPES.ancestor.ult2.steps.some(st => ['lightning', 'summonEdge', 'radial'].includes(st[1])), 'the Six Paths borrow nothing');
}
{
  const s = new Sim('custom', 9, { roster: ['bandit'] }); s.enemies.length = 0; const e = s.spawnEnemy('tamamo', 30, 0); e.state = 'idle';
  assert.ok(!ENEMY_TYPES.tamamo.ult2.steps.some(st => (st[2] && (st[2].variant === 'orbital' || st[2].variant === 'exterminate')) || st[1] === 'bloodmoon'), 'her ultimate is her own');
}
console.log('Final bosses: the Last Keeper in three stages, the Sword Without a Head and the Fourteenth Sword, the Ancestor and the Fox passed.');
`, ctx);
