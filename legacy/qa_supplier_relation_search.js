const fs=require('fs');

const js=fs.readFileSync('js/43-central-catalog-v10-10.js','utf8');
const css=fs.readFileSync('css/08-phase1-polish-v10-10-1.css','utf8');
let pass=0,fail=0;
function ok(name,test){if(test){pass++;console.log('PASS',name)}else{fail++;console.error('FAIL',name)}}

ok('supplier picker opens on focus',js.includes('onfocus="RayoSearchPicker.filter'));
ok('supplier picker searches all useful name fields',js.includes("${s.company||''} ${s.contactName||''} ${s.supplierTradeName||''}"));
ok('relation tab filters suppliers by name',js.includes('relationSupplierSearch')&&js.includes('جست‌وجوی نام تأمین‌کننده'));
ok('relation tab filters items by name or code',js.includes('relationItemSearch')&&js.includes('جست‌وجوی قلم'));
ok('item results use checkbox multi-select',js.includes('type="checkbox"')&&js.includes('toggleRelationItem'));
ok('all filtered items can be selected or cleared',js.includes('toggleFilteredItems:checked')&&js.includes('انتخاب همه نتایج')&&js.includes('برداشتن تیک نتایج'));
ok('selection survives a search change',!js.includes('searchRelationItems:value=>{relationDraft.selected.clear()'));
ok('bulk controls are styled',css.includes('.supplier-relation-bulk'));

console.log(`RESULT ${pass}/${pass+fail} PASS`);
process.exitCode=fail?1:0;
