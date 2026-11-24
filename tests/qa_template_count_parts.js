// QA: BL-078 one item counted in several places and units (InvWrite.addCount entries[].parts, countParts, mergePlaces) and
// the count places list (countPlaces / saveCountPlaces). Synthetic data only. Run: node qa_template_count_parts.js
'use strict';
const fs=require('fs'),path=require('path');
global.window={};
for(const f of ['inventory-engine.js','inventory-write.js','menu-write.js'])eval(fs.readFileSync(path.join(__dirname,'../app/core/js',f),'utf8'));
const E=window.InvEngine,W=window.InvWrite;
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const throws=(f,re,m)=>{try{f();ok(false,m+' (no error)')}catch(e){ok(re.test(e.message),m+' → '+e.message)}};
const near=(a,b)=>Math.abs(a-b)<1e-6;
const pricing={ingredients:[{id:'i1',code:'101',name:'پنیر گودا',status:'فعال',itemType:'MENU_INGREDIENT',recipeUnit:'کیلوگرم',purchaseUnit:'بسته',packageQuantity:2,lastPurchasePriceToman:400000,countingUnits:[{name:'ورق',factor:0.02}]}],menuItems:[],recipes:[],recipeVersions:[],ingredientPriceHistory:[],preparedItems:[]};
const T=E.CAL.today,day=k=>E.CAL.k(E.CAL.i(T)-k),D0=day(10),D5=day(5);
const doc=()=>({meta:{initialized:true},settings:{mainLocationId:'L1'},locations:[{id:'L1',name:'انبار اصلی'}],stocktakes:[{id:'ST-A',date:D0,inventoryScope:'RAYO',baselineBoundary:'END',status:'approved',lines:[{ingredientId:'i1',actual:10}]}],inventoryMovements:[],stockReceipts:[],wasteRecords:[],consumptionRecords:[],salesPeriods:[],periodClosures:[],changeLog:[]});
const ctx=()=>({actor:'qa',at:new Date().toISOString(),reqId:'R'+Math.random().toString(36).slice(2,7).toUpperCase(),pricing});
const lineOf=(d,date)=>d.stocktakes.find(s=>s.date===date&&s.status==='approved'&&s.id!=='ST-A').lines.find(l=>l.ingredientId==='i1');

// three places, three units: 3 بسته (6 kg) + 25 ورق (0.5 kg) + 1.2 کیلوگرم = 7.7 kg
let d=doc();W.addCount(d,ctx(),{date:D5,entries:[{itemId:'i1',parts:[{place:'انبار اصلی',quantity:'3',unit:'بسته'},{place:'یخچال بار',quantity:'25',unit:'ورق'},{place:'یخچال آشپزخانه',quantity:'1.2',unit:'کیلوگرم'}]}]});
let l=lineOf(d,D5);ok(near(l.actual,7.7),'parts added up in the base unit: 7.7 kg');
ok(l.countParts.length===3&&l.countParts[0].place==='انبار اصلی'&&l.countParts[0].unit==='بسته'&&near(l.countParts[0].base,6),'each part kept with place, unit and base');
ok(!l.entryUnit,'several parts: no single entry unit');ok(near(l.expected,10)&&near(l.variance,-2.3),'expected and variance as before');

// a later count of one place the same day replaces only that place (mergePlaces)
W.addCount(d,ctx(),{date:D5,entries:[{itemId:'i1',mergePlaces:true,parts:[{place:'یخچال بار',quantity:'50',unit:'ورق'}]}]});
l=lineOf(d,D5);ok(near(l.actual,8.2)&&l.countParts.length===3&&near(l.countParts.find(p=>p.place==='یخچال بار').base,1),'same place replaced (25 → 50 ورق), others kept: 8.2');
W.addCount(d,ctx(),{date:D5,entries:[{itemId:'i1',mergePlaces:true,parts:[{place:'انبار دوم',quantity:'1',unit:'کیلوگرم'}]}]});
ok(near(lineOf(d,D5).actual,9.2)&&lineOf(d,D5).countParts.length===4,'a new place is added: 9.2');
// without mergePlaces the parts replace the whole line (edit of the whole count)
W.addCount(d,ctx(),{date:D5,entries:[{itemId:'i1',parts:[{place:'انبار اصلی',quantity:'2',unit:'بسته'}]}]});
l=lineOf(d,D5);ok(near(l.actual,4)&&l.countParts.length===1&&l.entryUnit==='بسته'&&l.entryQuantity===2,'whole replace; one part in another unit keeps the entry unit');
// a plain entry still works and drops the parts
W.addCount(d,ctx(),{date:D5,entries:[{itemId:'i1',quantity:'5'}]});l=lineOf(d,D5);ok(l.actual===5&&!l.countParts,'plain entry replaces parts');
// errors
throws(()=>W.addCount(doc(),ctx(),{date:D5,entries:[{itemId:'i1',parts:[]}]}),/مقداری وارد نشده/,'empty parts refused');
throws(()=>W.addCount(doc(),ctx(),{date:D5,entries:[{itemId:'i1',parts:[{place:'یخچال بار',quantity:'-1',unit:'ورق'}]}]}),/یخچال بار.*نامنفی|نامنفی/,'negative part refused');
throws(()=>W.addCount(doc(),ctx(),{date:D5,entries:[{itemId:'i1',parts:[{place:'یخچال بار',quantity:'',unit:'ورق'}]}]}),/نامنفی/,'blank part refused');
// zero is a real count
d=doc();W.addCount(d,ctx(),{date:D5,entries:[{itemId:'i1',parts:[{place:'انبار اصلی',quantity:'0',unit:'بسته'}]}]});ok(lineOf(d,D5).actual===0,'zero part = counted and none');

// places list
const s=doc();ok(W.countPlaces(s).join('|')===W.COUNT_PLACES.join('|'),'default places');
W.saveCountPlaces(s,ctx(),{places:['انبار اصلی',' فریزر ','','انبار اصلی']});ok(W.countPlaces(s).join('|')==='انبار اصلی|فریزر','saved, trimmed, unique');
throws(()=>W.saveCountPlaces(s,ctx(),{places:['']}),/دست‌کم/,'empty list refused');

console.log(`qa_template_count_parts: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
