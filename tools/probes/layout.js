// Probe (read-only): layout pass (APP_REVIEW N-14, N-19, N-20, N-22, N-37) — page heights, the help of a page, folded notes in
// a form, tables as cards on a phone. Run on desktop and on a phone width:
//   node tools/smoke.cjs tools/probes/layout.js 300          (desktop 1366)
//   node tools/smoke.cjs tools/probes/layout.js 300 390      (phone)
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={w:innerWidth,h:{}};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const shot=async n=>{window.__shotReq=n;for(let i=0;i<60&&window.__shotDone!==n;i++)await wait(200)};const ph=innerWidth<600?'-phone':'';
try{for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);await wait(2000);
 for(const h of ['#/home','#/menu/recipes','#/menu/pricing','#/inventory/count','#/finance/assets','#/inventory/stock','#/people/staff']){location.hash=h;await wait(2500);out.h[h]=Math.round(document.scrollingElement.scrollHeight)}
 location.hash='#/inventory/stock';await wait(2500);const td=$('#pnView table.grid-cards tbody td');out.cards={has:!!td,th:td?.dataset.th,display:td?getComputedStyle(td).display:'',thead:$('#pnView table.grid-cards thead')?getComputedStyle($('#pnView table.grid-cards thead')).display:''};await shot('layout-stock'+ph);
 location.hash='#/finance/docs';await wait(2500);P.help();await wait(600);out.help={title:$('#pnModal .modal-head h2')?.innerText,items:$$('#pnModal .help-list li').length,gloss:$$('#pnModal .gloss dt').length};await shot('layout-help'+ph);P.close();
 for(let i=0;i<40&&!FinanceReal.suppliers();i++)await wait(500);PurchaseEntry.detailed();await wait(1200);out.form={folded:$$('#pnModal .note-fold').length,open:$$('#pnModal .note:not(.note-fold)').length,modalH:Math.round($('#pnModal .modal').getBoundingClientRect().height),footVisible:$('#pnModal .modal-foot').getBoundingClientRect().bottom<=innerHeight+1};await shot('layout-form'+ph);P.close();
 InvEntry.event();await wait(900);out.waste={folded:$$('#pnModal .note-fold').length,footVisible:$('#pnModal .modal-foot').getBoundingClientRect().bottom<=innerHeight+1};await shot('layout-waste'+ph);P.close();
 location.hash='#/menu/recipes';await wait(2500);await shot('layout-recipes'+ph);
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
