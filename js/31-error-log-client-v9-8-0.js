(function(){
'use strict';
if(window.RayoErrorLog?.__separateModule)return;
let rows=[],loaded=false,loading=null,timer=null,saving=false;
const A=x=>Array.isArray(x)?x:[];
const S=x=>String(x??'').trim();
const now=()=>new Date().toISOString();
async function ensure(){if(loaded)return rows;if(loading)return loading;loading=(async()=>{try{const d=await window.RAYO_API_GATEWAY?.loadOrBootstrap?.('errorlog');rows=A(d?.entries).slice(-1000)}catch(_){rows=[]}loaded=true;loading=null;return rows})();return loading}
async function persist(){if(saving)return;saving=true;try{await ensure();await window.RAYO_API_GATEWAY?.saveModule?.('errorlog',{meta:{schemaVersion:'1.0.0',module:'Rayo Error Log',updatedAt:now()},entries:rows.slice(-1000)},{verify:false})}catch(_){ }finally{saving=false}}
function queue(){clearTimeout(timer);timer=setTimeout(persist,600)}
async function capture(error,context={}){try{await ensure();const e=error instanceof Error?error:new Error(S(error)||'خطای نامشخص');rows.push({id:`ERR-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,at:now(),localTime:new Date().toLocaleString('fa-IR'),message:e.message||S(error),stack:String(e.stack||'').slice(0,6000),url:location.href,user:sessionStorage.getItem('rayo_admin_user')||(()=>{try{return JSON.parse(sessionStorage.getItem('rayo_staff_session')||'{}').name||''}catch(_){return''}})(),context:{...context},severity:context.severity||'error'});if(rows.length>1000)rows=rows.slice(-1000);queue()}catch(_){}}
window.RayoErrorLog={__separateModule:true,capture,list:()=>rows.slice(),refresh:async()=>{loaded=false;await ensure();return rows.slice()}};
window.addEventListener('error',e=>capture(e.error||e.message,{source:'window.error',file:e.filename,line:e.lineno,column:e.colno}));
window.addEventListener('unhandledrejection',e=>capture(e.reason,{source:'unhandledrejection'}));
ensure();
})();
