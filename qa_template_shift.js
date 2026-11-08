// QA: shift plan of the new panel (migration stage 5) — newpanel/core/js/shift-write.js
//  one monthly plan (js/00 monthlyCellKey shape, sub-section of «سالن» as location), person-day values, agreed shifts,
//  coverage against staffingRequirements (holiday → Friday pattern, day before → Thursday), copy tools, draft/publish,
//  conflict check, requirement grid (cleared rows become inactive), holidays; staff readers skip draft plans.
// Run: node qa_template_shift.js
'use strict';
const fs=require('fs'),path=require('path');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const throws=(f,re,m)=>{try{f();ok(false,m+' (no error)')}catch(e){ok(re.test(e.message),m+' → '+e.message)}};
global.window={};eval(fs.readFileSync(path.join(__dirname,'newpanel/core/js/attendance-core.js'),'utf8'));eval(fs.readFileSync(path.join(__dirname,'newpanel/core/js/shift-write.js'),'utf8'));
const SW=window.ShiftWrite,C=window.RayoAttendanceCore,clone=x=>JSON.parse(JSON.stringify(x));
const ctx=()=>({actor:'qa',at:'2026-11-08T10:00:00.000Z'});
const hr0={personnel:[{id:'A',name:'علی',status:'فعال',section:'سالن',subSection:'سالن بالا',mainPosition:'ویتر',salaryContract:{type:'fixedMonthly',monthlyShifts:30}},{id:'B',name:'بهار',status:'فعال',section:'بار',mainPosition:'باریستا',salaryContract:{type:'hourly',monthlyShifts:26}},{id:'X',name:'رفته',status:'اتمام همکاری',section:'بار',mainPosition:'باریستا'}],
 monthlyPlans:[{id:'MPL-00001',year:1405,month:7,notes:'',cells:{},createdAt:'',updatedAt:'',copiedFrom:''}],
 staffingRequirements:[{id:'REQ-00001',dayIndex:0,shift:'عصر',section:'سالن',subSection:'سالن بالا',position:'ویتر',requiredCount:1,active:true},{id:'REQ-00002',dayIndex:0,shift:'عصر',section:'بار',subSection:'',position:'باریستا',requiredCount:1,active:true},{id:'REQ-00003',dayIndex:6,shift:'صبح',section:'بار',subSection:'',position:'باریستا',requiredCount:2,active:true}],holidays:[],lists:{}};
const days=SW.monthDays(1405,9),sat=days.find(d=>SW.weekday(d)===0);
ok(days.length===30&&C.weekdayName(sat)==='شنبه','calendar from attendance core (Saturday = 0)');
// location and key shape = js/00 monthlyCellKey + js/03 location
ok(SW.personLocation(hr0.personnel[0])==='سالن بالا'&&SW.personLocation(hr0.personnel[1])==='بار','location: hall sub-section, otherwise section');
ok(SW.cellKey('1405/09/01','سالن بالا','ویتر','صبح')===`1405/09/01|${encodeURIComponent('سالن بالا')}~${encodeURIComponent('ویتر')}|صبح`,'cell key = date|enc(location)~enc(position)|shift');
// person-day values
let cells={};const A=hr0.personnel[0],B=hr0.personnel[1];
SW.setDay(cells,A,sat,'me');ok(SW.dayValue(SW.assignments(cells),'A',sat)==='me'&&Object.keys(cells).length===2,'double shift = morning + evening at the person\'s own place');
SW.setDay(cells,A,sat,'e');ok(SW.dayValue(SW.assignments(cells),'A',sat)==='e'&&Object.keys(cells).length===1,'back to evening keeps one cell');
ok(SW.nextValue('off')==='m'&&SW.nextValue('me')==='off','cycle آف → صبح → عصر → دو شیفت → آف');
SW.setDay(cells,B,sat,'e');SW.setDay(cells,B,days[1],'me');
const cnt=SW.personCount(SW.assignments(cells),'B',1405,9);ok(cnt.shifts===3&&cnt.doubles===1&&cnt.days===2&&SW.agreedShifts(B)===26,'shift count (double = 2) against agreed monthly shifts');
// coverage
let cov=SW.coverage(hr0,cells,sat,'عصر');ok(cov.status==='complete'&&cov.required===2&&cov.people===2,'Saturday evening complete');
SW.setDay(cells,A,sat,'off');cov=SW.coverage(hr0,cells,sat,'عصر');ok(cov.status==='shortage'&&cov.shortage===1,'shortage when a required place is empty');
const hr1=clone(hr0);hr1.holidays=[{id:'HOL-00001',date:sat,title:'تعطیل',active:true}];ok(SW.patternDay(hr1,sat)===6&&SW.coverage(hr1,{},sat,'صبح').required===2,'official holiday uses the Friday pattern');
ok(SW.patternDay(hr1,C.addDays(sat,-1))===5,'the day before a holiday uses the Thursday pattern');
ok(SW.daysWithoutPattern(hr0).join()==='1,2,3,4,5','days without staffing needs are reported');
// conflicts
const cc={};SW.addTo(cc,'A',sat,'سالن بالا','ویتر','عصر');SW.addTo(cc,'A',sat,'بار','باریستا','عصر');ok(SW.conflicts(cc).length===1,'same person in two places of one shift is a conflict');
// save, draft, publish
let hr=clone(hr0);cells={};SW.setDay(cells,A,sat,'e');SW.setDay(cells,B,sat,'e');
const r=SW.savePlan(hr,ctx(),{year:1405,month:9,cells,baseSig:SW.sig(undefined)});const p=SW.planOf(hr,1405,9);
ok(r.status==='draft'&&p.id==='MPL-00002'&&SW.isDraft(p)&&Object.keys(p.cells).length===2,'new plan saved as a draft (MPL id continues)');
throws(()=>SW.savePlan(hr,ctx(),{year:1405,month:9,cells,baseSig:SW.sig({})}),/کاربر دیگری/,'save over a newer plan is refused');
throws(()=>SW.savePlan(hr,ctx(),{year:1405,month:9,cells,baseSig:SW.sig(p.cells)}),/تغییری/,'no-op save refused');
throws(()=>SW.savePlan(hr,ctx(),{year:1405,month:9,cells:cc,baseSig:SW.sig(p.cells)}),/دو جا/,'conflicting plan refused');
throws(()=>SW.savePlan(hr,ctx(),{year:1405,month:9,cells:{[SW.cellKey('1405/10/01','بار','باریستا','صبح')]:['B']},baseSig:SW.sig(p.cells)}),/خارج از این ماه/,'cells of another month refused');
throws(()=>SW.savePlan(hr,ctx(),{year:1405,month:9,cells:{[SW.cellKey(sat,'بار','باریستا','صبح')]:['ZZ']},baseSig:SW.sig(p.cells)}),/پیدا نشد/,'unknown person refused');
SW.setPublished(hr,ctx(),{year:1405,month:9,publish:true});ok(p.status==='published'&&p.publishedBy==='qa','publish');
throws(()=>SW.setPublished(hr,ctx(),{year:1405,month:9,publish:true}),/قبلاً/,'publish twice refused');
SW.setPublished(hr,ctx(),{year:1405,month:9,publish:false});ok(SW.isDraft(p),'back to draft');
ok(!SW.isDraft(hr.monthlyPlans[0]),'older plans without status count as published');
// staff readers (current panel) skip draft plans
const s22=fs.readFileSync(path.join(__dirname,'js/22-staff-panel.js'),'utf8'),s29=fs.readFileSync(path.join(__dirname,'js/29-training-checklists-v9-7-0.js'),'utf8');
ok(s22.includes("A(hr.monthlyPlans).filter(p=>p&&p.status!=='draft')")&&s29.includes("A(state.monthlyPlans).filter(p=>p&&p.status!=='draft')"),'staff panel and checklists skip draft plans');
{const i=s22.indexOf('function flattenShifts('),j=s22.indexOf('\n',i),flat=new Function('hr','A','S',s22.slice(i,j)+';return flattenShifts()'),Ar=x=>Array.isArray(x)?x:[],Sr=x=>String(x??'');
 const view=clone(hr);ok(flat(view,Ar,Sr).length===0,'staff panel: a draft plan shows nothing');
 view.monthlyPlans.find(x=>x.year===1405&&x.month===9).status='published';const rows=flat(view,Ar,Sr);
 ok(rows.length===2&&rows.some(r=>r.personnelId==='A'&&r.section==='سالن بالا'&&r.position==='ویتر'&&r.shift==='عصر'&&r.date===sat),'staff panel reads a published plan saved by the new panel (same key shape)')}
// copy tools
const prev={};SW.addTo(prev,'B','1405/08/03','بار','باریستا','صبح');SW.addTo(prev,'X','1405/08/03','بار','باریستا','صبح');
const cp=SW.copyFromMonth(prev,1405,9,1405,8,{activeIds:['A','B']}),target=days.find(d=>SW.weekday(d)===SW.weekday('1405/08/03'));
ok(Object.keys(cp).length>=1&&Object.entries(cp).every(([k,v])=>v.join()==='B')&&Object.keys(cp).some(k=>k.startsWith(target)),'copy from previous month: same weekday pattern, people who left are dropped');
const wk={};SW.setDay(wk,A,days[0],'m');SW.setDay(wk,B,days[2],'me');const rep=SW.copyWeek(wk,1405,9,days[0]);
ok(SW.dayValue(SW.assignments(rep),'A',days[7])==='m'&&SW.dayValue(SW.assignments(rep),'B',days[9])==='me'&&SW.dayValue(SW.assignments(rep),'A',days[28])==='m','one week repeated to the end of the month');
throws(()=>SW.copyWeek(wk,1405,9,days[26]),/کمتر از یک هفته/,'a week that does not fit is refused');
// requirements grid
hr=clone(hr0);const base=SW.reqGrid(hr),g={...base};const k1=SW.reqKey(hr.staffingRequirements[0]);g[k1]=0;g['3|صبح|بار||باریستا']=2;
const n=SW.saveRequirements(hr,ctx(),{grid:g,baseSig:JSON.stringify(base)});
ok(n===2&&hr.staffingRequirements[0].active===false&&hr.staffingRequirements.length===4&&hr.staffingRequirements[3].id==='REQ-00004'&&hr.staffingRequirements[3].requiredCount===2,'cleared requirement → inactive (kept); new one gets the next REQ id');
throws(()=>SW.saveRequirements(hr,ctx(),{grid:g,baseSig:JSON.stringify(base)}),/کاربر دیگری/,'requirements changed meanwhile are refused');
throws(()=>SW.saveRequirements(hr,ctx(),{grid:{'3|صبح|بار||باریستا':-1}}),/بین/,'negative count refused');
g[k1]=1;SW.saveRequirements(hr,ctx(),{grid:g});ok(hr.staffingRequirements[0].active===true&&hr.staffingRequirements[0].requiredCount===1&&hr.staffingRequirements.length===4,'re-enabled requirement reuses its row');
// holidays
hr=clone(hr0);SW.saveHoliday(hr,ctx(),{date:'۱۴۰۵/۰۹/۱۰',title:'تعطیلی'});ok(hr.holidays[0].date==='1405/09/10'&&hr.holidays[0].id==='HOL-00001','holiday saved (Persian digits)');
throws(()=>SW.saveHoliday(hr,ctx(),{date:'1405/09/10',title:'تعطیلی'}),/تغییری/,'same holiday refused');
SW.saveHoliday(hr,ctx(),{date:'1405/09/10',active:false});ok(hr.holidays.length===1&&hr.holidays[0].active===false,'holiday deactivated, not removed');
throws(()=>SW.saveHoliday(hr,ctx(),{date:'1405/09/11',title:''}),/عنوان/,'title required');
console.log(`qa_template_shift: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
