'use strict';
// QA for: inventory stock table three-state column sort + in-stock/out-of-stock availability filter (js/46 stockV2()).
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const read=p=>fs.readFileSync(p,'utf8');

function setup(){
 const positions={A:{quantity:2,value:20,unitCost:10},B:{quantity:100,value:1000,unitCost:10},C:{quantity:10,value:100,unitCost:10},D:{quantity:0,value:0,unitCost:10},E:{quantity:-5,value:-50,unitCost:10},F:{quantity:null,value:null,unitCost:null}};
 const ingredients=[
  {id:'A',code:'A1',name:'آرد',recipeUnit:'کیلوگرم',status:'فعال',itemType:'MENU_INGREDIENT',inventoryTracked:true},
  {id:'B',code:'B1',name:'برنج',recipeUnit:'کیلوگرم',status:'فعال',itemType:'MENU_INGREDIENT',inventoryTracked:true},
  {id:'C',code:'C1',name:'پنیر',recipeUnit:'کیلوگرم',status:'فعال',itemType:'MENU_INGREDIENT',inventoryTracked:true},
  {id:'D',code:'D1',name:'تخم‌مرغ',recipeUnit:'عدد',status:'فعال',itemType:'MENU_INGREDIENT',inventoryTracked:true},
  {id:'E',code:'E1',name:'ثعلب',recipeUnit:'کیلوگرم',status:'فعال',itemType:'MENU_INGREDIENT',inventoryTracked:true},
  {id:'F',code:'F1',name:'جعفری',recipeUnit:'کیلوگرم',status:'فعال',itemType:'MENU_INGREDIENT',inventoryTracked:true}
 ];
 const pricing={ingredients};
 const before=JSON.stringify(pricing);
 const inventory={settings:{mainLocationId:'kitchen'},locations:[{id:'kitchen',name:'آشپزخانه',isActive:true}],stocktakes:[]};
 const context={console,URLSearchParams,location:{pathname:'/inventory.html',search:''},sessionStorage:{getItem:()=>'admin'},document:{readyState:'loading',querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>({}),getElementById:()=>null,addEventListener(){},head:{appendChild(){}}},setTimeout(){},renderView(){},getPricingState:()=>pricing,getInventoryState:()=>inventory,RayoJalali:{today:()=>'1405/06/24'},RayoInventoryV10:{isReady:()=>true,unifiedMode:()=>false,locations:()=>inventory.locations,currentTotalPosition:id=>({ingredientId:id,...positions[id]}),positionAtLocation:id=>({ingredientId:id,...positions[id]})},RAYO_API_GATEWAY:{createRequestId:()=>'t'+Math.random().toString(36).slice(2,8)},toast:()=>{}};
 context.window=context;vm.createContext(context);
 const code=read('js/46-inventory-operations-v10-12.js').replace('Object.assign(window,{RayoInventoryV1012:{','window.stockV2=stockV2;window.ui=ui;Object.assign(window,{RayoInventoryV1012:{');
 vm.runInContext(code,context);
 return {context,api:context.RayoInventoryV1012,pricing,before};
}
function rowOrder(html){return [...html.matchAll(/<td><b>([^<]+)<\/b>/g)].map(m=>m[1])}

let tests=0;async function test(name,run){await run();tests++;console.log('PASS '+name)}

(async()=>{
 await test('default order (no sort) is name-based and stable across renders',()=>{
  const t=setup();
  const order1=rowOrder(t.context.stockV2()),order2=rowOrder(t.context.stockV2());
  assert.deepEqual(order1,order2);
  assert.deepEqual(order1,['آرد','برنج','پنیر','تخم‌مرغ','ثعلب','جعفری']);
 });
 await test('three-click cycle on quantity: desc, then asc, then back to original order',()=>{
  const t=setup();
  t.api.stockSort('quantity');
  const desc=rowOrder(t.context.stockV2());
  assert.deepEqual(desc,['برنج','پنیر','آرد','تخم‌مرغ','ثعلب','جعفری'],'first click is descending by real numeric quantity (100,10,2,0,-5), unknown fixed last');
  t.api.stockSort('quantity');
  const asc=rowOrder(t.context.stockV2());
  assert.deepEqual(asc,['ثعلب','تخم‌مرغ','آرد','پنیر','برنج','جعفری'],'second click is ascending (-5,0,2,10,100), unknown still fixed last regardless of direction');
  t.api.stockSort('quantity');
  const cleared=rowOrder(t.context.stockV2());
  assert.deepEqual(cleared,['آرد','برنج','پنیر','تخم‌مرغ','ثعلب','جعفری'],'third click removes sort and restores the original valid table order');
 });
 await test('2, 10, 100 sort numerically, not lexicographically',()=>{
  const t=setup();
  t.api.stockSort('quantity');
  const html=t.context.stockV2();
  const idx=name=>html.indexOf(`<b>${name}</b>`);
  assert(idx('برنج')<idx('پنیر')&&idx('پنیر')<idx('آرد'),'100 before 10 before 2 — numeric order, not string order where "10" < "100" < "2"');
 });
 await test('switching to a new column always starts at descending',()=>{
  const t=setup();
  t.api.stockSort('quantity');t.api.stockSort('quantity');
  assert.equal(t.context.ui.stockSort.key,'quantity');assert.equal(t.context.ui.stockSort.dir,'asc');
  t.api.stockSort('name');
  assert.equal(t.context.ui.stockSort.key,'name');assert.equal(t.context.ui.stockSort.dir,'desc','a freshly clicked column starts descending regardless of the previous column state');
 });
 await test('availability filter: in-stock (>0), out-of-stock (<=0, includes negative), unknown excluded from both',()=>{
  const t=setup();
  t.api.stockAvailability('inStock');
  assert.deepEqual(rowOrder(t.context.stockV2()),['آرد','برنج','پنیر'],'only positive quantities (2,100,10)');
  t.api.stockAvailability('outOfStock');
  assert.deepEqual(rowOrder(t.context.stockV2()),['تخم‌مرغ','ثعلب'],'zero and negative (0,-5); unknown quantity is neither in nor out of stock');
  t.api.stockAvailability('all');
  assert.equal(rowOrder(t.context.stockV2()).length,6);
 });
 await test('negative quantity keeps its warning style and sign, never coerced to zero',()=>{
  const t=setup(),html=t.context.stockV2();
  const row=html.slice(html.indexOf('<b>ثعلب</b>'),html.indexOf('<b>ثعلب</b>')+400);
  assert(row.includes('v1012-negative'),'negative-quantity styling class is present on the -5 row');
  assert(row.includes('۵'),'the magnitude of the negative value is rendered');
  assert(!/>۰<|>0</.test(row.split('recipeUnit')[0]),'the quantity cell is not silently clamped to zero');
 });
 await test('sort + availability filter + search + pagination combine correctly and reset to page 1',()=>{
  const t=setup();
  t.api.stockPageSize(2);
  t.api.stockAvailability('inStock');
  t.api.stockSort('quantity');
  t.api.stockPage(2);
  assert.equal(t.context.ui.stockPage,2);
  t.api.stockSort('quantity');
  assert.equal(t.context.ui.stockPage,1,'changing sort resets pagination to page 1');
  t.api.stockPage(2);
  t.api.stockAvailability('outOfStock');
  assert.equal(t.context.ui.stockPage,1,'changing the availability filter resets pagination to page 1');
  const html=t.context.stockV2();
  assert.deepEqual(rowOrder(html),['ثعلب','تخم‌مرغ'],'the still-active ascending quantity sort (-5 before 0) applies on top of the new availability filter');
 });
 await test('sorting and filtering never mutate the underlying ingredient data or its order',()=>{
  const t=setup();
  t.api.stockSort('quantity');t.api.stockSort('quantity');t.api.stockAvailability('outOfStock');t.context.stockV2();
  assert.equal(JSON.stringify(t.pricing),t.before,'pricing.ingredients array/content is untouched by display sorting');
 });
 console.log(`RESULT ${tests}/${tests} PASS`);
})().catch(e=>{console.error(e);process.exitCode=1});
