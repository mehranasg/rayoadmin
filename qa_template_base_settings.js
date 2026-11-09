// QA: base settings moved from the current panel (stage 11): personnel name/lists/leave/staff visibility,
// inventory payment locations and directions, supplier reference lists (synthetic data only).
// Run: node qa_template_base_settings.js
'use strict';
const fs=require('fs'),path=require('path');
global.window={};global.sessionStorage={getItem:()=>null,setItem(){}};
for(const f of ['inventory-engine','inventory-write','people-write','purchase-write'])eval(fs.readFileSync(path.join(__dirname,'newpanel/core/js',f+'.js'),'utf8'));
const W=window.InvWrite,PW=window.PeopleWrite,PU=window.PurchaseWrite;let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const throws=(f,re,m)=>{try{f();ok(false,m+' (no error)')}catch(e){ok(re.test(e.message),m+' → '+e.message)}};
const ctx=()=>({actor:'qa',at:'2026-11-09T10:00:00Z',reqId:'R1'});
// personnel
const hr={settings:{restaurantName:'رایو',other:1},lists:{positions:['گارسون'],sections:['سالن'],violationTypes:['x']},personnel:[{id:'P1',mainPosition:'گارسون'}]};
let c=ctx();PW.saveBaseSettings(hr,c,{restaurantName:' کافه رایو ',lists:{positions:['گارسون','باریستا','گارسون',''],sections:['سالن','آشپزخانه']},leaveStart:'۱۴۰۵/۰۷/۰۱',leaveMonthly:'۲٫۵',showPenalties:true});
ok(hr.settings.restaurantName==='کافه رایو'&&hr.lists.positions.join()==='گارسون,باریستا'&&hr.lists.violationTypes[0]==='x'&&hr.settings.other===1,'name and lists saved, other lists kept');
ok(hr.settings.leaveBalanceStartDate==='1405/07/01'&&hr.settings.monthlyLeaveEntitlementDays===2.5&&hr.settings.showPenaltiesToStaff===true&&c.auditExtra.before.restaurantName==='رایو','leave rule, staff visibility and audit');
throws(()=>PW.saveBaseSettings(hr,ctx(),{lists:{positions:[]}}),/حداقل یک/,'empty list refused');
throws(()=>PW.saveBaseSettings(hr,ctx(),{leaveMonthly:'20'}),/بین/,'leave entitlement range');
throws(()=>PW.saveBaseSettings(hr,ctx(),{restaurantName:' '}),/خالی/,'empty name refused');
// inventory payment options
const inv={settings:{paymentLocations:['بانک ملت',{id:'PAYLOC-002',name:'صندوق',isActive:true}]}};
const po=W.paymentOptions(inv);ok(po.locations[0].id==='PAYLOC-001'&&po.directions.length===2&&!po.top,'normalized like js/19 with default directions');
W.savePaymentOptions(inv,ctx(),{locations:[{id:'PAYLOC-001',name:'بانک ملت',isActive:false},{id:'PAYLOC-002',name:'صندوق',isActive:true},{name:'تنخواه'}],directions:[{value:'PAYDIR-001',label:'پرداخت',effect:'payment'},{label:'برگشت وجه',effect:'receipt'}]});
const L=inv.settings.paymentLocations,D=inv.settings.supplierPaymentDirections;
ok(L.length===3&&L[0].isActive===false&&L[2].id==='PAYLOC-003'&&L[2].name==='تنخواه'&&D.length===3&&D[2].value==='PAYDIR-003'&&D[2].effect==='receipt'&&D[1].label==='دریافت از تأمین‌کننده','rows kept by id, new ids, nothing removed');
throws(()=>W.savePaymentOptions(inv,ctx(),{locations:[{name:'صندوق'}]}),/تکراری/,'duplicate name refused');
throws(()=>W.savePaymentOptions(inv,ctx(),{locations:[{id:'PAYLOC-099',name:'x'}]}),/پیدا نشد/,'unknown id refused');
const top={paymentLocations:[{id:'PAYLOC-001',name:'الف'}],settings:{}};W.savePaymentOptions(top,ctx(),{locations:[{name:'ب'}]});ok(top.paymentLocations.length===2&&!top.settings.paymentLocations,'old top-level list stays where it is');
// supplier lists
const sd={lists:{supplierGroups:['لبنیات'],statuses:['فعال','غیرفعال'],orderMethods:['تلفن']},suppliers:[]};const sc=ctx();
ok(PU.saveSupplierLists(sd,sc,{lists:{supplierGroups:['لبنیات','نان','نان'],statuses:['x']}})===1&&sd.lists.supplierGroups.join()==='لبنیات,نان'&&sd.lists.statuses.length===2&&sd.lists.orderMethods[0]==='تلفن'&&sc.auditExtra.before.supplierGroups.length===1,'editable lists saved; fixed lists untouched');
throws(()=>PU.saveSupplierLists(sd,ctx(),{lists:{orderMethods:[]}}),/حداقل یک/,'empty supplier list refused');
console.log(`qa_template_base_settings: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
