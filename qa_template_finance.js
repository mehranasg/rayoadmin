// QA: finance ledger of the new panel (migration stage 7) — newpanel/core/js/finance-write.js
//  expense / income documents (month, spread, paid from an account or payable), parties, payables / receivables with
//  partial payments, checks (clear, return, void), due list, settings (VAT included, 2.5% reserve), void instead of delete.
// Run: node qa_template_finance.js
'use strict';
const fs=require('fs'),path=require('path');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const throws=(f,re,m)=>{try{f();ok(false,m+' (no error)')}catch(e){ok(re.test(e.message),m+' → '+e.message)}};
global.window={InvEngine:{CAL:{today:'1405/08/18'}}};eval(fs.readFileSync(path.join(__dirname,'newpanel/core/js/finance-write.js'),'utf8'));
const FW=window.FinanceWrite,ctx=()=>({actor:'qa',at:'2026-11-09T10:00:00.000Z'});
const fin={meta:{},settings:{vatPercent:10,performanceTaxPercent:5,expenseCategories:['آب','برق','اجاره','سایر'],incomeCategories:['سایر درآمد']},entries:[{id:'CUST-1',type:'expense',custodyKind:'expense',date:'1405/08/02',amountToman:500,accountId:'A1',status:'active'}],monthlyOverrides:[],changeLog:[]};
// settings
let c=FW.config(fin);ok(c.expenseCategories.includes('غذای پرسنل')&&c.vatPercent===10&&c.vatIncluded===true&&c.performanceReservePercent===5,'config: staff-meal category always offered; VAT included by default');
ok(FW.config({}).performanceReservePercent===2.5&&FW.config({}).obligationCategories.includes('وام'),'defaults: 2.5% reserve, loan category');
// expense paid from an account, spread over months
const e1=FW.addEntry(fin,ctx(),{type:'expense',date:'۱۴۰۵/۰۸/۰۵',category:'اجاره',amountToman:'۱۲۰٬۰۰۰٬۰۰۰',title:'اجارهٔ سالانه',expenseMonth:'1405/08',spreadMonths:12,paid:true,accountKey:'account:A1'},{accountName:'پاسارگاد'});
ok(/^FIN-\d{5}$/.test(e1.id)&&e1.date==='1405/08/05'&&e1.paymentStatus==='paid'&&e1.accountId==='A1'&&e1.spreadMonths===12,'expense recorded (Persian digits, account, spread)');
ok(FW.entryShare(e1,'1405/08')===10000000&&FW.entryShare(e1,'1406/07')===10000000&&FW.entryShare(e1,'1406/08')===0&&FW.entryShare(e1,'1405/07')===0,'spread: one twelfth in each of 12 months from the expense month');
throws(()=>FW.addEntry(fin,ctx(),{type:'expense',date:'1405/08/05',category:'آب',amountToman:1,paid:true}),/حساب/,'paid expense needs an account');
throws(()=>FW.addEntry(fin,ctx(),{type:'expense',date:'1405/08/20',category:'آب',amountToman:1,paid:true,accountKey:'x'}),/بعد از امروز/,'future date refused');
throws(()=>FW.addEntry(fin,ctx(),{type:'expense',date:'1405/08/05',category:'آب',amountToman:0,accountKey:'x'}),/مبلغ/,'zero amount refused');
// unpaid expense → payable with party
const e2=FW.addEntry(fin,ctx(),{type:'expense',date:'1405/08/06',category:'برق',amountToman:3000000,title:'قبض برق',paid:false,partyName:'اداره  برق',dueDate:'1405/08/25'});const o2=fin.obligations.find(o=>o.id===e2.linkedObligationId);
ok(e2.paymentStatus==='unpaid'&&o2&&o2.direction==='payable'&&o2.sourceExpenseId===e2.id&&o2.partyNameSnapshot==='اداره برق'&&fin.parties.length===1&&o2.dueDate==='1405/08/25','unpaid expense makes a payable with a new party (name normalised)');
const e3=FW.addEntry(fin,ctx(),{type:'expense',date:'1405/08/07',category:'غذای پرسنل',amountToman:800000,paid:false,partyName:'اداره برق'});ok(fin.parties.length===1&&fin.settings.expenseCategories.includes('غذای پرسنل'),'same party reused; category added to the list');
const inc=FW.addEntry(fin,ctx(),{type:'income',date:'1405/08/08',category:'سایر درآمد',amountToman:2000000,accountKey:'cash:C1'});ok(inc.type==='income'&&!inc.spreadMonths&&inc.accountKey==='cash:C1','income to a cash holder');
const me=FW.monthEntries(fin,'1405/08');ok(me.length===4&&!me.some(x=>x.custodyKind)&&me.find(x=>x.id===e1.id).share===10000000,'month documents exclude cash-custody rows of the cash report');
ok(FW.payState(fin,e2).label==='پرداخت‌نشده'&&FW.payState(fin,e2).balance===3000000&&FW.payState(fin,e1).balance===0,'payment state of an expense');
// settlements
throws(()=>FW.addSettlement(fin,ctx(),{obligationId:o2.id,date:'1405/08/10',amountToman:4000000,accountKey:'account:A1'}),/بیشتر/,'payment above the balance refused');
throws(()=>FW.addSettlement(fin,ctx(),{obligationId:o2.id,date:'1405/08/10',amountToman:1000000}),/حساب/,'payment needs an account');
const s1=FW.addSettlement(fin,ctx(),{obligationId:o2.id,date:'1405/08/10',amountToman:1000000,accountKey:'account:A1',reference:'۱۲۳'});
ok(s1.direction==='payment'&&FW.calcObligation(fin,o2).balance===2000000&&FW.payState(fin,e2).label==='پرداخت جزئی','partial payment');
throws(()=>FW.addSettlement(fin,ctx(),{obligationId:o2.id,date:'1405/08/11',amountToman:1000,accountKey:'account:A1',reference:'۱۲۳'}),/پیگیری/,'duplicate reference on the same account refused');
throws(()=>FW.voidEntry(fin,ctx(),{id:e2.id,reason:'x'}),/پرداخت یا چک/,'expense with a payment cannot be voided');
throws(()=>FW.voidObligation(fin,ctx(),{id:o2.id,reason:'x'}),/هزینه/,'payable made by an expense is voided through the expense');
FW.voidSettlement(fin,ctx(),{id:s1.id,reason:'اشتباه'});ok(s1.status==='void'&&FW.calcObligation(fin,o2).balance===3000000,'payment voided, balance back');
FW.voidEntry(fin,ctx(),{id:e2.id,reason:'تکراری'});ok(e2.status==='void'&&o2.status==='void'&&FW.monthEntries(fin,'1405/08').length===3,'void expense also voids its payable; kept as void');
// obligations and checks
const loan=FW.addObligation(fin,ctx(),{direction:'payable',title:'وام بانک',partyName:'بانک ملت',category:'وام',amountToman:50000000,date:'1405/08/01',dueDate:'1405/12/01'});
const rec=FW.addObligation(fin,ctx(),{direction:'receivable',title:'طلب از اسنپ',partyName:'اسنپ‌فود',category:'شخص یا شرکت',amountToman:9000000,date:'1405/08/02',dueDate:'1405/08/10'});
throws(()=>FW.addObligation(fin,ctx(),{direction:'payable',title:'x',partyName:'y',category:'سایر',amountToman:1,date:'1405/08/05',dueDate:'1405/08/01'}),/سررسید/,'due before date refused');
const k1=FW.addCheck(fin,ctx(),{obligationId:loan.id,number:'۷۷۷',bank:'ملت',amountToman:20000000,issueDate:'1405/08/05',dueDate:'1405/09/05'});
ok(k1.type==='issued'&&k1.status==='pending'&&FW.calcObligation(fin,loan).uncovered===30000000,'issued check covers part of the payable');
throws(()=>FW.addCheck(fin,ctx(),{obligationId:loan.id,number:'778',amountToman:40000000,issueDate:'1405/08/05',dueDate:'1405/09/05'}),/بدون پوشش/,'check above the uncovered part refused');
throws(()=>FW.addCheck(fin,ctx(),{obligationId:loan.id,number:'۷۷۷',bank:'ملت',amountToman:1,issueDate:'1405/08/05',dueDate:'1405/09/05'}),/همین شماره/,'duplicate check refused');
FW.clearCheck(fin,ctx(),{id:k1.id,date:'1405/08/18',accountKey:'account:A1'});const ks=fin.settlements.find(s=>s.id===k1.settlementId);
ok(k1.status==='cleared'&&ks&&ks.sourceCheckId===k1.id&&FW.calcObligation(fin,loan).settled===20000000,'clearing a check records the payment');
throws(()=>FW.voidSettlement(fin,ctx(),{id:ks.id,reason:'x'}),/برگشتی/,'payment of a check is undone only by returning the check');
FW.returnCheck(fin,ctx(),{id:k1.id,reason:'کسری موجودی'});ok(k1.status==='returned'&&ks.status==='void'&&FW.calcObligation(fin,loan).balance===50000000,'returned check: its payment voided, balance back');
const k2=FW.addCheck(fin,ctx(),{obligationId:rec.id,number:'55',amountToman:9000000,issueDate:'1405/08/02',dueDate:'1405/08/15'});ok(k2.type==='received','receivable takes a received check');
const due=FW.dueList(fin,'1405/08/18');ok(due[0].id===rec.id&&due[0].overdue&&due.some(x=>x.kind==='check'&&x.id===k2.id&&x.overdue)&&due.some(x=>x.id===loan.id&&!x.overdue),'due list ordered by due date with overdue marks');
FW.voidCheck(fin,ctx(),{id:k2.id,reason:'اشتباه'});ok(k2.status==='void','pending check voided');
FW.addSettlement(fin,ctx(),{obligationId:rec.id,date:'1405/08/18',amountToman:9000000,accountKey:'account:A1'});ok(FW.calcObligation(fin,rec).status==='settled'&&!FW.dueList(fin,'1405/08/18').some(x=>x.id===rec.id),'settled receivable leaves the due list');
throws(()=>FW.voidObligation(fin,ctx(),{id:rec.id,reason:'x'}),/پرداخت/,'obligation with payments cannot be voided');
// settings
FW.saveSettings(fin,ctx(),{expenseCategories:['آب','',' برق '],incomeCategories:['سایر درآمد'],obligationCategories:['وام'],vatPercent:10,performanceReservePercent:2.5,vatIncluded:true});
ok(fin.settings.performanceTaxPercent===2.5&&fin.settings.vatIncludedInSales===true&&fin.settings.expenseCategories.includes('اجاره')&&fin.settings.expenseCategories.includes('برق'),'settings saved; a category with documents is kept');
throws(()=>FW.saveSettings(fin,ctx(),{expenseCategories:fin.settings.expenseCategories,incomeCategories:['سایر درآمد'],obligationCategories:['وام'],vatPercent:10,performanceReservePercent:2.5,vatIncluded:true}),/تغییری/,'no-op settings refused');
throws(()=>FW.saveSettings(fin,ctx(),{expenseCategories:['a'],incomeCategories:['b'],obligationCategories:['c'],vatPercent:50,performanceReservePercent:2.5}),/ارزش افزوده/,'VAT range checked');
ok(fin.entries.length===5&&fin.obligations.length===4,'nothing removed (voided records stay)');
// pages
const lr=fs.readFileSync(path.join(__dirname,'newpanel/js/pages/ledger-real.js'),'utf8'),ix=fs.readFileSync(path.join(__dirname,'newpanel/index.html'),'utf8');
ok(/id:'ledger'/.test(lr)&&/id:'debts'/.test(lr)&&/id:'finset'/.test(lr)&&ix.includes('core/js/finance-write.js')&&ix.includes('js/pages/ledger-real.js'),'finance tabs wired');
console.log(`qa_template_finance: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
