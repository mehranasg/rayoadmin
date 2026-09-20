'use strict';
const assert=require('assert'),fs=require('fs'),vm=require('vm');
const clone=x=>JSON.parse(JSON.stringify(x));

async function financeScenario(){
  const sources={
    finance:{meta:{},settings:{vatPercent:0,performanceTaxPercent:0,expenseCategories:[],incomeCategories:[],obligationCategories:['سایر']},entries:[],monthlyOverrides:[],parties:[{id:'PTY-1',name:'طرف آزمون',status:'active'}],obligations:[{id:'OBL-1',direction:'payable',partySource:'finance',partyId:'PTY-1',partyNameSnapshot:'طرف آزمون',title:'بدهی شهریور',category:'سایر',amountToman:10000000,date:'1405/06/31',entryType:'opening',status:'active'}],settlements:[],checks:[],changeLog:[],unknownRoot:{keep:'yes'}},
    cashreport:{transferAccounts:[{id:'BANK-1',name:'بانک آزمون',status:'فعال'}],cashRecipients:[],reports:[]},
    inventory:{settings:{paymentLocations:[]},purchaseInvoices:[],supplierPayments:[],inventoryMovements:[],supplierDirectDebts:[]},
    hr:{personnel:[],payments:[],payrollClosures:[]},suppliers:{suppliers:[]}
  };
  const elements={
    finSDate:{value:'1405/07/02'},finSAmount:{value:'3000000'},finSAccount:{value:'account:BANK-1'},finSReference:{value:'PAY-001'},finSMethod:{value:'حواله'},finSNotes:{value:'تسویه بدهی شهریور'},finModalSave:{disabled:false},
    modalTitle:{},modalBody:{innerHTML:''},modalFoot:{innerHTML:''},modalBackdrop:{classList:{add(){}}},
    finOpeningAccount:{value:'account:BANK-1'},finOpeningDate:{value:'1405/06/31'},finOpeningAmount:{value:'۲۰٬۰۰۰٬۰۰۰'},finOpeningNote:{value:'مانده پایان شهریور'},finOpeningPreview:{textContent:''}
  };
  let saves=0;
  const document={getElementById:id=>elements[id]||null,createElement:()=>({click(){}})};
  const c={console,URL,URLSearchParams,Blob:class{},document,location:{pathname:'/qa.html',search:'',href:'http://qa/qa.html'},history:{replaceState(){}},sessionStorage:{getItem:()=> 'qa'},views:{},titles:{},state:{lists:{months:[]}},RayoJalali:{today:()=> '1405/07/02',mark(){}},setTimeout,clearTimeout,renderView(){},closeModal(){},toast(){},prompt:()=>'',confirm:()=>true,
    RAYO_API_GATEWAY:{createRequestId:()=>`REQ-${saves+1}`,loadOrBootstrap:async m=>clone(sources[m]),saveModule:async(m,data)=>{assert.equal(m,'finance');saves++;sources.finance=clone(data)}}};
  c.window=c;c.URL.createObjectURL=()=> 'blob:qa';c.URL.revokeObjectURL=()=>{};
  vm.createContext(c);vm.runInContext(fs.readFileSync('js/20-finance-module.js','utf8'),c);
  await c.finRefresh();
  c.uiFinance.tab='opening';const openingHtml=c.views.finance();
  for(const label of ['افتتاحیه یعنی مانده پایان شهریور','افتتاحیه صندوق / بانک','گردش نقدی ماه','موارد مشکوک'])assert(openingHtml.includes(label));
  await c.finSaveSettlement('OBL-1');
  assert.equal(c.getFinanceState().settlements.length,1);
  assert.equal(c.RayoFinanceLedger.calcObligation(c.getFinanceState().obligations[0]).balance,7000000);
  assert.equal(c.RayoFinanceLedger.cashEvents().filter(x=>x.date.startsWith('1405/07')).reduce((n,x)=>n+x.amount,0),-3000000);
  assert.equal(c.RayoFinanceLedger.monthCalc(1405,7).totalExpense,0,'settlement must not be a new Mehr expense');
  const savedOnce=saves;await c.finSaveSettlement('OBL-1');
  assert.equal(c.getFinanceState().settlements.length,1,'same settlement reference is idempotent');assert.equal(saves,savedOnce);
  c.finPreviewOpening();await c.finSaveOpening();
  assert.equal(c.RayoFinanceLedger.accountPosition('account:BANK-1','1405/07/31').balance,17000000);
  assert.equal(sources.finance.unknownRoot.keep,'yes','unknown JSON keys survive Save');
  await c.finRefresh();
  assert.equal(c.RayoFinanceLedger.accountPosition('account:BANK-1','1405/07/31').balance,17000000,'opening and links survive reload');
  assert.equal(c.RayoFinanceLedger.calcObligation(c.getFinanceState().obligations[0]).balance,7000000,'settlement link survives reload');
  console.log('PASS opening debt 10m - settlement 3m = 7m; cash out 3m; Mehr expense 0; duplicate blocked; cash opening round-trip');
}

async function inventoryScenario(){
  const inventory={settings:{mainLocationId:'LOC',defaultSalesLocationId:'LOC',countApprovalRequired:false},locations:[{id:'LOC',name:'انبار',type:'main',isActive:true}],stocktakes:[{id:'ST-BULK-OPEN',date:'1405/06/31',locationId:'LOC',status:'approved',isOpeningBaseline:true,lines:[{ingredientId:'ING',actual:10,unitCost:100000,isOpeningBaseline:true}]}],stockReceipts:[{id:'REC-1',invoiceId:'INV-1',date:'1405/07/02',ingredientId:'ING',locationId:'LOC',quantity:2,unitCostToman:120000,status:'posted'}],purchaseInvoices:[{id:'INV-1',supplierId:'SUP',number:'F-1',date:'1405/07/02',status:'finalized',lines:[{ingredientId:'ING',stockQuantity:2,lineTotalToman:240000}]}],inventoryMovements:[],openingBalances:[],consumptionRecords:[],supplierPayments:[],supplierDirectDebts:[],wasteRecords:[],wasteShiftDeclarations:[],salesPeriods:[],trackedIngredients:[],periodClosures:[],changeLog:[]};
  const pricing={settings:{},ingredients:[{id:'ING',name:'قلم آزمون',recipeUnit:'کیلو',packageQuantity:1}],menuItems:[],recipes:[],recipeVersions:[],changeLog:[]};
  let saves=0;
  const c={console,URL,URLSearchParams,location:{search:'',href:'http://qa/inventory.html'},history:{replaceState(){}},sessionStorage:{getItem:()=> 'qa'},document:{getElementById:()=>null,querySelectorAll:()=>[]},setTimeout,clearTimeout,views:{},titles:{},ops:{tab:'stock'},currentView:'qa',renderView(){},toast(){},confirm:()=>true,prompt:()=>'',getInventoryState:()=>inventory,getPricingState:()=>pricing,getSupplierState:()=>({suppliers:[]}),getCashReportState:()=>({reports:[]}),
    RayoIngredientMath:{unitKey:x=>x||'',calculate:()=>({grossUnitCost:100000}),grossQuantity:()=>0,recipeAt:()=>[],grossCost:()=>100000,verifySaved(){},snapshotLines:()=>[]},
    RAYO_API_GATEWAY:{loadOrBootstrap:async m=>m==='hr'?{personnel:[]}:{},getModuleStatus:()=>({sourceValid:true}),saveModule:async()=>{saves++}}};
  c.window=c;vm.createContext(c);vm.runInContext(fs.readFileSync('js/32-inventory-cost-control-v10.js','utf8'),c);
  await c.RayoInventoryV10.ensure();
  assert.equal(c.RayoInventoryV10.positionAtLocation('ING','LOC','1405/07/02').quantity,12);
  assert.equal(inventory.inventoryMovements.filter(x=>x.sourceKey==='receipt:REC-1').length,1);
  inventory.stockReceipts[0].quantity=3;await c.RayoInventoryV10.resyncLedger();
  assert.equal(c.RayoInventoryV10.positionAtLocation('ING','LOC','1405/07/02').quantity,13,'editing receipt updates one linked movement');
  assert.equal(inventory.inventoryMovements.filter(x=>x.sourceKey==='receipt:REC-1').length,1,'resync does not duplicate movement');
  inventory.purchaseInvoices[0].status='void';
  assert.equal(c.RayoInventoryV10.positionAtLocation('ING','LOC','1405/07/02').quantity,10,'void invoice removes linked receipt effect');
  assert(saves>=1);
  console.log('PASS inventory opening 10 + linked receipt 2 = 12; edit is one effect; void returns to 10');
}

function supplierAndPayrollScenario(){
  const supplierSource=fs.readFileSync('js/42-operations-v10-9-2.js','utf8');
  const take=(source,name)=>{const match=source.match(new RegExp(`function ${name}\\([^\\r\\n]+`));assert(match,`missing ${name}`);return match[0]};
  const sc={A:x=>Array.isArray(x)?x:[],S:x=>String(x??'').trim(),N:x=>Number(x)||0,isArchived:x=>x?.isArchived===true};
  vm.createContext(sc);vm.runInContext(['invoiceIsFinal','invoiceTotal','validDirectDebt','rawAccountPosition','supplierAccount'].map(n=>take(supplierSource,n)).join('\n'),sc);
  const payable={purchaseInvoices:[{id:'OLD',supplierId:'SUP',date:'1405/06/20',status:'finalized',totalToman:4000000}],supplierDirectDebts:[{id:'OPEN',supplierId:'SUP',debtType:'opening',baselineDate:'1405/06/31',declaredBalanceToman:10000000,status:'active'}],supplierPayments:[{id:'PAY',supplierId:'SUP',direction:'payment',date:'1405/07/02',amount:3000000,status:'active'}]};
  assert.equal(sc.supplierAccount(payable,'SUP').balance,7000000,'old invoice is replaced by opening, not added again');
  const receivable=clone(payable);receivable.supplierDirectDebts[0].declaredBalanceToman=-10000000;receivable.supplierPayments[0].direction='receipt';
  assert.equal(sc.supplierAccount(receivable,'SUP').balance,-7000000,'collection reduces an opening receivable without income');

  const baseSource=fs.readFileSync('js/00-base.js','utf8'),pc={n:x=>Number(x)||0,structuredClone,state:{payments:[{id:'PAY-1',personnelId:'P-1',salaryYear:1405,salaryMonth:7,type:'حقوق',amount:3000000,status:'active'}]}};
  vm.createContext(pc);vm.runInContext(take(baseSource,'payrollSettlementRow'),pc);
  const row=pc.payrollSettlementRow({personnelId:'P-1',unpaid:10000000,advance:0,paid:0},{year:1405,month:7});
  assert.equal(row.unpaid,7000000);assert.equal(row.paid,3000000);
  assert(baseSource.includes("openingBalanceMode:entered?'replacePreviousBalance':''"));
  assert(baseSource.includes("name:'openingBaselineDate'"),'personnel opening shows its baseline date');
  assert(baseSource.includes("o.openingBaselineDate!==jDate(ui.payroll.year,ui.payroll.month,1)"),'personnel opening date is tied to selected period');
  const oldOps=fs.readFileSync('js/14-ops-integration.js','utf8');
  assert(oldOps.includes("r.supplierId===supplierId&&S(r.number||r.invoiceNumber)===number"),'legacy invoice entry blocks duplicate supplier number');
  assert(oldOps.includes("x.paymentLocationId===paymentLocationId&&S(x.reference)===reference"),'supplier settlement blocks duplicate account/reference');
  assert(oldOps.includes("rangeOverlapCore(from,to,x.from||x.date,x.to||x.date)"),'manual sales blocks overlapping import');
  assert(supplierSource.includes('فاکتور دارای رسید است'),'invoice edits respect linked receipts');
  const financeSource=fs.readFileSync('js/20-finance-module.js','utf8');
  assert(financeSource.includes('finCClearAccount'),'cleared checks require a cash account');
  assert(financeSource.includes('inventory.html?tab=count'),'opening guide points to the actual stocktake form');
  assert(financeSource.includes('مرجع وجه مشترک بین ماژول‌ها'),'cross-module settlement references are audited without automatic deletion');
  console.log('PASS supplier payable/receivable opening replacement and payroll settlement against recognized balance');
}

(async()=>{await financeScenario();await inventoryScenario();supplierAndPayrollScenario()})().catch(e=>{console.error(e);process.exitCode=1});
