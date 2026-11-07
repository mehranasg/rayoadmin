/* Rayo Panel prototype — منو، رسپی و قیمت‌گذاری روی دادهٔ واقعی (مرحلهٔ ۳: فقط خواندنی)
   When real data is connected (same connection as inventory: live on rayocafe.ir, ?data=, or JSON files), the menu tabs
   show pricing.menuItems / recipeVersions / settings. Cost and suggested price follow the current panel (js/45 menuMetrics):
   unit cost = last purchase price ÷ package quantity ÷ (1 − ingredient loss %), recipe of today's version, manual cost only
   when the item has no recipe lines, target = item target → category target → 35٪, suggested = ⌈cost ÷ target⌉ to the price step.
   Sales quantities come from inventory.salesPeriods. Nothing is saved here. */
(function(){
'use strict';
const IC=window.InvControl,E=window.InvEngine,mod=P.mods.menu;
const esc=P.esc,fa=P.fa,A=x=>Array.isArray(x)?x:[],Nn=v=>{const n=Number(v);return Number.isFinite(n)?n:0};
const PR=()=>IC.state.raw.pricing,M=()=>IC.state.M;
const T=v=>v===null||v===undefined||!Number.isFinite(v)?'—':P.t(Math.round(v));
const pct=v=>v===null||!Number.isFinite(v)?'—':RT.pct(v);
const q=(v,d=3)=>!Number.isFinite(v)?'—':fa(Number(v.toFixed(d)).toLocaleString('en'));
const FAM={kg:'mass',g:'mass',l:'vol',ml:'vol'};

/* ---------- cost model (same rules as the current panel) ---------- */
function unitCost(i){if(!i)return{v:NaN,why:'ماده در کاتالوگ نیست'};const pk=Number(i.packageQuantity),price=Number(i.lastPurchasePriceToman),pu=E.UK(i.purchaseUnit),ru=E.UK(i.recipeUnit),w=Number(i.wastePercent)||0,y=1-w/100;
 if(!pu||!ru||(FAM[pu]&&FAM[ru]&&FAM[pu]!==FAM[ru]))return{v:NaN,why:'واحد خرید و مصرف ناسازگار'};if(!(pk>0))return{v:NaN,why:'مقدار بسته نامعتبر'};if(!(price>0))return{v:NaN,why:'بدون قیمت خرید'};if(!(y>0))return{v:NaN,why:'افت نامعتبر'};return{v:price/pk/y,why:''}}
let cache={key:'',map:null};
function metrics(m){const k=String(PR()?.meta?.updatedAt||'')+'|'+E.CAL.today;if(cache.key!==k)cache={key:k,map:new Map};if(cache.map.has(m.id))return cache.map.get(m.id);
 const lines=M().recipeAt(m.id,E.CAL.today),rows=lines.map(l=>{const i=M().ing.get(l.ingredientId),u=unitCost(i),qty=Nn(l.quantity),ok=Number.isFinite(u.v)&&u.v>0&&qty>0;return{l,i,qty,unit:u.v,cost:ok?u.v*qty:null,why:ok?'':qty<=0?'مقدار صفر یا خالی':u.why}});
 let cost=rows.reduce((a,r)=>a+(r.cost||0),0),manual=false;const missing=rows.filter(r=>r.cost===null).length;
 if(!lines.length&&m.manualCostEnabled!==false&&Nn(m.manualCostToman)>0){cost=Nn(m.manualCostToman);manual=true}
 const s=PR().settings||{},price=Nn(m.currentPriceToman),target=Nn(m.customTargetCostPercent)||Nn(s.categoryTargets?.[m.category])||35,complete=cost>0&&missing===0,step=Math.max(1000,Nn(s.priceIncrementToman)||10000);
 const out={rows,cost,manual,missing,complete,price,target,ratio:price>0&&cost>0?cost/price*100:null,margin:complete&&price>0?price-cost:null,suggested:complete&&target>0?Math.ceil(cost/(target/100)/step)*step:0,
  state:!lines.length?(manual?'manual':'none'):missing?'incomplete':'complete'};
 cache.map.set(m.id,out);return out}
const STATE={complete:['کامل','success'],incomplete:['ناقص','warning'],none:['بدون رسپی','danger'],manual:['بهای دستی','info']};
const stB=s=>P.b(...STATE[s]);
const active=()=>A(PR().menuItems).filter(m=>m.status!=='غیرفعال');
const ratioB=(m,x)=>x.ratio===null?'—':`<span class="${x.ratio>x.target+3?'down':x.ratio>x.target?'':'up'}">${RT.pct(x.ratio)}</span>`;

/* ---------- sales of the latest month with sales (spread by days like the inventory engine) ---------- */
function salesMonth(){const ss=M().sales;if(!ss.length)return null;const last=Math.max(...ss.map(s=>s.b)),k=E.CAL.k(last).slice(0,7);return k}
let salesCache={key:'',map:null,month:null};
function sales(){const k=String(IC.state.raw?.inventory?.meta?.updatedAt||'');if(salesCache.key===k)return salesCache;const month=salesMonth(),map=new Map;
 if(month){const r=E.monthRange(month),a0=E.CAL.i(r.from),b0=E.CAL.i(r.to);for(const s of M().sales)for(const l of A(s.lines)){const ld=l.date?E.CAL.i(l.date):null,a=ld??s.a,b=ld??s.b,lo=Math.max(a,a0),hi=Math.min(b,b0);if(hi<lo)continue;const part=(hi-lo+1)/(b-a+1);map.set(l.menuItemId,(map.get(l.menuItemId)||0)+Nn(l.quantity)*part)}}
 salesCache={key:k,map,month,complete:month&&E.CAL.i(E.monthRange(month).to)<=Math.max(...M().sales.map(s=>s.b))};return salesCache}
const monthName=()=>{const s=sales();return s.month?E.monthLabel(s.month)+(s.complete?'':' (ناقص)'):'—'};

const srcLine=()=>`<div class="row" style="gap:8px;margin-bottom:var(--s3);flex-wrap:wrap">${P.b(IC.source()==='live'?'دادهٔ زنده':'دادهٔ واقعی از فایل',IC.source()==='live'?'success':'info')}${P.b('فقط خواندنی','neutral')}<span class="muted" style="font-size:12px">آخرین تغییر منو و قیمت: ${esc(String(PR()?.meta?.updatedAt||'').slice(0,16).replace('T',' '))} · بها با آخرین قیمت خرید هر ماده، مثل پنل فعلی · ثبت و ویرایش در مرحلهٔ بعد</span></div>`;
const editLink=id=>`<a class="btn btn-ghost btn-sm" href="../../menu-management.html?tab=recipes&item=${encodeURIComponent(id)}" target="_blank" rel="noopener">${P.ic('external-link')}ویرایش در پنل فعلی</a>`;

/* ---------- items ---------- */
let iQ='',iCat='',iOnly='active';
function itemsReal(){const all=A(PR().menuItems),act=active(),xs=act.map(m=>[m,metrics(m)]),sm=sales().map;
 const sold=xs.filter(([m,x])=>x.complete&&x.price>0&&sm.get(m.id)>0),wq=sold.reduce((a,[m])=>a+sm.get(m.id),0),wfc=wq?sold.reduce((a,[m,x])=>a+x.ratio*sm.get(m.id),0)/wq:null;
 const cats=[...new Set(all.map(m=>m.category).filter(Boolean))];
 return srcLine()+`<div class="grid grid-4">${P.kpi({label:'آیتم فعال',icon:'utensils',value:fa(act.length),unit:'آیتم',foot:`${fa(all.length-act.length)} غیرفعال`})}${P.kpi({label:'میانگین درصد مواد',icon:'percent',value:pct(wfc),foot:`وزنی با فروش ${monthName()}${sold.some(([,x])=>x.ratio>100)?` · ${fa(sold.filter(([,x])=>x.ratio>100).length)} آیتم با بهای بیش از قیمت`:''}`})}${P.kpi({label:'بدون رسپی یا ناقص',icon:'alert-triangle',value:fa(xs.filter(([,x])=>x.state==='none'||x.state==='incomplete').length),unit:'آیتم فعال',tone:'warning',foot:`${fa(xs.filter(([,x])=>x.state==='none').length)} بدون رسپی · بها کمتر از واقع`})}${P.kpi({label:'بالاتر از هدف',icon:'trending-up',value:fa(xs.filter(([,x])=>x.complete&&x.ratio>x.target).length),unit:'آیتم',tone:'danger',foot:'<a href="#/menu/pricing">پیشنهاد قیمت</a>'})}</div>
 <div class="mt">${P.card({flush:1,body:`<div class="toolbar"><label class="search">${P.ic('search')}<input id="mrQ" placeholder="نام یا کد آیتم" value="${esc(iQ)}"></label><select class="select" id="mrCat" style="width:auto"><option value="">همهٔ دسته‌ها</option>${cats.map(c=>`<option ${c===iCat?'selected':''}>${esc(c)}</option>`).join('')}</select><select class="select" id="mrOnly" style="width:auto">${[['active','فعال‌ها'],['all','همه'],['none','بدون رسپی'],['incomplete','رسپی ناقص'],['above','بالاتر از هدف'],['over','بها بیش از قیمت'],['inactive','غیرفعال‌ها']].map(([v,l])=>`<option value="${v}" ${v===iOnly?'selected':''}>${l}</option>`).join('')}</select></div><div id="mrTable"></div>`})}</div>`}
function itemsTable(root){const sm=sales().map,rows=A(PR().menuItems).map(m=>[m,metrics(m)]).filter(([m,x])=>(!iQ||`${m.name} ${m.code}`.toLowerCase().includes(iQ.toLowerCase()))&&(!iCat||m.category===iCat)&&({active:m.status!=='غیرفعال',all:true,none:m.status!=='غیرفعال'&&x.state==='none',incomplete:m.status!=='غیرفعال'&&x.state==='incomplete',above:m.status!=='غیرفعال'&&x.complete&&x.ratio>x.target,over:m.status!=='غیرفعال'&&x.complete&&x.ratio>100,inactive:m.status==='غیرفعال'})[iOnly]).sort((a,b)=>(sm.get(b[0].id)||0)-(sm.get(a[0].id)||0)||String(a[0].name).localeCompare(String(b[0].name),'fa'));
 P.$('#mrTable',root).innerHTML=P.table(['آیتم','دسته',{t:'قیمت',n:1},{t:'بهای مواد',n:1},{t:'درصد مواد',n:1},{t:'هدف',n:1},{t:'سود هر فروش',n:1},{t:'فروش '+monthName(),n:1},'رسپی','وضعیت'],
  rows.slice(0,400).map(([m,x])=>({cls:'click',attr:`onclick="P.go('#/menu/recipes/${esc(m.id)}')"`,c:[P.cellMain(esc(m.name),esc(m.code||'')),esc(m.category||''),T(x.price),x.cost>0?T(x.cost)+(x.complete?'':'<small class="muted" style="display:block">حداقل</small>'):'—',ratioB(m,x),fa(x.target)+'٪',T(x.margin),sm.get(m.id)?q(sm.get(m.id),0):'—',stB(x.state)+(x.complete&&x.ratio>100?' '+P.b('بها بیش از قیمت','danger'):''),m.status==='غیرفعال'?P.b('غیرفعال','neutral'):P.b('فعال','success',1)]})),{empty:'موردی نیست'})+(rows.length>400?`<p class="muted" style="padding:8px">۴۰۰ ردیف اول از ${fa(rows.length)}</p>`:'');RT.icons()}
function itemsMount(root){const up=()=>itemsTable(root);P.$('#mrQ',root).oninput=e=>{iQ=e.target.value;up()};P.$('#mrCat',root).onchange=e=>{iCat=e.target.value;up()};P.$('#mrOnly',root).onchange=e=>{iOnly=e.target.value;up()};up()}

/* ---------- recipe of one item ---------- */
let rQ='';
function recipesReal(r){const list=A(PR().menuItems).slice().sort((a,b)=>(a.status==='غیرفعال')-(b.status==='غیرفعال')||String(a.name).localeCompare(String(b.name),'fa')),m=list.find(x=>x.id===r.param)||list.find(x=>x.status!=='غیرفعال')||list[0];if(!m)return srcLine()+P.note('آیتمی در منو نیست','info');
 const x=metrics(m),vs=A(PR().recipeVersions).filter(v=>v.menuItemId===m.id).sort((a,b)=>String(b.effectiveFrom).localeCompare(String(a.effectiveFrom))||String(b.createdAt).localeCompare(String(a.createdAt))),cur=vs.find(v=>(E.D(v.effectiveFrom)||'0000/00/00')<=E.CAL.today);
 return srcLine()+`<div class="split">${P.card({flush:1,body:`<div style="padding:var(--s3)"><label class="search">${P.ic('search')}<input id="mrRq" placeholder="جستجوی آیتم" value="${esc(rQ)}"></label></div><div class="side-list" id="mrSide">${list.map(y=>{const z=metrics(y);return`<button data-k="${esc(`${y.name} ${y.code}`)}" class="${y.id===m.id?'active':''}" onclick="P.go('#/menu/recipes/${esc(y.id)}')"><div class="grow"><b>${esc(y.name)}</b><small>${esc(y.category||'')} · ${z.ratio===null?'—':RT.pct(z.ratio)}${y.status==='غیرفعال'?' · غیرفعال':''}</small></div>${z.state==='none'||z.state==='incomplete'?P.ic('alert-triangle','down'):''}</button>`}).join('')}</div>`})}
 <div class="stack">${P.card({title:'رسپی '+esc(m.name),sub:`${esc(m.category||'')} · کد ${esc(m.code||'—')} · مقدار خالص هر پرس؛ انبار مقدار ناخالص (با افت) را کم می‌کند`,actions:editLink(m.id),flush:1,
   body:`${x.state==='none'?`<div style="padding:0 var(--s5) var(--s3)">${P.note('<b>این آیتم رسپی ندارد.</b> فروشش از انبار چیزی کم نمی‌کند و بهای تمام‌شده‌اش معلوم نیست.','alert-triangle')}</div>`:x.state==='manual'?`<div style="padding:0 var(--s5) var(--s3)">${P.note('رسپی ندارد؛ بهای تمام‌شده از «بهای دستی» آمده است و فروشش از انبار چیزی کم نمی‌کند.','info')}</div>`:x.missing?`<div style="padding:0 var(--s5) var(--s3)">${P.note(`<b>${fa(x.missing)} سطر بدون بها.</b> بهای تمام‌شده کمتر از واقع است و قیمت پیشنهادی محاسبه نمی‌شود.`,'alert-triangle')}</div>`:''}
   ${P.table(['ماده','مقدار','واحد',{t:'افت',n:1},{t:'بهای خالص واحد',n:1},{t:'بها',n:1},'ایراد'],x.rows.map(o=>[P.cellMain(esc(o.i?.name||o.l.ingredientId),esc(o.i?.code||'')),q(o.qty),esc(o.i?.recipeUnit||''),o.i?fa(Nn(o.i.wastePercent))+'٪':'—',Number.isFinite(o.unit)?q(o.unit,1):'—',T(o.cost),o.why?P.b(esc(o.why),'warning'):o.cost>x.price*0.5&&x.price>0?P.b('بیش از نصف قیمت؛ مقدار بسته یا واحد را بررسی کنید','danger'):'']),{empty:'سطری ندارد',foot:x.rows.length?['جمع','','','','',T(x.rows.reduce((a,o)=>a+(o.cost||0),0)),'']:null})}`})}
  <div class="grid grid-2">${P.card({title:'بهای تمام‌شده و قیمت',body:`<div class="minis"><div class="mini"><small>بهای مواد</small><b>${x.cost>0?T(x.cost):'—'}</b></div><div class="mini"><small>قیمت فعلی</small><b>${T(x.price)}</b></div><div class="mini"><small>درصد مواد</small><b>${ratioB(m,x)}</b></div><div class="mini"><small>هدف</small><b>${fa(x.target)}٪</b></div></div><div class="sum-box mt"><span>قیمت پیشنهادی با هدف</span><b>${x.suggested?P.T(x.suggested):'— (بها ناقص)'}</b></div>`})}
   ${P.card({title:'نسخه‌های رسپی',sub:cur?`نسخهٔ جاری از ${cur.effectiveFrom==='0000/00/00'?'ابتدا':fa(cur.effectiveFrom)}`:'نسخه ندارد (رسپی قدیمی)',flush:1,body:P.table(['از تاریخ',{t:'سطر',n:1},'ثبت','منبع'],vs.map(v=>[(v.effectiveFrom==='0000/00/00'?'ابتدا':fa(v.effectiveFrom))+(v===cur?' '+P.b('جاری','success',1):''),fa(A(v.lines).length),`${esc(v.createdBy||'')} <small class="muted">${esc(String(v.createdAt||'').slice(0,10))}</small>`,esc(v.source||'')]),{empty:'نسخه‌ای ثبت نشده'}),foot:'فروش هر روز با نسخهٔ رسپی همان روز از انبار کم می‌شود.'})}</div></div></div>`}
function recipesMount(root){const inp=P.$('#mrRq',root),side=P.$('#mrSide',root);if(!inp)return;const f=()=>{const v=rQ.toLowerCase();for(const b of side.children)b.style.display=!v||b.dataset.k.toLowerCase().includes(v)?'':'none'};inp.oninput=e=>{rQ=e.target.value;f()};f();side.querySelector('.active')?.scrollIntoView({block:'nearest'})}

/* ---------- pricing ---------- */
let pOnly='above';
function pricingReal(){const s=PR().settings||{},rows=active().map(m=>({m,x:metrics(m)})).filter(o=>o.x.complete&&o.x.price>0).map(o=>({...o,d:o.x.suggested-o.x.price})).sort((a,b)=>b.d-a.d),hist=A(PR().priceHistory).slice().sort((a,b)=>String(b.changedAt).localeCompare(String(a.changedAt)));
 const shown=pOnly==='above'?rows.filter(o=>o.x.ratio>o.x.target):rows,skipped=active().length-rows.length;
 return srcLine()+P.card({flush:1,title:'پیشنهاد قیمت بر اساس درصد هدف بهای مواد',sub:`قیمت پیشنهادی = بهای مواد ÷ درصد هدف، گرد به بالا تا ${P.t(Math.max(1000,Nn(s.priceIncrementToman)||10000))} تومان · ${fa(skipped)} آیتم فعال به‌خاطر رسپی ناقص یا نبود قیمت حساب نشدند`,
  actions:`<select class="select" id="mrPOnly" style="width:auto"><option value="above" ${pOnly==='above'?'selected':''}>فقط بالاتر از هدف (${fa(rows.filter(o=>o.x.ratio>o.x.target).length)})</option><option value="all" ${pOnly==='all'?'selected':''}>همه (${fa(rows.length)})</option></select>`,
  body:P.table(['آیتم','دسته',{t:'بهای مواد',n:1},{t:'قیمت فعلی',n:1},{t:'درصد فعلی',n:1},{t:'هدف',n:1},{t:'پیشنهادی',n:1},{t:'اختلاف',n:1}],shown.slice(0,400).map(({m,x,d})=>({cls:'click',attr:`onclick="P.go('#/menu/recipes/${esc(m.id)}')"`,c:[`<b>${esc(m.name)}</b>`,esc(m.category||''),T(x.cost),T(x.price),ratioB(m,x),fa(x.target)+'٪',T(x.suggested),`<span class="${d>0?'down':'up'}">${d>0?'+':''}${T(d)}</span>`]})),{empty:'آیتمی بالاتر از هدف نیست'})})
 +`<div class="grid grid-2 mt">${P.card({title:'تاریخچهٔ تغییر قیمت',flush:1,body:P.table(['تاریخ','آیتم',{t:'از',n:1},{t:'به',n:1},{t:'بها در آن زمان',n:1},'توضیح'],hist.slice(0,100).map(h=>[esc(new Date(h.changedAt).toLocaleDateString('fa-IR')),esc(h.itemName||''),T(Nn(h.oldPriceToman)),T(Nn(h.newPriceToman)),T(Nn(h.costToman)),esc(h.notes||'')]),{empty:'تغییر قیمتی ثبت نشده'})})}
  ${P.note(`<b>هدف هر آیتم:</b> هدف اختصاصی همان آیتم، وگرنه هدف دستهٔ آن (تنظیمات)، وگرنه ۳۵٪. تغییر قیمت فعلاً از «قیمت‌گذاری» پنل فعلی انجام می‌شود.`,'tag')}</div>`}
function pricingMount(root){const s=P.$('#mrPOnly',root);if(s)s.onchange=e=>{pOnly=e.target.value;P.render()}}

/* ---------- menu engineering (Kasavana–Smith) ---------- */
function engData(){const sm=sales().map,a=active().map(m=>({m,x:metrics(m),n:sm.get(m.id)||0})).filter(o=>o.n>0&&o.x.complete&&o.x.price>0),tot=a.reduce((s,o)=>s+o.n,0);if(!a.length)return null;
 const popCut=0.7/a.length,cm=a.reduce((s,o)=>s+o.x.margin*o.n,0)/tot;for(const o of a){const hp=o.n/tot>=popCut,hm=o.x.margin>=cm;o.g=hp&&hm?'star':hp?'plow':hm?'puzzle':'dog'}return{a,tot,popCut,cm}}
const GROUP={star:['ستاره','پرفروش و پرسود: کیفیت و جای اصلی منو را حفظ کنید','success'],plow:['اسب کاری','پرفروش و کم‌سود: کمی قیمت یا کاهش بهای مواد','warning'],puzzle:['معما','کم‌فروش و پرسود: معرفی بهتر، پیشنهاد گارسون','info'],dog:['سگ','کم‌فروش و کم‌سود: حذف یا بازطراحی','danger']};
function engReal(){const d=engData();if(!d)return srcLine()+P.note('برای این تحلیل فروش ثبت‌شده و رسپی کامل لازم است.','info');
 return srcLine()+`<div class="grid grid-3"><div class="span-2">${P.card({title:'مهندسی منو — '+monthName(),sub:`محبوبیت (تعداد فروش) در برابر سود هر فروش · ${fa(d.a.length)} آیتم با فروش و رسپی کامل · مرز محبوبیت ۷۰٪ سهم متوسط، مرز سود میانگین وزنی ${P.t(Math.round(d.cm))} تومان`,body:'<div class="chart chart-lg" id="mrEng"></div>'})}</div>
 ${P.card({title:'چهار گروه',flush:1,body:P.table(['گروه',{t:'آیتم',n:1},{t:'سهم فروش',n:1}],Object.entries(GROUP).map(([k,[l,h,t]])=>{const g=d.a.filter(o=>o.g===k);return[`${P.b(l,t)}<small class="muted" style="display:block">${h}</small>`,fa(g.length),RT.pct(g.reduce((s,o)=>s+o.n,0)/d.tot*100)]}))})}</div>
 <div class="mt">${P.card({title:'آیتم‌ها به تفکیک گروه',flush:1,body:P.table(['آیتم','گروه',{t:'فروش',n:1},{t:'سود هر فروش',n:1},{t:'سود کل',n:1},{t:'درصد مواد',n:1}],d.a.slice().sort((a,b)=>b.x.margin*b.n-a.x.margin*a.n).map(o=>({cls:'click',attr:`onclick="P.go('#/menu/recipes/${esc(o.m.id)}')"`,c:[`<b>${esc(o.m.name)}</b>`,P.b(GROUP[o.g][0],GROUP[o.g][2]),q(o.n,0),T(o.x.margin),T(o.x.margin*o.n),ratioB(o.m,o.x)]})))})}</div>
 ${P.note(`آیتم‌های بدون رسپی یا با رسپی ناقص در این نمودار نیستند (${fa(active().filter(m=>(sales().map.get(m.id)||0)>0&&!metrics(m).complete).length)} آیتم فروش‌رفته). سود هر فروش بدون کارمزد کانال و بسته‌بندی است.`,'info')}`}
function engMount(){const d=engData();if(!d)return;const top=new Set(d.a.slice().sort((a,b)=>b.n-a.n).slice(0,15).map(o=>o.m.id)),col=t=>({star:t.success,plow:t.warning,puzzle:t.accent,dog:t.danger});
 RT.chart('mrEng',t=>Object.assign(RT.base(t),{grid:{left:16,right:16,top:24,bottom:24,containLabel:true},tooltip:Object.assign(RT.base(t).tooltip,{trigger:'item',formatter:p=>`<b>${esc(p.data[2])}</b>`+RT.tipRow(p.color,'فروش',fa(Math.round(p.data[0])))+RT.tipRow(p.color,'سود هر فروش',P.t(Math.round(p.data[1])))}),
  xAxis:RT.axis(t,{type:'value',name:'تعداد فروش',nameLocation:'middle',nameGap:26,nameTextStyle:{color:t.text3,fontFamily:t.font}}),yAxis:RT.axis(t,{type:'value',axisLabel:{color:t.text3,fontFamily:t.font,formatter:v=>RT.short(v)}}),
  series:[{type:'scatter',symbolSize:12,data:d.a.map(o=>[o.n,o.x.margin,o.m.name,o.g,top.has(o.m.id)]),itemStyle:{color:p=>col(t)[p.data[3]]},
   label:{show:true,position:'top',formatter:p=>p.data[4]?p.data[2]:'',color:t.text2,fontFamily:t.font,fontSize:11},
   markLine:{silent:true,symbol:'none',lineStyle:{color:t.border,type:'dashed'},label:{show:false},data:[{xAxis:d.popCut*d.tot},{yAxis:d.cm}]}}]}))}

/* ---------- settings (read-only) ---------- */
function settingsReal(){const s=PR().settings||{},all=A(PR().menuItems),cats=[...new Set([...all.map(m=>m.category),...Object.keys(s.categoryTargets||{})].filter(Boolean))].sort((a,b)=>a.localeCompare(b,'fa'));
 return srcLine()+`<div class="grid grid-2">${P.card({title:'درصد هدف بهای مواد',sub:`به تفکیک دسته · پیش‌فرض غذا ${fa(Nn(s.defaultFoodTargetPercent)||35)}٪، بار ${fa(Nn(s.defaultBarTargetPercent)||25)}٪`,flush:1,body:P.table(['دسته',{t:'آیتم فعال',n:1},{t:'هدف',n:1},{t:'درصد مواد فعلی',n:1}],cats.map(c=>{const xs=all.filter(m=>m.category===c&&m.status!=='غیرفعال').map(m=>metrics(m)).filter(x=>x.complete&&x.price>0),avg=xs.length?xs.reduce((a,x)=>a+x.ratio,0)/xs.length:null,t=Nn(s.categoryTargets?.[c])||35;return[esc(c),fa(all.filter(m=>m.category===c&&m.status!=='غیرفعال').length),fa(t)+'٪',avg===null?'—':`<span class="${avg>t+3?'down':avg>t?'':'up'}">${RT.pct(avg)}</span> <small class="muted">(${fa(xs.length)} آیتم کامل)</small>`]}))})}
 <div class="stack">${P.card({title:'گرد کردن قیمت',body:`<div class="sum-box"><span>گام قیمت</span><b>${P.T(Math.max(1000,Nn(s.priceIncrementToman)||10000))}</b></div>`})}
 ${P.card({title:'واحدها',body:`<div class="row" style="flex-wrap:wrap">${A(PR().lists?.units).map(u=>`<span class="chip">${esc(u)}</span>`).join('')}</div>`})}
 ${P.note('تغییر این تنظیمات فعلاً از «قیمت‌گذاری» پنل فعلی انجام می‌شود.','settings-2')}</div></div>`}

/* ---------- wiring ---------- */
const hint=()=>P.note(`این صفحه <b>دادهٔ نمونه</b> است. برای دیدن منو و رسپی واقعی، در «انبار ← داشبورد کنترل» به داده وصل شوید. <a href="#/inventory/control">اتصال</a>`,'database');
const REAL={items:{render:itemsReal,mount:itemsMount},recipes:{render:recipesReal,mount:recipesMount},pricing:{render:pricingReal,mount:pricingMount},engineering:{render:engReal,mount:engMount},settings:{render:settingsReal},
 channels:{render:null}};
for(const [id,v] of Object.entries(REAL)){const t=mod.tabs.find(x=>x.id===id);if(!t)continue;const r0=t.render,m0=t.mount,a0=t.actions;
 t.render=r=>IC.ready()?(v.render?v.render(r):P.note('قیمت و قاعدهٔ هر کانال فروش هنوز در دادهٔ رایو ثبت نمی‌شود؛ این صفحه نمونه است.','info')+r0(r)):hint()+r0(r);
 t.mount=(root,r)=>{if(IC.ready()&&v.render){v.mount&&v.mount(root,r)}else m0&&m0(root,r)};
 if(a0)t.actions=r=>IC.ready()&&v.render?`<button class="btn btn-secondary" disabled title="ثبت و ویرایش منو روی دادهٔ واقعی در مرحلهٔ بعد">${P.ic('lock')}ثبت — مرحلهٔ بعد</button>`:a0(r);}
mod.badge=()=>IC.ready()?active().filter(m=>metrics(m).state==='none').length:0;
window.MenuReal={metrics,unitCost,sales,engData};
})();
