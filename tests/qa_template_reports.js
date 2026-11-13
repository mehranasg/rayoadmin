// QA: period reports of the new panel — app/core/js/report-core.js
//  month keys of a period, growth, profit and loss of several months added up (FinanceWrite.pnl per month), item sales
//  of each calendar month (a sales file spread over its days, recipe cost of the day), report groups of menu
//  categories, totals by group / category / item, entity series, salary of a period and the contract forecast.
// Run: node qa_template_reports.js
'use strict';
const fs=require('fs'),path=require('path');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const near=(a,b,m,e=1e-6)=>ok(Math.abs(a-b)<=e,`${m} → ${a} ≠ ${b}`);
global.window={};for(const f of ['core/js/inventory-engine.js','core/js/inventory-write.js','core/js/attendance-core.js','core/js/payroll-core.js','core/js/finance-write.js','core/js/report-core.js'])eval(fs.readFileSync(path.join(__dirname,'../app',f),'utf8'));
const RC=window.ReportCore,E=window.InvEngine,FW=window.FinanceWrite,PC=window.PayrollCore;

/* ---------- month keys and growth ---------- */
ok(RC.prevKey('1405/01')==='1404/12'&&RC.nextKey('1404/12')==='1405/01','prev / next key cross the year');
ok(RC.span('1405/02',3).join()==='1404/12,1405/01,1405/02','span of three months ending in 1405/02');
ok(RC.span('1405/08',1).join()==='1405/08'&&RC.span('1405/08',12)[0]==='1404/09','span of one and twelve months');
near(RC.growth(120,100),20,'growth +20٪');near(RC.growth(80,100),-20,'growth −20٪');near(RC.growth(50,-100),150,'growth against a negative base');
ok(RC.growth(5,0)===null,'growth against zero has no base');

/* ---------- profit and loss of a period ---------- */
const m1=FW.pnl({grossSales:1100,vatPercent:10,vatIncluded:true,reservePercent:5,otherIncome:50,material:{std:300,waste:20,variance:-30,coverage:1},staffMeal:{total:40},payroll:{net:200,state:'closed'},expenses:[{category:'اجاره',amount:100},{category:'قبوض',amount:30}]});
const m2=FW.pnl({grossSales:2200,vatPercent:10,vatIncluded:true,reservePercent:5,material:{std:700,waste:0,variance:0,coverage:0},staffMeal:{total:0},payroll:null,expenses:[{category:'قبوض',amount:70},{category:'تبلیغات',amount:10}]});
const m0=FW.pnl({grossSales:0,vatPercent:10,reservePercent:5,material:{std:null},payroll:null,expenses:[]});
near(m1.sales,1000,'month 1 net sales');near(m1.profit,1050-350-40-200-130-50,'month 1 profit');
const s=RC.sumPnl([{k:'1405/06',r:m1},{k:'1405/07',r:m2}]);
near(s.sales,3000,'period net sales');near(s.grossSales,3300,'period gross sales');near(s.vat,300,'period vat');near(s.materials,350+700,'period materials');
near(s.materialParts.std,1000,'period standard use');near(s.materialParts.shortage,30,'period shortage');near(s.gross,3000-1050,'period gross profit');
near(s.payroll,200,'period payroll');near(s.staffMeal,40,'period staff meal');near(s.expenseTotal,210,'period other expenses');near(s.reserve,150,'period reserve');
near(s.profit,m1.profit+m2.profit,'period profit is the sum of the months');near(s.totalCost,s.costs+s.reserve,'total cost includes the reserve');near(s.income-s.totalCost,s.profit,'income − total cost = profit');
ok(s.expenses.length===3&&s.expenses[0].category==='اجاره'&&s.expenses[1].category==='قبوض'&&s.expenses[1].amount===100,'expense categories are merged and sorted');
near(s.pct(s.materials),35,'materials are 35٪ of the net sales');near(s.months[1].margin,m2.profit/2000*100,'margin of a month');
ok(s.months[0].flags.length===0&&s.months[1].flags.length===2&&s.flagged===1&&!s.complete,'month 2 is flagged (no count, payroll before start)');
const z=RC.sumPnl([{k:'1405/05',r:m0},{k:'1405/06',r:m1}]);ok(z.months[0].noSales&&z.withSales===1&&z.flagged===1,'a month without sales is counted as incomplete');
ok(RC.sumPnl([{k:'1405/06',r:m1}]).complete,'one complete month is complete');ok(RC.sumPnl([]).sales===0&&RC.sumPnl([]).pct(5)===null,'empty period');

/* ---------- item sales of each month ---------- */
// model of the engine: pizza (2 × cheese of 10 → 20, from 1405/07/16 cheese costs 15 → 30), tea (no recipe)
const cheese={id:'C'},M={ing:new Map([['C',cheese]]),recipeAt:id=>id==='PZ'?[{ingredientId:'C',q:2}]:[],recipeDeducts:()=>true,gross:(i,rl,n)=>rl.q*n,costAt:(id,day)=>day>='1405/07/16'?15:10,
 sales:[{a:E.CAL.i('1405/06/01'),b:E.CAL.i('1405/06/31'),lines:[{menuItemId:'PZ',quantity:310,saleAmountToman:31000,sourceName:'پیتزا'},{menuItemId:'TEA',quantity:62,saleAmountToman:620,sourceName:'چای'}]},
  // 20 days: 10 in Shahrivar? no — 1405/07/11 … 1405/07/30 (all in Mehr), half before the price change
  {a:E.CAL.i('1405/07/11'),b:E.CAL.i('1405/07/30'),lines:[{menuItemId:'PZ',quantity:200,saleAmountToman:24000}]},
  // a file over the month border: 1405/07/29 … 1405/08/02 (2 days in Mehr, 2 in Aban; Mehr has 30 days)
  {a:E.CAL.i('1405/07/29'),b:E.CAL.i('1405/08/02'),lines:[{menuItemId:'TEA',quantity:40,saleAmountToman:400}]},
  {a:E.CAL.i('1405/08/05'),b:E.CAL.i('1405/08/05'),lines:[{menuItemId:'PZ',quantity:7,saleAmountToman:900,date:'1405/08/06'}]}]};
const keys=['1405/05','1405/06','1405/07','1405/08'],sm=RC.salesMonths(M,E,keys),pz=sm.items.get('PZ'),tea=sm.items.get('TEA');
near(pz.qty['1405/06'],310,'pizza of Shahrivar');near(pz.cost['1405/06'],310*20,'pizza cost of Shahrivar (recipe × cost)');near(pz.qty['1405/07'],200,'pizza of Mehr');
near(pz.cost['1405/07'],50*20+150*30,'pizza cost follows the cost of each day');ok(!pz.noCost&&tea.noCost,'an item without a recipe is marked noCost');
near(tea.qty['1405/07'],40*2/4,'file over the border: 2 of 4 days in Mehr',1e-9);near(tea.qty['1405/08'],20,'… and 2 days in Aban',1e-9);near(tea.amt['1405/07']+tea.amt['1405/08'],400,'amount is split, not lost');
near(pz.qty['1405/08'],7,'a line with its own date');ok(sm.days['1405/05']===0&&sm.days['1405/06']===31&&sm.days['1405/07']===20&&sm.days['1405/08']===3,'days covered by sales files: '+JSON.stringify(sm.days));
ok(pz.name==='پیتزا','source name is kept');

/* ---------- report groups ---------- */
const G={'پیش غذا':'kitchen','سالاد':'kitchen','پیتزا':'kitchen','پاستا':'kitchen','ساندویچ':'kitchen','غذای اصلی':'kitchen','صبحانه':'kitchen','پیشنهاد ویژه':'kitchen','جونیور':'kitchen',
 'پایه اسپرسو':'bar','قهوه دمی':'bar','دمنوش و چای':'bar','سایر نوشیدنیهای گرم':'bar','سردنوش':'bar','ماکتیل':'bar','اسموتی':'bar','شیک':'bar','میوه و آب میوه فصل':'bar',
 'نوشیدنیهای سرد':'cold','نوشیدنی‌های سرد':'cold','کیک و دسر':'dessert','منوی قلیان':'hookah','سرویس':'other','ایتم تکمیلی':'other','':'other'};
for(const [c,g] of Object.entries(G))ok(RC.groupOf(c)===g,`group of «${c}» → ${RC.groupOf(c)} (expected ${g})`);
ok(RC.groupOf('نوشيدني هاي سرد')==='cold','Arabic letters are normalised');ok(RC.GROUPS.length===6&&RC.GROUPS.at(-1).id==='other','six groups, «سایر» last');

/* ---------- totals and series ---------- */
const menu=new Map([['PZ',{id:'PZ',name:'پیتزا مخصوص',category:'پیتزا'}],['TEA',{id:'TEA',name:'چای',category:'دمنوش و چای'}]]),sum=RC.salesSummary(sm,menu,['1405/06','1405/07']);
near(sum.qty,310+62+200+20,'total count of two months');near(sum.amt,31000+620+24000+200,'total amount of two months');ok(sum.groups.length===2&&sum.groups.find(g=>g.id==='kitchen').qty===510,'kitchen total');
ok(sum.rows[0].id==='PZ'&&sum.rows[0].name==='پیتزا مخصوص'&&sum.rows[0].category==='پیتزا'&&sum.rows[1].noCost,'rows sorted by count, names from the menu');
near(sum.groups.find(g=>g.id==='bar').byMonth['1405/07'].qty,20,'group by month');ok(sum.groups.find(g=>g.id==='bar').cats[0].name==='دمنوش و چای','categories of a group');
ok(RC.salesSummary(sm,menu,['1405/05']).groups.length===0,'a month without sales files has no groups');
const eg=RC.entitySeries(sm,menu,'g:kitchen',keys),ei=RC.entitySeries(sm,menu,'i:TEA',keys),ea=RC.entitySeries(sm,menu,'all',keys),ec=RC.entitySeries(sm,menu,'c:پیتزا',keys);
ok(eg.qty.join()==='0,310,200,7'&&ec.qty.join()===eg.qty.join(),'series of a group and of its category');near(eg.gross[1],31000-6200,'gross material profit = amount − cost');
near(ei.qty[2],20,'series of an item',1e-9);ok(ei.noCost&&!eg.noCost&&ea.noCost,'noCost follows the items of the entity');near(ea.qty[1],372,'series of the whole menu');ok(ea.items===2&&eg.items===1,'number of items of an entity');

/* ---------- salary of a period ---------- */
const fixed={type:'fixedMonthly',monthlySalary:30000000,monthlyShifts:30,hoursPerShift:8};
const hr={settings:{payrollStartYear:1405,payrollStartMonth:7,overtimeFactor:1.4},personnel:[
 {id:'F',name:'ثابت',status:'فعال',personnelGroup:'سالن',startDate:'1405/01/01',salaryContract:fixed},
 {id:'H',name:'ساعتی',status:'فعال',personnelGroup:'آشپزخانه',startDate:'1405/01/01',hourlyRate:100000,salaryContract:{type:'hourly',monthlyHours:200}},
 {id:'M',name:'مدیر',status:'فعال',section:'مدیریت',startDate:'1405/08/11',salaryContract:{type:'fixedMonthly',monthlySalary:60000000}},
 {id:'X',name:'رفته',status:'اتمام همکاری',personnelGroup:'سالن',startDate:'1405/01/01',employmentEndDate:'1405/07/15',salaryContract:fixed},
 {id:'Q',name:'بی‌قرارداد',status:'فعال',startDate:'1405/01/01'}],
 monthlyAdjustments:[{id:'A1',personnelId:'H',year:1405,month:7,hoursOverride:150}],
 penaltiesRewards:[{id:'P1',personnelId:'F',type:'جریمه',amount:500000,status:'تاییدشده',year:1405,month:7,date:'1405/07/10'}],
 payments:[{id:'PAY1',personnelId:'F',type:'مساعده',amount:5000000,salaryYear:1405,salaryMonth:7,date:'1405/07/15'}],
 tipGroups:[{id:'T1',receiveDate:'1405/07/05',totalAmount:300000,participants:[{personnelId:'F',weight:1}]},{id:'T2',receiveDate:'1405/07/06',totalAmount:999,status:'ابطال‌شده',participants:[]},{id:'T3',receiveDate:'1405/06/20',totalAmount:70000,participants:[]}],payrollClosures:[]};
const pp=RC.payrollPeriod(PC,hr,['1405/06','1405/07','1405/08','1405/09'],'1405/08/18'),mm=k=>pp.months.find(x=>x.k===k);
ok(mm('1405/06').state==='before'&&mm('1405/09').state==='future'&&mm('1405/07').state==='open'&&mm('1405/08').state==='current'&&pp.counted===2,'month states and counted months');
ok(mm('1405/06').people===0&&mm('1405/06').tips===70000,'a month before the start has tips but no salary');near(mm('1405/07').tips,300000,'voided tips are left out');
const direct=PC.monthSummary(hr,1405,7);near(mm('1405/07').net,direct.net,'net of a month equals PayrollCore.monthSummary');ok(mm('1405/07').people===direct.people,'people of a month');
near(mm('1405/07').base,30000000+15000000+15000000,'base: fixed + 150 hours + half a month of the one who left');near(mm('1405/07').deductions,500000,'deductions of the month');near(mm('1405/07').advance,5000000,'advance of the month');
near(pp.total.net,mm('1405/07').net+mm('1405/08').net,'period net is the sum of the counted months');near(pp.total.tips,370000,'period tips');
ok(mm('1405/07').hourly===1&&mm('1405/07').fixed===2,'hourly and fixed head count');near(mm('1405/07').groups['سالن'],30000000-500000+15000000,'group of the month (personnelGroup)');
ok(pp.groups[0].name==='سالن'&&pp.groups.some(g=>g.name==='مدیریت')&&pp.groups.some(g=>g.name==='سایر'),'groups: personnelGroup, then section, then «سایر»');
const pf=pp.people.find(x=>x.id==='F');ok(pf.months===2&&pf.advance===5000000&&pf.net===59500000,'a person over the period');ok(pp.people[0].net>=pp.people.at(-1).net,'people sorted by net');
near(pp.avgPeople,(mm('1405/07').people+mm('1405/08').people)/2,'average head count');
ok(RC.payrollPeriod(PC,hr,['1405/05'],'1405/08/18').counted===0,'a period before the start month has nothing');

const fc=RC.payrollForecast(PC,hr,1405,9),row=id=>fc.rows.find(r=>r.id===id);
ok(fc.rows.length===4&&!row('X'),'forecast is for the people who are active now');near(row('F').amount,30000000,'fixed forecast');near(row('H').amount,100000*200,'hourly forecast = rate × contract hours');
ok(row('H').hours===200&&row('H').hourly===100000&&row('F').hourly===0,'rate and hours are shown for hourly staff only');ok(row('M').isNew&&!row('F').isNew,'someone who started in the month before is new');
near(fc.total,30000000+20000000+60000000,'forecast total');near(fc.fixed,90000000,'fixed part');near(fc.hourly,20000000,'hourly part');ok(fc.nFixed===2&&fc.nHourly===1&&fc.noContract===1,'counts by contract');
ok(fc.groups[0].name==='مدیریت'&&fc.rows[0].id==='M','forecast sorted by amount');
near(RC.payrollForecast(PC,hr,1405,8).rows.find(r=>r.id==='M').amount,60000000*20/30,'forecast is prorated by the days employed');

console.log(`qa_template_reports: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
