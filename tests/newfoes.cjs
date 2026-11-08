// Regression checks for the newer foes: their mechanics, and long random duels that must never break.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ctx = vm.createContext({ console, assert });
vm.runInContext(['agent', 'sim'].map(n => fs.readFileSync(`${__dirname}/../js/${n}.js`, 'utf8')).join('\n') + `
const NEW = ['oni', 'mutant', 'boxer', 'reaper', 'crab', 'spider', 'shifter', 'magician', 'archer', 'alchemist', 'gravmage', 'formation', 'golem', 'hydra', 'phoenix'];
function duel(type, seed = 7) {
  const s = new Sim('custom', seed, { roster: [type] });
  const e = s.spawnEnemy(type, 40, 0); e.state = 'idle';
  return [s, e];
}
const sane = f => Number.isFinite(f.hp) && Number.isFinite(f.x) && Number.isFinite(f.y);

// every new foe can be fought for a long time, by a fighter mashing random buttons, without anything breaking
let seen = new Set();
for (const type of NEW) for (let seed = 1; seed <= 4; seed++) {
  const s = new Sim('custom', seed, { roster: [type], timeLimit: 60, visual: true });
  const r = mulberry32(seed * 99);
  for (let i = 0; i < 60 * 60 && !s.done; i++) {
    const a = [r() * 2 - 1, r() * 2 - 1, ...Array.from({ length: 7 }, () => r() < 0.12 ? 1 : -1)];
    s.step(a);
    for (const f of s.fighters()) assert.ok(sane(f), type + ' went NaN');
    for (const ev of s.fx) seen.add(ev.type);
    s.fx.length = 0;
  }
}

// ...and so can ???, whose dice now pick from their skills too
{
  const pool = multicastPool(false).map(x => x.id);
  for (const id of ['boulder', 'flask', 'bagua', 'crush', 'webtrap', 'trick', 'foxfire', 'venomspit', 'spew']) assert.ok(pool.includes(id), '??? cannot roll ' + id);
  const s = new Sim('custom', 3, { roster: ['unknown'], timeLimit: 60 });
  for (let i = 0; i < 3600 && !s.done; i++) { s.step([0, 0, -1, -1, -1, -1, -1, -1, -1]); for (const f of s.fighters()) assert.ok(sane(f)); }
}

// a battle of everyone new, two teams
{
  const slots = NEW.slice(0, 10).map((k, i) => ({ kind: k, team: i % 2 }));
  const s = new Sim('battle', 5, { battle: { slots, timeLimit: 90 } });
  for (let i = 0; i < 90 * 60 && !s.done; i++) { s.step(); for (const f of s.fighters()) assert.ok(sane(f)); }
  assert.ok(s.done);
}

// the hero's learned versions work when cast
for (const type of NEW) {
  const s = new Sim('custom', 2, { roster: ['bandit'], loadout: [type, null] });
  const e = s.spawnEnemy('bandit', 20, 0); e.state = 'idle';
  s.p.energy = 999;
  for (let i = 0; i < 240; i++) { s.step([0, 0, -1, -1, -1, -1, -1, i % 40 === 0 ? 1 : -1, -1]); assert.ok(sane(s.p)); }
}

// Hydra: severed heads grow back as two, a heavy seals the stump
{
  const [s, h] = duel('hydra');
  assert.equal(h.heads.length, 3);
  s.receiveHit(h, s.p, { dmg: 30 }, 1, 0);
  assert.equal(h.heads.filter(x => x.alive).length, 2);
  for (let i = 0; i < 320; i++) s.updateHeads(h);
  assert.equal(h.heads.length, 4);
  s.receiveHit(h, s.p, { dmg: 30 }, 1, 0); const n = h.heads.length;
  s.receiveHit(h, s.p, { id: 'heavy', dmg: 1 }, 1, 0);
  assert.equal(h.heads.length, n - 1);
}
// Phoenix: falls as an egg and hatches; a broken egg is the end
{
  const [s, ph] = duel('phoenix');
  ph.hp = 0; s.resolveFalls();
  assert.equal(ph.state, 'egg'); assert.ok(!ph.dead);
  for (let i = 0; i < 250; i++) s.updateEnemy(ph);
  assert.equal(ph.rebirths, 1); assert.equal(ph.hp, ph.maxHp);
  ph.hp = 0; s.resolveFalls(); assert.equal(ph.state, 'egg');
  ph.hp = 0; s.resolveFalls(); assert.ok(ph.dead);
}
// Golem: stillness hardens, a heavy cracks
{
  const [s, g] = duel('golem');
  for (let i = 0; i < 300; i++) s.updateStone(g);
  assert.equal(g.stone, 5);
  const hp = g.hp; s.receiveHit(g, s.p, { id: 'heavy', dmg: 20 }, 1, 0);
  assert.equal(g.stone, 3); assert.ok(hp - g.hp < 20);
}
// Mutant: grows a mutation for every 20% lost
{
  const [s, m] = duel('mutant');
  m.hp = m.maxHp * 0.55; s.checkMutation(m);
  assert.equal(m.mutations.length, 1); assert.equal(m.state, 'morph');
}
// Magician: a decoy takes the first hit, and the kitsune appears at half health
{
  const [s, m] = duel('magician');
  const hp = m.hp;
  assert.equal(s.receiveHit(m, s.p, { dmg: 10 }, 1, 0), 'ward'); assert.equal(m.hp, hp);
  assert.ok(s.enemies.some(o => o.mirrorOf === m.id));
  m.hp = m.maxHp * 0.4; m.state = 'idle'; s.passives(m);
  for (let i = 0; i < 70; i++) s.updateEnemy(m);
  assert.equal(m.def.name, 'Kitsune');
}
// Statuses: polymorph stops attacks, webs root, crab pincer throws
{
  const [s, e] = duel('bandit');
  s.applyStatus(s.p, { poly: 1.5 }, e);
  s.p.state = 'idle'; s.step([0, 0, 1, 1, -1, -1, -1, -1, -1]); assert.notEqual(s.p.state, 'wind');
  const [s2, c] = duel('crab');
  s2.p.x = 30; c.x = 44; c.fx = -1; c.fy = 0;
  s2.receiveHit(s2.p, c, c.specials[0], -1, 0);
  assert.ok(s2.p.heldT > 0);
  for (let i = 0; i < 60; i++) s2.updateGrabs();
  assert.ok(Math.hypot(s2.p.kvx, s2.p.kvy) > 50);
}
// ---- the newer super bosses ----
const BOSSES_NEW = ['blind', 'wukong', 'mahoraga', 'zergqueen', 'scholar'];
for (const type of BOSSES_NEW) for (let seed = 1; seed <= 3; seed++) {
  const s = new Sim('custom', seed, { roster: [type], timeLimit: 90, visual: true });
  const r = mulberry32(seed * 7);
  for (let i = 0; i < 90 * 60 && !s.done; i++) {
    const e = s.nearestEnemy(s.p);
    let a = [r() * 2 - 1, r() * 2 - 1, ...Array.from({ length: 7 }, () => r() < 0.12 ? 1 : -1)];
    if (e && i % 2) { const dx = e.x - s.p.x, dy = e.y - s.p.y, d = Math.hypot(dx, dy) || 1; a[0] = dx / d; a[1] = dy / d; }
    s.step(a);
    for (const f of s.fighters()) assert.ok(sane(f), type + ' went NaN');
    for (const ev of s.fx) seen.add(ev.type);
    s.fx.length = 0;
  }
}
// every new boss's ultimates play out, from any caster (the future self borrows the first ones)
for (const type of [...BOSSES_NEW, 'timeadmin']) {
  const [s, b] = duel(type);
  for (const u of [ENEMY_TYPES[type].ult, ...BOSSES_NEW.map(t => ENEMY_TYPES[t].ult), ...BOSSES_NEW.map(t => ENEMY_TYPES[t].ult2)]) {
    b.state = 'ult'; b.ult = u; b.ultT = 0; b.ultIdx = 0; b.invulnT = 0;
    for (let i = 0; i < u.dur * 60 + 5; i++) { s.step([0, 0, -1, -1, -1, -1, -1, -1, -1]); if (s.done) break; }
    for (const f of s.fighters()) assert.ok(sane(f));
    if (s.done) break;
  }
}
// The Blind Gentleman: four more lives, each with half the health, then the end; true damage cuts through armor
{
  const [s, b] = duel('blind');
  const hp0 = b.maxHp;
  for (let n = 1; n <= 4; n++) { b.hp = 0; s.resolveFalls(); assert.equal(b.lives, n); assert.ok(!b.dead); }
  let want = hp0; for (let n = 0; n < 4; n++) want = Math.max(10, Math.round(want * 0.5));
  assert.equal(b.maxHp, want);
  assert.equal(b.phase, 2);
  b.hp = 0; s.resolveFalls(); assert.ok(b.dead);
  const [s2, b2] = duel('blind'), g = s2.spawnEnemy('golem', -20, 0, 0); g.stone = 5;
  const h = g.hp; s2.receiveHit(g, b2, { id: 'iaidraw', dmg: 20 }, 1, 0);
  assert.ok(h - g.hp >= 20 * 0.85 - 0.01, 'true damage ignores stoneskin');
}
// Mahoraga: the wheel turns, it adapts, and adapted blows are softened and answered
{
  const [s, m] = duel('mahoraga');
  for (let i = 0; i < 12; i++) { m.invulnT = 0; s.receiveHit(m, s.p, { id: 'strike', dmg: 5 }, 1, 0); }
  assert.ok(m.adapt.strike >= 1); assert.ok(m.wheel >= 4);
  const h = m.hp; s.receiveHit(m, s.p, { id: 'strike', dmg: 20 }, 1, 0);
  assert.ok(h - m.hp < 6);
  for (let i = 0; i < 10 && !(m.counterAt > 0); i++) s.receiveHit(m, s.p, { id: 'strike', dmg: 1 }, 1, 0);
  assert.ok(m.counterAt > 0);
  // only three kinds on the wheel: a fourth pushes out the oldest
  for (const k of ['heavy', 'kick', 'ab:x']) s.receiveHit(m, s.p, { id: k === 'ab:x' ? 'zz' : k, abilityId: k === 'ab:x' ? 'x' : undefined, dmg: 1 }, 1, 0);
  assert.ok(Object.keys(m.adapt).length <= 3); assert.ok(!m.adapt.strike);
  for (let i = 0; i < 3; i++) s.stopTime(s.p, 1);
  m.frozenT = 0; s.stopTime(s.p, 1);
  assert.ok(!(m.frozenT > 0), 'adapted to stopped time');
}
// the Monkey King grows into a giant; the Queen's swarm can't be claimed by the King in Yellow, but withers
{
  const [s, w] = duel('wukong');
  w.hp = w.maxHp * 0.25; s.passives(w);
  for (let i = 0; i < 120; i++) s.updateEnemy(w);
  assert.ok(w.giant); assert.equal(w.r, 14);
  assert.ok(w.specials.find(x => x.id === 'hairclones').minions.every(m => m === 'gorillaclone'));
  const [s2, q] = duel('zergqueen'), k = s2.spawnEnemy('yellowking', -40, 0, 0);
  const z = s2.spawnMinion('zergling', 0, 10, q); s2.claimSummon(z);
  assert.equal(z.team, q.team); assert.ok(z.kingWeakened);
}
// every talent, alone, in long random fights; and slot costs that fit the ten slots
{
  assert.ok(TALENTS.every(t => t.slots >= 1 && t.slots <= 3));
  for (const t of TALENTS) {
    const s = new Sim('custom', 9, { roster: ['oni', 'archer'], atOnce: 2, timeLimit: 40, talents: [t.id] });
    const r = mulberry32(3);
    for (let i = 0; i < 40 * 60 && !s.done; i++) { s.step([r() * 2 - 1, r() * 2 - 1, ...Array.from({ length: 7 }, () => r() < 0.15 ? 1 : -1)]); for (const f of s.fighters()) assert.ok(sane(f), t.id); }
  }
  const [s, e] = duel('bandit');
  s.p.tal = { berserkArmor: 1 }; s.p.hp = 0; s.resolveFalls(); assert.equal(s.p.hp, 1); assert.ok(!s.p.dead);
  s.receiveHit(s.p, e, { dmg: 50 }, 1, 0); assert.equal(s.p.hp, 1);
  s.p.tal = { shapeshift: 1 }; s.p.beastCd = 0; s.heroTalents(s.p); assert.ok(s.p.beastT > 0);
  { // Thousand Skins: any skin is a real upgrade, and the next one comes quickly
    const p = s.p, d0 = s.T(p, 'allDmg'), t0 = s.T(p, 'dmgTaken');
    assert.ok(d0 >= 0.2 && t0 <= -0.2 && s.T(p, 'speed') <= 0.12, 'every skin: +20% damage, -20% damage taken, no wild speed');
    assert.equal(p.beastT, 9); assert.equal(p.beastCd, 11);
  }
  { // The World: 5s of stopped time, healing, harder blows, and it comes back
    const [w, we] = duel('bandit'); const p = w.p; p.tal = { theWorld: 1 }; p.hp = p.maxHp * 0.3; p.energy = 0;
    w.heroTalents(p); assert.ok(we.frozenT >= 4.9 && p.worldT > 0 && p.energy === p.energyMax && p.hp > p.maxHp * 0.45, 'time stops for 5s and you recover');
    const h0 = we.hp; w.receiveHit(we, p, { dmg: 10, unblockable: true }, 1, 0); const hit = h0 - we.hp;
    p.worldT = 0; const h1 = we.hp; w.receiveHit(we, p, { dmg: 10, unblockable: true }, 1, 0); assert.ok(hit > (h1 - we.hp) * 1.4, 'blows in stopped time land harder');
    p.hp = p.maxHp * 0.3; w.heroTalents(p); assert.ok(p.worldCd > 30, 'not again straight away'); p.worldCd = 0; w.heroTalents(p); assert.ok(p.worldCd > 30, 'but it comes back');
  }
}
// the Zerg Queen arrives with her brood and won't die while it lives; the Shapeshifter hops forms and heals
{
  const [s, q] = duel('zergqueen');
  const brood = s.enemies.filter(m => m.summoner === q.id);
  assert.ok(brood.length >= 4);
  q.def = { ...q.def, phaseGate: false }; // the brood's hold, not the phase gate, is what this checks
  s.receiveHit(q, s.p, { dmg: 9999, trueDmg: true }, 1, 0); assert.equal(q.hp, 1); assert.ok(q.broodSpent);
  for (const m of brood) { m.hp = 0; } s.resolveFalls();
  s.receiveHit(q, s.p, { dmg: 999, trueDmg: true }, 1, 0); s.resolveFalls(); assert.ok(q.dead);
  // at death's door she spills broodlings, and they can't keep her alive
  const [s3, q3] = duel('zergqueen'); q3.def = { ...q3.def, phaseGate: false };
  s3.receiveHit(q3, s3.p, { dmg: 9999, trueDmg: true }, 1, 0); assert.ok(q3.broodSpent);
  const sp = q3.specials.find(x => x.desperate), br = q3.specials.find(x => x.id === 'brood'); q3.cds.desperation = 0; q3.cds.brood = 0;
  assert.ok(s3.canUseSpecial(q3, sp, 30, 20, s3.p) || s3.enemies.filter(m => m.summoner === q3.id).length >= sp.cap); assert.ok(!s3.canUseSpecial(q3, br, 30, 20, s3.p));
  for (const m of s3.enemies.filter(m => m.summoner === q3.id)) m.hp = 0; s3.resolveFalls();
  const bl = s3.spawnMinion('bladeguard', 0, 0, q3); bl.spilled = true;
  s3.receiveHit(q3, s3.p, { dmg: 999, trueDmg: true }, 1, 0); s3.resolveFalls(); assert.ok(q3.dead, 'broodlings do not hold her up');
  const [s2, w] = duel('shifter');
  w.state = 'idle'; w.atk = w.specials[0]; s2.special(w); const f1 = w.form, max1 = w.maxHp;
  assert.ok(f1 && max1 > 76);
  w.formT = 0.001; s2.passives(w); assert.ok(w.form && w.form !== f1);
}
// ???: the lower she gets, the less gets through and the faster she casts; at 0 she makes the Last Bet
{
  const [s, q] = duel('unknown');
  const hit = frac => { q.hp = q.maxHp * frac; q.invulnT = 0; q.state = 'idle'; const h = q.hp; s.receiveHit(q, s.p, { id: 'heavy', dmg: 40, unblockable: true }, 1, 0); return h - q.hp; };
  const full = hit(1), low = hit(0.1);
  assert.ok(low < full * 0.25, 'about 81% reduction at 10% health'); assert.ok(full > 0);
  q.hp = q.maxHp * 0.02; q.state = 'idle'; q.cds.multicast = 0; q.cds.ai = 9; for (let i = 0; i < 30 && q.state === 'idle'; i++) s.updateEnemy(q);
  assert.ok(q.cds.multicast <= 0.6, 'casts about every half second near death');
  q.hp = 0; q.state = 'idle'; s.resolveFalls(); assert.ok(!q.dead && q.bet && q.stage === 3, 'the Last Bet, not death'); assert.ok(Math.abs(q.hp - q.maxHp * 0.25) < 1, 'heals 25%');
  const faces = new Set(); s.p.maxHp = s.p.hp = 1e9;
  for (let i = 0; i < 60 * 14; i++) { s.p.hp = s.p.maxHp; s.step(null); if (q.bet.face) faces.add(q.bet.face); if (q.bet.st === 'spent') break; }
  assert.equal(q.bet.st, 'spent', 'five rolls, then spent'); assert.ok(faces.size >= 3, 'different faces: ' + [...faces]);
  q.hp = q.maxHp * 0.1; const h0 = q.hp; q.invulnT = 0; s.dealDamage(q, 30, s.p, 0, 0, 0); assert.ok(h0 - q.hp > 25, 'spent: everything gets through');
}
// the fighter's special calls its beasts on every cycle, but never keeps more than four
{
  const identity = { awaken: 'versatility', special: { awaken: 'versatility', primary: 'druid', secondary: 'talisman', third: 'necromancer', stage: 4, mods: [], fusion: ['weave'], finale: 'emperor' } };
  const s = new Sim('custom', 2, { roster: ['emperor'], timeLimit: 99, identity, loadout: ['druid', 'talisman'] });
  const b = s.spawnEnemy('emperor', 25, 0); b.state = 'idle'; s.waveIdx = 1;
  s.p.awakeT = 8; s.p.ultGauge = 100;
  let most = 0;
  for (let i = 0; i < 400; i++) { s.step([0, 0, -1, -1, -1, -1, -1, -1, -1]); s.p.hp = s.p.maxHp; most = Math.max(most, s.enemies.filter(m => m.summoner === s.p.id && !m.dead).length); }
  assert.ok(most >= 2 && most <= 4, 'the special keeps calling beasts, four at most');
}
// Wukong's clones: his look, his skills and ultimates, a third of the damage; every ultimate's steps run in time order
{
  const [s, w] = duel('wukong');
  const c = s.spawnMinion('monkeyclone', 0, 10, w);
  assert.equal(c.def.sprite, 'b_wukong'); assert.ok(c.specials.some(x => x.id === 'ruyi')); assert.ok(!c.specials.some(x => x.kind === 'summon'));
  assert.ok(c.def.ult && !c.def.ult.steps.some(st => st[1] === 'monkeyswarm'));
  const h = s.p.hp; s.receiveHit(s.p, c, { id: 'heavy', dmg: 30, unblockable: true }, 1, 0); assert.ok(h - s.p.hp < 30 * 0.25 + 1);
  for (const t of Object.keys(ENEMY_TYPES)) for (const u of [ENEMY_TYPES[t].ult, ENEMY_TYPES[t].ult2, ENEMY_TYPES[t].ult3]) if (u) for (let i = 1; i < u.steps.length; i++) assert.ok(u.steps[i][0] >= u.steps[i - 1][0], t + ': ' + u.name + ' steps out of order');
  const [s2, q] = duel('zergqueen'); q.hp = q.maxHp * 0.5; const qh = q.hp;
  const b = s2.enemies.find(m => m.summoner === q.id && m.type === 'brute'); b.hp = 0; s2.resolveFalls();
  assert.ok(q.hp > qh && q.hp - qh <= q.maxHp * 0.03 + 0.01, 'a brute feeds her about 3%');
}
// the Headless Scholar: every hit is one; the umbrella stops everything; the painting rewrites, grows and remembers
{
  const [s, b] = duel('scholar');
  const h0 = b.hp; s.receiveHit(b, s.p, { id: 'heavy', dmg: 500, unblockable: true }, 1, 0); assert.equal(h0 - b.hp, 1);
  s.dot(b, 50, s.p, 'fire'); assert.equal(h0 - b.hp, 2);
  b.inkShieldT = 1; assert.equal(s.receiveHit(b, s.p, { dmg: 50, pierceAll: true, trueDmg: true }, 1, 0), 'block'); b.inkShieldT = 0;
  const ally = s.spawnEnemy('bandit', -20, 0, 0); ally.state = 'idle';
  assert.ok(!b.specials.some(x => x.id === 'heavensuffer'), 'All Under Heaven Suffer is gone');
  b.hp = b.maxHp * 0.45; s.passives(b); for (let i = 0; i < 100; i++) s.updateEnemy(b);
  assert.equal(b.phase, 2); assert.ok(b.painting);
  let grew = false, dragon = false;
  for (let i = 0; i < 60 * 20; i++) { s.step([0, 0, -1, -1, -1, -1, -1, -1, -1]); s.p.hp = s.p.maxHp; ally.hp = ally.maxHp; b.hp = Math.max(b.hp, 5);
    grew = grew || s.enemies.some(m => m.summoner === b.id && ['chessist', 'lampbearer', 'butcher', 'coffinbearer', 'flutist'].includes(m.type)); dragon = dragon || s.enemies.some(m => m.type === 'inkdragon'); }
  assert.ok(grew, 'heads grow into fighters'); assert.ok(dragon, 'ink dragons come');
  for (let i = 0; i < 6; i++) s.recordTechnique(b, { id: 'heavy' });
  assert.ok(b.learned.includes('heavy'));
  s.scripture = { rule: 'noblock', t: 5, team: b.team }; assert.ok(s.ruled(s.p, 'noblock')); assert.ok(!s.ruled(b, 'noblock'));
  { // the five rules, on a fresh duel
    const [s, b] = duel('scholar'), p = s.p, sc = null;
    s.scripture = { rule: 'noenergy', t: 5, team: b.team }; p.energy = 100; assert.ok(!s.spend(p, 'heavy') && !s.spend(p, 'roll') && s.spend(p, 'strike') && p.energy === 100, 'no breath: only a free plain strike');
    p.tal = { ...(p.tal || {}), dmgTaken: -0.5 }; s.scripture = null; let h1 = p.hp; s.receiveHit(p, b, { dmg: 10, unblockable: true }, 1, 0, true); const soft = h1 - p.hp;
    s.scripture = { rule: 'exposed', t: 5, team: b.team }; h1 = p.hp; s.receiveHit(p, b, { dmg: 10, unblockable: true }, 1, 0, true);
    assert.ok(h1 - p.hp > soft * 1.8, 'nothing shields the flesh'); p.tal.dmgTaken = 0; p.hp = p.maxHp;
    s.scripture = { rule: 'nosummon', t: 5, team: b.team }; const m = s.spawnMinion('bandit', 10, 0, p); assert.ok(m.dead, 'no new summons');
    s.scripture = null; const m2 = s.spawnMinion('bandit', 10, 0, p); m2.state = 'idle'; s.scripture = { rule: 'nosummon', t: 5, team: b.team }; s.updateEnemy(m2); assert.ok(m2.inkBound && !m2.dead, 'summons already out are bound');
    m2.dead = true; s.scripture = sc;
  }
}
// the Sword Immortal: the manual's twelve learnable swords all work in the fighter's hands; he draws his whole manual
{
  for (let n = 1; n <= 12; n++) {
    assert.ok(HERO_ABILITIES['sword' + n] && HERO_ABILITIES['sword' + n].manual === n);
    const s = new Sim('custom', 3, { roster: ['bandit'], loadout: ['sword' + n, null] });
    const e = s.spawnEnemy('bandit', 25, 0); e.state = 'idle'; s.p.energy = 999;
    for (let i = 0; i < 300; i++) { s.step([0, 0, -1, -1, -1, -1, -1, i % 60 === 0 ? 1 : -1, -1]); assert.ok(sane(s.p)); s.p.energy = 999; }
  }
  assert.ok(!HERO_ABILITIES.sword13, 'the Thirteenth Sword is forbidden');
  const [s, b] = duel('swordsaint'); assert.equal(b.def.name, 'Sword Immortal');
  assert.ok(b.specials.every(x => x.sword >= 1 && x.sword <= 8));
  b.hp = b.maxHp * 0.45; s.passives(b); for (let i = 0; i < 120; i++) s.updateEnemy(b);
  assert.ok([10, 11, 12].every(n => b.specials.some(x => x.sword === n)));
  b.ult = ENEMY_TYPES.swordsaint.ult2; b.state = 'ult'; b.ultT = 0; b.ultIdx = 0; const h0 = b.hp;
  for (let i = 0; i < 200; i++) s.updateEnemy(b);
  assert.ok(b.hp < h0, 'the forbidden sword costs him'); assert.equal(b.state, 'stun');
}
// the future self's ultimates include the new bosses'; the rift can pull the new foes
{
  assert.ok(BOSSES_NEW.every(t => BOSSES.includes(t)));
  for (const t of NEW) assert.ok(ROSTER.includes(t));
}

// the Sword Immortal: true damage everywhere; VIII hunts; X cleaves endlessly; XI cannot be stopped; XII slows the world and leaves the moon
{
  const idle = [0, 0, -1, -1, -1, -1, -1, -1, -1];
  const cast = (n, p2) => { const s = new Sim('custom', 3, { roster: ['bandit'], timeLimit: 99 }); s.enemies.length = 0; const b = s.spawnEnemy('swordsaint', -50, 0); b.state = 'idle'; s.p.x = 30; s.p.y = 5; s.p.maxHp = s.p.hp = 1e4; if (p2) { b.phase = 2; b.unity = true; } s.startAttack(b, s.swordCast(b, swordOf(n))); return [s, b]; };
  const run = (s, b, f, each) => { for (let i = 0; i < f; i++) { s.step(idle); b.cds.ai = 9; b.cds.ult = 99; for (const sp of b.specials) b.cds[sp.id] = 9; if (each) each(i); } };
  assert.ok(ENEMY_TYPES.swordsaint.trueDamage, 'every sword is true damage');
  { const [s, b] = cast(8); run(s, b, 40); const h = s.hazards.find(x => x.variant === 'sword'), x0 = h.x; for (let i = 0; i < 20; i++) { s.p.x += 1.5; s.step(idle); } assert.ok(h.x - x0 > 10, 'the celestial sword follows you'); }
  { const [s, b] = cast(10, true); let most = 0, raised = false; run(s, b, 90, () => { most = Math.max(most, s.hazards.filter(h => h.variant === 'cleave').length); raised = raised || b.handRaised; }); assert.ok(most >= 20 && raised, 'a raised hand and a storm of cleaves'); }
  { const [s, b] = cast(11, true); s.p.invulnT = 99; s.p.guard = true; const h0 = s.p.hp; run(s, b, 420); assert.ok(h0 - s.p.hp >= 30, 'the effects land through guard and invulnerability'); }
  { // the second form: X, XI, XII, XIII, IX in order; and the Unfinished Manual keeps him standing until XIII is drawn
    const s = new Sim('custom', 3, { roster: ['bandit'], timeLimit: 999 }); s.enemies.length = 0; const b = s.spawnEnemy('swordsaint', -40, 0); b.state = 'idle';
    s.p.maxHp = s.p.hp = 1e6; b.hp = b.maxHp * 0.3; s.passives(b);
    const order = []; const sc = s.swordCast.bind(s), su = s.startUlt.bind(s);
    s.swordCast = (e, x) => { if (e === b && e.phase === 2) order.push(x.sword); return sc(e, x); };
    s.startUlt = e => { if (e === b && e.phase === 2) order.push(13); return su(e); };
    const pin = () => { s.p.hp = s.p.maxHp; s.p.x = 30; s.p.y = 0; s.p.kvx = s.p.kvy = 0; }; // the fighter stays put on the stage
    for (let i = 0; i < 60 * 90 && order.length < 7; i++) { s.step(idle); pin(); }
    assert.deepEqual(order.slice(0, 7), [10, 11, 12, 13, 9, 10, 11], 'the swords in order, and no Thirteenth to open');
    b.invulnT = 0; s.dealDamage(b, 9999, s.p, 0, 0, 0); assert.ok(b.hp >= 1 && b.deathBound, 'he will not fall mid-manual');
    let died = false, sawXIII = false; for (let i = 0; i < 60 * 40 && !died; i++) { s.step(idle); pin(); if (order.at(-1) === 13) sawXIII = true; died = b.dead || b.hp <= 0; }
    assert.ok(died && sawXIII, 'he falls once the Thirteenth Sword is finished');
  }
  { // the Unfinished Manual: whatever he has left, drawn bigger and with more cuts
    const bound = n => { const s = new Sim('custom', 3, { roster: ['bandit'], timeLimit: 99 }); s.enemies.length = 0; const b = s.spawnEnemy('swordsaint', -50, 0); b.state = 'idle'; b.phase = 2; b.unity = true; b.deathBound = true; b.hp = 1; b.cycleWait = 999; s.p.x = 30; s.p.y = 5; s.p.maxHp = s.p.hp = 1e5; if (n === 13) s.startUlt(b); else s.startAttack(b, s.swordCast(b, swordOf(n))); return [s, b]; };
    const go = (s, b, f, each) => { for (let i = 0; i < f; i++) { s.step(idle); s.p.hp = s.p.maxHp; s.p.x = 30; s.p.y = 5; s.p.kvx = s.p.kvy = 0; b.cycleWait = 999; if (each) each(); } };
    { const [s, b] = bound(10); let most = 0; go(s, b, 100, () => { most = Math.max(most, s.hazards.filter(h => h.variant === 'cleave').length); }); assert.ok(most > 40, 'more cleaves'); }
    { const [s, b] = bound(11); let lines = 0; go(s, b, 80, () => { if (s.karmas && s.karmas[0]) lines = Math.max(lines, s.karmas[0].left); }); assert.ok(lines >= 10, 'more lines of cause'); }
    { const [s, b] = bound(12); let cuts = 0; const orig = s.lineHit.bind(s); s.lineHit = (...a) => { cuts++; return orig(...a); }; go(s, b, 300); assert.ok(cuts >= 16, 'more cuts'); }
    { const [s, b] = bound(13); let strokes = 0; go(s, b, 200, () => { strokes = Math.max(strokes, s.hazards.filter(h => h.variant === 'onesword').length); }); assert.equal(strokes, 3, 'three strokes of the Thirteenth'); }
  }
  { const [s, b] = cast(12, true); let lightHits = 0, formHit = false; run(s, b, 200, () => { const r = s.receiveHit(b, s.p, { dmg: 1, unblockable: true }, 1, 0, true); if (b.swordForm && r !== 'immune') lightHits++; if (!b.swordForm && s.hazards.some(h => h.kind === 'crescentzone') && r !== 'immune') formHit = true; });
    assert.equal(lightHits, 0, 'nothing touches him as sword light'); assert.ok(formHit, 'but he can be struck once he takes form for the crescent'); }
  { const [s, b] = cast(12, true); let cuts = 0; const orig = s.lineHit.bind(s); s.lineHit = (...a) => { cuts++; return orig(...a); }; run(s, b, 200); assert.equal(cuts, 10, 'ten cuts'); }
  { const [s, b] = cast(11, true); b.hp = b.maxHp * 0.5; const h0 = b.hp; run(s, b, 420); assert.ok(b.hp - h0 >= b.maxHp * 0.2, 'every effect that lands heals him'); }
  { const [s, b] = cast(10, true); run(s, b, 20); assert.ok(!(b.invulnT > 0), 'no invincibility for the Ninth to the Eleventh'); { const [s2, b2] = cast(12, true); run(s2, b2, 5); assert.ok(b2.invulnT > 0, 'but the Twelfth makes him untouchable as he draws it'); }
    b.invulnT = 0; const st = b.state; s.receiveHit(b, s.p, { dmg: 5, hitPosture: 500, unblockable: true }, 1, 0); assert.equal(b.state, st, 'nothing interrupts it'); }
  { const s = new Sim('custom', 3, { roster: ['bandit'], timeLimit: 99 }); const b = s.spawnEnemy('swordsaint', -50, 0); b.hp = b.maxHp * 0.3; s.passives(b); for (let i = 0; i < 200; i++) s.updateEnemy(b);
    assert.equal(b.phase, 2); assert.deepEqual(b.specials.map(x => x.sword), [9, 10, 11, 12], 'the second form wields only swords nine to twelve');
    const nine = b.specials[0]; assert.ok(nine.count > 24 && nine.radius > 84, 'its Ninth is grown vast'); }
  { const [s, b] = cast(12, true); let slow = 0, moon = 0; run(s, b, 200, () => { if (s.slowmo) slow++; if (s.hazards.some(h => h.kind === 'crescentzone')) moon++; }); assert.ok(slow > 100 && moon > 100, 'the world slows, and the moon lingers'); }
}
console.log('New foes: mechanics, hero abilities, ??? pool and ' + NEW.length * 4 + ' random duels passed (' + seen.size + ' event kinds seen).');
this.SEEN = [...seen];
`, ctx);
fs.writeFileSync(`${__dirname}/.events.json`, JSON.stringify(ctx.SEEN));
