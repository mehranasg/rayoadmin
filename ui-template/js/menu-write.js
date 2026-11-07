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
function unitCost(i){if(!i)return{v:NaN,why:'ماده در کاتالوگ نیست'};const pk=Number(i.packageQuantity),price=Number(i.lastPurchasePriceToman),pu=E().UK(i.purchaseUnit),ru=E().UK(i.recipeUnit),w=Number(i.wastePercent)||0,y=1-w/100;
 if(!pu||!ru||(FAM[pu]&&FAM[ru]&&FAM[pu]!==FAM[ru]))return{v:NaN,why:'واحد خرید و مصرف ناسازگار'};if(!(pk>0))return{v:NaN,why:'مقدار بسته نامعتبر'};if(!(price>0))return{v:NaN,why:'بدون قیمت خرید'};if(!(y>0))return{v:NaN,why:'افت نامعتبر'};return{v:price/pk/y,why:''}}
const recipeLines=(doc,menuId)=>A(doc.recipes).filter(r=>r.menuItemId===menuId);
function metrics(doc,m,ingMap){const ing=ingMap||new Map(A(doc.ingredients).map(i=>[i.id,i])),lines=recipeLines(doc,m.id);
 const rows=lines.map(l=>{const i=ing.get(l.ingredientId),u=unitCost(i),qty=Z(l.quantity),ok=Number.isFinite(u.v)&&u.v>0&&qty>0;return{l,i,qty,unit:u.v,cost:ok?u.v*qty:null,why:ok?'':qty<=0?'مقدار صفر یا خالی':u.why}});
 let cost=rows.reduce((a,r)=>a+(r.cost||0),0),manual=false;const missing=rows.filter(r=>r.cost===null).length;
 if(!lines.length&&m.manualCostEnabled!==false&&Z(m.manualCostToman)>0){cost=Z(m.manualCostToman);manual=true}
 const s=doc.settings||{},price=Z(m.currentPriceToman),target=Z(m.customTargetCostPercent)||Z(s.categoryTargets?.[m.category])||35,complete=cost>0&&missing===0,step=priceStep(doc);
 return{rows,cost,manual,missing,complete,price,target,step,ratio:price>0&&cost>0?cost/price*100:null,margin:complete&&price>0?price-cost:null,suggested:complete&&target>0?Math.ceil(cost/(target/100)/step)*step:0,state:!lines.length?(manual?'manual':'none'):missing?'incomplete':'complete'}}
const priceStep=doc=>Math.max(1000,Z(doc.settings?.priceIncrementToman)||10000);
const recipeCapable=i=>!!i&&['MENU_INGREDIENT','MENU_CONSUMABLE'].includes(i.itemType||'MENU_INGREDIENT');
function versionsOf(doc,menuId){return A(doc.recipeVersions).filter(v=>v.menuItemId===menuId).sort((a,b)=>S(b.effectiveFrom).localeCompare(S(a.effectiveFrom))||S(b.createdAt).localeCompare(S(a.createdAt)))}
// same comparison as js/32 sameRecipe
function sameRecipe(a,b){const norm=rows=>A(rows).map(x=>`${x.ingredientId}|${Z(x.quantity)}|${x.locationId||''}|${S(x.notes)}|${x.wastePercent??''}|${x.recipeUnit||''}`).sort();const x=norm(a),y=norm(b);return x.length===y.length&&x.every((v,i)=>v===y[i])}
function snapshotLines(doc,menuId){const ing=new Map(A(doc.ingredients).map(i=>[i.id,i]));return recipeLines(doc,menuId).map(r=>{const i=ing.get(r.ingredientId),w=Number(i?.wastePercent)||0;if(!i||!(Z(r.quantity)>0)||!(w>=0&&w<100))throw Error('نسخهٔ رسپی ناقص است؛ مقدار و افت مواد را بررسی کنید');return{...clone(r),id:r.id||'',quantity:Z(r.quantity),notes:r.notes||'',locationId:r.locationId||'',wastePercent:w,recipeUnit:i.recipeUnit}})}
// does the current recipe (pricing.recipes) match the version effective today?
// (ingredient and quantity only: migrated versions carry no loss/unit snapshot)
function versionDrift(doc,menuId){const v=versionsOf(doc,menuId).find(v=>(E().D(v.effectiveFrom)||'0000/00/00')<=E().CAL.today),cur=recipeLines(doc,menuId);if(!v)return cur.length?'no-version':'';const k=rows=>A(rows).map(x=>`${x.ingredientId}|${Z(x.quantity)}`).sort().join(';');return k(v.lines)===k(cur)?'':'differs'}

/* ---------- recipe edit ---------- */
function saveRecipe(doc,ctx,{menuId,lines,effectiveFrom,note}){const m=A(doc.menuItems).find(x=>x.id===menuId);if(!m)throw Error('آیتم منو پیدا نشد');const ing=new Map(A(doc.ingredients).map(i=>[i.id,i])),today=E().CAL.today;
 const rows=A(lines).map((x,k)=>{const i=ing.get(S(x.ingredientId));if(!recipeCapable(i))throw Error(`سطر ${k+1}: مادهٔ رسپی (مادهٔ اولیه یا ملزوم منو) را انتخاب کنید`);if(i.status==='غیرفعال'&&!recipeLines(doc,menuId).some(r=>r.ingredientId===i.id))throw Error(`«${i.name}» غیرفعال است`);const q=N(x.quantity);if(!(q>0))throw Error(`سطر ${k+1} (${i.name}): مقدار مثبت لازم است`);const w=Number(i.wastePercent)||0;if(!(w>=0&&w<100))throw Error(`افت «${i.name}» نامعتبر است`);return{i,quantity:Math.round(q*1e6)/1e6,notes:S(x.notes)}});
 if(!rows.length)throw Error('رسپی دست‌کم یک ماده لازم دارد');if(new Set(rows.map(r=>r.i.id)).size!==rows.length)throw Error('یک ماده دو بار در رسپی آمده است');
 const latest=versionsOf(doc,menuId)[0];let from=E().D(effectiveFrom)||today;if(E().CAL.i(from)===null)throw Error('تاریخ اثر معتبر نیست');if(from>today)throw Error('تاریخ اثر نمی‌تواند در آینده باشد');
 if(latest&&latest.effectiveFrom!=='0000/00/00'&&from<E().D(latest.effectiveFrom))throw Error(`تاریخ اثر نمی‌تواند قبل از آخرین نسخه (${latest.effectiveFrom}) باشد`);
 // current lines: keep the id of an ingredient already in the recipe
 doc.recipes=A(doc.recipes);const old=recipeLines(doc,menuId),keep=doc.recipes.filter(r=>r.menuItemId!==menuId),next=[];
 for(const x of rows){const o=old.find(r=>r.ingredientId===x.i.id);next.push(o?{...o,quantity:x.quantity,notes:x.notes}:{id:pcUid('REC',[...doc.recipes,...next]),menuItemId:menuId,ingredientId:x.i.id,quantity:x.quantity,notes:x.notes})}
 const changed=!(old.length===next.length&&old.every(o=>{const n=next.find(z=>z.id===o.id);return n&&Z(n.quantity)===Z(o.quantity)&&S(n.notes)===S(o.notes)}));
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

/* ---------- pricing settings ---------- */
function saveSettings(doc,ctx,{targets,step}){doc.settings=doc.settings&&typeof doc.settings==='object'?doc.settings:{};const before={categoryTargets:clone(doc.settings.categoryTargets||{}),priceIncrementToman:doc.settings.priceIncrementToman};const cats=new Set([...A(doc.lists?.menuCategories),...A(doc.menuItems).map(m=>m.category),...Object.keys(doc.settings.categoryTargets||{})].filter(Boolean));
 doc.settings.categoryTargets=doc.settings.categoryTargets||{};for(const [c,v] of Object.entries(targets||{})){if(!cats.has(c))throw Error(`دستهٔ «${c}» در منو نیست`);const n=N(v);if(!(n>=1&&n<=100))throw Error(`هدف «${c}» باید بین ۱ و ۱۰۰ درصد باشد`);doc.settings.categoryTargets[c]=Math.round(n*10)/10}
 if(step!==undefined&&S(step)!==''){const s=N(step);if(!(s>=1000))throw Error('گام قیمت دست‌کم ۱٬۰۰۰ تومان است');doc.settings.priceIncrementToman=Math.ceil(s/1000)*1000}
 if(JSON.stringify(before)===JSON.stringify({categoryTargets:doc.settings.categoryTargets,priceIncrementToman:doc.settings.priceIncrementToman}))throw Error('تغییری داده نشده است');ctx.auditExtra={before};return doc.settings}

const validPricing=doc=>!!doc&&typeof doc==='object'&&Array.isArray(doc.menuItems)&&Array.isArray(doc.ingredients)&&Array.isArray(doc.recipes);
window.MenuWrite={unitCost,metrics,recipeLines,versionsOf,versionDrift,sameRecipe,snapshotLines,recipeCapable,priceStep,saveRecipe,changePrice,saveSettings,validPricing};
})();
