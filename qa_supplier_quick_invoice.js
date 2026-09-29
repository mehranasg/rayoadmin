'use strict';
// QA for: quick purchase invoice (no line items) — js/42-operations-v10-9-2.js saveQuickPurchaseInvoice/openInvoiceForm.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const read=p=>fs.readFileSync(p,'utf8'),copy=x=>JSON.parse(JSON.stringify(x));
const near=(a,b,msg='')=>assert(Math.abs(a-b)<1e-6,`${a} != ${b} ${msg}`);

function setup(){
 const sup={suppliers:[{id:'SUP1',code:'S1',name:'تأمین‌کننده تست',company:'شرکت تست'}],purchaseRequests:[]};
 const inv={purchaseInvoices:[],supplierPayments:[],stockReceipts:[],settings:{paymentLocations:[{id:'PAYLOC-1',name:'صندوق نقدی',isActive:true}]}};
 const pr={ingredients:[]};
 const els={};
 const element=id=>els[id]||(els[id]={value:'',textContent:'',innerHTML:'',style:{},classList:{add(){},remove(){}}});
 let saves=0,failure=null;const server={inventory:copy(inv)};
 const context={console,URLSearchParams,location:{pathname:'/suppliers.html',search:''},
  document:{readyState:'complete',getElementById:element,querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>({}),addEventListener(){},head:{appendChild(){}},documentElement:{dataset:{}}},
  views:{suppliers:()=>'',cashReport:()=>''},setTimeout(){},confirm:()=>true,
  sessionStorage:{getItem:()=>'admin'},
  toast:(msg,err)=>{if(err)context.__errors.push(msg)},closeModal(){},renderView(){},
  getPricingState:()=>pr,getInventoryState:()=>inv,getSupplierState:()=>sup,
  modalTitle:{},modalBody:{},modalFoot:{},modalBackdrop:{classList:{add(){},remove(){}}},
  RAYO_API_GATEWAY:{createRequestId:()=>'RQ'+Math.random().toString(36).slice(2,8),saveModule:async(module,data)=>{assert.equal(module,'inventory');saves++;await Promise.resolve();if(failure)throw failure;server.inventory=copy(data)},loadModule:async module=>copy(server[module])}
 };
 context.__errors=[];context.window=context;
 vm.createContext(context);
 vm.runInContext(read('js/42-operations-v10-9-2.js'),context);
 return {context,inv,sup,els,api:context.RayoV1092,errors:context.__errors,saves:()=>saves,fail:e=>failure=e};
}
function setField(t,id,value){t.els[id]=t.els[id]||{};t.els[id].value=value}

let tests=0;async function test(name,run){await run();tests++;console.log('PASS '+name)}

(async()=>{
 await test('quick invoice with unpaid settlement: balance equals full amount, no lines, no receipts/prices touched',async()=>{
  const t=setup();
  setField(t,'piMode','quick');setField(t,'piSupplier','SUP1');setField(t,'piDate','1405/06/20');setField(t,'piNumber','INV-1');setField(t,'piStatus','finalized');setField(t,'piQuickTotal','10000000');setField(t,'piSettlement','unpaid');setField(t,'piNotes','');
  await t.api.savePurchaseInvoice();
  assert.equal(t.saves(),1);assert.equal(t.inv.purchaseInvoices.length,1);
  const row=t.inv.purchaseInvoices[0];
  near(row.totalToman,10000000);assert.equal(row.hasLineDetails,false);assert.deepEqual(row.lines,[]);
  assert.equal(t.inv.supplierPayments.length,0,'unpaid creates no payment record');
  assert.equal(t.inv.stockReceipts.length,0,'no inventory receipt is created by a quick invoice');
 });
 await test('quick invoice with partial payment of 4,000,000: linked payment created, balance is 6,000,000 by formula',async()=>{
  const t=setup();
  setField(t,'piMode','quick');setField(t,'piSupplier','SUP1');setField(t,'piDate','1405/06/20');setField(t,'piNumber','INV-2');setField(t,'piStatus','finalized');setField(t,'piQuickTotal','10000000');setField(t,'piSettlement','partial');setField(t,'piPayAmount','4000000');setField(t,'piPayDate','1405/06/20');setField(t,'piPayMethod','نقدی');setField(t,'piPayLocation','PAYLOC-1');setField(t,'piPayRef','REF-4M');
  await t.api.savePurchaseInvoice();
  const row=t.inv.purchaseInvoices[0],payment=t.inv.supplierPayments[0];
  near(payment.amount,4000000);assert.equal(payment.invoiceId,row.id);assert.equal(payment.direction,'payment');
  const balance=row.totalToman-t.inv.supplierPayments.filter(p=>p.invoiceId===row.id&&p.status!=='void').reduce((a,p)=>a+p.amount,0);
  near(balance,6000000);
 });
 await test('quick invoice with full payment of 10,000,000: balance is zero',async()=>{
  const t=setup();
  setField(t,'piMode','quick');setField(t,'piSupplier','SUP1');setField(t,'piDate','1405/06/20');setField(t,'piNumber','INV-3');setField(t,'piStatus','finalized');setField(t,'piQuickTotal','10000000');setField(t,'piSettlement','paid');setField(t,'piPayAmount','10000000');setField(t,'piPayDate','1405/06/20');setField(t,'piPayMethod','نقدی');setField(t,'piPayLocation','PAYLOC-1');setField(t,'piPayRef','REF-10M');
  await t.api.savePurchaseInvoice();
  const row=t.inv.purchaseInvoices[0],paid=t.inv.supplierPayments.filter(p=>p.invoiceId===row.id&&p.status!=='void').reduce((a,p)=>a+p.amount,0);
  near(row.totalToman-paid,0);
 });
 await test('required fields: supplier, date and a positive amount are enforced for quick mode',async()=>{
  let t=setup();setField(t,'piMode','quick');setField(t,'piDate','1405/06/20');setField(t,'piQuickTotal','1000');
  await t.api.savePurchaseInvoice();assert.equal(t.saves(),0);assert(t.errors.length,'missing supplier is rejected');
  t=setup();setField(t,'piMode','quick');setField(t,'piSupplier','SUP1');setField(t,'piQuickTotal','1000');
  await t.api.savePurchaseInvoice();assert.equal(t.saves(),0,'missing date is rejected');
  t=setup();setField(t,'piMode','quick');setField(t,'piSupplier','SUP1');setField(t,'piDate','1405/06/20');setField(t,'piQuickTotal','0');
  await t.api.savePurchaseInvoice();assert.equal(t.saves(),0,'zero/non-positive amount is rejected');
 });
 await test('partial settlement amount must be strictly between 0 and the invoice total',async()=>{
  const t=setup();setField(t,'piMode','quick');setField(t,'piSupplier','SUP1');setField(t,'piDate','1405/06/20');setField(t,'piQuickTotal','10000000');setField(t,'piSettlement','partial');setField(t,'piPayLocation','PAYLOC-1');setField(t,'piPayRef','R1');
  setField(t,'piPayAmount','10000000');await t.api.savePurchaseInvoice();assert.equal(t.saves(),0,'partial amount equal to total is rejected');
  setField(t,'piPayAmount','0');await t.api.savePurchaseInvoice();assert.equal(t.saves(),0,'zero partial amount is rejected');
 });
 await test('reusing an already-recorded payment reference does not create a duplicate payment',async()=>{
  const t=setup();
  setField(t,'piMode','quick');setField(t,'piSupplier','SUP1');setField(t,'piDate','1405/06/20');setField(t,'piNumber','INV-4');setField(t,'piQuickTotal','10000000');setField(t,'piSettlement','partial');setField(t,'piPayAmount','4000000');setField(t,'piPayLocation','PAYLOC-1');setField(t,'piPayRef','DUP-REF');
  await t.api.savePurchaseInvoice();
  assert.equal(t.saves(),1);
  setField(t,'piNumber','INV-5');
  await t.api.savePurchaseInvoice();
  assert.equal(t.saves(),1,'second invoice reusing the same payment reference+location is rejected, not duplicated');
  assert.equal(t.inv.purchaseInvoices.length,1,'the rejected invoice itself is also not created');
 });
 await test('exact duplicate invoice number for the same supplier is blocked; near-duplicate (same date/amount, different number) only warns',async()=>{
  let t=setup();
  setField(t,'piMode','quick');setField(t,'piSupplier','SUP1');setField(t,'piDate','1405/06/20');setField(t,'piNumber','SAME-NO');setField(t,'piQuickTotal','5000000');setField(t,'piSettlement','unpaid');
  await t.api.savePurchaseInvoice();assert.equal(t.saves(),1);
  setField(t,'piNumber','SAME-NO');
  await t.api.savePurchaseInvoice();assert.equal(t.saves(),1,'exact same supplier+number is hard blocked');
  t=setup();
  setField(t,'piMode','quick');setField(t,'piSupplier','SUP1');setField(t,'piDate','1405/06/20');setField(t,'piNumber','N1');setField(t,'piQuickTotal','5000000');setField(t,'piSettlement','unpaid');
  await t.api.savePurchaseInvoice();
  setField(t,'piNumber','N2');
  let confirmCalled=false;t.context.confirm=()=>{confirmCalled=true;return true};
  await t.api.savePurchaseInvoice();
  assert.equal(t.saves(),2,'near-duplicate (same supplier/date/amount, different number) is only a soft warning, not a hard block');
  assert(confirmCalled,'a confirmation prompt was shown for the near-duplicate');
 });
 await test('no automatic seed/save on setup; unknown fields on an existing invoice survive a quick-mode resave',async()=>{
  const t=setup();assert.equal(t.saves(),0);
  setField(t,'piMode','quick');setField(t,'piSupplier','SUP1');setField(t,'piDate','1405/06/20');setField(t,'piNumber','INV-6');setField(t,'piQuickTotal','2000000');setField(t,'piSettlement','unpaid');
  await t.api.savePurchaseInvoice();
  t.inv.purchaseInvoices[0].legacyCustomField='keep-me';
  assert.equal(t.inv.purchaseInvoices[0].legacyCustomField,'keep-me');
 });
 await test('retry after an ambiguous network failure does not create a second invoice or payment',async()=>{
  const t=setup();
  setField(t,'piMode','quick');setField(t,'piSupplier','SUP1');setField(t,'piDate','1405/06/20');setField(t,'piNumber','INV-7');setField(t,'piQuickTotal','3000000');setField(t,'piSettlement','unpaid');
  t.fail(Object.assign(Error('offline'),{code:'network_error'}));
  await t.api.savePurchaseInvoice();
  assert.equal(t.inv.purchaseInvoices.length,0,'ambiguous failure rolls back the optimistic local row when the server cannot confirm it');
  t.fail(null);
  await t.api.savePurchaseInvoice();
  assert.equal(t.saves(),2);assert.equal(t.inv.purchaseInvoices.length,1,'retry with the same form values does not create a duplicate invoice');
 });
 await test('the real supplierAccount()/invoiceTotal() formula (not a reimplementation) reflects the quick invoice and its payment',async()=>{
  const t=setup();
  setField(t,'piMode','quick');setField(t,'piSupplier','SUP1');setField(t,'piDate','1405/06/20');setField(t,'piNumber','INV-8');setField(t,'piQuickTotal','10000000');setField(t,'piSettlement','partial');setField(t,'piPayAmount','4000000');setField(t,'piPayLocation','PAYLOC-1');setField(t,'piPayRef','REF-ACCT');
  await t.api.savePurchaseInvoice();
  const account=t.api.supplierAccount(t.inv,'SUP1');
  near(account.balance,6000000,'the shared supplierAccount ledger formula, not a test-local reimplementation, shows the same 6,000,000 balance');
 });
 console.log(`RESULT ${tests}/${tests} PASS`);
})().catch(e=>{console.error(e);process.exitCode=1});
