// Probe (read-only, nothing is saved): «تکمیل رسپی‌ها» (APP_REVIEW P-06, BL-056) — the list of items without a recipe by
// sales, the copy-from-a-similar-item chooser and the filled recipe form, the one-line recipe and the approximate cost form.
//   node tools/smoke.cjs tools/probes/recipe-campaign.js 300
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const shot=async n=>{window.__shotReq=n;for(let i=0;i<60&&window.__shotDone!==n;i++)await wait(200)};
const f0=window.fetch;window.fetch=(u,o)=>{if(/Save\?/.test(String(u))){out.blockedSave=(out.blockedSave||0)+1;return Promise.reject(Error('probe: save blocked'))}return f0(u,o)};
try{for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);await wait(2000);
 location.hash='#/menu/campaign';await wait(2500);
 out.kpis=$$('#pnView .kpi').map(k=>k.innerText.replace(/\s+/g,' ').trim());
 const rows=$$('#mcTable tbody tr');out.rows=rows.length;out.first=rows.slice(0,8).map(r=>[...r.cells].slice(0,8).map(c=>c.innerText.replace(/\s+/g,' ').trim()).join(' | '));
 out.buttons=$$('#mcTable [onclick*="MenuEntry."]').length;out.pageH=Math.round(document.scrollingElement.scrollHeight);await shot('campaign');
 const PR=InvControl.state.raw.pricing,has=new Set(PR.recipes.map(r=>r.menuItemId)),todo=PR.menuItems.filter(m=>m.status!=='غیرفعال'&&!has.has(m.id));
 const t=todo.find(m=>MenuWrite.similarItems(PR,m.id,1).length);MenuEntry.copyFrom(t.id);await wait(900);
 out.copy={item:t.name,choices:$$('#pnModal [data-from]').length,title:$('#pnModal .modal-head h2')?.innerText};await shot('campaign-copy');
 const b=$('#pnModal [data-from]');b.click();await wait(1200);out.copyForm={title:$('#pnModal .modal-head h2')?.innerText,rows:$$('#pnModal .mr-row').length,note:$('#pnModal [name=note]')?.value,sum:$('#mrSum')?.innerText.replace(/\s+/g,' ').slice(0,160)};await shot('campaign-copy-form');P.close();
 const dx=todo.map(m=>[m,MenuWrite.directCandidates(PR,m.id,1)[0]]).find(([,d])=>d&&d.score>=1.5);
 if(dx){MenuEntry.direct(dx[0].id,dx[1].id);await wait(1000);out.direct={item:dx[0].name,ing:dx[1].name,rows:$$('#pnModal .mr-row').length,qty:$('#pnModal .mr-row [data-f=qty]')?.value,unit:$('#pnModal .mr-row [data-f=unit]')?.value,warn:/کاتالوگ خیلی کم/.test($("#pnModal .modal-body").innerText),sum:$('#mrSum')?.innerText.replace(/\s+/g,' ').slice(0,160)};await shot('campaign-direct');P.close()}
 MenuEntry.approx(todo[0].id);await wait(900);out.approx={title:$('#pnModal .modal-head h2')?.innerText,hint:$('#mcHint')?.innerText};await shot('campaign-approx');P.close();
 location.hash='#/menu/items';await wait(2000);out.itemsLink=!!$('#pnView a[href="#/menu/campaign"]');
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
