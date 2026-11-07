/* Rayo Panel prototype — انبار روی دادهٔ واقعی (مرحلهٔ ۱: فقط خواندنی)
   When real data is connected (live on rayocafe.ir, ?data=, or JSON files in «داشبورد کنترل»), the inventory tabs show
   the real records through the shared engine (../js/inventory-engine.js); otherwise they keep the sample data with a hint.
   Nothing is saved here: entry forms come in the next step. */
(function(){
'use strict';
const IC=window.InvControl,E=window.InvEngine,inv=P.mods.inventory;
const M=()=>IC.state.M,esc=P.esc,fa=P.fa;
const q=(v,d=2)=>v===null||v===undefined||!Number.isFinite(v)?'—':fa(Number(v.toFixed(d)).toLocaleString('en'));
const T=v=>v===null||v===undefined||!Number.isFinite(v)?'—':RT.money(v);
let posCache={key:'',rows:null};
const pos=()=>{const k=E.CAL.today+'|'+(IC.state.raw?.inventory?.meta?.updatedAt||'');if(posCache.key!==k)posCache={key:k,rows:E.positions(M(),E.CAL.today)};return posCache.rows};
const lastSaleDay=()=>{const m=M();let mx=null;for(const s of m.sales)if(mx===null||s.b>mx)mx=s.b;return mx};
const srcLine=()=>`<div class="row" style="gap:8px;margin-bottom:var(--s3);flex-wrap:wrap">${P.b(IC.source()==='live'?'دادهٔ زنده':'دادهٔ واقعی از فایل',IC.source()==='live'?'success':'info')}${P.b('فقط خواندنی','neutral')}<span class="muted" style="font-size:12px">آخرین تغییر انبار: ${esc(String(IC.state.raw?.inventory?.meta?.updatedAt||'').slice(0,16).replace('T',' '))} · ثبت از این صفحه در مرحلهٔ بعد</span></div>`;
const salesGap=()=>{const l=lastSaleDay(),today=E.CAL.i(E.CAL.today);if(l===null)return P.note('<b>هیچ فروشی ثبت نشده است.</b> مصرف رسپی از موجودی کم نمی‌شود.','alert-triangle');const gap=today-l;return gap>2?P.note(`<b>فروش از ${fa(E.CAL.k(l+1))} تا امروز (${fa(gap)} روز) ثبت نشده است.</b> موجودی اقلامی که در این مدت فروش رفته‌اند بیش از واقعیت نشان داده می‌شود؛ فایل فروش این روزها را در «فروش» وارد کنید.`,'alert-triangle'):''};
const FL={negative:['منفی','danger'],noCount:['بدون شمارش','warning'],unapproved:['شمارش تأییدنشده','warning'],countUnit:['واحد شمارش متفاوت','warning']};
const flags=r=>[...r.flags].map(f=>FL[f]?P.b(...FL[f]):'').join(' ');

/* ---------- stock ---------- */
let sQ='',sCat='',sOnly='';
function stockReal(){const rows=pos(),cats=[...new Set(rows.map(r=>r.category).filter(Boolean))].sort(),val=rows.reduce((a,r)=>a+(r.value||0),0);
 return srcLine()+salesGap()+`<div class="grid grid-4">${P.kpi({label:'ارزش موجودی محاسباتی',icon:'boxes',value:RT.money(val),unit:'تومان',foot:`${fa(rows.filter(r=>r.qty!==null).length)} قلم دارای موجودی محاسبه‌شده`})}${P.kpi({label:'موجودی منفی',icon:'trending-down',value:fa(rows.filter(r=>r.flags.has('negative')).length),foot:'ورود ثبت‌نشده، رسپی بیش از واقع یا شمارش ناقص',tone:'danger'})}${P.kpi({label:'هرگز شمرده نشده',icon:'circle-dashed',value:fa(rows.filter(r=>r.flags.has('noCount')).length),tone:'warning'})}${P.kpi({label:'نیازمند سفارش',icon:'refresh-cw',value:fa(rows.filter(r=>r.needOrder).length),foot:'زیر نقطهٔ سفارش'})}</div>
 ${P.card({title:'موجودی اقلام — امروز',sub:'آخرین شمارش هر قلم + ورود − مصرف رسپی فروش − پرتی و مصرف مجاز بعد از آن',flush:1,
  actions:`<input class="input" id="rsQ" placeholder="جستجو" value="${esc(sQ)}" style="width:180px"><select class="select" id="rsCat" style="width:auto"><option value="">همهٔ گروه‌ها</option>${cats.map(c=>`<option ${c===sCat?'selected':''}>${esc(c)}</option>`).join('')}</select><select class="select" id="rsOnly" style="width:auto">${[['','همه'],['flag','دارای هشدار'],['order','نیازمند سفارش'],['neg','منفی']].map(([v,l])=>`<option value="${v}" ${v===sOnly?'selected':''}>${l}</option>`).join('')}</select>`,
  body:'<div id="rsTable"></div>'})}`}
function stockTable(root){const rows=pos().filter(r=>(!sQ||`${r.name} ${r.code}`.toLowerCase().includes(sQ.toLowerCase()))&&(!sCat||r.category===sCat)&&(sOnly!=='flag'||r.flags.size)&&(sOnly!=='order'||r.needOrder)&&(sOnly!=='neg'||r.flags.has('negative'))).sort((a,b)=>(b.value||0)-(a.value||0));
 P.$('#rsTable',root).innerHTML=P.table(['کالا',{t:'موجودی',n:1},'واحد','آخرین شمارش',{t:'ورود بعد از آن',n:1},{t:'مصرف فروش',n:1},{t:'پرتی و مجاز',n:1},{t:'ارزش',n:1},{t:'نقطهٔ سفارش',n:1},'وضعیت'],
  rows.slice(0,300).map(r=>({attr:`data-rs="${esc(r.id)}" style="cursor:pointer"`,c:[P.cellMain(esc(r.name),`${esc(r.code)} · ${esc(r.category)}`),`<b class="${r.qty<0?'neg':''}">${q(r.qty)}</b>`,esc(r.unit),r.basePt?`${fa(r.basePt.date)} <small class="muted">${r.basePt.boundary==='END'?'شب':'صبح'}</small>`:'—',q(r.receipt),q(r.sales),q(r.waste+r.auth),T(r.value),r.reorderPoint?q(r.reorderPoint):'—',flags(r)+(r.needOrder?' '+P.b('سفارش','info'):'')]})),{empty:'موردی نیست'})+(rows.length>300?`<p class="muted" style="padding:8px">۳۰۰ ردیف اول از ${fa(rows.length)}</p>`:'');RT.icons()}
function stockMount(root){const up=()=>stockTable(root);P.$('#rsQ',root).oninput=e=>{sQ=e.target.value;up()};P.$('#rsCat',root).onchange=e=>{sCat=e.target.value;up()};P.$('#rsOnly',root).onchange=e=>{sOnly=e.target.value;up()};up();
 P.$('#rsTable',root).onclick=e=>{const tr=e.target.closest('[data-rs]');if(tr)ledger(tr.dataset.rs)}}
function ledger(id){const m=M(),r=pos().find(x=>x.id===id);if(!r)return;const from=r.basePt?r.basePt.at:-Infinity,ev=[...m.receipts.filter(x=>x.item===id&&x.day>=from).map(x=>[x.date,'ورود به انبار','+'+q(x.qty,3),esc(x.note||x.by)]),...m.wastes.filter(x=>x.item===id&&x.day>=from).map(x=>[x.date,x.auth?(E.RESP_LABEL.staff):'پرتی','−'+q(x.qty,3),esc(x.reason)])].sort((a,b)=>a[0].localeCompare(b[0]));
 P.modal({title:esc(r.name),size:'wide',body:`${flags(r)}<div class="sum-box mt"><span>موجودی محاسباتی امروز</span><b>${q(r.qty,3)} ${esc(r.unit)}</b></div>${P.table(['تاریخ','رویداد',{t:'مقدار',n:1},'توضیح'],[r.basePt?[fa(r.basePt.date),'آخرین شمارش',q(r.base,3),[...r.basePt.statuses].join('، ')]:['—','بدون شمارش','۰',''],...ev.map(x=>[fa(x[0]),x[1],x[2],x[3]]),['تا امروز','مصرف رسپی فروش','−'+q(r.sales,3),'سهم روزهای بعد از شمارش']])}`})}

/* ---------- receipts / waste / reorder / catalog ---------- */
const DAYS60=()=>E.CAL.i(E.CAL.today)-60;
function receiptReal(){const m=M(),rows=m.receipts.filter(x=>x.day>=DAYS60()).sort((a,b)=>b.day-a.day),c=x=>m.costAt(x.item,x.date);
 return srcLine()+`<div class="grid grid-4">${P.kpi({label:'ورود ۶۰ روز اخیر',icon:'package-plus',value:fa(rows.length),unit:'ثبت'})}${P.kpi({label:'ارزش تقریبی',icon:'banknote',value:RT.money(rows.reduce((a,x)=>a+(c(x)||0)*x.qty,0)),unit:'تومان',foot:'با آخرین قیمت خرید هر قلم'})}${P.kpi({label:'بدون قیمت در رسید',icon:'badge-dollar-sign',value:fa(rows.filter(x=>!Number(x.raw?.totalPriceToman)&&!Number(x.raw?.unitCostToman)).length)})}${P.kpi({label:'واحد متفاوت با قلم',icon:'ruler',value:fa(rows.filter(x=>x.unit&&E.UK(x.unit)!==E.UK(m.ing.get(x.item)?.recipeUnit)).length),tone:'warning'})}</div>
 ${P.card({title:'ورودهای ۶۰ روز اخیر',flush:1,body:P.table(['تاریخ','کالا',{t:'مقدار',n:1},'واحد',{t:'ارزش',n:1},'ثبت‌کننده','توضیح'],rows.slice(0,300).map(x=>{const i=m.ing.get(x.item),bad=x.unit&&E.UK(x.unit)!==E.UK(i?.recipeUnit);return[fa(x.date),esc(i?.name||x.item),q(x.qty,3),`${esc(i?.recipeUnit||'')}${bad?' '+P.b('ثبت با '+esc(x.unit),'warning'):''}`,T((c(x)||0)*x.qty),esc(x.by),esc(x.note)]}))})}`}
function wasteReal(){const m=M(),rows=m.wastes.filter(x=>x.day>=DAYS60()).sort((a,b)=>b.day-a.day),val=x=>(m.costAt(x.item,x.date)||0)*x.qty;
 return srcLine()+`<div class="grid grid-4">${P.kpi({label:'پرتی ۶۰ روز اخیر',icon:'trash-2',value:RT.money(rows.filter(x=>!x.auth).reduce((a,x)=>a+val(x),0)),unit:'تومان',foot:`${fa(rows.filter(x=>!x.auth).length)} ثبت`})}${P.kpi({label:'مصرف مجاز',icon:'utensils',value:RT.money(rows.filter(x=>x.auth).reduce((a,x)=>a+val(x),0)),unit:'تومان',foot:'پرسنل، تعویض روغن، سر میز'})}${P.kpi({label:'مشکوک به خطای واحد',icon:'scale',value:fa(rows.filter(x=>!x.auth&&/^(kg|l)$/.test(E.UK(m.ing.get(x.item)?.recipeUnit))&&x.qty>=20).length),tone:'danger',foot:'اصلاح دسته‌ای در پنل فعلی: گزارش‌ها ← پرتی'})}${P.kpi({label:'روند و مسئولیت',icon:'chart-column',value:'گزارش‌ها',foot:'انبار ← گزارش‌ها ← پرتی و ضایعات'})}</div>
 ${P.card({title:'ثبت‌های پرتی و مصرف مجاز — ۶۰ روز اخیر',flush:1,body:P.table(['تاریخ','کالا',{t:'مقدار',n:1},'واحد','نوع','علت',{t:'ارزش',n:1},'ثبت‌کننده'],rows.slice(0,300).map(x=>{const i=m.ing.get(x.item);return[fa(x.date),esc(i?.name||x.item)+(x.fromMenu?`<small class="muted" style="display:block">از ${esc(x.fromMenu)}</small>`:''),q(x.qty,3),esc(i?.recipeUnit||''),x.auth?P.b(x.eventType==='FRYER_OIL_CHANGE'?'تعویض روغن':x.eventType==='TABLE_SERVICE'?'سر میز':'مصرف مجاز','info'):P.b(E.RESP_LABEL[E.responsibility(x)],E.responsibility(x)==='negligence'?'danger':'warning'),`<span class="wrap">${esc(x.reason)}</span>`,T(val(x)),esc(x.by)]}))})}`}
function reorderReal(){const rows=pos().filter(r=>r.reorderPoint>0).sort((a,b)=>(a.qty??0)/a.reorderPoint-(b.qty??0)/b.reorderPoint),sup=id=>{const s=A(IC.state.raw?.suppliers?.suppliers).find(x=>x.id===id);return s?.company||s?.name||''};
 return srcLine()+salesGap()+P.card({title:'اقلام دارای نقطهٔ سفارش',sub:'موجودی محاسباتی امروز در برابر نقطهٔ سفارش و موجودی هدف',flush:1,body:P.table(['کالا',{t:'موجودی',n:1},{t:'نقطهٔ سفارش',n:1},{t:'هدف',n:1},{t:'پیشنهاد سفارش',n:1},'وضعیت'],rows.map(r=>[esc(r.name),q(r.qty),q(r.reorderPoint),q(r.target),r.needOrder?`<b>${q(Math.max(0,r.target-(r.qty||0)))} ${esc(r.unit)}</b>`:'—',r.needOrder?P.b('نیازمند سفارش','danger'):P.b('کافی','success')]),{empty:'برای هیچ قلمی نقطهٔ سفارش تعریف نشده است'})})+P.note(`فقط ${fa(rows.length)} قلم نقطهٔ سفارش دارند. پیشنهاد: برای اقلام پرمصرف نقطهٔ سفارش را در «تنظیمات انبار» تعریف کنید.`,'info')}
const A=x=>Array.isArray(x)?x:[];
function catalogReal(){const m=M(),rows=[...m.ing.values()].sort((a,b)=>String(a.name).localeCompare(String(b.name),'fa'));
 return srcLine()+P.card({title:'کاتالوگ کالاها و مواد',sub:'مرجع اصلی (pricing.ingredients)',flush:1,body:P.table(['کد','نام','گروه','نوع','واحد مصرف','واحد خرید',{t:'مقدار بسته',n:1},{t:'آخرین قیمت خرید',n:1},'وضعیت'],rows.slice(0,700).map(i=>[esc(i.code),esc(i.name),esc(i.category),esc(i.itemType||''),esc(i.recipeUnit),esc(i.purchaseUnit),q(Number(i.packageQuantity),3),Number(i.lastPurchasePriceToman)>1?P.t(Number(i.lastPurchasePriceToman)):P.b('بدون قیمت','warning'),i.status==='غیرفعال'?P.b('غیرفعال','neutral'):P.b('فعال','success')]))})}

/* ---------- wiring: real view when connected, sample + hint otherwise ---------- */
const hint=()=>P.note(`این صفحه <b>دادهٔ نمونه</b> است. برای دیدن دادهٔ واقعی، در «داشبورد کنترل» به دادهٔ انبار وصل شوید. <a href="#/inventory/control">اتصال</a>`,'database');
const viaIC=view=>({render:()=>srcLine()+'<div id="rvHost"></div>',mount:root=>IC.render(view,P.$('#rvHost',root),v=>P.go('#/inventory/reports'))});
const REAL={stock:{render:stockReal,mount:stockMount},receipt:{render:receiptReal},waste:{render:wasteReal},count:viaIC('counts'),beverage:viaIC('bev'),reorder:{render:reorderReal},sales:viaIC('sales'),consumption:viaIC('oil'),catalog:{render:catalogReal}};
for(const [id,v] of Object.entries(REAL)){const t=inv.tabs.find(x=>x.id===id);if(!t)continue;const r0=t.render,m0=t.mount,a0=t.actions;
 t.render=r=>IC.ready()?v.render(r):hint()+r0(r);
 t.mount=(root,r)=>{if(IC.ready()){v.mount&&v.mount(root,r)}else m0&&m0(root,r)};
 if(a0)t.actions=r=>IC.ready()?`<button class="btn btn-secondary" disabled title="ثبت روی دادهٔ واقعی در مرحلهٔ بعد">${P.ic('lock')}ثبت — مرحلهٔ بعد</button>`:a0(r);}
/* stock tab badge = items needing order (real) */
const ro=inv.tabs.find(x=>x.id==='reorder');if(ro){const b0=ro.badge;ro.badge=()=>IC.ready()?pos().filter(r=>r.needOrder).length:(b0?b0():0)}
const st=inv.tabs.find(x=>x.id==='stock');if(st)st.badge=()=>IC.ready()?pos().filter(r=>r.needOrder).length:0;
inv.badge=()=>IC.ready()?pos().filter(r=>r.flags.has('negative')).length:D.ITEMS.filter(i=>i.qty<i.min).length;
})();
