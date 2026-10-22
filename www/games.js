/* Game rules, computer opponents and board drawing.
   Every game uses the same shape so the app can run any of them:
     init(first)        -> new state, `first` (0|1) moves first
     legal(s, m)        -> is move m allowed now
     apply(s, m)        -> mutates s with the current player's move
     result(s)          -> null while playing, else {winner: 0|1|'D'}
     score(s)           -> [p0, p1] points inside the round (boxes) or null
     ai(s, level)       -> a move for the current player ('easy'|'hard')
     render(el, s, ctx) -> draws the board; ctx = {canPlay, onMove}
   Player 0 is blue, player 1 is red. s.turn is whose move it is. */
(function(root){
'use strict';
const rnd=a=>a[Math.floor(Math.random()*a.length)];
const P=['p0','p1'];

/* ---------------- Tic-Tac-Toe ---------------- */
const TL=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
function tttJudge(b){
  for(const l of TL){const[a,c,d]=l;if(b[a]>=0&&b[a]===b[c]&&b[a]===b[d])return{winner:b[a],cells:l}}
  return b.every(v=>v>=0)?{winner:'D',cells:[]}:null;
}
function tttMinimax(b,turn,me,depth){
  const r=tttJudge(b);
  if(r)return{s:r.winner==='D'?0:r.winner===me?10-depth:depth-10};
  let best={s:turn===me?-99:99,m:-1};
  for(let i=0;i<9;i++){if(b[i]>=0)continue;b[i]=turn;
    const v=tttMinimax(b,1-turn,me,depth+1).s;b[i]=-1;
    if(turn===me?v>best.s:v<best.s)best={s:v,m:i};}
  return best;
}
const TicTacToe={
  id:'ttt',name:'Tic-Tac-Toe',
  rules:'Take turns marking a square. First to get three in a row (across, down or diagonal) wins. Blue plays X, red plays O.',
  init:first=>({b:Array(9).fill(-1),turn:first,last:-1}),
  legal:(s,m)=>Number.isInteger(m)&&m>=0&&m<9&&s.b[m]<0&&!tttJudge(s.b),
  apply(s,m){s.b[m]=s.turn;s.last=m;s.turn=1-s.turn},
  result:s=>tttJudge(s.b),
  score:()=>null,
  ai(s,level){
    const empty=s.b.map((v,i)=>v<0?i:-1).filter(i=>i>=0);
    if(level==='easy'&&Math.random()<.55)return rnd(empty);
    if(empty.length===9)return rnd([0,2,4,6,8]);
    return tttMinimax(s.b.slice(),s.turn,s.turn,0).m;
  },
  render(el,s,ctx){
    const r=tttJudge(s.b),win=r?r.cells:[];
    const mark=(p,fresh)=>p===0
      ?`<svg viewBox="0 0 100 100" class="${fresh?'fresh':''}"><path class="ink" d="M18 20 L82 80" style="--len:92;stroke:var(--p0)"/><path class="ink p2" d="M82 18 L20 82" style="--len:92;stroke:var(--p0)"/></svg>`
      :`<svg viewBox="0 0 100 100" class="${fresh?'fresh':''}"><circle class="ink" cx="50" cy="50" r="33" transform="rotate(-80 50 50)" style="--len:210;stroke:var(--p1)"/></svg>`;
    el.innerHTML=`<div class="ttt"><svg class="grid" viewBox="0 0 300 300" aria-hidden="true"><g stroke="var(--ink)" stroke-width="4" stroke-linecap="round" fill="none"><path d="M101 8 Q99 150 102 292"/><path d="M199 10 Q202 150 198 290"/><path d="M8 100 Q150 98 292 102"/><path d="M10 199 Q150 202 290 198"/></g></svg>`+
      s.b.map((v,i)=>`<button class="cell${win.includes(i)?' win':''}" data-m="${i}" ${(!ctx.canPlay||v>=0)?'disabled':''} aria-label="Square ${i+1}${v>=0?(v?' O':' X'):' empty'}">${v>=0?mark(v,i===s.last):''}</button>`).join('')+`</div>`;
    el.querySelectorAll('.cell').forEach(b=>b.onclick=()=>ctx.onMove(+b.dataset.m));
  }
};

/* ---------------- Four in a Row ---------------- */
const C=7,R=6;
function c4Drop(b,c){for(let r=R-1;r>=0;r--)if(b[r*C+c]<0)return r*C+c;return -1}
function c4Judge(b){
  const dirs=[[0,1],[1,0],[1,1],[1,-1]];
  for(let r=0;r<R;r++)for(let c=0;c<C;c++){
    const p=b[r*C+c];if(p<0)continue;
    for(const[dr,dc]of dirs){
      const cells=[];
      for(let k=0;k<4;k++){const rr=r+dr*k,cc=c+dc*k;if(rr<0||rr>=R||cc<0||cc>=C||b[rr*C+cc]!==p)break;cells.push(rr*C+cc)}
      if(cells.length===4)return{winner:p,cells};
    }
  }
  return b.every(v=>v>=0)?{winner:'D',cells:[]}:null;
}
function c4Eval(b,me){
  let score=0;const opp=1-me;
  for(let r=0;r<R;r++)if(b[r*C+3]===me)score+=3;
  const win=(cells)=>{let m=0,o=0,e=0;for(const i of cells){if(b[i]===me)m++;else if(b[i]===opp)o++;else e++}
    if(m===3&&e===1)score+=5;else if(m===2&&e===2)score+=2;if(o===3&&e===1)score-=6;else if(o===2&&e===2)score-=1};
  for(let r=0;r<R;r++)for(let c=0;c<C;c++){
    if(c+3<C)win([0,1,2,3].map(k=>r*C+c+k));
    if(r+3<R)win([0,1,2,3].map(k=>(r+k)*C+c));
    if(r+3<R&&c+3<C)win([0,1,2,3].map(k=>(r+k)*C+c+k));
    if(r+3<R&&c-3>=0)win([0,1,2,3].map(k=>(r+k)*C+c-k));
  }
  return score;
}
const ORDER=[3,2,4,1,5,0,6];
function c4Search(b,depth,alpha,beta,turn,me){
  const j=c4Judge(b);
  if(j)return j.winner==='D'?0:(j.winner===me?100000+depth:-100000-depth);
  if(depth===0)return c4Eval(b,me);
  if(turn===me){let v=-Infinity;
    for(const c of ORDER){const i=c4Drop(b,c);if(i<0)continue;b[i]=turn;v=Math.max(v,c4Search(b,depth-1,alpha,beta,1-turn,me));b[i]=-1;alpha=Math.max(alpha,v);if(alpha>=beta)break}
    return v;}
  let v=Infinity;
  for(const c of ORDER){const i=c4Drop(b,c);if(i<0)continue;b[i]=turn;v=Math.min(v,c4Search(b,depth-1,alpha,beta,1-turn,me));b[i]=-1;beta=Math.min(beta,v);if(alpha>=beta)break}
  return v;
}
const FourInARow={
  id:'c4',name:'Four in a Row',
  rules:'Tap a column to drop a disc. It falls to the lowest free space. Line up four of your color in any direction to win.',
  init:first=>({b:Array(C*R).fill(-1),turn:first,last:-1}),
  legal:(s,m)=>Number.isInteger(m)&&m>=0&&m<C&&c4Drop(s.b,m)>=0&&!c4Judge(s.b),
  apply(s,m){const i=c4Drop(s.b,m);s.b[i]=s.turn;s.last=i;s.turn=1-s.turn},
  result:s=>c4Judge(s.b),
  score:()=>null,
  ai(s,level){
    const cols=ORDER.filter(c=>c4Drop(s.b,c)>=0);
    if(level==='easy'&&Math.random()<.35)return rnd(cols);
    const depth=level==='easy'?2:6,b=s.b.slice();
    let best=-Infinity,pick=cols[0];
    for(const c of cols){const i=c4Drop(b,c);b[i]=s.turn;
      const v=c4Search(b,depth-1,-Infinity,Infinity,1-s.turn,s.turn);b[i]=-1;
      if(v>best){best=v;pick=c}}
    return pick;
  },
  render(el,s,ctx){
    const r=c4Judge(s.b),win=r?r.cells:[];
    let h='<div class="c4">';
    for(let c=0;c<C;c++){
      const full=c4Drop(s.b,c)<0;
      h+=`<button class="col" data-m="${c}" ${(!ctx.canPlay||full)?'disabled':''} aria-label="Column ${c+1}">`;
      for(let rr=0;rr<R;rr++){const i=rr*C+c,v=s.b[i];
        h+=`<span class="hole${v>=0?' '+P[v]:''}${win.includes(i)?' win':''}${i===s.last?' fresh':''}"></span>`}
      h+='</button>';
    }
    el.innerHTML=h+'</div>';
    el.querySelectorAll('.col').forEach(b=>b.onclick=()=>ctx.onMove(+b.dataset.m));
  }
};

/* ---------------- Dots and Boxes ---------------- */
const N=4,HE=(N+1)*N,EDGES=HE+N*(N+1);  // 4x4 boxes, 40 lines
const hIdx=(r,c)=>r*N+c, vIdx=(r,c)=>HE+r*(N+1)+c;
const BOX_EDGES=[];for(let r=0;r<N;r++)for(let c=0;c<N;c++)BOX_EDGES.push([hIdx(r,c),hIdx(r+1,c),vIdx(r,c),vIdx(r,c+1)]);
const EDGE_BOXES=Array.from({length:EDGES},()=>[]);BOX_EDGES.forEach((es,bx)=>es.forEach(e=>EDGE_BOXES[e].push(bx)));
const sides=(e,bx)=>BOX_EDGES[bx].reduce((n,k)=>n+(e[k]>=0?1:0),0);
function dabApply(s,m){
  s.e[m]=s.turn;s.last=m;let got=0;
  for(const bx of EDGE_BOXES[m])if(s.box[bx]<0&&sides(s.e,bx)===4){s.box[bx]=s.turn;got++}
  if(!got)s.turn=1-s.turn;
  return got;
}
const dabFree=s=>{const f=[];for(let i=0;i<EDGES;i++)if(s.e[i]<0)f.push(i);return f};
const completes=(s,m)=>EDGE_BOXES[m].some(bx=>s.box[bx]<0&&sides(s.e,bx)===3);
const givesAway=(s,m)=>EDGE_BOXES[m].some(bx=>s.box[bx]<0&&sides(s.e,bx)===2);
function chainLoss(s,m){ // boxes the opponent can grab greedily after we play m
  const t={e:s.e.slice(),box:s.box.slice(),turn:s.turn};dabApply(t,m);
  if(t.turn===s.turn)return -1;
  let n=0,guard=0;
  while(guard++<EDGES){const c=dabFree(t).find(k=>completes(t,k));if(c===undefined)break;n+=dabApply(t,c)}
  return n;
}
const DotsAndBoxes={
  id:'dab',name:'Dots & Boxes',
  rules:'Take turns drawing one line between two dots. Close the fourth side of a box to claim it and draw again. Most boxes wins.',
  init:first=>({e:Array(EDGES).fill(-1),box:Array(N*N).fill(-1),turn:first,last:-1}),
  legal:(s,m)=>Number.isInteger(m)&&m>=0&&m<EDGES&&s.e[m]<0,
  apply(s,m){dabApply(s,m)},
  result(s){
    if(s.box.some(v=>v<0))return null;
    const a=s.box.filter(v=>v===0).length,b=s.box.length-a;
    return{winner:a===b?'D':(a>b?0:1),cells:[]};
  },
  score:s=>[s.box.filter(v=>v===0).length,s.box.filter(v=>v===1).length],
  freshBoxes:s=>s.last<0?[]:EDGE_BOXES[s.last].filter(bx=>s.box[bx]>=0),
  ai(s,level){
    const free=dabFree(s);
    const take=free.filter(m=>completes(s,m));
    const safe=free.filter(m=>!givesAway(s,m));
    if(level==='easy'){
      if(take.length&&Math.random()<.75)return rnd(take);
      if(safe.length&&Math.random()<.6)return rnd(safe);
      return rnd(free);
    }
    if(take.length)return rnd(take);
    if(safe.length)return rnd(safe);
    let best=Infinity,pick=free[0];
    for(const m of free){const l=chainLoss(s,m);if(l<best){best=l;pick=m}}
    return pick;
  },
  render(el,s,ctx){
    const G=70,M=22,W=M*2+G*N;
    let h=`<svg class="dab" viewBox="0 0 ${W} ${W}" role="group" aria-label="Dots and boxes board">`;
    const fb=DotsAndBoxes.freshBoxes(s),mk=ctx.marks||['B','R'];
    s.box.forEach((v,bx)=>{const r=Math.floor(bx/N),c=bx%N,x=M+c*G,y=M+r*G,f=fb.includes(bx)?' fresh':'';
      h+=`<rect class="box${v>=0?' '+P[v]:''}${f}" x="${x+4}" y="${y+4}" width="${G-8}" height="${G-8}" rx="4"/>`;
      if(v>=0)h+=`<text class="boxmark${f}${mk[v].length>1?' two':''}" x="${x+G/2}" y="${y+G/2}" fill="var(--${P[v]})">${esc(mk[v])}</text>`});
    const line=(i,x1,y1,x2,y2)=>{const v=s.e[i],can=ctx.canPlay&&v<0;
      h+=`<line class="edge${v>=0?' '+P[v]:''}${i===s.last?' fresh':''}"${i===s.last?' pathLength="1"':''} x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
      if(can)h+=`<line class="hit" data-m="${i}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" tabindex="0" role="button" aria-label="Line ${i+1}"/>`};
    for(let r=0;r<=N;r++)for(let c=0;c<N;c++)line(hIdx(r,c),M+c*G+8,M+r*G,M+(c+1)*G-8,M+r*G);
    for(let r=0;r<N;r++)for(let c=0;c<=N;c++)line(vIdx(r,c),M+c*G,M+r*G+8,M+c*G,M+(r+1)*G-8);
    for(let r=0;r<=N;r++)for(let c=0;c<=N;c++)h+=`<circle class="dotpt" cx="${M+c*G}" cy="${M+r*G}" r="5"/>`;
    el.innerHTML=h+'</svg>';
    el.querySelectorAll('.hit').forEach(l=>{
      l.addEventListener('click',()=>ctx.onMove(+l.dataset.m));
      l.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();ctx.onMove(+l.dataset.m)}});
    });
  }
};

const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const GAMES={ttt:TicTacToe,c4:FourInARow,dab:DotsAndBoxes};
root.GAMES=GAMES;
if(typeof module!=='undefined')module.exports=GAMES;
})(typeof window!=='undefined'?window:globalThis);
