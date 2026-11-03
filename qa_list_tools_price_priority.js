'use strict';
// List tools on every page, price-update priority filter and clearing the Sepidz import note on menu items.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const read=p=>fs.readFileSync(p,'utf8'),copy=x=>JSON.parse(JSON.stringify(x)),passed=[];
function ok(name,value){assert.ok(value,'FAIL: '+name);passed.push(name);console.log('  ✓ '+name)}
const ing=(id,name,price)=>({id,code:id.toUpperCase(),name,category:'لبنیات',itemType:'MENU_INGREDIENT',purchaseUnit:'کیلوگرم',recipeUnit:'گرم',packageQuantity:1000,lastPurchasePriceToman:price,wastePercent:0,status:'فعال'});
const SEED='داده اولیه واردشده از Item.xlsx سپیدز در 1405/05/17';
function setup({saveFails=false}={}){
 const pricing={ingredients:[ing('milk','شیر',0),ing('cream','خامه',0),ing('sugar','شکر',50000),ing('salt','نمک',0)],
  menuItems:[{id:'m1',name:'لاته',category:'قهوه',currentPriceToman:100000,notes:SEED},{id:'m2',name:'کاپوچینو',category:'قهوه',currentPriceToman:100000,notes:'داده اولیه وارد‌شده از item.xlsx سپیدز در ۱۴۰۵/۰۵/۱۷'},{id:'m3',name:'شیک',category:'نوشیدنی',currentPriceToman:100000,notes:'با بستنی وانیلی'},{id:'m4',name:'قدیمی',category:'قهوه',status:'غیرفعال',currentPriceToman:1,notes:''}],
  recipes:[{id:'r1',menuItemId:'m1',ingredientId:'milk',quantity:200},{id:'r2',menuItemId:'m2',ingredientId:'milk',quantity:150},{id:'r3',menuItemId:'m3',ingredientId:'milk',quantity:100},{id:'r4',menuItemId:'m3',ingredientId:'cream',quantity:20},{id:'r5',menuItemId:'m1',ingredientId:'sugar',quantity:5},{id:'r6',menuItemId:'m4',ingredientId:'salt',quantity:1},{id:'r7',menuItemId:'m4',ingredientId:'salt',quantity:1}],
  recipeVersions:[],ingredientPriceHistory:[],changeLog:[],meta:{},settings:{},lists:{}};
 const elements={},saves=[],toasts=[],downloads=[],server={pricing:copy(pricing)};
 const element=id=>elements[id]||(elements[id]={value:'',textContent:'',innerHTML:'',checked:false,classList:{add(){},remove(){}},style:{}});
 const c={console,URLSearchParams,Blob:class{constructor(parts){this.text=parts.join('')}},URL:{createObjectURL:b=>{downloads.push(JSON.parse(b.text));return'blob:qa'},revokeObjectURL(){}},location:{pathname:'/pricing.html',search:'?tab=priceUpdate'},currentView:'pricing',setTimeout(){},clearTimeout(){},sessionStorage:{getItem:()=> 'qa-manager'},document:{readyState:'loading',querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>({click(){}}),getElementById:element,addEventListener(){},head:{appendChild(){}}},$:element,esc:x=>String(x??''),badge:x=>String(x??''),toast:x=>toasts.push(x),renderView(){},closeModal(){},confirm:()=>true,RayoJalali:{today:()=> '1405/08/12'},getInventoryState:()=>({}),getSupplierState:()=>({suppliers:[]}),
  RAYO_API_GATEWAY:{getModuleStatus:()=>({sourceValid:true}),loadOrBootstrap:async m=>copy(server[m]||{}),saveModule:async(m,data)=>{if(saveFails)throw Error('offline');saves.push(m);server[m]=copy(data);return{verified:true,checked:copy(data)}},loadModule:async m=>copy(server[m])}};
 c.window=c;vm.createContext(c);
 const core=read('js/08-rayo-pricing-admin-module.js').replace('(function waitPricingModule(){',`Object.assign(window,{pcPriceUpdateFilteredIngredients,pcIngredientRecipeUsage,pcIngredientHasPrice,pcPriceUpdateList,pcPriceUpdateSave,pcMenuNoteGroups,pcIsSeedMenuNote,pcClearMenuNotes,pcMenuList,pcCostInfo});window.pricingUI=pricingUI;window.getPricingState=()=>pricingState;window.setTestPricing=x=>{pricingState=pcMigrate(x);pricingLoaded=true};(function waitPricingModule(){`);
 vm.runInContext(core,c);c.setTestPricing(pricing);
 return{c,elements,element,saves,toasts,downloads,server,p:c.getPricingState()};
}
(async()=>{
 // Price-update tab: priority list of items without a valid price.
 {const t=setup(),{c}=t;const usage=c.pcIngredientRecipeUsage();
  ok('usage counts distinct active menu items',usage.get('milk')===3&&usage.get('cream')===1&&usage.get('sugar')===1&&!usage.has('salt'));
  ok('items with a valid price are recognised',c.pcIngredientHasPrice(t.p.ingredients.find(x=>x.id==='sugar'))&&!c.pcIngredientHasPrice(t.p.ingredients.find(x=>x.id==='milk')));
  c.pricingUI.priceUpdatePriceStatus='missing';
  ok('missing filter lists only items without price, most used first',c.pcPriceUpdateFilteredIngredients().map(x=>x.id).join()==='milk,cream,salt');
  c.pricingUI.priceUpdatePriceStatus='';
  ok('default list keeps all items in catalog order',c.pcPriceUpdateFilteredIngredients().map(x=>x.id).join()==='milk,cream,sugar,salt');
  const html=c.pcPriceUpdateList();
  ok('price-update table has one pager only (native paging) and an Excel source',html.includes('data-pagination="native" data-list-export="pricingPriceUpdate"')&&(html.match(/catalog-pagination/g)||[]).length===1);
  ok('price-update table shows recipe usage column and missing count',html.includes('<th>استفاده در رسپی</th>')&&html.includes('بدون قیمت معتبر:'));
  c.pricingUI.priceUpdatePriceStatus='missing';
  const rows=c.RayoListExport.pricingPriceUpdate();
  ok('Excel source returns every filtered row aligned to the six headers',rows.length===3&&rows.every(r=>r.length===6)&&rows[0][0]==='شیر'&&rows[0][4]===3);
  // Entering the price of the first missing item opens the next missing item even though the saved one leaves the list.
  t.element('pc_pu_price_milk').value='60000';t.element('pc_pu_date_milk').value='1405/08/12';
  await c.pcPriceUpdateSave('milk');
  ok('saving a price advances to the next missing item',c.pricingUI.priceUpdateEditingId==='cream'&&t.saves.length===1&&t.server.pricing.ingredients.find(x=>x.id==='milk').lastPurchasePriceToman===60000);
  ok('saved item leaves the missing list',c.pcPriceUpdateFilteredIngredients().map(x=>x.id).join()==='cream,salt');}
 // Clearing menu item notes.
 {const t=setup(),{c}=t;const g=c.pcMenuNoteGroups();
  ok('Sepidz import note is recognised with ZWNJ, case and Persian digits',g.seed.map(x=>x.id).join()==='m1,m2'&&g.other.map(x=>x.id).join()==='m3');
  ok('menu list shows the clear-notes action with the seed count',c.pcMenuList().includes('pcClearMenuNotesModal()')&&c.pcMenuList().includes('پاک‌کردن توضیحات (۲)'));
  await c.pcClearMenuNotes();
  const saved=t.server.pricing.menuItems;
  ok('only Sepidz notes are cleared by default',saved.find(x=>x.id==='m1').notes===''&&saved.find(x=>x.id==='m2').notes===''&&saved.find(x=>x.id==='m3').notes==='با بستنی وانیلی'&&t.saves.length===1);
  ok('a backup with the previous notes is downloaded before saving',t.downloads.length===1&&t.downloads[0].backupType==='Rayo menu notes backup'&&t.downloads[0].items.length===2&&t.downloads[0].items[0].notes===SEED&&Array.isArray(t.downloads[0].pricing.menuItems));
  ok('other fields are untouched',saved.find(x=>x.id==='m1').name==='لاته'&&saved.length===4);}
 {const t=setup(),{c}=t;t.element('pc_clear_other_notes').checked=true;await c.pcClearMenuNotes();
  ok('ticking «سایر توضیحات» clears every note',t.server.pricing.menuItems.every(x=>!x.notes));}
 {const t=setup({saveFails:true}),{c}=t;await c.pcClearMenuNotes();
  ok('failed save rolls the notes back in memory',c.getPricingState().menuItems.find(x=>x.id==='m1').notes===SEED&&t.saves.length===0);}
 // 44 list tools: every page, native tables only with a full-data source, cleaner cell values.
 {const polish=read('js/44-phase1-polish-v10-10-1.js'),inv=read('js/46-inventory-operations-v10-12.js'),base=read('js/00-base.js');
  ok('list tools are no longer limited to personnel.html',!polish.includes("file()==='personnel.html'&&!table.closest('#modalBody')")&&polish.includes("table.dataset.listTools!=='off'"));
  ok('personnel column preferences keep their old key',polish.includes("if(file()==='personnel.html')return hrView()||'personnel'"));
  ok('native tables get a tools bar and keep their own pager',polish.includes("table.dataset.pagination==='native'?nativeListTools(table):enhanceList(table)"));
  ok('inventory stock list exports all filtered rows',inv.includes('data-list-export="inventoryStock"')&&inv.includes('.inventoryStock=()=>stockListRows()'));
  ok('tips view has a per-person summary table',base.includes('function tipPersonSummaryCard(rows)')&&base.includes('${tipPersonSummaryCard(rows)}'));
  const ctx={};vm.createContext(ctx);vm.runInContext(polish.match(/const S=x=>[^\n]*?,E=/)[0].replace(/,E=$/,';')+'\n'+polish.match(/function exportNumber[^\n]*/)[0]+';this.exportNumber=exportNumber',ctx);
  ok('Persian money, decimals, percent and negative values export as numbers',ctx.exportNumber('۱۲۳٬۴۵۶ تومان')===123456&&ctx.exportNumber('۳۵٫۵٪')===35.5&&ctx.exportNumber('‎−۲٬۰۰۰')===-2000&&ctx.exportNumber('لاته')===null);}
 console.log(`PASS ${passed.length}: list tools on all pages, price-update priority filter and menu note clearing`);
})().catch(e=>{console.error(e);process.exit(1)});
