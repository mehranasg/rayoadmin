// Probe: «ثبت جدید» cash box entry, «تنخواه» daily row, waste list (section / person / fine) and form fields, and the stocktake
// tab: list, one stocktake, review form, a review save, close and final report, reopen. Runs on the local dev server, whose
// saves stay in memory only (tools/dev-server.cjs); nothing reaches the live API.
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const close=async()=>{const x=$$('#pnModal button').find(b=>/انصراف|بستن/.test(b.innerText));if(x)x.click();await wait(300)};
const until=async(f,n=40)=>{for(let i=0;i<n&&!f();i++)await wait(250);return f()};
try{for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);
 // quick entry
 const qb=$$('button').find(b=>/ثبت جدید/.test(b.innerText));if(qb){qb.click();await wait(500);out.quick=$$('.quick-item,[data-q],.qn-item').map(x=>x.innerText.split('\n')[0]).slice(0,30);if(!out.quick.length)out.quickText=document.body.innerText.includes('صندوق نقدی');document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));await close()}
 // home daily tasks
 location.hash='#/home';await wait(3000);out.daily=$$('#dailyCard tbody tr').map(r=>r.cells[0]?.innerText.trim());
 // waste
 location.hash='#/inventory/waste';await wait(3000);out.wasteHead=$$('#pnTab .card').map(c=>c.querySelector('h2,h3')?.innerText);
 out.wasteCols=[...($$('#pnTab table').at(-1)?.querySelectorAll('thead th')||[])].map(th=>th.innerText.trim());
 out.wasteRows=$$('#pnTab table').at(-1)?.tBodies[0]?.rows.length;out.fineBtns=$$('[data-wfine]').length;out.bySection=$$('[data-wsec]').map(a=>a.innerText);
 const fb=$('[data-wfine]');if(fb){fb.click();await wait(800);out.fineForm=$('#pnModal')?.innerText.replace(/\s+/g,' ').slice(0,220);await close()}
 InvEntry.event();await wait(800);out.eventFields=$$('#pnModal .field label, #pnModal label').map(l=>l.innerText.trim()).filter(Boolean).slice(0,14);out.sectionOpts=$$('#pnModal [name=section] option').length;out.personOpts=$$('#pnModal [name=person] option').length;await close();
 // stocktakes
 location.hash='#/inventory/count';await wait(3500);out.tabLabel=$('.page-tabs .tab.active')?.innerText.trim();
 out.list=$$('[data-crd]').map(r=>[...r.cells].map(c=>c.innerText.trim()).filter((_,i)=>[0,1,2,9,11,12].includes(i)));
 out.detailTitle=$('#crDetail h2, #crDetail h3')?.innerText;out.kpis=$$('#crDetail .kpi').map(k=>k.innerText.replace(/\s+/g,' ').slice(0,60));
 out.detailRows=$('#crDetail tbody')?.rows.length;out.buttons=$$('#crDetail .btn').map(b=>b.innerText.trim()).filter(Boolean).slice(0,8);
 const rb=$('[data-crr]');if(rb){const item=rb.dataset.crr;rb.click();await wait(800);out.reviewForm=$('#pnModal')?.innerText.replace(/\s+/g,' ').slice(0,260);
  const r=$('#pnModal [name=rvs][value=explained]');if(r){r.checked=true;$('#pnModal [name=note]').value='آزمون probe';const ok=$$('#pnModal button').find(b=>/ذخیرهٔ بررسی/.test(b.innerText));ok.click();await until(()=>!$('#pnModal')||!document.body.contains(ok),60);await wait(1500);out.reviewSaved=W_ok=!!InvWrite.reviewOf(InvControl.state.raw.inventory,location.hash&&document.querySelector('[data-crrep]')?.dataset.crrep,item);}}
 const rep=$('[data-crrep]');if(rep){rep.click();await wait(1200);const fr=$('#pvFrame');out.report=fr?.contentDocument?.body?.innerText.replace(/\s+/g,' ').slice(0,300);await close()}
 const cb=$('[data-crclose]');if(cb){const d=cb.dataset.crclose;cb.click();await wait(800);out.closeForm=$('#pnModal')?.innerText.replace(/\s+/g,' ').slice(0,300);const ok=$$('#pnModal button').find(b=>/بستن روی سرور/.test(b.innerText));if(ok){ok.click();await wait(4000)}
  out.closedNow=!!InvWrite.closedPeriod(InvControl.state.raw.inventory,d);out.stateAfter=$$('[data-crd]').map(r=>r.cells[12]?.innerText.trim()).slice(0,4);
  try{InvWrite.addReceipts(JSON.parse(JSON.stringify(InvControl.state.raw.inventory)),{actor:'p',at:'x',pricing:InvControl.state.raw.pricing,reqId:'1'},{date:d,lines:[]});out.lockTest='not locked'}catch(e){out.lockTest=e.message}
  const ro=$('[data-cropen]');if(ro){ro.click();await wait(700);$('#pnModal [name=reason]').value='آزمون probe';$$('#pnModal button').find(b=>/بازگشایی روی سرور/.test(b.innerText))?.click();await wait(4000);out.reopened=!InvWrite.closedPeriod(InvControl.state.raw.inventory,d)}}
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
