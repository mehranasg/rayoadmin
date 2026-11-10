// QA: attendance of the new panel (migration stage 4).
//  - newpanel/core/js/attendance-core.js must be an unchanged copy of js/50-attendance-core.js (one rules engine)
//  - newpanel/core/js/attendance-write.js: day edit saved at once, freeze, overtime decisions, codes, staff corrections,
//    and the transfer of a frozen month into payroll (hourly: hours; fixed: shortfall + absence; approved overtime).
// Uses seed/attendance-data.seed.json (settings only) and docs/rayo-attendance-sample.punches.csv. Run: node qa_template_attendance.js
'use strict';
const fs=require('fs'),path=require('path');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const throws=(f,re,m)=>{try{f();ok(false,m+' (no error)')}catch(e){ok(re.test(e.message),m+' → '+e.message)}};
ok(fs.readFileSync(path.join(__dirname,'../legacy/js/50-attendance-core.js'),'utf8')===fs.readFileSync(path.join(__dirname,'../app/core/js/attendance-core.js'),'utf8'),'attendance-core.js is the same file as js/50 (copy it again after any change of js/50)');
global.window={};eval(fs.readFileSync(path.join(__dirname,'../app/core/js/attendance-core.js'),'utf8'));eval(fs.readFileSync(path.join(__dirname,'../app/core/js/attendance-write.js'),'utf8'));
const C=window.RayoAttendanceCore,AW=window.AttendanceWrite,clone=x=>JSON.parse(JSON.stringify(x));
const seed=JSON.parse(fs.readFileSync(path.join(__dirname,'../legacy/seed/attendance-data.seed.json'),'utf8'));
const parsed=C.parseSheets([{name:'x',rows:C.parseCsv(fs.readFileSync(path.join(__dirname,'fixtures/rayo-attendance-sample.punches.csv'),'utf8'))}]);
const people=['101','102','103','104','105','106'].map(c=>({id:`EMP-${c}`,attendanceCode:c}));
const ctx=()=>({actor:'qa',at:'2026-11-08T10:00:00.000Z',reqId:'R1',module:'attendance'});
let doc=clone(seed);ok(AW.ready(doc),'seed has settings');
const imp=AW.importFile(doc,ctx(),{parsed,fileName:'s.csv',personnel:people});ok(imp.fresh>0&&doc.punches.length===imp.fresh&&doc.importBatches.length===1,'import through core planImport/applyImport');
const again=AW.importFile(doc,ctx(),{parsed,fileName:'s.csv',personnel:people});ok(again.fresh===0&&again.duplicates===imp.fresh,'re-import adds no duplicates');
// day edit saved at once, conflict check, archive of the previous version
const bd='1405/08/02',pid='EMP-101';AW.saveDay(doc,ctx(),{personnelId:pid,businessDate:bd,override:{slots:{s2:'17:30'},note:'خروج فراموش شده'},baseSig:''});
let ov=C.overrideFor(doc.overrides,pid,bd);ok(ov&&ov.slots.s2==='17:30'&&doc.auditLog.at(-1).kind==='day'&&doc.auditLog.at(-1).action==='create','day edit stored immediately with an audit row');
throws(()=>AW.saveDay(doc,ctx(),{personnelId:pid,businessDate:bd,override:{status:'off'},baseSig:''}),/کاربر دیگری/,'edit over a newer version is refused');
AW.saveDay(doc,ctx(),{personnelId:pid,businessDate:bd,override:{slots:{s2:'17:45'}},baseSig:C.overrideSignature(ov)});ok(doc.overrides.filter(o=>o.businessDate===bd&&o.personnelId===pid).length===2&&doc.overrides.find(o=>o.businessDate===bd&&o.isArchived)&&C.overrideFor(doc.overrides,pid,bd).replaces===ov.id,'previous version archived, never deleted');
throws(()=>AW.saveDay(doc,ctx(),{personnelId:pid,businessDate:bd,override:{slots:{s2:'17:45'}}}),/تغییری/,'no-op edit refused');
ok(doc.punches.length===imp.fresh,'punches never change');
// overtime decisions for a month
const days=C.computeMonth({punches:doc.punches,overrides:doc.overrides,settings:doc.settings,personnelId:pid,year:1405,month:8}),pend=days.filter(d=>d.overtime?.pending>0).length;
if(pend){const n=AW.decideOvertime(doc,ctx(),{personnelId:pid,year:1405,month:8,decision:'approve'});ok(n===pend&&C.computeMonth({punches:doc.punches,overrides:doc.overrides,settings:doc.settings,personnelId:pid,year:1405,month:8}).every(d=>!(d.overtime?.pending>0)),'all pending overtime approved at once')}else ok(true,'no pending overtime in sample');
// freeze
const fr=AW.freezeMonth(doc,ctx(),{personnelId:pid,year:1405,month:8});const save=C.activeMonthSave(doc.monthSaves,pid,1405,8);ok(save&&save.id===fr.saveId&&save.status==='active','freeze = active month snapshot (js/50 applyMonthSave)');
// payroll transfer
const hr=()=>({settings:{},personnel:[{id:pid,name:'الف',hourlyRate:100000,salaryContract:{type:'hourly',monthlySalary:0}},{id:'EMP-F',name:'ب',salaryContract:{type:'fixedMonthly',monthlySalary:20000000}}],monthlyAdjustments:[],penaltiesRewards:[]});
const f=AW.payrollFigures(save,hr().personnel[0]);
const t=C.monthTotals(save.days);
if(f.blockers.length){throws(()=>AW.applyToPayroll(hr(),ctx(),{personnelId:pid,year:1405,month:8,save}),/قبل از انتقال/,'undetermined days or pending overtime block the transfer');
 // settle undetermined days as «off» and freeze again
 for(const d of save.days.filter(d=>d.status==='undetermined'))AW.saveDay(doc,ctx(),{personnelId:pid,businessDate:d.businessDate,override:{status:'off'}});AW.freezeMonth(doc,ctx(),{personnelId:pid,year:1405,month:8})}
const save2=C.activeMonthSave(doc.monthSaves,pid,1405,8),f2=AW.payrollFigures(save2,hr().personnel[0]);ok(!f2.blockers.length,'after deciding the days nothing blocks the transfer');
let h=hr();AW.applyToPayroll(h,ctx(),{personnelId:pid,year:1405,month:8,save:save2,latePenalty:50000});const a=h.monthlyAdjustments[0],t2=C.monthTotals(save2.days);
ok(a.hoursOverride===f2.hours&&a.overtimeHours===f2.overtimeHours&&a.undertimeHours===''&&a.delaySource==='attendance'&&a.delayDisplayOnly===true&&a.attendanceSaveId===save2.id&&a.attendanceLateMinutes===Math.round(t2.late),'hourly: hours and approved overtime into the month adjustment, lateness recorded');
ok(f2.hours<=t2.worked/60+1e-9,'hourly hours never exceed worked time');
ok(h.penaltiesRewards.length===1&&h.penaltiesRewards[0].status==='پیش‌نویس'&&h.penaltiesRewards[0].source==='attendance-late'&&h.penaltiesRewards[0].year===1405&&h.penaltiesRewards[0].month===8&&h.penaltiesRewards[0].type==='کسر تأخیر','lateness as a draft «کسر تأخیر» for the manager');
AW.applyToPayroll(h,ctx(),{personnelId:pid,year:1405,month:8,save:save2,latePenalty:0});ok(h.monthlyAdjustments.length===1&&h.penaltiesRewards[0].status==='لغوشده','re-transfer updates the same adjustment; no fine → the draft fine is cancelled');
ok(AW.payrollState(h,save2,pid,1405,8)==='applied','board state: applied');
throws(()=>AW.applyToPayroll(hr(),ctx(),{personnelId:pid,year:1405,month:8,save:save2,closed:true}),/قطعی/,'closed payroll month refused');
throws(()=>AW.applyToPayroll(hr(),ctx(),{personnelId:pid,year:1405,month:8,save:save2,today:'1405/08/20'}),/تمام نشده/,'a month that has not ended is not transferred');
const ff=AW.payrollFigures({...save2,personnelId:'EMP-F'},hr().personnel[1]);ok(ff.fixed&&Math.abs(ff.undertimeHours-(t2.deficit+ff.absentMinutes)/60)<0.01,'fixed salary: undertime = shortfall + absent days × average day');
// device codes and staff correction requests
const hc={personnel:[{id:'A',name:'a'},{id:'B',name:'b',attendanceCode:'7'}]};throws(()=>AW.saveCodes(hc,ctx(),{codes:{A:'7'}}),/ثبت شده/,'device code unique');ok(AW.saveCodes(hc,ctx(),{codes:{A:'۸'}})===1&&hc.personnel[0].attendanceCode==='8','device code saved (Persian digits)');
const corr={id:'ATTC-00001',personnelId:pid,date:'1405/08/03',requestedIn:'09:00',requestedOut:'17:30',status:'در انتظار'};
AW.correctionToDay(doc,ctx(),{correction:corr,approvedIn:'09:00',approvedOut:'17:30'});const co=C.overrideFor(doc.overrides,pid,'1405/08/03');ok(co.addedPunches.length===2&&/ATTC-00001/.test(co.note)&&co.source==='correction:ATTC-00001','approved correction becomes a day edit');
const hr2={attendanceCorrections:[clone(corr)]};AW.reviewCorrection(hr2,ctx(),{id:corr.id,status:'تاییدشده',approvedIn:'09:00',approvedOut:'17:30'});ok(hr2.attendanceCorrections[0].status==='تاییدشده'&&hr2.attendanceCorrections[0].appliedTo==='attendance','correction request marked approved');
throws(()=>AW.reviewCorrection({attendanceCorrections:[clone(corr)]},ctx(),{id:corr.id,status:'ردشده',note:''}),/علت/,'reject needs a reason');
// empty days settled at once
{const d2=clone(seed);AW.importFile(d2,ctx(),{parsed,fileName:'s.csv',personnel:people});const before=C.monthTotals(C.computeMonth({punches:d2.punches,overrides:d2.overrides,settings:d2.settings,personnelId:'EMP-102',year:1405,month:8}),{today:'1405/08/30'});const n=AW.settleEmptyDays(d2,ctx(),{personnelId:'EMP-102',year:1405,month:8,status:'off',today:'1405/08/30'});const after=C.monthTotals(C.computeMonth({punches:d2.punches,overrides:d2.overrides,settings:d2.settings,personnelId:'EMP-102',year:1405,month:8}),{today:'1405/08/30'});
 ok(n>0&&after.off>=n&&after.undetermined<before.undetermined&&after.presentDays===before.presentDays,'days without punches set «آف» at once; days with punches untouched');throws(()=>AW.settleEmptyDays(d2,ctx(),{personnelId:'EMP-102',year:1405,month:8,status:'off',today:'1405/08/30'}),/نیست/,'nothing left to settle')}
// settings
const s=clone(doc.settings);s.standardRestMin=90;ok(AW.saveSettings(doc,ctx(),{settings:s,baseJson:JSON.stringify(doc.settings)})===1&&doc.settings.standardRestMin===90&&doc.auditLog.at(-1).kind==='settings','settings saved with audit');
const bad=clone(doc.settings);bad.windows.morning.from='25:00';throws(()=>AW.saveSettings(doc,ctx(),{settings:bad}),/./,'invalid settings refused (js/50 validateSettings)');
console.log(`qa_template_attendance: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
