'use strict';
// QA for: hourly-staff "estimated monthly hours" payroll forecast (js/00-base.js: adjFor/calcPayrollLive/editMonthlyAdjustment/monthMetrics).
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const near=(a,b,msg='')=>assert(Math.abs(a-b)<1e-6,`${a} != ${b} ${msg}`);

function baseState(overrides={}){
 return {
  personnel:[{id:'P1',name:'تست ساعتی',status:'فعال',hourlyRate:100000,salaryContract:{type:'hourly',monthlySalary:0},insurance:'ندارد',fixedAllowance:0,transportMonthly:0,monthlyCredit:0,mealCredit:0},
             {id:'P2',name:'تست ثابت',status:'فعال',hourlyRate:0,salaryContract:{type:'fixedMonthly',monthlySalary:20000000},insurance:'ندارد',fixedAllowance:0,transportMonthly:0,monthlyCredit:0,mealCredit:0}],
  monthlyAdjustments:[],shiftRecords:[],delays:[],payments:[],consumptions:[],penaltiesRewards:[],tipGroups:[],payrollClosures:[],changeLog:[],
  settings:{baseHourlyRate:0,defaultTransport:0,defaultMonthlyCredit:0,defaultMealCredit:0,employeeInsuranceRate:0.07,tomanToRial:10},
  ...overrides
 };
}
function setup(){
 let code=fs.readFileSync('js/00-base.js','utf8').replace(/\ninit\(\);\s*$/,'\n');
 const context={console,setTimeout,clearTimeout,Date,Math,JSON,structuredClone,Intl,URL,URLSearchParams,
  document:{readyState:'complete',getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>({}),addEventListener(){},body:{},documentElement:{}},
  window:null,location:{pathname:'/personnel.html',search:''},navigator:{},
  sessionStorage:{getItem:()=>null,setItem(){},removeItem(){}},
  localStorage:{getItem:()=>null,setItem(){},removeItem(){}},
  StorageAdapter:{load:async()=>({})},RAYO_API_GATEWAY:{getModuleStatus:()=>({initialized:true})}
 };
 context.window=context;vm.createContext(context);
 vm.runInContext(code,context);
 return context;
}
function setState(ctx,state){ctx.__fixture=state;vm.runInContext('state=__fixture;',ctx);}
function calc(ctx,pid,y,m){return vm.runInContext(`calcPayrollLive(state.personnel.find(p=>p.id==='${pid}'),${y},${m},{})`,ctx);}
function metrics(ctx,y,m){return vm.runInContext(`monthMetrics(${y},${m})`,ctx);}

let tests=0;const pending=[];function test(name,run){const r=run();if(r&&typeof r.then==='function'){pending.push(r.then(()=>{tests++;console.log('PASS '+name)}));return}tests++;console.log('PASS '+name)}

(()=>{
 test('base test: 100,000 toman rate x 180.5 estimated hours = 18,050,000 base wage; other components computed as usual',()=>{
  const ctx=setup(),state=baseState({monthlyAdjustments:[{personnelId:'P1',year:1405,month:6,hoursOverride:'',estimatedHours:'180.5',overtimePerformance:5000,otherPayment:0,otherDeduction:0,notes:''}]});
  setState(ctx,state);
  const row=calc(ctx,'P1',1405,6);
  near(row.wage,18050000);near(row.hours,180.5);assert.equal(row.usedEstimatedHours,true);assert.equal(row.hoursIncomplete,false);
  near(row.gross,18050000+5000,'other components (overtime here) still add on top, unchanged rule');
 });
 test('different months are independent: month 7 has no estimate and no data => incomplete, month 6 unaffected',()=>{
  const ctx=setup(),state=baseState({monthlyAdjustments:[{personnelId:'P1',year:1405,month:6,hoursOverride:'',estimatedHours:'150',overtimePerformance:0,otherPayment:0,otherDeduction:0,notes:''}]});
  setState(ctx,state);
  const june=calc(ctx,'P1',1405,6),july=calc(ctx,'P1',1405,7);
  near(june.wage,15000000);assert.equal(june.usedEstimatedHours,true);
  near(july.wage,0);assert.equal(july.hoursIncomplete,true,'month 7 has no shift records, no override and no estimate of its own');
 });
 test('explicit zero estimated hours differs from blank: zero is a valid forecast, blank is incomplete',()=>{
  const ctxZero=setup(),ctxBlank=setup();
  setState(ctxZero,baseState({monthlyAdjustments:[{personnelId:'P1',year:1405,month:6,hoursOverride:'',estimatedHours:'0',overtimePerformance:0,otherPayment:0,otherDeduction:0,notes:''}]}));
  setState(ctxBlank,baseState({monthlyAdjustments:[{personnelId:'P1',year:1405,month:6,hoursOverride:'',estimatedHours:'',overtimePerformance:0,otherPayment:0,otherDeduction:0,notes:''}]}));
  const zeroRow=calc(ctxZero,'P1',1405,6),blankRow=calc(ctxBlank,'P1',1405,6);
  near(zeroRow.hours,0);assert.equal(zeroRow.usedEstimatedHours,true,'explicit 0 is a real forecast basis');assert.equal(zeroRow.hoursIncomplete,false);
  near(blankRow.hours,0);assert.equal(blankRow.usedEstimatedHours,false);assert.equal(blankRow.hoursIncomplete,true,'blank means no valid basis, not a silent zero');
 });
 test('decimal estimated hours are honored exactly',()=>{
  const ctx=setup();setState(ctx,baseState({monthlyAdjustments:[{personnelId:'P1',year:1405,month:6,hoursOverride:'',estimatedHours:'42.75',overtimePerformance:0,otherPayment:0,otherDeduction:0,notes:''}]}));
  near(calc(ctx,'P1',1405,6).hours,42.75);
 });
 test('fixed-monthly personnel and final settlement basis are unaffected by estimatedHours',()=>{
  const ctx=setup();setState(ctx,baseState({monthlyAdjustments:[{personnelId:'P2',year:1405,month:6,hoursOverride:'',estimatedHours:'999',overtimePerformance:0,otherPayment:0,otherDeduction:0,notes:''}]}));
  const row=calc(ctx,'P2',1405,6);
  near(row.wage,20000000,'fixed monthly salary, never multiplied by hours');
  assert.equal(row.usedEstimatedHours,false);assert.equal(row.hoursIncomplete,false,'fixed contract is never flagged incomplete regardless of hours fields');
 });
 test('manual hoursOverride (real correction) always outranks an estimate',()=>{
  const ctx=setup();setState(ctx,baseState({monthlyAdjustments:[{personnelId:'P1',year:1405,month:6,hoursOverride:'160',estimatedHours:'999',overtimePerformance:0,otherPayment:0,otherDeduction:0,notes:''}]}));
  const row=calc(ctx,'P1',1405,6);
  near(row.hours,160);assert.equal(row.usedEstimatedHours,false,'override present means the estimate is not what was actually used');
 });
 test('real shift records always outrank an estimate, never replaced by it',()=>{
  const ctx=setup();setState(ctx,baseState({
   shiftRecords:[{id:'S1',personnelId:'P1',date:'1405/06/05',status:'انجام‌شده',scheduledHours:8,actualHours:8}],
   monthlyAdjustments:[{personnelId:'P1',year:1405,month:6,hoursOverride:'',estimatedHours:'999',overtimePerformance:0,otherPayment:0,otherDeduction:0,notes:''}]
  }));
  const row=calc(ctx,'P1',1405,6);
  near(row.hours,8);assert.equal(row.usedEstimatedHours,false,'real attendance data is never overridden by an estimate');
 });
 test('estimated hours create no attendance, payroll-closure, debt or payment record',()=>{
  const ctx=setup(),state=baseState({monthlyAdjustments:[{personnelId:'P1',year:1405,month:6,hoursOverride:'',estimatedHours:'180.5',overtimePerformance:0,otherPayment:0,otherDeduction:0,notes:''}]});
  setState(ctx,state);
  calc(ctx,'P1',1405,6);
  assert.equal(state.shiftRecords.length,0);assert.equal(state.payments.length,0);assert.equal(state.payrollClosures.length,0);assert.equal(state.delays.length,0);
 });
 test('monthMetrics aggregates net pay including the estimate and reports the incomplete-forecast count',()=>{
  const ctx=setup(),state=baseState({monthlyAdjustments:[{personnelId:'P1',year:1405,month:6,hoursOverride:'',estimatedHours:'180.5',overtimePerformance:0,otherPayment:0,otherDeduction:0,notes:''}]});
  setState(ctx,state);
  const m=metrics(ctx,1405,6);
  near(m.net,18050000+20000000,'both the hourly forecast and the fixed salary are included in the shared total');
  assert.equal(m.incompleteCount,0,'P1 has an estimate and P2 is fixed-contract, so nothing is incomplete this month');
  const m7=metrics(ctx,1405,7);
  assert.equal(m7.incompleteCount,1,'month 7 has neither shift records nor an estimate for P1');
 });

 const adj=(o)=>({personnelId:'P1',year:1405,month:6,hoursOverride:'',overtimeHours:'',estimatedHours:'',overtimePerformance:0,otherPayment:0,otherDeduction:0,notes:'',...o});
 const withSettings=(ctx,o)=>{ctx.__s=o;vm.runInContext('Object.assign(state.settings,__s)',ctx)};
 test('attendance hours: 110h with 10 overtime at factor 1.4 = 100h normal + 10h at 40% extra; overtime is not added on top',()=>{
  const ctx=setup();setState(ctx,baseState({monthlyAdjustments:[adj({hoursOverride:'110',overtimeHours:'10'})]}));withSettings(ctx,{overtimeFactor:1.4});
  const row=calc(ctx,'P1',1405,6);
  near(row.wage,100*100000+10*140000);near(row.hours,110);near(row.overtimeHours,10);near(row.regularHours,100);near(row.overtimePay,1400000);
  assert.equal(row.hoursSource,'attendance');
 });
 test('delay is display-only by default: not deducted from wage',()=>{
  const ctx=setup(),st=baseState({monthlyAdjustments:[adj({hoursOverride:'100'})],delays:[{id:'D1',personnelId:'P1',year:1405,month:6,scheduledTime:'09:00',actualTime:'10:00'}]});
  setState(ctx,st);const row=calc(ctx,'P1',1405,6);
  near(row.wage,10000000);assert.ok(row.delayHours>0,'delay still reported for the payslip');near(row.delayDeduction,0);
 });
 test('delay deduction enabled: delayHours x hourly x factor is deducted',()=>{
  const ctx=setup(),st=baseState({monthlyAdjustments:[adj({hoursOverride:'100'})],delays:[{id:'D1',personnelId:'P1',year:1405,month:6,scheduledTime:'09:00',actualTime:'10:00'}]});
  setState(ctx,st);withSettings(ctx,{delayDeductionEnabled:1,delayDeductionFactor:2});
  const row=calc(ctx,'P1',1405,6);
  near(row.delayDeduction,row.delayHours*100000*2);near(row.wage,10000000-row.delayDeduction);
 });
 test('fixed-monthly: worked hours are display-only; without an hourly basis overtime adds nothing and delay is never deducted',()=>{
  const ctx=setup();setState(ctx,baseState({monthlyAdjustments:[adj({personnelId:'P2',hoursOverride:'200',overtimeHours:'20'})]}));withSettings(ctx,{overtimeFactor:1.4,delayDeductionEnabled:1});
  const row=calc(ctx,'P2',1405,6);
  near(row.wage,20000000);near(row.hours,200);near(row.overtimeHours,20);near(row.overtimePay,0);near(row.delayDeduction,0);
 });
 test('fixed-monthly: 20,000,000 for 25 shifts x 8h => 100,000/h basis; 10h overtime at 1.4 adds 1,400,000, 5h undertime deducts 500,000',()=>{
  const ctx=setup(),st=baseState({monthlyAdjustments:[adj({personnelId:'P2',hoursOverride:'150',overtimeHours:'10',undertimeHours:'5'})]});
  st.personnel[1].salaryContract={type:'fixedMonthly',monthlySalary:20000000,monthlyShifts:25,hoursPerShift:8};setState(ctx,st);withSettings(ctx,{overtimeFactor:1.4});
  const row=calc(ctx,'P2',1405,6);
  near(row.hourly,100000,'contract hourly basis, not personnel.hourlyRate');near(row.overtimePay,1400000);near(row.undertimeDeduction,500000);
  near(row.wage,20000000+1400000-500000);near(row.hours,150,'hours still shown on the payslip');
 });
 test('fixed-monthly: a stored approximateHourly outranks shifts x hours; hourlyRate is the last fallback',()=>{
  const ctx=setup(),st=baseState({monthlyAdjustments:[adj({personnelId:'P2',overtimeHours:'2'})]});
  st.personnel[1].salaryContract={type:'fixedMonthly',monthlySalary:20000000,monthlyShifts:25,hoursPerShift:8,approximateHourly:120000};setState(ctx,st);
  near(calc(ctx,'P2',1405,6).overtimePay,2*120000);
  const c2=setup(),s2=baseState({monthlyAdjustments:[adj({personnelId:'P2',overtimeHours:'2'})]});s2.personnel[1].hourlyRate=90000;setState(c2,s2);
  near(calc(c2,'P2',1405,6).overtimePay,2*90000);
 });
 test('unused menu credit is never paid out: 2,000,000 credit, nothing used => net unchanged, shown only as information',()=>{
  const ctx=setup(),st=baseState({monthlyAdjustments:[adj({hoursOverride:'100'})]});st.personnel[0].monthlyCredit=2000000;st.lists={months:['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند']};setState(ctx,st);
  const row=calc(ctx,'P1',1405,6);near(row.creditRemaining,2000000);near(row.creditDeduction,0);near(row.gross,10000000);near(row.netToman,10000000);
  vm.runInContext("ui.payroll={year:1405,month:6}",ctx);const line=vm.runInContext("payrollDetailModel('P1').sections.find(s=>s.title==='اعتبار منو').lines.find(l=>l.label==='اعتبار استفاده‌نشده')",ctx);
  assert.equal(line.effect,'i');assert.ok(line.note.includes('اضافه نمی‌شود'));
 });
 test('return aid entered for more shifts than recorded is paid as entered but flagged; detail export carries no bank data',()=>{
  const ctx=setup(),st=baseState({monthlyAdjustments:[adj({returnCount:1})]});st.personnel[0].salaryProfile={returnAid:300000};st.personnel[0].iban='IR999';st.personnel[0].cardNumber='6037111';st.lists={months:['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند']};setState(ctx,st);
  vm.runInContext("ui.payroll={year:1405,month:6}",ctx);const d=vm.runInContext("payrollDetailModel('P1')",ctx);
  near(d.row.returnAidAmount,300000);assert.equal(d.worked,0);assert.ok(d.warnings.some(w=>w.includes('هیچ شیفتی')));
  const data=JSON.stringify(vm.runInContext("payrollDetailExportData(payrollDetailModel('P1'))",ctx));assert.ok(!data.includes('IR999')&&!data.includes('6037111'));
 });
 test('transport: agreement amount, else settings default; «رفت‌وآمد ندارد» means none even with a default; source is reported',()=>{
  const mk=(p)=>{const ctx=setup(),st=baseState({monthlyAdjustments:[adj({hoursOverride:'100'})],settings:{...baseState().settings,defaultTransport:300000}});Object.assign(st.personnel[0],p);setState(ctx,st);return calc(ctx,'P1',1405,6)};
  let r=mk({transportMonthly:0});near(r.transport,300000);assert.equal(r.transportSource,'default');
  r=mk({transportMonthly:500000});near(r.transport,500000);assert.equal(r.transportSource,'agreement');
  r=mk({transportMonthly:0,noTransport:true});near(r.transport,0);assert.equal(r.transportSource,'none');near(r.gross,10000000);
 });
 const tipGroup=(o={})=>({id:'G1',receiveDate:'1405/06/10',totalAmount:1823260,status:'ثبت‌شده',participants:[{personnelId:'P1',weight:1}],...o});
 test('tip shares round down to 5,000 for groups saved with a step (1,823,260 -> 1,820,000); older groups stay exact',()=>{
  const ctx=setup();setState(ctx,baseState({tipGroups:[tipGroup({shareRoundingStep:5000}),tipGroup({id:'G2',totalAmount:1000003})]}));
  near(vm.runInContext("tipShares(state.tipGroups[0])[0].amount",ctx),1820000);near(vm.runInContext("tipRoundingRemainder(state.tipGroups[0])",ctx),3260);
  near(vm.runInContext("tipShares(state.tipGroups[1])[0].amount",ctx),1000003,'no step => unchanged');
  const two=setup();setState(two,baseState({tipGroups:[tipGroup({shareRoundingStep:5000,totalAmount:1000000,participants:[{personnelId:'P1',weight:1},{personnelId:'P2',weight:2}]})]}));
  const s=vm.runInContext("tipShares(state.tipGroups[0]).map(x=>x.amount)",two);near(s[0],330000);near(s[1],665000);
 });
 test('tips paid through «تسویه انعام» count as paid in payroll (linked allocations and legacy settled groups)',()=>{
  const ctx=setup();setState(ctx,baseState({monthlyAdjustments:[adj({hoursOverride:'0'})],tipGroups:[tipGroup({totalAmount:1000000})],payments:[{id:'TP1',personnelId:'P1',tipSettlement:true,status:'پرداخت‌شده',amount:995000,tipAllocations:[{tipGroupId:'G1',tipShareId:'G1:P1',paidAmount:995000,roundingAdjustment:5000}]}]}));
  let r=calc(ctx,'P1',1405,6);near(r.tips,1000000);near(r.tipsSettled,1000000);near(r.unpaid,0);assert.equal(r.status,'تسویه‌شده');
  const legacy=setup();setState(legacy,baseState({monthlyAdjustments:[adj({hoursOverride:'0'})],tipGroups:[tipGroup({totalAmount:600000,status:'تسویه‌شده',settledAmount:0})]}));r=calc(legacy,'P1',1405,6);near(r.tipsSettled,600000);near(r.unpaid,0);
  const open=setup();setState(open,baseState({monthlyAdjustments:[adj({hoursOverride:'0'})],tipGroups:[tipGroup({totalAmount:600000})]}));near(calc(open,'P1',1405,6).unpaid,600000,'unpaid tips still owed');
 });
 test('month settlement: one record zeroes every balance, nothing carries to next month; later additions show only the difference; void restores',()=>{
  const ctx=setup(),st=baseState({monthlyAdjustments:[adj({hoursOverride:'10'})],tipGroups:[tipGroup({totalAmount:500000})]});setState(ctx,st);
  const before=calc(ctx,'P1',1405,6);near(before.unpaid,1000000+500000);
  st.monthlySettlements=[{id:'MSET-0001',year:1405,month:6,status:'active',notes:'تسویه کامل بدون ثبت تاریخ',rows:[{personnelId:'P1',amount:before.unpaid}],total:before.unpaid}];
  let r=calc(ctx,'P1',1405,6);near(r.monthSettled,1500000);near(r.unpaid,0);assert.equal(r.status,'تسویه‌شده');
  near(calc(ctx,'P1',1405,7).previousBalance,0,'nothing carried into Mehr');
  st.tipGroups.push(tipGroup({id:'G9',totalAmount:200000}));near(calc(ctx,'P1',1405,6).unpaid,200000,'a tip added later is the only balance');
  st.monthlySettlements[0].status='void';near(calc(ctx,'P1',1405,6).unpaid,1700000);
 });
 test('month settlement also applies to a finalized (closed) month',()=>{
  const ctx=setup(),st=baseState({payrollClosures:[{id:'PCL-1',year:1405,month:6,active:true,rows:[{personnelId:'P1',unpaid:800000,advance:0,paid:0,netToman:800000}]}],monthlySettlements:[{id:'MSET-0001',year:1405,month:6,status:'active',rows:[{personnelId:'P1',amount:800000}],total:800000}]});setState(ctx,st);
  const r=vm.runInContext("payrollRowsForPeriod(1405,6)[0]",ctx);near(r.unpaid,0);near(r.monthSettled,800000);
 });
 const entryModal=(ctx,pid,values)=>{const els={},toasts=[];ctx.__toasts=toasts;const make=id=>els[id]||(els[id]={id,innerHTML:'',textContent:'',value:'',disabled:false,classList:{add(){},remove(){},contains:()=>true},insertAdjacentHTML(){},closest:()=>null});
  ctx.document.getElementById=id=>{if(!id.startsWith('pe_'))return make(id);return new RegExp(`id="${id}"`).test(els.modalBody?.innerHTML||'')?make(id):null};
  vm.runInContext("ui.payroll={year:1405,month:6,personnelId:'',status:'',employmentStatus:'فعال'};commit=async()=>{};closeModal=function(){};toast=function(m,e){__toasts.push((e?'ERR ':'')+m)};confirm=()=>true;",ctx);
  vm.runInContext(`editMonthlyAdjustment('${pid}')`,ctx);Object.entries(values).forEach(([k,v])=>{const e=ctx.document.getElementById('pe_'+k);assert.ok(e,`field ${k} is in the form`);e.value=v});return vm.runInContext('savePayrollEntry()',ctx)};
 test('entry modal: saving only the worked hours succeeds even though hidden fields (missed shifts, meals, return) have no value',async()=>{
  const ctx=setup(),st=baseState({lists:{months:['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند']}});st.leaves=[];setState(ctx,st);
  await entryModal(ctx,'P1',{hoursOverride:'120'});
  assert.deepEqual(ctx.__toasts.filter(t=>t.startsWith('ERR')),[]);const a=st.monthlyAdjustments.find(x=>x.personnelId==='P1');assert.equal(a.hoursOverride,120);assert.equal(a.missedShifts,undefined,'hidden field left untouched');
 });
 test('entry modal: values stored as text by bulk entry do not block a later single-field save',async()=>{
  const ctx=setup(),st=baseState({lists:{months:['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند']},monthlyAdjustments:[adj({missedShifts:'2',mealCount:'3',returnCount:'1'})]});st.leaves=[];setState(ctx,st);
  await entryModal(ctx,'P1',{hoursOverride:'90'});assert.deepEqual(ctx.__toasts.filter(t=>t.startsWith('ERR')),[]);near(Number(st.monthlyAdjustments[0].hoursOverride),90);
 });
 test('payslip tab: employment-status filter defaults to active and only lists matching people',()=>{
  const ctx=setup(),st=baseState({lists:{months:['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند']}});st.personnel.push({id:'P9',name:'رفته',status:'اتمام همکاری',hourlyRate:1,salaryContract:{type:'hourly'}});setState(ctx,st);
  vm.runInContext("ui.payslip={year:1405,month:6,personnelId:'P9'}",ctx);let h=vm.runInContext('viewsPayslip()',ctx);
  assert.ok(h.includes('وضعیت پرسنل'));assert.ok(!h.includes('P9 | رفته'),'inactive hidden by default');assert.equal(vm.runInContext('ui.payslip.personnelId',ctx),'P1','selection moves to the first active person');
  vm.runInContext("ui.payslip.employmentStatus='همه'",ctx);h=vm.runInContext('viewsPayslip()',ctx);assert.ok(h.includes('P9 | رفته'));
 });
 const shiftFixed=(st)=>{st.personnel[1].salaryContract={type:'fixedMonthly',shiftBased:true,monthlySalary:45000000,weeklyShifts:10,hoursPerShift:8};return st};
 test('fixed per shifts: 45,000,000 for 10 shifts/week; Mehr (30 days) = 42.857 shifts => 1,050,000 per shift, 131,250 per hour',()=>{
  const ctx=setup();setState(ctx,shiftFixed(baseState({monthlyAdjustments:[adj({personnelId:'P2',month:7,missedShifts:'2'})],delays:[{id:'D1',personnelId:'P2',year:1405,month:7,date:'1405/07/03',scheduledTime:'09:00',actualTime:'10:00'}]})));
  const row=calc(ctx,'P2',1405,7);
  assert.equal(row.shiftBased,true);near(row.expectedShifts,300/7);near(row.shiftRate,1050000);near(row.hourly,131250);
  near(row.missedDeduction,2*1050000);near(row.delayDeduction,131250,'delay always counts as undertime for this contract, even with delay deduction disabled');
  near(row.wage,45000000-2100000-131250);
 });
 test('fixed per shifts: the rate follows the month length (31-day month => more shifts, cheaper shift); no absence => full salary',()=>{
  const ctx=setup();setState(ctx,shiftFixed(baseState({monthlyAdjustments:[adj({personnelId:'P2',month:1,missedShifts:'1'})]})));
  const r1=calc(ctx,'P2',1405,1);near(r1.expectedShifts,310/7);near(r1.missedDeduction,45000000/(310/7));
  near(calc(ctx,'P2',1405,2).wage,45000000,'month without entries pays the full fixed salary');
 });
 test('fixed per shifts: undertime and overtime use the month hour rate; missed shifts are capped at the contract shifts',()=>{
  const ctx=setup();setState(ctx,shiftFixed(baseState({monthlyAdjustments:[adj({personnelId:'P2',month:7,undertimeHours:'4',overtimeHours:'2',missedShifts:'999'})]})));withSettings(ctx,{overtimeFactor:1.4});
  const row=calc(ctx,'P2',1405,7);near(row.undertimeDeduction,4*131250);near(row.overtimePay,2*131250*1.4);near(row.missedShifts,300/7);near(row.wage,0,'never negative');
 });
 test('plain fixed-monthly (no shift basis) is unchanged: missed shifts ignored, delay not deducted',()=>{
  const ctx=setup();setState(ctx,baseState({monthlyAdjustments:[adj({personnelId:'P2',month:7,missedShifts:'3'})],delays:[{id:'D1',personnelId:'P2',year:1405,month:7,date:'1405/07/03',scheduledTime:'09:00',actualTime:'10:00'}]}));
  const row=calc(ctx,'P2',1405,7);near(row.wage,20000000);near(row.missedDeduction,0);near(row.delayDeduction,0);assert.equal(row.shiftBased,false);
 });
 test('fixed per shifts: forecast uses the month contract shifts; delay page shows the deduction at the month hour rate',()=>{
  const ctx=setup(),st=shiftFixed(baseState({delays:[{id:'D1',personnelId:'P2',year:1405,month:7,date:'1405/07/03',scheduledTime:'09:00',actualTime:'09:30'}]}));setState(ctx,st);
  const f=vm.runInContext(`hrForecastPerson(state.personnel[1],state,1405,7)`,ctx);near(f.shifts,300/7);near(f.hours,300/7*8);near(f.wage,45000000);near(f.hourly,131250);
  near(vm.runInContext(`calcDelay(state.delays[0]).deduction`,ctx),0.5*131250);
 });
 test('hourly: undertime hours are deducted at the hourly rate; zero/blank undertime changes nothing',()=>{
  const ctx=setup();setState(ctx,baseState({monthlyAdjustments:[adj({hoursOverride:'100',undertimeHours:'5'})]}));
  const row=calc(ctx,'P1',1405,6);near(row.undertimeDeduction,500000);near(row.wage,9500000);near(row.undertimeHours,5);
  const c2=setup();setState(c2,baseState({monthlyAdjustments:[adj({hoursOverride:'100'})]}));near(calc(c2,'P1',1405,6).wage,10000000);
 });
 test('overtime hours are capped at total hours and hoursSource reports shifts/estimated/none',()=>{
  const ctx=setup();setState(ctx,baseState({monthlyAdjustments:[adj({hoursOverride:'5',overtimeHours:'9'})]}));withSettings(ctx,{overtimeFactor:1.5});
  const row=calc(ctx,'P1',1405,6);near(row.overtimeHours,5);near(row.wage,5*150000);
  const c2=setup();setState(c2,baseState({monthlyAdjustments:[adj({estimatedHours:'10'})]}));assert.equal(calc(c2,'P1',1405,6).hoursSource,'estimated');
  assert.equal(calc(c2,'P1',1405,7).hoursSource,'none');
 });

 test('menu credit: 1,000,000 limit, 3,000,000 used, 20% discount => 2,000,000 excess x 0.8 = 1,600,000 deducted',()=>{
  const ctx=setup(),st=baseState({monthlyAdjustments:[adj({hoursOverride:'100'})],consumptions:[{id:'C1',personnelId:'P1',year:1405,month:6,type:'اعتبار',amount:3000000}]});
  st.personnel[0].monthlyCredit=1000000;setState(ctx,st);withSettings(ctx,{menuCreditDiscountPercent:20});
  const row=calc(ctx,'P1',1405,6);
  near(row.creditLimit,1000000);near(row.creditExcess,2000000);near(row.creditDiscountPercent,20);near(row.creditDeduction,1600000);near(row.netToman,10000000-1600000);
 });
 test('menu credit: within limit costs nothing; discount unset = 0% (full price, legacy behaviour); meal credit unaffected by the discount',()=>{
  const ctx=setup(),st=baseState({monthlyAdjustments:[adj({hoursOverride:'100'})],consumptions:[{id:'C1',personnelId:'P1',year:1405,month:6,type:'اعتبار',amount:900000},{id:'C2',personnelId:'P1',year:1405,month:6,type:'غذای پرسنلی',amount:500000}]});
  st.personnel[0].monthlyCredit=1000000;setState(ctx,st);withSettings(ctx,{menuCreditDiscountPercent:50});
  let row=calc(ctx,'P1',1405,6);near(row.creditDeduction,0);near(row.netToman,10000000-500000);
  const c2=setup(),s2=baseState({monthlyAdjustments:[adj({hoursOverride:'100'})],consumptions:[{id:'C1',personnelId:'P1',year:1405,month:6,type:'اعتبار',amount:1500000}]});
  s2.personnel[0].monthlyCredit=1000000;setState(c2,s2);near(calc(c2,'P1',1405,6).creditDeduction,500000);
 });
 test('menu credit monthly entry: menuUsed replaces (does not add to) consumption records; monthly limit and discount outrank the agreement',()=>{
  const ctx=setup(),st=baseState({monthlyAdjustments:[adj({hoursOverride:'100',menuUsed:'2500000',menuCredit:'2000000',menuDiscountPercent:'50'})],consumptions:[{id:'C1',personnelId:'P1',year:1405,month:6,type:'اعتبار',amount:900000}]});
  st.personnel[0].monthlyCredit=1000000;st.personnel[0].menuCreditDiscountPercent=30;setState(ctx,st);withSettings(ctx,{menuCreditDiscountPercent:20});
  const row=calc(ctx,'P1',1405,6);
  assert.equal(row.creditSource,'monthly');near(row.creditRecordsTotal,900000);near(row.creditConsumed,2500000);near(row.creditLimit,2000000);near(row.creditDiscountPercent,50);near(row.creditDeduction,250000);
 });
 test('menu discount precedence: blank monthly -> personnel agreement -> global setting; explicit 0 on the person is honored',()=>{
  const mk=(personPct)=>{const ctx=setup(),st=baseState({monthlyAdjustments:[adj({hoursOverride:'100',menuUsed:'2000000'})]});st.personnel[0].monthlyCredit=1000000;if(personPct!==undefined)st.personnel[0].menuCreditDiscountPercent=personPct;setState(ctx,st);withSettings(ctx,{menuCreditDiscountPercent:20});return calc(ctx,'P1',1405,6)};
  near(mk(30).creditDeduction,700000);near(mk('').creditDeduction,800000);near(mk(undefined).creditDeduction,800000);near(mk(0).creditDeduction,1000000);
 });
 test('meal allowance: 20 meals x 150,000 = 3,000,000 added to gross and net, kept out of the insurance base',()=>{
  const ctx=setup(),st=baseState({monthlyAdjustments:[adj({hoursOverride:'100',mealCount:'20'})]});
  st.personnel[0].salaryProfile={mealPerShift:150000};st.personnel[0].insurance='دارد';setState(ctx,st);
  const row=calc(ctx,'P1',1405,6);
  near(row.mealCount,20);near(row.mealRate,150000);near(row.mealAllowance,3000000);near(row.gross,10000000+3000000);near(row.insurance,10000000*0.07);near(row.netToman,13000000-700000);
  const c2=setup();setState(c2,baseState({monthlyAdjustments:[adj({hoursOverride:'100',mealCount:'20'})]}));near(calc(c2,'P1',1405,6).mealAllowance,0,'no per-meal amount in the agreement => nothing added');
 });
 test('live preview draft: calcPayrollLive(draft) reflects unsaved inputs without touching state or the memo',()=>{
  const ctx=setup(),st=baseState({monthlyAdjustments:[adj({hoursOverride:'100'})]});setState(ctx,st);
  const draft=vm.runInContext(`(()=>{const memo={},p=state.personnel[0],d=calcPayrollLive(p,1405,6,memo,{...state.monthlyAdjustments[0],hoursOverride:'50',mealCount:'3'});return{d,memoKeys:Object.keys(memo).length,saved:calcPayrollLive(p,1405,6,{})}})()`,ctx);
  near(draft.d.wage,5000000);near(draft.saved.wage,10000000);assert.equal(draft.memoKeys,0);assert.equal(st.monthlyAdjustments.length,1);assert.equal(st.monthlyAdjustments[0].hoursOverride,'100');
 });
 Promise.all(pending).then(()=>console.log(`RESULT ${tests}/${tests} PASS`)).catch(e=>{console.error(e);process.exit(1)});
})();
