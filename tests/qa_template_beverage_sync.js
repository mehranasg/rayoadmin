// QA: newpanel/core/js/beverage-control.js must be an exact copy of the RayoBeverageControl block of js/config.js.
// Run: node qa_template_beverage_sync.js
'use strict';
const fs=require('fs'),path=require('path');
const cfg=fs.readFileSync(path.join(__dirname,'../legacy/js/config.js'),'utf8').split(/\r?\n/),tpl=fs.readFileSync(path.join(__dirname,'../app/core/js/beverage-control.js'),'utf8').split(/\r?\n/);
const s=cfg.findIndex(l=>l.startsWith('// Daily soft-drink control (inventory.beverageDailyControls)'));let e=-1;for(let i=s+1;i<cfg.length;i++)if(cfg[i]==='})();'){e=i;break}
const block=cfg.slice(s,e+1).join('\n'),copy=tpl.slice(tpl.findIndex(l=>l.startsWith('// Daily soft-drink control'))).join('\n').replace(/\n+$/,'');
const ok=s>=0&&e>s&&block===copy;
console.log(ok?'qa_template_beverage_sync: copy matches js/config.js':'qa_template_beverage_sync: FAIL — copy differs from js/config.js; copy the block again');process.exit(ok?0:1);
