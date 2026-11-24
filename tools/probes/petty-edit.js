// Probe: petty cash — expense edit button and filled form (before / after the manager's decision), ledger section of supplier
// payments paid with the card, petty card in the supplier payment form (method follows). A synthetic expense is added
// to the page's copy of the finance data only; nothing is saved.
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=()=>{const c=window.confirm;window.confirm=()=>true;document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));window.confirm=c};
try{for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);
 location.hash='#/finance/petty';await wait(1500);for(let i=0;i<40&&!ExtrasReal.mods.finance?.doc;i++)await wait(300);
 const fin=ExtrasReal.mods.finance.doc,card=PettyWrite.view(fin).cards.find(c=>c.status!=='closed');out.card=!!card;if(!card)throw Error('no petty card in local data');
 fin.pettyCash.expenses=fin.pettyCash.expenses||[];const T=InvEngine.CAL.today;
 fin.pettyCash.expenses.push({id:'PCE-QA1',cardId:card.id,date:T,time:'10:00',amountToman:250000,categoryId:PettyWrite.settings(fin).categories[0].id,merchant:'میوه‌فروشی QA',lines:[{name:'لیمو',ingredientId:'',qty:2,unit:'کیلوگرم',unitPrice:125000}],purpose:'آزمون',hasReceipt:true,receiptRef:'R1',decision:null,status:'submitted',createdBy:'qa',createdAt:'x'});
 P.render();await wait(800);const led=async()=>{$('[data-chips=pcr] [data-k=ledger]')?.click();await wait(900)};await led();await wait(1000);
 out.ledger={row:!!$('[data-pce="PCE-QA1"]'),supCard:$$('#pnTab h2,#pnTab h3').some(h=>/پرداخت به تأمین‌کننده با کارت/.test(h.innerText)),supBtn:!!$('#pcSupPay')};
 $('[data-pce="PCE-QA1"]')?.click();await wait(800);out.detail={edit:!!$('#pcEdit')};
 $('#pcEdit')?.click();await wait(800);const m=$('#pnModal');
 out.form={title:$('#pnModal .modal-head h2')?.innerText,merchant:m.querySelector('[name=merchant]')?.value,amountShown:m.querySelector('[name=amount]')?P.rawVal(m.querySelector('[name=amount]')):null,amount:m.querySelector('[name=amount]')?.value,lines:m.querySelectorAll('.pc-line').length,linePrice:m.querySelector('.pc-line [data-f=price]')?.value,receipt:m.querySelector('[name=rec]')?.checked};
 esc();await wait(300);
 // after a decision, as a non-manager: no edit button
 const e=fin.pettyCash.expenses.find(x=>x.id==='PCE-QA1');e.decision={status:'approved',by:'boss',at:'2026-11-20T10:00:00Z',note:''};
 const own=P.owner,cm=AdminAccess.canManage;P.owner=()=>false;AdminAccess.canManage=()=>false;P.render();await wait(800);await led();$('[data-pce="PCE-QA1"]')?.click();await wait(800);
 out.afterDecision={editHidden:!$('#pcEdit'),hint:/فقط مدیر/.test($('#pnModal .modal-body')?.innerText||'')};esc();await wait(300);P.owner=own;AdminAccess.canManage=cm;
 P.render();await wait(800);await led();$('[data-pce="PCE-QA1"]')?.click();await wait(800);out.afterDecision.managerEdit=!!$('#pcEdit');esc();await wait(300);
 // supplier payment form: petty card offered, method follows
 location.hash='#/finance/payments';await wait(3500);if(window.PurchaseReal?.paymentForm){PurchaseReal.paymentForm({});await wait(1200);const sel=$('#pnModal select[name=loc]'),opt=sel&&[...sel.options].find(o=>o.value.startsWith('petty:'));out.payForm={offered:!!opt,label:opt?.text};
  if(opt){sel.value=opt.value;sel.dispatchEvent(new Event('change',{bubbles:true}));await wait(200);out.payForm.method=$('#pnModal select[name=method]')?.value}esc();await wait(300)}
 out.errs=__errs}catch(x){out.err=String(x.stack||x);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
