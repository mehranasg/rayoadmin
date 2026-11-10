// Local test server: serves the repository and an IN-MEMORY copy of the RayoData API.
// It never contacts the real API. Data comes from .local-data/<module>.json (see tools/fetch-live-data.cjs);
// saves change only the memory of this process (restart = fresh copy).
//
//   node tools/dev-server.cjs                      → http://127.0.0.1:8790/app/index.html (signed in as owner)
//   PORT=8791 PROBE=tools/probes/smoke.js node tools/dev-server.cjs   → also injects a probe script into app pages
//   NOSESSION=1 …                                   → no automatic sign-in
const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),dataDir=path.join(root,'.local-data'),PORT=+process.env.PORT||8790;
const MODULES=['inventory','pricing','cashreport','personnel','suppliers','assets','finance','attendance','survey','errorlog','sepidsaudit'];
const WRITABLE=new Set(['inventory','pricing','personnel','suppliers','assets','finance','cashreport','attendance','survey']);
const data={},VER={},REQ=new Set();
const load=m=>{if(!(m in data)){const f=path.join(dataDir,m+'.json');data[m]=fs.existsSync(f)?JSON.parse(fs.readFileSync(f,'utf8')):null}return data[m]};
const SESSION=process.env.NOSESSION?'':'<script>sessionStorage.setItem("rayo_admin_user","qa-admin");sessionStorage.setItem("rayo_admin_role","owner");</script>';
const body=req=>new Promise(ok=>{const parts=[];req.on('data',c=>parts.push(c));req.on('end',()=>ok(Buffer.concat(parts).toString('utf8')))});
const TYPES={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.cjs':'application/javascript; charset=utf-8','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.woff':'font/woff','.woff2':'font/woff2'};
if(!fs.existsSync(dataDir))console.warn('No .local-data/ folder: run `npm run fetch-data` first (pages will show empty data).');
http.createServer(async(req,res)=>{const u=new URL(req.url,'http://x'),p=decodeURIComponent(u.pathname);res.setHeader('Cache-Control','no-store');
 if(p.startsWith('/api/v1.0/RayoData/')){res.setHeader('Content-Type','application/json');const mod=u.searchParams.get('module');
  if(p.endsWith('/Load')){if(!MODULES.includes(mod)){res.statusCode=404;return res.end('{"code":"not_found","message":"module"}')}const d=load(mod);if(d===null){res.statusCode=404;return res.end('{"code":"not_found","message":"no local copy"}')}return res.end(JSON.stringify(d))}
  if(p.endsWith('/Save')&&req.method==='POST'){const b=await body(req);if(!WRITABLE.has(mod)){res.statusCode=400;return res.end('{"error":"unexpected module"}')}data[mod]=JSON.parse(b);VER[mod]=(VER[mod]||1)+1;return res.end('{"ok":true}')}
  if((p.endsWith('/Query')||p.endsWith('/Mutate'))&&req.method==='POST'){const b=JSON.parse(await body(req)),m=b.module,d=load(m)||(data[m]={});VER[m]=VER[m]||1;
   if(p.endsWith('/Query')){const all=(d[b.collection]||[]).filter(x=>b.includeArchived||!x.isArchived),ps=b.pageSize||100;return res.end(JSON.stringify({items:all.slice((b.page-1)*ps,b.page*ps),page:b.page,pageSize:ps,total:all.length,totalPages:Math.ceil(all.length/ps),version:VER[m]}))}
   if(REQ.has(b.requestId))return res.end(JSON.stringify({version:VER[m],duplicate:true}));
   if(b.expectedVersion!==VER[m]){res.statusCode=409;return res.end('{"code":"version_conflict","message":"version conflict"}')}
   const list=d[b.collection]=d[b.collection]||[],i=list.findIndex(x=>x[b.idField||'id']===b.recordId);
   if(b.operation==='insert'){if(i>=0){res.statusCode=400;return res.end('{"message":"exists"}')}list.push(b.data)}else if(b.operation==='update'){if(i<0){res.statusCode=404;return res.end('{"message":"not found"}')}list[i]=b.data}else if(b.operation==='archive'){if(i<0){res.statusCode=404;return res.end('{"message":"not found"}')}list[i]={...list[i],...b.data,isArchived:true}}
   REQ.add(b.requestId);VER[m]++;return res.end(JSON.stringify({version:VER[m]}))}
  res.statusCode=405;return res.end('{}')}
 if(p==='/__probe.js'){res.setHeader('Content-Type','application/javascript; charset=utf-8');return res.end(process.env.PROBE?fs.readFileSync(path.resolve(root,process.env.PROBE)):'')}
 const f=path.resolve(root,'.'+(p.endsWith('/')?p+'index.html':p));if(!f.toLowerCase().startsWith(root.toLowerCase())||f.includes(`${path.sep}.local-data${path.sep}`)){res.statusCode=403;return res.end()}
 fs.readFile(f,(e,b)=>{if(e){res.statusCode=404;return res.end('not found')}
  if(/[\\/]app[\\/][a-z]+\.html$/.test(f))b=Buffer.from(b.toString().replace('<head>','<head><script>window.RAYO_TEMPLATE_API=location.origin;</script>'+SESSION).replace('</body>',process.env.PROBE?'<script src="/__probe.js"></script></body>':'</body>'));
  res.setHeader('Content-Type',TYPES[path.extname(f)]||'application/octet-stream');res.end(b)})
}).listen(PORT,'127.0.0.1',()=>console.log(`dev server http://127.0.0.1:${PORT}/app/index.html  (data: ${dataDir})`));
