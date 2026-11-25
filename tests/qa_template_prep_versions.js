// QA: BL-015 prepared-item formula versions — MenuWrite.savePreparedItem / recordPrepVersion, InvEngine.prepAt and the
// engine's recipe expansion by date (sales and menu-item waste use the formula of their own date). Synthetic data only.
// Run: node qa_template_prep_versions.js
'use strict';
const fs=require('fs'),path=require('path');
global.window={};
for(const f of ['inventory-engine.js','inventory-write.js','menu-write.js'])eval(fs.readFileSync(path.join(__dirname,'../app/core/js',f),'utf8'));
const E=window.InvEngine,MW=window.MenuWrite;
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const throws=(f,re,m)=>{try{f();ok(false,m+' (no error)')}catch(e){ok(re.test(e.message),m+' → '+e.message)}};
const near=(a,b)=>Math.abs(a-b)<1e-9;
const T=E.CAL.today,day=k=>E.CAL.k(E.CAL.i(T)-k);
const ctx=()=>({actor:'qa',at:new Date().toISOString(),reqId:'R'+Math.random().toString(36).slice(2,7)});
const ING=(id,name,unit,extra={})=>({id,code:id,name,recipeUnit:unit,purchaseUnit:unit,packageQuantity:1,lastPurchasePriceToman:100000,wastePercent:0,status:'فعال',itemType:'MENU_INGREDIENT',...extra});
const pricing=()=>({settings:{},lists:{},ingredients:[ING('MAYO','سس مایونز','کیلوگرم'),ING('PARM','پارمسان','کیلوگرم'),ING('GAR','سیر','کیلوگرم')],
 menuItems:[{id:'M1',name:'سالاد سزار',status:'فعال'}],recipes:[{id:'R1',menuItemId:'M1',preparedItemId:'',ingredientId:'',quantity:0}],recipeVersions:[],ingredientPriceHistory:[],preparedItems:[]});
const comps=(m,p)=>[{ingredientId:'MAYO',quantity:m,unit:'گرم',basis:'gross'},{ingredientId:'PARM',quantity:p,unit:'گرم',basis:'gross'}];
const ded=(pr,date)=>{const M=E.build({inventory:{stocktakes:[],stockReceipts:[],wasteRecords:[],consumptionRecords:[],salesPeriods:[],inventoryMovements:[]},pricing:pr,cashreport:{}}),o={};for(const r of M.recipeAt('M1',date))o[r.ingredientId]=(o[r.ingredientId]||0)+r.quantity;return o};

// a sauce: 1000 g output from 800 g mayo + 200 g parmesan; the Caesar uses 100 g of it
const pr=pricing(),c=ctx();const it=MW.savePreparedItem(pr,c,{name:'سس سزار',countUnit:'گرم',baseOutputQuantity:1000,components:comps(800,200)});
pr.recipes=[{id:'R1',menuItemId:'M1',preparedItemId:it.id,quantity:100}];
ok(!A0(pr.preparedItemVersions).length,'a new item has no version yet (its formula is every date’s formula)');function A0(x){return Array.isArray(x)?x:[]}
ok(near(ded(pr,day(30)).MAYO,0.08)&&near(ded(pr,T).MAYO,0.08),'before any change: same formula on every date');

// change from 10 days ago: 600 g mayo + 400 g parmesan
MW.savePreparedItem(pr,ctx(),{id:it.id,name:'سس سزار',countUnit:'گرم',baseOutputQuantity:1000,components:comps(600,400),effectiveFrom:day(10),versionNote:'پنیر بیشتر'});
let vs=MW.prepVersions(pr,it.id);ok(vs.length===2&&vs[1].source==='baseline'&&vs[1].effectiveFrom==='0000/00/00'&&vs[1].components[0].quantity===800&&vs[1].version===1,'first change stores the old formula as the baseline from the beginning');
ok(vs[0].effectiveFrom===day(10)&&vs[0].version===2&&vs[0].note==='پنیر بیشتر'&&vs[0].source==='form','new version with its date and note');
ok(near(ded(pr,day(30)).MAYO,0.08)&&near(ded(pr,day(30)).PARM,0.02),'a sale 30 days ago: old formula (80 g mayo, 20 g parmesan)');
ok(near(ded(pr,day(10)).MAYO,0.06)&&near(ded(pr,day(5)).PARM,0.04),'on and after the date: new formula');
ok(E.prepAt(pr,it.id,day(11)).version===1&&E.prepAt(pr,it.id,T).version===2,'prepAt by date');

// same date again: the earlier version of that date is superseded (kept), the new one is used
MW.savePreparedItem(pr,ctx(),{id:it.id,name:'سس سزار',countUnit:'گرم',baseOutputQuantity:1000,components:comps(700,300),effectiveFrom:day(10)});
vs=MW.prepVersions(pr,it.id);ok(vs.filter(v=>v.status==='superseded').length===1&&vs.length===3,'same-date change supersedes, nothing deleted');ok(near(ded(pr,day(5)).MAYO,0.07),'the newer same-date formula is used');

// a backdated change between two versions: history fixed, today's formula stays
MW.savePreparedItem(pr,ctx(),{id:it.id,name:'سس سزار',countUnit:'گرم',baseOutputQuantity:1000,components:comps(500,500),effectiveFrom:day(3)});
MW.savePreparedItem(pr,ctx(),{id:it.id,name:'سس سزار',countUnit:'گرم',baseOutputQuantity:1000,components:comps(900,100),effectiveFrom:day(20)});
ok(near(ded(pr,day(25)).MAYO,0.08)&&near(ded(pr,day(15)).MAYO,0.09)&&near(ded(pr,day(5)).MAYO,0.07)&&near(ded(pr,T).MAYO,0.05),'four periods, each with its formula');
const cur=pr.preparedItems[0];ok(cur.components.find(x=>x.ingredientId==='MAYO').quantity===500,'the item keeps the formula in effect today after a backdated version');
throws(()=>MW.savePreparedItem(pr,ctx(),{id:it.id,name:'سس سزار',countUnit:'گرم',baseOutputQuantity:1000,components:comps(1,1),effectiveFrom:E.CAL.k(E.CAL.i(T)+2)}),/بعد از امروز/,'future date refused');
// only the name changes: no new version
const n0=pr.preparedItemVersions.length;MW.savePreparedItem(pr,ctx(),{id:it.id,name:'سس سزار رایو',countUnit:'گرم',baseOutputQuantity:1000,components:comps(500,500)});ok(pr.preparedItemVersions.length===n0,'name only: no version');

// history keeps converting when an ingredient is deactivated later
pr.ingredients.find(i=>i.id==='PARM').status='غیرفعال';ok(near(ded(pr,day(25)).PARM,0.02),'old sales still deduct a since-deactivated ingredient');
pr.ingredients.find(i=>i.id==='PARM').status='فعال';

// merge: a prepared component moved to the kept item is a version dated today; past dates keep the old id
{const p2=pricing();const s=MW.savePreparedItem(p2,ctx(),{name:'سس سیر',countUnit:'گرم',baseOutputQuantity:100,components:[{ingredientId:'GAR',quantity:10,unit:'گرم',basis:'gross'},{ingredientId:'MAYO',quantity:90,unit:'گرم',basis:'gross'}]});
 p2.ingredients.push(ING('GAR2','سیر برند دیگر','کیلوگرم'));p2.preparedItems[0].components[0].ingredientId='GAR2';// formula uses GAR2 (to be merged into GAR)
 MW.mergeIngredients(p2,ctx(),{toId:'GAR',fromIds:['GAR2']});const v2=MW.prepVersions(p2,s.id);
 ok(v2.length===2&&v2[0].source==='merge'&&v2[0].effectiveFrom===T&&v2[0].components[0].ingredientId==='GAR'&&v2[1].components[0].ingredientId==='GAR2','merge records a version today; the baseline keeps the merged id');}

// counts and prepared waste of a date use that date's formula
{const W=window.InvWrite,inv={meta:{initialized:true},settings:{mainLocationId:'L1'},locations:[{id:'L1',name:'انبار'}],stocktakes:[],inventoryMovements:[],stockReceipts:[],wasteRecords:[],consumptionRecords:[],salesPeriods:[],periodClosures:[],changeLog:[]};
 W.addCount(inv,{...ctx(),pricing:pr},{date:day(25),prepared:[{preparedItemId:it.id,quantity:1000}]});const st=inv.stocktakes.find(s=>s.date===day(25));
 ok(near(st.lines.find(l=>l.ingredientId==='MAYO').actual,0.8)&&st.preparedLines[0].preparedItemVersion===1,'a count 25 days ago converts with version 1 (800 g mayo)');}

console.log(`qa_template_prep_versions: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
