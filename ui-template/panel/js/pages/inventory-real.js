/* Rayo Panel prototype — انبار روی دادهٔ واقعی
   مرحلهٔ ۱: When real data is connected (live on rayocafe.ir, ?data=, or JSON files in «داشبورد کنترل»), the inventory tabs
   show the real records through the shared engine (../js/inventory-engine.js); otherwise they keep the sample data with a hint.
   مرحلهٔ ۲: On live data and inside an admin session of the current panel (same browser tab, sessionStorage rayo_admin_user),
   receipts, waste/authorized consumption, fryer oil changes and whole counts are saved, and receipts/events can be voided,
   through ../js/inventory-write.js — same record shapes and the same protected save as the current panel. */
(function(){
'use strict';
const IC=window.InvControl,E=window.InvEngine,W=window.InvWrite,inv=P.mods.inventory;
const M=()=>IC.state.M,esc=P.esc,fa=P.fa;
const A=x=>Array.isArray(x)?x:[];
const q=(v,d=2)=>v===null||v===undefined||!Number.isFinite(v)?'—':fa(Number(v.toFixed(d)).toLocaleString('en'));
const T=v=>v===null||v===undefined||!Number.isFinite(v)?'—':RT.money(v);

/* ---------- write access (stage 2) ---------- */
const ses=k=>{try{return sessionStorage.getItem(k)||''}catch(_){return ''}};
const allowed=k=>{if(!ses('rayo_admin_user'))return false;if(ses('rayo_admin_role')==='owner')return true;let s=null;try{s=JSON.parse(ses('rayo_admin_sections')||'null')}catch(_){}return s==='*'||(Array.isArray(s)&&s.includes(k))};
const live=()=>IC.ready()&&IC.source()==='live';
const canWrite=()=>live()&&allowed('inventory');
const canVoid=()=>canWrite()&&allowed('inventoryEdit');
const whyLocked=()=>!live()?'ثبت فقط روی دادهٔ زنده ممکن است (پنل باز‌شده از rayocafe.ir)':!ses('rayo_admin_user')?'برای ثبت، در همین زبانه ابتدا در پنل فعلی وارد شوید و بعد این صفحه را باز کنید':'کاربر شما دسترسی انبار ندارد';

let posCache={key:'',rows:null};
const pos=()=>{const k=E.CAL.today+'|'+(IC.state.raw?.inventory?.meta?.updatedAt||'');if(posCache.key!==k)posCache={key:k,rows:E.positions(M(),E.CAL.today)};return posCache.rows};
const lastSaleDay=()=>{const m=M();let mx=null;for(const s of m.sales)if(mx===null||s.b>mx)mx=s.b;return mx};
const srcLine=()=>`<div class="row" style="gap:8px;margin-bottom:var(--s3);flex-wrap:wrap">${P.b(IC.source()==='live'?'دادهٔ زنده':'دادهٔ واقعی از فایل',IC.source()==='live'?'success':'info')}${canWrite()?P.b('ثبت فعال — '+esc(ses('rayo_admin_user')),'success'):P.b('فقط خواندنی','neutral')}<span class="muted" style="font-size:12px">آخرین تغییر انبار: ${esc(String(IC.state.raw?.inventory?.meta?.updatedAt||'').slice(0,16).replace('T',' '))} · ${canWrite()?'هر ثبت از سرور خوانده، ذخیره و دوباره بازخوانی و مقایسه می‌شود':esc(whyLocked())}</span></div>${W.state.uncertain?P.note('<b>نتیجهٔ آخرین ذخیره تأیید نشد.</b> تا بازخوانی صفحه ثبت جدید ممکن نیست؛ بعد از بازخوانی، وجود ثبت قبلی را در فهرست بررسی کنید.','alert-triangle'):''}`;
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
const voidBtn=(kind,id)=>canVoid()?`<button class="btn btn-ghost btn-sm" data-iwv="${kind}" data-id="${esc(id)}">${P.ic('ban')}ابطال</button>`:'';
function receiptReal(){const m=M(),rows=m.receipts.filter(x=>x.day>=DAYS60()).sort((a,b)=>b.day-a.day||String(b.raw?.createdAt||'').localeCompare(String(a.raw?.createdAt||''))),c=x=>m.costAt(x.item,x.date);
 return srcLine()+`<div class="grid grid-4">${P.kpi({label:'ورود ۶۰ روز اخیر',icon:'package-plus',value:fa(rows.length),unit:'ثبت'})}${P.kpi({label:'ارزش تقریبی',icon:'banknote',value:RT.money(rows.reduce((a,x)=>a+(c(x)||0)*x.qty,0)),unit:'تومان',foot:'با آخرین قیمت خرید هر قلم'})}${P.kpi({label:'بدون قیمت در رسید',icon:'badge-dollar-sign',value:fa(rows.filter(x=>!Number(x.raw?.totalPriceToman)&&!Number(x.raw?.unitCostToman)).length)})}${P.kpi({label:'واحد متفاوت با قلم',icon:'ruler',value:fa(rows.filter(x=>x.unit&&E.UK(x.unit)!==E.UK(m.ing.get(x.item)?.recipeUnit)).length),tone:'warning'})}</div>
 ${P.card({title:'ورودهای ۶۰ روز اخیر',flush:1,body:P.table(['تاریخ','کالا',{t:'مقدار',n:1},'واحد',{t:'ارزش',n:1},'ثبت‌کننده','توضیح',''],rows.slice(0,300).map(x=>{const i=m.ing.get(x.item),bad=x.unit&&E.UK(x.unit)!==E.UK(i?.recipeUnit);return[fa(x.date),esc(i?.name||x.item),q(x.qty,3)+(x.raw?.entryUnitFactor>1?`<small class="muted" style="display:block">${q(Number(x.raw.entryQuantity),3)} ${esc(x.raw.entryUnit)}</small>`:''),`${esc(i?.recipeUnit||'')}${bad?' '+P.b('ثبت با '+esc(x.unit),'warning'):''}`,T((c(x)||0)*x.qty),esc(x.by),esc(x.note),x.raw?.invoiceId?'':voidBtn('receipt',x.id)]}))})}`}
function wasteReal(){const m=M(),rows=m.wastes.filter(x=>x.day>=DAYS60()).sort((a,b)=>b.day-a.day),val=x=>(m.costAt(x.item,x.date)||0)*x.qty,seen=new Set;
 return srcLine()+`<div class="grid grid-4">${P.kpi({label:'پرتی ۶۰ روز اخیر',icon:'trash-2',value:RT.money(rows.filter(x=>!x.auth).reduce((a,x)=>a+val(x),0)),unit:'تومان',foot:`${fa(rows.filter(x=>!x.auth).length)} ثبت`})}${P.kpi({label:'مصرف مجاز',icon:'utensils',value:RT.money(rows.filter(x=>x.auth).reduce((a,x)=>a+val(x),0)),unit:'تومان',foot:'پرسنل، تعویض روغن، سر میز'})}${P.kpi({label:'مشکوک به خطای واحد',icon:'scale',value:fa(rows.filter(x=>!x.auth&&/^(kg|l)$/.test(E.UK(m.ing.get(x.item)?.recipeUnit))&&x.qty>=20).length),tone:'danger',foot:'اصلاح دسته‌ای در پنل فعلی: گزارش‌ها ← پرتی'})}${P.kpi({label:'روند و مسئولیت',icon:'chart-column',value:'گزارش‌ها',foot:'انبار ← گزارش‌ها ← پرتی و ضایعات'})}</div>
 ${P.card({title:'ثبت‌های پرتی و مصرف مجاز — ۶۰ روز اخیر',flush:1,body:P.table(['تاریخ','کالا',{t:'مقدار',n:1},'واحد','نوع','علت',{t:'ارزش',n:1},'ثبت‌کننده',''],rows.slice(0,300).map(x=>{const i=m.ing.get(x.item),first=!seen.has(x.id);seen.add(x.id);return[fa(x.date),esc(i?.name||x.item)+(x.fromMenu?`<small class="muted" style="display:block">از ${esc(x.fromMenu)}</small>`:''),q(x.qty,3),esc(i?.recipeUnit||''),x.auth?P.b(x.eventType==='FRYER_OIL_CHANGE'?'تعویض روغن':x.eventType==='TABLE_SERVICE'?'سر میز':'مصرف مجاز','info'):P.b(E.RESP_LABEL[E.responsibility(x)],E.responsibility(x)==='negligence'?'danger':'warning'),`<span class="wrap">${esc(x.reason)}</span>`,T(val(x)),esc(x.by),first?voidBtn('event',x.id):'']}))})}`}
const voidMount=root=>root.addEventListener('click',e=>{const b=e.target.closest('[data-iwv]');if(b)voidForm(b.dataset.iwv,b.dataset.id)});
function reorderReal(){const rows=pos().filter(r=>r.reorderPoint>0).sort((a,b)=>(a.qty??0)/a.reorderPoint-(b.qty??0)/b.reorderPoint);
 return srcLine()+salesGap()+P.card({title:'اقلام دارای نقطهٔ سفارش',sub:'موجودی محاسباتی امروز در برابر نقطهٔ سفارش و موجودی هدف',flush:1,body:P.table(['کالا',{t:'موجودی',n:1},{t:'نقطهٔ سفارش',n:1},{t:'هدف',n:1},{t:'پیشنهاد سفارش',n:1},'وضعیت'],rows.map(r=>[esc(r.name),q(r.qty),q(r.reorderPoint),q(r.target),r.needOrder?`<b>${q(Math.max(0,r.target-(r.qty||0)))} ${esc(r.unit)}</b>`:'—',r.needOrder?P.b('نیازمند سفارش','danger'):P.b('کافی','success')]),{empty:'برای هیچ قلمی نقطهٔ سفارش تعریف نشده است'})})+P.note(`فقط ${fa(rows.length)} قلم نقطهٔ سفارش دارند. پیشنهاد: برای اقلام پرمصرف نقطهٔ سفارش را در «تنظیمات انبار» تعریف کنید.`,'info')}
function catalogReal(){const m=M(),rows=[...m.ing.values()].sort((a,b)=>String(a.name).localeCompare(String(b.name),'fa'));
 return srcLine()+P.card({title:'کاتالوگ کالاها و مواد',sub:'مرجع اصلی (pricing.ingredients)',flush:1,body:P.table(['کد','نام','گروه','نوع','واحد مصرف','واحد خرید',{t:'مقدار بسته',n:1},{t:'آخرین قیمت خرید',n:1},'وضعیت'],rows.slice(0,700).map(i=>[esc(i.code),esc(i.name),esc(i.category),esc(i.itemType||''),esc(i.recipeUnit),esc(i.purchaseUnit),q(Number(i.packageQuantity),3),Number(i.lastPurchasePriceToman)>1?P.t(Number(i.lastPurchasePriceToman)):P.b('بدون قیمت','warning'),i.status==='غیرفعال'?P.b('غیرفعال','neutral'):P.b('فعال','success')]))})}

/* ---------- entry forms (stage 2) ---------- */
const raw=()=>IC.state.raw;
const io={
 load:async()=>{const r=await fetch(E.API_ROOT+'Load?module=inventory&_='+Date.now(),{cache:'no-store',credentials:'omit',headers:{Accept:'application/json'}});if(!r.ok)throw Error(`دریافت انبار از سرور: HTTP ${r.status}`);return E.unwrap(await r.json())},
 save:async doc=>{const r=await fetch(E.API_ROOT+'Save?module=inventory',{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json; charset=utf-8',Accept:'application/json, text/plain, */*'},body:JSON.stringify(doc)});if(!r.ok)throw Error(`ذخیره روی سرور: HTTP ${r.status} ${(await r.text()).slice(0,200)}`)},
 actor:()=>ses('rayo_admin_user'),pricing:()=>raw().pricing};
// shared by menu-real.js: io (module) and apply(doc) default to the inventory module
async function run(btn,{action,details,mutate,done,io:mio=io,apply=doc=>IC.attach({...raw(),inventory:doc,source:'live'})}){const label=btn.innerHTML;btn.disabled=true;btn.innerHTML=P.ic('loader')+'ذخیره و تأیید روی سرور…';RT.icons();
 try{const {out,doc}=await W.edit(mio,{action,details,mutate});apply(doc);P.close();P.render();P.toast(done(out),'check')}
 catch(e){const el=document.getElementById('iwErr');if(el)el.textContent=e.message||String(e);P.toast(e.message||String(e),'alert-triangle');if(W.state.uncertain){P.close();P.render()}}
 finally{if(document.body.contains(btn)){btn.disabled=false;btn.innerHTML=label;RT.icons()}}}
function formModal({title,body,ok='ذخیره',size='',onMount,onSave,can=canWrite,why=whyLocked}){
 P.modal({title,size,body:`<form id="iwForm" class="stack" style="gap:var(--s4)" onsubmit="return false">${body}<div id="iwErr" class="neg" role="alert" style="font-size:13px"></div></form>`,
  foot:`<button class="btn btn-ghost" data-close>انصراف</button><button class="btn btn-primary" id="iwOk">${P.ic('check')}${ok}</button>`,
  onMount:m=>{onMount&&onMount(m);const b=P.$('#iwOk',m);b.onclick=e=>{e.preventDefault();P.$('#iwErr',m).textContent='';if(!can())return P.$('#iwErr',m).textContent=why();try{onSave(m,b)}catch(err){P.$('#iwErr',m).textContent=err.message}}}})}
const val=(m,n)=>P.$(`[name=${n}]`,m)?.value??'';
const dateField=(label='تاریخ')=>P.field(label,`<input class="input num" name="date" value="${fa(E.CAL.today)}" placeholder="۱۴۰۵/۰۸/۱۷">`);
const shiftField=()=>P.field('شیفت',`<select class="select" name="shift">${W.SHIFTS.map(s=>`<option>${s}</option>`).join('')}</select>`);
const itemLabel=i=>`${i.name}${i.code?' — '+i.code:''}`;
const stockList=()=>[...M().ing.values()].filter(W.stockItem).sort((a,b)=>String(a.name).localeCompare(String(b.name),'fa'));
const menuList=()=>[...M().menu.values()].filter(x=>x.status!=='غیرفعال').sort((a,b)=>String(a.name).localeCompare(String(b.name),'fa'));
const dataList=(id,list)=>`<datalist id="${id}">${list.map(i=>`<option value="${esc(itemLabel(i))}"></option>`).join('')}</datalist>`;
const latin=s=>String(s).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
const pick=(v,list)=>{v=String(v||'').trim();return list.find(i=>itemLabel(i)===v)||list.find(i=>i.name===v)||list.find(i=>i.code&&String(i.code)===latin(v))||null};
const unitOpts=i=>i?W.unitsOf(i).map(u=>`<option value="${esc(u.name)}">${esc(u.name)}${u.factor!==1?` (${fa(u.factor)} ${esc(W.unitName(i))})`:''}</option>`).join(''):'';

function receiptForm(){const list=stockList(),row=()=>`<div class="iw-row"><input class="input" list="iwItems" data-f="item" placeholder="نام یا کد کالا" aria-label="کالا"><input class="input num" data-f="qty" inputmode="decimal" placeholder="مقدار" aria-label="مقدار"><select class="select" data-f="unit" aria-label="واحد"></select><input class="input" data-f="note" placeholder="توضیح (اختیاری)" aria-label="توضیح"><button type="button" class="btn btn-ghost btn-sm btn-icon" data-del aria-label="حذف ردیف">${P.ic('x')}</button></div>`;
 formModal({title:'ثبت ورود به انبار',size:'wide',ok:'ذخیره روی سرور',body:`${dataList('iwItems',list)}<div class="form-grid">${dateField('تاریخ ورود')}</div><div id="iwRows" class="stack" style="gap:8px">${row()}${row()}${row()}</div><button type="button" class="btn btn-ghost btn-sm" id="iwAdd" style="align-self:flex-start">${P.ic('plus')}ردیف جدید</button>${P.note('ورود بدون قیمت ثبت می‌شود، مثل «ورود به انبار» پنل فعلی. قیمت خرید از فاکتور و قیمت‌گذاری می‌آید. مقدار به واحد خرید (مثلاً کارتن) خودکار به واحد انبار تبدیل می‌شود.','info')}`,
  onMount:m=>{const rows=P.$('#iwRows',m);P.$('#iwAdd',m).onclick=()=>{rows.insertAdjacentHTML('beforeend',row());RT.icons()};rows.addEventListener('click',e=>{const b=e.target.closest('[data-del]');if(b&&rows.children.length>1)b.closest('.iw-row').remove()});rows.addEventListener('change',e=>{if(e.target.dataset.f==='item')e.target.closest('.iw-row').querySelector('[data-f=unit]').innerHTML=unitOpts(pick(e.target.value,list))})},
  onSave:(m,btn)=>{const date=E.D(val(m,'date')),lines=[...m.querySelectorAll('.iw-row')].map(r=>({v:r.querySelector('[data-f=item]').value.trim(),q:r.querySelector('[data-f=qty]').value.trim(),u:r.querySelector('[data-f=unit]').value,n:r.querySelector('[data-f=note]').value})).filter(x=>x.v||x.q).map((x,k)=>{const i=pick(x.v,list);if(!i)throw Error(`ردیف ${fa(k+1)}: کالا را از فهرست انتخاب کنید`);return{itemId:i.id,quantity:x.q,unit:x.u,note:x.n}});
   if(!lines.length)throw Error('حداقل یک ردیف وارد کنید');const warn=W.receiptWarnings(raw().inventory,raw().pricing,date,W.receiptLines(raw().pricing,lines));if(warn.length&&!confirm(warn.join('\n')+'\n\nبا همین مقادیر ذخیره شود؟'))return;
   run(btn,{action:'RECEIPT_BATCH_ADDED',details:{date,lines:lines.length},mutate:(d,c)=>W.addReceipts(d,c,{date,lines}),done:o=>`${fa(o.count)} ورود ثبت و روی سرور تأیید شد`})}})}

function eventForm(){const ings=stockList(),menus=menuList(),types=Object.entries(W.EVENT_LABELS).filter(([k])=>k!=='FRYER_OIL_CHANGE');
 formModal({title:'ثبت پرتی یا مصرف مجاز',ok:'ذخیره روی سرور',body:`${dataList('iwIng',ings)}${dataList('iwMenu',menus)}
  <div class="form-grid">${dateField()}${P.field('نوع رویداد',`<select class="select" name="type">${types.map(([k,l])=>`<option value="${k}">${esc(l)}</option>`).join('')}</select>`)}${P.field('نوع مورد','<select class="select" name="kind"><option value="ingredient">مادهٔ اولیه</option><option value="menu">آیتم منو (کسر طبق رسپی)</option></select>')}${shiftField()}</div>
  <div class="form-grid">${P.field('مورد','<input class="input" name="item" list="iwIng" placeholder="نام یا کد">')}${P.field('مقدار','<input class="input num" name="qty" inputmode="decimal">')}${P.field('واحد','<select class="select" name="unit"></select>')}</div>
  ${P.field('علت','<input class="input" name="reason" placeholder="مثلاً سوختگی، تاریخ‌گذشته، افتادن">')}${P.field('توضیح','<textarea class="textarea" name="notes" rows="2"></textarea>')}${P.note('ثبت مدیر «تأییدشده» ذخیره می‌شود. جریمهٔ پرسنل و خرابی اموال از پنل فعلی ثبت می‌شوند.','info')}`,
  onMount:m=>{const k=P.$('[name=kind]',m),it=P.$('[name=item]',m),u=P.$('[name=unit]',m);k.onchange=()=>{const menu=k.value==='menu';it.setAttribute('list',menu?'iwMenu':'iwIng');it.value='';u.innerHTML=menu?'<option>عدد</option>':''};it.onchange=()=>{if(k.value!=='menu')u.innerHTML=unitOpts(pick(it.value,ings))}},
  onSave:(m,btn)=>{const menu=val(m,'kind')==='menu',x=pick(val(m,'item'),menu?menus:ings);if(!x)throw Error('مورد را از فهرست انتخاب کنید');const input={date:E.D(val(m,'date')),eventType:val(m,'type'),type:menu?'menu':'ingredient',itemId:x.id,quantity:val(m,'qty'),unit:val(m,'unit'),shift:val(m,'shift'),reason:val(m,'reason'),notes:val(m,'notes')};
   run(btn,{action:'INVENTORY_EVENT_ADDED',details:{eventType:input.eventType,type:input.type,itemId:x.id,date:input.date},mutate:(d,c)=>W.addEvent(d,c,input),done:r=>`${W.EVENT_LABELS[r.eventType]} «${x.name}» ثبت و تأیید شد`})}})}

function oilForm(){const s=W.oilSettings(raw().inventory,raw().pricing),oil=M().ing.get(s.ingredientId);
 formModal({title:'ثبت تعویض روغن سرخ‌کن',ok:'ذخیره روی سرور',body:`${oil?'':P.note('قلم «روغن سرخ‌کردنی» در تنظیمات انبار مشخص نیست؛ ابتدا در پنل فعلی (انبار ← تنظیمات ← سرخ‌کن‌ها) تعیین کنید.','alert-triangle')}
  <div class="form-grid">${dateField()}${P.field('سرخ‌کن',`<select class="select" name="fryer">${s.fryers.map(f=>`<option value="${esc(f.id)}">${esc(f.name)} — ${fa(f.liters)} لیتر</option>`).join('')}</select>`)}${P.field('نوع','<select class="select" name="kind"><option value="FULL">تعویض کامل</option><option value="TOP_UP">افزودن روغن</option></select>')}${P.field('لیتر','<input class="input num" name="liters" inputmode="decimal">','تعویض کامل: خالی = گنجایش سرخ‌کن')}${shiftField()}</div>
  ${P.field('توضیح','<textarea class="textarea" name="notes" rows="2"></textarea>')}${P.note(`هر لیتر ${fa(s.density)} کیلو حساب می‌شود و به‌عنوان «مصرف مجاز — تعویض روغن» از «${esc(oil?.name||'روغن سرخ‌کردنی')}» کم می‌شود.${s.logFrom?` از ${fa(s.logFrom)} روغن سرخ‌کن از رسپی کم نمی‌شود.`:''}`,'info')}`,
  onSave:(m,btn)=>{const input={date:E.D(val(m,'date')),fryerId:val(m,'fryer'),kind:val(m,'kind'),liters:val(m,'liters'),shift:val(m,'shift'),notes:val(m,'notes')};
   run(btn,{action:'FRYER_OIL_CHANGE_ADDED',details:{fryerId:input.fryerId,kind:input.kind,date:input.date},mutate:(d,c)=>W.addOilChange(d,c,input),done:r=>`${r.reason} ثبت شد (${fa(r.quantity)} کیلو)`})}})}

function countForm(){const list=stockList(),vals=new Map,units=new Map,cats=[...new Set(list.map(i=>i.category).filter(Boolean))].sort();let qf='',cat='',info=null;
 formModal({title:'ثبت شمارش موجودی (پایان روز)',size:'wide',ok:'ذخیره روی سرور',body:`<div class="form-grid">${dateField('تاریخ شمارش')}${P.field('یادداشت','<input class="input" name="note" placeholder="مثلاً شمارش هفتگی">')}</div>
  <div id="iwInfo"></div><div class="row" style="gap:8px;flex-wrap:wrap;align-items:center"><input class="input" id="iwQ" placeholder="جستجوی کالا" style="width:200px"><select class="select" id="iwCat" style="width:auto"><option value="">همهٔ گروه‌ها</option>${cats.map(c=>`<option>${esc(c)}</option>`).join('')}</select><span class="muted" id="iwN"></span></div>
  <div id="iwList" style="max-height:50vh;overflow:auto"></div>${P.note('شمارش کور: موجودی محاسباتی نمایش داده نمی‌شود. فقط اقلامی که مقدار دارند ثبت می‌شوند و بقیه از شمارش قبلی خودشان ادامه می‌دهند. مقدار صفر یعنی «شمرده شد و نیست».','info')}`,
  onMount:m=>{const L=P.$('#iwList',m),N=P.$('#iwN',m);
   const showInfo=()=>{const d=E.D(val(m,'date'));info=d&&E.CAL.i(d)!==null?W.countInfo(raw().inventory,d):null;P.$('#iwInfo',m).innerHTML=!info?'':info.later.length?P.note(`<b>بعد از این تاریخ شمارش کل ثبت شده است.</b> شمارش با تاریخ قبلی را از پنل فعلی ثبت کنید تا مغایرت شمارش‌های بعدی بازمحاسبه شود.`,'alert-triangle'):info.counted.size?P.note(`در این تاریخ ${fa(info.counted.size)} قلم قبلاً شمرده شده است؛ مقدار جدید جایگزین می‌شود و مقدار قبلی در سابقهٔ شمارش می‌ماند.`,'info'):'';draw()};
   const draw=()=>{const rows=list.filter(i=>(!cat||i.category===cat)&&(!qf||`${i.name} ${i.code}`.toLowerCase().includes(qf.toLowerCase())));
    L.innerHTML=P.table(['کالا','گروه',{t:'مقدار شمارش',n:1},'واحد'],rows.slice(0,400).map(i=>{const prev=info?.counted.get(i.id)?.line;return[P.cellMain(esc(i.name),esc(i.code||'')),esc(i.category||''),`<input class="input num" style="width:110px" data-c="${esc(i.id)}" inputmode="decimal" value="${esc(vals.get(i.id)||'')}" placeholder="${prev?'قبلی: '+q(Number(prev.actual),3):''}" aria-label="شمارش ${esc(i.name)}">`,`<select class="select" style="width:auto" data-u="${esc(i.id)}">${unitOpts(i).replace(`value="${esc(units.get(i.id)||'')}"`,`value="${esc(units.get(i.id)||'')}" selected`)}</select>`]}),{empty:'موردی پیدا نشد'})+(rows.length>400?`<p class="muted" style="padding:8px">۴۰۰ ردیف اول؛ جستجو را دقیق‌تر کنید</p>`:'');count()};
   const count=()=>{N.textContent=`${fa([...vals.values()].filter(v=>v!=='').length)} قلم وارد شده`};
   L.addEventListener('input',e=>{const id=e.target.dataset.c;if(id){vals.set(id,e.target.value.trim());count()}});L.addEventListener('change',e=>{const id=e.target.dataset.u;if(id)units.set(id,e.target.value)});
   P.$('#iwQ',m).oninput=e=>{qf=e.target.value;draw()};P.$('#iwCat',m).onchange=e=>{cat=e.target.value;draw()};P.$('[name=date]',m).onchange=showInfo;showInfo()},
  onSave:(m,btn)=>{const date=E.D(val(m,'date')),entries=[...vals].filter(([,v])=>v!=='').map(([id,v])=>({itemId:id,quantity:v,unit:units.get(id)||''}));if(!entries.length)throw Error('حداقل یک مقدار شمارش وارد کنید');
   if(!confirm(`شمارش ${fa(entries.length)} قلم برای پایان روز ${fa(date)} ذخیره شود؟`))return;
   run(btn,{action:'WHOLE_COUNT_SAVED',details:{date,lines:entries.length},mutate:(d,c)=>W.addCount(d,c,{date,entries,note:val(m,'note')}),done:o=>`شمارش ${fa(o.count)} قلم ثبت شد${o.replaced?` (${fa(o.replaced)} قلم جایگزین شد)`:''}`})}})}

function voidForm(kind,id){const doc=raw().inventory,r=kind==='receipt'?A(doc.stockReceipts).find(x=>x.id===id):W.findEvent(doc,id);if(!r)return;const i=M().ing.get(r.ingredientId||r.itemId)||M().menu.get(r.itemId);
 formModal({title:kind==='receipt'?'ابطال ورود انبار':'ابطال ثبت پرتی / مصرف',ok:'ابطال روی سرور',body:`<div class="sum-box"><span>${esc(i?.name||r.itemNameSnapshot||'—')} · ${fa(r.date)}${r.eventType?' · '+esc(W.EVENT_LABELS[r.eventType]||r.eventType):''}</span><b>${q(Number(r.quantity),3)} ${esc(r.unitSnapshot||(r.type==='menu'?'عدد':i?.recipeUnit)||'')}</b></div>${P.field('علت ابطال *','<textarea class="textarea" name="reason" rows="2"></textarea>')}${P.note('رکورد حذف نمی‌شود: وضعیتش «باطل» می‌شود و نسخهٔ قبل از ابطال با نام شما در سابقه می‌ماند. مغایرت شمارش‌های بعدی در ذخیرهٔ بعدی پنل فعلی یا با «بازمحاسبه همه» به‌روز می‌شود.','info')}`,
  onSave:(m,btn)=>{const reason=val(m,'reason');if(!canVoid())throw Error('ابطال فقط برای کاربر دارای دسترسی «ویرایش، ابطال و بازگردانی ثبت‌های انبار» مجاز است');
   run(btn,{action:kind==='receipt'?'RECEIPT_VOIDED':'INVENTORY_EVENT_VOIDED',details:{entityId:id,reason},mutate:(d,c)=>kind==='receipt'?W.voidReceipt(d,c,{id,reason}):W.voidEvent(d,c,{id,reason}),done:()=>'ابطال ثبت و روی سرور تأیید شد'})}})}
window.InvEntry={receipt:receiptForm,event:eventForm,oil:oilForm,count:countForm,void:voidForm,canWrite,canVoid,
 // shared with menu-real.js
 formModal,run,allowed,live,ses,dataList,latin};

/* ---------- wiring: real view when connected, sample + hint otherwise ---------- */
const hint=()=>P.note(`این صفحه <b>دادهٔ نمونه</b> است. برای دیدن دادهٔ واقعی، در «داشبورد کنترل» به دادهٔ انبار وصل شوید. <a href="#/inventory/control">اتصال</a>`,'database');
const viaIC=view=>({render:()=>srcLine()+'<div id="rvHost"></div>',mount:root=>IC.render(view,P.$('#rvHost',root),v=>P.go('#/inventory/reports'))});
const REAL={stock:{render:stockReal,mount:stockMount},receipt:{render:receiptReal,mount:voidMount},waste:{render:wasteReal,mount:voidMount},count:viaIC('counts'),beverage:viaIC('bev'),reorder:{render:reorderReal},sales:viaIC('sales'),consumption:viaIC('oil'),catalog:{render:catalogReal}};
const btn=(icon,label,fn,secondary)=>canWrite()?`<button class="btn ${secondary?'btn-secondary':'btn-primary'}" onclick="${fn}">${P.ic(icon)}${label}</button>`:`<button class="btn btn-secondary" disabled title="${esc(whyLocked())}">${P.ic('lock')}${label}</button>`;
const ACTIONS={receipt:()=>btn('package-plus','ثبت ورود','InvEntry.receipt()'),waste:()=>btn('droplet','تعویض روغن','InvEntry.oil()',1)+btn('trash-2','ثبت پرتی / مصرف','InvEntry.event()'),count:()=>btn('clipboard-list','ثبت شمارش','InvEntry.count()')};
for(const [id,v] of Object.entries(REAL)){const t=inv.tabs.find(x=>x.id===id);if(!t)continue;const r0=t.render,m0=t.mount,a0=t.actions;
 t.render=r=>IC.ready()?v.render(r):hint()+r0(r);
 t.mount=(root,r)=>{if(IC.ready()){v.mount&&v.mount(root,r)}else m0&&m0(root,r)};
 if(a0||ACTIONS[id])t.actions=r=>IC.ready()?(ACTIONS[id]?ACTIONS[id]():`<button class="btn btn-secondary" disabled title="ثبت این بخش روی دادهٔ واقعی هنوز فعال نیست">${P.ic('lock')}ثبت — مرحلهٔ بعد</button>`):(a0?a0(r):'');}
/* stock tab badge = items needing order (real) */
const ro=inv.tabs.find(x=>x.id==='reorder');if(ro){const b0=ro.badge;ro.badge=()=>IC.ready()?pos().filter(r=>r.needOrder).length:(b0?b0():0)}
const st=inv.tabs.find(x=>x.id==='stock');if(st)st.badge=()=>IC.ready()?pos().filter(r=>r.needOrder).length:0;
inv.badge=()=>IC.ready()?pos().filter(r=>r.flags.has('negative')).length:D.ITEMS.filter(i=>i.qty<i.min).length;
})();
