// Probe (BL-084): the current month's sales on the desk, the finance summary and the owner report should now agree
// (cash-report sales are already without VAT). Writes nothing.
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $$=s=>[...document.querySelectorAll(s)];
try{for(let i=0;i<120&&!InvControl.ready();i++)await wait(500);window.ExtrasReal?.loadModule?.('finance');window.PeopleReal?.load?.();await wait(3000);
 const k=s=>$$('.kpi').find(x=>s.test(x.innerText))?.innerText.replace(/\s+/g,' ').slice(0,90);
 location.hash='#/home';await wait(3000);out.desk=k(/^فروش/);location.hash='#/finance';await wait(3000);out.finance=k(/^فروش/);
 const m=InvEngine.CAL.today.slice(0,7);window.ReportsReal.st.n=1;window.ReportsReal.st.end=m;location.hash='#/reports/owner';await wait(5000);P.render();await wait(2500);out.owner=k(/^فروش خالص/);
 const r=window.LedgerReal.monthPnl(m);out.pnl={src:r.m?.salesSource,gross:Math.round(r.grossSales),vat:Math.round(r.vat),sales:Math.round(r.sales)}}catch(e){out.err=String(e.stack||e)}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
