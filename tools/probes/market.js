// Probe: finance → invoices: purchases and supplier debt «stock market» chart (candles + volume bars). Writes nothing.
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s);
const shot=async n=>{window.__shotReq=n;for(let i=0;i<60&&window.__shotDone!==n;i++)await wait(200)};
try{for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);
 location.hash='#/finance/docs';await wait(5000);out.real={note:$('#tmNote')?.innerText,tree:!!$('#chTree svg')};const tmS=$('#tmM');if(tmS){tmS.value=tmS.options[2].value;tmS.dispatchEvent(new Event('change'));await wait(800);out.real.note2=$('#tmNote')?.innerText}window.scrollTo(0,300);await shot('tree-real');location.hash='#/home';await wait(1500);const inv=InvControl.state.raw.inventory;if(!(inv.purchaseInvoices||[]).length){/* demo rows in memory only (never saved) so the chart can be seen on a copy without invoices */let n=0;for(let m=6;m<=8;m++)for(let d=1;d<=28;d+=3){const dt='1405/0'+m+'/'+String(d).padStart(2,'0');inv.purchaseInvoices.push({id:'DEMO-'+(++n),supplierId:'S'+(n%3),supplierNameSnapshot:'نمونه '+(n%3),status:'final',date:dt,totalToman:2e6+((n*7919)%5)*1e6,paidAmount:0});if(n%2)inv.supplierPayments.push({id:'DP-'+n,supplierId:'S'+(n%3),date:dt,amount:3e6+((n*31)%4)*1e6,direction:'payment',status:'posted'})}out.demo=n}location.hash='#/finance/docs';await wait(5000);out.echarts=!!window.echarts;
 const s=PurchaseWrite.debtSeries(InvControl.state.raw.inventory,{bucket:'week'});out.weeks=s.buckets.length;out.last=s.buckets.at(-1);
 out.chart=!!$('#chMarket svg');out.tree=!!$('#chTree svg');out.treeNote=$('#tmNote')?.innerText;$('#chTree')?.scrollIntoView();await shot('tree');out.options=$('#mkSup')?.options.length;
 $('#chMarket')?.scrollIntoView();await shot('market-week');
 const b=$('#mkB');if(b){b.value='month';b.dispatchEvent(new Event('change'));await wait(800);await shot('market-month')}
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
