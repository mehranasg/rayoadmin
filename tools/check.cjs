// Syntax check of every JavaScript file of the app, the tests and the tools (node --check).
const {execFileSync}=require('child_process'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),files=[];
const walk=d=>{for(const f of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,f.name);if(f.isDirectory())walk(p);else if(/\.(c?js)$/.test(f.name))files.push(p)}};
for(const d of ['app','tests','tools'])walk(path.join(root,d));
let bad=0;for(const f of files){try{execFileSync(process.execPath,['--check',f],{stdio:'pipe'})}catch(e){bad++;console.log('FAIL',path.relative(root,f));console.log(String(e.stderr||e.message).split('\n').slice(0,4).join('\n'))}}
console.log(`check: ${files.length-bad} ok, ${bad} failed`);process.exit(bad?1:0);
