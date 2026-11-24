// QA: BL-074 liquid weights table (MenuWrite.densityList / densityFor / saveDensityList) and BL-076 the payer of each
// account move (FinanceWrite.accountMoves → by). Synthetic data only. Run: node qa_template_units_ux.js
'use strict';
const fs=require('fs'),path=require('path');
global.window={};
for(const f of ['inventory-engine.js','inventory-write.js','menu-write.js','finance-write.js'])eval(fs.readFileSync(path.join(__dirname,'../app/core/js',f),'utf8'));
const MW=window.MenuWrite,FW=window.FinanceWrite,T=window.InvEngine.CAL.today;
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const throws=(f,re,m)=>{try{f();ok(false,m+' (no error)')}catch(e){ok(re.test(e.message),m+' → '+e.message)}};
const ctx=()=>({actor:'qa',at:'2026-11-24T10:00:00Z',reqId:'R1'});

// ---- densities: defaults until the owner saves a table
const doc={lists:{},ingredients:[]};
ok(MW.densityList(doc).length===MW.DENSITY_STD.length&&MW.densityList(doc).every(r=>r.std),'defaults shown while no own table');
ok(MW.densityFor(doc,'شیر پرچرب پگاه').kgPerLiter===1.03,'name match: شیر');
ok(MW.densityFor(doc,'روغن زیتون فرابکر').name==='روغن زیتون','longest match wins (روغن زیتون over روغن)');
ok(MW.densityFor(doc,'نان تست')===null,'no match → null');
throws(()=>MW.saveDensityList(doc,ctx(),{rows:[{name:'شیر',kgPerLiter:'5'}]}),/بین/,'out of range refused');
throws(()=>MW.saveDensityList(doc,ctx(),{rows:[{name:'شیر',kgPerLiter:1},{name:'شير',kgPerLiter:1.1}]}),/دو بار/,'duplicate name (ی/ي) refused');
throws(()=>MW.saveDensityList(doc,ctx(),{rows:[]}),/دست‌کم/,'empty table refused');
const r=MW.saveDensityList(doc,ctx(),{rows:[{name:'شیر',kgPerLiter:'1٫04'},{name:'',kgPerLiter:''},{name:'عسل',kgPerLiter:1.4}]});
ok(r.count===2&&doc.lists.densities.length===2&&doc.lists.densities[0].kgPerLiter===1.04,'saved, blank row skipped, ٫ read as decimal');
ok(MW.densityFor(doc,'شیر کم چرب').kgPerLiter===1.04&&!MW.densityList(doc).some(x=>x.std),'own table replaces defaults');
ok(MW.densityFor(doc,'روغن مایع')===null,'defaults no longer used after save');
throws(()=>MW.saveDensityList(doc,ctx(),{rows:[{name:'شیر',kgPerLiter:1.04},{name:'عسل',kgPerLiter:1.4}]}),/تغییری/,'no change refused');

// ---- «هر واحد خرید = ۱» in bulk (packOne): only items whose purchase unit is the base unit
{const d={lists:{},ingredients:[{id:'I1',name:'ادویه مرغ',recipeUnit:'عدد',purchaseUnit:'عدد',packageQuantity:1000,status:'فعال'},{id:'I2',name:'پنیر',recipeUnit:'گرم',purchaseUnit:'کیلوگرم',packageQuantity:1000,status:'فعال'},{id:'I3',name:'شیر',recipeUnit:'لیتر',purchaseUnit:'لیتر',packageQuantity:1,status:'فعال'}]};
 const o=MW.bulkIngredients(d,ctx(),{ids:['I1','I2','I3'],packOne:true});ok(o.changed===1,'one item changed');ok(d.ingredients[0].packageQuantity===1,'عدد / عدد → 1');ok(d.ingredients[1].packageQuantity===1000,'کیلوگرم / گرم untouched');}

// ---- payer of each move
const fin={settings:{},entries:[{id:'FIN-1',date:T,type:'expense',category:'سایر',amountToman:1000,status:'active',paymentStatus:'paid',accountKey:'payment:L1',createdBy:'ali'},
 {id:'FIN-2',date:T,type:'expense',category:'سایر',amountToman:500,status:'active',paymentStatus:'paid',accountKey:'payment:L1',createdBy:'ali',paidByName:'سارا'}]};
const hr={personnel:[{id:'P1',name:'رضا'}],payments:[{id:'PAY-1',date:T,personnelId:'P1',type:'مساعده',amount:300,accountKey:'payment:L1',status:'active',createdBy:'mina'}]};
const mv=FW.accountMovesRaw?FW.accountMovesRaw({fin,hr}):FW.accountMoves({fin,hr,cash:{},inv:{}});
const by=id=>mv.find(m=>m.ref===id)?.by;
ok(by('FIN-1')==='ali','expense: recorder');
ok(by('FIN-2')==='سارا','expense: named payer before recorder');
ok(by('PAY-1')==='mina','staff payment: recorder');

console.log(`qa_template_units_ux: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
