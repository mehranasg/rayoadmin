// QA: BL-016 fryer oil by change cycle (InvEngine.oilCycles). Synthetic data only. Run: node qa_template_oil_cycles.js
'use strict';
const fs=require('fs'),path=require('path');
global.window={};eval(fs.readFileSync(path.join(__dirname,'../app/core/js/inventory-engine.js'),'utf8'));
const E=window.InvEngine;let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};const near=(a,b)=>Math.abs(a-b)<1e-6;
const T=E.CAL.today,day=k=>E.CAL.k(E.CAL.i(T)-k);
const pricing={ingredients:[{id:'OIL',name:'روغن سرخ کردنی',recipeUnit:'کیلوگرم',status:'فعال'}],menuItems:[{id:'F',name:'سیب زمینی سرخ کرده',status:'فعال'},{id:'S',name:'سالاد',status:'فعال'}],recipes:[],recipeVersions:[],ingredientPriceHistory:[]};
// fryer A: full changes every 10 days (60 → 0 days ago); 18.2 kg each; 100 fried items a day (and salads that do not count)
const recs=[],full=(d,f='A',kg=18.2)=>recs.push({id:'O'+recs.length,eventType:'FRYER_OIL_CHANGE',date:day(d),fryerId:f,fryerName:'سرخ‌کن '+f,oilChangeKind:'FULL',quantity:kg,status:'posted'}),top=(d,kg)=>recs.push({id:'O'+recs.length,eventType:'FRYER_OIL_CHANGE',date:day(d),fryerId:'A',fryerName:'سرخ‌کن A',oilChangeKind:'TOP_UP',quantity:kg,status:'posted'});
for(const d of [60,50,40,30,20,10])full(d);top(15,9.1);// the cycle 20→10 gets a top-up: 27.3 kg for 1000 items
const sales=[{id:'SP',from:day(70),to:T,status:'posted',lines:[{menuItemId:'F',quantity:100*71},{menuItemId:'S',quantity:500}]}];
const inv={stocktakes:[],stockReceipts:[],wasteRecords:[],consumptionRecords:recs,salesPeriods:sales,inventoryMovements:[]};
const M=E.build({inventory:inv,pricing,cashreport:{}}),R=E.oilCycles(M,{warn:15,critical:25});
const A=R.fryers.find(f=>f.id==='A');
ok(A&&A.cycles.length===6&&A.cycles.filter(c=>!c.open).length===5,'six full changes: five finished cycles and the running one');
ok(near(A.cycles[0].items,1000)&&near(A.cycles[0].per100,1.82)&&A.cycles[0].days===10,'a cycle: 10 days, 1000 fried items (salad not counted), 1.82 kg per 100');
ok(near(A.last.kg,27.3)&&A.last.topUps===1&&near(A.last.per100,2.73),'the last finished cycle includes its top-up');
ok(near(A.median,1.82)&&near(A.dev,50)&&A.level==='critical','median of the earlier cycles 1.82 → +50% critical');
ok(A.running&&A.running.open&&A.running.days===11&&A.running.per100===null&&A.medDays===10,'running cycle: days so far, no alert yet');
// too few earlier cycles: no pattern
const recs2=[];for(const d of [30,20,10])recs2.push({eventType:'FRYER_OIL_CHANGE',date:day(d),fryerId:'B',oilChangeKind:'FULL',quantity:18,status:'posted'});
const R2=E.oilCycles(E.build({inventory:{...inv,consumptionRecords:recs2},pricing,cashreport:{}}),{});ok(R2.fryers[0].median===null&&R2.fryers[0].level==='na'&&/دست‌کم/.test(R2.fryers[0].note),'fewer than 3 earlier cycles: no pattern');
// a cycle without sales data has no value
const R3=E.oilCycles(E.build({inventory:{...inv,salesPeriods:[]},pricing,cashreport:{}}),{});ok(R3.fryers[0].cycles.every(c=>c.per100===null)&&R3.fryers[0].level==='na','no sales recorded: no per-100 value');
// a void record is ignored
recs.push({eventType:'FRYER_OIL_CHANGE',date:day(5),fryerId:'A',oilChangeKind:'FULL',quantity:18,status:'void'});ok(E.oilCycles(E.build({inventory:inv,pricing,cashreport:{}}),{}).fryers[0].cycles.length===6,'void change ignored');
console.log(`qa_template_oil_cycles: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
