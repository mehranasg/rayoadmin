const assert=require('assert');

async function run(){
  const targets=await fetch('http://127.0.0.1:9223/json').then(r=>r.json());
  const target=targets.find(x=>x.type==='page'&&x.url.includes('127.0.0.1:8765'));
  assert(target,'صفحه تست مرورگر پیدا نشد');
  const socket=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject});
  let id=0;const pending=new Map();
  socket.onmessage=event=>{const msg=JSON.parse(event.data);if(msg.id&&pending.has(msg.id)){const {resolve,reject}=pending.get(msg.id);pending.delete(msg.id);msg.error?reject(new Error(msg.error.message)):resolve(msg.result)}};
  const call=(method,params={})=>new Promise((resolve,reject)=>{const callId=++id;pending.set(callId,{resolve,reject});socket.send(JSON.stringify({id:callId,method,params}))});
  const evaluate=async expression=>{const result=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw new Error(result.exceptionDetails.text);return result.result.value};
  await evaluate(`sessionStorage.setItem('rayo_admin_user','qa-admin')`);
  await call('Page.navigate',{url:'http://127.0.0.1:8765/suppliers.html'});
  await new Promise(resolve=>setTimeout(resolve,1800));
  await evaluate(`window.supEnsureLoaded=async()=>window.getSupplierState();window.supSaveData=async()=>({ok:true});editSupplierAdmin()`);
  const before=await evaluate(`(()=>{const x=document.getElementById('f_supplierTradeName');return{x:!!x,type:x?.type,readOnly:x?.readOnly,disabled:x?.disabled,value:x?.value,oldField:!!document.getElementById('f_company')}})()`);
  assert.deepStrictEqual(before,{x:true,type:'text',readOnly:false,disabled:false,value:'',oldField:false});
  await evaluate(`document.getElementById('f_supplierTradeName').focus()`);
  await call('Input.insertText',{text:'فروشگاه آزمون رایو'});
  const typed=await evaluate(`document.getElementById('f_supplierTradeName').value`);
  assert.strictEqual(typed,'فروشگاه آزمون رایو');
  await evaluate(`submitModal()`);
  await new Promise(resolve=>setTimeout(resolve,100));
  const saved=await evaluate(`window.getSupplierState().suppliers.at(-1)?.company`);
  assert.strictEqual(saved,'فروشگاه آزمون رایو');
  await evaluate(`(()=>{const row=window.getSupplierState().suppliers.at(-1);editSupplierAdmin(row.id);const x=document.getElementById('f_supplierTradeName');x.focus();x.setSelectionRange(0,x.value.length)})()`);
  await call('Input.insertText',{text:'شرکت ویرایش‌شده رایو'});
  await evaluate(`submitModal()`);
  await new Promise(resolve=>setTimeout(resolve,100));
  const edited=await evaluate(`window.getSupplierState().suppliers.at(-1)?.company`);
  assert.strictEqual(edited,'شرکت ویرایش‌شده رایو');
  socket.close();
  console.log('PASS supplier company input: browser typing, create, edit and save');
}

run().catch(error=>{console.error(error);process.exitCode=1});
