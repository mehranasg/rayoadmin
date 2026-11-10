// Runs every tests/qa_template_*.js and prints one line per file plus a summary; exit code 1 if any failed.
const {spawnSync}=require('child_process'),fs=require('fs'),path=require('path');
const dir=path.resolve(__dirname,'..','tests'),files=fs.readdirSync(dir).filter(f=>/^qa_template_.*\.js$/.test(f)).sort();let bad=0;
for(const f of files){const r=spawnSync(process.execPath,[path.join(dir,f)],{encoding:'utf8',timeout:180000});const last=(r.stdout||'').trim().split('\n').pop()||'';
 if(r.status!==0){bad++;console.log('FAIL',f,'\n'+((r.stdout||'')+(r.stderr||'')).trim().split('\n').slice(-8).join('\n'))}else console.log('ok  ',last)}
console.log(`\n${files.length-bad}/${files.length} test files passed`);process.exit(bad?1:0);
