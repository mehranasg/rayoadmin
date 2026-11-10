// QA: newpanel/core/js/consumption-alerts.js — same settings record as the current panel (js/32), item levels,
// total loss and menu allocation (synthetic data only). Run: node qa_template_consumption_alerts.js
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
global.window={};eval(fs.readFileSync(path.join(__dirname,'../app/core/js/consumption-alerts.js'),'utf8'));
const C=window.ConsumptionAlerts;let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};const near=(a,b)=>Math.abs(a-b)<1e-6;
// 1. defaults, limits and labels equal js/32
const src=fs.readFileSync(path.join(__dirname,'../legacy/js/32-inventory-cost-control-v10.js'),'utf8'),grab=n=>vm.runInNewContext('('+src.match(new RegExp(`const ${n}=(?:Object\\.freeze\\()?(\\{[^;]*?\\})\\)?;`))[1]+')');
ok(JSON.stringify(grab('CONSUMPTION_DEFAULTS'))===JSON.stringify(C.DEFAULTS),'defaults equal js/32');
ok(JSON.stringify(grab('CONSUMPTION_LIMITS'))===JSON.stringify(C.LIMITS),'limits equal js/32');
ok(JSON.stringify(grab('CONSUMPTION_LABELS'))===JSON.stringify(C.LABELS),'labels equal js/32');
// 2. normalize / validate
const n0=C.normalize(null);ok(n0.wasteWarn===3&&n0.lossSalesAuto&&near(n0.lossSalesWarn,35*(3+2)/100)&&near(n0.lossSalesCritical,35*10/100),'normalize: defaults and automatic loss limits');
const n1=C.normalize({wasteWarn:'۴٫۵',lossSalesAuto:false,lossSalesWarn:2,overrides:[{scope:'category',key:'لبنیات',wasteWarn:8},{scope:'x',key:'y'}],custom:1});ok(n1.wasteWarn===4.5&&n1.lossSalesWarn===2&&n1.overrides.length===1,'normalize: Persian decimal, manual loss limit, bad override dropped');
const base={...C.DEFAULTS};const v1=C.validate({...base,wasteWarn:6,wasteCritical:5});ok(!v1.ok&&/نباید/.test(v1.errors[0]),'warning above critical refused');
const v2=C.validate({...base,minDays:'۲٫۵'});ok(!v2.ok,'integer key needs an integer');
const v3=C.validate({...base,overrides:[{scope:'ingredient',key:'i9',wasteWarn:1}]},{ingredientIds:new Set(['i1'])});ok(!v3.ok&&/کاتالوگ/.test(v3.errors.join()),'override item must exist');
const v4=C.validate({...base,overrides:[{scope:'ingredient',key:'i1',wasteWarn:9}]},{ingredientIds:new Set(['i1'])});ok(!v4.ok&&/حد بحرانی/.test(v4.errors.join()),'override warning above the global critical refused');
const v5=C.validate({...base,overrides:[{scope:'ingredient',key:'i1',wasteWarn:4,wasteCritical:9}]},{ingredientIds:new Set(['i1'])});ok(v5.ok&&v5.value.overrides[0].wasteCritical===9,'valid override');
const th=C.thresholdsFor({...n0,overrides:[{scope:'category',key:'لبنیات',wasteWarn:8},{scope:'ingredient',key:'i2',varianceWarn:1}]},{id:'i2',category:'لبنیات'});ok(th.wasteWarn===8&&th.varianceWarn===1&&th.source==='ingredient','item over category over global');
// 3. report
const P={days:30,salesAmount:1000000,items:[
 {id:'i1',name:'پنیر',category:'لبنیات',unit:'کیلو',open:5,salesV:100000,wasteV:2000,staffV:0,varianceV:-1000},     // waste 2000/103000=1.9%, var 1%
 {id:'i2',name:'گوشت',category:'گوشت',unit:'کیلو',open:5,salesV:200000,wasteV:15000,staffV:0,varianceV:-12000},   // waste 15000/227000=6.6% critical
 {id:'i3',name:'دستمال',category:'مصرفی',unit:'بسته',open:2,salesV:0,wasteV:0,staffV:0,varianceV:null},
 {id:'i4',name:'کنار',category:'گوشت',unit:'کیلو',open:1,salesV:1000,wasteV:900,staffV:0,varianceV:0}],
 menuUse:new Map([['m1',new Map([['i1',60000],['i2',200000]])],['m2',new Map([['i1',40000]])]]),menuAmt:new Map([['m1',600000],['m2',400000]]),menuSold:new Map([['m1',10],['m2',20]])};
const R=C.report(P,null,{levelOf:id=>id==='i4'?'PARKED':'LIGHT'}),row=id=>R.rows.find(r=>r.id===id);
ok(near(row('i1').actual,103000)&&near(row('i1').wastePct,2000/103000*100)&&near(row('i1').variancePct,1)&&row('i1').status==='ok','item ok');
ok(row('i2').status==='critical'&&row('i2').wasteLevel==='critical'&&row('i2').varianceLevel==='critical','item critical');
ok(row('i3').status==='na'&&row('i3').reasons.some(x=>/پایان دوره/.test(x)),'not counted → insufficient data');
ok(row('i4').status==='na'&&row('i4').control==='PARKED','parked never alerts');
ok(near(R.totals.loss,2000+15000+900+1000+12000)&&near(R.totals.lossSalesPct,3.09)&&R.totals.level==='warning','total loss against sales');
const m1=R.menus.list.find(x=>x.menuId==='m1'),m2=R.menus.list.find(x=>x.menuId==='m2');
ok(near(m1.wasteShare,2000*0.6+15000)&&near(m1.shortageShare,1000*0.6+12000)&&near(m2.wasteShare,800)&&near(m2.shortageShare,400),'loss allocated by recipe usage share');
ok(near(m1.adjustedPct,(260000+16200+12600)/600000*100)&&m1.level==='critical'&&near(R.menus.unallocated,900),'menu adjusted %, level and unallocated loss');
ok(C.report({...P,days:3},null).rows.every(r=>r.status==='na')&&C.report({...P,days:3},null).totals.level==='na','short period → no alerts');
// 4. save keeps unknown keys and audits
const doc={settings:{consumptionAlerts:{custom:'keep',wasteWarn:3}}},ctx={at:'2026-11-09T10:00:00Z',actor:'qa',pricing:{ingredients:[{id:'i1',category:'لبنیات'}]}};
const out=C.save(doc,ctx,{...base,wasteWarn:'۲'});ok(doc.settings.consumptionAlerts.custom==='keep'&&doc.settings.consumptionAlerts.wasteWarn===2&&doc.settings.consumptionAlerts.updatedBy==='qa'&&ctx.auditExtra.before.wasteWarn===3&&out.wasteWarn===2,'save merges, stamps and audits');
let threw=false;try{C.save(doc,ctx,{...base,wasteWarn:99})}catch(e){threw=/نباید/.test(e.message)}ok(threw,'save validates');
console.log(`qa_template_consumption_alerts: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
