/* =========================================================
   Rayo UI Template — inventory-write.js
   Inventory entries from the new panel onto the live RayoData API (stage 2).
   Records have exactly the shapes the current panel writes:
     receipt  → stockReceipts + PURCHASE_RECEIPT movement           (js/46 saveReceiptBatch)
     waste    → wasteRecords / consumptionRecords + movements       (js/32 saveEventOnce + syncWasteMovement)
     oil      → consumptionRecords FRYER_OIL_CHANGE + movement      (js/32 saveOilChange)
     count    → whole count (inventoryScope RAYO, END) merged by date (js/32 whole count)
     void     → status 'void' with reason; nothing is ever deleted  (js/46 confirmVoidReceipt, js/32 voidOilChange)
   Save protocol (js/32 controlEdit/controlPersist): fresh Load → change a copy → audit row in changeLog → Save →
   reload and compare (canonical JSON + save token). If the result cannot be confirmed, further saves are blocked
   until the page is reloaded. No Seed, no automatic save, inventory module only (pricing is never written here).
   ========================================================= */
(function(){
'use strict';
const E=()=>window.InvEngine;
const A=x=>Array.isArray(x)?x:[];
const S=x=>String(x??'').trim();
const N=v=>{const n=Number(String(v??'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/٫/g,'.').replace(/[٬,\s]/g,''));return Number.isFinite(n)?n:NaN};
const D=v=>E().D(v);
const clone=x=>JSON.parse(JSON.stringify(x));
const now=()=>new Date().toISOString();
const r3=x=>Math.round(x*1000)/1000;
const EVENT_LABELS={WASTE:'ضایعات/پرتی',SPILL:'ریزش اتفاقی',EXPIRY:'فساد/انقضا',BREAKAGE:'شکستگی/خرابی مصرفی',MISSING:'مفقودی',STAFF_CONSUMPTION:'مصرف پرسنلی',MANAGEMENT_GUEST:'مهمان مدیریت',TEST_CONSUMPTION:'تست محصول',OTHER_AUTHORIZED:'سایر مصرف مجاز',FRYER_OIL_CHANGE:'تعویض روغن سرخ‌کن',TABLE_SERVICE:'مصرف سر میز'};
const AUTH_TYPES=new Set(['STAFF_CONSUMPTION','MANAGEMENT_GUEST','TEST_CONSUMPTION','OTHER_AUTHORIZED','FRYER_OIL_CHANGE','TABLE_SERVICE']);
const OIL_FRYERS_DEFAULT=[{id:'F1',name:'سرخ‌کن ۱',liters:20},{id:'F2',name:'سرخ‌کن ۲',liters:20},{id:'F3',name:'سرخ‌کن ۳',liters:20},{id:'T1',name:'رومیزی ۱',liters:4.5},{id:'T2',name:'رومیزی ۲',liters:4.5}];
const SHIFTS=['صبح','عصر','دو شیفت'];

/* ---------- helpers shared with the current panel (same rules) ---------- */
// the server drops trailing zeros of the milliseconds (.210Z → .21Z): compare ISO times without them (BL-045 bug)
const ISO_MS=/\.(\d{1,9})Z$/;
function canonical(x){if(Array.isArray(x))return '['+x.map(v=>v===undefined||typeof v==='function'?'null':canonical(v)).join(',')+']';if(x&&typeof x==='object'){if(typeof x.toJSON==='function')return canonical(x.toJSON());return '{'+Object.keys(x).filter(k=>x[k]!==undefined&&typeof x[k]!=='function').sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}'}if(typeof x==='number'&&!Number.isFinite(x))return 'null';if(typeof x==='string'&&ISO_MS.test(x))return JSON.stringify(x.replace(ISO_MS,(m,f)=>(f.replace(/0+$/,'')?'.'+f.replace(/0+$/,''):'')+'Z'));return JSON.stringify(x)}
function content(doc){const x=clone(doc);if(x.meta){delete x.meta.serverSaveToken;delete x.meta.updatedAt}return canonical(x)}
const uid=(prefix,rows=[])=>{let m=0;A(rows).forEach(x=>{const q=S(x.id).match(/(\d+)$/);if(q)m=Math.max(m,+q[1])});return `${prefix}-${String(m+1).padStart(6,'0')}`};
const requestId=()=>`${Date.now().toString(36)}${Math.random().toString(36).slice(2,8)}`.toUpperCase();
const validDate=d=>!!d&&E().CAL.i(d)!==null;
const wholeScope=r=>r?.inventoryScope==='RAYO';
const boundary=r=>r?.baselineBoundary==='START'?'START':'END';
const rank=r=>`${D(r.date)}|${boundary(r)==='START'?'0':'1'}`;
function closedPeriod(doc,date){return A(doc.periodClosures).find(c=>c.status==='closed'&&D(c.to)>=date)||null}
function ingredients(pricing){return new Map(A(pricing?.ingredients).map(i=>[i.id,i]))}
const stockItem=i=>!!i&&i.status!=='غیرفعال'&&i.itemType!=='NON_STOCK'&&i.inventoryTracked!==false;
function trackedItems(pricing){return A(pricing?.ingredients).filter(stockItem)}
const unitName=i=>S(i?.recipeUnit||i?.unit||i?.stockUnit||'واحد');
// entry units of an item, all as a factor of the base (stock) unit: the base unit, the purchase unit when it is a different
// unit with a package size, the item's other active units (pricing.ingredients[].countingUnits {name, factor}, e.g. بسته ۳۵۰
// گرمی = ۳۵۰ گرم) and, automatically, the standard unit of the same kind (کیلوگرم ↔ گرم, لیتر ↔ میلی‌لیتر) so nobody
// converts by hand. Once any weight unit is known (base, purchase or another unit, e.g. «۱ عدد = ۹۰۰ گرم») گرم and کیلوگرم
// both come; the same for میلی‌لیتر / لیتر; with the item's density (densityKgPerLiter) weight and volume convert to each
// other (cross). Stock, cost and every saved quantity stay in the base unit; the entered unit is kept beside it.
const STD_UNITS=[['کیلوگرم','m',1],['گرم','m',0.001],['لیتر','v',1],['میلی‌لیتر','v',0.001]],STD_KIND={kg:['m',1],g:['m',0.001],l:['v',1],ml:['v',0.001]};
function stdUnits(out,density){const has=n=>out.some(u=>E().UK(u.name)===E().UK(n)),per={};
 for(const u of out){const k=STD_KIND[E().UK(u.name)];if(k&&!per[k[0]])per[k[0]]=u.factor/k[1]}
 const d=Number(density),cross={};if(d>0){if(per.m&&!per.v){per.v=per.m*d;cross.v=1}else if(per.v&&!per.m){per.m=per.v/d;cross.m=1}}
 for(const [n,k,s] of STD_UNITS)if(per[k]&&!has(n))out.push({name:n,factor:per[k]*s,auto:true,...(cross[k]?{cross:true}:{})});return out}
function unitsOf(i){const out=[{name:unitName(i),factor:1}],pk=Number(i?.packageQuantity),has=n=>out.some(u=>E().UK(u.name)===E().UK(n));if(S(i?.purchaseUnit)&&pk>0&&!has(i.purchaseUnit))out.push({name:S(i.purchaseUnit),factor:pk,purchase:true});
 for(const u of A(i?.countingUnits)){const n=S(u?.name),f=Number(u?.factor);if(u&&u.active!==false&&n&&f>0&&!has(n))out.push({name:n,factor:f})}
 return stdUnits(out,i?.densityKgPerLiter)}
// the unit a recipe line / waste starts in (pricing.ingredients[].useUnit; otherwise گرم for a کیلوگرم item, میلی‌لیتر for لیتر)
function useUnitOf(i){const us=unitsOf(i),pick=n=>us.find(u=>E().UK(u.name)===E().UK(n));return pick(S(i?.useUnit))||pick(({kg:'گرم',l:'میلی‌لیتر'})[E().UK(unitName(i))])||us[0]}
// the unit a count starts in (pricing.ingredients[].countUnit, else the base unit); the open remainder goes in the smallest unit
function countUnitOf(i){const us=unitsOf(i);return us.find(u=>E().UK(u.name)===E().UK(S(i?.countUnit)))||us[0]}
const smallestUnit=i=>unitsOf(i).filter(u=>!u.cross).reduce((m,u)=>u.factor<m.factor?u:m);
// quantity in a unit of the item → base unit (null when the unit is not one of the item's units)
function toBase(i,qty,unit){const u=unitsOf(i).find(x=>x.name===S(unit))||(S(unit)?null:unitsOf(i)[0]);return u?{value:Number(qty)*u.factor,unit:u}:null}
// purchase units of an item for invoice / order rows: the default purchase unit first (its package size), then the other units
function purchaseUnitsOf(i){if(!i)return[];const pk=Number(i.packageQuantity)>0?Number(i.packageQuantity):1,out=[];if(S(i.purchaseUnit))out.push({name:S(i.purchaseUnit),factor:pk});for(const u of unitsOf(i))if(!out.some(o=>E().UK(o.name)===E().UK(u.name)))out.push(u);return out}
function mainLocation(doc){const id=S(doc.settings?.mainLocationId);return A(doc.locations).find(l=>l.id===id)||A(doc.locations)[0]||(id?{id,name:''}:null)}
function audit(doc,action,details,ctx){doc.changeLog=A(doc.changeLog);const row={id:`${ctx.module==='pricing'?'PLOG':ctx.module==='personnel'?'LOG':ctx.module==='suppliers'?'SLOG':ctx.module==='assets'?'ALOG':ctx.module==='finance'?'FLOG':ctx.module==='cashreport'?'CLOG':ctx.module==='attendance'?'ATL':'ICT'}-${ctx.reqId}`,action,at:ctx.at,actor:ctx.actor,via:'ui-template',...details};
 // pricing.changeLog is newest-first and the current panel keeps its first 500 rows, so pricing rows go to the front
 if(['pricing','personnel','suppliers','assets','finance','cashreport','attendance'].includes(ctx.module))doc.changeLog.unshift(row);else doc.changeLog.push(row);if(ctx.module==='cashreport'||ctx.module==='attendance')doc.changeLog=doc.changeLog.slice(0,500);return row}
function checkDate(doc,date,label='تاریخ'){if(!validDate(date))throw Error(`${label} معتبر نیست (مثال ۱۴۰۵/۰۸/۱۷)`);if(date>E().CAL.today)throw Error(`${label} نمی‌تواند در آینده باشد`);const c=closedPeriod(doc,date);if(c)throw Error(`دورهٔ ${c.from||''} تا ${c.to} بسته است`)}

/* ---------- receipt (js/46 saveReceiptBatch, DIRECT_ENTRY) ---------- */
function receiptLines(pricing,lines){const ing=ingredients(pricing);return A(lines).map((x,k)=>{const i=ing.get(S(x.itemId));if(!stockItem(i))throw Error(`ردیف ${k+1}: کالای انبار را انتخاب کنید`);const u=unitsOf(i).find(u=>u.name===S(x.unit))||unitsOf(i)[0],q=N(x.quantity);if(!(q>0))throw Error(`ردیف ${k+1} (${i.name}): مقدار مثبت لازم است`);return{i,unit:u,entryQuantity:q,quantity:r3(q*u.factor),note:S(x.note)}})}
// same warnings as the current panel: «kg» entered as grams, or the opening count of the same day entered again
function receiptWarnings(doc,pricing,date,lines){const out=[],opening=A(doc.stocktakes).filter(s=>s.status==='approved'&&wholeScope(s)&&s.baselineBoundary==='START'&&S(s.date)===date).flatMap(s=>A(s.lines));let pos=null;try{pos=new Map(E().positions(E().build({inventory:doc,pricing}),E().CAL.today).map(r=>[r.id,r.qty]))}catch(_){}
 for(const x of lines){const unit=unitName(x.i),p=Number(pos?.get(x.i.id))||0,open=opening.find(l=>l.ingredientId===x.i.id),thousand=open&&Number(open.actual)>0&&Math.abs(Number(open.actual)*1000-x.quantity)<1e-6;
  if(thousand||/^(کیلو(گرم)?|لیتر|kg|l)$/i.test(unit)&&x.quantity>=100||p>0&&x.quantity>=20&&x.quantity>p*50)out.push(`«${x.i.name}»: ${x.quantity} ${unit} خیلی بیشتر از معمول است؛ شاید به گرم یا میلی‌لیتر وارد شده باشد.`);
  else if(open&&Math.abs(Number(open.actual)-x.quantity)<1e-9)out.push(`«${x.i.name}»: برابر شمارش افتتاحیهٔ همین تاریخ است؛ این ورود موجودی را دو برابر می‌کند.`)}
 return out}
function addReceipts(doc,ctx,{date,lines}){date=D(date);checkDate(doc,date,'تاریخ ورود');const l=mainLocation(doc);if(!l)throw Error('انبار اصلی تعریف نشده است');const rows=receiptLines(ctx.pricing,lines);if(!rows.length)throw Error('حداقل یک ردیف لازم است');
 doc.stockReceipts=A(doc.stockReceipts);doc.inventoryMovements=A(doc.inventoryMovements);const actionId=ctx.reqId,ids=[];
 rows.forEach((x,k)=>{const id=`REC-DIRECT-${actionId}-${k+1}`,unit=unitName(x.i);ids.push(id);
  doc.stockReceipts.push({id,requestId:actionId,batchId:`RECB-${actionId}`,date,ingredientId:x.i.id,locationId:l.id,quantity:x.quantity,entryQuantity:x.entryQuantity,entryUnit:x.unit.name,entryUnitFactor:x.unit.factor,totalPriceToman:null,unitCostToman:null,status:'posted',sourceType:'DIRECT_ENTRY',notes:x.note,itemNameSnapshot:x.i.name,itemCodeSnapshot:x.i.code||'',unitSnapshot:unit,locationNameSnapshot:l.name||'',createdAt:ctx.at,createdBy:ctx.actor});
  doc.inventoryMovements.push({id:`MOV-${actionId}-${k+1}`,requestId:actionId,date,movementType:'PURCHASE_RECEIPT',ingredientId:x.i.id,quantity:x.quantity,fromLocationId:'',toLocationId:l.id,reasonCode:'PURCHASE',referenceType:'directStockReceipt',referenceId:id,sourceKey:`receipt:${id}`,status:'posted',unitCostToman:null,unitSnapshot:unit,notes:x.note,createdAt:ctx.at,createdBy:ctx.actor})});
 return{ids,count:rows.length}}
function voidReceipt(doc,ctx,{id,reason}){reason=S(reason);if(!reason)throw Error('علت ابطال لازم است');const r=A(doc.stockReceipts).find(x=>x.id===id);if(!r)throw Error('ورود پیدا نشد');if(r.status==='void')throw Error('این ورود قبلاً باطل شده است');if(r.invoiceId&&r.invoiceLink!=='matched')throw Error('این ورود را فاکتور خرید ساخته است؛ از «مالی ← فاکتورهای خرید» همان فاکتور را ویرایش یا لغو کنید');const c=closedPeriod(doc,D(r.date));if(c)throw Error(`دورهٔ ${c.from||''} تا ${c.to} بسته است`);if(A(ctx.pricing?.ingredientPriceHistory).some(h=>h.receiptId===id))throw Error('این ورود قیمت خرید ثبت کرده است؛ ابطال آن از پنل فعلی انجام شود');
 ctx.auditExtra={entityId:r.id,before:clone(r),reason};
 Object.assign(r,{status:'void',statusBeforeVoid:r.status||'posted',voidReason:reason,voidedAt:ctx.at,voidedBy:ctx.actor});
 A(doc.inventoryMovements).filter(x=>x.sourceKey===`receipt:${id}`||x.referenceId===id).forEach(x=>Object.assign(x,{status:'void',voidReason:reason,voidedAt:ctx.at,voidedBy:ctx.actor}));return r}

/* ---------- waste / authorized consumption (js/32 saveEventOnce + syncWasteMovement) ---------- */
function addMovementsFor(doc,w,ctx,M){doc.inventoryMovements=A(doc.inventoryMovements);const kind=w.recordKind==='consumption'?'consumption':'waste',base=`${kind}:${w.id}`,loc=w.locationId||doc.settings?.mainLocationId||'';
 const push=(key,ingredientId,quantity)=>{const m={id:uid('MOV',doc.inventoryMovements),date:w.date,time:w.time||'',movementType:w.eventType||'WASTE',ingredientId,quantity,fromLocationId:loc,toLocationId:'',reasonCode:w.reason||'',referenceType:kind==='consumption'?'consumptionRecord':'wasteRecord',referenceId:w.id,sourceKey:key,status:'posted',personnelId:w.reportedByPersonnelId||w.responsiblePersonnelId||'',personnelName:w.reportedByName||'',shift:w.shift||'',notes:w.notes||'',reviewStatus:w.reviewStatus||'',managerNote:w.managerNote||'',updatedAt:ctx.at,createdAt:w.createdAt||ctx.at,createdBy:w.createdBy||ctx.actor};doc.inventoryMovements.push(m);return m};
 if(w.type==='ingredient'){w.movementId=push(base,w.itemId,w.quantity).id}
 else for(const r of M.recipeAt(w.itemId,w.date))push(`${base}:${r.ingredientId}`,r.ingredientId,M.gross(M.ing.get(r.ingredientId),r,Number(w.quantity)))}
/* waste / use of a prepared item (e.g. Caesar sauce thrown away): one ingredient record per formula ingredient (gross,
   recipe unit), all carrying preparedItemId and one preparedGroupId, so both panels read them as ordinary records */
function addPreparedEvent(doc,ctx,input){const p=A(ctx.pricing?.preparedItems).find(x=>x.id===S(input.itemId));if(!p)throw Error('قلم آماده‌سازی را انتخاب کنید');const q=N(input.quantity);if(!(q>0))throw Error('مقدار مثبت لازم است');
 const dt=D(input.date)||E().CAL.today,pv=E().prepAt(ctx.pricing,p.id,dt),cv=E().prepConvert(ctx.pricing,pv,q,pv.countUnit,{history:dt<E().CAL.today});if(!cv.complete)throw Error(`تبدیل «${p.name}» ناقص است: ${cv.reason}`);const group=`PREPW-${ctx.reqId}`,recs=[];
 for(const c of cv.contributions){if(!(c.quantity>0))continue;const r=addEvent(doc,ctx,{...input,type:'ingredient',itemId:c.ingredientId,quantity:r6(c.quantity),unit:'',notes:[`از ${fa6(q)} ${p.countUnit} «${p.name}»`,S(input.notes)].filter(Boolean).join(' — ')});Object.assign(r,{preparedItemId:p.id,preparedItemNameSnapshot:p.name,preparedItemVersion:pv.version||1,preparedQuantity:q,preparedUnit:pv.countUnit,preparedGroupId:group});recs.push(r)}
 if(!recs.length)throw Error('فرمول این قلم ماده‌ای ندارد');return{...recs[0],count:recs.length,preparedGroupId:group}}
const r6=x=>Math.round(x*1e6)/1e6,fa6=x=>String(r6(x));
function addEvent(doc,ctx,input){if(input.type==='prepared')return addPreparedEvent(doc,ctx,input);const date=D(input.date);checkDate(doc,date);const eventType=S(input.eventType),type=input.type==='menu'?'menu':'ingredient',itemId=S(input.itemId),reason=S(input.reason),notes=S(input.notes),shift=S(input.shift);
 if(!EVENT_LABELS[eventType]||eventType==='FRYER_OIL_CHANGE')throw Error('نوع رویداد را انتخاب کنید');const l=mainLocation(doc);if(!l)throw Error('انبار اصلی تعریف نشده است');
 const M=E().build({inventory:doc,pricing:ctx.pricing});let quantity=N(input.quantity),entry=null;
 if(type==='ingredient'){const i=M.ing.get(itemId);if(!stockItem(i))throw Error('کالای انبار را انتخاب کنید');const u=unitsOf(i).find(u=>u.name===S(input.unit))||unitsOf(i)[0];if(!(quantity>0))throw Error('مقدار مثبت لازم است');if(u.factor!==1)entry={entryQuantity:quantity,entryUnit:u.name,entryUnitFactor:u.factor};quantity=r3(quantity*u.factor)}
 else{const m=M.menu.get(itemId);if(!m)throw Error('آیتم منو را انتخاب کنید');if(!(quantity>0))throw Error('تعداد مثبت لازم است');const rec=M.recipeAt(itemId,date);if(!rec.length||rec.some(r=>!Number.isFinite(M.gross(M.ing.get(r.ingredientId),r,quantity))))throw Error('رسپی، واحد یا افت این آیتم ناقص است؛ ابتدا رسپی را کامل کنید')}
 if(!reason&&!notes)throw Error('علت یا توضیح رویداد را وارد کنید');
 /* section (بخش) and responsible person: waste must name its section; the person is optional (legacy field responsiblePersonnelId) */
 const section=S(input.section),responsiblePersonnelId=S(input.responsiblePersonnelId);if(!AUTH_TYPES.has(eventType)&&!section)throw Error('بخش پرتی را انتخاب کنید');
 const common={date,eventType,type,itemId,locationId:l.id,shift,quantity,invoiceNumber:'',responsiblePersonnelId,...(responsiblePersonnelId?{responsibleNameSnapshot:S(input.responsibleName)}:{}),...(section?{section}:{}),reason,notes,...(entry||{}),...(ctx.staff?{reviewStatus:'در انتظار بررسی',reportedByName:ctx.staff.name,reportedByPersonnelId:ctx.staff.personnelId,registeredByType:'staff'}:{reviewStatus:'تأییدشده',reportedByName:ctx.actor,reviewedBy:ctx.actor,reviewedAt:ctx.at}),createdBy:ctx.actor,createdAt:ctx.at,status:'posted'};
 let rec;if(AUTH_TYPES.has(eventType)){doc.consumptionRecords=A(doc.consumptionRecords);rec={id:uid('CON',doc.consumptionRecords),recordKind:'consumption',...common};doc.consumptionRecords.push(rec)}
 else{doc.wasteRecords=A(doc.wasteRecords);rec={id:uid('WST',doc.wasteRecords),recordKind:'waste',known:true,causeKnown:true,...common};doc.wasteRecords.push(rec)}
 addMovementsFor(doc,rec,ctx,M);return rec}
function findEvent(doc,id){return A(doc.wasteRecords).find(x=>x.id===id)||A(doc.consumptionRecords).find(x=>x.id===id)||null}
function voidEvent(doc,ctx,{id,reason}){reason=S(reason);if(!reason)throw Error('علت ابطال لازم است');const r=findEvent(doc,id);if(!r)throw Error('ثبت پیدا نشد');if(r.status==='void')throw Error('این ثبت قبلاً باطل شده است');const c=closedPeriod(doc,D(r.date));if(c)throw Error(`دورهٔ ${c.from||''} تا ${c.to} بسته است`);
 const kind=r.recordKind==='consumption'||A(doc.consumptionRecords).includes(r)?'consumption':'waste',base=`${kind}:${r.id}`;
 ctx.auditExtra={entityId:r.id,before:clone(r),reason};
 Object.assign(r,{status:'void',reviewStatus:'ردشده',voidReason:reason,voidedAt:ctx.at,voidedBy:ctx.actor,updatedAt:ctx.at});
 A(doc.inventoryMovements).filter(m=>m.id===r.movementId||S(m.sourceKey)===base||S(m.sourceKey).startsWith(base+':')).forEach(m=>Object.assign(m,{status:'void',reviewStatus:'ردشده',updatedAt:ctx.at}));return r}

/* ---------- edit (js/46 edit = void with voidKind 'edit' + a new record that replaces it) ----------
   The old record stays as «باطل» with voidKind 'edit' and replacedById; the new one carries replacesId, so the history
   shows both. Same checks as a new entry; one save, one audit row. Delete = void (never physical). */
function editReceipt(doc,ctx,{id,date,quantity,unit,note,reason}){const old=A(doc.stockReceipts).find(x=>x.id===id);if(!old)throw Error('ورود پیدا نشد');
 voidReceipt(doc,ctx,{id,reason:S(reason)||'ویرایش'});const before=ctx.auditExtra?.before;const out=addReceipts(doc,ctx,{date,lines:[{itemId:old.ingredientId,quantity,unit,note:note===undefined?old.notes:note}]}),nu=doc.stockReceipts.find(x=>x.id===out.ids[0]);
 old.voidKind='edit';old.replacedById=nu.id;nu.replacesId=old.id;
 /* a receipt linked to an invoice (invoiceLink matched) keeps its link and the invoice price on the corrected quantity */
 if(old.invoiceLink==='matched'&&old.invoiceId){const c=Number(old.unitCostToman);Object.assign(nu,{invoiceId:old.invoiceId,invoiceLink:'matched',unitCostToman:Number.isFinite(c)?c:null,totalPriceToman:Number.isFinite(c)?Math.round(c*nu.quantity):null,priceBeforeInvoice:old.priceBeforeInvoice});A(doc.inventoryMovements).filter(m=>m.sourceKey===`receipt:${nu.id}`).forEach(m=>{m.unitCostToman=nu.unitCostToman});const iv=A(doc.purchaseInvoices).find(x=>x.id===old.invoiceId);if(iv&&Array.isArray(iv.receiptIds))iv.receiptIds=iv.receiptIds.map(x=>x===old.id?nu.id:x)}ctx.auditExtra={entityId:nu.id,replaces:old.id,before,reason:S(reason)||'ویرایش'};return nu}
function editEvent(doc,ctx,{id,reason,...input}){const old=findEvent(doc,id);if(!old)throw Error('ثبت پیدا نشد');if(old.eventType==='FRYER_OIL_CHANGE')throw Error('تعویض روغن را باطل و دوباره ثبت کنید');
 voidEvent(doc,ctx,{id,reason:S(reason)||'ویرایش'});const before=ctx.auditExtra?.before;
 const nu=addEvent(doc,ctx,{date:input.date??old.date,eventType:input.eventType??old.eventType,type:old.type,itemId:old.itemId,quantity:input.quantity??(old.entryQuantity??old.quantity),unit:input.unit??(old.entryUnit||''),shift:input.shift??old.shift,reason:input.reason??old.reason,notes:input.notes??old.notes,section:input.section??old.section,responsiblePersonnelId:input.responsiblePersonnelId??old.responsiblePersonnelId,responsibleName:input.responsibleName??old.responsibleNameSnapshot});
 old.voidKind='edit';old.replacedById=nu.id;nu.replacesId=old.id;ctx.auditExtra={entityId:nu.id,replaces:old.id,before,reason:S(reason)||'ویرایش'};return nu}
/* void every approved whole count (end of day) of one date; later counts are recalculated by edit() */
function voidCountDate(doc,ctx,{date,reason}){date=D(date);reason=S(reason);if(!reason)throw Error('علت ابطال لازم است');const c=closedPeriod(doc,date);if(c)throw Error(`دورهٔ ${c.from||''} تا ${c.to} بسته است`);
 const list=A(doc.stocktakes).filter(s=>wholeScope(s)&&s.status==='approved'&&D(s.date)===date&&boundary(s)==='END'&&!s.isOpeningBaseline);if(!list.length)throw Error('شمارش کل پایان روز در این تاریخ نیست (افتتاحیه از این مسیر باطل نمی‌شود)');
 for(const s of list)Object.assign(s,{status:'void',voidReason:reason,voidedAt:ctx.at,voidedBy:ctx.actor});ctx.auditExtra={date,ids:list.map(s=>s.id),reason};return{count:list.length,lines:list.reduce((a,s)=>a+A(s.lines).length,0)}}

/* remove one counted item from the whole count of a date (owner correction): the line goes to the count's revisionHistory
   with the reason; the item then continues from its own previous count. A count left without lines becomes void. A line
   that came (partly) from a prepared item is refused: count the prepared item again instead. */
function removeCountLine(doc,ctx,{date,itemId,reason}){date=D(date);reason=S(reason);if(!reason)throw Error('علت حذف لازم است');const c=closedPeriod(doc,date);if(c)throw Error(`دورهٔ ${c.from||''} تا ${c.to} بسته است`);
 const s=A(doc.stocktakes).find(x=>wholeScope(x)&&x.status==='approved'&&D(x.date)===date&&boundary(x)==='END'&&!x.isOpeningBaseline&&A(x.lines).some(l=>l.ingredientId===itemId));if(!s)throw Error('این قلم در شمارش این تاریخ نیست');
 const k=s.lines.findIndex(l=>l.ingredientId===itemId),ln=s.lines[k];if(A(ln.preparedContributions).length)throw Error('بخشی از این مقدار از قلم آماده‌سازی آمده است؛ قلم آماده را دوباره بشمارید');
 s.lines.splice(k,1);s.revisionHistory=A(s.revisionHistory);s.revisionHistory.push({id:uid('STR',s.revisionHistory),kind:'line-removed',at:ctx.at,by:ctx.actor,reason,added:[],replaced:[],removed:[clone(ln)]});s.updatedAt=ctx.at;s.updatedBy=ctx.actor;s.coverage={...(s.coverage||{}),counted:s.lines.length};
 if(!s.lines.length&&!A(s.preparedLines).length)Object.assign(s,{status:'void',voidReason:'همهٔ اقلام حذف شد: '+reason,voidedAt:ctx.at,voidedBy:ctx.actor});
 ctx.auditExtra={entityId:s.id,date,itemId,before:clone(ln),reason};return{id:s.id,voided:s.status==='void',name:ln.itemNameSnapshot}}

/* edit (or add) one item in the opening count (start of day) of a date: the item's opening lines of that date (the same
   records the engine reads: not void / rejected / archived) become one line with the new quantity in the first record
   that held it (or the largest approved opening record); the old lines stay in revisionHistory (kind opening-line-edited).
   Later whole counts follow by the automatic recalculation. A closed period or a prepared-item share blocks it. */
const openingRec=s=>!!s&&s.status!=='void'&&s.status!=='rejected'&&!s.isArchived&&(s.baselineBoundary||(s.isOpeningBaseline?'START':'END'))==='START';
function editOpeningLine(doc,ctx,{date,itemId,quantity,unit,reason}){date=D(date);reason=S(reason);if(!reason)throw Error('علت اصلاح لازم است');const c=closedPeriod(doc,date);if(c)throw Error(`دورهٔ ${c.from||''} تا ${c.to} بسته است`);
 const i=ingredients(ctx.pricing).get(itemId);if(!stockItem(i))throw Error('کالا پیدا نشد یا کالای انبار فعال نیست');
 const opens=A(doc.stocktakes).filter(s=>openingRec(s)&&D(s.date)===date);if(!opens.length)throw Error(`در ${date} شمارش افتتاحیه ثبت نشده است`);
 const u=unitsOf(i).find(x=>x.name===S(unit))||unitsOf(i)[0],q=N(quantity);if(S(quantity)===''||!(q>=0))throw Error('مقدار باید عدد نامنفی باشد');const actual=r3(q*u.factor);
 const holders=opens.filter(s=>A(s.lines).some(l=>l.ingredientId===itemId)),old=holders.flatMap(s=>A(s.lines).filter(l=>l.ingredientId===itemId));
 if(old.some(l=>A(l.preparedContributions).length))throw Error('بخشی از این مقدار از قلم آماده‌سازی آمده است؛ قابل اصلاح تکی نیست');
 const target=holders[0]||opens.filter(s=>s.status==='approved'&&wholeScope(s)).sort((a,b)=>A(b.lines).length-A(a.lines).length)[0]||opens[0];
 const base={...(old[0]?clone(old[0]):{})};for(const k of ['entryQuantity','entryUnit','entryUnitFactor','entryRestQuantity','entryRestUnit','entryRestFactor','countParts','assumedZero'])delete base[k];
 const cost=E().build({inventory:doc,pricing:ctx.pricing}).costAt(itemId,date);
 const line={...base,ingredientId:itemId,itemNameSnapshot:i.name,itemCodeSnapshot:i.code||'',unitSnapshot:unitName(i),actual,expected:actual,variance:0,variancePercent:0,varianceValueToman:0,isOpeningBaseline:true,...(Number.isFinite(cost)?{unitCost:cost}:{}),...(u.factor!==1?{entryQuantity:q,entryUnit:u.name,entryUnitFactor:u.factor}:{}),editedAt:ctx.at,editedBy:ctx.actor};
 const before=r3(old.reduce((a,l)=>a+N(l.actual),0)),rec=(s,o)=>{s.revisionHistory=A(s.revisionHistory);s.revisionHistory.push({id:uid('STR',s.revisionHistory),kind:'opening-line-edited',at:ctx.at,by:ctx.actor,reason,added:[],replaced:[],removed:[],...o});s.updatedAt=ctx.at;s.updatedBy=ctx.actor};
 for(const s of holders){const rm=s.lines.filter(l=>l.ingredientId===itemId);s.lines=s.lines.filter(l=>l.ingredientId!==itemId);if(s===target){s.lines.push(line);rec(s,{replaced:rm.map(clone)})}else{rec(s,{removed:rm.map(clone),movedTo:target.id});if(!s.lines.length&&!A(s.preparedLines).length)Object.assign(s,{status:'void',voidReason:'قلم به شمارش افتتاحیهٔ دیگر منتقل شد: '+reason,voidedAt:ctx.at,voidedBy:ctx.actor})}}
 if(!holders.includes(target)){target.lines=A(target.lines);target.lines.push(line);rec(target,{added:[itemId]})}
 if(target.coverage)target.coverage={...target.coverage,counted:target.lines.length};
 ctx.auditExtra={entityId:target.id,date,itemId,before:old.map(clone),after:clone(line),reason};return{id:target.id,name:i.name,before,after:actual,added:!old.length}}

/* catalog clean-up: before items are deleted, their count lines that are all zero are removed from the counts (each count
   keeps them in revisionHistory, kind item-deleted); a count left without lines becomes void. Lines with a quantity are
   never removed (such an item is archived, not deleted) — except, with opening:true (owner deleting a duplicate that only
   appears in the opening count), the lines of opening counts (START / isOpeningBaseline). */
function removeZeroCountLines(doc,ctx,{ids,opening=false,reason=''}){const set=new Set(A(ids)),out={lines:0,counts:0,voided:0},isOpen=s=>s?.isOpeningBaseline===true||s?.baselineBoundary==='START';
 for(const s of A(doc.stocktakes)){const rm=A(s.lines).filter(l=>set.has(l.ingredientId));if(!rm.length)continue;if(rm.some(l=>A(l.preparedContributions).length||(Number(l.actual)!==0&&!(opening&&isOpen(s)))))throw Error(`«${rm[0].itemNameSnapshot||rm[0].ingredientId}» در شمارش ${D(s.date)} مقدار دارد و حذف نمی‌شود`);
  s.lines=A(s.lines).filter(l=>!set.has(l.ingredientId));s.revisionHistory=A(s.revisionHistory);s.revisionHistory.push({id:uid('STR',s.revisionHistory),kind:'item-deleted',at:ctx.at,by:ctx.actor,reason:S(reason)||'حذف قلم بی‌استفاده از کاتالوگ',added:[],replaced:[],removed:rm.map(clone)});s.updatedAt=ctx.at;s.updatedBy=ctx.actor;if(s.coverage)s.coverage={...s.coverage,counted:s.lines.length};out.lines+=rm.length;out.counts++;
  if(!s.lines.length&&!A(s.preparedLines).length&&s.status!=='void'){Object.assign(s,{status:'void',voidReason:'همهٔ اقلام این شمارش حذف شدند',voidedAt:ctx.at,voidedBy:ctx.actor});out.voided++}}
 ctx.auditExtra={ids:[...set],...out};return out}

/* ---------- fryer oil change (js/32 saveOilChange) ---------- */
function oilSettings(doc,pricing){const s=doc?.settings?.fryerOil||{},id=S(s.ingredientId)||A(pricing?.ingredients).find(i=>/^روغن سرخ ?کردنی$/.test(S(i.name)))?.id||'';return{ingredientId:id,density:Number(s.density)||0.91,logFrom:validDate(D(s.logFrom))?D(s.logFrom):'',fryers:A(s.fryers).length?A(s.fryers).map(f=>({id:S(f.id),name:S(f.name),liters:Number(f.liters)||0})):OIL_FRYERS_DEFAULT.map(f=>({...f}))}}
function addOilChange(doc,ctx,input){const s=oilSettings(doc,ctx.pricing),f=s.fryers.find(x=>x.id===S(input.fryerId)),date=D(input.date),kind=input.kind==='TOP_UP'?'TOP_UP':'FULL',liters=N(input.liters)>0?N(input.liters):(kind==='FULL'?Number(f?.liters):0);
 checkDate(doc,date);if(!f)throw Error('سرخ‌کن را انتخاب کنید');if(!(liters>0))throw Error('مقدار روغن (لیتر) لازم است');if(liters>f.liters*1.2)throw Error(`مقدار بیشتر از گنجایش ${f.name} (${f.liters} لیتر) است`);if(!stockItem(ingredients(ctx.pricing).get(s.ingredientId)))throw Error('قلم روغن سرخ‌کردنی در تنظیمات انبار مشخص نیست');
 doc.consumptionRecords=A(doc.consumptionRecords);const kg=r3(liters*s.density);
 const rec={id:uid('OIL',doc.consumptionRecords),recordKind:'consumption',eventType:'FRYER_OIL_CHANGE',date,type:'ingredient',itemId:s.ingredientId,locationId:doc.settings?.mainLocationId||'',shift:S(input.shift),quantity:kg,fryerId:f.id,fryerName:f.name,fryerLiters:f.liters,oilChangeKind:kind,liters,density:s.density,reason:`${kind==='FULL'?'تعویض کامل روغن':'افزودن روغن'} — ${f.name}`,notes:S(input.notes),responsiblePersonnelId:'',reviewStatus:'تأییدشده',status:'posted',reportedByName:ctx.actor,reviewedBy:ctx.actor,reviewedAt:ctx.at,createdBy:ctx.actor,createdAt:ctx.at};
 doc.consumptionRecords.push(rec);addMovementsFor(doc,rec,ctx,null);return rec}

/* ---------- whole count, end of day (js/32 whole count + wholeLine) ----------
   Expected = the item's position at the end of the date from its own latest approved whole count (same engine rules).
   A count of the same date is merged (the replaced line stays in revisionHistory). A count dated before a later whole
   count needs input.allowEarlier (the form asks first); the later counts are then recalculated by edit() (recalcCounts). */
function countInfo(doc,date){date=D(date);const later=A(doc.stocktakes).filter(s=>wholeScope(s)&&s.status==='approved'&&rank(s)>`${date}|1`),same=A(doc.stocktakes).filter(s=>wholeScope(s)&&s.status==='approved'&&rank(s)===`${date}|1`);return{later,same,counted:new Map(same.flatMap(s=>A(s.lines).map(l=>[l.ingredientId,{st:s,line:l}])))}}
function addCount(doc,ctx,{date,entries,prepared,note,allowEarlier}){date=D(date);checkDate(doc,date,'تاریخ شمارش');const ing=ingredients(ctx.pricing),info=countInfo(doc,date);
 if(info.later.length&&!allowEarlier)throw Error(`بعد از ${date} شمارش کل ثبت شده است (${[...new Set(info.later.map(s=>s.date))].sort().pop()}); برای ثبت با تاریخ قبلی تأیید لازم است.`);
 /* several counts of one item (BL-078): parts [{place, quantity, unit}], each in any unit of the item, added up in the base
    unit; the line keeps them as countParts [{place, quantity, unit, factor, base}]. mergePlaces: a part replaces only the
    part of the same place already counted that day (another person counting another fridge later); other places stay. */
 const partsRow=(i,x)=>{const ps=A(x.parts).map(p=>{const u=unitsOf(i).find(u=>u.name===S(p.unit))||unitsOf(i)[0],q=N(p.quantity);if(S(p.quantity)===''||!(q>=0))throw Error(`مقدار شمارش «${i.name}»${S(p.place)?' در '+S(p.place):''} باید عدد نامنفی باشد`);return{place:S(p.place),quantity:q,unit:u.name,factor:u.factor,base:r3(q*u.factor)}});
  if(!ps.length)throw Error(`برای «${i.name}» مقداری وارد نشده است`);const old=info.counted.get(i.id)?.line,keep=x.mergePlaces&&old?A(old.countParts).filter(p=>!ps.some(n=>n.place===S(p.place))):[],all=[...keep,...ps];
  const one=all.length===1&&all[0].factor!==1?{entryQuantity:all[0].quantity,entryUnit:all[0].unit,entryUnitFactor:all[0].factor}:{};
  return{i,actual:r3(all.reduce((a,p)=>a+p.base,0)),entry:{countParts:all,...one}}};
 const rows=A(entries).map(x=>{const i=ing.get(S(x.itemId));if(!stockItem(i))throw Error('قلم شمارش معتبر نیست');if(Array.isArray(x.parts))return partsRow(i,x);const u=unitsOf(i).find(u=>u.name===S(x.unit))||unitsOf(i)[0],q=S(x.quantity)===''&&S(x.rest)!==''?0:N(x.quantity);if(!(q>=0))throw Error(`مقدار شمارش «${i.name}» باید عدد نامنفی باشد`);
  /* «۵ بسته + ۱۰۰ گرم»: the open remainder is entered in the item's smallest unit and added */
  const su=smallestUnit(i),rest=S(x.rest)===''?0:N(x.rest);if(!(rest>=0))throw Error(`باقی‌ماندهٔ «${i.name}» باید عدد نامنفی باشد`);const restOn=rest>0&&su.name!==u.name;
  return{i,actual:r3(q*u.factor+(restOn?rest*su.factor:0)),entry:u.factor!==1||restOn?{entryQuantity:q,entryUnit:u.name,entryUnitFactor:u.factor,...(restOn?{entryRestQuantity:rest,entryRestUnit:su.name,entryRestFactor:su.factor}:{})}:null}});
 /* prepared items (js/32): counted as they are, converted to their ingredients with the current formula */
 const MW=window.MenuWrite,prepIn=A(prepared).map(x=>{const p=A(ctx.pricing?.preparedItems).find(v=>v.id===S(x.preparedItemId));if(!p)throw Error('قلم آماده‌سازی پیدا نشد');const q=N(x.quantity);if(!(q>=0))throw Error(`مقدار «${p.name}» باید عدد نامنفی باشد`);if(p.countUnit==='عدد'&&!Number.isInteger(q))throw Error(`مقدار «${p.name}» باید عدد صحیح باشد`);
  const pv=E().prepAt(ctx.pricing,p.id,date),cv=E().prepConvert(ctx.pricing,pv,q,pv.countUnit,{history:date<E().CAL.today});if(!cv.complete)throw Error(`تبدیل «${p.name}» ناقص است: ${cv.reason}`);return{p,q,cv}});
 if(!rows.length&&!prepIn.length)throw Error('حداقل یک مقدار شمارش وارد کنید');if(new Set(rows.map(r=>r.i.id)).size!==rows.length||new Set(prepIn.map(r=>r.p.id)).size!==prepIn.length)throw Error('یک قلم دو بار وارد شده است');
 if(rows.some(x=>A(doc.openingBalances).some(o=>wholeScope(o)&&o.status!=='void'&&rank(o)===`${date}|1`&&o.ingredientId===x.i.id)))throw Error('برای این قلم در همین تاریخ موجودی اولیهٔ قدیمی ثبت شده است؛ از پنل فعلی اقدام کنید');
 // expected from approved whole counts only, without the counts of this same date (they are what is being replaced)
 const mdoc={...doc,stocktakes:A(doc.stocktakes).filter(s=>wholeScope(s)&&s.status==='approved'&&!info.same.includes(s))},M=E().build({inventory:mdoc,pricing:ctx.pricing}),pos=new Map(E().positions(M,date).map(r=>[r.id,r]));
 const line=x=>{const p=pos.get(x.i.id),known=!!p&&p.base!==null&&p.qty!==null,expected=known?r3(p.qty):null,variance=expected===null?null:r3(x.actual-expected),unitCost=M.costAt(x.i.id,date);
  return{ingredientId:x.i.id,actual:x.actual,...(x.entry||{}),itemNameSnapshot:x.i.name,itemCodeSnapshot:x.i.code||'',unitSnapshot:unitName(x.i),expected,variance,variancePercent:expected===null?null:expected?variance/expected*100:variance?100:0,baseQuantity:p?.base??null,salesConsumption:p?r3(p.sales):null,movementNet:p?r3(p.receipt-p.waste-p.auth):null,purchaseQty:p?r3(p.receipt):null,wasteQty:p?r3(p.waste):null,otherOutQty:p?r3(p.auth):null,...(ctx.staff?{countedByPersonnelId:ctx.staff.personnelId,countedByName:ctx.staff.name}:{}),unitCost:Number.isFinite(unitCost)?unitCost:null,varianceValueToman:variance===null||!Number.isFinite(unitCost)?null:variance*unitCost,baseDate:p?.basePt?.date||'',baselineIds:A(p?.basePt?.ids),baselineBoundary:p?.basePt?.boundary||'',isOpeningBaseline:false,...(x.prep?{directActual:x.direct,preparedActual:r3(x.prep.qty),directlyCounted:x.direct!==null,preparedContributions:x.prep.contributions}:{})}};
 doc.stocktakes=A(doc.stocktakes);const byId=new Map(doc.stocktakes.map(s=>[s.id,s]));let target=info.same[0]?byId.get(info.same[0].id):null;const created=!target;
 if(created){target={id:`ST-WHOLE-${ctx.reqId}`,date,locationId:'',inventoryScope:'RAYO',baselineBoundary:'END',status:'approved',isOpeningBaseline:false,notes:S(note),lines:[],createdAt:ctx.at,createdBy:ctx.actor,approvedAt:ctx.at,approvedBy:ctx.actor,countedBy:ctx.actor,...(ctx.staff?{countedByPersonnelId:ctx.staff.personnelId,countedByName:ctx.staff.name}:{}),source:'ui-template'};doc.stocktakes.push(target)}
 const touched=new Map,rev=s=>{if(!touched.has(s.id))touched.set(s.id,{id:uid('STR',A(s.revisionHistory)),kind:'whole-count-merge',at:ctx.at,by:ctx.actor,added:[],replaced:[],removed:[]});return touched.get(s.id)};let replaced=0;
 // prepared lines of this date: the new ones replace the same item's old line (kept in the revision)
 const prepHolder=new Map;for(const st of info.same)for(const pl of A(byId.get(st.id).preparedLines))prepHolder.set(pl.preparedItemId,byId.get(st.id));
 for(const x of prepIn){const st=prepHolder.get(x.p.id);if(st){const k=A(st.preparedLines).findIndex(l=>l.preparedItemId===x.p.id),r=rev(st);r.preparedRemoved=A(r.preparedRemoved);r.preparedRemoved.push(clone(st.preparedLines[k]));st.preparedLines.splice(k,1);replaced++}
  const pl={id:`PREPLINE-${ctx.reqId}-${x.p.id}`,preparedItemId:x.p.id,preparedItemNameSnapshot:x.p.name,preparedItemVersion:x.cv.preparedItemVersion,quantity:x.q,unit:x.p.countUnit,baseOutputQuantitySnapshot:x.cv.baseOutputQuantitySnapshot,scale:x.cv.scale,contributions:x.cv.contributions,date,createdAt:ctx.at,createdBy:ctx.actor};
  target.preparedLines=A(target.preparedLines);target.preparedLines.push(pl);const r=rev(target);r.preparedAdded=A(r.preparedAdded);r.preparedAdded.push(x.p.id)}
 // share of every ingredient from all prepared lines of this date
 const share=new Map;if(prepIn.length)for(const st of info.same.map(s=>byId.get(s.id)).concat(created?[target]:[]))for(const pl of A(st.preparedLines))for(const c of A(pl.contributions)){const o=share.get(c.ingredientId)||{qty:0,contributions:[]};o.qty+=N(c.quantity);o.contributions.push({preparedLineId:pl.id,preparedItemId:pl.preparedItemId,preparedItemNameSnapshot:pl.preparedItemNameSnapshot,quantity:c.quantity,unit:c.unit,componentQuantity:c.componentQuantity,componentUnit:c.componentUnit,basis:c.basis});share.set(c.ingredientId,o)}
 const direct=new Map(rows.map(r=>[r.i.id,r])),ids=new Set(direct.keys());if(prepIn.length){for(const id of share.keys())ids.add(id);for(const [id,h] of info.counted)if(A(h.line.preparedContributions).length)ids.add(id)}
 for(const id of ids){const h=info.counted.get(id),old=h?.line,d=direct.get(id),sh=share.get(id),i=ing.get(id);
  const dir=d?d.actual:old?(A(old.preparedContributions).length?(old.directlyCounted?N(old.directActual):null):N(old.actual)):null,entry=d?d.entry:(old&&(!A(old.preparedContributions).length||old.directlyCounted)&&(old.entryUnit||A(old.countParts).length)?{...(old.entryUnit?{entryQuantity:old.entryQuantity,entryUnit:old.entryUnit,entryUnitFactor:old.entryUnitFactor}:{}),...(A(old.countParts).length?{countParts:old.countParts}:{})}:null);
  const s=h?byId.get(h.st.id):target;s.lines=A(s.lines);const k=s.lines.findIndex(l=>l.ingredientId===id),r=rev(s);
  if(dir===null&&!(sh&&sh.qty>0)){if(k>=0){r.removed.push(clone(s.lines[k]));s.lines.splice(k,1)}continue}
  if(!stockItem(i))throw Error(`مادهٔ «${i?.name||id}» در فرمول قلم آماده، کالای انبار فعال نیست`);
  const ln=line({i,actual:r3((dir??0)+(sh?sh.qty:0)),entry,direct:dir,prep:sh||null});if(k>=0){r.replaced.push(clone(s.lines[k]));s.lines[k]=ln;if(d)replaced++}else{r.added.push(id);s.lines.push(ln)}}
 const total=trackedItems(ctx.pricing).length;
 for(const [id,rv] of touched){const s=byId.get(id)||target;s.coverage={counted:s.lines.length,total};if(created&&s===target)continue;s.revisionHistory=A(s.revisionHistory);s.revisionHistory.push(rv);s.updatedAt=ctx.at;s.updatedBy=ctx.actor;if(S(note)&&s===target)s.notes=S(s.notes)?`${S(s.notes)} | ${S(note)}`:S(note)}
 return{id:target.id,created,count:rows.length+prepIn.length,replaced}}

/* ---------- order-independent count variance (js/32 recalcStocktakeLines + refreshStaleCountVariance) ----------
   A whole count stores expected and variance per line. Any inventory save that adds, changes or voids a record dated
   on or before a later whole count re-derives those counts from the saved document (same engine and line fields as
   addCount); the previous figures go to varianceRecalcHistory and a changed line's review is reopened. Opening (START)
   counts and counts in a closed period keep their figures. affectedFrom = the earliest date among changed records. */
const DATED=['stockReceipts','wasteRecords','consumptionRecords','salesPeriods','inventoryMovements','stocktakes','openingBalances'];
function affectedFrom(before,after){let min='';const dateOf=r=>[D(r?.date),D(r?.from)].filter(d=>d&&validDate(d)).sort()[0]||'';
 for(const k of DATED){const a=new Map(A(before?.[k]).map(r=>[S(r.id),r])),b=new Map(A(after?.[k]).map(r=>[S(r.id),r]));
  for(const id of new Set([...a.keys(),...b.keys()])){const x=a.get(id),y=b.get(id);if(x&&y&&JSON.stringify(x)===JSON.stringify(y))continue;for(const d of [dateOf(x),dateOf(y)])if(d&&(!min||d<min))min=d}}
 return min}
function recalcCounts(doc,ctx,{from=''}={}){const groups=new Map;
 for(const s of A(doc.stocktakes)){if(!wholeScope(s)||s.status!=='approved'||boundary(s)==='START'||s.isOpeningBaseline)continue;const d=D(s.date);if(from&&d<from)continue;if(closedPeriod(doc,d))continue;const k=rank(s);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(s)}
 let n=0;const counts=[];
 for(const [k,list] of [...groups].sort((a,b)=>a[0].localeCompare(b[0]))){const date=k.split('|')[0],mdoc={...doc,stocktakes:A(doc.stocktakes).filter(s=>wholeScope(s)&&s.status==='approved'&&!list.includes(s))},M=E().build({inventory:mdoc,pricing:ctx.pricing}),pos=new Map(E().positions(M,date).map(r=>[r.id,r]));
  for(const s of list){const changes=[];
   for(const l of A(s.lines)){if(l.assumedZero)continue;const p=pos.get(l.ingredientId),known=!!p&&p.base!==null&&p.qty!==null,expected=known?r3(p.qty):null,actual=Number(l.actual);if(!Number.isFinite(actual))continue;const variance=expected===null?null:r3(actual-expected);
    const same=(a,b)=>(a===null||a===undefined)?(b===null||b===undefined):(b!==null&&b!==undefined&&Math.abs(Number(a)-Number(b))<1e-9);if(same(l.expected,expected)&&same(l.variance,variance))continue;
    const unitCost=M.costAt(l.ingredientId,date);changes.push({ingredientId:l.ingredientId,expected:l.expected??null,variance:l.variance??null,varianceReview:l.varianceReview||null});
    Object.assign(l,{expected,variance,variancePercent:expected===null?null:expected?variance/expected*100:variance?100:0,baseQuantity:p?.base??null,salesConsumption:p?r3(p.sales):null,movementNet:p?r3(p.receipt-p.waste-p.auth):null,purchaseQty:p?r3(p.receipt):null,wasteQty:p?r3(p.waste):null,otherOutQty:p?r3(p.auth):null,unitCost:Number.isFinite(unitCost)?unitCost:null,varianceValueToman:variance===null||!Number.isFinite(unitCost)?null:variance*unitCost,baseDate:p?.basePt?.date||'',baselineIds:A(p?.basePt?.ids),baselineBoundary:p?.basePt?.boundary||''});delete l.varianceReview}
   s.varianceCheckedAt=ctx.at;if(changes.length){s.varianceRecalcHistory=A(s.varianceRecalcHistory);s.varianceRecalcHistory.push({at:ctx.at,by:ctx.actor,lines:changes});s.varianceRecalculatedAt=ctx.at;n+=changes.length;counts.push(s.id)}}}
 return{lines:n,counts}}

/* ---------- zero for uncounted items (js/32 previewZeroFill / previewZeroFillRollback) ----------
   Items that were never in any whole count, and «دقیق» items missing from this baseline, are added to the baseline of
   the date with actual 0 and assumedZero:true. Only on the latest baseline (nothing whole later). Rollback of the last
   zero-fill: the lines it added are taken out again, or the baseline it created is voided (never deleted). */
function zeroFillPlan(doc,pricing,{date,boundary:b}){date=D(date);b=b==='START'?'START':'END';if(!validDate(date)||date>E().CAL.today)throw Error('تاریخ معتبر (نه آینده) لازم است');if(closedPeriod(doc,date))throw Error('دورهٔ این تاریخ بسته است');
 const rk=`${date}|${b==='START'?'0':'1'}`,whole=[...A(doc.stocktakes).filter(x=>wholeScope(x)&&x.status==='approved').map(x=>({r:x,ids:A(x.lines).map(l=>l.ingredientId)})),...A(doc.openingBalances).filter(x=>wholeScope(x)&&x.status!=='void').map(x=>({r:x,ids:[x.ingredientId]}))];
 if(whole.some(x=>rank(x.r)>rk))throw Error('بعد از این تاریخ مبنای کل دیگری هست؛ صفرگذاری فقط روی آخرین مبنا معنا دارد');
 const have=new Set(whole.filter(x=>rank(x.r)===rk).flatMap(x=>x.ids)),ever=new Set(whole.flatMap(x=>x.ids));
 const items=trackedItems(pricing).filter(i=>levelOf(doc,i.id,pricing)!=='PARKED'&&!have.has(i.id)&&(levelOf(doc,i.id,pricing)==='PRECISE'||!ever.has(i.id)));
 const target=A(doc.stocktakes).find(x=>wholeScope(x)&&x.status==='approved'&&rank(x)===rk)||null;return{date,boundary:b,items,target}}
function zeroFill(doc,ctx,input){const p=zeroFillPlan(doc,ctx.pricing,input);if(!p.items.length)throw Error('همهٔ اقلام در این مبنا شمرده شده‌اند؛ چیزی برای صفرگذاری نیست');
 const opening=p.boundary==='START',lines=p.items.map(i=>({ingredientId:i.id,actual:0,itemNameSnapshot:i.name,itemCodeSnapshot:i.code||'',unitSnapshot:unitName(i),expected:null,variance:null,variancePercent:null,varianceValueToman:null,isOpeningBaseline:opening,assumedZero:true}));
 doc.stocktakes=A(doc.stocktakes);let target=p.target?doc.stocktakes.find(x=>x.id===p.target.id):null,createdId=null;
 if(target)target.lines=[...A(target.lines),...lines];else{createdId=`ST-WHOLE-${ctx.reqId}`;target={id:createdId,date:p.date,locationId:'',inventoryScope:'RAYO',baselineBoundary:p.boundary,status:'approved',isOpeningBaseline:opening,notes:'صفرگذاری اقلام شمارش‌نشده',lines,createdAt:ctx.at,createdBy:ctx.actor,approvedAt:ctx.at,approvedBy:ctx.actor,countedBy:ctx.actor,source:'ui-template'};doc.stocktakes.push(target)}
 target.updatedAt=ctx.at;target.updatedBy=ctx.actor;target.coverage={counted:target.lines.length,total:trackedItems(ctx.pricing).length};
 ctx.auditExtra={targetId:target.id,createdId,date:p.date,boundary:p.boundary,ingredientIds:p.items.map(i=>i.id)};return{count:lines.length,targetId:target.id,createdId}}
function lastZeroFill(doc){return A(doc.changeLog).filter(e=>e.action==='INVENTORY_ZERO_FILLED'&&!e.revertedAt).at(-1)||null}
function zeroFillRollbackPlan(doc){const e=lastZeroFill(doc);if(!e)throw Error('صفرگذاری قابل بازگردانی وجود ندارد');
 if(A(doc.stocktakes).some(x=>wholeScope(x)&&S(x.createdAt)>e.at&&x.id!==e.createdId)||A(doc.periodClosures).some(c=>c.status==='closed'&&S(c.closedAt)>=e.at))throw Error('بعد از این صفرگذاری شمارش کل یا بستن دوره ثبت شده است؛ بازگردانی خودکار ممکن نیست');
 const t=A(doc.stocktakes).find(x=>x.id===e.targetId);if(!t)throw Error('سند مبنا پیدا نشد');const ids=new Set(A(e.ingredientIds));return{entry:e,target:t,lines:A(t.lines).filter(l=>l.assumedZero&&ids.has(l.ingredientId))}}
function zeroFillRollback(doc,ctx){const p=zeroFillRollbackPlan(doc),e=A(doc.changeLog).find(x=>x.id===p.entry.id),t=doc.stocktakes.find(x=>x.id===p.target.id),ids=new Set(A(e.ingredientIds));
 if(e.createdId){t.status='void';t.voidReason='بازگردانی صفرگذاری';t.voidedAt=ctx.at;t.voidedBy=ctx.actor}else{t.lines=A(t.lines).filter(l=>!(l.assumedZero&&ids.has(l.ingredientId)));t.coverage={counted:t.lines.length,total:trackedItems(ctx.pricing).length};t.updatedAt=ctx.at;t.updatedBy=ctx.actor}
 e.revertedAt=ctx.at;ctx.auditExtra={reverts:e.id};return{count:p.lines.length,voided:!!e.createdId}}

/* ---------- payment locations and supplier payment directions (js/19 savePaymentLocations) ----------
   rows keep their id; a new row gets the next PAYLOC / PAYDIR id; names unique; nothing is deleted (inactive instead);
   the list stays where it is (top-level paymentLocations of old data, else settings.paymentLocations) */
const PAY_DIR_DEFAULT=[{value:'PAYDIR-001',label:'پرداخت به تأمین‌کننده',effect:'payment',isActive:true},{value:'PAYDIR-002',label:'دریافت از تأمین‌کننده',effect:'receipt',isActive:true}];
function paymentOptions(doc){const top=Array.isArray(doc?.paymentLocations),loc=(top?doc.paymentLocations:A(doc?.settings?.paymentLocations)).map((x,i)=>typeof x==='string'?{id:`PAYLOC-${String(i+1).padStart(3,'0')}`,name:x,type:'other',isActive:true,notes:''}:{...x,id:x.id||`PAYLOC-${String(i+1).padStart(3,'0')}`,name:x.name||x.title||'',isActive:x.isActive!==false});
 const dsrc=A(doc?.settings?.supplierPaymentDirections),dir=(dsrc.length?dsrc:PAY_DIR_DEFAULT).map((x,i)=>typeof x==='string'?{value:`PAYDIR-${String(i+1).padStart(3,'0')}`,label:x,effect:'payment',isActive:true}:{...x,value:x.value||x.id||`PAYDIR-${String(i+1).padStart(3,'0')}`,label:x.label||x.name||x.title||'',effect:x.effect==='receipt'?'receipt':'payment',isActive:x.isActive!==false});return{top,locations:loc,directions:dir}}
function savePaymentOptions(doc,ctx,{locations,directions}){const cur=paymentOptions(doc),next=JSON.parse(JSON.stringify(cur.locations)),nd=JSON.parse(JSON.stringify(cur.directions)),nextId=(p,rows)=>{let m=0;for(const r of rows){const q=S(r).match(/(\d+)$/);if(q)m=Math.max(m,+q[1])}return `${p}-${String(m+1).padStart(3,'0')}`};
 for(const r of A(locations)){const name=S(r.name);if(!name)throw Error('نام همهٔ محل‌های پرداخت را وارد کنید');const o=r.id?next.find(x=>x.id===r.id):null;if(r.id&&!o)throw Error('محل پرداخت پیدا نشد');if(o)Object.assign(o,{name,isActive:r.isActive!==false});else next.push({id:nextId('PAYLOC',next.map(x=>x.id)),name,type:'other',isActive:r.isActive!==false,notes:''})}
 for(const r of A(directions)){const label=S(r.label);if(!label)throw Error('عنوان همهٔ جهت‌های تسویه را وارد کنید');const o=r.value?nd.find(x=>x.value===r.value):null;if(r.value&&!o)throw Error('جهت تسویه پیدا نشد');const eff=r.effect==='receipt'?'receipt':'payment';if(o)Object.assign(o,{label,effect:eff,isActive:r.isActive!==false});else nd.push({value:nextId('PAYDIR',nd.map(x=>x.value)),label,effect:eff,isActive:r.isActive!==false})}
 const dupe=a=>new Set(a.map(x=>x.toLowerCase())).size!==a.length;if(dupe(next.map(x=>x.name)))throw Error('نام محل‌های پرداخت نباید تکراری باشد');if(dupe(nd.map(x=>x.label)))throw Error('عنوان جهت‌های تسویه نباید تکراری باشد');
 doc.settings=doc.settings||{};if(cur.top)doc.paymentLocations=next;else doc.settings.paymentLocations=next;doc.settings.supplierPaymentDirections=nd;ctx.auditExtra={before:{locations:cur.locations,directions:cur.directions}};return{locations:next.length,directions:nd.length}}

/* ---------- daily beverage control items (js/46 bevSaveSettings): settings.beverageControl.itemIds, order kept ---------- */
function saveBeverageItems(doc,ctx,{itemIds}){const ing=ingredients(ctx.pricing),ids=[...new Set(A(itemIds).map(S))].filter(id=>ing.has(id));doc.settings=doc.settings||{};const old=A(doc.settings.beverageControl?.itemIds);
 const next=[...old.filter(id=>ids.includes(id)),...ids.filter(id=>!old.includes(id))];doc.settings.beverageControl={...(doc.settings.beverageControl||{}),itemIds:next,updatedAt:ctx.at,updatedBy:ctx.actor};ctx.auditExtra={before:old,after:next};return{count:next.length}}

/* ---------- inventory settings (stage 11) ----------
   control levels (js/32 saveControlLevels): settings.itemControlLevels {id: LIGHT|PRECISE|PARKED}, lightMaxGapDays 7…730
   fryer oil (js/32 saveFryerSettings): settings.fryerOil {ingredientId, density 0.5…1.2, logFrom, fryers[{id,name,liters}]}
   and settings.tableItems; reorder points (js/08 ingredient edit, read by js/40 reorderPointValue): pricing.ingredients[]
   .reorderPoint / .targetStock (empty = none). */
const LEVELS=['LIGHT','PRECISE','PARKED'];
// effective level (item → group default → LIGHT); without pricing only the item's own choice is known
const levelOf=(doc,id,pricing)=>{const i=A(pricing?.ingredients).find(x=>x.id===id)||{id};return E().controlLevel(doc,i)};
const ownLevel=(doc,id)=>{const v=doc?.settings?.itemControlLevels?.[id];return LEVELS.includes(v)?v:''};
/* levels {id: level | '' (= the group default)}, groups {category: level | ''} (BL-088) */
function saveControlLevels(doc,ctx,{levels,gap,groups}){doc.settings=doc.settings||{};const next={...(doc.settings.itemControlLevels||{})},gnext={...(doc.settings.groupControlLevels||{})},changes=[],gchanges=[];
 for(const [id,v0] of Object.entries(levels||{})){const v=LEVELS.includes(v0)?v0:'',old=ownLevel(doc,id);if(v!==old){changes.push({ingredientId:id,before:old||'group',after:v||'group'});if(v)next[id]=v;else delete next[id]}}
 for(const [g,v0] of Object.entries(groups||{})){const v=LEVELS.includes(v0)?v0:'',old=LEVELS.includes(gnext[g])?gnext[g]:'';if(v!==old){gchanges.push({group:g,before:old||'LIGHT',after:v||'LIGHT'});if(v)gnext[g]=v;else delete gnext[g]}}
 const curGap=Number(doc.settings.lightMaxGapDays)||90,g=gap===undefined||S(gap)===''?curGap:N(gap);if(!Number.isInteger(g)||g<7||g>730)throw Error('حداکثر فاصلهٔ شمارش باید عدد صحیح بین ۷ تا ۷۳۰ روز باشد');
 if(!changes.length&&!gchanges.length&&g===curGap)throw Error('تغییری انتخاب نشده است');doc.settings.itemControlLevels=next;doc.settings.groupControlLevels=gnext;doc.settings.lightMaxGapDays=g;ctx.auditExtra={changes,groups:gchanges,lightMaxGapDays:g};return{changes:changes.length,groups:gchanges.length,gap:g}}
function saveFryerSettings(doc,ctx,input){doc.settings=doc.settings||{};const ing=ingredients(ctx.pricing),fryers=A(input.fryers).map((f,i)=>({id:S(f.id)||`FR-${i+1}`,name:S(f.name),liters:N(f.liters)})).filter(f=>f.name||f.liters>0);
 if(!fryers.length||fryers.some(f=>!f.name||!(f.liters>0)))throw Error('برای هر سرخ‌کن نام و گنجایش (لیتر) لازم است');if(new Set(fryers.map(f=>f.id)).size!==fryers.length)throw Error('شناسهٔ سرخ‌کن تکراری است');
 const density=N(input.density);if(!(density>0.5&&density<1.2))throw Error('چگالی روغن باید بین ۰٫۵ و ۱٫۲ کیلو بر لیتر باشد');if(!ing.get(S(input.ingredientId)))throw Error('قلم روغن سرخ‌کردنی را انتخاب کنید');
 const logFrom=S(input.logFrom)?D(input.logFrom):'';if(S(input.logFrom)&&!validDate(logFrom))throw Error('تاریخ شروع دفتر تعویض نامعتبر است');
 const tableItems=[...new Set(A(input.tableItems).map(S).filter(id=>ing.get(id)))],prev=doc.settings.fryerOil||{};ctx.auditExtra={before:{fryerOil:clone(prev),tableItems:A(doc.settings.tableItems)}};
 doc.settings.fryerOil={...prev,ingredientId:S(input.ingredientId),density,logFrom,fryers,weights:prev.weights&&typeof prev.weights==='object'?prev.weights:{},updatedAt:ctx.at,updatedBy:ctx.actor};doc.settings.tableItems=tableItems;return doc.settings.fryerOil}
// pricing document: {id: {reorderPoint, targetStock}} with '' = clear
function saveReorderPoints(pr,ctx,{rows}){const ing=new Map(A(pr.ingredients).map(i=>[i.id,i])),changes=[],val=v=>{if(v===null||v===undefined||S(v)==='')return null;const n=N(v);if(!(n>=0))throw Error('نقطهٔ سفارش و موجودی هدف باید خالی، صفر یا عدد مثبت باشند');return n};
 for(const [id,x] of Object.entries(rows||{})){const i=ing.get(id);if(!i)continue;const rp=val(x.reorderPoint),ts=val(x.targetStock),orp=i.reorderPoint===undefined||i.reorderPoint===''?null:i.reorderPoint,ots=i.targetStock===undefined||i.targetStock===''?null:i.targetStock;
  if(rp!==(orp===null?null:Number(orp))||ts!==(ots===null?null:Number(ots))){changes.push({ingredientId:id,before:{reorderPoint:orp,targetStock:ots},after:{reorderPoint:rp,targetStock:ts}});i.reorderPoint=rp;i.targetStock=ts;i.updatedAt=ctx.at}}
 if(!changes.length)throw Error('تغییری داده نشده است');ctx.auditExtra={changes};return changes.length}

/* ---------- cycle counting and reorder suggestions (APP_REVIEW P-08, P-18) ----------
   ABC: stock items ranked by the value they used (sales by recipe + waste + staff use, at cost) in the last days; the
   items that make the first aShare٪ of the value are A, up to bShare٪ B, the rest (and items without use) C.
   Due: an item is due when its last count (any approved or submitted count line, not an assumed zero) is older than the
   interval of its class (default A 2 days, B 7, C 30), or it was never counted. Settings: inventory.settings.cycleCount
   {a,b,c,aShare,bShare}. Reorder suggestion: reorder point = daily use × (lead + safety days), target = reorder point +
   daily use × order-cycle days, rounded up to 2 decimals of the base unit. */
const CYCLE_DEF={a:2,b:7,c:30,aShare:80,bShare:95,lead:2,safety:2,cycle:7};
function cycleSettings(doc){const c=doc?.settings?.cycleCount||{},o={};for(const k of Object.keys(CYCLE_DEF)){const v=Number(c[k]);o[k]=Number.isFinite(v)&&v>0?v:CYCLE_DEF[k]}return o}
/* places where one item is counted separately (BL-078): inventory.settings.countPlaces, defaults until saved */
const COUNT_PLACES=['انبار اصلی','یخچال آشپزخانه','یخچال بار'];
function countPlaces(doc){const l=A(doc?.settings?.countPlaces).map(S).filter(Boolean);return l.length?l:COUNT_PLACES.slice()}
function saveCountPlaces(doc,ctx,{places}){const out=[];for(const p0 of A(places)){const p=S(p0).replace(/\s+/g,' ');if(!p)continue;if(p.length>40)throw Error('نام محل بیش از حد بلند است');if(!out.includes(p))out.push(p)}if(!out.length)throw Error('دست‌کم یک محل لازم است');
 doc.settings=doc.settings||{};const before=A(doc.settings.countPlaces).slice();if(JSON.stringify(before)===JSON.stringify(out))throw Error('تغییری نیست');doc.settings.countPlaces=out;ctx.auditExtra={before,after:out};return{places:out}}
function saveCycleSettings(doc,ctx,input){const next={};for(const k of Object.keys(CYCLE_DEF)){const v=N(input[k]);if(!(v>0))throw Error('همهٔ مقادیر شمارش چرخه‌ای باید عدد مثبت باشند');next[k]=v}
 if(!(next.aShare<next.bShare&&next.bShare<=100))throw Error('سهم A باید کمتر از سهم A+B و حداکثر ۱۰۰ باشد');if(!(next.a<=next.b&&next.b<=next.c))throw Error('فاصلهٔ شمارش A ≤ B ≤ C باشد');
 doc.settings=doc.settings||{};const before=cycleSettings(doc);if(JSON.stringify(before)===JSON.stringify(next))throw Error('تغییری داده نشده است');doc.settings.cycleCount=next;ctx.auditExtra={before,after:next};return next}
function abcClasses(rows,{aShare=80,bShare=95}={}){const used=A(rows).filter(r=>N(r.value)>0).sort((x,y)=>N(y.value)-N(x.value)),tot=used.reduce((t,r)=>t+N(r.value),0),out=new Map;let run=0;
 for(const r of used){const before=tot?run/tot*100:0;run+=N(r.value);out.set(r.id,before<aShare?'A':before<bShare?'B':'C')}for(const r of A(rows))if(!out.has(r.id))out.set(r.id,'C');return out}
function lastCountDates(doc){const m=new Map;for(const st of A(doc?.stocktakes)){if(!['approved','submitted'].includes(st.status))continue;const d=D(st.date);if(!validDate(d))continue;for(const l of A(st.lines)){if(l.assumedZero||!l.ingredientId)continue;if(!m.has(l.ingredientId)||m.get(l.ingredientId)<d)m.set(l.ingredientId,d)}}return m}
function cycleDue(ids,classes,last,set,today){const t=E().CAL.i(today),gap={A:set.a,B:set.b,C:set.c};return A(ids).map(id=>{const cl=classes.get(id)||'C',d=last.get(id)||'',age=d?t-E().CAL.i(d):null;return{id,cls:cl,last:d,age,due:age===null||age>=gap[cl],over:age===null?Infinity:age-gap[cl]}})}
function suggestReorder(daily,set){const u=N(daily);if(!(u>0))return null;const up=v=>Math.ceil(v*100-1e-9)/100,rp=up(u*(set.lead+set.safety));return{reorderPoint:rp,targetStock:up(rp+u*set.cycle)}}

/* ---------- day checks («روزهای ماه» on the home page, APP_REVIEW P-04) ----------
   inventory.dayChecks {id DAY-<date>, date, closed (the café was closed), none [keys entered as «نداشتیم»: snapp, waste,
   inv…], note, by, at, history[]}: one per date; a change keeps the previous state in history (nothing is removed). It only
   marks a day complete; it changes no stock, sales or money. */
const DAY_NONE_KEYS=['snapp','waste','inv','bev','sepidz'];
function saveDayCheck(doc,ctx,{date,closed,none,note}){date=D(date);if(!validDate(date))throw Error('تاریخ معتبر نیست');if(date>E().CAL.today)throw Error('روز آینده را نمی‌توان علامت زد');
 const keys=[...new Set(A(none).map(S))].filter(k=>DAY_NONE_KEYS.includes(k)).sort(),next={closed:closed===true,none:keys,note:S(note)};doc.dayChecks=A(doc.dayChecks);let row=doc.dayChecks.find(x=>x.date===date);
 const prev=row?{closed:!!row.closed,none:A(row.none).slice().sort(),note:S(row.note)}:{closed:false,none:[],note:''};if(JSON.stringify(prev)===JSON.stringify(next))throw Error('تغییری داده نشده است');
 if(!row){row={id:`DAY-${date.split("/").join("")}`,date,history:[]};doc.dayChecks.push(row)}else row.history=[...A(row.history),{...prev,by:row.by,at:row.at}];
 Object.assign(row,next,{by:ctx.actor,at:ctx.at});ctx.auditExtra={entityId:row.id,before:prev,after:next};return row}

/* ---------- setup tools (BL-011, same records as js/32 so either panel can roll the other back) ----------
   Explicit owner operations with preview, a downloaded backup, a reason and a confirmation; nothing is deleted.
   startFresh (js/32 «شروع دوباره انبارداری از یک تاریخ»): every active inventory record dated before the cutoff is voided
   (voidedByOperation = the operation id); catalog last purchase prices dated before it are cleared and the price history
   before it voided (pricing save, same operation id). Lists, recipes, invoices and payments stay. Audit rows
   INVENTORY_START_FROM_DATE {operationId, cutoff, reason, changes [{collection, rows [[index, id, status]]}]} and
   PRICES_RESET_FOR_INVENTORY_START {operationId, ingredients [{id, before}], history [[index, id, isVoided]]}.
   Rollback: the last not-reverted operation; a record changed since (not void by this operation any more, or a price
   entered since) is left as it is. resetCounts: every active count and opening balance voided (INVENTORY_COUNTS_RESET,
   with operationId so it can be rolled back too). */
const FRESH_COLLECTIONS=[['stocktakes','شمارش‌ها و انبارگردانی‌ها'],['openingBalances','موجودی‌های اولیه'],['stockReceipts','ورود به انبار'],['inventoryMovements','گردش‌های انبار'],['wasteRecords','پرتی و ضایعات'],['consumptionRecords','مصرف پرسنلی و مجاز'],['salesPeriods','فروش ثبت‌شده'],['spotCounts','شمارش هفتگی مصرفی‌ها'],['beverageDailyControls','کنترل روزانه نوشیدنی']];
const PRICE_FIELDS=['lastPurchasePriceToman','lastPurchaseDate','lastPurchaseSource','lastPurchaseInvoiceId'],VOID_KEYS=['voidReason','voidedAt','voidedBy','voidedByOperation'];
const freshDate=(c,r)=>c==='salesPeriods'?D(r.to||r.date||r.from):D(r.date);
const freshRec=(arr,index,id)=>{const r=A(arr)[index];return r&&(r.id??null)===id?r:id?A(arr).find(x=>x.id===id):null};
function startFreshPlan(inv,pricing,cutoff){cutoff=D(cutoff);if(!validDate(cutoff))throw Error('تاریخ شروع معتبر نیست');if(cutoff>E().CAL.today)throw Error('تاریخ شروع بعد از امروز است');
 const inventory=[],straddle=[];let undated=0;
 for(const [collection,label] of FRESH_COLLECTIONS){const rows=[];A(inv?.[collection]).forEach((r,index)=>{if(!r||r.status==='void')return;const d=freshDate(collection,r);if(!validDate(d)){undated++;return}if(d>=cutoff){if(collection==='salesPeriods'&&validDate(D(r.from))&&D(r.from)<cutoff)straddle.push(r.id||String(index));return}rows.push([index,r.id??null,r.status??null])});inventory.push({collection,label,rows})}
 const keeps=i=>validDate(D(i.lastPurchaseDate))&&D(i.lastPurchaseDate)>=cutoff;
 const ingredients=A(pricing?.ingredients).filter(i=>!keeps(i)&&(N(i.lastPurchasePriceToman)>0||S(i.lastPurchaseDate)||S(i.lastPurchaseInvoiceId))).map(i=>({id:i.id,before:Object.fromEntries(PRICE_FIELDS.map(k=>[k,i[k]??null]))}));
 const history=[];A(pricing?.ingredientPriceHistory).forEach((h,index)=>{if(!h||h.isVoided===true)return;const d=D(h.date);if(validDate(d)&&d>=cutoff)return;history.push([index,h.id??null,h.isVoided??null])});
 return{cutoff,inventory,straddle,undated,ingredients,history,keptPrices:A(pricing?.ingredients).filter(i=>keeps(i)&&N(i.lastPurchasePriceToman)>0).length,closed:A(inv?.periodClosures).filter(c=>c.status==='closed'&&D(c.from)<cutoff).length,total:inventory.reduce((a,g)=>a+g.rows.length,0)}}
// inventory part (inside InvWrite.edit, action INVENTORY_START_FROM_DATE); the plan is made again on the fresh document
function startFresh(doc,ctx,{cutoff,reason,operationId}){reason=S(reason);if(!reason)throw Error('علت را بنویسید');if(!S(operationId))throw Error('شناسهٔ عملیات لازم است');
 const plan=startFreshPlan(doc,ctx.pricing,cutoff);if(!plan.total&&!plan.ingredients.length&&!plan.history.length)throw Error('سابقهٔ فعال یا قیمتی قبل از این تاریخ وجود ندارد');
 for(const g of plan.inventory)for(const [index,id] of g.rows){const r=freshRec(doc[g.collection],index,id);Object.assign(r,{status:'void',voidReason:reason,voidedAt:ctx.at,voidedBy:ctx.actor,voidedByOperation:operationId})}
 ctx.auditExtra={operationId,cutoff:plan.cutoff,reason,changes:plan.inventory.filter(g=>g.rows.length).map(g=>({collection:g.collection,rows:g.rows})),pricingIngredients:plan.ingredients.length,pricingHistory:plan.history.length};return plan}
// pricing part (InvWrite.edit with module pricing, action PRICES_RESET_FOR_INVENTORY_START)
function startFreshPrices(pdoc,ctx,{cutoff,reason,operationId}){const plan=startFreshPlan({},pdoc,cutoff);
 for(const x of plan.ingredients){const i=A(pdoc.ingredients).find(v=>v.id===x.id);Object.assign(i,{lastPurchasePriceToman:0,lastPurchaseDate:'',lastPurchaseSource:'',lastPurchaseInvoiceId:''})}
 for(const [index,id] of plan.history){const h=freshRec(pdoc.ingredientPriceHistory,index,id);Object.assign(h,{isVoided:true,voidReason:S(reason),voidedAt:ctx.at,voidedBy:ctx.actor,voidedByOperation:operationId})}
 ctx.auditExtra={operationId,cutoff:plan.cutoff,reason:S(reason),ingredients:plan.ingredients,history:plan.history};return{ingredients:plan.ingredients.length,history:plan.history.length}}
const lastOp=(doc,action)=>A(doc?.changeLog).filter(e=>e.action===action&&!e.revertedAt&&S(e.operationId)).at(-1)||null;
function startFreshRollbackPlan(inv,pricing){const entry=lastOp(inv,'INVENTORY_START_FROM_DATE');if(!entry)return null;const op=entry.operationId,priceEntry=A(pricing?.changeLog).filter(e=>e.action==='PRICES_RESET_FOR_INVENTORY_START'&&e.operationId===op&&!e.revertedAt).at(-1)||null;
 const records=A(entry.changes).reduce((a,g)=>a+A(g.rows).filter(([index,id])=>freshRec(inv[g.collection],index,id)?.voidedByOperation===op).length,0);return{entry,priceEntry,records,prices:A(priceEntry?.ingredients).length}}
function rollbackStartFresh(doc,ctx){const entry=lastOp(doc,'INVENTORY_START_FROM_DATE');if(!entry)throw Error('شروع دوباره‌ای برای بازگردانی نیست');const op=entry.operationId;let restored=0,skipped=0;
 for(const g of A(entry.changes))for(const [index,id,status] of A(g.rows)){const r=freshRec(doc[g.collection],index,id);if(!r||r.voidedByOperation!==op||r.status!=='void'){skipped++;continue}if(status===null)delete r.status;else r.status=status;for(const k of VOID_KEYS)delete r[k];restored++}
 doc.changeLog.find(e=>e.id===entry.id).revertedAt=ctx.at;ctx.auditExtra={operationId:op,restored,skipped};return{operationId:op,restored,skipped}}
function rollbackStartFreshPrices(pdoc,ctx,{operationId}){const pe=A(pdoc.changeLog).filter(e=>e.action==='PRICES_RESET_FOR_INVENTORY_START'&&e.operationId===operationId&&!e.revertedAt).at(-1);if(!pe)return{restored:0,skipped:0};let restored=0,skipped=0;
 for(const x of A(pe.ingredients)){const i=A(pdoc.ingredients).find(v=>v.id===x.id);if(!i||N(i.lastPurchasePriceToman)!==0||S(i.lastPurchaseDate)){skipped++;continue}for(const k of PRICE_FIELDS){if(x.before[k]===null)delete i[k];else i[k]=x.before[k]}restored++}
 for(const [index,id,prev] of A(pe.history)){const h=freshRec(pdoc.ingredientPriceHistory,index,id);if(!h||h.voidedByOperation!==operationId)continue;if(prev===null)delete h.isVoided;else h.isVoided=prev;for(const k of VOID_KEYS)delete h[k]}
 pdoc.changeLog.find(e=>e.id===pe.id).revertedAt=ctx.at;ctx.auditExtra={operationId,restored,skipped};return{restored,skipped}}
// reset counts (js/32 «بازنشانی شمارش‌ها»)
function resetCountsPlan(inv){return{stocktakes:A(inv?.stocktakes).filter(x=>x&&x.status!=='void').length,openings:A(inv?.openingBalances).filter(x=>x&&x.status!=='void').length}}
function resetCounts(doc,ctx,{reason,operationId}){reason=S(reason);if(!reason)throw Error('علت بازنشانی را بنویسید');let n=0;const rows=[];
 for(const c of ['stocktakes','openingBalances'])A(doc[c]).forEach((r,index)=>{if(!r||r.status==='void')return;rows.push([c,index,r.id??null,r.status??null]);Object.assign(r,{status:'void',voidReason:reason,voidedAt:ctx.at,voidedBy:ctx.actor,voidedByOperation:operationId});n++});
 if(!n)throw Error('شمارش یا افتتاحیهٔ فعالی برای بازنشانی وجود ندارد');ctx.auditExtra={reason,count:n,operationId,rows};return{count:n}}
function rollbackResetCounts(doc,ctx){const e=lastOp(doc,'INVENTORY_COUNTS_RESET');if(!e||!A(e.rows).length)throw Error('بازنشانی شمارشِ قابل بازگردانی نیست');let restored=0,skipped=0;
 for(const [c,index,id,status] of e.rows){const r=freshRec(doc[c],index,id);if(!r||r.voidedByOperation!==e.operationId||r.status!=='void'){skipped++;continue}if(status===null)delete r.status;else r.status=status;for(const k of VOID_KEYS)delete r[k];restored++}
 doc.changeLog.find(x=>x.id===e.id).revertedAt=ctx.at;ctx.auditExtra={operationId:e.operationId,restored,skipped};return{restored,skipped}}

/* ---------- protected save ---------- */
const state={busy:false,uncertain:false};
function validDoc(doc){return !!doc&&typeof doc==='object'&&Array.isArray(doc.stocktakes)&&Array.isArray(doc.inventoryMovements)}
async function verify(io,after){let last=null;for(const wait of [0,700,2000]){if(wait)await new Promise(r=>setTimeout(r,wait));try{const c=await io.load();if(S(c?.meta?.serverSaveToken)===after.meta.serverSaveToken&&content(c)===content(after))return c;last=Error('بازخوانی سرور با سند ارسالی یکسان نیست؛ ذخیره تأیید نشد')}catch(e){last=e}}throw last}
// io: {load():Promise<doc>, save(doc):Promise, actor():string, pricing():object, module?:'inventory'|'pricing', validate?(doc):bool}
// The same protocol serves the pricing module (menu-write.js) through io.module and io.validate.
async function edit(io,{action,details={},mutate}){
 if(state.uncertain)throw Error('نتیجهٔ ذخیرهٔ قبلی نامشخص است؛ صفحه را بازخوانی کنید و ثبت قبلی را در فهرست بررسی کنید');
 if(state.busy)throw Error('ذخیرهٔ دیگری در حال انجام است؛ کمی بعد دوباره تلاش کنید');
 const actor=S(io.actor());if(!actor)throw Error('این عملیات فقط در نشست مدیریت مجاز است');
 state.busy=true;
 try{
  const before=await io.load();if(!(io.validate||validDoc)(before))throw Error(`Load کامل و معتبر ${io.module==='pricing'?'منو و قیمت':'انبار'} لازم است؛ چیزی ذخیره نشد`);
  const after=clone(before);after.settings=after.settings&&typeof after.settings==='object'?after.settings:{};
  // staff of the staff app (AdminAccess.staff): the records name the person (reportedByPersonnelId…)
  const ctx={actor,at:now(),reqId:requestId(),pricing:io.pricing(),module:io.module||'inventory',staff:(typeof window!=='undefined'&&window.AdminAccess?.staff?.())||null};
  // one audit row per save; a void adds the record as it was before the change (ctx.auditExtra)
  const out=mutate(after,ctx);
  // inventory saves: later whole counts follow the change (opt out with io.recalc===false, e.g. pure settings)
  if((io.module||'inventory')==='inventory'&&io.recalc!==false){const from=io.recalcAll?'':affectedFrom(before,after);if(from||io.recalcAll){const r=recalcCounts(after,ctx,{from});if(r.lines){ctx.auditExtra={...(ctx.auditExtra||{}),recalculatedLaterLines:r.lines,recalculatedCounts:r.counts};if(out&&typeof out==='object')out.recalculated=r.lines}}}
  audit(after,action,{...details,...(ctx.auditExtra||{})},ctx);
  after.meta=after.meta&&typeof after.meta==='object'?after.meta:{};after.meta.serverSaveToken=`${String(io.module||'inventory').toUpperCase()}-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;after.meta.updatedAt=now();
  let sent=false;
  try{sent=true;await io.save(after);const doc=await verify(io,after);return{out,doc}}
  catch(e){if(sent){try{const c=await io.load();if(S(c?.meta?.serverSaveToken)===after.meta.serverSaveToken&&content(c)===content(after))return{out,doc:c}}catch(_){}state.uncertain=true}throw e}
 }finally{state.busy=false}}

/* ---------- stocktakes (انبارگردانی): variance review, close and reopen ----------
   One «انبارگردانی» = the approved whole end-of-day counts of one date. Its lines already carry start, receipts, sales,
   waste, expected, counted and variance (kept current by the automatic recalculation).
   Reviews: inventory.countReviews {id CRV-NNNNNN, date, itemId, status accepted|explained|corrected|followup, note, by, at,
   history[]} — one per count line, a change keeps the previous state in history.
   Close: inventory.periodClosures {id CLOSE-NNNNNN, kind 'stocktake', controlMode 'stocktake', scope 'RAYO', from, to,
   status closed|reopened, closedAt/By, note, stocktakeMetrics, stocktakeLines (frozen snapshot with reviews)}. Every inventory
   entry dated on or before «to» is then refused (checkDate / closedPeriod), the rule both panels already apply to closed
   periods; «from» continues from the previous closure so closed ranges stay contiguous. Reopen: the last closure only,
   status «reopened» with a reason; nothing is removed. */
const REVIEW_LABELS={accepted:'پذیرفته',explained:'موجه',corrected:'اصلاح شد',followup:'نیاز به پیگیری'};
const N0=x=>Number.isFinite(Number(x))?Number(x):0;
const hasVariance=l=>Math.abs(N0(l?.variance))>1e-9;
const countDocs=(doc,date)=>A(doc.stocktakes).filter(s=>wholeScope(s)&&s.status==='approved'&&boundary(s)==='END'&&!s.isOpeningBaseline&&D(s.date)===date);
function countLinesOf(doc,date){date=D(date);const m=new Map;for(const s of countDocs(doc,date))for(const l of A(s.lines))if(!l.assumedZero)m.set(l.ingredientId,l);return [...m.values()]}
/* parked (Set of item ids, BL-088): their variance goes to parkedVariance / parkedShortage only */
function countMetrics(lines,parked){const v=(l,x)=>N0(x)*N0(l.unitCost),o={items:lines.length,withVariance:0,baseValue:0,receiptValue:0,salesValue:0,wasteValue:0,expectedValue:0,countedValue:0,varianceValue:0,shortageValue:0,surplusValue:0,parkedVariance:0,parkedShortage:0,parkedItems:0};
 for(const l of lines){o.baseValue+=v(l,l.baseQuantity);o.receiptValue+=v(l,l.purchaseQty);o.salesValue+=v(l,l.salesConsumption);o.wasteValue+=v(l,N0(l.wasteQty)+N0(l.otherOutQty));o.expectedValue+=v(l,l.expected);o.countedValue+=v(l,l.actual);
  const vv=N0(l.varianceValueToman);if(parked&&parked.has(l.ingredientId)){o.parkedVariance+=vv;if(vv<0)o.parkedShortage+=vv;if(hasVariance(l))o.parkedItems++;continue}o.varianceValue+=vv;if(vv<0)o.shortageValue+=vv;else o.surplusValue+=vv;if(hasVariance(l))o.withVariance++}
 for(const k of Object.keys(o))if(!['items','withVariance','parkedItems'].includes(k))o[k]=Math.round(o[k])||0;return o}
function reviewOf(doc,date,itemId){return A(doc.countReviews).find(r=>r.date===D(date)&&r.itemId===itemId)||null}
function reviewCountLine(doc,ctx,{date,itemId,status,note}){date=D(date);itemId=S(itemId);status=S(status);note=S(note);
 if(!REVIEW_LABELS[status])throw Error('نتیجهٔ بررسی را انتخاب کنید');
 const c=closedPeriod(doc,date);if(c)throw Error(`انبارگردانی تا ${c.to} بسته است؛ بررسی تغییر نمی‌کند`);
 if(!countLinesOf(doc,date).some(l=>l.ingredientId===itemId))throw Error('این قلم در شمارش این تاریخ نیست');
 if(status!=='accepted'&&!note)throw Error('توضیح بررسی را بنویسید');
 doc.countReviews=A(doc.countReviews);let r=reviewOf(doc,date,itemId);
 if(r){if(r.status===status&&r.note===note)throw Error('بررسی تغییری نکرده است');r.history=A(r.history);r.history.push({status:r.status,note:r.note,by:r.by,at:r.at});Object.assign(r,{status,note,by:ctx.actor,at:ctx.at})}
 else{r={id:uid('CRV',doc.countReviews),date,itemId,status,note,by:ctx.actor,at:ctx.at,history:[]};doc.countReviews.push(r)}
 ctx.auditExtra={entityId:r.id,date,itemId,status};return r}
function lastClosure(doc){return A(doc.periodClosures).filter(c=>c.status==='closed').sort((a,b)=>D(a.to).localeCompare(D(b.to))||S(a.closedAt).localeCompare(S(b.closedAt))).at(-1)||null}
function closeCount(doc,ctx,{date,note}){date=D(date);const lines=countLinesOf(doc,date);if(!lines.length)throw Error('در این تاریخ شمارش کل پایان روز نیست');
 const c=closedPeriod(doc,date);if(c)throw Error(`این انبارگردانی قبلاً بسته شده است (دورهٔ تا ${c.to})`);
 const rv=l=>reviewOf(doc,date,l.ingredientId),open=lines.filter(l=>rv(l)?.status==='followup');if(open.length)throw Error(`${open.length} مغایرت «نیاز به پیگیری» دارد؛ اول تکلیفشان را روشن کنید`);
 const last=lastClosure(doc),opening=A(doc.stocktakes).filter(s=>wholeScope(s)&&s.status==='approved'&&boundary(s)==='START').map(s=>D(s.date)).sort()[0]||'';
 const from=last?E().CAL.k(E().CAL.i(D(last.to))+1):opening;
 const lines2=lines.map(l=>{const r=rv(l);return{ingredientId:l.ingredientId,name:S(l.itemNameSnapshot),code:S(l.itemCodeSnapshot),unit:S(l.unitSnapshot),baseDate:S(l.baseDate),baseQuantity:l.baseQuantity??null,purchaseQty:N0(l.purchaseQty),salesConsumption:N0(l.salesConsumption),wasteQty:N0(l.wasteQty)+N0(l.otherOutQty),expected:l.expected??null,actual:l.actual??null,variance:l.variance??null,unitCost:l.unitCost??null,varianceValueToman:N0(l.varianceValueToman),...(r?{review:r.status,reviewNote:r.note,reviewedBy:r.by}:{})}});
 doc.periodClosures=A(doc.periodClosures);
 const rec={id:uid('CLOSE',doc.periodClosures),kind:'stocktake',controlMode:'stocktake',scope:'RAYO',from,to:date,status:'closed',closedAt:ctx.at,closedBy:ctx.actor,note:S(note),
  stocktakeMetrics:{...countMetrics(lines,E().parkedIds(doc,ctx.pricing)),reviewed:lines.filter(l=>hasVariance(l)&&rv(l)).length},stocktakeLines:lines2};
 doc.periodClosures.push(rec);ctx.auditExtra={entityId:rec.id,from,to:date};return rec}
function reopenCount(doc,ctx,{id,reason}){reason=S(reason);if(!reason)throw Error('علت بازگشایی لازم است');const c=A(doc.periodClosures).find(x=>x.id===id);if(!c||c.status!=='closed')throw Error('دورهٔ بسته پیدا نشد');
 const last=lastClosure(doc);if(last&&last.id!==c.id)throw Error(`فقط آخرین دورهٔ بسته (تا ${last.to}) باز می‌شود`);
 Object.assign(c,{status:'reopened',reopenedAt:ctx.at,reopenedBy:ctx.actor,reopenReason:reason});ctx.auditExtra={entityId:c.id,reason};return c}
/* ---------- item merge (catalog «ادغام اقلام») ----------
   The on-hand of each merged item moves to the kept item as a pair of ITEM_MERGE movements dated today: out of the
   merged item (fromLocationId) and into the kept item (toLocationId, quantity × unit factor). Nothing is deleted; a
   void movement pair would undo it. The beverage-control list swaps the merged id for the kept one. The catalog side
   (recipes, archive) is MenuWrite.mergeIngredients on pricing. */
function mergeStock(doc,ctx,{toId,toName,moves,bevIds}){const date=E().CAL.today,c=closedPeriod(doc,date);if(c)throw Error(`دورهٔ ${c.from||''} تا ${c.to} بسته است؛ انتقال موجودی ممکن نیست`);
 const loc=S(doc.settings?.mainLocationId)||'LOC-MAIN',out={moved:0,bev:0};doc.inventoryMovements=A(doc.inventoryMovements);
 for(const m of A(moves)){const q=Number(m.qty),tq=Number(m.toQty);if(!(q>0)||!(tq>0))continue;if(!S(m.fromId)||S(m.fromId)===S(toId))throw Error('قلم ادغام نامعتبر است');
  const key=`merge:${m.fromId}:${toId}:${ctx.reqId}`,note=`ادغام «${S(m.fromName)}» در «${S(toName)}»`,base={date,time:'',movementType:'ITEM_MERGE',reasonCode:'ITEM_MERGE',referenceType:'itemMerge',referenceId:ctx.reqId,status:'posted',notes:note,createdAt:ctx.at,createdBy:ctx.actor};
  doc.inventoryMovements.push({id:uid('MOV',doc.inventoryMovements),...base,ingredientId:m.fromId,quantity:r3x(q),fromLocationId:loc,toLocationId:'',sourceKey:key+':out',mergedIntoId:toId});
  doc.inventoryMovements.push({id:uid('MOV',doc.inventoryMovements),...base,ingredientId:toId,quantity:r3x(tq),fromLocationId:'',toLocationId:loc,sourceKey:key+':in',mergedFromId:m.fromId,unitFactor:Number(m.factor)||1});out.moved++}
 const bc=doc.settings?.beverageControl,set=new Set(A(bevIds));if(bc&&Array.isArray(bc.itemIds)&&bc.itemIds.some(id=>set.has(id))){const next=[];for(const id of bc.itemIds){const v=set.has(id)?toId:id;if(!next.includes(v))next.push(v)}bc.itemIds=next;out.bev=1}
 if(!out.moved&&!out.bev)throw Error('موجودی‌ای برای انتقال نیست');ctx.auditExtra={toId,moves:clone(A(moves)),beverage:out.bev};return out}
const r3x=x=>Math.round(x*1e6)/1e6;
/* ---------- base unit change with conversion (owner, BL-095; catalog side MenuWrite.changeBaseUnit) ----------
   Saved before the catalog. Every inventory record of the item written in the old base unit (oldLabels: the base and its
   earlier names) is multiplied by k (one old unit = k new units), costs per unit divided by k, snapshots get the new unit
   name. Records written in another unit (unitSnapshot not an old label) are left as they are. Revision histories and the
   change log keep what they recorded. doc.unitChanges [{id, ingredientId, from, to, k}] marks it done: the same changeId
   never converts twice, so a failed catalog save is completed by running the change again. */
function changeBaseUnitStock(doc,ctx,{id,from,to,k,oldLabels,changeId}){k=Number(k);if(!S(id)||!S(to)||!(k>0))throw Error('تغییر واحد نامعتبر است');if(!S(changeId))throw Error('شناسهٔ تغییر لازم است');
 doc.unitChanges=A(doc.unitChanges);if(doc.unitChanges.some(x=>x.id===changeId))return{skipped:true,counts:{}};
 const UK=E().UK,olds=[from,...A(oldLabels)].filter(Boolean).map(UK),isOld=u=>!S(u)||olds.includes(UK(u)),R=x=>Math.round(x*1e9)/1e9;
 const mul=(o,fs)=>{for(const f of fs)if(o[f]!==undefined&&o[f]!==null&&o[f]!==''&&Number.isFinite(Number(o[f])))o[f]=R(Number(o[f])*k)},div=(o,fs)=>{for(const f of fs)if(o[f]!==undefined&&o[f]!==null&&o[f]!==''&&Number.isFinite(Number(o[f])))o[f]=R(Number(o[f])/k)};
 const c={counts:0,receipts:0,waste:0,movements:0,invoices:0,beverage:0,tracked:0};
 for(const st of A(doc.stocktakes)){for(const l of A(st.lines)){if(l.ingredientId!==id||!isOld(l.unitSnapshot))continue;
   mul(l,['actual','expected','variance','baseQuantity','salesConsumption','movementNet','purchaseQty','wasteQty','otherOutQty','directActual','preparedActual','entryUnitFactor','entryRestFactor']);div(l,['unitCost']);
   for(const p of A(l.countParts)){mul(p,['factor','base'])}for(const x of A(l.preparedContributions))if(isOld(x.unit)){mul(x,['quantity']);x.unit=to}
   if(!S(l.entryUnit)&&!A(l.countParts).length&&l.actual!==null&&l.actual!==undefined&&l.actual!==''){l.entryUnit=from;l.entryQuantity=R(Number(l.actual)/k);l.entryUnitFactor=k}
   l.unitSnapshot=to;c.counts++}
  for(const pl of A(st.preparedLines))for(const x of A(pl.contributions))if(x.ingredientId===id&&isOld(x.unit)){mul(x,['quantity']);x.unit=to}}
 for(const r of A(doc.stockReceipts)){if(r.ingredientId!==id||!isOld(r.unitSnapshot))continue;if(!S(r.entryUnit)){r.entryUnit=from;r.entryQuantity=Number(r.quantity);r.entryUnitFactor=1}
  mul(r,['quantity','entryUnitFactor']);div(r,['unitCostToman']);r.unitSnapshot=to;c.receipts++}
 for(const w of [...A(doc.wasteRecords),...A(doc.consumptionRecords)]){if(w.type==='menu'||w.itemId!==id)continue;mul(w,['quantity','originalQuantity']);c.waste++}
 for(const m of A(doc.inventoryMovements)){if(m.ingredientId!==id||!isOld(m.unitSnapshot))continue;mul(m,['quantity']);div(m,['unitCostToman']);if(S(m.mergedFromId))mul(m,['unitFactor']);if(S(m.unitSnapshot))m.unitSnapshot=to;c.movements++}
 for(const x of A(doc.purchaseInvoices))for(const l of A(x.lines)){if(l.ingredientId!==id||!isOld(l.recipeUnit))continue;mul(l,['packageQuantity']);if(S(l.recipeUnit))l.recipeUnit=to;c.invoices++}
 for(const b of A(doc.beverageDailyControls))for(const l of A(b.lines)){if(l.ingredientId!==id||!isOld(l.unitSnapshot))continue;mul(l,['morningUpper','morningLower','inflow','nonSale','nightUpper','nightLower','sales']);l.unitSnapshot=to;c.beverage++}
 for(const t of A(doc.trackedIngredients)){if(t.ingredientId!==id)continue;mul(t,['initialStock','reorderPoint','targetStock']);c.tracked++}
 doc.unitChanges.push({id:changeId,ingredientId:id,from,to,k,at:ctx.at,by:ctx.actor,counts:c});ctx.auditExtra={entityId:id,from,to,k,changeId,counts:c};return{skipped:false,counts:c}}

window.InvWrite={changeBaseUnitStock,ownLevel,editOpeningLine,startFreshPlan,startFresh,startFreshPrices,startFreshRollbackPlan,rollbackStartFresh,rollbackStartFreshPrices,resetCountsPlan,resetCounts,rollbackResetCounts,lastSetupOp:lastOp,COUNT_PLACES,countPlaces,saveCountPlaces,mergeStock,stdUnits,CYCLE_DEF,cycleSettings,saveCycleSettings,abcClasses,lastCountDates,cycleDue,suggestReorder,saveDayCheck,DAY_NONE_KEYS,useUnitOf,countUnitOf,smallestUnit,toBase,REVIEW_LABELS,hasVariance,countLinesOf,countMetrics,reviewOf,reviewCountLine,lastClosure,closeCount,reopenCount,removeZeroCountLines,removeCountLine,LEVELS,levelOf,saveControlLevels,saveFryerSettings,saveReorderPoints,EVENT_LABELS,AUTH_TYPES,SHIFTS,state,canonical,content,uid,unitsOf,unitName,stockItem,trackedItems,purchaseUnitsOf,mainLocation,closedPeriod,oilSettings,countInfo,receiptWarnings,receiptLines,
 addReceipts,voidReceipt,editReceipt,addEvent,voidEvent,editEvent,voidCountDate,addOilChange,addCount,findEvent,edit,affectedFrom,recalcCounts,zeroFillPlan,zeroFill,lastZeroFill,zeroFillRollbackPlan,zeroFillRollback,saveBeverageItems,paymentOptions,savePaymentOptions};
})();
