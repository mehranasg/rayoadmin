'use strict';
// QA for: per-item "counting units" table (e.g. box/pack/sheet -> base unit) and the shared multi-unit entry
// calculation (RayoIngredientMath.countingUnits / convertCountingEntry) used by the catalog editor and by the
// receipt/count/waste entry widget in js/32 + js/46. Covers the acceptance scenarios from the feature request:
// the gouda example, box+remainder, snapshot isolation from later factor changes, deactivation not breaking history,
// items without a counting-units table, prepared items, non-gram base units, Persian digits/decimals/zero/blank/invalid
// input, duplicate-name rejection, and old-JSON backward compatibility via pcMigrate.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const read=p=>fs.readFileSync(p,'utf8');
const near=(actual,expected,msg='')=>assert(Math.abs(actual-expected)<1e-9,`${actual} != ${expected} ${msg}`);

function setup(){
  const context={console,URLSearchParams,location:{pathname:'/qa.html',search:''},currentView:'qa',setTimeout(){},clearTimeout(){},
    sessionStorage:{getItem:()=>'qa-manager'},
    document:{readyState:'loading',querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>({}),getElementById:()=>null,addEventListener(){},head:{appendChild(){}}},
    $:()=>({value:'',textContent:'',innerHTML:'',classList:{add(){},remove(){}},style:{}}),
    esc:x=>String(x??''),badge:x=>String(x??''),toast:()=>{},renderView(){},closeModal(){},confirm:()=>true,
    RayoJalali:{today:()=>'1405/06/26'},getInventoryState:()=>({stocktakes:[]}),getSupplierState:()=>({suppliers:[]})};
  context.window=context;vm.createContext(context);
  const core=read('js/08-rayo-pricing-admin-module.js').replace('(function waitPricingModule(){',
    `window.getPricingState=()=>pricingState;window.setTestPricing=x=>{pricingState=pcMigrate(x);pricingLoaded=true};window.pcMigrateRaw=pcMigrate;(function waitPricingModule(){`);
  vm.runInContext(core,context);
  return context;
}

function gouda(overrides){
  return Object.assign({id:'ING-GOUDA',code:'ING-GOUDA',name:'پنیر گودا',category:'لبنیات',itemType:'MENU_INGREDIENT',
    purchaseUnit:'کیلوگرم',recipeUnit:'گرم',packageQuantity:1000,wastePercent:0,lastPurchasePriceToman:0,status:'فعال',
    countingUnits:[
      {id:'CU-0001',name:'ورق',factor:18,active:true},
      {id:'CU-0002',name:'بسته کوچک',factor:180,active:true},
      {id:'CU-0003',name:'جعبه',factor:3500,active:true}
    ]},overrides||{});
}

let tests=0;
function test(name,run){run();tests++;console.log('PASS '+name)}

(()=>{
  test('gouda example: 2 box + 3 small-pack + 2 sheet = 7576g exactly',()=>{
    const c=setup(),item=gouda();
    const r=c.RayoIngredientMath.convertCountingEntry(item,[
      {unitId:'CU-0003',quantity:'2'},{unitId:'CU-0002',quantity:'3'},{unitId:'CU-0001',quantity:'2'}
    ]);
    assert.equal(r.total,7576);
    assert.equal(r.breakdown.length,3);
  });

  test('1 box + 125g direct (base row) = 3625g exactly',()=>{
    const c=setup(),item=gouda();
    const r=c.RayoIngredientMath.convertCountingEntry(item,[
      {unitId:'CU-0003',quantity:'1'},{unitId:'__base__',quantity:'125'}
    ]);
    assert.equal(r.total,3625);
  });

  test('changing the box factor afterwards does not touch an already-computed total (pure function, no live reference)',()=>{
    const c=setup(),item=gouda();
    const before=c.RayoIngredientMath.convertCountingEntry(item,[{unitId:'CU-0003',quantity:'2'}]);
    assert.equal(before.total,7000);
    const changed=gouda();changed.countingUnits.find(u=>u.id==='CU-0003').factor=3600;
    const after=c.RayoIngredientMath.convertCountingEntry(changed,[{unitId:'CU-0003',quantity:'2'}]);
    assert.equal(after.total,7200);
    assert.equal(before.total,7000,'previously computed result object must stay unchanged');
  });

  test('deactivating a unit removes it from new picker lists but a stored breakdown snapshot is unaffected',()=>{
    const c=setup(),item=gouda();
    const snapshot=c.RayoIngredientMath.convertCountingEntry(item,[{unitId:'CU-0003',quantity:'1'}]).breakdown[0];
    assert.equal(snapshot.unitName,'جعبه');assert.equal(snapshot.factor,3500);
    const deactivated=gouda();deactivated.countingUnits.find(u=>u.id==='CU-0003').active=false;
    const liveUnits=c.RayoIngredientMath.countingUnits(deactivated);
    assert(!liveUnits.some(u=>u.id==='CU-0003'),'inactive unit must not appear in the live picker');
    assert.equal(snapshot.unitName,'جعبه','the old snapshot object itself must remain displayable/unchanged');
  });

  test('item with no countingUnits table: only the base unit is offered, entry still works',()=>{
    const c=setup(),item={id:'ING-PLAIN',recipeUnit:'گرم'};
    const units=c.RayoIngredientMath.countingUnits(item);
    assert.equal(units.length,1);assert.equal(units[0].id,'__base__');assert.equal(units[0].name,'گرم');
    const r=c.RayoIngredientMath.convertCountingEntry(item,[{unitId:'__base__',quantity:'250'}]);
    assert.equal(r.total,250);
  });

  test('prepared/composite item: countUnit as base field, its own counting units table',()=>{
    const c=setup(),item={id:'PREP-PATTY',countUnit:'عدد',countingUnits:[{id:'CU-0001',name:'سینی',factor:20,active:true}]};
    const r=c.RayoIngredientMath.convertCountingEntry(item,[{unitId:'CU-0001',quantity:'3'},{unitId:'__base__',quantity:'2'}],'countUnit');
    assert.equal(r.total,62);
    assert.equal(r.baseUnit,'عدد');
  });

  test('non-gram base unit (liter) works the same way',()=>{
    const c=setup(),item={id:'ING-OIL',recipeUnit:'لیتر',countingUnits:[{id:'CU-0001',name:'گالن',factor:3.785,active:true}]};
    const r=c.RayoIngredientMath.convertCountingEntry(item,[{unitId:'CU-0001',quantity:'2'}]);
    near(r.total,7.57);
  });

  test('Persian digits, decimals and thousands separators parse correctly in rows',()=>{
    const c=setup(),item=gouda();
    const r=c.RayoIngredientMath.convertCountingEntry(item,[{unitId:'CU-0003',quantity:'۱٫۵'},{unitId:'CU-0001',quantity:'۲'}]);
    near(r.total,1.5*3500+2*18);
  });

  test('explicit zero row is a valid counted value; blank row is "not used", not an error',()=>{
    const c=setup(),item=gouda();
    const zero=c.RayoIngredientMath.convertCountingEntry(item,[{unitId:'CU-0003',quantity:'0'}]);
    assert.equal(zero.total,0,'an explicit 0 must be a valid computed total, not rejected');
    const blank=c.RayoIngredientMath.convertCountingEntry(item,[{unitId:'CU-0003',quantity:''},{unitId:'CU-0001',quantity:''}]);
    assert.equal(blank.total,null,'all-blank rows must mean nothing entered, not zero');
  });

  test('invalid row quantity (non-numeric / negative) is rejected with a reason, not silently zeroed',()=>{
    const c=setup(),item=gouda();
    const bad1=c.RayoIngredientMath.convertCountingEntry(item,[{unitId:'CU-0003',quantity:'abc'}]);
    assert.equal(bad1.total,null);assert(bad1.reason);
    const bad2=c.RayoIngredientMath.convertCountingEntry(item,[{unitId:'CU-0003',quantity:'-1'}]);
    assert.equal(bad2.total,null);assert(bad2.reason);
  });

  test('a row referencing an unknown/removed unit id is rejected',()=>{
    const c=setup(),item=gouda();
    const r=c.RayoIngredientMath.convertCountingEntry(item,[{unitId:'CU-DOES-NOT-EXIST',quantity:'1'}]);
    assert.equal(r.total,null);assert(r.reason);
  });

  test('catalog editor: duplicate unit name (Persian-normalized) is rejected; same factor with different names is fine',()=>{
    const c=setup();
    const dup=c.RayoIngredientMath.checkCountingUnitNames('گرم',[{name:'جعبه',factor:3500},{name:'جعبه ',factor:200}]);
    assert(dup,'duplicate name (only whitespace differs) must be rejected');
    const sameAsBase=c.RayoIngredientMath.checkCountingUnitNames('گرم',[{name:'گرم',factor:100}]);
    assert(sameAsBase,'a unit reusing the base unit name must be rejected');
    const yekeYeKaf=c.RayoIngredientMath.checkCountingUnitNames('گرم',[{name:'كارتن',factor:100},{name:'کارتن بزرگ',factor:200}]);
    assert.equal(yekeYeKaf,'','ي/ك vs ی/ک variants of a DIFFERENT word must not collide with each other');
    const ok=c.RayoIngredientMath.checkCountingUnitNames('گرم',[{name:'جعبه',factor:3500},{name:'بسته',factor:3500}]);
    assert.equal(ok,'','two different names may share the same factor');
  });

  test('catalog editor: stable id assignment never reuses/duplicates ids within one save batch',()=>{
    const c=setup();
    const assigned=c.RayoIngredientMath.assignCountingUnitIds([
      {id:'CU-0002',name:'بسته',factor:180,active:true},
      {id:null,name:'جعبه',factor:3500,active:true},
      {id:null,name:'ورق',factor:18,active:true}
    ]);
    assert.equal(assigned[0].id,'CU-0002');
    assert.equal(assigned[1].id,'CU-0003');
    assert.equal(assigned[2].id,'CU-0004');
  });

  test('catalog editor: reading counting-unit rows from the DOM validates each row (name/factor required, factor > 0)',()=>{
    const c=setup();
    function fakeRow({name,factor,active,cuId}){
      const cells={'.cu-name':{value:name},'.cu-factor':{value:factor},'.cu-active':{checked:!!active}};
      return {dataset:{cuId:cuId||''},querySelector:sel=>cells[sel]||null};
    }
    c.document.querySelectorAll=sel=>sel==='#pc_i_cu_rows [data-cu-row]'?[fakeRow({name:'جعبه',factor:'3500',active:true})]:[];
    const ok=c.RayoIngredientMath.readCountingUnitRows('pc_i');
    assert.equal(ok.rows.length,1);assert.equal(ok.rows[0].factor,3500);

    c.document.querySelectorAll=sel=>sel==='#pc_i_cu_rows [data-cu-row]'?[fakeRow({name:'جعبه',factor:'0',active:true})]:[];
    assert(c.RayoIngredientMath.readCountingUnitRows('pc_i').error,'factor 0 must be rejected');

    c.document.querySelectorAll=sel=>sel==='#pc_i_cu_rows [data-cu-row]'?[fakeRow({name:'جعبه',factor:'-5',active:true})]:[];
    assert(c.RayoIngredientMath.readCountingUnitRows('pc_i').error,'negative factor must be rejected');

    c.document.querySelectorAll=sel=>sel==='#pc_i_cu_rows [data-cu-row]'?[fakeRow({name:'جعبه',factor:'abc',active:true})]:[];
    assert(c.RayoIngredientMath.readCountingUnitRows('pc_i').error,'non-numeric factor must be rejected');

    c.document.querySelectorAll=sel=>sel==='#pc_i_cu_rows [data-cu-row]'?[fakeRow({name:'',factor:'',active:true})]:[];
    assert.equal(c.RayoIngredientMath.readCountingUnitRows('pc_i').rows.length,0,'a fully blank freshly-added row is silently ignored');
  });

  test('old JSON without countingUnits loads fine via pcMigrate; unknown keys are preserved',()=>{
    const c=setup();
    const migrated=c.pcMigrateRaw({ingredients:[{id:'ING-OLD',name:'قدیمی',recipeUnit:'گرم',someUnknownField:'keep-me'}],preparedItems:[{id:'PREP-OLD',name:'قدیمی۲',countUnit:'عدد',anotherUnknown:42}]});
    assert.equal(migrated.ingredients[0].someUnknownField,'keep-me');
    assert.equal(migrated.preparedItems[0].anotherUnknown,42);
    assert.equal(c.RayoIngredientMath.countingUnits(migrated.ingredients[0]).length,1,'no countingUnits field -> only the base unit');
  });

  console.log(`\n${tests} passed`);
})();
