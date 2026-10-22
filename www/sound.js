/* Graph Paper Games — pencil-scratch sound, made in code (no audio files).
   Filtered noise shaped like a quick pencil stroke on paper. */
(function(){
'use strict';
let ctx=null,noise=null;
const KEY='gpg-sound';
let on=true;
try{on=localStorage.getItem(KEY)!=='off'}catch(e){}

function init(){
  if(ctx)return true;
  const AC=window.AudioContext||window.webkitAudioContext;
  if(!AC)return false;
  ctx=new AC();
  // 1 second of white noise, reused for every stroke
  noise=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);
  const d=noise.getChannelData(0);
  for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  return true;
}
// Browsers keep audio locked until the first tap; unlock it then.
function unlock(){if(init()&&ctx.state==='suspended')ctx.resume()}
['pointerdown','touchstart','keydown'].forEach(ev=>window.addEventListener(ev,unlock,{passive:true}));

const rnd=(a,b)=>a+Math.random()*(b-a);

/* One pencil stroke starting at time t, lasting dur seconds. */
function stroke(t,dur,vol){
  const src=ctx.createBufferSource();
  src.buffer=noise;src.playbackRate.value=rnd(.85,1.15);
  // paper texture: graphite grain sits around 2–6 kHz
  const hp=ctx.createBiquadFilter();hp.type='highpass';hp.frequency.value=1200;
  const bp=ctx.createBiquadFilter();bp.type='bandpass';bp.Q.value=.9;
  const f0=rnd(2600,3600);
  bp.frequency.setValueAtTime(f0,t);
  bp.frequency.linearRampToValueAtTime(f0*rnd(1.2,1.5),t+dur);
  // grainy envelope: quick attack, uneven pressure, soft lift-off
  const g=ctx.createGain(),n=24,curve=new Float32Array(n);
  for(let i=0;i<n;i++){
    const x=i/(n-1),shape=Math.min(1,x*8)*Math.pow(1-x,.6);
    curve[i]=vol*shape*rnd(.55,1);
  }
  curve[n-1]=0;
  g.gain.setValueAtTime(0,t);
  g.gain.setValueCurveAtTime(curve,t+.002,dur);
  src.connect(hp);hp.connect(bp);bp.connect(g);g.connect(ctx.destination);
  src.start(t,rnd(0,.7),dur+.05);
}

/* Public: play the scratch for a move. style picks the stroke pattern. */
function scratch(style){
  if(!on||!init())return;
  if(ctx.state==='suspended')ctx.resume();
  const t=ctx.currentTime+.01,v=.9;
  if(style==='ttt'){            // an X or O: two quick strokes
    stroke(t,rnd(.07,.09),v);stroke(t+rnd(.1,.13),rnd(.07,.09),v);
  }else if(style==='dab'){      // drawing one line between dots
    stroke(t,rnd(.14,.18),v);
  }else{                        // shading in a disc: short scribble
    stroke(t,.06,v);stroke(t+.07,.06,v*.8);stroke(t+.14,.07,v*.7);
  }
}

window.Sound={
  scratch,
  isOn:()=>on,
  set(v){on=!!v;try{localStorage.setItem(KEY,on?'on':'off')}catch(e){}}
};
})();
