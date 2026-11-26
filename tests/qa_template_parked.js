// QA: BL-088 items «کنارگذاشته» out of the variance totals — level with the group default (InvEngine.controlLevel,
// parkedIds), engine period totals, count metrics, saving item and group levels. Synthetic data only.
// Run: node qa_template_parked.js
'use strict';
const fs=require('fs'),path=require('path');
global.window={};for(const f of ['inventory-engine.js','inventory-write.js'])eval(fs.readFileSync(path.join(__dirname,'../app/core/js',f),'utf8'));
const E=window.InvEngine,W=window.InvWrite;let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};const near=(a,b)=>Math.abs(a-b)<1e-6;
const throws=(f,re,m)=>{try{f();ok(false,m+' (no error)')}catch(e){ok(re.test(e.message),m+' → '+e.message)}};
const T=E.CAL.today,day=k=>E.CAL.k(E.CAL.i(T)-k);
const pricing={ingredients:[{id:'M',name:'گوشت',category:'گوشت',recipeUnit:'کیلوگرم',status:'فعال',itemType:'MENU_INGREDIENT',lastPurchasePriceToman:1000,packageQuantity:1},{id:'N',name:'دستمال',category:'یکبار مصرف',recipeUnit:'بسته',status:'فعال',itemType:'MENU_INGREDIENT',lastPurchasePriceToman:100,packageQuantity:1},{id:'K',name:'نی',category:'یکبار مصرف',recipeUnit:'بسته',status:'فعال',itemType:'MENU_INGREDIENT',lastPurchasePriceToman:50,packageQuantity:1}],menuItems:[],recipes:[],recipeVersions:[],ingredientPriceHistory:[]};
const inv=()=>({settings:{groupControlLevels:{'یکبار مصرف':'PARKED'},itemControlLevels:{K:'LIGHT'}},stocktakes:[{id:'A',date:day(20),status:'approved',inventoryScope:'RAYO',baselineBoundary:'END',lines:[{ingredientId:'M',actual:10},{ingredientId:'N',actual:10},{ingredientId:'K',actual:10}]},{id:'B',date:day(2),status:'approved',inventoryScope:'RAYO',baselineBoundary:'END',lines:[{ingredientId:'M',actual:8},{ingredientId:'N',actual:4},{ingredientId:'K',actual:9}]}],stockReceipts:[],wasteRecords:[],consumptionRecords:[],salesPeriods:[],inventoryMovements:[],periodClosures:[],changeLog:[]});
// levels
const d=inv();ok(E.controlLevel(d,pricing.ingredients[1])==='PARKED'&&E.controlLevel(d,pricing.ingredients[2])==='LIGHT'&&E.controlLevel(d,pricing.ingredients[0])==='LIGHT','group default, the item\'s own choice wins');
ok([...E.parkedIds(d,pricing)].join()==='N','parked set');ok(W.levelOf(d,'N',pricing)==='PARKED'&&W.ownLevel(d,'N')===''&&W.ownLevel(d,'K')==='LIGHT','levelOf with pricing; own level');
// engine totals: M −2 kg (−2000), K −1 (−50) counted; N −6 (−600) apart
const M=E.build({inventory:d,pricing,cashreport:{}}),P=E.analyze(M,E.CAL.k(E.CAL.i(day(20))+1),day(2));
ok(near(P.tot.variance,-2050)&&near(P.tot.short,-2050),'variance total without the parked item');ok(near(P.tot.parkedVar,-600)&&P.tot.parkedItems===1&&P.items.find(r=>r.id==='N').parked===true,'parked variance apart');
// count metrics
const lines=[{ingredientId:'M',varianceValueToman:-2000,variance:-2,actual:8,unitCost:1000},{ingredientId:'N',varianceValueToman:-600,variance:-6,actual:4,unitCost:100}];
const mt=W.countMetrics(lines,new Set(['N']));ok(mt.varianceValue===-2000&&mt.parkedVariance===-600&&mt.parkedItems===1&&mt.withVariance===1&&mt.countedValue===8400,'count metrics: parked apart, counted value still complete');
ok(W.countMetrics(lines).varianceValue===-2600,'without the set: as before');
// saving
{const x=inv(),c={actor:'o',at:'t'};const r=W.saveControlLevels(x,c,{levels:{K:'',M:'PRECISE'},groups:{'یکبار مصرف':'',گوشت:'PRECISE'}});
 ok(r.changes===2&&r.groups===2&&!('K' in x.settings.itemControlLevels)&&x.settings.itemControlLevels.M==='PRECISE'&&!('یکبار مصرف' in x.settings.groupControlLevels)&&x.settings.groupControlLevels['گوشت']==='PRECISE','item back to the group default, group defaults saved and cleared');
 throws(()=>W.saveControlLevels(x,{actor:'o',at:'t'},{levels:{M:'PRECISE'},groups:{گوشت:'PRECISE'}}),/تغییری/,'no change refused')}
console.log(`qa_template_parked: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
