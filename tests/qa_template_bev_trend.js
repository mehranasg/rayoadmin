// QA: beverage shortage summary and trend (ReportCore.bevLine / bevShort / bevBuckets / bevItems / trendOf).
// Synthetic data only. Run: node qa_template_bev_trend.js
'use strict';
const fs=require('fs'),path=require('path');
global.window={};for(const f of ['inventory-engine.js','report-core.js'])eval(fs.readFileSync(path.join(__dirname,'../app/core/js',f),'utf8'));
const E=window.InvEngine,RC=window.ReportCore;let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};const near=(a,b)=>Math.abs(a-b)<1e-6;
ok(near(RC.bevLine({daily:2,overnight:-1,cost:100}).value,300)&&RC.bevLine({daily:-3,overnight:2,cost:100}).units===0,'shortage = daily shortage + overnight shortage; surplus is not shortage');
ok(RC.bevLine({daily:1,overnight:null,cost:null}).priced===false,'no cost: counted but not valued');
// 28 days from 1405/08/01: cola short 1 a day the first two weeks, 3 a day the last two weeks
const days=[];for(let i=0;i<28;i++){const d=E.CAL.k(E.CAL.i('1405/08/01')+i);days.push({date:d,lines:[{id:'C',name:'کوکاکولا',daily:i<14?1:3,overnight:null,cost:50000},{id:'F',name:'فانتا',daily:0,overnight:i===3?-2:0,cost:40000}]})}
const t=RC.bevShort(days,'1405/08/01','1405/08/28');ok(t.days===28&&near(t.units,14+42+2)&&near(t.value,(14+42)*50000+2*40000)&&near(t.overnight,2),'period total');
const wk=RC.bevBuckets(days,{CAL:E.CAL,from:'1405/08/01',to:'1405/08/28',by:'week'});ok(wk.every(b=>(E.CAL.i(b.from)+1)%7===0),'weeks start on Saturday');
ok(near(wk.reduce((s,b)=>s+b.units,0),t.units),'weeks add up to the period');
const mo=RC.bevBuckets(days,{CAL:E.CAL,from:'1405/08/01',to:'1405/08/28',by:'month'});ok(mo.length===1&&mo[0].key==='1405/08'&&near(mo[0].value,t.value),'month bucket');
const it=RC.bevItems(days,'1405/08/01','1405/08/28');ok(it[0].id==='C'&&it[0].days===28&&it[1].id==='F'&&it[1].days===1,'items ranked by value; days with shortage');
ok(RC.trendOf([10,12,15,20]).dir==='up'&&RC.trendOf([20,15,12,10]).dir==='down'&&RC.trendOf([10,10.1,9.9,10]).dir==='steady'&&RC.trendOf([1,2]).dir==='na','trend direction');
ok(RC.trendOf(wk.filter(b=>b.days).map(b=>b.value)).dir==='up','the cola weeks are rising');
// beverage × day sheet (BL-096)
{const mx=RC.bevMatrix(days,{CAL:E.CAL,from:'1405/08/01',to:'1405/08/30',by:'day'});
 ok(mx.cols.length===30&&mx.cols[28].n===0&&mx.cols[28].recorded===0&&mx.cols[0].recorded===1,'every day is a column; a day without a record shows n = 0');
 ok(mx.rows[0].id==='C'&&near(mx.rows[0].units,56)&&near(mx.rows[0].cells[20].units,3)&&near(mx.rows[0].cells[20].value,150000),'row per beverage, cell per day');
 const f=mx.rows.find(r=>r.id==='F');ok(near(f.cells[3].units,2)&&near(f.cells[3].overnight,2)&&f.days===1,'overnight shortage in its day');
 ok(near(mx.tot.units,t.units)&&near(mx.tot.value,t.value),'sheet total = period total of the trend');
 ok(mx.cols.reduce((s,c)=>s+c.units,0)===mx.tot.units,'columns add up');
 const d2=[{date:'1405/08/01',lines:[{id:'C',name:'کوکاکولا',daily:-2,overnight:null,cost:100},{id:'F',name:'فانتا',daily:1,overnight:3,cost:100}]}],m2=RC.bevMatrix(d2,{CAL:E.CAL,from:'1405/08/01',to:'1405/08/01'});
 ok(m2.rows.find(r=>r.id==='C').cells[0].units===0&&m2.rows.find(r=>r.id==='C').cells[0].net===-2&&near(m2.rows.find(r=>r.id==='F').cells[0].net,-2),'net: surplus negative (overnight gain counts as surplus)');
 const wk2=RC.bevMatrix(days,{CAL:E.CAL,from:'1405/08/01',to:'1405/08/28',by:'week'});ok(wk2.cols.length===wk.length&&near(wk2.rows[0].cells.reduce((s,c)=>s+c.units,0),56),'week columns');
 ok(RC.bevMatrix(days,{CAL:E.CAL,from:'1405/08/05',to:'1405/08/01'}).rows.length===0,'empty when the range is reversed');
 const tr=RC.bevMatrix(days,{CAL:E.CAL,from:'1405/07/20',to:'1405/08/30',trim:true});ok(tr.cols[0].key==='1405/08/01'&&tr.cols.length===30&&tr.rows[0].cells.length===30&&near(tr.tot.units,t.units),'trim: the day sheet starts at the first recorded day')}
console.log(`qa_template_bev_trend: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
