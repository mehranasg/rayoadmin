// Probe (read-only): the new home page (APP_REVIEW P-07, P-28, P-04, P-03, P-05) — owner view, the day modal, the nightly
// report text, the month report card in «ماه به ماه», and the home page of the storekeeper and cashier roles. Nothing is saved.
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const shot=async n=>{window.__shotReq=n;for(let i=0;i<60&&window.__shotDone!==n;i++)await wait(200)};
const home=()=>({title:$('.page-head .crumbs')?.innerText.trim(),tasks:$$('.hm-task').map(a=>a.innerText.trim()).slice(0,6),kpi:$$('.kpi').map(k=>k.innerText.replace(/\s+/g,' ').trim()),cal:$$('.dc[data-day]').length,calBad:$$('.dc-bad,.dc-part').length,short:$$('.hm-sc').length,card:!!$$('.card h2').find(h=>/کارنامه/.test(h.innerText)),night:!!$('#hmNight')});
try{for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);await wait(3000);
 location.hash='#/home';await wait(3000);out.owner=home();await shot('home-owner');
 const d=$('.dc-bad,.dc-part');if(d){d.click();await wait(800);out.dayModal={title:$('#pnModal .modal-head h2')?.innerText,rows:$$('#pnModal .list-item').map(r=>r.innerText.replace(/\s+/g,' ').trim())};await shot('home-day');P.close()}
 $('#hmNight')?.click();await wait(1200);out.night=$('#ntText')?.textContent;await shot('home-night');P.close();
 location.hash='#/reports/monthly';await wait(3000);out.monthCard=$$('#pnView table')[0]?.innerText.replace(/\t/g,' | ').split('\n').slice(0,6);
 for(const id of ['storekeeper','cashier','accountant']){const r=AdminAccess.PRESETS.find(x=>x.id===id);AdminAccess.setPreview(r);location.hash='#/home';P.render();await wait(3000);out[id]=home();if(id==='storekeeper')await shot('home-storekeeper')}
 AdminAccess.setPreview(null);P.render();out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs;try{AdminAccess.setPreview(null)}catch(_){}}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
