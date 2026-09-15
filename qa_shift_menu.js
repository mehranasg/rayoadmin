'use strict';
const fs=require('fs');
const vm=require('vm');

let passed=0;
function check(name,condition){
  if(!condition)throw new Error(`FAIL: ${name}`);
  passed++;
  console.log(`  ✓ ${name}`);
}

const menu=fs.readFileSync('js/44-phase1-polish-v10-10-1.js','utf8');
const shell=fs.readFileSync('js/16-mpa-shell.js','utf8');
const base=fs.readFileSync('js/00-base.js','utf8');
const overrides=fs.readFileSync('js/01-v6-overrides.js','utf8');
const css=fs.readFileSync('css/08-phase1-polish-v10-10-1.css','utf8');
const htmlFiles=fs.readdirSync('.').filter(name=>name.endsWith('.html')&&fs.readFileSync(name,'utf8').includes('44-phase1-polish-v10-10-1.js'));
const shiftViews=['shiftPlan','monthlyShiftPlan','staffingNeeds','staffingCapacity','staffingMap','annualCalendar','shiftHistory','shiftReport'];

new vm.Script(menu,{filename:'js/44-phase1-polish-v10-10-1.js'});
check('گروه مدیریت شیفت پلن در منوی نهایی ثبت شده است',menu.includes("['shift','group','🗓️','مدیریت شیفت پلن']"));
check('گروه شیفت بعد از مدیریت پرسنل درج می‌شود',menu.includes("MENU.splice(MENU.findIndex(x=>x[0]==='personnel')+1,0,['shift','group'"));
check('همه مسیرهای شیفت در زیرمنو موجودند',shiftViews.every(view=>menu.includes(`personnel.html?view=${view}`)));
check('همه Viewهای شیفت به گروه Active شیفت نگاشت شده‌اند',menu.includes("['staffingNeeds','staffingCapacity','staffingMap','annualCalendar','monthlyShiftPlan','shiftPlan','shiftHistory','shiftReport'].includes(v))return'shift'"));
check('گروه جاری هم‌زمان Open و Active می‌شود',menu.includes("open=k||sessionStorage.getItem('rayo_menu_open')")&&menu.includes("k===id?'active':''")&&css.includes('.side-section.active>.side-section-head'));
check('قابلیت shift در تنظیمات نمایش وجود دارد و نبود کلید آن را مخفی نمی‌کند',menu.includes("['shift','مدیریت شیفت پلن']")&&menu.includes("vis()[k]!==false"));
check('Router تمام Deep Linkهای شیفت را می‌پذیرد',shiftViews.every(view=>shell.includes(`'${view}'`))&&shell.includes("q&&hrViews.has(q)"));
check('Viewهای اصلی شیفت واقعاً ثبت شده‌اند',shiftViews.filter(view=>view!=='staffingCapacity').every(view=>base.includes(`${view}:`))&&overrides.includes('views.staffingCapacity=viewsStaffingCapacityV6'));
check('همه صفحات مشترک Cache Key جدید منو را بارگذاری می‌کنند',htmlFiles.length>=14&&htmlFiles.every(name=>fs.readFileSync(name,'utf8').includes('44-phase1-polish-v10-10-1.js?v=10.12.1-personnel-list-columns-1')));

console.log(`PASS ${passed}`);
