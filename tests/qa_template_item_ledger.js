// QA: item ledger (InvEngine.itemLedger — the stock tab's «گردش کالا») and the edit of one item in the opening count
// (InvWrite.editOpeningLine). Synthetic data only. Run: node qa_template_item_ledger.js
'use strict';
const fs=require('fs'),path=require('path');
global.window={};
for(const f of ['inventory-engine.js','inventory-write.js'])eval(fs.readFileSync(path.join(__dirname,'../app/core/js',f),'utf8'));
const E=window.InvEngine,W=window.InvWrite;
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const throws=(f,re,m)=>{try{f();ok(false,m+' (no error)')}catch(e){ok(re.test(e.message),m+' → '+e.message)}};
const near=(a,b)=>a!==null&&b!==null&&Math.abs(a-b)<1e-6;
const pricing={ingredients:[{id:'i1',code:'101',name:'به لیمو',status:'فعال',itemType:'MENU_INGREDIENT',recipeUnit:'کیلوگرم',lastPurchasePriceToman:1000},{id:'i2',code:'102',name:'شکر',status:'فعال',itemType:'MENU_INGREDIENT',recipeUnit:'کیلوگرم',purchaseUnit:'کیسه',packageQuantity:10,lastPurchasePriceToman:100}],
 menuItems:[{id:'m1',name:'دمنوش'}],recipes:[{menuItemId:'m1',ingredientId:'i1',quantity:0.01,recipeUnit:'کیلوگرم',wastePercent:0}],recipeVersions:[],ingredientPriceHistory:[],preparedItems:[]};
const T=E.CAL.today,day=k=>E.CAL.k(E.CAL.i(T)-k),D0=day(40),D1=day(30),D2=day(20),D3=day(10);
const doc=()=>({meta:{initialized:true},settings:{},locations:[],stocktakes:[
  {id:'ST-OPEN',date:D0,inventoryScope:'RAYO',baselineBoundary:'START',isOpeningBaseline:true,status:'approved',coverage:{counted:1,total:2},lines:[{ingredientId:'i1',actual:500,expected:500,variance:0,isOpeningBaseline:true}]},
  {id:'ST-W1',date:D2,inventoryScope:'RAYO',baselineBoundary:'END',status:'approved',lines:[{ingredientId:'i1',actual:0.3},{ingredientId:'i2',actual:4}]}],
 stockReceipts:[{id:'R1',date:D1,ingredientId:'i1',quantity:1,status:'active'}],wasteRecords:[{id:'W1',date:D1,itemId:'i1',quantity:0.2,reason:'ریخت',status:'active'}],consumptionRecords:[],
 salesPeriods:[{id:'S1',from:D0,to:D1,status:'approved',lines:[{menuItemId:'m1',quantity:110}]}],inventoryMovements:[],periodClosures:[],changeLog:[]});
const ctx=()=>({actor:'qa',at:new Date().toISOString(),reqId:'R'+Math.random().toString(36).slice(2,7).toUpperCase(),pricing});
const build=d=>E.build({inventory:d,pricing});

// ledger: opening 500 + 1 − 0.2 − 1.1 (110 × 10 g) = 499.7 expected at the whole count of D2, counted 0.3 → −499.4
let d=doc(),M=build(d),L=E.itemLedger(M,'i1',T);
ok(L.segments.length===2,'two segments: opening → whole count, whole count → today');
let s=L.segments[0];ok(s.start.boundary==='START'&&s.start.qty===500&&s.end.date===D2,'first segment from the opening to the whole count');
ok(s.events.length===2&&near(s.events.find(x=>x.type==='receipt').qty,1)&&near(s.events.find(x=>x.type==='waste').qty,-0.2),'receipt + and waste − inside it');
ok(near(s.sales,1.1)&&s.salesBy[0].name==='دمنوش'&&s.salesFrom===D0&&s.salesTo===D1,'sales use of the period with the menu item behind it');
ok(near(s.expected,499.7)&&near(s.variance,-499.4),'expected and variance at the next count');
ok(L.segments[1].end===null&&near(L.qty,0.3),'open last segment ends with the on-hand of the date');
// the same as positions, for every item and several dates
for(const dd of [D0,day(35),D1,D2,D3,T])for(const r of E.positions(M,dd)){const q=E.itemLedger(M,r.id,dd).qty;ok(r.qty===null?q===null:near(r.qty,q),`ledger = positions: ${r.id} ${dd}`)}
// a past date: only what happened up to its end
L=E.itemLedger(M,'i1',day(35));ok(L.segments.length===1&&L.segments[0].end===null&&near(L.qty,500-0.01*110*(E.CAL.i(day(35))-E.CAL.i(D0)+1)/(E.CAL.i(D1)-E.CAL.i(D0)+1)),'past date: sales spread up to that day only');
// an item never counted with only a receipt still shows a quantity; nothing at all → null
d=doc();d.stockReceipts.push({id:'R2',date:D3,ingredientId:'i2',quantity:2,status:'active'});d.stocktakes=[d.stocktakes[0]];M=build(d);
ok(near(E.itemLedger(M,'i2',T).qty,2),'uncounted item with a receipt: 2');ok(E.itemLedger(build({...doc(),stocktakes:[],stockReceipts:[],salesPeriods:[],wasteRecords:[]}),'i2',T).qty===null,'nothing recorded: null');

// editOpeningLine: 500 kg → 0.5 kg; the old line stays in revisionHistory; the whole count's variance follows
d=doc();let out=W.editOpeningLine(d,ctx(),{date:D0,itemId:'i1',quantity:'0.5',unit:'کیلوگرم',reason:'گرم به جای کیلوگرم'});
let op=d.stocktakes.find(x=>x.id==='ST-OPEN'),ln=op.lines.find(l=>l.ingredientId==='i1');
ok(out.before===500&&out.after===0.5&&!out.added,'result: 500 → 0.5');ok(ln.actual===0.5&&ln.expected===0.5&&ln.variance===0&&ln.isOpeningBaseline===true,'line replaced with the new figure');
ok(op.revisionHistory.length===1&&op.revisionHistory[0].kind==='opening-line-edited'&&op.revisionHistory[0].replaced[0].actual===500&&op.revisionHistory[0].reason,'old line kept in revisionHistory with the reason');
ok(op.lines.length===1&&op.coverage.counted===1,'no duplicate line');
L=E.itemLedger(build(d),'i1',T);ok(near(L.segments[0].expected,0.2)&&near(L.segments[0].variance,0.1),'ledger after the edit: expected 0.2, variance +0.1');
ok(d.changeLog.length===0,'the write function itself adds no audit row (InvWrite.edit does)');
// in another unit: 2 کیسه = 20 kg; entry unit kept
d=doc();W.editOpeningLine(d,ctx(),{date:D0,itemId:'i2',quantity:'2',unit:'کیسه',reason:'جاافتاده'});ln=d.stocktakes[0].lines.find(l=>l.ingredientId==='i2');
ok(ln&&ln.actual===20&&ln.entryUnit==='کیسه'&&ln.entryQuantity===2,'missed item added in a package unit: 20 kg');ok(d.stocktakes[0].revisionHistory[0].added[0]==='i2','added item recorded in the revision');
// the item split over two opening records (old bulk import): one line in the first, the other record emptied → void
d=doc();d.stocktakes.push({id:'ST-OPEN2',date:D0,status:'submitted',isOpeningBaseline:true,lines:[{ingredientId:'i1',actual:3}]});
ok(E.itemLedger(build(d),'i1',T).segments[0].start.qty===503,'engine sums both opening records: 503');
W.editOpeningLine(d,ctx(),{date:D0,itemId:'i1',quantity:'1',unit:'کیلوگرم',reason:'یکی کردن'});
ok(E.itemLedger(build(d),'i1',T).segments[0].start.qty===1,'after the edit the opening of the item is 1');
const o2=d.stocktakes.find(x=>x.id==='ST-OPEN2');ok(o2.status==='void'&&o2.lines.length===0&&o2.revisionHistory[0].removed[0].actual===3,'emptied record voided, its line kept in the revision');
// refusals
throws(()=>W.editOpeningLine(doc(),ctx(),{date:D0,itemId:'i1',quantity:'1',reason:''}),/علت/,'reason required');
throws(()=>W.editOpeningLine(doc(),ctx(),{date:D0,itemId:'i1',quantity:'-1',reason:'x'}),/نامنفی/,'negative refused');
throws(()=>W.editOpeningLine(doc(),ctx(),{date:D0,itemId:'i1',quantity:'',reason:'x'}),/نامنفی/,'blank refused');
throws(()=>W.editOpeningLine(doc(),ctx(),{date:D2,itemId:'i1',quantity:'1',reason:'x'}),/افتتاحیه ثبت نشده/,'a date without an opening refused');
throws(()=>W.editOpeningLine(doc(),ctx(),{date:D0,itemId:'nope',quantity:'1',reason:'x'}),/پیدا نشد/,'unknown item refused');
d=doc();d.periodClosures=[{id:'PC1',status:'closed',from:D0,to:D2}];throws(()=>W.editOpeningLine(d,ctx(),{date:D0,itemId:'i1',quantity:'1',reason:'x'}),/بسته/,'closed period refused');

console.log(`item ledger: ${pass} passed, ${fail} failed`);if(fail)process.exit(1);
