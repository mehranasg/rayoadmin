/* =========================================================
   Rayo staff app prototype — staff.js (phone)
   Phase 1 scope (owner, 1405/08/22): only two things —
     1) ثبت‌ها (operations by role: beverage count, inventory count, waste, oil change, purchase request, asset incident,
        petty cash, cashier shift report) — the first tab;
     2) شیفت‌پلن (my shifts this month, today's team, leave / shift-swap request).
   No payslip, pay or tips here. Sample data; nothing is saved.
   ========================================================= */
(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const FA='۰۱۲۳۴۵۶۷۸۹',fa=s=>String(s).replace(/\d/g,d=>FA[d]),ic=n=>`<i data-lucide="${n}"></i>`;
let me=null;try{me=sessionStorage.getItem('rayo_staff')}catch(e){}
const S={tab:'ops',scr:null};
const staff=id=>D.STAFF.find(s=>s.id===id);
const app=()=>$('#app');
/* role → which operations a person sees (from «کاربران و دسترسی») */
const OPS=[
 {k:'bev',t:'شمارش نوشیدنی',s:'صبح و شب، دو یخچال',i:'cup-soda',who:['سالن','بار']},
 {k:'count',t:'انبارگردانی',s:'شمارش اقلام بخش من',i:'clipboard-check',who:['بار','آشپزخانه']},
 {k:'waste',t:'گزارش ضایعات',s:'همان لحظه، با عکس',i:'trash-2',who:['سالن','بار','آشپزخانه']},
 {k:'oil',t:'تعویض روغن سرخ‌کن',s:'کدام سرخ‌کن، کامل یا افزودن',i:'flame',who:['آشپزخانه']},
 {k:'purchase',t:'درخواست خرید',s:'به مدیر برای تأیید',i:'clipboard-pen',who:['بار','آشپزخانه','سالن']},
 {k:'asset',t:'خرابی / شکستگی وسیله',s:'دارایی‌ها؛ با عکس',i:'hammer',who:['سالن','بار','آشپزخانه']},
 {k:'petty',t:'هزینهٔ تنخواه',s:'عکس رسید + علت خرید',i:'wallet',who:['سالن']},
 {k:'cash',t:'گزارش صندوق شیفت',s:'فقط صندوقدار',i:'banknote',roles:['صندوقدار']}];
const myOps=s=>OPS.filter(o=>o.roles?o.roles.includes(s.role):o.who.includes(s.section));
const nav=()=>`<nav class="w-nav sf-nav2">${[['ops','ثبت‌ها','plus-circle'],['shift','شیفت‌پلن','calendar-days']].map(([k,l,i])=>`<button class="${S.tab===k&&!S.scr?'active':''}" data-tab="${k}">${ic(i)}${l}</button>`).join('')}</nav>`;
const top=(title,sub,back)=>`<header class="w-top">${back?`<button class="icon-btn" data-back>${ic('arrow-right')}</button>`:`<span class="brand-mark sf-mark">ر</span>`}<div class="grow"><h1>${title}</h1><small>${sub||''}</small></div><button class="icon-btn" data-logout title="خروج">${ic('log-out')}</button></header>`;
function login(){return`<div class="login"><div style="text-align:center"><span class="brand-mark sf-mark sf-big">ر</span><h2 style="margin:10px 0 2px">پنل پرسنل رایو</h2><small class="muted">ورود با شماره و رمز · نمونه</small></div>
 <div class="stack" style="gap:8px">${D.STAFF.slice(0,8).map(s=>`<button class="who-btn" data-who="${s.id}"><span class="av">${s.name[0]}</span><div><b>${s.name}</b><small class="muted" style="display:block">${s.role} · ${s.section}</small></div></button>`).join('')}</div></div>`}

/* ---------- ثبت‌ها (first tab) ---------- */
function ops(s){const sh=planFor(s).find(d=>d.today);
 return top('ثبت‌ها',`${s.name} · ${s.section}`)+`<div class="w-body">
 ${sh?`<button class="w-card sf-task" data-tab="shift">${ic('clock')}<div class="grow"><b>شیفت امروز: ${sh.label}</b><small class="muted">${sh.off?'امروز کار ندارید':sh.hours}</small></div>${ic('chevron-left')}</button>`:''}
 <div class="w-sec">ثبت‌های من</div><div class="sf-grid">${myOps(s).map(o=>`<button class="w-card sf-op" data-op="${o.k}">${ic(o.i)}<b>${o.t}</b><small class="muted">${o.s}</small></button>`).join('')}</div></div>`+nav()}
const FORMS={
 bev:['شمارش نوشیدنی — صبح',`${['کوکاکولا','اسپرایت','فانتا','آب معدنی','ماءالشعیر'].map(n=>`<div class="sf-count"><span>${n}</span><input class="input num" inputmode="numeric" placeholder="بالا"><input class="input num" inputmode="numeric" placeholder="پایین"></div>`).join('')}`],
 count:['انبارگردانی بخش',`${['شیر پرچرب (عدد)','دانه قهوه (کیلو)','سیروپ کارامل (بطری)'].map(n=>`<div class="sf-count"><span>${n}</span><input class="input num" inputmode="decimal"></div>`).join('')}<small class="muted">عدد غیرعادی (مثلاً ۱۰ برابر معمول) قبل از ثبت هشدار می‌دهد.</small>`],
 waste:['گزارش ضایعات',`<select class="select"><option>نوع: پرتی / سوختن / ریختن / خرابی</option></select><input class="input" placeholder="کالا"><input class="input num" inputmode="decimal" placeholder="مقدار (به واحد کالا — گرم/کیلو کنترل می‌شود)"><input class="input" placeholder="علت"><label class="drop">${ic('camera')}عکس (اختیاری)</label>`],
 oil:['تعویض روغن سرخ‌کن',`<select class="select"><option>سرخ‌کن ۱ (۲۰ لیتر)</option><option>سرخ‌کن ۲ (۲۰ لیتر)</option><option>سرخ‌کن ۳ (۲۰ لیتر)</option><option>رومیزی ۱ (۵ لیتر)</option></select><div class="segmented"><button class="active">تعویض کامل</button><button>افزودن</button></div><input class="input num" placeholder="لیتر (خالی = گنجایش)">`],
 purchase:['درخواست خرید',`<input class="input" placeholder="کالا"><input class="input num" placeholder="مقدار"><input class="input" placeholder="برای کی لازم است؟">`],
 asset:['خرابی / شکستگی وسیله',`<input class="input" placeholder="وسیله (مثلاً لیوان دیواره‌دار)"><input class="input num" placeholder="تعداد"><input class="input" placeholder="چه اتفاقی افتاد؟"><label class="drop">${ic('camera')}عکس</label>`],
 petty:['هزینهٔ تنخواه',`<label class="drop">${ic('camera')}عکس رسید — مبلغ و اقلام خودکار خوانده می‌شود</label><input class="input num" placeholder="مبلغ (تومان)"><input class="input" placeholder="علت خرید (الزامی)">`],
 cash:['گزارش صندوق شیفت',`${['فروش طبق سیستم','کارتخوان','نقد شمارش‌شده','کارت به کارت','انعام سالن'].map(n=>`<div class="sf-count"><span>${n}</span><input class="input num" inputmode="numeric"></div>`).join('')}`],
 leave:['درخواست مرخصی',`<input class="input" placeholder="از تاریخ"><input class="input" placeholder="تا تاریخ"><input class="input" placeholder="علت">`],
 swap:['جابه‌جایی شیفت',`<input class="input" placeholder="تاریخ"><select class="select"><option>با چه کسی؟</option>${D.STAFF.map(x=>`<option>${x.name}</option>`).join('')}</select>`]};
function form(k){const [title,body]=FORMS[k];return top(title,'',1)+`<div class="w-body"><div class="w-card stack" style="gap:10px">${body}</div><button class="btn btn-primary wide" onclick="RT.toast('ثبت شد (نمونه) — برای تأیید مدیر')">${ic('check')}ثبت</button></div>`}

/* ---------- شیفت‌پلن ---------- */
/* sample plan for the current Persian month (in the real system: «پرسنل ← شیفت‌پلن», published by the manager) */
const PF=new Intl.DateTimeFormat('en-u-ca-persian',{year:'numeric',month:'numeric',day:'numeric'});
const pparts=d=>{const p={};PF.formatToParts(d).forEach(x=>p[x.type]=+x.value);return p};
const WD=['ی','د','س','چ','پ','ج','ش'];         // getDay(): 0 = Sunday
const MONTHS=['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
const SHIFTS={'صبح':['صبح','۸ تا ۱۶'],'عصر':['عصر','۱۶ تا ۲۴'],'آخر هفته':['عصر','۱۶ تا ۲۴']};
function planFor(s){const now=new Date(),t=pparts(now),days=[];
  for(let k=-35;k<=35;k++){const d=new Date(now.getTime()+k*864e5),p=pparts(d);if(p.month!==t.month||p.year!==t.year)continue;
    const wd=d.getDay(),seed=(p.day*7+s.id.charCodeAt(1)*3)%9,off=s.shift==='آخر هفته'?!(wd===4||wd===5):seed===0||seed===5&&wd===6;
    const base=SHIFTS[s.shift]||SHIFTS['صبح'],dbl=!off&&seed===3;
    days.push({d,day:p.day,wd,today:k===0,past:k<0,off,label:off?'استراحت':dbl?'دوبل':base[0],hours:off?'':dbl?'۸ تا ۲۴':base[1],h:off?0:dbl?16:8})}
  return days}
const team=(s,day)=>D.STAFF.filter(x=>x.id!==s.id).map(x=>({x,p:planFor(x).find(d=>d.day===day)})).filter(z=>z.p&&!z.p.off);
function shift(s){const P=planFor(s),td=P.find(d=>d.today),t=pparts(new Date()),work=P.filter(d=>!d.off),done=work.filter(d=>d.past);
 const tm=td&&!td.off?team(s,td.day).filter(z=>z.p.label===td.label||z.p.label==='دوبل'||td.label==='دوبل'):[];
 return top('شیفت‌پلن',MONTHS[t.month-1]+' '+fa(t.year))+`<div class="w-body">
 ${td?`<div class="w-card sf-today ${td.off?'off':''}"><div class="between"><b>${ic('clock')} امروز</b><span class="badge badge-${td.off?'neutral':'success'}">${td.label}${td.hours?' · '+td.hours:''}</span></div>
   ${tm.length?`<small class="muted">هم‌شیفت‌ها: ${tm.map(z=>z.x.name+' ('+z.x.role+')').join('، ')}</small>`:''}</div>`:''}
 <div class="w-card"><div class="between sf-row"><span>شیفت‌های این ماه</span><b>${fa(work.length)} روز · ${fa(work.reduce((a,d)=>a+d.h,0))} ساعت</b></div><div class="between sf-row"><span>گذشته / مانده</span><b>${fa(done.length)} / ${fa(work.length-done.length)}</b></div></div>
 <div class="w-sec">${MONTHS[t.month-1]}</div>
 <div class="sf-cal">${WD.slice(6).concat(WD.slice(0,6)).map(w=>`<small>${w}</small>`).join('')}${Array((P[0].wd+1)%7).fill('<span></span>').join('')}
   ${P.map(d=>`<div class="sf-day ${d.off?'off':d.label==='دوبل'?'dbl':d.label==='صبح'?'am':'pm'} ${d.today?'today':''} ${d.past?'past':''}"><b>${fa(d.day)}</b><small>${d.off?'—':d.label}</small></div>`).join('')}</div>
 <div class="chips sf-leg"><span><i class="am"></i>صبح</span><span><i class="pm"></i>عصر</span><span><i class="dbl"></i>دوبل</span><span><i class="off"></i>استراحت</span></div>
 <div class="w-sec">درخواست</div><div class="sf-grid">${[['swap','جابه‌جایی شیفت','repeat'],['leave','مرخصی','calendar-plus']].map(([k,l,i])=>`<button class="w-card sf-op" data-op="${k}">${ic(i)}<b>${l}</b></button>`).join('')}</div>
 <small class="muted" style="display:block;margin-top:10px">برنامه را مدیر در «پرسنل ← شیفت‌پلن» منتشر می‌کند؛ هر تغییر این‌جا دیده می‌شود.</small></div>`+nav()}

function render(){const s=me&&staff(me);let h;if(!s)h=login();else if(S.scr)h=form(S.scr);else h=({ops,shift})[S.tab](s);app().innerHTML=h;RT.icons()}
document.addEventListener('click',e=>{const w=e.target.closest('[data-who]');if(w){me=w.dataset.who;try{sessionStorage.setItem('rayo_staff',me)}catch(_){}S.tab='ops';return render()}
 const tb=e.target.closest('[data-tab]');if(tb){S.tab=tb.dataset.tab;S.scr=null;return render()}
 const op=e.target.closest('[data-op]');if(op){S.scr=op.dataset.op;return render()}
 if(e.target.closest('[data-back]')){S.scr=null;return render()}
 if(e.target.closest('[data-logout]')){me=null;try{sessionStorage.removeItem('rayo_staff')}catch(_){}return render()}});
document.addEventListener('DOMContentLoaded',render);
})();
