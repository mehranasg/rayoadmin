const assert=require('assert');
(async()=>{
  const target=(await fetch('http://127.0.0.1:9225/json').then(r=>r.json())).find(x=>x.type==='page'&&x.url.includes('8767'));assert(target);
  const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((ok,no)=>{ws.onopen=ok;ws.onerror=no});let id=0;const jobs=new Map;
  ws.onmessage=e=>{const m=JSON.parse(e.data),j=jobs.get(m.id);if(j){jobs.delete(m.id);m.error?j.no(Error(m.error.message)):j.ok(m.result)}};
  const call=(method,params={})=>new Promise((ok,no)=>{const n=++id;jobs.set(n,{ok,no});ws.send(JSON.stringify({id:n,method,params}))});
  const ev=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value};
  await ev(`sessionStorage.setItem('rayo_admin_user','qa-admin')`);await call('Page.navigate',{url:'http://127.0.0.1:8767/base-data.html'});await new Promise(r=>setTimeout(r,2200));
  const selector='input[data-live-filter="ingredientSearch"]';assert.strictEqual(await ev(`!!document.querySelector('${selector}')`),true);
  await ev(`document.querySelector('${selector}').focus()`);await call('Input.insertText',{text:'پنیر تست کامل'});await new Promise(r=>setTimeout(r,180));
  assert.strictEqual(await ev(`document.querySelector('${selector}').value`),'پنیر تست کامل');assert.strictEqual(await ev(`document.activeElement===document.querySelector('${selector}')`),true);
  ws.close();console.log('PASS base data search: continuous typing and focus preserved');
})().catch(e=>{console.error(e);process.exitCode=1});
