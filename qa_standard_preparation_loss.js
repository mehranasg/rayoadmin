'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const read=p=>fs.readFileSync(p,'utf8'),copy=x=>JSON.parse(JSON.stringify(x));
const near=(actual,expected)=>assert(Math.abs(actual-expected)<1e-6,`${actual} != ${expected}`);
const ingredient={id:'beef',code:'B1',name:'فیله گوساله',purchaseUnit:'کیلوگرم',recipeUnit:'گرم',packageQuantity:1000,lastPurchasePriceToman:2400000,wastePercent:6,status:'فعال',unknownField:{keep:true}};
function setup({failLoad=false}={}){
 let pricing={ingredients:[copy(ingredient)],menuItems:[{id:'steak',name:'فیله',category:'غذا',currentPriceToman:2000000,productionLocationId:'kitchen'}],recipes:[{id:'r1',menuItemId:'steak',ingredientId:'beef',quantity:300}],recipeVersions:[{id:'old',menuItemId:'steak',effectiveFrom:'1405/06/01',lines:[{ingredientId:'beef',quantity:300,wastePercent:6,recipeUnit:'گرم'}]}],ingredientPriceHistory:[],changeLog:[],meta:{},settings:{},lists:{}};
 const inventory={settings:{mainLocationId:'kitchen',defaultSalesLocationId:'kitchen'},locations:[{id:'kitchen',name:'آشپزخانه',isActive:true}],openingBalances:[{id:'open',ingredientId:'beef',locationId:'kitchen',date:'1405/06/01',quantity:10000}],stockReceipts:[],inventoryMovements:[],salesPeriods:[{from:'1405/06/02',to:'1405/06/02',lines:[{menuItemId:'steak',quantity:1}]}],stocktakes:[],periodClosures:[],wasteRecords:[],consumptionRecords:[]};
 const elements={},saves=[],errors=[],server={pricing:copy(pricing),inventory:copy(inventory)};
 const element=id=>elements[id]||(elements[id]={value:'',textContent:'',innerHTML:'',classList:{add(){},remove(){}},style:{}});
 const c={console,URLSearchParams,location:{pathname:'/qa.html',search:''},currentView:'qa',setTimeout(){},clearTimeout(){},sessionStorage:{getItem:()=> 'qa-manager'},document:{readyState:'loading',querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>({}),getElementById:element,addEventListener(){},head:{appendChild(){}}},$:element,esc:x=>String(x??''),toast:x=>errors.push(x),renderView(){},closeModal(){},confirm:()=>true,RayoJalali:{today:()=> '1405/06/26'},getInventoryState:()=>inventory,getSupplierState:()=>({suppliers:[]}),RAYO_API_GATEWAY:{getModuleStatus:()=>({sourceValid:!failLoad}),loadOrBootstrap:async module=>{if(failLoad)throw Error('offline');return copy(server[module]||{})},saveModule:async(module,data)=>{saves.push(module);server[module]=copy(data);return{verified:true,checked:copy(data)}},loadModule:async module=>copy(server[module])}};
 c.window=c;vm.createContext(c);
 const core=read('js/08-rayo-pricing-admin-module.js').replace('(function waitPricingModule(){',`Object.assign(window,{pcSaveIngredient,pcEditIngredient,pcCostInfo,pcMetrics,pcReadIngredientsExcel,pcRefreshData,pcEnsureLoaded,pcSaveRecipeLine});window.getPricingState=()=>pricingState;window.setTestPricing=x=>{pricingState=pcMigrate(x);pricingLoaded=true};(function waitPricingModule(){`);
 vm.runInContext(core,c);c.setTestPricing(pricing);pricing=c.getPricingState();
 vm.runInContext(read('js/32-inventory-cost-control-v10.js'),c);
 return{c,pricing,inventory,elements,element,saves,errors,server,math:c.RayoIngredientMath,api:c.RayoInventoryV10};
}
let tests=0;async function test(name,run){await run();tests++;console.log('PASS '+name)}
(async()=>{
 await test('reference formula, no double loss, and 10 kg batch',()=>{
  const t=setup(),m=t.math.calculate(ingredient);near(m.netUsableQuantity,940);near(m.netUsableUnitCost,2400000/940);near(t.math.netCost(ingredient)*300,765957.4468085107);const gross=t.math.grossQuantity(ingredient,{quantity:300});near(gross,319.1489361702);near(gross-300,19.1489361702);near(gross*m.grossUnitCost,300*m.netUsableUnitCost);near(t.math.grossQuantity(ingredient,{quantity:9400}),10000);near(9400*m.netUsableUnitCost,24000000);assert.equal(t.saves.length,0);
 });
 await test('zero, empty legacy loss, 10 percent and localized decimals',()=>{
  const t=setup();for(const wastePercent of [0,'۰','',null,undefined]){const i={...ingredient,wastePercent};near(t.math.grossQuantity(i,{quantity:300}),300);near(t.math.netCost(i),2400)}
  near(t.math.grossQuantity({...ingredient,wastePercent:10},{quantity:300}),300/0.9);
  near(t.math.calculate({...ingredient,packageQuantity:'۱٬۰۰۰',lastPurchasePriceToman:'۲٬۴۰۰٬۰۰۰',wastePercent:'۶٫۵'}).netUsableUnitCost,2400000/935);
  near(t.math.parse('٢٫٥'),2.5);assert.equal(t.math.parse('2oops'),null);
 });
 await test('invalid loss, price, pack and units are incomplete',()=>{
  const t=setup();for(const wastePercent of [-1,100,101,'bad',Infinity]){const i={...ingredient,wastePercent};assert.equal(t.math.calculate(i).netUsableUnitCost,null);assert(Number.isNaN(t.math.grossQuantity(i,{quantity:300})))}
  for(const packageQuantity of [0,-2,null,'',NaN,'2x'])assert.equal(t.math.calculate({...ingredient,packageQuantity}).netUsableUnitCost,null);
  for(const lastPurchasePriceToman of [0,-1,null,'',NaN,'bad'])assert.equal(t.math.calculate({...ingredient,lastPurchasePriceToman}).netUsableUnitCost,null);
  for(const i of [{...ingredient,purchaseUnit:''},{...ingredient,recipeUnit:''},{...ingredient,recipeUnit:'لیتر'}])assert.equal(t.math.calculate(i).complete,false);
  near(t.math.calculate({...ingredient,purchaseUnit:'لیتر',recipeUnit:'میلی‌لیتر'}).netUsableUnitCost,2400000/940);
  near(t.math.calculate({...ingredient,purchaseUnit:'بسته',recipeUnit:'عدد',packageQuantity:10}).netUsableQuantity,9.4);
  assert(Number.isNaN(t.math.grossQuantity(ingredient,{quantity:300,recipeUnit:'کیلوگرم'})));
 });
 await test('gross stock, sales on first report day, waste, count reset and inactive history',async()=>{
  const t=setup();await t.api.ensure();near(t.api.positionAtLocation('beef','kitchen','1405/06/02').quantity,10000-300/.94);near(t.api.costAtDate('beef','1405/06/02'),2400);
  let m=t.api.periodMetrics('1405/06/02','1405/06/02');near(m.standard,300/.94*2400);near(m.openingValue,24000000);near(m.unexplained,0);
  t.inventory.salesPeriods[0].lines[0].quantity=4;t.inventory.inventoryMovements.push({id:'w1',date:'1405/06/02',movementType:'WASTE',ingredientId:'beef',quantity:50,fromLocationId:'kitchen',status:'posted'});
  near(t.api.positionAtLocation('beef','kitchen','1405/06/02').quantity,10000-1200/.94-50);m=t.api.periodMetrics('1405/06/02','1405/06/02');near(m.waste,120000);near(m.standard,1200/.94*2400);near(m.unexplained,0);
  t.inventory.stocktakes.push({id:'count',date:'1405/06/02',locationId:'kitchen',status:'approved',lines:[{ingredientId:'beef',actual:8000}]});near(t.api.positionAtLocation('beef','kitchen','1405/06/02').quantity,8000);
  t.inventory.salesPeriods.push({date:'1405/06/03',lines:[{menuItemId:'steak',quantity:2}]});near(t.api.positionAtLocation('beef','kitchen','1405/06/03').quantity,8000-600/.94);
  t.pricing.ingredients[0].status='غیرفعال';t.pricing.ingredients[0].isArchived=true;near(t.api.periodMetrics('1405/06/03','1405/06/03').standard,600/.94*2400);assert.equal(t.saves.length,0);
 });
 await test('receipt value and manual/invoice prices stay gross; invalid unit or invoice excluded',async()=>{
  const t=setup();await t.api.ensure();t.inventory.stockReceipts.push({id:'receipt',ingredientId:'beef',date:'1405/06/03',quantity:10000,purchaseQuantity:10,unitPrice:2400000,status:'posted',unitSnapshot:'گرم'});
  near(t.api.costAtDate('beef','1405/06/03'),2400);
  t.pricing.ingredientPriceHistory.push({id:'manual',ingredientId:'beef',date:'1405/06/04',priceToman:2500000,packageQuantity:1000,recipeUnit:'گرم',source:'manual'});near(t.api.costAtDate('beef','1405/06/04'),2500);
  t.inventory.purchaseInvoices.push({id:'invoice',status:'finalized'});t.pricing.ingredientPriceHistory.push({id:'iph',ingredientId:'beef',date:'1405/06/05',priceToman:4800000,packageQuantity:2000,purchaseUnit:'بسته',recipeUnit:'گرم',source:'supplierInvoice',invoiceId:'invoice'});near(t.api.costAtDate('beef','1405/06/05'),2400);
  Object.assign(t.pricing.ingredients[0],{lastPurchaseSource:'supplierInvoice',lastPurchaseInvoiceId:'invoice',lastPurchasePriceToman:4800000});near(t.math.netCost(t.pricing.ingredients[0],t.pricing),2400/.94);
  t.inventory.purchaseInvoices[0].status='void';near(t.api.costAtDate('beef','1405/06/05'),2500);t.inventory.stockReceipts.push({id:'bad-unit',ingredientId:'beef',date:'1405/06/06',quantity:1,unitCostToman:3000,status:'posted',unitSnapshot:'لیتر'});assert(Number.isNaN(t.api.costAtDate('beef','1405/06/06')));
 });
 await test('new recipe snapshot preserves loss, old versions remain untouched and Save/Load verifies',async()=>{
  const t=setup();await t.api.ensure();const old=JSON.stringify(t.pricing.recipeVersions[0]);await t.api.snapshotRecipe('steak','1405/06/10'); // same recipe and same snapshot is a no-op
  t.pricing.ingredients[0].wastePercent=10;await t.api.snapshotRecipe('steak','1405/06/11');assert.equal(t.pricing.recipeVersions.at(-1).lines[0].wastePercent,10);assert.equal(JSON.stringify(t.pricing.recipeVersions[0]),old);
  t.pricing.ingredients[0].wastePercent=20;near(t.math.grossQuantity(t.pricing.ingredients[0],t.api.recipeAt('steak','1405/06/02')[0]),300/.94);near(t.math.grossQuantity(t.pricing.ingredients[0],t.api.recipeAt('steak','1405/06/12')[0]),300/.9);
  const loaded=await t.c.RAYO_API_GATEWAY.loadModule('pricing');assert.equal(loaded.recipeVersions.at(-1).lines[0].wastePercent,10);assert.equal(loaded.ingredients[0].unknownField.keep,true);
  const length=t.pricing.recipeVersions.length;t.c.RAYO_API_GATEWAY.saveModule=async()=>{throw Error('offline')};await assert.rejects(()=>t.api.snapshotRecipe('steak','1405/06/20'),/offline/);assert.equal(t.pricing.recipeVersions.length,length);
  t.pricing.ingredients[0].wastePercent=100;await assert.rejects(()=>t.api.snapshotRecipe('steak','1405/06/21'),/ناقص/);assert.equal(t.pricing.recipeVersions.length,length);
 });
 await test('legacy unsnapshotted loss uses current value without backfill; closed period is immutable',async()=>{
  const t=setup();delete t.pricing.recipeVersions[0].lines[0].wastePercent;await t.api.ensure();assert(!('wastePercent' in t.pricing.recipeVersions[0].lines[0]));t.pricing.ingredients[0].wastePercent=10;near(t.api.positionAtLocation('beef','kitchen','1405/06/02').salesConsumption,300/.9);
  const metrics={openingValue:24000000,purchases:0,standard:720000,waste:123,authorized:0,closingValue:23280000,actualCogs:720000,unexplained:-123,sales:2000000,coverage:100};const snap={id:'close',status:'closed',from:'1405/06/02',to:'1405/06/02',metrics,lines:[{ingredientId:'beef',stdQty:300,unitCost:2400}]};t.inventory.periodClosures.push(snap);const before=JSON.stringify(snap);near(t.api.periodMetrics(snap.from,snap.to).standard,720000);t.pricing.ingredients[0].wastePercent=50;near(t.api.periodMetrics(snap.from,snap.to).standard,720000);assert.equal(JSON.stringify(snap),before);assert.equal(t.saves.length,0);
 });
 await test('menu waste includes loss once, existing movement snapshot never recalculated on Load',async()=>{
  const t=setup();t.inventory.wasteRecords.push({id:'menu-waste',date:'1405/06/02',type:'menu',itemId:'steak',quantity:1,eventType:'WASTE',locationId:'kitchen',status:'posted'});await t.api.ensure();near(t.inventory.inventoryMovements[0].quantity,300/.94);near(t.api.periodMetrics('1405/06/02','1405/06/02').waste,300/.94*2400);assert.equal(t.inventory.wasteRecords.length,1);assert.equal(t.saves.length,0);
  const prior=setup();prior.inventory.wasteRecords.push({id:'legacy',date:'1405/06/02',type:'menu',itemId:'steak',quantity:1,locationId:'kitchen'});prior.inventory.inventoryMovements.push({id:'legacy-move',ingredientId:'beef',quantity:300,sourceKey:'waste:legacy:beef'});await prior.api.ensure();near(prior.inventory.inventoryMovements[0].quantity,300);
 });
 await test('pricing and menu summaries and management report share formula and historical recipe',async()=>{
  const t=setup();await t.api.ensure();near(t.c.pcCostInfo(t.pricing.menuItems[0]).cost,300/.94*2400);
  vm.runInContext(read('js/45-menu-management-v10-11.js').replace('function tabs(', 'window.testMenuMetrics=menuMetrics;function tabs('),t.c);near(t.c.testMenuMetrics(t.pricing.menuItems[0]).cost,300/.94*2400);
  vm.runInContext(read('js/15-management-reports.js').replace('function monthSerial(', 'window.testReports=buildAnalytics;function monthSerial('),t.c);let report=t.c.testReports(t.inventory,t.pricing,{suppliers:[]});near(report.theoretical,300/.94*2400);
  t.pricing.recipes[0].quantity=900;t.pricing.ingredients[0].wastePercent=20;report=t.c.testReports(t.inventory,t.pricing,{suppliers:[]});near(report.theoretical,300/.94*2400);
  t.pricing.ingredients[0].packageQuantity=0;assert.equal(t.c.pcCostInfo(t.pricing.menuItems[0]).complete,false);assert.equal(t.c.testMenuMetrics(t.pricing.menuItems[0]).complete,false);
 });
 await test('form preview, validation, Save/refresh, unknown JSON preservation and DTO rejection',async()=>{
  const t=setup();await t.api.ensure();for(const [id,value]of Object.entries({pc_i_name:'فیله گوساله',pc_i_code:'B1',pc_i_category:'پروتئین',pc_i_reorder:'',pc_i_pack_qty:'۱۰۰۰',pc_i_price:'۲٬۴۰۰٬۰۰۰',pc_i_waste:'۶',pc_i_item_type:'MENU_INGREDIENT',pc_i_purchase_unit:'کیلوگرم',pc_i_recipe_unit:'گرم',pc_i_date:'1405/06/26',pc_i_status:'فعال',pc_i_notes:''}))t.element(id).value=value;
  t.c.pcIngredientPreview();assert(t.element('pc_i_yield_preview').textContent.includes('۹۴۰'));for(const waste of ['-1','۱۰۰','101','oops']){t.element('pc_i_waste').value=waste;await t.c.pcSaveIngredient('beef')}assert.equal(t.saves.length,0);
  t.element('pc_i_waste').value='۶٫۵';await t.c.pcSaveIngredient('beef');assert.equal(t.server.pricing.ingredients[0].wastePercent,6.5);assert.equal(t.server.pricing.recipeVersions.at(-1).source,'ingredient-preparation-loss-change');assert.equal(t.server.pricing.recipeVersions.at(-1).effectiveFrom,'1405/06/26');assert.equal(t.server.pricing.recipeVersions.at(-1).lines[0].wastePercent,6.5);near(t.api.positionAtLocation('beef','kitchen','1405/06/02').salesConsumption,300/.94);await t.c.pcRefreshData();assert.equal(t.c.getPricingState().ingredients[0].wastePercent,6.5);assert.equal(t.c.getPricingState().ingredients[0].unknownField.keep,true);
  const bad=copy(t.server.pricing);delete bad.ingredients[0].wastePercent;assert.throws(()=>t.math.verifySaved(t.server.pricing,bad),/DTO/);
  const v=copy(t.server.pricing);v.recipeVersions[0].lines[0].wastePercent=6;const stripped=copy(v);delete stripped.recipeVersions[0].lines[0].wastePercent;assert.throws(()=>t.math.verifySaved(v,stripped),/DTO/);
  const before=JSON.stringify(t.c.getPricingState());t.element('pc_i_waste').value='10';t.c.RAYO_API_GATEWAY.saveModule=async()=>{throw Error('offline')};await t.c.pcSaveIngredient('beef');assert.equal(JSON.stringify(t.c.getPricingState()),before,'failed save rolls back item, version, categories and changeLog');
 });
 await test('Excel wastePercent import, invalid later row rolls back and conversion is never guessed',async()=>{
  const t=setup(),header=['کد','نام ماده','واحد خرید','واحد مصرف','مقدار بسته','قیمت','wastePercent'];let rows=[header,['B1','فیله','کیلوگرم','گرم','۱۰۰۰','۲۴۰۰۰۰۰','۱۰']];t.c.XLSX={read:()=>({SheetNames:['Sheet1'],Sheets:{Sheet1:{}}}),utils:{sheet_to_json:()=>rows}};
  const event=()=>({target:{files:[{arrayBuffer:async()=>new ArrayBuffer(0)}],value:'x'}});await t.c.pcReadIngredientsExcel(event(),'master');assert.equal(t.pricing.ingredients[0].wastePercent,10);assert.equal(t.saves.length,1);
  const before=JSON.stringify(t.pricing);rows=[header,['B1','فیله','کیلوگرم','گرم','۱۰۰۰','۲۴۰۰۰۰۰','۶'],['B2','نامعتبر','بسته','عدد','10','100','100']];await t.c.pcReadIngredientsExcel(event(),'master');assert.equal(JSON.stringify(t.pricing),before);assert.equal(t.saves.length,1);
  rows=[header,['B1','فیله','کیلوگرم','گرم','','۲۴۰۰۰۰۰','۶']];await t.c.pcReadIngredientsExcel(event(),'master');assert.equal(JSON.stringify(t.pricing),before);assert.equal(t.saves.length,1);
 });
 await test('failed Load cannot mutate inventory or save/seed; successful projection is read-only',async()=>{
  const t=setup({failLoad:true}),before=JSON.stringify(t.inventory);assert.equal(await t.api.ensure(),false);assert.equal(JSON.stringify(t.inventory),before);assert.equal(t.saves.length,0);
  const ok=setup();await ok.api.ensure();const raw=JSON.stringify({p:ok.pricing,i:ok.inventory});ok.api.periodMetrics('1405/06/02','1405/06/02');ok.api.currentTotalPosition('beef','1405/06/03');assert.equal(JSON.stringify({p:ok.pricing,i:ok.inventory}),raw);assert.equal(ok.saves.length,0);
 });
 await test('unit cost display rounds upward to 1000 without altering calculation',async()=>{const t=setup();assert.equal(t.math.displayUnitCost(2245423),2246000);assert.equal(t.math.displayUnitCost(2246000),2246000);assert.equal(t.math.displayUnitCost(0),0);assert(Number.isNaN(t.math.displayUnitCost(NaN)));near(t.math.netCost(t.pricing.ingredients[0]),2400000/940);});
 console.log(`PASS ${tests} standard preparation loss acceptance groups`);
})().catch(e=>{console.error(e);process.exitCode=1});
