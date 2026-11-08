// QA: newpanel/core/js/assets-write.js — asset counts, quantity events, maintenance, incidents and void (synthetic data only).
// Run: node qa_template_assets_write.js
'use strict';
const fs=require('fs'),path=require('path');
global.window={};
for(const f of ['inventory-engine.js','assets-write.js'])eval(fs.readFileSync(path.join(__dirname,'newpanel/core/js',f),'utf8'));
const AW=window.AssetsWrite,E=window.InvEngine;
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const throws=(f,re,m)=>{try{f();ok(false,m+' (no error)')}catch(e){ok(re.test(e.message),m+' → '+e.message)}};
const T=E.CAL.today,day=k=>E.CAL.k(E.CAL.i(T)-k);
const doc=()=>({lists:{maintenanceTypes:['سرویس دوره‌ای','تعمیر'],incidentTypes:['شکستگی','مفقودی','آسیب/خرابی']},assets:[{id:'AST-1',name:'لیوان',trackingMode:'quantity',initialQuantity:50},{id:'AST-2',name:'یخچال',trackingMode:'numbered'}],counts:[{id:'CNT-0009'}],quantityTransactions:[],maintenanceRecords:[],assetIncidents:[]});
const ctx=()=>({actor:'qa-admin',at:new Date().toISOString(),reqId:'R1',module:'assets'});
let d=doc();const ev=AW.addEvent(d,ctx(),{assetId:'AST-1',date:day(5),type:'شکستگی',quantity:'۳',description:'افتاد'});
ok(ev.id==='QTY-0001'&&ev.effect===-3&&AW.currentQty(d,d.assets[0])===47,'breakage reduces the quantity');
throws(()=>AW.addEvent(d,ctx(),{assetId:'AST-1',date:day(4),type:'مفقودی',quantity:100}),/منفی/,'stock never below zero');
throws(()=>AW.addEvent(d,ctx(),{assetId:'AST-2',date:day(4),type:'شکستگی',quantity:1}),/تعدادی/,'numbered asset has no quantity event');
const cs=AW.addCounts(d,ctx(),{date:day(2),person:'علی',rows:[{assetId:'AST-1',counted:'45',reason:'شکسته'}]});
ok(cs[0].id==='CNT-0010'&&cs[0].systemQuantity===47&&cs[0].variance===-2&&AW.currentQty(d,d.assets[0])===45,'count records the difference as «اصلاح موجودی»');
ok(d.quantityTransactions.some(t=>t.sourceCountId===cs[0].id&&t.type==='اصلاح موجودی'&&t.effect===-2),'adjustment linked to the count');
throws(()=>AW.addCounts(d,ctx(),{date:day(6),rows:[{assetId:'AST-1',counted:1}]}),/بعد از/,'count before a later event refused');
throws(()=>AW.voidRecord(d,ctx(),{kind:'tx',id:d.quantityTransactions.find(t=>t.sourceCountId).id,reason:'x'}),/همان شمارش/,'count adjustment voided only with its count');
AW.voidRecord(d,ctx(),{kind:'count',id:cs[0].id,reason:'اشتباه'});ok(cs[0].status==='void'&&AW.currentQty(d,d.assets[0])===47,'voiding the count voids its adjustment');
const mn=AW.addMaintenance(d,ctx(),{assetId:'AST-2',date:day(1),type:'تعمیر',cost:'۲٬۵۰۰٬۰۰۰',nextServiceDate:E.CAL.k(E.CAL.i(T)+30),description:'تعویض فن'});
ok(mn.id==='MNT-0001'&&mn.cost===2500000&&d.assets[1].nextServiceDate===mn.nextServiceDate,'maintenance record and next service date');
throws(()=>AW.addMaintenance(d,ctx(),{assetId:'AST-1',date:T,type:'تعمیر'}),/شماره‌دار/,'maintenance only for numbered assets');
const inc=AW.addIncident(d,ctx(),{assetId:'AST-2',date:T,type:'آسیب/خرابی',quantity:1,description:'نشتی گاز'});ok(inc.id==='AINC-000001'&&inc.status==='جدید','incident like js/32 wasteSaveAsset');
throws(()=>AW.addEvent(d,ctx(),{assetId:'AST-1',date:E.CAL.k(E.CAL.i(T)+1),type:'شکستگی',quantity:1}),/بعد از امروز/,'future date refused');
console.log(`qa_template_assets_write: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
