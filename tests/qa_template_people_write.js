// QA: newpanel/core/js/people-write.js — tips, penalties/rewards, daily messages and reservations (synthetic data only).
// Run: node qa_template_people_write.js
'use strict';
const fs=require('fs'),path=require('path');
global.window={};
for(const f of ['inventory-engine.js','inventory-write.js','people-write.js'])eval(fs.readFileSync(path.join(__dirname,'../app/core/js',f),'utf8'));
const W=window.InvWrite,PW=window.PeopleWrite,E=window.InvEngine;
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const throws=(f,re,m)=>{try{f();ok(false,m+' (no error)')}catch(e){ok(re.test(e.message),m+' → '+e.message)}};
const T=E.CAL.today,day=k=>E.CAL.k(E.CAL.i(T)-k),[ty,tm]=T.split('/');
const doc=()=>({meta:{},settings:{adminUsers:[{username:'a',salt:'S',passwordHash:'H'}]},lists:{tipTypes:['فردی','سالن','کلی'],tipStatuses:['ثبت‌شده','تسویه جزئی','تسویه‌شده','ابطال‌شده'],penaltyRewardTypes:['جریمه','تشویقی'],approvalStatuses:['پیش‌نویس','تاییدشده','لغوشده']},
 personnel:[{id:'EMP-1',name:'مریم',status:'فعال',personnelGroup:'سالن',section:'بار',userPassword:'secret',cardNumber:'6037991234567890'},{id:'EMP-2',name:'رضا',status:'فعال',personnelGroup:'آشپزخانه',section:'آشپزخانه'}],
 tipGroups:[{id:`TIPG-${ty}${tm}-0007`,receiveDate:T,type:'فردی',totalAmount:100,participants:[{personnelId:'EMP-1',weight:1}]}],penaltiesRewards:[{id:'PR-00030'}],dailyMessages:[],reservations:[],changeLog:[{id:'LOG-00321',action:'old'}]});
const ctx=()=>({actor:'qa-admin',at:new Date().toISOString(),reqId:'R'+Math.random().toString(36).slice(2,6),module:'personnel'});

let d=doc(),c=ctx();const t=PW.addTip(d,c,{date:T,type:'سالن',totalAmount:'۶۰۰٬۰۰۰',participants:[{personnelId:'EMP-1',weight:2},{personnelId:'EMP-2',weight:''}]});
ok(t.id===`TIPG-${ty}${tm}-0008`&&t.totalAmount===600000&&t.participants[1].weight===1&&t.status==='ثبت‌شده'&&t.settledAmount===0,'tip id numbered in its month; weight defaults to 1');
ok(PW.tipDefault('سالن',d.personnel[0])===true&&PW.tipDefault('سالن',d.personnel[1])===false&&PW.tipDefault('سالن',{personnelGroup:'سالن',section:'بار'})===true&&PW.tipDefault('کلی',d.personnel[1]),'default selection like js/00');
throws(()=>PW.addTip(d,ctx(),{date:T,type:'سالن',totalAmount:0,participants:[{personnelId:'EMP-1'}]}),/مثبت/,'tip amount required');
throws(()=>PW.addTip(d,ctx(),{date:T,type:'سالن',totalAmount:10,participants:[]}),/حداقل یک نفر/,'participants required');
throws(()=>PW.addTip(d,ctx(),{date:T,type:'x',totalAmount:10,participants:[{personnelId:'EMP-1'}]}),/نوع/,'unknown tip type refused');
PW.settleTip(d,ctx(),{id:t.id,status:'تسویه‌شده',settlementDate:T,settlementMethod:'نقدی'});ok(t.status==='تسویه‌شده'&&t.settledAmount===600000&&t.settlementDate===T,'full settlement takes the total');
throws(()=>PW.settleTip(d,ctx(),{id:t.id,status:'تسویه جزئی',settledAmount:600000,settlementDate:T}),/کمتر از مبلغ کل/,'partial must be below the total');
c=ctx();PW.voidTip(d,c,{id:t.id,reason:'تکراری'});ok(t.status==='ابطال‌شده'&&c.auditExtra.before.status==='تسویه‌شده'&&d.tipGroups.length===2,'void = status, record kept');
throws(()=>PW.settleTip(d,ctx(),{id:t.id,status:'تسویه‌شده',settlementDate:T}),/ابطال/,'voided tip cannot be settled');

const p=PW.addPenalty(d,ctx(),{date:day(3),personnelId:'EMP-2',type:'جریمه',amount:'50000',status:'پیش‌نویس',reason:'تأخیر'});
ok(p.id==='PR-00031'&&p.year===+day(3).slice(0,4)&&p.month===+day(3).slice(5,7)&&p.status==='پیش‌نویس','penalty like js/00 savePenalty');
throws(()=>PW.addPenalty(d,ctx(),{date:T,personnelId:'EMP-2',type:'جریمه',amount:1}),/علت/,'reason required');
const wf=PW.addPenalty(d,ctx(),{date:day(3),personnelId:'EMP-2',type:'جریمه',amount:'20000',status:'تاییدشده',reason:'پرتی/خسارت: شیر',source:'waste',sourceKind:'waste',sourceId:'WST-000007'});ok(wf.source==='waste'&&wf.sourceKind==='waste'&&wf.sourceId==='WST-000007','fine linked to its waste record');
throws(()=>PW.addPenalty(d,ctx(),{date:day(3),personnelId:'EMP-2',type:'جریمه',amount:'1000',reason:'x',source:'waste',sourceId:'WST-000007'}),/قبلاً/,'one active fine per waste record');
PW.setPenaltyStatus(d,ctx(),{id:p.id,status:'تاییدشده'});ok(p.status==='تاییدشده'&&p.approvedBy==='qa-admin','approve');
throws(()=>PW.setPenaltyStatus(d,ctx(),{id:p.id,status:'لغوشده'}),/علت لغو/,'cancel needs a reason');
PW.setPenaltyStatus(d,ctx(),{id:p.id,status:'لغوشده',reason:'اشتباه'});throws(()=>PW.setPenaltyStatus(d,ctx(),{id:p.id,status:'تاییدشده'}),/لغوشده/,'cancelled stays cancelled');

const m=PW.addMessage(d,ctx(),{date:T,title:'سلام',text:'روز خوب'});ok(m.id==='MSG-00001'&&m.isArchived===false,'daily message');PW.archiveMessage(d,ctx(),{id:m.id});ok(m.isArchived&&m.archivedAt,'archive message');
const r=PW.addReservation(d,ctx(),{date:T,customerName:'خانم الف',phone:'۰۹۱۲۰۰۰۰۰۰۰',partySize:4,depositAmount:500000,depositMethod:'نقدی'});ok(r.id==='RES-00001'&&r.phone==='09120000000'&&r.status==='رزرو','reservation like js/22');
PW.setReservationStatus(d,ctx(),{id:r.id,status:'انجام‌شده'});ok(r.status==='انجام‌شده','reservation status');throws(()=>PW.addReservation(d,ctx(),{date:T,customerName:'',phone:'1',partySize:1}),/الزامی/,'reservation fields required');

// staff app: leave request of the person (legacy js/22 shape), no past days, no overlap with a waiting request
{const d=doc(),c=ctx(),f=E.CAL.k(E.CAL.i(T)+3),t=E.CAL.k(E.CAL.i(T)+4);const r=PW.requestLeave(d,c,{personnelId:'EMP-1',type:'مرخصی استحقاقی',fromDate:f,toDate:t,count:'',note:'سفر'});
 ok(r.id==='LREQ-00001'&&r.status==='در انتظار'&&r.count===2&&r.employeeNote==='سفر'&&d.leaveRequests.length===1,'leave request saved waiting for the manager');
 throws(()=>PW.requestLeave(d,c,{personnelId:'EMP-1',fromDate:t,toDate:t}),/در انتظار/,'overlapping waiting request refused');
 throws(()=>PW.requestLeave(d,c,{personnelId:'EMP-1',fromDate:E.CAL.k(E.CAL.i(T)-2),toDate:T}),/گذشته/,'past days refused');
 const p=d.personnel[0];p.username='maryam';p.userAccess={enabled:true,permissions:{cashReport:true,inventoryTransfers:true}};PW.saveAccount(d,c,{id:'EMP-1',username:'maryam',enabled:true,permissions:['beverageControl']});
 ok(p.userAccess.permissions.beverageControl===true&&p.userAccess.permissions.cashReport===false&&p.userAccess.permissions.inventoryTransfers===true,'account form: listed keys set, keys not in the form kept')}
// staff app: a tip or a reservation names the person who registered it
{const d=doc(),c={...ctx(),staff:{personnelId:'EMP-2',name:'رضا'}};const t=PW.addTip(d,c,{date:T,type:'سالن',totalAmount:100000,participants:[{personnelId:'EMP-1'}]});ok(t.createdByPersonnelId==='EMP-2'&&t.createdByName==='رضا','staff tip names the person');
 const r=PW.addReservation(d,c,{date:T,customerName:'مهمان',phone:'۰۹۱۲',partySize:2});ok(r.createdByPersonnelId==='EMP-2'&&r.createdByName==='رضا'&&r.status==='رزرو','staff reservation names the person');
 const t2=PW.addTip(d,ctx(),{date:T,type:'سالن',totalAmount:1000,participants:[{personnelId:'EMP-1'}]});ok(!('createdByPersonnelId' in t2),'manager tip unchanged')}
(async()=>{const srv={t:JSON.stringify(doc())},io={module:'personnel',validate:PW.validPersonnel,load:async()=>JSON.parse(srv.t),save:async x=>{srv.t=JSON.stringify(x)},actor:()=>'qa-admin',pricing:()=>null};
 await W.edit(io,{action:'TIP_ADDED',mutate:(x,cx)=>PW.addTip(x,cx,{date:T,type:'کلی',totalAmount:1000,participants:[{personnelId:'EMP-1'}]})});const s=JSON.parse(srv.t);
 ok(s.tipGroups.length===2&&s.personnel[0].userPassword==='secret'&&s.personnel[0].cardNumber==='6037991234567890'&&s.settings.adminUsers[0].passwordHash==='H','sensitive fields are written back unchanged');
 ok(s.changeLog[0].action==='TIP_ADDED'&&/^LOG-/.test(s.changeLog[0].id)&&s.changeLog.at(-1).action==='old','audit row first in the personnel log');
 console.log(`qa_template_people_write: ${pass} passed, ${fail} failed`);process.exit(fail?1:0)})();
