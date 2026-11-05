import{eventList,hash,wavBytes,GENRES}from'./engine.js';
const noiseCache=new WeakMap();
const hatGroups=new WeakMap();
function noise(ctx){if(noiseCache.has(ctx))return noiseCache.get(ctx);const b=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=hash(i+37)*2-1;noiseCache.set(ctx,b);return b;}
function envelope(ctx,dest,time,peak,decay,attack=.002){const g=ctx.createGain();g.gain.setValueAtTime(0,time);g.gain.linearRampToValueAtTime(peak,time+attack);g.gain.exponentialRampToValueAtTime(.0001,time+decay);g.gain.setValueAtTime(0,time+decay+.01);g.connect(dest);return g;}
export function drum(ctx,dest,row,time,velocity,kit='909',voice='tom'){
 if(row===3||row===4){
  let groups=hatGroups.get(ctx);if(!groups){groups=new WeakMap();hatGroups.set(ctx,groups);}
  const previous=groups.get(dest),bus=ctx.createGain();
  if(previous&&time<previous.end){previous.bus.gain.cancelScheduledValues(time);previous.bus.gain.setValueAtTime(1,time);previous.bus.gain.linearRampToValueAtTime(0,time+.003);}
  bus.gain.setValueAtTime(1,time);bus.connect(dest);groups.set(dest,{bus,end:time+.3});dest=bus;
 }
 const v=velocity/127,room=kit==='room',deep=kit==='808';
 const osc=(freq,end,type,peak,decay,destination=dest)=>{const o=ctx.createOscillator();o.type=type;o.frequency.setValueAtTime(freq,time);o.frequency.exponentialRampToValueAtTime(end,time+decay*.75);o.connect(envelope(ctx,destination,time,peak*v,decay));o.start(time);o.stop(time+decay+.02);};
 const hiss=(peak,decay,frequency,type='highpass',offset=0)=>{const s=ctx.createBufferSource();s.buffer=noise(ctx);const f=ctx.createBiquadFilter();f.type=type;f.frequency.value=frequency;f.Q.value=.7;s.connect(f);f.connect(envelope(ctx,dest,time+offset,peak*v,decay));s.start(time+offset);s.stop(time+offset+decay+.02);};
 if(row===0){osc(room?145:180,deep?43:49,'sine',.9,deep?.46:room?.2:.29);hiss(.12,.025,2000,'lowpass');}
 if(row===1){osc(190,105,'triangle',room?.19:.24,.12);hiss(room?.5:.43,room?.13:.18,room?1900:2600);}
 if(row===2){for(let i=0;i<3;i++)hiss(.18,.055,1100,'bandpass',i*.009);hiss(.22,.16,1400,'bandpass',.027);}
 if(row===3||row===4){const decay=row===4?(room?.17:.25):(room?.035:.05);hiss(row===4?.19:.23,decay,room?6500:7500);if(!room)osc(8100,7900,'square',.018,decay);}
 if(row===5){
  if(voice==='shaker')hiss(.26,.065,8500);
  else if(voice==='rim'){osc(1730,1500,'triangle',.19,.025);osc(490,470,'sine',.16,.04);hiss(.07,.012,1800);}
  else if(voice==='conga'){osc(285,175,'sine',.34,.14);osc(510,450,'triangle',.055,.045);hiss(.035,.018,1500);}
  else if(voice==='metal'){osc(660,630,'square',.08,.095);osc(1017,970,'square',.06,.07);hiss(.08,.045,3800);}
  else{osc(room?155:190,deep?75:95,'sine',.37,room?.16:.22);hiss(.035,.03,2200);}
 }
}
export function makeOutput(ctx,volume){const gain=ctx.createGain();gain.gain.value=volume/100*.65;const comp=ctx.createDynamicsCompressor();comp.threshold.value=-9;comp.knee.value=6;comp.ratio.value=5;comp.attack.value=.003;comp.release.value=.12;gain.connect(comp);comp.connect(ctx.destination);return gain;}
export class Player{
 constructor(getState,onStep,onError){this.getState=getState;this.onStep=onStep;this.onError=onError;this.playing=false;this.timer=null;this.scheduled=[];}
 async start(){if(this.playing)return;try{this.ctx??=new(window.AudioContext||window.webkitAudioContext)();await this.ctx.resume();if(this.ctx.state!=='running')throw new Error('Audio could not start. Click Play to try again.');this.output=makeOutput(this.ctx,this.getState().volume);this.playing=true;this.origin=this.ctx.currentTime+.08;this.nextBeat=0;this.lastPosition=-1;this.schedule();this.timer=setInterval(()=>this.schedule(),25);}catch(e){this.stop();this.onError(e.message);}}
 schedule(){try{const state=this.getState(),seconds=60/state.bpm,len=state.bars*4;this.output.gain.setTargetAtTime(state.volume/100*.65,this.ctx.currentTime,.02);let endBeat=(this.ctx.currentTime+.12-this.origin)/seconds;const events=eventList(state);while(this.nextBeat<=endBeat){const cycle=Math.floor(this.nextBeat/len);const local=this.nextBeat-cycle*len;for(const e of events)if(e.beat>=local-1e-7&&e.beat<local+.125-1e-7){const time=this.origin+(cycle*len+e.beat)*seconds;if(time>=this.ctx.currentTime)drum(this.ctx,this.output,e.row,time,e.velocity,state.kit,GENRES[state.genre].voice);}this.nextBeat+=.125;}const pos=Math.floor((this.ctx.currentTime-this.origin)/seconds*GENRES[state.genre].steps/4);if(pos>=0&&pos!==this.lastPosition){this.lastPosition=pos;this.onStep(pos%(state.bars*GENRES[state.genre].steps));}}catch(e){this.stop();this.onError('Playback stopped: '+e.message);}}
 stop(){clearInterval(this.timer);this.timer=null;this.playing=false;if(this.output){const o=this.output;o.gain.cancelScheduledValues(this.ctx.currentTime);o.gain.setTargetAtTime(0,this.ctx.currentTime,.006);setTimeout(()=>{try{o.disconnect();}catch{}},150);}this.onStep(-1);}
 restart(){if(this.playing){this.stop();return this.start();}}
}
export async function renderWav(state){
 const rate=44100,duration=state.bars*4*60/state.bpm,frames=Math.round(duration*rate),period=frames/rate;
 // Pre-roll a cycle to carry the previous phrase's tail into the loop start.
 const ctx=new OfflineAudioContext(2,frames*2,rate),output=makeOutput(ctx,state.volume);
 for(let cycle=0;cycle<2;cycle++)for(const e of eventList(state))drum(ctx,output,e.row,cycle*period+e.beat*60/state.bpm,e.velocity,state.kit,GENRES[state.genre].voice);
 const rendered=await ctx.startRendering(),loop=ctx.createBuffer(2,frames,rate);
 for(let c=0;c<2;c++)loop.copyToChannel(rendered.getChannelData(c).subarray(frames),c);
 return wavBytes(loop);
}
