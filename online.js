import {firebaseConfig,functionsRegion} from './firebase-config.js';
const el=id=>document.getElementById(id);let auth,db,fns,user=null,room=null,code='',unsub=null,busy=false,connected=navigator.onLine;
const show=(id,on)=>{el(id).hidden=!on};const message=t=>{el('online-error').textContent=t;if(t){show('online-panel',true);window.accountOpen=true}};
const allowedAccount=u=>!!u?.emailVerified && /^[^@\s]+@mranti\.my$/i.test(u.email||'');
const notice=t=>{el('connection').textContent=t};
function controls(){document.querySelectorAll('#online-panel button').forEach(b=>b.disabled=busy||!connected);if(room){el('start-room').disabled=busy||!connected||room.host!==user?.uid||room.members.length<2||room.status!=='waiting';el('skip-turn').disabled=busy||!connected||room.host!==user?.uid||room.status!=='playing';}if(room?.state){document.querySelectorAll('#roll,#buy,#end').forEach(b=>b.disabled=false);window.paintOnline(room.state,user?.uid);if(busy||!connected)window.lockGame();}}
async function task(fn){if(busy)return;busy=true;message('');controls();try{await fn()}catch(e){const generic=['auth/invalid-credential','auth/user-not-found','auth/wrong-password'];message(generic.includes(e.code)?'Unable to sign in. Check your email and password.':e.message||'Unable to connect. Please try again.');}finally{busy=false;controls()}}
function stopRoom(){unsub?.();unsub=null;room=null;code='';show('game-main',false);show('lobby',false);show('online-panel',true);show('room-panel',allowedAccount(user));}
function openRoom(c){unsub?.();code=c;try{localStorage.setItem('mranti-room-'+user.uid,c)}catch{};show('room-panel',false);show('lobby',true);notice('Connecting to room…');unsub=fns.onSnapshot(fns.doc(db,'rooms',c),{includeMetadataChanges:true},snap=>{if(!snap.exists){message('This room no longer exists.');return}room=snap.data();connected=navigator.onLine&&!snap.metadata.fromCache;notice(connected?'Live sync connected':'Reconnecting… actions are paused.');el('room-title').textContent='ROOM '+c;el('room-members').replaceChildren(...room.members.map((m,i)=>{const d=document.createElement('div');d.textContent=(i+1)+'. '+m.name+(m.uid===room.host?' · Host':'')+(m.uid===user?.uid?' · You':'');return d}));show('start-room',room.status==='waiting');show('return-game',!!room.state);show('skip-turn',!!room.state&&room.host===user?.uid&&room.status==='playing');if(room.state){show('game-main',true);if(!window.accountOpen)show('online-panel',false)}controls();},error=>{connected=false;message(error.message);show('online-panel',true);controls()});}
window.onlineAction=(action,index)=>task(async()=>{if(!room||!connected)throw Error('Wait for the room to reconnect.');const revision=room.revision;await fns.httpsCallable(fns.functions,'gameAction')({code,action,index:index??null,revision});});
el('reset').onclick=()=>{window.accountOpen=true;show('online-panel',true);el('online-panel').scrollIntoView({behavior:'smooth'})};
window.addEventListener('offline',()=>{connected=false;notice('You are offline. Your seat is saved; reconnect to continue.');controls()});window.addEventListener('online',()=>{connected=true;if(code)openRoom(code);else controls()});
async function boot(){if(firebaseConfig.apiKey.startsWith('PASTE')||firebaseConfig.projectId==='YOUR_PROJECT'){notice('Online setup is not connected yet.');message('The game owner must complete SETUP.md and add the Firebase web configuration in firebase-config.js.');document.querySelectorAll('#online-panel button').forEach(b=>b.disabled=true);return;}
const [appAPI,authAPI,storeAPI,fnAPI]=await Promise.all(['app','auth','firestore','functions'].map(x=>import('https://www.gstatic.com/firebasejs/12.19.0/firebase-'+x+'.js')));
const app=appAPI.initializeApp(firebaseConfig);auth=authAPI.getAuth(app);db=storeAPI.getFirestore(app);fns={...storeAPI,...fnAPI,functions:fnAPI.getFunctions(app,functionsRegion)};
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
el('create-room').onclick=()=>task(async()=>{const r=await fnAPI.httpsCallable(fns.functions,'createRoom')({name:el('room-name').value.trim()});window.accountOpen=false;openRoom(r.data.code)});
el('join-room').onclick=()=>task(async()=>{const r=await fnAPI.httpsCallable(fns.functions,'joinRoom')({code:el('room-code').value.trim().toUpperCase(),name:el('room-name').value.trim()});window.accountOpen=false;openRoom(r.data.code)});
el('start-room').onclick=()=>task(async()=>{await fnAPI.httpsCallable(fns.functions,'startRoom')({code});window.accountOpen=false;show('online-panel',false)});
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
