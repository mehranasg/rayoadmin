// QA: BL-011 setup tools — start inventory from a date (inventory + pricing, rollback) and reset counts (with rollback);
// same records as js/32. Synthetic data only. Run: node qa_template_setup_tools.js
'use strict';
const fs=require('fs'),path=require('path');
global.window={};for(const f of ['inventory-engine.js','inventory-write.js'])eval(fs.readFileSync(path.join(__dirname,'../app/core/js',f),'utf8'));
const E=window.InvEngine,W=window.InvWrite;let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const throws=(f,re,m)=>{try{f();ok(false,m+' (no error)')}catch(e){ok(re.test(e.message),m+' → '+e.message)}};
const T=E.CAL.today,day=k=>E.CAL.k(E.CAL.i(T)-k),CUT=day(10);
const ctx=(pr)=>({actor:'owner',at:new Date().toISOString(),reqId:'R'+Math.random().toString(36).slice(2,7),pricing:pr});
const pricing=()=>({ingredients:[{id:'A',name:'آرد',lastPurchasePriceToman:100,lastPurchaseDate:day(20),lastPurchaseSource:'manual'},{id:'B',name:'شکر',lastPurchasePriceToman:200,lastPurchaseDate:day(5),lastPurchaseSource:'supplierInvoice',lastPurchaseInvoiceId:'PINV-1'}],
 ingredientPriceHistory:[{id:'H1',ingredientId:'A',date:day(20),priceToman:100},{id:'H2',ingredientId:'B',date:day(5),priceToman:200},{id:'H3',ingredientId:'A',date:day(30),priceToman:90,isVoided:true}],changeLog:[]});
const inv=()=>({stocktakes:[{id:'S1',date:day(20),status:'approved',lines:[]},{id:'S2',date:day(5),status:'approved',lines:[]},{id:'S0',date:day(40),status:'void'}],openingBalances:[{id:'O1',date:day(30),status:'approved'}],
 stockReceipts:[{id:'R1',date:day(15),status:'posted'},{id:'R2',date:CUT,status:'posted'},{id:'R3',date:'bad'}],inventoryMovements:[],wasteRecords:[{id:'W1',date:day(11)}],consumptionRecords:[],
 salesPeriods:[{id:'SP1',from:day(20),to:day(12),status:'posted'},{id:'SP2',from:day(12),to:day(8),status:'posted'}],beverageDailyControls:[],periodClosures:[],changeLog:[]});

// plan
const pr=pricing(),d=inv(),pl=W.startFreshPlan(d,pr,CUT),g=c=>pl.inventory.find(x=>x.collection===c).rows.length;
ok(pl.total===5&&g('stocktakes')===1&&g('openingBalances')===1&&g('stockReceipts')===1&&g('wasteRecords')===1&&g('salesPeriods')===1,'plan: records strictly before the cutoff (the void one and the one on the cutoff stay)');
ok(pl.straddle.length===1&&pl.undated===1,'a sale across the cutoff and an undated receipt are reported, not touched');
ok(pl.ingredients.length===1&&pl.ingredients[0].id==='A'&&pl.keptPrices===1&&pl.history.length===1,'prices before the cutoff are cleared, later ones kept; void history skipped');
throws(()=>W.startFreshPlan(d,pr,E.CAL.k(E.CAL.i(T)+1)),/بعد از امروز/,'future cutoff refused');
throws(()=>W.startFresh(inv(),ctx(pr),{cutoff:CUT,reason:'',operationId:'OP1'}),/علت/,'reason required');

// apply (inventory then pricing, one operation id)
const c1=ctx(pr);W.startFresh(d,c1,{cutoff:CUT,reason:'شروع تازه',operationId:'FRESH-1'});d.changeLog.push({id:'ICT-1',action:'INVENTORY_START_FROM_DATE',...c1.auditExtra});
ok(d.stocktakes.find(x=>x.id==='S1').status==='void'&&d.stocktakes.find(x=>x.id==='S1').voidedByOperation==='FRESH-1'&&d.stocktakes.find(x=>x.id==='S2').status==='approved','S1 voided by the operation, S2 kept');
ok(c1.auditExtra.changes.length===5&&c1.auditExtra.cutoff===CUT,'audit lists the changes per collection (js/32 format)');
const c2=ctx();W.startFreshPrices(pr,c2,{cutoff:CUT,reason:'شروع تازه',operationId:'FRESH-1'});pr.changeLog.push({id:'PLOG-1',action:'PRICES_RESET_FOR_INVENTORY_START',...c2.auditExtra});
ok(pr.ingredients[0].lastPurchasePriceToman===0&&pr.ingredients[0].lastPurchaseDate===''&&pr.ingredients[1].lastPurchasePriceToman===200,'A cleared, B kept');
ok(pr.ingredientPriceHistory[0].isVoided===true&&pr.ingredientPriceHistory[0].voidedByOperation==='FRESH-1'&&!pr.ingredientPriceHistory[1].isVoided,'history before the cutoff voided');

// rollback (a record changed since stays as it is)
d.wasteRecords[0].voidedByOperation='OTHER';// changed by someone else since
const rp=W.startFreshRollbackPlan(d,pr);ok(rp&&rp.records===4&&rp.prices===1,'rollback preview: 4 records still voided by the operation, 1 price');
const c3=ctx();const rb=W.rollbackStartFresh(d,c3);ok(rb.restored===4&&rb.skipped===1&&d.stocktakes.find(x=>x.id==='S1').status==='approved'&&!('voidedByOperation' in d.stocktakes.find(x=>x.id==='S1')),'inventory restored, changed one skipped');
ok(d.changeLog[0].revertedAt===c3.at&&W.startFreshRollbackPlan(d,pr)===null,'the operation is marked reverted');
pr.ingredients.push({id:'Z',lastPurchasePriceToman:0});const rp2=W.rollbackStartFreshPrices(pr,ctx(),{operationId:'FRESH-1'});ok(rp2.restored===1&&pr.ingredients[0].lastPurchasePriceToman===100&&pr.ingredients[0].lastPurchaseDate===day(20)&&!pr.ingredientPriceHistory[0].isVoided,'prices and history restored');
// a price entered after the operation is not overwritten
{const p2=pricing(),c=ctx();W.startFreshPrices(p2,c,{cutoff:CUT,reason:'x',operationId:'F2'});p2.changeLog.push({id:'P2',action:'PRICES_RESET_FOR_INVENTORY_START',...c.auditExtra});p2.ingredients[0].lastPurchasePriceToman=150;p2.ingredients[0].lastPurchaseDate=T;
 const r=W.rollbackStartFreshPrices(p2,ctx(),{operationId:'F2'});ok(r.restored===0&&r.skipped===1&&p2.ingredients[0].lastPurchasePriceToman===150,'a newer price is kept on rollback')}

// reset counts and its rollback
{const x=inv(),c=ctx();ok(W.resetCountsPlan(x).stocktakes===2&&W.resetCountsPlan(x).openings===1,'reset preview');const r=W.resetCounts(x,c,{reason:'شمارش اشتباه',operationId:'RST-1'});x.changeLog.push({id:'ICT-9',action:'INVENTORY_COUNTS_RESET',...c.auditExtra});
 ok(r.count===3&&x.stocktakes.every(s=>s.status==='void')&&x.openingBalances[0].voidedByOperation==='RST-1','all active counts and openings voided');
 const b=W.rollbackResetCounts(x,ctx());ok(b.restored===3&&x.stocktakes.find(s=>s.id==='S1').status==='approved'&&x.stocktakes.find(s=>s.id==='S0').status==='void','rollback restores them (the earlier void one stays void)');
 throws(()=>W.rollbackResetCounts(x,ctx()),/قابل بازگردانی نیست/,'nothing left to roll back');
 throws(()=>W.resetCounts({stocktakes:[],openingBalances:[]},ctx(),{reason:'x',operationId:'R'}),/فعالی/,'nothing to reset')}
console.log(`qa_template_setup_tools: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
