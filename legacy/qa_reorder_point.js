'use strict';
const fs=require('fs'),vm=require('vm');
let pass=0,fail=0;
function check(name,ok){if(ok){pass++;console.log('  ✓',name)}else{fail++;console.error('  ✗',name)}}
const pricing=fs.readFileSync('js/08-rayo-pricing-admin-module.js','utf8');
const shared=fs.readFileSync('js/40-rayo-v10-9-comprehensive.js','utf8');
const inventory=fs.readFileSync('js/46-inventory-operations-v10-12.js','utf8');
const desk=fs.readFileSync('js/42-operations-v10-9-2.js','utf8');
const base=fs.readFileSync('js/47-base-data-v10-12-1.js','utf8');

const parserContext={};vm.createContext(parserContext);
vm.runInContext(`${pricing.match(/function pcToEnDigits[^\n]+/)[0]}\n${pricing.match(/function pcOptionalNonNegative[^\n]+/)[0]}`,parserContext);
const parse=parserContext.pcOptionalNonNegative;
check('blank remains undefined',parse('').ok&&parse('').value===null);
check('zero remains an explicit zero',parse('۰').ok&&parse('۰').value===0);
check('Persian decimal is accepted',parse('۱۲.۵').value===12.5);
check('English decimal is accepted',parse('10.25').value===10.25);
check('negative and nonnumeric values are rejected',!parse('-1').ok&&!parse('abc').ok);

const reorderContext={window:{},A:x=>Array.isArray(x)?x:[],S:x=>String(x??'').trim()};vm.createContext(reorderContext);
vm.runInContext(`${shared.match(/function reorderPointValue[^\n]+/)[0]}\n${shared.match(/function reorderAssessment[^\n]+/)[0]}`,reorderContext);
const assess=reorderContext.reorderAssessment,inv={trackedIngredients:[]},item={id:'I1',status:'فعال',itemType:'GENERAL_INVENTORY',inventoryTracked:true,reorderPoint:10};
check('stock above point is not due',!assess(item,inv,{quantity:11}).need);
check('stock equal to point is due',assess(item,inv,{quantity:10}).need);
check('stock below point is due',assess(item,inv,{quantity:7}).need);
check('negative physical stock remains due',assess(item,inv,{quantity:-2}).need&&assess(item,inv,{quantity:-2}).stock===-2);
check('unknown stock is not coerced to zero',!assess(item,inv,{quantity:null}).need&&!assess(item,inv,{quantity:null}).known);
check('explicit zero point is active',assess({...item,reorderPoint:0},inv,{quantity:0}).need);
check('missing point is different from zero',assess({...item,reorderPoint:null},inv,{quantity:0}).point===null);
check('service and archived items are excluded',!assess({...item,itemType:'NON_STOCK'},inv,{quantity:0}).need&&!assess({...item,isArchived:true},inv,{quantity:0}).need);
check('catalog value wins and legacy tracked value is fallback only',reorderContext.reorderPointValue(item,{trackedIngredients:[{ingredientId:'I1',reorderPoint:99}]})===10&&reorderContext.reorderPointValue({...item,reorderPoint:null},{trackedIngredients:[{ingredientId:'I1',reorderPoint:9}]})===9);

check('form shows unit and threshold explanation',pricing.includes('pc_i_reorder_unit')&&pricing.includes('وقتی موجودی به این مقدار یا کمتر برسد'));
check('save stores reorderPoint on the central ingredient',/reorderPoint:reorder\.value/.test(pricing));
check('failed save restores the item and keeps modal open',/const ok=(?:staged&&)?await pcCommit/.test(pricing)&&/if\(!ok\)/.test(pricing));
check('old tracked value is recovered for editing without load-time migration',base.includes('RayoReorder?.point'));
check('inventory list uses total-position and shared assessment',inventory.includes('currentTotalPosition')&&inventory.includes('RayoReorder?.assess'));
check('order desk uses the same shared assessment',desk.includes('RayoReorder?.assess'));
check('lists show item stock point and base unit',inventory.includes('<th>موجودی</th><th>نقطه سفارش</th><th>واحد</th>')&&desk.includes('<th>موجودی</th><th>نقطه سفارش</th><th>واحد</th>'));
check('unreceived purchase orders are not added to physical stock',!shared.match(/function reorderAssessment[^\n]*(purchaseRequests|purchaseOrders)/));

console.log(`PASS ${pass}`);if(fail){console.error(`FAIL ${fail}`);process.exit(1)}
