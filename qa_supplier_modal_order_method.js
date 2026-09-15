const fs=require('fs');

let pass=0,fail=0;
function ok(name,test){
  if(test){pass++;console.log('PASS',name)}
  else{fail++;console.error('FAIL',name)}
}

const suppliers=fs.readFileSync('js/04-rayo-suppliers-admin-module.js','utf8');
const inventory=fs.readFileSync('js/46-inventory-operations-v10-12.js','utf8');
const base=fs.readFileSync('js/00-base.js','utf8');
const finalSupplierForm=fs.readFileSync('js/30-operational-polish-v9-8-0.js','utf8');
const polish=fs.readFileSync('js/44-phase1-polish-v10-10-1.js','utf8');
const seed=JSON.parse(fs.readFileSync('seed/suppliers-data.seed.json','utf8'));

ok('supplier modal ignores backdrop clicks',inventory.includes("file()!=='suppliers.html'&&backdrop"));
ok('final supplier page blocks backdrop close',polish.includes("['personnel.html','suppliers.html'].includes(file())"));
ok('explicit modal close controls remain available',base.includes('onclick="closeModal()">انصراف'));
ok('SMS is guaranteed in live supplier order methods',suppliers.includes("key==='orderMethods'?supUnique([...options,'اس ام اس'])"));
ok('SMS reaches the final supplier form override',finalSupplierForm.includes("key==='orderMethods'?[...new Set([...values,'اس ام اس'])]"));
ok('SMS is available after explicit seed initialization',seed.lists.orderMethods.includes('اس ام اس'));
const loadBody=suppliers.match(/async function supEnsureLoaded[\s\S]*?\n\}/)?.[0]||'';
ok('normal supplier load does not save or seed',!loadBody.includes('SupplierStorageAdapter.save')&&!loadBody.includes('seed'));

console.log(`RESULT ${pass}/${pass+fail} PASS`);
process.exitCode=fail?1:0;
