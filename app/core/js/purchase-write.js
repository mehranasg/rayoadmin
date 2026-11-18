/* =========================================================
   Rayo UI Template — purchase-write.js
   Purchase invoices from the new panel onto the live data (stage 6), with the record shapes and rules of the current
   panel (js/42, docs/SUPPLIER_WORKFLOWS.md):
     detailed invoice → inventory.purchaseInvoices row with lines; when finalized each line carries the manager's
                        price decision (lines[].updateCatalogPrice); approved prices go to pricing.ingredientPriceHistory
                        and pricing.ingredients (syncInvoicePrices). Saved invoice first, then pricing; a failed pricing
                        step is kept as pricingSyncStatus 'failed' and can be retried (not atomic, same as today).
     quick invoice    → total only (lines: [], hasLineDetails: false); partial/full settlement adds one supplierPayments
                        row (source quickInvoiceForm) in the same save.
     void             → status 'void' with reason; dependent receipts/movements voided; latest valid price recomputed.
   An invoice never changes stock (stock comes only from «ورود به انبار»). Balance = invoiceTotal − Σ valid payments.
   ========================================================= */
(function(){
'use strict';
const A=x=>Array.isArray(x)?x:[];
const S=x=>String(x??'').trim();
const Z=v=>{const n=Number(v);return Number.isFinite(n)?n:0};
const NUM=v=>{if(typeof v==='number')return v;const s=S(v).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/٫/g,'.').replace(/[٬,\s]/g,'');if(!s)return 0;const n=Number(s);return Number.isFinite(n)?n:NaN};
const D=v=>window.InvEngine.D(v);
const clone=x=>JSON.parse(JSON.stringify(x));
const normalizeName=x=>S(x).normalize('NFKC').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[‌‏‎\s_\-–—()（）،,./\\]+/g,'').toLowerCase();
const supplierName=s=>s?.company||s?.contactName||s?.code||'—';
const PAYMENT_METHODS=['کارت به کارت','کارت تنخواه','واریز بانکی','چک','نقدی','کسر از صندوق','تهاتر','سایر'];
const isArchived=x=>x?.isArchived===true;
const isFinal=x=>!!x&&!['void','draft','pending','rejected','cancelled','لغوشده'].includes(x.status)&&!isArchived(x);
const docLines=x=>A(x?.lines);
function invoiceTotal(x){if(Z(x?.totalToman)>0)return Z(x.totalToman);return Math.max(0,docLines(x).reduce((a,l)=>a+Z(l.lineTotalToman||Z(l.purchaseQuantity||l.quantity)*Z(l.unitPrice)-Z(l.discountToman)),0)-Z(x?.discount)+Z(x?.taxToman)+Z(x?.extraCostToman))}
// js/19 normalizePaymentDirections / paymentDirectionSign: the effect snapshot on the payment wins, then the direction list
const DEFAULT_DIRECTIONS=[{value:'payment',label:'پرداخت بدهی',effect:'payment',isActive:true},{value:'receipt',label:'وصول طلب قبلی',effect:'receipt',isActive:true}];
function paymentDirections(inv){const rows=A(inv?.settings?.supplierPaymentDirections),src=rows.length?rows:DEFAULT_DIRECTIONS;return src.map((x,i)=>typeof x==='string'?{value:`PAYDIR-${String(i+1).padStart(3,'0')}`,label:x,effect:'payment',isActive:true}:{...x,value:x.value||x.id||`PAYDIR-${String(i+1).padStart(3,'0')}`,label:x.label||x.name||x.title||'',effect:x.effect==='receipt'?'receipt':'payment',isActive:x.isActive!==false})}
let directionDoc=null;
const paymentSign=p=>{const v=S(p?.direction)||'payment',e=S(p?.directionEffect)||paymentDirections(directionDoc).find(x=>x.value===v)?.effect||(v==='receipt'?'receipt':'payment');return e==='receipt'?-1:1};
/* ---------- supplier account (js/42 rawAccountPosition / supplierAccount) ----------
   balance = latest opening balance (declared, as of its baseline date) + after that date: final invoices + direct debts
   (service / other) − payments (a refund «وصول طلب» counts negative). Without an opening, everything counts. */
const validDebt=x=>!!x&&x.status!=='void'&&!isArchived(x);
function rawAccountPosition(inv,id,through=''){directionDoc=inv;const inT=d=>!through||S(d)<=through,invoices=A(inv?.purchaseInvoices).filter(x=>isFinal(x)&&x.supplierId===id&&inT(x.date)),payments=A(inv?.supplierPayments).filter(x=>x.status!=='void'&&x.supplierId===id&&inT(x.date)),debts=A(inv?.supplierDirectDebts).filter(x=>validDebt(x)&&x.supplierId===id&&x.debtType!=='opening'&&inT(x.date)),purchases=invoices.reduce((a,x)=>a+invoiceTotal(x),0),direct=debts.reduce((a,x)=>a+Z(x.amount),0),paid=invoices.reduce((a,x)=>a+Z(x.paidAmount),0)+payments.reduce((a,x)=>a+paymentSign(x)*Z(x.amount),0);return{invoices,payments,debts,purchases,direct,paid,balance:purchases+direct-paid}}
function supplierAccount(inv,id){const openings=A(inv?.supplierDirectDebts).filter(x=>validDebt(x)&&x.supplierId===id&&x.debtType==='opening'&&S(x.baselineDate||x.date)).sort((a,b)=>S(b.baselineDate||b.date).localeCompare(S(a.baselineDate||a.date))||S(b.updatedAt||b.createdAt).localeCompare(S(a.updatedAt||a.createdAt))),opening=openings[0]||null,base=S(opening?.baselineDate||opening?.date),raw=rawAccountPosition(inv,id),aft=x=>!base||S(x.date)>base;
 const invoices=raw.invoices.filter(aft),payments=raw.payments.filter(aft),debts=raw.debts.filter(aft),purchases=invoices.reduce((a,x)=>a+invoiceTotal(x),0),direct=debts.reduce((a,x)=>a+Z(x.amount),0),paid=invoices.reduce((a,x)=>a+Z(x.paidAmount),0)+payments.reduce((a,x)=>a+paymentSign(x)*Z(x.amount),0),openingAmount=opening?Z(opening.declaredBalanceToman):0;
 return{invoices,payments,debts,opening,openings,purchases,direct,paid,openingAmount,balance:openingAmount+purchases+direct-paid}}
/* debt over time («نمودار بورسی»): for one supplier or all, every day with a move — purchases (final invoices, direct
   debts), payments (invoice paidAmount on the invoice date and supplier payments, a refund negative), and the debt at the
   end of the day, built like supplierAccount (a supplier's moves count from its latest opening, which starts its line).
   bucket (day / week / month) gives candles: open = debt at the end of the previous bucket, close, high / low of the days. */
/* purchase cost by supplier for a period («نقشهٔ بورسی»، treemap of ui-template/reports): final invoices of the period,
   supplier → item group of each line (a quick invoice without lines is one «بدون ریز اقلام» box; invoice-level discount,
   tax and extra cost go to a «تخفیف، مالیات و هزینهٔ جانبی» box). Without invoices in the period, the stock receipts
   (ورود کالا) are used instead — group → item, valued at their price or else quantity × costAt(item, date) (catalog price
   history, InvEngine M.costAt) — and source = 'receipts'. */
function purchaseTree(inv,pricing,{from,to,costAt}={}){const ing=new Map(A(pricing?.ingredients).map(i=>[i.id,i])),inP=d=>S(d)>=from&&S(d)<=to,grp=new Map,add=(a,b,v)=>{if(!(v>0)&&!(v<0))return;const g=grp.get(a)||new Map;g.set(b,(g.get(b)||0)+v);grp.set(a,g)};
 const invs=A(inv?.purchaseInvoices).filter(x=>isFinal(x)&&inP(x.date));let source='invoices';
 if(invs.length){for(const x of invs){const sup=S(x.supplierNameSnapshot)||S(x.supplierId)||'—',ls=docLines(x);if(!ls.length){add(sup,'بدون ریز اقلام',invoiceTotal(x));continue}
   let sum=0;for(const l of ls){const v=Z(l.lineTotalToman||Z(l.purchaseQuantity||l.quantity)*Z(l.unitPrice)-Z(l.discountToman));sum+=v;add(sup,S(ing.get(l.ingredientId)?.category)||'سایر',v)}add(sup,'تخفیف، مالیات و هزینهٔ جانبی',invoiceTotal(x)-sum)}}
 else{source='receipts';for(const r of A(inv?.stockReceipts)){if(r.status==='void'||!inP(r.date))continue;const i=ing.get(r.ingredientId);const c=costAt?Number(costAt(r.ingredientId,S(r.date))):NaN;add(S(i?.category)||'سایر',S(i?.name||r.itemNameSnapshot)||'—',Z(r.totalPriceToman)||(Number.isFinite(c)?Z(r.quantity)*c:0))}}
 const tree=[...grp].map(([name,g])=>({name,children:[...g].filter(([,v])=>v>0.5).map(([n,v])=>({name:n,value:Math.round(v)})).sort((a,b)=>b.value-a.value)})).map(t=>({...t,value:t.children.reduce((a,c)=>a+c.value,0)})).filter(t=>t.value>0).sort((a,b)=>b.value-a.value);
 return{source,tree,total:tree.reduce((a,t)=>a+t.value,0),count:source==='invoices'?invs.length:null}}
function debtSeries(inv,{supplierId='',bucket='week'}={}){directionDoc=inv;const ids=supplierId?[supplierId]:[...new Set([...A(inv?.purchaseInvoices),...A(inv?.supplierPayments),...A(inv?.supplierDirectDebts)].map(x=>x.supplierId).filter(Boolean))];
 const ev=[];for(const id of ids){const ac=supplierAccount(inv,id),base=S(ac.opening?.baselineDate||ac.opening?.date);if(ac.opening)ev.push({date:base,debt:ac.openingAmount,buy:0,pay:0});
  for(const x of ac.invoices)ev.push({date:S(x.date),buy:invoiceTotal(x),pay:Z(x.paidAmount),debt:invoiceTotal(x)-Z(x.paidAmount)});for(const x of ac.debts)ev.push({date:S(x.date),buy:Z(x.amount),pay:0,debt:Z(x.amount)});for(const x of ac.payments){const v=paymentSign(x)*Z(x.amount);ev.push({date:S(x.date),buy:0,pay:v,debt:-v})}}
 const by=new Map;for(const e of ev){if(!e.date)continue;const o=by.get(e.date)||{date:e.date,buy:0,pay:0,move:0};o.buy+=e.buy;o.pay+=e.pay;o.move+=e.debt;by.set(e.date,o)}
 let bal=0;const days=[...by.values()].sort((a,b)=>a.date.localeCompare(b.date)).map(o=>{bal+=o.move;return{...o,debt:bal}});
 const key=d=>bucket==='month'?d.slice(0,7):bucket==='day'?d:weekKey(d),bk=new Map;let prev=0;for(const d of days){const k=key(d.date);let b=bk.get(k);if(!b){b={key:k,from:d.date,to:d.date,open:prev,close:prev,high:prev,low:prev,buy:0,pay:0};bk.set(k,b)}b.to=d.date;b.close=d.debt;b.high=Math.max(b.high,d.debt);b.low=Math.min(b.low,d.debt);b.buy+=d.buy;b.pay+=d.pay;prev=d.debt}
 return{days,buckets:[...bk.values()]}}
// week of a Jalali date: 7-day blocks of the month (1–7, 8–14, 15–21, 22–end), stable without a calendar library
const weekKey=d=>{const day=Number(S(d).slice(8,10))||1;return S(d).slice(0,8)+String(Math.min(4,Math.ceil(day/7))*7-6).padStart(2,'0')};
function invoicePaid(inv,x){directionDoc=inv;return Z(x.paidAmount)+A(inv?.supplierPayments).filter(p=>p.status!=='void'&&p.invoiceId===x.id).reduce((a,p)=>a+paymentSign(p)*Z(p.amount),0)}
const paymentLocations=inv=>A(inv?.settings?.paymentLocations).filter(x=>x.isActive!==false);
const procurementCatalog=pr=>A(pr?.ingredients).filter(i=>!isArchived(i)&&S(i.status)!=='غیرفعال'&&i.procurementEnabled!==false).sort((a,b)=>S(a.name).localeCompare(S(b.name),'fa'));
function relationFor(sup,supplierId,ingredient){const s=A(sup?.suppliers).find(x=>x.id===supplierId);return A(sup?.supplierItems).find(r=>r.supplierCode===s?.code&&(r.ingredientId===ingredient?.id||S(r.itemCode)===S(ingredient?.code)))||null}
// the catalog price for a purchase pack of `pack` recipe units (as js/42 confirmInvoicePrices compares)
function previousPackPrice(i,pack){const pk=Z(i?.packageQuantity),price=Z(i?.lastPurchasePriceToman);if(pk>0&&price>0&&pack>0)return price/pk*pack;return price}
const assertDate=(d,label)=>{if(!d||window.InvEngine.CAL.i(d)===null)throw Error(`${label} معتبر نیست (مثال ۱۴۰۵/۰۸/۱۷)`)};

/* ---------- lines ---------- */
function buildLines(pr,sup,supplierId,raw,finalized){const cat=new Map(procurementCatalog(pr).map(i=>[i.id,i]));return A(raw).map((x,k)=>{const i=cat.get(S(x.itemId));if(!i)throw Error(`ردیف ${k+1}: کالا را از فهرست انتخاب کنید`);const quantity=NUM(x.quantity),packageQuantity=NUM(x.packageQuantity),unitPrice=NUM(x.unitPrice),discountToman=NUM(x.discountToman);
 if(!(quantity>0))throw Error(`ردیف ${k+1} (${i.name}): مقدار مثبت لازم است`);if([packageQuantity,unitPrice,discountToman].some(v=>Number.isNaN(v)||v<0))throw Error(`ردیف ${k+1} (${i.name}): عدد نامعتبر`);
 if(finalized&&!(unitPrice>0&&packageQuantity>0))throw Error(`ردیف ${k+1} (${i.name}): در فاکتور نهایی قیمت واحد و مقدار بسته باید مثبت باشند`);
 const purchaseUnit=S(x.purchaseUnit)||S(i.purchaseUnit),rel=relationFor(sup,supplierId,i);
 return{ingredientId:i.id,itemCode:i.code,itemName:i.name,supplierItemId:rel?.id||'',purchaseQuantity:quantity,quantity,purchaseUnit,unit:purchaseUnit,recipeUnit:i.recipeUnit||'',packageQuantity,unitPrice,expectedUnitPriceToman:unitPrice,discountToman,lineTotalToman:Math.max(0,quantity*unitPrice-discountToman),...(finalized?{updateCatalogPrice:x.updateCatalogPrice===true&&packageQuantity>0}:{})}})}

/* ---------- invoice = stock receipt (APP_REVIEW P-02) ----------
   A finalized detailed invoice can also be the stock receipt of its goods, in the same save (inventory module):
     stockMode 'auto'  each stock line links to the unlinked direct receipts («ورود کالا») of the same item within ±3 days
                       of the invoice date (the goods were already received — for months entered afterwards), else a new
                       receipt is created;
     stockMode 'new'   a new receipt for every stock line;
     stockMode 'none'  no stock effect (the old behaviour; goods received separately, or services).
   New receipt: stockReceipts {id REC-INV-<req>-<n>, invoiceId, invoiceLink 'created', sourceType PURCHASE_INVOICE,
   quantity = purchase quantity × package quantity (base unit), entry quantity/unit, unitCostToman = line total ÷ quantity,
   totalPriceToman} + its PURCHASE_RECEIPT movement (referenceType purchaseInvoice). Linked receipt: invoiceId, invoiceLink
   'matched', price from the line (its previous price kept in priceBeforeInvoice); quantity and date unchanged.
   Edit: created receipts of the invoice are voided (voidKind 'edit') and matched ones unlinked, then posted again.
   Void: created receipts and their movements are voided, matched ones only unlinked (the goods did arrive).
   Non-stock items are skipped. A date in a closed inventory period or in the future refuses a stock mode. */
const STOCK_MODES=['auto','new','none'];
const isStock=i=>!!i&&i.status!=='غیرفعال'&&i.itemType!=='NON_STOCK'&&i.inventoryTracked!==false;
const dayIdx=d=>window.InvEngine.CAL.i(D(d));
const invClosed=(inv,date)=>A(inv?.periodClosures).find(c=>c.status==='closed'&&S(c.to)>=date)||null;
function stockPlan(inv,pricing,invoice,mode){mode=STOCK_MODES.includes(mode)?mode:'none';const ing=new Map(A(pricing?.ingredients).map(i=>[i.id,i])),taken=new Set,di=dayIdx(invoice.date);
 return docLines(invoice).map((l,k)=>{const i=ing.get(l.ingredientId),qty=Z(l.purchaseQuantity||l.quantity)*Z(l.packageQuantity),total=Z(l.lineTotalToman);
  if(mode==='none'||!isStock(i)||!(qty>0))return{k,l,i,qty,action:'skip',why:!isStock(i)?'کالای غیرانباری':mode==='none'?'بدون ورود':'مقدار ندارد'};
  if(mode==='auto'){const cand=A(inv.stockReceipts).filter(r=>r.status!=='void'&&!S(r.invoiceId)&&r.ingredientId===i.id&&!taken.has(r.id)&&Math.abs(dayIdx(r.date)-di)<=3).sort((a,b)=>Math.abs(dayIdx(a.date)-di)-Math.abs(dayIdx(b.date)-di));
   if(cand.length){const d0=D(cand[0].date),ms=cand.filter(r=>D(r.date)===d0);ms.forEach(r=>taken.add(r.id));return{k,l,i,qty,total,action:'match',matches:ms,matchedQty:ms.reduce((a,r)=>a+Z(r.quantity),0)}}}
  return{k,l,i,qty,total,action:'new'}})}
function unpostStock(inv,ctx,invoice,reason,kind){const out={voided:0,unlinked:0};
 for(const r of A(inv.stockReceipts).filter(r=>r.invoiceId===invoice.id&&r.invoiceLink)){if(r.invoiceLink==='created'&&r.status!=='void'){Object.assign(r,{status:'void',voidKind:kind,voidReason:reason,voidedAt:ctx.at,voidedBy:ctx.actor});A(inv.inventoryMovements).filter(m=>m.sourceKey===`receipt:${r.id}`&&m.status!=='void').forEach(m=>Object.assign(m,{status:'void',voidKind:kind,voidReason:reason,voidedAt:ctx.at,voidedBy:ctx.actor}));out.voided++}
  else if(r.invoiceLink==='matched'){const p=r.priceBeforeInvoice||{};Object.assign(r,{invoiceId:'',invoiceLink:'',unlinkedInvoiceId:invoice.id,unitCostToman:p.unitCostToman??null,totalPriceToman:p.totalPriceToman??null});delete r.priceBeforeInvoice;A(inv.inventoryMovements).filter(m=>m.sourceKey===`receipt:${r.id}`).forEach(m=>{m.unitCostToman=r.unitCostToman});out.unlinked++}}
 return out}
function postStock(inv,ctx,invoice,pricing,mode){mode=STOCK_MODES.includes(mode)?mode:'none';invoice.stockMode=mode;invoice.receiptIds=[];if(mode==='none'||!isFinal(invoice))return{created:0,matched:0,skipped:docLines(invoice).length};
 const date=D(invoice.date);if(date>window.InvEngine.CAL.today)throw Error('فاکتور با تاریخ آینده وارد انبار نمی‌شود');const c=invClosed(inv,date);if(c)throw Error(`دورهٔ انبار ${c.from||''} تا ${c.to} بسته است؛ «بدون ورود به انبار» را انتخاب کنید`);
 const loc=A(inv.locations).find(l=>l.id===S(inv.settings?.mainLocationId))||A(inv.locations)[0]||{id:S(inv.settings?.mainLocationId),name:''};
 inv.stockReceipts=A(inv.stockReceipts);inv.inventoryMovements=A(inv.inventoryMovements);const out={created:0,matched:0,skipped:0};
 for(const p of stockPlan(inv,pricing,invoice,mode)){if(p.action==='skip'){out.skipped++;continue}const unit=S(p.i.recipeUnit),cost=p.total/p.qty;
  if(p.action==='match'){for(const r of p.matches){r.priceBeforeInvoice={unitCostToman:r.unitCostToman??null,totalPriceToman:r.totalPriceToman??null};Object.assign(r,{invoiceId:invoice.id,invoiceLink:'matched',unitCostToman:cost,totalPriceToman:Math.round(cost*Z(r.quantity)),linkedAt:ctx.at,linkedBy:ctx.actor});A(inv.inventoryMovements).filter(m=>m.sourceKey===`receipt:${r.id}`).forEach(m=>{m.unitCostToman=cost});invoice.receiptIds.push(r.id)}out.matched++;continue}
  const id=`REC-INV-${ctx.reqId}-${p.k+1}`;invoice.receiptIds.push(id);out.created++;
  inv.stockReceipts.push({id,requestId:ctx.reqId,batchId:`RECB-${ctx.reqId}`,date,ingredientId:p.i.id,locationId:loc.id,quantity:+p.qty.toFixed(6),entryQuantity:Z(p.l.purchaseQuantity||p.l.quantity),entryUnit:S(p.l.purchaseUnit)||unit,entryUnitFactor:Z(p.l.packageQuantity),totalPriceToman:Math.round(p.total),unitCostToman:cost,status:'posted',sourceType:'PURCHASE_INVOICE',invoiceId:invoice.id,invoiceLink:'created',supplierId:S(invoice.supplierId),notes:`فاکتور ${S(invoice.invoiceNumber||invoice.number)}`,itemNameSnapshot:p.i.name,itemCodeSnapshot:p.i.code||'',unitSnapshot:unit,locationNameSnapshot:loc.name||'',createdAt:ctx.at,createdBy:ctx.actor});
  inv.inventoryMovements.push({id:`MOV-INV-${ctx.reqId}-${p.k+1}`,requestId:ctx.reqId,date,movementType:'PURCHASE_RECEIPT',ingredientId:p.i.id,quantity:+p.qty.toFixed(6),fromLocationId:'',toLocationId:loc.id,reasonCode:'PURCHASE',referenceType:'purchaseInvoice',referenceId:invoice.id,sourceKey:`receipt:${id}`,status:'posted',unitCostToman:cost,unitSnapshot:unit,notes:`فاکتور ${S(invoice.invoiceNumber||invoice.number)}`,createdAt:ctx.at,createdBy:ctx.actor})}
 return out}
/* payment at delivery (P-11): the supplier's card reader, cash or a transfer on the day the goods arrive. A reference is
   asked only for transfers; the same location + reference twice is refused. */
function deliveryPayment(inv,ctx,invoice,pay){if(!pay||pay.mode!=='now')return null;const amt=pay.amount===undefined||S(pay.amount)===''?invoiceTotal(invoice):NUM(pay.amount);if(!(amt>0))throw Error('مبلغ پرداخت سر تحویل باید مثبت باشد');if(amt>invoiceTotal(invoice)+0.5)throw Error('پرداخت سر تحویل از مبلغ فاکتور بیشتر است');
 const loc=paymentLocations(inv).find(l=>l.id===S(pay.locationId));if(!loc)throw Error('محل پرداخت را انتخاب کنید');const method=S(pay.method)||PAYMENT_METHODS[0],ref=S(pay.reference),pd=D(pay.date)||invoice.date;assertDate(pd,'تاریخ پرداخت');
 if(['کارت به کارت','واریز بانکی'].includes(method)&&!ref)throw Error('برای کارت به کارت یا واریز، شمارهٔ پیگیری لازم است');if(ref&&A(inv.supplierPayments).some(x=>x.status!=='void'&&x.paymentLocationId===loc.id&&S(x.reference)===ref))throw Error('این مرجع پرداخت قبلاً با همین محل ثبت شده است');
 const p={id:`PAY-${ctx.reqId}`,requestId:`PAY-${ctx.reqId}`,supplierId:invoice.supplierId,supplierNameSnapshot:invoice.supplierNameSnapshot,invoiceId:invoice.id,date:pd,amount:amt,method,paymentLocationId:loc.id,paymentLocationNameSnapshot:loc.name||'—',reference:ref,notes:`پرداخت سر تحویل فاکتور ${S(invoice.invoiceNumber||invoice.number)}`,direction:'payment',directionLabelSnapshot:'پرداخت بدهی',directionEffect:'payment',source:'invoiceDelivery',status:'posted',createdAt:ctx.at,createdBy:ctx.actor};
 inv.supplierPayments=A(inv.supplierPayments);inv.supplierPayments.push(p);return p}
/* due date: invoice date + the supplier's settlement days (0 / none = no due date) */
function dueDate(invoice,suppliers){const s=A(suppliers?.suppliers).find(x=>x.id===invoice.supplierId),n=Z(s?.settlementDays);if(!(n>0))return'';const i=dayIdx(invoice.date);return i===null?'':window.InvEngine.CAL.k(i+n)}

/* ---------- detailed invoice (js/42 savePurchaseInvoice) ---------- */
function addInvoice(inv,ctx,{supplierId,number,date,status,lines,discount,taxToman,extraCostToman,notes,stockMode,payment},{pricing,suppliers}){date=D(date);assertDate(date,'تاریخ فاکتور');number=S(number);if(!number)throw Error('شماره فاکتور لازم است');status=status==='draft'?'draft':'finalized';
 const supplier=supplierId?A(suppliers?.suppliers).find(s=>s.id===supplierId):null;if(supplierId&&!supplier)throw Error('تأمین‌کننده پیدا نشد');
 const rows=buildLines(pricing,suppliers,supplierId,lines,status==='finalized');if(!rows.length)throw Error('حداقل یک ردیف لازم است');
 if(A(inv.purchaseInvoices).some(x=>x.supplierId===S(supplierId)&&normalizeName(x.invoiceNumber||x.number)===normalizeName(number)&&x.status!=='void'))throw Error('این شماره فاکتور قبلاً برای همین تأمین‌کننده ثبت شده است');
 const [dc,tx,ex]=[discount,taxToman,extraCostToman].map(NUM);if([dc,tx,ex].some(v=>Number.isNaN(v)||v<0))throw Error('تخفیف، مالیات و هزینهٔ جانبی باید عدد نامنفی باشند');
 const row={id:`PINV-${ctx.reqId}`,invoiceNumber:number,number,date,supplierId:S(supplierId),supplierNameSnapshot:supplier?supplierName(supplier):'بدون تأمین‌کننده',purchaseOrderId:'',purchaseOrderNumberSnapshot:'',status,lines:rows,hasLineDetails:true,discount:dc,taxToman:tx,extraCostToman:ex,notes:S(notes),isArchived:false,...(ctx.staff?{registeredByType:'staff',registeredByPersonnelId:ctx.staff.personnelId,registeredByName:ctx.staff.name}:{}),createdAt:ctx.at,createdBy:ctx.actor,updatedAt:ctx.at,updatedBy:ctx.actor,pricingSyncStatus:status==='finalized'&&rows.some(l=>l.updateCatalogPrice)?'pending':'not-required',source:'ui-template'};
 row.totalToman=Math.max(0,rows.reduce((a,l)=>a+Z(l.lineTotalToman),0)-dc+tx+ex);
 inv.purchaseInvoices=A(inv.purchaseInvoices);inv.purchaseInvoices.unshift(row);const stock=postStock(inv,ctx,row,pricing,stockMode),pay=status==='finalized'?deliveryPayment(inv,ctx,row,payment):null;ctx.auditExtra={entityId:row.id,stock,...(pay?{paymentId:pay.id}:{})};return row}

/* ---------- quick invoice (js/42 saveQuickPurchaseInvoice) ---------- */
function addQuickInvoice(inv,ctx,{supplierId,number,date,amount,notes,settlement='unpaid',payAmount,payDate,payMethod,payLocationId,payRef},{suppliers}){date=D(date);assertDate(date,'تاریخ فاکتور');const supplier=A(suppliers?.suppliers).find(s=>s.id===supplierId);if(!supplier)throw Error('برای فاکتور سریع، انتخاب تأمین‌کننده الزامی است');
 const total=NUM(amount);if(!(total>0))throw Error('مبلغ کل فاکتور باید عدد مثبت باشد');number=S(number);
 if(number&&A(inv.purchaseInvoices).some(x=>x.supplierId===supplierId&&normalizeName(x.invoiceNumber||x.number)===normalizeName(number)&&x.status!=='void'))throw Error('این شماره فاکتور قبلاً برای همین تأمین‌کننده ثبت شده است');
 let pay=null;if(settlement!=='unpaid'){const amt=settlement==='paid'?total:NUM(payAmount),pd=D(payDate)||date;if(!S(payLocationId)||!paymentLocations(inv).some(l=>l.id===payLocationId))throw Error('برای تسویهٔ جزئی یا کامل، محل پرداخت را انتخاب کنید');if(!S(payRef))throw Error('شمارهٔ پیگیری/مرجع پرداخت الزامی است');assertDate(pd,'تاریخ پرداخت');
  if(settlement==='partial'&&!(amt>0&&amt<total))throw Error('برای تسویهٔ جزئی، مبلغ پرداخت باید بیشتر از صفر و کمتر از مبلغ فاکتور باشد');if(!(amt>0))throw Error('مبلغ پرداخت باید مثبت باشد');
  if(A(inv.supplierPayments).some(x=>x.status!=='void'&&x.paymentLocationId===payLocationId&&S(x.reference)===S(payRef)))throw Error('این مرجع پرداخت قبلاً با همین محل ثبت شده است');
  pay={amt,pd}}
 const row={id:`PINV-${ctx.reqId}`,invoiceNumber:number,number,date,supplierId,supplierNameSnapshot:supplierName(supplier),purchaseOrderId:'',purchaseOrderNumberSnapshot:'',status:'finalized',lines:[],hasLineDetails:false,discount:0,taxToman:0,extraCostToman:0,totalToman:total,notes:S(notes),isArchived:false,createdAt:ctx.at,createdBy:ctx.actor,updatedAt:ctx.at,updatedBy:ctx.actor,pricingSyncStatus:'not-required',source:'ui-template'};
 inv.purchaseInvoices=A(inv.purchaseInvoices);inv.purchaseInvoices.unshift(row);let payment=null;
 if(pay){const loc=paymentLocations(inv).find(l=>l.id===payLocationId);payment={id:`PAY-${ctx.reqId}`,requestId:`PAY-${ctx.reqId}`,supplierId,supplierNameSnapshot:row.supplierNameSnapshot,invoiceId:row.id,date:pay.pd,amount:pay.amt,method:S(payMethod)||PAYMENT_METHODS[0],paymentLocationId:payLocationId,paymentLocationNameSnapshot:loc?.name||'—',reference:S(payRef),notes:`تسویه فاکتور سریع ${number||row.id}`,direction:'payment',directionLabelSnapshot:'پرداخت بدهی',directionEffect:'payment',source:'quickInvoiceForm',status:'posted',createdAt:ctx.at,createdBy:ctx.actor};inv.supplierPayments=A(inv.supplierPayments);inv.supplierPayments.push(payment)}
 ctx.auditExtra={entityId:row.id,...(payment?{paymentId:payment.id}:{})};return{row,payment}}
function nearDuplicate(inv,{supplierId,date,amount}){const t=NUM(amount);return A(inv.purchaseInvoices).find(x=>x.supplierId===supplierId&&x.status!=='void'&&x.date===D(date)&&Math.abs(Z(x.totalToman)-t)<1)||null}

/* ---------- pricing sync (js/42 syncInvoicePrices), pricing document ---------- */
const priceKey=x=>`${S(x.date)}|${S(x.createdAt)}|${S(x.sourceId||x.id)}`;
function effectiveLines(inv,ingredientId,excludeId){return A(inv?.purchaseInvoices).filter(x=>x.id!==excludeId&&isFinal(x)&&x.isTest!==true&&x.seed!==true).flatMap(x=>docLines(x).slice().reverse().filter(l=>l.updateCatalogPrice!==false&&l.ingredientId===ingredientId&&Z(l.unitPrice)>0&&Z(l.packageQuantity)>0).map(l=>({invoice:x,line:l,key:priceKey({date:x.date,createdAt:x.updatedAt||x.createdAt,sourceId:x.id})})))}
function syncInvoicePrices(pr,inv,invoice){const affected=new Set(docLines(invoice).filter(l=>l.updateCatalogPrice!==false).map(l=>l.ingredientId));pr.ingredientPriceHistory=A(pr.ingredientPriceHistory);
 pr.ingredientPriceHistory.forEach(h=>{if(h.invoiceId===invoice.id&&affected.has(h.ingredientId))h.isVoided=true});
 if(isFinal(invoice))for(const l of docLines(invoice)){if(l.updateCatalogPrice===false)continue;const ing=A(pr.ingredients).find(i=>i.id===l.ingredientId);if(!ing||Z(l.packageQuantity)<=0)continue;const h={id:`IPH-INV-${invoice.id}-${l.ingredientId}`,ingredientId:l.ingredientId,date:invoice.date,priceToman:Z(l.unitPrice),unitCostToman:Z(l.unitPrice)/Z(l.packageQuantity),purchaseUnit:l.purchaseUnit,packageQuantity:Z(l.packageQuantity),recipeUnit:l.recipeUnit,source:'supplierInvoice',supplierId:invoice.supplierId,invoiceId:invoice.id,createdAt:invoice.updatedAt||invoice.createdAt,isVoided:false};const old=pr.ingredientPriceHistory.find(x=>x.id===h.id);if(old)Object.assign(old,h);else pr.ingredientPriceHistory.push(h)}
 const changed=[];for(const id of affected){const ing=A(pr.ingredients).find(i=>i.id===id);if(!ing)continue;const own=isFinal(invoice)?docLines(invoice).slice().reverse().filter(l=>l.updateCatalogPrice!==false&&l.ingredientId===id&&Z(l.unitPrice)>0&&Z(l.packageQuantity)>0).map(l=>({invoice,line:l,key:priceKey({date:invoice.date,createdAt:invoice.updatedAt||invoice.createdAt,sourceId:invoice.id})})):[];
  const latest=effectiveLines(inv,id,invoice.id).concat(own).sort((a,b)=>b.key.localeCompare(a.key))[0];
  const before={lastPurchasePriceToman:ing.lastPurchasePriceToman,lastPurchaseDate:ing.lastPurchaseDate,lastPurchaseSource:ing.lastPurchaseSource,lastPurchaseInvoiceId:ing.lastPurchaseInvoiceId};
  if(latest){changed.push({id,before});Object.assign(ing,{lastPurchasePriceToman:Z(latest.line.unitPrice),latestPriceToman:Z(latest.line.unitPrice),lastPurchaseDate:latest.invoice.date,lastPurchaseSupplierId:latest.invoice.supplierId,lastPurchaseSource:'supplierInvoice',lastPurchaseInvoiceId:latest.invoice.id})}
  // no valid invoice left and the catalog still points at this (voided) invoice: go back to the latest valid price
  // history row (manual, stocktake or invoice), converted to the ingredient's own package. (The current panel leaves the
  // voided price in place here.)
  else if(!isFinal(invoice)&&ing.lastPurchaseInvoiceId===invoice.id){const h=A(pr.ingredientPriceHistory).filter(x=>x.ingredientId===id&&!x.isVoided&&Z(x.priceToman)>0&&D(x.date)).sort((a,b)=>D(b.date).localeCompare(D(a.date))||S(b.createdAt).localeCompare(S(a.createdAt)))[0];
   if(h){const pk=Z(ing.packageQuantity)||1,hp=Z(h.packageQuantity)||pk,price=Math.round(Z(h.priceToman)/hp*pk*100)/100;changed.push({id,before});Object.assign(ing,{lastPurchasePriceToman:price,latestPriceToman:price,lastPurchaseDate:D(h.date),lastPurchaseSource:h.source==='supplierInvoice'&&h.invoiceId?'supplierInvoice':S(h.source)||'priceHistory',lastPurchaseInvoiceId:h.source==='supplierInvoice'?S(h.invoiceId):'',lastPurchaseSupplierId:S(h.supplierId)})}
   // no history at all (catalog price only): the values saved before this invoice's price step (pricing.changeLog audit row)
   else{const log=A(pr.changeLog).find(r=>r.action==='INVOICE_PRICES_APPLIED'&&r.invoiceId===invoice.id&&A(r.before).some(b=>b.id===id)),b=log&&A(log.before).find(b=>b.id===id)?.before;
    if(b){changed.push({id,before});Object.assign(ing,{lastPurchasePriceToman:b.lastPurchasePriceToman,latestPriceToman:b.lastPurchasePriceToman,lastPurchaseDate:b.lastPurchaseDate||'',lastPurchaseSource:b.lastPurchaseSource||'',lastPurchaseInvoiceId:b.lastPurchaseInvoiceId||''})}}}}
 return changed}
function markPricing(inv,ctx,{id,ok,error}){const x=A(inv.purchaseInvoices).find(i=>i.id===id);if(!x)throw Error('فاکتور پیدا نشد');if(ok){x.pricingSyncStatus='synced';x.pricingSyncedAt=ctx.at;delete x.pricingSyncError}else{x.pricingSyncStatus='failed';x.pricingSyncError=S(error)}ctx.auditExtra={entityId:id};return x}

/* ---------- void (js/42 cancelPurchaseDocument) ---------- */
function voidInvoice(inv,ctx,{id,reason}){reason=S(reason);if(!reason)throw Error('علت لغو لازم است');const x=A(inv.purchaseInvoices).find(i=>i.id===id);if(!x)throw Error('فاکتور پیدا نشد');if(x.status==='void')throw Error('این فاکتور قبلاً لغو شده است');
 ctx.auditExtra={entityId:id,before:clone(x),reason};
 const managed=unpostStock(inv,ctx,x,reason,'void');const rids=new Set;for(const r of A(inv.stockReceipts).filter(r=>r.invoiceId===id&&!r.invoiceLink)){rids.add(r.id);Object.assign(r,{status:'void',voidReason:reason,voidedAt:ctx.at})}
 for(const m of A(inv.inventoryMovements).filter(m=>(m.referenceType==='purchaseInvoice'&&m.referenceId===id)||[...rids].some(r=>m.sourceKey===`receipt:${r}`)))Object.assign(m,{status:'void',voidReason:reason,voidedAt:ctx.at});
 Object.assign(x,{status:'void',voidReason:reason,voidedAt:ctx.at,voidedBy:ctx.actor});return{invoice:x,receipts:rids.size+managed.voided,unlinked:managed.unlinked,needsPricing:docLines(x).some(l=>l.updateCatalogPrice===true)}}

/* ---------- supplier payment (js/14 savePayment, void as js/32 opsDeletePayment) ----------
   Settles a debt (or records a refund «وصول طلب قبلی»); it creates no new expense or income. An invoice is optional
   (general settlement / opening balance); a refund is never tied to a purchase invoice. */
function invoiceRemaining(inv,x){return Math.max(0,invoiceTotal(x)-invoicePaid(inv,x))}
function addPayment(inv,ctx,{supplierId,invoiceId,date,amount,method,paymentLocationId,reference,notes,direction},{suppliers}){date=D(date);assertDate(date,'تاریخ پرداخت');const amt=NUM(amount);supplierId=S(supplierId);invoiceId=S(invoiceId);reference=S(reference);direction=S(direction)||'payment';
 const sup0=A(suppliers?.suppliers).find(s=>s.id===supplierId);if(!sup0)throw Error('تأمین‌کننده را انتخاب کنید');if(!(amt>0))throw Error('مبلغ باید عدد مثبت باشد');if(!reference)throw Error('شمارهٔ پیگیری / رسید الزامی است');
 const loc=paymentLocations(inv).find(l=>l.id===paymentLocationId);if(!loc)throw Error('محل پرداخت را انتخاب کنید');
 const dir=paymentDirections(inv).filter(x=>x.isActive!==false).find(x=>x.value===direction);if(!dir)throw Error('جهت تسویه معتبر نیست');
 if(invoiceId&&!A(inv.purchaseInvoices).some(x=>x.id===invoiceId&&x.supplierId===supplierId&&isFinal(x)))throw Error('فاکتور نهایی متعلق به همین تأمین‌کننده را انتخاب کنید');
 if(dir.effect==='receipt'&&invoiceId)throw Error('وصول طلب قبلی را بدون فاکتور خرید ثبت کنید');
 if(A(inv.supplierPayments).some(x=>x.status!=='void'&&x.paymentLocationId===loc.id&&S(x.reference)===reference))throw Error('این مرجع پرداخت قبلاً با همین محل ثبت شده است');
 const row={id:`PAY-${ctx.reqId}`,requestId:`PAY-${ctx.reqId}`,supplierId,supplierNameSnapshot:supplierName(sup0),invoiceId,date,amount:amt,method:S(method)||PAYMENT_METHODS[0],paymentLocationId:loc.id,paymentLocationNameSnapshot:loc.name||'',reference,notes:S(notes),direction:dir.value,directionLabelSnapshot:dir.label,directionEffect:dir.effect,source:'ui-template',status:'posted',createdAt:ctx.at,createdBy:ctx.actor};
 inv.supplierPayments=A(inv.supplierPayments);inv.supplierPayments.push(row);ctx.auditExtra={entityId:row.id,supplierId,invoiceId};return row}
function voidPayment(inv,ctx,{id,reason}){reason=S(reason);if(!reason)throw Error('علت ابطال لازم است');const p=A(inv.supplierPayments).find(x=>x.id===id);if(!p)throw Error('پرداخت پیدا نشد');if(p.status==='void')throw Error('این پرداخت قبلاً باطل شده است');ctx.auditExtra={entityId:id,before:clone(p),reason};Object.assign(p,{status:'void',voidReason:reason,voidedAt:ctx.at,voidedBy:ctx.actor});return p}

/* ---------- direct debt and opening balance (js/42 saveDirectDebt / voidDirectDebt) ----------
   opening: amount = declared balance on the baseline date (negative = Rayo is owed, 0 = settled); the computed balance up
   to that date and the applied difference are kept on the record; a same-date or newer opening must be edited instead.
   service / other: a positive debt outside any invoice (no stock, price or asset value change). */
const DEBT_TYPES={opening:'ماندهٔ افتتاحیه',service:'خدمت',other:'سایر بدهی مستقیم'};
const closedPeriodOn=(inv,date)=>A(inv?.periodClosures).some(x=>x.status==='closed'&&S(x.from)<=date&&S(x.to)>=date);
function addDirectDebt(inv,ctx,{supplierId,debtType,date,amount,dueDate,description,reference,notes,coverageConfirmed},{suppliers}){supplierId=S(supplierId);debtType=DEBT_TYPES[debtType]?debtType:'';date=D(date);description=S(description);
 if(!A(suppliers?.suppliers).some(s=>s.id===supplierId))throw Error('طرف تجاری را انتخاب کنید');if(!debtType)throw Error('نوع بدهی را انتخاب کنید');assertDate(date,debtType==='opening'?'تاریخ مبنا':'تاریخ سند');if(!description)throw Error('شرح الزامی است');
 const amt=NUM(amount);if(S(amount)===''||Number.isNaN(amt))throw Error('مبلغ معتبر وارد کنید');if(debtType!=='opening'&&!(amt>0))throw Error('مبلغ بدهی مستقیم باید مثبت باشد');
 const due=D(dueDate);if(S(dueDate)&&!due)throw Error('سررسید معتبر نیست');
 if(debtType==='opening'){if(A(inv.supplierDirectDebts).some(x=>validDebt(x)&&x.supplierId===supplierId&&x.debtType==='opening'&&S(x.baselineDate||x.date)>=date))throw Error('ماندهٔ افتتاحیهٔ هم‌تاریخ یا جدیدتر برای این طرف ثبت شده است؛ آن را باطل کنید و دوباره ثبت کنید');if(coverageConfirmed!==true)throw Error('پوشش همهٔ اسناد تا تاریخ مبنا را صریحاً تأیید کنید')}
 const calculated=rawAccountPosition(inv,supplierId,date).balance;
 const row={id:`SDEBT-${ctx.reqId}`,supplierId,debtType,date,baselineDate:debtType==='opening'?date:'',amount:debtType==='opening'?0:amt,declaredBalanceToman:debtType==='opening'?amt:0,calculatedBalanceToman:debtType==='opening'?calculated:0,appliedDifferenceToman:debtType==='opening'?amt-calculated:0,openingBalanceMode:debtType==='opening'?'replaceThroughBaseline':'',dueDate:due,description,reference:S(reference),assetId:'',maintenanceRecordId:'',notes:S(notes),status:'active',...(closedPeriodOn(inv,date)?{closedPeriodWarning:true}:{}),source:'ui-template',createdAt:ctx.at,createdBy:ctx.actor,updatedAt:ctx.at,updatedBy:ctx.actor};
 inv.supplierDirectDebts=A(inv.supplierDirectDebts);inv.supplierDirectDebts.unshift(row);ctx.auditExtra={entityId:row.id,supplierId,debtType,...(debtType==='opening'?{declared:amt,calculated}:{amount:amt})};return row}
function voidDirectDebt(inv,ctx,{id,reason}){reason=S(reason);if(!reason)throw Error('علت ابطال لازم است');const x=A(inv.supplierDirectDebts).find(r=>r.id===id);if(!x)throw Error('سند پیدا نشد');if(x.status==='void')throw Error('این سند قبلاً باطل شده است');ctx.auditExtra={entityId:id,before:clone(x),reason};Object.assign(x,{status:'void',voidReason:reason,voidedAt:ctx.at,voidedBy:ctx.actor});return x}

/* ---------- edit invoice / payment, purchase orders (stage 15) ----------
   edit invoice (js/42 openInvoiceForm on an existing row): the row keeps its id and creation; a final invoice stays final;
   with linked stock receipts the supplier and date cannot change and no line may drop below what was received; a quick
   invoice keeps lines [] unless lines are added (then it becomes detailed). Approved prices are re-applied afterwards.
   edit payment (js/14 savePayment with editPaymentId): same checks as a new payment, the row is updated in place.
   purchase order (js/42 savePurchaseOrder, saveOrderTracking): suppliers.purchaseRequests; no stock, price or debt effect. */
function editInvoice(inv,ctx,input,{pricing,suppliers}){const x=A(inv.purchaseInvoices).find(i=>i.id===input.id);if(!x)throw Error('فاکتور پیدا نشد');if(x.status==='void')throw Error('فاکتور لغوشده قابل ویرایش نیست');
 const date=D(input.date);assertDate(date,'تاریخ فاکتور');const number=S(input.number),supplierId=S(input.supplierId),supplier=supplierId?A(suppliers?.suppliers).find(s=>s.id===supplierId):null;if(supplierId&&!supplier)throw Error('تأمین‌کننده پیدا نشد');
 if(number&&A(inv.purchaseInvoices).some(o=>o.id!==x.id&&o.supplierId===supplierId&&normalizeName(o.invoiceNumber||o.number)===normalizeName(number)&&o.status!=='void'))throw Error('این شماره فاکتور قبلاً برای همین تأمین‌کننده ثبت شده است');
 const received=A(inv.stockReceipts).filter(r=>r.invoiceId===x.id&&!r.invoiceLink&&!['void','rejected'].includes(r.status));if(received.length&&(supplierId!==x.supplierId||date!==x.date))throw Error('فاکتور دارای رسید انبار است؛ تأمین‌کننده و تاریخ را تغییر ندهید');
 ctx.auditExtra={entityId:x.id,before:clone(x)};const wasFinal=isFinal(x),status=wasFinal?'finalized':(input.status==='finalized'?'finalized':'draft');
 if(x.hasLineDetails===false&&!A(input.lines).length){const total=NUM(input.amount);if(!(total>0))throw Error('مبلغ کل فاکتور باید مثبت باشد');if(!supplier)throw Error('برای فاکتور سریع، انتخاب تأمین‌کننده الزامی است');
  Object.assign(x,{invoiceNumber:number,number,date,supplierId,supplierNameSnapshot:supplierName(supplier),totalToman:total,notes:S(input.notes),updatedAt:ctx.at,updatedBy:ctx.actor});return x}
 if(!number)throw Error('شماره فاکتور لازم است');const rows=buildLines(pricing,suppliers,supplierId,input.lines,status==='finalized');if(!rows.length)throw Error('حداقل یک ردیف لازم است');
 if(received.some(r=>!rows.some(l=>l.ingredientId===r.ingredientId))||rows.some(l=>received.filter(r=>r.ingredientId===l.ingredientId).reduce((a,r)=>a+Z(r.quantity),0)>Z(l.purchaseQuantity)*Z(l.packageQuantity)+1e-9))throw Error('مقدار فاکتور از دریافت مرتبط کمتر می‌شود؛ ابتدا دریافت را بررسی کنید');
 const [dc,tx,ex]=[input.discount,input.taxToman,input.extraCostToman].map(NUM);if([dc,tx,ex].some(v=>Number.isNaN(v)||v<0))throw Error('تخفیف، مالیات و هزینهٔ جانبی باید عدد نامنفی باشند');
 Object.assign(x,{invoiceNumber:number,number,date,supplierId,supplierNameSnapshot:supplier?supplierName(supplier):'بدون تأمین‌کننده',status,lines:rows,hasLineDetails:true,discount:dc,taxToman:tx,extraCostToman:ex,notes:S(input.notes),updatedAt:ctx.at,updatedBy:ctx.actor,
  pricingSyncStatus:status==='finalized'&&(rows.some(l=>l.updateCatalogPrice)||docLines(ctx.auditExtra.before).some(l=>l.updateCatalogPrice))?'pending':'not-required'});
 x.totalToman=Math.max(0,rows.reduce((a,l)=>a+Z(l.lineTotalToman),0)-dc+tx+ex);
 const mode=STOCK_MODES.includes(input.stockMode)?input.stockMode:(x.stockMode||'none');if(mode!=='none'&&received.length)throw Error('این فاکتور ورود انبار قدیمی دارد؛ «بدون ورود به انبار» را نگه دارید');unpostStock(inv,ctx,x,'ویرایش فاکتور','edit');ctx.auditExtra.stock=postStock(inv,ctx,x,pricing,mode);return x}
function editPayment(inv,ctx,input,{suppliers}){const p=A(inv.supplierPayments).find(x=>x.id===input.id);if(!p)throw Error('پرداخت پیدا نشد');if(p.status==='void')throw Error('پرداخت باطل‌شده قابل ویرایش نیست');if(p.source==='quickInvoiceForm'&&S(input.invoiceId)!==S(p.invoiceId))throw Error('پرداخت فاکتور سریع به فاکتور خودش وصل می‌ماند');
 const probe={...inv,supplierPayments:A(inv.supplierPayments).filter(x=>x.id!==p.id)},tmp={...ctx},row=addPayment(probe,tmp,input,{suppliers});ctx.auditExtra={entityId:p.id,before:clone(p)};
 const keep={id:p.id,requestId:p.requestId,source:p.source,createdAt:p.createdAt,createdBy:p.createdBy};Object.keys(p).forEach(k=>{if(!(k in keep))delete p[k]});Object.assign(p,row,keep,{status:'posted',updatedAt:ctx.at,updatedBy:ctx.actor});return p}
const ORDER_STATUS=['پیش‌نویس','ثبت‌شده','ارسال‌شده'],TRACK_STATUS=['ثبت‌شده','تأیید تأمین‌کننده','ارسال‌شده','تحویل‌شده','لغوشده'];
function addOrder(sup,ctx,{supplierId,number,date,eta,status,lines,notes},{pricing}){const s=A(sup.suppliers).find(x=>x.id===S(supplierId));date=D(date);eta=D(eta);if(!s)throw Error('تأمین‌کننده را انتخاب کنید');assertDate(date,'تاریخ سفارش');assertDate(eta,'تاریخ تحویل مورد انتظار');if(eta<date)throw Error('تاریخ تحویل نمی‌تواند قبل از تاریخ سفارش باشد');
 const rows=buildLines(pricing,sup,s.id,lines,false);if(!rows.length)throw Error('حداقل یک ردیف لازم است');sup.purchaseRequests=A(sup.purchaseRequests);
 const row={id:`PO-${ctx.reqId}`,orderNumber:S(number)||`PO-${ctx.reqId}`,date,expectedDeliveryDate:eta,supplierId:s.id,supplierCode:s.code,supplierNameSnapshot:supplierName(s),status:ORDER_STATUS.includes(status)?status:'ثبت‌شده',lines:rows,notes:S(notes),isArchived:false,...(ctx.staff?{requestedByPersonnelId:ctx.staff.personnelId,requestedByName:ctx.staff.name,createdByPersonnelId:ctx.staff.personnelId}:{}),createdAt:ctx.at,createdBy:ctx.actor,updatedAt:ctx.at,updatedBy:ctx.actor,source:'ui-template'};
 sup.purchaseRequests.unshift(row);ctx.auditExtra={entityId:row.id,lines:rows.length};return row}
function trackOrder(sup,ctx,{id,status,eta,actual,reference,notes}){const x=A(sup.purchaseRequests).find(r=>r.id===id);if(!x)throw Error('سفارش پیدا نشد');if(!TRACK_STATUS.includes(status))throw Error('وضعیت نامعتبر است');const ad=D(actual);if(status==='تحویل‌شده'){assertDate(ad,'تاریخ تحویل واقعی')}if(status==='لغوشده'&&!S(notes))throw Error('علت لغو را در توضیح بنویسید');
 ctx.auditExtra={entityId:id,before:{status:x.status,expectedDeliveryDate:x.expectedDeliveryDate,actualDeliveryDate:x.actualDeliveryDate}};Object.assign(x,{status,expectedDeliveryDate:D(eta)||x.expectedDeliveryDate,actualDeliveryDate:ad||'',reference:S(reference),followupNotes:S(notes),updatedAt:ctx.at,updatedBy:ctx.actor});return x}


/* ---------- supplier definition and supplier items (migration stage 2) ----------
   Same shape as js/30 editSupplierP8Fixed (suppliers.suppliers) and js/43 saveRelation (suppliers.supplierItems keyed by
   supplierCode + ingredientId). The code of an existing supplier never changes (relations use it); names are unique;
   mobile, card and IBAN are checked; bank fields left undefined keep their stored value. A relation that is unticked is
   set «غیرفعال», never removed. The legacy mirror suppliers.items is not written. */
const SUP_FIELDS=['company','contactName','mobile','phone','mainGroup','status','invoiceType','orderMethod','orderOwner','settlementMethod','settlementDays','minimumOrderToman','preferredChannel','email','communicationAddress','bestCallTime','bankName','accountNumber','cardNumber','iban','deliveryTerms','deliveryArea','qualityRating','priceRating','punctualityRating','purchaseGroupsSummary','purchaseItemsSummary','notes','lastReviewDate','orderDays','deliveryDays','orderTimeWindow','deliveryTimeWindow'];
const CHANNELS=[['hasPhoneCall','تماس تلفنی'],['hasWhatsapp','واتس‌اپ'],['hasTelegram','تلگرام'],['hasBale','بله']];
const uid=(prefix,rows)=>{let m=0;A(rows).forEach(x=>{const q=S(x.id).match(/(\d+)$/);if(q)m=Math.max(m,+q[1])});return `${prefix}-${String(m+1).padStart(4,'0')}`};
const latin=v=>S(v).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d));
function nextSupplierCode(doc){let m=0;A(doc.suppliers).forEach(s=>{const q=S(s.code).match(/(\d+)$/);if(q)m=Math.max(m,+q[1])});return `SUP-${String(m+1).padStart(3,'0')}`}
function supplierNameDuplicate(doc,{id,company,contactName}){const k=normalizeName(company||contactName);return k?A(doc.suppliers).find(s=>s.id!==id&&normalizeName(s.company||s.contactName)===k)||null:null}
function saveSupplier(doc,ctx,x){
 const rows=A(doc.suppliers),old=x.id?rows.find(s=>s.id===x.id):null;if(x.id&&!old)throw Error('تأمین‌کننده پیدا نشد');
 if(!S(x.company)&&!S(x.contactName))throw Error('نام شرکت/فروشگاه یا نام رابط الزامی است');
 const dup=supplierNameDuplicate(doc,x);if(dup)throw Error(`«${supplierName(dup)}» (${dup.code}) قبلاً تعریف شده است`);
 if(old&&S(x.code)&&S(x.code)!==S(old.code))throw Error('کد تأمین‌کنندهٔ ثبت‌شده تغییر نمی‌کند');
 const patch={};for(const k of SUP_FIELDS)if(x[k]!==undefined)patch[k]=Array.isArray(x[k])?x[k].map(S).filter(Boolean):S(x[k]);
 const mob=latin(patch.mobile??old?.mobile??'').replace(/[\s-]/g,'');if(patch.mobile!==undefined){if(mob&&!/^09\d{9}$/.test(mob))throw Error('موبایل باید ۱۱ رقم و با ۰۹ شروع شود');patch.mobile=mob}
 if(patch.phone!==undefined)patch.phone=latin(patch.phone);
 if(patch.cardNumber!==undefined){const c=latin(patch.cardNumber).replace(/[\s-]/g,'');if(c&&!/^\d{16}$/.test(c))throw Error('شماره کارت باید ۱۶ رقم باشد');patch.cardNumber=c}
 if(patch.iban!==undefined){let b=latin(patch.iban).replace(/[\s-]/g,'').toUpperCase();if(/^\d{24}$/.test(b))b='IR'+b;if(b&&!/^IR\d{24}$/.test(b))throw Error('شبا باید IR و ۲۴ رقم باشد');patch.iban=b}
 if(patch.accountNumber!==undefined)patch.accountNumber=latin(patch.accountNumber).replace(/\s/g,'');
 for(const k of ['settlementDays','minimumOrderToman'])if(patch[k]!==undefined){if(patch[k]===''){continue}const n=NUM(patch[k]);if(!(n>=0))throw Error(k==='settlementDays'?'مهلت تسویه باید عدد باشد':'حداقل سفارش باید عدد باشد');patch[k]=n}
 if(patch.lastReviewDate){const d=window.InvEngine.D(patch.lastReviewDate);if(!d)throw Error('تاریخ آخرین بازبینی معتبر نیست');patch.lastReviewDate=d}
 if(Array.isArray(x.channels))for(const [k] of CHANNELS)patch[k]=x.channels.includes(k)?'بله':'خیر';
 patch.status=patch.status==='غیرفعال'?'غیرفعال':(patch.status||old?.status||'فعال');
 const before=old?clone(old):null,row=old||{id:uid('SUP',rows),createdAt:ctx.at,code:nextSupplierCode(doc),invoiceType:'نامشخص'};
 Object.assign(row,patch,{updatedAt:ctx.at});if(!old)doc.suppliers=[...rows,row];
 ctx.auditExtra={entityId:row.id,before};return{id:row.id,code:row.code,created:!old}}
/* suppliers from Excel (js/19 importSuppliersExcel columns): header found in the first 25 rows of any sheet; a row
   matches a supplier by code, else by name; only the cells that have a value change the supplier (an empty cell keeps
   the stored value); a new supplier gets the next code (a code in the file is not taken over); bank details are not
   read. Returns the plan; applySupplierRows saves it through saveSupplier (same checks as the form). */
const SX_COLS={code:['کد','کد تامین کننده','کد تأمین‌کننده'],company:['نام تامین کننده','نام تأمین‌کننده','شرکت','نام شرکت'],contactName:['مسئول','نام تماس','نام رابط'],phone:['تلفن','موبایل','شماره تماس'],mainGroup:['دسته بندی','گروه'],orderDays:['روزهای سفارش‌گیری','روزهای سفارش گیری','روز سفارش'],orderTimeWindow:['ساعت سفارش‌گیری','ساعت سفارش گیری','زمان سفارش'],deliveryDays:['روزهای ارسال','روز ارسال'],deliveryTimeWindow:['ساعت ارسال','زمان ارسال'],notes:['توضیحات']};
const sxH=s=>normalizeName(s).replace(/\s/g,'');
function parseSupplierSheets(sheets,doc){let best=null;
 for(const [sheet,rows] of A(sheets))for(let r=0;r<Math.min(A(rows).length,25);r++){const h=A(rows[r]).map(sxH),map={};for(const [k,al] of Object.entries(SX_COLS)){const as=al.map(sxH);map[k]=h.findIndex(x=>x&&as.includes(x));if(map[k]<0)map[k]=h.findIndex(x=>x&&as.some(a=>a.length>2&&x.includes(a)))}
  const score=(map.company>=0?4:0)+Object.values(map).filter(i=>i>=0).length;if(!best||score>best.score)best={sheet,rows,r,map,score}}
 if(!best||best.map.company<0)throw Error('ستون «نام تأمین‌کننده» در فایل پیدا نشد');
 const list=A(doc.suppliers),out={sheet:best.sheet,rows:[],skipped:0},seen=new Set,days=v=>S(v).split(/[،,|\n]+/).map(S).filter(Boolean);
 for(const row of best.rows.slice(best.r+1)){const g=k=>best.map[k]>=0?S(row[best.map[k]]):'',company=g('company'),code=g('code');if(!company){if(row.some(v=>S(v)))out.skipped++;continue}
  const s=list.find(x=>code&&S(x.code)===code)||list.find(x=>normalizeName(x.company||x.contactName)===normalizeName(company));const key=s?s.id:'new:'+normalizeName(company);if(seen.has(key)){out.skipped++;continue}seen.add(key);
  const x={company};for(const k of ['contactName','mainGroup','orderTimeWindow','deliveryTimeWindow','notes'])if(g(k))x[k]=g(k);for(const k of ['orderDays','deliveryDays'])if(g(k))x[k]=days(g(k));
  const ph=latin(g('phone')).replace(/[\s-]/g,'');if(ph){if(/^09\d{9}$/.test(ph))x.mobile=ph;else x.phone=ph}
  const changes=s?Object.keys(x).filter(k=>JSON.stringify(Array.isArray(x[k])?x[k]:S(x[k]))!==JSON.stringify(Array.isArray(s[k])?A(s[k]).map(S):S(s[k]))):Object.keys(x);
  if(s&&!changes.length)continue;out.rows.push({id:s?.id||'',code:s?.code||'',fileCode:code,company,patch:x,changes,created:!s})}
 return out}
function applySupplierRows(doc,ctx,rows){const done=[];for(const r of A(rows)){const one={...ctx,auditExtra:null};const res=saveSupplier(doc,one,{...r.patch,id:r.id||undefined});done.push({...res,company:r.company})}
 ctx.auditExtra={source:'excel',added:done.filter(x=>x.created).map(x=>x.code),updated:done.filter(x=>!x.created).map(x=>x.code)};return done}
/* reference lists of the supplier form (suppliers.lists; js/04 «فهرست‌های مرجع»); fixed lists (وضعیت، بله/خیر، روزها) stay */
const SUP_LISTS=[['supplierGroups','گروه‌های تأمین‌کننده'],['itemGroups','گروه‌های کالا'],['invoiceTypes','نوع فاکتور'],['orderMethods','روش سفارش'],['orderOwners','مسئول سفارش'],['settlementMethods','روش تسویه'],['communicationChannels','کانال‌های ارتباط'],['ratings','امتیازها'],['units','واحدها'],['usageLocations','محل مصرف']];
function saveSupplierLists(doc,ctx,{lists}){doc.lists=doc.lists&&typeof doc.lists==='object'?doc.lists:{};const before={};
 for(const [k,l] of SUP_LISTS)if(lists&&lists[k]!==undefined){const v=[...new Set(A(lists[k]).map(S).filter(Boolean))];if(!v.length)throw Error(`«${l}» حداقل یک مورد لازم دارد`);before[k]=A(doc.lists[k]);doc.lists[k]=v}
 ctx.auditExtra={before};return Object.keys(before).length}
function archiveSupplier(doc,ctx,{id,archived}){const s=A(doc.suppliers).find(x=>x.id===id);if(!s)throw Error('تأمین‌کننده پیدا نشد');ctx.auditExtra={entityId:id,before:clone(s)};
 if(archived)Object.assign(s,{status:'غیرفعال',isArchived:true,archivedAt:ctx.at,archivedReason:'آرشیو با اقدام مدیر'});else Object.assign(s,{status:'فعال',isArchived:false,restoredAt:ctx.at});s.updatedAt=ctx.at;return archived}
// js/43 ingredientForRelation: a relation names the ingredient by id, or (older rows) by its code
const relIngredient=(r,ings)=>ings.find(i=>i.id===r.ingredientId)||ings.find(i=>S(i.code)&&S(i.code)===S(r.itemCode))||null;
function supplierItems(doc,supplierId,pricing){const s=A(doc.suppliers).find(x=>x.id===supplierId),ings=A(pricing?.ingredients);if(!s)return[];return A(doc.supplierItems).filter(r=>r.supplierCode===s.code&&r.status!=='غیرفعال').map(r=>({r,i:relIngredient(r,ings)}))}
function saveSupplierItems(doc,ctx,{supplierId,ingredientIds,primaryIds},{pricing}){
 const s=A(doc.suppliers).find(x=>x.id===supplierId);if(!s)throw Error('تأمین‌کننده پیدا نشد');const ings=A(pricing?.ingredients),want=new Set(A(ingredientIds)),prim=new Set(A(primaryIds).filter(id=>want.has(id)));
 for(const id of want)if(!ings.some(i=>i.id===id))throw Error('قلم انتخاب‌شده در کاتالوگ نیست');
 doc.supplierItems=A(doc.supplierItems);const mine=doc.supplierItems.filter(r=>r.supplierCode===s.code),byIng=new Map;for(const r of mine){const i=relIngredient(r,ings);if(i&&!byIng.has(i.id))byIng.set(i.id,r)}
 let added=0,removed=0,n=0;const stamp=Date.now();
 for(const id of want){const i=ings.find(x=>x.id===id),r=byIng.get(id),isPrimary=prim.has(id)?'بله':'خیر';
  if(r){if(r.status==='غیرفعال'||r.isPrimary!==isPrimary||r.ingredientId!==id)Object.assign(r,{status:'فعال',isPrimary,ingredientId:id,updatedAt:ctx.at,updatedBy:ctx.actor})}
  else{doc.supplierItems.push({id:`REL-${stamp}-${++n}`,supplierCode:s.code,ingredientId:id,itemCode:i.code,itemCodeSnapshot:i.code,itemNameSnapshot:i.name,isPrimary,status:'فعال',createdAt:ctx.at,updatedAt:ctx.at,updatedBy:ctx.actor});added++}}
 for(const [id,r] of byIng)if(!want.has(id)&&r.status!=='غیرفعال'){Object.assign(r,{status:'غیرفعال',isPrimary:'خیر',updatedAt:ctx.at,updatedBy:ctx.actor});removed++}
 // one primary supplier per item: marking it here clears the flag on the other suppliers of the same item
 for(const id of prim)for(const r of doc.supplierItems)if(r.supplierCode!==s.code&&r.isPrimary==='بله'&&relIngredient(r,ings)?.id===id){r.isPrimary='خیر';r.updatedAt=ctx.at}
 ctx.auditExtra={supplierId,added,removed,total:want.size};return{added,removed,total:want.size}}

window.PurchaseWrite={stockPlan,dueDate,STOCK_MODES,purchaseTree,debtSeries,SUP_LISTS,saveSupplierLists,parseSupplierSheets,applySupplierRows,SUP_FIELDS,CHANNELS,nextSupplierCode,supplierNameDuplicate,saveSupplier,archiveSupplier,supplierItems,saveSupplierItems,editInvoice,editPayment,addOrder,trackOrder,ORDER_STATUS,TRACK_STATUS,DEBT_TYPES,rawAccountPosition,closedPeriodOn,addDirectDebt,voidDirectDebt,paymentDirections,paymentSign,invoiceRemaining,addPayment,voidPayment,PAYMENT_METHODS,normalizeName,supplierName,isFinal,invoiceTotal,invoicePaid,supplierAccount,paymentLocations,procurementCatalog,previousPackPrice,buildLines,addInvoice,addQuickInvoice,nearDuplicate,syncInvoicePrices,markPricing,voidInvoice,NUM};
})();
