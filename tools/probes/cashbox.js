// Probe: finance → daily cash box tab (KPIs, charts, days, moves, buttons, count form opens). Writes nothing.
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const shot=async n=>{window.__shotReq=n;for(let i=0;i<60&&window.__shotDone!==n;i++)await wait(200)};
const close=async()=>{const x=$$('#pnModal button').find(b=>/انصراف|بستن/.test(b.innerText));if(x)x.click();await wait(300)};
try{for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);
 location.hash='#/finance/cashbox';await wait(5000);
 out.echarts=!!window.echarts;out.key=$('#cbKey')?.value;out.kpis=$$('#pnTab .kpi').map(k=>k.innerText.replace(/\s+/g,' ').slice(0,80));
 out.cards=$$('#pnTab .card').map(c=>({h:c.querySelector('h2,h3')?.innerText,rows:c.querySelector('tbody')?.rows.length}));
 out.charts=['chCbBal','chCbOut'].map(id=>!!document.querySelector('#'+id+' canvas, #'+id+' svg'));
 out.buttons=$$('#pnTab .toolbar button').map(b=>b.innerText.trim());
 const cb=$('#cbCount');if(cb){cb.click();await wait(800);out.countModal=$('#pnModal')?.innerText.replace(/\s+/g,' ').slice(0,160);await shot('cashbox-count');await close()}
 const o=$('#cbOut');if(o){o.click();await wait(800);out.outAcc=$('#pnModal [name=acc]')?.selectedOptions[0]?.innerText;await close()}
 const s=$('#cbStaff');if(s){s.click();await wait(1500);out.staffAcc=$('#pnModal [name=acc]')?.selectedOptions[0]?.innerText;await close()}
 await shot('cashbox');out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
