/* Rayo new panel — daily cash report (cashreport module), same record shapes as the current panel
   (js/11-rayo-cash-report-module.js, js/40 review, config.js RayoCashVariance / RayoCashDestinations / RayoCashTypes).
   - Amounts of cash reports are stored in rial (settings.inputCurrency); the custody entries of the finance module in toman.
   - Reports, cashiers, people and accounts are saved one record at a time (RayoData/Mutate with requestId and
     expectedVersion), like the current panel, so a cashier sending a report at the same time is never overwritten.
   - Changes against the current panel (owner decisions, stage 1 of the migration):
     · the effect of an «other» row on the variance always follows its type (no manual sign);
     · a «received old receivable» row can name the receivable it settles (settlesReportId / settlesAdjustmentId);
       the receivable is closed automatically when it is fully received (settledByReportId), and reopened when that
       report is edited or archived. Partial receipts leave the rest open.
   Pure functions take and return plain objects; CashApi (browser only) talks to the server. */
(function(){
'use strict';
const A=x=>Array.isArray(x)?x:[],S=x=>String(x??'').trim(),O=x=>x&&typeof x==='object'&&!Array.isArray(x)?x:{};
const clone=x=>JSON.parse(JSON.stringify(x));
const DG=v=>String(v??'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d));

/* ---------- amounts and dates (config.js cashAmount, js/11 crLedgerDate) ---------- */
function parse(value,{blankAsZero=true}={}){
 if(typeof value==='number')return Number.isFinite(value)?{ok:true,value}:{ok:false,value:null,error:'مقدار عددی معتبر نیست'};
 const raw=String(value??'').trim();if(!raw)return blankAsZero?{ok:true,value:0,blank:true}:{ok:false,value:null,error:'مقدار خالی است'};
 const n=DG(raw).replace(/٫/g,'.').replace(/[٬,،\s]/g,'');
 if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(n))return{ok:false,value:null,error:`مقدار «${raw}» عدد معتبر نیست`};
 const x=Number(n);return Number.isFinite(x)?{ok:true,value:x}:{ok:false,value:null,error:`مقدار «${raw}» خارج از محدوده است`};
}
const N=v=>{const p=parse(v);return p.ok?p.value:0};
const pad=n=>String(n).padStart(2,'0');
function date(value){const m=DG(S(value)).replace(/-/g,'/').match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);if(!m)return '';const y=+m[1],mo=+m[2],d=+m[3],max=mo<=6?31:30;return mo>=1&&mo<=12&&d>=1&&d<=max?`${y}/${pad(mo)}/${pad(d)}`:''}
const active=row=>!!row&&!row.isArchived&&!row.isDeleted&&!row.archived&&!['void','archived','deleted','لغوشده'].includes(row.status);

/* ---------- other receipts/payments types (config.js RayoCashTypes) ---------- */
const TYPES=[
 {value:'previousDepositUsed',label:'مصرف بیعانه قبلی برای فروش امروز',sign:1,follow:false},
 {value:'futureDepositReceived',label:'بیعانه دریافت‌شده برای روز آینده',sign:-1,follow:false},
 {value:'customerReceivable',label:'طلب از مشتری / پرداخت‌نشده',sign:1,follow:true},
 {value:'oldReceivableReceived',label:'دریافت طلب مربوط به روزهای قبل',sign:-1,follow:false},
 {value:'refundOrCorrection',label:'برگشت وجه یا اصلاح پرداخت',sign:1,follow:false},
 {value:'otherIncrease',label:'سایر موارد افزاینده مغایرت',sign:1,follow:false},
 {value:'otherDecrease',label:'سایر موارد کاهنده مغایرت',sign:-1,follow:false}];
const SETTLE_TYPE='oldReceivableReceived';
function types(settings={},includeInactive=false){
 const ov=O(settings?.otherTransactionTypeOverrides),custom=A(settings?.otherTransactionTypesCustom);
 const base=TYPES.map(t=>{const o=O(ov[t.value]);return{value:t.value,label:S(o.label)||t.label,sign:o.sign===-1||o.sign===1?o.sign:t.sign,follow:typeof o.follow==='boolean'?o.follow:t.follow,status:o.status==='غیرفعال'?'غیرفعال':'فعال',builtin:true}});
 const all=[...base,...custom.map(t=>({value:t.value,label:S(t.label),sign:Number(t.sign)===-1?-1:1,follow:t.follow===true,status:t.status==='غیرفعال'?'غیرفعال':'فعال',builtin:false}))];
 return includeInactive?all:all.filter(t=>t.status!=='غیرفعال');
}

/* ---------- calculation (config.js cashVariance + cashSales, js/11 crCalc) ---------- */
function variance(r={}){
 const fields=['netReceivable','tipDelivery','tipValet','tipHall','cardToCard','cash',...Array.from({length:6},(_,i)=>`pos${i+1}`)],v={},errors=[];
 for(const f of fields){const p=parse(r[f]);if(p.ok)v[f]=p.value;else errors.push({field:f,message:p.error})}
 const adj=[];for(const [i,row] of A(r.otherTransactions).entries()){const p=parse(row?.amount);if(!p.ok)errors.push({field:`otherTransactions[${i}].amount`,message:p.error});else adj.push((Number(row?.sign)===-1?-1:1)*p.value)}
 if(errors.length)return{valid:false,errors};
 const posTotal=Array.from({length:6},(_,i)=>v[`pos${i+1}`]).reduce((a,b)=>a+b,0),actualReceived=posTotal+v.cardToCard+v.cash,tipsTotal=v.tipDelivery+v.tipValet+v.tipHall;
 const tipsInThisCashbox=r.tipsOutsideCashbox===true?0:tipsTotal,expectedCashbox=v.netReceivable+(r.netReceivableIncludesTips===true?0:tipsInThisCashbox),initialVariance=actualReceived-expectedCashbox,adjustmentsTotal=adj.reduce((a,b)=>a+b,0),finalVariance=initialVariance+adjustmentsTotal;
 const stored=Number(r.finalVariance),hasStored=Number.isFinite(stored)&&r.finalVariance!==''&&r.finalVariance!=null;
 return{valid:true,formulaVersion:'cash-variance-v2',currency:'ریال',posTotal,cardToCard:v.cardToCard,cash:v.cash,actualReceived,netReceivable:v.netReceivable,tipsTotal,tipsInThisCashbox,expectedCashbox,initialVariance,adjustmentsTotal,finalVariance,status:initialVariance>0?'اضافه صندوق':initialVariance<0?'کسری صندوق':'تراز',finalStatus:finalVariance>0?'اضافه صندوق':finalVariance<0?'کسری صندوق':'تراز',storedVariance:hasStored?stored:null,historicalDifference:hasStored&&stored!==finalVariance?finalVariance-stored:0};
}
// Sepidz «خالص دریافتی» includes VAT: sales without VAT = net − tax + debtor − delivery fee; total = that + Snapp
function sales(r={}){
 const net=N(r.netReceivable),taxAmount=N(r.taxAmount),debtorAmount=N(r.debtorAmount),fee=N(r.deliveryFeeAmount),hall=N(r.hallAmount),subscriber=N(r.subscriberAmount),snapp=N(r.snappAmount);
 const salesNet=net-taxAmount+debtorAmount-fee,statAmountTotal=hall+subscriber;
 return{salesFormulaVersion:'sepidz-net-v2',taxAmount,debtorAmount,salesNet,totalSales:salesNet+snapp,statAmountTotal,statAmountDiff:salesNet-statAmountTotal};
}
function calc(r={}){
 const v=variance(r);if(!v.valid)return{valid:false,errors:v.errors};
 const s=sales(r),totalReceiptCount=N(r.receiptCount)+N(r.snappReceiptCount),statReceiptTotal=N(r.hallReceiptCount)+N(r.subscriberReceiptCount),statReceiptDiff=N(r.receiptCount)-statReceiptTotal,entered=r.salesBreakdownEntered===true;
 return{...v,...s,totalReceiptCount,statReceiptTotal,statReceiptDiff,salesBreakdownEntered:entered,
  statAmountWarning:entered&&Math.abs(s.statAmountDiff)>0,statReceiptWarning:entered&&Math.abs(statReceiptDiff)>0,
  averageReceipt:N(r.receiptCount)?s.salesNet/N(r.receiptCount):0,averageSnappReceipt:N(r.snappReceiptCount)?N(r.snappAmount)/N(r.snappReceiptCount):0,overallAverage:totalReceiptCount?s.totalSales/totalReceiptCount:0};
}

/* ---------- card-to-card / cash lines (config.js RayoCashDestinations) ---------- */
function itemsOf(report,kind){
 const r=report||{},key=kind==='card'?'cardToCardItems':'cashItems';if(Array.isArray(r[key]))return r[key];
 const raw=kind==='card'?r.cardToCard:r.cash,p=parse(raw);if(p.ok&&p.value===0)return[];
 return kind==='card'?[{id:'legacy',amount:raw,accountId:r.cardToCardAccountId||'',accountNameSnapshot:r.cardToCardAccountNameSnapshot||'',ownerIdSnapshot:r.cardToCardOwnerIdSnapshot,ownerNameSnapshot:r.cardToCardOwnerNameSnapshot||''}]:[{id:'legacy',amount:raw,recipientId:r.cashRecipientId||'',recipientNameSnapshot:r.cashRecipientNameSnapshot||''}];
}
function applyItems(previous,refs,rows){
 const accounts=A(refs?.transferAccounts),people=A(refs?.cashRecipients),pc=new Map(itemsOf(previous,'card').map(x=>[x.id,x])),ph=new Map(itemsOf(previous,'cash').map(x=>[x.id,x]));
 const card=A(rows?.card).map(r=>{const p=pc.get(r.id),same=!!p&&(p.accountId||'')===(r.destId||''),acc=accounts.find(x=>x.id===r.destId),ownerId=same?(p.ownerIdSnapshot??acc?.ownerRecipientId??''):(acc?.ownerRecipientId||'');return{id:r.id,amount:r.amount,accountId:r.destId||'',accountNameSnapshot:same?(p.accountNameSnapshot??acc?.name??''):(acc?.name||''),ownerIdSnapshot:ownerId,ownerNameSnapshot:same?(p.ownerNameSnapshot??people.find(x=>x.id===ownerId)?.name??''):(people.find(x=>x.id===ownerId)?.name||'')}});
 const cash=A(rows?.cash).map(r=>{const p=ph.get(r.id),same=!!p&&(p.recipientId||'')===(r.destId||''),rec=people.find(x=>x.id===r.destId);return{id:r.id,amount:r.amount,recipientId:r.destId||'',recipientNameSnapshot:same?(p.recipientNameSnapshot??rec?.name??''):(rec?.name||'')}});
 const uni=(list,key)=>list.length&&list.every(x=>x[key]===list[0][key])?list[0]:null,c=uni(card,'accountId'),h=uni(cash,'recipientId');
 return{cardToCardItems:card,cashItems:cash,cardToCard:card.reduce((a,x)=>a+x.amount,0),cash:cash.reduce((a,x)=>a+x.amount,0),
  cardToCardAccountId:c?.accountId||'',cardToCardAccountNameSnapshot:c?.accountNameSnapshot||'',cardToCardOwnerIdSnapshot:c?.ownerIdSnapshot||'',cardToCardOwnerNameSnapshot:c?.ownerNameSnapshot||'',
  cashRecipientId:h?.recipientId||'',cashRecipientNameSnapshot:h?.recipientNameSnapshot||''};
}

/* ---------- reports and receivables ---------- */
const reports=doc=>A(doc?.reports).filter(active);
const isFollow=a=>a&&(a.followUpRequired===true||a.followUpRequired==='بله');
// every receivable of the active reports, with what later reports received against it
function followups(doc,{exceptReportId=''}={}){
 const rs=reports(doc).filter(r=>r.id!==exceptReportId),paid=new Map;
 for(const r of rs)for(const a of A(r.otherTransactions))if(a.settlesReportId&&a.settlesAdjustmentId){const k=a.settlesReportId+'|'+a.settlesAdjustmentId,l=paid.get(k)||[];l.push({reportId:r.id,date:r.date,adjustmentId:a.id,amount:N(a.amount)});paid.set(k,l)}
 const out=[];for(const r of rs)for(const a of A(r.otherTransactions)){if(!isFollow(a))continue;const links=paid.get(r.id+'|'+a.id)||[],got=links.reduce((s,x)=>s+x.amount,0),remaining=Math.max(0,N(a.amount)-got),settled=a.status==='تسویه‌شده';
  out.push({report:r,adj:a,links,paid:got,remaining:settled?0:remaining,open:!settled&&remaining>0,manual:settled&&!a.settledByReportId})}
 return out.sort((x,y)=>S(x.adj.dueDate||x.report.date).localeCompare(S(y.adj.dueDate||y.report.date)));
}
// status the stored receivables must take after a save/archive: closed when fully received through linked rows,
// reopened when an automatic close lost its links. Returns the updated report records to save.
function followupPatches(doc){
 const byReport=new Map;
 for(const f of followups(doc)){const a=f.adj,full=f.links.length&&f.paid>=N(a.amount)-1e-9;let patch=null;
  if(a.status!=='تسویه‌شده'&&full){const last=f.links.slice().sort((x,y)=>S(x.date).localeCompare(S(y.date))).at(-1);patch={status:'تسویه‌شده',settledAt:last.date,settlementNote:`وصول در گزارش صندوق ${last.date}`,settledByReportId:last.reportId}}
  else if(a.status==='تسویه‌شده'&&a.settledByReportId&&!full)patch={status:'باز',settledAt:'',settlementNote:'',settledByReportId:''};
  if(!patch)continue;const rec=byReport.get(f.report.id)||clone(f.report);const t=A(rec.otherTransactions).find(x=>x.id===a.id);Object.assign(t,patch);byReport.set(rec.id,rec)}
 return [...byReport.values()];
}
const AMOUNT_FIELDS=['netReceivable','tipDelivery','tipValet','tipHall','receiptCount','hallAmount','subscriberAmount','hallReceiptCount','subscriberReceiptCount','snappAmount','snappReceiptCount','deliveryFeeAmount','taxAmount','debtorAmount','pos1','pos2','pos3','pos4','pos5','pos6'];
const COUNT_FIELDS=new Set(['receiptCount','hallReceiptCount','subscriberReceiptCount','snappReceiptCount']);
const LABEL={netReceivable:'خالص دریافتی',tipDelivery:'انعام پیک',tipValet:'انعام پارکبان',tipHall:'انعام سالن',receiptCount:'تعداد کل فیش',hallAmount:'فروش سالن',subscriberAmount:'فروش مشترکین',hallReceiptCount:'فیش سالن',subscriberReceiptCount:'فیش مشترکین',snappAmount:'مبلغ اسنپ',snappReceiptCount:'فیش اسنپ',deliveryFeeAmount:'کرایه‌ها',taxAmount:'ارزش افزوده (مالیات سپیدز)',debtorAmount:'بدهکار سپیدز',pos1:'کارتخوان ۱',pos2:'کارتخوان ۲',pos3:'کارتخوان ۳',pos4:'کارتخوان ۴',pos5:'کارتخوان ۵',pos6:'کارتخوان ۶'};
/* input: amounts in rial; {date,cashierId,…AMOUNT_FIELDS,card:[{id,amount,destId}],cash:[…],adjustments:[…],notes}
   ctx: {old, actor, at, today, recordId}. Errors carry .step (1 sale, 2 receipts, 3 tips & other rows) for the form. */
function buildReport(doc,input,ctx){
 const err=(msg,step)=>Object.assign(Error(msg),{step});const old=ctx.old||null,refs={transferAccounts:A(doc?.transferAccounts),cashRecipients:A(doc?.cashRecipients)};
 const d=date(input.date);if(!d)throw err('تاریخ معتبر نیست (مثال ۱۴۰۵/۰۸/۱۷)',1);if(ctx.today&&d>ctx.today)throw err('تاریخ گزارش نمی‌تواند در آینده باشد',1);
 if(reports(doc).some(r=>r.date===d&&r.id!==old?.id))throw err(`برای ${d} قبلاً گزارش صندوق ثبت شده است؛ همان را ویرایش کنید`,1);
 const cashier=A(doc?.cashiers).find(c=>c.id===input.cashierId);
 if(!input.cashierId)throw err('صندوقدار را انتخاب کنید',1);
 if(!(cashier&&cashier.status!=='غیرفعال')&&input.cashierId!==old?.cashierId)throw err('صندوقدار انتخاب‌شده فعال نیست',1);
 const r={date:d,cashierId:input.cashierId,cashierName:cashier?.name||(input.cashierId===old?.cashierId?old.cashierName:'')||''};
 for(const f of AMOUNT_FIELDS){const p=parse(input[f]);if(!p.ok)throw err(`${LABEL[f]}: ${p.error}`,f.startsWith('pos')?2:f.startsWith('tip')?3:1);if(p.value<0)throw err(`${LABEL[f]} نمی‌تواند منفی باشد`,f.startsWith('pos')?2:f.startsWith('tip')?3:1);if(COUNT_FIELDS.has(f)&&!Number.isInteger(p.value))throw err(`${LABEL[f]} باید عدد صحیح باشد`,1);r[f]=p.value}
 r.salesBreakdownEntered=true;
 const lines=kind=>A(input[kind]).map(x=>{const p=parse(x.amount);if(!p.ok||p.value<0)throw err(`${kind==='card'?'کارت به کارت':'نقد'}: ${p.ok?'مبلغ منفی مجاز نیست':p.error}`,2);return{id:S(x.id)||`CI-${ctx.reqId||Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`,amount:p.value,destId:S(x.destId)}}).filter(x=>x.amount>0);
 const card=lines('card'),cash=lines('cash');
 if(card.some(x=>!x.destId))throw err('برای هر ردیف کارت به کارت، کارت/حساب مقصد را انتخاب کنید',2);
 if(cash.some(x=>!x.destId))throw err('برای هر ردیف وجه نقد، تحویل‌گیرنده را انتخاب کنید',2);
 const prevC=new Set(itemsOf(old,'card').map(x=>x.accountId)),prevH=new Set(itemsOf(old,'cash').map(x=>x.recipientId));
 for(const x of card){const a=refs.transferAccounts.find(t=>t.id===x.destId);if(!a||(a.status==='غیرفعال'&&!prevC.has(x.destId)))throw err('کارت/حساب مقصد معتبر یا فعال نیست',2)}
 for(const x of cash){const a=refs.cashRecipients.find(t=>t.id===x.destId);if(!a||(a.status==='غیرفعال'&&!prevH.has(x.destId)))throw err('تحویل‌گیرندهٔ نقد معتبر یا فعال نیست',2)}
 Object.assign(r,applyItems(old,refs,{card,cash}));
 // other rows: the sign follows the type; receivables keep their settled state; settlement links are checked
 const T=types(doc?.settings,true),oldRows=new Map(A(old?.otherTransactions).map(x=>[x.id,x])),others=followups(doc,{exceptReportId:old?.id||''});
 const rows=A(input.adjustments).map((x,i)=>{const t=T.find(t=>t.value===x.type),prev=oldRows.get(x.id);
  if(!t||(t.status==='غیرفعال'&&prev?.type!==x.type))throw err(`ردیف ${i+1} موارد دیگر: نوع معتبر یا فعال نیست`,3);
  const p=parse(x.amount);if(!p.ok||!(p.value>0))throw err(`ردیف ${i+1} (${t.label}): مبلغ مثبت لازم است`,3);
  const follow=x.followUpRequired===true;if(follow&&!S(x.customerName))throw err(`ردیف ${i+1} (${t.label}): نام مشتری برای پیگیری لازم است`,3);
  const row={id:S(x.id)||`ADJ-${Date.now()}-${i+1}`,type:t.value,title:S(x.title),amount:p.value,sign:t.sign,customerName:S(x.customerName),phone:S(x.phone),dueDate:S(x.dueDate)?date(x.dueDate):'',followUpRequired:follow,status:'باز',notes:S(x.notes)};
  if(S(x.dueDate)&&!row.dueDate)throw err(`ردیف ${i+1}: موعد پیگیری معتبر نیست`,3);
  if(prev?.status==='تسویه‌شده')Object.assign(row,{status:'تسویه‌شده',settledAt:prev.settledAt||'',settlementNote:prev.settlementNote||'',...(prev.settledByReportId?{settledByReportId:prev.settledByReportId}:{})});
  if(S(x.settlesAdjustmentId)){const f=others.find(f=>f.report.id===x.settlesReportId&&f.adj.id===x.settlesAdjustmentId);
   if(!f)throw err(`ردیف ${i+1}: طلب انتخاب‌شده پیدا نشد`,3);
   const was=prev&&prev.settlesAdjustmentId===x.settlesAdjustmentId&&prev.settlesReportId===x.settlesReportId;
   if(!f.open&&!was)throw err(`ردیف ${i+1}: طلب «${f.adj.customerName||f.adj.title}» قبلاً تسویه شده است`,3);
   Object.assign(row,{settlesReportId:f.report.id,settlesAdjustmentId:f.adj.id,settlesDateSnapshot:f.report.date,settlesCustomerSnapshot:f.adj.customerName||''})}
  return row});
 // the same receivable may be received in several rows; together they cannot exceed what is still open
 const want=new Map;for(const x of rows)if(x.settlesAdjustmentId){const k=x.settlesReportId+'|'+x.settlesAdjustmentId;want.set(k,(want.get(k)||0)+x.amount)}
 for(const [k,amt] of want){const f=others.find(f=>f.report.id+'|'+f.adj.id===k),left=f.manual?0:Math.max(0,N(f.adj.amount)-f.paid);if(amt>left+1e-9)throw err(`وصول طلب «${f.adj.customerName||f.adj.title}» (${amt}) بیشتر از ماندهٔ آن (${left}) است`,3)}
 // a receivable of this report that later reports already received cannot disappear or shrink below what was received
 if(old)for(const f of followups(doc).filter(f=>f.report.id===old.id&&f.paid>0)){const now=rows.find(x=>x.id===f.adj.id);if(!now||!isFollow(now)||now.amount<f.paid-1e-9)throw err(`طلب «${f.adj.customerName||f.adj.title}» در گزارش ${f.links.map(l=>l.date).join('، ')} وصول شده؛ حذف یا کمتر کردن آن مجاز نیست`,3)}
 r.otherTransactions=rows;r.notes=S(input.notes);
 const m=calc(r);if(!m.valid)throw err('مبلغ نامعتبر: '+m.errors.map(e=>e.message).join('، '),1);
 const id=old?.id||ctx.recordId||`CASH-${d.replace(/\D/g,'')}-${ctx.reqId||Date.now()}`;
 return old?{...old,...r,...m,id,updatedAt:ctx.at,updatedBy:ctx.actor}:{...r,...m,id,registeredByType:'admin',registeredByName:ctx.actor,createdAt:ctx.at,updatedAt:ctx.at,managerReview:'بررسی نشده'};
}
// doc with one report replaced (or archived when rec is null) — to work out receivable patches before saving
function withReport(doc,id,rec){const d={...doc,reports:A(doc?.reports).filter(r=>r.id!==id)};if(rec)d.reports.push(rec);return d}
function archiveCheck(doc,id){const f=followups(doc).find(f=>f.report.id===id&&f.paid>0);if(f)throw Error(`طلب «${f.adj.customerName||f.adj.title}» این گزارش در گزارش ${f.links.map(l=>l.date).join('، ')} وصول شده؛ اول آن ردیف‌ها را اصلاح کنید`)}
function settle(doc,reportId,adjId,{date:when,note},ctx){
 const r=reports(doc).find(x=>x.id===reportId),a=A(r?.otherTransactions).find(x=>x.id===adjId);if(!a)throw Error('این طلب در نسخهٔ سرور پیدا نشد');
 if(a.status==='تسویه‌شده')throw Error('این طلب قبلاً تسویه شده است');const d=date(when);if(!d)throw Error('تاریخ تسویه معتبر نیست');if(!S(note))throw Error('روش یا شمارهٔ پیگیری تسویه را بنویسید');
 const rec=clone(r),t=rec.otherTransactions.find(x=>x.id===adjId);Object.assign(t,{status:'تسویه‌شده',settledAt:d,settlementNote:S(note),settledBy:ctx.actor});rec.updatedAt=ctx.at;rec.updatedBy=ctx.actor;return rec}
const REVIEW=['نیازمند بررسی','بررسی‌شده','بدون نیاز به بررسی'];
function reviewStatus(r,limitRial){if(r.managementReviewStatus)return r.managementReviewStatus;if(r.managerReview==='بررسی شده'||r.managerReview==='بررسی‌شده')return'بررسی‌شده';return Math.abs(N(r.finalVariance))>(N(limitRial)||1000000)?'نیازمند بررسی':'بدون نیاز به بررسی'}
function review(r,{status,note},ctx){if(!REVIEW.includes(status))throw Error('وضعیت بررسی معتبر نیست');if(status==='بررسی‌شده'&&!S(note))throw Error('برای گزارش بررسی‌شده توضیح مدیریتی بنویسید');
 return{...clone(r),managementReviewStatus:status,managementNote:S(note),reviewedAt:ctx.at,reviewedBy:ctx.actor,managerReview:status}}

/* ---------- cashiers, people and accounts (js/11 crEditCashier, crEditDestination) ---------- */
function nextId(prefix,rows){let m=0;A(rows).forEach(x=>{const q=S(x.id).match(/(\d+)$/);if(q&&q[1].length<=6)m=Math.max(m,+q[1])});return `${prefix}-${String(m+1).padStart(4,'0')}`}
function saveCashier(doc,input,ctx){const rows=A(doc?.cashiers),old=input.id?rows.find(x=>x.id===input.id):null;if(input.id&&!old)throw Error('صندوقدار پیدا نشد');
 const name=S(input.name);if(!name)throw Error('نام صندوقدار الزامی است');if(rows.some(x=>x.id!==input.id&&S(x.name)===name))throw Error('این صندوقدار قبلاً ثبت شده است');
 return{...(old||{}),id:old?.id||nextId('CASHIER',rows),personnelId:S(input.personnelId),name,status:input.status==='غیرفعال'?'غیرفعال':'فعال',notes:S(input.notes),updatedAt:ctx.at,...(old?{}:{createdAt:ctx.at})}}
function saveRecipient(doc,input,ctx){const rows=A(doc?.cashRecipients),old=input.id?rows.find(x=>x.id===input.id):null;if(input.id&&!old)throw Error('شخص پیدا نشد');
 const name=S(input.name);if(!name)throw Error('نام شخص الزامی است');if(rows.some(x=>x.id!==input.id&&S(x.name)===name))throw Error('این نام قبلاً ثبت شده است');
 return{...(old||{}),name,status:input.status==='غیرفعال'?'غیرفعال':'فعال',notes:S(input.notes),id:old?.id||'CREC-'+ctx.reqId,createdAt:old?.createdAt||ctx.at,updatedAt:ctx.at}}
function saveAccount(doc,input,ctx){const rows=A(doc?.transferAccounts),old=input.id?rows.find(x=>x.id===input.id):null;if(input.id&&!old)throw Error('حساب پیدا نشد');
 const name=S(input.name),status=input.status==='غیرفعال'?'غیرفعال':'فعال';if(!name)throw Error('نام کارت / حساب الزامی است');if(rows.some(x=>x.id!==input.id&&S(x.name)===name))throw Error('این نام قبلاً ثبت شده است');
 const owner=S(input.ownerRecipientId);if(status==='فعال'&&!A(doc?.cashRecipients).some(p=>p.id===owner&&p.status!=='غیرفعال'))throw Error('مالک فعال حساب را انتخاب کنید');
 if(old?.ownerRecipientId&&owner!==old.ownerRecipientId)throw Error('برای حفظ سوابق، مالک حساب ثبت‌شده تغییر نمی‌کند؛ برای مالک دیگر حساب جدید تعریف کنید');
 const card=DG(S(input.cardNumber)).replace(/[\s-]/g,'');if(card&&!/^\d{16}$/.test(card))throw Error('شماره کارت باید ۱۶ رقم باشد');
 return{...(old||{}),name,status,notes:S(input.notes),ownerRecipientId:owner,bankName:S(input.bankName),cardNumber:card,id:old?.id||'CACCT-'+ctx.reqId,createdAt:old?.createdAt||ctx.at,updatedAt:ctx.at}}
/* settings saved with the whole module (fresh Load → change → Save → verify), like js/11 crCommit */
function saveType(doc,input){const label=S(input.label);if(!label)throw Error('عنوان الزامی است');const sign=Number(input.sign)===-1?-1:1,follow=input.follow===true,status=input.status==='غیرفعال'?'غیرفعال':'فعال';
 doc.settings=O(doc.settings);const builtin=TYPES.some(t=>t.value===input.value);
 if(types(doc.settings,true).some(t=>t.value!==input.value&&t.label===label))throw Error('نوعی با همین عنوان هست');
 if(builtin)doc.settings.otherTransactionTypeOverrides={...O(doc.settings.otherTransactionTypeOverrides),[input.value]:{label,sign,follow,status}};
 else{const list=A(doc.settings.otherTransactionTypesCustom);if(input.value&&!list.some(x=>x.value===input.value))throw Error('نوع پیدا نشد');doc.settings.otherTransactionTypesCustom=input.value?list.map(x=>x.value===input.value?{...x,label,sign,follow,status}:x):[...list,{value:'CUSTOM-'+input.newId,label,sign,follow,status}]}
 return label}
function saveLimit(doc,rial){const p=parse(rial);if(!p.ok||!(p.value>0))throw Error('حد مجاز مغایرت باید عدد مثبت باشد');doc.settings=O(doc.settings);const before=doc.settings.discrepancyLimit;doc.settings.discrepancyLimit=p.value;return{before,after:p.value}}
const UNITS={'تومان':'toman','ریال':'rial'};
function saveDisplay(doc,unit){if(!UNITS[unit])throw Error('واحد نمایش باید تومان یا ریال باشد');doc.settings=O(doc.settings);const before=doc.settings.displayCurrency||'تومان';if(before===unit)throw Error('تغییری داده نشده است');doc.settings.displayCurrency=unit;return{before,after:unit}}

/* ---------- money with people (js/11 crCustodyLedger, crSaveCustodyEntry) ---------- */
const CUSTODY_KINDS={expense:'هزینهٔ رستوران',personalWithdrawal:'برداشت شخصی',custodyReturn:'تسویه / بازگرداندن وجه'};
function ledger(cash,entries,filter={}){
 const accounts=A(cash?.transferAccounts),people=A(cash?.cashRecipients),mv=[];let invalid=0;
 const add=(type,id,name,d,credit,debit,rec,kind,personId,personName='')=>{if(credit===0&&debit===0)return;const nd=date(d);if(!nd||credit===null||debit===null){invalid++;return}
  const src=(type==='account'?accounts:people).find(x=>x.id===id),owner=personId??(type==='cash'?id:src?.ownerRecipientId)??'';
  mv.push({key:type+':'+(id||'legacy:'+S(name)),type,sourceId:id||'',name:name||src?.name||'نامشخص',personId:owner,personName:personName||people.find(x=>x.id===owner)?.name||'',date:nd,credit,debit,kind,recordId:rec.id||'',notes:rec.notes||'',title:rec.title||'',cashier:rec.cashierName||'',status:rec.status||''})};
 const amt=v=>{const p=parse(v);return p.ok?p.value:null};
 for(const r of reports(cash)){
  for(const it of itemsOf(r,'card')){const a=amt(it.amount);add('account',it.accountId,it.accountNameSnapshot,r.date,a===null?null:a/10,0,r,'cardToCard',it.ownerIdSnapshot,it.ownerNameSnapshot)}
  for(const it of itemsOf(r,'cash')){const a=amt(it.amount);add('cash',it.recipientId,it.recipientNameSnapshot,r.date,a===null?null:a/10,0,r,'cashDelivery',it.recipientId,it.recipientNameSnapshot)}}
 for(const r of A(entries).filter(active)){if(!r.accountId&&!r.cashRecipientId)continue;if(!['income','expense','personalWithdrawal','custodyReturn','taxReserve','taxPayment'].includes(r.type))continue;
  const type=r.cashRecipientId?'cash':'account',id=r.cashRecipientId||r.accountId,a=amt(r.amountToman);if(a===null||a<0){invalid++;continue}
  add(type,id,r.cashRecipientNameSnapshot||r.accountNameSnapshot,r.date,r.type==='income'?a:0,r.type==='income'?0:a,r,r.type,r.custodyOwnerIdSnapshot,r.custodyOwnerNameSnapshot);
  if(r.type==='taxReserve'&&r.targetAccountId)add('account',r.targetAccountId,r.targetAccountNameSnapshot,r.date,a,0,r,r.type,undefined)}
 const from=filter.from||'',to=filter.to||'',groups=new Map,details=[];
 for(const m of mv){if((filter.personId&&m.personId!==filter.personId)||(filter.sourceKey&&m.key!==filter.sourceKey)||(to&&m.date>to))continue;
  const k=m.key+'|'+m.personId,g=groups.get(k)||{...m,opening:0,received:0,paid:0,closing:0,count:0};
  if(from&&m.date<from)g.opening+=m.credit-m.debit;else{g.received+=m.credit;g.paid+=m.debit;g.count++;details.push(m)}
  g.closing=g.opening+g.received-g.paid;groups.set(k,g)}
 return{groups:[...groups.values()],details:details.sort((a,b)=>a.date.localeCompare(b.date)||a.recordId.localeCompare(b.recordId)),invalid};
}
function custodyEntry(cash,input,ctx){
 const key=S(input.sourceKey),i=key.indexOf(':'),type=key.slice(0,i),id=key.slice(i+1),rows=type==='cash'?A(cash?.cashRecipients):A(cash?.transferAccounts),src=rows.find(x=>x.id===id);
 const d=date(input.date),p=parse(input.amountToman),title=S(input.title);
 if(!['cash','account'].includes(type)||!src||src.status==='غیرفعال'||!active(src))throw Error('منبع وجه فعال را انتخاب کنید');
 if(!d)throw Error('تاریخ معتبر نیست');if(ctx.today&&d>ctx.today)throw Error('تاریخ نمی‌تواند در آینده باشد');
 if(!CUSTODY_KINDS[input.kind])throw Error('نوع ثبت معتبر نیست');if(!p.ok||!(p.value>0)||!Number.isSafeInteger(Math.round(p.value*10)))throw Error('مبلغ مثبت معتبر لازم است');if(!title)throw Error('شرح لازم است');
 const personId=type==='cash'?id:src.ownerRecipientId||'';
 return{id:'CUST-'+ctx.reqId,date:d,type:input.kind,custodyKind:input.kind,accountId:type==='account'?id:'',accountNameSnapshot:type==='account'?src.name:'',cashRecipientId:type==='cash'?id:'',cashRecipientNameSnapshot:type==='cash'?src.name:'',custodyOwnerIdSnapshot:personId,custodyOwnerNameSnapshot:A(cash?.cashRecipients).find(x=>x.id===personId)?.name||'',amountToman:p.value,category:input.kind==='expense'?'سایر':'گردش وجه نزد اشخاص',title,notes:S(input.notes),status:'active',createdAt:ctx.at,updatedAt:ctx.at,updatedBy:ctx.actor,revisions:[]}}
function voidEntry(row,reason,ctx){if(!row?.custodyKind||!active(row))throw Error('ثبت فعال پیدا نشد');if(!S(reason))throw Error('علت ابطال لازم است');return{...clone(row),status:'void',voidReason:S(reason),voidedAt:ctx.at,voidedBy:ctx.actor}}

/* ---------- server (RayoData Load / Query / Mutate), browser only ---------- */
const ci=(o,k)=>{if(!o||typeof o!=='object')return undefined;if(k in o)return o[k];const f=Object.keys(o).find(x=>x.toLowerCase()===k.toLowerCase());return f===undefined?undefined:o[f]};
const parseJ=v=>{if(typeof v!=='string')return v;try{return JSON.parse(v)}catch(_){return v}};
function find(payload,key){const q=[payload],seen=new Set;while(q.length){const v=parseJ(q.shift());if(!v||typeof v!=='object'||seen.has(v))continue;seen.add(v);if(ci(v,key)!==undefined)return v;for(const k of ['data','result','value','payload','response']){const c=ci(v,k);if(c!==undefined)q.push(c)}}return {}}
const verOf=o=>{const v=ci(o,'version');const n=Number(v);return v!=null&&Number.isFinite(n)&&n>=0?n:null};
const API=()=>window.InvEngine.API_ROOT;
async function post(path,body){const r=await fetch(API()+path,{method:'POST',cache:'no-store',credentials:'omit',headers:{'Content-Type':'application/json; charset=utf-8',Accept:'application/json'},body:JSON.stringify(body)});const text=await r.text(),j=text.trim()?parseJ(text):null;
 if(!r.ok){const msg=S(ci(j,'message')||ci(j,'title')||(typeof j==='string'?j.slice(0,200):''))||`HTTP ${r.status}`;throw Object.assign(Error(r.status===409?'داده هم‌زمان روی سرور تغییر کرده است؛ فرم شما حفظ شد. دوباره «ثبت» را بزنید تا با نسخهٔ تازه بررسی و ثبت شود.':msg),{status:r.status,code:r.status===409?'version_conflict':'api_error'})}
 if(!text.trim())throw Object.assign(Error('پاسخ خالی از سرور'),{code:'empty_response'});return j}
async function load(module){const r=await fetch(API()+'Load?module='+module+'&_='+Date.now(),{cache:'no-store',credentials:'omit',headers:{Accept:'application/json'}});if(!r.ok)throw Error(`دریافت ${module} از سرور: HTTP ${r.status}`);const j=await r.json();return{doc:window.InvEngine.unwrap(j),version:verOf(j)??verOf(window.InvEngine.unwrap(j)?.meta)}}
async function version(module,collection){const j=await post('Query',{module,collection,filters:{},dateField:'',from:'',to:'',sortBy:'',descending:false,includeArchived:false,page:1,pageSize:1}),v=verOf(find(j,'items'))??verOf(j);if(v===null)throw Error(`نسخهٔ ماژول ${module} از سرور دریافت نشد؛ چیزی ذخیره نشد`);return v}
const rid=()=>globalThis.crypto?.randomUUID?crypto.randomUUID():Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,12);
async function mutate({module,collection,operation,recordId,data,expectedVersion,requestId}){
 const v=Number.isFinite(expectedVersion)?expectedVersion:await version(module,collection);
 const j=await post('Mutate',{module,collection,operation,recordId:String(recordId||''),idField:'id',expectedVersion:v,requestId:requestId||rid(),data:data||{}});const n=verOf(find(j,'version'))??verOf(j);return{version:n}}
window.CashApi={load,version,mutate,requestId:rid};

window.CashWrite={TYPES,SETTLE_TYPE,types,parse,N,date,active,calc,variance,sales,itemsOf,applyItems,reports,followups,followupPatches,buildReport,withReport,archiveCheck,settle,REVIEW,reviewStatus,review,
 saveCashier,saveRecipient,saveAccount,saveType,saveLimit,saveDisplay,UNITS,CUSTODY_KINDS,ledger,custodyEntry,voidEntry,AMOUNT_FIELDS,LABEL};
})();
