(function(){
'use strict';
if(window.RayoErrorLog?.__separateModule)return;
let rows=[],pending=[],loaded=false,loading=null,timer=null,saving=false;
const A=x=>Array.isArray(x)?x:[];
const S=x=>String(x??'').trim();
const now=()=>new Date().toISOString();
async function ensure(){if(loaded)return rows;if(loading)return loading;loading=(async()=>{try{const d=await window.RAYO_API_GATEWAY?.loadOrBootstrap?.('errorlog');rows=A(d?.entries).slice(-1000)}catch(_){rows=[]}loaded=true;loading=null;return rows})();return loading}
/* Re-read the server log on every save and append only this page's unsaved entries (pages never overwrite each other). */
const key=x=>S(x?.id)||`${x?.at}|${x?.message}`;
async function persist(){if(saving){queue();return}saving=true;const sending=pending.slice();try{const d=await window.RAYO_API_GATEWAY?.loadModule?.('errorlog'),server=A(d?.entries),seen=new Set(server.map(key)),entries=[...server,...sending.filter(x=>!seen.has(key(x)))].slice(-1000);if(sending.length)await window.RAYO_API_GATEWAY?.saveModule?.('errorlog',{meta:{schemaVersion:'1.0.0',module:'Rayo Error Log',updatedAt:now()},entries},{verify:false});pending=pending.filter(x=>!sending.includes(x));rows=[...entries,...pending];loaded=true}catch(_){ }finally{saving=false}}
function queue(){clearTimeout(timer);timer=setTimeout(persist,600)}
async function capture(error,context={}){try{await ensure();const e=error instanceof Error?error:new Error(S(error)||'خطای نامشخص');rows.push({id:`ERR-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,at:now(),localTime:new Date().toLocaleString('fa-IR'),message:e.message||S(error),stack:String(e.stack||'').slice(0,6000),url:location.href,user:sessionStorage.getItem('rayo_admin_user')||(()=>{try{return JSON.parse(sessionStorage.getItem('rayo_staff_session')||'{}').name||''}catch(_){return''}})(),context:{...context},severity:context.severity||'error'});pending.push(rows[rows.length-1]);if(rows.length>1000)rows=rows.slice(-1000);queue()}catch(_){}}
window.RayoErrorLog={__separateModule:true,capture,list:()=>rows.slice(),refresh:async()=>{loaded=false;await ensure();return rows.slice()}};
window.addEventListener('error',e=>capture(e.error||e.message,{source:'window.error',file:e.filename,line:e.lineno,column:e.colno}));
window.addEventListener('unhandledrejection',e=>capture(e.reason,{source:'unhandledrejection'}));
/* errors queued in memory (17) before this client loaded are persisted too */
const early=A(window.__rayoEarlyErrors).splice(0);if(early.length){rows.push(...early);pending.push(...early);queue()}ensure();
})();
