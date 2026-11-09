/* Rayo new panel — finance ledger (migration stage 7a). Same shapes as the current panel's js/20 (finance module):
     entries      {id FIN-#####, date, type expense|income, category, amountToman, title, notes, expenseMonth YYYY/MM,
                   spreadMonths, paymentStatus paid|unpaid, accountKey, accountId, accountNameSnapshot, linkedObligationId,
                   status active|void, voidReason, createdAt, createdBy}
     parties      {id PTY-###, name, status active, createdAt}
     obligations  {id OBL-#####, direction payable|receivable, title, partySource finance, partyId, partyNameSnapshot,
                   category, amountToman, date, dueDate, description, reference, period, entryType normal, sourceExpenseId,
                   status active|void}
     settlements  {id SET-#####, requestId, obligationId, direction payment|receipt, date, amountToman, accountKey,
                   reference, method, notes, sourceCheckId, status active|void}
     checks       {id CHK-#####, obligationId, type issued|received, number, bank, amountToman, issueDate, dueDate,
                   status pending|cleared|returned|void, clearedDate, settlementId, notes}
   Owner decisions (2026-11-09): an expense counts in its own month (optionally spread over months); «بعداً پرداخت»
   makes a payable; supplier debts stay in purchases (shown, not copied); nothing is edited or deleted — a wrong record
   is voided with a reason and recorded again. Sales include VAT (10%); a 2.5% performance-tax reserve. */
(function(){
'use strict';
const A=x=>Array.isArray(x)?x:[],S=x=>String(x??'').trim(),pad=n=>String(n).padStart(2,'0');
const latin=v=>String(v??'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d));
const N=v=>{if(typeof v==='number')return Number.isFinite(v)?v:0;const x=Number(latin(v).replace(/[٬,\s]/g,'').replace(/٫/g,'.'));return Number.isFinite(x)?x:0};
const D=s=>{const q=latin(s).trim().match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);return q&&+q[2]>=1&&+q[2]<=12&&+q[3]>=1&&+q[3]<=31?`${q[1]}/${pad(q[2])}/${pad(q[3])}`:''};
const YM=s=>{const q=latin(s).trim().match(/^(\d{4})\/(\d{1,2})$/);return q&&+q[2]>=1&&+q[2]<=12?`${q[1]}/${pad(q[2])}`:''};
const active=x=>!!x&&!['void','ابطال‌شده','لغوشده'].includes(S(x.status));
const uid=(prefix,arr,w=5)=>{let m=0;A(arr).forEach(x=>{const q=S(x.id).match(/(\d+)$/);if(q)m=Math.max(m,+q[1])});return`${prefix}-${String(m+1).padStart(w,'0')}`};
const norm=s=>S(s).replace(/\s+/g,' ').replace(/ي/g,'ی').replace(/ك/g,'ک');
const DEF={expenseCategories:['آب','برق','گاز','اجاره','شهرداری','جریمه','بیمه','پیک و آژانس','تعمیر و نگهداری','مواد مصرفی','خدمات','غذای پرسنل','سایر'],incomeCategories:['سایر درآمد'],obligationCategories:['مالیات','اجاره','خرید','خدمات','شخص یا شرکت','وام','سایر']};
const STAFF_MEAL='غذای پرسنل';
function ensure(fin){fin.settings=fin.settings&&typeof fin.settings==='object'?fin.settings:{};for(const k of ['entries','parties','obligations','settlements','checks'])fin[k]=A(fin[k]);return fin}
function config(fin){const s=fin?.settings||{},list=(k)=>A(s[k]).map(S).filter(Boolean).length?A(s[k]).map(S).filter(Boolean):DEF[k].slice();
 const exp=list('expenseCategories');if(!exp.includes(STAFF_MEAL))exp.push(STAFF_MEAL);
 return{expenseCategories:exp,incomeCategories:list('incomeCategories'),obligationCategories:list('obligationCategories'),vatPercent:s.vatPercent===undefined||s.vatPercent===''?10:Math.max(0,N(s.vatPercent)),vatIncluded:s.vatIncludedInSales!==false,performanceReservePercent:s.performanceTaxPercent===undefined||s.performanceTaxPercent===''?2.5:Math.max(0,N(s.performanceTaxPercent))}}
const reqDate=(d,what='تاریخ')=>{const x=D(d);if(!x)throw Error(what+' معتبر نیست');return x};
const today=()=>window.InvEngine?.CAL?.today||'';
/* ---------- obligations ---------- */
function calcObligation(fin,o){const settled=A(fin.settlements).filter(x=>x.obligationId===o.id&&active(x)).reduce((a,x)=>a+N(x.amountToman),0),balance=Math.max(0,N(o.amountToman)-settled),pendingChecks=A(fin.checks).filter(x=>x.obligationId===o.id&&active(x)&&x.status==='pending').reduce((a,x)=>a+N(x.amountToman),0);
 return{amount:N(o.amountToman),settled,balance,pendingChecks,uncovered:Math.max(0,balance-pendingChecks),status:balance<=0.5?'settled':settled>0?'partial':'open'}}
function partyFor(fin,ctx,{partyId,partyName}){if(S(partyId)){const p=A(fin.parties).find(x=>x.id===S(partyId)&&active(x));if(!p)throw Error('طرف حساب پیدا نشد');return p}const n=norm(partyName);if(!n)throw Error('طرف حساب را انتخاب یا نام تازه را وارد کنید');let p=A(fin.parties).find(x=>active(x)&&norm(x.name)===n);if(!p){p={id:uid('PTY',fin.parties,3),name:n,status:'active',createdAt:ctx.at,createdBy:ctx.actor};fin.parties.push(p)}return p}
function addObligation(fin,ctx,x){ensure(fin);const cfg=config(fin),direction=x.direction==='receivable'?'receivable':'payable',amount=Math.round(N(x.amountToman)),date=reqDate(x.date),due=S(x.dueDate)?reqDate(x.dueDate,'تاریخ سررسید'):'';
 if(!S(x.title))throw Error('عنوان لازم است');if(!(amount>0))throw Error('مبلغ باید بیشتر از صفر باشد');const category=S(x.category);if(!category)throw Error('دسته را انتخاب کنید');if(due&&due<date)throw Error('سررسید قبل از تاریخ سند است');
 const p=partyFor(fin,ctx,x);if(!cfg.obligationCategories.includes(category)){fin.settings.obligationCategories=[...cfg.obligationCategories,category]}
 const o={id:uid('OBL',fin.obligations),direction,title:S(x.title),partySource:'finance',partyId:p.id,partyNameSnapshot:p.name,category,amountToman:amount,date,dueDate:due,description:S(x.description),reference:S(x.reference),period:YM(x.period)||date.slice(0,7),entryType:'normal',status:'active',createdAt:ctx.at,createdBy:ctx.actor};
 fin.obligations.push(o);ctx.auditExtra={entityId:o.id,direction,amount};return o}
function voidObligation(fin,ctx,{id,reason}){const o=A(fin.obligations).find(x=>x.id===id);if(!o||!active(o))throw Error('سند پیدا نشد یا قبلاً ابطال شده');if(o.sourceExpenseId)throw Error('این بدهی از ثبت هزینه ساخته شده؛ خود هزینه را ابطال کنید');if(!S(reason))throw Error('علت ابطال لازم است');
 if(A(fin.settlements).some(s=>s.obligationId===id&&active(s))||A(fin.checks).some(c=>c.obligationId===id&&active(c)&&c.status!=='returned'))throw Error('اول پرداخت‌ها و چک‌های این سند را ابطال کنید');
 Object.assign(o,{status:'void',voidReason:S(reason),voidedAt:ctx.at,voidedBy:ctx.actor});ctx.auditExtra={entityId:id,reason:S(reason)};return o}
function addSettlement(fin,ctx,x){ensure(fin);const o=A(fin.obligations).find(y=>y.id===x.obligationId&&active(y));if(!o)throw Error('سند پیدا نشد');const c=calcObligation(fin,o),amount=Math.round(N(x.amountToman)),date=reqDate(x.date);
 if(!(amount>0))throw Error('مبلغ باید بیشتر از صفر باشد');if(amount>c.balance+0.5)throw Error(`مبلغ از ماندهٔ سند (${Math.round(c.balance).toLocaleString('fa-IR')}) بیشتر است`);if(!S(x.accountKey))throw Error('حساب یا محل پرداخت را انتخاب کنید');if(today()&&date>today())throw Error('تاریخ بعد از امروز است');
 if(S(x.reference)&&A(fin.settlements).some(s=>active(s)&&s.accountKey===S(x.accountKey)&&S(s.reference)===S(x.reference)))throw Error('این شمارهٔ پیگیری برای همین حساب قبلاً ثبت شده است');
 const s={id:uid('SET',fin.settlements),requestId:S(x.requestId)||('SETREQ-'+ctx.at),obligationId:o.id,direction:o.direction==='payable'?'payment':'receipt',date,amountToman:amount,accountKey:S(x.accountKey),reference:S(x.reference),method:S(x.method),notes:S(x.notes),status:'active',createdAt:ctx.at,createdBy:ctx.actor};
 fin.settlements.push(s);ctx.auditExtra={entityId:s.id,obligationId:o.id,amount};return s}
function voidSettlement(fin,ctx,{id,reason}){const s=A(fin.settlements).find(x=>x.id===id);if(!s||!active(s))throw Error('پرداخت پیدا نشد یا قبلاً ابطال شده');if(s.sourceCheckId)throw Error('این پرداخت از پاس شدن چک است؛ چک را «برگشتی» ثبت کنید');if(!S(reason))throw Error('علت ابطال لازم است');
 Object.assign(s,{status:'void',voidReason:S(reason),voidedAt:ctx.at,voidedBy:ctx.actor});ctx.auditExtra={entityId:id,reason:S(reason)};return s}
/* ---------- checks ---------- */
function addCheck(fin,ctx,x){ensure(fin);const o=A(fin.obligations).find(y=>y.id===x.obligationId&&active(y));if(!o)throw Error('سند پیدا نشد');const c=calcObligation(fin,o),amount=Math.round(N(x.amountToman)),issue=reqDate(x.issueDate,'تاریخ صدور'),due=reqDate(x.dueDate,'تاریخ سررسید');
 if(!S(x.number))throw Error('شمارهٔ چک لازم است');if(!(amount>0))throw Error('مبلغ باید بیشتر از صفر باشد');if(amount>c.uncovered+0.5)throw Error(`مبلغ از بخش بدون پوشش سند (${Math.round(c.uncovered).toLocaleString('fa-IR')}) بیشتر است`);if(due<issue)throw Error('سررسید قبل از تاریخ صدور است');
 const type=o.direction==='payable'?'issued':'received';if(A(fin.checks).some(k=>active(k)&&k.type===type&&S(k.number)===S(x.number)&&S(k.bank)===S(x.bank)))throw Error('چکی با همین شماره و بانک ثبت شده است');
 const k={id:uid('CHK',fin.checks),obligationId:o.id,type,number:S(x.number),bank:S(x.bank),amountToman:amount,issueDate:issue,dueDate:due,partySource:o.partySource,partyId:o.partyId,partyNameSnapshot:o.partyNameSnapshot,status:'pending',notes:S(x.notes),createdAt:ctx.at,createdBy:ctx.actor};
 fin.checks.push(k);ctx.auditExtra={entityId:k.id,obligationId:o.id,amount};return k}
function clearCheck(fin,ctx,{id,date,accountKey}){const k=A(fin.checks).find(x=>x.id===id);if(!k||k.status!=='pending')throw Error('فقط چک در انتظار پاس/وصول می‌شود');const o=A(fin.obligations).find(x=>x.id===k.obligationId&&active(x));if(!o)throw Error('سند چک پیدا نشد');const d=reqDate(date);if(!S(accountKey))throw Error('حساب را انتخاب کنید');
 if(N(k.amountToman)>calcObligation(fin,o).balance+0.5)throw Error('مبلغ چک از ماندهٔ سند بیشتر است');
 const s={id:uid('SET',fin.settlements),requestId:'CHECK-'+id,sourceCheckId:id,obligationId:o.id,direction:o.direction==='payable'?'payment':'receipt',date:d,amountToman:N(k.amountToman),accountKey:S(accountKey),reference:`CHECK:${id}:${k.number}`,method:'چک',notes:`${k.type==='issued'?'پاس':'وصول'} چک ${k.number}`,status:'active',createdAt:ctx.at,createdBy:ctx.actor};
 fin.settlements=A(fin.settlements);fin.settlements.push(s);Object.assign(k,{status:'cleared',clearedDate:d,settlementId:s.id,updatedAt:ctx.at});ctx.auditExtra={entityId:id,settlement:s.id};return k}
function returnCheck(fin,ctx,{id,reason}){const k=A(fin.checks).find(x=>x.id===id);if(!k||!['pending','cleared'].includes(k.status))throw Error('این چک برگشت نمی‌خورد');if(!S(reason))throw Error('علت برگشت لازم است');
 if(k.status==='cleared'){const s=A(fin.settlements).find(x=>x.id===k.settlementId);if(s&&active(s))Object.assign(s,{status:'void',voidReason:'برگشت چک '+k.number,voidedAt:ctx.at,voidedBy:ctx.actor})}
 Object.assign(k,{status:'returned',returnReason:S(reason),returnedAt:ctx.at,returnedBy:ctx.actor});ctx.auditExtra={entityId:id,reason:S(reason)};return k}
function voidCheck(fin,ctx,{id,reason}){const k=A(fin.checks).find(x=>x.id===id);if(!k||k.status!=='pending')throw Error('فقط چک در انتظار باطل می‌شود');if(!S(reason))throw Error('علت لازم است');Object.assign(k,{status:'void',voidReason:S(reason),voidedAt:ctx.at,voidedBy:ctx.actor});ctx.auditExtra={entityId:id};return k}
/* ---------- expense / income documents ---------- */
const spreadOf=e=>e.type==='expense'?Math.max(1,Math.min(60,Math.round(N(e.spreadMonths))||1)):1;
const monthIdx=k=>{const [y,m]=k.split('/').map(Number);return y*12+m-1};
function entryShare(e,ym){const start=e.type==='expense'?(YM(e.expenseMonth)||D(e.date).slice(0,7)):D(e.date).slice(0,7);if(!start||!ym)return 0;const off=monthIdx(ym)-monthIdx(start),n=spreadOf(e);return off>=0&&off<n?N(e.amountToman)/n:0}
/* documents of this ledger (not cash-custody rows, not opening/tax rows of js/20) */
const isDoc=e=>['income','expense'].includes(e?.type)&&!e.custodyKind&&e.entryType!=='opening'&&!e.obligationId&&!e.sourcePaymentId;
function addEntry(fin,ctx,x,{accountName=''}={}){ensure(fin);const cfg=config(fin),type=x.type==='income'?'income':'expense',date=reqDate(x.date),amount=Math.round(N(x.amountToman)),category=S(x.category);
 if(!(amount>0))throw Error('مبلغ باید بیشتر از صفر باشد');if(!category)throw Error('دسته را انتخاب کنید');if(today()&&date>today())throw Error('تاریخ بعد از امروز است');
 const listKey=type==='income'?'incomeCategories':'expenseCategories';if(!A(fin.settings[listKey]).includes(category))fin.settings[listKey]=[...new Set([...cfg[listKey],category])];
 const unpaid=type==='expense'&&x.paid===false;if(!unpaid&&!S(x.accountKey))throw Error(type==='income'?'حسابی را که پول به آن رسیده انتخاب کنید':'حساب پرداخت را انتخاب کنید؛ اگر هنوز پرداخت نشده «بعداً پرداخت می‌شود» را بزنید');
 const e={id:uid('FIN',fin.entries),date,type,category,amountToman:amount,title:S(x.title),notes:S(x.notes),status:'active',createdAt:ctx.at,createdBy:ctx.actor};
 if(type==='expense'){const em=YM(x.expenseMonth)||date.slice(0,7),n=Math.round(N(x.spreadMonths))||1;if(n<1||n>60)throw Error('تقسیم روی ۱ تا ۶۰ ماه');Object.assign(e,{expenseMonth:em,spreadMonths:n,paymentStatus:unpaid?'unpaid':'paid'})}
 if(!unpaid){const k=S(x.accountKey);Object.assign(e,{accountKey:k,accountId:k.startsWith('account:')?k.slice(8):'',accountNameSnapshot:S(accountName)})}
 fin.entries.push(e);
 if(unpaid){const due=S(x.dueDate)?reqDate(x.dueDate,'تاریخ سررسید'):'';const p=partyFor(fin,ctx,{partyId:x.partyId,partyName:S(x.partyName)||category});
  const o={id:uid('OBL',fin.obligations),direction:'payable',title:e.title||category,partySource:'finance',partyId:p.id,partyNameSnapshot:p.name,category:cfg.obligationCategories.includes(category)?category:'خدمات',amountToman:amount,date,dueDate:due,description:`ساخته‌شده از هزینهٔ ${e.id}`,reference:'',period:e.expenseMonth,entryType:'normal',sourceExpenseId:e.id,status:'active',createdAt:ctx.at,createdBy:ctx.actor};fin.obligations.push(o);e.linkedObligationId=o.id}
 ctx.auditExtra={entityId:e.id,type,amount,category};return e}
function voidEntry(fin,ctx,{id,reason}){const e=A(fin.entries).find(x=>x.id===id);if(!e||!active(e)||!isDoc(e))throw Error('سند پیدا نشد یا قبلاً ابطال شده');if(!S(reason))throw Error('علت ابطال لازم است');
 const o=e.linkedObligationId?A(fin.obligations).find(x=>x.id===e.linkedObligationId&&active(x)):null;if(o&&(A(fin.settlements).some(s=>s.obligationId===o.id&&active(s))||A(fin.checks).some(c=>c.obligationId===o.id&&active(c)&&c.status!=='returned')))throw Error('برای این هزینه پرداخت یا چک ثبت شده؛ اول آن را ابطال کنید');
 Object.assign(e,{status:'void',voidReason:S(reason),voidedAt:ctx.at,voidedBy:ctx.actor});if(o)Object.assign(o,{status:'void',voidReason:'ابطال هزینه '+e.id,voidedAt:ctx.at,voidedBy:ctx.actor});ctx.auditExtra={entityId:id,reason:S(reason)};return e}
function payState(fin,e){if(e.paymentStatus!=='unpaid')return{label:'پرداخت‌شده',balance:0};const o=A(fin.obligations).find(x=>x.id===e.linkedObligationId);if(!o||!active(o))return{label:'بدهی پیدا نشد',balance:0};const c=calcObligation(fin,o);return{label:c.balance<=0.5?'پرداخت‌شده':c.settled>0?'پرداخت جزئی':'پرداخت‌نشده',balance:c.balance,obligationId:o.id}}
function monthEntries(fin,ym){return A(fin?.entries).filter(e=>active(e)&&isDoc(e)).map(e=>({...e,share:entryShare(e,ym)})).filter(e=>e.share)}
/* ---------- due list: open obligations and pending checks by due date ---------- */
function dueList(fin,todayKey){const out=[];for(const o of A(fin?.obligations).filter(active)){const c=calcObligation(fin,o);if(c.balance<=0.5)continue;out.push({kind:'obligation',id:o.id,direction:o.direction,title:o.title,party:o.partyNameSnapshot,due:o.dueDate||'',amount:c.balance,uncovered:c.uncovered,overdue:!!o.dueDate&&o.dueDate<todayKey})}
 for(const k of A(fin?.checks).filter(x=>x.status==='pending'))out.push({kind:'check',id:k.id,direction:k.type==='issued'?'payable':'receivable',title:`چک ${k.number}${k.bank?' — '+k.bank:''}`,party:k.partyNameSnapshot||'',due:k.dueDate,amount:N(k.amountToman),overdue:k.dueDate<todayKey});
 return out.sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999'))}
/* ---------- settings ---------- */
function saveSettings(fin,ctx,x){ensure(fin);const clean=l=>[...new Set(A(l).map(norm).filter(Boolean))];const exp=clean(x.expenseCategories),inc=clean(x.incomeCategories),obl=clean(x.obligationCategories);
 if(!exp.length||!inc.length||!obl.length)throw Error('هر فهرست دسته حداقل یک مورد لازم دارد');const vat=N(x.vatPercent),res=N(x.performanceReservePercent);if(!(vat>=0&&vat<=30))throw Error('درصد ارزش افزوده بین ۰ و ۳۰');if(!(res>=0&&res<=20))throw Error('درصد ذخیرهٔ مالیات عملکرد بین ۰ و ۲۰');
 const used=k=>new Set(A(fin.entries).filter(e=>active(e)&&isDoc(e)&&(k==='income'?e.type==='income':e.type==='expense')).map(e=>e.category));for(const c of used('expense'))if(!exp.includes(c))exp.push(c);for(const c of used('income'))if(!inc.includes(c))inc.push(c);
 const s=fin.settings,before=JSON.stringify([s.expenseCategories,s.incomeCategories,s.obligationCategories,s.vatPercent,s.vatIncludedInSales,s.performanceTaxPercent]);
 Object.assign(s,{expenseCategories:exp,incomeCategories:inc,obligationCategories:obl,vatPercent:vat,vatIncludedInSales:x.vatIncluded!==false,performanceTaxPercent:res});
 if(JSON.stringify([s.expenseCategories,s.incomeCategories,s.obligationCategories,s.vatPercent,s.vatIncludedInSales,s.performanceTaxPercent])===before)throw Error('تغییری برای ذخیره نیست');ctx.auditExtra={vat,reserve:res};return s}
window.FinanceWrite={DEF,STAFF_MEAL,N,D,YM,active,ensure,config,calcObligation,addObligation,voidObligation,addSettlement,voidSettlement,addCheck,clearCheck,returnCheck,voidCheck,entryShare,isDoc,addEntry,voidEntry,payState,monthEntries,dueList,saveSettings};
})();
