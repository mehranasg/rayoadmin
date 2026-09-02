const fs=require('fs'),path=require('path'),assert=require('assert'),vm=require('vm');
const root=__dirname,read=p=>fs.readFileSync(path.join(root,p),'utf8'),code=read('js/46-inventory-operations-v10-12.js');
new vm.Script(code,{filename:'46-inventory-operations-v10-12.js'});
const checks={
 singleton:code.includes('__RAYO_INVENTORY_OPERATIONS_V1012_INSTALLED'),
 receiptLock:code.includes('async function saveReceipt(keep){if(ui.receiptSaving)return;ui.receiptSaving=true;receiptButtons(true)'),
 issueLock:code.includes('async function saveIssue(){if(ui.issueSaving)return;ui.issueSaving=true;issueButtons(true)'),
 stableReceiptId:code.includes('REC-DIRECT-${actionId}')&&code.includes('requestId:actionId'),
 stableIssueId:code.includes('MOV-ISSUE-${actionId}')&&code.includes("movementType:'TRANSFER'"),
 oneReceiptAppend:code.includes('if(!v.stockReceipts.some(x=>x.id===id))v.stockReceipts.push'),
 oneIssueAppend:code.includes('if(!v.inventoryMovements.some(x=>x.id===id))v.inventoryMovements.push'),
 uncertainResultCheck:code.includes("unknownSave(e)&&await inventoryRecordConfirmed('stockReceipts',id)")&&code.includes("unknownSave(e)&&await inventoryRecordConfirmed('inventoryMovements',id)"),
 failureRollback:code.includes('Object.assign(v,beforeInv)')&&code.includes('Object.assign(v,before)'),
 searchWithoutRender:code.includes("document.querySelectorAll('[data-v1012-receipt-row]')")&&code.includes("document.querySelectorAll('[data-v1012-issue-row]')"),
 persianNormalize:code.includes("replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/\\s+/g,' ')"),
 voidAudit:code.includes('voidReason:reason')&&code.includes('voidedAt:at'),
 doubleVoidGuard:code.includes('اثر دوم ندارد'),
 dependencyGuards:code.includes('closedPeriod(m.date)')&&code.includes('اصلاح شمارش'),
 transferBothSides:code.includes('هر دو سمت این انتقال دقیقاً یک‌بار خنثی می‌شوند'),
 explicitButtonTypes:code.includes('<button type="submit" data-v1012-receipt-action')&&code.includes('<button type="button" data-v1012-receipt-action'),
 noLocalStorage:!code.includes('localStorage')
};
for(const [name,value] of Object.entries(checks)){assert.ok(value,name);console.log('PASS',name)}
const normalize=s=>String(s).trim().toLowerCase().replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/\s+/g,' ');
assert.ok(normalize('  كيك   يزدي ').includes(normalize('کیک یزدی')));console.log('PASS persian search sample');
let saving=false,requests=0,records=[];async function mockedAction(){if(saving)return;saving=true;const id='REQ-1';try{if(!records.some(x=>x.id===id))records.push({id});requests++;await Promise.resolve()}finally{saving=false}}
Promise.all([mockedAction(),mockedAction(),mockedAction(),mockedAction()]).then(()=>{assert.equal(requests,1);assert.equal(records.length,1);console.log('PASS rapid click: 1 request = 1 record')}).catch(e=>{console.error(e);process.exitCode=1});
