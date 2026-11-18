// Starts the dev server with the smoke probe, runs it in headless Chrome, prints the result, stops the server.
//   npm run smoke            (needs .local-data/ from `npm run fetch-data`)
//   node tools/smoke.cjs tools/probes/<other>.js [limitSeconds] [windowWidth, e.g. 390 for a phone]
const {spawn}=require('child_process'),path=require('path');
const probe=process.argv[2]||'tools/probes/smoke.js',limit=process.argv[3]||'300',width=process.argv[4]||'',port=String(8800+Math.floor(Math.random()*150));
const srv=spawn(process.execPath,[path.join(__dirname,'dev-server.cjs')],{env:{...process.env,PORT:port,PROBE:probe},stdio:['ignore','pipe','inherit']});
srv.stdout.once('data',()=>{const run=spawn(process.execPath,[path.join(__dirname,'browser-run.cjs'),`http://127.0.0.1:${port}/app/index.html#/home`,limit,...(width?[width]:[])],{stdio:'inherit'});run.on('exit',c=>{srv.kill();process.exit(c||0)})});
