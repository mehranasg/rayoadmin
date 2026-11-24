/* =========================================================
   Rayo UI Template — inventory-engine.js
   Read-only analysis engine for the inventory control template.
   Loads live modules with GET RayoData/Load (only works when served from rayocafe.ir — CORS),
   or from JSON files chosen by the user. It never calls Save/Mutate (entries are written by inventory-write.js).
   ========================================================= */
(function(){
'use strict';
// API origin: the live RayoData service; a local test server may set window.RAYO_TEMPLATE_API before this file loads
const API_ROOT=`${String(window.RAYO_TEMPLATE_API||'https://chat.yekzan.com').replace(/\/+$/,'')}/api/v1.0/RayoData/`,API=API_ROOT+'Load?module=';
const A=x=>Array.isArray(x)?x:[];
const S=x=>String(x??'').trim();
const N=v=>{const n=Number(String(v??'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٬,]/g,''));return Number.isFinite(n)?n:0};
const D=v=>{const z=S(v).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/\D/g,'');return z.length===8?`${z.slice(0,4)}/${z.slice(4,6)}/${z.slice(6,8)}`:''};
const UK=v=>({kg:'kg','کیلو':'kg','کیلوگرم':'kg',g:'g','گرم':'g',l:'l','لیتر':'l',ml:'ml','میلیلیتر':'ml','سیسی':'ml',cc:'ml','عدد':'each','بسته':'pack'})[S(v).toLowerCase().replace(/[\s‌]/g,'')]||S(v);
const MONTHS=['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];

/* ---------- Jalali day index (exact, via Intl) ---------- */
const CAL=(()=>{const fmt=new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn',{year:'numeric',month:'2-digit',day:'2-digit'}),idx=new Map,days=[];const start=Date.UTC(2020,2,1);
 for(let i=0;i<5200;i++){const p=fmt.formatToParts(new Date(start+i*864e5)),g=t=>p.find(x=>x.type===t).value,key=`${g('year')}/${g('month')}/${g('day')}`;idx.set(key,i);days.push(key)}
 const todayKey=(()=>{const p=fmt.formatToParts(new Date()),g=t=>p.find(x=>x.type===t).value;return `${g('year')}/${g('month')}/${g('day')}`})();
 return{i:k=>idx.has(D(k))?idx.get(D(k)):null,k:i=>days[i]||'',today:todayKey}})();
const monthLabel=k=>{const [y,m]=k.split('/');return `${MONTHS[+m-1]} ${y}`};
const monthRange=k=>{const [y,m]=k.split('/').map(Number),first=`${y}/${String(m).padStart(2,'0')}/01`,ny=m===12?y+1:y,nm=m===12?1:m+1,next=`${ny}/${String(nm).padStart(2,'0')}/01`;return{from:first,to:CAL.k(CAL.i(next)-1)}};

/* ---------- Loading ---------- */
function moduleKind(o){if(!o||typeof o!=='object')return'';if(o.stocktakes||o.salesPeriods||o.stockReceipts)return'inventory';if(o.menuItems||o.ingredients)return'pricing';if(o.reports&&o.cashiers)return'cashreport';return''}
function unwrap(o){if(o&&typeof o.data==='string'){try{return JSON.parse(o.data)}catch(_){}}return o&&o.data&&typeof o.data==='object'&&!Array.isArray(o.data)?o.data:o}
async function loadLive(){const get=async m=>{const r=await fetch(API+m+'&_='+Date.now(),{cache:'no-store',credentials:'omit'});if(!r.ok)throw Error(`HTTP ${r.status} (${m})`);return unwrap(await r.json())};const [inventory,pricing,cashreport]=await Promise.all([get('inventory'),get('pricing'),get('cashreport').catch(()=>null)]);return{inventory,pricing,cashreport,source:'live'}}
async function loadUrl(prefix){const get=async f=>{const r=await fetch(prefix+f,{cache:'no-store'});if(!r.ok)throw Error(`HTTP ${r.status} (${f})`);return unwrap(await r.json())};const [inventory,pricing,cashreport]=await Promise.all([get('inventory.json'),get('pricing.json'),get('cashreport.json').catch(()=>null)]);return{inventory,pricing,cashreport,source:'file'}}
async function loadFiles(files){const out={source:'file'};for(const f of files){const o=unwrap(JSON.parse(await f.text()));const cands=[o,o?.modules,o?.data].filter(Boolean);for(const c of cands){if(moduleKind(c))out[moduleKind(c)]=c;for(const k of ['inventory','pricing','cashreport'])if(c[k]&&moduleKind(unwrap(c[k]))===k)out[k]=unwrap(c[k])}}if(!out.inventory||!out.pricing)throw Error('فایل انبار و فایل منو/قیمت هر دو لازم است');return out}

/* ---------- prepared (composite) items: unit conversion and formula → ingredients (gross, recipe unit) ----------
   shared by counts (inventory-write), recipe costing (menu-write) and sales/waste deduction (recipeAt below) */
const NN=v=>{const n=Number(String(v??'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/٫/g,'.').replace(/[٬,\s]/g,''));return Number.isFinite(n)?n:NaN};
/* base-unit renames (MenuWrite.renameBaseUnit, pricing.ingredients[].baseUnitRenames [{from,to}]): a label fixed with factor 1
   (e.g. «عدد» that always meant a litre → «لیتر»); records saved under the old label are the same unit, nothing is converted */
const oldBase=(i,u)=>!!i&&A(i.baseUnitRenames).some(r=>UK(r.from)===UK(u));
const sameUnit=(i,u)=>!u||!i||UK(u)===UK(i.recipeUnit)||oldBase(i,u);
/* factor of a unit to the item's base unit from the item's own units (same rule as InvWrite.unitsOf): base 1, the purchase
   unit (packageQuantity), the active other units (countingUnits, e.g. «۱ عدد = ۹۰۰ گرم») and the standard units any of them
   brings (گرم ↔ کیلوگرم, میلی‌لیتر ↔ لیتر, weight ↔ volume with the density); null when the item does not know the unit */
const STD_F={kg:['m',1],g:['m',0.001],l:['v',1],ml:['v',0.001]};
function unitFactor(i,u){if(!i)return null;const k=UK(u),own=[[i.recipeUnit,1]];if(S(i.purchaseUnit)&&NN(i.packageQuantity)>0)own.push([i.purchaseUnit,NN(i.packageQuantity)]);for(const c of A(i.countingUnits))if(c&&c.active!==false&&S(c.name)&&NN(c.factor)>0)own.push([c.name,NN(c.factor)]);
 const hit=own.find(([n])=>UK(n)===k);if(hit)return hit[1];const sk=STD_F[k];if(!sk)return null;const per={};for(const [n,f] of own){const s=STD_F[UK(n)];if(s&&!per[s[0]])per[s[0]]=f/s[1]}
 const d=NN(i.densityKgPerLiter);if(d>0){if(per.m&&!per.v)per.v=per.m*d;else if(per.v&&!per.m)per.m=per.v/d}return per[sk[0]]?per[sk[0]]*sk[1]:null}
function convertQty(i,qty,from,to){const U=UK;if(oldBase(i,from))from=i.recipeUnit;if(oldBase(i,to))to=i.recipeUnit;const f=U(from),t=U(to);if(!(qty>=0))return{value:null,reason:'مقدار نامعتبر است'};if(f===t)return{value:qty,reason:''};
 // a unit of the item itself (e.g. «عدد» of an oil bought by the bottle, «بسته» of a pack): through its factors
 const fam=u=>u==='kg'||u==='g'?'mass':u==='l'||u==='ml'?'volume':null,ff=fam(f),ft=fam(t);if(!ff||!ft){const a=unitFactor(i,from),b=unitFactor(i,to);return a&&b?{value:qty*a/b,reason:''}:{value:null,reason:`«${S(!a?from:to)}» از واحدهای این ماده نیست؛ در فرم ماده «تبدیل واحد» را بنویسید`}}
 const toB=(q,u)=>u==='g'||u==='ml'?q/1000:q,fromB=(q,u)=>u==='g'||u==='ml'?q*1000:q;if(ff===ft)return{value:fromB(toB(qty,f),t),reason:''};
 const d=Number(i?.densityKgPerLiter);if(!(d>0)){const x=unitFactor(i,from),y=unitFactor(i,to);return x&&y?{value:qty*x/y,reason:''}:{value:null,reason:'چگالی این ماده تعریف نشده است؛ تبدیل حجم و وزن ممکن نیست'}}
 return ff==='volume'?{value:fromB(toB(qty,f)*d,t),reason:''}:{value:fromB(toB(qty,f)/d,t),reason:''}}
function prepConvert(pricing,item,countedQuantity,countedUnit){const qty=NN(countedQuantity),bad=reason=>({complete:false,reason,contributions:[]});
 if(!item)return bad('قلم آماده‌سازی تعریف نشده است');if(item.status==='غیرفعال')return bad(`قلم آماده‌سازی «${item.name}» غیرفعال است`);if(!(qty>=0))return bad(`مقدار شمارش «${item.name}» نامعتبر است`);
 const base=NN(item.baseOutputQuantity);if(!(base>0))return bad(`مقدار مبنای فرمول «${item.name}» نامعتبر است`);if(UK(countedUnit||item.countUnit)!==UK(item.countUnit))return bad(`واحد شمارش «${item.name}» با واحد فرمول متفاوت است`);
 const comps=A(item.components);if(!comps.length)return bad(`فرمول «${item.name}» ماده‌ای ندارد`);const scale=qty/base,out=[];
 for(const c of comps){const i=A(pricing?.ingredients).find(x=>x.id===c.ingredientId);if(!i)return bad(`ماده‌ای در فرمول «${item.name}» در کاتالوگ نیست`);if(i.status==='غیرفعال')return bad(`مادهٔ «${i.name}» در فرمول «${item.name}» غیرفعال است`);
  const cq=NN(c.quantity);if(!(cq>0))return bad(`مقدار «${i.name}» در فرمول «${item.name}» نامعتبر است`);if(c.basis!=='gross'&&c.basis!=='net')return bad(`مبنای مقدار «${i.name}» در فرمول «${item.name}» تعیین نشده است`);
  const cv=convertQty(i,cq*scale,c.unit,i.recipeUnit);if(cv.value===null)return bad(`تبدیل واحد «${i.name}»: ${cv.reason}`);let g=cv.value,yf=null;
  if(c.basis==='net'){const wp=Number(i.wastePercent)||0;if(!(wp>=0&&wp<100))return bad(`درصد افت «${i.name}» معتبر نیست`);yf=1-wp/100;g=g/yf}
  out.push({ingredientId:i.id,ingredientNameSnapshot:i.name,ingredientCodeSnapshot:i.code||'',unit:i.recipeUnit,quantity:g,componentQuantity:cq,componentUnit:c.unit,basis:c.basis,yieldFactorApplied:yf})}
 return{complete:true,reason:'',scale,contributions:out,preparedItemId:item.id,preparedItemNameSnapshot:item.name,preparedItemVersion:item.version||1,baseOutputQuantitySnapshot:base,countUnitSnapshot:item.countUnit}}

/* ---------- Model ---------- */
function build(raw){
 const inv=raw.inventory,pr=raw.pricing,ing=new Map(A(pr.ingredients).map(i=>[i.id,i])),menu=new Map(A(pr.menuItems).map(m=>[m.id,m]));
 const versionsBy=new Map;for(const v of A(pr.recipeVersions)){if(!versionsBy.has(v.menuItemId))versionsBy.set(v.menuItemId,[]);versionsBy.get(v.menuItemId).push(v)}
 for(const l of versionsBy.values())l.sort((a,b)=>D(b.effectiveFrom||'0000/00/00').localeCompare(D(a.effectiveFrom||'0000/00/00'))||S(b.createdAt).localeCompare(S(a.createdAt)));
 const recipesBy=new Map;for(const r of A(pr.recipes)){if(!recipesBy.has(r.menuItemId))recipesBy.set(r.menuItemId,[]);recipesBy.get(r.menuItemId).push(r)}
 const prepBy=new Map(A(pr.preparedItems).map(p=>[p.id,p])),expanded=new Map;
 // a recipe line may name a prepared item (sub-recipe, e.g. 60 g of Caesar sauce): it becomes its ingredients, gross in their
 // recipe unit (wastePercent 0, already applied by the formula); a formula that cannot convert gives a line without an
 // ingredient, so the item shows as an incomplete recipe instead of a wrong deduction
 const expand=lines=>{if(expanded.has(lines))return expanded.get(lines);const out=[];for(const l of A(lines)){if(!l||!l.preparedItemId){out.push(l);continue}const p=prepBy.get(l.preparedItemId),cv=prepConvert(pr,p,NN(l.quantity),l.unit||p?.countUnit);
  if(!cv.complete){out.push({ingredientId:'',preparedItemId:l.preparedItemId,quantity:l.quantity,invalid:cv.reason});continue}for(const c of cv.contributions)out.push({ingredientId:c.ingredientId,quantity:c.quantity,recipeUnit:ing.get(c.ingredientId)?.recipeUnit,wastePercent:0,fromPreparedId:l.preparedItemId,fromPreparedName:p.name})}
  expanded.set(lines,out);return out};
 const recipeAt=(mid,date)=>{const v=A(versionsBy.get(mid)).find(v=>(D(v.effectiveFrom)||'0000/00/00')<=date);return expand(v?A(v.lines):A(recipesBy.get(mid)))};
 // price per recipe unit at a date: purchase history (same recipe unit) → latest catalog price
 const priceBy=new Map;for(const h of A(pr.ingredientPriceHistory)){if(h.isVoided)continue;const i=ing.get(h.ingredientId);if(!i)continue;if(h.recipeUnit&&!sameUnit(i,h.recipeUnit))continue;const d=D(h.date);if(!d)continue;const per=N(h.priceToman)/(N(h.packageQuantity)||N(i.packageQuantity)||1);if(!(per>0))continue;if(!priceBy.has(i.id))priceBy.set(i.id,[]);priceBy.get(i.id).push({d,per,at:S(h.createdAt)})}
 // same-day corrections: the last created entry wins
 for(const l of priceBy.values())l.sort((a,b)=>a.d.localeCompare(b.d)||a.at.localeCompare(b.at));
 const catalog=id=>{const i=ing.get(id),p=N(i?.lastPurchasePriceToman||i?.latestPriceToman),pk=N(i?.packageQuantity)||1;return p>0?p/pk:null};
 const costAt=(id,date)=>{const l=priceBy.get(id);if(l){let c=null;for(const x of l){if(x.d<=date)c=x.per;else break}if(c!==null)return c;const first=l.filter(x=>x.d===l[0].d);return first[first.length-1].per}return catalog(id)};
 const gross=(i,line,mult)=>{const wp=line&&Object.prototype.hasOwnProperty.call(line,'wastePercent')&&line.wastePercent!==''&&line.wastePercent!==null?N(line.wastePercent):N(i?.wastePercent),y=1-wp/100,lu=UK(line?.recipeUnit||line?.unit||i?.recipeUnit);if(!i||!(y>0)||lu!==UK(i.recipeUnit))return NaN;return N(line.quantity)*mult/y};
 // count points: a count dated D with boundary START is the morning of D (index D); END is the night of D (index D+1)
 const points=new Map;
 for(const st of A(inv.stocktakes)){if(st.status==='void'||st.status==='rejected'||st.isArchived)continue;const di=CAL.i(st.date);if(di===null)continue;const boundary=st.baselineBoundary||(st.isOpeningBaseline?'START':'END'),at=di+(boundary==='END'?1:0);
  for(const l of A(st.lines)){if(l.actual===null||l.actual===undefined||l.actual==='')continue;const i=ing.get(l.ingredientId);const key=l.ingredientId;if(!points.has(key))points.set(key,new Map);const m=points.get(key),p=m.get(at)||{at,date:D(st.date),boundary,qty:0,statuses:new Set,ids:[],unitIssue:false,opening:false,lines:0};p.qty+=N(l.actual);p.statuses.add(st.status);p.ids.push(st.id);p.lines++;p.opening=p.opening||!!st.isOpeningBaseline;if(l.unitSnapshot&&i&&!sameUnit(i,l.unitSnapshot))p.unitIssue=l.unitSnapshot;m.set(at,p)}}
 for(const [k,m] of points)points.set(k,[...m.values()].sort((a,b)=>a.at-b.at));
 // day events
 const receipts=A(inv.stockReceipts).filter(r=>r.status!=='void'&&!r.isArchived).map(r=>({kind:'receipt',id:r.id,item:r.ingredientId,day:CAL.i(r.date),date:D(r.date),qty:N(r.quantity),unit:r.unitSnapshot,note:S(r.notes||r.sourceName),by:S(r.createdBy),raw:r})).filter(x=>x.day!==null);
 const wastes=[];for(const w of [...A(inv.wasteRecords),...A(inv.consumptionRecords).map(x=>({...x,__auth:true}))]){if(w.status==='void'||w.status==='pending'||w.isArchived)continue;const day=CAL.i(w.date);if(day===null)continue;const base={id:w.id,day,date:D(w.date),reason:S(w.reason||w.notes),eventType:S(w.eventType),by:S(w.reportedByName||w.createdBy),person:S(w.responsiblePersonnelId),known:w.known!==false,auth:!!w.__auth||w.recordKind==='consumption',raw:w};
  if(w.type==='menu'){for(const r of recipeAt(w.itemId,D(w.date))){const i=ing.get(r.ingredientId),q=gross(i,r,N(w.quantity));if(Number.isFinite(q))wastes.push({...base,kind:'waste',item:r.ingredientId,qty:q,fromMenu:menu.get(w.itemId)?.name||w.itemId})}}
  else wastes.push({...base,kind:'waste',item:w.itemId,qty:N(w.quantity),unit:ing.get(w.itemId)?.recipeUnit})}
 // item merge (catalog «ادغام اقلام»): a pair of ITEM_MERGE movements moves the on-hand of the merged item to the kept item;
 // toLocationId = in (+), fromLocationId = out (−). Kept apart from receipts so purchase lists and receipt checks ignore them.
 const merges=A(inv.inventoryMovements).filter(m=>m&&m.movementType==='ITEM_MERGE'&&m.status!=='void'&&!m.isArchived).map(m=>({kind:'merge',id:m.id,item:m.ingredientId,day:CAL.i(m.date),date:D(m.date),qty:(S(m.toLocationId)?1:-1)*N(m.quantity),note:S(m.notes),by:S(m.createdBy),raw:m})).filter(x=>x.day!==null&&x.qty);
 const sales=A(inv.salesPeriods).filter(s=>s.status!=='void'&&!s.isArchived&&!['pending','rejected'].includes(s.status)).map(s=>{const a=CAL.i(s.from||s.date),b=CAL.i(s.to||s.date||s.from);return{...s,a,b,src:S(s.salesSource||s.source).toUpperCase()==='SNAPP'?'SNAPP':'SEPIDZ'}}).filter(s=>s.a!==null&&s.b!==null);
 // first and last activity day
 const allDays=[...receipts.map(x=>x.day),...wastes.map(x=>x.day),...sales.flatMap(s=>[s.a,s.b]),...[...points.values()].flatMap(l=>l.map(p=>p.at))].filter(x=>x!==null);
 const fo=inv.settings?.fryerOil||{},foFrom=D(fo.logFrom),recipeDeducts=(id,date)=>!(foFrom&&S(fo.ingredientId)===S(id)&&date>=foFrom);
 return{recipeDeducts,raw,inv,pr,ing,menu,recipeAt,costAt,catalog,gross,points,receipts,merges,wastes,sales,firstDay:Math.min(...allDays),lastDay:Math.max(...allDays,CAL.i(CAL.today))};
}

/* ---------- Classification helpers ---------- */
const STAFF_RE=/غذای پرسنل|مصرف پرسنل|پرسنلی/;
function responsibility(w){const t=`${w.reason} ${w.eventType}`;if(w.auth||STAFF_RE.test(t))return'staff';if(/توسط|سوزاند|سوخت|ریخت|شکست|افتاد|فراموش|اشتباه|بی ?دقتی|اهمال|SPILL|BREAKAGE/i.test(t))return'negligence';if(/یخچال|فریزر|درجه|برق|دستگاه/.test(t))return'equipment';if(/خراب|کپک|بو گرفته|تاریخ|فاسد|تغییر رنگ|فروش نرفتن|خشک|فشرده|EXPIRY/i.test(t))return'storage';return w.person?'negligence':'unknown'}
const RESP_LABEL={negligence:'اهمال پرسنل',storage:'نگهداری / فروش نرفتن',equipment:'خرابی تجهیزات',staff:'مصرف مجاز (پرسنل، روغن، سر میز)',unknown:'نامشخص'};
const BEV_RE=/قوطی|نوشابه|ماءالشعیر|ماالشعیر|آب معدنی|دوغ|سودا|انرژی|آبمیوه|کوکا|فانتا|اسپرایت/;
const FRYER_OIL_RE=/^روغن سرخ ?کردنی$/;
const FRIED_RE=/سوخاری|سرخ کرده|پفکی|وینگز|چیپس رایو|ناگت|فینگر|استریپس|سیب زمینی رایو|کراکت|فلافل|اسپرینگ|پیاز حلقه/;

/* ---------- Period analysis ---------- */
// from/to are inclusive dates; the period covers morning of «from» to night of «to» = index range [f, t+1)
function analyze(M,from,to,opts={}){
 const f=CAL.i(from),t1=CAL.i(to)+1,TOL=opts.tolerance??3,fixUnits=opts.fixUnits!==false,items=new Map,issues=[],addIssue=(type,o)=>issues.push({type,...o});
 const row=id=>{if(!items.has(id)){const i=M.ing.get(id);items.set(id,{id,name:i?.name||id,code:i?.code||'',unit:i?.recipeUnit||'',category:i?.category||'',bev:BEV_RE.test(i?.name||''),open:null,openPt:null,close:null,closePt:null,receipt:0,receiptV:0,merge:0,mergeV:0,sales:0,salesV:0,waste:0,wasteV:0,staff:0,staffV:0,events:[],flags:new Set})}return items.get(id)};
 // windows per item from count points
 for(const [id,pts] of M.points){const r=row(id);let open=null,close=null;for(const p of pts){if(p.at<=f)open=p}if(!open){const late=pts.find(p=>p.at>f&&p.at<=f+TOL&&p.at<t1);if(late){open=late;r.flags.add('openLate')}}
  const cands=pts.filter(p=>p.at>(open?open.at:f-1)&&Math.abs(p.at-t1)<=TOL);if(cands.length)close=cands.sort((a,b)=>Math.abs(a.at-t1)-Math.abs(b.at-t1))[0];
  if(open){r.open=open.qty;r.openPt=open;if(open.at<f-TOL)r.flags.add('openOld');if([...open.statuses].some(s=>s!=='approved'))r.flags.add('unapproved');if(open.unitIssue)r.flags.add('countUnit');if(open.lines>1)r.flags.add('multiCount')}
  if(close){r.close=close.qty;r.closePt=close;if(close.at!==t1)r.flags.add('closeShift');if([...close.statuses].some(s=>s!=='approved'))r.flags.add('unapproved');if(close.unitIssue)r.flags.add('countUnit')}}
 const winOf=r=>({a:r.openPt?r.openPt.at:f,b:r.closePt?r.closePt.at:t1});
 const inWin=(r,day)=>{const w=winOf(r);return day>=w.a&&day<w.b};
 // receipts
 const recByItem=new Map;for(const x of M.receipts){if(!recByItem.has(x.item))recByItem.set(x.item,[]);recByItem.get(x.item).push(x)}
 const median=a=>{const s=a.slice().sort((x,y)=>x-y);return s.length?s[Math.floor(s.length/2)]:0};
 // waste: kg/l entry of 20+ that exceeds half of what was available (typical «grams typed as kg»); receipt: 10× above both counts and other receipts; either: 20× the item's median entry
 const suspect=(r,x,avail,others,kind)=>{const u=UK(r.unit),heavy=(u==='kg'||u==='l')&&x.qty>=20,med=others.length>=3?median(others):0,odd=med>0&&x.qty>=20*med;if(kind==='receipt'){const ref=Math.max(r.open||0,r.close||0,med,1);return heavy&&x.qty>10*ref||odd}return heavy&&x.qty>0.5*Math.max(avail,1)||odd};
 for(const x of M.receipts){const r=row(x.item);if(!inWin(r,x.day))continue;const others=A(recByItem.get(x.item)).filter(y=>y!==x).map(y=>y.qty),bad=suspect(r,x,0,others,'receipt');let q=x.qty;const c=M.costAt(x.item,x.date);
  if(x.unit&&UK(x.unit)!==UK(r.unit)){r.flags.add('receiptUnit');addIssue('receiptUnit',{item:r.id,name:r.name,date:x.date,qty:x.qty,unit:x.unit,expectedUnit:r.unit,ref:x.id})}
  if(bad){r.flags.add('suspectReceipt');addIssue('suspectReceipt',{item:r.id,name:r.name,date:x.date,qty:x.qty,unit:r.unit,fix:x.qty/1000,impact:c===null?null:(x.qty-x.qty/1000)*c,ref:x.id});if(fixUnits)q=x.qty/1000}
  r.receipt+=q;r.receiptV+=c===null?0:q*c;r.events.push({...x,qty:q,origQty:x.qty,suspect:bad,cost:c})}
 for(const x of A(M.merges)){const r=row(x.item);if(!inWin(r,x.day))continue;const c=M.costAt(x.item,x.date);r.merge+=x.qty;r.mergeV+=c===null?0:x.qty*c;r.events.push({...x,cost:c})}
 // waste
 const calWaste=[],inCal=d=>d>=f&&d<t1;
 for(const x of M.wastes){const r=row(x.item),win=inWin(r,x.day),cal=inCal(x.day);if(!win&&!cal)continue;const avail=(r.open||0)+r.receipt;let q=x.qty;const bad=!x.fromMenu&&suspect(r,x,avail,[],'waste'),c=M.costAt(x.item,x.date),resp=responsibility(x);
  const evt={...x,qty:bad&&fixUnits?x.qty/1000:x.qty,origQty:x.qty,suspect:bad,cost:c,resp,name:r.name,unit:r.unit};if(cal)calWaste.push({...evt,value:c===null?null:evt.qty*c});if(!win){if(bad&&cal)addIssue('suspectWaste',{item:r.id,name:r.name,date:x.date,qty:x.qty,unit:r.unit,fix:x.qty/1000,impact:c===null?null:(x.qty-x.qty/1000)*c,ref:x.id,reason:x.reason});continue}
  if(bad){r.flags.add('suspectWaste');addIssue('suspectWaste',{item:r.id,name:r.name,date:x.date,qty:x.qty,unit:r.unit,fix:x.qty/1000,impact:c===null?null:(x.qty-x.qty/1000)*c,ref:x.id,reason:x.reason});if(fixUnits)q=x.qty/1000}
  if(resp==='staff'){r.staff+=q;r.staffV+=c===null?0:q*c;r.flags.add('staffAsWaste')}else{r.waste+=q;r.wasteV+=c===null?0:q*c}
  r.events.push({...x,qty:q,origQty:x.qty,suspect:bad,cost:c,resp})}
 // sales (aggregated periods are spread evenly over their days; day d counts if inside the item's window)
 let salesAmount=0,soldUnits=0;const covered=new Set,noRecipe=new Map,badRecipe=new Map,menuSold=new Map,menuAmt=new Map,menuUse=new Map;
 for(const s of M.sales){const len=s.b-s.a+1;for(let d=Math.max(s.a,f);d<=Math.min(s.b,t1-1);d++)covered.add(d);
  for(const l of A(s.lines)){const ld=l.date?CAL.i(l.date):null,a=ld??s.a,b=ld??s.b,n=b-a+1,q=N(l.quantity),amt=N(l.saleAmountToman)||q*N(l.salePriceToman||M.menu.get(l.menuItemId)?.currentPriceToman),m=M.menu.get(l.menuItemId),date=ld!==null?D(l.date):D(s.to||s.date);
   const share=Math.max(0,Math.min(b,t1-1)-Math.max(a,f)+1)/n;if(share>0){salesAmount+=amt*share;soldUnits+=q*share;menuSold.set(l.menuItemId,(menuSold.get(l.menuItemId)||0)+q*share);menuAmt.set(l.menuItemId,(menuAmt.get(l.menuItemId)||0)+amt*share)}
   const lines=M.recipeAt(l.menuItemId,date);
   if(!lines.length){if(share>0){const k=m?.name||l.menuItemId,o=noRecipe.get(k)||{name:k,code:m?.code||'',qty:0,amount:0};o.qty+=q*share;o.amount+=amt*share;noRecipe.set(k,o)}continue}
   for(const rl of lines){const i=M.ing.get(rl.ingredientId),per=M.gross(i,rl,1);if(!Number.isFinite(per)){if(share>0){const k=m?.name||l.menuItemId,o=badRecipe.get(k)||{name:k,qty:0,amount:0,lines:new Set};o.qty+=q*share;o.amount+=amt*share;o.lines.add(i?.name||rl.ingredientId);badRecipe.set(k,o)}continue}
    if(!M.recipeDeducts(rl.ingredientId,date))continue;const r=row(rl.ingredientId),w=winOf(r),part=Math.max(0,Math.min(b,w.b-1)-Math.max(a,w.a)+1)/n;if(part<=0)continue;const used=per*q*part,c=M.costAt(r.id,date);r.sales+=used;r.salesV+=c===null?0:used*c;{let u=menuUse.get(l.menuItemId);if(!u)menuUse.set(l.menuItemId,u=new Map);u.set(r.id,(u.get(r.id)||0)+(c===null?0:used*c))}if(n>1&&(a<w.a||b>=w.b))r.flags.add('salesSplit')}}}
 for(const o of noRecipe.values())addIssue('noRecipe',{name:o.name,code:o.code,qty:o.qty,amount:o.amount});
 for(const o of badRecipe.values())addIssue('badRecipe',{name:o.name,qty:o.qty,amount:o.amount,detail:[...o.lines].join('، ')});
 const days=t1-f,coverage=days?covered.size/days:0;if(coverage<0.999)addIssue('salesGap',{covered:covered.size,days});
 // finalize items
 let tot={open:0,receipt:0,sales:0,waste:0,staff:0,close:0,variance:0,short:0,surplus:0,unexplained:0,flaggedVar:0},counted=0;
 for(const r of items.values()){const costClose=M.costAt(r.id,to),costOpen=r.openPt?M.costAt(r.id,r.openPt.date):costClose;
  r.expected=r.open===null&&!r.receipt&&!r.merge&&!r.sales?null:(r.open||0)+r.receipt+r.merge-r.sales-r.waste-r.staff;
  if(r.open===null&&(r.receipt||r.sales))r.flags.add('noOpen');
  r.variance=r.close===null||r.expected===null?null:r.close-r.expected;r.cost=costClose;
  r.openV=r.open===null||costOpen===null?null:r.open*costOpen;r.closeV=r.close===null||costClose===null?null:r.close*costClose;r.varianceV=r.variance===null||costClose===null?null:r.variance*costClose;
  if(r.expected!==null&&r.expected<-1e-6)r.flags.add('negative');
  if(r.close===null&&(r.receipt||r.sales>1e-6||r.waste))r.flags.add('notCounted');
  const active=r.open!==null||r.close!==null||r.receipt||r.merge||r.sales||r.waste||r.staff;if(!active){items.delete(r.id);continue}
  r.dataFlags=[...r.flags].filter(x=>!['multiCount','closeShift','staffAsWaste','notCounted'].includes(x));
  tot.open+=r.openV||0;tot.receipt+=r.receiptV;tot.sales+=r.salesV;tot.waste+=r.wasteV;tot.staff+=r.staffV;tot.close+=r.closeV||0;
  if(r.varianceV!==null){counted++;tot.variance+=r.varianceV;if(r.varianceV<0)tot.short+=r.varianceV;else tot.surplus+=r.varianceV;if(r.dataFlags.length)tot.flaggedVar+=r.varianceV;else tot.unexplained+=r.varianceV}}
 const list=[...items.values()];
 for(const r of list){const cat=M.catalog(r.id);if(r.cost&&cat&&(r.cost/cat>5||cat/r.cost>5))addIssue('suspectPrice',{item:r.id,name:r.name,cost:r.cost,catalog:cat});if(r.flags.has('negative'))addIssue('negative',{item:r.id,name:r.name,expected:r.expected,unit:r.unit,impact:r.cost===null?null:r.expected*r.cost});if(r.flags.has('noOpen'))addIssue('noOpen',{item:r.id,name:r.name});if(r.flags.has('unapproved'))addIssue('unapproved',{item:r.id,name:r.name});if(r.flags.has('countUnit'))addIssue('countUnit',{item:r.id,name:r.name,unit:r.unit,countUnit:(r.openPt?.unitIssue||r.closePt?.unitIssue)});if(r.flags.has('staffAsWaste'))addIssue('staffAsWaste',{item:r.id,name:r.name,qty:r.staff,impact:r.staffV});if(r.flags.has('notCounted'))addIssue('notCounted',{item:r.id,name:r.name,impact:r.salesV});if(r.flags.has('openLate')||r.flags.has('openOld'))addIssue('openShift',{item:r.id,name:r.name,date:r.openPt?.date})}
 // paired items: one item short and another (same unit) surplus by a similar quantity → probably the wrong item in receipts or recipes
 const shorts=list.filter(r=>r.variance!==null&&r.variance<0),plus=list.filter(r=>r.variance!==null&&r.variance>0),cands=[];
 for(const sh of shorts)for(const p of plus){if(UK(p.unit)!==UK(sh.unit))continue;const big=Math.max(-sh.variance,p.variance),ratio=p.variance/-sh.variance;if(big<2)continue;const pr=sh.cost&&p.cost?Math.abs(Math.log(sh.cost/p.cost)):1,words=new Set(S(sh.name).split(/s+/)),common=S(p.name).split(/s+/).some(w=>w.length>2&&words.has(w)),score=Math.abs(1-ratio)+pr*0.3-(common?0.3:0);if(!common&&S(sh.category)!==S(p.category))continue;if(score<=0.35)cands.push({sh,p,score})}
 const used=new Set;for(const c of cands.sort((x,y)=>x.score-y.score)){if(used.has(c.sh.id)||used.has(c.p.id))continue;used.add(c.sh.id);used.add(c.p.id);addIssue('pair',{item:c.sh.id,name:c.sh.name,other:c.p.name,otherId:c.p.id,short:c.sh.variance,surplus:c.p.variance,unit:c.sh.unit,impact:Math.min(Math.abs(c.sh.varianceV||0),Math.abs(c.p.varianceV||0))})}
 const wasteEvents=calWaste;
 const resp={};for(const e of wasteEvents){const k=e.resp||'unknown';resp[k]=resp[k]||{qty:0,value:0,count:0};resp[k].value+=e.value||0;resp[k].count++}
 const bev=list.filter(r=>r.bev),bevV=bev.reduce((a,r)=>a+(r.varianceV||0),0);
 const calReceipts=M.receipts.filter(x=>inCal(x.day)).map(x=>{const r=items.get(x.item)||{name:M.ing.get(x.item)?.name||x.item,unit:M.ing.get(x.item)?.recipeUnit||''},e=r.events?.find(e=>e.id===x.id),c=M.costAt(x.item,x.date);return{...x,name:r.name,unit:r.unit,qty:e?e.qty:x.qty,origQty:x.qty,suspect:!!e?.suspect,cost:c}});
 const calTot={waste:calWaste.filter(e=>e.resp!=='staff').reduce((a,e)=>a+(e.value||0),0),staff:calWaste.filter(e=>e.resp==='staff').reduce((a,e)=>a+(e.value||0),0),receipt:calReceipts.reduce((a,e)=>a+(e.cost===null?0:e.qty*e.cost),0)},openOld=list.filter(r=>r.flags.has('openOld')).length;
 return{calReceipts,calTot,openOld,from,to,days,coverage,salesAmount,soldUnits,menuSold,menuAmt,menuUse,items:list,issues,tot,counted,wasteEvents,resp,bevVariance:bevV,bevItems:bev,
  pct:v=>salesAmount?v/salesAmount*100:null};
}

/* ---------- Current stock ---------- */
function positions(M,date){const t1=CAL.i(date)+1,out=new Map,row=id=>{if(!out.has(id)){const i=M.ing.get(id);out.set(id,{id,name:i?.name||id,code:i?.code||'',unit:i?.recipeUnit||'',category:i?.category||'',status:i?.status||'',itemType:i?.itemType||'',base:null,basePt:null,receipt:0,merge:0,sales:0,waste:0,auth:0,lastReceipt:'',flags:new Set})}return out.get(id)};
 for(const i of M.ing.values())if(i.status!=='غیرفعال'&&i.itemType!=='NON_STOCK'&&i.inventoryTracked!==false)row(i.id);
 for(const [id,pts] of M.points){const r=row(id);let b=null;for(const p of pts)if(p.at<=t1)b=p;if(b){r.base=b.qty;r.basePt=b;if([...b.statuses].some(x=>x!=='approved'))r.flags.add('unapproved');if(b.unitIssue)r.flags.add('countUnit')}}
 const from=r=>r.basePt?r.basePt.at:-Infinity;
 for(const x of M.receipts){const r=row(x.item);if(x.day>=from(r)&&x.day<t1){r.receipt+=x.qty;if(x.date>r.lastReceipt)r.lastReceipt=x.date}}
 for(const x of A(M.merges)){const r=row(x.item);if(x.day>=from(r)&&x.day<t1)r.merge+=x.qty}
 for(const x of M.wastes){const r=row(x.item);if(x.day>=from(r)&&x.day<t1){if(x.auth)r.auth+=x.qty;else r.waste+=x.qty}}
 for(const s of M.sales)for(const l of A(s.lines)){const ld=l.date?CAL.i(l.date):null,a=ld??s.a,b=ld??s.b,n=b-a+1,q=N(l.quantity),dEnd=ld!==null?D(l.date):D(s.to||s.date);
  for(const rl of M.recipeAt(l.menuItemId,dEnd)){if(!M.recipeDeducts(rl.ingredientId,dEnd))continue;const i=M.ing.get(rl.ingredientId),per=M.gross(i,rl,1);if(!Number.isFinite(per))continue;const r=row(rl.ingredientId),lo=Math.max(a,from(r)),hi=Math.min(b,t1-1),part=Math.max(0,hi-lo+1)/n;if(part>0)r.sales+=per*q*part}}
 for(const r of out.values()){r.qty=r.base===null&&!r.receipt&&!r.merge?null:(r.base||0)+r.receipt+r.merge-r.sales-r.waste-r.auth;if(r.base===null)r.flags.add('noCount');if(r.qty!==null&&r.qty<-1e-6)r.flags.add('negative');r.cost=M.costAt(r.id,date);r.value=r.qty===null||r.cost===null?null:Math.max(0,r.qty)*r.cost;
  const tr=A(M.inv.trackedIngredients).find(x=>x.ingredientId===r.id),i=M.ing.get(r.id);// js/40 reorderPointValue: the item's own reorderPoint wins, then the legacy trackedIngredients value; need = stock ≤ point
  const has=(o,k)=>!!o&&Object.prototype.hasOwnProperty.call(o,k)&&o[k]!==''&&o[k]!==null&&o[k]!==undefined,pt=has(i,'reorderPoint')?Number(i.reorderPoint):has(tr,'reorderPoint')?Number(tr.reorderPoint):null;r.reorderPoint=Number.isFinite(pt)&&pt>=0?pt:0;r.hasReorderPoint=Number.isFinite(pt)&&pt>=0;
  r.target=has(i,'targetStock')?Number(i.targetStock):has(tr,'targetStock')?Number(tr.targetStock):r.reorderPoint*2;r.needOrder=r.hasReorderPoint&&r.qty!==null&&r.qty<=r.reorderPoint;r.supplierId=tr?.supplierId||''}
 return[...out.values()]}

/* ---------- Beverage daily control ---------- */
function beverageDaily(M){const recs=A(M.inv.beverageDailyControls).filter(r=>r.status!=='void').sort((a,b)=>D(a.date).localeCompare(D(b.date)));const prev=new Map,days=[];
 for(const r of recs){const d={date:D(r.date),short:0,surplus:0,night:0,sales:0,lines:[],roles:r.roles||{},prevDate:''};for(const l of A(r.lines)){const morning=N(l.morningUpper)+N(l.morningLower),night=N(l.nightUpper)+N(l.nightLower),expected=morning+N(l.inflow)-N(l.nonSale)-N(l.sales),daily=expected-night,p=prev.get(l.ingredientId),overnight=p===undefined?null:morning-p.night;prev.set(l.ingredientId,{night,date:D(r.date)});
  d.sales+=N(l.sales);if(daily>0)d.short+=daily;else d.surplus-=daily;if(overnight!==null&&overnight<0)d.night-=overnight;d.lines.push({id:l.ingredientId,name:S(l.itemNameSnapshot)||M.ing.get(l.ingredientId)?.name,morning,night,inflow:N(l.inflow),sales:N(l.sales),nonSale:N(l.nonSale),daily,overnight,prevDate:p?p.date:'',note:S(l.varianceNote),by:S(l.updatedByName||l.updatedBy||l.createdByName||l.createdBy),cost:M.costAt(l.ingredientId,D(r.date))})}days.push(d)}return days}

/* ---------- Oil ---------- */
function oilAnalysis(M,period){const oil=[...M.ing.values()].find(i=>FRYER_OIL_RE.test(S(i.name)));if(!oil)return null;const r=period.items.find(x=>x.id===oil.id)||null;
 const withOil=new Set(A(M.pr.recipes).filter(x=>x.ingredientId===oil.id).map(x=>x.menuItemId));const fried=[];
 for(const [mid,q] of period.menuSold){const m=M.menu.get(mid);if(!m)continue;const has=withOil.has(mid);if(!has&&!FRIED_RE.test(m.name))continue;const line=A(M.pr.recipes).find(x=>x.menuItemId===mid&&x.ingredientId===oil.id);fried.push({id:mid,name:m.name,code:m.code,qty:q,perPortion:line?N(line.quantity):null,suggest:suggestOil(m.name)})}
 fried.sort((a,b)=>b.qty-a.qty);const friedQty=fried.reduce((a,x)=>a+x.qty,0),usage=r&&r.open!==null&&r.close!==null?r.open+r.receipt-r.close:null;
 return{oil,row:r,fried,friedQty,usage,recipeUse:r?.sales??0,perItem:usage!==null&&friedQty?usage/friedQty:null,capacityKg:69*0.91}}
// Starting points (kg oil absorbed per portion); verify with a 10-portion test (weigh fryer oil before/after).
function suggestOil(name){if(/سیب زمینی/.test(name))return 0.02;if(/۴|4 ?تکه/.test(name))return 0.06;if(/سه|3 ?تیکه|3 ?تکه/.test(name))return 0.045;if(/بشقاب سوخاری/.test(name))return 0.05;if(/سالاد|اضافه/.test(name))return 0.015;if(/میگو/.test(name))return 0.02;if(/وینگز/.test(name))return 0.03;if(/چیپس/.test(name))return 0.02;return 0.02}

/* ---------- Off-recipe consumption (fryer oil, table items) ---------- */
// Dine-in / all invoices from cash reports in [from,to]; coverage = share of days that have a cash report.
function cashInvoices(M,from,to){const reps=A(M.raw.cashreport?.reports).filter(r=>r.status!=='void'&&D(r.date)>=from&&D(r.date)<=to),days=new Set(reps.map(r=>D(r.date))),total=(CAL.i(to)-CAL.i(from)+1)||1;
 return{hall:reps.reduce((a,r)=>a+N(r.hallReceiptCount),0),all:reps.reduce((a,r)=>a+(N(r.totalReceiptCount)||N(r.receiptCount)),0),days:days.size,coverage:days.size/total}}
// Actual use of one item in the period from its counts: opening + receipts − waste − staff − closing (null without both counts).
function usageOf(P,id){const r=P.items.find(x=>x.id===id);if(!r)return null;const actual=r.open!==null&&r.close!==null?r.open+r.receipt+(r.merge||0)-r.waste-r.staff-r.close:null;return{row:r,actual,recipe:r.sales,offRecipe:actual===null?null:actual-r.sales,cost:r.cost}}
// Fryers: 3 × 20 L floor fryers + 2 table-top (4–5 L). Editable in the page; oil density ≈ 0.91 kg/L.
function fryerDefaults(){return{density:0.91,fryers:[{id:'F1',name:'سرخ‌کن ۱',liters:20},{id:'F2',name:'سرخ‌کن ۲',liters:20},{id:'F3',name:'سرخ‌کن ۳',liters:20},{id:'T1',name:'رومیزی ۱',liters:4.5},{id:'T2',name:'رومیزی ۲',liters:4.5}]}}
// Relative oil weight of one portion (fries = 1). Only a starting point for splitting the measured oil between recipes.
function friedWeight(name){name=S(name);if(/۴|4 ?(تکه|تیکه)/.test(name))return 3;if(/سه|3 ?(تکه|تیکه)/.test(name))return 2.3;if(/بشقاب سوخاری/.test(name))return 2.5;if(/وینگز/.test(name))return 1.5;if(/اضافه/.test(name))return 0.6;if(/سالاد|ساندویچ|زینگر/.test(name))return 0.8;if(/میگو/.test(name))return 1;return 1}
// Splits the oil used in a period (kg) over fried items by sold quantity × weight → suggested kg per portion.
function calibrateOil(items,oilKg){const sum=items.reduce((a,x)=>a+x.qty*x.weight,0);return items.map(x=>({...x,perPortion:sum>0&&oilKg>0?oilKg*x.weight/sum:null,share:sum>0?x.qty*x.weight/sum:0}))}

/* ---------- Months ---------- */
function monthKeys(M){const out=[];let d=M.firstDay;const last=CAL.i(CAL.today);while(d<=last){const k=CAL.k(d).slice(0,7);if(!out.includes(k))out.push(k);d+=1}return out}

window.InvEngine={sameUnit,unitFactor,convertQty,prepConvert,API_ROOT,unwrap,positions,cashInvoices,usageOf,fryerDefaults,friedWeight,calibrateOil,FRYER_OIL_RE,FRIED_RE,CAL,MONTHS,monthLabel,monthRange,monthKeys,loadLive,loadUrl,loadFiles,build,analyze,beverageDaily,oilAnalysis,RESP_LABEL,responsibility,D,N,S,A,UK};
})();
