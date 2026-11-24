// QA: petty cash expense edit (PettyWrite.editExpense: void + corrected copy, manager rule after a decision, closed month)
// and supplier payments paid with a petty card (PurchaseWrite.payPlace 'petty:<cardId>', FinanceWrite.pettyPurchases and
// the card's account moves). Synthetic data only.
// Run: node qa_template_petty_edit.js
'use strict';
const fs=require('fs'),path=require('path');
global.window={};
for(const f of ['inventory-engine.js','inventory-write.js','menu-write.js','purchase-write.js','petty-write.js','finance-write.js'])eval(fs.readFileSync(path.join(__dirname,'../app/core/js',f),'utf8'));
const PC=window.PettyWrite,PW=window.PurchaseWrite,FW=window.FinanceWrite,C=window.InvEngine.CAL;
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const throws=(f,re,m)=>{try{f();ok(false,m+' (no error)')}catch(e){ok(re.test(e.message),m+' → '+e.message)}};
const T=C.today,thisMonth=T.slice(0,7),prevEnd=C.k(C.i(thisMonth+'/01')-1),prevMonth=prevEnd.slice(0,7),inPrev=prevMonth+'/10';
let n=0;const ctx=(o={})=>({actor:'qa-user',at:'2026-11-20T10:00:00Z',reqId:'R'+(++n),module:'finance',pricing:{ingredients:[]},...o});
const fin={meta:{updatedAt:'x'},entries:[],changeLog:[]};
const card=PC.addCard(fin,ctx(),{holderName:'علی',last4:'4218',openingToman:5000000,openedAt:prevMonth+'/01'});
const base={cardId:card.id,date:T,time:'10:00',categoryId:'produce',merchant:'میوه‌فروشی',amountToman:300000,purpose:'لیمو',lines:[]};
const e1=PC.addExpense(fin,ctx(),base);

// ---- edit before a decision: anyone with petty access
throws(()=>PC.editExpense(fin,ctx(),{...base,id:e1.id}),/تغییری نیست/,'no change refused');
ok(fin.pettyCash.expenses.length===1&&e1.status==='submitted','refused edit leaves nothing behind');
const c1=ctx(),e2=PC.editExpense(fin,c1,{...base,id:e1.id,amountToman:350000,merchant:'میوه‌فروشی سر کوچه'});
ok(e1.status==='void'&&e1.voidKind==='edit'&&e1.replacedBy===e2.id,'old row voided as an edit, points to the copy');
ok(e2.replaces===e1.id&&e2.amountToman===350000&&e2.status==='submitted'&&e2.createdBy===e1.createdBy&&e2.editedBy==='qa-user','copy keeps the creator, records the editor');
ok(c1.auditExtra.replaces===e1.id&&c1.auditExtra.before.amountToman===300000&&c1.auditExtra.before.merchant==='میوه‌فروشی','audit has the previous values');
throws(()=>PC.editExpense(fin,ctx(),{...base,id:e1.id}),/پیدا نشد/,'a replaced row cannot be edited again');
ok(PC.balance(fin,card.id).spent===350000,'balance counts only the corrected copy');

// ---- after the manager's decision: only a manager; the decision stays on the copy
PC.decide(fin,ctx({actor:'boss'}),{id:e2.id,status:'approved'});
throws(()=>PC.editExpense(fin,ctx(),{...base,id:e2.id,amountToman:360000}),/فقط مدیر/,'non-manager cannot edit after the decision');
const e3=PC.editExpense(fin,ctx({actor:'boss',manager:true}),{...base,id:e2.id,amountToman:360000});
ok(e3.decision?.status==='approved'&&e3.decision.by==='boss'&&e3.editedAfterDecision===true&&e2.status==='void','manager edit keeps the decision on the copy');

// ---- closed month: no edit
const old=PC.addExpense(fin,ctx(),{...base,date:inPrev});PC.decide(fin,ctx(),{id:old.id,status:'approved'});
PC.closeMonth(fin,ctx(),{cardId:card.id,period:prevMonth,bankBalance:PC.balance(fin,card.id,prevEnd).expected});
throws(()=>PC.editExpense(fin,ctx({manager:true}),{...base,date:inPrev,id:old.id,amountToman:1000}),/بسته شده/,'expense of a closed month is not edited');
ok(PC.closedFor(fin,card.id,inPrev)===true&&PC.closedFor(fin,card.id,T)===false,'closedFor exported');

// ---- supplier payment from the petty card
const inv={settings:{paymentLocations:[{id:'PAYLOC-1',name:'حساب سامان',isActive:true}]},purchaseInvoices:[],supplierPayments:[]};
const sups={suppliers:[{id:'SUP-1',code:'S1',company:'لبنیات کاله',status:'فعال'}]};
const petty={cards:PC.view(fin).cards,closedFor:(id,d)=>PC.closedFor(fin,id,d)};
ok(PW.pettyOptions(fin).length===1&&PW.pettyOptions(fin)[0].id==='petty:'+card.id,'active cards offered as payment places');
const pay=PW.addPayment(inv,{actor:'qa',at:'x',reqId:'P1'},{supplierId:'SUP-1',date:T,amount:200000,method:'کارت تنخواه',paymentLocationId:'petty:'+card.id,reference:'r-1',direction:'payment'},{suppliers:sups,petty});
ok(pay.pettyCardId===card.id&&pay.paymentLocationId==='petty:'+card.id&&/تنخواه/.test(pay.paymentLocationNameSnapshot),'payment keeps the card');
throws(()=>PW.addPayment(inv,{actor:'qa',at:'x',reqId:'P2'},{supplierId:'SUP-1',date:T,amount:1,paymentLocationId:'petty:'+card.id,reference:'r-2',direction:'payment'},{suppliers:sups}),/کارت تنخواه پیدا نشد/,'without the finance cards a card payment is refused');
throws(()=>PW.addPayment(inv,{actor:'qa',at:'x',reqId:'P3'},{supplierId:'SUP-1',date:inPrev,amount:1,paymentLocationId:'petty:'+card.id,reference:'r-3',direction:'payment'},{suppliers:sups,petty}),/بسته شده/,'closed petty month refused');
const loc=PW.addPayment(inv,{actor:'qa',at:'x',reqId:'P4'},{supplierId:'SUP-1',date:T,amount:50000,paymentLocationId:'PAYLOC-1',reference:'r-4',direction:'payment'},{suppliers:sups,petty});
ok(!('pettyCardId' in loc),'ordinary location payment unchanged');
// card balance and ledger
const buys=FW.pettyPurchases(fin,inv,card.id);
ok(buys.length===1&&buys[0].amount===200000&&buys[0].direct===true&&buys[0].supplier==='لبنیات کاله','pettyPurchases lists the card payment');
const b=PC.balance(fin,card.id,'',buys);ok(b.purchases===200000,'card balance lowered by the supplier payment');
// edit the payment to another place: the card no longer counts it
PW.editPayment(inv,{actor:'qa',at:'y',reqId:'P5'},{id:pay.id,supplierId:'SUP-1',date:T,amount:200000,paymentLocationId:'PAYLOC-1',reference:'r-1',direction:'payment'},{suppliers:sups,petty});
ok(!('pettyCardId' in pay)&&FW.pettyPurchases(fin,inv,card.id).length===0,'payment moved off the card');
// quick invoice paid with the card
const q=PW.addQuickInvoice(inv,{actor:'qa',at:'x',reqId:'Q1'},{supplierId:'SUP-1',number:'77',date:T,amount:90000,settlement:'paid',payLocationId:'petty:'+card.id,payRef:'q-1',payMethod:'کارت تنخواه'},{suppliers:sups,petty});
ok(q.payment.pettyCardId===card.id&&FW.pettyPurchases(fin,inv,card.id).length===1,'quick invoice paid with the card');

console.log(`qa_template_petty_edit: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
