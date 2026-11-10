/* Rayo Panel prototype — مالی روی دادهٔ واقعی (مرحلهٔ ۵: فقط خواندنی)
   What Rayo records today, shown with the same connection as inventory:
   - «صندوق و بانک»: cashreport.reports (one report per cashier and day; amounts in rial, shown in toman). Sales and variance
     follow the current panel (config.js RayoCashVariance): sales = net receivable − tax + debtor − delivery fee + Snapp;
     the stored final variance is (POS + card-to-card + cash) − (net receivable + tips in this cashbox) + adjustments.
   - «طرف حساب‌ها»: suppliers.suppliers (loaded here: live API, or suppliers.json next to ?data=). Bank details are masked.
   - «خلاصه»: the two above. Purchase invoices, supplier payments and finance entries are empty in the live data, so the
     invoice / payment / report tabs stay on sample data with a note. Nothing is saved here. */
(function(){
'use strict';
const IC=window.InvControl,E=window.InvEngine,fin=P.mods.finance;
const esc=P.esc,fa=P.fa,A=x=>Array.isArray(x)?x:[],N=v=>{const n=Number(v);return Number.isFinite(n)?n:0};
const R2T=v=>N(v)/10;
const T=v=>P.mt(R2T(v));
const signed=v=>{const t=Math.round(R2T(v));return`<span class="${t<0?'down':t>0?'up':''}">${t>0?'+':''}${P.mt(t)}</span>`};
const CR=()=>IC.state.raw?.cashreport||null;
const reports=()=>A(CR()?.reports).filter(r=>r.status!=='void'&&E.D(r.date));
const limit=()=>N(CR()?.settings?.discrepancyLimit)||1000000;
function sales(r){const net=N(r.netReceivable),tax=N(r.taxAmount),debt=N(r.debtorAmount),fee=N(r.deliveryFeeAmount),snapp=N(r.snappAmount),salesNet=net-tax+debt-fee;return{salesNet,snapp,total:salesNet+snapp}}
const mask=v=>{const s=String(v||'').replace(/\D/g,'');return s?'•••• '+fa(s.slice(-4)):''};
const srcLine=()=>`<div class="row" style="gap:8px;margin-bottom:var(--s3);flex-wrap:wrap">${P.b(IC.source()==='live'?'دادهٔ زنده':'دادهٔ واقعی از فایل',IC.source()==='live'?'success':'info')}${window.InvEntry?.live?.()&&(window.InvEntry.allowed('financeLedger')||window.InvEntry.allowed('purchase'))?'':P.b('فقط خواندنی','neutral')}<span class="muted" style="font-size:12px">مبالغ به ${P.unitName()}</span></div>`;

/* ---------- suppliers (separate module) ---------- */
const sup={doc:null,busy:false,err:''};
async function loadSuppliers(){if(sup.busy||sup.doc)return;sup.busy=true;try{const q=new URLSearchParams(location.search).get('data');let r;
 if(IC.source()==='live')r=await fetch(E.API_ROOT+'Load?module=suppliers&_='+Date.now(),{cache:'no-store',credentials:'omit'});else if(q)r=await fetch(q+'suppliers.json',{cache:'no-store'});else throw Error('فایل تأمین‌کنندگان وصل نیست؛ با اتصال زنده یا ?data= (کنار suppliers.json) خوانده می‌شود');
 if(!r.ok)throw Error('HTTP '+r.status);sup.doc=E.unwrap(await r.json());sup.err=''}catch(e){sup.err=e.message||String(e)}finally{sup.busy=false;P.render()}}

/* ---------- months ---------- */
const monthsOf=()=>[...new Set(reports().map(r=>E.D(r.date).slice(0,7)))].sort();
let month='';
const curMonth=()=>{const ms=monthsOf();if(!ms.includes(month))month=ms.at(-1)||'';return month};
function monthStats(k){const rs=reports().filter(r=>E.D(r.date).startsWith(k)),days=new Set(rs.map(r=>E.D(r.date))),range=E.monthRange(k),last=E.CAL.i(range.to)<E.CAL.i(E.CAL.today)?E.CAL.i(range.to):E.CAL.i(E.CAL.today),first=E.CAL.i(range.from),missing=[];for(let i=first;i<=last;i++){const d=E.CAL.k(i);if(!days.has(d))missing.push(d)}
 const sum=f=>rs.reduce((a,r)=>a+f(r),0);return{rs,days:days.size,missing,sales:sum(r=>sales(r).total),snapp:sum(r=>N(r.snappAmount)),pos:sum(r=>N(r.posTotal)),card:sum(r=>N(r.cardToCard)),cash:sum(r=>N(r.cash)),tips:sum(r=>N(r.tipsTotal)),short:sum(r=>Math.min(0,N(r.finalVariance))),over:sum(r=>Math.max(0,N(r.finalVariance))),flagged:rs.filter(r=>Math.abs(N(r.finalVariance))>limit()),unreviewed:rs.filter(r=>!r.managerReview||r.managerReview==='بررسی نشده').length}}
const monthSel=id=>`<select class="select" id="${id}" style="width:auto">${monthsOf().slice().reverse().map(k=>`<option value="${k}" ${k===curMonth()?'selected':''}>${E.monthLabel(k)}</option>`).join('')}</select>`;

/* ---------- cash & bank ---------- */
function cashReal(){if(!CR())return srcLine()+P.note('گزارش صندوق در دادهٔ وصل‌شده نیست.','info');const k=curMonth();if(!k)return srcLine()+P.note('هنوز گزارش صندوقی ثبت نشده است.','info');const s=monthStats(k);
 return srcLine()+`<div class="grid grid-4">${P.kpi({label:'فروش '+E.monthLabel(k),icon:'receipt',value:P.mShort(R2T(s.sales)),unit:P.unitName(),foot:`${fa(s.days)} روز با گزارش · اسنپ ${P.mShort(R2T(s.snapp))}`})}${P.kpi({label:'کسری صندوق',icon:'trending-down',value:P.mShort(-R2T(s.short)),unit:P.unitName(),tone:'danger',foot:`اضافه ${P.mShort(R2T(s.over))} · ${fa(s.flagged.length)} گزارش بیش از حد مجاز (${P.t(R2T(limit()))})`})}${P.kpi({label:'روز بدون گزارش',icon:'calendar-x',value:fa(s.missing.length),tone:s.missing.length?'warning':'',foot:s.missing.slice(0,4).map(fa).join('، ')+(s.missing.length>4?' …':'')})}${P.kpi({label:'انعام',icon:'heart-handshake',value:P.mShort(R2T(s.tips)),unit:P.unitName(),foot:`${fa(s.unreviewed)} گزارش بررسی‌نشده`})}</div>
 <div class="grid grid-3 mt"><div class="span-2">${P.card({title:'فروش و مغایرت روزانه',actions:monthSel('frMonth'),body:'<div class="chart" id="frChart"></div>'})}</div>${P.card({title:'ترکیب دریافت',flush:1,body:P.table(['روش',{t:'مبلغ',n:1},{t:'سهم',n:1}],[['کارتخوان‌ها',s.pos],['کارت به کارت',s.card],['نقد',s.cash]].map(([l,v])=>[l,T(v),RT.pct(s.pos+s.card+s.cash?v/(s.pos+s.card+s.cash)*100:0)]),{foot:['جمع دریافت',T(s.pos+s.card+s.cash),'']})})}</div>
 <div class="mt">${P.card({title:'گزارش‌های صندوق — '+E.monthLabel(k),sub:'مغایرت = (کارتخوان + کارت به کارت + نقد) − (خالص دریافتی + انعام داخل صندوق) + اصلاحات؛ منفی یعنی کسری',flush:1,body:P.table(['تاریخ','صندوقدار',{t:'فروش',n:1},{t:'کارتخوان',n:1},{t:'کارت به کارت',n:1},{t:'نقد',n:1},{t:'اسنپ',n:1},{t:'انعام',n:1},{t:'مغایرت',n:1},'بررسی مدیر'],s.rs.slice().sort((a,b)=>E.D(b.date).localeCompare(E.D(a.date))).map(r=>{const v=N(r.finalVariance),bad=Math.abs(v)>limit();return[fa(E.D(r.date)),esc(r.cashierName||''),T(sales(r).total),T(r.posTotal),T(r.cardToCard),T(r.cash),T(r.snappAmount),T(r.tipsTotal),signed(v)+(bad?' '+P.b('بیش از حد مجاز','danger'):''),r.managerReview&&r.managerReview!=='بررسی نشده'?P.b(esc(r.managerReview),'success',1):P.b('بررسی نشده','warning')]}),{empty:'گزارشی نیست'})})}</div>
 ${P.note('حساب‌های بانکی و ماندهٔ آن‌ها در دادهٔ رایو ثبت نمی‌شوند؛ فقط حساب مقصد کارت به کارت در هر گزارش هست. بررسی و قفل گزارش‌ها فعلاً در «گزارش صندوق» پنل فعلی است.','info')}`}
function cashMount(root){const sel=P.$('#frMonth',root);if(sel)sel.onchange=e=>{month=e.target.value;P.render()};const k=curMonth();if(!k||!P.$('#frChart',root))return;const byDay=new Map;for(const r of reports().filter(r=>E.D(r.date).startsWith(k))){const d=E.D(r.date),o=byDay.get(d)||{s:0,v:0};o.s+=sales(r).total;o.v+=N(r.finalVariance);byDay.set(d,o)}const days=[...byDay.keys()].sort();
 RT.chart('frChart',t=>Object.assign(RT.base(t),{grid:{left:12,right:12,top:28,bottom:8,containLabel:true},legend:{top:0,textStyle:{color:t.text2,fontFamily:t.font}},xAxis:RT.axis(t,{type:'category',data:days.map(d=>fa(d.slice(8)))}),yAxis:[RT.axis(t,{type:'value',axisLabel:{color:t.text3,fontFamily:t.font,formatter:v=>RT.short(v)}}),RT.axis(t,{type:'value',splitLine:{show:false},axisLabel:{color:t.text3,fontFamily:t.font,formatter:v=>RT.short(v)}})],
  tooltip:Object.assign(RT.base(t).tooltip,{trigger:'axis'}),series:[{name:'فروش (تومان)',type:'bar',data:days.map(d=>Math.round(R2T(byDay.get(d).s))),itemStyle:{color:t.accent,borderRadius:[4,4,0,0]}},{name:'مغایرت (تومان)',type:'line',yAxisIndex:1,data:days.map(d=>Math.round(R2T(byDay.get(d).v))),itemStyle:{color:t.danger},lineStyle:{color:t.danger}}]}))}

/* ---------- parties (suppliers) ---------- */
let pQ='';
function partiesReal(){if(!sup.doc&&!sup.err){loadSuppliers();return srcLine()+P.note('در حال خواندن تأمین‌کنندگان…','loader')}if(sup.err)return srcLine()+P.note('تأمین‌کنندگان خوانده نشد: '+esc(sup.err),'alert-triangle');
 const list=A(sup.doc.suppliers),groups=[...new Set(list.map(s=>s.mainGroup).filter(Boolean))];
 return srcLine()+`<div class="grid grid-4">${P.kpi({label:'تأمین‌کننده',icon:'truck',value:fa(list.length),foot:`${fa(list.filter(s=>s.status!=='غیرفعال').length)} فعال`})}${P.kpi({label:'گروه خرید',icon:'layers',value:fa(groups.length)})}${P.kpi({label:'بدون شمارهٔ تماس',icon:'phone-off',value:fa(list.filter(s=>!s.mobile&&!s.phone).length),tone:'warning'})}${(()=>{const has=A(IC.state.raw?.inventory?.purchaseInvoices).length||A(IC.state.raw?.inventory?.supplierDirectDebts).length,tot=list.reduce((a,s)=>a+Math.max(0,window.PurchaseReal?.balance(s.id)?.balance||0),0);return has?P.kpi({label:'بدهی به تأمین‌کنندگان',icon:'scale',value:RT.money(tot),unit:P.unitName(),foot:'فاکتور نهایی − پرداخت‌ها'}):P.kpi({label:'مانده و بدهی',icon:'scale',value:'ثبت نشده',foot:'هنوز فاکتور خریدی ثبت نشده'})})()}</div>
 <div class="mt">${P.card({flush:1,title:'تأمین‌کنندگان',sub:'از ماژول تأمین‌کنندگان؛ شمارهٔ حساب و کارت فقط با ۴ رقم آخر نمایش داده می‌شود',actions:`<label class="search">${P.ic('search')}<input id="frQ" placeholder="نام، شخص یا گروه" value="${esc(pQ)}"></label>`,body:'<div id="frParties"></div>'})}</div>
 ${A(IC.state.raw?.inventory?.purchaseInvoices).length||A(IC.state.raw?.inventory?.supplierDirectDebts).length?P.note('مانده = ماندهٔ افتتاحیه (اگر ثبت شده) + فاکتورهای نهایی و بدهی‌های مستقیم بعد از آن − پرداخت‌ها، همان قاعدهٔ پنل فعلی. برای بدهی‌های پیش از شروع ثبت فاکتورها، روی تأمین‌کننده بزنید و «ماندهٔ افتتاحیه» را ثبت کنید.','info'):P.note('<b>مانده هیچ طرف حسابی معلوم نیست:</b> هنوز هیچ فاکتور خرید یا پرداختی ثبت نشده است. از «فاکتورها و بدهی‌ها» فاکتور ثبت کنید.','alert-triangle')}`}
function partiesTable(root){const list=A(sup.doc?.suppliers).filter(s=>!pQ||P.match(`${s.company} ${s.contactName} ${s.mainGroup} ${s.code} ${s.mobile}`,pQ)).sort((a,b)=>(a.status==='غیرفعال')-(b.status==='غیرفعال')||String(a.company||a.contactName).localeCompare(String(b.company||b.contactName),'fa'));
 P.$('#frParties',root).innerHTML=P.table(['تأمین‌کننده','گروه','تماس','روش سفارش','تسویه',{t:'حداقل سفارش',n:1},'کیفیت / قیمت / به‌موقع','حساب',{t:'مانده',n:1},'وضعیت'],list.map(s=>({cls:'click',attr:`data-sup="${esc(s.id)}"`,c:[P.cellMain(esc(s.company||s.contactName||'—'),esc([s.code,s.contactName].filter(Boolean).join(' · '))),esc(s.mainGroup||''),esc(s.mobile||s.phone||'—'),esc(s.orderMethod||''),esc([s.settlementMethod,N(s.settlementDays)?fa(s.settlementDays)+' روز':''].filter(Boolean).join(' · ')),N(s.minimumOrderToman)?P.t(N(s.minimumOrderToman)):'—',[s.qualityRating,s.priceRating,s.punctualityRating].map(x=>x?fa(x):'—').join(' / '),esc([s.bankName,mask(s.cardNumber||s.accountNumber||s.iban)].filter(Boolean).join(' ')),(()=>{const a=window.PurchaseReal?.balance(s.id);return a&&(a.invoices.length||a.payments.length||a.debts.length||a.opening)?`<b class="${a.balance>0.5?'down':''}">${P.t(Math.round(a.balance))}</b>`:'—'})(),s.status==='غیرفعال'?P.b('غیرفعال','neutral'):P.b('فعال','success',1)]})),{empty:'موردی نیست'});RT.icons()}
function supplierModal(id){const s=A(sup.doc?.suppliers).find(x=>x.id===id);if(!s)return;const row=(l,v)=>v&&v!=='undefined'?`<tr><td class="muted">${l}</td><td>${v}</td></tr>`:'';
 P.modal({title:esc(s.company||s.contactName||'تأمین‌کننده'),body:`<div class="table-wrap"><table class="table"><tbody>${row('کد',esc(s.code))}${row('گروه اصلی',esc(s.mainGroup))}${row('شخص رابط',esc(s.contactName))}${row('موبایل / تلفن',esc([s.mobile,s.phone].filter(Boolean).join(' · ')))}${row('کانال ترجیحی',esc(s.preferredChannel))}${row('روش و مسئول سفارش',esc([s.orderMethod,s.orderOwner].filter(Boolean).join(' · ')))}${row('روزهای سفارش / تحویل',esc([s.orderDays,s.deliveryDays].filter(Boolean).join(' / ')))}${row('نوع فاکتور',esc(s.invoiceType))}${row('تسویه',esc([s.settlementMethod,N(s.settlementDays)?fa(s.settlementDays)+' روز':''].filter(Boolean).join(' · ')))}${row('بانک',esc([s.bankName,mask(s.cardNumber),mask(s.iban)].filter(Boolean).join(' · ')))}${row('اقلام خرید',esc(s.purchaseItemsSummary||s.purchaseGroupsSummary))}${row('شرایط تحویل',esc(s.deliveryTerms))}${row('توضیح',esc(s.notes))}${row('آخرین بازبینی',esc(s.lastReviewDate))}</tbody></table></div>${P.note('شمارهٔ کامل حساب و کارت در پنل فعلی (تأمین‌کنندگان) دیده می‌شود.','lock')}${window.PurchaseReal?.accountHtml?window.PurchaseReal.accountHtml(id):''}`,
  foot:window.CatalogReal?.supplierFoot?.(id)||undefined,onMount:m=>window.PurchaseReal?.bindAccount?.(m,id)})}
function partiesMount(root){if(!P.$('#frParties',root))return;partiesTable(root);P.$('#frQ',root).oninput=e=>{pQ=e.target.value;partiesTable(root)};P.$('#frParties',root).onclick=e=>{const tr=e.target.closest('[data-sup]');if(tr)supplierModal(tr.dataset.sup)}}

/* ---------- overview ---------- */
function overviewReal(){const ms=monthsOf(),inv=IC.state.raw?.inventory||{},count=k=>A(inv[k]).length;
 const rows=ms.slice(-6).map(k=>{const s=monthStats(k);return[E.monthLabel(k),fa(s.days),T(s.sales),T(s.snapp),signed(s.short+s.over),fa(s.flagged.length)]});
 return srcLine()+P.card({title:'آنچه در دادهٔ رایو برای مالی ثبت شده است',flush:1,body:P.table(['داده',{t:'تعداد',n:1},'وضعیت'],[['گزارش صندوق روزانه',fa(reports().length),reports().length?P.b('دارد','success'):P.b('ندارد','danger')],['تأمین‌کننده',sup.doc?fa(A(sup.doc.suppliers).length):'…',P.b('دارد','success')],['فاکتور خرید',fa(count('purchaseInvoices')),count('purchaseInvoices')?P.b('دارد','success'):P.b('ثبت نشده','danger')],['پرداخت به تأمین‌کننده',fa(count('supplierPayments')),count('supplierPayments')?P.b('دارد','success'):P.b('ثبت نشده','danger')],['ورود انبار با قیمت',fa(A(inv.stockReceipts).filter(r=>N(r.totalPriceToman)>0||N(r.unitCostToman)>0).length)+' از '+fa(count('stockReceipts')),P.b('بیشتر بدون قیمت','warning')]])})
 +`<div class="mt">${P.card({title:'فروش و صندوق به تفکیک ماه',sub:'از گزارش‌های صندوق',flush:1,body:P.table(['ماه',{t:'روز با گزارش',n:1},{t:'فروش',n:1},{t:'اسنپ',n:1},{t:'مغایرت خالص',n:1},{t:'گزارش بیش از حد مجاز',n:1}],rows,{empty:'گزارشی نیست'})})}</div>
 ${P.note('<b>سود و زیان، بدهی و نقدینگی هنوز از داده قابل محاسبه نیستند</b>، چون خرید، هزینه و پرداخت ثبت نمی‌شوند. تب‌های «فاکتورها و بدهی‌ها»، «پرداخت و دریافت» و «گزارش مالی» تا ثبت این‌ها نمونه می‌مانند.','info')}`}
function overviewMount(){if(!sup.doc&&!sup.err)loadSuppliers()}

/* ---------- wiring ---------- */
const hint=()=>P.note(`این صفحه <b>دادهٔ نمونه</b> است. برای دیدن دادهٔ واقعی، در «انبار ← داشبورد کنترل» به داده وصل شوید. <a href="#/inventory/control">اتصال</a>`,'database');
const empty=what=>P.note(`<b>${what}</b> هنوز در پنل جدید نیست.`,'info');
// «فاکتورها و بدهی‌ها» on real data: purchase-real.js (stage 6); suppliers are loaded here so its forms can list them
const PD=window.PurchaseReal?.docs;
const REAL={overview:{render:overviewReal,mount:overviewMount},cash:{render:cashReal,mount:cashMount},parties:{render:partiesReal,mount:partiesMount},
 docs:PD?{render:()=>{if(!sup.doc&&!sup.err)loadSuppliers();return PD.render()},mount:PD.mount,actions:PD.actions}:{empty:'فاکتور و بدهی'},
 payments:window.PurchaseReal?.payments?{render:()=>{if(!sup.doc&&!sup.err)loadSuppliers();return window.PurchaseReal.payments.render()},mount:window.PurchaseReal.payments.mount,actions:window.PurchaseReal.payments.actions}:{empty:'پرداخت و دریافت'},reports:{empty:'سند هزینه و خرید'}};
for(const [id,v] of Object.entries(REAL)){const t=fin.tabs.find(x=>x.id===id);if(!t)continue;const r0=t.render,m0=t.mount,a0=t.actions;
 t.render=r=>IC.ready()?(v.render?v.render(r):empty(v.empty)):hint()+r0(r);
 t.mount=(root,r)=>{if(IC.ready()&&v.render){v.mount&&v.mount(root,r)}else m0&&m0(root,r)};
 if(a0&&v.render)t.actions=r=>IC.ready()?(v.actions?v.actions():''):a0(r);}
window.FinanceReal={monthStats,sales,mask,suppliers:()=>sup.doc,loadSuppliers,supState:sup,setSuppliers:d=>{sup.doc=d;sup.err=''}};
})();
