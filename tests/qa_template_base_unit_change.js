// QA (BL-095): base unit change WITH conversion: «نی» from «بسته» (۱ بسته = ۱۰۰ عدد) to «عدد». Every stored quantity ×100,
// every cost per base unit ÷100, value unchanged; the old base stays as an other unit; same change id never converts twice;
// the change back restores the numbers. Synthetic data only. Run: node qa_template_base_unit_change.js
'use strict';
const fs=require('fs'),path=require('path');
global.window={};for(const f of ['inventory-engine.js','inventory-write.js','menu-write.js'])eval(fs.readFileSync(path.join(__dirname,'../app/core/js',f),'utf8'));
const MW=window.MenuWrite,W=window.InvWrite,E=window.InvEngine;let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const near=(a,b)=>Math.abs(Number(a)-Number(b))<1e-6;
const throws=(f,re,m)=>{try{f();ok(false,m+' (no error)')}catch(e){ok(re.test(e.message),m+' → '+e.message)}};
const ctx=()=>({actor:'owner',at:'2026-11-28T10:00:00Z',reqId:'R'});
const pr={ingredients:[{id:'ING-1',code:'6002',name:'نی',recipeUnit:'بسته',purchaseUnit:'بسته',packageQuantity:1,lastPurchasePriceToman:50000,wastePercent:0,status:'فعال',useUnit:'عدد',countUnit:'بسته',reorderPoint:2,
  countingUnits:[{id:'CU-0001',name:'عدد',factor:0.01,active:true,def:{a:'بسته',q:100,b:'عدد'}}]},
  {id:'ING-2',code:'1001',name:'آرد',recipeUnit:'کیلوگرم',purchaseUnit:'کیسه',packageQuantity:25,lastPurchasePriceToman:500000,status:'فعال'}],
 recipes:[{id:'R1',menuItemId:'M1',ingredientId:'ING-1',quantity:0.01},{id:'R2',menuItemId:'M1',ingredientId:'ING-2',quantity:0.2}],
 recipeVersions:[{id:'V1',menuItemId:'M1',lines:[{ingredientId:'ING-1',quantity:0.02,recipeUnit:'بسته'}]}],
 preparedItems:[{id:'P1',components:[{ingredientId:'ING-1',quantity:0.5,unit:'بسته'},{ingredientId:'ING-1',quantity:3,unit:'عدد'}]}],
 ingredientPriceHistory:[{id:'H1',ingredientId:'ING-1',date:'1405/08/01',priceToman:50000,purchaseUnit:'بسته',recipeUnit:'بسته',packageQuantity:1,unitCostToman:50000}],menuItems:[{id:'M1',name:'آب‌میوه'}]};
const inv={stocktakes:[{id:'S1',date:'1405/08/01',status:'approved',lines:[{ingredientId:'ING-1',unitSnapshot:'بسته',actual:3,expected:3.5,variance:-0.5,unitCost:50000,varianceValueToman:-25000},
  {ingredientId:'ING-1',unitSnapshot:'بسته',actual:1.5,countParts:[{place:'بار',quantity:1,unit:'بسته',factor:1,base:1},{place:'انبار',quantity:50,unit:'عدد',factor:0.01,base:0.5}]}]}],
 stockReceipts:[{id:'RC1',ingredientId:'ING-1',date:'1405/08/02',quantity:2,unitCostToman:50000,totalPriceToman:100000,unitSnapshot:'بسته'},{id:'RC2',ingredientId:'ING-1',date:'1405/08/03',quantity:0.5,entryQuantity:50,entryUnit:'عدد',entryUnitFactor:0.01,unitSnapshot:'بسته'}],
 wasteRecords:[{id:'W1',type:'ingredient',itemId:'ING-1',quantity:0.05},{id:'W2',type:'menu',itemId:'M1',quantity:1}],consumptionRecords:[],
 inventoryMovements:[{id:'MV1',ingredientId:'ING-1',quantity:1,unitSnapshot:'بسته',mergedFromId:'ING-9',unitFactor:1}],
 purchaseInvoices:[{id:'I1',lines:[{ingredientId:'ING-1',purchaseQuantity:2,quantity:2,purchaseUnit:'بسته',recipeUnit:'بسته',packageQuantity:1,unitPrice:50000}]}],
 beverageDailyControls:[{id:'B1',lines:[{ingredientId:'ING-1',unitSnapshot:'بسته',morningUpper:1,nightUpper:0.5,sales:0.5}]}],trackedIngredients:[{ingredientId:'ING-1',reorderPoint:1}]};
const cost0=MW.unitCost(pr.ingredients[0],pr).v;
// targets and plan
const tg=MW.baseChangeTargets(pr.ingredients[0]);ok(tg.some(t=>t.name==='عدد'&&near(t.k,100)),'«عدد» is a target with k = 100');ok(!tg.some(t=>t.name==='بسته'),'the base itself is not a target');
ok(!MW.changeBaseUnitPlan(pr,inv,'ING-1','کیلوگرم').ok,'a unit the item cannot convert to is refused');
const pl=MW.changeBaseUnitPlan(pr,inv,'ING-1','عدد');ok(pl.ok&&pl.k===100&&pl.counts.recipes===1&&pl.counts.counts===2&&pl.counts.receipts===2&&pl.counts.waste===1,'plan: k and counts of the records that change');
throws(()=>MW.changeBaseUnit(JSON.parse(JSON.stringify(pr)),ctx(),{id:'ING-1',to:'عدد'}),/دلیل/,'a reason is required');
// inventory first, then the catalog
const inv1=JSON.parse(JSON.stringify(inv)),pr1=JSON.parse(JSON.stringify(pr));
const o1=W.changeBaseUnitStock(inv1,ctx(),{id:'ING-1',from:pl.from,to:pl.to,k:pl.k,oldLabels:pl.oldLabels,changeId:'BUC-1'});
const L=inv1.stocktakes[0].lines;ok(near(L[0].actual,300)&&near(L[0].expected,350)&&near(L[0].variance,-50)&&near(L[0].unitCost,500)&&L[0].varianceValueToman===-25000&&L[0].unitSnapshot==='عدد','count line: quantities ×100, cost ÷100, value the same');
ok(L[0].entryUnit==='بسته'&&near(L[0].entryQuantity,3),'a count line written in the base keeps «۳ بسته» as how it was entered');
ok(near(L[1].actual,150)&&near(L[1].countParts[0].base,100)&&near(L[1].countParts[0].factor,100)&&near(L[1].countParts[1].factor,1)&&near(L[1].countParts[1].base,50),'count parts: factor and base converted');
const R1=inv1.stockReceipts[0],R2=inv1.stockReceipts[1];ok(near(R1.quantity,200)&&near(R1.unitCostToman,500)&&R1.totalPriceToman===100000&&R1.entryUnit==='بسته'&&near(R1.entryQuantity,2)&&near(R1.entryUnitFactor,100),'receipt: 200 عدد, written as 2 بسته');
ok(near(R2.quantity,50)&&R2.entryUnit==='عدد'&&near(R2.entryUnitFactor,1),'receipt entered in عدد: factor 1 now');
ok(near(inv1.wasteRecords[0].quantity,5)&&inv1.wasteRecords[1].quantity===1,'ingredient waste converted, menu waste untouched');
ok(near(inv1.inventoryMovements[0].quantity,100)&&near(inv1.inventoryMovements[0].unitFactor,100),'merge movement in: quantity and unit factor');
ok(near(inv1.purchaseInvoices[0].lines[0].packageQuantity,100)&&inv1.purchaseInvoices[0].lines[0].quantity===2&&inv1.purchaseInvoices[0].lines[0].recipeUnit==='عدد','invoice line: pack 100 عدد, purchase quantity the same');
ok(near(inv1.beverageDailyControls[0].lines[0].morningUpper,100)&&near(inv1.beverageDailyControls[0].lines[0].sales,50),'beverage control lines converted');
ok(near(inv1.trackedIngredients[0].reorderPoint,100),'tracked reorder point converted');
ok(W.changeBaseUnitStock(inv1,ctx(),{id:'ING-1',from:'بسته',to:'عدد',k:100,changeId:'BUC-1'}).skipped&&near(inv1.stocktakes[0].lines[0].actual,300),'the same change id never converts twice');
const o2=MW.changeBaseUnit(pr1,ctx(),{id:'ING-1',to:'عدد',reason:'نی را عددی می‌شماریم',changeId:'BUC-1'});const i1=pr1.ingredients[0];
ok(i1.recipeUnit==='عدد'&&near(i1.packageQuantity,100)&&i1.purchaseUnit==='بسته','catalog: base عدد, «هر بسته = ۱۰۰ عدد»');
ok(!i1.countingUnits.some(u=>u.name==='عدد'),'the new base leaves the other units');ok(near(i1.reorderPoint,200),'reorder point ×100');
ok(near(MW.unitCost(i1,pr1).v*100,cost0),'cost per base: ÷100 (one بسته costs the same)');
ok(near(pr1.recipes[0].quantity,1)&&pr1.recipes[1].quantity===0.2,'recipe line 0.01 بسته → 1 عدد; other items untouched');
ok(near(pr1.recipeVersions[0].lines[0].quantity,2)&&pr1.recipeVersions[0].lines[0].recipeUnit==='عدد','recipe version converted');
ok(near(pr1.preparedItems[0].components[0].quantity,50)&&pr1.preparedItems[0].components[0].unit==='عدد'&&pr1.preparedItems[0].components[1].quantity===3,'formula: base-unit line converted, عدد line kept');
ok(near(pr1.ingredientPriceHistory[0].packageQuantity,100)&&near(pr1.ingredientPriceHistory[0].unitCostToman,500)&&pr1.ingredientPriceHistory[0].priceToman===50000,'price history: pack 100, price per بسته the same');
ok(i1.baseUnitChanges.length===1&&i1.baseUnitChanges[0].k===100&&o2.counts.recipes===1,'the change is recorded on the item');
ok(near(E.unitFactor(i1,'بسته'),100),'«بسته» still converts (the purchase unit)');
// the old base that is not the purchase unit stays as an other unit
{const p=JSON.parse(JSON.stringify(pr));const it=p.ingredients[0];it.purchaseUnit='کارتن';it.packageQuantity=10;MW.changeBaseUnit(p,ctx(),{id:'ING-1',to:'عدد',reason:'x',changeId:'B2'});
 ok(near(it.packageQuantity,1000)&&it.countingUnits.some(u=>u.name==='بسته'&&near(u.factor,100)&&u.def.a==='بسته'&&u.def.q===100),'old base «بسته» joins the other units: ۱ بسته = ۱۰۰ عدد')}
// and back: the numbers return
{const p2=JSON.parse(JSON.stringify(pr1)),i2=JSON.parse(JSON.stringify(inv1));const b=MW.changeBaseUnitPlan(p2,i2,'ING-1','بسته');ok(b.ok&&near(b.k,0.01),'change back is offered (k = 0.01)');
 W.changeBaseUnitStock(i2,ctx(),{id:'ING-1',from:b.from,to:b.to,k:b.k,oldLabels:b.oldLabels,changeId:'BUC-2'});MW.changeBaseUnit(p2,ctx(),{id:'ING-1',to:'بسته',reason:'برگشت',changeId:'BUC-2'});
 ok(near(i2.stocktakes[0].lines[0].actual,3)&&near(i2.stocktakes[0].lines[0].unitCost,50000)&&near(i2.stockReceipts[0].quantity,2)&&near(p2.recipes[0].quantity,0.01)&&near(p2.ingredients[0].packageQuantity,1),'change back restores the numbers');
 ok(p2.ingredients[0].recipeUnit==='بسته'&&p2.ingredients[0].countingUnits.some(u=>u.name==='عدد'&&near(u.factor,0.01)),'and «عدد» is an other unit again (۰٫۰۱ بسته)')}
// kg → g (standard unit)
{const p=JSON.parse(JSON.stringify(pr));const t=MW.baseChangeTargets(p.ingredients[1]);ok(t.some(x=>x.name==='گرم'&&near(x.k,1000))&&t.some(x=>x.name==='کیسه'&&near(x.k,1/25)),'kg item: گرم (k 1000) and کیسه (k 1/25) are targets')}
console.log(`qa_template_base_unit_change: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
