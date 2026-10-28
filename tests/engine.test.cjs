const assert=require('node:assert/strict');const {initial,transition}=require('../functions/engine.cjs');
const people=n=>Array.from({length:n},(_,i)=>({uid:'u'+i,name:'Player '+i}));
for(let n=2;n<=6;n++)for(let run=0;run<20;run++){let s=initial(people(n)),steps=0;while(!s.over&&steps++<1000){const p=s.players[s.turn];let a=s.phase==='roll'?'roll':s.phase==='buy'&&p.cash>600?'buy':'end';s=transition(s,p.uid,a);assert(s.players.every(p=>p.cash>=0));assert(s.owners.every(o=>o>=-1&&o<n));}assert(s.over);}
let s=initial(people(6));assert.throws(()=>transition(s,'u1','roll'),/not your turn/);assert.throws(()=>transition(s,'u0','end'),/Roll before/);assert.throws(()=>transition(s,'u0','upgrade',1),/unavailable/);
s.phase='buy';s.pending=1;s=transition(s,'u0','buy');assert.equal(s.owners[1],0);assert.equal(s.players[0].cash,1380);s=transition(s,'u0','upgrade',1);assert.equal(s.players[0].cash,1280);assert.equal(s.levels[1],1);assert.throws(()=>transition(s,'u0','buy'),/unavailable/);s=transition(s,'u0','end');assert.equal(s.turn,1);assert.throws(()=>transition(s,'u0','roll'),/not your turn/);
let original=initial(people(2));transition(original,'u0','roll');assert.equal(original.phase,'roll');
console.log('PASS: 100 complete games, 2–6 players, turn authorisation, phase guards, property ownership, upgrades, immutable transitions.');
