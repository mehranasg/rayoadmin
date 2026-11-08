/* =========================================================
   Rayo UI Template — people-write.js
   Staff entries from the new panel onto the live personnel module (stage 13), with the current panel's shapes:
     tip       → tipGroups {id TIPG-YYYYMM-NNNN, receiveDate, type, totalAmount, receiveMethod, status, settledAmount,
                 settlementDate, settlementMethod, notes, participants[{personnelId, weight}]} (js/00 saveTip);
                 void = status «ابطال‌شده» with a reason (tipStatuses list), never removed
     penalty   → penaltiesRewards {id PR-NNNNN, date, personnelId, type, amount, reason, status, approvedBy, notes, year,
                 month} (js/00 savePenalty); cancel = status «لغوشده»
     message   → dailyMessages {id MSG-NNNNN, date, title, text, isArchived, createdAt, createdBy} (js/34); archive flag
     reservation → reservations {id RES-NNNNN, …, status «رزرو»} (js/22); status change, never removed
   The whole personnel document is loaded fresh inside each save and written back unchanged except for these
   collections, so staff passwords and bank fields stay exactly as they are (they are never shown on the page).
   ========================================================= */
(function(){
'use strict';
const A=x=>Array.isArray(x)?x:[];
const S=x=>String(x??'').trim();
const NUM=v=>{if(typeof v==='number')return v;const s=S(v).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/٫/g,'.').replace(/[٬,،\s]/g,'');if(!s)return 0;const n=Number(s);return Number.isFinite(n)?n:NaN};
const D=v=>window.InvEngine.D(v);
const clone=x=>JSON.parse(JSON.stringify(x));
const uid=(prefix,arr,width=5)=>{let mx=0;A(arr).forEach(x=>{const m=S(x.id).match(/(\d+)$/);if(m)mx=Math.max(mx,+m[1])});return `${prefix}-${String(mx+1).padStart(width,'0')}`};
const validDate=d=>!!d&&window.InvEngine.CAL.i(d)!==null;
const assertDate=(d,l='تاریخ')=>{if(!validDate(d))throw Error(`${l} معتبر نیست (مثال ۱۴۰۵/۰۸/۱۷)`)};
const list=(doc,k,def)=>A(doc?.lists?.[k]).length?A(doc.lists[k]):def;
const TIP_TYPES=['فردی','سالن','کلی'],TIP_STATUS=['ثبت‌شده','تسویه جزئی','تسویه‌شده','ابطال‌شده'],PAY=['نقدی','کارت به کارت','واریز به حساب','کسر از صندوق','سایر'],PR_TYPES=['جریمه','تشویقی'],APPROVAL=['پیش‌نویس','تاییدشده','لغوشده'];
const RES_STATUS=['رزرو','انجام‌شده','لغوشده','نیامد'];
const person=(doc,id)=>A(doc.personnel).find(p=>p.id===id);
// js/00 tipCode: TIPG-<year><month>-<4 digits>, numbered within the month of the tip date
function tipCode(doc,date){const [y,m]=date.split('/'),prefix=`TIPG-${y}${m}-`;let mx=0;A(doc.tipGroups).filter(x=>S(x.id).startsWith(prefix)).forEach(x=>mx=Math.max(mx,+S(x.id).split('-').pop()||0));return prefix+String(mx+1).padStart(4,'0')}
// js/00 tipDefaultSelectedV5: «کلی» = everyone active, «سالن» = hall group in the hall sections, «فردی» = nobody preselected
function tipDefault(type,p){if(type==='کلی')return true;if(type==='سالن')return p.personnelGroup==='سالن'&&['سالن بالا','سالن پایین','بار','هاست'].includes(p.section);return false}

/* ---------- tips ---------- */
function addTip(doc,ctx,x){const date=D(x.date);assertDate(date);const type=list(doc,'tipTypes',TIP_TYPES).includes(x.type)?x.type:'',total=NUM(x.totalAmount);if(!type)throw Error('نوع انعام را انتخاب کنید');if(!(total>0))throw Error('مبلغ انعام باید مثبت باشد');
 const parts=A(x.participants).map(p=>({personnelId:S(p.personnelId),weight:NUM(p.weight)>0?NUM(p.weight):1})).filter(p=>p.personnelId);if(!parts.length)throw Error('حداقل یک نفر را انتخاب کنید');if(parts.some(p=>!person(doc,p.personnelId)))throw Error('پرسنل انتخاب‌شده پیدا نشد');if(new Set(parts.map(p=>p.personnelId)).size!==parts.length)throw Error('یک نفر دو بار انتخاب شده است');
 const status=list(doc,'tipStatuses',TIP_STATUS).includes(x.status)?x.status:'ثبت‌شده',settled=NUM(x.settledAmount)||0;if(status==='ابطال‌شده')throw Error('انعام جدید را با وضعیت ابطال ثبت نکنید');if(settled<0||settled>total)throw Error('مبلغ تسویه باید بین صفر و مبلغ کل باشد');
 doc.tipGroups=A(doc.tipGroups);const row={id:tipCode(doc,date),receiveDate:date,type,totalAmount:total,receiveMethod:S(x.receiveMethod)||PAY[0],status:status==='تسویه‌شده'&&!settled?'تسویه‌شده':status,settledAmount:status==='تسویه‌شده'&&!settled?total:settled,settlementDate:D(x.settlementDate)||'',settlementMethod:S(x.settlementMethod),notes:S(x.notes),participants:parts,createdAt:ctx.at,createdBy:ctx.actor,source:'ui-template'};
 doc.tipGroups.push(row);ctx.auditExtra={entityId:row.id,total,people:parts.length};return row}
function settleTip(doc,ctx,{id,status,settledAmount,settlementDate,settlementMethod}){const g=A(doc.tipGroups).find(x=>x.id===id);if(!g)throw Error('انعام پیدا نشد');if(g.status==='ابطال‌شده')throw Error('این انعام ابطال شده است');
 const st=['ثبت‌شده','تسویه جزئی','تسویه‌شده'].includes(status)?status:'',amt=st==='تسویه‌شده'?NUM(g.totalAmount):NUM(settledAmount);if(!st)throw Error('وضعیت تسویه را انتخاب کنید');if(!(amt>=0)||amt>NUM(g.totalAmount))throw Error('مبلغ تسویه باید بین صفر و مبلغ کل باشد');if(st==='تسویه جزئی'&&!(amt>0&&amt<NUM(g.totalAmount)))throw Error('برای تسویهٔ جزئی، مبلغ باید بیشتر از صفر و کمتر از مبلغ کل باشد');
 const sd=D(settlementDate);if(st!=='ثبت‌شده')assertDate(sd,'تاریخ تسویه');ctx.auditExtra={entityId:id,before:{status:g.status,settledAmount:g.settledAmount,settlementDate:g.settlementDate,settlementMethod:g.settlementMethod}};
 Object.assign(g,{status:st,settledAmount:st==='ثبت‌شده'?0:amt,settlementDate:st==='ثبت‌شده'?'':sd,settlementMethod:st==='ثبت‌شده'?'':S(settlementMethod),updatedAt:ctx.at,updatedBy:ctx.actor});return g}
function voidTip(doc,ctx,{id,reason}){reason=S(reason);if(!reason)throw Error('علت ابطال لازم است');const g=A(doc.tipGroups).find(x=>x.id===id);if(!g)throw Error('انعام پیدا نشد');if(g.status==='ابطال‌شده')throw Error('این انعام قبلاً ابطال شده است');ctx.auditExtra={entityId:id,before:clone(g),reason};Object.assign(g,{status:'ابطال‌شده',voidReason:reason,voidedAt:ctx.at,voidedBy:ctx.actor});return g}

/* ---------- penalties and rewards ---------- */
function addPenalty(doc,ctx,x){const date=D(x.date);assertDate(date);const pid=S(x.personnelId),amount=NUM(x.amount);if(!person(doc,pid))throw Error('پرسنل را انتخاب کنید');if(!(amount>0))throw Error('مبلغ باید مثبت باشد');
 const type=list(doc,'penaltyRewardTypes',PR_TYPES).includes(x.type)?x.type:'';if(!type)throw Error('نوع را انتخاب کنید');const status=list(doc,'approvalStatuses',APPROVAL).includes(x.status)&&x.status!=='لغوشده'?x.status:'پیش‌نویس';if(!S(x.reason))throw Error('علت را بنویسید');
 const [y,m]=date.split('/').map(Number);doc.penaltiesRewards=A(doc.penaltiesRewards);const row={id:uid('PR',doc.penaltiesRewards),date,personnelId:pid,type,amount,reason:S(x.reason),status,approvedBy:status==='تاییدشده'?S(x.approvedBy)||ctx.actor:S(x.approvedBy),notes:S(x.notes),year:y,month:m,createdAt:ctx.at,createdBy:ctx.actor,source:'ui-template'};
 doc.penaltiesRewards.push(row);ctx.auditExtra={entityId:row.id,personnelId:pid,type,amount};return row}
function setPenaltyStatus(doc,ctx,{id,status,reason}){const x=A(doc.penaltiesRewards).find(r=>r.id===id);if(!x)throw Error('ثبت پیدا نشد');if(!['تاییدشده','لغوشده'].includes(status))throw Error('وضعیت نامعتبر است');if(x.status===status)throw Error('وضعیت تغییری نکرده است');if(x.status==='لغوشده')throw Error('ثبت لغوشده دوباره فعال نمی‌شود؛ ثبت تازه بزنید');if(status==='لغوشده'&&!S(reason))throw Error('علت لغو لازم است');
 ctx.auditExtra={entityId:id,before:{status:x.status},reason:S(reason)};Object.assign(x,{status,...(status==='تاییدشده'?{approvedBy:x.approvedBy||ctx.actor}:{cancelReason:S(reason),cancelledAt:ctx.at,cancelledBy:ctx.actor}),updatedAt:ctx.at,updatedBy:ctx.actor});return x}

/* ---------- daily message ---------- */
function addMessage(doc,ctx,{date,title,text}){date=D(date)||window.InvEngine.CAL.today;assertDate(date);if(!S(text))throw Error('متن پیام الزامی است');doc.dailyMessages=A(doc.dailyMessages);const row={id:uid('MSG',doc.dailyMessages),date,title:S(title),text:S(text),isArchived:false,createdAt:ctx.at,createdBy:ctx.actor};doc.dailyMessages.push(row);ctx.auditExtra={entityId:row.id};return row}
function archiveMessage(doc,ctx,{id}){const x=A(doc.dailyMessages).find(m=>m.id===id);if(!x)throw Error('پیام پیدا نشد');if(x.isArchived)throw Error('این پیام قبلاً بایگانی شده است');Object.assign(x,{isArchived:true,archivedAt:ctx.at});ctx.auditExtra={entityId:id};return x}

/* ---------- reservations ---------- */
function addReservation(doc,ctx,x){const date=D(x.date);assertDate(date);const name=S(x.customerName),phone=S(x.phone).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)),size=NUM(x.partySize);if(!name||!phone||!(size>0))throw Error('نام، تلفن و تعداد نفر الزامی است');const dep=NUM(x.depositAmount)||0;if(dep<0)throw Error('بیعانه نامعتبر است');
 doc.reservations=A(doc.reservations);const row={id:uid('RES',doc.reservations),date,time:S(x.time),customerName:name,phone,partySize:size,area:S(x.area),depositAmount:dep,depositMethod:dep?S(x.depositMethod):'',notes:S(x.notes),status:'رزرو',createdByPersonnelId:'',createdByName:ctx.actor,createdAt:ctx.at,source:'ui-template'};doc.reservations.push(row);ctx.auditExtra={entityId:row.id};return row}
function setReservationStatus(doc,ctx,{id,status}){const r=A(doc.reservations).find(x=>x.id===id);if(!r)throw Error('رزرو پیدا نشد');if(!RES_STATUS.includes(status))throw Error('وضعیت نامعتبر است');if(r.status===status)throw Error('وضعیت تغییری نکرده است');ctx.auditExtra={entityId:id,before:{status:r.status}};Object.assign(r,{status,updatedAt:ctx.at,updatedBy:ctx.actor});return r}

const validPersonnel=doc=>!!doc&&typeof doc==='object'&&Array.isArray(doc.personnel)&&Array.isArray(doc.tipGroups);
window.PeopleWrite={TIP_TYPES,TIP_STATUS,PAY,PR_TYPES,APPROVAL,RES_STATUS,tipCode,tipDefault,addTip,settleTip,voidTip,addPenalty,setPenaltyStatus,addMessage,archiveMessage,addReservation,setReservationStatus,validPersonnel,list};
})();
