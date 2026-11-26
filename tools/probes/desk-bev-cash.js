// Probe: desk cards (beverage shortage, daily cash), the beverage trend report, catalog list columns, and the menu item
// form of an item with a placeholder code (code field editable). Writes nothing.
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const shot=async n=>{window.__shotReq=n;for(let i=0;i<60&&window.__shotDone!==n;i++)await wait(200)};const card=t=>$$('.card').find(c=>new RegExp(t).test(c.querySelector('h2,h3')?.innerText||''));
try{for(let i=0;i<120&&!InvControl.ready();i++)await wait(500);
 location.hash='#/home';await wait(3500);const b=card('کسری نوشیدنی'),c=card('گزارش صندوق روزانه');out.desk={bev:b?b.innerText.replace(/\s+/g,' ').slice(0,260):null,bevChart:!!$('#hmBev canvas,#hmBev svg'),cash:c?[...c.querySelectorAll('tbody tr')].map(r=>r.innerText.replace(/\s+/g,' ')).slice(0,7):null};await shot('desk-bev-cash');
 location.hash='#/reports/bevtrend';await wait(4000);out.trend={kpis:$$('.kpi').map(k=>k.innerText.replace(/\s+/g,' ').slice(0,80)).slice(0,4),chart:!!$('#rpBev canvas,#rpBev svg'),rows:$$('#pnView tbody tr').length};await shot('bev-trend');
 location.hash='#/base/catalog';await wait(3500);const th=$$('#catTable th');out.catalog={tc:th.filter(x=>x.classList.contains('tc')).map(x=>x.innerText.trim()),nar:th.filter(x=>x.classList.contains('nar')).map(x=>x.innerText.trim()),align:getComputedStyle($('#catTable td.tc')||document.body).textAlign,over:(()=>{const t=$('#catTable table'),w=t?.closest('.table-wrap');return t&&w?t.scrollWidth-w.clientWidth:null})()};await shot('catalog-cols');
 const m=InvControl.state.raw.pricing.menuItems.find(x=>/^ITEM-\d+$/.test(x.code||''));if(m&&window.CatalogReal?.menuItemForm){CatalogReal.menuItemForm(m.id);await wait(1000);out.menuForm={item:m.name,codeInput:!!$('#pnModal input[name=code]'),hint:$('#pnModal input[name=code]')?.parentElement?.innerText?.slice(0,120)}}else out.menuForm=m?'no menuItemForm export':'no placeholder item in local data';
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
