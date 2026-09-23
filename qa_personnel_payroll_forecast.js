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

let tests=0;function test(name,run){run();tests++;console.log('PASS '+name)}

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
 console.log(`RESULT ${tests}/${tests} PASS`);
})();
