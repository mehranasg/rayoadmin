// QA: invoices of one item (PurchaseWrite.invoicesWithItem / itemInvoiceCounts / itemFamily) and the unit of a price sheet
// column (MenuWrite.parsePriceSheets: «… (ریال)» is rial). Synthetic data only.
// Run: node qa_template_item_invoices.js
'use strict';
const fs=require('fs'),path=require('path');
global.window={};
for(const f of ['inventory-engine.js','inventory-write.js','menu-write.js','purchase-write.js'])eval(fs.readFileSync(path.join(__dirname,'../app/core/js',f),'utf8'));
const PW=window.PurchaseWrite,MW=window.MenuWrite;
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};

const pricing={ingredients:[
 {id:'OIL',code:'2024',name:'روغن سرخ کردنی',mergedFrom:[{id:'OIL-OLD',name:'روغن لادن'}]},
 {id:'OIL-OLD',code:'2030',name:'روغن لادن',isArchived:true,mergedInto:'OIL',mergedFrom:[{id:'OIL-OLDER',name:'روغن بهار'}]},
 {id:'OIL-OLDER',code:'2031',name:'روغن بهار',isArchived:true,mergedInto:'OIL-OLD'},
 {id:'SALT',code:'3000',name:'نمک'}]};
const L=(ingredientId,q,p)=>({ingredientId,itemName:ingredientId,purchaseQuantity:q,unitPrice:p,lineTotalToman:q*p});
const inv={purchaseInvoices:[
 {id:'I1',date:'1405/08/01',status:'finalized',lines:[L('OIL',2,100),L('SALT',1,5)]},
 {id:'I2',date:'1405/08/05',status:'finalized',lines:[L('OIL-OLD',1,90)]},
 {id:'I3',date:'1405/08/03',status:'void',voidKind:'edit',lines:[L('OIL',9,9)]},
 {id:'I4',date:'1405/08/07',status:'draft',lines:[L('OIL-OLDER',1,80),L('OIL',1,110)]},
 {id:'I5',date:'1405/08/09',status:'finalized',isArchived:true,lines:[L('OIL',1,1)]},
 {id:'I6',date:'1405/08/10',status:'finalized',hasLineDetails:false,lines:[],totalToman:5000}]};

// family: the item and every item merged into it, at any depth
const fam=PW.itemFamily(pricing,'OIL');
ok(fam.has('OIL')&&fam.has('OIL-OLD')&&fam.has('OIL-OLDER')&&fam.size===3,'family = item + merged items (nested)');
ok(PW.itemFamily(pricing,'SALT').size===1,'item without merges = itself');

// invoices with the item: newest first, merged names included, void and archived out, quick invoices never
let r=PW.invoicesWithItem(inv,pricing,'OIL');
ok(r.map(o=>o.invoice.id).join(',')==='I4,I2,I1','not void, not archived, newest first → '+r.map(o=>o.invoice.id).join(','));
ok(r[0].lines.length===2&&r[0].lines.every(l=>['OIL','OIL-OLDER'].includes(l.ingredientId)),'every line of the family in one invoice');
ok(r.find(o=>o.invoice.id==='I1').lines.length===1,'other items of the invoice are not returned');
r=PW.invoicesWithItem(inv,pricing,'OIL',{withVoid:true});
ok(r.some(o=>o.invoice.id==='I3')&&!r.some(o=>o.invoice.id==='I5'),'withVoid adds void (edit) invoices, never archived');
ok(PW.invoicesWithItem(inv,pricing,'OIL-OLD').map(o=>o.invoice.id).join(',')==='I4,I2','an old item finds its own and its merged invoices');
ok(PW.invoicesWithItem(inv,pricing,'SALT').map(o=>o.invoice.id).join(',')==='I1','plain item');
ok(PW.invoicesWithItem(inv,pricing,'NONE').length===0&&PW.invoicesWithItem({},pricing,'OIL').length===0,'unknown item / no invoices → empty');

// counts per item (merged counted with the item they went into, one invoice once)
const c=PW.itemInvoiceCounts(inv,pricing);
ok(c.get('OIL')===3,'OIL counted in 3 invoices (I1, I2 via merge, I4 once) → '+c.get('OIL'));
ok(c.get('SALT')===1&&c.get('OIL-OLD')===2&&c.get('OIL-OLDER')===1,'counts of other items');
ok(!c.has('I6'),'quick invoice has no items');
// an id that is not in the catalog any more still gets its count
const c2=PW.itemInvoiceCounts({purchaseInvoices:[{id:'X',status:'finalized',lines:[L('GONE',1,1)]}]},pricing);
ok(c2.get('GONE')===1,'line of an item missing from the catalog');

// price sheet: a price column headed «… (ریال)» is read as rial, «… (تومان)» or bare as toman
const ings=[{id:'A',code:'1',name:'شکر'}];
let ps=MW.parsePriceSheets([['s',[['کد ماده','نام ماده','آخرین قیمت خرید (ریال)'],['1','شکر','1200000']]]],ings);
ok(ps.rows[0].price===120000,'rial header ÷ 10 → '+ps.rows[0].price);
ps=MW.parsePriceSheets([['s',[['کد ماده','نام ماده','آخرین قیمت خرید (تومان)'],['1','شکر','120000']]]],ings);
ok(ps.rows[0].price===120000,'toman header as is');
ps=MW.parsePriceSheets([['s',[['کد ماده','نام ماده','قیمت'],['1','شکر','120000']]]],ings);
ok(ps.rows[0].price===120000,'bare header = toman (file format unchanged)');

console.log(`qa_template_item_invoices: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
