'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const code=fs.readFileSync('js/32-inventory-cost-control-v10.js','utf8').replace(/\r\n/g,'\n');
function fn(name){const rows=code.split('\n'),start=rows.findIndex(x=>new RegExp(`^(?:async\\s+)?function\\s+${name}\\(`).test(x));if(start<0)throw Error(`missing ${name}`);let end=start+1;while(end<rows.length&&!/^(?:async\s+)?function\s+\w+\(|^const\s+[A-Za-z_$][\w$]*\s*=|^window\./.test(rows[end]))end++;return rows.slice(start,end).join('\n')}

const inv={settings:{countApprovalRequired:true},stocktakes:[{id:'old',date:'1405/06/24',locationId:'main',shift:'عصر',status:'submitted',notes:'شمارش قبلی',isOpeningBaseline:false,createdAt:'2026-09-01',lines:[{ingredientId:'a',actual:5,expected:10,variance:-5,unitCost:20,purchasePriceToman:100}]}],trackedIngredients:[],periodClosures:[]};
const pricing={ingredients:[{id:'a',name:'آرد',code:'A',recipeUnit:'کیلو',packageQuantity:5,lastPurchasePriceToman:100},{id:'b',name:'شیر',code:'B',recipeUnit:'لیتر',packageQuantity:1,lastPurchasePriceToman:50}],ingredientPriceHistory:[],changeLog:[]};
const counts=pricing.ingredients.map(i=>({dataset:{v10Count:i.id},value:''})),costs=pricing.ingredients.map(i=>({dataset:{v10Cost:i.id},value:''}));
const els={v10CountDate:{value:'1405/06/24'},v10CountLoc:{value:'main'},v10CountShift:{value:''},v10CountOpening:{checked:false},v10CountOpeningNote:{value:''},v10CountLoadStatus:{textContent:''}};
let inventorySaves=0,pricingSaves=0,renders=0,seq=0;const messages=[];
const context={
 console,inv,pricing,ui:{countDate:'',countLocation:'main',countSaving:false},
 A:x=>Array.isArray(x)?x:[],S:x=>String(x??'').trim(),N:x=>Number(String(x??'').replace(/[,٬]/g,''))||0,Q:x=>{const n=Number(String(x??'').replace(/[,٬]/g,''));return Number.isFinite(n)&&n>=0?n:null},D:x=>String(x??'').trim(),cmp:(a,b)=>String(a).localeCompare(String(b)),F:x=>String(Number(x)),E:x=>String(x),
 document:{getElementById:id=>els[id],querySelectorAll:s=>s==='[data-v10-count]'?counts:s==='[data-v10-cost]'?costs:[],querySelector:s=>{const m=s.match(/data-v10-cost="([^"]+)"/);return m?costs.find(x=>x.dataset.v10Cost===m[1]):null}},
 ingredient:id=>pricing.ingredients.find(x=>x.id===id),ingredientUnit:i=>i?.recipeUnit||'واحد',positionBeforeDate:()=>({quantity:10,baseDate:'1405/06/01',baseQuantity:10,salesConsumption:0,movementNet:0}),costAtDate:()=>20,uid:p=>`${p}-${++seq}`,actor:()=> 'manager',now:()=> '2026-09-20T12:00:00Z',
 savePricing:async()=>{pricingSaves++},saveInv:async()=>{inventorySaves++},renderView:()=>{renders++},toastX:m=>messages.push(m)
};
context.window=context;vm.createContext(context);vm.runInContext([fn('countSelectionRecords'),fn('loadCountSelection'),fn('submitCount')].join('\n'),context);

(async()=>{
 context.loadCountSelection();
 assert.equal(counts[0].value,'5','existing actual quantity loads by date and location');
 assert.equal(costs[0].value,'100','stored purchase price loads with the count');
 assert.equal(els.v10CountShift.value,'عصر');assert.equal(els.v10CountOpeningNote.value,'شمارش قبلی');assert(els.v10CountLoadStatus.textContent.includes('1 قلم'));
 counts[0].value='7';await context.submitCount();
 assert.equal(inv.stocktakes.length,1,'editing does not create a duplicate stocktake');
 assert.equal(inv.stocktakes[0].lines[0].actual,7);assert.equal(inv.stocktakes[0].status,'approved','edited count is approved immediately');
 assert.equal(inv.stocktakes[0].revisionHistory.length,1,'previous values remain in revision history');assert.equal(inv.stocktakes[0].revisionHistory[0].lines[0].actual,5);
 assert.equal(inventorySaves,1);assert.equal(pricingSaves,1);assert.equal(renders,1);assert(messages.at(-1).includes('مستقیماً تأیید'));
 els.v10CountDate.value='1405/06/25';context.loadCountSelection();assert.equal(counts[0].value,'','a date without a count starts empty');
 els.v10CountShift.value='صبح';counts[1].value='4';await context.submitCount();const fresh=inv.stocktakes.find(x=>x.date==='1405/06/25');assert(fresh);assert.equal(fresh.status,'approved','new count bypasses legacy approval setting');assert.equal(fresh.lines[0].actual,4);
 assert(!code.includes('ثبت و ارسال برای تأیید'));assert(code.includes('ذخیره و تأیید شمارش'));
 console.log('PASS inventory count: load existing values by date/location, edit in place with history, and direct approval for edited and new counts');
})().catch(e=>{console.error(e);process.exitCode=1});
