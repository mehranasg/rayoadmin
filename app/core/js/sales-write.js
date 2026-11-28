/* =========================================================
   Rayo UI Template — sales-write.js
   Sales from the Sepidz/Snapp «تعداد فروش کالا» Excel file for a source and a date range (stage 11), with the rules and
   record shapes of the current panel (js/14 buildSalesImport / confirmSalesImport, js/18 readBest):
     - header row found by aliases (title rows above the table are fine); «کد کالا»، «نام کالا»، «تعداد» required,
       «تاریخ» optional (then each day is its own sales period), «مبلغ فروش» optional
     - match by code; a code shared by several items is resolved by name; a missing code falls back to a unique name;
       an unknown code can be added to the menu from the preview (price suggested from the online menu, thousand Toman)
     - a period that overlaps a non-void sales period of the same source is refused (void the old one first)
     - sales lines keep the sale price as a snapshot; recipe usage is spread over the days by the inventory engine
   Saving: new menu items first (pricing), then inventory.salesPeriods — each through InvWrite.edit. Void, never delete.
   ========================================================= */
(function(){
'use strict';
const A=x=>Array.isArray(x)?x:[];
const S=x=>String(x??'').trim();
const en=s=>String(s??'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d));
const NUM=v=>{if(typeof v==='number')return v;const n=Number(en(v).replace(/٫/g,'.').replace(/[٬,،\s]/g,'').replace(/[^\d.-]/g,''));return Number.isFinite(n)?n:0};
const D=v=>window.InvEngine.D(v);
const norm=v=>S(v).replace(/‌/g,' ').replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/[\sـ_\-\/\\()\[\]،,:؛.؟?!]/g,'').toLowerCase();
const salesNorm=v=>S(v).replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/\s+/g,'').toLowerCase();
const salesCode=v=>en(S(v)).replace(/\.0+$/,'');
const salesFa=v=>S(v).replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/\s+/g,' ');
const SOURCES=[['SEPIDZ','سپیدز'],['SNAPP','اسنپ‌فود']];
const sourceOf=x=>S(x?.salesSource||x?.source||'SEPIDZ').toUpperCase()==='SNAPP'?'SNAPP':'SEPIDZ';
const sourceLabel=k=>(SOURCES.find(s=>s[0]===k)||SOURCES[0])[1];

/* ---------- Excel (js/18) ---------- */
let xlsxPromise=null;
function loadXLSX(){if(window.XLSX)return Promise.resolve(window.XLSX);if(xlsxPromise)return xlsxPromise;
 xlsxPromise=new Promise(async(resolve,reject)=>{for(const src of ['vendor/xlsx.full.min.js','https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js','https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js']){try{await new Promise((ok,fail)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=fail;document.head.appendChild(s)});if(window.XLSX)return resolve(window.XLSX)}catch(_){}}xlsxPromise=null;reject(Error('کتابخانهٔ خواندن Excel بارگذاری نشد؛ اتصال اینترنت را بررسی کنید'))});return xlsxPromise}
function findCol(headers,aliases){const hs=headers.map(norm),as=aliases.map(norm);return hs.findIndex(h=>h&&as.some(a=>a&&(h===a||h.includes(a)||a.includes(h))))}
// rows: array of arrays (one workbook sheet each) — the best header row in the first 30 rows wins
function bestTable(sheets,spec,scan=30){let best=null;for(const [sheetName,rows] of sheets){for(let r=0;r<Math.min(scan,rows.length);r++){const headers=(rows[r]||[]).map(S),map={},missing=[];let score=0;for(const [key,cfg] of Object.entries(spec)){const idx=findCol(headers,cfg.aliases);map[key]=idx;if(idx>=0)score+=cfg.weight||1;else if(cfg.required)missing.push(key)}const c={sheetName,rows,headerRow:r,headers,map,score,missing};if(!best||(!c.missing.length&&best.missing.length)||c.score>best.score)best=c}}return best}
const SPEC={date:{aliases:['تاریخ','تاریخ فروش']},code:{aliases:['کد کالا','کد آیتم','کد'],required:true,weight:4},name:{aliases:['نام کالا','نام آیتم','شرح'],weight:2},quantity:{aliases:['تعداد','تعداد فروش','مقدار فروش','qty'],required:true,weight:4},amount:{aliases:['مبلغ فروش','جمع مبلغ','مبلغ']}};
const LABEL={code:'کد کالا',quantity:'تعداد',name:'نام کالا'};
function tableFrom(sheets){const best=bestTable(sheets,SPEC);if(!best||best.missing.length)throw Error(`ستون‌های الزامی Excel پیدا نشد${best?.missing?.length?': '+best.missing.map(k=>LABEL[k]||k).join('، '):''}`);const data=best.rows.slice(best.headerRow+1).filter(r=>r.some(v=>S(v)!==''));return{...best,data,get:(row,key)=>best.map[key]>=0?row[best.map[key]]:''}}
async function readFile(file){const XLSX=await loadXLSX(),wb=XLSX.read(await file.arrayBuffer(),{type:'array',raw:false,cellDates:false});return tableFrom(wb.SheetNames.map(n=>[n,XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,raw:false,defval:'',blankrows:false})]))}

/* ---------- matching and preview (js/14) ---------- */
const overlap=(a1,a2,b1,b2)=>{a1=D(a1);a2=D(a2)||a1;b1=D(b1);b2=D(b2)||b1;return !!a1&&!!b1&&a1<=b2&&b1<=a2};
function conflicts(inv,source,from,to){return A(inv?.salesPeriods).filter(x=>x.status!=='void'&&!x.isArchived&&sourceOf(x)===source&&overlap(from,to,x.from||x.date,x.to||x.date))}
function matchMenu(items,code,name){const n=salesNorm(name),one=list=>{if(list.length===1)return list[0];const act=list.filter(m=>m.status!=='غیرفعال');return act.length===1?act[0]:null};
 const byCode=code?items.filter(m=>salesCode(m.code)===code):[];if(byCode.length===1)return{m:byCode[0]};
 if(byCode.length){if(n){const exact=one(byCode.filter(m=>salesNorm(m.name)===n));if(exact)return{m:exact};const pre=one(byCode.filter(m=>{const k=salesNorm(m.name);return k&&(k.startsWith(n)||n.startsWith(k))}));if(pre)return{m:pre}}return{reason:`کد ${code} برای ${byCode.length} آیتم منو تکرار شده و نام فایل با هیچ‌کدام یکتا تطبیق ندارد`}}
 if(n){const byName=one(items.filter(m=>salesNorm(m.name)===n));if(byName)return{m:byName,byName:true}}
 return{reason:code?'کد در آیتم‌های منو پیدا نشد':'کد و نام مطابق ندارد',creatable:!!code}}
const salePrice=m=>NUM(m?.currentPriceToman);
function build(t,fileName,form,{inventory,pricing}){const items=A(pricing?.menuItems),menu=new Map(items.map(m=>[m.id,m])),hasDate=t.map.date>=0,hasAmount=t.map.amount>=0,groups=new Map,unmatched=[],fresh=new Map;let rows=0,zero=0;
 for(const row of t.data){const code=salesCode(t.get(row,'code')),name=S(t.get(row,'name')),q=NUM(t.get(row,'quantity'));if(!code&&!name)continue;rows++;
  if(q<0){unmatched.push({code,name,q,reason:'تعداد منفی'});continue}if(!(q>0)){zero++;continue}
  let key=`${form.from}|${form.to}`;if(hasDate){const d=D(t.get(row,'date'));if(!d){unmatched.push({code,name,q,reason:'تاریخ ردیف نامعتبر است'});continue}if(d<form.from||d>form.to){unmatched.push({code,name,q,reason:`تاریخ ${d} خارج از بازه است`});continue}key=`${d}|${d}`}
  const r=matchMenu(items,code,name);if(!r.m){if(r.creatable){const c=fresh.get(code)||{code,name,quantity:0,keys:new Set};c.quantity+=q;c.keys.add(key);fresh.set(code,c)}else unmatched.push({code,name,q,reason:r.reason});continue}
  const g=groups.get(key)||new Map,l=g.get(r.m.id)||{menuItemId:r.m.id,quantity:0,amount:0,codes:new Set,names:new Set,byName:false};l.quantity+=q;l.amount+=hasAmount?NUM(t.get(row,'amount')):0;if(code)l.codes.add(code);if(name)l.names.add(name);l.byName=l.byName||!!r.byName;g.set(r.m.id,l);groups.set(key,g)}
 const periods=[...groups].map(([key,g])=>{const [from,to]=key.split('|');const lines=[...g.values()].map(l=>{const price=l.amount>0?l.amount/l.quantity:salePrice(menu.get(l.menuItemId));return{menuItemId:l.menuItemId,quantity:l.quantity,salePriceToman:price,saleAmountToman:l.amount>0?l.amount:l.quantity*price,sourceCode:[...l.codes].join('، '),sourceName:[...l.names].join('، '),...(l.byName?{matchedBy:'name'}:{})}});return{from,to,lines,conflicts:conflicts(inventory,form.source,from,to)}}).sort((a,b)=>a.from.localeCompare(b.from));
 const warnings=[];if(periods.some(p=>p.from!==p.to)){const counts=[...new Set(A(inventory?.stocktakes).filter(st=>st.status!=='void'&&!st.isArchived).map(st=>D(st.date)).filter(d=>periods.some(p=>p.from!==p.to&&d>=p.from&&d<p.to)))];if(counts.length)warnings.push(`داخل بازه شمارش انبار ثبت شده است (${counts.join('، ')})؛ فروش بازه به‌طور مساوی روی روزها پخش می‌شود و سهم روزهای بعد از شمارش از موجودی بعد از آن کم می‌شود.`)}
 const newItems=[...fresh.values()].map(c=>({code:c.code,name:c.name,quantity:c.quantity,conflict:[...c.keys].some(k=>{const [a,b]=k.split('|');return conflicts(inventory,form.source,a,b).length>0})}));
 return{...form,fileName,hasDate,rows,zero,unmatched,periods,warnings,newItems,table:t}}

/* ---------- online menu suggestions (js/14) ---------- */
const ONLINE={items:'https://rayocafe.ir/api/data/DineInItems',categories:'https://rayocafe.ir/api/data/DineInCategory'};
let onlineCache=null;
async function onlineMenu(){if(onlineCache)return onlineCache;const get=async u=>{const c=new AbortController(),t=setTimeout(()=>c.abort(),6000);try{const r=await fetch(u,{cache:'no-store',credentials:'omit',signal:c.signal});if(!r.ok)throw Error('HTTP '+r.status);return await r.json()}finally{clearTimeout(t)}};
 const [items,cats]=await Promise.all([get(window.RAYO_TEMPLATE_ONLINE_ITEMS||ONLINE.items),get(window.RAYO_TEMPLATE_ONLINE_CATS||ONLINE.categories).catch(()=>[])]);if(!Array.isArray(items))throw Error('ساختار منوی آنلاین معتبر نیست');
 const cat=new Map(A(cats).map(c=>[c.Id,S(c.Title)]));return onlineCache=items.filter(x=>S(x.Title)).map(x=>({title:S(x.Title),priceToman:Math.round(NUM(x.Price)*1000),category:cat.get(x.CategoryId)||'',enabled:x.Enable!==false}))}
const tokens=v=>salesFa(v).replace(/[‌ً-ْ]/g,' ').split(/[^\p{L}\p{N}]+/u).filter(x=>x&&x!=='و'&&x!=='با');
function onlineMatch(name,list){const a=new Set(tokens(name));if(!a.size)return null;let best=null,second=0;for(const o of A(list)){const b=new Set(tokens(o.title));if(!b.size)continue;let common=0;a.forEach(x=>{if(b.has(x))common++});if(!common)continue;const jac=common/(a.size+b.size-common),score=common===Math.min(a.size,b.size)?0.5+jac/2:jac;if(!best||score>best.score){second=best?best.score:0;best={o,score}}else if(score>second)second=score}return best&&best.score>=0.6&&best.score>second?best.o:null}
function categories(pricing){const l=[...new Set(A(pricing?.lists?.menuCategories).map(S).filter(Boolean))];return l.length?l:['سایر']}
function suggest(p,list,pricing){const cats=categories(pricing);for(const n of p.newItems){const o=list?onlineMatch(n.name,list):null;n.online=o;n.priceToman=o?.priceToman||0;n.category=(o&&cats.find(c=>salesNorm(c)===salesNorm(o.category)))||cats.find(c=>c==='سایر')||cats[0]}}
function newMenuId(items,code){const ids=new Set(A(items).map(m=>S(m.id))),own=`MENU-${code}`;if(code&&/^[\w-]+$/.test(code)&&!ids.has(own))return own;let max=0;ids.forEach(x=>{const m=x.match(/(\d+)$/);if(m)max=Math.max(max,+m[1])});let i=max+1;while(ids.has(`MENU-${String(i).padStart(4,'0')}`))i++;return `MENU-${String(i).padStart(4,'0')}`}

/* ---------- records ---------- */
// pricing: new menu items picked in the preview [{code,name,category,price,online}]
function addMenuItems(pr,ctx,{picks,fileName}){pr.menuItems=A(pr.menuItems);const out=[];for(const x of A(picks)){if(!S(x.name))throw Error(`نام آیتم جدید با کد ${x.code} الزامی است`);if(!(NUM(x.price)>0))throw Error(`قیمت فروش «${x.name}» را وارد کنید`);if(pr.menuItems.some(m=>salesCode(m.code)===salesCode(x.code)))continue;
 const item={id:newMenuId(pr.menuItems,x.code),code:x.code,name:S(x.name),category:S(x.category)||'سایر',currentPriceToman:NUM(x.price),customTargetCostPercent:0,manualCostToman:0,manualCostEnabled:true,status:'فعال',unit:'عدد',siteStatus:x.online?.enabled?'فعال':'غیرفعال',labelPriceOnly:false,notes:'',lastPriceChangeAt:ctx.at,createdAt:ctx.at,createdBy:ctx.actor,createdFrom:'sales-excel',sourceFile:S(fileName)};pr.menuItems.push(item);out.push(item)}
 ctx.auditExtra={created:out.map(x=>x.id)};return out}
// inventory: the preview is rebuilt against the fresh documents inside the save, so a conflict saved meanwhile is caught
function addSales(inv,ctx,{p,pricing}){const CAL=window.InvEngine.CAL;if(CAL.i(p.from)===null||CAL.i(p.to)===null||p.from>p.to)throw Error('بازهٔ تاریخ نامعتبر است (مثلاً مهر ۳۰ روز دارد)');const q=build(p.table,p.fileName,{source:p.source,from:p.from,to:p.to,reference:p.reference},{inventory:inv,pricing});
 if(q.periods.some(x=>x.conflicts.length))throw Error('برای این بازه فروش همین منبع ثبت شده است؛ ابتدا سند قبلی را ابطال کنید');if(!q.periods.length)throw Error('ردیف قابل ثبتی نماند');
 inv.salesPeriods=A(inv.salesPeriods);const pre=p.source==='SNAPP'?'SNAPP-XLS':'SALE-XLS',added=q.periods.map((x,k)=>({id:`${pre}-${ctx.reqId}-${k+1}`,from:x.from,to:x.to,date:x.from===x.to?x.from:'',reference:S(p.reference)||`Excel ${sourceLabel(p.source)}: ${p.fileName}`,salesSource:p.source,source:p.source,sourceFile:p.fileName,importSummary:{rows:q.rows,unmatched:q.unmatched.length+q.newItems.length,zero:q.zero,createdMenuItems:A(p.createdIds)},lines:x.lines,status:'posted',createdAt:ctx.at,createdBy:ctx.actor}));
 inv.salesPeriods.push(...added);ctx.auditExtra={periods:added.map(x=>x.id),lines:added.reduce((a,x)=>a+x.lines.length,0),source:p.source,from:p.from,to:p.to};return{added,unmatched:q.unmatched.length,newLeft:q.newItems.length}}
function voidSales(inv,ctx,{id,reason}){const x=A(inv.salesPeriods).find(r=>r.id===id);if(!x)throw Error('سند فروش پیدا نشد');if(x.status==='void')throw Error('این سند قبلاً ابطال شده است');ctx.auditExtra={entityId:id,before:{status:x.status},reason:S(reason)};Object.assign(x,{status:'void',voidedAt:ctx.at,voidedBy:ctx.actor,...(S(reason)?{voidReason:S(reason)}:{})});return x}

window.SalesWrite={SOURCES,sourceOf,sourceLabel,readFile,tableFrom,build,conflicts,onlineMenu,onlineMatch,suggest,categories,newMenuId,addMenuItems,addSales,voidSales,NUM};
})();
