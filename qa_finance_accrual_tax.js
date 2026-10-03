'use strict';
// Synthetic records only. Runs js/20-finance-module.js without a browser or live API.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const read=p=>fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n'),clone=x=>JSON.parse(JSON.stringify(x));
const elements=new Map(),saves=[],toasts=[];let checkedPay='paid';
const element=id=>{if(!elements.has(id))elements.set(id,{value:'',innerHTML:'',textContent:'',disabled:false,dataset:{},style:{},classList:{add(){},remove(){},toggle(){}}});return elements.get(id)};
const fill=values=>{for(const [id,value] of Object.entries(values))element(id).value=value};
const gateway={createRequestId:()=>'QA',async loadOrBootstrap(){return{}},async saveModule(module,data){saves.push([module,clone(data)])}};
const ctx={console,URL,URLSearchParams,Map,Set,Date,JSON,document:{getElementById:element,querySelector:sel=>sel.includes('finEPay')?{value:checkedPay}:null,querySelectorAll:()=>[]},location:{pathname:'/test.html',search:'',href:'http://test.local/test.html'},history:{replaceState(){}},RAYO_API_GATEWAY:gateway,setTimeout:()=>0,clearTimeout(){},renderView(){},toast:(m,bad)=>toasts.push([m,!!bad]),closeModal(){},prompt:()=>'آزمون',views:{},titles:{},RayoJalali:{today:()=>'1405/07/10',mark(){}}};
ctx.window=ctx;vm.createContext(ctx);
const code=read('js/20-finance-module.js').replace(/\}\)\(\);\s*$/,`window.testFinance={set:(f,s)=>{fin=f;support=s;ensure()},get:()=>fin,ui,taxStatus,entryModal,saveEntry,deleteEntry,saveObligation,saveTax,cashEvents};})();`);
vm.runInContext(code,ctx);
const T=ctx.testFinance,support={cash:{reports:[{id:'R1',date:'1405/07/05',netReceivable:1000000000,snappAmount:0}],transferAccounts:[{id:'A1',name:'بانک اصلی'},{id:'RES',name:'حساب ذخیره'}],cashRecipients:[]},inventory:{purchaseInvoices:[]},hr:{payrollClosures:[],payments:[]},suppliers:{suppliers:[]}};
const base=()=>({meta:{},settings:{vatPercent:10,performanceTaxPercent:5,expenseCategories:['اجاره'],incomeCategories:[],taxReserveAccountId:'RES',taxStartMonth:'1405/07'},entries:[],monthlyOverrides:[],parties:[],obligations:[],settlements:[],checks:[],changeLog:[]});
async function check(name,run){await run();console.log('PASS '+name)}
(async()=>{
await check('legacy expense counts by its date; read-only P&L does not create override rows',()=>{
 const f=base();f.entries.push({id:'FIN-00001',type:'expense',date:'1405/07/03',category:'اجاره',amountToman:300,accountId:'A1'});T.set(f,support);
 const c=ctx.RayoFinanceLedger.monthCalc(1405,7);assert.equal(c.otherExpense,300);assert.equal(ctx.RayoFinanceLedger.monthCalc(1405,8).otherExpense,0);assert.equal(T.get().monthlyOverrides.length,0);
});
await check('expense month and spreading: 1,200 over 12 months = 100 per month, only inside the range',()=>{
 const f=base();f.entries.push({id:'FIN-00001',type:'expense',date:'1405/08/20',expenseMonth:'1405/07',spreadMonths:12,category:'بیمه',amountToman:1200,accountId:'A1',paymentStatus:'paid'});T.set(f,support);
 const m=(y,mm)=>ctx.RayoFinanceLedger.monthCalc(y,mm).otherExpense;assert.equal(m(1405,6),0);assert.equal(m(1405,7),100);assert.equal(m(1405,12),100);assert.equal(m(1406,6),100);assert.equal(m(1406,7),0);
});
await check('unpaid expense: counts in its month, creates one linked payable, moves no money; payment is not a second expense',async()=>{
 T.set(base(),support);checkedPay='unpaid';fill({finEDate:'1405/07/10',finECat:'اجاره',finENewCat:'',finEAmt:'۵۰۰٬۰۰۰',finETitle:'اجاره مهر',finENotes:'',finEMonth:'1405/07',finESpread:'1',finEParty:'صاحب ملک',finEDue:'1405/08/05',finEAccount:''});
 await T.saveEntry('','expense');const f=T.get(),e=f.entries[0],o=f.obligations[0];
 assert.equal(e.paymentStatus,'unpaid');assert.equal(e.accountId,'');assert.equal(o.sourceExpenseId,e.id);assert.equal(e.linkedObligationId,o.id);assert.equal(o.amountToman,500000);assert.equal(o.direction,'payable');assert.equal(o.partyNameSnapshot,'صاحب ملک');
 assert.equal(ctx.RayoFinanceLedger.monthCalc(1405,7).otherExpense,500000);assert.equal(T.cashEvents().filter(x=>x.id.includes(e.id)).length,0);
 f.settlements.push({id:'SET-00001',obligationId:o.id,direction:'payment',date:'1405/08/05',amountToman:500000,accountKey:'account:A1',status:'active'});
 assert.equal(ctx.RayoFinanceLedger.monthCalc(1405,8).totalExpense,ctx.RayoFinanceLedger.monthCalc(1405,8).vat+ctx.RayoFinanceLedger.monthCalc(1405,8).tax);
 assert.equal(T.cashEvents().filter(x=>x.id==='settlement:SET-00001')[0].amount,-500000);
 toasts.length=0;await T.saveObligation(o.id);assert(toasts.some(([m,bad])=>bad&&m.includes('ثبت هزینه')),'generated payable must be edited from the expense');
 toasts.length=0;await T.deleteEntry(e.id);assert(toasts.some(([m,bad])=>bad&&m.includes('پرداخت')),'a paid linked payable blocks voiding the expense');assert.notEqual(e.status,'void');
});
await check('voiding an unpaid expense without payments also voids its payable; editing syncs the amount',async()=>{
 T.set(base(),support);checkedPay='unpaid';fill({finEDate:'1405/07/10',finECat:'اجاره',finENewCat:'',finEAmt:'1000',finETitle:'',finEMonth:'1405/07',finESpread:'1',finEParty:'',finEDue:''});
 await T.saveEntry('','expense');const f=T.get(),e=f.entries[0];fill({finEAmt:'1500'});await T.saveEntry(e.id,'expense');
 assert.equal(f.obligations.length,1);assert.equal(f.obligations[0].amountToman,1500);
 await T.deleteEntry(e.id);assert.equal(e.status,'void');assert.equal(f.obligations[0].status,'void');assert.equal(ctx.RayoFinanceLedger.monthCalc(1405,7).otherExpense,0);
});
await check('paid expense still requires an account',async()=>{
 T.set(base(),support);checkedPay='paid';toasts.length=0;fill({finEDate:'1405/07/10',finECat:'اجاره',finENewCat:'',finEAmt:'1000',finEMonth:'1405/07',finESpread:'1',finEAccount:''});
 await T.saveEntry('','expense');assert.equal(T.get().entries.length,0);assert(toasts.some(([,bad])=>bad));
});
await check('tax reserve: accrued from sales, reserve transfer and tax payment are cash only, not P&L expenses',async()=>{
 T.set(base(),support);
 const c=ctx.RayoFinanceLedger.monthCalc(1405,7);assert.equal(c.sales,100000000);assert.equal(c.vat+c.tax,15000000);
 fill({finTDate:'1405/07/20',finTAccount:'A1',finTAmt:'10000000',finTNotes:''});await T.saveTax('taxReserve','');
 fill({finTDate:'1405/07/25',finTAccount:'RES',finTAmt:'4000000',finTNotes:''});await T.saveTax('taxPayment','');
 const t=ctx.RayoFinanceLedger.taxStatus(1405,7);assert.deepStrictEqual({accrued:t.accrued,paid:t.paid,due:t.due,reserved:t.reserved,gap:t.gap},{accrued:15000000,paid:4000000,due:11000000,reserved:6000000,gap:5000000});
 assert.equal(ctx.RayoFinanceLedger.monthCalc(1405,7).otherExpense,0);
 const ev=T.cashEvents();assert.equal(ev.filter(x=>x.key==='account:A1').reduce((a,x)=>a+x.amount,0),-10000000);assert.equal(ev.filter(x=>x.key==='account:RES').reduce((a,x)=>a+x.amount,0),6000000);
 toasts.length=0;fill({finTAccount:'RES'});await T.saveTax('taxReserve','');assert(toasts.some(([m,bad])=>bad&&m.includes('نباید یکی')));
});
await check('custody ledger mirrors the reserve transfer into the reserve account',()=>{
 const cash=read('js/11-rayo-cash-report-module.js');assert(cash.includes("'taxReserve','taxPayment'].includes(r.type)"));assert(cash.includes("if(r.type==='taxReserve'&&r.targetAccountId)add('account',r.targetAccountId"));
});
assert(saves.every(([m])=>m==='finance'),'only the finance module is saved');
console.log('finance accrual & tax reserve QA: all passed');
})().catch(e=>{console.error(e);process.exitCode=1});
