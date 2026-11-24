/* =========================================================
   Rayo UI Template — petty-write.js
   Petty cash (تنخواه) on the live finance module (stage 17). New collections, kept beside the current finance data
   (the current panel loads finance with {...defaults,...source} and saves the whole object, so unknown keys survive):
     finance.pettyCash.cards    {id PCC-NNN, holderPersonnelId, holderName, last4, limitToman, openingToman, openedAt,
                                 accountKeys[] (accounts allowed to charge it / take money back; empty = any),
                                 status active|closed, createdBy, createdAt, updatedBy/At,
                                 changes[{at, by, before{…fields that changed}}] (edit history of the card)}
     finance.pettyCash.topups   {id PCT-NNNNN, cardId, date, amountToman, direction in|out (absent = in; out = money
                                 taken back off the card), accountKey, accountName (the account it came from / went to),
                                 reference, note, status active|void, …}
     finance.pettyCash.expenses {id PCE-NNNNN, cardId, date, time, amountToman, categoryId, merchant,
                                 lines[{name, ingredientId, qty, unit, unitPrice}], purpose, hasReceipt, receiptRef,
                                 decision{status approved|personal|rejected, by, at, note}, status submitted|void, …}
     finance.pettyCash.closes   {id PCS-NNNNN, cardId, period YYYY/MM, opening, topups, spent, expected, bankBalance,
                                 diff, note, closedBy, closedAt, status active|void}
     finance.settings.pettyCash {categories[{id,name,limitToman,monthlyBudgetToman}], blockedMerchantKeywords[],
                                 priceTolerancePercent, workFrom, workTo, splitWindowMinutes, roundAmountToman}
   Nothing is removed: a wrong row is voided with a reason. A card is removed only while nothing refers to it (no
   charge, expense or month close, even void); a card with history is closed instead. Amounts are toman. Controls are computed on read
   (reference price = pricing.ingredients lastPurchasePriceToman of the linked item), never stored as truth.
   ========================================================= */
(function(){
'use strict';
const A=x=>Array.isArray(x)?x:[];
const AMT=t=>window.P?.mt?`${window.P.mt(t)} ${window.P.unitName()}`:`${Number(t).toLocaleString('fa-IR')} تومان`;
const S=x=>String(x??'').trim();
const NUM=v=>{if(typeof v==='number')return v;const s=S(v).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/٫/g,'.').replace(/[٬,،\s]/g,'');if(!s)return 0;const n=Number(s);return Number.isFinite(n)?n:NaN};
const D=v=>window.InvEngine.D(v),CAL=()=>window.InvEngine.CAL;
const uid=(prefix,arr,width=5)=>{let mx=0;A(arr).forEach(x=>{const m=S(x.id).match(/(\d+)$/);if(m)mx=Math.max(mx,+m[1])});return `${prefix}-${String(mx+1).padStart(width,'0')}`};
const assertDate=(d,l='تاریخ')=>{if(!d||CAL().i(d)===null)throw Error(`${l} معتبر نیست (مثال ۱۴۰۵/۰۸/۱۷)`);if(d>CAL().today)throw Error(`${l} نمی‌تواند بعد از امروز باشد`)};
const money=(v,l)=>{const n=NUM(v);if(!(n>0))throw Error(`${l} باید عدد مثبت باشد`);return Math.round(n)};

const DEFAULT_SETTINGS={categories:[{id:'produce',name:'میوه و تره‌بار',limitToman:3000000,monthlyBudgetToman:25000000},{id:'dairy',name:'لبنیات و نان',limitToman:2000000,monthlyBudgetToman:15000000},{id:'cleaning',name:'بهداشتی و شوینده',limitToman:2500000,monthlyBudgetToman:6000000},{id:'repair',name:'تعمیرات جزئی',limitToman:5000000,monthlyBudgetToman:12000000},{id:'transport',name:'پیک و حمل',limitToman:800000,monthlyBudgetToman:8000000},{id:'office',name:'لوازم اداری و مصرفی',limitToman:1500000,monthlyBudgetToman:4000000},{id:'other',name:'سایر',limitToman:1000000,monthlyBudgetToman:3000000}],
 blockedMerchantKeywords:['پوشاک','کفش','طلا','آرایشی','کافه دیگر','رستوران','کارواش','بنزین','سینما','شارژ موبایل'],priceTolerancePercent:20,workFrom:'08:00',workTo:'24:00',splitWindowMinutes:90,roundAmountToman:500000};
function settings(fin){const s=fin?.settings?.pettyCash||{},d=DEFAULT_SETTINGS;return{categories:A(s.categories).length?A(s.categories).map(c=>({id:S(c.id),name:S(c.name),limitToman:Number(c.limitToman)||0,monthlyBudgetToman:Number(c.monthlyBudgetToman)||0})):d.categories.map(c=>({...c})),
 blockedMerchantKeywords:Array.isArray(s.blockedMerchantKeywords)?s.blockedMerchantKeywords.map(S).filter(Boolean):[...d.blockedMerchantKeywords],priceTolerancePercent:Number.isFinite(+s.priceTolerancePercent)&&s.priceTolerancePercent!==''&&s.priceTolerancePercent!=null?+s.priceTolerancePercent:d.priceTolerancePercent,
 workFrom:/^\d{2}:\d{2}$/.test(S(s.workFrom))?S(s.workFrom):d.workFrom,workTo:/^\d{2}:\d{2}$/.test(S(s.workTo))?S(s.workTo):d.workTo,splitWindowMinutes:Number(s.splitWindowMinutes)||d.splitWindowMinutes,roundAmountToman:Number(s.roundAmountToman)||d.roundAmountToman}}
function store(fin){fin.pettyCash=fin.pettyCash&&typeof fin.pettyCash==='object'&&!Array.isArray(fin.pettyCash)?fin.pettyCash:{};const p=fin.pettyCash;for(const k of ['cards','topups','expenses','closes'])p[k]=A(p[k]);return p}
const view=fin=>{const p=fin?.pettyCash||{};return{cards:A(p.cards),topups:A(p.topups),expenses:A(p.expenses),closes:A(p.closes)}};
const live=x=>x&&x.status!=='void';
const stamp=ctx=>({createdBy:ctx.actor,createdAt:ctx.at});
const digits=v=>S(v).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d));
const keysOf=v=>[...new Set(A(v).map(S).filter(Boolean))];
const amountOr0=(v,l)=>{const n=S(v)===''?0:NUM(v);if(!Number.isFinite(n)||n<0)throw Error(`${l} معتبر نیست`);return Math.round(n)};
const isOut=t=>t.direction==='out';
const history=(p,id)=>({topups:p.topups.filter(t=>t.cardId===id),expenses:p.expenses.filter(e=>e.cardId===id),closes:p.closes.filter(s=>s.cardId===id)});

/* ---------- writes ---------- */
function addCard(fin,ctx,x){const p=store(fin),pid=S(x.holderPersonnelId),name=S(x.holderName),last4=digits(x.last4);
 if(!pid&&!name)throw Error('دارندهٔ کارت را انتخاب کنید');if(!/^\d{4}$/.test(last4))throw Error('چهار رقم آخر کارت لازم است');
 if(p.cards.some(c=>c.status!=='closed'&&c.last4===last4))throw Error('کارت فعالی با همین چهار رقم هست');
 const opening=amountOr0(x.openingToman,'ماندهٔ اول'),limit=amountOr0(x.limitToman,'سقف کارت');
 const openedAt=D(x.openedAt)||CAL().today;assertDate(openedAt,'تاریخ شروع');
 const c={id:uid('PCC',p.cards,3),holderPersonnelId:pid,holderName:name,last4,limitToman:limit,openingToman:opening,openedAt,accountKeys:keysOf(x.accountKeys),status:'active',...stamp(ctx)};p.cards.push(c);ctx.auditExtra={entityId:c.id};return c}
/* edit a card: holder (a wrong name, or the card handed to someone else), last four digits (a new card for the same
   float), limit, opening balance and start date, allowed accounts. The previous values are kept on the card
   (changes[]) and in the change log. Opening and start date are locked once a month of the card is closed. */
const EDIT_FIELDS=['holderPersonnelId','holderName','last4','limitToman','openingToman','openedAt','accountKeys'];
function editCard(fin,ctx,x){const p=store(fin),c=p.cards.find(c=>c.id===S(x.id));if(!c)throw Error('کارت پیدا نشد');
 const next={holderPersonnelId:S(x.holderPersonnelId),holderName:S(x.holderName),last4:digits(x.last4),limitToman:amountOr0(x.limitToman,'سقف کارت'),openingToman:amountOr0(x.openingToman,'ماندهٔ اول'),openedAt:D(x.openedAt),accountKeys:keysOf(x.accountKeys)};
 if(!next.holderPersonnelId&&!next.holderName)throw Error('دارندهٔ کارت را انتخاب کنید');if(!/^\d{4}$/.test(next.last4))throw Error('چهار رقم آخر کارت لازم است');assertDate(next.openedAt,'تاریخ شروع');
 if(c.status!=='closed'&&p.cards.some(o=>o.id!==c.id&&o.status!=='closed'&&o.last4===next.last4))throw Error('کارت فعال دیگری با همین چهار رقم هست');
 const h=history(p,c.id),first=[...h.topups,...h.expenses].filter(live).map(r=>S(r.date)).sort()[0];if(first&&next.openedAt>first)throw Error(`تاریخ شروع نمی‌تواند بعد از اولین ثبت کارت (${first}) باشد`);
 if(h.closes.some(live)&&(next.openingToman!==(c.openingToman||0)||next.openedAt!==c.openedAt))throw Error('ماهی از این کارت بسته شده است؛ ماندهٔ اول و تاریخ شروع قفل است (اول بستن ماه را باطل کنید)');
 const before={};for(const k of EDIT_FIELDS){const list=k==='accountKeys',a=list?JSON.stringify(keysOf(c[k])):String(c[k]??''),b=list?JSON.stringify(next[k]):String(next[k]);if(a!==b)before[k]=list?keysOf(c[k]):c[k]??''}
 if(!Object.keys(before).length)throw Error('تغییری نیست');
 Object.assign(c,next,{updatedBy:ctx.actor,updatedAt:ctx.at});c.changes=[...A(c.changes),{at:ctx.at,by:ctx.actor,before}];ctx.auditExtra={entityId:c.id,before};return c}
function canDeleteCard(fin,id){const h=history(view(fin),S(id));return !h.topups.length&&!h.expenses.length&&!h.closes.length}
function deleteCard(fin,ctx,x){const p=store(fin),i=p.cards.findIndex(c=>c.id===S(x.id));if(i<0)throw Error('کارت پیدا نشد');
 if(!canDeleteCard(fin,x.id))throw Error('این کارت شارژ، هزینه یا ماه بسته‌شده دارد و حذف نمی‌شود؛ «بستن کارت» را بزنید');
 const [c]=p.cards.splice(i,1);ctx.auditExtra={entityId:c.id,before:c};return c}
function setCardStatus(fin,ctx,x){const p=store(fin),c=p.cards.find(c=>c.id===S(x.id));if(!c)throw Error('کارت پیدا نشد');const st=x.status==='closed'?'closed':'active';c.status=st;c.updatedBy=ctx.actor;c.updatedAt=ctx.at;if(st==='closed')c.closedAt=CAL().today;ctx.auditExtra={entityId:c.id};return c}
const activeCard=(p,id)=>{const c=p.cards.find(c=>c.id===S(id));if(!c)throw Error('کارت را انتخاب کنید');if(c.status==='closed')throw Error('این کارت بسته شده است');return c};
/* charge (direction in) or take money back off the card (direction out), from / to an account. When the card has
   allowed accounts the account must be one of them. */
function addTopup(fin,ctx,x){const p=store(fin),c=activeCard(p,x.cardId),out=x.direction==='out',date=D(x.date);assertDate(date);if(date<c.openedAt)throw Error(`تاریخ ${out?'برگشت':'شارژ'} قبل از شروع کارت است`);if(closedFor(p,c.id,date))throw Error('این ماه برای این کارت بسته شده است');
 const amt=money(x.amountToman,out?'مبلغ برگشت':'مبلغ شارژ'),acc=S(x.accountKey),allowed=keysOf(c.accountKeys);
 if(allowed.length&&!acc)throw Error(out?'حسابی را که پول به آن برمی‌گردد انتخاب کنید':'حسابی را که از آن شارژ شده انتخاب کنید');if(acc&&allowed.length&&!allowed.includes(acc))throw Error('این حساب برای این کارت مجاز نیست');
 if(out){const b=balance(fin,c.id,'',x.purchases);if(amt>b.expected)throw Error(`ماندهٔ کارت (${AMT(b.expected)}) کمتر از مبلغ برگشت است`)}
 const t={id:uid('PCT',p.topups),cardId:c.id,date,amountToman:amt,...(out?{direction:'out'}:{}),accountKey:acc,accountName:acc?S(x.accountName):'',reference:S(x.reference),note:S(x.note),status:'active',...stamp(ctx)};p.topups.push(t);ctx.auditExtra={entityId:t.id,direction:out?'out':'in',accountKey:acc};return t}
function cleanLines(pricing,lines){const ing=new Map(A(pricing?.ingredients).map(i=>[S(i.id),i]));return A(lines).filter(l=>S(l.name)||S(l.ingredientId)||S(l.qty)||S(l.unitPrice)).map((l,k)=>{const i=ing.get(S(l.ingredientId)),name=S(l.name)||S(i?.name);if(!name)throw Error(`ردیف ${k+1}: نام قلم لازم است`);const qty=NUM(l.qty),price=NUM(l.unitPrice);if(!(qty>0))throw Error(`ردیف ${k+1} (${name}): مقدار مثبت لازم است`);if(!(price>=0))throw Error(`ردیف ${k+1} (${name}): قیمت واحد معتبر نیست`);
 return{name,ingredientId:i?S(i.id):'',qty:Math.round(qty*1000)/1000,unit:S(l.unit)||S(i?.purchaseUnit)||'',unitPrice:Math.round(price)}})}
function addExpense(fin,ctx,x){const p=store(fin),c=activeCard(p,x.cardId),date=D(x.date);assertDate(date);if(date<c.openedAt)throw Error('تاریخ هزینه قبل از شروع کارت است');if(closedFor(p,c.id,date))throw Error('این ماه برای این کارت بسته شده است');
 const time=S(x.time)||'';if(time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))throw Error('ساعت به شکل ۱۴:۳۰ لازم است');
 const cat=settings(fin).categories.find(k=>k.id===S(x.categoryId));if(!cat)throw Error('دستهٔ هزینه را انتخاب کنید');const merchant=S(x.merchant);if(!merchant)throw Error('فروشنده لازم است');const purpose=S(x.purpose);if(!purpose)throw Error('علت خرید لازم است');
 const lines=cleanLines(ctx.pricing,x.lines),sum=lines.reduce((a,l)=>a+l.qty*l.unitPrice,0),amount=S(x.amountToman)===''&&lines.length?Math.round(sum):money(x.amountToman,'مبلغ');
 if(lines.length&&Math.abs(sum-amount)>Math.max(1000,amount*0.01))throw Error(`جمع اقلام (${Math.round(sum).toLocaleString('fa-IR')}) با مبلغ (${amount.toLocaleString('fa-IR')}) نمی‌خواند`);
 const e={id:uid('PCE',p.expenses),cardId:c.id,date,time,amountToman:amount,categoryId:cat.id,merchant,lines,purpose,hasReceipt:!!x.hasReceipt,receiptRef:S(x.receiptRef),decision:null,status:'submitted',...stamp(ctx)};p.expenses.push(e);ctx.auditExtra={entityId:e.id};return e}
/* edit an expense: the old row is voided (voidKind 'edit', replacedBy) and the corrected copy is added (replaces), so
   both stay in the history. Before the manager's decision anyone with petty access may edit; after it only a manager
   (ctx.manager: owner or full-access user), and the decision stays on the copy (editedAfterDecision). Not in a closed month. */
const EDIT_KEYS=['cardId','date','time','amountToman','categoryId','merchant','purpose','hasReceipt','receiptRef','lines'];
const cmp=(r,k)=>JSON.stringify(k==='hasReceipt'?!!r[k]:r[k]??'');
function editExpense(fin,ctx,x){const p=store(fin),old=p.expenses.find(e=>e.id===S(x.id));if(!old||old.status==='void')throw Error('هزینه پیدا نشد');
 if(old.decision&&!ctx.manager)throw Error('این هزینه تصمیم مدیر دارد؛ فقط مدیر می‌تواند ویرایشش کند');
 if(closedFor(p,old.cardId,old.date))throw Error('ماه این هزینه برای این کارت بسته شده است؛ اول بستن ماه را باطل کنید');
 const e=addExpense(fin,ctx,x);if(EDIT_KEYS.every(k=>cmp(old,k)===cmp(e,k))){p.expenses.pop();throw Error('تغییری نیست')}
 Object.assign(e,{createdBy:old.createdBy,createdAt:old.createdAt,replaces:old.id,editedBy:ctx.actor,editedAt:ctx.at,...(old.receiptAt?{receiptAt:old.receiptAt}:{}),...(A(old.decisionHistory).length?{decisionHistory:old.decisionHistory}:{}),...(old.decision?{decision:old.decision,editedAfterDecision:true}:{})});
 Object.assign(old,{status:'void',voidKind:'edit',voidReason:'ویرایش',replacedBy:e.id,voidedBy:ctx.actor,voidedAt:ctx.at});
 const before={};for(const k of EDIT_KEYS)if(cmp(old,k)!==cmp(e,k))before[k]=old[k]??'';ctx.auditExtra={entityId:e.id,replaces:old.id,before};return e}
const DECISIONS={approved:'تأیید — هزینهٔ مجموعه',personal:'شخصی — کسر از حقوق',rejected:'رد — باید برگردانده شود'};
function decide(fin,ctx,x){const p=store(fin),e=p.expenses.find(e=>e.id===S(x.id));if(!e||e.status==='void')throw Error('هزینه پیدا نشد');const st=S(x.status);if(!DECISIONS[st])throw Error('تصمیم را انتخاب کنید');if(st!=='approved'&&!S(x.note))throw Error('برای «شخصی» یا «رد» توضیح لازم است');
 if(closedFor(p,e.cardId,e.date))throw Error('ماه این هزینه برای این کارت بسته شده است');
 if(e.decision)e.decisionHistory=[...A(e.decisionHistory),e.decision];e.decision={status:st,by:ctx.actor,at:ctx.at,note:S(x.note)};ctx.auditExtra={entityId:e.id};return e}
function receipt(fin,ctx,x){const p=store(fin),e=p.expenses.find(e=>e.id===S(x.id));if(!e||e.status==='void')throw Error('هزینه پیدا نشد');e.hasReceipt=true;e.receiptRef=S(x.receiptRef)||e.receiptRef;e.receiptAt=ctx.at;ctx.auditExtra={entityId:e.id};return e}
const closedFor=(p,cardId,date)=>p.closes.some(s=>live(s)&&s.cardId===cardId&&S(date).slice(0,7)<=s.period);
function voidRow(fin,ctx,x){const p=store(fin),kind=x.kind==='topup'?'topups':x.kind==='close'?'closes':'expenses',r=p[kind].find(r=>r.id===S(x.id));if(!r||r.status==='void')throw Error('ردیف پیدا نشد');const reason=S(x.reason);if(!reason)throw Error('علت ابطال لازم است');
 if(kind!=='closes'&&closedFor(p,r.cardId,r.date))throw Error('ماه این ردیف بسته شده است؛ اول بستن ماه را باطل کنید');
 if(kind==='closes'&&p.closes.some(s=>live(s)&&s.cardId===r.cardId&&s.period>r.period))throw Error('ماه بعدی این کارت بسته شده است؛ اول آن را باطل کنید');
 r.status='void';r.voidReason=reason;r.voidedBy=ctx.actor;r.voidedAt=ctx.at;ctx.auditExtra={entityId:r.id};return r}

/* ---------- balance and month close ---------- */
const monthOf=d=>S(d).slice(0,7);
/* purchases: supplier payments made with the card in purchases (FinanceWrite.pettyPurchases: a payment place merged into
   the card), [{date, amount}] — spent like card expenses but recorded in the inventory module */
function balance(fin,cardId,upto,purchases){const v=view(fin),c=v.cards.find(c=>c.id===cardId);if(!c)return null;const inR=d=>!upto||S(d)<=upto,bought=A(purchases).filter(x=>inR(x.date)).reduce((a,x)=>a+(Number(x.amount)||0),0);
 const tp=v.topups.filter(t=>live(t)&&t.cardId===cardId&&inR(t.date)),topups=tp.filter(t=>!isOut(t)).reduce((a,t)=>a+t.amountToman,0),returned=tp.filter(isOut).reduce((a,t)=>a+t.amountToman,0),ex=v.expenses.filter(e=>live(e)&&e.cardId===cardId&&inR(e.date)),spent=ex.reduce((a,e)=>a+e.amountToman,0);
 const by=k=>ex.filter(e=>(e.decision?.status||'')===k).reduce((a,e)=>a+e.amountToman,0);
 return{opening:c.openingToman||0,topups,returned,spent,purchases:bought,expected:(c.openingToman||0)+topups-returned-spent-bought,approved:by('approved'),personal:by('personal'),rejected:by('rejected'),pending:ex.filter(e=>!e.decision).reduce((a,e)=>a+e.amountToman,0),noReceipt:ex.filter(e=>!e.hasReceipt).length,count:ex.length}}
function closeMonth(fin,ctx,x){const p=store(fin),c=p.cards.find(c=>c.id===S(x.cardId));if(!c)throw Error('کارت را انتخاب کنید');const period=S(x.period).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d));if(!/^\d{4}\/\d{2}$/.test(period))throw Error('ماه به شکل ۱۴۰۵/۰۸ لازم است');
 if(period>=monthOf(CAL().today))throw Error('فقط ماه‌های گذشته بسته می‌شوند');if(p.closes.some(s=>live(s)&&s.cardId===c.id&&s.period>=period))throw Error('این ماه یا ماه بعد از آن قبلاً بسته شده است');
 const last=CAL().k(CAL().i(period+'/01')+40).slice(0,7)+'/01',end=CAL().k(CAL().i(last)-1);const pend=p.expenses.filter(e=>live(e)&&e.cardId===c.id&&e.date<=end&&!e.decision);if(pend.length)throw Error(`${pend.length.toLocaleString('fa-IR')} هزینهٔ تا پایان این ماه هنوز تصمیم مدیر ندارد`);
 const b=balance(fin,c.id,end,x.purchases),bank=NUM(x.bankBalance);if(!Number.isFinite(bank)||S(x.bankBalance)==='')throw Error('ماندهٔ واقعی بانک لازم است');const diff=Math.round(bank-b.expected);if(diff&&!S(x.note))throw Error('اختلاف دارد؛ توضیح لازم است');
 const s={id:uid('PCS',p.closes),cardId:c.id,period,opening:b.opening,topups:b.topups,returned:b.returned,spent:b.spent,purchases:b.purchases,approved:b.approved,personal:b.personal,rejected:b.rejected,expected:b.expected,bankBalance:Math.round(bank),diff,note:S(x.note),closedBy:ctx.actor,closedAt:ctx.at,status:'active'};p.closes.push(s);ctx.auditExtra={entityId:s.id};return s}
function saveSettings(fin,ctx,x){fin.settings=fin.settings&&typeof fin.settings==='object'?fin.settings:{};const cats=A(x.categories).map((c,k)=>{const name=S(c.name);if(!name)throw Error(`ردیف ${k+1}: نام دسته لازم است`);const lim=NUM(c.limitToman),mb=NUM(c.monthlyBudgetToman);if(!(lim>=0)||!(mb>=0))throw Error(`«${name}»: سقف و بودجه باید عدد باشند`);return{id:S(c.id)||'cat-'+ctx.reqId+'-'+k,name,limitToman:Math.round(lim),monthlyBudgetToman:Math.round(mb)}});
 if(!cats.length)throw Error('دست‌کم یک دسته لازم است');const used=new Set(view(fin).expenses.map(e=>e.categoryId)),old=settings(fin).categories;for(const o of old)if(used.has(o.id)&&!cats.some(c=>c.id===o.id))throw Error(`دستهٔ «${o.name}» هزینه دارد و حذف نمی‌شود`);
 const tol=NUM(x.priceTolerancePercent);if(!(tol>=0&&tol<=500))throw Error('درصد تحمل قیمت معتبر نیست');for(const k of ['workFrom','workTo'])if(!/^\d{2}:\d{2}$/.test(S(x[k])))throw Error('ساعت کاری به شکل ۰۸:۰۰ لازم است');
 fin.settings.pettyCash={categories:cats,blockedMerchantKeywords:S(x.blockedMerchantKeywords).split(/[،,\n]/).map(S).filter(Boolean),priceTolerancePercent:tol,workFrom:S(x.workFrom),workTo:S(x.workTo),splitWindowMinutes:Math.max(1,Math.round(NUM(x.splitWindowMinutes))||90),roundAmountToman:Math.max(0,Math.round(NUM(x.roundAmountToman))||0)};return fin.settings.pettyCash}

/* ---------- controls (computed on read) ---------- */
const mins=t=>{const m=S(t).match(/^(\d{1,2}):(\d{2})$/);return m?+m[1]*60+ +m[2]:null};
function flags(fin,pricing,inventory){const s=settings(fin),v=view(fin),ing=new Map(A(pricing?.ingredients).map(i=>[S(i.id),i])),tracked=new Set(A(inventory?.trackedIngredients).map(t=>S(t.ingredientId||t.id))),out=new Map;
 const flag=(e,sev,code,text,impact=0)=>{if(!out.has(e.id))out.set(e.id,[]);out.get(e.id).push({sev,code,text,impact})},from=mins(s.workFrom),to=mins(s.workTo),ex=v.expenses.filter(live);
 for(const e of ex){const cat=s.categories.find(c=>c.id===e.categoryId);
  if(!e.hasReceipt)flag(e,'danger','noReceipt','رسید ندارد');
  if(cat&&cat.limitToman&&e.amountToman>cat.limitToman)flag(e,'warning','overLimit',`بیش از سقف هر خرید «${cat.name}» (${AMT(cat.limitToman)})`);
  const hay=`${e.merchant} ${A(e.lines).map(l=>l.name).join(' ')}`;const kw=s.blockedMerchantKeywords.find(k=>hay.includes(k));if(kw)flag(e,'danger','personal',`پذیرندهٔ نامرتبط («${kw}») — احتمال استفادهٔ شخصی`,e.amountToman);
  const t=mins(e.time);if(t!==null&&from!==null&&to!==null&&(t<from||t>=to))flag(e,'warning','hours','خارج از ساعت کاری');
  if(!A(e.lines).length&&s.roundAmountToman&&e.amountToman%s.roundAmountToman===0)flag(e,'warning','round','مبلغ رُند بدون ریز اقلام');
  for(const l of A(e.lines)){const i=ing.get(l.ingredientId),ref=Number(i?.lastPurchasePriceToman)||0;if(ref>0&&l.unitPrice>ref*(1+s.priceTolerancePercent/100))flag(e,'danger','price',`«${l.name}» ${Math.round((l.unitPrice/ref-1)*100).toLocaleString('fa-IR')}٪ گران‌تر از آخرین خرید (${AMT(ref)} / ${i.purchaseUnit||''})`,Math.round((l.unitPrice-ref)*l.qty));
   if(i&&tracked.has(l.ingredientId))flag(e,'info','stock',`«${l.name}» قلم انبار است؛ «ورود به انبار» هم باید ثبت شود`)}}
 const groups=new Map;for(const e of ex){const k=`${e.cardId}|${e.merchant}|${e.date}`;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(e)}
 for(const list of groups.values()){if(list.length<2)continue;list.sort((a,b)=>(mins(a.time)??0)-(mins(b.time)??0));for(let k=1;k<list.length;k++){const a=list[k-1],b=list[k],cat=s.categories.find(c=>c.id===b.categoryId),gap=(mins(b.time)??0)-(mins(a.time)??0);if(gap>s.splitWindowMinutes)continue;
  if(a.amountToman===b.amountToman&&JSON.stringify(a.lines)===JSON.stringify(b.lines))flag(b,'danger','duplicate',`احتمال ثبت تکراری (${a.id})`,b.amountToman);else if(cat&&cat.limitToman&&a.amountToman<=cat.limitToman&&b.amountToman<=cat.limitToman&&a.amountToman+b.amountToman>cat.limitToman)flag(b,'warning','split',`خرید خُردشده با ${a.id}: جمعشان از سقف هر خرید بیشتر است`)}}
 return out}

const validFinance=doc=>!!doc&&typeof doc==='object'&&!Array.isArray(doc)&&!(doc.code&&doc.message&&!doc.meta)&&(!!doc.meta||Array.isArray(doc.entries));
window.PettyWrite={editExpense,closedFor:(fin,cardId,date)=>closedFor(view(fin),String(cardId??"").trim(),date),DEFAULT_SETTINGS,DECISIONS,settings,view,live,addCard,editCard,canDeleteCard,deleteCard,setCardStatus,addTopup,isOut,addExpense,decide,receipt,voidRow,balance,closeMonth,saveSettings,flags,validFinance,monthOf};
})();
