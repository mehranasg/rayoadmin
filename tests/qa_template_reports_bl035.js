// QA: BL-035 — same period last year, cost targets (levels, save) and the weekly cash plan of next month.
// Synthetic data only. Run: node qa_template_reports_bl035.js
'use strict';
const fs=require('fs'),path=require('path');
global.window={};for(const f of ['inventory-engine.js','finance-write.js','report-core.js'])eval(fs.readFileSync(path.join(__dirname,'../app/core/js',f),'utf8'));
const E=window.InvEngine,RC=window.ReportCore,FW=window.FinanceWrite;let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};const near=(a,b)=>Math.abs(a-b)<1e-6;
const throws=(f,re,m)=>{try{f();ok(false,m+' (no error)')}catch(e){ok(re.test(e.message),m+' → '+e.message)}};
// 1. last year
ok(RC.yoyKeys(['1405/07','1405/08']).join()==='1404/07,1404/08','same months one year earlier');
// 2. targets
const tg=RC.costTargets({settings:{}});ok(tg.materials===35&&tg.payroll===25&&tg.total===90&&!tg.saved,'defaults until saved');
ok(RC.costTargets({settings:{costTargets:{materials:30,payroll:'x',total:85}}}).payroll===25,'a bad saved value falls back to the default');
ok(RC.targetLevel(35,35)==='ok'&&RC.targetLevel(37,35)==='warning'&&RC.targetLevel(38.6,35)==='over'&&RC.targetLevel(null,35)==='na','levels: ≤ target ok, +3.5 (10%) warning, beyond over');
ok(RC.targetLevel(21.9,20)==='warning'&&RC.targetLevel(22.1,20)==='over','tolerance at least 2 points');
const tc=RC.targetCheck({sales:1000,materials:400,payroll:200,totalCost:950},tg);ok(near(tc[0].pct,40)&&tc[0].level==='over'&&tc[1].level==='ok'&&tc[2].level==='warning'&&near(tc[2].gap,5),'materials 40% over, payroll 20% ok, total 95% warning');
ok(RC.targetCheck({sales:0,materials:1,payroll:1,totalCost:2},tg).every(r=>r.level==='na'),'no sales: no level');
{const f={settings:{}};const o=FW.saveCostTargets(f,{actor:'o',at:'x'},{materials:'۳۲٫۵',payroll:28,total:88});ok(o.materials===32.5&&f.settings.costTargets.total===88,'save: Persian decimal');
 throws(()=>FW.saveCostTargets(f,{},{materials:60,payroll:40,total:90}),/جمع مواد و حقوق/,'total below materials + payroll refused');throws(()=>FW.saveCostTargets(f,{},{materials:0,payroll:20,total:90}),/بین ۰ و ۱۰۰/,'zero refused')}
// 3. cash plan: today 1405/08/20 → rest of Aban, then the weeks of Azar (1405/09/01 … 1405/09/30)
const CAL=E.CAL,today='1405/08/20';
const pl=RC.cashPlan({CAL,today,start:1000,dated:[{date:'1405/08/10',amount:100,dir:'out',kind:'obligation',label:'معوق'},{date:'1405/09/01',amount:300,dir:'out',kind:'payroll',label:'حقوق'},{date:'1405/09/15',amount:50,dir:'in',kind:'check',label:'چک'},{date:'1405/10/05',amount:999,dir:'out',kind:'x',label:'بعد'}],
 spread:[{amount:310,dir:'in',kind:'sales',label:'فروش',from:'1405/08/21',to:'1405/09/30'}]});
const r0=pl.rows[0],weeks=pl.rows.slice(1);
ok(r0.from==='1405/08/21'&&r0.to==='1405/08/30'&&r0.out===100,'first row: tomorrow to the end of this month, with the overdue item');
ok(weeks[0].from==='1405/09/01'&&weeks.at(-1).to==='1405/09/30'&&weeks.every((w,i)=>i===0||(CAL.i(w.from)+1)%7===0),'weeks cover next month and start on Saturday');
ok(weeks.every(w=>i7(w)),'each week ends on Friday or the month end');function i7(w){const b=CAL.i(w.to);return (b+1)%7===6||w.to==='1405/09/30'}
ok(weeks[0].out===300&&weeks.find(w=>w.items.some(x=>x.kind==='check')).in===50&&pl.outside===1,'dated items in their week; after the plan left out');
const days=CAL.i('1405/09/30')-CAL.i('1405/08/21')+1;ok(near(pl.rows.reduce((s,r)=>s+r.estIn,0),310)&&near(r0.estIn,310/days*10),'estimate spread by day count');
ok(near(pl.end,1000-100-300+50+310)&&near(weeks[0].open,r0.end)&&!pl.firstNegative,'running balance');
const neg=RC.cashPlan({CAL,today,start:100,dated:[{date:'1405/09/02',amount:500,dir:'out',kind:'x',label:'x'}]});ok(neg.firstNegative&&neg.firstNegative.key==='w1'&&neg.rows[1].negative,'the first week that ends below zero is flagged');
console.log(`qa_template_reports_bl035: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
