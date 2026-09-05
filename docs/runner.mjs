export const RUN_CYCLE_MS = 640;
export const RUN_FRAMES = Array.from({length:8}, (_,i) => ({x:(i%4)*384,y:Math.floor(i/4)*512,width:384,height:512}));
export function frameAt(elapsed) { return Math.floor(Math.max(0,elapsed) / (RUN_CYCLE_MS/RUN_FRAMES.length)) % RUN_FRAMES.length; }
export function frameViewBox(index) { const f=RUN_FRAMES[index];return `${f.x} ${f.y} ${f.width} ${f.height}`; }
// Each viewport reveals a different arm/leg pose; no raster transformations are needed.
export function cycleMarkup(sheetId, animate=true) {
  return RUN_FRAMES.map((f,i) => {
    const values=Array.from({length:9},(_,n)=>n%8===i?'1':'0').join(';');
    return `<svg x="-27" y="-66" width="54" height="72" viewBox="${frameViewBox(i)}" overflow="hidden" opacity="${i===0?1:0}"><use href="#${sheetId}" xlink:href="#${sheetId}"/>${animate?`<animate attributeName="opacity" values="${values}" keyTimes="0;.125;.25;.375;.5;.625;.75;.875;1" dur="${RUN_CYCLE_MS}ms" repeatCount="indefinite" calcMode="discrete"/>`:''}</svg>`;
  }).join('');
}
