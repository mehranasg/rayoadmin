(()=>{
const file=(location.pathname.split('/').pop()||'index.html').toLowerCase();const internal=file!=='index.html'&&file!=='';if(internal&&!sessionStorage.getItem('rayo_admin_user')){location.replace('index.html?next='+encodeURIComponent(file+location.search));return}
const routes={dashboard:'index.html',suppliers:'suppliers.html',pricing:'pricing.html',inventory:'inventory.html',reports:'reports.html',cashReport:'cash-report-admin.html',assets:'assets.html',finance:'finance.html',survey:'survey.html',sepidsAudit:'sepids-audit.html'};
const settingsViews=new Set(['dataManagement','settings','softwareSettings','violationSettings','changelog','errorLog']);
const requestedView=new URLSearchParams(location.search).get('view');
if(file==='personnel.html'&&settingsViews.has(requestedView)){location.replace('settings.html'+location.search);return}
const hrViews=new Set(['personnel','userManagement','personnelProfile','personnelReports','leaveRequests','protocols','checklistTemplates','checklistReports','violationSettings','staffingNeeds','staffingCapacity','staffingMap','annualCalendar','monthlyShiftPlan','shiftPlan','shiftHistory','shiftReport','payroll','payslip','tips','penalties','delays','payments','consumption','leaves','salaryCalculator','salaryReverse','salaryPersonnel','salaryRates','salarySettings','costForecast','dataManagement','settings','changelog','errorLog','dailyMessage','violations','advanceRequests','reservations']);
function destination(v){if(settingsViews.has(v))return file==='settings.html'?'':'settings.html?view='+encodeURIComponent(v);if(routes[v])return routes[v];if(hrViews.has(v)&&file!=='personnel.html')return 'personnel.html?view='+encodeURIComponent(v);return ''}
document.addEventListener('click',e=>{const b=e.target.closest('.nav-btn[data-view]');if(!b)return;const href=destination(b.dataset.view);if(href){e.preventDefault();e.stopImmediatePropagation();location.href=href}},true);
const originalGoView=window.goView;
window.goView=function(v){const href=destination(v);if(href){location.href=href;return}return originalGoView.apply(this,arguments)};
function addCards(){if(typeof views==='undefined')return;const old=views.dashboard;views.dashboard=function(){const base=old();return base+`<div class="card"><div class="section-head"><h2>دسترسی سریع به بخش‌ها</h2></div><div class="module-cards">${[['personnel.html','👥','پرسنل، شیفت و حقوق','مدیریت کامل نیروی انسانی'],['suppliers.html','🚚','تأمین‌کنندگان','روابط تأمین، سفارش و بدهی'],['base-data.html','🧮','بهای تمام‌شده و قیمت‌گذاری','کاتالوگ اقلام، رسپی و قیمت'],['inventory.html','📦','خرید، انبار و مغایرت','فاکتور خرید، ضایعات و کنترل مصرف'],['reports.html','📈','گزارش‌های مدیریتی','فروش، سود، خرید و مغایرت'],['cash-report-admin.html','💵','گزارش صندوق','ثبت ادمین و گزارش‌های صندوق'],['assets.html','🏷️','اموال و دارایی‌ها','تجهیزات و اقلام تعدادی'],['finance.html','💹','سود و زیان ماهانه','هزینه، درآمد و محاسبه‌گر سود'],['survey.html','⭐','نظرسنجی مشتریان','رضایت، علت‌ها و شماره تماس']].map(x=>`<a class="module-link" href="${x[0]}"><div class="card"><div class="module-icon">${x[1]}</div><h3>${x[2]}</h3><p>${x[3]}</p></div></a>`).join('')}</div></div>`}}
function selectView(){
  const map={'personnel.html':'personnel','suppliers.html':'suppliers','pricing.html':'pricing','menu-management.html':'pricing','base-data.html':'pricing','inventory.html':'inventory','reports.html':'reports','cash-report-admin.html':'cashReport','assets.html':'assets','finance.html':'finance','survey.html':'survey','sepids-audit.html':'sepidsAudit'};
  const q=new URLSearchParams(location.search).get('view');
  currentView=file==='settings.html'?(settingsViews.has(q)?q:'dataManagement'):file==='personnel.html'&&q&&hrViews.has(q)?q:(map[file]||'dashboard');
  if(currentView==='dashboard')addCards();
}
// Select the route while scripts are loading; the base renderer opens it once ready.
wirePageActions();selectView();
const u=sessionStorage.getItem('rayo_admin_user');if(document.getElementById('currentAuthUser'))currentAuthUser.textContent=u?'کاربر: '+u:'';

function wirePageActions(){
  const saveBtn=document.getElementById('serverSaveButton');
  const originalRefresh=window.refreshData,originalSave=window.saveData;
  if(file==='suppliers.html'){
    window.refreshData=()=>window.supRefreshData?.();window.saveData=(manual=true)=>window.supSaveData?.(!!manual);
  }else if(['pricing.html','menu-management.html','base-data.html'].includes(file)){
    window.refreshData=()=>window.pcRefreshData?.();window.saveData=(manual=true)=>window.pcSaveData?.(!!manual);
  }else if(file==='inventory.html'){
    window.refreshData=()=>window.ivRefreshData?.();window.saveData=(manual=true)=>window.ivSaveData?.(!!manual);
  }else if(file==='cash-report-admin.html'){
    window.refreshData=()=>window.crRefresh?.();if(saveBtn)saveBtn.style.display='none';
  }else if(file==='assets.html'){
    window.refreshData=()=>window.amRefresh?.();if(saveBtn)saveBtn.style.display='none';
  }else if(file==='finance.html'){
    window.refreshData=()=>window.finRefresh?.();if(saveBtn)saveBtn.style.display='none';
  }else if(file==='survey.html'){
    window.refreshData=()=>window.svRefresh?.();if(saveBtn)saveBtn.style.display='none';
  }else if(file==='settings.html'){
    window.refreshData=()=>location.reload();if(saveBtn)saveBtn.style.display='none';
  }else if(file==='reports.html'){
    window.refreshData=()=>location.reload();if(saveBtn)saveBtn.style.display='none';
  }else if(file==='sepids-audit.html'){
    window.refreshData=()=>location.reload();if(saveBtn)saveBtn.style.display='none';
  }else{window.refreshData=originalRefresh;window.saveData=originalSave}
}

const oldLogout=window.logoutV5;window.logoutV5=function(){try{oldLogout?.()}finally{sessionStorage.removeItem('rayo_admin_user');location.href='index.html'}};
})();
