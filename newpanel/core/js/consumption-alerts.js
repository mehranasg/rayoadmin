/* =========================================================
   Rayo new panel — consumption-alerts.js
   «مدیریت مصرف»: alert thresholds and their checks on a period of the inventory engine (InvEngine.analyze).
   - settings: inventory.settings.consumptionAlerts, the same keys, defaults, limits and validation as the current
     panel (js/32 CONSUMPTION_* and cmNormalizeSettings / cmValidateSettings), so both panels read the same record;
   - per item: waste % = recorded waste value ÷ actual usage value; variance % = unexplained shortage value ÷
     theoretical (recipe) usage value; levels ok / warning / critical against the item's thresholds (own item, then
     its category, then the global value); «داده ناکافی» when the item has no closing count or the period is shorter
     than the minimum days; «کنارگذاشته» items never alert;
   - total loss (waste + shortage; surplus never reduces it) against sales, with the automatic limit
     target material % × (waste limit + variance limit) ÷ 100 (js/32 cmDerivedLoss);
   - menu items: each item's waste and shortage are allocated to the menu items by their share of its theoretical
     usage value in the period (estimated, as in js/46 «اثر روی آیتم‌های منو»); adjusted material % and loss impact %.
   Pure functions plus save(doc,ctx,input) for InvWrite.edit. Values in toman.
   ========================================================= */
(function(){
'use strict';
const A=x=>Array.isArray(x)?x:[],S=x=>String(x??'').trim();
const num=v=>{if(v===null||v===undefined)return null;const t=String(v).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/٫/g,'.').replace(/[٬,\s]/g,'');if(t==='')return null;const n=Number(t);return Number.isFinite(n)?n:null};
const DEFAULTS=Object.freeze({wasteWarn:3,wasteCritical:5,varianceWarn:2,varianceCritical:5,targetMaterialCostPercent:35,lossSalesAuto:true,lossSalesWarn:1.75,lossSalesCritical:3.5,nonRecipeWarn:15,nonRecipeCritical:25,minValidPeriods:4,historyPeriods:8,minDays:7,minInvoices:200});
const LIMITS={wasteWarn:[0,100],wasteCritical:[0,100],varianceWarn:[0,100],varianceCritical:[0,100],targetMaterialCostPercent:[1,100],lossSalesWarn:[0,100],lossSalesCritical:[0,100],nonRecipeWarn:[0,1000],nonRecipeCritical:[0,1000],minValidPeriods:[2,24],historyPeriods:[2,24],minDays:[1,365],minInvoices:[0,1000000]};
const LABELS={wasteWarn:'هشدار پرتی هر ماده',wasteCritical:'وضعیت بحرانی پرتی',varianceWarn:'هشدار مغایرت هر ماده',varianceCritical:'وضعیت بحرانی مغایرت',targetMaterialCostPercent:'درصد هدف بهای مواد از فروش',lossSalesWarn:'هشدار مجموع اتلاف از فروش',lossSalesCritical:'وضعیت بحرانی مجموع اتلاف از فروش',nonRecipeWarn:'هشدار افزایش مصرف اقلام بدون رسپی',nonRecipeCritical:'وضعیت بحرانی افزایش مصرف اقلام بدون رسپی',minValidPeriods:'حداقل بازه‌های معتبر مبنا',historyPeriods:'تعداد بازه‌های مبنا',minDays:'حداقل روز دوره برای هشدار',minInvoices:'حداقل فاکتور دوره برای هشدار'};
const INTEGER=new Set(['minValidPeriods','historyPeriods','minDays','minInvoices']);
const OVERRIDE_KEYS=['wasteWarn','wasteCritical','varianceWarn','varianceCritical','nonRecipeWarn','nonRecipeCritical'];
const PAIRS=[['wasteWarn','wasteCritical'],['varianceWarn','varianceCritical'],['lossSalesWarn','lossSalesCritical'],['nonRecipeWarn','nonRecipeCritical']];
const RANK={na:0,ok:1,warning:2,critical:3};
const fa=n=>String(n).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);

function pct(part,whole){if(part===null||whole===null||part===undefined||whole===undefined)return null;const p=Number(part),w=Number(whole);return Number.isFinite(p)&&Number.isFinite(w)&&w>0?p/w*100:null}
function level(v,warn,critical){if(v===null||v===undefined||!Number.isFinite(Number(v)))return'na';v=Number(v);return v>critical?'critical':v>warn?'warning':'ok'}
function worst(levels){let w='na';for(const l of A(levels))if((RANK[l]||0)>RANK[w])w=l;return w}
function derivedLoss(s){const n=x=>Number(x)||0;return{warn:n(s.targetMaterialCostPercent)*(n(s.wasteWarn)+n(s.varianceWarn))/100,critical:n(s.targetMaterialCostPercent)*(n(s.wasteCritical)+n(s.varianceCritical))/100}}
function value(raw,key){const v=num(raw),[lo,hi]=LIMITS[key];return v!==null&&v>=lo&&v<=hi&&(!INTEGER.has(key)||Number.isInteger(v))?v:null}
function normalize(raw){const src=raw&&typeof raw==='object'?raw:{},out={...DEFAULTS};
 for(const k of Object.keys(LIMITS)){const v=value(src[k],k);if(v!==null)out[k]=v}
 out.lossSalesAuto=src.lossSalesAuto!==false;if(out.lossSalesAuto){const d=derivedLoss(out);out.lossSalesWarn=d.warn;out.lossSalesCritical=d.critical}
 out.overrides=A(src.overrides).filter(o=>o&&['ingredient','category'].includes(o.scope)&&S(o.key)).map(o=>{const x={scope:o.scope,key:S(o.key)};for(const k of OVERRIDE_KEYS){const v=value(o[k],k);if(v!==null)x[k]=v}return x});
 out.updatedAt=S(src.updatedAt);out.updatedBy=S(src.updatedBy);return out}
function validate(input,{ingredientIds=null,categories=null}={}){const src=input&&typeof input==='object'?input:{},errors=[],v={lossSalesAuto:src.lossSalesAuto!==false};
 for(const k of Object.keys(LIMITS)){if(v.lossSalesAuto&&(k==='lossSalesWarn'||k==='lossSalesCritical'))continue;const x=value(src[k],k),[lo,hi]=LIMITS[k];if(x===null)errors.push(`${LABELS[k]}: ${INTEGER.has(k)?'عدد صحیح':'عدد'} بین ${fa(lo)} و ${fa(hi)} وارد کنید`);else v[k]=x}
 if(v.lossSalesAuto&&!errors.length){const d=derivedLoss(v);v.lossSalesWarn=d.warn;v.lossSalesCritical=d.critical}
 for(const [w,c] of PAIRS)if(v[w]!==undefined&&v[c]!==undefined&&v[w]>v[c])errors.push(`${LABELS[w]} نباید از «${LABELS[c]}» بیشتر باشد`);
 const seen=new Set;v.overrides=[];
 A(src.overrides).forEach((o,i)=>{const n=fa(i+1),scope=S(o?.scope),key=S(o?.key),x={scope,key};
  if(!['ingredient','category'].includes(scope)||!key){errors.push(`آستانهٔ اختصاصی ${n}: نوع و کالا یا گروه را انتخاب کنید`);return}
  if(scope==='ingredient'&&ingredientIds&&!ingredientIds.has(key))errors.push(`آستانهٔ اختصاصی ${n}: کالا در کاتالوگ نیست`);
  if(scope==='category'&&categories&&!categories.has(key))errors.push(`آستانهٔ اختصاصی ${n}: گروه کالا معتبر نیست`);
  if(seen.has(scope+'|'+key))errors.push(`آستانهٔ اختصاصی ${n}: برای همین ${scope==='ingredient'?'کالا':'گروه'} قبلاً آستانه تعریف شده است`);seen.add(scope+'|'+key);
  for(const k of OVERRIDE_KEYS){if(o[k]===undefined||o[k]===null||S(o[k])==='')continue;const y=value(o[k],k);if(y===null)errors.push(`آستانهٔ اختصاصی ${n} — ${LABELS[k]}: عدد معتبر وارد کنید`);else x[k]=y}
  if(!OVERRIDE_KEYS.some(k=>x[k]!==undefined))errors.push(`آستانهٔ اختصاصی ${n}: حداقل یک مقدار وارد کنید`);
  for(const [w,c] of PAIRS){if(!OVERRIDE_KEYS.includes(w)||(x[w]===undefined&&x[c]===undefined))continue;if((x[w]??v[w])>(x[c]??v[c]))errors.push(`آستانهٔ اختصاصی ${n}: ${LABELS[w]} نباید از حد بحرانی بیشتر باشد`)}
  v.overrides.push(x)});
 return{ok:!errors.length,errors:[...new Set(errors)],value:v}}
function thresholdsFor(s,item){const pick=(scope,key)=>A(s?.overrides).find(o=>o.scope===scope&&o.key===key)||null,own=pick('ingredient',S(item?.id)),cat=pick('category',S(item?.category)),out={source:own?'ingredient':cat?'category':'global'};
 for(const k of OVERRIDE_KEYS)out[k]=own?.[k]??cat?.[k]??s?.[k]??DEFAULTS[k];return out}

/* one period of InvEngine.analyze → item rows with levels, totals and menu impact */
function report(P,settings,{levelOf=()=>'LIGHT'}={}){const s=normalize(settings),alertWindow=Number(P?.days)>=s.minDays,rows=[];
 for(const r of A(P?.items)){const counted=r.varianceV!==null&&r.varianceV!==undefined,shortage=counted&&r.varianceV<0?-r.varianceV:0,surplus=counted&&r.varianceV>0?r.varianceV:0;
  const actual=counted?(r.salesV||0)+(r.wasteV||0)+(r.staffV||0)-r.varianceV:null,hasRecipe=(r.salesV||0)>0,th=thresholdsFor(s,r),ctl=levelOf(r.id);
  const wastePct=pct(r.wasteV||0,actual),variancePct=hasRecipe&&counted?pct(shortage,r.salesV):null,reasons=[];
  if(!counted)reasons.push('شمارش پایان دوره ندارد');if(r.open===null)reasons.push('شمارش ابتدای دوره ندارد');if(!alertWindow)reasons.push(`دوره کوتاه‌تر از ${fa(s.minDays)} روز است`);if(ctl==='PARKED')reasons.push('کنارگذاشته');
  const wl=level(wastePct,th.wasteWarn,th.wasteCritical),vl=level(variancePct,th.varianceWarn,th.varianceCritical),status=!counted||!alertWindow||ctl==='PARKED'?'na':worst([wl,vl]);
  rows.push({id:r.id,name:r.name,code:r.code||'',unit:r.unit,category:r.category||'',control:ctl,hasRecipe,counted,theoretical:r.salesV||0,waste:r.wasteV||0,staff:r.staffV||0,shortage,surplus,actual,wastePct,variancePct,wasteLevel:wl,varianceLevel:vl,status,thresholds:th,reasons,flags:A(r.dataFlags)})}
 const waste=rows.reduce((a,r)=>a+r.waste,0),shortage=rows.reduce((a,r)=>a+r.shortage,0),sales=Number(P?.salesAmount)||0,lossPct=pct(waste+shortage,sales);
 const totals={sales,theoretical:rows.reduce((a,r)=>a+r.theoretical,0),waste,shortage,surplus:rows.reduce((a,r)=>a+r.surplus,0),loss:waste+shortage,wasteSalesPct:pct(waste,sales),varianceSalesPct:pct(shortage,sales),lossSalesPct:lossPct,level:alertWindow?level(lossPct,s.lossSalesWarn,s.lossSalesCritical):'na',
  counts:{ok:rows.filter(r=>r.status==='ok').length,warning:rows.filter(r=>r.status==='warning').length,critical:rows.filter(r=>r.status==='critical').length,na:rows.filter(r=>r.status==='na').length}};
 return{settings:s,alertWindow,rows,totals,menus:menuImpact(P,rows,s,alertWindow)}}
function menuImpact(P,rows,s,alertWindow){const byId=new Map(rows.map(r=>[r.id,r])),use=P?.menuUse instanceof Map?P.menuUse:new Map,amt=P?.menuAmt instanceof Map?P.menuAmt:new Map,sold=P?.menuSold instanceof Map?P.menuSold:new Map,out=[];let allocated=0;
 for(const [menuId,lines] of use){let theo=0,wasteShare=0,shortShare=0;const mats=[];
  for(const [ingId,v] of lines){theo+=v;const r=byId.get(ingId);if(!r||!(r.theoretical>0)||!(v>0))continue;const k=v/r.theoretical,w=r.waste*k,sh=r.shortage*k;wasteShare+=w;shortShare+=sh;if(w||sh)mats.push({id:ingId,name:r.name,waste:w,shortage:sh})}
  allocated+=wasteShare+shortShare;const revenue=amt.get(menuId)||0,adjusted=theo+wasteShare+shortShare,costPct=pct(theo,revenue),adjustedPct=pct(adjusted,revenue),lossImpact=pct(wasteShare+shortShare,revenue);
  out.push({menuId,qty:sold.get(menuId)||0,revenue,theoretical:theo,wasteShare,shortageShare:shortShare,adjusted,costPct,adjustedPct,lossImpact,materials:mats.sort((a,b)=>(b.waste+b.shortage)-(a.waste+a.shortage)),
   level:!(revenue>0)||!alertWindow?'na':worst([level(lossImpact,s.lossSalesWarn,s.lossSalesCritical),adjustedPct===null?'na':adjustedPct>s.targetMaterialCostPercent?'warning':'ok'])})}
 const total=rows.reduce((a,r)=>a+r.waste+r.shortage,0);return{list:out.sort((a,b)=>(b.wasteShare+b.shortageShare)-(a.wasteShare+a.shortageShare)),unallocated:Math.max(0,total-allocated)}}

/* InvWrite.edit mutate: only settings.consumptionAlerts changes; unknown keys inside it are kept (js/32 saveConsumptionAlerts) */
function save(doc,ctx,input){const ing=A(ctx.pricing?.ingredients),chk=validate(input,{ingredientIds:new Set(ing.map(i=>i.id)),categories:new Set(ing.map(i=>S(i.category)).filter(Boolean))});if(!chk.ok)throw Error(chk.errors.join('؛ '));
 doc.settings=doc.settings&&typeof doc.settings==='object'?doc.settings:{};const prev=doc.settings.consumptionAlerts&&typeof doc.settings.consumptionAlerts==='object'?doc.settings.consumptionAlerts:{};
 doc.settings.consumptionAlerts={...prev,...chk.value,updatedAt:ctx.at,updatedBy:ctx.actor};ctx.auditExtra={before:JSON.parse(JSON.stringify(prev)),after:chk.value};return chk.value}

window.ConsumptionAlerts={DEFAULTS,LIMITS,LABELS,OVERRIDE_KEYS,pct,level,worst,derivedLoss,normalize,validate,thresholdsFor,report,menuImpact,save};
})();
