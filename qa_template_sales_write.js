// QA: newpanel/core/js/sales-write.js — sales Excel import rules, new menu items and void (synthetic data only).
// Run: node qa_template_sales_write.js
'use strict';
const fs=require('fs'),path=require('path');
global.window={};
for(const f of ['inventory-engine.js','inventory-write.js','sales-write.js'])eval(fs.readFileSync(path.join(__dirname,'newpanel/core/js',f),'utf8'));
const SW=window.SalesWrite,E=window.InvEngine;
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const throws=(f,re,m)=>{try{f();ok(false,m+' (no error)')}catch(e){ok(re.test(e.message),m+' → '+e.message)}};
const pricing=()=>({lists:{menuCategories:['پیش غذا','سایر']},menuItems:[{id:'MENU-101',code:'101',name:'سیب زمینی رایو',status:'فعال',currentPriceToman:200000},{id:'MENU-208A',code:'208',name:'سینه مرغ سوخاری اضافه',status:'فعال',currentPriceToman:90000},{id:'MENU-208B',code:'208',name:'فیله مرغ سوخاری اضافه',status:'فعال',currentPriceToman:95000},{id:'MENU-300',code:'300',name:'چای',status:'فعال',currentPriceToman:50000}],ingredients:[],recipes:[]});
const inv=()=>({stocktakes:[{id:'ST1',date:'1405/07/15',status:'approved'}],inventoryMovements:[],salesPeriods:[{id:'OLD',from:'1405/06/01',to:'1405/06/31',salesSource:'SEPIDZ',status:'posted',lines:[]}],changeLog:[]});
const ctx=()=>({actor:'qa-admin',at:new Date().toISOString(),reqId:'R'+Math.random().toString(36).slice(2,7).toUpperCase()});
// a sheet with a title row above the header, Persian digits, a duplicated code resolved by name, a new code and a zero row
const sheet=[['گزارش تعداد فروش کالا'],[],['ردیف','کد کالا','نام کالا','تعداد','مبلغ فروش'],['1','101','سيب زميني رايو','۵۸',''],['2','208','فیله مرغ سوخاری اضافه','4',''],['3','208','مرغ','2',''],['4','999','موهیتو','3',''],['5','300','چای','0',''],['6','','',''],['7','101','سيب زميني رايو','2','']];
const t=SW.tableFrom([['Sheet1',sheet]]);
ok(t.headerRow===2&&t.map.code===1&&t.map.quantity===3&&t.data.length===7,'header found below a title row');
throws(()=>SW.tableFrom([['S',[['نام','مقدار']]]]),/کد کالا/,'missing required columns reported by name');
const form={source:'SEPIDZ',from:'1405/07/01',to:'1405/07/30',reference:'مهر'};
let p=SW.build(t,'mehr.xlsx',form,{inventory:inv(),pricing:pricing()});
const lines=p.periods[0].lines,l101=lines.find(l=>l.menuItemId==='MENU-101');
ok(p.periods.length===1&&p.periods[0].from==='1405/07/01'&&p.periods[0].to==='1405/07/30','one period for the whole range without a date column');
ok(l101.quantity===60&&l101.salePriceToman===200000&&l101.saleAmountToman===12000000,'same item summed; price snapshot from the menu');
ok(lines.some(l=>l.menuItemId==='MENU-208B'&&l.quantity===4),'duplicated code resolved by exact name');
ok(p.unmatched.some(u=>u.code==='208'&&/تکرار/.test(u.reason)),'duplicated code with an unmatched name is not guessed');
ok(p.newItems.length===1&&p.newItems[0].code==='999'&&p.newItems[0].quantity===3&&p.zero===1,'unknown code offered as a new item; zero rows skipped');
ok(p.warnings.length===1&&/1405\/07\/15/.test(p.warnings[0]),'warns about a count inside the range');
const pJun=SW.build(t,'x.xlsx',{...form,from:'1405/06/10',to:'1405/06/20'},{inventory:inv(),pricing:pricing()});ok(pJun.periods[0].conflicts.length===1,'overlap with a sales period of the same source detected');
const pSn=SW.build(t,'x.xlsx',{...form,source:'SNAPP',from:'1405/06/10',to:'1405/06/20'},{inventory:inv(),pricing:pricing()});ok(pSn.periods[0].conflicts.length===0,'another source does not conflict');
// date column: one period per day; rows outside the range are rejected
const daily=SW.tableFrom([['S',[['تاریخ','کد کالا','نام کالا','تعداد'],['1405/07/02','101','x','1'],['۱۴۰۵/۰۷/۰۳','101','x','2'],['1405/08/01','101','x','5']]]]);
const pd=SW.build(daily,'d.xlsx',form,{inventory:inv(),pricing:pricing()});ok(pd.periods.length===2&&pd.periods[1].from==='1405/07/03'&&pd.unmatched.some(u=>/خارج از بازه/.test(u.reason)),'date column: a period per day, out-of-range rows refused');
// online menu suggestion (thousand Toman) and the new menu id
SW.suggest(p,[{title:'موهیتو کلاسیک',priceToman:180000,category:'سایر',enabled:true},{title:'چای',priceToman:50000,category:'',enabled:true}],pricing());
ok(p.newItems[0].online?.title==='موهیتو کلاسیک'&&p.newItems[0].priceToman===180000&&p.newItems[0].category==='سایر','online menu suggestion matched by words');
ok(SW.newMenuId(pricing().menuItems,'999')==='MENU-999'&&SW.newMenuId([{id:'MENU-999'},{id:'MENU-0042'}],'999')==='MENU-1000','new id MENU-<code>, otherwise next number');
// records
const pr=pricing(),c1=ctx(),made=SW.addMenuItems(pr,c1,{picks:[{code:'999',name:'موهیتو',category:'سایر',price:'۱۸۰٬۰۰۰'}],fileName:'mehr.xlsx'});
ok(made.length===1&&made[0].id==='MENU-999'&&made[0].currentPriceToman===180000&&made[0].createdFrom==='sales-excel'&&made[0].manualCostEnabled===true,'new menu item like js/14');
throws(()=>SW.addMenuItems(pricing(),ctx(),{picks:[{code:'998',name:'x',price:0}]}),/قیمت/,'new item needs a price');
const I=inv(),c2=ctx();p.createdIds=made.map(x=>x.id);const r=SW.addSales(I,c2,{p,pricing:pr});const sp=I.salesPeriods.at(-1);
ok(r.added.length===1&&sp.id===`SALE-XLS-${c2.reqId}-1`&&sp.salesSource==='SEPIDZ'&&sp.status==='posted'&&sp.reference==='مهر'&&sp.importSummary.createdMenuItems[0]==='MENU-999','sales period record like js/14');
ok(sp.lines.some(l=>l.menuItemId==='MENU-999'&&l.quantity===3&&l.saleAmountToman===540000),'rows of the new item are matched after it is added');
throws(()=>SW.addSales(I,ctx(),{p,pricing:pr}),/ابطال/,'a second import of the same range is refused at save time');
SW.voidSales(I,ctx(),{id:sp.id,reason:'فایل اشتباه'});ok(sp.status==='void'&&sp.voidReason==='فایل اشتباه'&&I.salesPeriods.length===2,'void keeps the record');
ok(SW.addSales(I,ctx(),{p,pricing:pr}).added.length===1,'after void the range can be imported again');
throws(()=>SW.addSales(inv(),ctx(),{p:{...p,to:'1405/07/31'},pricing:pr}),/نامعتبر/,'a date that does not exist (Mehr 31) is refused');
// the engine spreads the new period over the days
const M=E.build({inventory:{...I,stocktakes:[]},pricing:{...pr,recipes:[]}});ok(M.sales.some(s=>s.from==='1405/07/01'&&s.b-s.a===29),'engine sees the period over 30 days');
console.log(`qa_template_sales_write: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
