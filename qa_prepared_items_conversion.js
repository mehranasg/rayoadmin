'use strict';
// QA for: prepared/semi-finished item counting + auto-conversion to raw ingredients, and oil volume<->weight density conversion.
// Covers the acceptance scenarios from the prepared-items feature request (patty, beef stroganoff, burger mix, explicit
// yield gross/net basis, oil density in both directions and inside a formula, invalid inputs, location independence,
// duplicate-submit safety, formula/density-change snapshot isolation, no extra movement documents, and Load/Seed safety).
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const read=p=>fs.readFileSync(p,'utf8'),copy=x=>JSON.parse(JSON.stringify(x));
const near=(actual,expected,msg='')=>assert(Math.abs(actual-expected)<1e-6,`${actual} != ${expected} ${msg}`);

const baseIngredients=()=>[
 {id:'fillet',code:'ING-FILLET',name:'فیله پاک‌شده',category:'پروتئین',itemType:'MENU_INGREDIENT',recipeUnit:'کیلوگرم',purchaseUnit:'کیلوگرم',packageQuantity:1,wastePercent:0,status:'فعال',inventoryTracked:true},
 {id:'topoz',code:'ING-TOPOZ',name:'توپوز',category:'پروتئین',itemType:'MENU_INGREDIENT',recipeUnit:'کیلوگرم',purchaseUnit:'کیلوگرم',packageQuantity:1,wastePercent:0,status:'فعال',inventoryTracked:true},
 {id:'ran',code:'ING-RAN',name:'ران گوساله',category:'پروتئین',itemType:'MENU_INGREDIENT',recipeUnit:'کیلوگرم',purchaseUnit:'کیلوگرم',packageQuantity:1,wastePercent:0,status:'فعال',inventoryTracked:true},
 {id:'roughcut',code:'ING-ROUGH',name:'گوشت خام قبل پخت',category:'پروتئین',itemType:'MENU_INGREDIENT',recipeUnit:'کیلوگرم',purchaseUnit:'کیلوگرم',packageQuantity:1,wastePercent:6,status:'فعال',inventoryTracked:true},
 {id:'oil',code:'ING-OIL',name:'روغن مخصوص',category:'روغن',itemType:'MENU_INGREDIENT',recipeUnit:'کیلوگرم',purchaseUnit:'کیلوگرم',packageQuantity:1,wastePercent:0,densityKgPerLiter:0.92,densityNote:'دمای اتاق',status:'فعال',inventoryTracked:true},
 {id:'oilx',code:'ING-OILX',name:'روغن بدون چگالی',category:'روغن',itemType:'MENU_INGREDIENT',recipeUnit:'کیلوگرم',purchaseUnit:'کیلوگرم',packageQuantity:1,wastePercent:0,status:'فعال',inventoryTracked:true}
];
const basePreparedItems=()=>[
 {id:'PREP-STROG',name:'گوشت خام بیف استراگانف',status:'فعال',countUnit:'کیلوگرم',baseOutputQuantity:1,version:1,components:[{id:'c1',ingredientId:'fillet',quantity:1,unit:'کیلوگرم',basis:'gross'}]},
 {id:'PREP-PATTY',name:'پتی خام ۲۰۰ گرمی',status:'فعال',countUnit:'عدد',baseOutputQuantity:1,version:1,components:[{id:'c2',ingredientId:'topoz',quantity:120,unit:'گرم',basis:'gross'},{id:'c3',ingredientId:'ran',quantity:80,unit:'گرم',basis:'gross'}]},
 {id:'PREP-BURGERMIX',name:'مخلوط گوشت برگر',status:'فعال',countUnit:'کیلوگرم',baseOutputQuantity:1,version:1,components:[{id:'c4',ingredientId:'topoz',quantity:600,unit:'گرم',basis:'gross'},{id:'c5',ingredientId:'ran',quantity:400,unit:'گرم',basis:'gross'}]},
 {id:'PREP-YIELD-GROSS',name:'تست بازده-ناخالص',status:'فعال',countUnit:'کیلوگرم',baseOutputQuantity:1,version:1,components:[{id:'c6',ingredientId:'roughcut',quantity:2,unit:'کیلوگرم',basis:'gross'}]},
 {id:'PREP-YIELD-NET',name:'تست بازده-خالص',status:'فعال',countUnit:'کیلوگرم',baseOutputQuantity:1,version:1,components:[{id:'c7',ingredientId:'roughcut',quantity:2,unit:'کیلوگرم',basis:'net'}]},
 {id:'PREP-OILSAUCE',name:'سس حاوی روغن',status:'فعال',countUnit:'کیلوگرم',baseOutputQuantity:1,version:1,components:[{id:'c8',ingredientId:'oil',quantity:500,unit:'میلی‌لیتر',basis:'gross'}]},
 {id:'PREP-NOCOMP',name:'قلم بدون فرمول',status:'فعال',countUnit:'عدد',baseOutputQuantity:1,version:1,components:[]},
 {id:'PREP-MISSING-BASIS',name:'قلم بدون مبنا',status:'فعال',countUnit:'عدد',baseOutputQuantity:1,version:1,components:[{id:'c9',ingredientId:'fillet',quantity:1,unit:'کیلوگرم',basis:''}]},
 {id:'PREP-GHOST',name:'قلم با ماده ناموجود',status:'فعال',countUnit:'عدد',baseOutputQuantity:1,version:1,components:[{id:'c10',ingredientId:'no-such-ingredient',quantity:1,unit:'کیلوگرم',basis:'gross'}]}
];

function setupPricing(){
 const pricing={ingredients:baseIngredients(),menuItems:[],recipes:[],recipeVersions:[],priceHistory:[],ingredientPriceHistory:[],preparedItems:basePreparedItems(),changeLog:[],meta:{},settings:{},lists:{}};
 const elements={};const element=id=>elements[id]||(elements[id]={value:'',textContent:'',innerHTML:'',classList:{add(){},remove(){}},style:{}});
 const c={console,URLSearchParams,location:{pathname:'/qa.html',search:''},currentView:'qa',setTimeout(){},clearTimeout(){},sessionStorage:{getItem:()=> 'qa-manager'},document:{readyState:'loading',querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>({}),getElementById:element,addEventListener(){},head:{appendChild(){}}},$:element,esc:x=>String(x??''),badge:x=>String(x??''),toast:()=>{},renderView(){},closeModal(){},confirm:()=>true,RayoJalali:{today:()=> '1405/06/26'},getInventoryState:()=>({stocktakes:[]}),getSupplierState:()=>({suppliers:[]})};
 c.window=c;vm.createContext(c);
 const core=read('js/08-rayo-pricing-admin-module.js').replace('(function waitPricingModule(){',`Object.assign(window,{pcEditPreparedItem,pcSavePreparedItem,pcEditPreparedComponent,pcSavePreparedComponent,pcDeletePreparedItem,pcDeletePreparedComponent,pcPreparedItemList,pcPreparedComponentsPane});window.getPricingState=()=>pricingState;window.setTestPricing=x=>{pricingState=pcMigrate(x);pricingLoaded=true};(function waitPricingModule(){`);
 vm.runInContext(core,c);c.setTestPricing(pricing);
 return{c,math:c.RayoIngredientMath,pricing:c.getPricingState()};
}
function preparedItemOf(pricing,id){return pricing.preparedItems.find(x=>x.id===id)}

function setupBulk(){
 const state={settings:{mainLocationId:'kitchen',countApprovalRequired:true},stocktakes:[],locations:[{id:'kitchen',name:'آشپزخانه'},{id:'bar',name:'بار'}],inventoryMovements:[]};
 const inputs=[],prices=[],prepInputs=[];
 const els={v1012BulkDate:{value:'۱۴۰۵/۰۶/۲۴'},v1012BulkLoc:{value:'kitchen'},v1012BulkOpening:{checked:false},v1012BulkNote:{value:''},v1012BulkFields:{disabled:false},v1012BulkStatus:{textContent:''}};
 let saves=0,failure=null;const errors=[];
 const position=()=>({quantity:0,unitCost:null,baseDate:'1405/06/01',baseQuantity:0,movementNet:0,salesConsumption:0});
 const context={console,URLSearchParams,location:{pathname:'/inventory.html',search:''},sessionStorage:{getItem:()=> 'admin'},confirm:()=>{throw Error('bulk count must save without confirmation')},document:{readyState:'loading',querySelector:()=>null,createElement:()=>({}),head:{appendChild(){}},addEventListener(){},getElementById:id=>els[id],querySelectorAll:s=>s==='[data-v1012-bulk-qty]'?inputs:s==='[data-v1012-bulk-price]'?prices:s==='[data-v1012-prep-qty]'?prepInputs:[]},setTimeout(){},getInventoryState:()=>state,RayoJalali:{today:()=> '1405/06/24'},RayoInventoryV10:{isReady:()=>true,positionAtLocation:position,positionBeforeDate:position,downloadInventoryJson:()=>{throw Error('must not force a backup download')}},RAYO_API_GATEWAY:{createRequestId:()=>String(saves+1)+'-'+Math.random().toString(36).slice(2,6),saveModule:async(module)=>{assert.equal(module,'inventory');saves++;await Promise.resolve();if(failure)throw failure},loadModule:async()=>{throw Error('offline')}},toast:(msg,error)=>{if(error)errors.push(msg)}};
 context.window=context;vm.createContext(context);
 // pcIngredient/pcYield/preparedItemConversion read the module-private pricingState closure, not window.getPricingState;
 // the same setTestPricing patch used for the math-only tests keeps that closure in sync with what file 46 reads.
 const mathCore=read('js/08-rayo-pricing-admin-module.js').replace('(function waitPricingModule(){','window.getPricingState=()=>pricingState;window.setTestPricing=x=>{pricingState=pcMigrate(x);pricingLoaded=true};(function waitPricingModule(){');
 vm.runInContext(mathCore,context);
 context.setTestPricing({ingredients:baseIngredients(),preparedItems:basePreparedItems()});
 const pricing=context.getPricingState();
 vm.runInContext(read('js/46-inventory-operations-v10-12.js'),context);
 function addIngredient(id){const it={dataset:{v1012BulkQty:id},value:''};inputs.push(it);const pr={dataset:{v1012BulkPrice:id},value:''};prices.push(pr);return it}
 function addPrepared(id){const it={dataset:{v1012PrepQty:id},value:''};prepInputs.push(it);return it}
 return{state,pricing,inputs,prices,prepInputs,els,context,errors,api:context.RayoInventoryV1012,saves:()=>saves,fail:e=>failure=e,addIngredient,addPrepared};
}

let tests=0;async function test(name,run){await run();tests++;console.log('PASS '+name)}

(async()=>{
 await test('a) direct fillet 3kg + beef stroganoff 2kg (1:1, no re-applied loss) = 5kg net',()=>{
  const t=setupPricing(),item=preparedItemOf(t.pricing,'PREP-STROG'),conv=t.math.preparedItemConversion(item,2,'کیلوگرم');
  assert.equal(conv.complete,true);assert.equal(conv.contributions.length,1);near(conv.contributions[0].quantity,2);assert.equal(conv.contributions[0].basis,'gross');assert.equal(conv.contributions[0].yieldFactorApplied,null);
  near(3+conv.contributions[0].quantity,5);
 });
 await test('b) 30 patties -> 3.6kg topoz + 2.4kg ran',()=>{
  const t=setupPricing(),item=preparedItemOf(t.pricing,'PREP-PATTY'),conv=t.math.preparedItemConversion(item,30,'عدد');
  assert.equal(conv.complete,true);const topoz=conv.contributions.find(c=>c.ingredientId==='topoz'),ran=conv.contributions.find(c=>c.ingredientId==='ran');
  near(topoz.quantity,3.6);near(ran.quantity,2.4);
 });
 await test('c) 30 patties + 1kg burger mix -> 4.2kg topoz + 2.8kg ran combined',()=>{
  const t=setupPricing(),patty=preparedItemOf(t.pricing,'PREP-PATTY'),mix=preparedItemOf(t.pricing,'PREP-BURGERMIX');
  const p=t.math.preparedItemConversion(patty,30,'عدد'),m=t.math.preparedItemConversion(mix,1,'کیلوگرم');
  const total=id=>[...p.contributions,...m.contributions].filter(c=>c.ingredientId===id).reduce((a,c)=>a+c.quantity,0);
  near(total('topoz'),4.2);near(total('ran'),2.8);
 });
 await test('d) explicit 94% yield: net basis applies loss once (~2.12766kg), gross basis stays 2kg',()=>{
  const t=setupPricing(),g=preparedItemOf(t.pricing,'PREP-YIELD-GROSS'),n=preparedItemOf(t.pricing,'PREP-YIELD-NET');
  const cg=t.math.preparedItemConversion(g,1,'کیلوگرم'),cn=t.math.preparedItemConversion(n,1,'کیلوگرم');
  assert.equal(cg.complete,true);assert.equal(cn.complete,true);
  near(cg.contributions[0].quantity,2);assert.equal(cg.contributions[0].yieldFactorApplied,null);
  near(cn.contributions[0].quantity,2/0.94);near(cn.contributions[0].yieldFactorApplied,0.94);
 });
 await test('e) oil density 0.92: L<->kg, mL<->g both directions, and oil inside a formula',()=>{
  const t=setupPricing(),oil=t.pricing.ingredients.find(x=>x.id==='oil');
  near(t.math.convert(oil,10,'لیتر','کیلوگرم').value,9.2);
  near(t.math.convert(oil,500,'میلی‌لیتر','گرم').value,460);
  near(t.math.convert(oil,4.6,'کیلوگرم','لیتر').value,5);
  const sauce=preparedItemOf(t.pricing,'PREP-OILSAUCE'),conv=t.math.preparedItemConversion(sauce,1,'کیلوگرم');
  assert.equal(conv.complete,true);near(conv.contributions[0].quantity,0.46);
 });
 await test('f) invalid density/units/quantity/ingredient/formula, and zero vs blank',()=>{
  const t=setupPricing(),oil=t.pricing.ingredients.find(x=>x.id==='oil'),oilx=t.pricing.ingredients.find(x=>x.id==='oilx');
  assert.equal(t.math.convert(oilx,5,'لیتر','کیلوگرم').value,null,'missing density blocks cross-family conversion');
  assert.equal(t.math.convert({densityKgPerLiter:0},5,'لیتر','کیلوگرم').value,null,'zero density blocks conversion');
  assert.equal(t.math.convert({densityKgPerLiter:-1},5,'لیتر','کیلوگرم').value,null,'negative density blocks conversion');
  assert.equal(t.math.convert({densityKgPerLiter:'bad'},5,'لیتر','کیلوگرم').value,null,'invalid density blocks conversion');
  near(t.math.convert(oilx,5,'لیتر','میلی‌لیتر').value,5000,'same-family conversion never needs density');
  assert.equal(t.math.convert(oil,-1,'لیتر','کیلوگرم').value,null,'negative quantity is invalid');
  assert.equal(t.math.convert(oil,5,'گرم','عدد').value,null,'incompatible unit families are not supported');
  const noComp=preparedItemOf(t.pricing,'PREP-NOCOMP');assert.equal(t.math.preparedItemConversion(noComp,1,'عدد').complete,false,'empty formula is incomplete');
  const noBasis=preparedItemOf(t.pricing,'PREP-MISSING-BASIS');assert.equal(t.math.preparedItemConversion(noBasis,1,'عدد').complete,false,'missing basis blocks conversion, never guessed');
  const ghost=preparedItemOf(t.pricing,'PREP-GHOST');assert.equal(t.math.preparedItemConversion(ghost,1,'عدد').complete,false,'formula referencing a missing ingredient is incomplete');
  assert.equal(t.math.preparedItemConversion(null,1,'عدد').complete,false,'undefined prepared item is incomplete');
  const patty=preparedItemOf(t.pricing,'PREP-PATTY');assert.equal(t.math.preparedItemConversion(patty,0,'عدد').complete,true,'zero counted quantity is a valid explicit zero');
  near(t.math.preparedItemConversion(patty,0,'عدد').contributions[0].quantity,0);
 });
 await test('g) location independence, multi-row aggregation, and duplicate-submit safety',async()=>{
  let t=setupBulk();
  t.addIngredient('fillet').value='3';t.addPrepared('PREP-STROG').value='2';t.addPrepared('PREP-PATTY').value='30';t.addPrepared('PREP-BURGERMIX').value='1';
  await Promise.all([t.api.saveBulkCount(),t.api.saveBulkCount()]);
  assert.equal(t.saves(),1,'concurrent duplicate submit saves exactly once');
  assert.equal(t.state.stocktakes.length,1);
  const st=t.state.stocktakes[0],line=id=>st.lines.find(l=>l.ingredientId===id);
  near(line('fillet').actual,5);assert.equal(line('fillet').directlyCounted,true);
  near(line('topoz').actual,4.2);assert.equal(line('topoz').directlyCounted,false,'topoz was never entered directly, only derived from prepared items');
  near(line('ran').actual,2.8);
  assert.equal(st.preparedLines.length,3);
  t=setupBulk();t.els.v1012BulkLoc.value='bar';t.addPrepared('PREP-STROG').value='1';await t.api.saveBulkCount();
  assert.equal(t.saves(),1);assert.equal(t.state.stocktakes[0].locationId,'bar');near(t.state.stocktakes[0].lines[0].actual,1,'a second location does not merge into the first location count');
 });
 await test('h) changing the formula/density later does not alter an already-confirmed count',async()=>{
  const t=setupBulk();t.addPrepared('PREP-STROG').value='2';await t.api.saveBulkCount();
  const savedContribution=t.state.stocktakes[0].preparedLines[0].contributions[0].quantity;near(savedContribution,2);
  const def=t.pricing.preparedItems.find(x=>x.id==='PREP-STROG');def.components[0].quantity=999;def.components[0].basis='net';def.version=2;
  const oil=t.pricing.ingredients.find(x=>x.id==='fillet');oil.wastePercent=50;
  near(t.state.stocktakes[0].preparedLines[0].contributions[0].quantity,2,'saved snapshot is unaffected by later formula/ingredient edits');
  assert.equal(t.state.stocktakes[0].preparedLines[0].preparedItemVersion,1);
 });
 await test('i) conversion never creates a movement/production document, and confirm remains exactly-once',async()=>{
  const t=setupBulk();t.addIngredient('topoz').value='1';t.addPrepared('PREP-PATTY').value='10';await t.api.saveBulkCount();
  assert.equal(t.state.inventoryMovements.length,0,'no inventoryMovements are created by conversion or by bulk count');
  const st=t.state.stocktakes[0];near(st.lines.find(l=>l.ingredientId==='topoz').actual,1+1.2);
  assert.equal(st.status,'approved');
 });
 await test('j) offline load never seeds/saves; a custom unknown field on an existing count survives a same-day resubmit',async()=>{
  let t=setupBulk();assert.equal(t.saves(),0,'loading must not save');
  t.addIngredient('fillet').value='1';await t.api.saveBulkCount();
  t.state.stocktakes[0].customLegacyField='keep-me';
  t.addPrepared('PREP-STROG').value='1';await t.api.saveBulkCount();
  assert.equal(t.state.stocktakes.length,1);assert.equal(t.state.stocktakes[0].customLegacyField,'keep-me','unknown fields on the stocktake document survive a same-day revision');
  near(t.state.stocktakes[0].lines.find(l=>l.ingredientId==='fillet').actual,1,'same-day resubmission replaces the ingredient line with the latest total, matching pre-existing bulk-count semantics');
 });
 console.log(`RESULT ${tests}/${tests} PASS`);
})().catch(e=>{console.error(e);process.exitCode=1});
