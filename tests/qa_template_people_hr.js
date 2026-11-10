// QA: staff files of the new panel (migration stage 3) — newpanel/core/js/people-write.js: person, salary terms (current
// month only), staff-panel account, delete guard, violations (current month, void), leaves (days, overlap, cancel).
// Synthetic data only. Run: node qa_template_people_hr.js
'use strict';
const fs=require('fs'),path=require('path');
global.window={};
for(const f of ['inventory-engine.js','people-write.js'])eval(fs.readFileSync(path.join(__dirname,'../app/core/js',f),'utf8'));
const E=window.InvEngine,PW=window.PeopleWrite;
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const throws=(f,re,m)=>{try{f();ok(false,m+' (no error)')}catch(e){ok(re.test(e.message),m+' → '+e.message)}};
const T=E.CAL.today,[Y,M]=T.split('/').map(Number),day=k=>E.CAL.k(E.CAL.i(T)-k),prevMonthDay=E.CAL.k(E.CAL.i(T.slice(0,8)+'01')-1);
const ctx=()=>({actor:'qa',at:'2026-11-08T10:00:00Z',reqId:'R1',module:'personnel'});
const doc=()=>({settings:{adminUsers:[{username:'boss'}]},lists:{sections:['بار','صندوق','سالن','آشپزخانه','خدمات'],hallSubSections:['سالن بالا','سالن پایین'],hallPositions:['سالن‌کار','باریستا'],kitchenPositions:['سرآشپز','آماده‌ساز'],servicePositions:['خدماتی'],
  employmentStatuses:['فعال','مرخصی','غیرفعال','اتمام همکاری'],leaveTypes:['مرخصی استحقاقی','غیبت'],violationTypes:['تأخیر']},
 personnel:[{id:'EMP-0001',name:'علی رضایی',phone:'09120000001',status:'فعال',personnelGroup:'سالن',section:'سالن',subSection:'سالن بالا',mainPosition:'سالن‌کار',hourlyRate:100000,salaryContract:{type:'hourly',monthlySalary:0},cardNumber:'6037991234567890',userPassword:'old',username:'ali',userAccess:{enabled:true,permissions:{}},extra:'keep'},
  {id:'EMP-0002',name:'مینا',status:'فعال',personnelGroup:'آشپزخانه',section:'آشپزخانه',mainPosition:'سرآشپز'}],
 tipGroups:[{id:'TIPG-1',participants:[{personnelId:'EMP-0001'}]}],penaltiesRewards:[],workViolations:[],leaves:[],leaveRequests:[]});
// ---- person
let d=doc();
throws(()=>PW.savePerson(d,ctx(),{name:'x',personnelGroup:'سالن',section:'سالن',mainPosition:'سالن‌کار'}),/محدودهٔ سالن/,'hall section needs a sub-area');
throws(()=>PW.savePerson(d,ctx(),{name:'x',personnelGroup:'آشپزخانه',section:'بار',mainPosition:'سرآشپز'}),/سکشن/,'section must belong to the group');
throws(()=>PW.savePerson(d,ctx(),{name:'x',personnelGroup:'سالن',section:'بار',mainPosition:'سرآشپز'}),/پوزیشن/,'position must belong to the group');
throws(()=>PW.savePerson(d,ctx(),{name:'x',personnelGroup:'سالن',section:'بار',mainPosition:'باریستا',status:'اتمام همکاری'}),/اتمام همکاری الزامی/,'end date required when ended');
throws(()=>PW.savePerson(d,ctx(),{name:'x',personnelGroup:'سالن',section:'بار',mainPosition:'باریستا',phone:'0912'}),/۱۱ رقم/,'phone format');
const n=PW.savePerson(d,ctx(),{name:'سارا',personnelGroup:'سالن',section:'بار',mainPosition:'باریستا',phone:'۰۹۱۲۱۱۱۲۲۲۲',startDate:T});const np=d.personnel.find(p=>p.id===n.id);
ok(n.id==='EMP-0003'&&np.salaryContract.type==='hourly'&&np.gradeId==='D'&&np.phone==='09121112222'&&np.salaryProfile.position==='باریستا','new person shape like js/05');
PW.savePerson(d,ctx(),{id:'EMP-0001',name:'علی رضایی',phone:'09120000001',personnelGroup:'سالن',section:'سالن',subSection:'سالن بالا',mainPosition:'سالن‌کار',status:'فعال'});ok(d.personnel[0].cardNumber==='6037991234567890'&&d.personnel[0].userPassword==='old'&&d.personnel[0].extra==='keep','edit keeps bank, password and unknown keys');
ok(PW.personDuplicate(d,{name:'علی  رضايی'})?.id==='EMP-0001'&&PW.personDuplicate(d,{phone:'09120000001'})?.id==='EMP-0001','duplicate name / phone found');
// ---- salary terms: current month only, history kept
d=doc();const s1=PW.saveSalaryTerms(d,ctx(),{id:'EMP-0001',type:'hourly',hourlyRate:120000,transportMonthly:300000});const p1=d.personnel[0];
ok(s1.changed&&s1.effective===T.slice(0,7)&&p1.hourlyRate===120000&&p1.salaryHistory.length===2&&p1.salaryHistory[0].effectiveYear===0&&p1.salaryHistory[0].terms.hourlyRate===100000&&p1.salaryHistory[1].effectiveYear===Y&&p1.salaryHistory[1].effectiveMonth===M,'new terms from the current month; earlier terms kept (js/00 recordSalaryTerms)');
ok(p1.cardNumber==='6037991234567890','bank kept when not sent');
throws(()=>PW.saveSalaryTerms(d,ctx(),{id:'EMP-0001',type:'fixedMonthly',monthlySalary:0}),/ثابت ماهانه/,'fixed salary must be positive');
throws(()=>PW.saveSalaryTerms(d,ctx(),{id:'EMP-0001',type:'hourly',hourlyRate:1,cardNumber:'123'}),/۱۶ رقم/,'card check');
PW.saveSalaryTerms(d,ctx(),{id:'EMP-0001',type:'fixedMonthly',monthlySalary:20000000,iban:'120000000000000000000001'});ok(p1.salaryHistory.length===2&&p1.salaryContract.type==='fixedMonthly'&&p1.iban==='IR120000000000000000000001','same month replaces its entry; IBAN normalised');
// ---- account
d=doc();
throws(()=>PW.saveAccount(d,ctx(),{id:'EMP-0002',username:'boss',password:'1234',enabled:true}),/مدیریت/,'username differs from management users');
throws(()=>PW.saveAccount(d,ctx(),{id:'EMP-0002',username:'ALI',password:'1234',enabled:true}),/قبلاً/,'username unique among staff');
PW.saveAccount(d,ctx(),{id:'EMP-0001',username:'ali',password:'',enabled:true,permissions:['tips']});ok(d.personnel[0].userPassword==='old'&&d.personnel[0].userAccess.permissions.tips===true&&d.personnel[0].userAccess.permissions.cashReport===false,'blank password keeps the stored one');
// ---- delete guard
d=doc();throws(()=>PW.removePerson(d,ctx(),{id:'EMP-0001'}),/سابقه/,'person with tips is not deleted');ok(PW.removePerson(d,ctx(),{id:'EMP-0002'})&&d.personnel.length===1,'person without references is deleted');
throws(()=>PW.removePerson(doc(),ctx(),{id:'EMP-0002',external:[['cashreport',1]]}),/سابقه/,'references in other modules block the delete');
// ---- violations
d=doc();
throws(()=>PW.saveViolation(d,ctx(),{date:prevMonthDay,personnelId:'EMP-0001',violationType:'تأخیر',details:'x'}),/ماه جاری/,'only the current month');
const v1=PW.saveViolation(d,ctx(),{date:T,personnelId:'EMP-0001',violationType:'تأخیر',details:'۲۰ دقیقه',hasFine:true,fineAmount:50000});const pr=d.penaltiesRewards[0];
ok(v1.penaltyId===pr.id&&pr.status==='پیش‌نویس'&&pr.year===Y&&pr.month===M&&pr.source==='violation'&&pr.amount===50000,'fine → draft penalty with year/month (payroll counts it once approved)');
pr.status='تاییدشده';PW.saveViolation(d,ctx(),{id:v1.id,date:T,personnelId:'EMP-0001',violationType:'تأخیر',details:'۳۰ دقیقه',hasFine:true,fineAmount:70000});ok(pr.status==='تاییدشده'&&pr.amount===70000&&d.workViolations.length===1,'edit updates the fine and keeps its approval');
ok(PW.violationRepeats(d,{personnelId:'EMP-0001',violationType:'تأخیر',date:T})===1,'repeat count in 90 days');
throws(()=>PW.voidViolation(d,ctx(),{id:v1.id,reason:''}),/علت/,'void needs a reason');
PW.voidViolation(d,ctx(),{id:v1.id,reason:'اشتباه'});ok(d.workViolations[0].status==='ابطال‌شده'&&pr.status==='لغوشده'&&d.workViolations.length===1,'void keeps the row and cancels the fine');
d.workViolations.push({id:'VIO-0100',date:prevMonthDay,personnelId:'EMP-0001',violationType:'تأخیر'});throws(()=>PW.voidViolation(d,ctx(),{id:'VIO-0100',reason:'x'}),/ماه‌های قبل/,'older violations are not voided');
// ---- leaves
d=doc();
const l1=PW.addLeave(d,ctx(),{personnelId:'EMP-0001',type:'مرخصی استحقاقی',fromDate:day(2),toDate:T});ok(l1.count===3&&l1.source==='manager','days from the range');
throws(()=>PW.addLeave(d,ctx(),{personnelId:'EMP-0001',type:'مرخصی استحقاقی',fromDate:day(1),toDate:day(1)}),/هم‌پوشانی/,'overlap refused');
throws(()=>PW.addLeave(d,ctx(),{personnelId:'EMP-0002',type:'مرخصی استحقاقی',fromDate:day(4),toDate:day(3),count:5}),/بیشتر از روزهای بازه/,'count cannot exceed the range');
ok(PW.addLeave(d,ctx(),{personnelId:'EMP-0002',type:'مرخصی استحقاقی',fromDate:day(4),toDate:day(4),count:'0.5'}).count===0.5,'half day');
d.leaveRequests.push({id:'LR-1',personnelId:'EMP-0002',fromDate:day(10),toDate:day(9),type:'غیبت',status:'در انتظار'});
throws(()=>PW.reviewLeave(d,ctx(),{id:'LR-1',status:'ردشده',note:''}),/علت رد/,'reject needs a reason');
PW.reviewLeave(d,ctx(),{id:'LR-1',status:'تاییدشده',note:''});const fromReq=d.leaves.find(l=>l.requestId==='LR-1');ok(fromReq&&fromReq.count===2&&d.leaveRequests[0].status==='تاییدشده','approve creates the leave (js/19)');
throws(()=>PW.reviewLeave(d,ctx(),{id:'LR-1',status:'تاییدشده'}),/قبلاً بررسی/,'reviewed once');
PW.cancelLeave(d,ctx(),{id:fromReq.id,reason:'برنگشت'});ok(fromReq.status==='لغوشده'&&fromReq.count===0&&fromReq.cancelledCount===2&&d.leaveRequests[0].status==='لغوشده','cancel keeps the row; count moves to cancelledCount so old sums ignore it');
ok(!PW.leaveOverlap(d,{personnelId:'EMP-0002',fromDate:day(10),toDate:day(9)}),'a cancelled leave no longer overlaps');
const u=PW.leaveUsed(d,'EMP-0001');ok(T.slice(0,7)===day(2).slice(0,7)?u['مرخصی استحقاقی']===3:true,'used this month');
// ---- standard structure (4 groups): preview, apply with rename of people, shift cells and requirements; rollback data kept
{const d=doc();d.personnel.push({id:'EMP-0009',name:'مدیر',status:'فعال',personnelGroup:'سالن',section:'مدیریت',mainPosition:'مدیر/سرپرست',backupPosition:'سالن‌کار'});d.lists.hallPositions.push('مدیر/سرپرست');d.lists.sections.push('مدیریت');
 d.monthlyPlans=[{id:'MPL-1',cells:{['1405/08/01|'+encodeURIComponent('سالن بالا')+'~'+encodeURIComponent('سالن‌کار')+'|صبح']:['EMP-0001'],['1405/08/01|'+encodeURIComponent('آشپزخانه')+'~'+encodeURIComponent('سرآشپز')+'|صبح']:['EMP-0002']}}];d.staffingRequirements=[{id:'REQ-1',dayIndex:0,shift:'صبح',section:'صندوق',position:'صندوقدار',requiredCount:1,active:true}];
 ok(PW.groupsOf(d).length===3,'old lists: three groups');const pl=PW.standardPlan(d),m=pl.people.find(x=>x.id==='EMP-0009').to,a1=pl.people.find(x=>x.id==='EMP-0001').to,k=pl.people.find(x=>x.id==='EMP-0002').to;
 ok(m.personnelGroup==='مدیریت'&&m.section==='مدیریت'&&m.mainPosition==='سرپرست شیفت'&&m.backupPosition===''&&a1.mainPosition==='گارسون'&&a1.subSection==='سالن بالا'&&k.section==='خط گرم'&&pl.reqs===1&&pl.cells===2,'plan: management group, merged hall position, kitchen station section, cross-group backup cleared');
 const c=ctx(),r=PW.applyStandard(d,c);ok(r.people===3&&d.personnel.find(p=>p.id==='EMP-0001').mainPosition==='گارسون'&&d.staffingRequirements[0].section==='صندوق و پذیرش'&&Object.keys(d.monthlyPlans[0].cells).some(x=>decodeURIComponent(x).includes('خط گرم~سرآشپز'))&&Object.keys(d.monthlyPlans[0].cells).some(x=>decodeURIComponent(x).includes('سالن بالا~گارسون')),'apply: people, requirements and shift cells renamed');
 ok(c.auditExtra.before.people.length===3&&c.auditExtra.before.cells['MPL-1']&&c.auditExtra.before.reqs[0].section==='صندوق'&&PW.groupsOf(d).length===4,'previous values kept for rollback; four groups after');
 ok(PW.sectionsFor(d,'آشپزخانه').join()==='خط گرم,خط سرد,آماده‌سازی,شستشو'&&PW.positionsFor(d,'مدیریت').includes('حسابدار'),'sections and positions by group');
 PW.savePerson(d,ctx(),{name:'نیما',personnelGroup:'مدیریت',section:'مدیریت',mainPosition:'حسابدار'});ok(d.personnel.some(p=>p.name==='نیما'&&p.personnelGroup==='مدیریت'),'a new person in the management group');throws(()=>PW.applyStandard(d,ctx()),/قبلاً/,'applied once')}
console.log(`qa_template_people_hr: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
