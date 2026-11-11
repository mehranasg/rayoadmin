/* Rayo new panel — payroll (migration stage 6). Owner decisions (2026-11-09):
   - everything starts at settings.payrollStartYear/Month (مهر ۱۴۰۵); earlier months are an archive (export only)
   - each salary month stands alone: net of the month − payments recorded for that month = balance of the month.
     Nothing is carried to the next month; the balances of earlier months are listed separately.
   - tips are not part of the salary: a separate ledger (shares of tipGroups − tip payments) from the start date
   - net = contract (fixed monthly, prorated by the days employed in the month, or hours × hourly rate)
           + overtime (hours × hourly × overtime factor) − undertime (fixed contracts: hours × hourly)
           + additions (پاداش …) + other payment − deductions (جریمه، کسر تأخیر …) − other deduction
           − menu use × (1 − discount %)  (one discount for everyone, another for the «مدیریت» section)
     no transport, meal, credit, insurance or return-aid lines in this phase
   - payment reasons and methods and penalty/reward types are lists in the settings; each reason has a kind
     (advance = مساعدهٔ ماه جاری, salary = حقوق یک ماه, tip = انعام, other = خارج از حقوق); each item type a kind
     (addition / deduction). Kinds of a reason or type already used in records cannot change.
   Data shapes stay the current panel's: monthlyAdjustments (ADJ), penaltiesRewards (PR), payments (PAY), tipGroups. */
(function(){
'use strict';
const A=x=>Array.isArray(x)?x:[],S=x=>String(x??'').trim(),pad=n=>String(n).padStart(2,'0');
const latin=v=>String(v??'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d));
const N=v=>{if(typeof v==='number')return Number.isFinite(v)?v:0;const x=Number(latin(v).replace(/[٬,\s]/g,'').replace(/٫/g,'.'));return Number.isFinite(x)?x:0};
const set=v=>v!==''&&v!==null&&v!==undefined;
const round=v=>Math.round(N(v));
const C=()=>window.RayoAttendanceCore;
const MONTHS=['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
const monthLength=(y,m)=>C()?.monthLength?C().monthLength(+y,+m):(m<=6?31:m<=11?30:29);
const code=(y,m)=>(+y)*100+(+m);
const label=(y,m)=>`${MONTHS[m-1]||m} ${String(y).replace(/\d/g,d=>"۰۱۲۳۴۵۶۷۸۹"[d])}`;
const D=s=>{const q=latin(s).trim().match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);return q?`${q[1]}/${pad(q[2])}/${pad(q[3])}`:''};
const ymOf=s=>{const d=D(s);return d?[+d.slice(0,4),+d.slice(5,7)]:[0,0]};
const VOID=['void','ابطال‌شده','لغوشده'];
const isVoid=x=>VOID.includes(S(x?.status));
const uid=(prefix,arr,w=5)=>{let m=0;A(arr).forEach(x=>{const q=S(x.id).match(/(\d+)$/);if(q)m=Math.max(m,+q[1])});return`${prefix}-${String(m+1).padStart(w,'0')}`};

/* ---------- settings ---------- */
const KINDS={advance:'مساعده (ماه جاری)',salary:'حقوق یک ماه',tip:'انعام',other:'خارج از حقوق'};
const ITEM_KINDS={addition:'اضافه به حقوق',deduction:'کسر از حقوق'};
const DEF_REASONS=[{title:'مساعده',kind:'advance'},{title:'تسویه حقوق',kind:'salary'},{title:'علی‌الحساب حقوق',kind:'salary'},{title:'پاداش',kind:'salary'},{title:'پرداخت انعام',kind:'tip'}];
const LEGACY_REASON={'اصلاح پرداخت':'salary','تعدیل تسویه انعام':'tip'};
const DEF_ITEMS=[{title:'جریمه',kind:'deduction'},{title:'کسر تأخیر',kind:'deduction'},{title:'پاداش',kind:'addition'}];
const LEGACY_ITEM={'تشویقی':'addition'};
const DEF_METHODS=['نقدی','کارت به کارت','واریز به حساب'];
const cleanList=(l,kinds)=>A(l).map(x=>({title:S(x?.title),kind:kinds[x?.kind]?x.kind:'',active:x?.active!==false})).filter(x=>x.title&&x.kind);
function config(hr){const s=hr?.settings||{},y=N(s.payrollStartYear),m=N(s.payrollStartMonth);
 const reasons=cleanList(s.paymentReasons,KINDS),items=cleanList(s.payrollItemTypes,ITEM_KINDS),methods=A(hr?.lists?.paymentMethods).map(S).filter(Boolean);
 return{start:y>1300&&m>=1&&m<=12?{year:y,month:m}:null,overtimeFactor:N(s.overtimeFactor)>0?N(s.overtimeFactor):1.4,
  menuStaff:Math.min(100,Math.max(0,N(s.menuCreditDiscountPercent))),menuManagers:Math.min(100,Math.max(0,set(s.menuDiscountPercentManagers)?N(s.menuDiscountPercentManagers):N(s.menuCreditDiscountPercent))),
  tipStep:set(s.tipShareRoundingStep)?Math.max(0,N(s.tipShareRoundingStep)):5000,advanceWarnPercent:set(s.advanceWarnPercent)?Math.max(0,N(s.advanceWarnPercent)):50,
  reasons:reasons.length?reasons:DEF_REASONS.map(x=>({...x,active:true})),items:items.length?items:DEF_ITEMS.map(x=>({...x,active:true})),methods:methods.length?methods:DEF_METHODS.slice()}}
function reasonKind(hr,pay,cfg=config(hr)){if(pay?.tipSettlement===true)return'tip';if(KINDS[pay?.reasonKind])return pay.reasonKind;const t=S(pay?.type),r=cfg.reasons.find(x=>x.title===t);if(r)return r.kind;if(LEGACY_REASON[t])return LEGACY_REASON[t];if(t==='مساعده')return'advance';if(/انعام/.test(t))return'tip';return'salary'}
function itemKind(hr,item,cfg=config(hr)){const t=S(item?.type),r=cfg.items.find(x=>x.title===t);if(r)return r.kind;if(LEGACY_ITEM[t])return LEGACY_ITEM[t];return /جریمه|کسر/.test(t)?'deduction':'addition'}
const isManager=p=>S(p?.section)==='مدیریت'||S(p?.personnelGroup)==='مدیریت';

/* ---------- months ---------- */
const startCode=hr=>{const s=config(hr).start;return s?code(s.year,s.month):0};
const closureOf=(hr,y,m)=>A(hr?.payrollClosures).filter(c=>c&&c.active!==false&&+c.year===+y&&+c.month===+m).sort((a,b)=>S(b.finalizedAt).localeCompare(S(a.finalizedAt)))[0]||null;
const isClosed=(hr,y,m)=>!!closureOf(hr,y,m);
/* before (archive) | future | current (month in progress) | open (ended, not final) | closed */
function monthState(hr,y,m,today){const s=startCode(hr),c=code(y,m),[ty,tm]=ymOf(today);if(!s||c<s)return'before';const t=code(ty,tm);if(t&&c>t)return'future';if(isClosed(hr,y,m))return'closed';return t&&c===t?'current':'open'}
function months(hr,today){const s=config(hr).start,[ty,tm]=ymOf(today);if(!s||!ty)return[];const out=[];let y=s.year,m=s.month;while(code(y,m)<=code(ty,tm)){out.push({year:y,month:m});m++;if(m>12){m=1;y++}}return out}

/* ---------- contract of a month (js/00 salaryTermsFor: salaryHistory with effective months) ---------- */
const termsCode=e=>N(e?.effectiveYear)*100+N(e?.effectiveMonth);
function termsFor(p,y,m){const h=A(p?.salaryHistory).slice().sort((a,b)=>termsCode(a)-termsCode(b));if(!h.length)return p;const e=h.filter(x=>termsCode(x)<=code(y,m)).at(-1)||h[0];if(!e?.terms)return p;return{...p,...JSON.parse(JSON.stringify(e.terms))}}
function contractOf(p,y,m){const t=termsFor(p,y,m),c=t?.salaryContract||{},fixed=c.type==='fixedMonthly'&&N(c.monthlySalary)>0;
 if(fixed){const ms=N(c.monthlySalary),shifts=N(c.monthlyShifts),hps=N(c.hoursPerShift),hours=N(c.monthlyHours)||(shifts&&hps?shifts*hps:0);
  return{type:'fixed',monthlySalary:ms,agreedShifts:shifts,hoursPerShift:hps,monthlyHours:hours,hourly:N(c.approximateHourly)>0?N(c.approximateHourly):hours?Math.round(ms/hours):0}}
 const rate=N(t?.hourlyRate);return{type:rate>0?'hourly':'none',hourly:rate,agreedShifts:N(c.monthlyShifts),hoursPerShift:N(c.hoursPerShift),monthlyHours:N(c.monthlyHours)}}
const contractText=c=>c.type==='fixed'?`ثابت ${Math.round(c.monthlySalary).toLocaleString('fa-IR')}`:c.type==='hourly'?`ساعتی ${Math.round(c.hourly).toLocaleString('fa-IR')}`:'بدون قرارداد';

/* ---------- employment in a month ---------- */
const ended=p=>['اتمام همکاری','غیرفعال'].includes(S(p?.status));
function employedDays(p,y,m){const len=monthLength(y,m),first=`${y}/${pad(m)}/01`,last=`${y}/${pad(m)}/${pad(len)}`,s=D(p?.startDate),e=D(p?.employmentEndDate);
 if(s&&s>last)return 0;if(e&&e<first)return 0;const from=s&&s>first?+s.slice(8):1,to=e&&e<last?+e.slice(8):len;return Math.max(0,to-from+1)}
const adjOf=(hr,pid,y,m)=>A(hr?.monthlyAdjustments).find(x=>x.personnelId===pid&&+x.year===+y&&+x.month===+m)||null;
const itemMonth=x=>set(x?.year)&&set(x?.month)&&N(x.year)>0?[N(x.year),N(x.month)]:ymOf(x?.date);
const itemsOf=(hr,pid,y,m)=>A(hr?.penaltiesRewards).filter(x=>x.personnelId===pid&&(([a,b])=>a===+y&&b===+m)(itemMonth(x)));
const salaryPaymentsOf=(hr,pid,y,m,cfg=config(hr))=>A(hr?.payments).filter(x=>x.personnelId===pid&&!isVoid(x)&&N(x.salaryYear)===+y&&N(x.salaryMonth)===+m&&['advance','salary'].includes(reasonKind(hr,x,cfg)));
function hasData(hr,pid,y,m){return !!adjOf(hr,pid,y,m)||itemsOf(hr,pid,y,m).some(x=>!isVoid(x))||salaryPaymentsOf(hr,pid,y,m).length>0}
function inPayroll(hr,p,y,m){if(hasData(hr,p.id,y,m))return true;if(!employedDays(p,y,m))return false;if(!ended(p))return true;
 /* someone who left without an end date: only when the month has his data (above) or he started in it */
 return !!D(p.employmentEndDate)}

/* ---------- salary of one person in one month ---------- */
/* a month closed by the new panel (closure engine v2) keeps its salary lines; payments stay live */
const snapOf=(hr,pid,y,m)=>{const c=closureOf(hr,y,m);return c?.engine==='v2'?A(c.rows).find(r=>r.personnelId===pid)||null:null};
function fromSnapshot(hr,p,y,m,r,cfg){const pays=salaryPaymentsOf(hr,p.id,y,m,cfg),advance=pays.filter(x=>reasonKind(hr,x,cfg)==='advance').reduce((s,x)=>s+N(x.amount),0),paid=pays.filter(x=>reasonKind(hr,x,cfg)==='salary').reduce((s,x)=>s+N(x.amount),0),net=N(r.net),balance=net-advance-paid,flags=[];if(balance<-0.5&&advance+paid>0)flags.push({k:'over',t:'بیش از حقوق ماه پرداخت شده است'});
 return{personnelId:p.id,year:+y,month:+m,contract:r.contract||contractOf(p,y,m),days:N(r.days),monthDays:N(r.monthDays)||monthLength(y,m),hours:r.hours??null,overtimeHours:N(r.overtimeHours),undertimeHours:N(r.undertimeHours),menuUsed:N(r.menuUsed),menuPercent:N(r.menuPercent),lines:A(r.lines),flags,base:N(r.base),overtime:N(r.overtime),undertime:N(r.undertime),additions:N(r.additions),deductions:N(r.deductions),menu:N(r.menu),net,advance,paid,balance,payments:pays,adjustment:{},closed:true}}
function calc(hr,p,y,m,draft=null,cfg=config(hr)){if(!draft){const sn=snapOf(hr,p.id,y,m);if(sn)return fromSnapshot(hr,p,y,m,sn,cfg)}const c=contractOf(p,y,m),a=draft||adjOf(hr,p.id,y,m)||{},len=monthLength(y,m),days=employedDays(p,y,m)||(hasData(hr,p.id,y,m)?len:0),lines=[],flags=[];
 const add=(k,l,v,sub='')=>{v=round(v);if(v)lines.push({k,l,v,sub})};
 const ot=Math.max(0,N(a.overtimeHours)),ut=Math.max(0,N(a.undertimeHours));let hours=null;
 if(c.type==='fixed'){const base=c.monthlySalary*days/len;add('base','حقوق ثابت',base,days<len?`${days} از ${len} روز`:'');
  if((ot||ut)&&!c.hourly)flags.push({k:'rate',t:'نرخ ساعتی قرارداد معلوم نیست (شیفت و ساعت قرارداد را در پرونده ثبت کنید)'});
  add('ot','اضافه‌کار',ot*c.hourly*cfg.overtimeFactor,ot?`${ot} ساعت × ${Math.round(c.hourly)} × ${cfg.overtimeFactor}`:'');add('ut','کسرکار',-ut*c.hourly,ut?`${ut} ساعت × ${Math.round(c.hourly)}`:'')}
 else if(c.type==='hourly'){if(set(a.hoursOverride)){hours=Math.max(0,N(a.hoursOverride));const o=Math.min(hours,ot);add('base','کارکرد عادی',(hours-o)*c.hourly,`${hours-o} ساعت × ${Math.round(c.hourly)}`);add('ot','اضافه‌کار',o*c.hourly*cfg.overtimeFactor,o?`${o} ساعت × ${Math.round(c.hourly)} × ${cfg.overtimeFactor}`:'')}
  else flags.push({k:'hours',t:'ساعت کارکرد وارد نشده است'})}
 else flags.push({k:'contract',t:'قرارداد حقوق ثبت نشده است'});
 const items=itemsOf(hr,p.id,y,m),ok=items.filter(x=>x.status==='تاییدشده'),drafts=items.filter(x=>S(x.status)==='پیش‌نویس');
 for(const x of ok){const k=itemKind(hr,x,cfg);add(k==='addition'?'add':'ded',S(x.type),k==='addition'?N(x.amount):-N(x.amount),S(x.reason))}
 if(drafts.length)flags.push({k:'draft',t:`${drafts.length} جریمه/پاداش پیش‌نویس (حساب نشده)`});
 add('otherPay','سایر پرداخت',N(a.otherPayment),S(a.otherPaymentNote));add('otherDed','سایر کسر',-N(a.otherDeduction),S(a.otherDeductionNote));
 const used=Math.max(0,N(a.menuUsed)),pct=isManager(p)?cfg.menuManagers:cfg.menuStaff;add('menu','استفاده از منو',-used*(1-pct/100),used?`${Math.round(used)} با ${pct}٪ تخفیف`:'');
 if(ended(p)&&!D(p.employmentEndDate))flags.push({k:'end',t:'تاریخ پایان همکاری ثبت نشده است'});
 const net=lines.reduce((s,l)=>s+l.v,0),pays=salaryPaymentsOf(hr,p.id,y,m,cfg),advance=pays.filter(x=>reasonKind(hr,x,cfg)==='advance').reduce((s,x)=>s+N(x.amount),0),paid=pays.filter(x=>reasonKind(hr,x,cfg)==='salary').reduce((s,x)=>s+N(x.amount),0),balance=net-advance-paid;
 if(balance<-0.5&&advance+paid>0)flags.push({k:'over',t:'بیش از حقوق ماه پرداخت شده است'});else if(net<-0.5&&!flags.some(f=>f.k==='hours'||f.k==='contract'))flags.push({k:'neg',t:'کسورات بیشتر از حقوق ماه است'});
 const sum=k=>lines.filter(l=>k.includes(l.k)).reduce((s,l)=>s+l.v,0);
 return{personnelId:p.id,year:+y,month:+m,contract:c,days,monthDays:len,hours,overtimeHours:ot,undertimeHours:ut,menuUsed:used,menuPercent:pct,lines,flags,
  base:sum(['base']),overtime:sum(['ot']),undertime:-sum(['ut']),additions:sum(['add','otherPay']),deductions:-sum(['ded','otherDed']),menu:-sum(['menu']),net,advance,paid,balance,payments:pays,adjustment:a}}
function monthRows(hr,y,m,cfg=config(hr)){if(!startCode(hr)||code(y,m)<startCode(hr))return[];const cl=closureOf(hr,y,m);if(cl?.engine==='v2'){const ids=new Set(A(cl.rows).map(r=>r.personnelId));return A(hr?.personnel).filter(p=>ids.has(p.id)).map(p=>calc(hr,p,y,m,null,cfg))}return A(hr?.personnel).filter(p=>inPayroll(hr,p,y,m)).map(p=>calc(hr,p,y,m,null,cfg))}
function monthSummary(hr,y,m){const rows=monthRows(hr,y,m),s=k=>rows.reduce((a,r)=>a+r[k],0);return{rows,people:rows.length,net:s('net'),advance:s('advance'),paid:s('paid'),balance:s('balance'),flagged:rows.filter(r=>r.flags.length).length}}
/* balances of the months before (y,m), from the start month; only months with something left or overpaid */
function earlierBalances(hr,y,m){const out=[];for(const x of months(hr,`${y}/${pad(m)}/01`)){if(code(x.year,x.month)>=code(y,m))break;const rows=monthRows(hr,x.year,x.month).filter(r=>Math.abs(r.balance)>0.5);if(rows.length)out.push({...x,people:rows.length,balance:rows.reduce((a,r)=>a+r.balance,0),rows})}return out}
function personMonths(hr,pid,today){const p=A(hr?.personnel).find(x=>x.id===pid);if(!p)return[];return months(hr,today).filter(x=>inPayroll(hr,p,x.year,x.month)).map(x=>calc(hr,p,x.year,x.month))}

/* ---------- tips: own ledger from the start date ---------- */
/* tip shares: total × weight ÷ sum of weights, rounded DOWN to the tip rounding step (5,000 toman; decided 2026-11-11).
   A tip is rounded when it carries its step (shareRoundingStep: new tips, and the tips of a month when the month is
   finalized) or, with hr given, when its month is not finalized yet; tips of an already finalized month without a step
   keep their exact shares; a tip of one person is never rounded (the share is the amount). The rest (total − sum of shares) is the rounding difference, shown, not paid. */
const TIP_STEP=5000;
function tipStep(g,hr){const s=N(g?.shareRoundingStep);if(s>0)return s;if(!hr)return 0;const d=D(g?.receiveDate);if(!d)return 0;return isClosed(hr,+d.slice(0,4),+d.slice(5,7))?0:TIP_STEP}
function tipShares(g,hr){const ps=A(g?.participants),w=ps.reduce((a,x)=>a+(N(x.weight)||1),0)||1,step=ps.length>1?tipStep(g,hr):0;return ps.map(x=>{const raw=N(g.totalAmount)*(N(x.weight)||1)/w;return{personnelId:x.personnelId,raw,amount:step?Math.floor(raw/step+1e-9)*step:raw}})}
const tipRoundDiff=(g,hr)=>N(g?.totalAmount)-tipShares(g,hr).reduce((a,x)=>a+x.amount,0);
const startDate=hr=>{const s=config(hr).start;return s?`${s.year}/${pad(s.month)}/01`:''};
const tipGroupsFrom=hr=>{const s=startDate(hr);return s?A(hr?.tipGroups).filter(g=>!VOID.includes(S(g.status))&&D(g.receiveDate)>=s):[]};
const tipPaymentsFrom=hr=>{const s=startDate(hr),cfg=config(hr);return s?A(hr?.payments).filter(x=>!isVoid(x)&&D(x.date)>=s&&reasonKind(hr,x,cfg)==='tip'):[]};
function tipLedger(hr,pid){const byMonth={};let earned=0;for(const g of tipGroupsFrom(hr)){const sh=tipShares(g,hr).find(x=>x.personnelId===pid);if(!sh)continue;const k=D(g.receiveDate).slice(0,7);byMonth[k]=(byMonth[k]||0)+sh.amount;earned+=sh.amount}
 const pays=tipPaymentsFrom(hr).filter(x=>x.personnelId===pid),paid=pays.reduce((a,x)=>a+N(x.amount),0);return{earned,paid,balance:earned-paid,byMonth,payments:pays}}

/* ---------- writes ---------- */
const sig=(hr,y,m)=>JSON.stringify(A(hr?.monthlyAdjustments).filter(x=>+x.year===+y&&+x.month===+m).map(x=>[x.id,x.personnelId,x.hoursOverride,x.overtimeHours,x.undertimeHours,x.menuUsed,x.otherPayment,x.otherPaymentNote,x.otherDeduction,x.otherDeductionNote,x.notes]).sort());
const WORK_FIELDS={hours:'hoursOverride',ot:'overtimeHours',ut:'undertimeHours',menu:'menuUsed',otherPay:'otherPayment',otherPayNote:'otherPaymentNote',otherDed:'otherDeduction',otherDedNote:'otherDeductionNote',notes:'notes'};
const NUM_FIELDS=['hours','ot','ut','menu','otherPay','otherDed'];
/* rows: {personnelId: {hours, ot, ut, menu, otherPay, otherPayNote, otherDed, otherDedNote, notes}} — '' = not entered */
function saveWork(hr,ctx,{year,month,rows,baseSig,today}){const st=monthState(hr,year,month,today);
 if(st==='before')throw Error('این ماه قبل از شروع حقوق در نرم‌افزار است');if(st==='future')throw Error('ماه آینده است');if(st==='closed')throw Error('حقوق این ماه قطعی شده است؛ برای تغییر، اول ماه را بازگشایی کنید');
 if(baseSig!==undefined&&baseSig!==sig(hr,year,month))throw Error('کارکرد این ماه را کاربر دیگری در این فاصله تغییر داده است؛ صفحه را تازه کنید');
 hr.monthlyAdjustments=A(hr.monthlyAdjustments);const changed=[];
 for(const [pid,r] of Object.entries(rows||{})){const p=A(hr.personnel).find(x=>x.id===pid);if(!p)throw Error('پرسنل پیدا نشد: '+pid);const c=contractOf(p,year,month),vals={};
  for(const [k,f] of Object.entries(WORK_FIELDS)){if(r[k]===undefined)continue;if(NUM_FIELDS.includes(k)){const t=latin(r[k]).replace(/[٬,\s]/g,'').replace(/٫/g,'.');if(t===''){vals[f]='';continue}const v=Number(t);if(!Number.isFinite(v)||v<0)throw Error(`${p.name}: عدد نامعتبر`);if(['hours','ot','ut'].includes(k)&&v>500)throw Error(`${p.name}: ساعت بیش از حد است`);vals[f]=Math.round(v*100)/100}else vals[f]=S(r[k])}
  if(c.type==='hourly'&&set(vals.overtimeHours)&&N(vals.overtimeHours)>N(vals.hoursOverride??adjOf(hr,pid,year,month)?.hoursOverride))throw Error(`${p.name}: اضافه‌کار نمی‌تواند از ساعت کل کارکرد بیشتر باشد`);
  let a=adjOf(hr,pid,year,month);const same=a&&Object.entries(vals).every(([f,v])=>String(a[f]??'')===String(v));if(same||(!a&&Object.values(vals).every(v=>v==='')))continue;
  if(!a){a={id:uid('ADJ',hr.monthlyAdjustments),personnelId:pid,year:+year,month:+month,hoursOverride:'',overtimeHours:'',undertimeHours:'',menuUsed:'',otherPayment:'',otherDeduction:'',notes:'',createdAt:ctx.at,createdBy:ctx.actor};hr.monthlyAdjustments.push(a)}
  if(a.hoursFromAttendance&&(('hoursOverride' in vals&&String(vals.hoursOverride)!==String(a.hoursOverride??''))||('overtimeHours' in vals&&String(vals.overtimeHours)!==String(a.overtimeHours??''))||('undertimeHours' in vals&&String(vals.undertimeHours)!==String(a.undertimeHours??''))))Object.assign(a,{hoursFromAttendance:false,manualOverAttendance:true});
  Object.assign(a,vals,{updatedAt:ctx.at,updatedBy:ctx.actor});changed.push(pid)}
 if(!changed.length)throw Error('تغییری برای ذخیره نیست');ctx.auditExtra={year:+year,month:+month,people:changed};return changed.length}
/* x: {startYear, startMonth, overtimeFactor, menuStaff, menuManagers, tipStep, advanceWarnPercent, reasons:[{title,kind,active}], items:[...], methods:[...]} */
function saveSettings(hr,ctx,x){hr.settings=hr.settings||{};hr.lists=hr.lists||{};const s=hr.settings,before=config(hr);
 const y=N(x.startYear),m=N(x.startMonth);if(!(y>1390&&y<1500&&m>=1&&m<=12))throw Error('ماه شروع حقوق را درست وارد کنید');
 const f=N(x.overtimeFactor);if(!(f>=1&&f<=3))throw Error('ضریب اضافه‌کار باید بین ۱ و ۳ باشد');
 const pc=v=>{const n=N(v);if(!(n>=0&&n<=100))throw Error('درصد باید بین ۰ و ۱۰۰ باشد');return n};
 const clean=(l,kinds,what)=>{const out=[],seen=new Set;for(const r of A(l)){const t=S(r.title);if(!t)continue;if(seen.has(t))throw Error(`${what} «${t}» تکراری است`);if(!kinds[r.kind])throw Error(`نوع ${what} «${t}» را انتخاب کنید`);seen.add(t);out.push({title:t,kind:r.kind,active:r.active!==false})}return out};
 const reasons=clean(x.reasons,KINDS,'علت پرداخت'),items=clean(x.items,ITEM_KINDS,'نوع جریمه/پاداش'),methods=[...new Set(A(x.methods).map(S).filter(Boolean))];
 for(const k of ['advance','salary','tip'])if(!reasons.some(r=>r.active&&r.kind===k))throw Error(`حداقل یک علت پرداخت فعال از نوع «${KINDS[k]}» لازم است`);
 if(!items.some(r=>r.active&&r.kind==='deduction')||!items.some(r=>r.active&&r.kind==='addition'))throw Error('حداقل یک نوع فعال «کسر از حقوق» و یک نوع «اضافه به حقوق» لازم است');
 if(!methods.length)throw Error('حداقل یک روش پرداخت لازم است');
 /* a reason or type already used keeps its kind (history would be read differently otherwise) */
 for(const r of reasons){const used=A(hr.payments).some(p=>S(p.type)===r.title&&!p.tipSettlement),old=reasonKind(hr,{type:r.title},before);if(used&&old!==r.kind)throw Error(`علت «${r.title}» در پرداخت‌ها استفاده شده؛ نوع آن (${KINDS[old]}) عوض نمی‌شود`)}
 for(const r of items){const used=A(hr.penaltiesRewards).some(p=>S(p.type)===r.title),old=itemKind(hr,{type:r.title},before);if(used&&old!==r.kind)throw Error(`نوع «${r.title}» در ثبت‌ها استفاده شده؛ اضافه/کسر بودنش عوض نمی‌شود`)}
 const prev=JSON.stringify([s.payrollStartYear,s.payrollStartMonth,s.overtimeFactor,s.menuCreditDiscountPercent,s.menuDiscountPercentManagers,s.tipShareRoundingStep,s.advanceWarnPercent,s.paymentReasons,s.payrollItemTypes,hr.lists.paymentMethods]);
 Object.assign(s,{payrollStartYear:y,payrollStartMonth:m,overtimeFactor:f,menuCreditDiscountPercent:pc(x.menuStaff),menuDiscountPercentManagers:pc(x.menuManagers),tipShareRoundingStep:Math.max(0,Math.round(N(x.tipStep))),advanceWarnPercent:pc(x.advanceWarnPercent),paymentReasons:reasons,payrollItemTypes:items});
 hr.lists.paymentMethods=methods;hr.lists.paymentTypes=reasons.filter(r=>r.active).map(r=>r.title);hr.lists.penaltyRewardTypes=items.filter(r=>r.active).map(r=>r.title);
 if(JSON.stringify([s.payrollStartYear,s.payrollStartMonth,s.overtimeFactor,s.menuCreditDiscountPercent,s.menuDiscountPercentManagers,s.tipShareRoundingStep,s.advanceWarnPercent,s.paymentReasons,s.payrollItemTypes,hr.lists.paymentMethods])===prev)throw Error('تغییری برای ذخیره نیست');
 ctx.auditExtra={before:{start:before.start},after:{start:{year:y,month:m}}};return{start:{year:y,month:m}}}
/* salary month of a new penalty/reward: the month of its date, or the first month after it that is not final */
function itemSalaryMonth(hr,date,today){let [y,m]=ymOf(date);if(!y)return null;let guard=0;while(isClosed(hr,y,m)&&guard++<24){m++;if(m>12){m=1;y++}}return{year:y,month:m,late:guard>0}}

/* ---------- archive (months before the start): recorded data as it is ---------- */
function archive(hr){const s=startDate(hr);if(!s)return null;const before=d=>{const x=D(d);return x&&x<s},beforeYM=(y,m)=>N(y)>0&&code(y,m)<startCode(hr),nm=id=>A(hr.personnel).find(p=>p.id===id)?.name||id;
 const groups=A(hr.tipGroups).filter(g=>before(g.receiveDate)),shares={};for(const g of groups){if(VOID.includes(S(g.status)))continue;for(const x of tipShares(g)){const k=D(g.receiveDate).slice(0,7)+'|'+x.personnelId;shares[k]=(shares[k]||0)+x.amount}}
 return{start:s,
  tipShares:Object.entries(shares).map(([k,v])=>{const [mo,pid]=k.split('|');return{month:mo,personnelId:pid,name:nm(pid),amount:Math.round(v)}}).sort((a,b)=>a.month.localeCompare(b.month)||a.name.localeCompare(b.name,'fa')),
  tipGroups:groups.map(g=>({id:g.id,date:D(g.receiveDate),type:S(g.type),amount:N(g.totalAmount),method:S(g.receiveMethod),status:S(g.status),people:A(g.participants).map(x=>nm(x.personnelId)).join('، '),notes:S(g.notes)})),
  payments:A(hr.payments).filter(p=>before(p.date)||beforeYM(p.salaryYear,p.salaryMonth)).map(p=>({id:p.id,date:D(p.date),salaryMonth:N(p.salaryYear)?`${p.salaryYear}/${pad(p.salaryMonth)}`:'',personnelId:p.personnelId,name:nm(p.personnelId),type:S(p.type),amount:N(p.amount),method:S(p.method),status:S(p.status),notes:S(p.notes)})),
  items:A(hr.penaltiesRewards).filter(x=>{const [y,m]=itemMonth(x);return beforeYM(y,m)}).map(x=>({id:x.id,date:D(x.date),month:`${itemMonth(x)[0]}/${pad(itemMonth(x)[1])}`,personnelId:x.personnelId,name:nm(x.personnelId),type:S(x.type),amount:N(x.amount),reason:S(x.reason),status:S(x.status)})),
  adjustments:A(hr.monthlyAdjustments).filter(x=>beforeYM(x.year,x.month)).map(x=>({id:x.id,month:`${x.year}/${pad(x.month)}`,personnelId:x.personnelId,name:nm(x.personnelId),hours:x.hoursOverride??'',overtimeHours:x.overtimeHours??'',undertimeHours:x.undertimeHours??'',otherPayment:x.otherPayment??'',otherDeduction:x.otherDeduction??'',notes:S(x.notes)})),
  settlements:A(hr.monthlySettlements).filter(x=>beforeYM(x.year,x.month)).flatMap(x=>A(x.rows).map(r=>({id:x.id,month:`${x.year}/${pad(x.month)}`,status:S(x.status),notes:S(x.notes),personnelId:r.personnelId,name:r.personnelName||nm(r.personnelId),amount:Math.round(N(r.amount))})))}}

/* ---------- closing a month (stage 6d) ----------
   standard: a month is closed after it ended and its work is complete; closing keeps every person's salary lines
   (snapshot) so later changes of contracts or entries do not change it. Blockers: hourly hours missing, no contract,
   draft penalty/reward. After closing: no work entry and no penalty/reward change in it (late items go to the first
   open month), payments go on. Reopening needs a reason; the closed version stays as history (active:false). */
function closeCheck(hr,y,m,today){const st=monthState(hr,y,m,today),nm=id=>A(hr.personnel).find(p=>p.id===id)?.name||id;const rows=st==='open'?monthRows(hr,y,m):[],blockers=[],warnings=[];
 if(st==='current')blockers.push('ماه هنوز تمام نشده است');else if(st==='closed')blockers.push('این ماه قبلاً قطعی شده است');else if(st!=='open')blockers.push('این ماه قابل قطعی کردن نیست');
 for(const r of rows)for(const f of r.flags){if(['hours','contract','draft'].includes(f.k))blockers.push(nm(r.personnelId)+': '+f.t);else if(f.k!=='over')warnings.push(nm(r.personnelId)+': '+f.t)}
 return{state:st,rows,blockers,warnings,people:rows.length,net:rows.reduce((s,r)=>s+r.net,0),paid:rows.reduce((s,r)=>s+r.advance+r.paid,0),balance:rows.reduce((s,r)=>s+r.balance,0)}}
function closeMonth(hr,ctx,{year,month,today,note}){const c=closeCheck(hr,year,month,today);if(c.blockers.length)throw Error('قبل از قطعی کردن: '+c.blockers.slice(0,3).join('؛ ')+(c.blockers.length>3?` و ${c.blockers.length-3} مورد دیگر`:''));if(!c.rows.length)throw Error('کسی در حقوق این ماه نیست');
 hr.payrollClosures=A(hr.payrollClosures);const version=hr.payrollClosures.filter(x=>+x.year===+year&&+x.month===+month).length+1,nm=id=>A(hr.personnel).find(p=>p.id===id)?.name||'';
 const rows=c.rows.map(r=>({personnelId:r.personnelId,personnelName:nm(r.personnelId),contract:r.contract,days:r.days,monthDays:r.monthDays,hours:r.hours,overtimeHours:r.overtimeHours,undertimeHours:r.undertimeHours,menuUsed:r.menuUsed,menuPercent:r.menuPercent,lines:r.lines,base:r.base,overtime:r.overtime,undertime:r.undertime,additions:r.additions,deductions:r.deductions,menu:r.menu,net:r.net,
  /* fields the current panel reads from a closure row (no carry-forward, no tips in the new payroll) */netToman:r.net,advance:r.advance,paid:r.paid,unpaid:r.balance,previousBalance:0,tips:0,tipsSettled:0,monthSettled:0,status:r.balance<=0.5?'تسویه‌شده':(r.advance+r.paid>0?'پرداخت ناقص':'پرداخت‌نشده')}));
 const cl={id:uid('PCL',hr.payrollClosures),year:+year,month:+month,engine:'v2',version,active:true,finalizedAt:ctx.at,finalizedBy:ctx.actor,note:S(note),rows,totals:{people:rows.length,net:c.net,paidAtClose:c.paid,balanceAtClose:c.balance},warnings:c.warnings};
 const pre=`${year}/${pad(month)}/`;for(const g of A(hr.tipGroups))if(D(g.receiveDate).startsWith(pre)&&!(N(g.shareRoundingStep)>0))g.shareRoundingStep=TIP_STEP;
 hr.payrollClosures.push(cl);ctx.auditExtra={entityId:cl.id,year:+year,month:+month,people:rows.length,net:c.net};return cl}
function reopenMonth(hr,ctx,{year,month,reason}){const cl=closureOf(hr,year,month);if(!cl)throw Error('این ماه قطعی نشده است');if(!S(reason))throw Error('علت بازگشایی لازم است');
 Object.assign(cl,{active:false,reopenedAt:ctx.at,reopenedBy:ctx.actor,reopenReason:S(reason)});ctx.auditExtra={entityId:cl.id,year:+year,month:+month,reason:S(reason)};return cl}

/* ---------- payments (stage 6b) ----------
   advance → salary month = month of the payment date (not final); salary → a chosen month from the start to today,
   the month in progress only as «تسویهٔ پایان همکاری» (finalSettlement); tip → the tip ledger; other → outside payroll.
   checkPayment gives errors (refused) and warnings (shown, the user confirms); the form and the save use the same check. */
function forecast(hr,p,y,m){const c=contractOf(p,y,m),len=monthLength(y,m),days=employedDays(p,y,m)||len;if(c.type==='fixed')return c.monthlySalary*days/len;if(c.type==='hourly')return c.hourly*(c.monthlyHours||c.agreedShifts*c.hoursPerShift)*days/len;return 0}
const fmt=v=>Math.round(N(v)).toLocaleString('fa-IR');
function checkPayment(hr,x,today,pending=[]){const cfg=config(hr),errors=[],warnings=[],p=A(hr?.personnel).find(q=>q.id===S(x.personnelId)),date=D(x.date),amount=N(x.amount),reason=cfg.reasons.find(r=>r.active&&r.title===S(x.reason)),kind=reason?.kind||'',[ty,tm]=ymOf(today),sd=startDate(hr);
 const out={kind,year:0,month:0,errors,warnings,balance:null,tipBalance:null};
 if(!p)errors.push('پرسنل را انتخاب کنید');if(!reason)errors.push('علت پرداخت را انتخاب کنید');if(!(amount>0))errors.push('مبلغ باید بیشتر از صفر باشد');
 if(!date)errors.push('تاریخ پرداخت معتبر نیست');else{if(today&&date>D(today))errors.push('تاریخ پرداخت بعد از امروز است');if(!sd)errors.push('ماه شروع حقوق در تنظیمات تعیین نشده است');else if(date<sd)errors.push('تاریخ پرداخت قبل از شروع حقوق در نرم‌افزار است')}
 if(S(x.method)&&!cfg.methods.includes(S(x.method)))errors.push('روش پرداخت در فهرست تنظیمات نیست');if(!S(x.method))errors.push('روش پرداخت را انتخاب کنید');
 if(errors.length||!p)return out;const [dy,dm]=ymOf(date),others=[...A(hr.payments),...pending].filter(q=>q&&!isVoid(q)&&q.personnelId===p.id);
 const name=label;
 if(kind==='advance'){out.year=dy;out.month=dm;if(isClosed(hr,dy,dm))errors.push(`حقوق ${name(dy,dm)} قطعی شده است؛ مساعده برای ماه قطعی‌شده ثبت نمی‌شود`);
  const f=forecast(hr,p,dy,dm),r=calc(hr,p,dy,dm,null,cfg),adv=others.filter(q=>reasonKind(hr,q,cfg)==='advance'&&N(q.salaryYear)===dy&&N(q.salaryMonth)===dm).reduce((s,q)=>s+N(q.amount),0);out.balance=f-adv-r.paid;
  if(f>0&&adv+amount>f*cfg.advanceWarnPercent/100)warnings.push(`جمع مساعدهٔ ${name(dy,dm)} با این پرداخت ${fmt(adv+amount)} می‌شود؛ بیش از ${fmt(cfg.advanceWarnPercent)}٪ حقوق پیش‌بینی (${fmt(f)})`);
  if(f>0&&adv+amount+r.paid>f)warnings.push('مساعده از حقوق پیش‌بینی ماه بیشتر می‌شود');if(!f)warnings.push('حقوق پیش‌بینی این نفر معلوم نیست (قرارداد کامل نیست)')}
 else if(kind==='salary'){const y=N(x.year),m=N(x.month);out.year=y;out.month=m;if(!(y>0&&m>=1&&m<=12))errors.push('ماه حقوق را انتخاب کنید');else{const st=monthState(hr,y,m,today);
   if(st==='before')errors.push('این ماه قبل از شروع حقوق در نرم‌افزار است');else if(st==='future')errors.push('ماه آینده است');
   else{if(st==='current'){if(x.finalSettlement!==true)errors.push(`حقوق ${name(y,m)} هنوز تمام نشده است؛ برای این ماه فقط «مساعده» یا «تسویهٔ پایان همکاری»`);else if(!D(p.employmentEndDate))warnings.push('تاریخ پایان همکاری در پرونده ثبت نشده است؛ حقوق ثابت تا آخر ماه حساب شده — اول تاریخ پایان را ثبت کنید')}
    else if(st==='open')warnings.push(`حقوق ${name(y,m)} هنوز قطعی نشده است؛ مبلغ ممکن است تغییر کند`);
    const r=calc(hr,p,y,m,null,cfg),prior=pending.filter(q=>q.personnelId===p.id&&!isVoid(q)&&['advance','salary'].includes(q.reasonKind)&&N(q.salaryYear)===y&&N(q.salaryMonth)===m).reduce((s,q)=>s+N(q.amount),0);out.balance=r.balance-prior;
    if(r.flags.some(f=>['hours','contract'].includes(f.k)))warnings.push(r.flags.filter(f=>['hours','contract'].includes(f.k)).map(f=>f.t).join('، ')+' — حقوق این ماه کامل حساب نشده');
    if(out.balance<=0.5)warnings.push(`ماندهٔ حقوق ${name(y,m)} صفر یا منفی است`);else if(amount>out.balance+0.5)warnings.push(`مبلغ از ماندهٔ حقوق ${name(y,m)} (${fmt(out.balance)}) بیشتر است`)}}
  if(x.recordBonus===true){const it=cfg.items.find(i=>i.active&&i.kind==='addition'&&i.title===S(x.reason));if(!it)errors.push('برای ثبت پاداش، نوعی با همین عنوان (اضافه به حقوق) در تنظیمات لازم است');else if(out.year&&isClosed(hr,out.year,out.month))errors.push('حقوق آن ماه قطعی شده است؛ پاداش در آن ثبت نمی‌شود')}}
 else if(kind==='tip'){out.year=dy;out.month=dm;const t=tipLedger(hr,p.id),prior=pending.filter(q=>q.personnelId===p.id&&q.reasonKind==='tip'&&!isVoid(q)).reduce((s,q)=>s+N(q.amount),0);out.tipBalance=t.balance-prior;if(amount>out.tipBalance+0.5)warnings.push(`مبلغ از ماندهٔ انعام (${fmt(out.tipBalance)}) بیشتر است`)}
 else if(kind==='other'){out.year=dy;out.month=dm;if(!S(x.notes))errors.push('برای پرداخت خارج از حقوق، توضیح لازم است')}
 if(S(x.tracking)&&others.some(q=>S(q.tracking)&&S(q.tracking)===S(x.tracking)))errors.push('این شمارهٔ پیگیری قبلاً ثبت شده است');
 if(others.some(q=>D(q.date)===date&&Math.round(N(q.amount))===Math.round(amount)&&reasonKind(hr,q,cfg)===kind))warnings.push('پرداخت همین مبلغ و همین علت برای همین نفر در همین روز قبلاً ثبت شده است');
 return out}
/* list: [{personnelId, reason, year, month, date, amount, method, accountKey, tracking, notes, finalSettlement, recordBonus}] */
function addPayments(hr,ctx,list,today){if(!A(list).length)throw Error('پرداختی برای ثبت نیست');hr.payments=A(hr.payments);hr.penaltiesRewards=A(hr.penaltiesRewards);const made=[];
 for(const x of list){/* earlier rows of the same save are already in hr.payments */const c=checkPayment(hr,x,today);if(c.errors.length)throw Error((A(hr.personnel).find(p=>p.id===x.personnelId)?.name||'')+': '+c.errors[0]);
  const pay={id:uid('PAY',hr.payments),date:D(x.date),salaryYear:c.year,salaryMonth:c.month,personnelId:S(x.personnelId),type:S(x.reason),reasonKind:c.kind,amount:Math.round(N(x.amount)),method:S(x.method),accountKey:S(x.accountKey),sourceAccount:'',tracking:S(x.tracking),registeredBy:ctx.actor,referenceCode:'',notes:S(x.notes),sourcePayrollClosureId:closureOf(hr,c.year,c.month)?.id||'',sourceKey:`payroll:${S(x.personnelId)}:${c.year}:${c.month}`,...(x.finalSettlement===true&&c.kind==='salary'?{finalSettlement:true}:{}),createdAt:ctx.at,createdBy:ctx.actor};
  if(x.recordBonus===true&&c.kind==='salary'){const row={id:uid('PR',hr.penaltiesRewards),date:pay.date,personnelId:pay.personnelId,type:pay.type,amount:pay.amount,reason:pay.notes||'پاداش پرداخت‌شده',status:'تاییدشده',approvedBy:ctx.actor,notes:'',year:c.year,month:c.month,source:'payment',sourceId:pay.id,createdAt:ctx.at,createdBy:ctx.actor};hr.penaltiesRewards.push(row);pay.bonusItemId=row.id}
  hr.payments.push(pay);made.push(pay)}
 ctx.auditExtra={payments:made.map(p=>p.id),total:made.reduce((s,p)=>s+p.amount,0)};return made}
function voidPayment(hr,ctx,{id,reason}){const p=A(hr.payments).find(x=>x.id===id);if(!p)throw Error('پرداخت پیدا نشد');if(isVoid(p))throw Error('این پرداخت قبلاً ابطال شده است');if(!S(reason))throw Error('علت ابطال لازم است');
 Object.assign(p,{status:'void',voidReason:S(reason),voidedAt:ctx.at,voidedBy:ctx.actor});
 if(p.bonusItemId){const b=A(hr.penaltiesRewards).find(x=>x.id===p.bonusItemId);if(b&&b.status!=='لغوشده')Object.assign(b,{status:'لغوشده',cancelReason:'ابطال پرداخت '+p.id,cancelledAt:ctx.at,cancelledBy:ctx.actor})}
 ctx.auditExtra={entityId:id,reason:S(reason),amount:N(p.amount)};return p}

window.PayrollCore={MONTHS,KINDS,ITEM_KINDS,DEF_REASONS,DEF_ITEMS,DEF_METHODS,N,D,label,code,monthLength,config,reasonKind,itemKind,isManager,monthState,months,closureOf,isClosed,
 termsFor,contractOf,contractText,employedDays,adjOf,itemsOf,salaryPaymentsOf,inPayroll,calc,monthRows,monthSummary,earlierBalances,personMonths,
 TIP_STEP,tipStep,tipRoundDiff,tipShares,tipLedger,tipGroupsFrom,tipPaymentsFrom,sig,saveWork,saveSettings,itemSalaryMonth,archive,isVoid,forecast,checkPayment,addPayments,voidPayment,closeCheck,closeMonth,reopenMonth};
})();
