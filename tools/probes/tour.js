// Probe (read-only): a tour of the panel for a UX review — every section's visible tabs, how many buttons, cards, tables and
// notes each page shows, the sidebar, the quick «ثبت جدید» menu and the daily tasks; screenshots of the main pages.
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={pages:{}};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const shot=async n=>{window.__shotReq=n;for(let i=0;i<60&&window.__shotDone!==n;i++)await wait(200)};
try{for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);await wait(3000);
 out.sidebar=$$('#pnSide .nav-label,#pnSide .nav-link').map(a=>(a.classList.contains('nav-label')?'## ':'')+a.innerText.trim().replace(/\s+/g,' '));
 const mods=['home','finance','inventory','people','menu','customers','reports','settings'];
 for(const md of mods){location.hash='#/'+md;await wait(2500);const tabs=$$('.page-tabs .tab').map(t=>({l:t.innerText.trim().replace(/\s+/g,' '),h:t.getAttribute('href')}));out.pages[md]={tabs:tabs.map(t=>t.l)};
  const list=tabs.length?tabs:[{l:'—',h:'#/'+md}];
  for(const t of list){location.hash=t.h;await wait(2200);const v=$('#pnView');
   out.pages[md][t.l]={btn:$$('#pnView .page-head .actions .btn').map(b=>b.innerText.trim()).filter(Boolean),cards:v.querySelectorAll('.card').length,kpi:v.querySelectorAll('.kpi').length,tables:v.querySelectorAll('table').length,notes:v.querySelectorAll('.note').length,charts:v.querySelectorAll('.chart').length,h:Math.round(v.scrollHeight),desc:$('.page-head p')?.innerText.trim().slice(0,90)}}}
 location.hash='#/home';await wait(2500);await shot('tour-home');out.homeText=$('#pnView').innerText.replace(/\s+/g,' ').slice(0,2500);
 const qb=$$('button').find(b=>/ثبت جدید/.test(b.innerText));if(qb){qb.click();await wait(600);out.quick=$$('.pn-quick button,.quick-item,[data-quick]').map(b=>b.innerText.trim().replace(/\s+/g,' ')).slice(0,40);await shot('tour-quick');document.body.click();await wait(300)}
 for(const h of ['#/finance','#/inventory','#/people','#/reports']){location.hash=h;await wait(2500);await shot('tour-'+h.slice(2))}
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
