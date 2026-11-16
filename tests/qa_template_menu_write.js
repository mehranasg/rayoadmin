// QA: newpanel/core/js/menu-write.js — menu cost model, recipe/price/settings records and the pricing save (synthetic data only).
// Run: node qa_template_menu_write.js
'use strict';
const fs=require('fs'),path=require('path');
global.window={};
for(const f of ['inventory-engine.js','inventory-write.js','menu-write.js'])eval(fs.readFileSync(path.join(__dirname,'../app/core/js',f),'utf8'));
const E=window.InvEngine,W=window.InvWrite,MW=window.MenuWrite;
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const throws=(f,re,m)=>{try{f();ok(false,m+' (no error)')}catch(e){ok(re.test(e.message),m+' → '+e.message)}};
const near=(a,b)=>Math.abs(a-b)<1e-6;
const T=E.CAL.today,day=k=>E.CAL.k(E.CAL.i(T)-k);
function doc(){return{meta:{},settings:{priceIncrementToman:5000,categoryTargets:{'پیتزا':30}},lists:{menuCategories:['پیتزا','نوشیدنی']},
 ingredients:[{id:'ING-1',code:'1',name:'پنیر',status:'فعال',itemType:'MENU_INGREDIENT',purchaseUnit:'کیلوگرم',recipeUnit:'کیلوگرم',packageQuantity:1,lastPurchasePriceToman:400000,wastePercent:20},
  {id:'ING-2',code:'2',name:'خمیر',status:'فعال',purchaseUnit:'کارتن',recipeUnit:'عدد',packageQuantity:50,lastPurchasePriceToman:1000000},
  {id:'ING-3',code:'3',name:'بی‌قیمت',status:'فعال',purchaseUnit:'کیلوگرم',recipeUnit:'کیلوگرم',packageQuantity:1},
  {id:'ING-4',code:'4',name:'شوینده',status:'فعال',itemType:'OPERATIONAL_CONSUMABLE',purchaseUnit:'لیتر',recipeUnit:'لیتر',packageQuantity:1,lastPurchasePriceToman:1}],
 menuItems:[{id:'MENU-1',code:'101',name:'پیتزا',category:'پیتزا',currentPriceToman:500000,status:'فعال'},{id:'MENU-2',code:'201',name:'نوشابه',category:'نوشیدنی',currentPriceToman:80000,manualCostToman:30000,status:'فعال'},{id:'MENU-3',code:'301',name:'جدید',category:'نوشیدنی',currentPriceToman:100000,status:'فعال'}],
 recipes:[{id:'REC-0007',menuItemId:'MENU-1',ingredientId:'ING-1',quantity:0.2},{id:'REC-0008',menuItemId:'MENU-1',ingredientId:'ING-2',quantity:1}],
 recipeVersions:[{id:'RV-000001',menuItemId:'MENU-1',effectiveFrom:'0000/00/00',createdAt:'2026-01-01T00:00:00Z',lines:[{ingredientId:'ING-1',quantity:0.2},{ingredientId:'ING-2',quantity:1}]}],
 priceHistory:[],changeLog:[{at:'x',action:'old'}]}}
const ctx=()=>({actor:'qa-admin',at:new Date().toISOString(),reqId:'R'+Math.random().toString(36).slice(2,7),module:'pricing'});
// sale prices from the online menu: exact name match (normalised), suggestions never auto-picked, batch apply
{const d={settings:{},menuItems:[{id:'M1',code:'1',name:'کافه لاته',category:'قهوه',currentPriceToman:300000,status:'فعال'},{id:'M2',code:'2',name:'لاته Iced',currentPriceToman:320000,status:'فعال'},{id:'M3',code:'3',name:'سالاد سبز',currentPriceToman:700000,status:'فعال'},{id:'M4',code:'4',name:'آیتم قدیمی',currentPriceToman:1000,status:'غیرفعال'},{id:'M5',code:'5',name:'چای',currentPriceToman:150000,status:'فعال'}],recipes:[],ingredients:[],priceHistory:[]};
 const online=[{title:'كافه  لاته',priceToman:380000},{title:'لاته سرد',priceToman:410000},{title:'چای',priceToman:150000},{title:'پیتزا',priceToman:900000}];
 const pl=MW.onlinePricePlan(d,online),r=id=>pl.rows.find(x=>x.menuId===id);
 ok(pl.rows.length===4&&r('M1').kind==='exact'&&r('M1').online===380000&&r('M1').diff===80000,'exact match ignores ك/ی and spacing; inactive items left out');
 ok(r('M2').kind==='suggest'&&r('M2').title==='لاته سرد'&&r('M3').kind==='none','Iced ↔ سرد is only a suggestion; no match stays empty');
 ok(pl.summary.exactChanged===1&&pl.unused.some(o=>o.title==='پیتزا'),'summary and online items with no panel item');
 throws(()=>MW.applyOnlinePrices(d,ctx(),{picks:[{menuId:'M5',price:150000}]}),/قیمتی برای تغییر/,'nothing to change refused');
 throws(()=>MW.applyOnlinePrices(JSON.parse(JSON.stringify(d)),ctx(),{picks:[{menuId:'M1',price:380000},{menuId:'M1',price:380000}]}),/دو بار/,'same item twice refused');
 const c=ctx(),res=MW.applyOnlinePrices(d,c,{picks:[{menuId:'M1',price:380000,title:'كافه  لاته'},{menuId:'M2',price:410000,title:'لاته سرد'},{menuId:'M5',price:150000,title:'چای'}]});
 ok(res.changed.length===2&&res.same.length===1&&d.menuItems[1].currentPriceToman===410000&&d.priceHistory.length===2&&/منوی آنلاین/.test(d.priceHistory[0].notes)&&c.auditExtra.changed===2,'picked prices applied, each with a price-history row')}

// 1. cost model = current panel menuMetrics
let d=doc(),x=MW.metrics(d,d.menuItems[0]);
ok(near(x.cost,0.2*400000/0.8+1*20000)&&x.complete&&x.state==='complete','cost = qty × price ÷ pack ÷ (1 − loss)');
ok(x.target===30&&x.suggested===Math.ceil(x.cost/0.30/5000)*5000,'category target and suggested price rounded up to the step');
const x2=MW.metrics(d,d.menuItems[1]);ok(x2.state==='manual'&&x2.cost===30000&&x2.target===35,'manual cost without lines, default target 35');
d.recipes.push({id:'REC-0009',menuItemId:'MENU-1',ingredientId:'ING-3',quantity:1});x=MW.metrics(d,d.menuItems[0]);ok(x.state==='incomplete'&&x.suggested===0&&x.rows.find(r=>r.l.ingredientId==='ING-3').why==='بدون قیمت خرید','missing price → incomplete, no suggestion');
ok(MW.versionDrift(d,'MENU-1')==='differs','current lines differing from today\'s version are detected');

// 2. recipe edit
d=doc();let c=ctx();const r1=MW.saveRecipe(d,c,{menuId:'MENU-1',lines:[{ingredientId:'ING-1',quantity:'۰٫۲۵'},{ingredientId:'ING-2',quantity:1}],effectiveFrom:day(2),note:'پنیر بیشتر'});
const lines=MW.recipeLines(d,'MENU-1');
ok(r1.changed&&lines.find(l=>l.ingredientId==='ING-1').id==='REC-0007'&&near(lines.find(l=>l.ingredientId==='ING-1').quantity,0.25),'existing line keeps its id, quantity updated (Persian digits)');
ok(r1.version&&r1.version.id==='RV-000002'&&r1.version.effectiveFrom===day(2)&&r1.version.source==='ui-template-recipe-edit'&&r1.version.lines.every(l=>l.recipeUnit&&l.wastePercent!==undefined),'dated version with loss/unit snapshot');
ok(d.changeLog[0].action==='RECIPE_VERSION_CREATED'&&d.changeLog[0].entityId==='MENU-1','version row at the front of pricing.changeLog');
ok(c.auditExtra.before.lines.length===2&&c.auditExtra.before.lines[0].quantity===0.2,'audit keeps the lines before the change');
throws(()=>MW.saveRecipe(d,ctx(),{menuId:'MENU-1',lines:[{ingredientId:'ING-1',quantity:0.25},{ingredientId:'ING-2',quantity:1}],effectiveFrom:T}),/تغییری/,'unchanged recipe refused');
throws(()=>MW.saveRecipe(d,ctx(),{menuId:'MENU-1',lines:[{ingredientId:'ING-1',quantity:0.3}],effectiveFrom:day(5)}),/آخرین نسخه/,'date before the latest version refused');
throws(()=>MW.saveRecipe(d,ctx(),{menuId:'MENU-1',lines:[{ingredientId:'ING-1',quantity:0.3}],effectiveFrom:E.CAL.k(E.CAL.i(T)+1)}),/آینده/,'future date refused');
// sub-recipe: a recipe line names a prepared item (cost from its formula; sales and waste expand to its ingredients)
{const sd=doc();sd.preparedItems=[{id:'PREP-0001',name:'سس سزار',status:'فعال',countUnit:'گرم',baseOutputQuantity:1000,version:1,components:[{id:'PREPC-0001',ingredientId:'ING-1',quantity:500,unit:'گرم',basis:'net'}]}];
 const pc=MW.prepCost(sd,sd.preparedItems[0]);ok(Math.abs(pc.v-0.5/0.8*400000/1000)<1e-6,'prepared unit cost from the formula (gross × price)');
 MW.saveRecipe(sd,ctx(),{menuId:'MENU-1',lines:[{ingredientId:'ING-2',quantity:1},{preparedItemId:'PREP-0001',quantity:'۶۰'}],effectiveFrom:T});
 const rl=sd.recipes.find(r=>r.menuItemId==='MENU-1'&&r.preparedItemId==='PREP-0001'),mx=MW.metrics(sd,sd.menuItems[0]),pr=mx.rows.find(r=>r.prep);
 ok(rl&&rl.unit==='گرم'&&rl.quantity===60&&!rl.ingredientId&&pr&&Math.abs(pr.cost-60*pc.v)<1e-6&&mx.state==='complete','recipe line with a prepared item, costed');
 const v=MW.versionsOf(sd,'MENU-1')[0];ok(v.lines.some(l=>l.preparedItemId==='PREP-0001'&&l.quantity===60),'version snapshot keeps the prepared line');
 const Mx=E.build({inventory:{stocktakes:[],stockReceipts:[],wasteRecords:[],consumptionRecords:[],salesPeriods:[],inventoryMovements:[]},pricing:sd}),ex=Mx.recipeAt('MENU-1',T),pl=ex.find(l=>l.fromPreparedId);
 ok(pl&&pl.ingredientId==='ING-1'&&Math.abs(pl.quantity-0.0375)<1e-9&&pl.wastePercent===0&&Math.abs(Mx.gross(Mx.ing.get('ING-1'),pl,2)-0.075)<1e-9,'engine expands the prepared line into gross ingredient quantity');
 throws(()=>MW.saveRecipe(sd,ctx(),{menuId:'MENU-1',lines:[{preparedItemId:'PREP-0001',quantity:1},{preparedItemId:'PREP-0001',quantity:2}],effectiveFrom:T}),/دو بار/,'same prepared item twice refused');
 ok(MW.ingredientUsage(sd,'ING-1').some(m=>m.id==='MENU-1'),'ingredient used through a prepared item counts as used')}
// fryer oil share per item and writing it into recipes
{const sh=MW.oilShare({oilKg:20,items:[{menuId:'A',qty:100,weight:1},{menuId:'B',qty:50,weight:2},{menuId:'C',qty:0,weight:1}]});ok(Math.abs(sh.perWeight-0.1)<1e-9&&Math.abs(sh.rows[1].perPortion-0.2)<1e-9&&sh.rows.length===2,'oil shared by sold × weight');
 ok(MW.oilShare({oilKg:0,items:[{menuId:'A',qty:1,weight:1}]}).perWeight===null,'no oil → no share');
 const od=doc();MW.saveRecipe(od,ctx(),{menuId:'MENU-1',lines:[{ingredientId:'ING-1',quantity:0.25}],effectiveFrom:T});const out=MW.setOilInRecipes(od,ctx(),{oilId:'ING-2',rows:[{menuId:'MENU-1',perPortion:0.035}],effectiveFrom:T});
 ok(out.length===1&&od.recipes.some(r=>r.menuItemId==='MENU-1'&&r.ingredientId==='ING-2'&&Math.abs(r.quantity-0.035)<1e-9)&&od.recipes.some(r=>r.menuItemId==='MENU-1'&&r.ingredientId==='ING-1'),'oil line added, other lines kept');
 throws(()=>MW.setOilInRecipes(od,ctx(),{oilId:'ING-2',rows:[{menuId:'MENU-1',perPortion:0.035}],effectiveFrom:T}),/تغییری/,'same oil again refused')}
throws(()=>MW.saveRecipe(d,ctx(),{menuId:'MENU-1',lines:[{ingredientId:'ING-1',quantity:1},{ingredientId:'ING-1',quantity:2}]}),/دو بار/,'duplicate ingredient refused');
throws(()=>MW.saveRecipe(d,ctx(),{menuId:'MENU-1',lines:[{ingredientId:'ING-4',quantity:1}]}),/مادهٔ رسپی/,'operational consumable not allowed in a recipe');
throws(()=>MW.saveRecipe(d,ctx(),{menuId:'MENU-1',lines:[{ingredientId:'ING-1',quantity:0}]}),/مثبت/,'zero quantity refused');
throws(()=>MW.saveRecipe(d,ctx(),{menuId:'MENU-1',lines:[]}),/دست‌کم/,'empty recipe refused');
const r2=MW.saveRecipe(d,ctx(),{menuId:'MENU-3',lines:[{ingredientId:'ING-2',quantity:2}],effectiveFrom:T});
ok(r2.version.effectiveFrom==='0000/00/00'&&MW.recipeLines(d,'MENU-3')[0].id==='REC-0009','first version applies from the start; new line id REC-nnnn');
const r3=MW.saveRecipe(d,ctx(),{menuId:'MENU-1',lines:[{ingredientId:'ING-2',quantity:1}],effectiveFrom:T});
ok(MW.recipeLines(d,'MENU-1').length===1&&r3.version.lines.length===1&&MW.versionsOf(d,'MENU-1').length===3,'removed line leaves the recipe; history stays in the versions');
const M2=E.build({inventory:{stocktakes:[]},pricing:d});ok(M2.recipeAt('MENU-1',day(3)).length===2&&M2.recipeAt('MENU-1',T).length===1,'inventory uses the version of each date');

// 3. price change
d=doc();c=ctx();const pr=MW.changePrice(d,c,{menuId:'MENU-1',price:'۵۵۰٬۰۰۰',note:'افزایش پنیر'});
ok(d.menuItems[0].currentPriceToman===550000&&pr.oldPriceToman===500000&&pr.id==='PRICE-0001'&&d.priceHistory[0]===pr&&pr.costToman===120000&&pr.targetCostPercent===30,'price history row like the current panel');
ok(c.auditExtra.before.currentPriceToman===500000,'audit keeps the old price');
throws(()=>MW.changePrice(d,ctx(),{menuId:'MENU-1',price:550000}),/یکی است/,'same price refused');
throws(()=>MW.changePrice(d,ctx(),{menuId:'MENU-1',price:550500}),/مضرب/,'price not a multiple of 1,000 refused');

// 4. settings
d=doc();MW.saveSettings(d,ctx(),{targets:{'نوشیدنی':'۲۸'},step:'7500'});
ok(d.settings.categoryTargets['نوشیدنی']===28&&d.settings.priceIncrementToman===8000&&d.settings.categoryTargets['پیتزا']===30,'targets and step saved (step rounded up to 1,000)');
throws(()=>MW.saveSettings(d,ctx(),{targets:{'نوشیدنی':0}}),/بین ۱ و ۱۰۰/,'target out of range refused');
throws(()=>MW.saveSettings(d,ctx(),{targets:{'ناموجود':30}}),/در منو نیست/,'unknown category refused');

// 5. protected save, module pricing
(async()=>{const server={text:JSON.stringify(doc()),saves:0};
 const io={module:'pricing',validate:MW.validPricing,load:async()=>JSON.parse(server.text),save:async x=>{server.saves++;server.text=JSON.stringify(x)},actor:()=>'qa-admin',pricing:()=>null};
 await W.edit(io,{action:'MENU_PRICE_CHANGED',details:{menuId:'MENU-1'},mutate:(x,cx)=>MW.changePrice(x,cx,{menuId:'MENU-1',price:600000})});
 const s=JSON.parse(server.text);
 ok(server.saves===1&&s.menuItems[0].currentPriceToman===600000&&/^PRICING-/.test(s.meta.serverSaveToken),'pricing saved and verified');
 ok(s.changeLog[0].action==='MENU_PRICE_CHANGED'&&s.changeLog[0].via==='ui-template'&&/^PLOG-/.test(s.changeLog[0].id)&&s.changeLog[0].before.currentPriceToman===500000&&s.changeLog.at(-1).action==='old','audit row first in the pricing log, older rows kept');
 try{await W.edit({...io,load:async()=>({menuItems:[]})},{action:'X',mutate:()=>1});ok(false,'invalid pricing load should throw')}catch(e){ok(/منو و قیمت/.test(e.message)&&server.saves===1,'incomplete pricing Load refuses to save')}
 {const d=doc();d.ingredients[0].recipeUnit='کیلوگرم';const c=ctx();MW.saveRecipe(d,c,{menuId:'MENU-1',lines:[{ingredientId:'ING-1',quantity:0.15,entryUnit:'گرم',entryQuantity:150},{ingredientId:'ING-2',quantity:1}]});
  const l=d.recipes.find(r=>r.menuItemId==='MENU-1'&&r.ingredientId==='ING-1');ok(l.quantity===0.15&&l.entryUnit==='گرم'&&l.entryQuantity===150,'recipe line typed as 150 g keeps 0.15 kg and how it was typed');
  MW.saveRecipe(d,ctx(),{menuId:'MENU-1',lines:[{ingredientId:'ING-1',quantity:0.2},{ingredientId:'ING-2',quantity:1}]});const l2=d.recipes.find(r=>r.menuItemId==='MENU-1'&&r.ingredientId==='ING-1');ok(l2.quantity===0.2&&l2.entryUnit===undefined,'typed in the base unit again: the entry unit is dropped');}
 console.log(`qa_template_menu_write: ${pass} passed, ${fail} failed`);process.exit(fail?1:0)})();
