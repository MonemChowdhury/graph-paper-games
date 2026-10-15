/* Graph Paper Games — screens, turn flow, computer play and online play.
   Online play is direct phone-to-phone (WebRTC via PeerJS). The free PeerJS
   broker only introduces the two devices; no game data is stored anywhere. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const PREFIX='gpgames-v1-';
const CODE_CHARS='ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/* ---------- screens & navigation ---------- */
let screen='home';
function show(id){
  document.querySelectorAll('.screen').forEach(s=>s.hidden=s.id!==id);
  screen=id;window.scrollTo(0,0);
}
function goBack(){
  if(screen==='play'||screen==='wait'){leaveOnline();show(screen==='play'?'home':'modes');return}
  if(screen==='join'){show('modes');return}
  if(screen==='modes'){show('home');return}
}
document.querySelectorAll('[data-back]').forEach(b=>b.onclick=goBack);

/* Android hardware back button (Capacitor App plugin, when running as an app) */
try{
  const App=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.App;
  if(App)App.addListener('backButton',()=>{if(screen==='home')App.exitApp();else goBack()});
}catch(e){}

/* ---------- home ---------- */
const ICONS={
  ttt:`<svg viewBox="0 0 80 80"><g stroke="var(--ink)" stroke-width="2.5" stroke-linecap="round"><path d="M28 8V72M52 8V72M8 28H72M8 52H72"/></g><path d="M12 12L24 24M24 12L12 24" stroke="var(--p0)" stroke-width="4" stroke-linecap="round"/><circle cx="40" cy="40" r="7" fill="none" stroke="var(--p1)" stroke-width="4"/><path d="M56 56L68 68M68 56L56 68" stroke="var(--p0)" stroke-width="4" stroke-linecap="round"/></svg>`,
  c4:`<svg viewBox="0 0 80 80"><rect x="6" y="14" width="68" height="58" rx="6" fill="none" stroke="var(--ink)" stroke-width="2.5"/>${[0,1,2,3].map(r=>[0,1,2,3].map(c=>{const f=(r===3&&c<3)?'var(--p0)':(r===2&&c===1)||(r===3&&c===3)?'var(--p1)':(r===2&&c===2)?'var(--p0)':'none';return`<circle cx="${18+c*15}" cy="${25+r*14}" r="5.5" fill="${f}" stroke="var(--line)" stroke-width="1.5"/>`}).join('')).join('')}</svg>`,
  dab:`<svg viewBox="0 0 80 80"><rect x="16" y="16" width="24" height="24" fill="color-mix(in srgb,var(--p0) 25%,transparent)"/><path d="M16 16H40V40H16Z" fill="none" stroke="var(--p0)" stroke-width="4" stroke-linecap="round"/><path d="M40 40H64M40 40V64" stroke="var(--p1)" stroke-width="4" stroke-linecap="round"/>${[16,40,64].map(y=>[16,40,64].map(x=>`<circle cx="${x}" cy="${y}" r="4" fill="var(--ink)"/>`).join('')).join('')}</svg>`
};
const BLURB={ttt:'Three in a row. Quick rounds.',c4:'Drop discs, line up four.',dab:'Draw lines, claim boxes.'};
$('gameCards').innerHTML=Object.values(GAMES).map(g=>
  `<button class="card" data-g="${g.id}">${ICONS[g.id]}<span><h3>${g.name}</h3><p>${BLURB[g.id]}</p></span></button>`).join('');
let pickedGame='ttt';
document.querySelectorAll('.card').forEach(c=>c.onclick=()=>{
  pickedGame=c.dataset.g;const g=GAMES[pickedGame];
  $('modeTitle').textContent=g.name;$('modeRules').textContent=g.rules;show('modes');
});

/* ---------- match state ---------- */
let M=null; // {game, mode, level, me, names, round, first, s, wins:[p0,p1,draws], counted}
let aiTimer=null;
function startMatch(gameId,mode,opts){
  clearTimeout(aiTimer);
  const game=GAMES[gameId];
  M={game,mode,level:opts.level||'hard',me:opts.me??0,round:opts.round||1,first:opts.first??0,
     wins:opts.wins||[0,0,0],counted:false};
  M.names=mode==='local'?['Blue','Red']:mode==='cpu'?['You','Computer']:(M.me===0?['You','Friend']:['Friend','You']);
  M.s=game.init(M.first);
  show('play');update();
}
function newRound(round){
  clearTimeout(aiTimer);
  M.round=round;M.first=1-M.first;M.s=M.game.init(M.first);M.counted=false;update();
}

/* ---------- turn flow ---------- */
function canPlay(){
  if(!M||M.game.result(M.s))return false;
  if(M.mode==='local')return true;
  if(M.mode==='online'&&!(net.conn&&net.conn.open))return false;
  return M.s.turn===M.me;
}
function onMove(m){
  if(!canPlay()||!M.game.legal(M.s,m))return;
  M.game.apply(M.s,m);
  if(M.mode==='online')net.send({t:'move',r:M.round,m});
  buzz();update();
}
function buzz(){try{navigator.vibrate&&navigator.vibrate(12)}catch(e){}}
function update(){
  const {game,s}=M,res=game.result(s);
  if(res&&!M.counted){M.counted=true;if(res.winner==='D')M.wins[2]++;else M.wins[res.winner]++}
  game.render($('board'),s,{canPlay:canPlay(),onMove});
  // player cards
  for(const p of [0,1]){
    $('nm'+p).textContent=M.names[p];$('sc'+p).textContent=M.wins[p];
    $('pl'+p).classList.toggle('turn',!res&&s.turn===p);
  }
  // status line
  const st=$('status');
  if(res){
    if(res.winner==='D')st.textContent="It's a draw.";
    else if(M.mode==='local')st.textContent=`${M.names[res.winner]} wins!`;
    else st.textContent=res.winner===M.me?'You win!':(M.mode==='cpu'?'Computer wins.':'Your friend wins.');
  }else if(M.mode==='online'&&!(net.conn&&net.conn.open)){
    st.textContent='Your friend left the game.';
  }else if(M.mode==='local'){
    st.textContent=`${M.names[s.turn]}'s turn`;
  }else{
    st.textContent=s.turn===M.me?'Your turn':(M.mode==='cpu'?'Thinking…':"Friend's turn");
  }
  st.style.color=res?'':`var(--p${s.turn})`;
  // round info
  const sc=game.score(s);
  $('roundInfo').textContent=(sc?`Boxes: ${M.names[0]} ${sc[0]} · ${M.names[1]} ${sc[1]}  ·  `:'')+`Round ${M.round}`+(M.wins[2]?` · Draws ${M.wins[2]}`:'');
  $('rematch').disabled=!res||(M.mode==='online'&&!(net.conn&&net.conn.open));
  // computer's move
  if(!res&&M.mode==='cpu'&&s.turn!==M.me){
    clearTimeout(aiTimer);
    aiTimer=setTimeout(()=>{
      if(!M||M.mode!=='cpu'||M.game.result(M.s)||M.s.turn===M.me)return;
      const m=M.game.ai(M.s,M.level);
      if(M.game.legal(M.s,m)){M.game.apply(M.s,m);update()}
    },game.id==='c4'&&M.level==='hard'?250:450);
  }
}
$('rematch').onclick=()=>{
  const r=M.round+1;newRound(r);
  if(M.mode==='online')net.send({t:'rematch',r});
};

/* ---------- mode buttons ---------- */
// Blue (you) moves first in round 1; each "Play again" swaps who starts.
$('cpuEasy').onclick=()=>startMatch(pickedGame,'cpu',{level:'easy',first:0});
$('cpuHard').onclick=()=>startMatch(pickedGame,'cpu',{level:'hard',first:0});
$('local2').onclick=()=>startMatch(pickedGame,'local',{first:0});

/* ---------- online ---------- */
const net={peer:null,conn:null,code:'',
  send(msg){try{if(this.conn&&this.conn.open)this.conn.send(msg)}catch(e){}}};
function setPill(text,on){const p=$('netPill');p.hidden=!text;p.textContent=text||'';p.classList.toggle('on',!!on)}
function leaveOnline(){
  try{net.conn&&net.conn.close()}catch(e){}
  try{net.peer&&net.peer.destroy()}catch(e){}
  net.peer=null;net.conn=null;setPill('');
}
function makeCode(){let s='';const a=new Uint32Array(5);crypto.getRandomValues(a);for(const n of a)s+=CODE_CHARS[n%CODE_CHARS.length];return s}
function peerAvailable(){return typeof Peer!=='undefined'}

function wire(conn,role){
  net.conn=conn;
  conn.on('open',()=>{
    setPill('connected',true);
    if(role==='host'){
      startMatch(pickedGame,'online',{me:0,first:0});
      net.send({t:'hello',v:1,game:pickedGame,round:M.round,first:M.first});
    }
  });
  conn.on('data',msg=>{
    if(!msg||typeof msg!=='object')return;
    if(msg.t==='hello'&&role==='guest'&&GAMES[msg.game]){
      pickedGame=msg.game;
      startMatch(msg.game,'online',{me:1,first:msg.first===1?1:0,round:+msg.round||1});
      return;
    }
    if(msg.t==='full'){$('joinErr').textContent='That game already has two players.';return}
    if(!M||M.mode!=='online')return;
    if(msg.t==='move'&&msg.r===M.round&&M.s.turn!==M.me&&M.game.legal(M.s,msg.m)){
      M.game.apply(M.s,msg.m);buzz();update();
    }
    if(msg.t==='rematch'&&Number.isInteger(msg.r)&&msg.r>M.round)newRound(msg.r);
  });
  conn.on('close',()=>{setPill('disconnected',false);if(M&&M.mode==='online'&&screen==='play')update()});
  conn.on('error',()=>setPill('connection error',false));
}

$('hostBtn').onclick=()=>{
  show('wait');$('codeShow').textContent='· · · · ·';$('copyCode').disabled=true;
  if(!peerAvailable()){$('waitMsg').textContent='Online play could not start. Restart the app and try again.';return}
  $('waitMsg').textContent='Getting a code… (needs internet)';
  const tryHost=(attempt)=>{
    const code=makeCode();
    const peer=new Peer(PREFIX+code,{debug:0});net.peer=peer;net.code=code;
    peer.on('open',()=>{
      $('codeShow').textContent=code;$('copyCode').disabled=false;
      $('waitMsg').textContent=`Share this code. You'll play ${GAMES[pickedGame].name} as blue.`;
    });
    peer.on('connection',c=>{
      if(net.conn&&net.conn.open){c.on('open',()=>{c.send({t:'full'});setTimeout(()=>c.close(),400)});return}
      wire(c,'host');
    });
    peer.on('error',e=>{
      if(e.type==='unavailable-id'&&attempt<3){peer.destroy();tryHost(attempt+1);return}
      if(screen==='wait')$('waitMsg').textContent='Could not reach the game server. Check your internet and try again.';
      else if(screen==='play')setPill('connection lost',false);
    });
    peer.on('disconnected',()=>{try{peer.reconnect()}catch(e){}});
  };
  tryHost(0);
};
$('copyCode').onclick=async()=>{
  const g=GAMES[pickedGame].name,code=net.code;
  const text=`Play ${g} with me in Graph Paper Games! Open the app, tap ${g}, then "Join with code": ${code}`;
  try{
    const Share=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.Share;
    if(Share){await Share.share({title:'Graph Paper Games',text});return}
    await navigator.clipboard.writeText(text);$('copyCode').textContent='Copied';
  }catch(e){$('copyCode').textContent='Code: '+code}
  setTimeout(()=>$('copyCode').textContent='Copy invite',1800);
};
$('joinBtn').onclick=()=>{show('join');$('joinErr').textContent='';$('codeInput').value='';setTimeout(()=>$('codeInput').focus(),50)};
$('codeInput').addEventListener('input',e=>{e.target.value=e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,5)});
$('joinForm').onsubmit=e=>{
  e.preventDefault();
  const code=$('codeInput').value.trim().toUpperCase();
  if(code.length!==5){$('joinErr').textContent='Codes are 5 letters or numbers.';return}
  if(!peerAvailable()){$('joinErr').textContent='Online play could not start. Restart the app and try again.';return}
  leaveOnline();$('joinErr').textContent='Connecting… (needs internet)';
  const peer=new Peer({debug:0});net.peer=peer;
  peer.on('open',()=>wire(peer.connect(PREFIX+code,{reliable:true}),'guest'));
  peer.on('error',err=>{
    $('joinErr').textContent=err.type==='peer-unavailable'
      ?'No game with that code. Check the code, and make sure your friend is still on the code screen.'
      :'Could not connect. Check your internet and try again.';
    if(screen==='play')setPill('connection lost',false);
  });
};

show('home');
})();
