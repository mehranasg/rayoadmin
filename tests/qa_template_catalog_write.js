// QA: base-data definitions of the new panel (migration stage 2) — ingredient and menu item (menu-write.js), supplier and
// supplier items (purchase-write.js), asset (assets-write.js). Synthetic data only.
// Run: node qa_template_catalog_write.js
'use strict';
const fs=require('fs'),path=require('path');
global.window={};
for(const f of ['inventory-engine.js','inventory-write.js','menu-write.js','purchase-write.js','assets-write.js'])eval(fs.readFileSync(path.join(__dirname,'../app/core/js',f),'utf8'));
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
throws(()=>MW.saveIngredient(d,ctx(),{name:'شیر',purchaseUnit:'لیتر',recipeUnit:'گرم',packageQuantity:1000}),/وزن هر لیتر/,'mass/volume units refused without density');
{const r=MW.saveIngredient(d,ctx(),{name:'شیر عسل تست',purchaseUnit:'لیتر',recipeUnit:'گرم',packageQuantity:1400,densityKgPerLiter:1.4});ok(r&&r.created,'weight base bought by لیتر with density saved');
 const i=d.ingredients.find(x=>x.name==='شیر عسل تست');ok(Number.isFinite(MW.unitCost({...i,lastPurchasePriceToman:1400},d).v),'unit cost with density across weight/volume');
 throws(()=>MW.saveIngredient(d,ctx(),{...i,packageQuantity:1000}),/با تبدیل‌های این قلم هر لیتر = 1400/,'pack size must agree with density');}
// a jar item (عدد) with «۱ عدد = ۹۰۰ گرم» brings کیلوگرم; bought by کیلوگرم the pack size must match (1000/900 jar)
{const cu=[{name:'گرم',factor:1/900,def:{a:'عدد',q:900,b:'گرم'}}];
 throws(()=>MW.saveIngredient(d,ctx(),{name:'عسل شیشه تست',purchaseUnit:'کیلوگرم',recipeUnit:'عدد',packageQuantity:1,countingUnits:cu}),/هر کیلوگرم = 1.111111 عدد/,'kg pack contradicts the gram row');
 const r=MW.saveIngredient(d,ctx(),{name:'عسل شیشه تست',purchaseUnit:'کیلوگرم',recipeUnit:'عدد',packageQuantity:1000/900,countingUnits:cu});ok(r&&r.created,'kg pack from the gram row saved');}
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
MW.saveMenuItem(d,ctx(),{id:'MENU-0001',name:'پیتزا مخصوص',category:'پیتزا',price:'',status:'فعال',siteStatus:'فعال'});ok(d.menuItems[0].currentPriceToman===500000&&d.menuItems[0].code==='101','edit without a price keeps price and code');
{const h0=(d.priceHistory||[]).length;throws(()=>MW.saveMenuItem(d,ctx(),{id:'MENU-0001',name:'پیتزا مخصوص',category:'پیتزا',price:999500}),/مضرب/,'edited price: multiple of 1000');
 const r=MW.saveMenuItem(d,ctx(),{id:'MENU-0001',name:'پیتزا مخصوص',category:'پیتزا',price:999000,status:'فعال',siteStatus:'فعال'});
 ok(d.menuItems[0].currentPriceToman===999000&&d.priceHistory.length===h0+1&&d.priceHistory[0].oldPriceToman===500000&&d.priceHistory[0].newPriceToman===999000&&r.priceRow&&d.menuItems[0].code==='101','edit with a new price: changed with a price history row, code kept');
 MW.saveMenuItem(d,ctx(),{id:'MENU-0001',name:'پیتزا مخصوص',category:'پیتزا',price:999000,status:'فعال',siteStatus:'فعال'});ok(d.priceHistory.length===h0+1,'same price: no new history row');
 d.menuItems[0].currentPriceToman=500000;d.priceHistory.shift()}
const m2=MW.saveMenuItem(d,ctx(),{name:'سالاد',code:'301',category:'سالاد',price:200000});ok(d.lists.menuCategories.includes('سالاد')&&d.settings.categoryTargets['سالاد']===35&&d.menuItems.find(m=>m.id===m2.id).lastPriceChangeAt,'new category gets target 35 (js/08)');
ok(MW.removeMenuItem(d,ctx(),{id:'MENU-0001',salesCount:3})==='deactivated'&&d.menuItems[0].status==='غیرفعال'&&d.menuItems[0].siteStatus==='غیرفعال','item with sales is deactivated (js/45)');
ok(MW.removeMenuItem(d,ctx(),{id:m2.id,salesCount:0})==='removed'&&!d.menuItems.some(m=>m.id===m2.id),'item without history is removed');
const s0=pricing();ok(MW.setRequireSalesCode(s0,ctx(),{value:false})===false&&s0.settings.requireMenuSalesCode===false,'owner setting');
// ---- supplier
const sup=()=>({suppliers:[{id:'SUP-0001',code:'SUP-001',company:'لبنیات پاک',cardNumber:'5022291309225322',status:'فعال',extra:'keep'}],supplierItems:[{id:'REL-1',supplierCode:'SUP-001',itemCode:'1001',status:'فعال',isPrimary:'خیر'}]});
let sd=sup();
{// suppliers from Excel: match by code then name, empty cell keeps the value, new gets the next code, bank not read
 const xd=sup(),sheets=[['s',[['گزارش'],['کد','نام تأمین‌کننده','مسئول','موبایل','دسته بندی','روزهای سفارش‌گیری','شماره کارت'],['SUP-001','لبنیات پاک','آقای رضایی','09121234567','',''],['','لبنیات پاک','','','','',''],['X9','نان سنگک','','۰۲۱۴۴۰۰۰','نان','شنبه، دوشنبه','6037000000000000'],['','','','','','','']]]];
 const pl=PW.parseSupplierSheets(sheets,xd);ok(pl.rows.length===2&&pl.skipped===1&&pl.rows[0].id==='SUP-0001'&&pl.rows[0].changes.join()==='contactName,mobile'&&pl.rows[1].created&&pl.rows[1].patch.phone==='02144000'&&pl.rows[1].patch.orderDays.join()==='شنبه,دوشنبه'&&!('cardNumber' in pl.rows[1].patch),'supplier sheet parsed');
 const c=ctx('suppliers'),done=PW.applySupplierRows(xd,c,pl.rows),s1=xd.suppliers[0],s2=xd.suppliers[1];
 ok(done.length===2&&s1.code==='SUP-001'&&s1.contactName==='آقای رضایی'&&s1.cardNumber==='5022291309225322'&&s1.extra==='keep'&&s2.code==='SUP-002'&&s2.mainGroup==='نان'&&c.auditExtra.added[0]==='SUP-002','import keeps codes, bank and unknown fields; new supplier gets the next code');
 ok(PW.parseSupplierSheets(sheets,xd).rows.length===0,'same file again changes nothing');
 throws(()=>PW.parseSupplierSheets([['s',[['a','b']]]],xd),/نام تأمین‌کننده/,'sheet without a name column refused')}
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
// latest-price template round trip (headers of the blank / sample file in the latest-prices form)
{const H=['کد ماده','نام ماده','دسته‌بندی','واحد خرید','آخرین قیمت خرید (تومان)','تاریخ آخرین قیمت','مبلغ فعلی (تومان)','تاریخ مبلغ فعلی'],ings=[{id:'A',code:'11',name:'شکر'},{id:'B',code:'12',name:'نمک'}];
 const r=MW.parsePriceSheets([['قیمت‌ها',[H,['11','شکر','','کیسه','250000','1405/08/10','200000','1405/07/01'],['12','نمک','','کیسه','','','90000','1405/07/01']]]],ings);
 ok(r.rows.length===1&&r.rows[0].price===250000&&r.rows[0].date==='1405/08/10'&&!r.bad.length,'template: new price column read (not the current-price column); empty price skipped silently')}
// item groups: rename moves items, rename to an existing group merges, empty group removed, group with items refused
{const d={lists:{ingredientCategories:['لبنیات','لبنی','خالی']},ingredients:[{id:'1',category:'لبنیات'},{id:'2',category:'لبنی'},{id:'3',category:'نان'}]};
 throws(()=>MW.saveIngredientGroups(JSON.parse(JSON.stringify(d)),ctx(),{rows:[{from:'لبنیات',to:''}]}),/قلم دارد/,'group with items is not removed');
 const c=ctx(),r=MW.saveIngredientGroups(d,c,{rows:[{from:'لبنیات',to:'لبنیات و تخم‌مرغ'},{from:'لبنی',to:'لبنیات و تخم‌مرغ'},{from:'خالی',to:''},{from:'',to:'تازه'}]});
 ok(d.ingredients.filter(i=>i.category==='لبنیات و تخم‌مرغ').length===2&&d.lists.ingredientCategories.join()==='لبنیات و تخم‌مرغ,تازه,نان'&&r.removed===1&&c.auditExtra.renamed.length===2,'rename, merge, add, remove; groups in use stay listed')}
// bulk add from Excel: several new items in one save get consecutive codes
{const d={settings:{},lists:{},ingredients:[{id:'ING-1',code:'100',name:'شکر'}]};const add=n=>MW.saveIngredient(d,ctx(),{name:n,category:'خشکبار',recipeUnit:'گرم',purchaseUnit:'کیلوگرم',packageQuantity:'1000',price:'',countingUnits:[]});const a1=add('بادام'),a2=add('گردو');
 ok(a1.code==='101'&&a2.code==='102'&&d.lists.ingredientCategories.includes('خشکبار'),'items added one after another get the next codes; new group listed');throws(()=>add('شکر'),/قبلاً تعریف شده/,'existing name refused')}
// item types and the standard catalog structure
{ok(MW.classifyItem({name:'دستمال توالت',category:'بهداشتی'}).type==='OPERATIONAL_CONSUMABLE'&&MW.classifyItem({name:'جعبه پیتزا بزرگ',category:'ظروف'}).type==='MENU_CONSUMABLE'&&MW.classifyItem({name:'کارد استیک فلورانس',category:'ظروف'}).type==='GENERAL_INVENTORY'&&MW.classifyItem({name:'کرایه حمل',category:'غیره'}).type==='NON_STOCK','types from names: cleaning, packaging, utensils, service');
 ok(MW.classifyItem({name:'تخم مرغ',category:'غذایی تند مصرف'}).group==='لبنیات و تخم‌مرغ'&&MW.classifyItem({name:'سس خردل سطلی',category:'بهداشتی'}).group==='سس، چاشنی و ادویه'&&MW.classifyItem({name:'تنباکو یخ',category:'کافه بار و قلیون'}).group==='قلیان'&&MW.classifyItem({name:'سوپ کوکا مرغ',category:'غذایی کند مصرف'}).group==='کنسرو، ترشی و غذای نیمه‌آماده','groups: eggs, a food item in a non-food group, tobacco flavours, soup');
 const d={lists:{ingredientCategories:['بهداشتی']},ingredients:[{id:'A',name:'دستمال',category:'بهداشتی',itemType:'MENU_INGREDIENT'},{id:'B',name:'لیوان کاغذی ویژه',category:'بهداشتی',itemType:'MENU_INGREDIENT'},{id:'C',name:'کرایه حمل',category:'غیره'}],recipes:[{menuItemId:'M',ingredientId:'B'}]},inv={stockReceipts:[{ingredientId:'C'}]};
 const pl=MW.catalogPlan(d,inv);ok(pl.find(r=>r.id==='C').type==='GENERAL_INVENTORY'&&pl.find(r=>r.id==='C').note,'a service item with stock history stays tracked');
 const c=ctx(),r=MW.applyCatalogStructure(d,c,{rows:pl.map(x=>({id:x.id,group:x.group,type:x.type}))});ok(r.changed===3&&d.ingredients[0].itemType==='OPERATIONAL_CONSUMABLE'&&d.ingredients[0].recipeCapable===false&&d.lists.ingredientCategories.length===16&&d.lists.ingredientGroupTypes['شوینده و بهداشتی']==='OPERATIONAL_CONSUMABLE'&&c.auditExtra.before.length===3&&MW.typeLabels(d).NON_STOCK==='خدمت و هزینه','apply: groups, types, behaviour flags, 16 groups with default types, new type names, previous values in the audit');
 MW.saveTypeSettings(d,ctx(),{labels:{...MW.typeLabels(d),NON_STOCK:'هزینه'},groupTypes:{'روغن':'MENU_INGREDIENT'}});ok(MW.typeLabels(d).NON_STOCK==='هزینه'&&MW.groupType(d,'روغن')==='MENU_INGREDIENT','type names and group default types saved');throws(()=>MW.saveTypeSettings(d,ctx(),{labels:{...MW.typeLabels(d),NON_STOCK:''}}),/لازم/,'a type needs a name')}
// a duplicate that only appears in the opening count: deletable by the owner (allowOpening), kept otherwise
{const d={settings:{},ingredients:[{id:'T1',code:'1',name:'تنباکو'},{id:'T2',code:'2',name:'تنباکو'}],menuItems:[],recipes:[]},inv={stocktakes:[{id:'O',date:'1405/06/01',baselineBoundary:'START',isOpeningBaseline:true,status:'approved',lines:[{ingredientId:'T1',actual:11},{ingredientId:'T2',actual:12}]}]},oh=new Map([['T2',12]]);
 ok(MW.cleanupPlan(d,inv,'T2',{onHand:oh}).action==='keep'&&MW.cleanupPlan(d,inv,'T2',{onHand:oh,allowOpening:true}).action==='delete','opening-only item: kept normally, deletable with allowOpening');
 inv.stocktakes.push({id:'L',date:'1405/07/01',status:'approved',lines:[{ingredientId:'T2',actual:3}]});ok(MW.cleanupPlan(d,inv,'T2',{onHand:oh,allowOpening:true}).action==='keep','a later count makes it real history')}
// bulk status and group
{const d={lists:{ingredientCategories:['الف']},ingredients:[{id:'1',status:'فعال',category:'الف'},{id:'2',status:'غیرفعال',category:'الف'},{id:'3',status:'فعال',category:'ب'}]},c=ctx();
 const r=MW.bulkIngredients(d,c,{ids:['1','2'],status:'غیرفعال'});ok(r.changed===1&&r.selected===2&&d.ingredients[0].status==='غیرفعال'&&c.auditExtra.before[0].status==='فعال','bulk status: only changed items counted, previous value in the audit');
 MW.bulkIngredients(d,ctx(),{ids:['1','3'],group:'ج'});ok(d.ingredients[2].category==='ج'&&d.lists.ingredientCategories.includes('ج'),'bulk group, new group listed');throws(()=>MW.bulkIngredients(d,ctx(),{ids:[],status:'فعال'}),/انتخاب/,'nothing selected')}
// catalog clean-up: delete unused, archive used-only-in-inactive or with history, keep active recipe items
{const d={settings:{},ingredients:[{id:'I1',code:'1001'},{id:'I2',code:'1002'},{id:'I3',code:'1003'},{id:'I4',code:'1004'},{id:'I5',code:'1009'},{id:'I6',code:'1006'}],menuItems:[{id:'M1',status:'فعال'},{id:'M2',status:'غیرفعال'}],
  recipes:[{menuItemId:'M1',ingredientId:'I1'},{menuItemId:'M2',ingredientId:'I2'},{menuItemId:'M1',preparedItemId:'PP1'}],preparedItems:[{id:'PP1',status:'فعال',components:[{ingredientId:'I6'}]}],ingredientPriceHistory:[{ingredientId:'I5',source:'manual'}]};
 const inv={stocktakes:[{id:'S1',lines:[{ingredientId:'I3',actual:2}]}]};
 ok(MW.cleanupPlan(d,inv,'I1').action==='keep'&&MW.cleanupPlan(d,inv,'I6').action==='keep'&&MW.cleanupPlan(d,inv,'I4',{onHand:new Map([['I4',2]])}).action==='keep','active recipe, active prepared item or stock on hand: kept');
 ok(MW.cleanupPlan(d,inv,'I2').action==='archive'&&MW.cleanupPlan(d,inv,'I3').action==='archive'&&MW.cleanupPlan(d,inv,'I4').action==='delete'&&MW.cleanupPlan(d,inv,'I5').action==='delete','only in inactive menu / count history: archive; unused (manual price only): delete');
 const c=ctx();const r=MW.cleanupIngredients(d,c,{ids:['I1','I2','I3','I4','I5'],inv});
 ok(r.deleted.map(x=>x.code).join()==='1004,1009'&&r.archived.join()==='1002,1003'&&r.kept.join()==='1001'&&d.ingredients.length===4,'clean-up result');
 ok(d.ingredients.find(x=>x.id==='I2').isArchived===true&&d.ingredients.find(x=>x.id==='I2').status==='غیرفعال'&&c.auditExtra.deleted.length===2,'archived inactive; deleted rows kept in the audit row');
 ok(MW.nextIngredientCode(d)==='1010','removed codes are not reused')
 const d2={settings:{},ingredients:[{id:'Z1',code:'2001'},{id:'Z2',code:'2002'}],menuItems:[],recipes:[]},inv2={stocktakes:[{id:'S1',lines:[{ingredientId:'Z1',actual:0},{ingredientId:'Z2',actual:3}]},{id:'S2',lines:[{ingredientId:'Z1',actual:0}]}]};
 ok(MW.cleanupPlan(d2,inv2,'Z1').action==='delete'&&MW.ingredientRefs(d2,inv2,'Z1').zeroCounts===2&&MW.cleanupPlan(d2,inv2,'Z2').action==='archive','an item only ever counted as zero is deletable; a counted quantity is history')}
{global.window.InvWrite||eval(fs.readFileSync(path.join(__dirname,'../app/core/js/inventory-write.js'),'utf8'));const d={settings:{},lists:{},ingredients:[]};
 const pe=MW.saveIngredient(d,ctx(),{name:'بادام زمینی',category:'خشکبار',recipeUnit:'کیلوگرم',purchaseUnit:'بسته',packageQuantity:0.35,useUnit:'گرم',countUnit:'بسته',countingUnits:[{name:'بسته ۱۰۰ گرمی',factor:0.1}]}),it=d.ingredients[0];
 ok(it.useUnit==='گرم'&&it.countUnit==='بسته'&&it.packageQuantity===0.35,'use unit (automatic گرم) and count unit (purchase pack) saved');
 throws(()=>MW.saveIngredient(d,ctx(),{id:it.id,name:'بادام زمینی',purchaseUnit:'بسته',packageQuantity:0.35,countUnit:'جعبه',countingUnits:it.countingUnits}),/واحد شمارش/,'count unit outside the item units refused');
 MW.saveIngredient(d,ctx(),{id:it.id,name:'بادام زمینی',purchaseUnit:'بسته',packageQuantity:0.35,countingUnits:it.countingUnits,notes:'x'});ok(it.useUnit==='گرم'&&it.countUnit==='بسته','a save without these fields keeps them');}
// base unit label fix: only to a factor-1 name; numbers unchanged; old label still the same unit for counts, prices, formulas
{const E=window.InvEngine,d={settings:{},lists:{},ingredients:[{id:'J',code:'4099',name:'آب آلبالو',recipeUnit:'عدد',purchaseUnit:'لیتر',packageQuantity:1,lastPurchasePriceToman:200000,lastPurchaseSource:'supplierInvoice',lastPurchaseInvoiceId:'INV1',status:'فعال',countUnit:'عدد',countingUnits:[]},{id:'S',code:'2',name:'شکر',recipeUnit:'عدد',purchaseUnit:'کیلوگرم',packageQuantity:2,status:'فعال'}],
  recipes:[{id:'R1',menuItemId:'M',ingredientId:'J',quantity:0.15}],ingredientPriceHistory:[{id:'H',ingredientId:'J',invoiceId:'INV1',date:'1405/08/01',priceToman:200000,packageQuantity:1,purchaseUnit:'لیتر',recipeUnit:'عدد'}],menuItems:[]};
 ok(MW.renameTargets(d.ingredients[0]).join()==='لیتر'&&MW.renameTargets(d.ingredients[1]).length===0,'targets: the purchase unit of size 1 only (sugar «هر کیلوگرم = ۲ عدد» has none)');
 const inv={stocktakes:[{lines:[{ingredientId:'J',actual:27.5,unitSnapshot:'عدد'}]}],stockReceipts:[{ingredientId:'J',quantity:3}]};
 const pl=MW.renameBaseUnitPlan(d,inv,'J','لیتر');ok(pl.ok&&pl.recipeLines===1&&pl.counts===1&&pl.receipts===1&&pl.prices===1,'preview counts what keeps its numbers');
 throws(()=>MW.renameBaseUnit(d,ctx(),{id:'J',to:'لیتر',reason:''}),/دلیل/,'reason required');throws(()=>MW.renameBaseUnit(d,ctx(),{id:'S',to:'کیلوگرم',reason:'x'}),/ضریب ۱/,'a non factor-1 name refused');
 const c=ctx();MW.renameBaseUnit(d,c,{id:'J',to:'لیتر',reason:'از اول لیتر بوده'});const j=d.ingredients[0];
 ok(j.recipeUnit==='لیتر'&&j.baseUnitRenames[0].from==='عدد'&&j.countUnit===''&&d.recipes[0].quantity===0.15&&c.auditExtra.from==='عدد','label changed, history kept, numbers untouched, count unit that was the old name reset');
 ok(E.sameUnit(j,'عدد')&&E.sameUnit(j,'لیتر')&&!E.sameUnit(j,'کیلوگرم')&&E.convertQty(j,2,'عدد','میلی‌لیتر').value===2000,'old label is the same unit (counts, formulas convert)');
 ok(Math.abs(MW.unitCost(j,d).v-200000)<1e-6,'invoice price saved under the old label still prices the item');}
// shared unit list: names in use always listed and never removed; other units keep how they were typed («۱ بسته = ۱۰۰ عدد»)
{const d={settings:{},lists:{units:['بسته','عدد']},ingredients:[{id:'N',code:'6002',name:'نی',recipeUnit:'بسته',purchaseUnit:'بسته',packageQuantity:1,status:'فعال',countingUnits:[{id:'CU-0001',name:'عدد',factor:0.05,active:true}]},{id:'P',code:'1',name:'بادام',recipeUnit:'کیلوگرم',purchaseUnit:'بسته',packageQuantity:0.35,status:'فعال'}]};
 ok(MW.unitList(d).join()==='بسته,عدد,کیلوگرم'&&MW.unitUsage(d).get('بسته')===2,'list = saved names + units in use; usage counted');
 const r=MW.saveUnitList(d,ctx(),{units:['بسته','عدد','کیلوگرم','شیرینگ',' شیرینگ ','بسته ۱۰۰ گرمی']});ok(d.lists.units.join()==='بسته,عدد,کیلوگرم,شیرینگ,بسته ۱۰۰ گرمی'&&r.added.includes('شیرینگ'),'units added once');
 throws(()=>MW.saveUnitList(d,ctx(),{units:['بسته','کیلوگرم']}),/عدد/,'a unit in use cannot be removed');
 MW.saveIngredient(d,ctx(),{id:'N',name:'نی',purchaseUnit:'بسته',packageQuantity:1,countingUnits:[{id:'CU-0001',name:'عدد',factor:0.01,def:{a:'بسته',q:100,b:'عدد'},active:true}]});const cu=d.ingredients[0].countingUnits[0];
 ok(cu.factor===0.01&&cu.def.a==='بسته'&&cu.def.q===100&&cu.def.b==='عدد'&&cu.id==='CU-0001','other unit saved with its factor and as typed («۱ بسته = ۱۰۰ عدد»)');}
console.log(`qa_template_catalog_write: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
