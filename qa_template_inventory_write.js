// QA: newpanel/core/js/inventory-write.js — record shapes, rules and the protected save protocol (synthetic data only).
// Run: node qa_template_inventory_write.js
'use strict';
const fs=require('fs'),path=require('path');
global.window={};
const sessionStore={};global.sessionStorage={getItem:k=>sessionStore[k]??null,setItem:(k,v)=>{sessionStore[k]=String(v)}};
eval(fs.readFileSync(path.join(__dirname,'newpanel/core/js/inventory-engine.js'),'utf8'));
eval(fs.readFileSync(path.join(__dirname,'newpanel/core/js/inventory-write.js'),'utf8'));
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
const w1=W.addEvent(doc,ctx(),{date:D3,eventType:'WASTE',type:'ingredient',itemId:'i1',quantity:1,shift:'صبح',reason:'سوختگی'});
ok(w1.id==='WST-000001'&&w1.recordKind==='waste'&&w1.known===true&&w1.status==='posted'&&w1.reviewStatus==='تأییدشده','waste record');
const wm=doc.inventoryMovements.find(m=>m.id===w1.movementId);
ok(wm&&wm.sourceKey==='waste:WST-000001'&&wm.referenceType==='wasteRecord'&&wm.quantity===1&&wm.fromLocationId==='L1','waste movement linked');
const a1=W.addEvent(doc,ctx(),{date:D3,eventType:'STAFF_CONSUMPTION',type:'ingredient',itemId:'i1',quantity:0.5,reason:'غذای پرسنل'});
ok(a1.id==='CON-000001'&&a1.recordKind==='consumption'&&doc.consumptionRecords.length===1,'authorized consumption goes to consumptionRecords');
const w2=W.addEvent(doc,ctx(),{date:D3,eventType:'WASTE',type:'menu',itemId:'m1',quantity:2,reason:'برگشتی'});
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
ok(near(l1.expected,27.1)&&near(l1.variance,-2.1)&&l1.baseDate===D0&&near(l1.purchaseQty,20)&&near(l1.salesConsumption,1)&&near(l1.wasteQty,1.4)&&near(l1.otherOutQty,0.5),'count expected/variance from the engine');
ok(near(l1.varianceValueToman,-2.1*40000),'variance value at item cost');
const c2=W.addCount(doc,ctx(),{date:D5,entries:[{itemId:'i1',quantity:2.6,unit:'کارتن'}]});
ok(!c2.created&&c2.replaced===1&&st.lines.length===1&&near(st.lines[0].actual,26)&&st.revisionHistory.length===1&&st.revisionHistory[0].replaced[0].actual===25,'same-date count merges and keeps the replaced line');
throws(()=>W.addCount(doc,ctx(),{date:D3,entries:[{itemId:'i1',quantity:1}]}),/تأیید لازم/,'count before a later whole count needs confirmation');
throws(()=>W.addCount(doc,ctx(),{date:D5,entries:[{itemId:'i1',quantity:-1}]}),/نامنفی/,'negative count blocked');

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
 const ev=W.addEvent(ed,ctx(),{date:D3,eventType:'WASTE',type:'ingredient',itemId:'i1',quantity:1,reason:'سوختگی'});const ne=W.editEvent(ed,ctx(),{id:ev.id,quantity:'0.5',eventType:'EXPIRY'});
 ok(ev.status==='void'&&ev.voidKind==='edit'&&ne.replacesId===ev.id&&near(ne.quantity,0.5)&&ne.eventType==='EXPIRY'&&ne.reason==='سوختگی','waste edit keeps item and reason');
 const cd=JSON.parse(JSON.stringify(doc)),cv=W.voidCountDate(cd,ctx(),{date:D5,reason:'شمارش اشتباه'});ok(cv.count===1&&cd.stocktakes.filter(s=>s.date===D5).every(s=>s.status==='void'),'count of a date voided');
 throws(()=>W.voidCountDate(cd,ctx(),{date:D1,reason:'x'}),/پایان روز/,'no count on that date refused')}

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

// 7. protected save protocol
(async()=>{
 const server={text:JSON.stringify(baseDoc()),saves:0};
 const io={load:async()=>JSON.parse(server.text),save:async d=>{server.saves++;server.text=JSON.stringify(d)},actor:()=>'qa-admin',pricing:()=>pricing};
 const r=await W.edit(io,{action:'RECEIPT_ADDED',details:{lines:1},mutate:(d,cx)=>W.addReceipts(d,cx,{date:D3,lines:[{itemId:'i1',quantity:3}]})});
 const saved=JSON.parse(server.text);
 ok(server.saves===1&&saved.stockReceipts.length===1&&r.doc.meta.serverSaveToken===saved.meta.serverSaveToken,'edit saves once and verifies by reload');
 ok(saved.changeLog.some(x=>x.action==='RECEIPT_ADDED'&&x.actor==='qa-admin'&&x.via==='ui-template'),'audit row in changeLog');
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
 console.log(`qa_template_inventory_write: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
})();
