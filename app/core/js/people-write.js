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
function tipDefault(type,p){if(type==='کلی')return true;if(type==='سالن')return p.personnelGroup==='سالن'&&['سالن بالا','سالن پایین','بار','هاست','صندوق و پذیرش'].includes(p.section);return false}

/* ---------- tips ---------- */
function addTip(doc,ctx,x){const date=D(x.date);assertDate(date);const type=list(doc,'tipTypes',TIP_TYPES).includes(x.type)?x.type:'',total=NUM(x.totalAmount);if(!type)throw Error('نوع انعام را انتخاب کنید');if(!(total>0))throw Error('مبلغ انعام باید مثبت باشد');
 const parts=A(x.participants).map(p=>({personnelId:S(p.personnelId),weight:NUM(p.weight)>0?NUM(p.weight):1})).filter(p=>p.personnelId);if(!parts.length)throw Error('حداقل یک نفر را انتخاب کنید');if(parts.some(p=>!person(doc,p.personnelId)))throw Error('پرسنل انتخاب‌شده پیدا نشد');if(new Set(parts.map(p=>p.personnelId)).size!==parts.length)throw Error('یک نفر دو بار انتخاب شده است');
 const status=list(doc,'tipStatuses',TIP_STATUS).includes(x.status)?x.status:'ثبت‌شده',settled=NUM(x.settledAmount)||0;if(status==='ابطال‌شده')throw Error('انعام جدید را با وضعیت ابطال ثبت نکنید');if(settled<0||settled>total)throw Error('مبلغ تسویه باید بین صفر و مبلغ کل باشد');
 doc.tipGroups=A(doc.tipGroups);const row={id:tipCode(doc,date),receiveDate:date,type,totalAmount:total,receiveMethod:S(x.receiveMethod)||PAY[0],status:status==='تسویه‌شده'&&!settled?'تسویه‌شده':status,settledAmount:status==='تسویه‌شده'&&!settled?total:settled,settlementDate:D(x.settlementDate)||'',settlementMethod:S(x.settlementMethod),notes:S(x.notes),participants:parts,shareRoundingStep:5000,createdAt:ctx.at,createdBy:ctx.actor,source:'ui-template'};
 doc.tipGroups.push(row);ctx.auditExtra={entityId:row.id,total,people:parts.length};return row}
function settleTip(doc,ctx,{id,status,settledAmount,settlementDate,settlementMethod}){const g=A(doc.tipGroups).find(x=>x.id===id);if(!g)throw Error('انعام پیدا نشد');if(g.status==='ابطال‌شده')throw Error('این انعام ابطال شده است');
 const st=['ثبت‌شده','تسویه جزئی','تسویه‌شده'].includes(status)?status:'',amt=st==='تسویه‌شده'?NUM(g.totalAmount):NUM(settledAmount);if(!st)throw Error('وضعیت تسویه را انتخاب کنید');if(!(amt>=0)||amt>NUM(g.totalAmount))throw Error('مبلغ تسویه باید بین صفر و مبلغ کل باشد');if(st==='تسویه جزئی'&&!(amt>0&&amt<NUM(g.totalAmount)))throw Error('برای تسویهٔ جزئی، مبلغ باید بیشتر از صفر و کمتر از مبلغ کل باشد');
 const sd=D(settlementDate);if(st!=='ثبت‌شده')assertDate(sd,'تاریخ تسویه');ctx.auditExtra={entityId:id,before:{status:g.status,settledAmount:g.settledAmount,settlementDate:g.settlementDate,settlementMethod:g.settlementMethod}};
 Object.assign(g,{status:st,settledAmount:st==='ثبت‌شده'?0:amt,settlementDate:st==='ثبت‌شده'?'':sd,settlementMethod:st==='ثبت‌شده'?'':S(settlementMethod),updatedAt:ctx.at,updatedBy:ctx.actor});return g}
function voidTip(doc,ctx,{id,reason}){reason=S(reason);if(!reason)throw Error('علت ابطال لازم است');const g=A(doc.tipGroups).find(x=>x.id===id);if(!g)throw Error('انعام پیدا نشد');if(g.status==='ابطال‌شده')throw Error('این انعام قبلاً ابطال شده است');ctx.auditExtra={entityId:id,before:clone(g),reason};Object.assign(g,{status:'ابطال‌شده',voidReason:reason,voidedAt:ctx.at,voidedBy:ctx.actor});return g}

/* ---------- penalties and rewards ---------- */
function addPenalty(doc,ctx,x){const date=D(x.date);assertDate(date);const pid=S(x.personnelId),amount=NUM(x.amount);if(!person(doc,pid))throw Error('پرسنل را انتخاب کنید');if(!(amount>0))throw Error('مبلغ باید مثبت باشد');
 const PC=typeof window!=='undefined'?window.PayrollCore:null,types=PC?PC.config(doc).items.filter(t=>t.active).map(t=>t.title):list(doc,'penaltyRewardTypes',PR_TYPES),type=types.includes(x.type)?x.type:'';if(!type)throw Error('نوع را انتخاب کنید');const status=list(doc,'approvalStatuses',APPROVAL).includes(x.status)&&x.status!=='لغوشده'?x.status:'پیش‌نویس';if(!S(x.reason))throw Error('علت را بنویسید');
 /* salary month: the month of the date, or the first month after it that is not final (stage 6) */const sm=PC?.itemSalaryMonth?.(doc,date),[y,m]=sm?[sm.year,sm.month]:date.split('/').map(Number);doc.penaltiesRewards=A(doc.penaltiesRewards);const row={id:uid('PR',doc.penaltiesRewards),date,personnelId:pid,type,amount,reason:S(x.reason),status,approvedBy:status==='تاییدشده'?S(x.approvedBy)||ctx.actor:S(x.approvedBy),notes:S(x.notes),year:y,month:m,...(sm?.late?{lateFrom:date.slice(0,7)}:{}),createdAt:ctx.at,createdBy:ctx.actor,source:'ui-template'};
 /* a fine from a waste record (same link as the current panel js/32 wasteSaveFine): source waste + sourceKind/sourceId */
 if(S(x.source)==='waste'){if(!S(x.sourceId))throw Error('ثبت پرتی مشخص نیست');if(A(doc.penaltiesRewards).some(r=>r.source==='waste'&&r.sourceId===S(x.sourceId)&&r.status!=='لغوشده'))throw Error('برای این پرتی قبلاً جریمه ثبت شده است');Object.assign(row,{source:'waste',sourceKind:S(x.sourceKind)||'waste',sourceId:S(x.sourceId)})}
 doc.penaltiesRewards.push(row);ctx.auditExtra={entityId:row.id,personnelId:pid,type,amount};return row}
function setPenaltyStatus(doc,ctx,{id,status,reason}){const x=A(doc.penaltiesRewards).find(r=>r.id===id);if(!x)throw Error('ثبت پیدا نشد');if(!['تاییدشده','لغوشده'].includes(status))throw Error('وضعیت نامعتبر است');if(x.status===status)throw Error('وضعیت تغییری نکرده است');if(x.status==='لغوشده')throw Error('ثبت لغوشده دوباره فعال نمی‌شود؛ ثبت تازه بزنید');const PC=typeof window!=='undefined'?window.PayrollCore:null;if(PC?.isClosed(doc,x.year,x.month))throw Error('حقوق آن ماه قطعی شده است؛ تغییر نمی‌کند — اصلاحیه را در ماه باز ثبت کنید یا ماه را بازگشایی کنید');if(status==='لغوشده'&&!S(reason))throw Error('علت لغو لازم است');
 ctx.auditExtra={entityId:id,before:{status:x.status},reason:S(reason)};Object.assign(x,{status,...(status==='تاییدشده'?{approvedBy:x.approvedBy||ctx.actor}:{cancelReason:S(reason),cancelledAt:ctx.at,cancelledBy:ctx.actor}),updatedAt:ctx.at,updatedBy:ctx.actor});return x}

/* ---------- daily message ---------- */
function addMessage(doc,ctx,{date,title,text}){date=D(date)||window.InvEngine.CAL.today;assertDate(date);if(!S(text))throw Error('متن پیام الزامی است');doc.dailyMessages=A(doc.dailyMessages);const row={id:uid('MSG',doc.dailyMessages),date,title:S(title),text:S(text),isArchived:false,createdAt:ctx.at,createdBy:ctx.actor};doc.dailyMessages.push(row);ctx.auditExtra={entityId:row.id};return row}
function archiveMessage(doc,ctx,{id}){const x=A(doc.dailyMessages).find(m=>m.id===id);if(!x)throw Error('پیام پیدا نشد');if(x.isArchived)throw Error('این پیام قبلاً بایگانی شده است');Object.assign(x,{isArchived:true,archivedAt:ctx.at});ctx.auditExtra={entityId:id};return x}

/* ---------- reservations ---------- */
function addReservation(doc,ctx,x){const date=D(x.date);assertDate(date);const name=S(x.customerName),phone=S(x.phone).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)),size=NUM(x.partySize);if(!name||!phone||!(size>0))throw Error('نام، تلفن و تعداد نفر الزامی است');const dep=NUM(x.depositAmount)||0;if(dep<0)throw Error('بیعانه نامعتبر است');
 doc.reservations=A(doc.reservations);const row={id:uid('RES',doc.reservations),date,time:S(x.time),customerName:name,phone,partySize:size,area:S(x.area),depositAmount:dep,depositMethod:dep?S(x.depositMethod):'',notes:S(x.notes),status:'رزرو',createdByPersonnelId:'',createdByName:ctx.actor,createdAt:ctx.at,source:'ui-template'};doc.reservations.push(row);ctx.auditExtra={entityId:row.id};return row}
function setReservationStatus(doc,ctx,{id,status}){const r=A(doc.reservations).find(x=>x.id===id);if(!r)throw Error('رزرو پیدا نشد');if(!RES_STATUS.includes(status))throw Error('وضعیت نامعتبر است');if(r.status===status)throw Error('وضعیت تغییری نکرده است');ctx.auditExtra={entityId:id,before:{status:r.status}};Object.assign(r,{status,updatedAt:ctx.at,updatedBy:ctx.actor});return r}

const validPersonnel=doc=>!!doc&&typeof doc==='object'&&Array.isArray(doc.personnel)&&Array.isArray(doc.tipGroups);

/* ---------- staff file, salary terms, panel account, violations and leaves (migration stage 3) ----------
   Shapes of the current panel: person js/05 savePersonnelV64 + js/06 savePersonnelBankV641 / savePersonnelAccessV954,
   salary history js/00 recordSalaryTerms, violation js/34 saveViolation (fine → penaltiesRewards, source 'violation'; created «پیش‌نویس» with year/month so the manager approves it in «حقوق ماه» — js/34 used «ثبت‌شده», which payroll never counted),
   leave review js/19 submitLeaveReview, leave js/00 editLeave. Owner decisions:
   - a person is never deleted when anything refers to it; «اتمام همکاری» with an end date instead
   - new salary terms always apply from the current month (salaryHistory keeps earlier months)
   - violations and their fines are recorded, edited and voided only in the current month; void keeps the row
   - a leave's days come from its date range (editable for half days); overlaps are refused; an approved leave is
     cancelled with a reason (count moved to cancelledCount, so every existing sum ignores it)
   - the stored password stays as today (hashing is a later phase); it is never sent back to the page */
const GROUPS=['سالن','آشپزخانه','خدمات'],ENDED='اتمام همکاری',HALL='سالن';
const ACC_ITEMS=['تیشرت','ایپرون','روپوش','کلاه','بیسیم','هندزفری بیسیم','پیجر','تشک','بالش','ملحفه'];
/* handed-over items: the owner's list (lists.equipmentTypes, «تنظیمات ← فهرست‌های پرسنل»); ACC_ITEMS until one is saved */
const accItems=doc=>{const v=[...new Set(A(doc?.lists?.equipmentTypes).map(S).filter(Boolean))];return v.length?v:ACC_ITEMS.slice()};
const baseList=(doc,k)=>k==='equipmentTypes'?accItems(doc):A(doc?.lists?.[k]);
const PERMS=[['cashReport','ثبت گزارش صندوق روزانه'],['purchaseRequests','ثبت سفارش خرید'],['purchaseInvoices','ثبت فاکتور خرید'],['tips','ثبت انعام'],['surveys','ثبت نظرسنجی مشتری'],['suppliersView','مشاهدهٔ اطلاعات تأمین‌کنندگان']];
const mainSection=s=>['سالن بالا','سالن پایین','حیاط','تراس'].includes(S(s))?HALL:S(s);
// js/03 sectionsForGroupV51 / positions lists of the personnel module
/* standard structure (decided 2026-11-10): four groups — مدیریت، سالن (front of house)، آشپزخانه (back of house)، خدمات.
   After the owner applies it (applyStandard), lists.sectionGroups maps every section to its group and
   lists.managementPositions holds the management roles; before that the old three-group lists keep working. */
const STD={groups:['مدیریت','سالن','آشپزخانه','خدمات'],
 sections:{'مدیریت':['مدیریت'],'سالن':['سالن','بار','صندوق و پذیرش','قلیان','پیک','پارکینگ'],'آشپزخانه':['خط گرم','خط سرد','آماده‌سازی','شستشو'],'خدمات':['خدمات']},
 positions:{managementPositions:['مدیر رستوران','سرپرست شیفت','حسابدار'],hallPositions:['گارسون','رانر','هاست','صندوقدار','باریستا','قلیان‌چی','پیک','پارکبان'],kitchenPositions:['سرآشپز','سوشف','آشپز گریل','پیتزازن','پاستازن','آشپز سرد','آماده‌ساز','ظرفشور','اکسپدیتور'],servicePositions:['خدمات و نظافت']},
 kitchenRanks:['سرآشپز','آشپز','کمک‌آشپز'],
 posMap:{'سالن‌کار':'گارسون','ویتر':'گارسون','مدیر/سرپرست':'سرپرست شیفت','مدیریت':'مدیر رستوران','قلیان‌زن':'قلیان‌چی','پارک‌بان':'پارکبان','تخته‌کار':'آماده‌ساز','وسط‌کار':'آماده‌ساز','سالادزن':'آشپز سرد','ساندویچ‌زن':'آشپز سرد','گریل‌کار':'آشپز گریل','فیش‌خوان':'اکسپدیتور','خدماتی':'خدمات و نظافت'},
 secMap:{'هاست':'صندوق و پذیرش','صندوق':'صندوق و پذیرش','قلیان‌خانه':'قلیان'},
 kitchenSecOf:{'سرآشپز':'خط گرم','سوشف':'خط گرم','آشپز گریل':'خط گرم','پیتزازن':'خط گرم','پاستازن':'خط گرم','اکسپدیتور':'خط گرم','آشپز سرد':'خط سرد','آماده‌ساز':'آماده‌سازی','ظرفشور':'شستشو'}};
const POS_KEY={'مدیریت':'managementPositions','سالن':'hallPositions','آشپزخانه':'kitchenPositions','خدمات':'servicePositions'};
const isStd=doc=>!!doc?.lists?.sectionGroups&&typeof doc.lists.sectionGroups==='object';
const groupsOf=doc=>isStd(doc)?STD.groups:['سالن','آشپزخانه','خدمات'];
function sectionsFor(doc,g){const all=[...new Set(A(doc?.lists?.sections).map(mainSection).filter(Boolean))];
 if(isStd(doc)){const m=doc.lists.sectionGroups;return all.filter(x=>(m[x]||'سالن')===g)}
 return g==='آشپزخانه'?all.filter(x=>x==='آشپزخانه'):g==='خدمات'?all.filter(x=>x==='خدمات'):g==='سالن'?all.filter(x=>!['آشپزخانه','خدمات'].includes(x)):[]}
function positionsFor(doc,g){return A(doc?.lists?.[POS_KEY[g]||'hallPositions'])}
/* preview and apply of the standard structure: new lists, every person's group / section / positions, the shift-plan
   cells (location~position keys) and staffing requirements renamed the same way; positions not in the map are kept and
   added to their group's list. The audit row keeps every value before the change (rollback). */
function stdPerson(p){const pos0=S(p.mainPosition),pos=STD.posMap[pos0]||pos0,bpos0=S(p.backupPosition),bpos=STD.posMap[bpos0]||bpos0;let g=S(p.personnelGroup)||'سالن';if(STD.positions.managementPositions.includes(pos))g='مدیریت';
 let sec=mainSection(p.section),sub=S(p.subSection);if(g==='مدیریت'){sec='مدیریت';sub=''}else if(g==='آشپزخانه'){sec=STD.kitchenSecOf[pos]||'خط گرم';sub=''}else if(g==='خدمات'){sec='خدمات';sub=''}else{sec=STD.secMap[sec]||(sec==='مدیریت'?'سالن':sec);if(!STD.sections['سالن'].includes(sec))sec=sec||'سالن';if(sec!=='سالن')sub=''}
 return{personnelGroup:g,section:sec,subSection:sub,mainPosition:pos,backupPosition:bpos===pos?'':bpos,kitchenRank:g==='آشپزخانه'?S(p.kitchenRank):''}}
function stdLocation(loc,pos){const l=S(loc);if(['سالن بالا','سالن پایین','حیاط','تراس'].includes(l))return l;if(l==='آشپزخانه')return STD.kitchenSecOf[pos]||'خط گرم';if(STD.positions.managementPositions.includes(pos))return'مدیریت';return STD.secMap[l]||l}
function standardPlan(doc){const extra={};const people=A(doc.personnel).map(p=>{const to=stdPerson(p),k=POS_KEY[to.personnelGroup];for(const x of [to.mainPosition,to.backupPosition])if(x&&!STD.positions[k].includes(x)&&!Object.values(STD.positions).flat().includes(x))(extra[k]=extra[k]||new Set).add(x);
  const from={personnelGroup:p.personnelGroup,section:p.section,subSection:p.subSection,mainPosition:p.mainPosition,backupPosition:p.backupPosition,kitchenRank:p.kitchenRank};return{id:p.id,name:p.name,status:p.status,from,to,changed:Object.keys(to).some(k=>S(from[k])!==S(to[k]))}});
 // a backup position from another group is cleared (the form only offers the person's own group)
 for(const x of people){const all=[...STD.positions[POS_KEY[x.to.personnelGroup]],...(extra[POS_KEY[x.to.personnelGroup]]||[])];if(x.to.backupPosition&&!all.includes(x.to.backupPosition)){x.to.backupPosition='';x.changed=true}}
 const lists={...STD.positions};for(const [k,set] of Object.entries(extra))lists[k]=[...lists[k],...set];
 const secs=Object.entries(STD.sections).flatMap(([g,ss])=>ss.map(s=>[s,g])),sectionGroups=Object.fromEntries(secs);
 let cells=0,plans=0;for(const pl of A(doc.monthlyPlans)){let n=0;for(const k of Object.keys(pl.cells||{})){const r=stdKey(k);if(r!==k)n++}if(n){cells+=n;plans++}}
 const reqs=A(doc.staffingRequirements).filter(r=>{const pos=STD.posMap[S(r.position)]||S(r.position),sec=stdLocation(r.section,pos);return pos!==S(r.position)||sec!==S(r.section)}).length;
 return{people,lists:{...lists,sections:secs.map(x=>x[0]),sectionGroups,kitchenRanks:STD.kitchenRanks},cells,plans,reqs,already:isStd(doc)}}
function stdKey(k){const p=String(k).split('|');if(p.length!==3)return k;const [l,pos]=String(p[1]).split('~'),dl=decodeURIComponent(l||''),dp=decodeURIComponent(pos||''),np=STD.posMap[dp]||dp,nl=stdLocation(dl,np);return np===dp&&nl===dl?k:`${p[0]}|${encodeURIComponent(nl)}~${encodeURIComponent(np)}|${p[2]}`}
function applyStandard(doc,ctx){const plan=standardPlan(doc);if(plan.already)throw Error('ساختار استاندارد قبلاً اعمال شده است');doc.lists=doc.lists||{};
 const before={lists:{},people:[],cells:{},reqs:[]};for(const k of [...Object.keys(STD.positions),'sections','sectionGroups','kitchenRanks'])before.lists[k]=clone(doc.lists[k]??null);
 Object.assign(doc.lists,plan.lists);
 for(const x of plan.people){if(!x.changed)continue;const p=person(doc,x.id);before.people.push({id:p.id,...x.from,salaryPosition:p.salaryProfile?.position});Object.assign(p,x.to);if(p.salaryProfile)p.salaryProfile.position=p.mainPosition;p.updatedAt=ctx.at;p.updatedBy=ctx.actor}
 for(const pl of A(doc.monthlyPlans)){const old=pl.cells||{},nu={};let ch=false;for(const [k,ids] of Object.entries(old)){const r=stdKey(k);if(r!==k)ch=true;nu[r]=[...new Set([...A(nu[r]),...A(ids)])]}if(ch){before.cells[pl.id]=clone(old);pl.cells=nu;pl.updatedAt=ctx.at}}
 for(const r of A(doc.staffingRequirements)){const pos=STD.posMap[S(r.position)]||S(r.position),sec=stdLocation(r.section,pos);if(pos===S(r.position)&&sec===S(r.section))continue;before.reqs.push({id:r.id,section:r.section,subSection:r.subSection,position:r.position});r.position=pos;r.section=sec;if(!['سالن'].includes(sec)&&!['سالن بالا','سالن پایین'].includes(sec))r.subSection='';r.updatedAt=ctx.at}
 doc.lists.structureVersion='standard-1';ctx.auditExtra={before};return{people:before.people.length,plans:Object.keys(before.cells).length,cells:plan.cells,reqs:before.reqs.length}}
const latinD=v=>S(v).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d));
const today=()=>window.InvEngine.CAL.today,curMonth=()=>today().slice(0,7);
const NN=s=>S(s).normalize('NFKC').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[‌\s]+/g,' ').toLowerCase();
function personDuplicate(doc,{id,name,phone}){const ph=latinD(phone).replace(/\D/g,'');return A(doc.personnel).find(p=>p.id!==id&&((name&&NN(p.name)===NN(name))||(ph.length>=10&&latinD(p.phone).replace(/\D/g,'')===ph)))||null}
function savePerson(doc,ctx,x){
 const old=x.id?person(doc,x.id):null;if(x.id&&!old)throw Error('پرسنل پیدا نشد');const name=S(x.name);if(!name)throw Error('نام و نام خانوادگی الزامی است');
 const g=groupsOf(doc).includes(x.personnelGroup)?x.personnelGroup:'';if(!g)throw Error('گروه کلی را انتخاب کنید');
 const section=mainSection(x.section),sub=g===HALL&&section===HALL?S(x.subSection):'';if(!sectionsFor(doc,g).includes(section))throw Error('سکشن با گروه نمی‌خواند');if(section===HALL&&g===HALL&&!A(doc.lists?.hallSubSections).includes(sub))throw Error('محدودهٔ سالن را انتخاب کنید (سالن بالا یا پایین)');
 const pos=positionsFor(doc,g);if(!pos.includes(S(x.mainPosition)))throw Error('پوزیشن اصلی با گروه نمی‌خواند');if(S(x.backupPosition)&&!pos.includes(S(x.backupPosition)))throw Error('پوزیشن بک‌آپ با گروه نمی‌خواند');
 const start=D(x.startDate);if(S(x.startDate)&&!start)throw Error('تاریخ شروع معتبر نیست');
 const status=list(doc,'employmentStatuses',['فعال','مرخصی','غیرفعال',ENDED]).includes(x.status)?x.status:'فعال',end=D(x.employmentEndDate);
 if(S(x.employmentEndDate)&&!end)throw Error('تاریخ اتمام همکاری معتبر نیست');if(status===ENDED&&!end)throw Error('تاریخ اتمام همکاری الزامی است');if(end&&start&&end<start)throw Error('تاریخ اتمام همکاری نمی‌تواند قبل از تاریخ شروع باشد');
 const phone=latinD(x.phone).replace(/[\s-]/g,'');if(phone&&!/^0\d{10}$/.test(phone))throw Error('شمارهٔ تماس باید ۱۱ رقم و با ۰ شروع شود');
 const acc=x.accommodation&&typeof x.accommodation==='object'?{overnight:x.accommodation.overnight===true,equipment:A(x.accommodation.equipment).filter(e=>accItems(doc).includes(S(e.type))||A(old?.accommodation?.equipment).some(o=>S(o.type)===S(e.type))).map(e=>({type:S(e.type),quantity:Math.max(0,Math.floor(NUM(e.quantity)||0)),deliveredAt:D(e.deliveredAt)||'',notes:S(e.notes)})).filter(e=>e.quantity>0)}:(old?.accommodation||{overnight:false,equipment:[]});
 const o={name,personnelGroup:g,section,subSection:sub,mainPosition:S(x.mainPosition),backupPosition:S(x.backupPosition),kitchenRank:g==='آشپزخانه'?S(x.kitchenRank):'',nationality:S(x.nationality),insurance:S(x.insurance),startDate:start||'',phone,employmentType:S(x.employmentType),status,accommodation:acc,notes:S(x.notes)};
 const before=old?clone(old):null;let p;
 if(old){p=old;Object.assign(p,o)}else{p={id:uid('EMP',doc.personnel,4),gradeId:'D',experienceMonths:0,hourlyRate:0,transportMonthly:0,fixedAllowance:0,monthlyCredit:0,mealCredit:0,salaryContract:{type:'hourly',monthlySalary:0},...o};doc.personnel=[...A(doc.personnel),p]}
 p.employmentEndDate=end||'';delete p.tipGroup;
 p.salaryProfile={position:o.mainPosition,grade:p.gradeId||'D',experienceMonths:p.experienceMonths||0,schedule:{weekdayMorning:0,weekdayEvening:0,thursdayMorning:0,thursdayEvening:0,fridayMorning:0,fridayEvening:0,fullWeekday:0,fullThursday:0,fullFriday:0},returnAid:0,incentive:0,contractMonthly:0,calculationMonth:+today().split('/')[1],updatedAt:ctx.at,...(p.salaryProfile||{}),position:o.mainPosition};
 ctx.auditExtra={entityId:p.id,before:before&&{name:before.name,status:before.status,section:before.section,mainPosition:before.mainPosition}};return{id:p.id,created:!before}}
// js/00 SALARY_TERM_KEYS / salaryTermsOf / recordSalaryTerms (effective = current month only)
const TERM_KEYS=['salaryContract','hourlyRate','transportMonthly','noTransport','fixedAllowance','monthlyCredit','mealCredit','menuCreditDiscountPercent','staffMealMode'];
const termsOf=p=>{const t={};for(const k of TERM_KEYS)if(p?.[k]!==undefined)t[k]=clone(p[k]);t.salaryProfile={mealPerShift:p?.salaryProfile?.mealPerShift??0,returnAid:p?.salaryProfile?.returnAid??0};return t};
const termsCode=e=>NUM(e?.effectiveYear)*100+NUM(e?.effectiveMonth);
function applyLatest(p){const h=A(p.salaryHistory).slice().sort((a,b)=>termsCode(a)-termsCode(b)),e=h.at(-1);if(!e?.terms)return;const t=clone(e.terms);for(const k of TERM_KEYS){if(t[k]!==undefined)p[k]=t[k];else delete p[k]}p.salaryProfile={...(p.salaryProfile||{}),...(t.salaryProfile||{})}}
function recordTerms(p,before,y,m,ctx){const code=y*100+m,entry={effectiveYear:y,effectiveMonth:m,terms:termsOf(p),savedAt:ctx.at,savedBy:ctx.actor};let h=A(p.salaryHistory).slice();
 if(!h.length)h.push({effectiveYear:0,effectiveMonth:0,terms:termsOf(before||{}),savedAt:ctx.at,savedBy:ctx.actor,note:'توافق قبل از ثبت تاریخچه'});h=h.filter(e=>termsCode(e)!==code);h.push(entry);p.salaryHistory=h.sort((a,b)=>termsCode(a)-termsCode(b));applyLatest(p)}
function saveSalaryTerms(doc,ctx,x){const p=person(doc,x.id);if(!p)throw Error('پرسنل پیدا نشد');const type=x.type==='fixedMonthly'?'fixedMonthly':'hourly',monthly=NUM(x.monthlySalary),hourly=NUM(x.hourlyRate);
 if(type==='fixedMonthly'&&!(monthly>0))throw Error('حقوق ثابت ماهانه باید بیشتر از صفر باشد');if(type==='hourly'&&!(hourly>0))throw Error('نرخ ساعتی توافق‌شده باید بیشتر از صفر باشد');
 for(const k of ['transportMonthly','fixedAllowance','monthlyCredit','mealCredit','experienceMonths','monthlyShifts','hoursPerShift'])if(x[k]!==undefined&&!(NUM(x[k])>=0))throw Error('مبالغ، شیفت و سابقه باید صفر یا مثبت باشند');
 const bank={};for(const k of ['accountHolderName','bankName','cardNumber','accountNumber','iban'])if(x[k]!==undefined)bank[k]=S(x[k]);
 if(bank.cardNumber!==undefined){bank.cardNumber=latinD(bank.cardNumber).replace(/[\s-]/g,'');if(bank.cardNumber&&!/^\d{16}$/.test(bank.cardNumber))throw Error('شماره کارت باید ۱۶ رقم باشد')}
 if(bank.iban!==undefined){let b=latinD(bank.iban).replace(/[\s-]/g,'').toUpperCase();if(/^\d{24}$/.test(b))b='IR'+b;if(b&&!/^IR\d{24}$/.test(b))throw Error('شبا باید IR و ۲۴ رقم باشد');bank.iban=b}
 if(bank.accountNumber!==undefined)bank.accountNumber=latinD(bank.accountNumber).replace(/\s/g,'');
 const before=clone(p),[ty,tm]=today().split('/').map(Number),eff=String(x.effective||'').match(/^(\d{4})\/(\d{1,2})$/),[y,m]=eff?[+eff[1],+eff[2]]:[ty,tm];const PC=typeof window!=='undefined'?window.PayrollCore:null;
 if(y*100+m>ty*100+tm)throw Error('ماه اعمال توافق نمی‌تواند بعد از ماه جاری باشد');if(PC&&eff){const st=PC.config(doc).start;if(st&&y*100+m<st.year*100+st.month)throw Error('ماه اعمال قبل از شروع حقوق در نرم‌افزار است');if(PC.isClosed(doc,y,m))throw Error('حقوق آن ماه قطعی شده است')}
 if(x.weeklyShifts!==undefined&&!(NUM(x.weeklyShifts)>=0&&NUM(x.weeklyShifts)<=21))throw Error('شیفت در هفته باید بین ۰ و ۲۱ باشد');
 p.salaryContract={...(p.salaryContract||{}),type,monthlySalary:type==='fixedMonthly'?monthly:0,updatedAt:ctx.at};if(x.weeklyShifts!==undefined)p.salaryContract.weeklyShifts=NUM(x.weeklyShifts)||0;if(type==='fixedMonthly'&&(x.monthlyShifts!==undefined||x.hoursPerShift!==undefined)){const c=p.salaryContract,sh=x.monthlyShifts!==undefined?NUM(x.monthlyShifts):NUM(c.monthlyShifts),hp=x.hoursPerShift!==undefined?NUM(x.hoursPerShift):NUM(c.hoursPerShift);Object.assign(c,{monthlyShifts:sh,hoursPerShift:hp,monthlyHours:Math.round(sh*hp*100)/100,approximateHourly:sh>0&&hp>0?Math.round(monthly/(sh*hp)):0})}p.hourlyRate=type==='hourly'?hourly:NUM(p.hourlyRate)||0;
 /* grade and experience are no longer edited (pay is hourly or fixed monthly); stored values are kept */if(['A','B','C','D'].includes(x.gradeId))p.gradeId=x.gradeId;if(x.experienceMonths!==undefined)p.experienceMonths=NUM(x.experienceMonths)||0;for(const k of ['transportMonthly','fixedAllowance','monthlyCredit','mealCredit'])if(x[k]!==undefined)p[k]=NUM(x[k])||0;
 Object.assign(p,bank);p.salaryProfile={schedule:{},...(p.salaryProfile||{}),position:p.mainPosition,grade:p.gradeId,experienceMonths:p.experienceMonths,updatedAt:ctx.at};
 const changed=JSON.stringify(termsOf(before))!==JSON.stringify(termsOf(p));if(changed)recordTerms(p,before,y,m,ctx);
 ctx.auditExtra={entityId:p.id,effective:changed?`${y}/${String(m).padStart(2,'0')}`:'',termsChanged:changed,bankChanged:Object.keys(bank).length>0};return{id:p.id,changed,effective:`${y}/${String(m).padStart(2,'0')}`}}
// js/06 savePersonnelAccessV954; the name must also differ from the management users
function saveAccount(doc,ctx,x){const p=person(doc,x.id);if(!p)throw Error('پرسنل پیدا نشد');const username=S(x.username),password=S(x.password),enabled=x.enabled===true;
 if(username&&!/^[A-Za-z0-9_.-]{3,32}$/.test(username))throw Error('نام کاربری ۳ تا ۳۲ حرف لاتین، عدد، نقطه، خط تیره یا زیرخط باشد');
 const dup=username&&A(doc.personnel).find(o=>o.id!==p.id&&S(o.username).toLowerCase()===username.toLowerCase());if(dup)throw Error(`نام کاربری «${username}» قبلاً برای ${dup.name} ثبت شده است`);
 if(username&&(A(doc.settings?.adminUsers).some(u=>S(u.username).toLowerCase()===username.toLowerCase())||window.AdminAccess?.isStatic?.(username)))throw Error('این نام کاربری برای یک کاربر مدیریت ثبت شده است');
 const pass=password||S(p.userPassword);if(enabled&&(!username||!pass))throw Error('برای فعال‌کردن پنل، نام کاربری و رمز عبور لازم است');if(password&&password.length<4)throw Error('رمز عبور حداقل ۴ نویسه باشد');
 if(enabled&&p.status!=='فعال')throw Error('پنل فقط برای پرسنل با وضعیت «فعال» باز می‌شود');
 const permissions={};for(const [k] of PERMS)permissions[k]=A(x.permissions).includes(k);p.username=username;if(password)p.userPassword=password;p.userAccess={enabled,permissions,updatedAt:ctx.at};
 ctx.auditExtra={entityId:p.id,enabled,passwordChanged:!!password};return{id:p.id}}
// anything that names the person blocks the delete (the file itself excluded); other modules are checked by the page
function personRefs(doc,id){const out=[],needle=`"${id}"`;for(const [k,v] of Object.entries(doc||{})){if(k==='personnel'||k==='changeLog'||!v||typeof v!=='object')continue;const n=JSON.stringify(v).split(needle).length-1;if(n)out.push([k,n])}return out}
function removePerson(doc,ctx,{id,external=[]}){const p=person(doc,id);if(!p)throw Error('پرسنل پیدا نشد');const refs=[...personRefs(doc,id),...A(external)];if(refs.length)throw Error('این پرونده سابقه دارد و حذف نمی‌شود؛ «اتمام همکاری» بزنید. ('+refs.map(([k,n])=>`${k}: ${n}`).join('، ')+')');
 ctx.auditExtra={entityId:id,before:{name:p.name,status:p.status}};doc.personnel=A(doc.personnel).filter(x=>x.id!==id);return true}

/* violations: current month only (js/34) */
const VIO_VOID='ابطال‌شده';
function violationRepeats(doc,{personnelId,violationType,date,id}){const d=D(date)||today(),i=window.InvEngine.CAL.i(d);return A(doc.workViolations).filter(v=>v.id!==id&&v.status!==VIO_VOID&&v.personnelId===personnelId&&v.violationType===violationType&&window.InvEngine.CAL.i(v.date)!==null&&i-window.InvEngine.CAL.i(v.date)<=90&&i>=window.InvEngine.CAL.i(v.date)).length}
function saveViolation(doc,ctx,x){const date=D(x.date);assertDate(date);if(date.slice(0,7)!==curMonth())throw Error('ثبت یا ویرایش تخلف فقط برای ماه جاری مجاز است');if(date>today())throw Error('تاریخ تخلف نمی‌تواند بعد از امروز باشد');
 const pid=S(x.personnelId),type=S(x.violationType),details=S(x.details);if(!person(doc,pid))throw Error('پرسنل را انتخاب کنید');if(!type)throw Error('نوع تخلف را انتخاب کنید');if(!details)throw Error('شرح تخلف الزامی است');
 const hasFine=x.hasFine===true,fine=hasFine?NUM(x.fineAmount):0;if(hasFine&&!(fine>0))throw Error('مبلغ جریمه را وارد کنید');
 doc.workViolations=A(doc.workViolations);let v=x.id?doc.workViolations.find(r=>r.id===x.id):null;if(x.id&&!v)throw Error('تخلف پیدا نشد');if(v&&v.status===VIO_VOID)throw Error('این تخلف ابطال شده است');if(v&&S(v.date).slice(0,7)!==curMonth())throw Error('تخلف ماه‌های قبل ویرایش نمی‌شود');
 const patch={date,personnelId:pid,violationType:type,details,warningGiven:!!S(x.warningText),warningText:S(x.warningText),hasFine,fineAmount:fine,updatedAt:ctx.at,registeredBy:ctx.actor};
 if(v)Object.assign(v,patch);else{v={id:uid('VIO',doc.workViolations,4),...patch,createdAt:ctx.at};doc.workViolations.push(v)}
 doc.penaltiesRewards=A(doc.penaltiesRewards);const [y,m]=date.split('/').map(Number);
 if(hasFine){let pr=v.penaltyId&&doc.penaltiesRewards.find(r=>r.id===v.penaltyId);if(!pr){pr={id:uid('PR',doc.penaltiesRewards),personnelId:pid,date,type:'جریمه',amount:fine,reason:`تخلف: ${type}`,status:'پیش‌نویس',source:'violation',sourceId:v.id,year:y,month:m,createdAt:ctx.at,createdBy:ctx.actor};doc.penaltiesRewards.push(pr);v.penaltyId=pr.id}else Object.assign(pr,{personnelId:pid,date,amount:fine,reason:`تخلف: ${type}`,status:pr.status==='تاییدشده'?'تاییدشده':'پیش‌نویس',year:y,month:m})}
 else if(v.penaltyId){const pr=doc.penaltiesRewards.find(r=>r.id===v.penaltyId);if(pr)pr.status='لغوشده'}
 ctx.auditExtra={entityId:v.id,penaltyId:v.penaltyId||''};return{id:v.id,penaltyId:hasFine?v.penaltyId:''}}
function voidViolation(doc,ctx,{id,reason}){const v=A(doc.workViolations).find(r=>r.id===id);if(!v)throw Error('تخلف پیدا نشد');if(v.status===VIO_VOID)throw Error('این تخلف قبلاً ابطال شده است');if(S(v.date).slice(0,7)!==curMonth())throw Error('تخلف ماه‌های قبل ابطال نمی‌شود');if(!S(reason))throw Error('علت ابطال لازم است');
 Object.assign(v,{status:VIO_VOID,voidReason:S(reason),voidedAt:ctx.at,voidedBy:ctx.actor});if(v.penaltyId){const pr=A(doc.penaltiesRewards).find(r=>r.id===v.penaltyId);if(pr)pr.status='لغوشده'}ctx.auditExtra={entityId:id};return true}
/* base settings of the personnel module (current panel «تنظیمات و فهرست‌ها»): restaurant name; the selectable lists
   (one item per line; removing an item never changes saved records); leave balance start and monthly entitlement;
   whether staff see their fines in the staff panel */
const BASE_LISTS=[['positions','پوزیشن‌ها'],['sections','سکشن‌ها'],['hallGroups','گروه‌های سالن'],['shiftStatuses','وضعیت‌های شیفت'],['leaveTypes','انواع مرخصی'],['equipmentTypes','وسایل تحویلی به پرسنل']];
function saveBaseSettings(doc,ctx,x){doc.settings=doc.settings&&typeof doc.settings==='object'?doc.settings:{};doc.lists=doc.lists&&typeof doc.lists==='object'?doc.lists:{};const before={restaurantName:doc.settings.restaurantName,leaveBalanceStartDate:doc.settings.leaveBalanceStartDate,monthlyLeaveEntitlementDays:doc.settings.monthlyLeaveEntitlementDays,showPenaltiesToStaff:doc.settings.showPenaltiesToStaff,lists:{}};
 if(x.restaurantName!==undefined){const n=S(x.restaurantName);if(!n)throw Error('نام مجموعه خالی است');doc.settings.restaurantName=n}
 for(const [k,l] of BASE_LISTS)if(x.lists&&x.lists[k]!==undefined){const v=[...new Set(A(x.lists[k]).map(S).filter(Boolean))];if(!v.length)throw Error(`«${l}» حداقل یک مورد لازم دارد`);before.lists[k]=A(doc.lists[k]);doc.lists[k]=v}
 if(x.leaveStart!==undefined){const d=window.InvEngine.D(x.leaveStart);if(!d||window.InvEngine.CAL.i(d)===null)throw Error('تاریخ شروع محاسبهٔ مرخصی معتبر نیست');doc.settings.leaveBalanceStartDate=d}
 if(x.leaveMonthly!==undefined){const n=NUM(x.leaveMonthly);if(!(n>0&&n<=10))throw Error('استحقاق ماهانهٔ مرخصی بین ۰ و ۱۰ روز باشد');doc.settings.monthlyLeaveEntitlementDays=n}
 if(x.showPenalties!==undefined)doc.settings.showPenaltiesToStaff=!!x.showPenalties;
 ctx.auditExtra={before};return true}
function saveViolationTypes(doc,ctx,{types}){const l=[...new Set(A(types).map(S).filter(Boolean))];if(!l.length)throw Error('حداقل یک نوع تخلف لازم است');doc.lists=doc.lists||{};const before=A(doc.lists.violationTypes);doc.lists.violationTypes=l;ctx.auditExtra={before:before.length,after:l.length};return l.length}

/* leaves */
const LEAVE_CANCEL='لغوشده';
const liveLeave=l=>l&&l.status!==LEAVE_CANCEL;
const dayCount=(from,to)=>{const C=window.InvEngine.CAL,a=C.i(from),b=C.i(to);return a===null||b===null?NaN:b-a+1};
function leaveOverlap(doc,{personnelId,fromDate,toDate,id,requestId}){return A(doc.leaves).filter(liveLeave).find(l=>l.id!==id&&(!requestId||l.requestId!==requestId)&&l.personnelId===personnelId&&!(D(l.toDate)<fromDate||D(l.fromDate)>toDate))||null}
function leaveUsed(doc,personnelId,month=curMonth()){const by={};for(const l of A(doc.leaves).filter(liveLeave))if(l.personnelId===personnelId&&S(l.fromDate).slice(0,7)===month)by[l.type||'مرخصی استحقاقی']=(by[l.type||'مرخصی استحقاقی']||0)+(NUM(l.count)||0);return by}
function checkRange(doc,{personnelId,fromDate,toDate,count,type}){const f=D(fromDate),t=D(toDate);assertDate(f,'تاریخ شروع');assertDate(t,'تاریخ پایان');if(t<f)throw Error('تاریخ پایان قبل از شروع است');
 const days=dayCount(f,t),c=S(count)===''?days:NUM(count);if(!(c>0))throw Error('تعداد روز باید مثبت باشد');if(c>days)throw Error(`تعداد روز (${c}) بیشتر از روزهای بازه (${days}) است`);if(c<days-1)throw Error(`تعداد روز (${c}) با بازهٔ ${days} روزه نمی‌خواند؛ برای نیم‌روز فقط تا یک روز کمتر مجاز است`);
 if(!list(doc,'leaveTypes',['مرخصی استحقاقی']).includes(type))throw Error('نوع مرخصی را انتخاب کنید');return{f,t,c}}
function reviewLeave(doc,ctx,{id,status,note}){const r=A(doc.leaveRequests).find(x=>x.id===id);if(!r)throw Error('درخواست پیدا نشد');if((r.status||'در انتظار')!=='در انتظار')throw Error('این درخواست قبلاً بررسی شده است');
 if(!['تاییدشده','ردشده'].includes(status))throw Error('نتیجه را انتخاب کنید');if(status==='ردشده'&&!S(note))throw Error('برای رد درخواست، علت رد لازم است');
 if(status==='تاییدشده'){const {f,t,c}=checkRange(doc,{personnelId:r.personnelId,fromDate:r.fromDate,toDate:r.toDate,count:r.count||'',type:r.type||'مرخصی استحقاقی'}),o=leaveOverlap(doc,{personnelId:r.personnelId,fromDate:f,toDate:t,requestId:r.id});if(o)throw Error(`با مرخصی ${o.fromDate} تا ${o.toDate} هم‌پوشانی دارد`);
  doc.leaves=A(doc.leaves);if(!doc.leaves.some(x=>x.requestId===r.id))doc.leaves.push({id:uid('LEV',doc.leaves,4),requestId:r.id,personnelId:r.personnelId,type:r.type||'مرخصی استحقاقی',fromDate:f,toDate:t,count:c,notes:`تایید درخواست پرسنل${S(note)?` — ${S(note)}`:''}`,createdAt:ctx.at,createdBy:ctx.actor})}
 Object.assign(r,{status,managerNote:S(note),reviewedAt:ctx.at,reviewedBy:ctx.actor});ctx.auditExtra={entityId:id,status};return status}
function addLeave(doc,ctx,x){const pid=S(x.personnelId);if(!person(doc,pid))throw Error('پرسنل را انتخاب کنید');const type=S(x.type)||'مرخصی استحقاقی',{f,t,c}=checkRange(doc,{personnelId:pid,fromDate:x.fromDate,toDate:x.toDate,count:x.count,type});
 const o=leaveOverlap(doc,{personnelId:pid,fromDate:f,toDate:t});if(o)throw Error(`با مرخصی ${o.fromDate} تا ${o.toDate} هم‌پوشانی دارد`);
 doc.leaves=A(doc.leaves);const row={id:uid('LEV',doc.leaves,4),personnelId:pid,type,fromDate:f,toDate:t,count:c,notes:S(x.notes),source:'manager',createdAt:ctx.at,createdBy:ctx.actor};doc.leaves.push(row);ctx.auditExtra={entityId:row.id};return row}
function cancelLeave(doc,ctx,{id,reason}){const l=A(doc.leaves).find(x=>x.id===id);if(!l)throw Error('مرخصی پیدا نشد');if(!liveLeave(l))throw Error('این مرخصی قبلاً لغو شده است');if(!S(reason))throw Error('علت لغو لازم است');
 Object.assign(l,{status:LEAVE_CANCEL,cancelledCount:NUM(l.count)||0,count:0,cancelReason:S(reason),cancelledAt:ctx.at,cancelledBy:ctx.actor});
 const r=l.requestId&&A(doc.leaveRequests).find(x=>x.id===l.requestId);if(r)Object.assign(r,{status:LEAVE_CANCEL,managerNote:`لغو پس از تأیید: ${S(reason)}`,reviewedAt:ctx.at,reviewedBy:ctx.actor});ctx.auditExtra={entityId:id};return true}

window.PeopleWrite={STD,groupsOf,standardPlan,applyStandard,BASE_LISTS,saveBaseSettings,GROUPS,ACC_ITEMS,accItems,baseList,PERMS,ENDED,sectionsFor,positionsFor,personDuplicate,savePerson,saveSalaryTerms,saveAccount,personRefs,removePerson,violationRepeats,saveViolation,voidViolation,saveViolationTypes,LEAVE_CANCEL,dayCount,leaveOverlap,leaveUsed,reviewLeave,addLeave,cancelLeave,TIP_TYPES,TIP_STATUS,PAY,PR_TYPES,APPROVAL,RES_STATUS,tipCode,tipDefault,addTip,settleTip,voidTip,addPenalty,setPenaltyStatus,addMessage,archiveMessage,addReservation,setReservationStatus,validPersonnel,list};
})();
