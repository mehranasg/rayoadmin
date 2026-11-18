// Probe (read-only, nothing is saved): invoice form with «ورود به انبار» preview, «پرداخت سر تحویل», invoice photo beside the
// form (APP_REVIEW P-02, P-11, P-13), the AI card in settings, and the reorder board (P-12). Screenshots in .local-data/shots.
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const shot=async n=>{window.__shotReq=n;for(let i=0;i<60&&window.__shotDone!==n;i++)await wait(200)};
const set=(el,v)=>{el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))};
try{for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);await wait(2000);
 location.hash='#/finance/docs';for(let i=0;i<40&&!FinanceReal.suppliers();i++)await wait(500);await wait(1000);
 PurchaseEntry.detailed();await wait(1200);const m=$('#pnModal .modal');
 out.options=$$('[name=stockMode] option',m).map(o=>o.textContent.slice(0,30));out.stockDefault=$('[name=stockMode]',m).value;
 // a line with an item that had a direct receipt recently → expect «وصل به ورود»; another one → «ورود تازه»
 const inv=InvControl.state.raw.inventory,rec=inv.stockReceipts.filter(r=>r.status!=='void'&&!r.invoiceId).sort((a,b)=>String(b.date).localeCompare(String(a.date)))[0],ing=InvControl.state.raw.pricing.ingredients.find(i=>i.id===rec?.ingredientId);
 set($('[name=date]',m),P.fa(rec.date));const r0=$$('.pi-row',m)[0],f=k=>r0.querySelector(`[data-f=${k}]`);set(f('item'),$('#piItems option[value]')?[...document.querySelectorAll('#piItems option')].find(o=>o.value.startsWith(ing.name))?.value||ing.name:ing.name);set(f('qty'),'2');set(f('price'),'100000');await wait(500);
 out.recItem=ing?.name;out.preview=$$('#piStock .list-item',m).map(x=>x.innerText.replace(/\s+/g,' '));
 set($('[name=payMode]',m),'now');await wait(200);out.payShown=!$('#piPay',m).hidden;out.payMethods=$$('[name=payMethod] option',m).map(o=>o.textContent);
 // photo
 const c=document.createElement('canvas');c.width=600;c.height=800;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,600,800);g.fillStyle='#000';g.font='28px sans-serif';g.fillText('فاکتور نمونه ۱۲۳',150,80);
 const blob=await new Promise(r=>c.toBlob(r,'image/jpeg'));const dt=new DataTransfer();dt.items.add(new File([blob],'inv.jpg',{type:'image/jpeg'}));const pi=$('#piPhoto',m);pi.files=dt.files;pi.dispatchEvent(new Event('change'));await wait(600);
 out.photo={shown:!$('#piImg',m).hidden,side:m.classList.contains('pi-has-photo'),aiBtnHidden:$('#piAI',m).hidden,hint:$('#piAIState',m).innerText};await shot('invoice-form');P.close();
 location.hash='#/settings/general';await wait(2500);out.aiCard=!!$('#aiKey');await shot('settings-ai');
 location.hash='#/inventory/reorder';await wait(3000);out.board={cards:$$('.ro-sup').length,chips:$$('[data-chips=ro] .chip').map(x=>x.innerText.replace(/\s+/g,' ')),first:$('.ro-sup .card-head')?.innerText.replace(/\s+/g,' ')};await shot('reorder-board');
 out.overdue=DashboardReal.tasks().filter(t=>/سررسید/.test(t.text)).map(t=>t.text);
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
