// Optional interpretations of Livepilot production concepts, separate from genre evidence.
const root='https://github.com/dreamrec/LivePilot/blob/main/livepilot/skills/livepilot-core/references/concepts/genres/';
export const LENSES={
 none:{name:'Off · genre foundation',short:'Foundation only',description:'Use the authored genre study with no Livepilot production lens. Density spans the full control range.',rules:{}},
 space:{name:'Space & restraint',short:'Space & restraint',packet:'dub-techno',description:'Keep the core rhythm and reduce quiet extra detail. Density is capped at 45; builds change touch rather than adding rolls. Echoes and reverb are not generated.',upstream:'The dub-techno packet favors sparse percussion and space. The numerical density cap is Pocket Lab’s own adaptation.',rules:{maxDensity:45,buildMode:'texture',supportMode:'space'}},
 subtract:{name:'Subtractive development',short:'Subtractive',packet:'minimal-techno',description:'Hold optional details back in early bars, then let them return. Density is capped at 65; the Build role removes supporting parts before the final bar.',upstream:'The minimal-techno packet emphasizes removing elements and a restrained arrangement. This short-phrase gesture is an adaptation of that idea.',rules:{maxDensity:65,buildMode:'subtractive',supportMode:'subtract'}},
 conversation:{name:'Percussion conversation',short:'Percussion',packet:'deep-minimal',description:'Add a quiet percussion call and response on the current study grid. Motifs rotate by bar. Density is capped at 85. Instrument sounds and anchor positions stay with the genre study.',upstream:'The deep-minimal packet emphasizes hand percussion and rhythmic interplay. This app does not reproduce its vocal chops, polyrhythms or long-form production.',rules:{maxDensity:85,evolve:true,supportMode:'conversation'}},
 cells:{name:'Evolving motif cells',short:'Evolving cells',packet:'microhouse',description:'Use related motif cells in successive bars instead of one motif for the entire phrase. Four authored cells repeat; this is bounded development, not endless evolution.',upstream:'The microhouse packet encourages variation and small sound events. Here, only the authored drum cells evolve; no microsamples or found sounds are loaded.',rules:{evolve:true,supportMode:'cells'}},
 pocket:{name:'Touch & ghost notes',short:'Touch & ghosts',packet:'hip-hop',description:'Add quiet lead-ins before the study’s snare or clap anchors and increase non-anchor timing touch by 1.5×. Density is capped at 80. This is not a captured drummer or a Dilla timing model.',upstream:'The hip-hop packet calls for manual micro-timing and break-based feel. Deterministic offsets and quiet lead-ins are a limited drum-machine interpretation.',rules:{maxDensity:80,buildMode:'texture',supportMode:'ghosts',touchMultiplier:1.5}}
};
for(const l of Object.values(LENSES))if(l.packet)l.sourceURL=root+l.packet+'.yaml';
export const lensFor=s=>LENSES[s.lens]??LENSES.none;
export const generationProfile=(study,state)=>({...study,...lensFor(state).rules});
export function applyLensDetails(rows,study,state,bar){
 const mode=lensFor(state).rules.supportMode,count=study.steps,core=(r,s)=>study.anchors[r].includes(s),base=(r,s)=>study.base[r].includes(s);
 if(mode==='space')for(const r of[1,5])for(let s=0;s<count;s++)if(!core(r,s)&&!base(r,s)&&rows[r][s]<70)rows[r][s]=0;
 if(mode==='subtract'&&bar<state.bars-1)for(let r=1;r<6;r++)for(let s=0;s<count;s++)if(!core(r,s)&&!base(r,s))rows[r][s]=0;
 if(mode==='conversation'&&state.section!=='intro'){
  const fractions=bar%2?[11/16,15/16]:[3/16,7/16];
  for(const fraction of fractions){const s=Math.round(fraction*count)%count;rows[5][s]=Math.max(rows[5][s],58);}
 }
 if(mode==='ghosts'&&state.section!=='intro')for(const r of[1,2])for(const anchor of study.anchors[r]){
  const s=anchor-1;if(s>=0&&!core(1,s))rows[1][s]=Math.max(rows[1][s],32);
 }
 return rows;
}
