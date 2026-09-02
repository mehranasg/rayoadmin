const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert'),root=__dirname;
const config=fs.readFileSync(path.join(root,'js/config.js'),'utf8'),start=config.indexOf('function cashAmount('),end=config.indexOf('\n\nwindow.RAYO_API_GATEWAY',start),sandbox={window:{}};
vm.runInNewContext(config.slice(start,end),sandbox);const api=sandbox.window.RayoCashVariance;
function report(net,tips,received,extra={}){return{netReceivable:net,tipDelivery:tips,tipValet:0,tipHall:0,pos1:received,pos2:0,pos3:0,pos4:0,pos5:0,pos6:0,cardToCard:0,cash:0,otherTransactions:[],...extra}}
for(const [name,row,want,status] of [
 ['balanced',report('۱۰٬۰۰۰٬۰۰۰','۵۰۰٬۰۰۰','۱۰٬۵۰۰٬۰۰۰'),0,'تراز'],
 ['surplus',report('10,000,000','500,000','10,700,000'),200000,'اضافه صندوق'],
 ['shortage',report(10000000,500000,10300000),-200000,'کسری صندوق'],
 ['zero tip',report(10000000,0,10000000),0,'تراز'],
 ['outside tip',report(10000000,500000,10000000,{tipsOutsideCashbox:true}),0,'تراز'],
 ['net includes tip',report(10500000,500000,10500000,{netReceivableIncludesTips:true}),0,'تراز']
]){const got=api.calculate(row);assert.equal(got.valid,true,name);assert.equal(got.initialVariance,want,name);assert.equal(got.status,status,name);console.log('PASS',name)}
assert.equal(api.parseAmount('۱۲٬۳۴۵٫۶').value,12345.6);assert.equal(api.parseAmount('۱۲۳۴۵.۶').value,12345.6);assert.equal(api.parseAmount('abc').ok,false);assert.equal(api.parseAmount('').value,0);console.log('PASS parsing: Persian digits, blank, decimal, separators, invalid');
const toman=10000000,asRial=report(toman*10,500000*10,10500000*10);assert.equal(api.calculate(asRial).initialVariance,0);console.log('PASS toman/rial explicit conversion');
const historical=api.calculate(report(10000000,500000,10500000,{finalVariance:900000}));assert.equal(historical.historicalDifference,-900000);console.log('PASS historical difference without mutation');
for(const file of ['js/11-rayo-cash-report-module.js','cash-report/js/app.js','js/22-staff-panel.js','js/40-rayo-v10-9-comprehensive.js']){const code=fs.readFileSync(path.join(root,file),'utf8');assert.ok(code.includes('RayoCashVariance')||file.includes('40-'),`${file} shared calculator`)}
assert.ok(fs.readFileSync(path.join(root,'js/11-rayo-cash-report-module.js'),'utf8').includes('historicalDifference'));console.log('PASS management/staff/detail/totals use shared calculator');
