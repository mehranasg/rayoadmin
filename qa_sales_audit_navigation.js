'use strict';
const fs=require('fs');
let pass=0,fail=0;
function check(name,ok){if(ok){pass++;console.log('  ✓',name)}else{fail++;console.error('  ✗',name)}}
const salesHtml=fs.readFileSync('sales-analysis.html','utf8');
const auditHtml=fs.readFileSync('sepids-audit.html','utf8');
const sales=fs.readFileSync('js/28-sales-analysis-page-v9-6-1.js','utf8');
const audit=fs.readFileSync('js/33-sepids-audit-v10.js','utf8');
const shell=fs.readFileSync('js/16-mpa-shell.js','utf8');
const polish=fs.readFileSync('js/44-phase1-polish-v10-10-1.js','utf8');
const css=fs.readFileSync('css/08-phase1-polish-v10-10-1.css','utf8');

check('sales renders the standard primary heading',/<div class="page-head">[\s\S]*?<h1>فروش<\/h1>/.test(sales));
check('sales section tabs render after the heading',sales.indexOf('${salesSectionTabs()}')>sales.indexOf('<h1>فروش</h1>'));
check('sales and audit retain both section links',sales.includes('sepids-audit.html')&&audit.includes('sales-analysis.html'));
check('active tab is exposed accessibly',sales.includes('aria-current="page"')&&audit.includes('aria-current="page"'));
check('shared tab CSS is loaded by both standalone pages',salesHtml.includes('08-phase1-polish-v10-10-1.css')&&auditHtml.includes('08-phase1-polish-v10-10-1.css'));
check('tabs have spacing and mobile wrapping',/\.v10101-page-tabs\{[^}]*margin:0 0 16px/.test(css)&&/@media\(max-width:680px\)/.test(css));
check('audit route is registered by MPA router',/sepidsAudit:'sepids-audit\.html'/.test(shell)&&/'sepids-audit\.html':'sepidsAudit'/.test(shell));
check('audit registers against lexical views registry',/typeof views==='undefined'/.test(audit)&&/views\.sepidsAudit=renderAudit/.test(audit));
check('broken window.views bootstrap dependency is gone',!/!window\.views/.test(audit)&&!/window\.views\.sepidsAudit/.test(audit));
check('audit is a real import report review feature',/confirmImport/.test(audit)&&/eventsPane/.test(audit)&&/saveReview/.test(audit)&&/rawBlocks/.test(audit));
check('unauthenticated direct access still returns to login',salesHtml.includes("location.replace('index.html?next='")&&auditHtml.includes("location.replace('index.html?next='"));
check('navigation enhancer no longer inserts tabs above page root',!polish.includes("includes(f)&&root&&!document.getElementById('v10101SalesTabs')"));

console.log(`PASS ${pass}`);if(fail){console.error(`FAIL ${fail}`);process.exit(1)}
