// Downloads a READ-ONLY copy of every RayoData module into .local-data/ for the dev server and browser tests.
// Only GET Load requests; nothing is written to the server. .local-data/ is git-ignored: it holds live data
// (staff details, passwords, bank data) and must never be committed or shared.
//   node tools/fetch-live-data.cjs            (API root from RAYO_API or the app default)
const fs=require('fs'),path=require('path');
const API=(process.env.RAYO_API||'https://chat.yekzan.com').replace(/\/+$/,'')+'/api/v1.0/RayoData/';
const MODULES=['inventory','pricing','cashreport','personnel','suppliers','assets','finance','attendance','survey','errorlog','sepidsaudit'];
const dir=path.resolve(__dirname,'..','.local-data');fs.mkdirSync(dir,{recursive:true});
const unwrap=o=>o&&typeof o==='object'&&!Array.isArray(o)&&o.data&&typeof o.data==='object'&&!o.meta?o.data:o;
(async()=>{for(const m of MODULES){try{const r=await fetch(API+'Load?module='+m+'&_='+Date.now(),{headers:{Accept:'application/json'}});if(!r.ok)throw Error('HTTP '+r.status);const d=unwrap(await r.json());fs.writeFileSync(path.join(dir,m+'.json'),JSON.stringify(d));console.log('ok  ',m,Math.round(JSON.stringify(d).length/1024)+' KB')}catch(e){console.log('skip',m,e.message)}}
 fs.writeFileSync(path.join(dir,'FETCHED_AT.txt'),new Date().toISOString()+'\n');console.log('\nsaved in',dir)})();
