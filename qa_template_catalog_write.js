// QA: base-data definitions of the new panel (migration stage 2) — ingredient and menu item (menu-write.js), supplier and
// supplier items (purchase-write.js), asset (assets-write.js). Synthetic data only.
// Run: node qa_template_catalog_write.js
'use strict';
const fs=require('fs'),path=require('path');
global.window={};
for(const f of ['inventory-engine.js','inventory-write.js','menu-write.js','purchase-write.js','assets-write.js'])eval(fs.readFileSync(path.join(__dirname,'newpanel/core/js',f),'utf8'));
const E=window.InvEngine,MW=window.MenuWrite,PW=window.PurchaseWrite,AW=window.AssetsWrite;
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const throws=(f,re,m)=>{try{f();ok(false,m+' (no error)')}catch(e){ok(re.test(e.message),m+' → '+e.message)}};
const ctx=(module='pricing')=>({actor:'qa',at:'2026-11-08T10:00:00Z',reqId:'R1',module});
const pricing=()=>({settings:{},lists:{ingredientCategories:['لبنیات'],menuCategories:['پیتزا'],units:['گرم','کیلوگرم','عدد','لیتر','بسته']},
 ingredients:[{id:'ING-0001',code:'1001',name:'پنیر موزارلا',category:'لبنیات',purchaseUnit:'کیلوگرم',recipeUnit:'گرم',packageQuantity:1000,lastPurchasePriceToman:400000,wastePercent:0,status:'فعال',itemType:'MENU_INGREDIENT',sepids:{x:1}},
  {id:'ING-0002',code:'1002',name:'روغن',category:'لبنیات',purchaseUnit:'لیتر',recipeUnit:'لیتر',packageQuantity:1,lastPurchasePriceToman:1,status:'فعال',countingUnits:[{id:'CU-0003',name:'گالن',factor:4,active:true,createdAt:'old'}]}],
 menuItems:[{id:'MENU-0001',code:'101',name:'پیتزا مخصوص',category:'پیتزا',currentPriceToman:500000,status:'فعال',siteStatus:'فعال'}],
 recipes:[{id:'REC-1',menuItemId:'MENU-0001',ingredientId:'ING-0001',quantity:200}],recipeVersions:[],ingredientPriceHistory:[],priceHistory:[]});
// ---- ingredient
let d=pricing();
throws(()=>MW.saveIngredient(d,ctx(),{name:'پنير  موزارلا',purchaseUnit:'کیلوگرم',recipeUnit:'گرم',packageQuantity:1000}),/قبلاً تعریف/,'normalised duplicate name (ي, double space)');
const n=MW.saveIngredient(d,ctx(),{name:'ریحان',category:'سبزی',purchaseUnit:'کیلوگرم',recipeUnit:'گرم',packageQuantity:'۱۰۰۰',price:200000,priceDate:'1405/08/10',wastePercent:'۱۰'});
const ni=d.ingredients.find(i=>i.id===n.id);
ok(n.code==='1003'&&n.id==='ING-0003'&&ni.recipeCapable===true&&ni.inventoryTracked===true&&ni.procurementEnabled===true&&ni.lastPurchaseSource==='manual','new item: next code of the series and js/08 flags');
ok(d.lists.ingredientCategories.includes('سبزی')&&d.ingredientPriceHistory.length===1&&d.ingredientPriceHistory[0].priceToman===200000&&d.ingredientPriceHistory[0].date==='1405/08/10','new group listed; manual price history row');
throws(()=>MW.saveIngredient(d,ctx(),{id:'ING-0001',name:'پنیر موزارلا',purchaseUnit:'کیلوگرم',recipeUnit:'کیلوگرم',packageQuantity:1}),/واحد پایه/,'stock unit locked for an existing item');
throws(()=>MW.saveIngredient(d,ctx(),{id:'ING-0001',code:'9999',name:'پنیر موزارلا',purchaseUnit:'کیلوگرم',packageQuantity:1000}),/کد قلم/,'code locked');
throws(()=>MW.saveIngredient(d,ctx(),{name:'شیر',purchaseUnit:'لیتر',recipeUnit:'گرم',packageQuantity:1000}),/هم‌جنس/,'mass/volume units refused');
throws(()=>MW.saveIngredient(d,ctx(),{name:'ماست',purchaseUnit:'کیلوگرم',recipeUnit:'گرم',packageQuantity:0}),/بیشتر از صفر/,'package quantity > 0');
// edit: keeps unknown keys (sepids), no price change unless edited; waste change → recipe version
const e1=MW.saveIngredient(d,ctx(),{id:'ING-0001',name:'پنیر موزارلا',category:'لبنیات',purchaseUnit:'کیلوگرم',packageQuantity:1000,price:400000,priceEdited:false,wastePercent:5});
const ing1=d.ingredients.find(i=>i.id==='ING-0001');
ok(!e1.priceChanged&&ing1.sepids?.x===1&&ing1.lastPurchaseSource===undefined&&ing1.recipeUnit==='گرم','edit keeps unknown keys; price untouched when not edited');
ok(d.recipeVersions.length===1&&d.recipeVersions[0].menuItemId==='MENU-0001'&&d.recipeVersions[0].lines[0].wastePercent===5&&d.recipeVersions[0].source==='ingredient-preparation-loss-change','new loss → dated recipe version (js/08 pcStageLossChange)');
// counting units: ids kept, new id numbered after the highest, names checked
MW.saveIngredient(d,ctx(),{id:'ING-0002',name:'روغن',purchaseUnit:'لیتر',packageQuantity:1,countingUnits:[{id:'CU-0003',name:'گالن',factor:'5'},{name:'بشکه',factor:200}]});
const cu=d.ingredients.find(i=>i.id==='ING-0002').countingUnits;ok(cu[0].id==='CU-0003'&&cu[0].createdAt==='old'&&cu[0].factor===5&&cu[0].updatedAt&&cu[1].id==='CU-0004','counting units merged like js/08');
throws(()=>MW.saveIngredient(d,ctx(),{id:'ING-0002',name:'روغن',purchaseUnit:'لیتر',packageQuantity:1,countingUnits:[{name:'لیتر',factor:1}]}),/هم‌نام واحد پایه/,'counting unit cannot repeat the base unit');
ok(MW.ingredientUsage(d,'ING-0001').length===1,'usage: active menu items using the item');
const dd=pricing();dd.ingredients.push({id:'ING-0009',code:'1009',name:'پنیر  موزارلا'});ok(MW.duplicateNames(dd).size===1,'existing duplicates are found');
// ---- menu item
d=pricing();
throws(()=>MW.saveMenuItem(d,ctx(),{name:'پیتزا سبزیجات',category:'پیتزا'}),/کد سپیدز/,'Sepidz code required by default');
d.settings.requireMenuSalesCode=false;const m1=MW.saveMenuItem(d,ctx(),{name:'پیتزا سبزیجات',category:'پیتزا',price:450000});ok(/^ITEM-/.test(d.menuItems.find(m=>m.id===m1.id).code),'optional code (owner setting) → generated code');
d.settings.requireMenuSalesCode=true;
throws(()=>MW.saveMenuItem(d,ctx(),{name:'x',code:'۱۰۱',category:'پیتزا'}),/کد برای آیتم دیگری/,'duplicate Sepidz code (Persian digits)');
throws(()=>MW.saveMenuItem(d,ctx(),{name:'x',code:'102',category:'پیتزا',price:450500}),/مضرب/,'price multiple of 1000');
throws(()=>MW.saveMenuItem(d,ctx(),{name:'x',code:'102',category:'پیتزا',status:'غیرفعال',siteStatus:'فعال'}),/سایت/,'inactive item cannot be on the site');
MW.saveMenuItem(d,ctx(),{id:'MENU-0001',name:'پیتزا مخصوص',category:'پیتزا',price:999000,status:'فعال',siteStatus:'فعال'});ok(d.menuItems[0].currentPriceToman===500000&&d.menuItems[0].code==='101','edit never changes price or code');
const m2=MW.saveMenuItem(d,ctx(),{name:'سالاد',code:'301',category:'سالاد',price:200000});ok(d.lists.menuCategories.includes('سالاد')&&d.settings.categoryTargets['سالاد']===35&&d.menuItems.find(m=>m.id===m2.id).lastPriceChangeAt,'new category gets target 35 (js/08)');
ok(MW.removeMenuItem(d,ctx(),{id:'MENU-0001',salesCount:3})==='deactivated'&&d.menuItems[0].status==='غیرفعال'&&d.menuItems[0].siteStatus==='غیرفعال','item with sales is deactivated (js/45)');
ok(MW.removeMenuItem(d,ctx(),{id:m2.id,salesCount:0})==='removed'&&!d.menuItems.some(m=>m.id===m2.id),'item without history is removed');
const s0=pricing();ok(MW.setRequireSalesCode(s0,ctx(),{value:false})===false&&s0.settings.requireMenuSalesCode===false,'owner setting');
// ---- supplier
const sup=()=>({suppliers:[{id:'SUP-0001',code:'SUP-001',company:'لبنیات پاک',cardNumber:'5022291309225322',status:'فعال',extra:'keep'}],supplierItems:[{id:'REL-1',supplierCode:'SUP-001',itemCode:'1001',status:'فعال',isPrimary:'خیر'}]});
let sd=sup();
throws(()=>PW.saveSupplier(sd,ctx('suppliers'),{company:'لبنيات  پاک'}),/قبلاً تعریف/,'duplicate supplier name');
throws(()=>PW.saveSupplier(sd,ctx('suppliers'),{company:'نان',mobile:'0912'}),/موبایل/,'mobile format');
throws(()=>PW.saveSupplier(sd,ctx('suppliers'),{company:'نان',iban:'IR12'}),/شبا/,'IBAN format');
const ns=PW.saveSupplier(sd,ctx('suppliers'),{company:'نان سنگک',mobile:'۰۹۱۲۱۲۳۴۵۶۷',iban:'120000000000000000000001',channels:['hasWhatsapp'],orderDays:['شنبه']});
const nr=sd.suppliers.find(s=>s.id===ns.id);ok(ns.code==='SUP-002'&&ns.id==='SUP-0002'&&nr.mobile==='09121234567'&&nr.iban==='IR120000000000000000000001'&&nr.hasWhatsapp==='بله'&&nr.hasTelegram==='خیر'&&nr.orderDays[0]==='شنبه','new supplier shape (js/30)');
PW.saveSupplier(sd,ctx('suppliers'),{id:'SUP-0001',company:'لبنیات پاک',phone:'021'});const s1=sd.suppliers[0];ok(s1.cardNumber==='5022291309225322'&&s1.extra==='keep'&&s1.code==='SUP-001','edit keeps bank fields not sent and unknown keys');
throws(()=>PW.saveSupplier(sd,ctx('suppliers'),{id:'SUP-0001',code:'X',company:'لبنیات پاک'}),/کد/,'supplier code locked');
const pr=pricing();
let r=PW.saveSupplierItems(sd,ctx('suppliers'),{supplierId:'SUP-0001',ingredientIds:['ING-0002'],primaryIds:['ING-0002']},{pricing:pr});
ok(r.added===1&&r.removed===1&&sd.supplierItems.find(x=>x.id==='REL-1').status==='غیرفعال'&&sd.supplierItems.find(x=>x.ingredientId==='ING-0002').isPrimary==='بله','relations: new one added, unticked one set inactive (not removed)');
r=PW.saveSupplierItems(sd,ctx('suppliers'),{supplierId:'SUP-0002',ingredientIds:['ING-0002'],primaryIds:['ING-0002']},{pricing:pr});
ok(sd.supplierItems.filter(x=>x.ingredientId==='ING-0002'&&x.isPrimary==='بله').length===1&&sd.supplierItems.find(x=>x.supplierCode==='SUP-002').isPrimary==='بله','one primary supplier per item');
r=PW.saveSupplierItems(sd,ctx('suppliers'),{supplierId:'SUP-0001',ingredientIds:['ING-0001','ING-0002'],primaryIds:[]},{pricing:pr});ok(sd.supplierItems.find(x=>x.id==='REL-1').status==='فعال'&&r.added===0,'re-ticked relation is reactivated (matched by item code)');
PW.archiveSupplier(sd,ctx('suppliers'),{id:'SUP-0001',archived:true});ok(sd.suppliers[0].isArchived&&sd.suppliers[0].status==='غیرفعال','archive (js/04)');
// ---- asset
const ad=()=>({lists:{numberedStatuses:['فعال','نیازمند تعمیر'],quantityStatuses:['فعال','غیرفعال']},settings:{depreciationRates:{'عمومی':0.1}},assets:[{id:'AST-0001',trackingMode:'numbered',assetTag:'ITM-1',name:'یخچال',isArchived:true,baseUnitPriceToman:100,valuationBaseUnitPriceToman:100},{id:'AST-0002',trackingMode:'quantity',name:'لیوان',initialQuantity:50}],maintenanceRecords:[],quantityTransactions:[{id:'QTY-1',assetId:'AST-0002',quantity:2}],counts:[],assetIncidents:[]});
let a=ad();const c=ctx('assets');
AW.saveAsset(a,c,{id:'AST-0001',trackingMode:'numbered',name:'یخچال',assetTag:'ITM-1',basePrice:150,model:'X1'});ok(a.assets[0].isArchived===true&&a.assets[0].model==='X1'&&c.auditExtra.valuationPrice.after===150,'save keeps the archive state (fix), extra fields editable, valuation change audited');
throws(()=>AW.saveAsset(a,ctx('assets'),{trackingMode:'numbered',name:'فر',assetTag:'itm-1'}),/شماره اموال/,'duplicate tag');
throws(()=>AW.saveAsset(a,ctx('assets'),{trackingMode:'numbered',name:'فر'}),/الزامی/,'single numbered asset needs a tag');
ok(AW.saveAsset(a,ctx('assets'),{trackingMode:'numbered',name:'صندلی',valuationQuantity:12}).id==='AST-0003'&&a.assets[2].aggregateRecord===true,'several units without tags');
throws(()=>AW.saveAsset(a,ctx('assets'),{id:'AST-0002',trackingMode:'numbered',name:'لیوان',assetTag:'T9'}),/نوع/,'mode locked with history');
throws(()=>AW.saveAsset(a,ctx('assets'),{id:'AST-0002',trackingMode:'quantity',name:'لیوان',initialQuantity:60}),/تعداد اولیه/,'initial quantity locked after events');
AW.archiveAsset(a,ctx('assets'),{id:'AST-0001',archived:false});ok(a.assets[0].isArchived===false,'restore from archive');
throws(()=>AW.deleteAsset(a,ctx('assets'),{id:'AST-0002'}),/سابقه/,'asset with history is not deleted');
ok(AW.deleteAsset(a,ctx('assets'),{id:'AST-0003'})&&!a.assets.some(x=>x.id==='AST-0003'),'asset without history is deleted');
console.log(`qa_template_catalog_write: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
