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
function canonical(x){if(Array.isArray(x))return '['+x.map(v=>v===undefined||typeof v==='function'?'null':canonical(v)).join(',')+']';if(x&&typeof x==='object'){if(typeof x.toJSON==='function')return canonical(x.toJSON());return '{'+Object.keys(x).filter(k=>x[k]!==undefined&&typeof x[k]!=='function').sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}'}if(typeof x==='number'&&!Number.isFinite(x))return 'null';return JSON.stringify(x)}
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
// entry units: the stock (recipe) unit, plus the purchase unit when it is a different unit with a package size
function unitsOf(i){const out=[{name:unitName(i),factor:1}],pk=Number(i?.packageQuantity);if(S(i?.purchaseUnit)&&pk>1&&E().UK(i.purchaseUnit)!==E().UK(unitName(i)))out.push({name:S(i.purchaseUnit),factor:pk});return out}
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
function voidReceipt(doc,ctx,{id,reason}){reason=S(reason);if(!reason)throw Error('علت ابطال لازم است');const r=A(doc.stockReceipts).find(x=>x.id===id);if(!r)throw Error('ورود پیدا نشد');if(r.status==='void')throw Error('این ورود قبلاً باطل شده است');if(r.invoiceId)throw Error('ورود وابسته به فاکتور باید از مسیر ابطال همان فاکتور (پنل فعلی) اصلاح شود');const c=closedPeriod(doc,D(r.date));if(c)throw Error(`دورهٔ ${c.from||''} تا ${c.to} بسته است`);if(A(ctx.pricing?.ingredientPriceHistory).some(h=>h.receiptId===id))throw Error('این ورود قیمت خرید ثبت کرده است؛ ابطال آن از پنل فعلی انجام شود');
 ctx.auditExtra={entityId:r.id,before:clone(r),reason};
 Object.assign(r,{status:'void',statusBeforeVoid:r.status||'posted',voidReason:reason,voidedAt:ctx.at,voidedBy:ctx.actor});
 A(doc.inventoryMovements).filter(x=>x.sourceKey===`receipt:${id}`||x.referenceId===id).forEach(x=>Object.assign(x,{status:'void',voidReason:reason,voidedAt:ctx.at,voidedBy:ctx.actor}));return r}

/* ---------- waste / authorized consumption (js/32 saveEventOnce + syncWasteMovement) ---------- */
function addMovementsFor(doc,w,ctx,M){doc.inventoryMovements=A(doc.inventoryMovements);const kind=w.recordKind==='consumption'?'consumption':'waste',base=`${kind}:${w.id}`,loc=w.locationId||doc.settings?.mainLocationId||'';
 const push=(key,ingredientId,quantity)=>{const m={id:uid('MOV',doc.inventoryMovements),date:w.date,time:w.time||'',movementType:w.eventType||'WASTE',ingredientId,quantity,fromLocationId:loc,toLocationId:'',reasonCode:w.reason||'',referenceType:kind==='consumption'?'consumptionRecord':'wasteRecord',referenceId:w.id,sourceKey:key,status:'posted',personnelId:w.reportedByPersonnelId||w.responsiblePersonnelId||'',personnelName:w.reportedByName||'',shift:w.shift||'',notes:w.notes||'',reviewStatus:w.reviewStatus||'',managerNote:w.managerNote||'',updatedAt:ctx.at,createdAt:w.createdAt||ctx.at,createdBy:w.createdBy||ctx.actor};doc.inventoryMovements.push(m);return m};
 if(w.type==='ingredient'){w.movementId=push(base,w.itemId,w.quantity).id}
 else for(const r of M.recipeAt(w.itemId,w.date))push(`${base}:${r.ingredientId}`,r.ingredientId,M.gross(M.ing.get(r.ingredientId),r,Number(w.quantity)))}
function addEvent(doc,ctx,input){const date=D(input.date);checkDate(doc,date);const eventType=S(input.eventType),type=input.type==='menu'?'menu':'ingredient',itemId=S(input.itemId),reason=S(input.reason),notes=S(input.notes),shift=S(input.shift);
 if(!EVENT_LABELS[eventType]||eventType==='FRYER_OIL_CHANGE')throw Error('نوع رویداد را انتخاب کنید');const l=mainLocation(doc);if(!l)throw Error('انبار اصلی تعریف نشده است');
 const M=E().build({inventory:doc,pricing:ctx.pricing});let quantity=N(input.quantity),entry=null;
 if(type==='ingredient'){const i=M.ing.get(itemId);if(!stockItem(i))throw Error('کالای انبار را انتخاب کنید');const u=unitsOf(i).find(u=>u.name===S(input.unit))||unitsOf(i)[0];if(!(quantity>0))throw Error('مقدار مثبت لازم است');if(u.factor!==1)entry={entryQuantity:quantity,entryUnit:u.name,entryUnitFactor:u.factor};quantity=r3(quantity*u.factor)}
 else{const m=M.menu.get(itemId);if(!m)throw Error('آیتم منو را انتخاب کنید');if(!(quantity>0))throw Error('تعداد مثبت لازم است');const rec=M.recipeAt(itemId,date);if(!rec.length||rec.some(r=>!Number.isFinite(M.gross(M.ing.get(r.ingredientId),r,quantity))))throw Error('رسپی، واحد یا افت این آیتم ناقص است؛ ابتدا رسپی را کامل کنید')}
 if(!reason&&!notes)throw Error('علت یا توضیح رویداد را وارد کنید');
 const common={date,eventType,type,itemId,locationId:l.id,shift,quantity,invoiceNumber:'',responsiblePersonnelId:'',reason,notes,...(entry||{}),reviewStatus:'تأییدشده',reportedByName:ctx.actor,reviewedBy:ctx.actor,reviewedAt:ctx.at,createdBy:ctx.actor,createdAt:ctx.at,status:'posted'};
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
 old.voidKind='edit';old.replacedById=nu.id;nu.replacesId=old.id;ctx.auditExtra={entityId:nu.id,replaces:old.id,before,reason:S(reason)||'ویرایش'};return nu}
function editEvent(doc,ctx,{id,reason,...input}){const old=findEvent(doc,id);if(!old)throw Error('ثبت پیدا نشد');if(old.eventType==='FRYER_OIL_CHANGE')throw Error('تعویض روغن را باطل و دوباره ثبت کنید');
 voidEvent(doc,ctx,{id,reason:S(reason)||'ویرایش'});const before=ctx.auditExtra?.before;
 const nu=addEvent(doc,ctx,{date:input.date??old.date,eventType:input.eventType??old.eventType,type:old.type,itemId:old.itemId,quantity:input.quantity??(old.entryQuantity??old.quantity),unit:input.unit??(old.entryUnit||''),shift:input.shift??old.shift,reason:input.reason??old.reason,notes:input.notes??old.notes});
 old.voidKind='edit';old.replacedById=nu.id;nu.replacesId=old.id;ctx.auditExtra={entityId:nu.id,replaces:old.id,before,reason:S(reason)||'ویرایش'};return nu}
/* void every approved whole count (end of day) of one date; later counts are recalculated by edit() */
function voidCountDate(doc,ctx,{date,reason}){date=D(date);reason=S(reason);if(!reason)throw Error('علت ابطال لازم است');const c=closedPeriod(doc,date);if(c)throw Error(`دورهٔ ${c.from||''} تا ${c.to} بسته است`);
 const list=A(doc.stocktakes).filter(s=>wholeScope(s)&&s.status==='approved'&&D(s.date)===date&&boundary(s)==='END'&&!s.isOpeningBaseline);if(!list.length)throw Error('شمارش کل پایان روز در این تاریخ نیست (افتتاحیه از این مسیر باطل نمی‌شود)');
 for(const s of list)Object.assign(s,{status:'void',voidReason:reason,voidedAt:ctx.at,voidedBy:ctx.actor});ctx.auditExtra={date,ids:list.map(s=>s.id),reason};return{count:list.length,lines:list.reduce((a,s)=>a+A(s.lines).length,0)}}

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
function addCount(doc,ctx,{date,entries,note,allowEarlier}){date=D(date);checkDate(doc,date,'تاریخ شمارش');const ing=ingredients(ctx.pricing),info=countInfo(doc,date);
 if(info.later.length&&!allowEarlier)throw Error(`بعد از ${date} شمارش کل ثبت شده است (${[...new Set(info.later.map(s=>s.date))].sort().pop()}); برای ثبت با تاریخ قبلی تأیید لازم است.`);
 const rows=A(entries).map(x=>{const i=ing.get(S(x.itemId));if(!stockItem(i))throw Error('قلم شمارش معتبر نیست');const u=unitsOf(i).find(u=>u.name===S(x.unit))||unitsOf(i)[0],q=N(x.quantity);if(!(q>=0))throw Error(`مقدار شمارش «${i.name}» باید عدد نامنفی باشد`);return{i,actual:r3(q*u.factor),entry:u.factor!==1?{entryQuantity:q,entryUnit:u.name,entryUnitFactor:u.factor}:null}});
 if(!rows.length)throw Error('حداقل یک مقدار شمارش وارد کنید');if(new Set(rows.map(r=>r.i.id)).size!==rows.length)throw Error('یک قلم دو بار وارد شده است');
 if(rows.some(x=>A(doc.openingBalances).some(o=>wholeScope(o)&&o.status!=='void'&&rank(o)===`${date}|1`&&o.ingredientId===x.i.id)))throw Error('برای این قلم در همین تاریخ موجودی اولیهٔ قدیمی ثبت شده است؛ از پنل فعلی اقدام کنید');
 // expected from approved whole counts only, without the counts of this same date (they are what is being replaced)
 const mdoc={...doc,stocktakes:A(doc.stocktakes).filter(s=>wholeScope(s)&&s.status==='approved'&&!info.same.includes(s))},M=E().build({inventory:mdoc,pricing:ctx.pricing}),pos=new Map(E().positions(M,date).map(r=>[r.id,r]));
 const line=x=>{const p=pos.get(x.i.id),known=!!p&&p.base!==null&&p.qty!==null,expected=known?r3(p.qty):null,variance=expected===null?null:r3(x.actual-expected),unitCost=M.costAt(x.i.id,date);
  return{ingredientId:x.i.id,actual:x.actual,...(x.entry||{}),itemNameSnapshot:x.i.name,itemCodeSnapshot:x.i.code||'',unitSnapshot:unitName(x.i),expected,variance,variancePercent:expected===null?null:expected?variance/expected*100:variance?100:0,baseQuantity:p?.base??null,salesConsumption:p?r3(p.sales):null,movementNet:p?r3(p.receipt-p.waste-p.auth):null,purchaseQty:p?r3(p.receipt):null,wasteQty:p?r3(p.waste):null,otherOutQty:p?r3(p.auth):null,unitCost:Number.isFinite(unitCost)?unitCost:null,varianceValueToman:variance===null||!Number.isFinite(unitCost)?null:variance*unitCost,baseDate:p?.basePt?.date||'',baselineIds:A(p?.basePt?.ids),baselineBoundary:p?.basePt?.boundary||'',isOpeningBaseline:false}};
 doc.stocktakes=A(doc.stocktakes);const byId=new Map(doc.stocktakes.map(s=>[s.id,s]));let target=info.same[0]?byId.get(info.same[0].id):null;const created=!target;
 if(created){target={id:`ST-WHOLE-${ctx.reqId}`,date,locationId:'',inventoryScope:'RAYO',baselineBoundary:'END',status:'approved',isOpeningBaseline:false,notes:S(note),lines:[],createdAt:ctx.at,createdBy:ctx.actor,approvedAt:ctx.at,approvedBy:ctx.actor,countedBy:ctx.actor,source:'ui-template'};doc.stocktakes.push(target)}
 const touched=new Map,rev=s=>{if(!touched.has(s.id))touched.set(s.id,{id:uid('STR',A(s.revisionHistory)),kind:'whole-count-merge',at:ctx.at,by:ctx.actor,added:[],replaced:[],removed:[]});return touched.get(s.id)};let replaced=0;
 for(const x of rows){const h=info.counted.get(x.i.id),s=h?byId.get(h.st.id):target;s.lines=A(s.lines);const k=s.lines.findIndex(l=>l.ingredientId===x.i.id),ln=line(x),rv=rev(s);if(k>=0){rv.replaced.push(clone(s.lines[k]));s.lines[k]=ln;replaced++}else{rv.added.push(x.i.id);s.lines.push(ln)}}
 const total=trackedItems(ctx.pricing).length;
 for(const [id,rv] of touched){const s=byId.get(id)||target;s.coverage={counted:s.lines.length,total};if(created&&s===target)continue;s.revisionHistory=A(s.revisionHistory);s.revisionHistory.push(rv);s.updatedAt=ctx.at;s.updatedBy=ctx.actor;if(S(note)&&s===target)s.notes=S(s.notes)?`${S(s.notes)} | ${S(note)}`:S(note)}
 return{id:target.id,created,count:rows.length,replaced}}

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
 const items=trackedItems(pricing).filter(i=>levelOf(doc,i.id)!=='PARKED'&&!have.has(i.id)&&(levelOf(doc,i.id)==='PRECISE'||!ever.has(i.id)));
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
const levelOf=(doc,id)=>{const v=doc?.settings?.itemControlLevels?.[id];return LEVELS.includes(v)?v:'LIGHT'};
function saveControlLevels(doc,ctx,{levels,gap}){doc.settings=doc.settings||{};const next={...(doc.settings.itemControlLevels||{})},changes=[];
 for(const [id,v0] of Object.entries(levels||{})){const v=LEVELS.includes(v0)?v0:'LIGHT',old=levelOf(doc,id);if(v!==old){changes.push({ingredientId:id,before:old,after:v});next[id]=v}}
 const curGap=Number(doc.settings.lightMaxGapDays)||90,g=gap===undefined||S(gap)===''?curGap:N(gap);if(!Number.isInteger(g)||g<7||g>730)throw Error('حداکثر فاصلهٔ شمارش باید عدد صحیح بین ۷ تا ۷۳۰ روز باشد');
 if(!changes.length&&g===curGap)throw Error('تغییری انتخاب نشده است');doc.settings.itemControlLevels=next;doc.settings.lightMaxGapDays=g;ctx.auditExtra={changes,lightMaxGapDays:g};return{changes:changes.length,gap:g}}
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
  const ctx={actor,at:now(),reqId:requestId(),pricing:io.pricing(),module:io.module||'inventory'};
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

window.InvWrite={LEVELS,levelOf,saveControlLevels,saveFryerSettings,saveReorderPoints,EVENT_LABELS,AUTH_TYPES,SHIFTS,state,canonical,content,uid,unitsOf,unitName,stockItem,trackedItems,mainLocation,closedPeriod,oilSettings,countInfo,receiptWarnings,receiptLines,
 addReceipts,voidReceipt,editReceipt,addEvent,voidEvent,editEvent,voidCountDate,addOilChange,addCount,findEvent,edit,affectedFrom,recalcCounts,zeroFillPlan,zeroFill,lastZeroFill,zeroFillRollbackPlan,zeroFillRollback,saveBeverageItems,paymentOptions,savePaymentOptions};
})();
