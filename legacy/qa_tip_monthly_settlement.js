const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('js/34-final-operational-review-v10-1.js','utf8');
const start=source.indexOf('const TIP_ROUNDING_STEP_TOMAN='),end=source.indexOf('function tipSettlementAddon',start);
if(start<0||end<0)throw Error('tip settlement engine not found');
const sandbox={state:{personnel:[],tipGroups:[],payments:[]},console};
vm.runInNewContext(`const A=x=>Array.isArray(x)?x:[],S=x=>String(x??'').trim(),N=x=>{const n=Number(x);return Number.isFinite(n)?n:0},dateCode=x=>Number(String(x).replace(/\\D/g,'')),periodOf=x=>{const m=String(x).match(/(\\d{4})\\/(\\d{1,2})/);return m?{year:+m[1],month:+m[2]}:{}},F=x=>String(x),M=x=>String(x),E=x=>String(x);${source.slice(start,end)};globalThis.api={preview:tipSettlementPreview,balance:tipShareBalance,allocate:allocateTipSettlement,ui:tipSettlementUI,step:TIP_ROUNDING_STEP_TOMAN,valid:validTipPayment}`,sandbox);
const api=sandbox.api,st=sandbox.state;
function group(id,total,date='1405/05/10',participants=[['P1',1]]){return{id,receiveDate:date,totalAmount:total,status:'ثبت‌شده',participants:participants.map(([personnelId,weight])=>({personnelId,weight}))}}
function reset(groups=[],payments=[]){st.tipGroups=groups;st.payments=payments;api.ui.personnelId='P1'}
function check(name,fn){fn();console.log('PASS',name)}
check('752000 rounds to 750000 and adjustment 2000',()=>{reset([group('G1',752000)]);const x=api.preview('P1',1405,5);assert.equal(x.payment,750000);assert.equal(x.adjustment,2000);const a=api.allocate(x);assert.equal(a.reduce((s,r)=>s+r.paidAmount,0),750000);assert.equal(a.reduce((s,r)=>s+r.roundingAdjustment,0),2000);assert.equal(a.reduce((s,r)=>s+r.balanceAfterToman,0),0)});
check('758000 rounds to 755000',()=>{reset([group('G1',758000)]);assert.equal(api.preview('P1',1405,5).payment,755000)});
check('two 378000 shares round only after summing',()=>{reset([group('G1',378000,'1405/05/01'),group('G2',378000,'1405/05/02')]);const x=api.preview('P1',1405,5);assert.equal(x.total,756000);assert.equal(x.payment,755000)});
check('exact multiple has no adjustment',()=>{reset([group('G1',750000)]);const x=api.preview('P1',1405,5);assert.equal(x.payment,750000);assert.equal(x.adjustment,0)});
check('legacy fully settled group excluded',()=>{const g=group('G1',100000);g.status='تسویه‌شده';g.settledAmount=100000;reset([g]);assert.equal(api.preview('P1',1405,5).total,0)});
check('cash receive method alone does not settle',()=>{const g=group('G1',100000);g.receiveMethod='نقدی';reset([g]);assert.equal(api.preview('P1',1405,5).total,100000)});
check('partial linked payment leaves remainder',()=>{reset([group('G1',100000)],[{tipSettlement:true,status:'پرداخت‌شده',tipAllocations:[{tipShareId:'G1:P1',tipGroupId:'G1',paidAmount:30000,roundingAdjustment:0}]}]);assert.equal(api.preview('P1',1405,5).total,70000)});
check('group share uses weight not group total',()=>{reset([group('G1',90000,'1405/05/01',[['P1',1],['P2',2]])]);assert.equal(api.preview('P1',1405,5).total,30000)});
check('settling one person does not alter other entitlement',()=>{reset([group('G1',90000,'1405/05/01',[['P1',1],['P2',2]])]);assert.equal(api.preview('P2',1405,5).total,60000)});
check('paid excludes rounding adjustment',()=>{reset([group('G1',752000)],[{tipSettlement:true,status:'پرداخت‌شده',amount:750000,tipAllocations:[{tipShareId:'G1:P1',tipGroupId:'G1',paidAmount:750000,roundingAdjustment:2000}]}]);const b=api.balance(st.tipGroups[0],'P1');assert.equal(b.paid,750000);assert.equal(b.adjustment,2000);assert.equal(b.balance,0)});
check('entitlement month independent from payment date',()=>{reset([group('G1',50000,'1405/05/20')],[{tipSettlement:true,status:'پرداخت‌شده',date:'1405/06/02',tipEntitlementMonth:5,tipAllocations:[]}]);assert.equal(api.preview('P1',1405,5).total,50000)});
check('duplicate settlement id can be detected',()=>{reset([], [{tipSettlement:true,tipSettlementId:'A1',status:'پرداخت‌شده'}]);assert.ok(st.payments.some(p=>p.tipSettlementId==='A1'))});
check('reload derives balance from stored allocations',()=>{reset([group('G1',10000)],[JSON.parse(JSON.stringify({tipSettlement:true,status:'پرداخت‌شده',tipAllocations:[{tipShareId:'G1:P1',tipGroupId:'G1',paidAmount:10000,roundingAdjustment:0}]}))]);assert.equal(api.balance(st.tipGroups[0],'P1').balance,0)});
check('void restores balance',()=>{const p={tipSettlement:true,status:'پرداخت‌شده',tipAllocations:[{tipShareId:'G1:P1',tipGroupId:'G1',paidAmount:10000,roundingAdjustment:0}]};reset([group('G1',10000)],[p]);p.status='ابطال‌شده';assert.equal(api.balance(st.tipGroups[0],'P1').balance,10000)});
check('new tip in settled month remains unpaid',()=>{reset([group('G1',10000),group('G2',5000,'1405/05/20')],[{tipSettlement:true,status:'پرداخت‌شده',tipAllocations:[{tipShareId:'G1:P1',tipGroupId:'G1',paidAmount:10000,roundingAdjustment:0}]}]);assert.equal(api.preview('P1',1405,5).total,5000)});
check('invalid and cancelled groups excluded',()=>{const a=group('G1',10000),b=group('G2',10000);a.status='ابطال‌شده';b.status='لغوشده';reset([a,b]);assert.equal(api.preview('P1',1405,5).total,0)});
check('unlinked legacy payment is not auto allocated',()=>{reset([group('G1',10000)],[{type:'پرداخت انعام',amount:10000,status:'پرداخت‌شده'}]);assert.equal(api.preview('P1',1405,5).total,10000)});
check('below step produces zero cash and explicit adjustment',()=>{reset([group('G1',4000)]);const x=api.preview('P1',1405,5);assert.equal(x.payment,0);assert.equal(x.adjustment,4000)});
check('currency is toman and step 5000',()=>assert.equal(api.step,5000));
check('ordinary payroll payment is not a tip allocation',()=>{reset([group('G1',10000)],[{type:'تسویه حقوق',amount:10000,status:'پرداخت‌شده'}]);assert.equal(api.preview('P1',1405,5).total,10000)});
console.log('RESULT 20/20 PASS');
