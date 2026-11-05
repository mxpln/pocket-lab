import{PATTERN_STUDIES}from'./pattern-studies.js';
import{generationProfile,applyLensDetails,lensFor}from'./livepilot-lenses.js';
export const GENRES=PATTERN_STUDIES;
export const TRACKS=[{id:'kick',name:'Kick',note:36,color:'#d9613b'},{id:'snare',name:'Snare',note:38,color:'#d49858'},{id:'clap',name:'Clap',note:39,color:'#c5ae77'},{id:'chh',name:'Closed hat',note:42,color:'#7f9363'},{id:'ohh',name:'Open hat',note:46,color:'#9bad82'},{id:'perc',name:'Floor tom',note:41,color:'#8b9c96'}];
export const profileFor=state=>generationProfile(GENRES[state.genre],state);
export const effectiveDensity=state=>Math.min(state.density,profileFor(state).maxDensity??100);
export const stepsFor=s=>GENRES[s.genre].steps;
export const percussion={tom:{name:'Floor tom',note:41},rim:{name:'Rim click',note:37},shaker:{name:'Shaker',note:70},conga:{name:'Low conga',note:64},metal:{name:'Metal hit',note:56}};
export const trackFor=(s,r)=>r===5?{...TRACKS[5],...percussion[GENRES[s.genre].voice]}:TRACKS[r];
export const defaults=()=>({genre:'house',bpm:124,bars:4,kit:'909',density:50,swing:12,swingBase:16,humanize:15,volume:70,section:'groove',lens:'none',variant:0,pattern:[],muted:Array(6).fill(false),solo:Array(6).fill(false),locked:Array(6).fill(false)});
export const swingRatio=s=>50+(GENRES[s.genre].steps===16?s.swing:0)/2;
export function swingOffset(state,beat){
 if(GENRES[state.genre].steps!==16)return 0;
 const unit=state.swingBase===8?.5:.25,phase=beat%(2*unit);
 // Time-warp the pair continuously: intervening subdivisions stay in order.
 return state.swing/100*(phase<=unit?phase:2*unit-phase);
}
export const hash=(n)=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
export function generate(state,old=[]){
 const g=profileFor(state),result=[],count=g.steps,perBeat=count/4,density=Math.min(state.density,g.maxDensity??100),levels=g.levels??[114,104,104,80,73,64];
 for(let b=0;b<state.bars;b++){
  const rows=Array.from({length:6},()=>Array(count).fill(0));
  const put=(r,s,v)=>{if(s>=0&&s<count)rows[r][s]=Math.max(rows[r][s],Math.round(v));};
  g.base.forEach((steps,r)=>steps.forEach(s=>put(r,s,levels[r]*(r===3&&s%perBeat!==0?.74:1))));
  // One motif per phrase, a related response in the latter half.
  const motif=g.motifs[(state.variant+(g.evolve?b:0))%g.motifs.length];
  for(const [row,steps] of Object.entries(motif)){
   const r=Number(row),take=density<25?0:density<65?1:steps.length;
   steps.slice(0,take).forEach(s=>{if(r!==0||b%2===1)put(r,s,r===1?35:r===3?48:r===0?96:63);});
  }
  if(density>=80){
   (g.extraHats??[1,5,9,13]).forEach(s=>put(3,s,42));
   const ghosts=g.extraGhosts??(state.genre==='trap'?[7,9]:state.genre==='reggaeton'?[2,10]:[3,11]);
   ghosts.forEach(s=>put(1,s,31));
   if(b%2===1)[count-perBeat-1,count-1].forEach(s=>put(5,s,55));
  }
  // A restrained phrase response; no arbitrary note placement.
  if(b===state.bars-1&&state.bars>1&&density>=40&&g.buildMode!=='subtractive'){put(5,count-1,g.buildMode==='texture'?45:65);if(state.genre!=='trap'&&g.buildMode!=='texture')put(1,count-perBeat-1,34);}
  if(density<25){for(let r=3;r<6;r++)for(let s=0;s<count;s++)if(!g.anchors[r].includes(s)&&s%perBeat!==0)rows[r][s]=0;}
  if(state.section==='intro'){for(let r=1;r<6;r++)for(let s=0;s<count;s++)if(!g.anchors[r].includes(s)&&(r!==3||s%perBeat!==0))rows[r][s]=0;}
  if(state.section==='build'){
   const progress=(b+1)/state.bars;
   if(g.buildMode==='subtractive'){for(let r=1;r<6;r++)for(let s=0;s<count;s++)if(!g.anchors[r].includes(s)&&b<state.bars-1)rows[r][s]=0;}
   else if(g.buildMode==='texture'){for(let r=3;r<6;r++)for(let s=0;s<count;s++)if(rows[r][s]&&!g.anchors[r].includes(s))rows[r][s]=Math.round(rows[r][s]*(.65+progress*.35));}
   else{for(const s of(g.extraHats??Array.from({length:count},(_,i)=>i)))if(progress>.5||s%2===0)put(3,s,45+Math.round(progress*30)+(s%perBeat===0?12:0));if(b===state.bars-1)(g.fillSnare??[10,11,14,15]).forEach((s,i)=>put(1,s,45+i*12));}
  }
  if(state.section==='fill'&&b===state.bars-1){
   if(g.buildMode){put(5,count-2,55);if(g.buildMode!=='subtractive')put(1,count-perBeat-1,32);}
   else{(g.fillSnare??[10,11,13,15]).forEach((s,i)=>put(1,s,45+i*12));(g.fillPerc??[12,14,15]).forEach((s,i)=>put(5,s,75+i*10));}
   if(state.genre==='trap')[12,13,14,15].forEach(s=>put(3,s,72));
  }
  applyLensDetails(rows,GENRES[state.genre],state,b);
  // Anchor values cannot be overwritten by a ghost or a phrase gesture.
  g.anchors.forEach((steps,r)=>steps.forEach(s=>{rows[r][s]=Math.max(rows[r][s],levels[r]);}));
  // Open and closed hi-hats share a physical articulation.
  rows[4].forEach((v,s)=>{if(v&&!g.anchors[3].includes(s))rows[3][s]=0;});
  state.locked.forEach((locked,r)=>{if(locked&&old.length&&old[b%old.length]?.[r]?.length===count)rows[r]=[...old[b%old.length][r]];});
  result.push(rows);
 }
 return result;
}
export function isAudible(state,r){return !state.muted[r]&&(!state.solo.some(Boolean)||state.solo[r]);}
export function eventList(state){
 const out=[],g=profileFor(state);
 for(let b=0;b<state.bars;b++)for(let r=0;r<6;r++)if(isAudible(state,r))for(let s=0;s<g.steps;s++){
  let velocity=state.pattern[b]?.[r]?.[s];if(!velocity)continue;
  const anchor=g.anchors[r].includes(s),n=b*97+r*37+s*13+state.variant*17;
  const swing=swingOffset(state,s*4/g.steps);
  const touch=anchor?0:(hash(n)-.5)*.04*state.humanize/100*(g.touchMultiplier??1);
  const beat=Math.min(state.bars*4-.001,Math.max(0,b*4+s*4/g.steps+swing+touch));
  velocity=Math.min(127,Math.max(1,Math.round(velocity+(hash(n+7)-.5)*20*state.humanize/100)));
  out.push({beat,row:r,velocity,note:trackFor(state,r).note});
  if(state.genre==='trap'&&r===3&&b===state.bars-1&&state.section!=='intro'&&(effectiveDensity(state)>=80||state.section==='fill')&&s>=12&&beat+.125<state.bars*4)out.push({beat:beat+.125,row:r,velocity:Math.round(velocity*.7),note:42});
 }
 return out.sort((a,b)=>a.beat-b.beat||a.row-b.row);
}
export function midiBytes(state){
 const enc=new TextEncoder(),bytes=[],put=(a)=>bytes.push(...a),u32=n=>[(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255],vlq=n=>{let a=[n&127];while(n>>=7)a.unshift((n&127)|128);return a;};
 const ev=[],tempo=Math.round(60000000/state.bpm),name=enc.encode(`Pocket Lab - ${GENRES[state.genre].name}${state.lens&&state.lens!=='none'?' + '+lensFor(state).short:''}`);
 ev.push({t:0,data:[255,3,...vlq(name.length),...name]},{t:0,data:[255,81,3,(tempo>>16)&255,(tempo>>8)&255,tempo&255]},{t:0,data:[255,88,4,4,2,24,8]});
 for(const e of eventList(state)){const t=Math.round(e.beat*480);ev.push({t,data:[153,e.note,e.velocity]},{t:Math.min(t+48,state.bars*4*480),data:[137,e.note,0]});}
 ev.sort((a,b)=>a.t-b.t);let last=0;const track=[];
 for(const e of ev){track.push(...vlq(e.t-last),...e.data);last=e.t;}
 track.push(...vlq(Math.max(0,state.bars*4*480-last)),255,47,0);
 put([...enc.encode('MThd'),0,0,0,6,0,0,0,1,1,224]);put([...enc.encode('MTrk'),...u32(track.length),...track]);return new Uint8Array(bytes);
}
export function wavBytes(buffer){
 const n=buffer.length,channels=2,ab=new ArrayBuffer(44+n*4),v=new DataView(ab);const str=(off,s)=>{for(let i=0;i<s.length;i++)v.setUint8(off+i,s.charCodeAt(i));};
 str(0,'RIFF');v.setUint32(4,36+n*4,true);str(8,'WAVE');str(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,channels,true);v.setUint32(24,buffer.sampleRate,true);v.setUint32(28,buffer.sampleRate*4,true);v.setUint16(32,4,true);v.setUint16(34,16,true);str(36,'data');v.setUint32(40,n*4,true);
 const left=buffer.getChannelData(0),right=buffer.getChannelData(Math.min(1,buffer.numberOfChannels-1));for(let i=0;i<n;i++)for(let c=0;c<2;c++){const s=Math.max(-1,Math.min(1,(c?right:left)[i]));v.setInt16(44+i*4+c*2,s<0?s*32768:s*32767,true);}return ab;
}
