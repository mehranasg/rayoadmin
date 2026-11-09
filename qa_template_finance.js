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
// staff meals (stage 7b)
{const f2={settings:{},entries:[]};const n=FW.saveMeals(f2,ctx(),{rows:{'1405/08/01':{portions:'۲۵',suggested:22},'1405/08/02':{portions:'20',notes:'+۲ مدیر'}},today:'1405/08/18'});
 ok(n===2&&f2.staffMeals.length===2&&f2.staffMeals[0].id==='SML-00001'&&f2.staffMeals[0].portions===25&&f2.staffMeals[0].suggested===22,'daily portions saved (Persian digits, suggestion kept)');
 FW.saveMeals(f2,ctx(),{rows:{'1405/08/01':{portions:'27'}},today:'1405/08/18'});ok(f2.staffMeals[0].portions===27&&f2.staffMeals[0].history.length===1&&f2.staffMeals[0].history[0].portions===25&&f2.staffMeals.length===2,'change keeps the previous value in history');
 throws(()=>FW.saveMeals(f2,ctx(),{rows:{'1405/08/01':{portions:'27'}},today:'1405/08/18'}),/تغییری/,'no-op refused');
 throws(()=>FW.saveMeals(f2,ctx(),{rows:{'1405/08/03':{portions:'2.5'}},today:'1405/08/18'}),/صحیح/,'portions must be whole numbers');
 throws(()=>FW.saveMeals(f2,ctx(),{rows:{'1405/08/25':{portions:'2'}},today:'1405/08/18'}),/آینده/,'future day refused');
 FW.saveMeals(f2,ctx(),{rows:{'1405/08/02':{portions:''}},today:'1405/08/18'});ok(f2.staffMeals[1].status==='void'&&FW.mealsOfMonth(f2,'1405/08').length===1,'emptied day voided, not removed');
 FW.addEntry(f2,ctx(),{type:'expense',date:'1405/08/05',category:'غذای پرسنل',amountToman:2700000,accountKey:'cash:C1'});const mc=FW.mealCost(f2,'1405/08',1350000);
 ok(mc.docs===2700000&&mc.stock===1350000&&mc.total===4050000&&mc.portions===27&&mc.perPortion===150000,'meal cost = staff-meal purchases + staff use from stock; cost per portion')}
// other costs outside the ledger
{const f3={settings:{pettyCash:{categories:[{id:'C1',name:'نظافت'}]}},entries:[{id:'CUST-9',type:'expense',custodyKind:'expense',date:'1405/08/03',amountToman:400000,status:'active'},{id:'CUST-8',type:'personalWithdrawal',custodyKind:'personalWithdrawal',date:'1405/08/03',amountToman:999,status:'active'}],
  pettyCash:{expenses:[{id:'PCE-1',date:'1405/08/04',amountToman:1000000,categoryId:'C1',lines:[{name:'گوجه',ingredientId:'ING-1',qty:2,unitPrice:300000},{name:'دستمال',qty:1,unitPrice:400000}],decision:{status:'approved'},status:'submitted'},{id:'PCE-2',date:'1405/08/04',amountToman:500000,categoryId:'C1',lines:[],decision:{status:'personal'},status:'submitted'}]}};
 ok(FW.custodyExpenses(f3,'1405/08')===400000,'restaurant expenses paid from money held by people count; personal withdrawals do not');
 const pe=FW.pettyExpenses(f3,'1405/08');ok(pe.length===1&&pe[0].category==='تنخواه: نظافت'&&pe[0].amount===400000,'petty cash: approved, without catalog items (those are material cost)')}
// profit and loss
{const r=FW.pnl({grossSales:1100000000,vatPercent:10,vatIncluded:true,reservePercent:2.5,otherIncome:5000000,material:{std:300000000,waste:10000000,variance:-20000000,coverage:0.9},staffMeal:{total:15000000},payroll:{net:250000000,state:'open'},expenses:[{category:'اجاره',amount:100000000},{category:'برق',amount:10000000},{category:'x',amount:0}]});
 ok(Math.round(r.vat)===100000000&&Math.round(r.sales)===1000000000,'VAT inside the sales amount is taken out');
 ok(r.materials===330000000&&r.materialParts.shortage===20000000,'material cost = standard cost of sales + waste + stock shortage');
 ok(r.expenses.length===2&&r.expenseTotal===110000000&&Math.round(r.reserve)===25000000,'other expenses by category (zero lines dropped); 2.5% reserve of net sales');
 ok(Math.round(r.profit)===1000000000+5000000-330000000-15000000-250000000-110000000-25000000&&Math.round(r.pct(r.materials))===33,'profit and percentages of net sales');
 ok(r.flags.some(f=>/قطعی نشده/.test(f))&&!r.flags.some(f=>/شمارش/.test(f)),'flags: payroll not final');
 const r2=FW.pnl({grossSales:110,vatPercent:10,vatIncluded:false,material:{std:null},payroll:null});ok(r2.vat===0&&r2.sales===110&&r2.flags.length===3,'VAT not included; missing material, count and payroll flagged')}
// latest ingredient prices (menu-write)
{global.window.InvEngine={CAL:{today:'1405/08/18'},D:s=>{const q=String(s).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);return q?`${q[1]}/${q[2].padStart(2,'0')}/${q[3].padStart(2,'0')}`:''}};
 eval(fs.readFileSync(path.join(__dirname,'newpanel/core/js/menu-write.js'),'utf8'));const MW=window.MenuWrite;
 const pr={ingredients:[{id:'ING-1',name:'گوجه',lastPurchasePriceToman:50000,lastPurchaseDate:'1405/08/01',purchaseUnit:'کیلوگرم',recipeUnit:'گرم',packageQuantity:1000},{id:'ING-2',name:'پنیر',lastPurchasePriceToman:0,lastPurchaseDate:'',purchaseUnit:'کیلوگرم',recipeUnit:'گرم',packageQuantity:1000}],ingredientPriceHistory:[{id:'IPH-0007',ingredientId:'ING-1',date:'1405/08/01',priceToman:50000}]};
 const out=MW.setLatestPrices(pr,ctx(),{date:'۱۴۰۵/۰۸/۱۵',rows:[{id:'ING-1',price:'۶۵٬۰۰۰'},{id:'ING-2',price:'400000'}]});
 ok(out.length===2&&pr.ingredients[0].lastPurchasePriceToman===65000&&pr.ingredients[0].lastPurchaseDate==='1405/08/15'&&pr.ingredients[0].lastPurchaseSource==='manual'&&pr.ingredientPriceHistory.length===3&&pr.ingredientPriceHistory[1].id==='IPH-0008'&&pr.ingredientPriceHistory[1].source==='manual-bulk','latest prices: current price and a dated history row');
 const old=MW.setLatestPrices(pr,ctx(),{date:'1405/07/20',rows:[{id:'ING-1',price:60000}]});ok(old[0].current===false&&pr.ingredients[0].lastPurchasePriceToman===65000&&pr.ingredientPriceHistory.length===4,'an older date only adds history');
 throws(()=>MW.setLatestPrices(pr,ctx(),{date:'1405/08/15',rows:[{id:'ING-1',price:65000}]}),/تازه/,'same price and date refused');
 throws(()=>MW.setLatestPrices(pr,ctx(),{date:'1405/08/15',rows:[{id:'ING-1',price:0}]}),/مثبت/,'price must be positive');
 throws(()=>MW.setLatestPrices(pr,ctx(),{date:'1405/09/01',rows:[{id:'ING-1',price:1}]}),/بعد از امروز/,'future date refused')}
// pages
const lr=fs.readFileSync(path.join(__dirname,'newpanel/js/pages/ledger-real.js'),'utf8'),ix=fs.readFileSync(path.join(__dirname,'newpanel/index.html'),'utf8');
ok(/id:'ledger'/.test(lr)&&/id:'debts'/.test(lr)&&/id:'finset'/.test(lr)&&ix.includes('core/js/finance-write.js')&&ix.includes('js/pages/ledger-real.js'),'finance tabs wired');
console.log(`qa_template_finance: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
