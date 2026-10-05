'use strict';
// Item control levels (default «سبک» keeps the per-item carry-forward rule), movement ledger, stock value and top variance (js/32).
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
function setup(levels,extraSettings={}){
 const st=(id,date,lines)=>({id,date,locationId:'',inventoryScope:'RAYO',baselineBoundary:'END',status:'approved',lines});
 const inventory={settings:{mainLocationId:'LOC',inventoryControlMode:'unified',itemControlLevels:levels||undefined,...extraSettings},locations:[{id:'LOC',name:'انبار',type:'main',isActive:true}],
  stocktakes:[st('ST1','1405/07/01',[{ingredientId:'A',actual:10},{ingredientId:'B',actual:5}]),st('ST2','1405/07/10',[{ingredientId:'A',actual:8,variance:-2,unitCost:1000}])],
  stockReceipts:[],purchaseInvoices:[],inventoryMovements:[],openingBalances:[],consumptionRecords:[],supplierPayments:[],supplierDirectDebts:[],wasteRecords:[],wasteShiftDeclarations:[],salesPeriods:[],trackedIngredients:[],periodClosures:[],changeLog:[]};
 const pricing={settings:{},ingredients:[{id:'A',name:'آرد',recipeUnit:'کیلو',packageQuantity:1,lastPurchasePriceToman:1000},{id:'B',name:'نمک',recipeUnit:'کیلو',packageQuantity:1,lastPurchasePriceToman:500}],menuItems:[],recipes:[],recipeVersions:[],ingredientPriceHistory:[],changeLog:[]};
 const before=JSON.stringify(inventory);
 const c={console,URL,URLSearchParams,location:{search:'',href:'http://qa/inventory.html'},history:{replaceState(){}},sessionStorage:{getItem:()=> 'qa'},document:{getElementById:()=>null,querySelectorAll:()=>[]},setTimeout,clearTimeout,views:{},titles:{},ops:{tab:'stock'},currentView:'qa',renderView(){},toast(){},confirm:()=>true,prompt:()=>'',getInventoryState:()=>inventory,getPricingState:()=>pricing,getSupplierState:()=>({suppliers:[]}),getCashReportState:()=>({reports:[]}),RayoJalali:{today:()=>'1405/07/12'},
  RayoIngredientMath:{unitKey:x=>x||'',calculate:i=>({grossUnitCost:i.lastPurchasePriceToman,complete:true}),grossQuantity:()=>0,recipeAt:()=>[],grossCost:()=>0,verifySaved(){},snapshotLines:()=>[]},
  RAYO_API_GATEWAY:{loadOrBootstrap:async m=>m==='hr'?{personnel:[]}:{},getModuleStatus:()=>({sourceValid:true}),saveModule:async()=>{throw Error('no save expected')}}};
 c.window=c;vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(__dirname,'js/32-inventory-cost-control-v10.js'),'utf8'),c);
 return {c,api:c.RayoInventoryV10,inventory,before};
}
let n=0;const test=async(name,fn)=>{await fn();n++;console.log('PASS '+name)};
(async()=>{
 await test('no stored level = «سبک»: an item skipped by the latest count carries its own last count (unchanged behaviour)',async()=>{
  const t=setup();await t.api.ensure();assert.equal(t.api.controlLevel('B'),'LIGHT');
  const p=t.api.unifiedPosition('B','1405/07/12');assert.equal(p.quantity,5);assert.equal(p.baseDate,'1405/07/01');assert.deepEqual([...p.issues],[]);
  assert.equal(t.api.unifiedPosition('A','1405/07/12').quantity,8);
 });
 await test('«دقیق» item must be in the latest whole count',async()=>{
  const t=setup({B:'PRECISE'});await t.api.ensure();const p=t.api.unifiedPosition('B','1405/07/12');assert.equal(p.quantity,null);assert(p.issues.some(x=>x.includes('آخرین مبنای کل')));
 });
 await test('«کنارگذاشته» item leaves the count list and stock value',async()=>{
  const t=setup({B:'PARKED'});await t.api.ensure();const v=t.api.inventoryValueSummary('1405/07/12');assert.equal(v.inStock,1);
 });
 await test('stale carry-forward only warns (quantity kept) beyond the max gap',async()=>{
  const t=setup(null,{lightMaxGapDays:7});await t.api.ensure();const p=t.api.unifiedPosition('B','1405/07/12');assert.equal(p.quantity,5);assert(p.issues.some(x=>x.includes('روز قبل')));
 });
 await test('ledger running balance ends at the computed position',async()=>{
  const t=setup();await t.api.ensure();const l=t.api.unifiedLedgerRows('A','1405/07/12');assert.equal(l.base.quantity,8);assert.equal(l.ending.quantity,8);
 });
 await test('stock value counts positive priced items; nothing is written',async()=>{
  const t=setup();await t.api.ensure();const loaded=JSON.stringify(t.inventory);const v=t.api.inventoryValueSummary('1405/07/12');t.api.unifiedLedgerRows('A','1405/07/12');assert.equal(v.inStock,2);assert.equal(v.unknown,0);assert.equal(JSON.stringify(t.inventory),loaded,'read-only calculations never mutate inventory');
 });
 console.log(`RESULT ${n}/${n} PASS`);
})().catch(e=>{console.error(e);process.exitCode=1});
