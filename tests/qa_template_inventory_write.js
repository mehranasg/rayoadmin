// QA: newpanel/core/js/inventory-write.js — record shapes, rules and the protected save protocol (synthetic data only).
// Run: node qa_template_inventory_write.js
'use strict';
const fs=require('fs'),path=require('path');
global.window={};
const sessionStore={};global.sessionStorage={getItem:k=>sessionStore[k]??null,setItem:(k,v)=>{sessionStore[k]=String(v)}};
eval(fs.readFileSync(path.join(__dirname,'../app/core/js/inventory-engine.js'),'utf8'));
eval(fs.readFileSync(path.join(__dirname,'../app/core/js/inventory-write.js'),'utf8'));
eval(fs.readFileSync(path.join(__dirname,'../app/core/js/menu-write.js'),'utf8'));
const E=window.InvEngine,W=window.InvWrite;
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const throws=(f,re,m)=>{try{f();ok(false,m+' (no error)')}catch(e){ok(re.test(e.message),m+' → '+e.message)}};
const near=(a,b)=>Math.abs(a-b)<1e-6;

const pricing={ingredients:[
 {id:'i1',code:'101',name:'سیب زمینی',status:'فعال',itemType:'MENU_INGREDIENT',recipeUnit:'کیلوگرم',purchaseUnit:'کارتن',packageQuantity:10,lastPurchasePriceToman:400000},
 {id:'i2',code:'102',name:'روغن سرخ کردنی',status:'فعال',itemType:'MENU_INGREDIENT',recipeUnit:'کیلوگرم',purchaseUnit:'کیلوگرم',packageQuantity:1,lastPurchasePriceToman:90000},
 {id:'i3',code:'103',name:'قلم غیرفعال',status:'غیرفعال',recipeUnit:'عدد'}],
 menuItems:[{id:'m1',code:'201',name:'سیب زمینی سرخ کرده',status:'فعال'},{id:'m2',code:'202',name:'بدون رسپی',status:'فعال'}],
 recipes:[{menuItemId:'m1',ingredientId:'i1',quantity:0.2,recipeUnit:'کیلوگرم',wastePercent:0}],recipeVersions:[],ingredientPriceHistory:[]};
const T=E.CAL.today,day=k=>E.CAL.k(E.CAL.i(T)-k);
const D0=day(10),D1=day(9),D3=day(7),D5=day(5);
function baseDoc(){return{meta:{initialized:true},settings:{mainLocationId:'L1'},locations:[{id:'L1',name:'انبار اصلی'}],
 stocktakes:[{id:'ST-A',date:D0,inventoryScope:'RAYO',baselineBoundary:'END',status:'approved',lines:[{ingredientId:'i1',actual:10},{ingredientId:'i2',actual:50}]}],
 inventoryMovements:[],stockReceipts:[],wasteRecords:[],consumptionRecords:[],salesPeriods:[{id:'SP1',from:D1,to:D1,status:'posted',lines:[{menuItemId:'m1',quantity:5}]}],
 periodClosures:[{id:'PC1',from:day(60),to:day(30),status:'closed'}],changeLog:[]}}
const ctx=()=>({actor:'qa-admin',at:new Date().toISOString(),reqId:'REQ'+Math.random().toString(36).slice(2,7).toUpperCase(),pricing});

// 1. receipt in the purchase unit
let doc=baseDoc(),c=ctx();
const rr=W.addReceipts(doc,c,{date:D3,lines:[{itemId:'i1',quantity:'۲',unit:'کارتن',note:'بار صبح'}]});
const rec=doc.stockReceipts[0],mv=doc.inventoryMovements[0];
ok(rr.count===1&&rec.id===`REC-DIRECT-${c.reqId}-1`,'receipt id format');
ok(rec.quantity===20&&rec.entryQuantity===2&&rec.entryUnit==='کارتن'&&rec.entryUnitFactor===10,'receipt converts purchase unit to stock unit');
ok(rec.sourceType==='DIRECT_ENTRY'&&rec.status==='posted'&&rec.locationId==='L1'&&rec.unitSnapshot==='کیلوگرم'&&rec.createdBy==='qa-admin','receipt fields');
ok(mv.movementType==='PURCHASE_RECEIPT'&&mv.sourceKey===`receipt:${rec.id}`&&mv.quantity===20&&mv.toLocationId==='L1','receipt movement');
throws(()=>W.addReceipts(baseDoc(),ctx(),{date:day(40),lines:[{itemId:'i1',quantity:1}]}),/بسته/,'closed period blocked');
throws(()=>W.addReceipts(baseDoc(),ctx(),{date:E.CAL.k(E.CAL.i(T)+1),lines:[{itemId:'i1',quantity:1}]}),/آینده/,'future date blocked');
throws(()=>W.addReceipts(baseDoc(),ctx(),{date:D3,lines:[{itemId:'i3',quantity:1}]}),/کالای انبار/,'inactive item blocked');
throws(()=>W.addReceipts(baseDoc(),ctx(),{date:D3,lines:[{itemId:'i1',quantity:0}]}),/مثبت/,'zero quantity blocked');
ok(W.receiptWarnings(baseDoc(),pricing,D3,W.receiptLines(pricing,[{itemId:'i1',quantity:150}])).length===1,'kg ≥ 100 warns (grams typed as kg)');

// 2. waste and authorized consumption
const w1=W.addEvent(doc,ctx(),{date:D3,eventType:'WASTE',type:'ingredient',itemId:'i1',quantity:1,shift:'صبح',reason:'سوختگی',section:'آشپزخانه',responsiblePersonnelId:'P1',responsibleName:'علی'});
ok(w1.id==='WST-000001'&&w1.recordKind==='waste'&&w1.known===true&&w1.status==='posted'&&w1.reviewStatus==='تأییدشده','waste record');
ok(w1.section==='آشپزخانه'&&w1.responsiblePersonnelId==='P1'&&w1.responsibleNameSnapshot==='علی','waste keeps section and responsible person');
throws(()=>W.addEvent(baseDoc(),ctx(),{date:D3,eventType:'WASTE',type:'ingredient',itemId:'i1',quantity:1,reason:'x'}),/بخش/,'waste needs a section');
const wm=doc.inventoryMovements.find(m=>m.id===w1.movementId);
ok(wm&&wm.sourceKey==='waste:WST-000001'&&wm.referenceType==='wasteRecord'&&wm.quantity===1&&wm.fromLocationId==='L1','waste movement linked');
const a1=W.addEvent(doc,ctx(),{date:D3,eventType:'STAFF_CONSUMPTION',type:'ingredient',itemId:'i1',quantity:0.5,reason:'غذای پرسنل'});
ok(a1.id==='CON-000001'&&a1.recordKind==='consumption'&&doc.consumptionRecords.length===1,'authorized consumption goes to consumptionRecords');
const w2=W.addEvent(doc,ctx(),{date:D3,eventType:'WASTE',type:'menu',itemId:'m1',quantity:2,reason:'برگشتی',section:'سالن'});
const w2m=doc.inventoryMovements.filter(m=>m.referenceId===w2.id);
ok(w2m.length===1&&w2m[0].sourceKey===`waste:${w2.id}:i1`&&near(w2m[0].quantity,0.4),'menu waste expands by recipe');
throws(()=>W.addEvent(baseDoc(),ctx(),{date:D3,eventType:'WASTE',type:'menu',itemId:'m2',quantity:1,reason:'x'}),/رسپی/,'menu without recipe blocked');
throws(()=>W.addEvent(baseDoc(),ctx(),{date:D3,eventType:'WASTE',type:'ingredient',itemId:'i1',quantity:1}),/علت/,'reason required');
throws(()=>W.addEvent(baseDoc(),ctx(),{date:D3,eventType:'FRYER_OIL_CHANGE',type:'ingredient',itemId:'i2',quantity:1,reason:'x'}),/نوع رویداد/,'oil change only via its own form');

// 3. fryer oil change
const o1=W.addOilChange(doc,ctx(),{date:D3,fryerId:'F1',kind:'FULL'});
ok(o1.id==='OIL-000002'&&o1.eventType==='FRYER_OIL_CHANGE'&&o1.itemId==='i2'&&near(o1.quantity,18.2)&&o1.liters===20&&o1.date===D3,'full oil change: 20 L × 0.91');
ok(doc.inventoryMovements.some(m=>m.id===o1.movementId&&m.sourceKey===`consumption:${o1.id}`&&m.movementType==='FRYER_OIL_CHANGE'),'oil movement');
throws(()=>W.addOilChange(baseDoc(),ctx(),{date:D3,fryerId:'T1',kind:'TOP_UP',liters:9}),/گنجایش/,'over capacity blocked');

// 4. whole count: expected = 10 + 20 − 1 (sales) − 1 − 0.4 (waste) − 0.5 (staff) = 27.1
const c1=W.addCount(doc,ctx(),{date:D5,entries:[{itemId:'i1',quantity:'25'}],note:'شمارش هفتگی'});
const st=doc.stocktakes.find(s=>s.id===c1.id),l1=st.lines[0];
ok(c1.created&&st.inventoryScope==='RAYO'&&st.baselineBoundary==='END'&&st.status==='approved'&&st.source==='ui-template','count stocktake fields');
{const d2=JSON.parse(JSON.stringify(doc)),c3=W.addCount(d2,{...ctx(),staff:{personnelId:'EMP-9',name:'پریسا'}},{date:D5,entries:[{itemId:'i1',quantity:'24'}]}),s3=d2.stocktakes.find(s=>s.id===c3.id),l3=s3.lines.find(l=>l.ingredientId==='i1');ok(!c3.created&&l3.actual===24&&l3.countedByPersonnelId==='EMP-9'&&l3.countedByName==='پریسا'&&s3.status==='approved','staff count merges into the count of the date and names the counter on the line')}
ok(near(l1.expected,27.1)&&near(l1.variance,-2.1)&&l1.baseDate===D0&&near(l1.purchaseQty,20)&&near(l1.salesConsumption,1)&&near(l1.wasteQty,1.4)&&near(l1.otherOutQty,0.5),'count expected/variance from the engine');
ok(near(l1.varianceValueToman,-2.1*40000),'variance value at item cost');
const c2=W.addCount(doc,ctx(),{date:D5,entries:[{itemId:'i1',quantity:2.6,unit:'کارتن'}]});
ok(!c2.created&&c2.replaced===1&&st.lines.length===1&&near(st.lines[0].actual,26)&&st.revisionHistory.length===1&&st.revisionHistory[0].replaced[0].actual===25,'same-date count merges and keeps the replaced line');
throws(()=>W.addCount(doc,ctx(),{date:D3,entries:[{itemId:'i1',quantity:1}]}),/تأیید لازم/,'count before a later whole count needs confirmation');
throws(()=>W.addCount(doc,ctx(),{date:D5,entries:[{itemId:'i1',quantity:-1}]}),/نامنفی/,'negative count blocked');
// stocktake review, close and reopen (انبارگردانی)
{const sd=JSON.parse(JSON.stringify(doc)),lines=W.countLinesOf(sd,D5),mt=W.countMetrics(lines);
 ok(lines.length===1&&mt.items===1&&mt.withVariance===1&&mt.varianceValue===Math.round(lines[0].varianceValueToman)&&mt.shortageValue<0&&mt.countedValue===Math.round(lines[0].actual*lines[0].unitCost),'count lines and value metrics of one stocktake');
 throws(()=>W.reviewCountLine(sd,ctx(),{date:D5,itemId:'i1',status:'explained',note:''}),/توضیح/,'a review other than «accepted» needs a note');
 throws(()=>W.reviewCountLine(sd,ctx(),{date:D5,itemId:'i9',status:'accepted'}),/در شمارش/,'review only a counted item');
 const r1=W.reviewCountLine(sd,ctx(),{date:D5,itemId:'i1',status:'followup',note:'بررسی فاکتور'});ok(/^CRV-/.test(r1.id)&&W.reviewOf(sd,D5,'i1').status==='followup','review saved');
 throws(()=>W.closeCount(sd,ctx(),{date:D5}),/پیگیری/,'cannot close while a variance needs follow-up');
 W.reviewCountLine(sd,ctx(),{date:D5,itemId:'i1',status:'explained',note:'فاکتور ثبت نشده بود'});ok(W.reviewOf(sd,D5,'i1').history.length===1&&W.reviewOf(sd,D5,'i1').history[0].status==='followup','a review change keeps the previous state');
 throws(()=>W.closeCount(sd,ctx(),{date:D3}),/شمارش کل/,'close needs a whole count on that date');
 const cl=W.closeCount(sd,ctx(),{date:D5,note:'پایان دوره'});
 ok(cl.status==='closed'&&cl.kind==='stocktake'&&cl.to===D5&&cl.stocktakeLines.length===1&&cl.stocktakeLines[0].review==='explained'&&cl.stocktakeMetrics.reviewed===1&&!cl.lines&&!cl.metrics&&cl.from===E.CAL.k(E.CAL.i(day(30))+1),'closure continues after the previous one, with a frozen snapshot (own field names, not the cost-control snapshot of the current panel)');
 throws(()=>W.closeCount(sd,ctx(),{date:D5}),/قبلاً بسته/,'closed twice refused');
 throws(()=>W.addReceipts(sd,ctx(),{date:D3,lines:[{itemId:'i1',quantity:1}]}),/بسته/,'entries on or before a closed stocktake are refused');
 throws(()=>W.reviewCountLine(sd,ctx(),{date:D5,itemId:'i1',status:'accepted'}),/بسته/,'review locked after close');
 throws(()=>W.removeCountLine(sd,ctx(),{date:D5,itemId:'i1',reason:'x'}),/بسته/,'count line locked after close');
 throws(()=>W.reopenCount(sd,ctx(),{id:cl.id,reason:''}),/علت/,'reopen needs a reason');
 const ro=W.reopenCount(sd,ctx(),{id:cl.id,reason:'فاکتور جاافتاده'});ok(ro.status==='reopened'&&ro.reopenReason&&!W.closedPeriod(sd,D5)&&sd.periodClosures.length===2,'reopen keeps the closure row');
 const cl2=W.closeCount(sd,ctx(),{date:D5});ok(cl2.id!==cl.id&&cl2.from===cl.from,'closed again as a new row');}

{const d3=JSON.parse(JSON.stringify(doc)),s3=d3.stocktakes.find(s=>s.id===c1.id);
 throws(()=>W.removeCountLine(d3,ctx(),{date:D5,itemId:'i1',reason:''}),/علت/,'removing a counted item needs a reason');
 throws(()=>W.removeCountLine(d3,ctx(),{date:D3,itemId:'i1',reason:'x'}),/نیست/,'item not in that count');
 const r=W.removeCountLine(d3,ctx(),{date:D5,itemId:'i1',reason:'اشتباه'});ok(r.voided&&s3.status==='void'&&s3.lines.length===0&&s3.revisionHistory.at(-1).kind==='line-removed'&&near(s3.revisionHistory.at(-1).removed[0].actual,26),'counted item removed with its line in the revision; empty count becomes void')}
{const d4={stocktakes:[{id:'A',date:'1405/08/01',status:'approved',lines:[{ingredientId:'z',actual:0},{ingredientId:'k',actual:2}]},{id:'B',date:'1405/08/02',status:'approved',lines:[{ingredientId:'z',actual:0}]}]};
 const r=W.removeZeroCountLines(d4,ctx(),{ids:['z']});ok(r.lines===2&&r.voided===1&&d4.stocktakes[0].lines.length===1&&d4.stocktakes[1].status==='void'&&d4.stocktakes[0].revisionHistory[0].kind==='item-deleted','zero count lines of a deleted item removed with a revision; empty count voided');
 throws(()=>W.removeZeroCountLines(d4,ctx(),{ids:['k']}),/مقدار دارد/,'a line with a quantity is never removed')}
{const d5={stocktakes:[{id:'O',date:'1405/06/01',baselineBoundary:'START',isOpeningBaseline:true,status:'approved',lines:[{ingredientId:'a',actual:11},{ingredientId:'b',actual:12}]}]};throws(()=>W.removeZeroCountLines(d5,ctx(),{ids:['b']}),/مقدار دارد/,'opening line with a quantity needs the opening flag');const r=W.removeZeroCountLines(d5,ctx(),{ids:['b'],opening:true,reason:'قلم تکراری'});ok(r.lines===1&&d5.stocktakes[0].lines.length===1&&d5.stocktakes[0].revisionHistory[0].reason==='قلم تکراری'&&d5.stocktakes[0].status==='approved','opening line removed with its reason; the opening count stays')}

// 5. engine sees the new records
const M=E.build({inventory:doc,pricing}),p=E.positions(M,T).find(r=>r.id==='i1');
ok(near(p.qty,26)&&p.basePt.date===D5,'engine position starts from the new count');

// 6. void, never delete
const before=doc.stockReceipts.length;
const vc=ctx();W.voidReceipt(doc,vc,{id:rec.id,reason:'ورود تکراری'});
ok(doc.stockReceipts.length===before&&rec.status==='void'&&rec.voidReason==='ورود تکراری'&&rec.statusBeforeVoid==='posted','receipt voided, record kept');
ok(doc.inventoryMovements.find(m=>m.sourceKey===`receipt:${rec.id}`).status==='void','receipt movement voided');
ok(vc.auditExtra&&vc.auditExtra.before.status==='posted'&&vc.auditExtra.entityId===rec.id,'void keeps the record before the change for the audit row');
throws(()=>W.voidReceipt(doc,ctx(),{id:rec.id,reason:'x'}),/قبلاً/,'second void refused');
throws(()=>W.voidReceipt(doc,ctx(),{id:'nope',reason:''}),/علت/,'void reason required');
W.voidEvent(doc,ctx(),{id:w2.id,reason:'اشتباه'});
ok(w2.status==='void'&&w2.reviewStatus==='ردشده'&&doc.inventoryMovements.filter(m=>m.referenceId===w2.id).every(m=>m.status==='void'),'menu waste and its movements voided');
const linked={...baseDoc()};linked.stockReceipts=[{id:'R-INV',date:D3,ingredientId:'i1',quantity:1,status:'posted',invoiceId:'INV-1'}];
throws(()=>W.voidReceipt(linked,ctx(),{id:'R-INV',reason:'x'}),/فاکتور/,'invoice receipt void refused');

// 6b. inventory settings and the reorder rule
{const d=baseDoc(),c=ctx();const r=W.saveControlLevels(d,c,{levels:{i1:'PRECISE',i2:'LIGHT'},gap:'۳۰'});
 ok(r.changes===1&&d.settings.itemControlLevels.i1==='PRECISE'&&d.settings.lightMaxGapDays===30&&c.auditExtra.changes[0].before==='LIGHT','control levels saved (only real changes)');
 throws(()=>W.saveControlLevels(d,ctx(),{levels:{i1:'PRECISE'},gap:30}),/تغییری/,'no change refused');
 throws(()=>W.saveControlLevels(d,ctx(),{levels:{},gap:5}),/۷ تا ۷۳۰/,'gap outside 7…730 refused');
 const f=W.saveFryerSettings(d,ctx(),{ingredientId:'i2',density:'0.9',logFrom:D1,fryers:[{name:'بزرگ',liters:'20'},{name:'رومیزی',liters:4.5}],tableItems:['i1','nope']});
 ok(f.fryers.length===2&&f.fryers[0].id==='FR-1'&&f.density===0.9&&f.logFrom===D1&&d.settings.tableItems.join()==='i1','fryer settings like js/32');
 throws(()=>W.saveFryerSettings(d,ctx(),{ingredientId:'i2',density:2,fryers:[{name:'x',liters:1}]}),/چگالی/,'density out of range refused');
 const pr2=JSON.parse(JSON.stringify(pricing)),n=W.saveReorderPoints(pr2,ctx(),{rows:{i1:{reorderPoint:'۵',targetStock:'12'},i2:{reorderPoint:'',targetStock:''}}});
 ok(n===1&&pr2.ingredients[0].reorderPoint===5&&pr2.ingredients[0].targetStock===12,'reorder point saved on the item');
 const inv2=baseDoc();inv2.trackedIngredients=[{ingredientId:'i1',reorderPoint:100}];const Mx=E.build({inventory:inv2,pricing:pr2}),p1=E.positions(Mx,T).find(x=>x.id==='i1');
 ok(p1.reorderPoint===5&&p1.target===12,'the item reorder point wins over the legacy tracked value (js/40)')}

// 6b. order-independent variance: a receipt or an earlier count inside a later count's period re-derives that count
{const d0=JSON.parse(JSON.stringify(doc)),cx=ctx();
 ok(W.affectedFrom(d0,doc)==='','no change → nothing affected');
 const d1=JSON.parse(JSON.stringify(doc));W.addReceipts(d1,ctx(),{date:D3,lines:[{itemId:'i1',quantity:4}]});ok(W.affectedFrom(doc,d1)===D3,'affected from the receipt date');
 const r=W.recalcCounts(d1,cx,{from:D3}),s1=d1.stocktakes.find(s=>s.id===c1.id),l=s1.lines[0];
 const Mx=E.build({inventory:{...d1,stocktakes:d1.stocktakes.filter(x=>x.id!==c1.id)},pricing}),px=E.positions(Mx,D5).find(x=>x.id==='i1').qty,old=doc.stocktakes.find(s=>s.id===c1.id).lines[0].expected;
 ok(r.lines===1&&r.counts[0]===c1.id&&near(l.expected,px)&&near(l.variance,26-px)&&s1.varianceRecalcHistory.length===1&&near(s1.varianceRecalcHistory[0].lines[0].expected,old)&&s1.varianceRecalculatedAt===cx.at,'later count recalculated; previous figures kept');
 ok(W.recalcCounts(d1,ctx(),{from:D3}).lines===0,'second recalc changes nothing');
 const d2=JSON.parse(JSON.stringify(doc));d2.stocktakes.find(s=>s.id===c1.id).lines[0].varianceReview={status:'reviewed'};
 const e=W.addCount(d2,ctx(),{date:D3,entries:[{itemId:'i1',quantity:30}],allowEarlier:true});const r2=W.recalcCounts(d2,ctx(),{from:D3}),l2=d2.stocktakes.find(s=>s.id===c1.id).lines[0];
 ok(e.created&&r2.counts.includes(c1.id)&&l2.baseDate===D3&&!l2.varianceReview,'earlier count becomes the base of the later one; its review reopens');
 const d3=JSON.parse(JSON.stringify(doc));d3.stocktakes.push({id:'ST-OLD',date:day(40),inventoryScope:'RAYO',baselineBoundary:'END',status:'approved',lines:[{ingredientId:'i1',actual:1,expected:9,variance:-8}]});
 W.recalcCounts(d3,ctx(),{});ok(d3.stocktakes.find(s=>s.id==='ST-OLD').lines[0].expected===9,'closed period keeps its figures');
 const op=JSON.parse(JSON.stringify(doc)).stocktakes.find(s=>s.id==='ST-A');ok(!W.recalcCounts({...JSON.parse(JSON.stringify(doc)),stocktakes:[op]},ctx(),{}).lines,'baseline-only data: nothing to recalc')}

// 6d. edit = void (kind edit) + replacing record; void a count date
{const ed=JSON.parse(JSON.stringify(doc));const rid=W.addReceipts(ed,ctx(),{date:D3,lines:[{itemId:'i1',quantity:5}]}).ids[0];
 const nu=W.editReceipt(ed,ctx(),{id:rid,date:D3,quantity:'۲',unit:'کارتن',reason:'اشتباه'}),old=ed.stockReceipts.find(x=>x.id===rid);
 ok(old.status==='void'&&old.voidKind==='edit'&&old.replacedById===nu.id&&nu.replacesId===rid&&near(nu.quantity,20)&&ed.inventoryMovements.filter(m=>m.referenceId===rid).every(m=>m.status==='void')&&ed.inventoryMovements.some(m=>m.referenceId===nu.id&&m.status==='posted'),'receipt edit');
 const ev=W.addEvent(ed,ctx(),{date:D3,eventType:'WASTE',type:'ingredient',itemId:'i1',quantity:1,reason:'سوختگی',section:'بار',responsiblePersonnelId:'P2',responsibleName:'رضا'});const ne=W.editEvent(ed,ctx(),{id:ev.id,quantity:'0.5',eventType:'EXPIRY'});
 ok(ev.status==='void'&&ev.voidKind==='edit'&&ne.replacesId===ev.id&&near(ne.quantity,0.5)&&ne.eventType==='EXPIRY'&&ne.reason==='سوختگی'&&ne.section==='بار'&&ne.responsiblePersonnelId==='P2'&&ne.responsibleNameSnapshot==='رضا','waste edit keeps item, reason, section and person');
 const cd=JSON.parse(JSON.stringify(doc)),cv=W.voidCountDate(cd,ctx(),{date:D5,reason:'شمارش اشتباه'});ok(cv.count===1&&cd.stocktakes.filter(s=>s.date===D5).every(s=>s.status==='void'),'count of a date voided');
 throws(()=>W.voidCountDate(cd,ctx(),{date:D1,reason:'x'}),/پایان روز/,'no count on that date refused')}

// 6e. prepared items: conversion, count with direct + prepared share, re-count replaces
{const MW=window.MenuWrite,pp={...pricing,ingredients:[...pricing.ingredients.map(i=>i.id==='i1'?{...i,wastePercent:20}:i)],preparedItems:[]},pc=()=>({...ctx(),pricing:pp});
 const it=MW.savePreparedItem(pp,pc(),{name:'پتی',countUnit:'عدد',baseOutputQuantity:'۱۰',components:[{ingredientId:'i1',quantity:500,unit:'گرم',basis:'net'},{ingredientId:'i2',quantity:0.1,unit:'کیلوگرم',basis:'gross'}]});
 ok(it.id==='PREP-0001'&&it.version===1&&it.components[0].id==='PREPC-0001','prepared item saved');
 const cv=MW.preparedItemConversion(pp,it,20,'عدد');ok(cv.complete&&near(cv.contributions[0].quantity,1/0.8*1.0)&&near(cv.contributions[1].quantity,0.2),'conversion: scale, g to kg, net to gross');
 MW.savePreparedItem(pp,pc(),{id:it.id,name:'پتی',countUnit:'عدد',baseOutputQuantity:10,components:[{ingredientId:'i1',quantity:600,unit:'گرم',basis:'net'},{ingredientId:'i2',quantity:0.1,unit:'کیلوگرم',basis:'gross'}]});ok(it.version===2,'formula change raises the version');
 throws(()=>MW.savePreparedItem(pp,pc(),{name:'x',countUnit:'عدد',baseOutputQuantity:1,components:[{ingredientId:'i2',quantity:1,unit:'عدد',basis:'net'}]}),/تبدیل/,'unit that cannot convert refused');
 const pd=JSON.parse(JSON.stringify(doc)),dd=E.CAL.k(E.CAL.i(T)-1);
 W.addCount(pd,pc(),{date:dd,entries:[{itemId:'i1',quantity:3}],prepared:[{preparedItemId:it.id,quantity:10}]});let st=pd.stocktakes.find(s=>s.date===dd),l=st.lines.find(x=>x.ingredientId==='i1');
 ok(st.preparedLines.length===1&&near(l.actual,3+0.625)&&l.directActual===3&&near(l.preparedActual,0.625)&&l.directlyCounted&&st.lines.some(x=>x.ingredientId==='i2'&&near(x.actual,0.1)&&x.directlyCounted===false),'count = direct + prepared share (yesterday: the 500 g formula in effect then, BL-015)');
 W.addCount(pd,pc(),{date:dd,prepared:[{preparedItemId:it.id,quantity:20}]});st=pd.stocktakes.find(s=>s.date===dd);l=st.lines.find(x=>x.ingredientId==='i1');
 ok(st.preparedLines.length===1&&st.preparedLines[0].quantity===20&&near(l.actual,3+1.25)&&st.revisionHistory.at(-1).preparedRemoved.length===1,'re-count of the prepared item replaces it; direct kept');
 W.addCount(pd,pc(),{date:dd,prepared:[{preparedItemId:it.id,quantity:0}]});st=pd.stocktakes.find(s=>s.date===dd);ok(near(st.lines.find(x=>x.ingredientId==='i1').actual,3)&&!st.lines.some(x=>x.ingredientId==='i2'),'zero prepared: ingredient back to its direct count; prepared-only line taken out (js/32)');
 throws(()=>W.addCount(pd,pc(),{date:dd,prepared:[{preparedItemId:it.id,quantity:1.5}]}),/صحیح/,'whole number for «عدد»');
 const wd=JSON.parse(JSON.stringify(doc)),wr=W.addEvent(wd,pc(),{date:D3,eventType:'WASTE',type:'prepared',itemId:it.id,quantity:5,reason:'سس مانده',section:'آشپزخانه'});const grp=wd.wasteRecords.filter(r=>r.preparedGroupId===wr.preparedGroupId);
 ok(wr.count===2&&grp.length===2&&grp.every(r=>r.type==='ingredient'&&r.preparedItemId===it.id&&r.status==='posted')&&Math.abs(grp.find(r=>r.itemId==='i1').quantity-5/10*0.5/0.8)<0.001&&grp.every(r=>r.preparedItemVersion===1),'prepared-item waste: one ingredient record per formula ingredient (past date: version 1)');
 {const td=JSON.parse(JSON.stringify(doc)),w2=W.addEvent(td,pc(),{date:T,eventType:'WASTE',type:'prepared',itemId:it.id,quantity:5,reason:'سس مانده',section:'آشپزخانه'}),g2=td.wasteRecords.filter(r=>r.preparedGroupId===w2.preparedGroupId);ok(near(g2.find(r=>r.itemId==='i1').quantity,5/10*0.6/0.8)&&g2.every(r=>r.preparedItemVersion===2),'prepared-item waste today: the 600 g formula (version 2)');
  const tc=JSON.parse(JSON.stringify(doc));W.addCount(tc,pc(),{date:T,prepared:[{preparedItemId:it.id,quantity:10}]});ok(near(tc.stocktakes.find(s=>s.date===T).lines.find(x=>x.ingredientId==='i1').actual,0.75),'count today: version 2 (0.75 kg)')}
 // delete: with history → archive; in an active recipe → refused; no reference → deleted, id never given again
 const comp=[{ingredientId:'i2',quantity:1,unit:'کیلوگرم',basis:'gross'}];
 ok(MW.preparedDeletePlan(pp,pd,it.id).action==='archive','prepared item counted: archive plan');const da=JSON.parse(JSON.stringify(pp));ok(MW.deletePreparedItem(da,ctx(),{id:it.id,inv:pd}).action==='archive'&&da.preparedItems.find(p=>p.id===it.id).isArchived&&da.preparedItems.find(p=>p.id===it.id).status==='غیرفعال','archived, not removed');
 const dk=JSON.parse(JSON.stringify(pp));dk.menuItems=[{id:'M1',name:'برگر',status:'فعال'}];dk.recipes=[{id:'REC-1',menuItemId:'M1',preparedItemId:it.id,quantity:1}];throws(()=>MW.deletePreparedItem(dk,ctx(),{id:it.id,inv:{}}),/آیتم فعال/,'used in an active recipe: refused');
 const dx=JSON.parse(JSON.stringify(pp)),n2=MW.savePreparedItem(dx,pc(),{name:'سس',countUnit:'عدد',baseOutputQuantity:1,components:comp}),c2=ctx(),r2=MW.deletePreparedItem(dx,c2,{id:n2.id,inv:pd});
 ok(r2.action==='delete'&&!dx.preparedItems.some(p=>p.id===n2.id)&&c2.auditExtra.deleted.id===n2.id&&dx.settings.retiredPreparedIds.includes(n2.id),'no reference: deleted, copy in audit');
 ok(MW.savePreparedItem(dx,pc(),{name:'سس ۲',countUnit:'عدد',baseOutputQuantity:1,components:comp}).id!==n2.id,'deleted id not given again')}

// 6c. zero for uncounted items; rollback; beverage items
{const pz={...pricing,ingredients:[...pricing.ingredients,{id:'i4',code:'104',name:'قلم شمرده‌نشده',status:'فعال',itemType:'MENU_INGREDIENT',recipeUnit:'عدد'},{id:'i5',code:'105',name:'کنارگذاشته',status:'فعال',itemType:'MENU_INGREDIENT',recipeUnit:'عدد'}]};
 const zd=JSON.parse(JSON.stringify(doc));zd.settings.itemControlLevels={i2:'PRECISE',i5:'PARKED'};const zc=()=>({...ctx(),pricing:pz});
 throws(()=>W.zeroFillPlan(zd,pz,{date:D3,boundary:'END'}),/آخرین مبنا/,'zero-fill only on the latest baseline');
 const plan=W.zeroFillPlan(zd,pz,{date:D5,boundary:'END'});ok(plan.target&&plan.items.map(i=>i.id).sort().join()==='i2,i4','plan: never-counted and missing precise items, not parked');
 const zx=zc();const z=W.zeroFill(zd,zx,{date:D5,boundary:'END'}),zt=zd.stocktakes.find(s=>s.id===z.targetId);
 ok(z.count===2&&!z.createdId&&zt.lines.filter(l=>l.assumedZero&&l.actual===0&&l.expected===null).length===2,'zero lines added to the same-date count');
 zd.changeLog.push({id:'ICT-Z',action:'INVENTORY_ZERO_FILLED',at:zx.at,...zx.auditExtra});ok(W.recalcCounts(zd,zc(),{}).lines===0||zt.lines.filter(l=>l.assumedZero).every(l=>l.expected===null),'recalc keeps assumed zeros without expected');
 const rb=W.zeroFillRollbackPlan(zd);ok(rb.lines.length===2,'rollback plan lists the added lines');
 const rr=W.zeroFillRollback(zd,zc());ok(rr.count===2&&!zt.lines.some(l=>l.assumedZero)&&zd.changeLog.find(e=>e.id==='ICT-Z').revertedAt,'rollback removes only the zero lines');
 throws(()=>W.zeroFillRollbackPlan(zd),/قابل بازگردانی/,'nothing left to roll back');
 const zn=JSON.parse(JSON.stringify(doc)),nx=zc(),zn2=W.zeroFill(zn,nx,{date:T,boundary:'END'});zn.changeLog.push({id:'ICT-N',action:'INVENTORY_ZERO_FILLED',at:nx.at,...nx.auditExtra});
 ok(zn2.createdId&&zn.stocktakes.some(s=>s.id===zn2.createdId&&s.status==='approved'),'zero-fill creates a baseline when the date has none');
 W.zeroFillRollback(zn,zc());ok(zn.stocktakes.find(s=>s.id===zn2.createdId).status==='void','rollback voids a created baseline (not deleted)');
 const bd=JSON.parse(JSON.stringify(doc));bd.settings.beverageControl={itemIds:['i2','i1'],note:'x'};const bx=ctx();W.saveBeverageItems(bd,bx,{itemIds:['i1','i2','i9','i1']});
 ok(bd.settings.beverageControl.itemIds.join()==='i2,i1'&&bd.settings.beverageControl.note==='x','beverage items: saved order kept, unknown ids dropped');
 W.saveBeverageItems(bd,ctx(),{itemIds:['i1']});ok(bd.settings.beverageControl.itemIds.join()==='i1','beverage items: unchecked removed')}

// 6b. day checks («روزهای ماه»): one row per date, a change keeps history, unknown keys dropped, future refused
{const d={dayChecks:undefined},T=day(1);
 const r=W.saveDayCheck(d,ctx(),{date:T,none:['waste','x','inv','waste'],note:'n'});ok(d.dayChecks.length===1&&r.none.join()==='inv,waste'&&r.closed===false&&r.history.length===0,'day check saved with known keys only');
 throws(()=>W.saveDayCheck(d,ctx(),{date:T,none:['inv','waste'],note:'n'}),/تغییری/,'same state refused');
 W.saveDayCheck(d,ctx(),{date:T,closed:true,none:[]});ok(d.dayChecks.length===1&&d.dayChecks[0].closed===true&&d.dayChecks[0].history.length===1&&d.dayChecks[0].history[0].none.join()==='inv,waste','change keeps the previous state in history');
 throws(()=>W.saveDayCheck(d,ctx(),{date:'1499/01/01',closed:true}),/آینده|معتبر/,'future day refused')}

// 6c. cycle counting (ABC) and reorder suggestions
{const cls=W.abcClasses([{id:'a',value:700},{id:'b',value:150},{id:'c',value:100},{id:'d',value:50},{id:'z',value:0}],{aShare:80,bShare:95});
 ok(cls.get('a')==='A'&&cls.get('b')==='A'&&cls.get('c')==='B'&&cls.get('d')==='C'&&cls.get('z')==='C','ABC: first 80٪ of value A (the item crossing 80٪ included), up to 95٪ B, rest and unused C');
 const st=W.cycleSettings({});ok(st.a===2&&st.b===7&&st.c===30&&st.lead===2,'cycle defaults');
 const doc={stocktakes:[{status:'approved',date:day(3),lines:[{ingredientId:'a',actual:1},{ingredientId:'c',actual:0,assumedZero:true}]},{status:'void',date:day(0),lines:[{ingredientId:'b'}]},{status:'submitted',date:day(10),lines:[{ingredientId:'b'}]}]};
 const last=W.lastCountDates(doc);ok(last.get('a')===day(3)&&!last.has('c')&&last.get('b')===day(10),'last count: approved or submitted, not void, not assumed zero');
 const due=W.cycleDue(['a','b','c'],new Map([['a','A'],['b','B'],['c','C']]),last,st,day(0));ok(due.find(x=>x.id==='a').due===true&&due.find(x=>x.id==='b').due===true&&due.find(x=>x.id==='c').due===true&&due.find(x=>x.id==='c').last==='','due: A after 2 days, B after 7, never counted always due');
 ok(W.cycleDue(['a'],new Map([['a','B']]),last,st,day(0))[0].due===false,'B counted 3 days ago is not due');
 const d={settings:{}};W.saveCycleSettings(d,ctx(),{a:1,b:7,c:30,aShare:70,bShare:90,lead:3,safety:1,cycle:7});ok(d.settings.cycleCount.a===1&&d.settings.cycleCount.aShare===70,'cycle settings saved');
 throws(()=>W.saveCycleSettings({settings:{}},ctx(),{a:9,b:7,c:30,aShare:80,bShare:95,lead:2,safety:2,cycle:7}),/A ≤ B/,'intervals must grow');
 const sg=W.suggestReorder(1.5,st);ok(sg.reorderPoint===6&&sg.targetStock===16.5&&W.suggestReorder(0,st)===null,'reorder = daily × (lead+safety), target = + daily × cycle')}

// 7. protected save protocol
(async()=>{
 const server={text:JSON.stringify(baseDoc()),saves:0};
 const io={load:async()=>JSON.parse(server.text),save:async d=>{server.saves++;server.text=JSON.stringify(d)},actor:()=>'qa-admin',pricing:()=>pricing};
 const r=await W.edit(io,{action:'RECEIPT_ADDED',details:{lines:1},mutate:(d,cx)=>W.addReceipts(d,cx,{date:D3,lines:[{itemId:'i1',quantity:3}]})});
 const saved=JSON.parse(server.text);
 ok(server.saves===1&&saved.stockReceipts.length===1&&r.doc.meta.serverSaveToken===saved.meta.serverSaveToken,'edit saves once and verifies by reload');
 ok(saved.changeLog.some(x=>x.action==='RECEIPT_ADDED'&&x.actor==='qa-admin'&&x.via==='ui-template'),'audit row in changeLog');
 {/* the live server drops trailing zeros of the milliseconds (.210Z → .21Z, .000Z → Z): still verified (BL-045 bug) */
  const srv={text:server.text},trim=t=>t.replace(/(\.\d*?)0+Z"/g,(m,f)=>(f==='.'?'':f)+'Z"'),io3={...io,load:async()=>JSON.parse(srv.text),save:async d=>{srv.text=trim(JSON.stringify(d))}},iso=Date.prototype.toISOString;
  Date.prototype.toISOString=function(){return iso.call(this).replace(/\.\d{3}Z$/,'.210Z')};let r3;try{r3=await W.edit(io3,{action:'RECEIPT_ADDED',mutate:(d,cx)=>W.addReceipts(d,cx,{date:D3,lines:[{itemId:'i1',quantity:1}]})})}finally{Date.prototype.toISOString=iso}ok(!!r3.doc&&/\.21Z"/.test(srv.text),'save verified although the server shortened the milliseconds')}
 {const srv={text:server.text,saves:0},io2={...io,load:async()=>JSON.parse(srv.text),save:async d=>{srv.saves++;srv.text=JSON.stringify(d)}},sv=JSON.parse(srv.text);sv.stocktakes.push({id:'ST-L',date:D5,inventoryScope:'RAYO',baselineBoundary:'END',status:'approved',lines:[{ingredientId:'i1',actual:20,expected:0,variance:20}]});srv.text=JSON.stringify(sv);
  const r3=await W.edit(io2,{action:'RECEIPT_ADDED',mutate:(d,cx)=>W.addReceipts(d,cx,{date:D3,lines:[{itemId:'i1',quantity:1}]})}),s3=JSON.parse(srv.text),lg=s3.changeLog.at(-1);
  ok(r3.out.recalculated===1&&s3.stocktakes.find(s=>s.id==='ST-L').lines[0].expected!==0&&lg.recalculatedLaterLines===1&&lg.recalculatedCounts[0]==='ST-L','edit recalculates the later count and records it in the audit row');
  const n0=srv.saves;await W.edit({...io2,recalcAll:true},{action:'COUNT_VARIANCE_RECALCULATED_ALL',mutate:()=>({})});ok(srv.saves===n0+1,'recalc-all saves once')}
 const rid=saved.stockReceipts[0].id;await W.edit(io,{action:'RECEIPT_VOIDED',details:{entityId:rid},mutate:(d,cx)=>W.voidReceipt(d,cx,{id:rid,reason:'آزمون'})});
 const vlog=JSON.parse(server.text).changeLog.filter(x=>x.action==='RECEIPT_VOIDED');
 ok(server.saves===2&&vlog.length===1&&vlog[0].before.status==='posted'&&vlog[0].reason==='آزمون','void through edit: one audit row with the record before the change');
 // mutate error: nothing is sent
 try{await W.edit(io,{action:'X',mutate:()=>{throw Error('بد')}});ok(false,'mutate error should throw')}catch(e){ok(server.saves===2,'failed validation sends nothing')}
 // invalid load: nothing is sent
 const bad={...io,load:async()=>({})};try{await W.edit(bad,{action:'X',mutate:()=>1});ok(false,'invalid load should throw')}catch(e){ok(/Load کامل/.test(e.message)&&server.saves===2,'incomplete Load refuses to save')}
 // no session
 try{await W.edit({...io,actor:()=>''},{action:'X',mutate:()=>1});ok(false,'no session should throw')}catch(e){ok(/نشست مدیریت/.test(e.message),'manager session required')}
 // server keeps a different document → unconfirmed → blocked until reload
 const lossy={...io,save:async d=>{server.saves++;const x=JSON.parse(JSON.stringify(d));x.stockReceipts.pop();server.text=JSON.stringify(x)}};
 try{await W.edit(lossy,{action:'RECEIPT_ADDED',mutate:(d,cx)=>W.addReceipts(d,cx,{date:D3,lines:[{itemId:'i1',quantity:4}]})});ok(false,'lossy save should throw')}catch(e){ok(/تأیید نشد/.test(e.message)&&W.state.uncertain,'unconfirmed save is reported and marks the state uncertain')}
 try{await W.edit(io,{action:'X',mutate:()=>1});ok(false,'uncertain should block')}catch(e){ok(/نامشخص/.test(e.message),'further saves blocked after an uncertain result')}
 ok(W.canonical({b:1,a:[1,undefined],c:undefined})==='{"a":[1,null],"b":1}','canonical follows JSON rules');
 // other units of an item (countingUnits): entry units for receipt / waste / count and purchase units for invoice rows
 {const tob={id:'t1',recipeUnit:'گرم',purchaseUnit:'بسته',packageQuantity:250,countingUnits:[{id:'CU-0001',name:'پاکتی',factor:50,active:true},{id:'CU-0002',name:'باکس پاکتی',factor:500,active:true},{id:'CU-0003',name:'قدیمی',factor:9,active:false},{id:'CU-0004',name:'بسته',factor:7,active:true}]};
  const us=W.unitsOf(tob);ok(us.map(u=>u.name+':'+u.factor).join(',')==='گرم:1,بسته:250,پاکتی:50,باکس پاکتی:500,کیلوگرم:1000','entry units: base, purchase unit, active other units (inactive and duplicate names skipped), then the automatic کیلوگرم');
  const pu=W.purchaseUnitsOf(tob);ok(pu[0].name==='بسته'&&pu[0].factor===250&&pu.some(u=>u.name==='گرم'&&u.factor===1)&&pu.some(u=>u.name==='پاکتی'&&u.factor===50),'purchase units: default purchase unit first with its package size');
  const coal={id:'c1',recipeUnit:'کیلوگرم',purchaseUnit:'کیلوگرم',packageQuantity:1,countingUnits:[{name:'عدد',factor:0.014}]};ok(W.unitsOf(coal).map(u=>u.name).join()==='کیلوگرم,عدد,گرم'&&W.purchaseUnitsOf(coal).length===3,'a smaller unit (عدد of a kg item) is offered too');
  ok(W.unitsOf({recipeUnit:'عدد',purchaseUnit:'کارتن',packageQuantity:12}).length===2&&W.purchaseUnitsOf(null).length===0,'items without other units keep the old behaviour');}
 // units: nobody converts by hand — گرم of a کیلوگرم item, use unit (recipe / waste), count unit, smallest unit for the open remainder
 {const fil={id:'f1',name:'فیله',recipeUnit:'کیلوگرم',purchaseUnit:'کیلوگرم',packageQuantity:1};
  ok(W.unitsOf(fil).map(u=>u.name+':'+u.factor).join()==='کیلوگرم:1,گرم:0.001'&&W.useUnitOf(fil).name==='گرم'&&W.countUnitOf(fil).name==='کیلوگرم','a kg item offers grams automatically; recipe / waste start in grams, counts in kg');
  const pea={id:'p1',name:'بادام زمینی',recipeUnit:'کیلوگرم',purchaseUnit:'بسته',packageQuantity:0.35,countUnit:'بسته',useUnit:'گرم',countingUnits:[{id:'CU-1',name:'بسته ۱۰۰ گرمی',factor:0.1}]};
  ok(W.unitsOf(pea).map(u=>u.name).join()==='کیلوگرم,بسته,بسته ۱۰۰ گرمی,گرم'&&W.countUnitOf(pea).name==='بسته'&&W.smallestUnit(pea).name==='گرم','a package of 350 g (packageQuantity 0.35) is a unit; count starts in packs; the remainder goes in grams');
  ok(Math.abs(W.toBase(pea,150,'گرم').value-0.15)<1e-12&&W.toBase(pea,1,'نامعلوم')===null,'toBase converts and refuses an unknown unit');
  ok(W.unitsOf({recipeUnit:'لیتر',purchaseUnit:'لیتر',packageQuantity:1}).some(u=>u.name==='میلی‌لیتر'&&u.factor===0.001)&&W.unitsOf({recipeUnit:'عدد',purchaseUnit:'بسته',packageQuantity:24}).map(u=>u.name).join()==='عدد,بسته','litre ↔ millilitre; a can sold by piece and bought by 24-pack');
  const d=baseDoc(),cx=c=>({...ctx(),pricing:{ingredients:[{...pea,status:'فعال'}]},...c});
  const r=W.addCount(d,cx(),{date:day(1),entries:[{itemId:'p1',quantity:'5',unit:'بسته',rest:'100'}]}),l=d.stocktakes.at(-1).lines[0];
  ok(Math.abs(l.actual-1.85)<1e-9&&l.entryQuantity===5&&l.entryUnit==='بسته'&&l.entryRestQuantity===100&&l.entryRestUnit==='گرم','count «۵ بسته + ۱۰۰ گرم» = 1.85 kg, both parts kept on the line');
  throws(()=>W.addCount(baseDoc(),cx(),{date:day(1),entries:[{itemId:'p1',quantity:'1',unit:'بسته',rest:'-5'}]}),/باقی‌مانده/,'negative remainder refused');}
 // a bottle: base عدد (1 L), counted in لیتر, used in سی‌سی; سی‌سی is a millilitre; a purchase unit of the same size is still offered
 {const juice={id:'j1',recipeUnit:'عدد',purchaseUnit:'لیتر',packageQuantity:1,useUnit:'سی‌سی',countUnit:'لیتر',countingUnits:[{name:'سی‌سی',factor:0.001}]};
  ok(W.unitsOf(juice).map(u=>u.name).join()==='عدد,لیتر,سی‌سی'&&W.useUnitOf(juice).name==='سی‌سی'&&W.countUnitOf(juice).name==='لیتر'&&W.smallestUnit(juice).name==='سی‌سی','bottle item: لیتر offered though it equals one عدد; use سی‌سی, count لیتر');
  ok(E.UK('سی‌سی')==='ml'&&W.unitsOf({recipeUnit:'لیتر',countingUnits:[{name:'سی سی',factor:0.001}]}).length===2,'سی‌سی is a millilitre (no duplicate automatic میلی‌لیتر)');}
 // staff app: waste counts at once but waits for the manager's review, with the person who reported it
 {const d=baseDoc(),c={...ctx(),staff:{personnelId:'EMP-9',name:'پریسا'}};const w=W.addEvent(d,c,{date:D3,eventType:'WASTE',type:'ingredient',itemId:'i1',quantity:1,reason:'افتاد',section:'بار'});
  ok(w.status==='posted'&&w.reviewStatus==='در انتظار بررسی'&&w.reportedByPersonnelId==='EMP-9'&&w.reportedByName==='پریسا'&&w.registeredByType==='staff'&&!w.reviewedBy,'staff waste: posted, waiting for review, names the person');
  ok(d.inventoryMovements.some(m=>m.sourceKey&&m.sourceKey.includes(w.id)||m.referenceId===w.id),'staff waste moves stock like any waste')}
 // standard units come from any weight / volume unit the item has, and cross with the density
 {const us=W.unitsOf({recipeUnit:'عدد',purchaseUnit:'عدد',packageQuantity:1,countingUnits:[{name:'گرم',factor:1/900}]}),f=n=>us.find(u=>u.name===n)?.factor;
  ok(near(f('گرم'),1/900)&&near(f('کیلوگرم'),1000/900)&&!f('لیتر'),'jar item: گرم row brings کیلوگرم, no volume without density');
  const ud=W.unitsOf({recipeUnit:'عدد',countingUnits:[{name:'گرم',factor:1/900}],densityKgPerLiter:1.4}),g=n=>ud.find(u=>u.name===n);
  ok(near(g('لیتر').factor,1400/900)&&near(g('میلی‌لیتر').factor,1.4/900)&&g('لیتر').cross,'density: لیتر and میلی‌لیتر from the weight units');
  ok(W.smallestUnit({recipeUnit:'عدد',countingUnits:[{name:'گرم',factor:1/900}],densityKgPerLiter:1.4}).name==='گرم','count remainder stays in the weight unit, not a density unit');
  const kg=W.unitsOf({recipeUnit:'کیلوگرم',densityKgPerLiter:0.92}),h=n=>kg.find(u=>u.name===n)?.factor;ok(near(h('گرم'),0.001)&&near(h('لیتر'),0.92)&&near(h('میلی‌لیتر'),0.00092),'kg item with density: گرم, لیتر, میلی‌لیتر');
  ok(W.unitsOf({recipeUnit:'کیلوگرم'}).map(u=>u.name).join()==='کیلوگرم,گرم','kg item without density: only گرم added (unchanged)');}
 // prepared-item formula (InvEngine.convertQty): an item's own units convert too, not only کیلو/گرم/لیتر
 {const oil={recipeUnit:'عدد',purchaseUnit:'عدد',packageQuantity:1,countingUnits:[{name:'کیلوگرم',factor:1/0.9}]},cv=(i,q,a,b)=>E.convertQty(i,q,a,b).value;
  ok(near(cv(oil,10,'گرم','عدد'),10/900)&&near(cv(oil,0.9,'کیلوگرم','عدد'),1),'bottle oil: گرم and کیلوگرم → عدد through «۱ عدد = ۹۰۰ گرم»');
  const dl={recipeUnit:'بسته',purchaseUnit:'کارتن',packageQuantity:12,countingUnits:[{name:'لیتر',factor:1}]};ok(near(cv(dl,60,'میلی‌لیتر','بسته'),0.06)&&near(cv(dl,1,'کارتن','بسته'),12),'pack item: میلی‌لیتر and کارتن → بسته');
  ok(E.convertQty({recipeUnit:'عدد'},5,'گرم','عدد').value===null&&/تبدیل واحد/.test(E.convertQty({recipeUnit:'عدد'},5,'گرم','عدد').reason),'unknown unit refused with a hint');
  ok(near(cv({recipeUnit:'کیلوگرم'},250,'گرم','کیلوگرم'),0.25),'kg ↔ g unchanged');}
 console.log(`qa_template_inventory_write: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
})();