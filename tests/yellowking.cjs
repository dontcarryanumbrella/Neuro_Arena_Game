const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ctx = vm.createContext({ console, assert });
vm.runInContext(['agent','sim'].map(n => fs.readFileSync(`${__dirname}/../js/${n}.js`, 'utf8')).join('\n') + `
function fixture() {
  const s = new Sim('custom', 42);
  const k = s.spawnEnemy('yellowking', 30, 0); k.state = 'idle';
  s.p.x = 0; s.p.y = 0; return [s,k];
}
{
 const [s,k] = fixture(), n = s.spawnEnemy('necromancer',-30,0,0);
 const m = s.spawnMinion('zombie',0,0,n);
 assert.equal(m.team,k.team); assert.equal(m.summoner,k.id);
 s.stopTime(n,2); assert.ok(!(k.frozenT > 0));
 s.addPosture(k,1000); assert.equal(k.posture,0);
 s.receiveHit(k,n,{dmg:1,root:4,kb:400},1,0);
 assert.equal(k.rootT,0); assert.equal(k.kvx,0);
 s.inflictFear(k,n,3); assert.ok(!(k.fearT > 0));
 s.p.tal = { voidWalk:1, shadowStep:1 }; s.p.state='roll';
 assert.equal(s.airborne(s.p,k),false);
 const hp=s.p.hp; s.cosmicHit(k,s.p,10); assert.ok(s.p.hp<hp);
}
{
 const [s,k] = fixture();
 s.silkFlight(k,s.p); const h=s.cosmicFields[0];
 s.p.x=h.x; s.p.y=h.y; const hp=s.p.hp;
 for(let i=0;i<119;i++) s.updateYellowCourt(); assert.equal(s.p.hp,hp);
 for(let i=0;i<3;i++) s.updateYellowCourt(); assert.ok(s.p.hp<hp); assert.ok(s.p.fearT>0);
 k.hp=k.maxHp*0.49; s.passives(k); assert.equal(k.state,'transform');
 for(let i=0;i<100;i++) if(k.state==='transform') s.updateTransform(k);
 assert.equal(k.phase,2); assert.ok(k.specials.some(a=>a.id==='cosmiceye'));
 const ally=s.spawnEnemy('bandit',0,0,k.team), ah=ally.hp;
 const before=s.p.hp; s.updateYellowCourt(); assert.ok(s.p.hp<before); assert.equal(ally.hp,ah);
 k.atk=k.specials.find(a=>a.id==='cosmiceye'); s.special(k); assert.ok(s.p.fearT>0);
 const puppet=s.spawnMinion('courtier',s.p.x,s.p.y,k); puppet.state='idle';
 const ph=s.p.hp; s.updateEnemy(puppet); assert.ok(s.p.hp<ph); assert.equal(puppet.latched,s.p.id);
 s.ultStep(k,'galaxyfall',{},s.p); const gh=s.p.hp;
 for(let i=0;i<155;i++) s.updateYellowCourt(); assert.ok(s.p.hp<gh);
 k.dead=true; s.updateYellowCourt(); assert.equal(s.cosmicFields.length,0);
}
// Dash healing is capped, cannot revive the dead, and the reduced aura ticks once a second.
{
 const [s,k]=fixture(); k.hp=k.maxHp*.6;
 const before=k.hp;s.silkFlight(k,s.p);
 assert.ok(Math.abs(k.hp-before-k.maxHp*.04)<1e-9);
 k.hp=k.maxHp-1;s.silkFlight(k,s.p);assert.equal(k.hp,k.maxHp);
 k.hp=0;k.dead=true;s.silkFlight(k,s.p);assert.equal(k.hp,0);
}
{
 const [s,k]=fixture();k.phase=2;k.dmgMul=1;
 const hp=s.p.hp;s.updateYellowCourt();
 assert.ok(Math.abs(hp-s.p.hp-s.p.maxHp*.0075)<1e-9);
 const after=s.p.hp;s.t=.99;s.updateYellowCourt();assert.equal(s.p.hp,after);
 s.t=1.01;s.updateYellowCourt();assert.ok(s.p.hp<after);
}
// The star merger hits once, spares teammates, and permits escaping the marked blast.
{
 const [s,k]=fixture();
 const ally=s.spawnEnemy('bandit',0,0,k.team); ally.state='idle';
 const far=s.spawnEnemy('bandit',110,0,0); far.state='idle';
 const hp=s.p.hp, ah=ally.hp, fh=far.hp;
 s.ultStep(k,'blackstars',{},s.p);
 for(let i=0;i<275;i++) s.updateYellowCourt();
 assert.equal(s.p.hp,hp); // No invisible beam damage before the merger.
 const h=s.cosmicFields[0];
 assert.ok(Math.hypot(h.stars[0].x,h.stars[0].y)<3);
 // Pulling is part of the spell; place the evasive fighter beyond the blast at impact.
 far.x=110;far.y=0;
 for(let i=0;i<3;i++) s.updateYellowCourt();
 assert.ok(s.p.hp<hp-30); assert.equal(ally.hp,ah); assert.equal(far.hp,fh);
 const after=s.p.hp;
 for(let i=0;i<60;i++) s.updateYellowCourt();assert.equal(s.p.hp,after);
 assert.ok(blackStarPositions(0)[0].x===48);
 assert.ok(Math.hypot(...Object.values(blackStarPositions(BLACK_STAR_MERGE)[0]))===0);
}
// Exercise every boss against the new King, including copied ultimates and summon paths.
for (const foe of BOSSES) for (let seed=1;seed<=3;seed++) {
 const s=new Sim('battle',seed,{battle:{slots:[{kind:'yellowking',team:0},{kind:foe,team:1}],timeLimit:60}});
 for (const f of s.enemies) f.hp=f.maxHp*0.49;
 for(let i=0;i<3600 && !s.done;i++) s.step();
 for(const f of s.fighters()) assert.ok(Number.isFinite(f.hp)&&Number.isFinite(f.x)&&Number.isFinite(f.y));
}
console.log('King in Yellow: mechanics and 27 boss-matchup simulations passed.');
`, ctx);

