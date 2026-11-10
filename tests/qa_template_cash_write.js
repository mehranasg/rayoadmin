// QA: newpanel/core/js/cash-write.js — daily cash report of the new panel against the current panel's rules.
// Run: node qa_template_cash_write.js
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const throws=(f,re,m)=>{try{f();ok(false,m+' (no error)')}catch(e){ok(re.test(e.message),m+' → '+e.message)}};
global.window={};eval(fs.readFileSync(path.join(__dirname,'../app/core/js/cash-write.js'),'utf8'));
const C=window.CashWrite;
// the current panel's own formulas (config.js cashAmount / cashVariance / cashSales), evaluated separately
const cfg=fs.readFileSync(path.join(__dirname,'../legacy/js/config.js'),'utf8'),cut=(a,b)=>cfg.slice(cfg.indexOf(a),cfg.indexOf(b));
const ctxv=vm.createContext({});vm.runInContext(cut('function cashAmount(','window.RayoCashVariance=')+';this.v=cashVariance;this.s=cashSales;',ctxv);
const samples=[{netReceivable:3468466500,tipValet:1000000,tipHall:6195000,pos1:138030000,pos2:1385129000,pos3:1745822500,pos4:15125000,cardToCard:195680000,cash:0,otherTransactions:[{amount:67000000,sign:-1}],taxAmount:312129500,debtorAmount:1000,deliveryFeeAmount:5000,snappAmount:7000,hallAmount:5,subscriberAmount:6},
 {netReceivable:'۱۲۰٬۰۰۰',pos1:'100000',cash:'25000',tipHall:5000,tipsOutsideCashbox:true},{netReceivable:'abc'}];
for(const [i,r] of samples.entries()){const a=JSON.stringify(C.variance(r)),b=JSON.stringify(ctxv.v(r));ok(a===b,'variance equals config.js #'+i);ok(JSON.stringify(C.sales(r))===JSON.stringify(ctxv.s(r)),'sales equals config.js #'+i)}
// types equal config.js RayoCashTypes.base
const base=vm.runInNewContext('('+cfg.slice(cfg.indexOf('base:[',cfg.indexOf('window.RayoCashTypes='))+5,cfg.indexOf('],',cfg.indexOf('window.RayoCashTypes='))+1)+')');
ok(JSON.stringify(base)===JSON.stringify(C.TYPES),'built-in types equal config.js');

const at='2026-11-08T10:00:00Z',ctx=(o={})=>({actor:'qa',at,today:'1405/08/17',reqId:'R'+Math.random().toString(36).slice(2,8),...o});
const doc={settings:{discrepancyLimit:1000000},cashiers:[{id:'CASHIER-0001',name:'سارا',status:'فعال'},{id:'CASHIER-0002',name:'قدیمی',status:'غیرفعال'}],
 cashRecipients:[{id:'CREC-1',name:'مهران',status:'فعال'}],transferAccounts:[{id:'CACCT-1',name:'پاسارگاد',status:'فعال',ownerRecipientId:'CREC-1'}],reports:[]};
const base1={date:'1405/08/10',cashierId:'CASHIER-0001',netReceivable:1000000,pos1:800000,card:[{amount:150000,destId:'CACCT-1'}],cash:[{amount:50000,destId:'CREC-1'}],adjustments:[]};
const r1=C.buildReport(doc,base1,ctx({recordId:'CASH-1'}));
ok(r1.finalVariance===0&&r1.cardToCard===150000&&r1.cash===50000&&r1.cardToCardAccountNameSnapshot==='پاسارگاد'&&r1.cardToCardOwnerNameSnapshot==='مهران'&&r1.cashRecipientNameSnapshot==='مهران','report shape: totals and destination snapshots');
ok(r1.registeredByType==='admin'&&r1.managerReview==='بررسی نشده'&&r1.formulaVersion==='cash-variance-v2'&&r1.salesFormulaVersion==='sepidz-net-v2'&&r1.id==='CASH-1','report shape: admin record like js/11');
doc.reports.push(r1);
throws(()=>C.buildReport(doc,{...base1},ctx()),/قبلاً گزارش/,'one report per day');
throws(()=>C.buildReport(doc,{...base1,date:'1405/08/20'},ctx()),/آینده/,'no future date');
throws(()=>C.buildReport(doc,{...base1,date:'1405/08/11',cashierId:'CASHIER-0002'},ctx()),/فعال نیست/,'inactive cashier');
throws(()=>C.buildReport(doc,{...base1,date:'1405/08/11',card:[{amount:5,destId:''}]},ctx()),/مقصد/,'card line needs a destination');
throws(()=>C.buildReport(doc,{...base1,date:'1405/08/11',pos1:-5},ctx()),/منفی/,'no negative amount');
// the sign always follows the type, whatever is sent
const r2=C.buildReport(doc,{...base1,date:'1405/08/11',adjustments:[{type:'futureDepositReceived',amount:20000,sign:1},{type:'customerReceivable',amount:100000,followUpRequired:true,customerName:'آقای الف'}]},ctx({recordId:'CASH-2'}));
ok(r2.otherTransactions[0].sign===-1&&r2.otherTransactions[1].sign===1&&r2.adjustmentsTotal===80000,'sign follows the type');
throws(()=>C.buildReport(doc,{...base1,date:'1405/08/11',adjustments:[{type:'customerReceivable',amount:5,followUpRequired:true}]},ctx()),/نام مشتری/,'receivable needs a customer');
doc.reports.push(r2);
let f=C.followups(doc);ok(f.length===1&&f[0].open&&f[0].remaining===100000,'receivable is open');
// partial receipt, then the rest: closed automatically, reopened when the closing report is archived
const r3=C.buildReport(doc,{...base1,date:'1405/08/12',adjustments:[{type:'oldReceivableReceived',amount:60000,settlesReportId:'CASH-2',settlesAdjustmentId:r2.otherTransactions[1].id}]},ctx({recordId:'CASH-3'}));
ok(r3.otherTransactions[0].settlesCustomerSnapshot==='آقای الف'&&r3.otherTransactions[0].sign===-1,'receipt row carries the link');
doc.reports.push(r3);f=C.followups(doc);ok(f[0].remaining===40000&&f[0].open&&C.followupPatches(doc).length===0,'partial receipt keeps the rest open');
throws(()=>C.buildReport(doc,{...base1,date:'1405/08/13',adjustments:[{type:'oldReceivableReceived',amount:50000,settlesReportId:'CASH-2',settlesAdjustmentId:r2.otherTransactions[1].id}]},ctx()),/بیشتر از مانده/,'cannot receive more than is open');
const r4=C.buildReport(doc,{...base1,date:'1405/08/13',adjustments:[{type:'oldReceivableReceived',amount:40000,settlesReportId:'CASH-2',settlesAdjustmentId:r2.otherTransactions[1].id}]},ctx({recordId:'CASH-4'}));
doc.reports.push(r4);let p=C.followupPatches(doc);
ok(p.length===1&&p[0].id==='CASH-2'&&p[0].otherTransactions[1].status==='تسویه‌شده'&&p[0].otherTransactions[1].settledByReportId==='CASH-4','fully received → closed by the last report');
doc.reports=doc.reports.map(r=>r.id==='CASH-2'?p[0]:r);ok(!C.followups(doc)[0].open,'closed receivable is not open');
// editing the closing report keeps its link valid
ok(C.buildReport(doc,{...base1,date:'1405/08/13',adjustments:[{id:r4.otherTransactions[0].id,type:'oldReceivableReceived',amount:40000,settlesReportId:'CASH-2',settlesAdjustmentId:r2.otherTransactions[1].id}]},ctx({old:r4})).id==='CASH-4','edit of a linked receipt is accepted');
throws(()=>C.buildReport(doc,{...base1,date:'1405/08/11',adjustments:[]},ctx({old:p[0]})),/وصول شده/,'received receivable cannot be removed');
throws(()=>C.archiveCheck(doc,'CASH-2'),/وصول شده/,'report with a received receivable cannot be archived');
const afterArchive=C.withReport(doc,'CASH-4',{...r4,isArchived:true});p=C.followupPatches(afterArchive);
ok(p.length===1&&p[0].otherTransactions[1].status==='باز'&&p[0].otherTransactions[1].settledByReportId==='','archiving the closing report reopens the receivable');
// manual settlement and review
const d2={...doc,reports:[r1,r2]};const s=C.settle(d2,'CASH-2',r2.otherTransactions[1].id,{date:'1405/08/14',note:'واریز به حساب'},ctx());
ok(s.otherTransactions[1].status==='تسویه‌شده'&&!s.otherTransactions[1].settledByReportId,'manual settlement');
throws(()=>C.settle(d2,'CASH-2',r2.otherTransactions[1].id,{date:'1405/08/14',note:''},ctx()),/پیگیری/,'manual settlement needs a note');
throws(()=>C.review(r1,{status:'بررسی‌شده',note:''},ctx()),/توضیح/,'reviewed needs a note (js/40)');
ok(C.review(r1,{status:'بررسی‌شده',note:'ok'},ctx()).managerReview==='بررسی‌شده'&&C.reviewStatus({finalVariance:2000000},1000000)==='نیازمند بررسی','review fields like js/40');
// people, accounts, cashiers, settings
throws(()=>C.saveAccount(doc,{id:'CACCT-1',name:'پاسارگاد',ownerRecipientId:'CREC-2',status:'فعال'},ctx()),/مالک/,'account owner cannot change');
throws(()=>C.saveAccount(doc,{name:'ملت',ownerRecipientId:'CREC-1',cardNumber:'1234'},ctx()),/۱۶ رقم/,'card number is 16 digits');
ok(C.saveCashier(doc,{name:'نیما'},ctx()).id==='CASHIER-0003','cashier id like js/11 crUid');
throws(()=>C.saveCashier(doc,{name:'سارا'},ctx()),/قبلاً/,'duplicate cashier');
const sd={settings:{}};C.saveType(sd,{value:'futureDepositReceived',label:'بیعانه فردا',sign:-1,follow:false});ok(C.types(sd.settings).find(t=>t.value==='futureDepositReceived').label==='بیعانه فردا','built-in type override');
C.saveType(sd,{label:'تخفیف مدیر',sign:1,newId:'X'});ok(C.types(sd.settings).some(t=>t.value==='CUSTOM-X'&&t.sign===1),'custom type');
ok(C.saveDisplay(sd,'ریال').after==='ریال'&&sd.settings.displayCurrency==='ریال','display unit setting');throws(()=>C.saveDisplay(sd,'دلار'),/تومان یا ریال/,'display unit values');
// custody ledger: report lines in rial become toman; finance entries are toman
const L=C.ledger(doc,[{id:'CUST-1',type:'custodyReturn',custodyKind:'custodyReturn',cashRecipientId:'CREC-1',amountToman:3000,date:'1405/08/12',status:'active'}],{personId:'CREC-1'});
const cashG=L.groups.find(g=>g.type==='cash');ok(cashG&&cashG.received===20000&&cashG.paid===3000&&cashG.closing===17000,'custody ledger in toman');
const e=C.custodyEntry(doc,{sourceKey:'cash:CREC-1',kind:'custodyReturn',date:'1405/08/12',amountToman:'۳٬۰۰۰',title:'تحویل به بانک'},ctx());ok(e.amountToman===3000&&e.custodyOwnerNameSnapshot==='مهران'&&/^CUST-/.test(e.id),'custody entry shape like js/11');
ok(C.voidEntry(e,'اشتباه',ctx()).status==='void','custody entry void');
console.log(`qa_template_cash_write: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
