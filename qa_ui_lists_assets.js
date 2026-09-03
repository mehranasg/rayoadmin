const fs=require('fs'),assert=require('assert');
const pricing=fs.readFileSync('js/08-rayo-pricing-admin-module.js','utf8'),assets=fs.readFileSync('js/12-rayo-assets-module.js','utf8'),phase2=fs.readFileSync('js/19-phase2-admin.js','utf8'),css=fs.readFileSync('css/08-phase1-polish-v10-10-1.css','utf8');
const passed=[];function ok(name,value){assert.ok(value,name);passed.push(name)}
function page(rows,page=1,size=25){const pages=Math.max(1,Math.ceil(rows.length/size)),valid=Math.min(Math.max(1,page),pages);return{pages,page:valid,rows:rows.slice((valid-1)*size,valid*size)}}
const rows=Array.from({length:63},(_,i)=>({id:`ING-${i+1}`,name:`قلم ${i+1}`}));
ok('more than two pages use 25 by default',page(rows).pages===3&&page(rows).rows.length===25);
ok('second page preserves item identities',page(rows,2).rows[0].id==='ING-26'&&page(rows,2).rows.at(-1).id==='ING-50');
ok('last page is clamped after deleting its last row',page(rows.slice(0,50),3).page===2);
ok('page sizes are exactly 25 50 100',pricing.includes('[25,50,100].includes(Number(pricingUI.ingredientPageSize))'));
ok('filtering precedes slicing',pricing.indexOf('filtered=all.filter')<pricing.indexOf('rows=filtered.slice'));
ok('filtered count is global not current page',pricing.includes('نمایش ${pcFmt(filtered.length)} قلم از ${pcFmt(all.length)} قلم'));
ok('unfiltered total count exists',pricing.includes('تعداد کل اقلام: ${pcFmt(all.length)}'));
ok('filter changes reset page one',pricing.includes('pricingUI.ingredientPage=1'));
ok('pagination has previous next and page number',pricing.includes('>قبلی</button>')&&pricing.includes('>بعدی</button>')&&pricing.includes('صفحه ${page.toLocaleString'));
ok('row actions retain real ids on every page',pricing.includes("pcEditIngredient('${i.id}')")&&pricing.includes("pcDeleteIngredient('${i.id}')"));
ok('empty filtered state is explicit',pricing.includes('برای فیلترهای انتخاب‌شده قلمی پیدا نشد'));
ok('export logic is not fed paginated rows',!pricing.includes('pcExportChangesCsv(rows)'));
ok('asset import wrapper has global install guard',phase2.includes('!window.__rayoP2AssetsImportInstalled')&&phase2.includes('window.__rayoP2AssetsImportInstalled=true'));
ok('asset import markup is idempotent',phase2.includes("if(h.includes('id=\"p2AssetsExcel\"'))return h"));
ok('asset import keeps one input handler',phase2.includes('onchange="p2ImportAssetsExcel(event)"'));
ok('maintenance search normalizes Persian letters and spaces',assets.includes("replace(/ي/g,'ی').replace(/ك/g,'ک')")&&assets.includes("replace(/\\s+/g,' ')"));
ok('maintenance searches name tag and id',assets.includes("`${a.name} ${a.assetTag||''} ${a.id}`"));
ok('search combines with selected asset',assets.includes('return matchesAsset&&matchesSearch'));
ok('selected option survives search text changes',assets.includes("a.id===assetUI.maintenanceAssetId||!q"));
ok('archived assets with history remain available',assets.includes("!a.isArchived||referenced.has(a.id)"));
ok('maintenance empty state and placeholder are clear',assets.includes('placeholder="نام یا کد دارایی"')&&assets.includes('برای نام یا کد واردشده سابقه تعمیر و نگهداری پیدا نشد'));
ok('mobile pagination styles exist',css.includes('@media(max-width:640px){.catalog-pagination'));
console.log(`PASS ${passed.length}`);passed.forEach(x=>console.log('  ✓ '+x));
