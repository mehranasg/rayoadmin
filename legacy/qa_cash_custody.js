'use strict';
// Synthetic records only. Runs the owning modules, without a browser or live API.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const read=p=>fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n'),clone=x=>JSON.parse(JSON.stringify(x));
const config=read('js/config.js'),cashCode=read('js/11-rayo-cash-report-module.js');
const elements=new Map(),calls=[],toasts=[];let renders=0,sequence=0,version=7,mutationFailure=null,form;
const refs={transferAccounts:[{id:'A1',name:'کارت جدید',ownerRecipientId:'P1',status:'فعال'}],cashRecipients:[{id:'P1',name:'نام جدید',status:'فعال'},{id:'P2',name:'نام جدید',status:'فعال'}]};
let db={cashreport:{...clone(refs),reports:[]},finance:{entries:[]}};
const element=id=>{if(!elements.has(id))elements.set(id,{value:'',innerHTML:'',textContent:'',disabled:false,dataset:{},appendChild(){},remove(){},classList:{add(){},toggle(){},remove(){}}});return elements.get(id)};
const gateway={createRequestId:()=>`QA-${++sequence}`,async loadModule(module){calls.push({load:module});return clone(db[module])},async loadOrBootstrap(module){return this.loadModule(module)},async queryCollection(o){calls.push({query:clone(o)});const rows=db[o.module][o.collection]||[];return{items:clone(rows.slice((o.page-1)*o.pageSize,o.page*o.pageSize)),totalPages:Math.ceil(rows.length/o.pageSize),version}},async mutateRecord(o){calls.push({mutation:clone(o)});if(mutationFailure)throw mutationFailure;assert.equal(o.expectedVersion,version);const rows=db[o.module][o.collection]||(db[o.module][o.collection]=[]),index=rows.findIndex(x=>x.id===o.recordId);if(o.operation==='insert'){assert.equal(index,-1);rows.push(clone(o.data))}else{assert(index>=0);rows[index]=clone(o.data)}version++;return{version}},saveModule(){throw Error('Unexpected whole-module Save')}};
const ctx={console,URL,URLSearchParams,Map,Set,AbortController,Intl,Date,Blob,document:{getElementById:element,querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){}},location:{pathname:'/test.html',search:'',href:'http://test.local/test.html'},sessionStorage:{getItem:()=> 'qa'},history:{replaceState(){}},RAYO_API_GATEWAY:gateway,setTimeout:()=>0,clearTimeout(){},renderView(){renders++},toast(message){toasts.push(message)},closeModal(){},prompt:()=> 'دلیل آزمایشی',openForm(title,fields,row,save){form={title,fields,row,save}},RayoJalali:{today:()=> '1405/06/01'},pageHead:()=>''};ctx.window=ctx;
ctx.document.createElement=()=>element('created-'+(++sequence));vm.createContext(ctx);
vm.runInContext(config.slice(config.indexOf('function cashAmount('),config.indexOf('\n\nwindow.RAYO_API_GATEWAY')),ctx);
const expose=`window.testCash={crQueryAll,crLoadCustody,crHoldings,crDestinations,crSelectTab,crCustody,crReadAdminForm,crCustodyOptions,setState:s=>{cashState=crNormalize(s);cashLoaded=true},ui:cashUI};`;
vm.runInContext(cashCode.replace(/\}\)\(\);\s*$/,expose+'})();'),ctx);
const cash=ctx.testCash,ledger=ctx.RayoCashCustody.ledger;
function report(id,date,person='P1',cash=10000,extra={}){return{id,date,cash,cashRecipientId:person,cashRecipientNameSnapshot:'نام تاریخی',...extra}}
function entry(id,type,amountToman,extra={}){return{id,date:'1405/06/01',type,amountToman,cashRecipientId:'P1',custodyKind:type,status:'active',...extra}}
function fill(values){for(const [id,value] of Object.entries(values))element(id).value=value}
async function check(name,run){await run();console.log('PASS '+name)}
(async()=>{
await check('stable IDs, snapshots, rial/toman, opening balance and inclusive date range',()=>{
 const data={...refs,reports:[report('R0','1405/05/31','P1',10000),report('R1','۱۴۰۵/۶/۱','P1',5000),report('R2','1405/06/02','P2',2000),report('R3','1405/06/03','P1',9000),report('R4','1405/06/02','P1',0,{cardToCard:30000,cardToCardAccountId:'A1',cardToCardAccountNameSnapshot:'کارت قدیمی',cardToCardOwnerIdSnapshot:'P1'})],entries:[entry('E1','expense',100),entry('E2','personalWithdrawal',50),entry('E3','custodyReturn',25),entry('E4','expense',999,{status:'void'}),entry('E5','expense',999,{isArchived:true})]};
 const before=JSON.stringify(data),result=ledger(data,{from:'1405/06/01',to:'1405/06/02',personId:'P1'}),g=result.groups.find(x=>x.type==='cash');
 assert.equal(g.opening,1000);assert.equal(g.received,500);assert.equal(g.paid,175);assert.equal(g.closing,1325);assert.equal(result.groups.length,2);assert.equal(result.groups.find(x=>x.type==='account').received,3000);assert(result.details.some(x=>x.name==='کارت قدیمی'));assert.equal(JSON.stringify(data),before);
 const all=ledger(data);assert.equal(all.groups.filter(x=>x.type==='cash').length,2,'homonyms remain separate');assert(all.details.every(x=>!['E4','E5'].includes(x.recordId)));
});
await check('legacy unknowns, inactive historical sources, invalid values and Persian dates',()=>{
 const result=ledger({...refs,reports:[report('bad','1405/12/30'),report('bad2','1405/06/01','P1','bad'),report('old','1405/06/01','',100),report('archived','1405/06/01','P1',999,{isArchived:true}),report('emptyOwner','1405/06/01','P1',0,{cardToCard:100,cardToCardAccountId:'A1',cardToCardOwnerIdSnapshot:''})]});
 assert.equal(result.invalid,2);assert(result.groups.some(x=>x.sourceId===''&&x.received===10));assert.equal(result.groups.find(x=>x.sourceId==='A1').personId,'');
 assert.equal(ctx.RayoCashCustody.normalizeDate('۱۴۰۵-۶-۱'),'1405/06/01');assert.equal(ctx.RayoCashCustody.normalizeDate('1405/07/31'),'');assert.equal(ctx.RayoCashCustody.normalizeDate('1403/12/30'),'1403/12/30');
});
await check('snapshot preservation for edits and new destination selection',()=>{
 const previous={cardToCardAccountId:'A1',cashRecipientId:'P1',cardToCardAccountNameSnapshot:'قدیم',cashRecipientNameSnapshot:'قدیم نقد',cardToCardOwnerIdSnapshot:'P1',cardToCardOwnerNameSnapshot:'مالک قدیم'};
 const same=ctx.RayoCashDestinations.snapshots(previous,previous,refs);assert.equal(same.cardToCardAccountNameSnapshot,'قدیم');assert.equal(same.cashRecipientNameSnapshot,'قدیم نقد');assert.equal(same.cardToCardOwnerNameSnapshot,'مالک قدیم');
 const fresh=ctx.RayoCashDestinations.snapshots({cardToCardAccountId:'A1',cashRecipientId:'P2'},null,refs);assert.equal(fresh.cardToCardOwnerIdSnapshot,'P1');assert.equal(fresh.cashRecipientNameSnapshot,'نام جدید');
});
await check('all pages independent of daily-report filters, load is read-only',async()=>{
 db.cashreport.reports=Array.from({length:501},(_,i)=>report('R'+i,'1405/05/01'));
 cash.ui.reportMonth='1405/06';const start=calls.length;await cash.crLoadCustody(true);
 assert.equal(cash.crCustody.reports.length,501);const reads=calls.slice(start);assert(!reads.some(x=>x.mutation));const query=reads.filter(x=>x.query?.collection==='reports');assert.equal(query.length,2);assert(query.every(x=>!x.query.from&&!x.query.to&&Object.keys(x.query.filters).length===0));
 const original=gateway.queryCollection;gateway.queryCollection=async o=>{const r=await original(o);if(o.page===2)r.version++;return r};await assert.rejects(cash.crQueryAll('cashreport','reports'));gateway.queryCollection=original;
});
await check('load failure blocks ledger and never initializes or saves defaults',async()=>{
 const original=gateway.loadModule,start=calls.length;gateway.loadModule=async()=>{throw Error('offline')};await assert.rejects(cash.crLoadCustody(true));assert.equal(cash.crCustody.loaded,false);assert(cash.crHoldings().includes('offline'));assert(!calls.slice(start).some(x=>x.mutation));gateway.loadModule=original;await cash.crLoadCustody(true);
});
await check('cash tabs, report rendering, XSS escaping and destination form availability',()=>{
 cash.setState(clone(db.cashreport));assert(ctx.crTabs().includes("crSelectTab('destinations')"));assert(ctx.crTabs().includes("crSelectTab('holdings')"));
 cash.crCustody.entries=[entry('HTML','expense',1,{notes:'<script>alert(1)</script>'})];assert(cash.crHoldings().includes('&lt;script&gt;'));assert(cash.crDestinations().includes('مالک'));assert(read('js/40-rayo-v10-9-comprehensive.js').includes("function cashTabs(){return window.crTabs?.()||''}"));
});
await check('new personal withdrawal saves once to finance only, persistent retries, version conflicts',async()=>{
 db.cashreport.reports=[report('R0','1405/06/01')];db.finance.entries=[];await ctx.crOpenCustodyEntry('cash:P1');
 fill({crSpendSource:'cash:P1',crSpendKind:'personalWithdrawal',crSpendDate:'۱۴۰۵/۶/۱',crSpendAmount:'۵۰',crSpendTitle:'مصرف شخصی',crSpendNotes:'رسید آزمایشی'});
 const before=JSON.stringify(db.cashreport);mutationFailure=Object.assign(Error('offline'),{code:'network_error'});await ctx.crSaveCustodyEntry();const first=calls.at(-1).mutation;assert(first);assert.equal(db.finance.entries.length,0);assert(cash.crCustody.editor.pending.uncertain);
 fill({crSpendAmount:'۶۰'});const count=calls.length;await ctx.crSaveCustodyEntry();assert.equal(calls.length,count,'uncertain request cannot change its payload');fill({crSpendAmount:'۵۰'});mutationFailure=null;await ctx.crSaveCustodyEntry();
 const saved=calls.filter(x=>x.mutation).at(-1).mutation;assert.equal(saved.requestId,first.requestId);assert.deepEqual(saved.data,first.data);assert.equal(saved.module,'finance');assert.equal(saved.operation,'insert');assert.equal(saved.data.amountToman,50);assert.equal(db.finance.entries.length,1);assert.equal(JSON.stringify(db.cashreport),before);
 await ctx.crOpenCustodyEntry('',saved.recordId);fill({crSpendSource:'cash:P1',crSpendKind:'expense',crSpendDate:'1405/06/01',crSpendAmount:'20',crSpendTitle:'اصلاح'});mutationFailure=Object.assign(Error('conflict'),{code:'version_conflict'});const start=calls.length;await ctx.crSaveCustodyEntry();assert.equal(calls.length,start+1);assert.equal(db.finance.entries[0].type,'personalWithdrawal');assert(element('crSpendError').textContent.includes('هم‌زمان'));mutationFailure=null;
});
await check('editing preserves historical names, revisions and ID; void retains record',async()=>{
 const row=db.finance.entries[0];row.cashRecipientNameSnapshot='نام زمان ثبت';row.custodyOwnerNameSnapshot='مالک زمان ثبت';await ctx.crOpenCustodyEntry('',row.id);
 fill({crSpendSource:'cash:P1',crSpendKind:'expense',crSpendDate:'1405/06/01',crSpendAmount:'20',crSpendTitle:'هزینه آزمایشی'});await ctx.crSaveCustodyEntry();
 const edited=db.finance.entries[0];assert.equal(edited.id,row.id);assert.equal(edited.cashRecipientNameSnapshot,'نام زمان ثبت');assert.equal(edited.custodyOwnerNameSnapshot,'مالک زمان ثبت');assert.equal(edited.revisions.length,1);assert.equal(edited.revisions[0].before.type,'personalWithdrawal');
 await ctx.crVoidCustodyEntry(edited.id);assert.equal(db.finance.entries.length,1);assert.equal(db.finance.entries[0].status,'void');assert.equal(db.finance.entries[0].voidReason,'دلیل آزمایشی');assert.equal(ledger({...db.cashreport,entries:db.finance.entries}).details.some(x=>x.recordId===edited.id),false);
});
await check('destination saves mutate only reference collection and preserve open entry form',async()=>{
 cash.ui.tab='entry';element('cr_cardToCardAccount').value='A1';element('cr_cashRecipient').value='P1';const before=JSON.stringify(db.cashreport.reports),renderCount=renders;
 await ctx.crEditDestination('recipient');await form.save({name:'شخص سوم',status:'فعال',notes:'QA'});
 assert.equal(JSON.stringify(db.cashreport.reports),before);assert.equal(db.cashreport.cashRecipients.length,3);assert.equal(calls.filter(x=>x.mutation).at(-1).mutation.collection,'cashRecipients');assert.equal(renders,renderCount);assert.equal(element('cr_cardToCardAccount').value,'A1');
 await ctx.crEditDestination('account','A1');const start=calls.length;await form.save({name:'کارت جدید',status:'فعال',ownerRecipientId:'P2',cardNumber:'',bankName:'',notes:''});assert.equal(calls.length,start,'cannot reassign historical account owner');
 await form.save({name:'کارت غیرفعال',status:'غیرفعال',ownerRecipientId:'P1',cardNumber:'',bankName:'',notes:''});assert.equal(db.cashreport.transferAccounts[0].status,'غیرفعال');assert.equal(db.cashreport.transferAccounts[0].id,'A1');
});
await check('finance P&L counts restaurant expense once, excludes withdrawals, returns and voids',()=>{
 ctx.views={};ctx.titles={};let code=read('js/20-finance-module.js');code=code.replace(/\}\)\(\);\s*$/,`window.testFinance={set:f=>{fin=f;ensure()},monthCalc};})();`);vm.runInContext(code,ctx);
 ctx.testFinance.set({entries:[entry('cost','expense',100),entry('personal','personalWithdrawal',900),entry('return','custodyReturn',900),entry('void','expense',900,{status:'void'})],settings:{vatPercent:10,performanceTaxPercent:5}});const result=ctx.testFinance.monthCalc(1405,6);assert.equal(result.otherExpense,100);assert.equal(result.totalExpense,100);
});
await check('staff cash form loads references without writes and validates every card/cash line destination',async()=>{
 let code=read('js/22-staff-panel.js');code=code.replace(/\}\)\(\);\s*$/,`window.testStaff={cashView,set:()=>{me={id:'QA',name:'صندوقدار'};view='cash';go=()=>{}},setView:v=>{view=v},reset:()=>{staffCashSource=null;staffCashEditingId='';staffCashDate=''}};})();`);vm.runInContext(code,ctx);ctx.testStaff.set();ctx.testStaff.setView('other');await ctx.staffLoadCashDestinations();ctx.testStaff.setView('cash');const html=ctx.testStaff.cashView();assert(html.includes('class="rci" data-kind="card"'));assert(html.includes('class="rci" data-kind="cash"'));
 // Line editors are DOM based; fake the two boxes (amount, destination) per line.
 const boxes={},box=(kind,rows)=>boxes[kind]={dataset:{kind},querySelectorAll:q=>q==='.rci-row'?rows.map(([amount,dest],i)=>({dataset:{id:`${kind}-${i}`},querySelector:sel=>sel==='.rci-amount'?{value:amount,classList:{toggle(){}}}:{value:dest,classList:{toggle(){}}}})):[]},originalQuery=ctx.document.querySelector;ctx.document.querySelector=sel=>{const m=String(sel).match(/data-kind="(\w+)"/);return m?boxes[m[1]]||null:null};
 // The staff form inserts one report record (like the admin/cashier forms) and never rewrites the module.
 db.cashreport.transferAccounts[0].status='فعال';db.cashreport.reports=[];const originalSave=gateway.saveModule,originalMutate=gateway.mutateRecord;let saves=0;const inserts=[];gateway.saveModule=async()=>{saves++};gateway.mutateRecord=async o=>{inserts.push(clone(o));db.cashreport.reports.push(clone(o.data));return{version}};
 fill({stCashDate:'1405/06/01',stCash_net:'١٠٠',stCash_deliveryFee:'0'});box('card',[['0','']]);box('cash',[['١٠٠','']]);await ctx.staffSaveCash();assert.equal(inserts.length,0,'cash line requires recipient');
 box('cash',[['١٠٠','P1']]);ctx.staffGo=()=>{};await ctx.staffSaveCash();assert.equal(saves,0,'staff cash never saves the whole module');assert.equal(inserts.length,1);assert.equal(inserts[0].operation,'insert');assert.equal(inserts[0].collection,'reports');assert.equal(inserts[0].data.id,inserts[0].recordId);let saved=db.cashreport.reports[0];assert.equal(saved.cash,100);assert.equal(saved.cashItems.length,1);assert.equal(saved.cashItems[0].recipientNameSnapshot,'نام جدید');assert.equal(saved.cashRecipientId,'P1','single destination also fills legacy field');assert.equal(saved.deliveryFeeAmount,0);assert.equal(saved.finalVariance,0);assert.equal(saved.registeredByType,'staff');assert.deepEqual(saved.otherTransactions,[]);assert.equal(db.cashreport.transferAccounts.length,1);
 await ctx.staffLoadCashDestinations();ctx.testStaff.reset();ctx.testStaff.cashView();await ctx.staffSaveCash();assert.equal(inserts.length,1,'a second report for the same date is blocked');
 // Several transfers on one day, each to its own destination.
 fill({stCashDate:'1405/05/31',stCash_net:'600',stCash_pos1:'0'});box('card',[['200','A1'],['100','A1']]);box('cash',[['200','P1'],['100','P2']]);await ctx.staffSaveCash();assert.equal(inserts.length,2);saved=db.cashreport.reports[1];assert.equal(saved.cardToCard,300);assert.equal(saved.cash,300);assert.equal(saved.cardToCardItems.length,2);assert.equal(saved.cardToCardAccountId,'A1');assert.equal(saved.cardToCardItems[0].ownerNameSnapshot,'نام جدید');assert.deepEqual(saved.cashItems.map(x=>x.recipientId),['P1','P2']);assert.equal(saved.cashRecipientId,'','mixed recipients leave the legacy field empty');assert.equal(saved.finalVariance,0);
 const res=ledger({...refs,reports:[saved]});assert.equal(res.groups.find(x=>x.sourceId==='A1').received,30);assert.equal(res.groups.find(x=>x.sourceId==='P2'&&x.type==='cash').received,10);
 ctx.document.querySelector=originalQuery;gateway.saveModule=originalSave;gateway.mutateRecord=originalMutate;
});
await check('multi-destination card and cash items feed the ledger per destination',()=>{
 const r=report('M1','1405/06/05','',0,{cardToCardItems:[{id:'i1',amount:20000,accountId:'A1',accountNameSnapshot:'کارت',ownerIdSnapshot:'P1'},{id:'i2',amount:10000,accountId:'',accountNameSnapshot:''}],cashItems:[{id:'i3',amount:30000,recipientId:'P1',recipientNameSnapshot:'الف'},{id:'i4',amount:50000,recipientId:'P2',recipientNameSnapshot:'ب'}]});
 const res=ledger({...refs,reports:[r]}),by=id=>res.groups.find(x=>x.sourceId===id);
 assert.equal(res.groups.length,4);assert.equal(by('A1').received,2000);assert.equal(by('P1').received,3000);assert.equal(by('P2').received,5000);assert.equal(res.groups.find(x=>x.type==='account'&&x.sourceId==='').received,1000);
 // Legacy single-destination reports are read as one line; editing keeps an unchanged destination's snapshot.
 const legacy={cardToCard:5000,cardToCardAccountId:'A1',cardToCardAccountNameSnapshot:'نام قدیم',cardToCardOwnerIdSnapshot:'P1',cardToCardOwnerNameSnapshot:'مالک قدیم'},items=ctx.RayoCashDestinations.itemsOf(legacy,'card');assert.equal(items.length,1);assert.equal(items[0].id,'legacy');
 const applied=ctx.RayoCashDestinations.applyItems(legacy,refs,{card:[{id:'legacy',amount:7000,destId:'A1'}],cash:[]});assert.equal(applied.cardToCardAccountNameSnapshot,'نام قدیم');assert.equal(applied.cardToCardOwnerNameSnapshot,'مالک قدیم');assert.equal(applied.cardToCard,7000);assert.deepEqual(applied.cashItems,[]);assert.equal(ctx.RayoCashDestinations.itemsOf({cash:0},'cash').length,0);
});
console.log('cash custody QA: all passed');
})().catch(e=>{console.error(e);process.exitCode=1});
