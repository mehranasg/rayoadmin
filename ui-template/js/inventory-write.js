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
function audit(doc,action,details,ctx){doc.changeLog=A(doc.changeLog);const row={id:`${ctx.module==='pricing'?'PLOG':'ICT'}-${ctx.reqId}`,action,at:ctx.at,actor:ctx.actor,via:'ui-template',...details};
 // pricing.changeLog is newest-first and the current panel keeps its first 500 rows, so pricing rows go to the front
 if(ctx.module==='pricing')doc.changeLog.unshift(row);else doc.changeLog.push(row);return row}
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
   count is refused here: it changes later variances, so it stays in the current panel which recalculates them. */
function countInfo(doc,date){date=D(date);const later=A(doc.stocktakes).filter(s=>wholeScope(s)&&s.status==='approved'&&rank(s)>`${date}|1`),same=A(doc.stocktakes).filter(s=>wholeScope(s)&&s.status==='approved'&&rank(s)===`${date}|1`);return{later,same,counted:new Map(same.flatMap(s=>A(s.lines).map(l=>[l.ingredientId,{st:s,line:l}])))}}
function addCount(doc,ctx,{date,entries,note}){date=D(date);checkDate(doc,date,'تاریخ شمارش');const ing=ingredients(ctx.pricing),info=countInfo(doc,date);
 if(info.later.length)throw Error(`بعد از ${date} شمارش کل ثبت شده است (${[...new Set(info.later.map(s=>s.date))].sort().pop()}). شمارش با تاریخ قبلی را از پنل فعلی ثبت کنید تا مغایرت شمارش‌های بعدی بازمحاسبه شود.`);
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
  const out=mutate(after,ctx);audit(after,action,{...details,...(ctx.auditExtra||{})},ctx);
  after.meta=after.meta&&typeof after.meta==='object'?after.meta:{};after.meta.serverSaveToken=`${String(io.module||'inventory').toUpperCase()}-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;after.meta.updatedAt=now();
  let sent=false;
  try{sent=true;await io.save(after);const doc=await verify(io,after);return{out,doc}}
  catch(e){if(sent){try{const c=await io.load();if(S(c?.meta?.serverSaveToken)===after.meta.serverSaveToken&&content(c)===content(after))return{out,doc:c}}catch(_){}state.uncertain=true}throw e}
 }finally{state.busy=false}}

window.InvWrite={EVENT_LABELS,AUTH_TYPES,SHIFTS,state,canonical,content,uid,unitsOf,unitName,stockItem,trackedItems,mainLocation,closedPeriod,oilSettings,countInfo,receiptWarnings,receiptLines,
 addReceipts,voidReceipt,addEvent,voidEvent,addOilChange,addCount,findEvent,edit};
})();
