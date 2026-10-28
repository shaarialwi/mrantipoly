import {initial,transition} from './game-engine.js';
import {firebaseConfig} from './firebase-config.js';
const el=id=>document.getElementById(id);let auth,db,fns,user=null,room=null,code='',unsub=null,busy=false,connected=navigator.onLine,liveReady=false;
let chatUnsub=null,chatBusy=false;
const show=(id,on)=>{el(id).hidden=!on};const message=t=>{el('online-error').textContent=t;if(t){show('online-panel',true);window.accountOpen=true}};
const allowedAccount=u=>!!u?.emailVerified && /^[^@\s]+@mranti\.my$/i.test(u.email||'');
const notice=t=>{el('connection').textContent=t};
function controls(){document.querySelectorAll('#online-panel button').forEach(b=>b.disabled=busy||!connected);if(room){el('start-room').disabled=busy||!connected||room.host!==user?.uid||room.members.length<2||room.status!=='waiting';el('skip-turn').disabled=busy||!connected||room.host!==user?.uid||room.status!=='playing';}if(room?.state){document.querySelectorAll('#roll,#buy,#end').forEach(b=>b.disabled=false);window.paintOnline(room.state,user?.uid);if(busy||!connected||!liveReady)window.lockGame();}}
async function task(fn){if(busy)return;busy=true;message('');controls();try{await fn()}catch(e){const fixes={'permission-denied':'Access denied. Confirm the Spark Firestore rules are published in premium-hybrid-471106-a7 and sign in with your MRANTI Google account.','resource-exhausted':'The Firebase usage limit was reached. Please try again after the quota resets.','unavailable':'Firestore is unavailable. Check your connection and confirm the default database exists.'};if(fixes[e.code]){message(fixes[e.code]);return;}const generic=['auth/invalid-credential','auth/user-not-found','auth/wrong-password'];message(generic.includes(e.code)?'Unable to sign in. Check your email and password.':e.message||'Unable to connect. Please try again.');}finally{busy=false;controls()}}
function stopRoom(){chatUnsub?.();chatUnsub=null;show("room-chat",false);el("chat-messages").replaceChildren();unsub?.();unsub=null;room=null;code='';liveReady=false;show('game-main',false);show('lobby',false);show('online-panel',true);show('room-panel',allowedAccount(user));}
function openRoom(c){unsub?.();chatUnsub?.();chatUnsub=null;code=c;liveReady=false;try{localStorage.setItem('mranti-room-'+user.uid,c)}catch{};show('room-panel',false);show('lobby',true);notice('Connecting to room…');unsub=fns.onSnapshot(fns.doc(db,'sparkRooms',c),{includeMetadataChanges:true},snap=>{if(!snap.exists()){message('This room no longer exists.');return}room=snap.data();if(!chatUnsub)watchChat(c);el('lobby-status').textContent=room.status==='waiting'?room.members.length+'/4 players joined. '+(room.members.length<2?'Waiting for at least one more player.':'You can wait for more players. Only the host starts the game.'):'Game started — new players cannot join.';connected=navigator.onLine;liveReady=connected&&!snap.metadata.fromCache&&!snap.metadata.hasPendingWrites;notice(liveReady?'Live sync connected':'Reconnecting… actions are paused.');el('room-title').textContent='ROOM '+c;el('room-members').replaceChildren(...room.members.map((m,i)=>{const d=document.createElement('div');d.textContent=(i+1)+'. '+m.name+(m.uid===room.host?' · Host':'')+(m.uid===user?.uid?' · You':'');return d}));show('start-room',room.status==='waiting');show('return-game',!!room.state);show('skip-turn',!!room.state&&room.host===user?.uid&&room.status==='playing');if(room.state){show('game-main',true);if(!window.accountOpen)show('online-panel',false)}controls();},error=>{connected=navigator.onLine;liveReady=false;message('Room connection failed: '+error.message+' Check the Spark Firestore rules, then leave this view and rejoin.');show('online-panel',true);controls()});}
window.onlineAction=(action,index)=>task(async()=>{if(!room||!connected||!liveReady)throw Error('Wait for the room to reconnect.');const revision=room.revision;await act({code,action,index:index??null,revision});});
el('reset').onclick=()=>{window.accountOpen=true;show('online-panel',true);el('online-panel').scrollIntoView({behavior:'smooth'})};
window.addEventListener('offline',()=>{connected=false;notice('You are offline. Your seat is saved; reconnect to continue.');controls()});window.addEventListener('online',()=>{connected=true;if(code)openRoom(code);else controls()});
async function boot(){if(firebaseConfig.apiKey.startsWith('PASTE')||firebaseConfig.projectId==='YOUR_PROJECT'){notice('Online setup is not connected yet.');message('The game owner must complete SETUP.md and add the Firebase web configuration in firebase-config.js.');document.querySelectorAll('#online-panel button').forEach(b=>b.disabled=true);return;}
const [appAPI,authAPI,storeAPI]=await Promise.all(['app','auth','firestore'].map(x=>import('https://www.gstatic.com/firebasejs/12.19.0/firebase-'+x+'.js')));
const app=appAPI.initializeApp(firebaseConfig);auth=authAPI.getAuth(app);db=storeAPI.getFirestore(app);fns=storeAPI;
const provider=new authAPI.GoogleAuthProvider();
provider.setCustomParameters({hd:'mranti.my',prompt:'select_account'});
el('google-signin').onclick=()=>task(async()=>{
 const result=await authAPI.signInWithPopup(auth,provider);
 await result.user.getIdToken(true);
 // UI validation is also enforced independently by the backend and Firestore rules.
 if(!allowedAccount(result.user)){
  await authAPI.signOut(auth);
  throw Error('Use your @mranti.my Google Workspace account. Personal and other-domain accounts cannot access this game.');
 }
});
el('signout').onclick=()=>task(async()=>{stopRoom();await authAPI.signOut(auth)});
el('create-room').onclick=()=>task(async()=>{const r=await createRoom(el('room-name').value.trim());window.accountOpen=false;openRoom(r.code)});
el('join-room').onclick=()=>task(async()=>{const r=await joinRoom(el('room-code').value.trim().toUpperCase(),el('room-name').value.trim());window.accountOpen=false;openRoom(r.code)});
el('start-room').onclick=()=>task(async()=>{await startRoom(code);window.accountOpen=false;show('online-panel',false)});
el('return-game').onclick=()=>{window.accountOpen=false;show('online-panel',false);show('game-main',true)};
el('skip-turn').onclick=()=>window.onlineAction('skip');el('leave-room').onclick=stopRoom;
el('copy-room').onclick=()=>task(async()=>{await navigator.clipboard.writeText(code);notice('Room code copied. Share it with your players.');});
async function account(u){
 if(room&&u?.uid!==user?.uid)stopRoom();
 if(u){
  try{
   const token=await u.getIdTokenResult();
   if(!allowedAccount(u)||token.claims.firebase?.sign_in_provider!=='google.com'){
    stopRoom();await authAPI.signOut(auth);
    message('Access is restricted to verified @mranti.my accounts signed in with Google.');return;
   }
  }catch(e){stopRoom();await authAPI.signOut(auth);message('Unable to validate sign-in. Please try again.');return;}
 }
 user=u;show('auth-panel',!u);show('room-panel',!!u&&!room);show('signout',!!u);
 if(!u){stopRoom();notice('Sign in with your MRANTI Google account to create or join a room.');return;}
 el('account-email').textContent='Signed in as '+u.email;
 el('room-name').value=(u.displayName||u.email.split('@')[0]).slice(0,20);
 notice('MRANTI account verified. Ready to play.');
 try{el('room-code').value=localStorage.getItem('mranti-room-'+u.uid)||''}catch{}
}
authAPI.onAuthStateChanged(auth,u=>{account(u).catch(e=>message(e.message))});}
boot().catch(e=>{notice('Online services could not load.');message(e.message+' Check your network, Firebase configuration and deployment.');document.querySelectorAll('#online-panel button').forEach(b=>b.disabled=true)});

// Spark room operations: all writes are atomic Firestore transactions.
function requireUser(){if(!allowedAccount(user))throw Error('Sign in with your verified MRANTI Google account.');return user.uid;}
function playerName(n){n=n.trim();if(!n||n.length>20)throw Error('Enter a player name of 1–20 characters.');return n;}
function refFor(c){if(!/^[A-F0-9]{20}$/.test(c))throw Error('Paste the 20-character code generated by the host. Create a room first; do not invent a code.');return fns.doc(db,'sparkRooms',c);}
function readRoom(snap){if(!snap.exists())throw Error('Room not found. Check the code with your host.');const r=snap.data();if(r.expiresAt.toMillis()<Date.now())throw Error('This room expired. Create a new room.');return r;}
async function createRoom(n){const uid=requireUser(),name=playerName(n);const bytes=crypto.getRandomValues(new Uint8Array(10));const c=Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('').toUpperCase();const ref=refFor(c);await fns.runTransaction(db,async tx=>{const snap=await tx.get(ref);if(snap.exists())throw Error('Room code collision. Please click Create room again.');tx.set(ref,{host:uid,uids:[uid],members:[{uid,name}],status:'waiting',state:null,revision:0,createdAt:fns.serverTimestamp(),updatedAt:fns.serverTimestamp(),turnStartedAt:fns.serverTimestamp(),expiresAt:fns.Timestamp.fromMillis(Date.now()+7*86400000),lastAction:'create'});});return {code:c};}
async function joinRoom(c,n){const uid=requireUser(),name=playerName(n),ref=refFor(c);await fns.runTransaction(db,async tx=>{const r=readRoom(await tx.get(ref));if(r.uids.includes(uid))return;if(r.status!=='waiting')throw Error('This game has started. Ask the host to create a new room.');if(r.uids.length>=4)throw Error('This room already has four players.');tx.update(ref,{uids:[...r.uids,uid],members:[...r.members,{uid,name}],revision:r.revision+1,updatedAt:fns.serverTimestamp(),lastAction:'join'});});return {code:c};}
async function startRoom(c){const uid=requireUser(),ref=refFor(c);await fns.runTransaction(db,async tx=>{const r=readRoom(await tx.get(ref));if(r.host!==uid)throw Error('Only the host can start.');if(r.status!=='waiting'||r.members.length<2)throw Error('Wait for at least two players before starting.');tx.update(ref,{state:initial(r.members),status:'playing',revision:r.revision+1,updatedAt:fns.serverTimestamp(),turnStartedAt:fns.serverTimestamp(),lastAction:'start'});});}
async function act({code:c,action,index,revision}){const uid=requireUser(),ref=refFor(c);await fns.runTransaction(db,async tx=>{const r=readRoom(await tx.get(ref));if(!r.uids.includes(uid))throw Error('Join this room first.');if(r.status!=='playing')throw Error('This game is not in progress.');if(revision!==r.revision)throw Error('The board changed. Wait for the latest update and try again.');let actor=uid;if(action==='skip'){if(r.host!==uid)throw Error('Only the host can skip.');if(Date.now()-r.turnStartedAt.toMillis()<120000)throw Error('A turn can be skipped after two minutes.');actor=r.state.players[r.state.turn].uid;}const state=transition(r.state,actor,action,index);const patch={state,status:state.over?'finished':'playing',revision:r.revision+1,updatedAt:fns.serverTimestamp(),lastAction:action};if(state.turn!==r.state.turn||state.round!==r.state.round)patch.turnStartedAt=fns.serverTimestamp();tx.update(ref,patch);});}

function watchChat(c){
 show('room-chat',true);el('chat-messages').replaceChildren();
 const q=fns.query(fns.collection(db,'sparkRooms',c,'messages'),fns.orderBy('createdAt','desc'),fns.limit(50));
 chatUnsub=fns.onSnapshot(q,snap=>{
  const rows=snap.docs.slice().reverse().map(d=>{const m=d.data(),row=document.createElement('p'),name=document.createElement('strong');name.textContent=m.name+': ';row.append(name,document.createTextNode(m.text));return row;});
  el('chat-messages').replaceChildren(...rows);el('chat-messages').scrollTop=el('chat-messages').scrollHeight;
 },()=>{el('chat-status').textContent='Chat unavailable. Publish the updated Firestore rules, then rejoin the room.';});
}
el('chat-form').onsubmit=async e=>{
 e.preventDefault();if(chatBusy)return;
 const text=el('chat-input').value.trim(),c=code;
 if(!text||!room||!user)return;
 if(!navigator.onLine){el('chat-status').textContent='Reconnect before sending a message.';return;}
 const member=room.members.find(m=>m.uid===user.uid);if(!member)return;
 chatBusy=true;el('chat-send').disabled=true;
 try{await fns.addDoc(fns.collection(db,'sparkRooms',c,'messages'),{uid:user.uid,name:member.name,text,createdAt:fns.serverTimestamp()});if(code===c){el('chat-input').value='';el('chat-status').textContent='Message sent. Only room members can read it.';}}
 catch(e){el('chat-status').textContent='Message could not be sent. Check your connection and the updated chat rules.';}
 finally{chatBusy=false;el('chat-send').disabled=false;}
};
