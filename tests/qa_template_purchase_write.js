// QA: newpanel/core/js/purchase-write.js — purchase invoices (detailed, quick), price sync, balance and void (synthetic data only).
// Run: node qa_template_purchase_write.js
'use strict';
const fs=require('fs'),path=require('path');
global.window={};
for(const f of ['inventory-engine.js','inventory-write.js','menu-write.js','purchase-write.js'])eval(fs.readFileSync(path.join(__dirname,'../app/core/js',f),'utf8'));
const E=window.InvEngine,W=window.InvWrite,PW=window.PurchaseWrite;
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const throws=(f,re,m)=>{try{f();ok(false,m+' (no error)')}catch(e){ok(re.test(e.message),m+' → '+e.message)}};
const T=E.CAL.today,day=k=>E.CAL.k(E.CAL.i(T)-k);
const sup={suppliers:[{id:'SUP-1',code:'S1',company:'لبنیات کاله',status:'فعال'},{id:'SUP-2',code:'S2',company:'نان',status:'فعال'}],supplierItems:[{id:'SI-1',supplierCode:'S1',ingredientId:'ING-1'}]};
const pr=()=>({ingredients:[{id:'ING-1',code:'1',name:'پنیر',status:'فعال',purchaseUnit:'کیلوگرم',recipeUnit:'کیلوگرم',packageQuantity:1,lastPurchasePriceToman:400000},{id:'ING-2',code:'2',name:'نان',status:'فعال',purchaseUnit:'بسته',recipeUnit:'عدد',packageQuantity:10,lastPurchasePriceToman:100000},{id:'ING-3',code:'3',name:'غیرفعال',status:'غیرفعال'}],menuItems:[],recipes:[],ingredientPriceHistory:[],changeLog:[]});
const inv=()=>({meta:{},settings:{mainLocationId:'L1',paymentLocations:[{id:'PAYLOC-1',name:'حساب سامان',isActive:true},{id:'PAYLOC-2',name:'قدیمی',isActive:false}]},stocktakes:[],inventoryMovements:[],stockReceipts:[],purchaseInvoices:[],supplierPayments:[],changeLog:[]});
const ctx=()=>({actor:'qa-admin',at:new Date().toISOString(),reqId:'R'+Math.random().toString(36).slice(2,8).toUpperCase(),module:'inventory'});

// 1. detailed invoice
let I=inv(),P=pr(),c=ctx();
const row=PW.addInvoice(I,c,{supplierId:'SUP-1',number:'۱۲۳',date:day(3),status:'finalized',lines:[{itemId:'ING-1',quantity:'۲',packageQuantity:1,unitPrice:'۴۵۰٬۰۰۰',updateCatalogPrice:true},{itemId:'ING-2',quantity:3,packageQuantity:10,unitPrice:100000,discountToman:5000,updateCatalogPrice:false}],discount:'10000',taxToman:0,extraCostToman:'20000'},{pricing:P,suppliers:sup});
ok(row.id===`PINV-${c.reqId}`&&I.purchaseInvoices[0]===row&&row.status==='finalized'&&row.hasLineDetails===true&&row.supplierNameSnapshot==='لبنیات کاله','invoice row and supplier snapshot');
ok(row.totalToman===2*450000+(3*100000-5000)-10000+20000&&PW.invoiceTotal(row)===row.totalToman,'total = lines − discount + tax + extra');
ok(row.lines[0].supplierItemId==='SI-1'&&row.lines[0].lineTotalToman===900000&&row.lines[0].recipeUnit==='کیلوگرم'&&row.lines[0].updateCatalogPrice===true&&row.lines[1].updateCatalogPrice===false,'line shape like js/42 readPurchaseLines with price decision');
ok(row.pricingSyncStatus==='pending'&&I.stockReceipts.length===0&&I.inventoryMovements.length===0,'invoice does not touch stock; price step pending');
throws(()=>PW.addInvoice(I,ctx(),{supplierId:'SUP-1',number:'123',date:day(2),lines:[{itemId:'ING-1',quantity:1,packageQuantity:1,unitPrice:1}]},{pricing:P,suppliers:sup}),/قبلاً/,'duplicate number for the same supplier refused (Persian/Latin digits)');
throws(()=>PW.addInvoice(inv(),ctx(),{supplierId:'SUP-1',number:'9',date:day(2),status:'finalized',lines:[{itemId:'ING-1',quantity:1,packageQuantity:1,unitPrice:0}]},{pricing:P,suppliers:sup}),/مثبت/,'finalized line needs price and package');
const draft=PW.addInvoice(inv(),ctx(),{supplierId:'',number:'D1',date:day(2),status:'draft',lines:[{itemId:'ING-1',quantity:1}]},{pricing:P,suppliers:sup});
ok(draft.status==='draft'&&draft.pricingSyncStatus==='not-required'&&draft.supplierNameSnapshot==='بدون تأمین‌کننده','draft without supplier and without price');
throws(()=>PW.addInvoice(inv(),ctx(),{number:'X',date:day(1),lines:[{itemId:'ING-3',quantity:1}]},{pricing:P,suppliers:sup}),/فهرست/,'inactive item refused');
throws(()=>PW.addInvoice(inv(),ctx(),{number:'',date:day(1),lines:[{itemId:'ING-1',quantity:1}]},{pricing:P,suppliers:sup}),/شماره/,'number required');

// 2. price sync
const ch=PW.syncInvoicePrices(P,I,row),i1=P.ingredients[0],i2=P.ingredients[1];
ok(ch.length===1&&i1.lastPurchasePriceToman===450000&&i1.lastPurchaseSource==='supplierInvoice'&&i1.lastPurchaseInvoiceId===row.id&&i1.lastPurchaseDate===row.date,'approved price applied to the catalog');
ok(i2.lastPurchasePriceToman===100000&&P.ingredientPriceHistory.length===1&&P.ingredientPriceHistory[0].id===`IPH-INV-${row.id}-ING-1`&&P.ingredientPriceHistory[0].unitCostToman===450000,'declined line left unchanged; one history row');
const MM=E.build({inventory:{stocktakes:[]},pricing:P});ok(MM.costAt('ING-1',T)===450000,'engine uses the new history price');
// a later invoice wins; voiding it restores the earlier one
const row2=PW.addInvoice(I,ctx(),{supplierId:'SUP-2',number:'77',date:day(1),status:'finalized',lines:[{itemId:'ING-1',quantity:1,packageQuantity:1,unitPrice:500000,updateCatalogPrice:true}]},{pricing:P,suppliers:sup});PW.syncInvoicePrices(P,I,row2);
ok(i1.lastPurchasePriceToman===500000,'later invoice is the latest price');
c=ctx();const vr=PW.voidInvoice(I,c,{id:row2.id,reason:'اشتباه'});PW.syncInvoicePrices(P,I,row2);
ok(row2.status==='void'&&vr.needsPricing&&c.auditExtra.before.status==='finalized'&&i1.lastPurchasePriceToman===450000&&i1.lastPurchaseInvoiceId===row.id,'void recomputes the latest valid price');
ok(P.ingredientPriceHistory.filter(h=>h.invoiceId===row2.id).every(h=>h.isVoided===true),'voided invoice price stays voided in the history');
throws(()=>PW.voidInvoice(I,ctx(),{id:row2.id,reason:'x'}),/قبلاً/,'second void refused');
throws(()=>PW.voidInvoice(I,ctx(),{id:row.id,reason:''}),/علت/,'void reason required');

// 2b. the only invoice voided → back to the latest valid history price; invoice package used for menu cost
{const I3=inv(),P3=pr();P3.ingredientPriceHistory.push({id:'IPH-M',ingredientId:'ING-1',date:day(20),priceToman:380000,packageQuantity:1,source:'manual',createdAt:'2026-01-01'});
 const r3=PW.addInvoice(I3,ctx(),{supplierId:'SUP-1',number:'P2',date:day(2),status:'finalized',lines:[{itemId:'ING-1',quantity:1,packageQuantity:2,unitPrice:900000,updateCatalogPrice:true}]},{pricing:P3,suppliers:sup});PW.syncInvoicePrices(P3,I3,r3);
 const j=P3.ingredients[0];ok(j.lastPurchasePriceToman===900000&&window.MenuWrite.unitCost(j,P3).v===450000&&window.MenuWrite.unitCost(j).v===900000,'menu cost uses the invoice package (2 kg for 900,000 → 450,000 per kg)');
 PW.voidInvoice(I3,ctx(),{id:r3.id,reason:'x'});PW.syncInvoicePrices(P3,I3,r3);
 ok(j.lastPurchasePriceToman===380000&&j.lastPurchaseSource==='manual'&&j.lastPurchaseInvoiceId===''&&window.MenuWrite.unitCost(j,P3).v===380000,'voiding the only invoice restores the previous valid price')}

{const I4=inv(),P4=pr();const r4=PW.addInvoice(I4,ctx(),{supplierId:'SUP-1',number:'P3',date:day(2),status:'finalized',lines:[{itemId:'ING-2',quantity:1,packageQuantity:10,unitPrice:120000,updateCatalogPrice:true}]},{pricing:P4,suppliers:sup});
 const before=PW.syncInvoicePrices(P4,I4,r4);P4.changeLog.unshift({action:'INVOICE_PRICES_APPLIED',invoiceId:r4.id,before});ok(P4.ingredients[1].lastPurchasePriceToman===120000,'catalog-only item takes the invoice price');
 PW.voidInvoice(I4,ctx(),{id:r4.id,reason:'x'});PW.syncInvoicePrices(P4,I4,r4);ok(P4.ingredients[1].lastPurchasePriceToman===100000&&!P4.ingredients[1].lastPurchaseInvoiceId,'void restores the catalog price saved before the invoice')}

// 3. quick invoice + payment, balance
c=ctx();const q=PW.addQuickInvoice(I,c,{supplierId:'SUP-2',number:'Q1',date:day(1),amount:'۳٬۰۰۰٬۰۰۰',settlement:'partial',payAmount:1000000,payDate:day(1),payMethod:'واریز بانکی',payLocationId:'PAYLOC-1',payRef:'TR-55'},{suppliers:sup});
ok(q.row.hasLineDetails===false&&q.row.lines.length===0&&q.row.totalToman===3000000&&q.row.pricingSyncStatus==='not-required','quick invoice: total only');
ok(q.payment&&q.payment.invoiceId===q.row.id&&q.payment.amount===1000000&&q.payment.source==='quickInvoiceForm'&&q.payment.paymentLocationNameSnapshot==='حساب سامان'&&q.payment.direction==='payment','quick payment row like js/42');
const acc=PW.supplierAccount(I,'SUP-2');ok(acc.purchases===3000000&&acc.paid===1000000&&acc.balance===2000000,'balance = final invoices − payments (void excluded)');
ok(PW.invoicePaid(I,q.row)===1000000,'paid per invoice');
{const I2={purchaseInvoices:[{id:'PI-1',supplierId:'S1',status:'final',date:'1405/08/02',totalToman:1000,paidAmount:0},{id:'PI-2',supplierId:'S1',status:'final',date:'1405/08/09',totalToman:500,paidAmount:100},{id:'PI-3',supplierId:'S2',status:'final',date:'1405/08/09',totalToman:200}],supplierPayments:[{id:'P1',supplierId:'S1',date:'1405/08/05',amount:800,direction:'payment',status:'posted'},{id:'P2',supplierId:'S1',date:'1405/08/06',amount:9,status:'void'}],supplierDirectDebts:[]};
 const s=PW.debtSeries(I2,{bucket:'week'});ok(s.days.map(d=>d.debt).join(',')==='1000,200,800'&&s.days[2].buy===700&&s.days[2].pay===100,'debt series: daily debt after purchases and payments (void ignored), all suppliers');
 ok(s.buckets.length===2&&s.buckets[0].open===0&&s.buckets[0].high===1000&&s.buckets[0].low===0&&s.buckets[0].close===200&&s.buckets[1].open===200&&s.buckets[1].close===800,'week candles: open, high, low, close');
 ok(PW.debtSeries(I2,{supplierId:'S2',bucket:'month'}).buckets[0].close===200,'one supplier, monthly')
 const pr={ingredients:[{id:'g1',name:'شیر',category:'لبنیات'},{id:'g2',name:'قهوه',category:'قهوه'}]};I2.purchaseInvoices.push({id:'PI-4',supplierId:'S3',supplierNameSnapshot:'لبنیات کاله',status:'final',date:'1405/08/10',taxToman:50,lines:[{ingredientId:'g1',lineTotalToman:300},{ingredientId:'g2',lineTotalToman:100}]});I2.purchaseInvoices[0].supplierNameSnapshot='الف';
 const t=PW.purchaseTree(I2,pr,{from:'1405/08/01',to:'1405/08/31'}),k=t.tree.find(x=>x.name==='لبنیات کاله');
 ok(t.source==='invoices'&&t.total===1000+500+200+450&&k.value===450&&k.children.map(c=>c.name+':'+c.value).join()==='لبنیات:300,قهوه:100,تخفیف، مالیات و هزینهٔ جانبی:50','purchase tree: supplier → item group, invoice tax as its own box, quick invoice one box');
 const t2=PW.purchaseTree({purchaseInvoices:[],stockReceipts:[{ingredientId:'g1',date:'1405/08/03',totalPriceToman:70,status:'posted'},{ingredientId:'g1',date:'1405/08/04',totalPriceToman:9,status:'void'}]},pr,{from:'1405/08/01',to:'1405/08/31'});
 ok(t2.source==='receipts'&&t2.tree[0].name==='لبنیات'&&t2.tree[0].children[0].name==='شیر'&&t2.total===70,'no invoices: tree from stock receipts (group → item), void ignored')}
throws(()=>PW.addQuickInvoice(I,ctx(),{supplierId:'SUP-2',date:day(1),amount:500000,settlement:'paid',payLocationId:'PAYLOC-1',payRef:'TR-55'},{suppliers:sup}),/مرجع/,'same reference and location refused');
throws(()=>PW.addQuickInvoice(I,ctx(),{supplierId:'SUP-2',date:day(1),amount:500000,settlement:'partial',payAmount:500000,payLocationId:'PAYLOC-1',payRef:'X'},{suppliers:sup}),/کمتر/,'partial must be below the total');
throws(()=>PW.addQuickInvoice(I,ctx(),{supplierId:'SUP-2',date:day(1),amount:500000,settlement:'paid',payLocationId:'PAYLOC-2',payRef:'X'},{suppliers:sup}),/محل پرداخت/,'inactive payment location refused');
throws(()=>PW.addQuickInvoice(I,ctx(),{supplierId:'',date:day(1),amount:500000},{suppliers:sup}),/تأمین‌کننده/,'quick invoice needs a supplier');
ok(PW.nearDuplicate(I,{supplierId:'SUP-2',date:day(1),amount:3000000})?.id===q.row.id,'near duplicate (same supplier, date, amount) detected');
const full=PW.addQuickInvoice(I,ctx(),{supplierId:'SUP-1',date:day(1),amount:200000,settlement:'paid',payLocationId:'PAYLOC-1',payRef:'TR-9'},{suppliers:sup});ok(full.payment.amount===200000,'full settlement pays the total');

// 3b. separate payments
{const I5=inv();const r5=PW.addQuickInvoice(I5,ctx(),{supplierId:'SUP-1',date:day(3),amount:1000000},{suppliers:sup}).row;
 c=ctx();const p1=PW.addPayment(I5,c,{supplierId:'SUP-1',invoiceId:r5.id,date:day(1),amount:'۴۰۰٬۰۰۰',method:'واریز بانکی',paymentLocationId:'PAYLOC-1',reference:'R-1'},{suppliers:sup});
 ok(p1.id===`PAY-${c.reqId}`&&p1.directionEffect==='payment'&&p1.directionLabelSnapshot==='پرداخت بدهی'&&p1.paymentLocationNameSnapshot==='حساب سامان'&&p1.status==='posted','payment row like js/14 savePayment');
 ok(PW.invoiceRemaining(I5,r5)===600000&&PW.supplierAccount(I5,'SUP-1').balance===600000,'payment reduces invoice remaining and balance');
 PW.addPayment(I5,ctx(),{supplierId:'SUP-1',date:day(1),amount:100000,paymentLocationId:'PAYLOC-1',reference:'R-2'},{suppliers:sup});ok(PW.supplierAccount(I5,'SUP-1').balance===500000,'on-account payment without invoice');
 PW.addPayment(I5,ctx(),{supplierId:'SUP-1',date:day(1),amount:50000,paymentLocationId:'PAYLOC-1',reference:'R-3',direction:'receipt'},{suppliers:sup});ok(PW.supplierAccount(I5,'SUP-1').balance===550000,'refund «وصول طلب» increases the balance again');
 throws(()=>PW.addPayment(I5,ctx(),{supplierId:'SUP-1',invoiceId:r5.id,date:day(1),amount:1,paymentLocationId:'PAYLOC-1',reference:'R-4',direction:'receipt'},{suppliers:sup}),/بدون فاکتور/,'refund tied to an invoice refused');
 throws(()=>PW.addPayment(I5,ctx(),{supplierId:'SUP-2',invoiceId:r5.id,date:day(1),amount:1,paymentLocationId:'PAYLOC-1',reference:'R-5'},{suppliers:sup}),/همین تأمین‌کننده/,'invoice of another supplier refused');
 throws(()=>PW.addPayment(I5,ctx(),{supplierId:'SUP-1',date:day(1),amount:1,paymentLocationId:'PAYLOC-1',reference:'R-1'},{suppliers:sup}),/مرجع/,'duplicate reference at the same location refused');
 throws(()=>PW.addPayment(I5,ctx(),{supplierId:'SUP-1',date:day(1),amount:1,paymentLocationId:'PAYLOC-1',reference:''},{suppliers:sup}),/پیگیری/,'reference required');
 throws(()=>PW.addPayment(I5,ctx(),{supplierId:'SUP-1',date:day(1),amount:1,paymentLocationId:'PAYLOC-2',reference:'R-9'},{suppliers:sup}),/محل پرداخت/,'inactive location refused');
 c=ctx();PW.voidPayment(I5,c,{id:p1.id,reason:'اشتباه'});ok(p1.status==='void'&&c.auditExtra.before.status==='posted'&&PW.invoiceRemaining(I5,r5)===1000000&&PW.supplierAccount(I5,'SUP-1').balance===950000,'void returns the amount to the invoice and balance');
 throws(()=>PW.voidPayment(I5,ctx(),{id:p1.id,reason:'x'}),/قبلاً/,'second void refused');
 ok(PW.addPayment(I5,ctx(),{supplierId:'SUP-1',date:day(1),amount:1,paymentLocationId:'PAYLOC-1',reference:'R-1'},{suppliers:sup}).reference==='R-1','a voided reference can be reused')}

// 3c. opening balance and direct debts (js/42 supplierAccount)
{const I6=inv();I6.periodClosures=[{status:'closed',from:day(40),to:day(31)}];
 const a0=PW.addQuickInvoice(I6,ctx(),{supplierId:'SUP-1',number:'OLD',date:day(10),amount:700000},{suppliers:sup}).row;
 c=ctx();const op=PW.addDirectDebt(I6,c,{supplierId:'SUP-1',debtType:'opening',date:day(5),amount:'۲٬۰۰۰٬۰۰۰',description:'ماندهٔ دفتر',coverageConfirmed:true},{suppliers:sup});
 ok(op.id===`SDEBT-${c.reqId}`&&op.declaredBalanceToman===2000000&&op.calculatedBalanceToman===700000&&op.appliedDifferenceToman===1300000&&op.amount===0&&op.openingBalanceMode==='replaceThroughBaseline'&&op.baselineDate===day(5),'opening keeps declared, calculated and difference');
 ok(PW.supplierAccount(I6,'SUP-1').balance===2000000,'documents up to the baseline are replaced by the opening');
 PW.addQuickInvoice(I6,ctx(),{supplierId:'SUP-1',number:'NEW',date:day(2),amount:300000},{suppliers:sup});PW.addPayment(I6,ctx(),{supplierId:'SUP-1',date:day(1),amount:500000,paymentLocationId:'PAYLOC-1',reference:'OB-1'},{suppliers:sup});
 const sv=PW.addDirectDebt(I6,ctx(),{supplierId:'SUP-1',debtType:'service',date:day(1),amount:150000,description:'تعمیر'},{suppliers:sup});
 ok(PW.supplierAccount(I6,'SUP-1').balance===2000000+300000+150000-500000&&sv.amount===150000&&sv.declaredBalanceToman===0,'after the baseline: invoices + direct debts − payments');
 throws(()=>PW.addDirectDebt(I6,ctx(),{supplierId:'SUP-1',debtType:'opening',date:day(5),amount:0,description:'x',coverageConfirmed:true},{suppliers:sup}),/هم‌تاریخ یا جدیدتر/,'same-date opening refused');
 throws(()=>PW.addDirectDebt(I6,ctx(),{supplierId:'SUP-1',debtType:'opening',date:day(3),amount:0,description:'x'},{suppliers:sup}),/صریحاً/,'coverage confirmation required');
 throws(()=>PW.addDirectDebt(I6,ctx(),{supplierId:'SUP-1',debtType:'service',date:day(1),amount:0,description:'x'},{suppliers:sup}),/مثبت/,'direct debt must be positive');
 throws(()=>PW.addDirectDebt(I6,ctx(),{supplierId:'SUP-1',debtType:'service',date:day(1),amount:10,description:''},{suppliers:sup}),/شرح/,'description required');
 const neg=PW.addDirectDebt(inv(),ctx(),{supplierId:'SUP-2',debtType:'opening',date:day(35),amount:'-250000',description:'طلب ما',coverageConfirmed:true},{suppliers:sup});ok(neg.declaredBalanceToman===-250000&&neg.closedPeriodWarning!==true,'negative opening = Rayo is owed');
 const cl=PW.addDirectDebt(I6,ctx(),{supplierId:'SUP-2',debtType:'other',date:day(35),amount:1000,description:'در دورهٔ بسته'},{suppliers:sup});ok(cl.closedPeriodWarning===true,'closed-period document is flagged');
 c=ctx();PW.voidDirectDebt(I6,c,{id:op.id,reason:'اصلاح'});ok(op.status==='void'&&c.auditExtra.before.status==='active'&&PW.supplierAccount(I6,'SUP-1').balance===700000+300000+150000-500000,'voiding the opening counts all documents again');
 ok(PW.addDirectDebt(I6,ctx(),{supplierId:'SUP-1',debtType:'opening',date:day(5),amount:1800000,description:'اصلاح‌شده',coverageConfirmed:true},{suppliers:sup}).calculatedBalanceToman===700000,'a new opening on the same date after void')}

// 3d. edit invoice / payment, purchase orders
{const I7=inv(),P7=pr();const r7=PW.addInvoice(I7,ctx(),{supplierId:'SUP-1',number:'E1',date:day(4),status:'draft',lines:[{itemId:'ING-1',quantity:1}]},{pricing:P7,suppliers:sup});
 c=ctx();const e1=PW.editInvoice(I7,c,{id:r7.id,supplierId:'SUP-1',number:'E1',date:day(4),status:'finalized',lines:[{itemId:'ING-1',quantity:2,packageQuantity:1,unitPrice:420000,updateCatalogPrice:true}]},{pricing:P7,suppliers:sup});
 ok(e1.id===r7.id&&e1.status==='finalized'&&e1.totalToman===840000&&e1.pricingSyncStatus==='pending'&&c.auditExtra.before.status==='draft'&&I7.purchaseInvoices.length===1,'draft edited to final in place, prices pending');
 throws(()=>PW.editInvoice(I7,ctx(),{id:r7.id,supplierId:'SUP-1',number:'E1',date:day(4),status:'draft',lines:[{itemId:'ING-1',quantity:1,packageQuantity:1,unitPrice:0}]},{pricing:P7,suppliers:sup}),/مثبت/,'a final invoice stays final (needs prices)');
 I7.stockReceipts=[{id:'RC1',invoiceId:r7.id,ingredientId:'ING-1',quantity:2,status:'posted'}];
 throws(()=>PW.editInvoice(I7,ctx(),{id:r7.id,supplierId:'SUP-2',number:'E1',date:day(4),lines:[{itemId:'ING-1',quantity:2,packageQuantity:1,unitPrice:1}]},{pricing:P7,suppliers:sup}),/رسید/,'linked receipt: supplier cannot change');
 throws(()=>PW.editInvoice(I7,ctx(),{id:r7.id,supplierId:'SUP-1',number:'E1',date:day(4),lines:[{itemId:'ING-1',quantity:1,packageQuantity:1,unitPrice:1}]},{pricing:P7,suppliers:sup}),/کمتر/,'linked receipt: quantity cannot drop below received');
 const q7=PW.addQuickInvoice(I7,ctx(),{supplierId:'SUP-2',date:day(3),amount:1000},{suppliers:sup}).row;PW.editInvoice(I7,ctx(),{id:q7.id,supplierId:'SUP-2',number:'Q9',date:day(3),amount:'۲٬۰۰۰',lines:[]},{pricing:P7,suppliers:sup});ok(q7.totalToman===2000&&q7.hasLineDetails===false&&q7.invoiceNumber==='Q9','quick invoice edit keeps it quick');
 const p7=PW.addPayment(I7,ctx(),{supplierId:'SUP-2',invoiceId:q7.id,date:day(2),amount:500,paymentLocationId:'PAYLOC-1',reference:'P-1'},{suppliers:sup});c=ctx();
 PW.editPayment(I7,c,{id:p7.id,supplierId:'SUP-2',invoiceId:q7.id,date:day(2),amount:800,paymentLocationId:'PAYLOC-1',reference:'P-1'},{suppliers:sup});
 ok(p7.amount===800&&p7.id&&I7.supplierPayments.length===1&&c.auditExtra.before.amount===500&&p7.updatedBy==='qa-admin','payment edited in place (own reference allowed)');
 PW.addPayment(I7,ctx(),{supplierId:'SUP-2',date:day(2),amount:1,paymentLocationId:'PAYLOC-1',reference:'P-2'},{suppliers:sup});throws(()=>PW.editPayment(I7,ctx(),{id:p7.id,supplierId:'SUP-2',date:day(2),amount:1,paymentLocationId:'PAYLOC-1',reference:'P-2'},{suppliers:sup}),/مرجع/,'edited payment cannot take another payment\'s reference');
 const S7=JSON.parse(JSON.stringify(sup));S7.purchaseRequests=[];const o=PW.addOrder(S7,ctx(),{supplierId:'SUP-1',date:day(1),eta:T,lines:[{itemId:'ING-1',quantity:'۳',packageQuantity:1,unitPrice:400000}]},{pricing:P7});
 ok(o.supplierCode==='S1'&&o.status==='ثبت‌شده'&&o.lines[0].purchaseQuantity===3&&S7.purchaseRequests[0]===o,'purchase order like js/42');
 throws(()=>PW.addOrder(S7,ctx(),{supplierId:'SUP-1',date:T,eta:day(1),lines:[{itemId:'ING-1',quantity:1}]},{pricing:P7}),/قبل از/,'delivery before order refused');
 throws(()=>PW.trackOrder(S7,ctx(),{id:o.id,status:'تحویل‌شده'}),/تحویل واقعی/,'delivered needs the actual date');
 PW.trackOrder(S7,ctx(),{id:o.id,status:'تحویل‌شده',actual:T});ok(o.status==='تحویل‌شده'&&o.actualDeliveryDate===T,'order tracking');throws(()=>PW.trackOrder(S7,ctx(),{id:o.id,status:'لغوشده'}),/علت لغو/,'cancel needs a note')}

// 4. two-module save order (inventory then pricing) through the protected save
(async()=>{const srv={inventory:JSON.stringify(inv()),pricing:JSON.stringify(pr())},saves=[];
 const io=m=>({module:m,validate:m==='pricing'?window.MenuWrite.validPricing:d=>Array.isArray(d.stocktakes)&&Array.isArray(d.inventoryMovements),load:async()=>JSON.parse(srv[m]),save:async d=>{saves.push(m);srv[m]=JSON.stringify(d)},actor:()=>'qa-admin',pricing:()=>JSON.parse(srv.pricing)});
 const {out:r,doc:I2}=await W.edit(io('inventory'),{action:'PURCHASE_INVOICE_ADDED',mutate:(d,cx)=>PW.addInvoice(d,cx,{supplierId:'SUP-1',number:'500',date:day(1),status:'finalized',lines:[{itemId:'ING-1',quantity:1,packageQuantity:1,unitPrice:470000,updateCatalogPrice:true}]},{pricing:JSON.parse(srv.pricing),suppliers:sup})});
 await W.edit(io('pricing'),{action:'INVOICE_PRICES_APPLIED',mutate:(d)=>PW.syncInvoicePrices(d,I2,r)});
 await W.edit(io('inventory'),{action:'INVOICE_PRICING_SYNCED',mutate:(d,cx)=>PW.markPricing(d,cx,{id:r.id,ok:true})});
 const si=JSON.parse(srv.inventory),sp=JSON.parse(srv.pricing);
 ok(saves.join(',')==='inventory,pricing,inventory'&&si.purchaseInvoices[0].pricingSyncStatus==='synced'&&sp.ingredients[0].lastPurchasePriceToman===470000,'invoice, then pricing, then the invoice is marked synced');
 ok(si.changeLog.map(x=>x.action).join(',')==='PURCHASE_INVOICE_ADDED,INVOICE_PRICING_SYNCED'&&sp.changeLog[0].action==='INVOICE_PRICES_APPLIED','one audit row per save in each module');
 console.log(`qa_template_purchase_write: ${pass} passed, ${fail} failed`);process.exit(fail?1:0)})();
