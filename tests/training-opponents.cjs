const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const ctx = vm.createContext({ console, assert });
vm.runInContext(['agent','sim'].map(n => fs.readFileSync(`js/${n}.js`, 'utf8')).join('\n') + `
for (let seed = 1; seed <= 100; seed++) {
 const wave = SCENARIOS.custom.wave(0, { roster: ['bandit', 'archer'], atOnce: 2 }, mulberry32(seed));
 assert.equal(wave.length, 2); assert.equal(new Set(wave).size, 2);
 const four = SCENARIOS.custom.wave(0, { roster: ['bandit', 'archer'], atOnce: 4 }, mulberry32(seed));
 assert.equal(four.length, 4); assert.equal(new Set(four.slice(0, 2)).size, 2);
}
console.log('Training opponent wave selection passed.');`, ctx);
