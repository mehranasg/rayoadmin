'use strict';
// Consumption management report (inventory tab «مدیریت مصرف»): engine in 32, UI and settings card in 46. Synthetic data only.
const fs=require('fs'),vm=require('vm'),assert=require('assert'),{webcrypto}=require('crypto');
const read=f=>fs.readFileSync(f,'utf8'),copy=x=>JSON.parse(JSON.stringify(x)),near=(a,b,eps=1e-6,msg)=>assert(Math.abs(a-b)<=eps,`${msg||''} expected ${b}, got ${a}`);
const FROM='1405/06/01',TO='1405/06/31';
function fixture(){
 const base={status:'فعال',purchaseUnit:'کیلوگرم',packageQuantity:1,wastePercent:0,lastPurchaseDate:'1405/05/01'};
 const ingredients=[
  {...base,id:'napkin',code:'QA-NP',name:'دستمال کاغذی',category:'بهداشتی',itemType:'OPERATIONAL_CONSUMABLE',recipeUnit:'عدد',purchaseUnit:'عدد',lastPurchasePriceToman:100},
  {...base,id:'meat',code:'QA-MT',name:'گوشت گوساله',category:'پروتئین',itemType:'MENU_INGREDIENT',recipeUnit:'گرم',purchaseUnit:'کیلوگرم',packageQuantity:1000,wastePercent:6,lastPurchasePriceToman:1000000},
  {...base,id:'flour',code:'QA-FL',name:'آرد',category:'خشکبار',itemType:'MENU_INGREDIENT',recipeUnit:'کیلوگرم',lastPurchasePriceToman:50000},
  {...base,id:'cheese',code:'QA-CH',name:'پنیر',category:'لبنیات',itemType:'MENU_INGREDIENT',recipeUnit:'کیلوگرم',lastPurchasePriceToman:200000},
  {...base,id:'sugar',code:'QA-SG',name:'شکر',category:'خشکبار',itemType:'MENU_INGREDIENT',recipeUnit:'کیلوگرم',lastPurchasePriceToman:40000},
  {...base,id:'salt',code:'QA-SL',name:'نمک',category:'خشکبار',itemType:'MENU_INGREDIENT',recipeUnit:'کیلوگرم',lastPurchasePriceToman:10000,lastPurchaseDate:''},
  {...base,id:'service',code:'QA-SV',name:'خدمت',category:'خدمات',itemType:'NON_STOCK',recipeUnit:'عدد',lastPurchasePriceToman:1}
 ];
 const pricing={meta:{initialized:true},settings:{},lists:{},ingredients,
  menuItems:[{id:'burger',code:'M1',name:'برگر',category:'غذا',currentPriceToman:500000},{id:'pizza',code:'M2',name:'پیتزا',category:'غذا',currentPriceToman:400000},{id:'tea',code:'M3',name:'چای',category:'نوشیدنی',currentPriceToman:50000}],
  recipes:[],
  recipeVersions:[
   {id:'rv-burger',menuItemId:'burger',effectiveFrom:'1405/01/01',lines:[{ingredientId:'meat',quantity:150,recipeUnit:'گرم',wastePercent:6},{ingredientId:'flour',quantity:0.1,recipeUnit:'کیلوگرم',wastePercent:0}]},
   {id:'rv-pizza',menuItemId:'pizza',effectiveFrom:'1405/01/01',lines:[{ingredientId:'flour',quantity:0.3,recipeUnit:'کیلوگرم',wastePercent:0},{ingredientId:'cheese',quantity:0.05,recipeUnit:'کیلوگرم',wastePercent:0}]}
  ],
  ingredientPriceHistory:[{id:'ph-meat',ingredientId:'meat',date:'1405/05/15',priceToman:900000,packageQuantity:1000,purchaseUnit:'کیلوگرم',recipeUnit:'گرم',source:'manual'}],changeLog:[]};
 const whole=(id,date,boundary,lines)=>({id,date,locationId:'',inventoryScope:'RAYO',baselineBoundary:boundary,isOpeningBaseline:boundary==='START',status:'approved',createdAt:'2026-08-01T00:00:00Z',lines:lines.map(([ingredientId,actual])=>({ingredientId,actual,unitSnapshot:ingredients.find(i=>i.id===ingredientId).recipeUnit}))});
 const receipt=(id,date,ingredientId,quantity,purchaseQuantity,unitPrice)=>({id,date,locationId:'main',ingredientId,quantity,purchaseQuantity,unitPrice,status:'posted',sourceType:'DIRECT_ENTRY',unitSnapshot:ingredients.find(i=>i.id===ingredientId).recipeUnit});
 const inventory={meta:{initialized:true},settings:{mainLocationId:'main',defaultSalesLocationId:'main',inventoryControlMode:'unified',consumptionAlerts:{legacyKey:'keep'},unknownSetting:{keep:true}},locations:[{id:'main',name:'انبار اصلی',isActive:true}],openingBalances:[],
  stocktakes:[whole('ST-OPEN',FROM,'START',[['napkin',1400],['meat',10000],['flour',20],['cheese',5],['sugar',10],['salt',3]]),whole('ST-CLOSE',TO,'END',[['napkin',1000],['meat',8200],['flour',8],['cheese',5],['salt',1]])],
  spotCounts:['1405/02/01','1405/03/01','1405/04/01','1405/05/01'].map((date,k)=>({id:`SPOT-${k}`,date,kind:'SPOT_CONSUMABLE',status:'approved',lines:[{ingredientId:'napkin',actual:3000-k*400}]})),
  stockReceipts:[receipt('R-NP1','1405/06/05','napkin',500,500,100),receipt('R-NP2','1405/06/20','napkin',300,300,100),receipt('R-MT','1405/06/10','meat',5000,5,1000000)],
  purchaseInvoices:[],inventoryMovements:[],
  salesPeriods:[{id:'S-1',from:'1405/06/15',to:'1405/06/15',status:'posted',lines:[{menuItemId:'burger',quantity:40,date:'1405/06/15',salePriceToman:500000},{menuItemId:'pizza',quantity:20,date:'1405/06/15',saleAmountToman:8000000}]}],
  wasteRecords:[{id:'W-MT',date:'1405/06/12',type:'ingredient',itemId:'meat',quantity:200,eventType:'WASTE',reason:'سوختن',locationId:'main',status:'posted'},{id:'W-FL',date:'1405/06/12',type:'ingredient',itemId:'flour',quantity:0.5,eventType:'SPILL',reason:'ریزش',locationId:'main',status:'posted'},{id:'W-PZ',date:'1405/06/18',type:'menu',itemId:'pizza',quantity:1,eventType:'WASTE',reason:'برگشت مشتری',locationId:'main',status:'posted'}],
  consumptionRecords:[],periodClosures:[],trackedIngredients:[],changeLog:[],unknownRoot:{keep:true}};
 // 100 invoices before each earlier spot interval; 300 invoices in the report month.
 const cashDay=(id,date,receiptCount,netReceivable)=>({id,date,receiptCount,snappReceiptCount:0,netReceivable,taxAmount:0,debtorAmount:0,deliveryFeeAmount:0,snappAmount:0});
 const cashreport={meta:{initialized:true},settings:{},reports:[cashDay('C-2','1405/02/15',100,1e8),cashDay('C-3','1405/03/15',100,1e8),cashDay('C-4','1405/04/15',100,1e8),cashDay('C-5','1405/05/15',100,1e8),cashDay('C-6a','1405/06/10',150,1e9),cashDay('C-6b','1405/06/20',150,1e9),{...cashDay('C-arch','1405/06/21',999,9e9),isArchived:true}],cashiers:[],transferAccounts:[],cashRecipients:[],changeLog:[]};
 return {inventory,pricing,cashreport,suppliers:{meta:{initialized:true},suppliers:[],items:[],supplierItems:[]},personnel:{meta:{initialized:true},personnel:[{id:'P1',name:'پرسنل آزمایشی'}]}};
}
async function setup({failLoad=false,mutate=null,today='1405/07/24'}={}){
 const server=fixture();if(mutate)mutate(server);const calls=[],messages=[],elements={},downloads=[];let inventory,pricing,cash,failSave=false;
 const el=id=>elements[id]||(elements[id]={value:'',checked:false,textContent:'',innerHTML:'',style:{},dataset:{},addEventListener(){},classList:{add(){},remove(){}}});
 const c={console,URL,URLSearchParams,Blob,AbortController,Uint8Array,Intl,crypto:webcrypto,location:{pathname:'/inventory.html',search:''},currentView:'inventory',setTimeout:(fn,ms)=>ms>=400&&ms<=3000?setTimeout(fn,0):0,clearTimeout,sessionStorage:{getItem:k=>k==='rayo_admin_user'?'qa-manager':null},RAYO_ENV:{API_ORIGIN:'https://fixture.invalid',TIMEOUT_MS:200},
  document:{readyState:'loading',documentElement:{dataset:{}},getElementById:el,querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>({click(){downloads.push(true)},remove(){}}),body:{appendChild(){}},head:{appendChild(){}},addEventListener(){}},$:el,esc:x=>String(x??''),toast:(m,err)=>messages.push((err?'ERR ':'')+m),renderView(){},closeModal(){},confirm:()=>true,RayoJalali:{today:()=>today},getInventoryState:()=>inventory,getSupplierState:()=>server.suppliers,getCashReportState:()=>cash,
  fetch:async(url,options={})=>{calls.push({url,method:options.method||'GET'});const u=new URL(url),module=u.searchParams.get('module');if(failLoad||failSave&&options.method==='POST')return {ok:false,status:503,text:async()=>JSON.stringify({message:'fixture unavailable'})};if(u.pathname.endsWith('/Save')){server[module]=JSON.parse(options.body);return {ok:true,status:200,text:async()=>JSON.stringify({ok:true})}}if(!u.pathname.endsWith('/Load')||!server[module])throw Error('Unexpected test request '+url);return {ok:true,status:200,text:async()=>JSON.stringify(server[module])}}};
 c.window=c;vm.createContext(c);vm.runInContext(read('js/config.js'),c);
 const pricingCode=read('js/08-rayo-pricing-admin-module.js').replace('(function waitPricingModule(){','window.pcEnsureLoaded=pcEnsureLoaded;window.getPricingState=()=>pricingState;(function waitPricingModule(){');vm.runInContext(pricingCode,c);
 if(!failLoad){inventory=await c.RAYO_API_GATEWAY.loadModule('inventory');cash=await c.RAYO_API_GATEWAY.loadModule('cashreport');await c.pcEnsureLoaded();pricing=c.getPricingState()}
 vm.runInContext(read('js/32-inventory-cost-control-v10.js'),c);const api=c.RayoInventoryV10;await api.ensure();
 return {c,api,server,calls,messages,inventory,pricing,el,downloads,failSave:v=>failSave=v};
}
function installUi(t,{search='?tab=consumption',allowed=()=>true}={}){
 const c=t.c;c.location={pathname:'/inventory.html',search};c.views={inventory:()=>''};c.ops={};c.pageHead=(title,sub,actions='')=>`<h1>${title}</h1><p>${sub}</p>${actions}`;c.document.readyState='complete';c.RayoAdminAccess={allowed};
 c.downloadCsv=(name,rows)=>t.downloads.push({name,rows});c.openModal=(title,body)=>{t.el('modalTitle').textContent=title;t.el('modalBody').innerHTML=body};
 const ops=read('js/40-rayo-v10-9-comprehensive.js');vm.runInContext(ops.slice(0,ops.indexOf('function supplierLedger'))+'})();',c);vm.runInContext(read('js/46-inventory-operations-v10-12.js'),c);
 return c;
}
const row=(r,id)=>r.rows.find(x=>x.id===id),tbl=html=>{const i=html.indexOf('data-cm-table');assert(i>=0,'report table');return html.slice(i,html.indexOf('</table>',i))};
async function run(){let groups=0;const test=async(name,fn)=>{await fn();groups++;console.log('PASS '+name)};
 await test('pure helpers: percentages, levels, median and largest-remainder allocation never drift or divide by zero',async()=>{const t=await setup(),m=t.api.consumptionMath;
  assert.equal(m.pct(5,0),null);assert.equal(m.pct(null,10),null);assert.equal(m.pct(5,NaN),null);near(m.pct(1,4),25);
  assert.equal(m.level(null,3,5),'na');assert.equal(m.level(3,3,5),'ok');assert.equal(m.level(3.01,3,5),'warning');assert.equal(m.level(5.5,3,5),'critical');assert.equal(m.worst(['ok','na','warning']),'warning');assert.equal(m.worst(['na']),'na');
  assert.equal(m.median([4,1,3]),3);assert.equal(m.median([1,2,3,4]),2.5);assert.equal(m.median([]),null);
  const a=m.allocate(100,[1,1,1]);assert.equal(a.reduce((x,y)=>x+y,0),100);assert.deepEqual([...a].sort(),[33,33,34]);assert.equal(m.allocate(10,[0,0]),null);const b=m.allocate(1000001,[3,7,11,13]);assert.equal(b.reduce((x,y)=>x+y,0),1000001);
  const d=m.derivedLoss({targetMaterialCostPercent:35,wasteWarn:3,varianceWarn:2,wasteCritical:5,varianceCritical:5});near(d.warn,1.75);near(d.critical,3.5);
 });
 await test('management example: 5 billion net sales, 120M waste and 100M shortage = 2.4% + 2% = 4.4% critical',async()=>{const t=await setup(),m=t.api.consumptionMath,s=m.normalize({}),r=m.lossSummary({netSales:5e9,wasteValue:120e6,shortageValue:100e6},s);
  near(r.wasteSalesPct,2.4,1e-9);near(r.varianceSalesPct,2,1e-9);assert.equal(r.loss,220e6);near(r.lossSalesPct,4.4,1e-9);assert.equal(r.level,'critical');near(s.lossSalesWarn,1.75);near(s.lossSalesCritical,3.5);
  const z=m.lossSummary({netSales:0,wasteValue:120e6,shortageValue:100e6},s);assert.equal(z.lossSalesPct,null);assert.equal(z.level,'na','zero sales gives no misleading percentage');
  const target=m.normalize({targetMaterialCostPercent:30});near(target.lossSalesWarn,1.5);near(target.lossSalesCritical,3);const manual=m.normalize({lossSalesAuto:false,lossSalesWarn:2,lossSalesCritical:4});assert.equal(manual.lossSalesWarn,2);assert.equal(manual.lossSalesCritical,4);
 });
 await test('non-recipe item (napkin): opening + purchases − closing, per invoice, history median and alert levels',async()=>{const t=await setup(),r=t.api.consumptionReport(FROM,TO);assert(r.ready,r.error);const n=row(r,'napkin');
  assert.equal(n.open.quantity,1400);assert(n.open.physical);assert.equal(n.inflow,800);assert.equal(n.close.quantity,1000);assert(n.close.physical);assert.equal(n.actual,1200);assert.equal(n.theoretical,null,'no theoretical for a non-recipe item');assert.equal(n.shortage,null);
  assert.equal(r.sales.invoices,300,'archived cash reports are ignored');near(n.perInvoice,4);near(n.per100,400);near(n.costPerInvoice,400);assert.equal(n.values.actual,120000);assert.equal(n.kind,'indirect');
  assert.equal(n.baseline.validCount,4);near(n.baseline.median,4);assert.equal(n.alerts.find(a=>a.key==='nonRecipe').level,'ok');assert.equal(n.dataStatus,'final');
  const w=await setup({mutate:s=>{s.inventory.stocktakes[1].lines.find(l=>l.ingredientId==='napkin').actual=700}});assert.equal(row(w.api.consumptionReport(FROM,TO),'napkin').alertLevel,'warning','+25% is a warning (limit 15–25)');
  const k=await setup({mutate:s=>{s.inventory.stocktakes[1].lines.find(l=>l.ingredientId==='napkin').actual=600}});assert.equal(row(k.api.consumptionReport(FROM,TO),'napkin').alertLevel,'critical','+33% is critical');
  const few=await setup({mutate:s=>{s.inventory.spotCounts=s.inventory.spotCounts.slice(2)}}),fn=row(few.api.consumptionReport(FROM,TO),'napkin');assert.equal(fn.alerts.find(a=>a.key==='nonRecipe').level,'na');assert.equal(fn.alerts.find(a=>a.key==='nonRecipe').note,'داده کافی برای هشدار وجود ندارد');
 });
 await test('recipe item (meat, 6% yield): theoretical gross once, waste not counted again, shortage and weighted historical price',async()=>{const t=await setup(),r=t.api.consumptionReport(FROM,TO),m=row(r,'meat');
  near(m.theoretical,40*150/0.94,1e-6,'yield applied exactly once');assert.equal(m.recorded,200);assert.equal(m.actual,6800);near(m.unexplained,6800-40*150/0.94-200,1e-6);near(m.shortage,6800-40*150/0.94-200,1e-6);assert.equal(m.surplus,0);
  near(m.unitCost,(10000*900+5000*1000)/15000,1e-9,'weighted average of opening (price before the period) and period receipts');assert.equal(m.price.method,'weighted');assert.equal(m.price.estimated,false);
  near(m.values.recorded,200*m.unitCost,1e-6);near(m.wastePct,200/6800*100,1e-9);near(m.variancePct,m.shortage/m.theoretical*100,1e-9);assert.equal(m.yields.length,1);assert.equal(m.yields[0].wastePercent,6);assert.equal(m.yields[0].source,'افت ثبت‌شده در نسخهٔ رسپی');
  // Changing the catalog loss later does not reapply it to a version that already carries its own loss snapshot.
  t.pricing.ingredients.find(i=>i.id==='meat').wastePercent=20;near(row(t.api.consumptionReport(FROM,TO),'meat').theoretical,40*150/0.94,1e-6);
 });
 await test('shared material: direct menu waste stays on its item, the rest and the shortage split by theoretical use and add up exactly',async()=>{const t=await setup(),r=t.api.consumptionReport(FROM,TO),f=row(r,'flour');
  near(f.theoretical,10);near(f.recorded,0.8,1e-9,'0.5 spill + 0.3 from the wasted pizza');near(f.actual,12);near(f.shortage,1.2,1e-9);assert.equal(f.values.recorded,40000);near(f.values.shortage,60000,1e-6);
  const burger=r.menus.find(x=>x.menuId==='burger'),pizza=r.menus.find(x=>x.menuId==='pizza');
  const flourOf=(menu,kind)=>menu.materials.filter(x=>x.ingredientId==='flour'&&x.kind===kind).reduce((a,x)=>a+x.value,0);
  assert.equal(flourOf(pizza,'waste-direct'),15000);assert.equal(flourOf(burger,'waste-direct'),0);assert.equal(flourOf(burger,'waste-estimated'),10000);assert.equal(flourOf(pizza,'waste-estimated'),15000);
  assert.equal(flourOf(burger,'waste-direct')+flourOf(burger,'waste-estimated')+flourOf(pizza,'waste-direct')+flourOf(pizza,'waste-estimated'),Math.round(f.values.recorded),'waste shares add up');
  assert.equal(flourOf(burger,'shortage-estimated')+flourOf(pizza,'shortage-estimated'),Math.round(f.values.shortage),'shortage shares add up');assert.equal(flourOf(burger,'shortage-estimated'),24000);
  for(const id of ['meat','flour','cheese']){const x=row(r,id),total=Math.round(x.values.recorded||0)+Math.round(x.values.shortage||0),shared=r.menus.reduce((a,menu)=>a+menu.materials.filter(y=>y.ingredientId===id).reduce((s,y)=>s+y.value,0),0)+r.summary.unallocated.materials.filter(y=>y.ingredientId===id).reduce((s,y)=>s+y.value,0);assert.equal(shared,total,`allocation of ${id}`)}
  assert.equal(pizza.revenue,8000000,'recorded sale amount');assert.equal(burger.revenue,40*500000);assert.equal(burger.qty,40);near(burger.adjusted,burger.theoValue+burger.wasteShare+burger.shortageShare,1e-6);
 });
 await test('surplus is shown apart and never reduces the loss; missing counts and prices are not shown as final numbers',async()=>{const t=await setup(),r=t.api.consumptionReport(FROM,TO),ch=row(r,'cheese');
  near(ch.theoretical,1);near(ch.recorded,0.05,1e-9,'menu waste of one pizza');assert.equal(ch.actual,0);assert.equal(ch.shortage,0);near(ch.surplus,1.05,1e-9);near(r.summary.surplusValue,210000,1e-6);near(r.summary.shortageValue,row(r,'meat').values.shortage+row(r,'flour').values.shortage,1e-6,'surplus is not netted');
  const s=row(r,'sugar');assert.equal(s.close.physical,false);assert.equal(s.actual,null);assert.equal(s.dataStatus,'insufficient');assert.equal(s.alertLevel,'na');assert(s.reasons.some(x=>x.includes('پایان دوره')));assert(r.quality.some(q=>q.key==='noClosingCount'));
  const salt=row(r,'salt');assert.equal(salt.price.estimated,true,'undated catalog price is only an estimate');assert.equal(salt.dataStatus,'estimated');assert.equal(salt.actual,2);
  assert(!r.rows.some(x=>x.id==='service'),'non-stock items are excluded');
 });
 await test('a range inside a count period: system-carried opening is an estimate, physical and system stock stay apart',async()=>{const t=await setup(),r=t.api.consumptionReport('1405/06/11',TO),m=row(r,'meat');
  assert.equal(m.open.physical,false);assert.equal(m.open.kind,'system');assert.equal(m.open.date,FROM);assert.equal(m.open.quantity,15000,'10000 + 5000 receipt before the 11th');assert.equal(m.dataStatus,'estimated');assert(m.estimates.some(x=>x.includes('منتقل')));
  assert.equal(m.close.physical,true);assert.equal(m.actual,6800,'the variance since the last count is included and labelled');
  const n=t.api.consumptionReport(FROM,'1405/06/20');assert.equal(row(n,'meat').close.physical,false);assert.equal(row(n,'meat').actual,null,'no system stock in place of a closing count');near(row(n,'meat').systemClose,15000-200-40*150/0.94,1e-6);
 });
 await test('purchase return, manual adjustment and authorized use enter the formula by their nature; units and invalid recipe lines',async()=>{const t=await setup();
  t.inventory.inventoryMovements.push({id:'RET',ingredientId:'napkin',date:'1405/06/22',movementType:'PURCHASE_RECEIPT',quantity:100,fromLocationId:'main',toLocationId:'',unitCostToman:100,status:'posted'},{id:'ADJ',ingredientId:'napkin',date:'1405/06/23',movementType:'ADJUSTMENT',quantityDelta:50,locationId:'main',status:'posted'},{id:'STAFF',ingredientId:'napkin',date:'1405/06/24',movementType:'STAFF_CONSUMPTION',quantity:30,fromLocationId:'main',status:'posted'});
  let n=row(t.api.consumptionReport(FROM,TO),'napkin');assert.equal(n.returns,100);assert.equal(n.adjust,50);assert.equal(n.auth,30);assert.equal(n.inflowNet,750);assert.equal(n.actual,1400+750-1000-30);
  t.inventory.inventoryMovements.push({id:'BADUNIT',ingredientId:'napkin',date:'1405/06/25',movementType:'WASTE',quantity:1,fromLocationId:'main',unitSnapshot:'کیلوگرم',status:'posted'});n=row(t.api.consumptionReport(FROM,TO),'napkin');assert.equal(n.actual,null);assert.equal(n.dataStatus,'insufficient');
  t.pricing.recipeVersions[1].lines[1].recipeUnit='گرم';const r=t.api.consumptionReport(FROM,TO),ch=row(r,'cheese');assert.equal(ch.theoretical,null,'a recipe line in another unit is never converted silently');assert.equal(ch.dataStatus,'insufficient');assert(r.quality.some(q=>q.key==='recipeInvalid'));
  near(row(r,'meat').unitCost,(10000*900+5000*1000)/15000,1e-9,'kg purchase price becomes a per-gram cost through packageQuantity');
 });
 await test('no sales and no cash: no Infinity/NaN, percentages are «not computable»; failed Load and normal reports never Save or Seed',async()=>{const t=await setup({mutate:s=>{s.cashreport.reports=[];s.inventory.salesPeriods=[]}}),r=t.api.consumptionReport(FROM,TO);
  assert.equal(r.sales.netSales,null);assert.equal(r.summary.lossSalesPct,null);assert.equal(r.summary.lossLevel,'na');assert.equal(row(r,'napkin').perInvoice,null);
  const text=JSON.stringify(r,(k,v)=>typeof v==='number'&&!Number.isFinite(v)?`BAD:${v}`:v instanceof Map?[...v]:v);assert(!text.includes('BAD:'),'no non-finite number in the report');
  assert(!t.calls.some(c=>c.method==='POST'),'reports never save');assert(!t.calls.some(c=>c.url.includes('seed')));
  const broken=await setup({failLoad:true});assert.equal(broken.api.consumptionReport(FROM,TO).ready,false);assert(!broken.calls.some(c=>c.method==='POST'));
  const bad=t.api.consumptionReport('1405/06/31','1405/06/01');assert.equal(bad.ready,false);
 });
 await test('weekly and monthly ranges; the theoretical use matches the inventory core for every item',async()=>{const t=await setup();
  const week=t.api.consumptionReport('1405/06/15','1405/06/21');assert(week.ready);assert.equal(week.periodDays,7);near(row(week,'meat').theoretical,40*150/0.94,1e-6);assert.equal(week.sales.invoices,150);
  const month=t.api.consumptionReport(FROM,TO);assert.equal(month.periodDays,31);for(const x of month.rows.filter(r=>r.hasRecipe&&r.theoretical!==null)){const core=t.api.unifiedSales(x.id,FROM,TO).quantity;near(x.theoretical,core,1e-9,x.id)}
 });
 await test('alert settings: validation, Save with fresh Load and reload check, unknown keys kept, defaults restorable, overrides by item and group',async()=>{const t=await setup();
  await assert.rejects(()=>t.api.saveConsumptionAlerts({...t.api.consumptionDefaults(),wasteWarn:6,wasteCritical:5}),/بیشتر/);assert(!t.calls.some(c=>c.method==='POST'),'invalid settings never save');
  await assert.rejects(()=>t.api.saveConsumptionAlerts({...t.api.consumptionDefaults(),overrides:[{scope:'ingredient',key:'missing-id',wasteWarn:1}]}),/کاتالوگ/);
  const saved=await t.api.saveConsumptionAlerts({...t.api.consumptionDefaults(),targetMaterialCostPercent:30,wasteWarn:2,overrides:[{scope:'ingredient',key:'meat',varianceWarn:1,varianceCritical:1.5},{scope:'category',key:'خشکبار',wasteWarn:10,wasteCritical:20}]});
  near(saved.lossSalesWarn,30*(2+2)/100);const stored=t.server.inventory.settings.consumptionAlerts;assert.equal(stored.legacyKey,'keep','unknown keys inside the setting are kept');assert.deepEqual(t.server.inventory.settings.unknownSetting,{keep:true});assert.deepEqual(t.server.inventory.unknownRoot,{keep:true});assert.equal(stored.wasteWarn,2);assert(t.server.inventory.changeLog.some(e=>e.action==='CONSUMPTION_ALERTS_CHANGED'));
  assert.equal(t.server.inventory.stocktakes.length,2,'no other inventory data changed');assert.equal(t.inventory.settings.consumptionAlerts.wasteWarn,2,'the page state is the reloaded server document');
  const reloaded=await t.c.RAYO_API_GATEWAY.loadModule('inventory');assert.equal(reloaded.settings.consumptionAlerts.targetMaterialCostPercent,30);
  const r=t.api.consumptionReport(FROM,TO);assert.equal(row(r,'meat').thresholds.source,'ingredient');assert.equal(row(r,'meat').thresholds.varianceWarn,1);assert.equal(row(r,'flour').thresholds.wasteWarn,10);assert.equal(row(r,'flour').thresholds.source,'category');assert.equal(row(r,'napkin').thresholds.source,'global');
  const back=await t.api.saveConsumptionAlerts(t.api.consumptionDefaults());assert.equal(back.wasteWarn,3);assert.equal(back.overrides.length,0);near(back.lossSalesWarn,1.75);
 });
 await test('tab: link, three views, filters, detail, alert explanation, export, settings card and access through direct URL',async()=>{const t=await setup(),c=installUi(t),L=c.RayoInventoryV1012;
  L.cmSet('from',FROM);L.cmSet('to',TO);let html=c.views.inventory();
  assert(html.includes('href="inventory.html?tab=consumption"')&&html.includes('مدیریت مصرف'),'tab link');for(const k of ['stock','receipt','sales','waste','count','beverage','reorder','reports','settings'])assert(html.includes(`href="inventory.html?tab=${k}"`),k);
  assert(!html.includes('tab=issue'),'the removed transfer tab does not come back');
  for(const x of ['فروش خالص','تعداد فاکتور','ارزش مصرف واقعی','درصد پرتی از مصرف','مجموع اتلاف قابل‌کنترل','دستمال کاغذی','گوشت گوساله','قابل محاسبه نیست','کیفیت داده'])assert(html.includes(x),x);
  L.cmSet('kind','indirect');html=tbl(c.views.inventory());assert(html.includes('دستمال کاغذی')&&!html.includes('گوشت گوساله'),'type filter');L.cmSet('kind','');
  L.cmSet('category','پروتئین');html=tbl(c.views.inventory());assert(html.includes('گوشت گوساله')&&!html.includes('دستمال کاغذی'),'group filter');L.cmSet('category','');
  L.cmSet('q','گوشت');html=tbl(c.views.inventory());assert(html.includes('گوشت گوساله')&&!html.includes('دستمال کاغذی'),'search');L.cmSet('q','');
  L.cmSet('q','دستمال كاغذي');html=tbl(c.views.inventory());assert(html.includes('دستمال کاغذی'),'Arabic ي/ك search matches');L.cmSet('q','');
  L.cmSet('data','incomplete');html=tbl(c.views.inventory());assert(html.includes('شکر')&&!html.includes('دستمال کاغذی'),'incomplete-data filter');L.cmSet('data','complete');html=tbl(c.views.inventory());assert(!html.includes('شکر')&&html.includes('دستمال کاغذی'),'complete-data filter');L.cmSet('data','');
  L.cmSet('alertsOnly',true);html=tbl(c.views.inventory());assert(!html.includes('دستمال کاغذی'),'alerts only hides normal rows');L.cmSet('alertsOnly',false);
  L.cmSet('item','meat');html=tbl(c.views.inventory());assert(html.includes('گوشت گوساله')&&!html.includes('آرد'),'single item');L.cmSet('item','');
  L.cmSet('sub','loss');html=c.views.inventory();assert(html.includes('مازاد شمارش')&&html.includes('پنیر')&&html.includes('سوختن'),'loss view with surplus and waste reasons');
  L.cmSet('sub','menu');html=c.views.inventory();assert(html.includes('تخصیص تخمینی بر اساس مصرف تئوریک رسپی')&&html.includes('برگر')&&html.includes('پیتزا'),'menu view');
  L.cmSet('menu','burger');html=tbl(c.views.inventory());assert(html.includes('برگر')&&!html.includes('پیتزا'),'menu filter');L.cmSet('menu','');
  L.cmDetail('meat');const detail=t.el('modalBody').innerHTML;for(const x of ['شمارش ابتدای دوره','ST-OPEN','ST-CLOSE','موجودی سیستمی','ضریب تبدیل','۱۰۰۰','افت ثبت‌شده در نسخهٔ رسپی','میانگین موزون','سوختن','برگر','فرمول'])assert(detail.includes(x),`detail: ${x}`);
  L.cmAlertInfo('napkin');assert(t.el('modalBody').innerHTML.includes('اقدام پیشنهادی'),'alert explanation');
  L.cmSet('sub','items');L.cmExport();const out=t.downloads.find(x=>x.name&&x.name.endsWith('.csv'));assert(out&&out.rows.some(r=>r.includes('دستمال کاغذی')),'CSV export');
  L.cmHelp();assert(t.el('modalBody').innerHTML.includes('champions123.org')&&t.el('modalBody').innerHTML.includes('epa.gov'),'methodology sources');
  c.location.search='?tab=settings';html=c.views.inventory();assert(html.includes('هشدارهای مدیریت مصرف')&&html.includes('بازگشت به پیش‌فرض'),'settings card');
  const denied=await setup(),d=installUi(denied,{allowed:k=>k!=='reports'});let dh=d.views.inventory();assert(dh.includes('دسترسی ندارید')&&!dh.includes('دستمال کاغذی'),'direct URL without report access');assert(!dh.includes('href="inventory.html?tab=consumption"'),'tab hidden without access');
  d.location.search='?tab=settings';dh=d.views.inventory();assert(!dh.includes('هشدارهای مدیریت مصرف'),'settings card hidden without access');
  assert(!t.calls.some(x=>x.method==='POST'),'rendering never saves');
 });
 console.log(`PASS ${groups} consumption management groups`);
}
run().catch(e=>{console.error(e);process.exit(1)});
