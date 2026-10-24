/* =========================================================
   Rayo UI Template — app.js
   Shell (sidebar/topbar), theme switch, formatters, chart helper.
   ========================================================= */
(function(){
'use strict';

/* ---------- Menu (mirrors the live app's sidebar groups) ---------- */
const MENU=[
  {label:'داشبورد',icon:'layout-dashboard',href:'index.html'},
  {section:'عملیات'},
  {label:'گزارش صندوق',icon:'banknote',href:'#'},
  {label:'انبار و کنترل مصرف',icon:'package',href:'inventory.html'},
  {label:'قیمت تمام شده',icon:'calculator',href:'#'},
  {label:'فروش',icon:'receipt',key:'sales',items:[['تحلیل گزارش فروش','#'],['کنترل صندوق / Audit سپیدز','#'],['تحلیل سود و فروش','#']]},
  {label:'خرید و تامین',icon:'truck',key:'purchase',items:[['تأمین‌کنندگان','#'],['حساب و سوابق خرید','#'],['درخواست‌های خرید','#'],['ثبت فاکتور خرید / حسابداری','#'],['ثبت پرداخت تأمین‌کننده','#']]},
  {section:'منابع انسانی'},
  {label:'مدیریت پرسنل',icon:'users',key:'personnel',items:[['لیست پرسنل','#'],['مدیریت دسترسی‌ها','#'],['پروفایل پرسنلی','#'],['گزارشات','#'],['درخواست‌های مرخصی','#'],['پیام روز','#'],['ثبت و گزارش تخلف','#'],['درخواست‌های مساعده','#']]},
  {label:'مدیریت شیفت پلن',icon:'calendar-days',key:'shift',items:[['برنامه هفتگی','#'],['برنامه ماهانه','#'],['نیروی موردنیاز','#'],['تحلیل ظرفیت پرسنل','#'],['نقشه کمبود نیرو','#'],['تقویم سالانه','#'],['سوابق شیفت','#'],['گزارش شیفت','#']]},
  {label:'آموزش و چک‌لیست‌ها',icon:'graduation-cap',key:'training',items:[['آموزش‌ها و پروتکل‌ها','#'],['تعریف چک‌لیست‌ها','#'],['گزارش چک‌لیست‌ها','#']]},
  {label:'حقوق و مزایا',icon:'wallet',key:'payroll',items:[['کارکرد ماه','#'],['درخواست‌های اصلاح کارکرد','#'],['فیش حقوقی','#'],['انعام','#'],['جریمه و تشویق','#'],['تأخیر','#'],['پرداخت حقوق','#'],['مصرف پرسنلی','#'],['مرخصی و غیبت','#'],['محاسبه‌گر حقوق','#'],['تحلیل معکوس حقوق','#'],['قرارداد و نرخ پرسنل','#'],['جدول حقوق ساعتی','#'],['تنظیمات پایه حقوق','#']]},
  {section:'تحلیل و مدیریت'},
  {label:'گزارشات',icon:'chart-line',key:'reports',items:[['گزارش‌های مدیریتی','reports.html'],['پیش‌بینی هزینه و حقوق','#'],['سود و زیان ماهانه','reports.html?tab=profit'],['محاسبه‌گر سود','#'],['رزروها و بیعانه‌ها','#'],['نظرسنجی مشتریان','reports.html?tab=survey']]},
  {label:'مدیریت اموال و دارایی',icon:'tag',href:'#'},
  {label:'تنظیمات',icon:'settings',key:'settings',items:[['مدیریت اطلاعات و بکاپ','#'],['تنظیمات پنل و فهرست‌ها','#'],['تنظیمات تخلفات','#'],['تغییرات','#'],['لاگ خطاها','#']]},
  {section:'قالب'},
  {label:'راهنمای کامپوننت‌ها',icon:'palette',href:'components.html'}
];

const page=(location.pathname.split('/').pop()||'index.html').toLowerCase();
const isActive=href=>href!=='#'&&href.split('?')[0].toLowerCase()===page;
const isExact=href=>href!=='#'&&decodeURIComponent(href.toLowerCase())===decodeURIComponent((page+location.search).toLowerCase());

function store(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}}

/* ---------- Sidebar ---------- */
function buildSidebar(){
  const side=document.getElementById('sidebar');if(!side)return;
  const activeGroup=MENU.find(m=>m.items&&m.items.some(([,h])=>isExact(h)));
  const openKey=activeGroup?activeGroup.key:store('rt_menu');
  side.innerHTML=`
    <div class="brand"><div class="brand-mark">ر</div><div><strong>رایو</strong><small>پنل مدیریت کافه</small></div></div>
    <nav class="nav">${MENU.map(m=>{
      if(m.section)return`<div class="nav-label">${m.section}</div>`;
      if(!m.items)return`<a class="nav-link ${isActive(m.href)?'active':''}" href="${m.href}"><i data-lucide="${m.icon}"></i><span>${m.label}</span></a>`;
      const open=m.key===openKey;
      return`<div class="nav-group ${open?'open':''}" data-key="${m.key}">
        <button class="nav-head" type="button" aria-expanded="${open}"><i data-lucide="${m.icon}"></i><span>${m.label}</span><i class="chev" data-lucide="chevron-down"></i></button>
        <div class="nav-sub"><div>${m.items.map(([l,h])=>`<a href="${h}" class="${activeGroup===m&&isExact(h)?'active':''}">${l}</a>`).join('')}</div></div>
      </div>`;
    }).join('')}</nav>
    <div class="sidebar-foot"><div class="user-chip"><div class="avatar">م‌ع</div><div><b>مدیر سیستم</b><small>شعبه مرکزی</small></div></div></div>`;
  side.querySelectorAll('.nav-head').forEach(btn=>btn.addEventListener('click',()=>{
    const g=btn.parentElement,was=g.classList.contains('open');
    side.querySelectorAll('.nav-group').forEach(x=>{x.classList.remove('open');x.querySelector('.nav-head').setAttribute('aria-expanded','false')});
    if(!was){g.classList.add('open');btn.setAttribute('aria-expanded','true');store('rt_menu',g.dataset.key)}
  }));
}

/* ---------- Topbar ---------- */
function buildTopbar(){
  const top=document.getElementById('topbar');if(!top)return;
  top.innerHTML=`
    <button class="icon-btn menu-btn" id="menuBtn" aria-label="منو"><i data-lucide="menu"></i></button>
    <label class="search"><i data-lucide="search"></i><input placeholder="جستجو در کالا، پرسنل، فاکتور…"><kbd>Ctrl K</kbd></label>
    <div class="topbar-spacer"></div>
    <span class="topbar-date">${RT.date(new Date(),{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</span>
    <button class="icon-btn" id="themeBtn" aria-label="تغییر تم"><i data-lucide="moon"></i></button>
    <button class="icon-btn" aria-label="اعلان‌ها"><i data-lucide="bell"></i><span class="dot"></span></button>`;
  document.body.insertAdjacentHTML('beforeend','<div class="backdrop" id="backdrop"></div><div class="toast-host" id="toasts"></div>');
  const side=document.getElementById('sidebar'),back=document.getElementById('backdrop');
  const setMenu=o=>{side.classList.toggle('open',o);back.classList.toggle('open',o)};
  document.getElementById('menuBtn').onclick=()=>setMenu(!side.classList.contains('open'));
  back.onclick=()=>setMenu(false);
  document.getElementById('themeBtn').onclick=toggleTheme;
  document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();top.querySelector('.search input')?.focus()}});
}

/* ---------- Theme ---------- */
function currentTheme(){
  const t=document.documentElement.dataset.theme;
  if(t)return t;
  return matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
}
function applyThemeIcon(){
  const b=document.getElementById('themeBtn');if(!b)return;
  b.innerHTML=`<i data-lucide="${currentTheme()==='dark'?'sun':'moon'}"></i>`;icons();
}
function toggleTheme(){
  const next=currentTheme()==='dark'?'light':'dark';
  document.documentElement.dataset.theme=next;store('rt_theme',next);
  applyThemeIcon();RT.refreshCharts();
}
(function initTheme(){const t=store('rt_theme');if(t==='dark'||t==='light')document.documentElement.dataset.theme=t})();

function icons(){if(window.lucide)window.lucide.createIcons()}

/* ---------- Formatters ---------- */
const nf=new Intl.NumberFormat('fa-IR');
const nf1=new Intl.NumberFormat('fa-IR',{maximumFractionDigits:1});
const RT={
  MENU,
  n:v=>nf.format(Math.round(v)),
  n1:v=>nf1.format(v),
  pct:v=>nf1.format(v)+'٪',
  /* toman → «۱۲٫۴ م» (million) or «۱٫۲ ب» (billion) */
  money:v=>{const a=Math.abs(v);if(a>=1e9)return nf1.format(v/1e9)+' میلیارد';if(a>=1e6)return nf1.format(v/1e6)+' میلیون';if(a>=1e3)return nf.format(Math.round(v/1e3))+' هزار';return nf.format(v)},
  /* compact axis labels: «۸۰ میلیون»، «۱٫۵ میلیارد» */
  short:v=>{const a=Math.abs(v);if(a>=1e9)return nf1.format(v/1e9)+' میلیارد';if(a>=1e6)return nf.format(Math.round(v/1e6))+' میلیون';if(a>=1e3)return nf.format(Math.round(v/1e3))+' هزار';return nf.format(v)},
  date:(d,o)=>new Intl.DateTimeFormat('fa-IR-u-ca-persian',o||{day:'numeric',month:'short'}).format(d),
  delta:v=>`<span class="delta ${v>=0?'up':'down'}"><i data-lucide="${v>=0?'trending-up':'trending-down'}"></i>${nf1.format(Math.abs(v))}٪</span>`,
  icons,
  toast(msg,icon='check-circle'){const h=document.getElementById('toasts');if(!h)return;const el=document.createElement('div');el.className='toast';el.innerHTML=`<i data-lucide="${icon}"></i>${msg}`;h.appendChild(el);icons();setTimeout(()=>el.remove(),2600)},
  /* deterministic pseudo-random for stable demo data */
  rng(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}
};

/* ---------- Charts (ECharts) ---------- */
const registry=[];
function cssVar(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim()}
RT.theme=function(){
  return{
    font:cssVar('--font'),text:cssVar('--text'),text2:cssVar('--text-2'),text3:cssVar('--text-3'),
    border:cssVar('--border'),surface:cssVar('--surface'),surface3:cssVar('--surface-3'),
    accent:cssVar('--accent'),success:cssVar('--success'),danger:cssVar('--danger'),warning:cssVar('--warning'),
    palette:['--c1','--c2','--c3','--c4','--c5','--c6'].map(cssVar),
    dark:currentTheme()==='dark'
  };
};
/* shared defaults merged into every chart */
RT.base=function(t){
  return{
    color:t.palette,
    textStyle:{fontFamily:t.font,color:t.text2},
    animationDuration:700,animationEasing:'cubicOut',
    grid:{left:8,right:8,top:24,bottom:4,containLabel:true},
    tooltip:{
      trigger:'axis',confine:true,
      backgroundColor:t.surface,borderColor:t.border,borderWidth:1,padding:[10,12],
      textStyle:{color:t.text,fontFamily:t.font,fontSize:12},
      extraCssText:'border-radius:12px;box-shadow:0 12px 32px -12px rgba(0,0,0,.25);direction:rtl;text-align:right;',
      axisPointer:{type:'line',lineStyle:{color:t.border,width:1},shadowStyle:{color:t.surface3}}
    }
  };
};
RT.axis=function(t,extra){
  return Object.assign({
    axisLine:{show:false},axisTick:{show:false},
    axisLabel:{color:t.text3,fontFamily:t.font,fontSize:11},
    splitLine:{lineStyle:{color:t.border,type:[4,4]}}
  },extra||{});
};
/* tooltip row helper */
RT.tipRow=(color,label,value)=>`<div style="display:flex;gap:16px;justify-content:space-between;align-items:center;min-width:150px"><span><i style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};margin-left:6px"></i>${label}</span><b>${value}</b></div>`;

RT.chart=function(id,build){
  const el=typeof id==='string'?document.getElementById(id):id;if(!el||!window.echarts)return;
  const entry={el,build,inst:null};
  const mount=()=>{entry.inst&&entry.inst.dispose();entry.inst=echarts.init(el,null,{renderer:'svg'});entry.inst.setOption(build(RT.theme()))};
  mount();entry.mount=mount;registry.push(entry);
  new ResizeObserver(()=>entry.inst&&entry.inst.resize()).observe(el);
  return entry;
};
RT.refreshCharts=()=>{
  for(let i=registry.length-1;i>=0;i--){const e=registry[i];if(e.el.isConnected)e.mount();else{e.inst&&e.inst.dispose();registry.splice(i,1)}}
};
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{if(!document.documentElement.dataset.theme){RT.refreshCharts();applyThemeIcon()}});

/* tabs: <div class="tabs" data-tabs="group"> + <section data-panel="group:key"> */
RT.tabs=function(root,onChange){
  const tabs=[...root.querySelectorAll('.tab')];
  const show=key=>{
    tabs.forEach(t=>t.classList.toggle('active',t.dataset.tab===key));
    document.querySelectorAll(`[data-panel^="${root.dataset.tabs}:"]`).forEach(p=>p.hidden=p.dataset.panel!==`${root.dataset.tabs}:${key}`);
    onChange&&onChange(key);
  };
  tabs.forEach(t=>t.addEventListener('click',()=>show(t.dataset.tab)));
  return show;
};

/* modals: [data-open="id"] opens, [data-close] / backdrop / Esc closes */
document.addEventListener('click',e=>{
  const o=e.target.closest('[data-open]');if(o){document.getElementById(o.dataset.open)?.classList.add('open');return}
  const c=e.target.closest('[data-close]');if(c){c.closest('.modal-backdrop')?.classList.remove('open');return}
  if(e.target.classList.contains('modal-backdrop'))e.target.classList.remove('open');
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.modal-backdrop.open').forEach(m=>m.classList.remove('open'))});

window.RT=RT;
document.addEventListener('DOMContentLoaded',()=>{buildSidebar();buildTopbar();applyThemeIcon();icons()});
})();
