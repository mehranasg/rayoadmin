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
window.AssetsWrite={EVENT_TYPES,currentQty,addCounts,addEvent,voidRecord,addMaintenance,addIncident,validAssets};
})();
