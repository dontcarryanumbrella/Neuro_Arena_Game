const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ctx = vm.createContext({ console, assert });
vm.runInContext(['agent', 'sim'].map(n => fs.readFileSync(`${__dirname}/../js/${n}.js`, 'utf8')).join('\n') + `
for (let tier = 0; tier < TIERS.length; tier++) assert.ok(RACES.filter(r => r.tier === tier).length >= 2);
assert.equal(new Set(RACES.map(r => r.id)).size, RACES.length);
const plain = new Sim('custom', 1, { race: 'unformed' }).p;
const human = new Sim('custom', 1, { race: 'human' }).p;
const stone = new Sim('custom', 1, { race: 'stoneborn', talents: ['ironskin'] }).p;
assert.equal(plain.maxHp, DEFAULT_FIGHTER.hp);
assert.equal(human.energyMax, DEFAULT_FIGHTER.energy + 6);
assert.ok(human.energyRegen > plain.energyRegen);
assert.equal(stone.maxHp, DEFAULT_FIGHTER.hp + 5 + 15);
assert.ok(stone.tal.speed < 0);
for (const race of RACES) {
  const sim = new Sim('custom', 2, { race: race.id, roster: ['bandit'], atOnce: 1, timeLimit: 4 });
  for (let i = 0; i < 120 && !sim.done; i++) sim.step([0,0,1,-1,-1,-1,-1,-1,-1]);
  assert.ok(Number.isFinite(sim.p.hp) && sim.p.maxHp > 0 && sim.p.energyRegen > 0, race.id);
}
const net = new Sim('battle', 2, { battle: { slots: [{kind:'ai',team:0},{kind:'net',team:1,card:{name:'Saved',race:'voidwalker'}}] } });
assert.equal(net.heroes[1].race, 'voidwalker');
assert.ok(net.heroes[1].tal.abilityCd < 0, 'a saved card keeps its race');
assert.equal(new Sim('custom', 1, {race:'obsolete'}).p.race, 'unformed');
// races stay small: no talent's signature effect, and no number as large as the talent that grants it
const numeric = ['hp', 'energy', 'posture', 'speed', 'strikeDmg', 'regen', 'dmgTaken', 'heavyDmg', 'rollCd', 'kickPosture', 'lifesteal', 'parryWin', 'postureDmg', 'comboCap', 'abilityCd', 'lowHpDmg', 'blockPosture', 'allDmg'];
for (const race of RACES) for (const [k, v] of Object.entries(race.mods)) {
  assert.ok(numeric.includes(k), race.id + ' uses a talent effect: ' + k);
  const talent = Math.max(...TALENTS.filter(t => t.mods[k] != null && Object.keys(t.mods).length === 1).map(t => Math.abs(t.mods[k])), ...TALENTS.filter(t => t.mods[k] != null).map(t => Math.abs(t.mods[k])));
  assert.ok(Math.abs(v) < talent, race.id + ': ' + k + ' ' + v + ' is as large as a talent');
}
console.log('Races: tiers, stacking, combat, saved-card migration and small, talent-free effects passed.');
`, ctx);

const main = fs.readFileSync(`${__dirname}/../js/main.js`, 'utf8');
const rollTierSource = main.slice(main.indexOf('function rollTier('), main.indexOf('function drawTalent('));
const spinRaceSource = main.slice(main.indexOf('function spinRace('), main.indexOf('function buildRaces('));
vm.runInContext(`
const state = { jade: 5000, race: { owned: { unformed: 1 }, equipped: 'unformed', spins: 0, pity: 0 } };
const SPIN_COST = 100, PITY = 30, DUP_REFUND = [10,15,25,40,70,150];
const box = { hidden: true, style: {}, innerHTML: '' };
const $ = () => box;
const sfx = { unlock() {}, play() {} };
function saveStore() {} function refreshJade() {} function buildRaces() {}
Math.random = () => 0;
` + rollTierSource + spinRaceSource + `
for (let i = 0; i < 29; i++) spinRace();
assert.equal(state.race.pity, 29);
assert.equal(state.race.equipped, 'unformed');
assert.equal(state.jade, 2380); // one new white, followed by 28 refunds
spinRace();
assert.equal(state.race.pity, 0);
assert.ok(state.race.owned.ashen);
assert.equal(state.race.spins, 30);
assert.equal(state.race.equipped, 'unformed');
console.log('Races: pity, jade, duplicate refunds and equipment choice passed.');
`, ctx);
