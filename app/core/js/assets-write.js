/* =========================================================
   Rayo UI Template — assets-write.js
   Asset records from the new panel onto the live assets module (stage 15), with the shapes and rules of js/12:
     count       → counts {id CNT-NNNN, assetId, date, systemQuantity, countedQuantity, variance, reason, notes, createdAt}
                   and, for a difference, a quantity transaction «اصلاح موجودی» with sourceCountId (amSaveCount /
                   amSaveBulkCount); refused when the asset has a later event
     event       → quantityTransactions {id QTY-NNNN, type افزایش موجودی | شکستگی | مفقودی | خروج از رده, quantity,
                   effect ±} (amSaveTransaction); stock never goes below zero
     maintenance → maintenanceRecords {id MNT-NNNN, assetId, date, type, status, serviceProvider, cost, invoiceNo,
                   nextServiceDate, description, notes} for numbered assets (amEditMaintenance)
     incident    → assetIncidents {id AINC-NNNNNN, …, status «جدید»} (js/32 wasteSaveAsset); the manager reviews it
   Void, never delete: a transaction or count is voided with a reason (status 'void').
   ========================================================= */
(function(){
'use strict';
const A=x=>Array.isArray(x)?x:[];
const S=x=>String(x??'').trim();
const NUM=v=>{if(typeof v==='number')return v;const s=S(v).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/٫/g,'.').replace(/[٬,،\s]/g,'');if(!s)return NaN;const n=Number(s);return Number.isFinite(n)?n:NaN};
const D=v=>window.InvEngine.D(v);
const clone=x=>JSON.parse(JSON.stringify(x));
const uid=(prefix,rows,digits=4)=>{let max=0;A(rows).forEach(x=>{const m=S(x.id).match(/(\d+)$/);if(m)max=Math.max(max,+m[1])});return `${prefix}-${String(max+1).padStart(digits,'0')}`};
const live=x=>x&&x.status!=='void'&&x.isArchived!==true;
const assertDate=(d,l='تاریخ')=>{if(!d||window.InvEngine.CAL.i(d)===null)throw Error(`${l} معتبر نیست (مثال ۱۴۰۵/۰۸/۱۷)`);if(d>window.InvEngine.CAL.today)throw Error(`${l} نمی‌تواند بعد از امروز باشد`)};
const EVENT_TYPES=['افزایش موجودی','شکستگی','مفقودی','خروج از رده'];
const asset=(doc,id)=>A(doc.assets).find(a=>a.id===id);
function currentQty(doc,a){if(!a||a.trackingMode!=='quantity')return 0;return NUM(a.initialQuantity||0)+A(doc.quantityTransactions).filter(x=>live(x)&&x.assetId===a.id).reduce((s,x)=>s+(NUM(x.effect)||0),0)}
const laterEvent=(doc,id,date)=>A(doc.quantityTransactions).find(x=>live(x)&&x.assetId===id&&S(x.date)>date);
const effectFor=(type,q)=>type==='افزایش موجودی'?Math.abs(q):-Math.abs(q);

function addCounts(doc,ctx,{date,person,rows}){date=D(date);assertDate(date,'تاریخ شمارش');doc.counts=A(doc.counts);doc.quantityTransactions=A(doc.quantityTransactions);const out=[],batch=A(rows).length>1?`CNTB-${ctx.reqId}`:'';
 for(const r of A(rows)){const a=asset(doc,S(r.assetId));if(!a)throw Error('دارایی پیدا نشد');if(a.trackingMode!=='quantity')throw Error(`«${a.name}» شماره‌دار است؛ شمارش تعدادی ندارد`);const counted=NUM(r.counted);if(!(counted>=0))throw Error(`عدد شمارش «${a.name}» معتبر نیست`);if(laterEvent(doc,a.id,date))throw Error(`برای «${a.name}» رویداد با تاریخ بعد از ${date} ثبت شده است`);
  const system=currentQty(doc,a),variance=counted-system,count={id:uid('CNT',doc.counts),assetId:a.id,date,systemQuantity:system,countedQuantity:counted,variance,reason:S(r.reason),notes:S(person)?`شمارنده: ${S(person)}`:'',...(batch?{countBatchId:batch}:{}),createdAt:ctx.at,status:'posted'};doc.counts.push(count);
  if(variance!==0)doc.quantityTransactions.push({id:uid('QTY',doc.quantityTransactions),assetId:a.id,date,type:'اصلاح موجودی',quantity:Math.abs(variance),effect:variance,responsiblePerson:S(person)||'شمارش اموال',description:`اصلاح براساس شمارش ${counted}؛ موجودی سیستم ${system}`,cost:0,notes:S(r.reason),sourceCountId:count.id,createdAt:ctx.at,updatedAt:ctx.at});out.push(count)}
 if(!out.length)throw Error('حداقل یک عدد شمارش وارد کنید');ctx.auditExtra={counts:out.length,differences:out.filter(c=>c.variance).length};return out}
function addEvent(doc,ctx,{assetId,date,type,quantity,person,description,cost}){const a=asset(doc,S(assetId));if(!a)throw Error('دارایی را انتخاب کنید');if(a.trackingMode!=='quantity')throw Error('رویداد تعدادی فقط برای دارایی تعدادی است؛ برای دارایی شماره‌دار «خرابی» یا «تعمیر» ثبت کنید');date=D(date);assertDate(date);
 if(!EVENT_TYPES.includes(type))throw Error('نوع رویداد را انتخاب کنید');const q=NUM(quantity);if(!(q>0))throw Error('تعداد باید بیشتر از صفر باشد');const effect=effectFor(type,q);if(currentQty(doc,a)+effect<0)throw Error('موجودی نهایی دارایی نمی‌تواند منفی شود');
 doc.quantityTransactions=A(doc.quantityTransactions);const row={id:uid('QTY',doc.quantityTransactions),assetId:a.id,date,type,quantity:q,effect,responsiblePerson:S(person),cost:NUM(cost)>0?NUM(cost):0,description:S(description),notes:'',sourceCountId:'',createdAt:ctx.at,updatedAt:ctx.at,createdBy:ctx.actor};doc.quantityTransactions.push(row);ctx.auditExtra={entityId:row.id,assetId:a.id,type,effect};return row}
function voidRecord(doc,ctx,{kind,id,reason}){reason=S(reason);if(!reason)throw Error('علت ابطال لازم است');const coll=kind==='count'?'counts':'quantityTransactions',x=A(doc[coll]).find(r=>r.id===id);if(!x)throw Error('ثبت پیدا نشد');if(x.status==='void')throw Error('این ثبت قبلاً باطل شده است');if(kind!=='count'&&x.sourceCountId)throw Error('اصلاح حاصل از شمارش را با ابطال همان شمارش باطل کنید');
 if(kind!=='count'&&currentQty(doc,asset(doc,x.assetId))-(NUM(x.effect)||0)<0)throw Error('با ابطال این رویداد موجودی منفی می‌شود');ctx.auditExtra={entityId:id,before:clone(x),reason};
 Object.assign(x,{status:'void',voidReason:reason,voidedAt:ctx.at,voidedBy:ctx.actor});if(kind==='count')for(const t of A(doc.quantityTransactions).filter(t=>t.sourceCountId===id&&t.status!=='void'))Object.assign(t,{status:'void',voidReason:reason,voidedAt:ctx.at,voidedBy:ctx.actor});return x}
function addMaintenance(doc,ctx,x){const a=asset(doc,S(x.assetId));if(!a)throw Error('دارایی را انتخاب کنید');if(a.trackingMode!=='numbered')throw Error('تعمیر و سرویس برای دارایی شماره‌دار ثبت می‌شود');const date=D(x.date);assertDate(date);const types=A(doc.lists?.maintenanceTypes);if(!S(x.type)||(types.length&&!types.includes(x.type)))throw Error('نوع سرویس را انتخاب کنید');
 const next=S(x.nextServiceDate)?D(x.nextServiceDate):'';if(S(x.nextServiceDate)&&!next)throw Error('تاریخ سرویس بعدی معتبر نیست');const cost=S(x.cost)?NUM(x.cost):0;if(!(cost>=0))throw Error('هزینه نامعتبر است');
 doc.maintenanceRecords=A(doc.maintenanceRecords);const row={id:uid('MNT',doc.maintenanceRecords),assetId:a.id,date,type:x.type,status:['انجام‌شده','در حال انجام','لغوشده'].includes(x.status)?x.status:'انجام‌شده',serviceProvider:S(x.serviceProvider),cost,invoiceNo:S(x.invoiceNo),nextServiceDate:next,description:S(x.description),notes:S(x.notes),createdAt:ctx.at,updatedAt:ctx.at,createdBy:ctx.actor};
 doc.maintenanceRecords.push(row);if(next){a.nextServiceDate=next;a.updatedAt=ctx.at}ctx.auditExtra={entityId:row.id,assetId:a.id};return row}
function addIncident(doc,ctx,x){const a=asset(doc,S(x.assetId));if(!a)throw Error('دارایی را انتخاب کنید');const date=D(x.date);assertDate(date);const q=NUM(x.quantity);if(!(q>0))throw Error('تعداد باید مثبت باشد');const types=A(doc.lists?.incidentTypes);const type=types.includes(x.type)?x.type:(a.trackingMode==='quantity'?'شکستگی':'آسیب/خرابی');if(!S(x.description))throw Error('شرح خرابی را بنویسید');
 doc.assetIncidents=A(doc.assetIncidents);let m=0;doc.assetIncidents.forEach(r=>{const k=S(r.id).match(/(\d+)$/);if(k)m=Math.max(m,+k[1])});const row={id:`AINC-${String(m+1).padStart(6,'0')}`,assetId:a.id,assetName:a.name||'',date,type,quantity:q,description:S(x.description),notes:'',reportedByPersonnelId:'',reportedByName:ctx.actor,status:'جدید',managerNote:`ثبت از پنل جدید توسط ${ctx.actor}`,createdAt:ctx.at,updatedAt:ctx.at};
 doc.assetIncidents.push(row);ctx.auditExtra={entityId:row.id,assetId:a.id};return row}
const validAssets=doc=>!!doc&&typeof doc==='object'&&Array.isArray(doc.assets);

/* ---------- asset definition (migration stage 2), js/12 amSaveAsset / amDeleteAsset ----------
   Fixed against the current panel: saving keeps the archive state (archive and restore are separate actions); model,
   serial number, supplier and warranty are editable; a change of the valuation price is kept in the audit row. */
const history=(doc,id)=>A(doc.maintenanceRecords).filter(x=>x.assetId===id).length+A(doc.quantityTransactions).filter(x=>x.assetId===id).length+A(doc.counts).filter(x=>x.assetId===id).length+A(doc.assetIncidents).filter(x=>x.assetId===id).length;
const lower=v=>S(v).toLowerCase();
function saveAsset(doc,ctx,x){
 const rows=A(doc.assets),old=x.id?asset(doc,x.id):null;if(x.id&&!old)throw Error('دارایی پیدا نشد');
 const mode=x.trackingMode==='quantity'?'quantity':'numbered',name=S(x.name),tag=S(x.assetTag),itemId=S(x.itemId),vq=Math.max(0,NUM(x.valuationQuantity)||0);
 if(!name)throw Error('نام دارایی الزامی است');
 if(mode==='numbered'&&!tag&&!old?.aggregateRecord&&vq<=1)throw Error('شماره اموال برای دارایی شماره‌دار تکی الزامی است؛ برای چند دستگاه بدون پلاک، تعداد را بیشتر از یک بزنید');
 if(mode==='numbered'&&tag&&rows.some(a=>a.id!==x.id&&a.trackingMode==='numbered'&&lower(a.assetTag)===lower(tag)))throw Error('این شماره اموال قبلاً ثبت شده است');
 if(itemId&&rows.some(a=>a.id!==x.id&&lower(a.itemId)===lower(itemId)))throw Error('این کد مرجع (ItemID) قبلاً ثبت شده است');
 const used=old?history(doc,old.id):0;
 if(old&&old.trackingMode!==mode&&used)throw Error('به‌دلیل وجود سابقه، نوع این دارایی قابل تغییر نیست');
 const initial=mode==='quantity'?NUM(x.initialQuantity):Math.max(1,vq||NUM(old?.initialQuantity)||1);
 if(mode==='quantity'&&!(initial>=0))throw Error('تعداد اولیه معتبر نیست');
 if(old&&mode==='quantity'&&(A(doc.quantityTransactions).some(t=>t.assetId===old.id)||A(doc.counts).some(c=>c.assetId===old.id))&&initial!==NUM(old.initialQuantity))throw Error('بعد از ثبت رویداد یا شمارش، تعداد اولیه تغییر نمی‌کند؛ افزایش یا کاهش را به‌صورت رویداد ثبت کنید');
 const price=S(x.basePrice)===''?0:NUM(x.basePrice);if(!(price>=0))throw Error('قیمت واحد مبنا معتبر نیست');
 const dep=S(x.annualDepreciationRate)===''?null:NUM(x.annualDepreciationRate);if(dep!==null&&!(dep>=0&&dep<=1))throw Error('نرخ استهلاک اختصاصی باید بین ۰ و ۱ باشد (مثلاً ۰٫۱۵)');
 for(const [k,l] of [['purchaseDate','تاریخ خرید'],['nextServiceDate','تاریخ سرویس بعدی'],['warrantyUntil','تاریخ پایان گارانتی']])if(S(x[k])&&!D(x[k]))throw Error(`${l} معتبر نیست`);
 const lists=doc.lists||{},status=mode==='numbered'?(A(lists.numberedStatuses).includes(x.status)?x.status:'فعال'):(A(lists.quantityStatuses).includes(x.status)?x.status:'فعال');
 const item={id:old?.id||uid('AST',rows),trackingMode:mode,assetTag:mode==='numbered'?tag:'',name,itemId,category:S(x.category)||'سایر',location:S(x.location)||'سایر',brand:S(x.brand),model:S(x.model),serialNumber:S(x.serialNumber),
  purchaseDate:D(x.purchaseDate)||'',purchaseCost:old?.purchaseCost??price,baseUnitPriceToman:old?.baseUnitPriceToman||price,originalBaseUnitPriceToman:old?.originalBaseUnitPriceToman||old?.baseUnitPriceToman||price,valuationBaseUnitPriceToman:price,
  pricingGroup:S(x.pricingGroup)||'عمومی',annualDepreciationRate:dep,sourceAnnualDepreciationRate:old?.sourceAnnualDepreciationRate??null,valuationQuantity:vq||(mode==='quantity'?initial:1),sourceCurrentQuantity:mode==='quantity'?initial:(vq||1),
  registeredTagCount:Math.max(0,NUM(x.registeredTagCount)||0),supplier:S(x.supplier),warrantyUntil:D(x.warrantyUntil)||'',nextServiceDate:mode==='numbered'?(D(x.nextServiceDate)||''):'',unit:mode==='quantity'?(S(x.unit)||'عدد'):'عدد',
  initialQuantity:initial,minimumRequired:mode==='quantity'?Math.max(0,NUM(x.minimumRequired)||0):0,status,periodicCount:mode==='quantity'?x.periodicCount!==false:old?.periodicCount,notes:S(x.notes),aggregateRecord:mode==='numbered'&&!tag&&vq>1,
  createdAt:old?.createdAt||ctx.at,updatedAt:ctx.at,isArchived:old?.isArchived===true};
 const before=old?clone(old):null;if(old)Object.assign(old,item);else doc.assets=[...rows,item];
 ctx.auditExtra={entityId:item.id,before,...(before&&NUM(before.valuationBaseUnitPriceToman)!==price?{valuationPrice:{before:NUM(before.valuationBaseUnitPriceToman)||0,after:price}}:{})};
 return{id:item.id,created:!before}}
function archiveAsset(doc,ctx,{id,archived}){const a=asset(doc,id);if(!a)throw Error('دارایی پیدا نشد');if(!!a.isArchived===!!archived)throw Error(archived?'این دارایی قبلاً آرشیو شده است':'این دارایی آرشیو نیست');ctx.auditExtra={entityId:id};
 Object.assign(a,archived?{isArchived:true,archivedAt:ctx.at,archivedBy:ctx.actor}:{isArchived:false,restoredAt:ctx.at,restoredBy:ctx.actor},{updatedAt:ctx.at});return archived}
function deleteAsset(doc,ctx,{id}){const a=asset(doc,id);if(!a)throw Error('دارایی پیدا نشد');if(history(doc,id))throw Error('این دارایی سابقه دارد و حذف نمی‌شود؛ آرشیوش کنید');ctx.auditExtra={entityId:id,before:clone(a)};doc.assets=A(doc.assets).filter(x=>x.id!==id);return true}

window.AssetsWrite={history,saveAsset,archiveAsset,deleteAsset,EVENT_TYPES,currentQty,addCounts,addEvent,voidRecord,addMaintenance,addIncident,validAssets};
})();
