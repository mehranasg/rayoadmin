/* =========================================================
   Rayo UI Template — shift-write.js  (migration stage 5: shift plan)
   One monthly plan per month on the live personnel module, with the current panel's shapes:
     monthlyPlans {id MPL-NNNNN, year, month, notes, cells, createdAt, updatedAt, copiedFrom, status, publishedAt, publishedBy}
       cells key `date|enc(location)~enc(position)|shift` → [personnelId]   (js/00 monthlyCellKey; location = sub-section
       of «سالن» when set, otherwise the section — js/03 / js/41 recordLocation)
       status «draft» = not shown to staff (staff panel and checklists skip it); missing/«published» = shown (older plans)
     staffingRequirements {id REQ-NNNNN, dayIndex 0=شنبه…6, shift, section, subSection, position, requiredCount, active}
       a cleared requirement becomes active:false (ids are kept)
     holidays {id HOL-NNNNN, date, title, active}; an official holiday uses the Friday pattern, the day before uses Thursday
       (js/00 holidayInfo)
   weeklyPlans and shiftRecords are no longer written (attendance and the monthly plan replace them).
   Calendar: RayoAttendanceCore (Saturday = 0).
   ========================================================= */
(function(root){
'use strict';
const A=x=>Array.isArray(x)?x:[];
const S=x=>String(x??'').trim();
const C=()=>root.RayoAttendanceCore;
const SHIFTS=['صبح','عصر'];
const DAY_VALUES=['off','m','e','me'];
const DAY_LABEL={off:'آف',m:'صبح',e:'عصر',me:'دو شیفت'};
const pad=n=>String(n).padStart(2,'0');
const uid=(prefix,arr,width=5)=>{let mx=0;A(arr).forEach(x=>{const m=S(x.id).match(/(\d+)$/);if(m)mx=Math.max(mx,+m[1])});return `${prefix}-${String(mx+1).padStart(width,'0')}`};
const enc=encodeURIComponent,dec=s=>{try{return decodeURIComponent(s||'')}catch(_){return S(s)}};
const locationOf=(section,subSection)=>S(section)==='سالن'&&S(subSection)?S(subSection):S(section);
const personLocation=p=>locationOf(p?.section,p?.subSection);
const reqLocation=r=>locationOf(r?.section,r?.subSection);
const cellKey=(date,location,position,shift)=>`${date}|${enc(location||'')}~${enc(position||'')}|${shift}`;
function parseKey(key){const p=String(key).split('|');if(p.length!==3)return null;const [date,head,shift]=p,[l,pos]=String(head).split('~');return{date,location:dec(l),position:dec(pos),shift}}
const sig=cells=>JSON.stringify(Object.keys(cells||{}).sort().map(k=>[k,A(cells[k]).slice().sort()]).filter(x=>x[1].length));
const monthDays=(y,m)=>C().monthDays(+y,+m);
const weekday=d=>C().weekdayIndex(d);
const isDraft=plan=>S(plan?.status)==='draft';

/* ---------- plan ---------- */
const planOf=(hr,y,m)=>A(hr?.monthlyPlans).find(p=>+p.year===+y&&+p.month===+m)||null;
function cleanCells(cells){const out={};for(const [k,ids] of Object.entries(cells||{})){if(!parseKey(k))continue;const v=[...new Set(A(ids).map(S).filter(Boolean))];if(v.length)out[k]=v}return out}
/* person → date → {m:{location,position}, e:{…}} */
function assignments(cells){const by={};for(const [k,ids] of Object.entries(cells||{})){const x=parseKey(k);if(!x)continue;const sh=x.shift==='صبح'?'m':x.shift==='عصر'?'e':'';if(!sh)continue;for(const id of A(ids)){const d=((by[id]||={})[x.date]||={});(d[sh]||=[]).push({location:x.location,position:x.position,key:k})}}return by}
function dayValue(asg,pid,date){const d=asg?.[pid]?.[date];if(!d)return'off';return d.m&&d.e?'me':d.m?'m':d.e?'e':'off'}
function removeFrom(cells,pid,date,shift){for(const k of Object.keys(cells)){const x=parseKey(k);if(x&&x.date===date&&(!shift||x.shift===shift)){cells[k]=A(cells[k]).filter(i=>i!==pid);if(!cells[k].length)delete cells[k]}}}
function addTo(cells,pid,date,location,position,shift){const k=cellKey(date,location,position,shift);const v=A(cells[k]);if(!v.includes(pid))cells[k]=[...v,pid]}
/* Set a person's day: off / m / e / me. A shift kept from before keeps its position; a new shift uses the person's own place. */
function setDay(cells,person,date,value){if(!DAY_VALUES.includes(value))throw Error('وضعیت روز معتبر نیست');const asg=assignments(cells)[person.id]?.[date]||{},want={m:value==='m'||value==='me',e:value==='e'||value==='me'};
 for(const [sh,name] of [['m','صبح'],['e','عصر']]){if(want[sh]&&!asg[sh])addTo(cells,person.id,date,personLocation(person),S(person.mainPosition),name);if(!want[sh]&&asg[sh])removeFrom(cells,person.id,date,name)}return cells}
const nextValue=v=>DAY_VALUES[(DAY_VALUES.indexOf(v)+1)%DAY_VALUES.length];
/* shifts in a month for one person: a double shift counts 2 (agreement monthlyShifts counts the same way) */
function personCount(asg,pid,y,m){let shifts=0,doubles=0,days=0;const pre=`${y}/${pad(m)}/`;for(const [d,v] of Object.entries(asg?.[pid]||{})){if(!d.startsWith(pre))continue;const n=(v.m?1:0)+(v.e?1:0);if(n){days++;shifts+=n;if(n===2)doubles++}}return{shifts,doubles,days}}
const agreedShifts=p=>{const n=Number(p?.salaryContract?.monthlyShifts);return Number.isFinite(n)&&n>0?n:0};
/* problems inside one plan: the same person twice in one shift (two positions) */
function conflicts(cells){const out=[];for(const [pid,days] of Object.entries(assignments(cells)))for(const [date,v] of Object.entries(days))for(const sh of ['m','e'])if(A(v[sh]).length>1)out.push({personnelId:pid,date,shift:sh==='m'?'صبح':'عصر',places:v[sh].map(x=>`${x.location} / ${x.position}`)});return out}

/* ---------- requirements and holidays ---------- */
function holidayInfo(hr,date){const hs=A(hr?.holidays).filter(h=>h.active!==false),ex=hs.find(h=>h.date===date);if(ex)return{type:'holiday',title:S(ex.title)||'تعطیل رسمی',templateDayIndex:6};const nx=hs.find(h=>h.date===C().addDays(date,1));if(nx)return{type:'eve',title:`روز قبل ${S(nx.title)||'تعطیل رسمی'}`,templateDayIndex:5};return{type:'',title:'',templateDayIndex:null}}
const patternDay=(hr,date)=>{const h=holidayInfo(hr,date);return h.templateDayIndex==null?weekday(date):h.templateDayIndex};
const reqsFor=(hr,dayIndex,shift)=>A(hr?.staffingRequirements).filter(r=>r.active!==false&&+r.dayIndex===+dayIndex&&r.shift===shift&&Number(r.requiredCount)>0);
/* coverage of one date and shift: every required place, plus places that have people but no requirement */
function coverage(hr,cells,date,shift){const di=patternDay(hr,date),rows=new Map;
 for(const r of reqsFor(hr,di,shift)){const loc=reqLocation(r),k=loc+'~'+r.position,x=rows.get(k)||{location:loc,section:S(r.section),subSection:S(r.subSection),position:S(r.position),required:0,ids:[]};x.required+=Number(r.requiredCount)||0;rows.set(k,x)}
 for(const [key,ids] of Object.entries(cells||{})){const p=parseKey(key);if(!p||p.date!==date||p.shift!==shift||!A(ids).length)continue;const k=p.location+'~'+p.position,x=rows.get(k)||{location:p.location,section:p.location,subSection:'',position:p.position,required:0,ids:[]};x.ids=[...new Set([...x.ids,...ids])];rows.set(k,x)}
 const list=[...rows.values()].sort((a,b)=>a.location.localeCompare(b.location,'fa')||a.position.localeCompare(b.position,'fa'));
 const required=list.reduce((s,x)=>s+x.required,0),assigned=list.reduce((s,x)=>s+Math.min(x.ids.length,x.required||x.ids.length),0),shortage=list.reduce((s,x)=>s+Math.max(0,x.required-x.ids.length),0),surplus=list.reduce((s,x)=>s+Math.max(0,x.ids.length-x.required),0),people=new Set(list.flatMap(x=>x.ids)).size;
 return{dayIndex:di,rows:list,required,assigned,shortage,surplus,people,status:!required&&!people?'none':shortage?'shortage':surplus?'surplus':'complete'}}
const daysWithoutPattern=hr=>[0,1,2,3,4,5,6].filter(di=>!SHIFTS.some(sh=>reqsFor(hr,di,sh).length));

/* ---------- copy tools (draft only, nothing saved) ---------- */
/* the n-th same weekday of the source month (js/00 sourceDateSameWeekPattern) */
function sameWeekdayDate(srcY,srcM,target){const di=weekday(target),tDay=+target.split('/')[2],[ty,tm]=target.split('/').map(Number),occ=monthDays(ty,tm).filter(d=>+d.split('/')[2]<=tDay&&weekday(d)===di).length,src=monthDays(srcY,srcM).filter(d=>weekday(d)===di);return src.length?src[Math.min(occ-1,src.length-1)]:''}
function copyFromMonth(source,y,m,srcY,srcM,{activeIds}={}){const out={},keep=activeIds?new Set(activeIds):null;for(const d of monthDays(y,m)){const sd=sameWeekdayDate(srcY,srcM,d);if(!sd)continue;for(const [k,ids] of Object.entries(source||{})){const p=parseKey(k);if(!p||p.date!==sd)continue;const v=A(ids).filter(i=>!keep||keep.has(i));if(v.length)out[cellKey(d,p.location,p.position,p.shift)]=[...v]}}return out}
/* the 7 days starting at fromDate are repeated over the rest of the month (same weekday); later days are replaced */
function copyWeek(cells,y,m,fromDate){const days=monthDays(y,m),i=days.indexOf(fromDate);if(i<0)throw Error('روز شروع در این ماه نیست');const week=days.slice(i,i+7);if(week.length<7)throw Error('از این روز تا آخر ماه کمتر از یک هفته مانده است');const out={};
 const later=days.slice(i+7);for(const [k,ids] of Object.entries(cells))if(!later.includes(parseKey(k)?.date))out[k]=[...ids];
 for(const d of later){const src=week[(days.indexOf(d)-i)%7];for(const [k,ids] of Object.entries(cells)){const p=parseKey(k);if(p&&p.date===src)out[cellKey(d,p.location,p.position,p.shift)]=[...ids]}}return out}

/* ---------- saves (mutate the fresh personnel document) ---------- */
function savePlan(hr,ctx,{year,month,cells,baseSig,notes}){year=+year;month=+month;if(!(year>1300&&month>=1&&month<=12))throw Error('ماه معتبر نیست');hr.monthlyPlans=A(hr.monthlyPlans);let plan=planOf(hr,year,month);
 if(baseSig!==undefined&&sig(plan?.cells)!==baseSig)throw Error('برنامهٔ این ماه را کاربر دیگری در این فاصله تغییر داده است؛ بازخوانی کنید و دوباره تغییر دهید');
 const pre=`${year}/${pad(month)}/`,clean=cleanCells(cells);for(const k of Object.keys(clean))if(!k.startsWith(pre))throw Error('خانه‌ای خارج از این ماه در برنامه است');
 const ids=new Set(A(hr.personnel).map(p=>p.id));for(const v of Object.values(clean))for(const i of v)if(!ids.has(i))throw Error(`پرسنل ${i} پیدا نشد`);
 const c=conflicts(clean);if(c.length){const x=c[0],p=A(hr.personnel).find(q=>q.id===x.personnelId);throw Error(`${p?.name||x.personnelId} در ${x.date} شیفت ${x.shift} دو جا چیده شده است (${x.places.join('، ')})`)}
 if(!plan){if(!Object.keys(clean).length)throw Error('برنامه خالی است');plan={id:uid('MPL',hr.monthlyPlans),year,month,notes:'',cells:{},createdAt:ctx.at,updatedAt:ctx.at,copiedFrom:'',status:'draft'};hr.monthlyPlans.push(plan)}
 else if(sig(plan.cells)===sig(clean)&&(notes===undefined||S(notes)===S(plan.notes)))throw Error('تغییری برای ذخیره نیست');
 plan.cells=clean;if(notes!==undefined)plan.notes=S(notes);plan.updatedAt=ctx.at;plan.updatedBy=ctx.actor;return{planId:plan.id,status:isDraft(plan)?'draft':'published',cells:Object.keys(clean).length}}
function setPublished(hr,ctx,{year,month,publish}){const plan=planOf(hr,year,month);if(!plan)throw Error('برای این ماه برنامه‌ای ذخیره نشده است');
 if(publish){if(!isDraft(plan)&&plan.publishedAt)throw Error('برنامه قبلاً منتشر شده است');if(!Object.keys(cleanCells(plan.cells)).length)throw Error('برنامه خالی است');plan.status='published';plan.publishedAt=ctx.at;plan.publishedBy=ctx.actor}
 else{if(isDraft(plan))throw Error('برنامه منتشر نشده است');plan.status='draft';plan.unpublishedAt=ctx.at;plan.unpublishedBy=ctx.actor}
 plan.updatedAt=ctx.at;return plan.status}
/* grid of required counts: {`${dayIndex}|${shift}|${section}|${subSection}|${position}`: count} */
const reqKey=r=>`${+r.dayIndex}|${r.shift}|${S(r.section)}|${S(r.subSection)}|${S(r.position)}`;
function saveRequirements(hr,ctx,{grid,baseSig}){hr.staffingRequirements=A(hr.staffingRequirements);const now=reqGrid(hr);if(baseSig!==undefined&&JSON.stringify(now)!==baseSig)throw Error('نیروی موردنیاز را کاربر دیگری در این فاصله تغییر داده است؛ بازخوانی کنید');let changed=0;
 for(const [k,raw] of Object.entries(grid||{})){const n=Math.round(Number(raw)||0);if(n<0||n>50)throw Error('تعداد نیرو باید بین ۰ تا ۵۰ باشد');const [di,shift,section,subSection,position]=k.split('|');if(!(+di>=0&&+di<=6)||!SHIFTS.includes(shift)||!section||!position)throw Error('ردیف نیروی موردنیاز معتبر نیست');
  const rows=hr.staffingRequirements.filter(r=>reqKey(r)===k),act=rows.filter(r=>r.active!==false),cur=act.reduce((s,r)=>s+(Number(r.requiredCount)||0),0);if(cur===n)continue;changed++;
  if(act.length){act[0].requiredCount=n;act[0].active=n>0;act[0].updatedAt=ctx.at;act.slice(1).forEach(r=>{r.active=false;r.updatedAt=ctx.at})}
  else if(n>0){const old=rows[0];if(old){old.requiredCount=n;old.active=true;old.updatedAt=ctx.at}else hr.staffingRequirements.push({id:uid('REQ',hr.staffingRequirements),dayIndex:+di,shift,section,position,requiredCount:n,active:true,subSection:section==='سالن'?subSection:''})}}
 if(!changed)throw Error('تغییری برای ذخیره نیست');return changed}
function reqGrid(hr){const g={};for(const r of A(hr?.staffingRequirements))if(r.active!==false&&Number(r.requiredCount)>0){const k=reqKey(r);g[k]=(g[k]||0)+Number(r.requiredCount)}return Object.fromEntries(Object.entries(g).sort())}
function saveHoliday(hr,ctx,{date,title,active=true}){if(!C().parseDate(date)&&!/^\d{4}\/\d\d\/\d\d$/.test(S(date)))throw Error('تاریخ معتبر نیست');date=C().parseDate(date)||S(date);hr.holidays=A(hr.holidays);const h=hr.holidays.find(x=>x.date===date);
 if(active){if(!S(title))throw Error('عنوان تعطیلی را بنویسید');if(h){if(h.active!==false&&S(h.title)===S(title))throw Error('تغییری برای ذخیره نیست');h.title=S(title);h.active=true;h.updatedAt=ctx.at}else hr.holidays.push({id:uid('HOL',hr.holidays),date,title:S(title),active:true,createdAt:ctx.at,createdBy:ctx.actor})}
 else{if(!h||h.active===false)throw Error('این روز تعطیل ثبت نشده است');h.active=false;h.updatedAt=ctx.at}return date}

root.ShiftWrite={SHIFTS,DAY_VALUES,DAY_LABEL,locationOf,personLocation,reqLocation,cellKey,parseKey,sig,monthDays,weekday,isDraft,planOf,cleanCells,assignments,dayValue,setDay,nextValue,addTo,removeFrom,personCount,agreedShifts,conflicts,
 holidayInfo,patternDay,reqsFor,coverage,daysWithoutPattern,sameWeekdayDate,copyFromMonth,copyWeek,savePlan,setPublished,saveRequirements,reqGrid,reqKey,saveHoliday};
})(typeof window!=='undefined'?window:globalThis);
