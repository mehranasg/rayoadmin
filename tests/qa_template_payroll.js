// QA: payroll of the new panel (migration stage 6a) — newpanel/core/js/payroll-core.js
//  start month, month states, standalone months (no carry-forward), tips outside the salary, fixed salary prorated by
//  days employed, hourly hours with overtime, undertime, penalty/reward kinds (legacy «تشویقی»), menu discount for staff
//  and managers, payment reason kinds, bulk work entry, settings lists, penalty salary month, archive of earlier months.
// Run: node qa_template_payroll.js
'use strict';
const fs=require('fs'),path=require('path');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const throws=(f,re,m)=>{try{f();ok(false,m+' (no error)')}catch(e){ok(re.test(e.message),m+' → '+e.message)}};
global.window={};for(const f of ['core/js/inventory-engine.js','core/js/inventory-write.js','core/js/attendance-core.js','core/js/payroll-core.js','core/js/people-write.js'])eval(fs.readFileSync(path.join(__dirname,'../app',f),'utf8'));
const PC=window.PayrollCore,PW=window.PeopleWrite,clone=x=>JSON.parse(JSON.stringify(x)),ctx=()=>({actor:'qa',at:'2026-11-09T10:00:00.000Z'});
const fixed={type:'fixedMonthly',monthlySalary:30000000,monthlyShifts:30,hoursPerShift:8,approximateHourly:125000};
const hr0={settings:{payrollStartYear:1405,payrollStartMonth:7,overtimeFactor:1.4,menuCreditDiscountPercent:30,menuDiscountPercentManagers:50},lists:{paymentMethods:['نقدی','کارت به کارت'],paymentTypes:['مساعده','تسویه حقوق','پرداخت انعام'],penaltyRewardTypes:['جریمه','تشویقی']},
 personnel:[{id:'F',name:'ثابت',status:'فعال',section:'سالن',startDate:'1405/01/01',salaryContract:fixed},
  {id:'N',name:'تازه',status:'فعال',section:'بار',startDate:'1405/07/13',salaryContract:{...fixed,monthlySalary:30000000}},
  {id:'H',name:'ساعتی',status:'فعال',section:'بار',startDate:'1405/01/01',hourlyRate:100000,salaryContract:{type:'hourly',monthlySalary:0}},
  {id:'M',name:'مدیر',status:'فعال',section:'مدیریت',startDate:'1405/01/01',salaryContract:{type:'fixedMonthly',monthlySalary:60000000}},
  {id:'X',name:'رفته',status:'اتمام همکاری',section:'سالن',startDate:'1405/01/01',employmentEndDate:'1405/08/10',salaryContract:fixed},
  {id:'O',name:'قدیمی',status:'اتمام همکاری',section:'سالن',startDate:'1405/01/01',salaryContract:fixed}],
 monthlyAdjustments:[{id:'ADJ-00001',personnelId:'H',year:1405,month:7,hoursOverride:200,overtimeHours:20},{id:'ADJ-00002',personnelId:'F',year:1405,month:7,overtimeHours:10,undertimeHours:4,menuUsed:1000000,otherPayment:500000,otherDeduction:100000},{id:'ADJ-00003',personnelId:'M',year:1405,month:7,menuUsed:1000000}],
 penaltiesRewards:[{id:'PR-00001',personnelId:'F',type:'جریمه',amount:200000,status:'تاییدشده',year:1405,month:7,date:'1405/07/10'},{id:'PR-00002',personnelId:'F',type:'تشویقی',amount:300000,status:'تاییدشده',year:1405,month:7,date:'1405/07/11'},{id:'PR-00003',personnelId:'F',type:'جریمه',amount:999,status:'پیش‌نویس',year:1405,month:7,date:'1405/07/12'},{id:'PR-00004',personnelId:'F',type:'جریمه',amount:5,status:'تاییدشده',year:1405,month:6,date:'1405/06/12'}],
 payments:[{id:'PAY-00001',personnelId:'F',type:'مساعده',amount:5000000,salaryYear:1405,salaryMonth:'7',date:'1405/07/15'},{id:'PAY-00002',personnelId:'F',type:'تسویه حقوق',amount:20000000,salaryYear:1405,salaryMonth:'7',date:'1405/08/03'},{id:'PAY-00003',personnelId:'F',type:'تسویه حقوق',amount:9,salaryYear:1405,salaryMonth:'7',date:'1405/08/03',status:'void'},{id:'PAY-00004',personnelId:'F',type:'پرداخت انعام',amount:100000,salaryYear:1405,salaryMonth:'8',date:'1405/08/04'},{id:'PAY-00005',personnelId:'F',type:'پرداخت انعام',amount:70000,date:'1405/06/20',salaryYear:1405,salaryMonth:6}],
 tipGroups:[{id:'T1',receiveDate:'1405/07/05',totalAmount:300000,participants:[{personnelId:'F',weight:1},{personnelId:'H',weight:2}]},{id:'T2',receiveDate:'1405/06/30',totalAmount:900000,participants:[{personnelId:'F',weight:1}]},{id:'T3',receiveDate:'1405/07/09',totalAmount:500000,status:'ابطال‌شده',participants:[{personnelId:'F',weight:1}]}],
 monthlySettlements:[{id:'MSET-00001',year:1405,month:5,status:'active',rows:[{personnelId:'F',amount:123}]}],payrollClosures:[]};
const hr=clone(hr0),T='1405/08/18',p=id=>hr.personnel.find(x=>x.id===id);
// months and states
ok(PC.months(hr,T).map(x=>x.month).join()==='7,8','months from the start month to today');
ok(PC.monthState(hr,1405,6,T)==='before'&&PC.monthState(hr,1405,7,T)==='open'&&PC.monthState(hr,1405,8,T)==='current'&&PC.monthState(hr,1405,9,T)==='future','month states');
ok(PC.months({...clone(hr0),settings:{}},T).length===0&&PC.monthRows({...clone(hr0),settings:{}},1405,7).length===0,'nothing is calculated before a start month is set');
// fixed salary
const f=PC.calc(hr,p('F'),1405,7),L=k=>f.lines.filter(l=>l.k===k).reduce((a,l)=>a+l.v,0);
ok(L('base')===30000000&&L('ot')===10*125000*1.4&&L('ut')===-4*125000,'fixed: salary + overtime × hourly × factor − undertime × hourly');
ok(L('add')===300000&&L('ded')===-200000,'approved penalty deducted, legacy «تشویقی» added; draft and other months ignored');
ok(f.flags.some(x=>x.k==='draft'),'draft penalty flagged');
ok(L('menu')===-700000&&L('otherPay')===500000&&L('otherDed')===-100000,'menu use × (1 − 30%), other payment and deduction');
const net=30000000+1750000-500000+300000-200000+500000-100000-700000;ok(f.net===net,'net of the month');
ok(f.advance===5000000&&f.paid===20000000&&f.balance===net-25000000,'balance = net − advance − salary payments of the month (string salaryMonth, void and tip payments ignored)');
ok(!f.lines.some(l=>/انعام|ایاب|غذا/.test(l.l)),'no tip, transport or meal line in the salary');
ok(PC.calc(hr,p('M'),1405,7).lines.find(l=>l.k==='menu').v===-500000,'managers («مدیریت») get their own menu discount');
// standalone months
const f8=PC.calc(hr,p('F'),1405,8);ok(f8.net===30000000&&f8.balance===30000000,'next month does not carry the balance of the previous one');
const eb=PC.earlierBalances(hr,1405,8);ok(eb.length===1&&eb[0].month===7&&eb[0].rows.some(r=>r.personnelId==='F'&&r.balance===f.balance),'balances of earlier months listed separately');
// prorating and employment
const n=PC.calc(hr,p('N'),1405,7);ok(n.days===18&&n.lines[0].v===18000000,'started mid-month: fixed salary × days employed / month days');
ok(PC.calc(hr,p('X'),1405,8).days===10&&!PC.inPayroll(hr,p('X'),1405,9),'leaver: prorated to the end date, not in later months');
ok(!PC.inPayroll(hr,p('O'),1405,8),'left without an end date and no data: not in the month');
ok(PC.monthRows(hr,1405,7).length===5,'month rows: everybody employed in the month');
// hourly
const h=PC.calc(hr,p('H'),1405,7);ok(h.lines.find(l=>l.k==='base').v===180*100000&&h.lines.find(l=>l.k==='ot').v===20*100000*1.4,'hourly: (hours − overtime) × rate + overtime × rate × factor');
ok(PC.calc(hr,p('H'),1405,8).flags.some(x=>x.k==='hours'),'hourly without hours flagged');
// tips ledger
const tl=PC.tipLedger(hr,'F');ok(tl.earned===100000&&tl.paid===100000&&tl.balance===0,'tips: shares from the start date (void groups out) − tip payments from the start date');
ok(Math.abs(PC.tipLedger(hr,'H').earned-200000)<1e-6,'tip share by weight');
// reason and item kinds
ok(PC.reasonKind(hr,{type:'مساعده'})==='advance'&&PC.reasonKind(hr,{type:'پرداخت انعام'})==='tip'&&PC.reasonKind(hr,{type:'x',tipSettlement:true})==='tip'&&PC.reasonKind(hr,{type:'اصلاح پرداخت'})==='salary','payment reason kinds (defaults and legacy)');
ok(PC.itemKind(hr,{type:'کسر تأخیر'})==='deduction'&&PC.itemKind(hr,{type:'پاداش'})==='addition'&&PC.itemKind(hr,{type:'تشویقی'})==='addition','item kinds');
// bulk work entry
let w=clone(hr0);const base=PC.sig(w,1405,8);
const nw=PC.saveWork(w,ctx(),{year:1405,month:8,rows:{H:{hours:'۱۸۰',ot:'10'},F:{ut:'2',otherPay:'',notes:'x'}},baseSig:base,today:T});
ok(nw===2&&PC.adjOf(w,'H',1405,8).hoursOverride===180&&PC.adjOf(w,'H',1405,8).id==='ADJ-00004'&&PC.adjOf(w,'F',1405,8).undertimeHours===2,'work saved for two people (Persian digits, next ADJ id)');
throws(()=>PC.saveWork(w,ctx(),{year:1405,month:8,rows:{H:{hours:180}},baseSig:base,today:T}),/کاربر دیگری/,'concurrent change refused');
throws(()=>PC.saveWork(w,ctx(),{year:1405,month:8,rows:{H:{hours:180,ot:10}},today:T}),/تغییری/,'no-op refused');
throws(()=>PC.saveWork(w,ctx(),{year:1405,month:8,rows:{H:{ot:200}},today:T}),/بیشتر/,'overtime above total hours refused for hourly');
throws(()=>PC.saveWork(w,ctx(),{year:1405,month:8,rows:{H:{hours:-1}},today:T}),/نامعتبر/,'negative refused');
PC.saveWork(w,ctx(),{year:1405,month:8,rows:{H:{hours:'۱۸۰٫۵'}},today:T});ok(PC.adjOf(w,'H',1405,8).hoursOverride===180.5,'Persian decimal separator in hours');
throws(()=>PC.saveWork(w,ctx(),{year:1405,month:6,rows:{H:{hours:1}},today:T}),/قبل از شروع/,'archive month refused');
w.payrollClosures=[{year:1405,month:7,active:true}];throws(()=>PC.saveWork(w,ctx(),{year:1405,month:7,rows:{H:{hours:1}},today:T}),/قطعی/,'closed month refused');
w.monthlyAdjustments.push({id:'ADJ-00009',personnelId:'N',year:1405,month:8,hoursOverride:'',overtimeHours:3,hoursFromAttendance:true});PC.saveWork(w,ctx(),{year:1405,month:8,rows:{N:{ot:5}},today:T});ok(PC.adjOf(w,'N',1405,8).hoursFromAttendance===false&&PC.adjOf(w,'N',1405,8).manualOverAttendance===true,'manual change over attendance is marked');
// penalty salary month: a closed month sends a new item to the first open month
ok(PC.itemSalaryMonth(w,'1405/07/20').month===8&&PC.itemSalaryMonth(w,'1405/07/20').late===true&&PC.itemSalaryMonth(w,'1405/08/02').month===8,'late item goes to the first month that is not final');
const r=PW.addPenalty(w,ctx(),{date:'1405/07/20',personnelId:'F',type:'کسر تأخیر',amount:50000,status:'تاییدشده',reason:'تأخیر'});ok(r.month===8&&r.lateFrom==='1405/07'&&r.type==='کسر تأخیر','«کسر تأخیر» accepted; recorded in the open month with its own date');
throws(()=>PW.addPenalty(w,ctx(),{date:'1405/08/02',personnelId:'F',type:'تشویقی',amount:1,status:'تاییدشده',reason:'x'}),/نوع/,'retired type not offered for new items');
// settings
let s=clone(hr0);const cfg=PC.config(s),x={startYear:1405,startMonth:7,overtimeFactor:1.4,menuStaff:30,menuManagers:50,tipStep:5000,advanceWarnPercent:50,reasons:cfg.reasons.concat([{title:'وام',kind:'other',active:true}]),items:cfg.items,methods:['نقدی','کارت به کارت','واریز به حساب']};
PC.saveSettings(s,ctx(),x);ok(s.settings.paymentReasons.length===6&&s.lists.paymentTypes.includes('وام')&&s.lists.penaltyRewardTypes.join()==='جریمه,کسر تأخیر,پاداش'&&s.lists.paymentMethods.length===3,'settings saved; current-panel lists follow the active titles');
throws(()=>PC.saveSettings(s,ctx(),x),/تغییری/,'no-op settings refused');
throws(()=>PC.saveSettings(s,ctx(),{...x,reasons:x.reasons.map(r=>r.title==='مساعده'?{...r,kind:'other'}:r)}),/مساعده/,'kind of a used reason cannot change');
throws(()=>PC.saveSettings(s,ctx(),{...x,reasons:x.reasons.filter(r=>r.kind!=='tip')}),/انعام/,'a tip reason is required');
throws(()=>PC.saveSettings(s,ctx(),{...x,reasons:[...x.reasons,{title:'مساعده',kind:'advance'}]}),/تکراری/,'duplicate title refused');
throws(()=>PC.saveSettings(s,ctx(),{...x,startMonth:13}),/ماه شروع/,'invalid start refused');
PC.saveSettings(s,ctx(),{...x,reasons:x.reasons.map(r=>r.title==='وام'?{...r,active:false}:r)});ok(s.settings.paymentReasons.find(r=>r.title==='وام').active===false&&!s.lists.paymentTypes.includes('وام'),'reason deactivated, not removed');
// contract terms: shifts × hours → hourly; effective month
let c=clone(hr0);global.window.PayrollCore=PC;const res=PW.saveSalaryTerms(c,ctx(),{id:'F',type:'fixedMonthly',monthlySalary:36000000,monthlyShifts:30,hoursPerShift:8,effective:'1405/07'});
ok(res.effective==='1405/07'&&c.personnel[0].salaryContract.approximateHourly===150000&&PC.contractOf(c.personnel[0],1405,7).monthlySalary===36000000&&PC.contractOf(c.personnel[0],1405,6).monthlySalary===30000000,'contract from a chosen month; hourly rate from shifts × hours; earlier months keep the old terms');
throws(()=>PW.saveSalaryTerms(c,ctx(),{id:'F',type:'fixedMonthly',monthlySalary:1,effective:'1405/06'}),/قبل از شروع/,'contract before the start month refused');
// archive
const a=PC.archive(hr);ok(a.tipShares.length===1&&a.tipShares[0].amount===900000&&a.payments.map(x=>x.id).join()==='PAY-00005'&&a.items.map(x=>x.id).join()==='PR-00004'&&a.settlements.length===1,'archive: everything recorded before the start month');
// payments (stage 6b)
{let q=clone(hr0);const base={personnelId:'F',date:'1405/08/10',method:'نقدی',amount:1000000};
 let c=PC.checkPayment(q,{...base,reason:'مساعده'},T);ok(!c.errors.length&&c.kind==='advance'&&c.year===1405&&c.month===8,'advance: salary month = month of the payment date');
 c=PC.checkPayment(q,{...base,reason:'مساعده',amount:20000000},T);ok(c.warnings.some(w=>/پیش‌بینی/.test(w)),'advance above the warning percent: warning only');
 c=PC.checkPayment(q,{...base,reason:'تسویه حقوق',year:1405,month:8},T);ok(c.errors.some(e=>/تمام نشده/.test(e)),'salary of the month in progress refused without «تسویهٔ پایان همکاری»');
 c=PC.checkPayment(q,{...base,reason:'تسویه حقوق',year:1405,month:8,finalSettlement:true},T);ok(!c.errors.length&&c.warnings.some(w=>/پایان همکاری/.test(w)),'final settlement in the month in progress allowed; missing end date warned');
 c=PC.checkPayment(q,{...base,personnelId:'X',reason:'تسویه حقوق',year:1405,month:8,finalSettlement:true,amount:5000000},T);ok(!c.errors.length&&!c.warnings.some(w=>/پایان همکاری/.test(w))&&c.balance===10000000,'leaver with end date: balance of the prorated month');
 c=PC.checkPayment(q,{...base,reason:'تسویه حقوق',year:1405,month:7,amount:99000000},T);ok(c.warnings.some(w=>/بیشتر است/.test(w))&&c.warnings.some(w=>/قطعی نشده/.test(w)),'salary above the balance and month not final: warnings');
 c=PC.checkPayment(q,{...base,reason:'تسویه حقوق',year:1405,month:6},T);ok(c.errors.some(e=>/قبل از شروع/.test(e)),'salary month before the start refused');
 c=PC.checkPayment(q,{...base,reason:'پرداخت انعام',amount:500000},T);ok(c.kind==='tip'&&c.tipBalance===0&&c.warnings.some(w=>/انعام/.test(w)),'tip payment above the tip balance warned');
 c=PC.checkPayment(q,{...base,reason:'x'},T);ok(c.errors.some(e=>/علت/.test(e)),'unknown or inactive reason refused');
 c=PC.checkPayment(q,{...base,reason:'مساعده',date:'1405/09/01'},T);ok(c.errors.some(e=>/بعد از امروز/.test(e)),'future date refused');
 c=PC.checkPayment(q,{...base,reason:'مساعده',date:'1405/06/30'},T);ok(c.errors.some(e=>/قبل از شروع/.test(e)),'date before the start refused');
 c=PC.checkPayment(q,{...base,reason:'مساعده',method:'چک'},T);ok(c.errors.some(e=>/روش/.test(e)),'method outside the settings refused');
 q.settings.paymentReasons=[...PC.config(q).reasons,{title:'وام',kind:'other',active:true}];c=PC.checkPayment(q,{...base,reason:'وام'},T);ok(c.errors.some(e=>/توضیح/.test(e)),'payment outside payroll needs a note');
 const made=PC.addPayments(q,ctx(),[{...base,reason:'تسویه حقوق',year:1405,month:7,amount:3000000,tracking:'۱۲۳'}],T)[0];
 ok(made.id==='PAY-00006'&&made.salaryYear===1405&&made.salaryMonth===7&&made.reasonKind==='salary'&&made.registeredBy==='qa'&&made.tracking==='۱۲۳'&&PC.calc(q,p('F'),1405,7).paid===23000000,'salary payment recorded (numeric salary month, actor) and counted in the month');
 throws(()=>PC.addPayments(q,ctx(),[{...base,reason:'تسویه حقوق',year:1405,month:7,tracking:'۱۲۳'}],T),/پیگیری/,'duplicate tracking number refused');
 ok(PC.checkPayment(q,{...base,reason:'تسویه حقوق',year:1405,month:7,amount:3000000},T).warnings.some(w=>/همین روز/.test(w)),'same person, amount, reason and day: warning');
 const bon=PC.addPayments(q,ctx(),[{...base,reason:'پاداش',year:1405,month:7,amount:400000,recordBonus:true,notes:'فروش خوب'}],T)[0],pr=q.penaltiesRewards.find(x=>x.id===bon.bonusItemId);
 ok(pr&&pr.type==='پاداش'&&pr.status==='تاییدشده'&&pr.month===7&&pr.amount===400000,'bonus payment also records the bonus in the month');
 const before=PC.calc(q,p('F'),1405,7);PC.voidPayment(q,ctx(),{id:bon.id,reason:'اشتباه'});ok(q.payments.find(x=>x.id===bon.id).status==='void'&&pr.status==='لغوشده'&&PC.calc(q,p('F'),1405,7).net===before.net-400000,'void: payment kept as void, its bonus cancelled');
 throws(()=>PC.voidPayment(q,ctx(),{id:bon.id,reason:'x'}),/قبلاً/,'void twice refused');throws(()=>PC.voidPayment(q,ctx(),{id:made.id,reason:''}),/علت/,'void needs a reason');
 q.tipGroups.push({id:'T9',receiveDate:'1405/08/05',totalAmount:600000,participants:[{personnelId:'X',weight:1}]});
 const two=PC.addPayments(q,ctx(),[{personnelId:'X',reason:'تسویه حقوق',year:1405,month:8,finalSettlement:true,date:'1405/08/12',amount:10000000,method:'نقدی'},{personnelId:'X',reason:'پرداخت انعام',date:'1405/08/12',amount:600000,method:'نقدی'}],T);
 ok(two.length===2&&two[0].finalSettlement===true&&PC.calc(q,p('X'),1405,8).balance===0&&PC.tipLedger(q,'X').balance===0,'final settlement of a leaver with his tips: two records in one save');
 q.payrollClosures=[{year:1405,month:8,active:true}];ok(PC.checkPayment(q,{...base,reason:'مساعده'},T).errors.some(e=>/قطعی/.test(e)),'advance for a final month refused')}
// staff panel: advance requests retired
{const s22=fs.readFileSync(path.join(__dirname,'../legacy/js/22-staff-panel.js'),'utf8');ok(!s22.includes("['advance','💰','درخواست مساعده']")&&/async function staffSaveAdvance\(\)\{return toastStaff/.test(s22)&&!/d\.advanceRequests/.test(s22),'staff panel: no advance request menu and no write')}
// closing a month (stage 6d)
{let q=clone(hr0);q.personnel=q.personnel.filter(x=>x.id!=='O');
 let c=PC.closeCheck(q,1405,7,T);ok(c.blockers.some(b=>/پیش‌نویس/.test(b))&&c.state==='open','close check: draft penalty blocks');
 q.penaltiesRewards.find(x=>x.id==='PR-00003').status='لغوشده';q.monthlyAdjustments=q.monthlyAdjustments.filter(x=>x.personnelId!=='H');c=PC.closeCheck(q,1405,7,T);ok(c.blockers.some(b=>/ساعت/.test(b)),'close check: hourly without hours blocks');
 throws(()=>PC.closeMonth(q,ctx(),{year:1405,month:7,today:T}),/قبل از قطعی/,'close refused with blockers');
 PC.saveWork(q,ctx(),{year:1405,month:7,rows:{H:{hours:0}},today:T});c=PC.closeCheck(q,1405,7,T);ok(!c.blockers.length,'explicit 0 hours clears the blocker');
 throws(()=>PC.closeMonth(q,ctx(),{year:1405,month:8,today:T}),/تمام نشده/,'month in progress cannot be closed');
 const netF=PC.calc(q,q.personnel[0],1405,7).net,cl=PC.closeMonth(q,ctx(),{year:1405,month:7,today:T});
 ok(cl.id==='PCL-00001'&&cl.engine==='v2'&&cl.version===1&&cl.finalizedBy==='qa'&&cl.rows.length===c.rows.length&&cl.rows.find(r=>r.personnelId==='F').netToman===netF&&cl.rows[0].previousBalance===0,'closure: snapshot rows (with the fields the current panel reads), actor recorded');
 ok(PC.monthState(q,1405,7,T)==='closed','month state closed');
 PW.saveSalaryTerms(q,ctx(),{id:'F',type:'fixedMonthly',monthlySalary:90000000,monthlyShifts:30,hoursPerShift:8,effective:'1405/08'});q.personnel[0].salaryHistory=[{effectiveYear:0,effectiveMonth:0,terms:{salaryContract:{type:'fixedMonthly',monthlySalary:90000000}}}];
 ok(PC.calc(q,q.personnel[0],1405,7).net===netF&&PC.calc(q,q.personnel[0],1405,7).closed===true,'closed month keeps its salary when the contract changes');
 throws(()=>PC.saveWork(q,ctx(),{year:1405,month:7,rows:{F:{ot:1}},today:T}),/قطعی/,'work of a closed month refused');
 throws(()=>PW.setPenaltyStatus(q,ctx(),{id:'PR-00001',status:'لغوشده',reason:'x'}),/قطعی/,'penalty of a closed month cannot change');
 const late=PW.addPenalty(q,ctx(),{date:'1405/07/25',personnelId:'F',type:'جریمه',amount:1000,status:'تاییدشده',reason:'دیر پیدا شد'});ok(late.month===8&&late.lateFrom==='1405/07','late penalty goes to the first open month');
 ok(!PC.checkPayment(q,{personnelId:'F',reason:'تسویه حقوق',year:1405,month:7,date:'1405/08/12',amount:1000,method:'نقدی'},T).errors.length,'salary of a closed month can still be paid');
 PC.addPayments(q,ctx(),[{personnelId:'F',reason:'تسویه حقوق',year:1405,month:7,date:'1405/08/12',amount:1000,method:'نقدی'}],T);ok(PC.calc(q,q.personnel[0],1405,7).paid===20001000&&PC.calc(q,q.personnel[0],1405,7).advance===5000000,'payments after closing count against the snapshot');
 throws(()=>PC.reopenMonth(q,ctx(),{year:1405,month:7,reason:''}),/علت/,'reopen needs a reason');
 PC.reopenMonth(q,ctx(),{year:1405,month:7,reason:'اصلاح'});ok(cl.active===false&&cl.reopenReason==='اصلاح'&&PC.monthState(q,1405,7,T)==='open'&&!PC.calc(q,q.personnel[0],1405,7).closed,'reopened: closure kept as history, month live again');
 const cl2=PC.closeMonth(q,ctx(),{year:1405,month:7,today:T});ok(cl2.version===2&&q.payrollClosures.length===2,'closed again as version 2')}
// staff panel «انعام‌های من» reads the same tip ledger (js/22 staffTipStart / staffTipPayment)
{const s22=fs.readFileSync(path.join(__dirname,'../legacy/js/22-staff-panel.js'),'utf8'),grab=n=>{const i=s22.indexOf('function '+n+'('),j=s22.indexOf('\n',i);return s22.slice(i,j)};
 const mk=new Function('hr','me','A','S','N',grab('staffTipStart')+'\n'+grab('staffTipPayment')+';return{staffTipStart,staffTipPayment}'),Ar=x=>Array.isArray(x)?x:[],Sr=x=>String(x??'').trim(),Nr=v=>Number(v)||0;
 const h=clone(hr0);h.settings.paymentReasons=[{title:'تسویه انعام',kind:'tip',active:true},{title:'مساعده',kind:'advance',active:true}];const fns=mk(h,{id:'F'},Ar,Sr,Nr);
 ok(fns.staffTipStart()==='1405/07/01','staff panel: tips from the payroll start');
 ok(fns.staffTipPayment({personnelId:'F',type:'تسویه انعام'})&&fns.staffTipPayment({personnelId:'F',type:'x',reasonKind:'tip'})&&fns.staffTipPayment({personnelId:'F',type:'پرداخت انعام'})&&!fns.staffTipPayment({personnelId:'F',type:'مساعده'})&&!fns.staffTipPayment({personnelId:'F',type:'پرداخت انعام',status:'void'})&&!fns.staffTipPayment({personnelId:'H',type:'پرداخت انعام'}),'staff panel: tip payments by reason kind, own, not void');
 ok(!s22.includes('tipSettledShareStaff'),'staff panel: no group-status settlement any more')}
{const pr=fs.readFileSync(path.join(__dirname,'../app/js/pages/payroll-real.js'),'utf8'),pe=fs.readFileSync(path.join(__dirname,'../app/js/pages/people-real.js'),'utf8');
 ok(/function tipDays\(/.test(pr)&&/tipsTotal\)\/10/.test(pr)&&!/settleTip/.test(pr)&&!/tipActionForm/.test(pe),'tips tab: daily check against cash report tips (rial → toman); no group settlement')}
// static checks of the pages
const pr=fs.readFileSync(path.join(__dirname,'../app/js/pages/payroll-real.js'),'utf8'),ix=fs.readFileSync(path.join(__dirname,'../app/index.html'),'utf8');
ok(ix.includes('core/js/payroll-core.js')&&ix.includes('js/pages/payroll-real.js')&&!ix.includes('payroll-engine.js'),'index loads the new payroll files only');
ok(/id:'work'/.test(pr)&&/id:'payset'/.test(pr),'tabs «کارکرد ماه» and «تنظیمات حقوق»');
// tip rounding: down to 5,000 in months not finalized; the difference is shown; finalizing stamps the step; an old finalized month keeps exact shares
{const h={settings:{payrollStartYear:1405,payrollStartMonth:7},personnel:[{id:'A'},{id:'B'},{id:'C'}],payrollClosures:[{year:1405,month:7,active:true,engine:'v2',rows:[]}],tipGroups:[{id:'T1',receiveDate:'1405/08/03',totalAmount:1000000,participants:[{personnelId:'A'},{personnelId:'B'},{personnelId:'C'}]},{id:'T2',receiveDate:'1405/07/03',totalAmount:1000000,participants:[{personnelId:'A'},{personnelId:'B'},{personnelId:'C'}]}],payments:[]};
 ok(PC.tipShares(h.tipGroups[0],h).every(x=>x.amount===330000)&&PC.tipRoundDiff(h.tipGroups[0],h)===10000,'open month: 1,000,000 ÷ 3 → 330,000 each, 10,000 difference');
 ok(Math.abs(PC.tipShares(h.tipGroups[1],h)[0].amount-333333.333)<0.01&&Math.abs(PC.tipShares(h.tipGroups[0])[0].amount-333333.333)<0.01,'finalized month without step and calls without hr keep exact shares');
 h.tipGroups[1].shareRoundingStep=5000;ok(PC.tipShares(h.tipGroups[1],h)[0].amount===330000,'a stored step always rounds');
 const g={id:'T3',receiveDate:'1405/08/05',totalAmount:100000,participants:[{personnelId:'A',weight:2},{personnelId:'B'}]};ok(PC.tipShares(g,h).map(x=>x.amount).join()==='65000,30000','weights then round down');ok(PC.tipShares({receiveDate:'1405/08/05',totalAmount:197000,participants:[{personnelId:'A'}]},h)[0].amount===197000,'a one-person tip is not rounded')}
// menu credit (decided 2026-11-13): (use − credit, not below zero) × (1 − discount); credit of the person, else the default
{const h=clone(hr0),q=id=>h.personnel.find(x=>x.id===id),menu=id=>PC.calc(h,q(id),1405,7);
 ok(PC.config(h).menuCredit===0&&menu('F').menu===700000&&menu('F').menuCredit===0&&menu('F').menuExcess===1000000,'no credit set: the whole use, with the discount');
 h.settings.defaultMonthlyCredit=400000;ok(menu('F').menu===420000&&menu('F').menuCredit===400000&&menu('F').menuExcess===600000,'default credit: (1,000,000 − 400,000) × 70%');
 ok(menu('M').menu===300000,'managers: same credit, their own discount');
 q('F').monthlyCredit=2500000;ok(menu('F').menu===0&&menu('F').menuExcess===0&&!menu('F').lines.some(l=>l.k==='menu'),'credit of the person above the use: nothing deducted and nothing paid back');
 q('F').monthlyCredit=0;ok(menu('F').menu===420000,'person credit 0 = the default');
 const sh=PC.menuShare(2500000,1000000,20);ok(sh.excess===1500000&&sh.deduction===1200000,'owner example: 2.5m use, 1m credit, 20% → 1.5m then 1.2m');
 q('F').salaryHistory=[{effectiveYear:0,effectiveMonth:0,terms:{salaryContract:fixed,monthlyCredit:0}},{effectiveYear:1405,effectiveMonth:8,terms:{salaryContract:fixed,monthlyCredit:900000}}];q('F').monthlyCredit=900000;
 ok(PC.menuTerms(h,q('F'),1405,7).credit===400000&&PC.menuTerms(h,q('F'),1405,8).credit===900000&&PC.menuTerms(h,q('F'),1405,8).own,'a credit changed from a month does not touch the months before');
 const base={startYear:1405,startMonth:7,overtimeFactor:1.4,menuStaff:30,menuManagers:50,tipStep:5000,advanceWarnPercent:50,reasons:PC.DEF_REASONS,items:PC.DEF_ITEMS,methods:PC.DEF_METHODS};
 PC.saveSettings(h,ctx(),{...base,menuCredit:1000000});ok(h.settings.defaultMonthlyCredit===1000000,'default credit saved in settings.defaultMonthlyCredit');
 throws(()=>PC.saveSettings(h,ctx(),{...base,menuCredit:1000000}),/تغییری/,'same settings: nothing to save');throws(()=>PC.saveSettings(h,ctx(),{...base,menuCredit:-5}),/اعتبار/,'negative credit refused');
 delete q('F').salaryHistory;q('F').monthlyCredit=0;h.penaltiesRewards.find(x=>x.id==='PR-00003').status='لغوشده';q('O').employmentEndDate='1405/06/30';const cl=PC.closeMonth(h,ctx(),{year:1405,month:7,today:T,note:''}),row=cl.rows.find(r=>r.personnelId==='F');
 ok(row.menuCredit===1000000&&row.menuExcess===0,'closure keeps the credit and the excess');h.settings.defaultMonthlyCredit=0;ok(PC.calc(h,q('F'),1405,7).menuCredit===1000000&&PC.calc(h,q('F'),1405,7).menu===0,'a closed month keeps its credit when the setting changes')}
// agreed shifts per week and the estimate of a month
{const h=clone(hr0);PW.saveSalaryTerms(h,ctx(),{id:'F',type:'fixedMonthly',monthlySalary:36000000,weeklyShifts:6,effective:'1405/08'});const f=h.personnel.find(p=>p.id==='F');
 ok(f.salaryContract.weeklyShifts===6&&PC.weeklyShifts(f,1405,8)===6&&PC.shiftEstimate(f,1405,9)===26,'6 shifts a week: 26 in a 30-day month');
 ok(PC.weeklyShifts(f,1405,7)===0&&PC.shiftEstimate(f,1405,7)===0,'weekly shifts set from a month do not touch the months before');
 f.employmentEndDate='1405/09/14';ok(PC.shiftEstimate(f,1405,9)===12&&PC.shiftEstimate(f,1405,10)===0,'estimate follows the days employed');
 throws(()=>PW.saveSalaryTerms(h,ctx(),{id:'F',type:'fixedMonthly',monthlySalary:36000000,weeklyShifts:30,effective:'1405/08'}),/شیفت در هفته/,'weekly shifts range')}
console.log(`qa_template_payroll: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
