// QA: catalog item merge («ادغام اقلام») — MenuWrite.mergePlan / mergeIngredients (recipes, prepared items, archive) and
// InvWrite.mergeStock (on-hand moves as ITEM_MERGE movements) with the engine's stock and period analysis. Synthetic data only.
// Run: node qa_template_item_merge.js
'use strict';
const fs=require('fs'),path=require('path');
global.window={};
for(const f of ['inventory-engine.js','inventory-write.js','menu-write.js'])eval(fs.readFileSync(path.join(__dirname,'../app/core/js',f),'utf8'));
const E=window.InvEngine,MW=window.MenuWrite,W=window.InvWrite;
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const throws=(f,re,m)=>{try{f();ok(false,m+' (no error)')}catch(e){ok(re.test(e.message),m+' → '+e.message)}};
const near=(a,b)=>Math.abs(a-b)<1e-6;
const T=E.CAL.today,day=k=>E.CAL.k(E.CAL.i(T)-k);
const ctx=()=>({actor:'qa',at:'2026-11-18T10:00:00Z',reqId:'R'+Math.random().toString(36).slice(2,7).toUpperCase()});
const ING=(id,code,name,unit,price,extra={})=>({id,code,name,category:'لبنیات',purchaseUnit:unit,recipeUnit:unit,packageQuantity:1,lastPurchasePriceToman:price,wastePercent:0,status:'فعال',itemType:'MENU_INGREDIENT',...extra});
const pricing=()=>({settings:{},lists:{},
 ingredients:[ING('A','1015','پنیر پارمسان پودری کالین','کیلوگرم',2000000),ING('B','1065','پارمسان کیلویی کاله','کیلوگرم',1800000),ING('C','2000','پارمسان گرمی','گرم',2000),ING('D','2001','تکه پارمسان','عدد',100000),ING('X','3000','نمک','کیلوگرم',50000),ING('S','5000','وایتکس','لیتر',100000,{itemType:'OPERATIONAL_CONSUMABLE'})],
 menuItems:[{id:'M1',code:'101',name:'سالاد سزار',status:'فعال',currentPriceToman:500000},{id:'M2',code:'102',name:'پاستا',status:'فعال',currentPriceToman:600000},{id:'M3',code:'103',name:'پیتزا',status:'غیرفعال',currentPriceToman:700000}],
 recipes:[{id:'REC-1',menuItemId:'M1',ingredientId:'A',quantity:0.02},{id:'REC-2',menuItemId:'M1',ingredientId:'X',quantity:0.001,entryUnit:'گرم',entryQuantity:1},
  {id:'REC-3',menuItemId:'M2',ingredientId:'A',quantity:0.01},{id:'REC-4',menuItemId:'M2',ingredientId:'B',quantity:0.005,notes:'روی پاستا'},{id:'REC-5',menuItemId:'M3',ingredientId:'C',quantity:10},{id:'REC-6',menuItemId:'M3',ingredientId:'D',quantity:1}],
 recipeVersions:[],ingredientPriceHistory:[],priceHistory:[],changeLog:[],
 preparedItems:[{id:'PREP-1',version:2,name:'سس سزار',status:'فعال',countUnit:'گرم',baseOutputQuantity:1000,components:[{id:'PC-1',ingredientId:'B',quantity:50,unit:'گرم',basis:'net'},{id:'PC-2',ingredientId:'D',quantity:2,unit:'عدد',basis:'net'}]}]});

// ---- unit factor
const pr0=pricing(),I=id=>pr0.ingredients.find(i=>i.id===id);
ok(MW.mergeFactor(I('B'),I('A'))===1,'same unit → factor 1');
ok(near(MW.mergeFactor(I('C'),I('A')),0.001),'گرم → کیلوگرم automatic (0.001)');
ok(MW.mergeFactor(I('D'),I('A'))===null,'عدد → کیلوگرم needs the manager');

// ---- plan
let p=MW.mergePlan(pricing(),{toId:'A',fromIds:['A','B','C','D']});
ok(p.rows.length===3&&!p.rows.some(r=>r.id==='A'),'the kept item is not in its own merge list');
ok(p.errors.some(e=>/تکه پارمسان/.test(e)&&/چند کیلوگرم/.test(e)),'missing factor for a different unit is an error → '+p.errors.join(' | '));
p=MW.mergePlan(pricing(),{toId:'A',fromIds:['B','C','D'],factors:{D:'۰٫۰۵'}});
ok(!p.errors.length&&near(p.rows.find(r=>r.id==='D').factor,0.05),'Persian decimal factor accepted');
ok(p.rows.find(r=>r.id==='B').menus.map(m=>m.id).join()==='M2'&&p.rows.find(r=>r.id==='B').prepared.length===1,'plan lists recipes and prepared items of each merged item');
ok(MW.mergePlan(pricing(),{toId:'S',fromIds:['B']}).errors.some(e=>/در رسپی نمی‌آید/.test(e)),'item in recipes cannot merge into a non-recipe type');
{const d=pricing();d.ingredients.find(i=>i.id==='A').status='غیرفعال';ok(MW.mergePlan(d,{toId:'A',fromIds:['B']}).errors.some(e=>/غیرفعال/.test(e)),'inactive kept item refused')}
ok(MW.mergePlan(pricing(),{toId:'A',fromIds:[]}).errors.length>0,'nothing to merge refused');

// ---- merge
let d=pricing();const c=ctx();
throws(()=>MW.mergeIngredients(pricing(),ctx(),{toId:'A',fromIds:['B','C','D']}),/چند کیلوگرم/,'merge refused without the factor');
throws(()=>MW.mergeIngredients(pricing(),ctx(),{toId:'A',fromIds:['B'],newName:'نمک'}),/قلم دیگری/,'new name of another item refused');
const o=MW.mergeIngredients(d,c,{toId:'A',fromIds:['B','C','D'],factors:{D:0.05},newName:'پنیر پارمسان',note:'دو برند'});
const lines=id=>d.recipes.filter(r=>r.menuItemId===id);
ok(o.to==='پنیر پارمسان'&&d.ingredients.find(i=>i.id==='A').name==='پنیر پارمسان'&&o.renamed?.from==='پنیر پارمسان پودری کالین','kept item renamed, code and id unchanged');
ok(lines('M2').length===1&&lines('M2')[0].ingredientId==='A'&&near(lines('M2')[0].quantity,0.015)&&/روی پاستا/.test(lines('M2')[0].notes),'two lines of the same recipe added up (0.01 + 0.005), note kept');
ok(lines('M3').length===1&&near(lines('M3')[0].quantity,0.01+0.05),'گرم line converted (10 g = 0.01 kg) and عدد line × factor, inactive menu item too');
ok(lines('M1').length===2&&lines('M1').find(r=>r.ingredientId==='X').entryUnit==='گرم','untouched line keeps its entry unit');
ok(lines('M1').find(r=>r.ingredientId==='A').id==='REC-1','recipe line of the kept item keeps its id');
const vs=d.recipeVersions.filter(v=>['M2','M3'].includes(v.menuItemId));
ok(vs.length===2&&vs.every(v=>v.effectiveFrom==='0000/00/00'||v.effectiveFrom===T),'one recipe version for each changed menu item');
ok(!d.recipeVersions.some(v=>v.menuItemId==='M1'),'a recipe without merged items gets no version');
const B=d.ingredients.find(i=>i.id==='B');
ok(B.isArchived&&B.status==='غیرفعال'&&B.mergedInto==='A'&&/ادغام در «پنیر پارمسان»/.test(B.archiveReason)&&B.code==='1065','merged item archived with a pointer, code kept');
ok(d.ingredients.length===6,'no item is physically deleted');
const A0=d.ingredients.find(i=>i.id==='A');ok(A0.mergedFrom.length===3&&A0.mergedFrom.find(x=>x.id==='B').name==='پارمسان کیلویی کاله'&&near(A0.mergedFrom.find(x=>x.id==='D').factor,0.05),'kept item lists the merged items with their old names');
const pc=d.preparedItems[0].components;
ok(pc[0].ingredientId==='A'&&pc[0].quantity===50&&pc[0].unit==='گرم','prepared component in a mass unit stays as typed');
ok(pc[1].ingredientId==='A'&&near(pc[1].quantity,0.1)&&pc[1].unit==='کیلوگرم','prepared component in the merged item\'s own unit converted by the factor');
ok(d.preparedItems[0].version===3,'prepared item version bumped');
ok(c.auditExtra.before.from.length===3&&c.auditExtra.entityId==='A','audit keeps the items before the merge');
ok(o.recipes.length===2&&o.prepared.length===1,'result lists changed recipes and prepared items');
throws(()=>MW.mergeIngredients(d,ctx(),{toId:'A',fromIds:['B']}),/آرشیو/,'an archived item cannot be merged again');
{const d2=pricing();const m=MW.mergeIngredients(d2,ctx(),{toId:'A',fromIds:['B']});ok(m.recipes.length===1&&d2.ingredients.find(i=>i.id==='A').name==='پنیر پارمسان پودری کالین'&&!m.renamed,'merge without a new name keeps the name')}

// ---- stock
const inv=()=>({settings:{mainLocationId:'L1',beverageControl:{itemIds:['B','X','A']}},stocktakes:[{id:'ST1',date:day(5),inventoryScope:'RAYO',baselineBoundary:'END',status:'approved',lines:[{ingredientId:'A',actual:2},{ingredientId:'B',actual:8}]}],
 inventoryMovements:[],stockReceipts:[],wasteRecords:[],consumptionRecords:[],salesPeriods:[],periodClosures:[],changeLog:[]});
let iv=inv();const sc=ctx();
const so=W.mergeStock(iv,sc,{toId:'A',toName:'پنیر پارمسان',moves:[{fromId:'B',fromName:'پارمسان کیلویی کاله',qty:8,toQty:8,factor:1}],bevIds:['B']});
ok(so.moved===1&&iv.inventoryMovements.length===2,'two movements: out of the merged item, into the kept one');
const [mo,mi]=iv.inventoryMovements;
ok(mo.movementType==='ITEM_MERGE'&&mo.ingredientId==='B'&&mo.fromLocationId==='L1'&&!mo.toLocationId&&mi.ingredientId==='A'&&mi.toLocationId==='L1'&&mi.quantity===8&&mo.date===T,'movement shape (dated today, main location)');
ok(iv.settings.beverageControl.itemIds.join()==='A,X','beverage list: merged id replaced by the kept one without a duplicate');
const M=E.build({inventory:iv,pricing:d,cashreport:{}}),pos=new Map(E.positions(M,T).map(r=>[r.id,r]));
ok(near(pos.get('A').qty,10)&&near(pos.get('B').qty,0),'on-hand moved: kept 2 + 8 = 10, merged 0');
ok(pos.get('A').receipt===0&&!pos.get('A').lastReceipt,'merge is not a purchase receipt');
const an=E.analyze(M,day(4),T);const ra=an.items.find(x=>x.id==='A');
ok(ra&&near(ra.merge,8)&&near(ra.expected,10),'period analysis: merge in the expected stock');
ok(!an.calReceipts.length,'merge is not in the receipts list');
throws(()=>W.mergeStock(inv(),ctx(),{toId:'A',moves:[],bevIds:[]}),/موجودی‌ای برای انتقال نیست/,'nothing to move refused');
throws(()=>W.mergeStock(inv(),ctx(),{toId:'A',moves:[{fromId:'A',qty:1,toQty:1}]}),/نامعتبر/,'merge into itself refused');
{const v=inv();v.periodClosures=[{id:'PC',from:day(30),to:T,status:'closed'}];throws(()=>W.mergeStock(v,ctx(),{toId:'A',moves:[{fromId:'B',qty:1,toQty:1}]}),/بسته است/,'closed period refused')}
{const v=inv();v.inventoryMovements=[...iv.inventoryMovements.map(m=>({...m,status:'void'}))];const p2=new Map(E.positions(E.build({inventory:v,pricing:d,cashreport:{}}),T).map(r=>[r.id,r]));ok(near(p2.get('B').qty,8),'void merge movements undo the move')}

console.log(`qa_template_item_merge: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
