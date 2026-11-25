// Probe: BL-035 cards in «گزارش‌ها ← خلاصهٔ مالک» — last year, cost targets (and the form), weekly cash plan. Writes nothing.
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const shot=async n=>{window.__shotReq=n;for(let i=0;i<60&&window.__shotDone!==n;i++)await wait(200)};
try{for(let i=0;i<120&&!InvControl.ready();i++)await wait(500);window.ExtrasReal?.load?.('finance');window.PeopleReal?.load?.();window.FinanceReal?.loadSuppliers?.();
 location.hash='#/reports/owner';await wait(6000);P.render();await wait(3000);
 const card=t=>$$('.card').find(c=>c.querySelector('h2,h3')&&new RegExp(t).test(c.querySelector('h2,h3').innerText));
 const y=card('سال قبل'),g=card('هدف درصد'),c=card('برنامهٔ نقدی');
 out.yoy=y?y.innerText.replace(/\s+/g,' ').slice(0,200):null;out.targets=g?g.innerText.replace(/\s+/g,' ').slice(0,300):null;
 out.cash=c?{rows:[...c.querySelectorAll('tbody')][0]?[...[...c.querySelectorAll('tbody')][0].rows].map(r=>r.innerText.replace(/\s+/g,' ')):[],note:c.querySelector('.note')?.innerText?.slice(0,160)||'',foot:c.querySelector('p.muted')?.innerText?.slice(0,260)}:null;
 await shot('owner-bl035');const b=g?.querySelector('button');if(b){b.click();await wait(800);out.form={title:$('#pnModal h2')?.innerText,fields:$$('#pnModal input').map(i=>i.name+'='+i.value)};const x=$$('#pnModal button').find(b=>/انصراف/.test(b.innerText));x?.click()}
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
