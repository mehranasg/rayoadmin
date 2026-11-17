/* =========================================================
   Rayo UI Template — menu-write.js
   Menu cost model and menu entries from the new panel onto the live pricing module (stage 4).
   Same rules and record shapes as the current panel:
     cost     → js/45 menuMetrics (current recipe lines pricing.recipes, net unit cost, manual cost without lines)
     recipe   → pricing.recipes lines (js/08 pcSaveRecipeLine) + a dated version in pricing.recipeVersions when the
                lines changed (js/32 snapshotRecipe; an item's first version applies from the start, '0000/00/00')
     price    → pricing.priceHistory row + menuItems[].currentPriceToman (js/08 pcConfirmAppliedPrice)
     settings → settings.categoryTargets / priceIncrementToman (js/45 savePricingSettings)
   Saving goes through InvWrite.edit (fresh Load → change a copy → audit row → Save → reload and compare) with
   module 'pricing'. Nothing else is written; inventory is never touched here.
   ========================================================= */
(function(){
'use strict';
const E=()=>window.InvEngine;
const A=x=>Array.isArray(x)?x:[];
const S=x=>String(x??'').trim();
const N=v=>{const n=Number(String(v??'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/٫/g,'.').replace(/[٬,\s]/g,''));return Number.isFinite(n)?n:NaN};
const Z=v=>{const n=Number(v);return Number.isFinite(n)?n:0};
const clone=x=>JSON.parse(JSON.stringify(x));
const FAM={kg:'mass',g:'mass',l:'vol',ml:'vol'};
const pcUid=(prefix,rows)=>{let m=0;A(rows).forEach(x=>{const q=S(x.id).match(/(\d+)$/);if(q)m=Math.max(m,+q[1])});return `${prefix}-${String(m+1).padStart(4,'0')}`};
const uid6=(prefix,rows)=>{let m=0;A(rows).forEach(x=>{const q=S(x.id).match(/(\d+)$/);if(q)m=Math.max(m,+q[1])});return `${prefix}-${String(m+1).padStart(6,'0')}`};

/* ---------- cost model ---------- */
// js/08 pcGrossCatalogCost: when the last price came from a supplier invoice, that invoice's own package and unit are used
let historyIndex={src:null,map:null};
function invoiceHistory(doc,i){if(!doc)return null;if(historyIndex.src!==doc.ingredientPriceHistory){historyIndex={src:doc.ingredientPriceHistory,map:new Map};for(const h of A(doc.ingredientPriceHistory)){if(h.isVoided===true||!h.invoiceId)continue;const k=h.ingredientId+'|'+h.invoiceId,o=historyIndex.map.get(k);if(!o||S(h.date)>S(o.date)||(S(h.date)===S(o.date)&&S(h.createdAt)>S(o.createdAt)))historyIndex.map.set(k,h)}}return historyIndex.map.get(i.id+'|'+i.lastPurchaseInvoiceId)||null}
function unitCost(i,doc){if(!i)return{v:NaN,why:'ماده در کاتالوگ نیست'};
 if(i.lastPurchaseSource==='supplierInvoice'&&i.lastPurchaseInvoiceId&&doc){const h=invoiceHistory(doc,i);if(!h)return{v:NaN,why:'قیمت فاکتور آخر پیدا نشد'};if(!E().sameUnit(i,h.recipeUnit||i.recipeUnit))return{v:NaN,why:'واحد فاکتور با واحد مصرف فرق دارد'};i={...i,...h,lastPurchasePriceToman:h.priceToman,purchaseUnit:h.purchaseUnit||i.purchaseUnit,packageQuantity:h.packageQuantity,wastePercent:i.wastePercent}}
 const pk=Number(i.packageQuantity),price=Number(i.lastPurchasePriceToman),pu=E().UK(i.purchaseUnit),ru=E().UK(i.recipeUnit),w=Number(i.wastePercent)||0,y=1-w/100;
 if(!pu||!ru||(FAM[pu]&&FAM[ru]&&FAM[pu]!==FAM[ru]))return{v:NaN,why:'واحد خرید و مصرف ناسازگار'};if(!(pk>0))return{v:NaN,why:'مقدار بسته نامعتبر'};if(!(price>0))return{v:NaN,why:'بدون قیمت خرید'};if(!(y>0))return{v:NaN,why:'افت نامعتبر'};return{v:price/pk/y,why:''}}
const recipeLines=(doc,menuId)=>A(doc.recipes).filter(r=>r.menuItemId===menuId);
/* sub-recipe line (prepared item, quantity in its count unit): cost of one unit from its formula (gross ingredient
   quantities × purchase price per recipe unit, the formula already holds the loss) */
function prepUnitCost(doc,ing,p){if(!p)return{v:NaN,why:'قلم آماده‌سازی پیدا نشد'};const cv=E().prepConvert(doc,p,1,p.countUnit);if(!cv.complete)return{v:NaN,why:cv.reason};let v=0;
 for(const c of cv.contributions){const i=ing.get(c.ingredientId),u=unitCost(i,doc);if(!(Number.isFinite(u.v)&&u.v>0))return{v:NaN,why:`«${i?.name||c.ingredientId}»: ${u.why}`};v+=c.quantity*u.v*(1-(Number(i.wastePercent)||0)/100)}return{v,why:''}}
function prepRow(doc,ing,l){const p=A(doc.preparedItems).find(x=>x.id===l.preparedItemId),u=prepUnitCost(doc,ing,p),qty=Z(l.quantity),ok=Number.isFinite(u.v)&&u.v>0&&qty>0;return{l,i:null,prep:p||null,qty,unit:u.v,cost:ok?u.v*qty:null,why:ok?'':qty<=0?'مقدار صفر یا خالی':u.why}}
function metrics(doc,m,ingMap){const ing=ingMap||new Map(A(doc.ingredients).map(i=>[i.id,i])),lines=recipeLines(doc,m.id);
 const rows=lines.map(l=>{if(l.preparedItemId)return prepRow(doc,ing,l);const i=ing.get(l.ingredientId),u=unitCost(i,doc),qty=Z(l.quantity),ok=Number.isFinite(u.v)&&u.v>0&&qty>0;return{l,i,qty,unit:u.v,cost:ok?u.v*qty:null,why:ok?'':qty<=0?'مقدار صفر یا خالی':u.why}});
 let cost=rows.reduce((a,r)=>a+(r.cost||0),0),manual=false;const missing=rows.filter(r=>r.cost===null).length;
 if(!lines.length&&m.manualCostEnabled!==false&&Z(m.manualCostToman)>0){cost=Z(m.manualCostToman);manual=true}
 const s=doc.settings||{},price=Z(m.currentPriceToman),target=Z(m.customTargetCostPercent)||Z(s.categoryTargets?.[m.category])||35,complete=cost>0&&missing===0,step=priceStep(doc);
 return{rows,cost,manual,missing,complete,price,target,step,ratio:price>0&&cost>0?cost/price*100:null,margin:complete&&price>0?price-cost:null,suggested:complete&&target>0?Math.ceil(cost/(target/100)/step)*step:0,state:!lines.length?(manual?'manual':'none'):missing?'incomplete':'complete'}}
const priceStep=doc=>Math.max(1000,Z(doc.settings?.priceIncrementToman)||10000);
const recipeCapable=i=>!!i&&['MENU_INGREDIENT','MENU_CONSUMABLE'].includes(i.itemType||'MENU_INGREDIENT');
function versionsOf(doc,menuId){return A(doc.recipeVersions).filter(v=>v.menuItemId===menuId).sort((a,b)=>S(b.effectiveFrom).localeCompare(S(a.effectiveFrom))||S(b.createdAt).localeCompare(S(a.createdAt)))}
// same comparison as js/32 sameRecipe
function sameRecipe(a,b){const norm=rows=>A(rows).map(x=>`${x.ingredientId||'P:'+x.preparedItemId}|${Z(x.quantity)}|${x.locationId||''}|${S(x.notes)}|${x.wastePercent??''}|${x.recipeUnit||''}`).sort();const x=norm(a),y=norm(b);return x.length===y.length&&x.every((v,i)=>v===y[i])}
function snapshotLines(doc,menuId){const ing=new Map(A(doc.ingredients).map(i=>[i.id,i]));return recipeLines(doc,menuId).map(r=>{if(r.preparedItemId){if(!(Z(r.quantity)>0))throw Error('نسخهٔ رسپی ناقص است؛ مقدار قلم آماده را بررسی کنید');return{...clone(r),id:r.id||'',quantity:Z(r.quantity),notes:r.notes||'',locationId:r.locationId||''}}const i=ing.get(r.ingredientId),w=Number(i?.wastePercent)||0;if(!i||!(Z(r.quantity)>0)||!(w>=0&&w<100))throw Error('نسخهٔ رسپی ناقص است؛ مقدار و افت مواد را بررسی کنید');return{...clone(r),id:r.id||'',quantity:Z(r.quantity),notes:r.notes||'',locationId:r.locationId||'',wastePercent:w,recipeUnit:i.recipeUnit}})}
// does the current recipe (pricing.recipes) match the version effective today?
// (ingredient and quantity only: migrated versions carry no loss/unit snapshot)
function versionDrift(doc,menuId){const v=versionsOf(doc,menuId).find(v=>(E().D(v.effectiveFrom)||'0000/00/00')<=E().CAL.today),cur=recipeLines(doc,menuId);if(!v)return cur.length?'no-version':'';const k=rows=>A(rows).map(x=>`${x.ingredientId||'P:'+x.preparedItemId}|${Z(x.quantity)}`).sort().join(';');return k(v.lines)===k(cur)?'':'differs'}

/* ---------- recipe edit ---------- */
function saveRecipe(doc,ctx,{menuId,lines,effectiveFrom,note}){const m=A(doc.menuItems).find(x=>x.id===menuId);if(!m)throw Error('آیتم منو پیدا نشد');const ing=new Map(A(doc.ingredients).map(i=>[i.id,i])),today=E().CAL.today;
 const preps=new Map(A(doc.preparedItems).map(p=>[p.id,p]));
 const rows=A(lines).map((x,k)=>{if(S(x.preparedItemId)){const p=preps.get(S(x.preparedItemId));if(!p)throw Error(`سطر ${k+1}: قلم آماده‌سازی پیدا نشد`);if(p.status==='غیرفعال'&&!recipeLines(doc,menuId).some(r=>r.preparedItemId===p.id))throw Error(`«${p.name}» غیرفعال است`);const q=N(x.quantity);if(!(q>0))throw Error(`سطر ${k+1} (${p.name}): مقدار مثبت لازم است`);const cv=E().prepConvert(doc,p,q,p.countUnit);if(!cv.complete)throw Error(`«${p.name}»: ${cv.reason}`);return{p,key:'P:'+p.id,quantity:Math.round(q*1e6)/1e6,notes:S(x.notes)}}
  const i=ing.get(S(x.ingredientId));if(!recipeCapable(i))throw Error(`سطر ${k+1}: مادهٔ رسپی (مادهٔ اولیه یا ملزوم منو) را انتخاب کنید`);if(i.status==='غیرفعال'&&!recipeLines(doc,menuId).some(r=>r.ingredientId===i.id))throw Error(`«${i.name}» غیرفعال است`);const q=N(x.quantity);if(!(q>0))throw Error(`سطر ${k+1} (${i.name}): مقدار مثبت لازم است`);const w=Number(i.wastePercent)||0;if(!(w>=0&&w<100))throw Error(`افت «${i.name}» نامعتبر است`);
  const eu=S(x.entryUnit),eq=N(x.entryQuantity),entry=eu&&eu!==S(i.recipeUnit)&&eq>0?{entryUnit:eu,entryQuantity:Math.round(eq*1e6)/1e6}:null;return{i,key:i.id,quantity:Math.round(q*1e6)/1e6,notes:S(x.notes),entry}});
 if(!rows.length)throw Error('رسپی دست‌کم یک ماده لازم دارد');if(new Set(rows.map(r=>r.key)).size!==rows.length)throw Error('یک ماده یا قلم آماده دو بار در رسپی آمده است');
 const latest=versionsOf(doc,menuId)[0];let from=E().D(effectiveFrom)||today;if(E().CAL.i(from)===null)throw Error('تاریخ اثر معتبر نیست');if(from>today)throw Error('تاریخ اثر نمی‌تواند در آینده باشد');
 if(latest&&latest.effectiveFrom!=='0000/00/00'&&from<E().D(latest.effectiveFrom))throw Error(`تاریخ اثر نمی‌تواند قبل از آخرین نسخه (${latest.effectiveFrom}) باشد`);
 // current lines: keep the id of an ingredient already in the recipe
 doc.recipes=A(doc.recipes);const old=recipeLines(doc,menuId),keep=doc.recipes.filter(r=>r.menuItemId!==menuId),next=[];
 // entryUnit / entryQuantity: how the line was typed (e.g. ۱۵۰ گرم for a کیلوگرم item) — display only, quantity stays the base unit
 const withEntry=(r,x)=>{const o={...r};delete o.entryUnit;delete o.entryQuantity;return x.entry?{...o,...x.entry}:o};
 for(const x of rows){const o=x.p?old.find(r=>r.preparedItemId===x.p.id):old.find(r=>r.ingredientId===x.i.id);if(x.i){next.push(withEntry(o?{...o,quantity:x.quantity,notes:x.notes}:{id:pcUid('REC',[...doc.recipes,...next]),menuItemId:menuId,ingredientId:x.i.id,quantity:x.quantity,notes:x.notes},x));continue}next.push(o?{...o,quantity:x.quantity,notes:x.notes}:x.p?{id:pcUid('REC',[...doc.recipes,...next]),menuItemId:menuId,preparedItemId:x.p.id,quantity:x.quantity,unit:x.p.countUnit,notes:x.notes}:{id:pcUid('REC',[...doc.recipes,...next]),menuItemId:menuId,ingredientId:x.i.id,quantity:x.quantity,notes:x.notes})}
 const changed=!(old.length===next.length&&old.every(o=>{const n=next.find(z=>z.id===o.id);return n&&Z(n.quantity)===Z(o.quantity)&&S(n.notes)===S(o.notes)&&S(n.entryUnit)===S(o.entryUnit)}));
 doc.recipes=[...keep,...next];
 const snap=snapshotLines(doc,menuId).map(r=>({...r,id:r.id||uid6('RVL',[])}));let version=null;
 if(!latest||!sameRecipe(latest.lines,snap)){const eff=latest?from:'0000/00/00';doc.recipeVersions=A(doc.recipeVersions);version={id:uid6('RV',doc.recipeVersions),menuItemId:menuId,effectiveFrom:eff,createdAt:ctx.at,createdBy:ctx.actor,source:'ui-template-recipe-edit',...(S(note)?{notes:S(note)}:{}),lines:snap};doc.recipeVersions.push(version);
  doc.changeLog=A(doc.changeLog);doc.changeLog.unshift({at:ctx.at,action:'RECIPE_VERSION_CREATED',entityId:menuId,effectiveFrom:eff,createdBy:ctx.actor})}
 if(!changed&&!version)throw Error('تغییری در رسپی داده نشده است');
 ctx.auditExtra={entityId:menuId,before:{lines:clone(old)},effectiveFrom:version?.effectiveFrom||''};
 return{menuId,changed,version}}

/* ---------- price change ---------- */
function changePrice(doc,ctx,{menuId,price,note}){const m=A(doc.menuItems).find(x=>x.id===menuId);if(!m)throw Error('آیتم منو پیدا نشد');const p=N(price);if(!(p>0))throw Error('قیمت جدید معتبر وارد کنید');if(p%1000)throw Error('قیمت باید مضرب ۱٬۰۰۰ تومان باشد');const old=Z(m.currentPriceToman);if(p===old)throw Error('قیمت جدید با قیمت فعلی یکی است');
 const x=metrics(doc,m);doc.priceHistory=A(doc.priceHistory);const row={id:pcUid('PRICE',doc.priceHistory),menuItemId:m.id,itemCode:m.code,itemName:m.name,oldPriceToman:old,newPriceToman:p,costToman:Math.round(x.cost),targetCostPercent:x.target,changedAt:ctx.at,notes:(S(note)||'تغییر قیمت با تأیید مدیر')+(x.suggested&&p===x.suggested?' — مطابق پیشنهاد سیستم':' — ورود دستی')+' (پنل جدید)'};
 doc.priceHistory.unshift(row);m.currentPriceToman=p;m.lastPriceChangeAt=ctx.at;ctx.auditExtra={entityId:m.id,before:{currentPriceToman:old}};return row}
/* ---------- sale prices from the online menu (rayocafe.ir/api/data/DineInItems, SalesWrite.onlineMenu) ----------
   The online menu has its own ids and names, not the Sepidz code, so items are matched by name: «exact» = the same name
   once Arabic ی/ک, digits, spaces and punctuation are normalised; otherwise the closest name is only a suggestion (never
   selected by default — e.g. «شیک انبه» is not the hookah «انبه»). Each picked price goes through changePrice (a
   priceHistory row each, note «منوی آنلاین»). */
const onKey=v=>S(v).replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).toLowerCase().replace(/[^\p{L}\p{N}]+/gu,'');
const ON_SYN={iced:'سرد',ice:'سرد','آیس':'سرد','البالو':'آلبالو'};
const onTokens=v=>S(v).replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[ً-ْ]/g,'').toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(x=>x&&x!=='و'&&x!=='با').map(x=>ON_SYN[x]||x);
function onlineSuggest(name,list){const a=new Set(onTokens(name));if(!a.size)return null;let best=null,second=0;
 for(const o of list){const b=new Set(onTokens(o.title));if(!b.size)continue;let c=0;a.forEach(x=>{if(b.has(x))c++});if(!c)continue;const score=c/(a.size+b.size-c)+(c===a.size&&c===b.size?1:0);if(!best||score>best.score){second=best?best.score:0;best={o,score}}else if(score>second)second=score}
 return best&&best.score>=0.34&&best.score>second?best.o:null}
function onlinePricePlan(doc,online){const list=A(online).filter(o=>S(o.title)&&Z(o.priceToman)>0).map(o=>({title:S(o.title),priceToman:Math.round(Z(o.priceToman)),category:S(o.category),enabled:o.enabled!==false})),byKey=new Map;
 for(const o of list){const k=onKey(o.title);if(k&&!byKey.has(k))byKey.set(k,o)}
 const rows=A(doc?.menuItems).filter(m=>m.status!=='غیرفعال').map(m=>{const cur=Z(m.currentPriceToman),ex=byKey.get(onKey(m.name)),o=ex||onlineSuggest(m.name,list);
  return{menuId:m.id,code:S(m.code),name:S(m.name),category:S(m.category),current:cur,kind:ex?'exact':o?'suggest':'none',title:o?.title||'',online:o?.priceToman||0,diff:o?o.priceToman-cur:0}});
 const used=new Set(rows.filter(r=>r.kind==='exact').map(r=>onKey(r.title)));
 return{rows,list,unused:list.filter(o=>!used.has(onKey(o.title))),summary:{items:rows.length,exact:rows.filter(r=>r.kind==='exact').length,exactChanged:rows.filter(r=>r.kind==='exact'&&r.diff).length,suggest:rows.filter(r=>r.kind==='suggest').length,none:rows.filter(r=>r.kind==='none').length}}}
// picks [{menuId, price, title}] — rows whose price already equals the pick are skipped, not an error
function applyOnlinePrices(doc,ctx,{picks}){const out=[],same=[];const seen=new Set;
 for(const p of A(picks)){const id=S(p.menuId);if(seen.has(id))throw Error('یک آیتم دو بار انتخاب شده است');seen.add(id);const m=A(doc.menuItems).find(x=>x.id===id);if(!m)throw Error('آیتم منو پیدا نشد: '+id);
  const price=Math.round(Z(p.price));if(!(price>0))throw Error(`قیمت آنلاین «${m.name}» معتبر نیست`);if(price===Z(m.currentPriceToman)){same.push(id);continue}
  const c={...ctx};out.push(changePrice(doc,c,{menuId:id,price,note:`منوی آنلاین${S(p.title)&&S(p.title)!==S(m.name)?` («${S(p.title)}»)`:''}`}))}
 if(!out.length)throw Error('قیمتی برای تغییر نیست؛ همهٔ انتخاب‌ها با قیمت فعلی یکی‌اند');
 ctx.auditExtra={source:'online-menu',changed:out.length,unchanged:same.length,items:out.map(r=>({menuId:r.menuItemId,from:r.oldPriceToman,to:r.newPriceToman}))};return{changed:out,same}}

/* ---------- pricing settings ---------- */
function saveSettings(doc,ctx,{targets,step}){doc.settings=doc.settings&&typeof doc.settings==='object'?doc.settings:{};const before={categoryTargets:clone(doc.settings.categoryTargets||{}),priceIncrementToman:doc.settings.priceIncrementToman};const cats=new Set([...A(doc.lists?.menuCategories),...A(doc.menuItems).map(m=>m.category),...Object.keys(doc.settings.categoryTargets||{})].filter(Boolean));
 doc.settings.categoryTargets=doc.settings.categoryTargets||{};for(const [c,v] of Object.entries(targets||{})){if(!cats.has(c))throw Error(`دستهٔ «${c}» در منو نیست`);const n=N(v);if(!(n>=1&&n<=100))throw Error(`هدف «${c}» باید بین ۱ و ۱۰۰ درصد باشد`);doc.settings.categoryTargets[c]=Math.round(n*10)/10}
 if(step!==undefined&&S(step)!==''){const s=N(step);if(!(s>=1000))throw Error('گام قیمت دست‌کم ۱٬۰۰۰ تومان است');doc.settings.priceIncrementToman=Math.ceil(s/1000)*1000}
 if(JSON.stringify(before)===JSON.stringify({categoryTargets:doc.settings.categoryTargets,priceIncrementToman:doc.settings.priceIncrementToman}))throw Error('تغییری داده نشده است');ctx.auditExtra={before};return doc.settings}

const validPricing=doc=>!!doc&&typeof doc==='object'&&Array.isArray(doc.menuItems)&&Array.isArray(doc.ingredients)&&Array.isArray(doc.recipes);

/* ---------- catalog definitions (migration stage 2): ingredient and menu item ----------
   Same record shapes as js/08 pcSaveIngredient / pcSaveMenuItem and js/45 deleteMenu, with these owner decisions:
   - an existing code never changes (Sepidz code and the key of history); a new ingredient takes the next number of the
     numeric series; a new menu item needs its Sepidz code unless settings.requireMenuSalesCode is false (owner only)
   - names are unique after normalisation (ی/ک, spaces, ZWNJ); the stock (recipe) unit of an existing item is locked
   - the price of an existing menu item changes only through «تغییر قیمت» (changePrice)
   - an inactive menu item cannot be shown on the site; an item with sales or recipe versions is deactivated, not deleted */
const NORM=s=>S(s).normalize('NFKC').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[‌‎‏]/g,' ').replace(/\s+/g,' ').toLowerCase();
const ITEM_TYPES={MENU_INGREDIENT:'ماده اولیه منو',MENU_CONSUMABLE:'ملزومات مستقیم منو',OPERATIONAL_CONSUMABLE:'مصرفی عملیاتی',GENERAL_INVENTORY:'کالای عمومی / قطعه',NON_STOCK:'خدمت / هزینه غیرموجودی'};
const DRIVERS={GUESTS:'تعداد مهمان',CHECKS:'تعداد فاکتور',OPEN_DAYS:'روز کاری',SHIFTS:'تعداد شیفت',WASH_CYCLES:'دفعات شست‌وشو'};
const UNITS_DEFAULT=['بسته','عدد','لیتر','کیلوگرم','گرم'];
/* ---------- unit list (pricing.lists.units) ----------
   The names offered for base, purchase and other units of every item. Units already used by an item are always listed
   (even if not in the list yet) and cannot be removed; the standard kinds (گرم/کیلوگرم، میلی‌لیتر/لیتر) convert by themselves. */
function unitUsage(doc){const n=new Map,add=u=>{u=S(u);if(u)n.set(u,(n.get(u)||0)+1)};
 for(const i of A(doc?.ingredients)){add(i.recipeUnit);if(S(i.purchaseUnit)!==S(i.recipeUnit))add(i.purchaseUnit);for(const u of A(i.countingUnits))add(u?.name)}
 for(const x of A(doc?.preparedItems))add(x.countUnit);return n}
function unitList(doc){const base=A(doc?.lists?.units).length?A(doc.lists.units).map(S).filter(Boolean):[...UNITS_DEFAULT],out=[];
 for(const u of [...base,...unitUsage(doc).keys()])if(!out.some(x=>NORM(x)===NORM(u)))out.push(u);return out}
function saveUnitList(doc,ctx,{units}){const used=unitUsage(doc),out=[];
 for(const u0 of A(units)){const u=S(u0).replace(/\s+/g,' ');if(!u)continue;if(u.length>40)throw Error(`نام واحد «${u.slice(0,20)}…» بیش از حد بلند است`);if(!out.some(x=>NORM(x)===NORM(u)))out.push(u)}
 const gone=[...used.keys()].filter(u=>!out.some(x=>NORM(x)===NORM(u)));if(gone.length)throw Error(`این واحدها در اقلام استفاده شده‌اند و حذف نمی‌شوند: ${gone.join('، ')}`);
 if(!out.length)throw Error('دست‌کم یک واحد لازم است');doc.lists=doc.lists&&typeof doc.lists==='object'?doc.lists:{};const before=A(doc.lists.units).slice();
 if(JSON.stringify(before)===JSON.stringify(out))throw Error('تغییری در واحدها نیست');doc.lists.units=out;ctx.auditExtra={before,after:out};return{units:out,added:out.filter(u=>!before.includes(u)),removed:before.filter(u=>!out.includes(u))}}

function duplicateNames(doc){const by=new Map;for(const i of A(doc.ingredients)){const k=NORM(i.name);if(!k)continue;const l=by.get(k)||[];l.push(i.id);by.set(k,l)}return new Map([...by].filter(([,l])=>l.length>1))}
function nextIngredientCode(doc){let m=0;for(const c0 of [...A(doc.ingredients).map(i=>i.code),...A(doc.settings?.retiredIngredientCodes)]){const c=S(c0);if(/^\d+$/.test(c))m=Math.max(m,+c)}return m?String(m+1):pcUid('INGCODE',doc.ingredients)}
const fam=u=>FAM[E().UK(u)]||'';
// active menu items whose current recipe uses the ingredient (shown before deactivating it)
function ingredientUsage(doc,id){const viaPrep=new Set(A(doc.preparedItems).filter(p=>A(p.components).some(c=>c.ingredientId===id)).map(p=>p.id)),ms=new Set(A(doc.recipes).filter(r=>r.ingredientId===id||(r.preparedItemId&&viaPrep.has(r.preparedItemId))).map(r=>r.menuItemId));return A(doc.menuItems).filter(m=>ms.has(m.id)&&m.status!=='غیرفعال')}
/* ---------- catalog clean-up: unused items ----------
   ingredientRefs: where an item is used — recipes of active / inactive menu items, prepared items, recipe versions, and its
   history in inventory (counts, receipts, movements, waste, beverage controls, invoices, opening balances) and purchase
   prices from invoices. cleanupIngredients removes items with no reference at all (the removed rows go into the audit row
   as a backup; zero-only count lines are removed from the counts first, InvWrite.removeZeroCountLines) and archives (inactive + isArchived) items whose only references are inactive menu items or history; an
   item in an active recipe, an active prepared item or with stock on hand (onHand map from InvEngine.positions) is refused. Codes are never reused: removed codes are kept in
   doc.settings.retiredIngredientCodes and nextIngredientCode counts them. */
const INV_HISTORY=['stocktakes','stockReceipts','inventoryMovements','wasteRecords','wasteShiftDeclarations','consumptionRecords','beverageDailyControls','purchaseInvoices','openingBalances','salesPeriods'];
// a record refers to the item through its own fields; its revision / recalculation history (removed lines) does not count
const NO_HIST=(k,v)=>k==='revisionHistory'||k==='varianceRecalcHistory'?undefined:v;
/* opening-only (allowOpening, owner deleting one item): an item whose only trace is a line of the opening count (START /
   isOpeningBaseline) — no recipe, prepared item, receipt, movement, waste, sale or later count — is a duplicate or a
   mistake; its opening line goes with it (kept in the count's revisionHistory) and its opening stock does not block. */
const isOpeningCount=s=>s?.isOpeningBaseline===true||s?.baselineBoundary==='START';
function ingredientRefs(doc,inv,id,{allowOpening=false}={}){const hit=x=>JSON.stringify(x,NO_HIST).includes('"'+id+'"'),menus=new Map(A(doc.menuItems).map(m=>[m.id,m])),prepIds=new Set(A(doc.preparedItems).filter(p=>A(p.components).some(c=>c.ingredientId===id)).map(p=>p.id));
 const recipeMenus=[...new Set(A(doc.recipes).filter(r=>r.ingredientId===id||(r.preparedItemId&&prepIds.has(r.preparedItemId))).map(r=>r.menuItemId))].map(k=>menus.get(k)).filter(Boolean);
 // a count where the item was only ever recorded as 0 (counted and not there) is not history: such lines go with the item
 const stLines=A(inv?.stocktakes).flatMap(s=>A(s.lines).filter(l=>l.ingredientId===id)),zeroOnly=stLines.length>0&&stLines.every(l=>Number(l.actual)===0&&!A(l.preparedContributions).length);
 const stAll=A(inv?.stocktakes).filter(s=>A(s.lines).some(l=>l.ingredientId===id)),openingOnly=!zeroOnly&&stAll.length>0&&stAll.every(isOpeningCount)&&stLines.every(l=>!A(l.preparedContributions).length);
 const history={};for(const k of INV_HISTORY){if(k==='stocktakes'&&(zeroOnly||(allowOpening&&openingOnly)))continue;const n=A(inv?.[k]).filter(hit).length;if(n)history[k]=n}const zeroCounts=zeroOnly?stLines.length:0,openingLines=openingOnly?stLines.length:0,openingQty=openingOnly?stLines.reduce((a,l)=>a+Number(l.actual||0),0):0;const ver=A(doc.recipeVersions).filter(hit).length,inv$=A(doc.ingredientPriceHistory).filter(h=>h.ingredientId===id&&S(h.source)==='supplierInvoice').length;
 const prepared=A(doc.preparedItems).filter(p=>prepIds.has(p.id)),activePrep=prepared.filter(p=>p.status!=='غیرفعال'&&!p.isArchived);
 return{zeroCounts,openingOnly,openingLines,openingQty,activeMenus:recipeMenus.filter(m=>m.status!=='غیرفعال'),inactiveMenus:recipeMenus.filter(m=>m.status==='غیرفعال'),prepared,activePrep,recipeVersions:ver,invoicePrices:inv$,history,hasHistory:Object.keys(history).length>0||ver>0||inv$>0}}
function cleanupPlan(doc,inv,id,{onHand,allowOpening=false}={}){const r=ingredientRefs(doc,inv,id,{allowOpening}),q=onHand?Number(onHand.get(id))||0:0;r.onHand=q;const fromOpening=allowOpening&&r.openingOnly&&!r.hasHistory&&!r.inactiveMenus.length&&!r.prepared.length;r.withOpening=fromOpening;if(r.activeMenus.length||r.activePrep.length||(Math.abs(q)>1e-6&&!fromOpening))return{id,action:'keep',refs:r};return{id,action:r.inactiveMenus.length||r.prepared.length||r.hasHistory?'archive':'delete',refs:r}}
function cleanupIngredients(doc,ctx,{ids,inv,onHand,allowOpening=false}){const list=A(doc.ingredients),out={deleted:[],archived:[],kept:[]};doc.settings=doc.settings||{};
 for(const id of A(ids)){const i=list.find(x=>x.id===id);if(!i)continue;const p=cleanupPlan(doc,inv,id,{onHand,allowOpening});
  if(p.action==='keep'){out.kept.push(i.code);continue}
  if(p.action==='archive'){Object.assign(i,{status:'غیرفعال',isArchived:true,archivedAt:ctx.at,archivedBy:ctx.actor,archiveReason:'پاک‌سازی کاتالوگ: فقط در آیتم غیرفعال یا دارای سابقه'});out.archived.push(i.code);continue}
  doc.ingredients=A(doc.ingredients).filter(x=>x.id!==id);doc.recipes=A(doc.recipes).filter(r=>r.ingredientId!==id);doc.settings.retiredIngredientCodes=[...new Set([...A(doc.settings.retiredIngredientCodes),S(i.code)])].filter(Boolean);out.deleted.push(JSON.parse(JSON.stringify(i)))}
 ctx.auditExtra={deleted:out.deleted,archivedCodes:out.archived,keptCodes:out.kept};return out}
/* ---------- item types and the standard catalog structure (decided 1405/08/20) ----------
   The five types are behaviours (recipe, inventory, operational consumption, stock only, no stock) and stay fixed; their
   names are editable (pricing.lists.itemTypeLabels). Every group has a default type for new items
   (pricing.lists.ingredientGroupTypes {group: TYPE}). CATALOG_STD = the proposed 16 groups; classifyItem() suggests a group and
   type from an item's name and current group; applyCatalogStructure() applies the reviewed rows once (audit keeps the
   previous group / type of every item). */
const TYPE_STD={MENU_INGREDIENT:'مادهٔ اولیهٔ غذا و نوشیدنی',MENU_CONSUMABLE:'بسته‌بندی و یکبارمصرف سرو',OPERATIONAL_CONSUMABLE:'مصرفی عملیاتی',GENERAL_INVENTORY:'کالای عمومی و تجهیزات کوچک',NON_STOCK:'خدمت و هزینه'};
const typeLabels=doc=>({...ITEM_TYPES,...(doc?.lists?.itemTypeLabels&&typeof doc.lists.itemTypeLabels==='object'?doc.lists.itemTypeLabels:{})});
const groupType=(doc,g)=>{const t=doc?.lists?.ingredientGroupTypes?.[S(g)];return ITEM_TYPES[t]?t:''};
const CATALOG_STD=[['گوشت، مرغ و دریایی','MENU_INGREDIENT'],['لبنیات و تخم‌مرغ','MENU_INGREDIENT'],['نان و خمیر','MENU_INGREDIENT'],['میوه و سبزی تازه','MENU_INGREDIENT'],['غلات، حبوبات و خشکبار','MENU_INGREDIENT'],['سس، چاشنی و ادویه','MENU_INGREDIENT'],['روغن','MENU_INGREDIENT'],['کنسرو، ترشی و غذای نیمه‌آماده','MENU_INGREDIENT'],['نوشیدنی آماده','MENU_INGREDIENT'],['مواد بار و قهوه','MENU_INGREDIENT'],['شیرینی و دسر آماده','MENU_INGREDIENT'],['قلیان','MENU_INGREDIENT'],['بسته‌بندی و یکبارمصرف','MENU_CONSUMABLE'],['ظروف و تجهیزات','GENERAL_INVENTORY'],['شوینده و بهداشتی','OPERATIONAL_CONSUMABLE'],['عمومی، اداری و خدمات','GENERAL_INVENTORY']];
const G=Object.fromEntries(CATALOG_STD.map(([g],i)=>[i,g]));
// name rules, first match wins: [regex, group index, type or '' (= group default)]. Food rules run first for items now in a
// food group, non-food rules first for items in a non-food group (old groups بهداشتی، ظروف، غیره، سایر).
const W=s=>new RegExp('(^|[ (])('+s+')($|[ )])');
const NONFOOD_RULES=[
 [/کرایه|هزینه ارسال|متفرقه\(|خدمات چاپ/,15,'NON_STOCK'],
 [/تنباکو|زغال|ذغال|فویل|لبی قلیون|شلنگ یکبارمصرف قلیان/,11,''],[/قلیان|قلیون|هوکر|سری سیلیکونی/,11,'GENERAL_INVENTORY'],
 [/یکبار ?مصرف|جعبه|ظرف (هات|مایکرو|ماکرو|سالاد|سس|بیرون|فوم|\d)|ظرف مایکروویو|ظرف ماکروویو|ظرف بزرگ شیرینی|نی سایز|نی مک|لیوان (دوجداره|شیک|استارکاپ|سه ?گوش|کاغذی)|در حبابی|پاکت|بطری|سینگل|کیسه فریزر|کیسه دسته|سلفون|محافظ غذا|نایلکس|لیبل|بیرونبر|زیربشقابی|کاغذ (روغنی|مومی)|طلق|قیف|سیخ چوبی|چوب گارنیش|ماکرو ?\d/,12,''],
 [/تی ?شرت|تیشرت|خودکار|دفتر|رول کاغذ|کارت ویزیت|دمپایی|پتو|تشک|پکیج خواب|جاکفشی|قفل|نوار برق|دو ?شاخه|محافظ برق|باتری|فندک|اسپری گاز|باکس|برچسب|تابلو|قوطی \d|ضد ?زنگ|کاور شمعی|روغن سوخته|دینام|جاشلنگی|عود/,15,''],
 [W('مش|قلمو'),15,''],
 [/دستمال|مایع (دستشویی|ظرفشویی|شیشه|ضد|سفید|لباسشویی|ماشین)|اسکاچ|سیم ظرفشویی|کیسه زباله|دستکش|جرم ?گیر|شوینده|پودر (لباسشویی|ماشین)|دامستوس|الکل|ضد ?عفونی|گند ?زدا|کلاه یکبار|شیشه ?شور|کهنه|حشره|مالاتیون|پشه|وایتکس|شامپو فرش|تمیزکننده|سفید ?کننده|پارچه تنظیف|چاه ?باز ?کن|چنته|ابر استیل/,14,''],
 [/جارو|سطل زباله|زمین ?شو|فرچه|یدک|سمپاش|دسته طی|طی حوله|تی نخی|تی چرخشی/,14,'GENERAL_INVENTORY'],[W('سم'),14,''],
 [/کارد|چنگال|قاشق|انبر|دیس|پیش ?دستی|ملامین|قالب (?!ی)|^قالب|وارمر|لیوان شیشه|پمپ سس|سینی|کاتر|ظرف \d/,13,'']];
const FOOD_RULES=[
 [/تنباکو|زغال|ذغال/,11,''],
 [/سیروپ|قهوه|اسپرسو|دم ?نوش|چای (?!دوغزال)|^چای|ماچا|هات ?چاکلت|وایت چاکلت|ثعلب|مونین|تاپینگ|تخم شربتی|خاکشیر|سکنجبین|بهار ?نارنج|گل گاوزبان|به لیمو|غنچه گل|گل (خوراکی|بابونه|پنیرک)|نبات|عرق |گلاب|اسانس|باوارین|بریلو|فوندانت|ورق طلا|کربن|سورل|فیسالیس/,9,''],[W('یخ'),9,''],
 [/کیک|باقلوا|پاناکوتا|رد ولوت|چیز ?کیک|تارت|شیرینی|بیسکو?ئ?یت|ساقه طلایی|توئیست|شکلات|کروسان|دسر|بستنی|ماکارون(?!ی)|کوکی|براونی|تیرامیسو|نوتلا|لوتوس|کرم بروله|میلفوی|پای سیب|کرامبل|ترافل|پتی ?بور|چری تن/,10,''],
 [/کوکا ?کولا|کوکاکولا|فانتا|اسپرایت|نوشابه|آب ?معدنی|ماء ?الشعیر|ماالشعیر|دوغ|لیموناد|سن ?ایچ|آب (میوه|انار|سیب|آلبالو|گوجه|گاز ?دار|آلوورا)|شربت|سودا|تونیک|دلستر|پیناکولادا/,8,''],
 [/تخم ?مرغ|پنیر|شیر (پرچرب|فرا|خشک|کم|تترا)|^شیر$|خامه|^کره(?! بادام)|کره (حیوانی|کاله|تکنفره|یکنفره|گیاهی)|ماست|کشک|موزارلا|پارمسان|گودا|لبنه|ماسکارپونه/,1,''],
 [/روغن(?! سوخته)(?!ی)/,6,''],
 [/ناگت|نودل|سوپ|کنسرو|ترشی|خیار ?شور|رب (گوجه|انار)|^رب|گوجه پوست|کاپاریس|زیتون|هالوپینو|سیب ?زمینی (کاله|تنوری)|منجمد|سبزی پلویی|پولد بیف|گوشت پیتزا|سوسیس|پپرونی|روست بیف|فلافل|کوکتل|مربا|ارده|پیتزا کباب/,7,''],
 [/مایه ?خمیر|بیکینگ پودر|بهبود ?دهنده|جوش ?شیرین|پودر قند/,4,''],
 [/نان|باگت|لوف|چاپاتا|پیتا|تافتون|خمیر|سیمیت|سنگک|ترتیلا|یوفکا/,2,''],
 [/آرد|ماکارونی|اسپاگتی|پنه|لازانیا|برنج|پرک|بادام|گردو|پسته|فندق|فندوق|کشمش|نارگیل|عدس|نخود|لوبیا|قند|شکر|کاکائو|نشاسته|گلوتن|گلت|اسپرولینا/,4,''],[W('جو'),4,''],
 [/سس|ادویه|نمک|فلفل(?! دلمه)|زردچوبه|دارچین|سماق|اورگانو|آرگانو|پاپریکا|پولبیبر|زعفران|عصاره|سرکه|بالزامیک|ورچستر|سویا|آرومات|تندرایزر|خردل|مایونز|کچاپ|باربیکیو|آبلیمو|عسل|وانیل|جوز|گشنیز|سیاه ?دانه|رزماری|آویشن|پودر (زنجبیل|سیر)|کنجد|گلوکز|رنگ (مایع )?خوراکی|ژلاتین|پکتین/,5,''],[W('هل'),5,''],
 [/گوساله|گوسفند|مرغ|بوقلمون|میگو|ماهی|بیکن|سالامی|ژامبون|کالباس|همبرگر|بیرشینگن|استیک|توپوز|کوهان|ریب آی|راسته|فیله|ران مرغ|قلوه|دنبه|گردن|سر سینه|گوشت|بالا ران|کعب/,0,''],[W('ران'),0,'']];
const NONFOOD_OLD=new Set(['بهداشتی','ظروف','غیره','سایر']);
const OLD_GROUP_FALLBACK={'میوه تره بار':3,'کافه بار و قلیون':9,'بهداشتی':14,'ظروف':13,'غیره':15,'سایر':15};
const NORMn=s=>S(s).replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/‌/g,' ').replace(/\s+/g,' ');
function classifyItem(i){const n=NORMn(i.name),old=S(i.category);
 if(old==='میوه تره بار'&&!/ترشی|کاله/.test(n))return{group:G[3],type:'MENU_INGREDIENT',sure:true};
 for(const [re,gi,t] of NONFOOD_OLD.has(old)?[...NONFOOD_RULES,...FOOD_RULES]:[...FOOD_RULES,...NONFOOD_RULES])if(re.test(n))return{group:G[gi],type:t||CATALOG_STD[gi][1],sure:true};
 const gi=OLD_GROUP_FALLBACK[old]??7;return{group:G[gi],type:CATALOG_STD[gi][1],sure:false}}
// the plan: per item the suggestion, adjusted so that an item in a recipe keeps a recipe type and an item with stock history stays tracked
function catalogPlan(doc,inv){const inRecipe=new Set([...A(doc.recipes).map(r=>r.ingredientId),...A(doc.preparedItems).flatMap(p=>A(p.components).map(c=>c.ingredientId))].filter(Boolean)),hist=new Set;
 for(const k of ['stocktakes','stockReceipts','inventoryMovements','wasteRecords'])for(const r of A(inv?.[k])){if(r.ingredientId)hist.add(r.ingredientId);for(const l of A(r.lines))if(l.ingredientId)hist.add(l.ingredientId)}
 return A(doc.ingredients).map(i=>{const c=classifyItem(i);let type=c.type,note='';
  if(inRecipe.has(i.id)&&!['MENU_INGREDIENT','MENU_CONSUMABLE'].includes(type)){type=c.group===G[12]||c.group===G[13]?'MENU_CONSUMABLE':'MENU_INGREDIENT';note='در رسپی است'}
  if(type==='NON_STOCK'&&hist.has(i.id)){type='GENERAL_INVENTORY';note='سابقهٔ انبار دارد'}
  return{id:i.id,code:i.code,name:i.name,status:i.status,archived:!!i.isArchived,fromGroup:S(i.category)||'سایر',fromType:i.itemType||'MENU_INGREDIENT',group:c.group,type,sure:c.sure,note}})}
function applyCatalogStructure(doc,ctx,{rows,typeLabels:labels}){doc.lists=doc.lists&&typeof doc.lists==='object'?doc.lists:{};const byId=new Map(A(doc.ingredients).map(i=>[i.id,i])),before=[];
 for(const r of A(rows)){const i=byId.get(r.id);if(!i)continue;const g=S(r.group),t=ITEM_TYPES[r.type]?r.type:'';if(!g||!t)throw Error(`گروه یا نوع «${i.name}» معتبر نیست`);
  if((S(i.category)||'سایر')===g&&(i.itemType||'MENU_INGREDIENT')===t)continue;before.push({id:i.id,category:i.category,itemType:i.itemType});
  Object.assign(i,{category:g,itemType:t,recipeCapable:['MENU_INGREDIENT','MENU_CONSUMABLE'].includes(t),inventoryTracked:t!=='NON_STOCK',updatedAt:ctx.at})}
 const used=[...new Set(A(doc.ingredients).map(i=>S(i.category)||'سایر'))];doc.lists.ingredientCategories=[...CATALOG_STD.map(([g])=>g),...used.filter(g=>!CATALOG_STD.some(([x])=>x===g))];
 doc.lists.ingredientGroupTypes={...Object.fromEntries(CATALOG_STD),...(doc.lists.ingredientGroupTypes||{})};doc.lists.itemTypeLabels={...TYPE_STD,...(labels||{})};doc.lists.catalogStructureVersion='standard-1';
 ctx.auditExtra={before,count:before.length};return{changed:before.length}}
function saveTypeSettings(doc,ctx,{labels,groupTypes}){doc.lists=doc.lists&&typeof doc.lists==='object'?doc.lists:{};const before={labels:doc.lists.itemTypeLabels||null,groupTypes:doc.lists.ingredientGroupTypes||null};
 const L={};for(const k of Object.keys(ITEM_TYPES)){const v=S(labels?.[k]);if(!v)throw Error('نام هر نوع لازم است');L[k]=v}if(new Set(Object.values(L)).size!==5)throw Error('نام دو نوع یکسان است');
 const GT={};for(const [g,t] of Object.entries(groupTypes||{}))if(S(g)&&ITEM_TYPES[t])GT[S(g)]=t;doc.lists.itemTypeLabels=L;doc.lists.ingredientGroupTypes=GT;ctx.auditExtra={before};return{labels:5,groups:Object.keys(GT).length}}
/* bulk actions on catalog items: status (فعال / غیرفعال) and group of many items in one save; codes and history unchanged */
function bulkIngredients(doc,ctx,{ids,status,group}){const set=new Set(A(ids)),items=A(doc.ingredients).filter(i=>set.has(i.id));if(!items.length)throw Error('قلمی انتخاب نشده است');
 if(status!==undefined&&!['فعال','غیرفعال'].includes(status))throw Error('وضعیت معتبر نیست');const g=group===undefined?undefined:S(group);if(g!==undefined&&!g)throw Error('گروه را انتخاب کنید');
 const before=[];for(const i of items){const b={id:i.id,status:i.status,category:i.category};let ch=false;if(status!==undefined&&i.status!==status){i.status=status;ch=true}if(g!==undefined&&S(i.category)!==g){i.category=g;ch=true}if(ch){i.updatedAt=ctx.at;before.push(b)}}
 if(g){doc.lists=doc.lists&&typeof doc.lists==='object'?doc.lists:{};doc.lists.ingredientCategories=A(doc.lists.ingredientCategories);if(!doc.lists.ingredientCategories.includes(g))doc.lists.ingredientCategories.push(g)}
 ctx.auditExtra={before,count:before.length};return{changed:before.length,selected:items.length}}
/* item groups (pricing.lists.ingredientCategories): a group is only a label of the items. rows = [{from, to}] in the
   order shown — from '' = new group; to '' = remove (only a group without items); a changed name renames the group on all
   its items (two groups renamed to the same name merge). The list order is the order of rows. */
function saveIngredientGroups(doc,ctx,{rows}){doc.lists=doc.lists&&typeof doc.lists==='object'?doc.lists:{};const before=A(doc.lists.ingredientCategories).slice(),items=A(doc.ingredients),count=g=>items.filter(i=>(S(i.category)||'سایر')===g).length;
 const out=[],renamed=[],removed=[];for(const r of A(rows)){const from=S(r.from),to=S(r.to);if(!to){if(from){if(count(from))throw Error(`گروه «${from}» ${count(from)} قلم دارد؛ اول اقلامش را به گروه دیگری ببرید یا نامش را به گروه دیگری تغییر دهید تا ادغام شود`);removed.push(from)}continue}
  if(from&&from!==to){renamed.push([from,to]);for(const i of items)if((S(i.category)||'سایر')===from){i.category=to;i.updatedAt=ctx.at}}if(!out.includes(to))out.push(to)}
 for(const i of items){const g=S(i.category)||'سایر';if(!out.includes(g))out.push(g)}// every group in use stays listed
 doc.lists.ingredientCategories=out;ctx.auditExtra={before,after:out,renamed,removed};return{groups:out.length,renamed:renamed.length,removed:removed.length}}
const groupCounts=doc=>{const m=new Map;for(const g of A(doc?.lists?.ingredientCategories))m.set(g,0);for(const i of A(doc?.ingredients)){const g=S(i.category)||'سایر';m.set(g,(m.get(g)||0)+1)}return m};
function saveIngredient(doc,ctx,x){
 const ings=A(doc.ingredients),old=x.id?ings.find(i=>i.id===x.id):null;if(x.id&&!old)throw Error('قلم پیدا نشد');
 const name=S(x.name);if(!name)throw Error('نام قلم الزامی است');
 const dup=ings.find(i=>i.id!==x.id&&NORM(i.name)===NORM(name));if(dup)throw Error(`«${dup.name}» با کد ${dup.code||'—'} قبلاً تعریف شده؛ همان را ویرایش کنید`);
 if(old&&S(x.code)&&S(x.code)!==S(old.code))throw Error('کد قلم ثبت‌شده تغییر نمی‌کند');
 if(old&&S(x.recipeUnit)&&E().UK(x.recipeUnit)!==E().UK(old.recipeUnit))throw Error('واحد پایهٔ قلمی که سابقه دارد تغییر نمی‌کند؛ اگر واحد اشتباه است، قلم جدید بسازید و این را غیرفعال کنید');
 const itemType=ITEM_TYPES[x.itemType]?x.itemType:'MENU_INGREDIENT',recipeUnit=old?S(old.recipeUnit):S(x.recipeUnit),purchaseUnit=S(x.purchaseUnit);
 if(!recipeUnit||!purchaseUnit)throw Error('واحد خرید و واحد مصرف لازم است');
 if(fam(purchaseUnit)&&fam(recipeUnit)&&fam(purchaseUnit)!==fam(recipeUnit))throw Error('واحد خرید و واحد مصرف از یک جنس نیستند (وزن و حجم)؛ واحد هم‌جنس انتخاب کنید');
 const pack=N(x.packageQuantity);if(!(pack>0))throw Error('مقدار ناخالص هر واحد خرید باید بیشتر از صفر باشد');
 const waste=S(x.wastePercent)===''?0:N(x.wastePercent);if(!(waste>=0&&waste<100))throw Error('درصد افت باید صفر یا بیشتر و کمتر از ۱۰۰ باشد');
 const opt=(v,l,pos)=>{if(v===null||v===undefined||S(v)==='')return null;const n=N(v);if(!(pos?n>0:n>=0))throw Error(l);return n};
 const reorder=opt(x.reorderPoint,'نقطهٔ سفارش باید خالی، صفر یا عدد مثبت باشد'),density=opt(x.densityKgPerLiter,'چگالی باید عدد مثبت باشد',1);
 const priceIn=S(x.price)===''?null:N(x.price);if(priceIn!==null&&!(priceIn>0))throw Error('قیمت خرید باید عدد مثبت باشد؛ قیمت نامشخص را خالی بگذارید');
 // counting units (js/08 pcReadCountingUnitRows / pcCheckCountingUnitNames / pcMergeCountingUnits / pcAssignCountingUnitIds)
 const seen=new Set([NORM(recipeUnit)]),rows=[];for(const r of A(x.countingUnits)){const n=S(r.name);if(!n&&S(r.factor)==='')continue;if(!n)throw Error('نام واحد شمارش الزامی است');const f=N(r.factor);if(!(f>0))throw Error(`ضریب واحد «${n}» باید عدد مثبت باشد`);
  if(seen.has(NORM(n)))throw Error(`نام واحد «${n}» تکراری یا هم‌نام واحد پایه است`);if(NORM(n)===NORM(purchaseUnit))throw Error(`«${n}» واحد خرید این قلم است و ضریبش از مقدار بسته می‌آید؛ نام دیگری انتخاب کنید`);seen.add(NORM(n));const df=r.def&&S(r.def.a)&&S(r.def.b)&&N(r.def.q)>0?{a:S(r.def.a),q:N(r.def.q),b:S(r.def.b)}:null;rows.push({id:S(r.id)||null,name:n,factor:f,active:r.active!==false,def:df})}
 const prevCU=new Map(A(old?.countingUnits).filter(u=>u&&u.id).map(u=>[u.id,u]));let cuMax=0;rows.forEach(r=>{const q=S(r.id).match(/(\d+)$/);if(q)cuMax=Math.max(cuMax,+q[1])});
 const countingUnits=rows.map(r=>{const id=r.id||`CU-${String(++cuMax).padStart(4,'0')}`,o=prevCU.get(id);if(!o)return{id,name:r.name,factor:r.factor,active:r.active,...(r.def?{def:r.def}:{}),createdAt:ctx.at};const out={...o,name:r.name,factor:r.factor,active:r.active};if(r.def)out.def=r.def;else delete out.def;if(Z(o.factor)!==r.factor||o.active!==r.active||o.name!==r.name)out.updatedAt=ctx.at;return out});
 // use unit (recipe / waste start in it) and count unit: any unit of the item; empty = the default (InvWrite.useUnitOf / countUnitOf)
 const allU=window.InvWrite?window.InvWrite.unitsOf({recipeUnit,purchaseUnit,packageQuantity:pack,countingUnits}).map(u=>u.name):null,pickU=(v,l)=>{const n=S(v);if(!n)return'';if(allU&&!allU.includes(n))throw Error(`${l} «${n}» از واحدهای این قلم نیست`);return n};
 const useUnit=pickU(x.useUnit===undefined?old?.useUnit:x.useUnit,'واحد مصرف'),countUnit=pickU(x.countUnit===undefined?old?.countUnit:x.countUnit,'واحد شمارش');
 const op=itemType==='OPERATIONAL_CONSUMABLE';
 const price=priceIn!==null?priceIn:(old?Z(old.lastPurchasePriceToman):0);
 const priceChanged=!old?price>0:(x.priceEdited===true&&priceIn!==null)||Z(old.packageQuantity)!==pack||S(old.purchaseUnit)!==purchaseUnit;
 const o={code:old?old.code:(S(x.code)||nextIngredientCode(doc)),name,category:S(x.category)||'سایر',purchaseUnit,recipeUnit,countingUnits,useUnit,countUnit,packageQuantity:pack,lastPurchasePriceToman:price,wastePercent:waste,
  lastPurchaseDate:priceChanged?(E().D(x.priceDate)||E().CAL.today):S(old?.lastPurchaseDate),status:x.status==='غیرفعال'?'غیرفعال':'فعال',itemType,recipeCapable:['MENU_INGREDIENT','MENU_CONSUMABLE'].includes(itemType),inventoryTracked:itemType!=='NON_STOCK',procurementEnabled:true,
  consumptionDriver:op?(DRIVERS[x.consumptionDriver]?x.consumptionDriver:'GUESTS'):'',standardUsagePerDriver:op?Z(N(x.standardUsagePerDriver)):0,driverBase:op?Math.max(1,Z(N(x.driverBase))||100):0,reorderPoint:reorder,densityKgPerLiter:density,densityNote:S(x.densityNote),notes:S(x.notes)};
 if(!old&&ings.some(i=>NORM(i.code)===NORM(o.code)))throw Error('کد قلم تکراری است');
 if(priceChanged)Object.assign(o,{lastPurchaseSource:'manual',lastPurchaseInvoiceId:''});
 const before=old?clone(old):null;let saved;if(old){saved=old;Object.assign(saved,o)}else{saved={id:pcUid('ING',ings),...o};doc.ingredients=[...ings,saved]}
 doc.lists=doc.lists&&typeof doc.lists==='object'?doc.lists:{};doc.lists.ingredientCategories=A(doc.lists.ingredientCategories);if(!doc.lists.ingredientCategories.includes(o.category))doc.lists.ingredientCategories.push(o.category);
 if(priceChanged&&price>0){doc.ingredientPriceHistory=A(doc.ingredientPriceHistory);const d=o.lastPurchaseDate;if(!doc.ingredientPriceHistory.some(h=>h.ingredientId===saved.id&&Z(h.priceToman)===price&&S(h.date)===d&&S(h.source)==='manual'&&Z(h.packageQuantity)===pack&&h.purchaseUnit===purchaseUnit&&h.recipeUnit===recipeUnit))doc.ingredientPriceHistory.push({id:pcUid('IPH',doc.ingredientPriceHistory),ingredientId:saved.id,date:d,priceToman:price,source:'manual',purchaseUnit,recipeUnit,packageQuantity:pack,createdAt:ctx.at})}
 // a new preparation loss: today's recipe of every item using it gets a dated version (js/08 pcStageLossChange)
 if(before&&(Number(before.wastePercent)||0)!==waste){const menus=[...new Set(A(doc.recipes).filter(r=>r.ingredientId===saved.id).map(r=>r.menuItemId))];doc.recipeVersions=A(doc.recipeVersions);
  for(const menuItemId of menus)doc.recipeVersions.push({id:pcUid('RV',doc.recipeVersions),menuItemId,lines:snapshotLines(doc,menuItemId),effectiveFrom:E().CAL.today,createdAt:ctx.at,createdBy:ctx.actor,source:'ingredient-preparation-loss-change'})}
 ctx.auditExtra={entityId:saved.id,before};return{id:saved.id,code:saved.code,created:!before,priceChanged}}

const requireSalesCode=doc=>doc?.settings?.requireMenuSalesCode!==false;
function setRequireSalesCode(doc,ctx,{value}){doc.settings=doc.settings&&typeof doc.settings==='object'?doc.settings:{};const before=requireSalesCode(doc);if(before===!!value)throw Error('تغییری داده نشده است');doc.settings.requireMenuSalesCode=!!value;ctx.auditExtra={before,after:!!value};return !!value}
const codeKey=c=>NORM(c).replace(/\s/g,'');
function menuNameDuplicate(doc,{id,name,category}){return A(doc.menuItems).find(m=>m.id!==id&&NORM(m.name)===NORM(name)&&S(m.category)===S(category))||null}
function saveMenuItem(doc,ctx,x){
 const items=A(doc.menuItems),old=x.id?items.find(m=>m.id===x.id):null;if(x.id&&!old)throw Error('آیتم منو پیدا نشد');
 const name=S(x.name);if(!name)throw Error('نام آیتم الزامی است');
 if(old&&S(x.code)&&S(x.code)!==S(old.code))throw Error('کد آیتم ثبت‌شده (کد سپیدز) تغییر نمی‌کند');
 const code=old?S(old.code):S(x.code).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
 if(!old&&!code&&requireSalesCode(doc))throw Error('کد سپیدز آیتم الزامی است؛ بدون آن فروش این آیتم از فایل سپیدز وارد نمی‌شود');
 if(!old&&code&&items.some(m=>codeKey(m.code)===codeKey(code)))throw Error('این کد برای آیتم دیگری ثبت شده است');
 const status=x.status==='غیرفعال'?'غیرفعال':'فعال',siteStatus=x.siteStatus==='فعال'?'فعال':'غیرفعال';if(status==='غیرفعال'&&siteStatus==='فعال')throw Error('آیتم غیرفعال نمی‌تواند در سایت نمایش داده شود');
 const cats=A(doc.lists?.menuCategories),category=S(x.category)||'سایر';
 const target=S(x.customTargetCostPercent)===''?0:N(x.customTargetCostPercent);if(!(target>=0&&target<=100))throw Error('سقف اختصاصی باید بین ۰ و ۱۰۰ باشد');
 const manual=S(x.manualCostToman)===''?0:N(x.manualCostToman);if(!(manual>=0))throw Error('بهای دستی معتبر نیست');
 const o={name,category,unit:S(x.unit)||'عدد',customTargetCostPercent:target,manualCostToman:manual,manualCostEnabled:x.manualCostEnabled===true,status,siteStatus,labelPriceOnly:x.labelPriceOnly===true,notes:S(x.notes)};
 doc.lists=doc.lists&&typeof doc.lists==='object'?doc.lists:{};doc.settings=doc.settings&&typeof doc.settings==='object'?doc.settings:{};
 if(!cats.includes(category)){doc.lists.menuCategories=[...cats,category];doc.settings.categoryTargets={...(doc.settings.categoryTargets||{}),[category]:35}}
 const before=old?clone(old):null;let id;
 // an edited item's sale price goes through changePrice (price history row with cost and target), same as «تغییر قیمت»
 let priceRow=null;if(old&&S(x.price)!==''&&N(x.price)!==Z(old.currentPriceToman))priceRow=changePrice(doc,ctx,{menuId:old.id,price:x.price,note:x.priceNote||'تغییر قیمت از فرم آیتم'});
 if(old){Object.assign(old,o);id=old.id}
 else{const p=S(x.price)===''?0:N(x.price);if(!(p>=0))throw Error('قیمت فروش معتبر نیست');if(p%1000)throw Error('قیمت باید مضرب ۱٬۰۰۰ تومان باشد');id=pcUid('MENU',items);doc.menuItems=[...items,{id,code:code||pcUid('ITEM',items),...o,currentPriceToman:p,lastPriceChangeAt:p>0?ctx.at:null}]}
 ctx.auditExtra={entityId:id,before,...(priceRow?{price:{from:priceRow.oldPriceToman,to:priceRow.newPriceToman}}:{})};return{id,created:!before,priceRow}}
// js/45 deleteMenu: an item with sales lines or recipe versions is deactivated (and hidden on the site), otherwise removed with its current recipe
function removeMenuItem(doc,ctx,{id,salesCount}){const m=A(doc.menuItems).find(x=>x.id===id);if(!m)throw Error('آیتم منو پیدا نشد');const versions=A(doc.recipeVersions).filter(v=>v.menuItemId===id).length;ctx.auditExtra={entityId:id,before:clone(m)};
 if(salesCount||versions){Object.assign(m,{status:'غیرفعال',siteStatus:'غیرفعال',archivedAt:ctx.at,archivedBy:ctx.actor,archiveReason:salesCount?`دارای ${salesCount} ردیف فروش ثبت‌شده`:'دارای نسخه تاریخ‌دار رسپی'});return'deactivated'}
 doc.menuItems=A(doc.menuItems).filter(x=>x.id!==id);doc.recipes=A(doc.recipes).filter(r=>r.menuItemId!==id);return'removed'}

/* «آخرین قیمت» (stage 7b, owner request): when no purchase invoice is recorded, only the latest purchase price of
   items is entered; each changed price becomes a dated pricing.ingredientPriceHistory row (source manual-bulk) so the
   cost of that day on (recipes, consumption, profit and loss) follows it. The current price changes only when the date
   is not older than the last price date of the item. */
/* ---------- prepared (composite) items, e.g. burger patties (js/08 pcSavePreparedItem / pcPreparedItemConversion) ----------
   pricing.preparedItems[{id PREP-####, name, status, countUnit, baseOutputQuantity, standardUnitWeight, stateNote, notes,
   version, components[{id PREPC-####, ingredientId, quantity, unit, basis net|gross}]}]; the version goes up whenever the
   formula changes (unit, base quantity or components), so a count keeps the formula it was converted with. */
const PREP_UNITS=['عدد','کیلوگرم','گرم','لیتر','میلی‌لیتر','بسته'];
const convertQty=(...a)=>E().convertQty(...a);
const preparedItemConversion=(...a)=>E().prepConvert(...a);
function savePreparedItem(doc,ctx,x){doc.preparedItems=A(doc.preparedItems);const ings=A(doc.ingredients),name=S(x.name);if(!name)throw Error('نام قلم آماده‌سازی الزامی است');
 if(!PREP_UNITS.includes(S(x.countUnit)))throw Error('واحد شمارش معتبر انتخاب کنید');const base=N(x.baseOutputQuantity);if(!(base>0))throw Error('مقدار مبنای فرمول باید عدد مثبت باشد');
 const cur=x.id?doc.preparedItems.find(p=>p.id===x.id):null;if(x.id&&!cur)throw Error('قلم آماده‌سازی پیدا نشد');if(doc.preparedItems.some(p=>p.id!==x.id&&NORM(p.name)===NORM(name)))throw Error('این نام قبلاً تعریف شده است');
 const comps=A(x.components).filter(c=>S(c.ingredientId)).map((c,k)=>{const i=ings.find(v=>v.id===c.ingredientId);if(!i)throw Error(`ردیف ${k+1}: ماده در کاتالوگ نیست`);const q=N(c.quantity);if(!(q>0))throw Error(`ردیف ${k+1} («${i.name}»): مقدار مثبت لازم است`);const basis=c.basis==='gross'?'gross':'net',unit=S(c.unit)||i.recipeUnit;
  const cv=convertQty(i,q,unit,i.recipeUnit);if(cv.value===null)throw Error(`«${i.name}»: ${cv.reason}`);const old=A(cur?.components).find(o=>o.ingredientId===i.id);return{id:old?.id||'',ingredientId:i.id,quantity:q,unit,basis}});
 if(!comps.length)throw Error('حداقل یک ماده در فرمول لازم است');if(new Set(comps.map(c=>c.ingredientId)).size!==comps.length)throw Error('یک ماده دو بار در فرمول آمده است');
 let m=0;for(const p of doc.preparedItems)for(const c of A(p.components)){const q=S(c.id).match(/(\d+)$/);if(q)m=Math.max(m,+q[1])}for(const c of comps)if(!c.id)c.id=`PREPC-${String(++m).padStart(4,'0')}`;
 const w=S(x.standardUnitWeight)===''?null:N(x.standardUnitWeight);if(w!==null&&!(w>0))throw Error('وزن استاندارد هر عدد باید مثبت یا خالی باشد');
 const formula=c=>JSON.stringify({u:c?.countUnit,b:N(c?.baseOutputQuantity),c:A(c?.components).map(z=>[z.ingredientId,N(z.quantity),z.unit,z.basis])});
 const o={name,status:S(x.status)==='غیرفعال'?'غیرفعال':'فعال',countUnit:S(x.countUnit),baseOutputQuantity:base,standardUnitWeight:w,stateNote:S(x.stateNote),notes:S(x.notes),components:comps,updatedAt:ctx.at,updatedBy:ctx.actor};
 if(cur){const before=clone(cur);if(formula(cur)!==formula(o))o.version=(cur.version||1)+1;Object.assign(cur,o);ctx.auditExtra={entityId:cur.id,before};return cur}
 const it={id:pcUid('PREP',doc.preparedItems),version:1,createdAt:ctx.at,createdBy:ctx.actor,...o};doc.preparedItems.push(it);ctx.auditExtra={entityId:it.id};return it}

/* ---------- fryer oil per fried item ----------
   oil poured in a period (FRYER_OIL_CHANGE records, kg) is shared over the fried items sold in that period by their
   relative fried weight (a 4-piece portion takes more oil than an extra portion); per portion kg = weight × oil ÷ Σ(sold ×
   weight). setOilInRecipes writes that kg as the oil line of each item's recipe (new recipe version from the date), so
   it is part of the item's cost; the fryer-oil log start (settings.fryerOil.logFrom) keeps recipe oil out of the stock. */
function oilShare({oilKg,items}){const w=A(items).filter(x=>x.qty>0&&x.weight>0),tot=w.reduce((a,x)=>a+x.qty*x.weight,0);if(!(oilKg>0)||!(tot>0))return{perWeight:null,rows:w.map(x=>({...x,perPortion:null}))};
 const per=oilKg/tot;return{perWeight:per,rows:w.map(x=>({...x,perPortion:x.weight*per,used:x.qty*x.weight*per}))}}
function setOilInRecipes(doc,ctx,{oilId,rows,effectiveFrom}){const oil=A(doc.ingredients).find(i=>i.id===oilId);if(!oil)throw Error('قلم روغن سرخ‌کردنی پیدا نشد');const out=[];
 for(const r of A(rows)){const kg=Math.round(N(r.perPortion)*1e5)/1e5;if(!(kg>0))continue;const cur=recipeLines(doc,r.menuId);if(!cur.length)continue;const old=cur.find(l=>l.ingredientId===oilId);if(old&&Math.abs(Z(old.quantity)-kg)<1e-6)continue;
  const lines=cur.filter(l=>l.preparedItemId||l.ingredientId!==oilId).map(l=>l.preparedItemId?{preparedItemId:l.preparedItemId,quantity:l.quantity,notes:l.notes}:{ingredientId:l.ingredientId,quantity:l.quantity,notes:l.notes}).concat([{ingredientId:oilId,quantity:kg,notes:'سهم روغن سرخ‌کن از تعویض‌های روغن'}]);
  const sub={...ctx,auditExtra:null};saveRecipe(doc,sub,{menuId:r.menuId,lines,effectiveFrom,note:'به‌روزرسانی سهم روغن'});out.push({menuId:r.menuId,kg,before:old?Z(old.quantity):null})}
 if(!out.length)throw Error('تغییری در رسپی‌ها نیست (آیتم بدون رسپی یا مقدار برابر)');ctx.auditExtra={oilId,effectiveFrom,items:out};return out}

/* prices from an Excel sheet (js/08 pcReadIngredientsExcel mode «prices»): header row found in the first 25 rows of any
   sheet by the same column names; item by code, else by name; a raw Sepidz goods sheet (ضریب مصرف + نوع کالا + واحد
   مصرف) is in rial and divided by 10; an optional price-date column gives each row its own date. Nothing is written here. */
const PX_COLS={code:['کد ماده','کد ماده اولیه','کد کالا','کد'],name:['نام ماده','نام ماده اولیه','نام کالا','شرح'],price:['آخرین قیمت خرید تومان','آخرین قیمت خرید','قیمت خرید تومان','قیمت خرید','قیمت'],date:['تاریخ آخرین قیمت','تاریخ خرید','تاریخ قیمت']};
const pxH=s=>NORM(s).replace(/[\s‌]/g,'');
function pxDate(v){const s=S(v).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)),z=s.replace(/\D/g,'');if(z.length===8)return`${z.slice(0,4)}/${z.slice(4,6)}/${z.slice(6,8)}`;const m=s.match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);return m?`${m[1]}/${m[2].padStart(2,'0')}/${m[3].padStart(2,'0')}`:''}
function parsePriceSheets(sheets,ingredients){let best=null;
 for(const [sheet,rows] of A(sheets))for(let r=0;r<Math.min(A(rows).length,25);r++){const h=A(rows[r]).map(pxH),find=al=>{const as=al.map(pxH);return h.findIndex(x=>x&&as.some(a=>x===a||x.includes(a)))},map={code:find(PX_COLS.code),name:find(PX_COLS.name),price:find(PX_COLS.price),date:find(PX_COLS.date)},score=(map.name>=0?3:0)+(map.code>=0?2:0)+(map.price>=0?3:0);if(!best||score>best.score)best={sheet,rows,r,map,h,score}}
 if(!best||best.map.price<0||(best.map.name<0&&best.map.code<0))throw Error('ستون قیمت و کد یا نام کالا در فایل پیدا نشد');
 const sep=['ضریبمصرف','نوعکالا','واحدمصرف'].every(k=>best.h.includes(k)),ings=A(ingredients),out={sheet:best.sheet,sepidz:sep,rows:[],notFound:[],bad:[]},seen=new Set;
 for(const row of best.rows.slice(best.r+1)){const g=k=>best.map[k]>=0?row[best.map[k]]:'',code=S(g('code')),name=S(g('name'));if(!code&&!name)continue;
  const i=ings.find(x=>code&&NORM(x.code)===NORM(code))||ings.find(x=>name&&NORM(x.name)===NORM(name));if(!i){out.notFound.push(name||code);continue}
  if(S(g('price'))==='')continue;const raw=N(g('price'));if(!(raw>0)){out.bad.push(i.name);continue}if(seen.has(i.id))continue;seen.add(i.id);
  out.rows.push({id:i.id,name:i.name,price:Math.round((sep?raw/10:raw)*100)/100,date:pxDate(g('date'))})}
 return out}
function setLatestPrices(doc,ctx,{date,rows,source='manual-bulk'}){const d0=E().D(date);if(!d0)throw Error('تاریخ قیمت معتبر نیست');if(d0>E().CAL.today)throw Error('تاریخ قیمت بعد از امروز است');
 const ings=A(doc.ingredients),out=[];doc.ingredientPriceHistory=A(doc.ingredientPriceHistory);
 for(const r of A(rows)){const i=ings.find(x=>x.id===r.id);if(!i)throw Error('قلم پیدا نشد: '+r.id);const p=N(r.price);if(!(p>0))throw Error('قیمت «'+i.name+'» باید عدد مثبت باشد');
  const d=r.date?E().D(r.date):d0;if(!/^\d{4}\/\d{2}\/\d{2}$/.test(d||''))throw Error('تاریخ قیمت «'+i.name+'» معتبر نیست');if(d>E().CAL.today)throw Error('تاریخ قیمت «'+i.name+'» بعد از امروز است');
  const last=S(i.lastPurchaseDate);if(p===Z(i.lastPurchasePriceToman)&&last===d)continue;
  doc.ingredientPriceHistory.push({id:pcUid('IPH',doc.ingredientPriceHistory),ingredientId:i.id,date:d,priceToman:p,source,purchaseUnit:i.purchaseUnit,recipeUnit:i.recipeUnit,packageQuantity:Z(i.packageQuantity),createdAt:ctx.at,createdBy:ctx.actor});
  if(!last||d>=last)Object.assign(i,{lastPurchasePriceToman:p,lastPurchaseDate:d,lastPurchaseSource:source==='excel'?'excel':'manual',lastPurchaseInvoiceId:''});out.push({id:i.id,price:p,date:d,current:!last||d>=last})}
 if(!out.length)throw Error('قیمت تازه‌ای وارد نشده است');ctx.auditExtra={date:d0,count:out.length,source};return out}
/* ---------- base unit label fix (اصلاح نام واحد پایه، بدون تبدیل) ----------
   The base unit is locked once an item has history, because every stored quantity is in it. When the label itself is wrong
   but the numbers are right (e.g. «عدد» on a juice whose purchase unit is «لیتر» with «هر لیتر = ۱ عدد»: every stored
   quantity already means a litre) only the label changes: recipeUnit = the new name, the old one goes to baseUnitRenames
   [{from,to,at,by,reason}] so counts, receipts, invoice prices and formulas saved under it stay the same unit
   (InvEngine.sameUnit / convertQty). Allowed only to a name that already equals one base unit: the purchase unit with
   «هر واحد خرید = ۱» or an active other unit with factor 1. Nothing is converted, no stored number changes. */
function renameTargets(i){if(!i)return[];const out=[],base=E().UK(i.recipeUnit),add=n=>{n=S(n);if(n&&E().UK(n)!==base&&!out.some(x=>E().UK(x)===E().UK(n)))out.push(n)};
 if(Z(i.packageQuantity)===1)add(i.purchaseUnit);for(const u of A(i.countingUnits))if(u&&u.active!==false&&Z(u.factor)===1)add(u.name);return out}
// preview: what keeps its numbers and only shows the new label
function renameBaseUnitPlan(doc,inv,id,to){const i=A(doc?.ingredients).find(x=>x.id===id);if(!i)return{ok:false,why:'قلم پیدا نشد'};const t=S(to),targets=renameTargets(i);
 const why=!t?'نام تازه را انتخاب کنید':E().UK(t)===E().UK(i.recipeUnit)?'همان واحد فعلی است':!targets.some(x=>E().UK(x)===E().UK(t))?`«${t}» با ضریب ۱ معادل واحد پایه نیست؛ فقط واحد خرید با «هر واحد خرید = ۱» یا واحد دیگری با ضریب ۱`:'';
 const lines=A(doc.recipes).filter(r=>r.ingredientId===id),menus=new Set(lines.map(r=>r.menuItemId)),cnt=k=>A(inv?.[k]).filter(r=>(r.ingredientId||r.itemId)===id).length;
 const counts=A(inv?.stocktakes).reduce((a,st)=>a+A(st.lines).filter(l=>l.ingredientId===id).length,0);
 return{ok:!why,why,from:S(i.recipeUnit),to:t,targets,recipeLines:lines.length,menus:menus.size,counts,receipts:cnt('stockReceipts'),waste:cnt('wasteRecords')+cnt('consumptionRecords'),prices:A(doc.ingredientPriceHistory).filter(h=>h.ingredientId===id).length}}
function renameBaseUnit(doc,ctx,{id,to,reason}){const i=A(doc.ingredients).find(x=>x.id===id);if(!i)throw Error('قلم پیدا نشد');if(!S(reason))throw Error('دلیل اصلاح لازم است');
 const pl=renameBaseUnitPlan(doc,null,id,to);if(!pl.ok)throw Error(pl.why);const from=S(i.recipeUnit),t=pl.to,before=clone(i);
 i.baseUnitRenames=[...A(i.baseUnitRenames),{from,to:t,factor:1,at:ctx.at,by:ctx.actor,reason:S(reason)}];i.recipeUnit=t;
 // an other unit that was the same as the new base is now the base itself
 i.countingUnits=A(i.countingUnits).filter(u=>!(E().UK(u.name)===E().UK(t)&&Z(u.factor)===1));
 if(E().UK(i.useUnit)===E().UK(from))i.useUnit='';if(E().UK(i.countUnit)===E().UK(from))i.countUnit='';
 i.updatedAt=ctx.at;ctx.auditExtra={entityId:id,from,to:t,reason:S(reason),before};return{id,code:i.code,name:i.name,from,to:t}}
window.MenuWrite={unitUsage,unitList,saveUnitList,renameTargets,renameBaseUnitPlan,renameBaseUnit,onlinePricePlan,applyOnlinePrices,bulkIngredients,TYPE_STD,typeLabels,groupType,CATALOG_STD,classifyItem,catalogPlan,applyCatalogStructure,saveTypeSettings,saveIngredientGroups,groupCounts,ingredientRefs,cleanupPlan,cleanupIngredients,prepCost:(doc,p)=>prepUnitCost(doc,new Map(A(doc.ingredients).map(i=>[i.id,i])),p),oilShare,setOilInRecipes,PREP_UNITS,preparedItemConversion,savePreparedItem,setLatestPrices,parsePriceSheets,NORM,ITEM_TYPES,DRIVERS,UNITS_DEFAULT,duplicateNames,nextIngredientCode,ingredientUsage,saveIngredient,requireSalesCode,setRequireSalesCode,menuNameDuplicate,saveMenuItem,removeMenuItem,unitCost,metrics,recipeLines,versionsOf,versionDrift,sameRecipe,snapshotLines,recipeCapable,priceStep,saveRecipe,changePrice,saveSettings,validPricing};
})();
