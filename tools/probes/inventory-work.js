// Probe (read-only, nothing is saved): negative stock warning in the waste form (P-17; the check runs on a copy and the
// first click only warns — the probe never clicks a second time), «ایرادهای داده» (P-16), «شمارش امروز» (P-08) and the
// reorder suggestion (P-18). Screenshots in .local-data/shots.
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const shot=async n=>{window.__shotReq=n;for(let i=0;i<60&&window.__shotDone!==n;i++)await wait(200)};
const set=(el,v)=>{el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))};
// block any save: the probe must not write
const f0=window.fetch;window.fetch=(u,o)=>{if(/Save\?/.test(String(u))){out.blockedSave=(out.blockedSave||0)+1;return Promise.reject(Error('probe: save blocked'))}return f0(u,o)};
try{for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);await wait(2000);
 location.hash='#/inventory/waste';await wait(2000);InvEntry.event();await wait(900);const m=$('#pnModal .modal');
 const it=[...InvControl.state.M.ing.values()].find(i=>i.status!=='غیرفعال'&&i.recipeUnit==='کیلوگرم');set($('[name=item]',m),it.name+(it.code?' — '+it.code:''));await wait(200);set($('[name=qty]',m),'99999');
 set($('[name=reason]',m),'آزمون');const sec=$('[name=section]',m);if(sec&&sec.options.length>1)set(sec,sec.options[1].value);
 const ok=$('#iwOk',m)||[...m.querySelectorAll('.modal-foot .btn-primary')].pop();ok.click();await wait(2500);
 out.neg={err:$('#iwErr',m)?.textContent,warning:!!$('#iwNeg .note',m),text:$('#iwNeg')?.innerText.replace(/\s+/g,' ').slice(0,260),btn:ok.innerText.trim()};await shot('neg-warning');
 set($('[name=qty]',m),'1');await wait(200);out.negReset={box:$('#iwNeg')?.innerText.trim()||'',btn:ok.innerText.trim()};P.close();
 location.hash='#/inventory/issues';await wait(3000);out.issues={kpi:$$('.kpi').map(k=>k.innerText.replace(/\s+/g,' ')),chips:$$('[data-chips=iss] .chip').map(c=>c.innerText.replace(/\s+/g,' ')),rows:$$('#pnView tbody tr').length,fix:$$('[data-isfix]').length,sub:$$('.page-subtabs .subtab').map(x=>x.innerText.trim())};await shot('issues');
 const fx=$('[data-isfix]');if(fx){fx.click();await wait(1200);out.fixOpened=$('#pnModal.open .modal-head h2')?.innerText||location.hash;P.close()}
 location.hash='#/inventory/cycle';await wait(4000);out.cycle={kpi:$$('.kpi').map(k=>k.innerText.replace(/\s+/g,' ')),rows:$$('#pnView tbody tr').length,chips:$$('[data-chips=cy] .chip').map(c=>c.innerText.replace(/\s+/g,' '))};await shot('cycle');
 $('#cyGo')?.click();await wait(1500);out.cycleForm={title:$('#pnModal .modal-head h2')?.innerText,rows:$$('#iwList tbody tr').length,all:!!$('#iwAll')};P.close();
 location.hash='#/inventory/reorder';await wait(3000);$('#roSug')?.click();await wait(4000);out.suggest={title:$('#pnModal .modal-head h2')?.innerText,rows:$$('#pnModal [data-rs]').length,checked:$$('#pnModal [data-rs] input[type=checkbox]:checked').length,first:$('#pnModal [data-rs]')?.innerText.replace(/\s+/g,' ')};await shot('reorder-suggest');P.close();
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
