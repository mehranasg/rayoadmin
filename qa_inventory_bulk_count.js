const assert=require('assert'),fs=require('fs'),vm=require('vm');
const code=fs.readFileSync('js/46-inventory-operations-v10-12.js','utf8');
function setup(){
 const state={settings:{mainLocationId:'main'},stocktakes:[],locations:[{id:'main',name:'انبار'}]},items=[{id:'a',name:'آرد',recipeUnit:'گرم'},{id:'b',name:'شیر'},{id:'c',name:'نمک'}];
 const inputs=items.map(i=>({dataset:{v1012BulkQty:i.id},value:''}));
 const els={v1012BulkDate:{value:'۱۴۰۵/۰۶/۲۴'},v1012BulkLoc:{value:'main'},v1012BulkOpening:{checked:false},v1012BulkFields:{disabled:false},v1012BulkStatus:{textContent:''}};
 let saves=0,failure=null;const errors=[];
 const context={console,URLSearchParams,location:{pathname:'/test.html',search:''},sessionStorage:{getItem:()=> 'admin'},document:{readyState:'loading',querySelector:()=>null,createElement:()=>({}),head:{appendChild(){}},addEventListener(){},getElementById:id=>els[id],querySelectorAll:s=>s==='[data-v1012-bulk-qty]'?inputs:[]},setTimeout(){},getInventoryState:()=>state,getPricingState:()=>({ingredients:items}),RayoJalali:{today:()=> '1405/06/24'},RayoInventoryV10:{isReady:()=>true,positionAtLocation:()=>({quantity:10,unitCost:2,baseDate:'1405/06/01',baseQuantity:10,movementNet:0,salesConsumption:0})},RAYO_API_GATEWAY:{createRequestId:()=>String(saves+1),saveModule:async(module)=>{assert.equal(module,'inventory');saves++;await Promise.resolve();if(failure)throw failure},loadModule:async()=>{throw Error('offline')}},toast:(msg,error)=>{if(error)errors.push(msg)}};
 context.window=context;vm.createContext(context);vm.runInContext(code,context);
 return {state,inputs,els,errors,api:context.RayoInventoryV1012,saves:()=>saves,fail:e=>failure=e};
}
(async()=>{
 let t=setup();assert.equal(t.saves(),0,'loading must not save');
 t.inputs[0].value='۰';t.inputs[1].value='١٢٫٥';
 await Promise.all([t.api.saveBulkCount(),t.api.saveBulkCount()]);
 assert.equal(t.saves(),1);assert.equal(t.state.stocktakes.length,1);assert.equal(t.state.stocktakes[0].lines.length,2);
 assert.equal(t.state.stocktakes[0].lines[0].actual,0);assert.equal(t.state.stocktakes[0].lines[1].actual,12.5);assert.equal(t.state.stocktakes[0].lines[0].variance,-10);assert.equal(t.inputs[0].value,'');
 t.inputs[0].value='3';await t.api.saveBulkCount();assert.equal(t.saves(),1,'same-day overlap blocked');
 t.els.v1012BulkDate.value='1405/06/23';await t.api.saveBulkCount();assert.equal(t.saves(),1,'count before later count blocked');
 t=setup();t.inputs[0].value='bad';await t.api.saveBulkCount();assert.equal(t.saves(),0);t.inputs[0].value='-1';await t.api.saveBulkCount();assert.equal(t.saves(),0);
 t=setup();t.inputs[0].value='4';t.fail(Object.assign(Error('offline'),{code:'network_error'}));await t.api.saveBulkCount();assert.equal(t.state.stocktakes.length,0);assert.equal(t.inputs[0].value,'4');assert.equal(t.els.v1012BulkFields.disabled,false);
 t.inputs[0].value='5';await t.api.saveBulkCount();assert.equal(t.saves(),1);t.inputs[0].value='4';t.fail(null);await t.api.saveBulkCount();assert.equal(t.saves(),2);assert.equal(t.state.stocktakes[0].id,'ST-BULK-1');
 t=setup();t.state.settings.countApprovalRequired=true;t.els.v1012BulkOpening.checked=true;t.inputs[0].value='2';await t.api.saveBulkCount();assert.equal(t.state.stocktakes[0].status,'submitted');assert.equal(t.state.stocktakes[0].lines[0].variance,0);
 t=setup();t.state.periodClosures=[{status:'closed',from:'1405/06/01',to:'1405/06/31'}];t.inputs[0].value='1';await t.api.saveBulkCount();assert.equal(t.saves(),0);
 console.log('PASS bulk count: load, zero, decimals, blanks, double-click, date overlap, invalid quantities, rollback, retry identity, approval policy, opening baseline, closed period');
})().catch(e=>{console.error(e);process.exitCode=1});
