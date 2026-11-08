// The late-game pass and Thousand Skins: the Time Administrator's new kit and three healed bodies, the Last Keeper calling up
// saved selves with their own brains, Yun Xi's Last Bet, and skins of felled foes (with the Four Symbols secret).
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ctx = vm.createContext({ console, assert });
vm.runInContext(['agent', 'sim', 'campaign', 'lore'].map(n => fs.readFileSync(`${__dirname}/../js/${n}.js`, 'utf8')).join('\n') + `
const idle = [0, 0, -1, -1, -1, -1, -1, -1, -1];
// ---- the Time Administrator ----
{
  assert.equal(ENEMY_TYPES.timeadmin.hp, 500);
  const s = new Sim('room', 3, { waves: [[{ type: 'timeadmin' }]], timeLimit: 999 }); for (let i = 0; i < 40; i++) s.step(null);
  const e = s.enemies[0]; s.p.maxHp = s.p.hp = 1e9;
  for (const id of ['threelives', 'hourhand', 'borrowed']) assert.ok(e.specials.some(x => x.id === id), 'has ' + id);
  const n0 = s.hazards.length; s.celestialMove(e, { move: 'hourhand', dmg: 15 }, s.p); assert.equal(s.hazards.length - n0, 12, 'twelve strokes of the hour hand');
  s.celestialMove(e, { move: 'threelives', dmg: 18 }, s.p); assert.ok(['tl_past', 'tl_present', 'tl_future'].every(v => s.hazards.some(h => h.variant === v)));
  s.p.abilities = [{ cd: 6 }, null]; s.p.abCd = [0, 0]; s.celestialMove(e, { move: 'borrowed' }, s.p); assert.equal(s.p.abCd[0], 6, 'Borrowed Time: back to a full cooldown');
  e.state = 'idle'; e.ult = null; s.dealDamage(e, 99999, s.p, 0, 0, 0); for (let i = 0; i < 200; i++) s.step(null);
  assert.equal(e.phase, 2);
  e.state = 'idle'; e.ult = null; e.invulnT = 0; e.hp = 0; s.resolveFalls(); assert.ok(e.past, 'the Past');
  assert.ok(Math.abs(e.hp - Math.round(ENEMY_TYPES.timeadmin.hp * 0.7)) <= 2 || e.hp >= e.maxHp - 1, 'the Past at 70%');
}
// ---- Paradox: a held beam that turns after you ----
{
  const s = new Sim('room', 9, { waves: [[{ type: 'timeadmin' }]], timeLimit: 999 }); for (let i = 0; i < 40; i++) s.step(null);
  const e = s.enemies[0]; s.p.maxHp = s.p.hp = 1e9; e.hp = 0; s.resolveFalls(); assert.ok(e.past);
  e.state = 'idle'; e.cds.ult = 0; s.startUlt(e); assert.equal(e.ult.name, 'Paradox');
  const hp0 = s.p.hp; let seen = false;
  for (let i = 0; i < 60 * 6; i++) { s.p.x = e.x + 40; s.p.y = e.y; s.p.kvx = s.p.kvy = 0; s.step(idle); if ((s.spectacles || []).some(S => S.kind === 'paradox' && S.firing)) seen = true; }
  assert.ok(seen, 'it fires'); assert.ok(hp0 - s.p.hp > 120, 'standing in it costs a lot: ' + Math.round(hp0 - s.p.hp));
}
// ---- the Last Keeper calls up your saved selves ----
{
  const brain = new PPOAgent(); const card = { agent: brain.toJSON({ small: true, actorOnly: true }), fighter: null, loadout: [null, null], talents: [], world: 'forest', lives: 10 };
  const s = new Sim('room', 5, { waves: [[{ type: 'timeadmin', finalKeeper: true }]], timeLimit: 999, selves: [card, card] }); for (let i = 0; i < 40; i++) s.step(null);
  const k = s.enemies.find(e => e.finalKeeper); s.p.maxHp = s.p.hp = 1e9;
  s.celestialMove(k, { move: 'formerselves', count: 2 }, s.p);
  const selves = s.heroes.filter(h => h.formerSelf); assert.equal(selves.length, 2); assert.ok(selves.every(h => h.team === k.team && h.brain));
  for (let i = 0; i < 60 * 15; i++) { s.p.hp = s.p.maxHp; s.step(idle); }
  assert.ok(s.heroes.filter(h => h.formerSelf && !h.dead).length === 0, 'they crumble back into the clay');
}
// ---- the Four Symbols ----
{
  const s = new Sim('custom', 3, { roster: ['oni'], timeLimit: 999, talents: ['shapeshift'], identity: { skinPicks: ['tortoise', 'tiger', 'qilin', 'phoenix', 'eastdragon'] } });
  for (let i = 0; i < 120; i++) { s.p.hp = s.p.maxHp; s.step(idle); } s.p.beastT = 0; s.fx = []; const h = s.p; assert.ok(h.fourSymbols, 'the set, in any order');
  const order = []; let five = 0;
  for (let i = 0; i < 5; i++) { h.beastT = 0; h.beastCd = 0; for (let k = 0; k < 6; k++) { h.hp = h.maxHp; s.step(idle); } order.push(h.skinForm && h.skinForm.type); five += s.fx.filter(f => f.type === 'fivephases').length; s.fx.length = 0; }
  assert.deepEqual(order, ['eastdragon', 'phoenix', 'qilin', 'tiger', 'tortoise'], 'wood, fire, earth, metal, water');
  assert.equal(five, 1, 'the Five Phases, once all five are worn');
  assert.ok(s.T(h, 'allDmg') > 0.2 && s.T(h, 'dmgTaken') < 0, 'a divine skin is stronger');
  assert.ok(!isFourSymbols(['tortoise', 'tiger', 'qilin', 'phoenix', 'oni']));
}
// ---- any five ----
{
  const s = new Sim('custom', 4, { roster: ['oni'], timeLimit: 999, talents: ['shapeshift'], identity: { skinPicks: ['oni', 'bandit', 'timeadmin'] } });
  for (let i = 0; i < 120; i++) s.step(idle); const h = s.p; assert.deepEqual(h.skinPicks, ['oni', 'bandit'], 'no bosses');
  const got = new Set(); for (let i = 0; i < 6; i++) { h.beastT = 0; h.beastCd = 0; for (let k = 0; k < 4; k++) { h.hp = h.maxHp; s.step(idle); } got.add(h.skinForm.type); assert.ok(h.skinForm.arts.length > 0); }
  assert.ok(got.size === 2, 'it wears the ones chosen');
  const s2 = new Sim('custom', 4, { roster: ['oni'], timeLimit: 999, talents: ['shapeshift'] }); for (let i = 0; i < 120; i++) s2.step(idle); s2.p.beastT = 0; s2.p.beastCd = 0; s2.step(idle);
  assert.ok(BEAST_MODS[s2.p.beast] && !s2.p.skinForm, 'none chosen: the old five beasts');
}
console.log('Late pass: the Time Administrator, the Keeper saved selves, the Last Bet (newfoes), Thousand Skins and the Four Symbols passed.');
`, ctx);
