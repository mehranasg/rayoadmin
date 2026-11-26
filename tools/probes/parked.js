// Probe (BL-088): settings card with group defaults and «پیش‌فرض گروه», stocktake detail filter «بیرون از محاسبه», cycle tab
// suggestion, count form order. The changes are made only in this page's memory (no save).
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const shot=async n=>{window.__shotReq=n;for(let i=0;i<60&&window.__shotDone!==n;i++)await wait(200)};
try{for(let i=0;i<120&&!InvControl.ready();i++)await wait(500);const raw=InvControl.state.raw;
 location.hash='#/inventory/settings';await wait(2500);out.settings={groups:$$('[data-glv]').length,defaultOpt:$('[data-lv] option')?.innerText};
 location.hash='#/inventory/count';await wait(2500);const before=$$('.kpi').find(k=>/مغایرت خالص/.test(k.innerText))?.innerText.replace(/\s+/g,' ');
 // park one group in memory only and look again
 const cat=raw.pricing.ingredients.find(i=>i.category)?.category;raw.inventory.settings.groupControlLevels={[cat]:'PARKED'};InvControl.attach({...raw});await wait(800);location.hash='#/inventory/stock';await wait(800);location.hash='#/inventory/count';await wait(2500);
 out.count={group:cat,before,after:$$('.kpi').find(k=>/مغایرت خالص/.test(k.innerText))?.innerText.replace(/\s+/g,' '),filter:$$('#crFilter [data-f]').map(b=>b.innerText.trim())};
 const pb=$$('#crFilter [data-f]').find(b=>b.dataset.f==='parked');if(pb){pb.click();await wait(800);out.count.parkedRows=$$('#crDetail tbody tr').length}await shot('parked-count');
 location.hash='#/inventory/cycle';await wait(3000);out.cycle={btn:$('#cyPark')?.innerText};if($('#cyPark')){$('#cyPark').click();await wait(800);out.cycle.rows=$$('#pnModal tbody tr').length;out.cycle.sample=$$('#pnModal tbody tr').slice(0,3).map(r=>r.innerText.replace(/s+/g,' '));await shot('park-suggest');$$('#pnModal button').find(b=>/انصراف/.test(b.innerText))?.click();await wait(300)}
 window.InvEntry.count();await wait(1500);const names=$$('#iwList tbody tr td:first-child').map(td=>td.innerText);out.form={first:names[0]?.slice(0,30),lastIsParked:/کنارگذاشته/.test(names.filter(Boolean).at(-1)||'')};
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
