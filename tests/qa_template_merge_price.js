// QA: BL-071 item merge, follow-up — the kept item gets the higher last purchase price (per base unit, through the unit
// factor) and an invoice or order line for a merged item goes to the kept item (PurchaseWrite.mergedTarget / mergedPick /
// buildLines). Synthetic data only. Run: node qa_template_merge_price.js
'use strict';
const fs=require('fs'),path=require('path');
global.window={};
for(const f of ['inventory-engine.js','inventory-write.js','menu-write.js','purchase-write.js'])eval(fs.readFileSync(path.join(__dirname,'../app/core/js',f),'utf8'));
const E=window.InvEngine,MW=window.MenuWrite,PW=window.PurchaseWrite;
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const T=E.CAL.today,day=k=>E.CAL.k(E.CAL.i(T)-k);
const ctx=()=>({actor:'qa',at:'2026-11-24T10:00:00Z',reqId:'R'+Math.random().toString(36).slice(2,7).toUpperCase()});
const ING=(id,code,name,unit,price,extra={})=>({id,code,name,category:'لبنیات',purchaseUnit:unit,recipeUnit:unit,packageQuantity:1,lastPurchasePriceToman:price,lastPurchaseDate:day(10),lastPurchaseSource:'manual',wastePercent:0,status:'فعال',itemType:'MENU_INGREDIENT',...extra});
const pricing=()=>({settings:{},lists:{},ingredients:[ING('A','1015','پنیر گودا کالین','کیلوگرم',2000000),ING('B','1065','پنیر گودا کاله','کیلوگرم',1800000),ING('C','2000','گودا گرمی','گرم',2500),ING('D','2001','گودا بسته','عدد',100000),ING('W','2002','گودا با افت','کیلوگرم',2100000,{wastePercent:50})],
 menuItems:[{id:'M1',code:'101',name:'ساندویچ',status:'فعال'}],recipes:[{id:'R1',menuItemId:'M1',ingredientId:'B',quantity:0.03}],recipeVersions:[],ingredientPriceHistory:[],priceHistory:[],changeLog:[],preparedItems:[]});

// ---- price: higher one wins, per base unit of the kept item
{const d=pricing();const p=MW.mergePlan(d,{toId:'B',fromIds:['A']});ok(p.price.change&&p.price.newPrice===2000000,'keep the cheaper B: plan proposes A’s 2,000,000');
 const o=MW.mergeIngredients(d,ctx(),{toId:'B',fromIds:['A']});const b=d.ingredients.find(i=>i.id==='B');
 ok(b.lastPurchasePriceToman===2000000&&b.lastPurchaseSource==='merge'&&b.lastPurchaseDate===T,'B now 2,000,000 from the merge, dated today');
 ok(o.price&&o.price.from===1800000&&o.price.to===2000000,'result reports the price change');
 const h=d.ingredientPriceHistory.find(x=>x.ingredientId==='B'&&x.source==='merge');ok(h&&h.priceToman===2000000&&h.mergedFromId==='A','price history row with source merge');}
{const d=pricing();const p=MW.mergePlan(d,{toId:'A',fromIds:['B']});ok(!p.price.change,'kept item already dearer: no change');MW.mergeIngredients(d,ctx(),{toId:'A',fromIds:['B']});ok(d.ingredients.find(i=>i.id==='A').lastPurchasePriceToman===2000000,'A keeps 2,000,000');}
{const d=pricing();const p=MW.mergePlan(d,{toId:'A',fromIds:['C']});ok(p.price.change&&p.price.newPrice===2500000,'گرم at 2,500 = 2,500,000 per کیلوگرم wins');}
{const d=pricing();const p=MW.mergePlan(d,{toId:'A',fromIds:['D'],factors:{D:0.04}});ok(p.price.change&&p.price.newPrice===2500000,'عدد 100,000 with 1 عدد = 0.04 kg → 2,500,000 per kg');}
{const d=pricing();const p=MW.mergePlan(d,{toId:'A',fromIds:['W']});ok(p.price.change&&p.price.newPrice===2100000,'prices compared before preparation loss (2,100,000, not 4,200,000 after 50% loss)');}
{const d=pricing();d.ingredients.find(i=>i.id==='A').packageQuantity=5;d.ingredients.find(i=>i.id==='A').purchaseUnit='بسته';d.ingredients.find(i=>i.id==='A').lastPurchasePriceToman=9000000;
 const p=MW.mergePlan(d,{toId:'A',fromIds:['C']});ok(p.price.change&&p.price.newPrice===12500000,'kept pack of 5 kg: 2,500,000 × 5 per بسته');}

// ---- invoices and pickers after the merge
const d=pricing();MW.mergeIngredients(d,ctx(),{toId:'A',fromIds:['B','C','D'],factors:{D:0.04}});
const t=PW.mergedTarget(d,'C');ok(t&&t.item.id==='A'&&Math.abs(t.factor-0.001)<1e-12,'C → A with factor 0.001');
ok(PW.mergedTarget(d,'A')===null,'kept item is no merge target');
const cat=PW.procurementCatalog(d);ok(!cat.some(i=>i.id==='B'),'merged item not in the purchase list');
ok(PW.mergedPick(d,'پنیر گودا کاله',cat)?.id==='A','typed old name → kept item');
ok(PW.mergedPick(d,'1065',cat)?.id==='A'&&PW.mergedPick(d,'۱۰۶۵',cat)?.id==='A','old code (Latin or Persian digits) → kept item');
ok(PW.mergedPick(d,'پنیر گودا کالین',cat)===null,'an active name is not a merge pick');
const sup={suppliers:[{id:'SUP-1',code:'S1',company:'لبنیات',status:'فعال'}],supplierItems:[]};
const inv={settings:{mainLocationId:'L1'},purchaseInvoices:[],supplierPayments:[],stockReceipts:[],inventoryMovements:[]};
const row=PW.addInvoice(inv,ctx(),{supplierId:'SUP-1',number:'7',date:day(1),status:'finalized',lines:[{itemId:'B',quantity:2,packageQuantity:1,unitPrice:2100000},{itemId:'C',quantity:1,packageQuantity:500,unitPrice:1000000}],stockMode:'none'},{pricing:d,suppliers:sup});
const L=row.row?row.row.lines:row.lines;
ok(L[0].ingredientId==='A'&&L[0].mergedFromId==='B'&&L[0].packageQuantity===1,'line for B goes to A (same unit, pack 1)');
ok(L[1].ingredientId==='A'&&L[1].mergedFromId==='C'&&Math.abs(L[1].packageQuantity-0.5)<1e-9,'line for C: 500 گرم → 0.5 کیلوگرم of A');

console.log(`qa_template_merge_price: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
