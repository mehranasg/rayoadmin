const fs=require('fs'),path=require('path'),vm=require('vm'),{webcrypto}=require('crypto');
const source=fs.readFileSync(path.join(__dirname,'js/config.js'),'utf8');
const calls=[];let handlers=[];
function response(status,body){return{ok:status>=200&&status<300,status,async text(){return body===undefined?'':typeof body==='string'?body:JSON.stringify(body)}}}
const sandbox={
  window:{RAYO_ENV:{API_ORIGIN:'https://example.test',API_PREFIX:'/api/v1.0',API_CONTROLLER:'/RayoData',TIMEOUT_MS:200}},
  location:{pathname:'/test.html'},document:{getElementById(){return null}},fetch:async(url,options={})=>{calls.push({url,options});const handler=handlers.shift();if(!handler)throw Error('unexpected fetch');return handler(url,options)},
  AbortController,Uint8Array,crypto:webcrypto,setTimeout,clearTimeout,console,Date,Math,JSON,Object,Array,Map,Set,WeakSet,Error,String,Number,Boolean,Promise,encodeURIComponent
};
sandbox.window.window=sandbox.window;sandbox.globalThis=sandbox;
vm.createContext(sandbox);new vm.Script(source,{filename:'js/config.js'}).runInContext(sandbox);
const gateway=sandbox.window.RAYO_API_GATEWAY,checks=[];
function ok(name,value){if(!value)throw Error('FAIL: '+name);checks.push(name)}
async function rejects(name,fn,test){let error;try{await fn()}catch(e){error=e}ok(name,error&&test(error))}

(async()=>{
  ok('central origin used',gateway.queryUrl==='https://example.test/api/v1.0/RayoData/Query'&&gateway.mutateUrl.endsWith('/RayoData/Mutate'));
  ok('legacy endpoints preserved',gateway.loadUrl.endsWith('/Load')&&gateway.saveUrl.endsWith('/Save'));
  handlers.push(async()=>{await new Promise(r=>setTimeout(r,10));return response(200,{items:[{id:'TIP-1'}],page:1,pageSize:500,total:1,totalPages:1,version:7,updatedAt:'now'})});
  const options={module:'personnel',collection:'tipGroups',filters:{status:'open'},pageSize:900};
  const [q1,q2]=await Promise.all([gateway.queryCollection(options),gateway.queryCollection({...options,filters:{status:'open'}})]);
  ok('identical query deduplicated',calls.filter(x=>x.url.endsWith('/Query')).length===1&&q1.items===q2.items);
  const queryBody=JSON.parse(calls.find(x=>x.url.endsWith('/Query')).options.body);
  ok('query page size capped',queryBody.pageSize===500&&q1.pageSize===500);
  ok('version stored by backend module',gateway.moduleVersions.personnel===7&&gateway.getModuleVersion('hr')===7&&!gateway.moduleVersions.tipGroups);
  handlers.push((url,options)=>response(200,{ok:true,version:8,item:{id:'TIP-1'}}));
  const mutation=await gateway.mutateRecord({module:'hr',collection:'tipGroups',operation:'update',recordId:'TIP-1',idField:'id',data:{amount:10}});
  const mutateBody=JSON.parse(calls.find(x=>x.url.endsWith('/Mutate')).options.body);
  ok('mutation uses cached module version',mutateBody.module==='personnel'&&mutateBody.expectedVersion===7&&gateway.moduleVersions.personnel===8&&mutation.ok===true);
  ok('request id is uuid',/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(mutateBody.requestId));
  const beforeConflict=calls.length;handlers.push(()=>response(409,{code:'version_conflict',message:'stale',version:9}));
  await rejects('version conflict is explicit and not retried',()=>gateway.mutateRecord({module:'personnel',collection:'tipGroups',operation:'update',recordId:'TIP-1',data:{amount:11}}),e=>e.status===409&&e.code==='version_conflict'&&e.name==='RayoVersionConflictError'&&calls.length===beforeConflict+1);
  ok('conflict marks module read only',gateway.getModuleStatus('personnel').readOnly===true);
  handlers.push(()=>response(200,{meta:{initialized:true},ingredients:[],menuItems:[],recipes:[],version:3}));
  await gateway.loadModule('pricing');
  handlers.push(()=>response(200,'saved'));
  const saved=await gateway.saveModule('pricing',{meta:{},ingredients:[],menuItems:[],recipes:[]},{verify:false});
  ok('legacy load save remain operational',saved.ok===true&&calls.some(x=>x.url.includes('/Load?module=pricing'))&&calls.some(x=>x.url.includes('/Save?module=pricing')));
  handlers.push(()=>response(500,{code:'server_error',message:'down'}),()=>response(500,{code:'server_error',message:'down'}));
  await rejects('load failure is standardized',()=>gateway.loadModule('survey'),e=>e.status===500&&e.code==='server_error'&&e.response.code==='server_error');
  const status=gateway.getModuleStatus('survey');ok('failed source is read only',status.state==='error'&&status.sourceValid===false&&status.readOnly===true);
  ok('no operational persistence cache',!source.includes('localStorage.setItem'));
  console.log(`PASS ${checks.length}`);checks.forEach(x=>console.log('  ✓ '+x));
})().catch(error=>{console.error(error);process.exitCode=1});
