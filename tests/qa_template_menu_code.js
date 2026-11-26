// QA: a menu item saved without a Sepidz code (placeholder ITEM-#### or empty) gets its real code once, later;
// a registered code still never changes. Synthetic data only. Run: node qa_template_menu_code.js
'use strict';
const fs=require('fs'),path=require('path');
global.window={};for(const f of ['inventory-engine.js','inventory-write.js','menu-write.js'])eval(fs.readFileSync(path.join(__dirname,'../app/core/js',f),'utf8'));
const MW=window.MenuWrite;let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const throws=(f,re,m)=>{try{f();ok(false,m+' (no error)')}catch(e){ok(re.test(e.message),m+' → '+e.message)}};
const ctx=()=>({actor:'owner',at:new Date().toISOString(),reqId:'R'});
const doc={settings:{requireMenuSalesCode:false},lists:{menuCategories:['غذا']},menuItems:[{id:'MENU-0001',code:'4001',name:'پیتزا',category:'غذا',status:'فعال',currentPriceToman:100000}],recipes:[],recipeVersions:[],priceHistory:[],ingredients:[]};
const r=MW.saveMenuItem(doc,ctx(),{name:'سالاد تازه',category:'غذا',price:50000});const it=doc.menuItems.find(m=>m.id===r.id);
ok(/^ITEM-\d+$/.test(it.code)&&MW.placeholderCode(it.code),'saved without a code: placeholder ITEM-####');
ok(MW.placeholderCode('')&&!MW.placeholderCode('4001'),'empty is a placeholder, a real code is not');
throws(()=>MW.saveMenuItem(doc,ctx(),{id:it.id,code:'4001',name:'سالاد تازه',category:'غذا'}),/آیتم دیگری/,'the code of another item refused');
const c=ctx();MW.saveMenuItem(doc,c,{id:it.id,code:'۴۰۵۵',name:'سالاد تازه',category:'غذا'});ok(it.code==='4055'&&/^ITEM-/.test(it.codeBefore)&&c.auditExtra.codeSet.to==='4055','the real code is set once (Persian digits read), the placeholder kept in codeBefore');
throws(()=>MW.saveMenuItem(doc,ctx(),{id:it.id,code:'4099',name:'سالاد تازه',category:'غذا'}),/تغییر نمی‌کند/,'after that it never changes');
MW.saveMenuItem(doc,ctx(),{id:it.id,code:'',name:'سالاد تازهٔ رایو',category:'غذا'});ok(it.code==='4055'&&it.name==='سالاد تازهٔ رایو','other edits keep the code');
throws(()=>MW.saveMenuItem(doc,ctx(),{id:'MENU-0001',code:'4002',name:'پیتزا',category:'غذا'}),/تغییر نمی‌کند/,'a registered Sepidz code never changes');
{const d2={...doc,menuItems:[{id:'M9',code:'',name:'نوشابه',category:'غذا',status:'فعال'}]};MW.saveMenuItem(d2,ctx(),{id:'M9',code:'5001',name:'نوشابه',category:'غذا'});ok(d2.menuItems[0].code==='5001','an empty code can be set too')}
console.log(`qa_template_menu_code: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
