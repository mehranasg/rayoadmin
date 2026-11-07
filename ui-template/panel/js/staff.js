/* =========================================================
   Rayo staff app prototype — staff.js (phone)
   Replaces the separate «personel» pages: today (shift, message, tasks), my month (work, payslip, payments, tips),
   requests (leave, advance, attendance correction), operations by role (beverage count, inventory count, waste report,
   purchase request, asset incident, cash report), training and checklists. Sample data; nothing is saved.
   ========================================================= */
(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const FA='۰۱۲۳۴۵۶۷۸۹',fa=s=>String(s).replace(/\d/g,d=>FA[d]),ic=n=>`<i data-lucide="${n}"></i>`,t=v=>fa(Math.round(v).toLocaleString('en'));
let me=null;try{me=sessionStorage.getItem('rayo_staff')}catch(e){}
const S={tab:'today',scr:null};
const staff=id=>D.STAFF.find(s=>s.id===id);
const app=()=>$('#app');
const toast=m=>RT.toast(m);
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
const nav=()=>`<nav class="w-nav">${[['today','امروز','sun'],['month','ماه من','wallet'],['ops','ثبت‌ها','plus-circle'],['more','بیشتر','menu']].map(([k,l,i])=>`<button class="${S.tab===k&&!S.scr?'active':''}" data-tab="${k}">${ic(i)}${l}</button>`).join('')}</nav>`;
const top=(title,sub,back)=>`<header class="w-top">${back?`<button class="icon-btn" data-back>${ic('arrow-right')}</button>`:`<span class="brand-mark sf-mark">ر</span>`}<div class="grow"><h1>${title}</h1><small>${sub||''}</small></div><button class="icon-btn" data-logout title="خروج">${ic('log-out')}</button></header>`;
function login(){return`<div class="login"><div style="text-align:center"><span class="brand-mark sf-mark sf-big">ر</span><h2 style="margin:10px 0 2px">پنل پرسنل رایو</h2><small class="muted">ورود با شماره و رمز · نمونه</small></div>
 <div class="stack" style="gap:8px">${D.STAFF.slice(0,6).map(s=>`<button class="who-btn" data-who="${s.id}"><span class="av">${s.name[0]}</span><div><b>${s.name}</b><small class="muted" style="display:block">${s.role} · ${s.section}</small></div></button>`).join('')}</div></div>`}
/* ---------- screens ---------- */
function today(s){return top('سلام، '+s.name.split(' ')[0],'امروز '+fa('۱۵')+' آبان')+`<div class="w-body">
 <div class="w-card sf-msg">${ic('megaphone')}<div><b>پیام امروز</b><p>امروز رزرو گروهی ساعت ۲۰ — میزهای ۱۲ تا ۱۶ از ساعت ۱۹ خالی بمانند.</p><button class="btn btn-ghost btn-sm" onclick="RT.toast('خواندن ثبت شد')">خواندم</button></div></div>
 <div class="w-card"><div class="between"><b>${ic('clock')} شیفت امروز</b><span class="badge badge-success">${s.shift==='صبح'?'۸ تا ۱۶':'۱۶ تا ۲۴'}</span></div><small class="muted">ورود ثبت‌شده: ${s.shift==='صبح'?'۷:۵۸':'۱۵:۵۲'} — از دستگاه حضور</small></div>
 <div class="w-sec">کارهای امروز</div>
 ${[['چک‌لیست باز کردن '+s.section,'list-checks','۳ از ۸ انجام شده'],...(s.section!=='آشپزخانه'?[['شمارش نوشیدنی صبح','cup-soda','هنوز ثبت نشده']]:[['تعویض روغن سرخ‌کن ۲','flame','طبق برنامه: امروز']]),['آموزش جدید: سس پستو','graduation-cap','۵ دقیقه']].map(([a,i,b])=>`<button class="w-card sf-task" onclick="RT.toast('${a} (نمونه)')">${ic(i)}<div class="grow"><b>${a}</b><small class="muted">${b}</small></div>${ic('chevron-left')}</button>`).join('')}
 <div class="w-sec">برنامهٔ این هفته</div><div class="w-card sf-week">${['ش','ی','د','س','چ','پ','ج'].map((d,i)=>`<div class="${i===4?'today':''}"><small>${d}</small><b>${(i+s.id.length)%6===0?'—':s.shift==='صبح'?'ص':'ع'}</b></div>`).join('')}</div></div>`+nav()}
function month(s){const r=(D.PAYROLL||[]).find(p=>p.sid===s.id)||{base:s.contract==='ماهانه'?s.rate:s.rate*176,otPay:0,bonus:0,ins:0,tax:0,adv:0,fine:0,meal:0,damage:0},gross=r.base+r.otPay+r.bonus,ded=r.ins+r.tax+r.adv+r.fine+r.meal+r.damage,net=gross-ded;
 return top('ماه من','آبان ۱۴۰۵ · باز')+`<div class="w-body">
 <div class="w-card"><div class="between"><span class="muted">خالص پیش‌بینی‌شده</span><b class="sf-big-n">${t(net)} <small>تومان</small></b></div><small class="muted">تا امروز؛ با بستن ماه نهایی می‌شود</small></div>
 <div class="w-card">${[['کارکرد','۱۴۲ ساعت از ۱۷۶'],['اضافه‌کار','۶ ساعت'],['تأخیر','۲ بار — ۲۵ دقیقه'],['مرخصی استفاده‌شده','۱ روز']].map(([a,b])=>`<div class="between sf-row"><span>${a}</span><b>${b}</b></div>`).join('')}<button class="btn btn-ghost btn-sm" onclick="RT.toast('درخواست اصلاح کارکرد (نمونه)')">${ic('pencil')}درخواست اصلاح کارکرد</button></div>
 <div class="w-sec">فیش حقوق</div><div class="w-card">${[['ناخالص',gross],['کسورات (بیمه، مالیات، مساعده، جریمه)',-ded],['خالص',net]].map(([a,b])=>`<div class="between sf-row"><span>${a}</span><b>${t(b)}</b></div>`).join('')}</div>
 <div class="w-sec">انعام و پرداخت‌ها</div><div class="w-card"><div class="between sf-row"><span>انعام آبان (جدا از حقوق)</span><b>${t(P_tip(s))}</b></div><div class="between sf-row"><span>پرداخت‌شده تا امروز</span><b>${t(Math.round(net*0.4))}</b></div><small class="muted">تاریخچهٔ ماه‌های قبل در «بیشتر»</small></div></div>`+nav()}
const P_tip=s=>['سالن','بار'].includes(s.section)?8400000:3100000;
function ops(s){return top('ثبت‌ها',s.section)+`<div class="w-body"><div class="sf-grid">${myOps(s).map(o=>`<button class="w-card sf-op" data-op="${o.k}">${ic(o.i)}<b>${o.t}</b><small class="muted">${o.s}</small></button>`).join('')}</div>
 <div class="w-sec">درخواست‌ها</div><div class="sf-grid">${[['leave','مرخصی','calendar-plus'],['advance','مساعده','hand-coins'],['swap','جابه‌جایی شیفت','repeat']].map(([k,l,i])=>`<button class="w-card sf-op" data-op="${k}">${ic(i)}<b>${l}</b></button>`).join('')}</div></div>`+nav()}
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
 advance:['درخواست مساعده',`<input class="input num" placeholder="مبلغ (تومان)"><small class="muted">سقف مساعده: ۴۰٪ کارکرد تا امروز</small>`],
 swap:['جابه‌جایی شیفت',`<input class="input" placeholder="تاریخ"><select class="select"><option>با چه کسی؟</option>${D.STAFF.map(x=>`<option>${x.name}</option>`).join('')}</select>`]};
function form(k){const [title,body]=FORMS[k];return top(title,'',1)+`<div class="w-body"><div class="w-card stack" style="gap:10px">${body}</div><button class="btn btn-primary wide" onclick="RT.toast('ثبت شد (نمونه) — برای تأیید مدیر')">${ic('check')}ثبت</button></div>`}
function more(s){return top('بیشتر','')+`<div class="w-body">${[['آموزش‌ها و پروتکل‌ها','graduation-cap','۲ مورد جدید'],['چک‌لیست‌ها','list-checks','باز کردن، بستن، نظافت'],['تاریخچهٔ حقوق و انعام','history','ماه‌های قبل'],['شیفت‌های من','calendar-days','آذر منتشر شد'],['رزروهای امروز','calendar-check','برای سالن'],['تغییر رمز','key-round','']].map(([a,i,b])=>`<button class="w-card sf-task" onclick="RT.toast('${a} (نمونه)')">${ic(i)}<div class="grow"><b>${a}</b><small class="muted">${b}</small></div>${ic('chevron-left')}</button>`).join('')}</div>`+nav()}
function render(){const s=me&&staff(me);let h;if(!s)h=login();else if(S.scr)h=form(S.scr);else h=({today,month,ops,more})[S.tab](s);app().innerHTML=h;RT.icons()}
document.addEventListener('click',e=>{const w=e.target.closest('[data-who]');if(w){me=w.dataset.who;try{sessionStorage.setItem('rayo_staff',me)}catch(_){}S.tab='today';return render()}
 const tb=e.target.closest('[data-tab]');if(tb){S.tab=tb.dataset.tab;S.scr=null;return render()}
 const op=e.target.closest('[data-op]');if(op){S.scr=op.dataset.op;return render()}
 if(e.target.closest('[data-back]')){S.scr=null;return render()}
 if(e.target.closest('[data-logout]')){me=null;try{sessionStorage.removeItem('rayo_staff')}catch(_){}return render()}});
document.addEventListener('DOMContentLoaded',render);
})();
