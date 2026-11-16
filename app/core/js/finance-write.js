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
 if(!unpaid){const k=S(x.accountKey);Object.assign(e,{accountKey:k,accountId:k.startsWith('account:')?k.slice(8):'',cashRecipientId:k.startsWith('cash:')?k.slice(5):'',accountNameSnapshot:S(accountName),cashRecipientNameSnapshot:k.startsWith('cash:')?S(accountName):''})}
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
/* ---------- staff meals (stage 7b): portions entered per day (owner: extra portions for managers on some days) ----------
   finance.staffMeals {id SML-#####, date, portions, suggested, notes, status active|void, history[{portions,notes,at,by}]}
   one active row per day; a change keeps the previous value in history; an emptied day is voided. */
const mealRow=(fin,date)=>A(fin?.staffMeals).find(x=>x.date===date&&active(x))||null;
function saveMeals(fin,ctx,{rows,today:t}){fin.staffMeals=A(fin.staffMeals);let n=0;
 for(const [date,r] of Object.entries(rows||{})){const d=reqDate(date);if(t&&d>t)throw Error(d+': روز آینده است');const raw=latin(S(r.portions)).replace(/[٬,\s]/g,''),cur=mealRow(fin,d),notes=S(r.notes),sug=S(r.suggested)===''?'':N(r.suggested);
  if(raw===''){if(cur){Object.assign(cur,{status:'void',voidReason:'خالی شد',voidedAt:ctx.at,voidedBy:ctx.actor});n++}continue}
  const p=Number(raw);if(!Number.isInteger(p)||p<0||p>500)throw Error(d+': تعداد پرس باید عدد صحیح ۰ تا ۵۰۰ باشد');
  if(cur){if(N(cur.portions)===p&&S(cur.notes)===notes)continue;cur.history=A(cur.history);cur.history.push({portions:cur.portions,notes:cur.notes,at:cur.updatedAt||cur.createdAt,by:cur.updatedBy||cur.createdBy});Object.assign(cur,{portions:p,notes,suggested:sug,updatedAt:ctx.at,updatedBy:ctx.actor})}
  else fin.staffMeals.push({id:uid('SML',fin.staffMeals),date:d,portions:p,suggested:sug,notes,status:'active',createdAt:ctx.at,createdBy:ctx.actor});n++}
 if(!n)throw Error('تغییری برای ذخیره نیست');ctx.auditExtra={days:Object.keys(rows||{}).length};return n}
const mealsOfMonth=(fin,ym)=>A(fin?.staffMeals).filter(x=>active(x)&&S(x.date).startsWith(ym+'/'));
/* cost of staff meals in a month: purchases with the «غذای پرسنل» category (their month share) + what was taken from stock
   as staff use (inventory engine, at cost) */
function mealCost(fin,ym,stockUse){const docs=monthEntries(fin,ym).filter(e=>e.type==='expense'&&e.category===STAFF_MEAL).reduce((s,e)=>s+e.share,0),stock=Math.max(0,N(stockUse)),portions=mealsOfMonth(fin,ym).reduce((s,x)=>s+N(x.portions),0),total=docs+stock;
 return{docs,stock,total,portions,days:mealsOfMonth(fin,ym).length,perPortion:portions?total/portions:null}}
/* ---------- other costs of a month outside this ledger ---------- */
function custodyExpenses(fin,ym){return A(fin?.entries).filter(e=>active(e)&&e.custodyKind==='expense'&&D(e.date).startsWith(ym+'/')).reduce((s,e)=>s+N(e.amountToman),0)}
/* approved petty-cash expenses: the part that is not catalog items (items bought are material cost through consumption) */
function pettyExpenses(fin,ym){const cats=A(fin?.settings?.pettyCash?.categories),out=new Map;for(const e of A(fin?.pettyCash?.expenses)){if(!active(e)||e.decision?.status!=='approved'||!D(e.date).startsWith(ym+'/'))continue;const items=A(e.lines).filter(l=>S(l.ingredientId)).reduce((s,l)=>s+N(l.qty)*N(l.unitPrice),0),rest=Math.max(0,N(e.amountToman)-items);if(!rest)continue;const k='تنخواه: '+(cats.find(c=>c.id===e.categoryId)?.name||'سایر');out.set(k,(out.get(k)||0)+rest)}return[...out].map(([category,amount])=>({category,amount}))}
/* ---------- profit and loss of a month (pure) ----------
   x: {grossSales, vatPercent, vatIncluded, reservePercent, otherIncome, material:{std,waste,variance,coverage},
       staffMeal:{total}, payroll:{net,state} | null, expenses:[{category,amount}]} */
function pnl(x){const g=Math.max(0,N(x.grossSales)),v=Math.max(0,N(x.vatPercent)),vat=x.vatIncluded!==false?g*v/(100+v):0,sales=g-vat,mat=x.material||{},flags=[];
 const std=mat.std===null||mat.std===undefined?null:N(mat.std),shortage=N(mat.coverage)>0?-N(mat.variance):0,materials=(std||0)+N(mat.waste)+shortage;
 if(std===null)flags.push('بهای مواد فروش حساب نشد (فایل فروش یا رسپی نیست)');if(!(N(mat.coverage)>0))flags.push('مغایرت انبار حساب نشد (شمارش ابتدا و انتهای ماه نیست)');
 const pay=x.payroll?N(x.payroll.net):0;if(!x.payroll)flags.push('حقوق این ماه در نرم‌افزار حساب نمی‌شود (قبل از شروع حقوق)');else if(x.payroll.state!=='closed')flags.push('حقوق این ماه قطعی نشده؛ عدد حقوق ممکن است تغییر کند');
 const meal=N(x.staffMeal?.total),exp=A(x.expenses).filter(e=>N(e.amount)),expTotal=exp.reduce((s,e)=>s+N(e.amount),0),other=N(x.otherIncome),reserve=sales*Math.max(0,N(x.reservePercent))/100;
 const income=sales+other,costs=materials+meal+pay+expTotal,before=income-costs,profit=before-reserve,pct=a=>sales?a/sales*100:null;
 return{grossSales:g,vat,sales,otherIncome:other,income,materials,materialParts:{std:std||0,waste:N(mat.waste),shortage},staffMeal:meal,payroll:pay,expenses:exp.sort((a,b)=>N(b.amount)-N(a.amount)),expenseTotal:expTotal,costs,beforeReserve:before,reserve,profit,pct,flags}}
/* ---------- accounts (stage 7c): where the money is ----------
   Owner: every card machine goes to one bank account (settings.posAccountKey); card-to-card and cash of the cash report
   go to the cards / people defined in the cash settings. Movements (toman): cash reports (card machines → POS account,
   card-to-card items → their card, cash items → the person), ledger documents paid from an account, cash-custody rows
   (restaurant expense, personal withdrawal, return), payments and receipts of payables / receivables, staff payments,
   supplier payments (payment places), transfers between accounts. Opening balance: entries type openingBalance (js/20),
   the latest active one per account; movements before its date are inside it. */
const keyOf=e=>S(e.accountKey)||(e.accountId?'account:'+e.accountId:e.cashRecipientId?'cash:'+e.cashRecipientId:'');
function accountRows({fin,cash,inv}){const out=[],cfg=fin?.settings||{};for(const a of A(cash?.transferAccounts))out.push({key:'account:'+a.id,name:a.name||a.id,type:'card',active:a.status!=='غیرفعال'&&a.isArchived!==true});for(const r of A(cash?.cashRecipients))out.push({key:'cash:'+r.id,name:r.name||r.id,type:'cash',active:r.status!=='غیرفعال'&&r.isArchived!==true});
 for(const l of A(inv?.settings?.paymentLocations))out.push({key:'payment:'+l.id,name:l.name||l.id,type:'place',active:l.isActive!==false});const pos=S(cfg.posAccountKey);for(const r of out)if(r.key===pos)r.pos=true;return out}
function accountMoves({fin,cash,hr,inv,cashApi}){const mv=[],push=(key,date,amount,source,desc,ref='')=>{const d=D(date),a=N(amount);if(!d||!a||!key)return;mv.push({key,date:d,amount:a,source,desc,ref})},pos=S(fin?.settings?.posAccountKey)||'pos:';
 const CW=cashApi||window.CashWrite,reps=CW?.reports?CW.reports(cash):A(cash?.reports).filter(active);
 for(const r of reps){let p=0;for(let i=1;i<=6;i++)p+=N(r['pos'+i]);push(pos,r.date,p/10,'pos','کارتخوان‌ها (گزارش صندوق)',r.id);
  const items=k=>CW?.itemsOf?CW.itemsOf(r,k):A(k==='card'?r.cardToCardItems:r.cashItems);for(const it of items('card'))push('account:'+S(it.accountId),r.date,N(it.amount)/10,'cardToCard','کارت به کارت صندوق',r.id);for(const it of items('cash'))push('cash:'+S(it.recipientId),r.date,N(it.amount)/10,'cashDelivery','نقد تحویل از صندوق',r.id)}
 for(const e of A(fin?.entries)){if(!active(e))continue;const k=keyOf(e),a=N(e.amountToman);
  if(e.type==='transfer'){push(S(e.fromKey),e.date,-a,'transfer','انتقال به '+S(e.toName||e.toKey),e.id);push(S(e.toKey),e.date,a,'transfer','انتقال از '+S(e.fromName||e.fromKey),e.id);continue}
  if(e.type==='openingBalance')continue;
  if(e.custodyKind){push(k,e.date,-a,'custody',({expense:'هزینهٔ رستوران',personalWithdrawal:'برداشت شخصی',custodyReturn:'تسویه / بازگرداندن وجه'})[e.custodyKind]||e.custodyKind,e.id);continue}
  if(isDoc(e)&&e.paymentStatus!=='unpaid')push(k,e.date,e.type==='income'?a:-a,'ledger',`${e.type==='income'?'درآمد':'هزینه'}: ${S(e.category)}${e.title?' — '+S(e.title):''}`,e.id)}
 for(const s of A(fin?.settlements))if(active(s))push(S(s.accountKey),s.date,s.direction==='receipt'?N(s.amountToman):-N(s.amountToman),'settlement',(s.direction==='receipt'?'دریافت: ':'پرداخت: ')+S(A(fin.obligations).find(o=>o.id===s.obligationId)?.title||s.obligationId),s.id);
 for(const p of A(hr?.payments))if(active(p))push(S(p.accountKey),p.date,-N(p.amount),'payroll',`${S(p.type)}: ${S(A(hr.personnel).find(x=>x.id===p.personnelId)?.name||p.personnelId)}`,p.id);
 for(const p of A(inv?.supplierPayments))if(active(p)&&S(p.status)!=='rejected')push('payment:'+S(p.paymentLocationId),p.date,(p.directionEffect==='receipt'||p.direction==='receipt'?1:-1)*N(p.amount),'supplier','تأمین‌کننده: '+S(p.supplierNameSnapshot||p.supplierId),p.id);
 return mv.sort((a,b)=>a.date.localeCompare(b.date))}
function openingOf(fin,key){return A(fin?.entries).filter(e=>active(e)&&e.type==='openingBalance'&&keyOf(e)===key).sort((a,b)=>S(b.date).localeCompare(S(a.date))||S(b.id).localeCompare(S(a.id)))[0]||null}
/* balances up to a date (inclusive): opening + movements after the opening date */
/* ---------- daily cash box (صندوق نقدی) ----------
   The cash box is one money account (finance.settings.cashBoxKey: a payment location, a «نقد نزد» person or a card;
   default the payment location named «صندوق نقدی»). Its moves come from everywhere money is recorded: expenses and
   income paid from it, staff payments (advance, salary) and supplier payments made from it, transfers (a manager's
   top-up), its opening balance. The only own records are end-of-day counts:
     finance.cashBoxCounts[{id CBC-NNNNN, accountKey, date, countedToman, expectedToman, diffToman, note, status, by, at}]
   one active count per account and day (a new one voids the earlier); a difference is shown, never booked by itself. */
function cashBoxKey(src){const k=S(src?.fin?.settings?.cashBoxKey);if(k)return k;const l=A(src?.inv?.settings?.paymentLocations).find(x=>/صندوق\s*نقد/.test(S(x.name))&&x.isActive!==false);return l?'payment:'+l.id:''}
function cashBoxDays(src,key,{from,to}){const r=accountLedger(src,{from,to}).find(x=>x.key===key);if(!r)return{row:null,days:[]};const counts=A(src.fin?.cashBoxCounts).filter(c=>active(c)&&c.accountKey===key);
 const by=new Map;for(const m of r.moves){const o=by.get(m.date)||{date:m.date,in:0,out:0,moves:[]};if(m.amount>0)o.in+=m.amount;else o.out-=m.amount;o.moves.push(m);by.set(m.date,o)}for(const c of counts){const d=D(c.date);if(d>=from&&d<=to&&!by.has(d))by.set(d,{date:d,in:0,out:0,moves:[]})}
 let bal=r.start;const days=[...by.values()].sort((a,b)=>a.date.localeCompare(b.date)).map(o=>{const open=bal;bal+=o.in-o.out;const c=counts.find(x=>D(x.date)===o.date);return{...o,open,close:bal,count:c||null,diff:c?N(c.countedToman)-bal:null}});return{row:r,days}}
function addCashCount(fin,ctx,{accountKey,date,counted,expected,note}){ensure(fin);const d=reqDate(date),k=S(accountKey);if(!k)throw Error('حساب صندوق نقدی تعیین نشده است');const c=Math.round(N(counted));if(!(c>=0))throw Error('مبلغ شمارش باید عدد نامنفی باشد');
 fin.cashBoxCounts=A(fin.cashBoxCounts);for(const x of fin.cashBoxCounts)if(active(x)&&x.accountKey===k&&D(x.date)===d)Object.assign(x,{status:'void',voidReason:'شمارش تازهٔ همان روز',voidedAt:ctx.at,voidedBy:ctx.actor});
 const e=Math.round(N(expected)||0),row={id:uid('CBC',fin.cashBoxCounts),accountKey:k,date:d,countedToman:c,expectedToman:e,diffToman:c-e,note:S(note),status:'active',createdAt:ctx.at,createdBy:ctx.actor};fin.cashBoxCounts.push(row);ctx.auditExtra={entityId:row.id};return row}
function voidCashCount(fin,ctx,{id,reason}){const x=A(fin.cashBoxCounts).find(c=>c.id===id);if(!x)throw Error('شمارش پیدا نشد');if(!active(x))throw Error('قبلاً باطل شده است');if(!S(reason))throw Error('علت ابطال لازم است');Object.assign(x,{status:'void',voidReason:S(reason),voidedAt:ctx.at,voidedBy:ctx.actor});ctx.auditExtra={entityId:id};return x}
function setCashBoxKey(fin,ctx,{key}){ensure(fin);fin.settings=fin.settings||{};const before=S(fin.settings.cashBoxKey);fin.settings.cashBoxKey=S(key);ctx.auditExtra={before};return fin.settings.cashBoxKey}
function accountLedger(src,{to='',from=''}={}){const rows=accountRows(src),mv=accountMoves(src),known=new Set(rows.map(r=>r.key));
 for(const m of mv)if(!known.has(m.key)){known.add(m.key);rows.push({key:m.key,name:m.key==='pos:'?'کارتخوان‌ها (حساب بانک تعیین نشده)':m.key,type:m.key==='pos:'?'pos':'unknown',active:true})}
 return rows.map(r=>{const o=openingOf(src.fin,r.key),od=o?D(o.date):'',mine=mv.filter(m=>m.key===r.key&&(!to||m.date<=to)&&(!od||m.date>=od)),before=from?mine.filter(m=>m.date<from):[],inPeriod=from?mine.filter(m=>m.date>=from):mine,base=(o?N(o.amountToman):0)+before.reduce((s,m)=>s+m.amount,0);
  return{...r,opening:o?{id:o.id,date:od,amount:N(o.amountToman)}:null,start:base,in:inPeriod.filter(m=>m.amount>0).reduce((s,m)=>s+m.amount,0),out:0-inPeriod.filter(m=>m.amount<0).reduce((s,m)=>s+m.amount,0),balance:base+inPeriod.reduce((s,m)=>s+m.amount,0),moves:inPeriod}}).filter(r=>r.active||r.moves.length||r.opening)}
function addTransfer(fin,ctx,{date,fromKey,toKey,amountToman,notes,fromName,toName}){ensure(fin);const d=reqDate(date),a=Math.round(N(amountToman));if(!S(fromKey)||!S(toKey))throw Error('حساب مبدا و مقصد را انتخاب کنید');if(S(fromKey)===S(toKey))throw Error('مبدا و مقصد یکی است');if(!(a>0))throw Error('مبلغ باید بیشتر از صفر باشد');if(today()&&d>today())throw Error('تاریخ بعد از امروز است');
 const e={id:uid('FIN',fin.entries),date:d,type:'transfer',fromKey:S(fromKey),toKey:S(toKey),fromName:S(fromName),toName:S(toName),amountToman:a,notes:S(notes),status:'active',createdAt:ctx.at,createdBy:ctx.actor};fin.entries.push(e);ctx.auditExtra={entityId:e.id,amount:a};return e}
function setOpening(fin,ctx,{accountKey,date,amountToman,notes}){ensure(fin);const d=reqDate(date),k=S(accountKey);if(!k)throw Error('حساب را انتخاب کنید');const a=N(amountToman);if(!Number.isFinite(a))throw Error('مبلغ معتبر نیست');if(!S(notes))throw Error('برای ماندهٔ اول، شرح (مثلاً «طبق صورت‌حساب بانک») لازم است');
 const old=openingOf(fin,k);if(old&&D(old.date)===d&&N(old.amountToman)===a)throw Error('همین مانده قبلاً ثبت شده است');if(old)Object.assign(old,{status:'void',voidReason:'جایگزین با ماندهٔ اول تازه',voidedAt:ctx.at,voidedBy:ctx.actor});
 const e={id:uid('FIN',fin.entries),date:d,type:'openingBalance',entryType:'opening',accountKey:k,amountToman:Math.round(a),notes:S(notes),status:'active',createdAt:ctx.at,createdBy:ctx.actor};fin.entries.push(e);ctx.auditExtra={entityId:e.id,accountKey:k,amount:a,replaced:old?.id||''};return e}
function voidTransfer(fin,ctx,{id,reason}){const e=A(fin.entries).find(x=>x.id===id&&['transfer','openingBalance'].includes(x.type));if(!e||!active(e))throw Error('ثبت پیدا نشد یا قبلاً ابطال شده');if(!S(reason))throw Error('علت ابطال لازم است');Object.assign(e,{status:'void',voidReason:S(reason),voidedAt:ctx.at,voidedBy:ctx.actor});ctx.auditExtra={entityId:id};return e}
function setPosAccount(fin,ctx,{accountKey}){ensure(fin);const k=S(accountKey);if(!k.startsWith('account:'))throw Error('یک کارت / حساب بانکی را انتخاب کنید');if(fin.settings.posAccountKey===k)throw Error('تغییری نیست');fin.settings.posAccountKey=k;ctx.auditExtra={posAccountKey:k};return k}
/* ---------- forecast of a month (stage 7c): average of the last complete months + what is already known ---------- */
/* ---------- recurring monthly expenses (هزینه‌های ثابت و تکراری ماهانه) ----------
   finance.settings.recurringExpenses [{id REC-###, title, category, fromMonth YYYY/MM, toMonth YYYY/MM|'', notes,
     amounts[{from YYYY/MM, kind fixed|range, amount, min, max, at, by}], createdAt/By, updatedAt/By}]
   A template is not a ledger document and nothing is saved month by month. In a month it stands for its category only
   while no ledger expense of that category is registered in that month (the real rent / bill document replaces it):
   fixed = its amount, range = the middle of min..max (shown as «برآورد»). One template per category. A new amount is a new
   row from a month on; earlier months keep the amount they had. Ending = toMonth (the last month it applies). */
const recurringList=fin=>A(fin?.settings?.recurringExpenses);
function recurringAt(r,ym){if(!r||S(r.fromMonth)>ym||(S(r.toMonth)&&S(r.toMonth)<ym))return null;const a=A(r.amounts).filter(x=>S(x.from)<=ym).sort((p,q)=>S(p.from).localeCompare(S(q.from))).at(-1);if(!a)return null;
 const fixed=a.kind!=='range',min=Math.round(fixed?N(a.amount):N(a.min)),max=Math.round(fixed?N(a.amount):N(a.max));return{id:r.id,title:S(r.title),category:S(r.category),kind:fixed?'fixed':'range',min,max,estimate:Math.round((min+max)/2)}}
/* the templates of a month against the registered expenses of that month (Map category → amount) */
function recurringMonth(fin,ym,actualByCat){const by=actualByCat instanceof Map?actualByCat:new Map(Object.entries(actualByCat||{})),out=[];
 for(const r of recurringList(fin)){const x=recurringAt(r,ym);if(!x)continue;const actual=Math.round(N(by.get(x.category)));out.push({...x,actual,registered:actual>0,used:actual>0?actual:x.estimate,outOfRange:actual>0&&(actual<x.min*0.999||actual>x.max*1.001)})}
 return out.sort((a,b)=>b.used-a.used)}
function saveRecurring(fin,ctx,x){ensure(fin);const cfg=config(fin),title=norm(x.title),category=norm(x.category),kind=x.kind==='range'?'range':'fixed',from=YM(x.from)||YM(x.fromMonth);
 if(!title)throw Error('عنوان لازم است');if(!category)throw Error('دسته را انتخاب کنید');if(category===STAFF_MEAL)throw Error('غذای پرسنل از بخش خودش حساب می‌شود');if(!from)throw Error('ماه شروع معتبر نیست (مثال ۱۴۰۵/۰۹)');
 const amount=Math.round(N(x.amount)),min=Math.round(N(x.min)),max=Math.round(N(x.max));if(kind==='fixed'&&!(amount>0))throw Error('مبلغ باید بیشتر از صفر باشد');if(kind==='range'&&!(min>0&&max>=min))throw Error('بازه معتبر نیست: حداقل بیشتر از صفر و حداکثر نه کمتر از حداقل');
 const list=fin.settings.recurringExpenses=recurringList(fin),id=S(x.id),open=r=>!S(r.toMonth)||S(r.toMonth)>=from;
 if(list.some(r=>r.id!==id&&r.category===category&&open(r)))throw Error(`برای دستهٔ «${category}» هزینهٔ ثابت دیگری هست؛ برای هر دسته یکی`);
 if(!cfg.expenseCategories.includes(category)){const base=A(fin.settings.expenseCategories).map(S).filter(Boolean);fin.settings.expenseCategories=[...(base.length?base:DEF.expenseCategories.slice()),category]}
 const row={from,kind,...(kind==='fixed'?{amount}:{min,max}),at:ctx.at,by:ctx.actor};let r;
 if(id){r=list.find(q=>q.id===id);if(!r)throw Error('هزینهٔ ثابت پیدا نشد');if(from<S(r.fromMonth))r.fromMonth=from;const before=recurringAt(r,from),same=before&&before.kind===kind&&before.min===(kind==='fixed'?amount:min)&&before.max===(kind==='fixed'?amount:max);
  if(same&&r.title===title&&r.category===category&&S(r.notes)===S(x.notes))throw Error('تغییری برای ذخیره نیست');
  if(!same){r.amounts=A(r.amounts).filter(a=>S(a.from)!==from);r.amounts.push(row);r.amounts.sort((p,q)=>S(p.from).localeCompare(S(q.from)))}
  Object.assign(r,{title,category,notes:S(x.notes),updatedAt:ctx.at,updatedBy:ctx.actor})}
 else{r={id:uid('REC',list,3),title,category,fromMonth:from,toMonth:'',notes:S(x.notes),amounts:[row],createdAt:ctx.at,createdBy:ctx.actor};list.push(r)}
 ctx.auditExtra={entityId:r.id,from,kind};return r}
function endRecurring(fin,ctx,{id,toMonth}){const r=recurringList(fin).find(q=>q.id===S(id));if(!r)throw Error('هزینهٔ ثابت پیدا نشد');const to=YM(toMonth);if(!to)throw Error('آخرین ماه معتبر نیست (مثال ۱۴۰۵/۱۲)');
 if(to<S(r.fromMonth))throw Error('آخرین ماه نمی‌تواند قبل از ماه شروع باشد');const before=S(r.toMonth);Object.assign(r,{toMonth:to,updatedAt:ctx.at,updatedBy:ctx.actor});ctx.auditExtra={entityId:r.id,before,toMonth:to};return r}
/* forecast: with recurring templates, «other expenses» = the templates of that month + the average of the other categories */
function forecast({past,payroll,knownExpenses,recurring,recurringCats}){const ps=A(past).filter(Boolean),avg=f=>ps.length?ps.reduce((s,p)=>s+N(f(p)),0)/ps.length:0,sales=avg(p=>p.sales),matPct=ps.filter(p=>p.sales&&p.materials).length?ps.filter(p=>p.sales&&p.materials).reduce((s,p)=>s+p.materials/p.sales,0)/ps.filter(p=>p.sales&&p.materials).length:0;
 const rc=new Set(A(recurringCats)),otherAvg=avg(p=>A(p.expenses).filter(e=>!rc.has(e.category)).reduce((t,e)=>t+N(e.amount),0)),other=rc.size?N(recurring)+Math.max(otherAvg,N(knownExpenses)):Math.max(avg(p=>p.expenseTotal),N(knownExpenses));return{months:ps.length,sales,materialPercent:matPct*100,materials:sales*matPct,staffMeal:avg(p=>p.staffMeal),payroll:N(payroll),otherExpenses:other,knownExpenses:N(knownExpenses),recurring:N(recurring),otherAverage:rc.size?otherAvg:null}}
function calc({sales,materialPercent,staffMeal,payroll,otherExpenses,reservePercent}){const s=N(sales),m=s*N(materialPercent)/100,r=s*N(reservePercent)/100,profit=s-m-N(staffMeal)-N(payroll)-N(otherExpenses)-r;return{sales:s,materials:m,reserve:r,profit,margin:s?profit/s*100:null,breakEven:(1-N(materialPercent)/100-N(reservePercent)/100)>0?(N(staffMeal)+N(payroll)+N(otherExpenses))/(1-N(materialPercent)/100-N(reservePercent)/100):null}}
window.FinanceWrite={recurringList,recurringAt,recurringMonth,saveRecurring,endRecurring,cashBoxKey,cashBoxDays,addCashCount,voidCashCount,setCashBoxKey,DEF,STAFF_MEAL,accountRows,accountMoves,accountLedger,openingOf,addTransfer,setOpening,voidTransfer,setPosAccount,forecast,calc,saveMeals,mealsOfMonth,mealCost,custodyExpenses,pettyExpenses,pnl,N,D,YM,active,ensure,config,calcObligation,addObligation,voidObligation,addSettlement,voidSettlement,addCheck,clearCheck,returnCheck,voidCheck,entryShare,isDoc,addEntry,voidEntry,payState,monthEntries,dueList,saveSettings};
})();
