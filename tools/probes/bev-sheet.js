// Probe (BL-096): beverage × day sheet in «انبار ← شمارش نوشیدنی» and «گزارش‌ها ← روند کسری نوشیدنی»: rows, columns, a cell
// detail, week and money views, the trend chart stacked by beverage. Read only.
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const shot=async n=>{window.__shotReq=n;for(let i=0;i<60&&window.__shotDone!==n;i++)await wait(200)};
const sheet=h=>({rows:$$(h+' .bs tbody tr').length,cols:$$(h+' .bs thead th').length-2,none:$$(h+' .bs thead th.bs-none').length,top:$$(h+' .bs thead th.bs-top').length,sum:$(h+' .bs-sum')?.innerText.replace(/\s+/g,' ').slice(0,200)});
try{try{localStorage.removeItem('pn_bevsheet')}catch(e){}for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);
 location.hash='#/inventory/beverage';await wait(3500);out.inv={mode:$('#bvMode .active')?.innerText,...sheet('#bvSheet')};$('#bvMode')?.scrollIntoView();await wait(300);await shot('bev-sheet-inv');
 const c=$('#bvSheet td.bs-c');if(c){c.click();await wait(600);out.inv.cell={title:$('#pnModal .modal-head h2')?.innerText,rows:$$('#pnModal tbody tr').length};await shot('bev-sheet-cell');$('#pnModal [data-close]')?.click();await wait(300)}
 $('#bvMode [data-v=list]')?.click();await wait(800);out.inv.list={chart:!!$('#chBevLine [_echarts_instance_],#chBevLine svg'),rows:$$('.card tbody tr').length>0};$('#bvMode [data-v=sheet]')?.click();await wait(600);
 location.hash='#/reports/bevtrend';await wait(3500);out.rep={...sheet('#rpBevSheet'),chart:$('#rpBev')?.getAttribute('_echarts_instance_')?true:false};await shot('bev-sheet-rep');
 $('#rpBevSheet [data-bs=by] [data-v=week]')?.click();await wait(500);$('#rpBevSheet [data-bs=m] [data-v=value]')?.click();await wait(500);out.week=sheet('#rpBevSheet');await shot('bev-sheet-week');
 const q=$('#rpBevSheet [data-bs-q]');if(q){q.value='آب';q.dispatchEvent(new Event('input',{bubbles:true}));await wait(700);out.search=sheet('#rpBevSheet')}
 try{localStorage.removeItem('pn_bevsheet')}catch(e){}out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
