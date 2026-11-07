/* Rayo Panel prototype — بقیهٔ بخش‌ها روی دادهٔ واقعی (مرحلهٔ ۱۰: فقط خواندنی)
   - مالی ← «دارایی‌ها»: assets module; value as the current panel (js/12 amAssetValuation): base unit price ×
     (current ÷ base exchange rate) × max(0, 1 − yearly rate × full years since the valuation base date) × quantity;
     rate = asset override → its pricing group → source rate → 10٪; quantity assets add their live quantity transactions.
   - گزارش‌ها ← «تحلیل فروش»: item sales of inventory.salesPeriods (Sepidz/Snapp files) + daily sales of the cash reports.
   - تنظیمات ← «لاگ خطاها»: errorlog entries grouped by message.
   - مشتریان: reservations (personnel module, via people-real.js) and survey responses.
   «ممیزی صندوق» stays on sample data: the sepidsaudit module is not initialized on the server. Nothing is saved here. */
(function(){
'use strict';
const IC=window.InvControl,E=window.InvEngine;
const esc=P.esc,fa=P.fa,A=x=>Array.isArray(x)?x:[],Z=v=>{const n=Number(v);return Number.isFinite(n)?n:0};
const T=v=>P.t(Math.round(Z(v)));
const srcLine=extra=>`<div class="row" style="gap:8px;margin-bottom:var(--s3);flex-wrap:wrap">${P.b(IC.source()==='live'?'دادهٔ زنده':'دادهٔ واقعی از فایل',IC.source()==='live'?'success':'info')}${P.b('فقط خواندنی','neutral')}${extra?`<span class="muted" style="font-size:12px">${extra}</span>`:''}</div>`;
// one more module next to the inventory connection (live API or <name>.json next to ?data=)
const mods={};
async function loadModule(name){const s=mods[name]||(mods[name]={doc:null,busy:false,err:''});if(s.busy||s.doc)return;s.busy=true;try{const q=new URLSearchParams(location.search).get('data');let r;
 if(IC.source()==='live')r=await fetch(E.API_ROOT+`Load?module=${name}&_=`+Date.now(),{cache:'no-store',credentials:'omit'});else if(q)r=await fetch(q+name+'.json',{cache:'no-store'});else throw Error(`فایل ${name} وصل نیست؛ با اتصال زنده یا ?data= (کنار ${name}.json) خوانده می‌شود`);
 if(!r.ok)throw Error('HTTP '+r.status);const d=E.unwrap(await r.json());if(d&&d.code&&d.message&&!d.meta)throw Error(String(d.message).slice(0,160));s.doc=d;s.err=''}catch(e){s.err=e.message||String(e)}finally{s.busy=false;P.render()}}
const withModule=(name,label,fn)=>r=>{const s=mods[name];if(!s?.doc&&!s?.err){loadModule(name);return srcLine()+P.note(`در حال خواندن ${label}…`,'loader')}if(s.err)return srcLine()+P.note(`${label} خوانده نشد: ${esc(s.err)}`,'alert-triangle');return fn(s.doc,r)};

/* ---------- assets ---------- */
const live=x=>x&&x.status!=='void'&&x.isArchived!==true;
function valuation(doc,a){const st=doc.settings||{},rates=st.depreciationRates||{},raw=a.annualDepreciationRate,ov=raw!==null&&raw!==undefined&&raw!==''?Number(raw):NaN,grp=Number(rates[a.pricingGroup]),src=Number(a.sourceAnnualDepreciationRate),rate=Number.isFinite(ov)&&ov>=0?ov:Number.isFinite(grp)&&grp>=0?grp:Number.isFinite(src)&&src>=0?src:0.10;
 const base=Z(a.valuationBaseUnitPriceToman||a.baseUnitPriceToman||a.purchaseCost),bfx=Z(st.baseExchangeRateToman)||190000,cfx=Z(st.currentExchangeRateToman)||bfx,fx=bfx>0?cfx/bfx:1;
 const p=s=>{const m=String(s||'').replace(/-/g,'/').match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);return m?{y:+m[1],m:+m[2],d:+m[3]}:null},b=p(st.valuationBaseDate||'1405/05/20'),t=p(E.CAL.today);let years=b&&t?t.y-b.y-((t.m<b.m||(t.m===b.m&&t.d<b.d))?1:0):0;years=Math.max(0,years);
 const qty=a.trackingMode==='quantity'?Math.max(0,Z(a.initialQuantity)+A(doc.quantityTransactions).filter(x=>live(x)&&x.assetId===a.id).reduce((s,x)=>s+Z(x.effect),0)):Math.max(0,Z(a.valuationQuantity||a.sourceCurrentQuantity||a.initialQuantity||1)||1);
 const unit=Math.round(base*fx*Math.max(0,1-rate*years));return{base,fx,rate,years,unit,qty,total:Math.round(unit*qty)}}
let aQ='',aCat='';
function assetsView(doc){const as=A(doc.assets).filter(a=>!a.isArchived),vs=new Map(as.map(a=>[a.id,valuation(doc,a)])),tot=as.reduce((s,a)=>s+vs.get(a.id).total,0),st=doc.settings||{},cats=new Map;
 for(const a of as){const o=cats.get(a.category||'—')||{n:0,v:0};o.n++;o.v+=vs.get(a.id).total;cats.set(a.category||'—',o)}const y=vs.size?[...vs.values()][0].years:0,low=as.filter(a=>a.trackingMode==='quantity'&&Z(a.minimumRequired)>0&&vs.get(a.id).qty<Z(a.minimumRequired));
 return srcLine(`ارزش با نرخ ارز ${P.t(Z(st.currentExchangeRateToman))} (مبنا ${P.t(Z(st.baseExchangeRateToman))}) و استهلاک ${fa(y)} سال کامل از ${fa(st.valuationBaseDate||'')} — همان فرمول پنل فعلی`)+`<div class="grid grid-4">${P.kpi({label:'ارزش روز دارایی‌ها',icon:'tag',value:RT.money(tot),unit:'تومان',foot:`${fa(as.length)} قلم`})}${P.kpi({label:'شماره‌دار / تعدادی',icon:'hash',value:`${fa(as.filter(a=>a.trackingMode==='numbered').length)} / ${fa(as.filter(a=>a.trackingMode==='quantity').length)}`})}${P.kpi({label:'کمتر از حداقل',icon:'alert-triangle',value:fa(low.length),tone:low.length?'warning':'',foot:'دارایی تعدادی زیر حداقل لازم'})}${P.kpi({label:'سوابق',icon:'wrench',value:`${fa(A(doc.maintenanceRecords).length)} / ${fa(A(doc.assetIncidents).length)} / ${fa(A(doc.counts).length)}`,foot:'نگهداری / خرابی / شمارش'})}</div>
 <div class="grid grid-3 mt">${P.card({title:'ارزش به تفکیک دسته',flush:1,body:P.table(['دسته',{t:'قلم',n:1},{t:'ارزش',n:1},{t:'سهم',n:1}],[...cats].sort((a,b)=>b[1].v-a[1].v).map(([c,o])=>[esc(c),fa(o.n),T(o.v),RT.pct(tot?o.v/tot*100:0)]),{foot:['جمع',fa(as.length),T(tot),'']})})}
 <div class="span-2">${P.card({flush:1,title:'دارایی‌ها',actions:`<label class="search">${P.ic('search')}<input id="asQ" placeholder="نام، برچسب یا محل" value="${esc(aQ)}"></label><select class="select" id="asCat" style="width:auto"><option value="">همهٔ دسته‌ها</option>${[...cats.keys()].map(c=>`<option ${c===aCat?'selected':''}>${esc(c)}</option>`).join('')}</select>`,body:'<div id="asTable"></div>'})}</div></div>
 ${P.note('ثبت دارایی، شمارش هفتگی، خرابی و تعمیر فعلاً در «اموال» پنل فعلی است.','info')}`}
function assetsTable(root,doc){const rows=A(doc.assets).filter(a=>!a.isArchived&&(!aCat||(a.category||'—')===aCat)&&(!aQ||`${a.name} ${a.assetTag} ${a.location} ${a.brand}`.toLowerCase().includes(aQ.toLowerCase()))).map(a=>({a,v:valuation(doc,a)})).sort((x,y)=>y.v.total-x.v.total);
 P.$('#asTable',root).innerHTML=P.table(['دارایی','دسته','محل',{t:'تعداد',n:1},{t:'ارزش واحد',n:1},{t:'ارزش کل',n:1},{t:'استهلاک سالانه',n:1},'وضعیت'],rows.slice(0,300).map(({a,v})=>[P.cellMain(esc(a.name),esc([a.assetTag,a.brand].filter(Boolean).join(' · '))),esc(a.category||''),esc(a.location||''),`${fa(v.qty)} ${esc(a.unit||'')}${a.trackingMode==='quantity'&&Z(a.minimumRequired)>0&&v.qty<Z(a.minimumRequired)?' '+P.b('زیر حداقل','warning'):''}`,T(v.unit),`<b>${T(v.total)}</b>`,RT.pct(v.rate*100),esc(a.status||'')]),{empty:'موردی نیست'});RT.icons()}
function assetsMount(root){const s=mods.assets;if(!s?.doc||!P.$('#asTable',root))return;assetsTable(root,s.doc);P.$('#asQ',root).oninput=e=>{aQ=e.target.value;assetsTable(root,s.doc)};P.$('#asCat',root).onchange=e=>{aCat=e.target.value;assetsTable(root,s.doc)}}

/* ---------- sales analysis ---------- */
let sSrc='';
function salesView(){const inv=IC.state.raw.inventory,pr=IC.state.raw.pricing,menu=new Map(A(pr.menuItems).map(m=>[m.id,m])),ps=A(inv.salesPeriods).filter(s=>s.status!=='void'&&!s.isArchived);
 if(!ps.length)return srcLine()+P.note('هنوز فایل فروشی وارد نشده است.','info');const srcs=[...new Set(ps.map(s=>String(s.salesSource||s.source||'SEPIDZ').toUpperCase()))],sel=ps.filter(s=>!sSrc||String(s.salesSource||s.source||'SEPIDZ').toUpperCase()===sSrc),items=new Map;
 for(const s of sel)for(const l of A(s.lines)){const o=items.get(l.menuItemId)||{q:0,amt:0};o.q+=Z(l.quantity);o.amt+=Z(l.saleAmountToman)||Z(l.quantity)*Z(l.salePriceToman||menu.get(l.menuItemId)?.currentPriceToman);items.set(l.menuItemId,o)}
 const tot=[...items.values()].reduce((a,o)=>a+o.amt,0),qty=[...items.values()].reduce((a,o)=>a+o.q,0),cats=new Map;for(const [id,o] of items){const c=menu.get(id)?.category||'—',x=cats.get(c)||{q:0,amt:0};x.q+=o.q;x.amt+=o.amt;cats.set(c,x)}
 const range=`${fa(sel.map(s=>E.D(s.from||s.date)).sort()[0]||'')} تا ${fa(sel.map(s=>E.D(s.to||s.date)).sort().at(-1)||'')}`,cr=A(IC.state.raw.cashreport?.reports).filter(r=>r.status!=='void'),crTot=cr.reduce((a,r)=>a+(Z(r.netReceivable)-Z(r.taxAmount)+Z(r.debtorAmount)-Z(r.deliveryFeeAmount)+Z(r.snappAmount)),0)/10;
 return srcLine(`فایل‌های فروش واردشده در انبار: ${range} · ${fa(sel.length)} فایل`)+`<div class="row" style="gap:8px;margin-bottom:var(--s3)"><select class="select" id="saSrc" style="width:auto"><option value="">همهٔ منابع</option>${srcs.map(x=>`<option value="${x}" ${x===sSrc?'selected':''}>${x==='SNAPP'?'اسنپ‌فود':'سپیدز'}</option>`).join('')}</select></div>
 <div class="grid grid-4">${P.kpi({label:'فروش آیتم‌ها',icon:'receipt',value:RT.money(tot),unit:'تومان',foot:range})}${P.kpi({label:'تعداد فروش',icon:'shopping-bag',value:fa(Math.round(qty)),foot:`${fa(items.size)} آیتم`})}${P.kpi({label:'میانگین هر آیتم',icon:'divide',value:RT.money(qty?tot/qty:0),unit:'تومان'})}${P.kpi({label:'فروش گزارش صندوق',icon:'banknote',value:RT.money(crTot),unit:'تومان',foot:`${fa(new Set(cr.map(r=>E.D(r.date))).size)} روز (از ۳۱ شهریور) — بازه‌ها یکی نیستند`})}</div>
 <div class="grid grid-2 mt">${P.card({title:'پرفروش‌ترین‌ها',sub:'بر اساس مبلغ فروش',flush:1,body:P.table(['آیتم','دسته',{t:'تعداد',n:1},{t:'مبلغ',n:1},{t:'سهم',n:1}],[...items].sort((a,b)=>b[1].amt-a[1].amt).slice(0,25).map(([id,o])=>[`<a href="#/menu/recipes/${esc(id)}"><b>${esc(menu.get(id)?.name||id)}</b></a>`,esc(menu.get(id)?.category||''),fa(Math.round(o.q)),T(o.amt),RT.pct(tot?o.amt/tot*100:0)]))})}
 ${P.card({title:'فروش به تفکیک دسته',flush:1,body:'<div class="chart" id="saCat"></div>'+P.table(['دسته',{t:'تعداد',n:1},{t:'مبلغ',n:1},{t:'سهم',n:1}],[...cats].sort((a,b)=>b[1].amt-a[1].amt).map(([c,o])=>[esc(c),fa(Math.round(o.q)),T(o.amt),RT.pct(tot?o.amt/tot*100:0)]))})}</div>
 ${P.note('فروش روزانه و ساعتی از فایل «تعداد فروش کالا» نمی‌آید (فایل جمع بازه است). برای روند روزانه، «مالی ← صندوق و بانک» را ببینید.','info')}`}
function salesMount(root){const s=P.$('#saSrc',root);if(s)s.onchange=e=>{sSrc=e.target.value;P.render()};if(!P.$('#saCat',root))return;const inv=IC.state.raw.inventory,menu=new Map(A(IC.state.raw.pricing.menuItems).map(m=>[m.id,m])),cats=new Map;
 for(const p of A(inv.salesPeriods).filter(x=>x.status!=='void'&&(!sSrc||String(x.salesSource||x.source||'SEPIDZ').toUpperCase()===sSrc)))for(const l of A(p.lines)){const c=menu.get(l.menuItemId)?.category||'—';cats.set(c,(cats.get(c)||0)+Z(l.saleAmountToman))}
 const top=[...cats].sort((a,b)=>b[1]-a[1]).slice(0,10);RT.chart('saCat',t=>Object.assign(RT.base(t),{tooltip:Object.assign(RT.base(t).tooltip,{trigger:'item',formatter:p=>`${esc(p.name)}<br>${P.t(Math.round(p.value))} تومان (${fa(p.percent)}٪)`}),series:[{type:'pie',radius:['45%','72%'],data:top.map(([n,v])=>({name:n,value:Math.round(v)})),label:{show:false}}]}))}

/* ---------- error log ---------- */
let eQ='';
function errorsView(doc){const es=A(doc.entries),groups=new Map;for(const e of es){const k=String(e.message||'—').slice(0,160),g=groups.get(k)||{n:0,last:'',first:'',pages:new Set,sev:new Set,users:new Set};g.n++;if(!g.last||e.at>g.last)g.last=e.at;if(!g.first||e.at<g.first)g.first=e.at;const pg=String(e.url||'').split('?')[0].split('/').pop();if(pg)g.pages.add(pg);if(e.severity)g.sev.add(e.severity);if(e.user)g.users.add(e.user);groups.set(k,g)}
 const day=s=>String(s||'').slice(0,10),recent=es.filter(e=>Date.now()-Date.parse(e.at)<864e5).length;
 return srcLine(`آخرین ${fa(es.length)} خطای ثبت‌شده از ${esc(day(es.map(e=>e.at).sort()[0]))} تا ${esc(day(es.map(e=>e.at).sort().at(-1)))} (لاگ سرور فقط ۱۰۰۰ ردیف آخر را نگه می‌دارد)`)+`<div class="grid grid-4">${P.kpi({label:'خطا در ۲۴ ساعت اخیر',icon:'bug',value:fa(recent),tone:recent?'warning':''})}${P.kpi({label:'نوع خطا',icon:'layers',value:fa(groups.size)})}${P.kpi({label:'پرتکرارترین',icon:'repeat',value:fa([...groups.values()].reduce((a,g)=>Math.max(a,g.n),0)),foot:esc([...groups].sort((a,b)=>b[1].n-a[1].n)[0]?.[0]?.slice(0,40)||'')})}${P.kpi({label:'شدید',icon:'alert-octagon',value:fa(es.filter(e=>e.severity==='error'||!e.severity).length),foot:`${fa(es.filter(e=>e.severity==='warning').length)} هشدار`})}</div>
 <div class="mt">${P.card({flush:1,title:'خطاها به تفکیک پیام',actions:`<label class="search">${P.ic('search')}<input id="erQ" placeholder="متن خطا یا صفحه" value="${esc(eQ)}"></label>`,body:'<div id="erTable"></div>'})}</div>`}
function errorsTable(root,doc){const groups=new Map;for(const e of A(doc.entries)){const k=String(e.message||'—').slice(0,160),g=groups.get(k)||{n:0,last:'',pages:new Set,sev:new Set};g.n++;if(!g.last||e.at>g.last)g.last=e.at;const pg=String(e.url||'').split('?')[0].split('/').pop();if(pg)g.pages.add(pg);if(e.severity)g.sev.add(e.severity);groups.set(k,g)}
 const rows=[...groups].filter(([k,g])=>!eQ||`${k} ${[...g.pages].join(' ')}`.toLowerCase().includes(eQ.toLowerCase())).sort((a,b)=>b[1].n-a[1].n);
 P.$('#erTable',root).innerHTML=P.table(['پیام',{t:'تعداد',n:1},'آخرین بار','صفحه‌ها','شدت'],rows.slice(0,200).map(([k,g])=>[`<span class="wrap">${esc(k)}</span>`,fa(g.n),esc(new Date(g.last).toLocaleString('fa-IR')),esc([...g.pages].slice(0,4).join('، ')),[...g.sev].map(s=>P.b(esc(s),s==='warning'?'warning':'danger')).join(' ')||P.b('error','danger')]),{empty:'خطایی نیست'})}
function errorsMount(root){const s=mods.errorlog;if(!s?.doc||!P.$('#erTable',root))return;errorsTable(root,s.doc);P.$('#erQ',root).oninput=e=>{eQ=e.target.value;errorsTable(root,s.doc)}}

/* ---------- customers ---------- */
function reservationsView(){const PR=window.PeopleReal;if(!PR)return P.note('ماژول پرسنل در این صفحه بارگذاری نشده است.','info');if(!PR.doc()&&!PR.state.err){PR.load();return srcLine()+P.note('در حال خواندن رزروها…','loader')}if(PR.state.err)return srcLine()+P.note('رزروها خوانده نشد: '+esc(PR.state.err),'alert-triangle');
 const rs=A(PR.doc().reservations).slice().sort((a,b)=>String(b.date).localeCompare(String(a.date)));
 return srcLine('رزروها در ماژول پرسنل ذخیره می‌شوند')+P.card({title:'رزروها و بیعانه‌ها',sub:`${fa(rs.length)} رزرو ثبت‌شده`,flush:1,body:P.table(['تاریخ','ساعت','مشتری','تعداد','بخش',{t:'بیعانه',n:1},'روش','وضعیت','ثبت'],rs.map(r=>[fa(r.date||''),fa(r.time||''),esc(r.customerName||''),fa(r.partySize||''),esc(r.area||''),T(r.depositAmount),esc(r.depositMethod||''),esc(r.status||''),esc(r.createdByName||'')]),{empty:'رزروی ثبت نشده'})})+(rs.length<5?P.note('رزرو تقریباً ثبت نمی‌شود؛ تا ثبت مرتب رزروها، گزارش رزرو و بیعانه معنا ندارد.','info'):'')}
function surveyView(doc){const rs=A(doc.responses);return srcLine()+(rs.length?P.card({title:'پاسخ‌های نظرسنجی',sub:`${fa(rs.length)} پاسخ`,flush:1,body:P.table(['تاریخ','کانال','رضایت','دلیل'],rs.slice(-200).reverse().map(r=>[fa(r.date||String(r.createdAt||'').slice(0,10)),esc(r.channel||r.serviceChannel||''),esc(r.satisfaction||r.level||''),esc(r.reason||'')]))}):P.note(`<b>هنوز هیچ پاسخ نظرسنجی ثبت نشده است.</b> تنظیمات نظرسنجی آماده است: ${fa(A(doc.settings?.serviceChannels).length)} کانال خدمت، ${fa(A(doc.settings?.satisfactionLevels).length)} سطح رضایت.`,'info'))}

/* ---------- wiring ---------- */
const hint=()=>P.note(`این صفحه <b>دادهٔ نمونه</b> است. برای دیدن دادهٔ واقعی، در «انبار ← داشبورد کنترل» به داده وصل شوید. <a href="#/inventory/control">اتصال</a>`,'database');
function wire(modId,tabId,v){const m=P.mods[modId],t=m?.tabs?.find(x=>x.id===tabId);if(!t)return;const r0=t.render,m0=t.mount,a0=t.actions;
 t.render=r=>IC.ready()?(v.render?v.render(r):P.note(v.empty,'info')+r0(r)):hint()+r0(r);
 t.mount=(root,r)=>{if(IC.ready()&&v.render){v.mount&&v.mount(root,r)}else m0&&m0(root,r)};
 if(a0&&v.render)t.actions=r=>IC.ready()?`<button class="btn btn-secondary" disabled title="ثبت روی دادهٔ واقعی در مرحلهٔ بعد">${P.ic('lock')}ثبت — مرحلهٔ بعد</button>`:a0(r)}
wire('finance','assets',{render:withModule('assets','دارایی‌ها',assetsView),mount:assetsMount});
wire('reports','sales',{render:salesView,mount:salesMount});
wire('reports','audit',{empty:'<b>ماژول ممیزی صندوق (sepidsaudit) روی سرور مقداردهی نشده است</b>؛ این صفحه نمونهٔ طرح است.'});
wire('settings','errors',{render:withModule('errorlog','لاگ خطاها',errorsView),mount:errorsMount});
wire('customers','reservations',{render:reservationsView});
wire('customers','survey',{render:withModule('survey','نظرسنجی',surveyView)});
window.ExtrasReal={valuation,loadModule,mods};
})();
