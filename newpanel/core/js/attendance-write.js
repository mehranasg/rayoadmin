/* Rayo new panel — attendance entries (migration stage 4). The rules engine is core/js/attendance-core.js, an unchanged
   copy of the current panel's js/50 (qa_template_attendance_sync.js). Data: the `attendance` module (settings, punches,
   importBatches, overrides, monthSaves, auditLog) and, for payroll, personnel.monthlyAdjustments / penaltiesRewards.
   Owner decisions (one attendance module, based on the face-recognition device export):
   - a day edit is saved at once (new override, previous archived, audit row); punches are never changed
   - «ثابت کردن ماه» = the month snapshot (js/50 applyMonthSave without drafts)
   - «انتقال به حقوق» writes the frozen month into the month's payroll adjustment:
       hourly pay  → hours = worked − early arrival not counted as overtime − overtime not approved; approved overtime
                     paid with the overtime factor; lateness recorded and decided by the manager (optional draft fine)
       fixed salary→ undertime = shortfall (late + early exit + rest overrun) + absent days × average required day;
                     approved overtime paid; lateness is part of the shortfall (no second deduction)
     refused while a day is undetermined or overtime is still pending, or when the payroll month is closed
   - staff correction requests (personnel.attendanceCorrections) are approved into a day edit of the attendance module */
(function(){
'use strict';
const C=()=>window.RayoAttendanceCore,A=x=>Array.isArray(x)?x:[],S=x=>String(x??'').trim(),clone=x=>JSON.parse(JSON.stringify(x));
const N=v=>{const n=Number(String(v??'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));return Number.isFinite(n)?n:0};
const r2=x=>Math.round(x*100)/100;
const ready=doc=>!!doc&&!!doc.settings&&Array.isArray(doc.settings.weekly);
const pad=n=>String(n).padStart(2,'0');

/* ---------- settings ---------- */
function flat(o,pre='',out={}){for(const [k,v] of Object.entries(o||{})){const p=pre?`${pre}.${k}`:k;if(v&&typeof v==='object')flat(v,p,out);else out[p]=v}return out}
function saveSettings(doc,ctx,{settings,baseJson}){if(!ready(doc))throw Error('ماژول حضور و غیاب مقداردهی اولیه نشده است');if(baseJson!==undefined&&JSON.stringify(doc.settings)!==baseJson)throw Error('تنظیمات پس از باز شدن این صفحه توسط کاربر دیگری تغییر کرده است؛ صفحه را تازه کنید');
 const errs=C().validateSettings(settings);if(errs.length)throw Error(errs[0]);const a=flat(doc.settings),b=flat(settings),changes=[...new Set([...Object.keys(a),...Object.keys(b)])].filter(k=>JSON.stringify(a[k])!==JSON.stringify(b[k])).map(path=>({path,old:a[path]??null,new:b[path]??null}));
 if(!changes.length)throw Error('تغییری داده نشده است');doc.auditLog=[...A(doc.auditLog),{id:C().nextId(doc.auditLog,'ATA',7),at:ctx.at,by:ctx.actor,kind:'settings',changes}];doc.settings=clone(settings);return changes.length}

/* ---------- day edits, saved at once (js/50 applyMonthSave day loop) ---------- */
function writeOverride(doc,ctx,{personnelId,businessDate,next,baseSig,note}){
 const cur=C().overrideFor(doc.overrides,personnelId,businessDate);if(baseSig!==undefined&&C().overrideSignature(cur)!==baseSig)throw Error(`اصلاح روز ${businessDate} پس از باز شدن این صفحه توسط کاربر دیگری تغییر کرده است؛ صفحه را تازه کنید`);
 const clean=C().cleanOverride(next),changes=C().overrideChanges(cur,clean);if(!changes.length)return false;
 doc.overrides=A(doc.overrides).slice();if(cur){const i=doc.overrides.indexOf(cur);doc.overrides[i]={...cur,isArchived:true,archivedAt:ctx.at,archivedBy:ctx.actor}}
 if(clean)doc.overrides.push({id:C().nextId(doc.overrides,'ATO',6),personnelId,businessDate,...clean,createdAt:ctx.at,createdBy:ctx.actor,replaces:cur?.id||'',...(note?{source:note}:{})});
 doc.auditLog=[...A(doc.auditLog),{id:C().nextId(doc.auditLog,'ATA',7),at:ctx.at,by:ctx.actor,kind:'day',action:clean?(cur?'edit':'create'):'reset',personnelId,businessDate,changes}];return true}
function saveDay(doc,ctx,{personnelId,businessDate,override,baseSig}){if(!ready(doc))throw Error('ماژول حضور و غیاب مقداردهی اولیه نشده است');if(!personnelId||!C().jParts?.(businessDate)&&!/^\d{4}\/\d{2}\/\d{2}$/.test(S(businessDate)))throw Error('روز معتبر نیست');
 if(!writeOverride(doc,ctx,{personnelId,businessDate,next:override,baseSig}))throw Error('تغییری داده نشده است');return true}
function freezeMonth(doc,ctx,{personnelId,year,month,useCurrentSettings=false}){if(!ready(doc))throw Error('ماژول حضور و غیاب مقداردهی اولیه نشده است');const r=C().applyMonthSave(doc,{personnelId,year,month,drafts:{},base:{},user:ctx.actor,at:ctx.at,useCurrentSettings});Object.assign(doc,r.doc);return{saveId:r.saveId,days:r.days.length}}
// decide every pending overtime of a person-month at once (approve / reject); each day keeps its other edits
function decideOvertime(doc,ctx,{personnelId,year,month,decision,note=''}){if(!['approve','reject'].includes(decision))throw Error('تصمیم معتبر نیست');
 const days=C().computeMonth({punches:doc.punches,overrides:doc.overrides,settings:C().monthSettings(doc,personnelId,year,month,true),personnelId,year,month});let n=0;
 for(const d of days){if(!(d.overtime?.pending>0))continue;const cur=C().overrideFor(doc.overrides,personnelId,d.businessDate)||{};const next={...clone(cur),overtime:{decision,...(S(note)?{note:S(note)}:{})}};for(const k of ['id','personnelId','businessDate','createdAt','createdBy','replaces','isArchived','archivedAt','archivedBy','source'])delete next[k];if(writeOverride(doc,ctx,{personnelId,businessDate:d.businessDate,next}))n++}
 if(!n)throw Error('اضافه‌کار در انتظاری نیست');return n}
// every past undetermined day of a person-month without any punch gets one status at once (آف or غیبت)
function settleEmptyDays(doc,ctx,{personnelId,year,month,status,today}){if(!['off','absent'].includes(status))throw Error('وضعیت معتبر نیست');
 const days=C().computeMonth({punches:doc.punches,overrides:doc.overrides,settings:C().monthSettings(doc,personnelId,year,month,true),personnelId,year,month});let n=0;
 for(const d of days){if(d.status!=='undetermined'||(today&&d.businessDate>today)||C().punchesFor(doc.punches,personnelId,d.businessDate).length)continue;const cur=C().overrideFor(doc.overrides,personnelId,d.businessDate)||{},next={...clone(cur),status};for(const k of ['id','personnelId','businessDate','createdAt','createdBy','replaces','isArchived','archivedAt','archivedBy','source'])delete next[k];if(writeOverride(doc,ctx,{personnelId,businessDate:d.businessDate,next}))n++}
 if(!n)throw Error('روز تعیین‌نشدهٔ بدون تردد نیست');return n}
function importFile(doc,ctx,{parsed,fileName,personnel}){if(!ready(doc))throw Error('ماژول حضور و غیاب مقداردهی اولیه نشده است');const errs=C().validateSettings(doc.settings);if(errs.length)throw Error('تنظیمات حضور و غیاب روی سرور معتبر نیست');
 const plan=C().planImport({parsed,existingPunches:doc.punches||[],personnel,mapping:{},settings:doc.settings}),r=C().applyImport(doc,plan,{parsed,fileName,user:ctx.actor,at:new Date(ctx.at)});Object.assign(doc,r.doc);
 return{batchId:r.batchId,fresh:plan.fresh.length,duplicates:plan.duplicates.length,unmapped:plan.unmapped.length,rejected:A(parsed.rejected).length,affected:plan.affectedDays.length}}
// device codes on personnel (hr.personnel[].attendanceCode, unique)
function saveCodes(hr,ctx,{codes}){const by=new Map;for(const [pid,c] of Object.entries(codes||{})){const code=S(c).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d));if(!code)continue;if(by.has(code))throw Error(`کد ${code} برای دو نفر وارد شده است`);by.set(code,pid)}
 let n=0;for(const p of A(hr.personnel)){if(!(p.id in (codes||{})))continue;const code=S(codes[p.id]).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d));const other=A(hr.personnel).find(o=>o.id!==p.id&&!(o.id in codes)&&S(o.attendanceCode)===code&&code);if(other)throw Error(`کد ${code} برای ${other.name} ثبت شده است`);if(S(p.attendanceCode)!==code){if(code)p.attendanceCode=code;else delete p.attendanceCode;n++}}
 if(!n)throw Error('تغییری داده نشده است');ctx.auditExtra={changed:n};return n}

/* ---------- staff correction requests → day edit ---------- */
function correctionToDay(doc,ctx,{correction,approvedIn,approvedOut}){const bd=S(correction.date),cur=C().overrideFor(doc.overrides,correction.personnelId,bd)||{},next=clone(cur);for(const k of ['id','personnelId','businessDate','createdAt','createdBy','replaces','isArchived','archivedAt','archivedBy','source'])delete next[k];
 const add=A(next.addedPunches);let k=add.length;if(S(approvedIn))add.push({id:`ADD-${correction.id}-in`,time:S(approvedIn),type:'in'});if(S(approvedOut))add.push({id:`ADD-${correction.id}-out`,time:S(approvedOut),type:'out'});if(add.length===k)throw Error('ساعت ورود یا خروج تأییدشده را وارد کنید');
 next.addedPunches=add;next.note=[S(next.note),`اصلاح درخواست پرسنل ${correction.id}`].filter(Boolean).join(' — ');writeOverride(doc,ctx,{personnelId:correction.personnelId,businessDate:bd,next,note:`correction:${correction.id}`});return true}
function reviewCorrection(hr,ctx,{id,status,note,approvedIn,approvedOut}){const c=A(hr.attendanceCorrections).find(x=>x.id===id);if(!c)throw Error('درخواست پیدا نشد');if(S(c.status||'در انتظار')!=='در انتظار')throw Error('این درخواست قبلاً بررسی شده است');if(!['تاییدشده','ردشده'].includes(status))throw Error('نتیجه را انتخاب کنید');if(status==='ردشده'&&!S(note))throw Error('برای رد، علت لازم است');
 Object.assign(c,{status,managerNote:S(note),reviewedAt:ctx.at,reviewedBy:ctx.actor,...(status==='تاییدشده'?{approvedIn:S(approvedIn),approvedOut:S(approvedOut),appliedTo:'attendance'}:{})});ctx.auditExtra={entityId:id,status};return status}

/* ---------- frozen month → payroll ---------- */
function payrollFigures(save,person,{today=''}={}){const days=A(save?.days),t=C().monthTotals(days,{today}),last=save?`${save.year}/${pad(save.month)}/${pad(C().monthLength(+save.year,+save.month))}`:'',fixed=person?.salaryContract?.type==='fixedMonthly'&&N(person.salaryContract.monthlySalary)>0,earlyOT=save?.settings?.earlyArrivalCountsAsOvertime===true;
 const rawOT=days.reduce((s,d)=>s+N(d.overtime?.raw),0),earlyNotOT=earlyOT?0:days.reduce((s,d)=>s+N(d.earlyArrival),0),unapproved=Math.max(0,rawOT-t.approvedOvertime),avgDay=t.presentDays?t.required/t.presentDays:0,absentMin=t.absent*avgDay;
 const blockers=[];if(today&&last&&today<last)blockers.push(`ماه هنوز تمام نشده است (تا ${last})`);if(t.undetermined)blockers.push(`${t.undetermined} روز تعیین‌نشده`);if(t.pendingOvertime>0)blockers.push(`${Math.round(t.pendingOvertime)} دقیقه اضافه‌کار در انتظار تصمیم`);
 return{fixed,totals:t,blockers,hours:r2(Math.max(0,t.worked-earlyNotOT-unapproved)/60),overtimeHours:r2(t.approvedOvertime/60),undertimeHours:fixed?r2((t.deficit+absentMin)/60):0,lateMinutes:Math.round(t.late),absentDays:t.absent,absentMinutes:Math.round(absentMin),avgDayMinutes:Math.round(avgDay)}}
function applyToPayroll(hr,ctx,{personnelId,year,month,save,latePenalty=0,closed=false,today=''}){const p=A(hr.personnel).find(x=>x.id===personnelId);if(!p)throw Error('پرسنل پیدا نشد');if(closed)throw Error('حقوق این ماه قطعی شده است؛ انتقال ممکن نیست');if(!save||save.status!=='active')throw Error('ماه حضور و غیاب این نفر ثابت نشده است');
 const f=payrollFigures(save,p,{today});if(f.blockers.length)throw Error('قبل از انتقال تعیین کنید: '+f.blockers.join('، '));
 hr.monthlyAdjustments=A(hr.monthlyAdjustments);let a=hr.monthlyAdjustments.find(x=>x.personnelId===personnelId&&+x.year===+year&&+x.month===+month);
 const uid=(prefix,arr,w=5)=>{let m=0;A(arr).forEach(x=>{const q=S(x.id).match(/(\d+)$/);if(q)m=Math.max(m,+q[1])});return `${prefix}-${String(m+1).padStart(w,'0')}`};
 if(!a){a={id:uid('ADJ',hr.monthlyAdjustments),personnelId,year:+year,month:+month,hoursOverride:'',overtimeHours:'',estimatedHours:'',overtimePerformance:0,otherPayment:0,otherDeduction:0,notes:''};hr.monthlyAdjustments.push(a)}
 const before={hoursOverride:a.hoursOverride,overtimeHours:a.overtimeHours,undertimeHours:a.undertimeHours,attendanceLateMinutes:a.attendanceLateMinutes};
 Object.assign(a,{hoursOverride:f.hours,overtimeHours:f.overtimeHours,undertimeHours:f.fixed?f.undertimeHours:'',attendanceLateMinutes:f.lateMinutes,delaySource:'attendance',delayDisplayOnly:true,hoursFromAttendance:true,attendanceSaveId:save.id,attendanceAppliedAt:ctx.at,attendanceAppliedBy:ctx.actor});
 hr.penaltiesRewards=A(hr.penaltiesRewards);const old=hr.penaltiesRewards.find(x=>x.source==='attendance-late'&&x.personnelId===personnelId&&+x.year===+year&&+x.month===+month&&x.status!=='لغوشده');const amt=Math.round(N(latePenalty));
 if(amt>0){const last=`${year}/${pad(month)}/${pad(C().monthLength(+year,+month))}`,reason=`تأخیر ${C().MONTHS?.[month-1]||month} (${f.lateMinutes} دقیقه)`;
  if(old&&old.status==='تاییدشده')throw Error('جریمهٔ تأخیر این ماه قبلاً تأیید شده است؛ اول در «حقوق ماه» لغوش کنید');
  if(old)Object.assign(old,{amount:amt,reason,updatedAt:ctx.at});else hr.penaltiesRewards.push({id:uid('PR',hr.penaltiesRewards),date:last,personnelId,type:'جریمه',amount:amt,reason,status:'پیش‌نویس',source:'attendance-late',sourceId:save.id,year:+year,month:+month,createdAt:ctx.at,createdBy:ctx.actor})}
 else if(old&&old.status==='پیش‌نویس')old.status='لغوشده';
 ctx.auditExtra={personnelId,year,month,saveId:save.id,before,after:{hours:f.hours,overtimeHours:f.overtimeHours,undertimeHours:f.undertimeHours,late:f.lateMinutes},latePenalty:amt};return f}
// per person-month state for the board
function payrollState(hr,save,personnelId,year,month){const a=A(hr?.monthlyAdjustments).find(x=>x.personnelId===personnelId&&+x.year===+year&&+x.month===+month);if(!save)return'none';if(!a||!a.attendanceSaveId)return a&&S(a.hoursOverride)!==''?'manual':'frozen';return a.attendanceSaveId===save.id?'applied':'stale'}

window.AttendanceWrite={ready,saveSettings,saveDay,freezeMonth,decideOvertime,settleEmptyDays,importFile,saveCodes,correctionToDay,reviewCorrection,payrollFigures,applyToPayroll,payrollState};
})();
