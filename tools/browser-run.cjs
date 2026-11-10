// Headless Chrome runner for browser tests (Chrome DevTools Protocol, no extra packages; Node 22+).
//   node tools/browser-run.cjs <url> [limitSeconds=240] [width=1366] [shotName]
// The page (usually through a probe injected by the dev server) reports by appending <pre id="qa-result">…</pre>;
// the runner prints its text and exits. While running, if the page sets window.__shotReq='name' a PNG is saved to
// .local-data/shots/name.png and window.__shotDone='name' is set. With [shotName] it only waits 5 s and saves one shot.
// Chrome: env CHROME, else the usual install paths, else the Playwright Chromium.
const {spawn}=require('child_process'),path=require('path'),fs=require('fs'),os=require('os');
const url=process.argv[2],LIMIT=+(process.argv[3]||240),W=+(process.argv[4]||1366),ONE=process.argv[5];
if(!url){console.log('usage: node tools/browser-run.cjs <url> [limitSeconds] [width] [shotName]');process.exit(2)}
const cands=[process.env.CHROME,'C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','/usr/bin/google-chrome','/usr/bin/chromium','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'];
try{const pw=path.join(process.env.LOCALAPPDATA||path.join(os.homedir(),'.cache'),'ms-playwright');for(const d of fs.readdirSync(pw).filter(x=>x.startsWith('chromium-')).sort().reverse())cands.push(path.join(pw,d,'chrome-win64','chrome.exe'),path.join(pw,d,'chrome-linux','chrome'))}catch(_){}
const chrome=cands.find(c=>c&&fs.existsSync(c));if(!chrome){console.log('Chrome not found: set CHROME=<path>');process.exit(2)}
const out=path.resolve(__dirname,'..','.local-data','shots');fs.mkdirSync(out,{recursive:true});
const prof=fs.mkdtempSync(path.join(os.tmpdir(),'rayo-chrome-')),port=9300+Math.floor(Math.random()*500);
const c=spawn(chrome,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check',`--remote-debugging-port=${port}`,'--user-data-dir='+prof,`--window-size=${W},900`,'about:blank'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{let ws,code=0;try{let t;for(let i=0;i<40;i++){try{t=await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`,{method:'PUT'})).json();break}catch(_){await sleep(500)}}
 ws=new WebSocket(t.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);let id=0;const pend=new Map;ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pend.has(m.id)){pend.get(m.id)(m);pend.delete(m.id)}};
 const call=(method,params={})=>new Promise(r=>{const i=++id;pend.set(i,r);ws.send(JSON.stringify({id:i,method,params}))});
 const ev=async e=>(await call('Runtime.evaluate',{expression:e,returnByValue:true})).result?.result?.value;
 const shot=async n=>{const s=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(out,n+'.png'),Buffer.from(s.result.data,'base64'))};
 await call('Emulation.setDeviceMetricsOverride',{width:W,height:900,deviceScaleFactor:1,mobile:W<600});await call('Page.navigate',{url});
 if(ONE){await sleep(5000);await shot(ONE);console.log('shot',path.join(out,ONE+'.png'));return}
 const t0=Date.now();while((Date.now()-t0)/1000<LIMIT){await sleep(700);const req=await ev('window.__shotReq||""');if(req){await ev('window.__shotReq=""');await shot(req);await ev(`window.__shotDone=${JSON.stringify(req)}`);continue}
  const v=await ev('document.getElementById("qa-result")?.textContent||""');if(v){console.log(v);return}}
 console.log('TIMEOUT: no #qa-result after '+LIMIT+' s');code=1}catch(e){console.log('ERROR',e.message);code=1}finally{try{ws?.close()}catch(_){}c.kill();setTimeout(()=>{try{fs.rmSync(prof,{recursive:true,force:true})}catch(_){}process.exit(code)},300)}})();
