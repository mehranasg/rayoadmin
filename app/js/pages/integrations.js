/* Rayo Panel prototype — integration of the standalone template sections
   - انبار: «داشبورد کنترل» + زیربخش‌های گزارش (inventory-control on the shared analysis engine; real data: live on rayocafe.ir or JSON files)
   - مالی: «تنخواه» (petty-cash) and «فاکتورهای AI» (invoice-ai: capture modal + manager queue)
   The two finance sections run on sample data; the inventory analysis runs on real-format data only and never saves
   (inventory entries on live data are saved by inventory-real.js through core/js/inventory-write.js). */
(function(){
'use strict';
const IC=window.InvControl,PC=window.PettyCash,IA=window.InvoiceAI;
const inv=P.mods.inventory,fin=P.mods.finance;

/* ---------- inventory: data connection (shared by the analysis views) ---------- */
let loadState={busy:false,err:''};
async function connect(kind,files){if(loadState.busy)return;loadState={busy:true,err:''};P.render();
 try{const raw=kind==='live'?await IC.loadLive():kind==='url'?await IC.loadUrl(files):await IC.loadFiles(files);IC.attach(raw);P.toast(raw.source==='live'?'دادهٔ زندهٔ انبار بارگذاری شد':'فایل‌های انبار بارگذاری شد','database')}
 catch(e){loadState.err=e.message||String(e)}finally{loadState.busy=false;P.render()}}
window.PanelData={state:()=>loadState,connect,expected:()=>!!new URLSearchParams(location.search).get('data')||/rayocafe.ir$/.test(location.hostname)||!!window.RAYO_TEMPLATE_API};
(function autoConnect(){const q=new URLSearchParams(location.search).get('data');if(q)connect('url',q);else if(/rayocafe\.ir$/.test(location.hostname)||window.RAYO_TEMPLATE_API)connect('live')})();
function connectCard(){return P.card({title:'اتصال به دادهٔ واقعی انبار',sub:'تحلیل‌ها فقط می‌خوانند؛ ثبت در تب‌های انبار فقط روی دادهٔ زنده و در نشست مدیریت ممکن است',body:`
 ${loadState.busy?P.note('در حال بارگذاری…','loader'):''}${loadState.err?P.note('خطا: '+P.esc(loadState.err),'alert-triangle'):''}
 ${P.note('وقتی پنل از دامنهٔ rayocafe.ir باز شود، دادهٔ زنده خودکار خوانده می‌شود. در غیر این صورت فایل JSON انبار و فایل منو/قیمت (و در صورت تمایل گزارش صندوق) را انتخاب کنید.','info')}
 <div class="form-grid mt">${P.field('فایل‌های JSON','<input class="input" type="file" id="ivaFiles" accept=".json,application/json" multiple>')}<div class="field"><label>&nbsp;</label><button class="btn btn-secondary" id="ivaLive">${P.ic('plug')}تلاش برای اتصال زنده</button></div></div>`})}
function bindConnect(root){const f=P.$('#ivaFiles',root);if(f)f.onchange=e=>connect('files',[...e.target.files]);const b=P.$('#ivaLive',root);if(b)b.onclick=()=>connect('live')}
function periodBar(){const p=IC.period();return`<div class="row" style="flex-wrap:wrap;gap:8px;margin-bottom:var(--s4)">
 <select class="select" id="ivaMonth" style="width:auto">${p.months.slice().reverse().map(([k,l])=>`<option value="${k}" ${p.mode==='month'&&k===p.month?'selected':''}>${l}</option>`).join('')}${p.mode==='range'?'<option selected>بازهٔ دلخواه</option>':''}</select>
 <input class="input num" id="ivaFrom" style="width:120px" placeholder="از ۱۴۰۵/۰۶/۰۱" value="${p.mode==='range'?P.fa(p.from):''}"><input class="input num" id="ivaTo" style="width:120px" placeholder="تا ۱۴۰۵/۰۶/۳۱" value="${p.mode==='range'?P.fa(p.to):''}"><button class="btn btn-ghost btn-sm" id="ivaRange">${P.ic('calendar-range')}اعمال بازه</button>
 <label class="check"><input type="checkbox" id="ivaFix" ${p.fix?'checked':''}>اصلاح پیشنهادی واحد</label>
 <span class="muted" style="font-size:12px">${IC.source()==='live'?P.b('دادهٔ زنده','success'):P.b('از فایل','info')} از ابتدای «از» تا پایان «تا»</span></div>${IC.banner()}`}
function bindPeriod(root,rerender){const m=P.$('#ivaMonth',root);if(!m)return;m.onchange=()=>{if(m.value.includes('/')){IC.setPeriod({month:m.value});rerender()}};
 P.$('#ivaRange',root).onclick=()=>{const a=P.raw(P.$('#ivaFrom',root).value),b=P.raw(P.$('#ivaTo',root).value);if(!/^\d{4}\/\d\d\/\d\d$/.test(a)||!/^\d{4}\/\d\d\/\d\d$/.test(b)||a>b)return P.toast('بازهٔ تاریخ نامعتبر است (مثال ۱۴۰۵/۰۶/۰۱)','alert-triangle');IC.setPeriod({from:a,to:b});rerender()};
 P.$('#ivaFix',root).onchange=e=>{IC.setPeriod({fix:e.target.checked});rerender()}}
function analysisTab(view){return{render:()=>IC.ready()?`<div id="ivaPeriod">${periodBar()}</div><div id="ivaHost"></div>`:connectCard(),
 mount:root=>{if(!IC.ready())return bindConnect(root);const draw=()=>{P.$('#ivaPeriod',root).innerHTML=periodBar();bindPeriod(root,draw);IC.render(view(),P.$('#ivaHost',root),v=>{reportView=v;P.go('#/inventory/reports')});RT.icons()};draw()}}}

/* «داشبورد کنترل» — first inventory tab */
const dashTab=analysisTab(()=>'dash');
inv.tabs.unshift({id:'control',label:'داشبورد کنترل',icon:'layout-dashboard',title:'کنترل انبار و مغایرت',desc:'مغایرت، پرتی و ایرادهای داده روی دادهٔ واقعی — فقط خواندنی',
 render:dashTab.render,mount:dashTab.mount,badge:()=>0}); // data issues are listed in the dashboard (APP_REVIEW N-13)

/* «گزارش‌ها» — analysis sub-views + the earlier sample reports */
const repTab=inv.tabs.find(t=>t.id==='reports'),sampleRender=repTab.render,sampleMount=repTab.mount;
let reportView='period';
const SUBS=Object.entries(IC.VIEWS).filter(([k])=>k!=='dash');
repTab.desc='گزارش دوره، گردش مواد، کجا دنبال مغایرت بگردم، پرتی، نوشیدنی، روغن و اقلام سر میز، خروجی AI';
repTab.render=r=>`${P.chips('ivRep',[...SUBS.map(([k,l])=>[k,l]),['sample','نمای نمونهٔ قبلی']],reportView)}<div class="mt" id="ivRepBody">${reportView==='sample'?sampleRender(r):IC.ready()?`<div id="ivaPeriod">${periodBar()}</div><div id="ivaHost"></div>`:connectCard()}</div>`;
repTab.mount=(root,r)=>{P.bindChips(root,'ivRep',k=>{reportView=k;P.render()});if(reportView==='sample')return sampleMount&&sampleMount(root,r);analysisTab(()=>reportView).mount(root)};

/* receipt tab: AI capture button */
const rcTab=inv.tabs.find(t=>t.id==='receipt'),rcAct=rcTab.actions;
rcTab.actions=r=>`<button class="btn btn-secondary" onclick="InvoiceAI.open()">${P.ic('scan-line')}فاکتور با عکس (AI)</button>${rcAct?rcAct(r):''}`;

/* ---------- finance: petty cash + AI invoice queue ---------- */
let pcView='dash',iaView='queue';
const at=fin.tabs.findIndex(t=>t.id==='cash');
fin.tabs.splice(at+1,0,
 {id:'petty',label:'تنخواه',icon:'wallet',title:'مدیریت تنخواه',desc:'کارت‌های تنخواه پرسنل، هزینه‌های ریز با رسید و کنترل خودکار — دادهٔ نمونه',badge:()=>PC.reviewCount(),
  actions:()=>`<button class="btn btn-primary" onclick="P.actions.pettyNew()">${P.ic('plus')}ثبت هزینهٔ تنخواه</button>`,
  render:()=>`${P.chips('pc',Object.entries(PC.VIEWS),pcView)}<div class="mt" id="pcHost"></div>`,
  mount:root=>{P.bindChips(root,'pc',k=>{pcView=k;P.render()});PC.render(pcView,P.$('#pcHost',root))}},
 {id:'ai',label:'فاکتورهای AI',icon:'scan-line',title:'فاکتور خرید با عکس و AI',desc:'عکس فاکتور ← پیش‌نویس AI ← تأیید مدیر ← فاکتور نهایی — استخراج نمونه',badge:()=>IA.queueCount(),
  actions:()=>`<button class="btn btn-primary" onclick="InvoiceAI.open()">${P.ic('camera')}فاکتور جدید با عکس</button>`,
  render:()=>`${P.chips('ia',Object.entries(IA.VIEWS),iaView)}<div class="mt" id="iaHost"></div>`,
  mount:root=>{P.bindChips(root,'ia',k=>{iaView=k;P.render()});IA.render(iaView,P.$('#iaHost',root),()=>InvoiceAI.open())}});
const docsTab=fin.tabs.find(t=>t.id==='docs'),docsAct=docsTab.actions;
docsTab.actions=r=>`<button class="btn btn-secondary" onclick="InvoiceAI.open()">${P.ic('scan-line')}فاکتور با عکس (AI)</button>${docsAct?docsAct(r):''}`;

P.actions.pettyNew=()=>P.form({title:'ثبت هزینهٔ تنخواه',ok:'ثبت',body:`${P.note('از گوشی: عکس رسید گرفته می‌شود و AI مبلغ، فروشنده و اقلام را می‌خواند؛ پرسنل فقط «علت خرید» را می‌نویسد. بدون رسید، هزینه «در انتظار رسید» می‌ماند.','smartphone')}
 <div class="form-grid">${P.field('عکس رسید','<input class="input" type="file" accept="image/*" capture="environment">')}${P.field('مبلغ',P.money('amount'))}${P.field('فروشنده','<input class="input" placeholder="مثلاً میوه‌فروشی محله">')}${P.field('دسته',`<select class="select">${P.opts([['produce','میوه و تره‌بار'],['dairy','لبنیات و نان'],['cleaning','بهداشتی و شوینده'],['repair','تعمیرات جزئی'],['transport','پیک و حمل'],['other','سایر']])}</select>`)}<div class="full">${P.field('علت خرید (الزامی)','<input class="input" placeholder="مثلاً لیمو برای بار — تمام شده بود">')}</div></div>`,
 info:'در نمونه ذخیره نمی‌شود. در پیاده‌سازی، کنترل‌های تنخواه (قیمت مرجع، سقف، پذیرنده، ساعت، تکرار) همان لحظه اجرا می‌شوند.',onOk:()=>{P.toast('در نمونه ذخیره نمی‌شود')}});
})();
