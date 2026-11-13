// Probe: the period reports of «گزارش‌ها» (خلاصهٔ مالک، سود و زیان دوره، آمار فروش، روند محصولات، حقوق و پرسنل).
// Opens each tab for one, three and six months, counts cards, charts and tables and takes screenshots. Writes nothing.
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={tabs:{}};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const shot1=async n=>{window.__shotReq=n;for(let i=0;i<60&&window.__shotDone!==n;i++)await wait(200)};
// the whole page in viewport-high pieces
const shot=async n=>{const h=document.documentElement.scrollHeight;for(let i=0;i*820<h&&i<5;i++){window.scrollTo(0,i*820);await wait(350);await shot1(n+'-'+i)}window.scrollTo(0,0)};
const state=()=>({title:$('.rp-title h2')?.innerText.trim(),cards:$$('#pnTab .card').length,charts:$$('#pnTab .chart svg').length,emptyCharts:$$('#pnTab .chart').filter(c=>!c.querySelector('svg')).map(c=>c.id),tables:$$('#pnTab table').length,notes:$$('#pnTab .note').map(n=>n.innerText.trim().slice(0,70)),kpis:$$('#pnTab .kpi-label').map(k=>k.innerText.trim()),wide:document.documentElement.scrollWidth>document.documentElement.clientWidth+2});
try{for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);window.PeopleReal?.load?.();window.ExtrasReal?.loadModule?.('finance');
 for(let i=0;i<40&&!(window.PeopleReal?.doc?.()&&window.ExtrasReal?.mods?.finance?.doc);i++)await wait(500);
 location.hash='#/reports';await wait(2500);out.reportTabs=$$('.page-tabs .tab').map(a=>a.innerText.trim());out.months=$$('#rpEnd option').map(o=>o.text);
 for(const tab of ['owner','pnlp','salesvol','products','staffcost']){out.tabs[tab]={};for(const n of [3,1,6]){ReportsReal.st.n=n;location.hash='#/reports/'+tab;P.render();await wait(2200);out.tabs[tab][n]=state();if(n===3)await shot('rp-'+tab)}}
 // the month that has sales files: one month, count and amount
 const ss=InvControl.state.M.sales;if(ss.length){ReportsReal.st.end=InvEngine.CAL.k(Math.max(...ss.map(s=>s.b))).slice(0,7);ReportsReal.st.n=1;for(const tab of ['salesvol','products']){location.hash='#/reports/'+tab;P.render();await wait(2500);out.tabs[tab].salesMonth=state();await shot('rp-'+tab+'-sales')}
  ReportsReal.st.sm='amt';location.hash='#/reports/salesvol';P.render();await wait(1500);out.tabs.salesvol.amount=state()}
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
