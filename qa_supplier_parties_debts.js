'use strict';
const fs=require('fs');
let pass=0,fail=0;
function check(name,ok){if(ok){pass++;console.log('  ✓',name)}else{fail++;console.error('  ✗',name)}}
const supplier=fs.readFileSync('js/04-rayo-suppliers-admin-module.js','utf8');
const ops=fs.readFileSync('js/42-operations-v10-9-2.js','utf8');
const inventory=fs.readFileSync('js/32-inventory-cost-control-v10.js','utf8');
const shell=fs.readFileSync('js/44-phase1-polish-v10-10-1.js','utf8');
const html=fs.readFileSync('suppliers.html','utf8');

check('legacy parties default to goods without persisted migration',/function supActivity\(s\).*:'goods'/.test(supplier));
check('party form supports goods service and both',/activityType/.test(supplier)&&/خدمات‌دهنده/.test(supplier)&&/کالا و خدمات/.test(supplier));
check('person and company are independent choices',/partyKind/.test(supplier)&&/شخص حقیقی/.test(supplier));
check('service specialty and description persist in supplier JSON',/serviceSpecialty/.test(supplier)&&/serviceDescription/.test(supplier));
check('service-only parties are excluded from goods documents',/function activeSuppliers\(\).*goodsCapable/.test(ops));
check('direct debts use existing inventory module',/supplierDirectDebts/.test(inventory)&&/saveModule\('inventory',inv/.test(ops));
check('direct debt does not write pricing or asset modules',!(/saveDirectDebt[\s\S]*?saveModule\('(pricing|assets)'/.test(ops)));
check('opening balance stores calculated declared and applied difference',/calculatedBalanceToman/.test(ops)&&/declaredBalanceToman/.test(ops)&&/appliedDifferenceToman/.test(ops));
check('opening uses replace-through-baseline semantics',/replaceThroughBaseline/.test(ops)&&/S\(x\.date\)>baseDate/.test(ops));
check('direct debt is soft-voided',/function voidDirectDebt/.test(ops)&&/x\.status='void'/.test(ops));
check('party removal is archival and preserves relations',/function deleteSupplierAdmin[\s\S]*isArchived:true/.test(supplier)&&!/function deleteSupplierAdmin[^\n]*supplierItems=supplierState\.supplierItems\.filter/.test(supplier));
check('account filters cover activity debt type dates due and balance',/activityType/.test(ops)&&/debtType/.test(ops)&&/dateFrom/.test(ops)&&/accountDueState/.test(ops));
check('debt and credit totals are calculated separately',/Math\.max\(0,x\.a\.balance\)/.test(ops)&&/Math\.max\(0,-x\.a\.balance\)/.test(ops));
check('asset and maintenance links are reference-only',/maintenanceRecordId/.test(ops)&&/صرفاً مرجع/.test(ops));
check('closed-period warning exists',/closedPeriodWarning/.test(ops));
check('page and menu use requested title',shell.includes('خرید، تأمین و نگهداری')&&html.includes('خرید، تأمین و نگهداری'));
check('normal load does not save the new collection',!inventory.match(/ensureSchema[\s\S]{0,800}saveModule/));

console.log(`PASS ${pass}`);if(fail){console.error(`FAIL ${fail}`);process.exit(1)}
