'use strict';
// Sales entry is Excel-only for a chosen source and date range (js/14-ops-integration.js). Synthetic data only.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync('js/14-ops-integration.js','utf8'),excel=fs.readFileSync('js/18-excel-tools.js','utf8');
let checks=0;const ok=(label,v)=>{assert.ok(v,label);checks++};
const start=src.indexOf('const SALES_SOURCES='),end=src.indexOf('function salesPreviewHtml(');
ok('sales import block present',start>0&&end>start);
const ctx={ops:{inv:{salesPeriods:[],stocktakes:[]},pricing:{menuItems:[]}},sessionStorage:{getItem:()=>'qa'},window:{}};
vm.createContext(ctx);
vm.runInContext(src.slice(src.indexOf('const A='),src.indexOf('function ensureArrays'))+src.slice(src.indexOf('function menu('),src.indexOf('function recipe('))+src.slice(src.indexOf('function menuSalePrice'),src.indexOf('function opts('))+src.slice(start,end)+';this.api={matchSalesMenu,buildSalesImport,salesConflicts,salesSourceOf,salesDate,onlineMatch,newMenuId,suggestNewItems};',ctx);
const {matchSalesMenu,buildSalesImport,salesConflicts,salesSourceOf,salesDate,onlineMatch,newMenuId,suggestNewItems}=ctx.api;
ctx.ops.pricing.menuItems=[{id:'m1',code:'101',name:'سیب زمینی رایو',currentPriceToman:200000},{id:'m2a',code:'208',name:'سینه مرغ سوخاری اضافه',currentPriceToman:90000},{id:'m2b',code:'208',name:'فیله مرغ سوخاری اضافه',currentPriceToman:95000},{id:'m3',code:'209',name:'سالاد سزار ایرانی (با مرغ گریل)',currentPriceToman:300000},{id:'m4',code:'',name:'دوغ',currentPriceToman:40000}];
ok('unique code matches',matchSalesMenu('101','x').m.id==='m1');
ok('duplicate code resolved by Arabic-letter name',matchSalesMenu('208','فيله مرغ سوخاري اضافه').m.id==='m2b');
ok('duplicate code resolved by truncated name',matchSalesMenu('209','سالاد سزار ايراني (با مرغ گريل').m.id==='m3');
ok('duplicate code with unknown name is not guessed',!matchSalesMenu('208','مرغ').m);
ok('missing code falls back to exact name',matchSalesMenu('4013','دوغ').byName===true);
ok('unknown item is unmatched',!matchSalesMenu('999','ناشناخته').m);
ok('jalali dates normalized',salesDate('۱۴۰۵-۶-۱')==='1405/06/01');
ok('legacy record without source is Sepidz',salesSourceOf({})==='SEPIDZ'&&salesSourceOf({source:'SNAPP'})==='SNAPP');
const table=(rows,map={code:0,name:1,quantity:2,date:-1,amount:-1})=>({map,data:rows,get:(r,k)=>map[k]>=0?r[map[k]]:''});
const form={source:'SEPIDZ',from:'1405/06/01',to:'1405/06/31',reference:''};
let p=buildSalesImport(table([['101','سيب زميني رايو','58'],['101','سيب زميني رايو','2'],['208','سينه مرغ سوخاري اضافه','5'],['208','فيله مرغ سوخاري اضافه','1'],['999','ناشناخته','3'],['102','صفر','0']]),{name:'f.xlsx'},form);
ok('range mode creates one period for the whole range',p.periods.length===1&&p.periods[0].from==='1405/06/01'&&p.periods[0].to==='1405/06/31');
const l1=p.periods[0].lines.find(l=>l.menuItemId==='m1');
ok('same item quantities are summed with price snapshot',l1.quantity===60&&l1.salePriceToman===200000&&l1.saleAmountToman===12000000&&l1.sourceCode==='101');
ok('both items sharing code 208 kept separately',p.periods[0].lines.filter(l=>/^m2/.test(l.menuItemId)).length===2);
ok('item missing from the menu offered as new item, zero rows ignored',p.unmatched.length===0&&p.newItems.length===1&&p.newItems[0].code==='999'&&p.newItems[0].quantity===3&&p.zero===1&&p.rows===6);
ok('multi-day warning shown',p.warnings.some(w=>/تا تاریخ/.test(w)));
p=buildSalesImport(table([['101','a','4','1405/06/02',''],['101','a','6','1405/06/03',''],['101','a','1','1405/07/01','']],{code:0,name:1,quantity:2,date:3,amount:-1}),{name:'d.xlsx'},form);
ok('date column posts day by day and rejects out-of-range rows',p.periods.length===2&&p.periods.every(x=>x.from===x.to)&&p.unmatched.length===1);
ctx.ops.inv.salesPeriods=[{id:'S1',from:'1405/06/10',to:'1405/06/10',lines:[]},{id:'S2',from:'1405/06/01',to:'1405/06/31',salesSource:'SNAPP',lines:[]},{id:'S3',from:'1405/05/01',to:'1405/06/30',status:'void',lines:[]}];
ok('overlap with same source detected',salesConflicts('SEPIDZ','1405/06/01','1405/06/31').map(x=>x.id).join()==='S1');
ok('other source and void records do not block',salesConflicts('SNAPP','1405/07/01','1405/07/05').length===0&&salesConflicts('SEPIDZ','1405/05/01','1405/05/31').length===0);
ok('preview reports conflicts',buildSalesImport(table([['101','a','1']]),{name:'f'},form).periods[0].conflicts.length===1);
// New menu items from the sales file: online-menu suggestion (names differ from Sepidz; IDs are not Sepidz codes) and id convention.
const online=[{title:'دسر کرم بروله',priceToman:465000,category:'دسر',enabled:true},{title:'پیتزا پپرونی',priceToman:1200000,category:'پیتزا',enabled:true},{title:'پیتزا پپرونی جونیور',priceToman:890000,category:'پیتزا',enabled:true},{title:'کیک گردو و هویج و کشمش',priceToman:395000,category:'دسر',enabled:true},{title:'سیب زمینی رایو',priceToman:1,category:'پیش غذا',enabled:true}];
ok('online match ignores extra words',onlineMatch('کرم بروله',online)?.priceToman===465000);
ok('online match prefers exact over junior',onlineMatch('پيتزا پپروني',online)?.priceToman===1200000&&onlineMatch('پيتزا پپروني جونيور',online)?.priceToman===890000);
ok('online match tolerates punctuation and و',onlineMatch('کيک گردو، هويج و کشمش',online)?.priceToman===395000);
ok('no online guess for unrelated name',onlineMatch('چيپس رايو',online)===null);
ctx.ops.pricing.lists={menuCategories:['پیتزا','سایر']};const sp={newItems:[{code:'330',name:'پيتزا پپروني'},{code:'115',name:'چيپس رايو'}]};suggestNewItems(sp,online);
ok('suggested price and existing category',sp.newItems[0].priceToman===1200000&&sp.newItems[0].category==='پیتزا'&&sp.newItems[1].priceToman===0&&sp.newItems[1].category==='سایر');
ctx.ops.pricing.menuItems.push({id:'MENU-330',code:'X'});ok('new id follows MENU-<code> and never collides',newMenuId('115')==='MENU-115'&&newMenuId('330')!=='MENU-330');
const inv32=fs.readFileSync('js/32-inventory-cost-control-v10.js','utf8');ok('first recipe version is effective from the start',inv32.includes("if(!latest&&source!=='manual-snapshot'&&lines.length)effectiveFrom='0000/00/00';"));
ok('new items saved to pricing before the sale, with rollback',src.includes('await window.pcSaveData(false,')&&src.includes('ops.pricing.menuItems=ops.pricing.menuItems.filter(x=>!ids.has(x.id))'));
// UI contract: no manual line entry for Sepidz or Snapp, history voids instead of deleting.
ok('manual Sepidz/Snapp entry removed',!/opSalesLines|opSnappLines|addSnappLineCore|saveSnappSalesCore|addSalesLine/.test(src));
ok('sales tab no longer appends legacy Snapp panes',/if\(tab==='sales'\)return salesPane\(\);/.test(src));
ok('history uses void, not physical delete',/opsDeleteSales:voidSales/.test(src)&&!/salesPeriods=ops\.inv\.salesPeriods\.filter\(x=>x\.id!==sid\)/.test(src));
ok('save rolls back on failure',/catch\(err\)\{const ids=new Set\(added\.map/.test(src));
// Excel header detection: an empty title-row cell must not satisfy every alias.
const fc=new Function(excel.slice(excel.indexOf('const txt='),excel.indexOf('\n',excel.indexOf('const norm=')))+'\n'+excel.slice(excel.indexOf('function findCol'),excel.indexOf('function bestTable'))+';return findCol;');
const findCol=fc();{ok('empty header cell does not match',findCol(['شهریور 1405','',''],['کد کالا','کد'])===-1);ok('real header still matches',findCol(['کد کالا','نام کالا','تعداد'],['تعداد'])===2)}
ok('salesPeriod template defined',/salesPeriod:\['کد کالا','نام کالا','تعداد'\]/.test(fs.readFileSync('js/30-operational-polish-v9-8-0.js','utf8')));
console.log(`PASS ${checks}: sales Excel range import (match, aggregate, day split, overlap, void, header detection)`);
