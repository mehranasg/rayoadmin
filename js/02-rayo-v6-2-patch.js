
(function(){
'use strict';
const V62_HALL_GROUP_DEFAULTS=['سالن بالا','سالن پایین'];
let V62_INSTALLED=false;
let V62_ORIGINAL_SETTINGS=null,V62_ORIGINAL_PERSONNEL=null;
function v62EnsureState(){
  if(typeof state==='undefined'||!state)return;
  state.settings=state.settings||{};
  delete state.settings.monthlyBudget;
  delete state.settings.salaryCeiling;
  state.lists=state.lists||{};
  if(!Array.isArray(state.lists.hallGroups)||!state.lists.hallGroups.length)state.lists.hallGroups=[...V62_HALL_GROUP_DEFAULTS];
  state.meta=state.meta||{};
  state.meta.schemaVersion='2.6.2';
  state.meta.source='Rayo HR Dashboard V6.2 — focused fixes';
}
function salaryQuickCalculatorV62(){
  const d=state.salaryModel.draft||{};
  const hoursValue=(d.quickMonthlyHours===undefined||d.quickMonthlyHours===null)?'190':(v6Num(d.quickMonthlyHours) ? v6Num(d.quickMonthlyHours) : '');
  const hourlyValue=v6Num(d.quickHourlyRate)?v6Format(d.quickHourlyRate):'';
  const monthlyValue=v6Num(d.quickMonthlySalary)?v6Format(d.quickMonthlySalary):'';
  return `<div class="form-grid"><div class="field"><label>نوع ورودی</label><select id="salv6_quickMode" onchange="salaryQuickChangedV6()"><option value="hourly" ${d.quickMode==='hourly'?'selected':''}>حقوق ساعتی</option><option value="monthly" ${d.quickMode==='monthly'?'selected':''}>حقوق ماهانه</option></select></div><div class="field"><label>ساعت ماهانه</label><input id="salv6_quickHours" type="number" step="1" value="${hoursValue}" oninput="salaryQuickChangedV6()"></div><div class="field"><label>حقوق ساعتی (تومان)</label><input id="salv6_quickHourly" data-v6-money="1" type="text" inputmode="numeric" value="${hourlyValue}" onfocus="this.value=v6Digits(this.value).replace(/[٬,\\s]/g,'')" oninput="salaryQuickChangedV6()" onblur="salaryQuickBlurV62(this)"></div><div class="field"><label>حقوق ماهانه (تومان)</label><input id="salv6_quickMonthly" data-v6-money="1" type="text" inputmode="numeric" value="${monthlyValue}" onfocus="this.value=v6Digits(this.value).replace(/[٬,\\s]/g,'')" oninput="salaryQuickChangedV6()" onblur="salaryQuickBlurV62(this)"></div></div><div class="notice success" id="salv6_quickResult">—</div>`;
}
function salaryQuickChangedV62(){
  const d=state.salaryModel.draft=state.salaryModel.draft||{};
  const mode=$('salv6_quickMode')?.value||'hourly';
  const hoursEl=$('salv6_quickHours'),hourlyEl=$('salv6_quickHourly'),monthlyEl=$('salv6_quickMonthly');
  const hoursBlank=!String(hoursEl?.value??'').trim(),hours=hoursBlank?0:v6Num(hoursEl.value);
  d.quickMode=mode;d.quickMonthlyHours=hours;
  if(mode==='hourly'){
    const blank=!String(hourlyEl?.value??'').trim();
    d.quickHourlyRate=blank?0:salaryRound(v6Num(hourlyEl.value));
    d.quickMonthlySalary=blank||!hours?0:salaryRound(d.quickHourlyRate*hours);
    if(monthlyEl&&document.activeElement!==monthlyEl)monthlyEl.value=d.quickMonthlySalary?v6Format(d.quickMonthlySalary):'';
  }else{
    const blank=!String(monthlyEl?.value??'').trim();
    d.quickMonthlySalary=blank?0:salaryRound(v6Num(monthlyEl.value));
    d.quickHourlyRate=blank||!hours?0:salaryRound(d.quickMonthlySalary/hours);
    if(hourlyEl&&document.activeElement!==hourlyEl)hourlyEl.value=d.quickHourlyRate?v6Format(d.quickHourlyRate):'';
  }
  const result=$('salv6_quickResult');
  if(result)result.textContent=(!hours||(!d.quickHourlyRate&&!d.quickMonthlySalary))?'برای محاسبه، ساعت ماهانه و مبلغ را وارد کنید.':`ساعتی ${tomanV6(d.quickHourlyRate)} — ماهانه ${tomanV6(d.quickMonthlySalary)}`;
  saveData(false);
}
function salaryQuickBlurV62(el){
  if(String(el.value||'').trim())el.value=v6Format(v6Num(el.value));
  salaryQuickChangedV62();
}
function viewsSettingsV62(){
  v62EnsureState();
  let out=V62_ORIGINAL_SETTINGS();
  out=out.replace(/<div class="field"><label>بودجه حقوق<\/label><input[^>]*id="set_monthlyBudget"[^>]*><\/div>/,'');
  out=out.replace(/<div class="field"><label>سقف دریافتی<\/label><input[^>]*id="set_salaryCeiling"[^>]*><\/div>/,'');
  out=out.replace('گروه‌های سالن — هر مورد در یک خط','محدوده‌های سکشن سالن (پیش‌فرض: سالن بالا و سالن پایین) — هر مورد در یک خط');
  return out;
}
function saveListsV62(){
  qsa('[id^=list_]').forEach(e=>state.lists[e.id.slice(5)]=e.value.split('\n').map(x=>x.trim()).filter(Boolean));
  if(!state.lists.hallGroups.length)state.lists.hallGroups=[...V62_HALL_GROUP_DEFAULTS];
  commit('ویرایش فهرست‌ها');
}
function viewsPersonnelV62(){
  let out=V62_ORIGINAL_PERSONNEL();
  return out.replace(/(<button class="btn btn-sm" onclick="editPersonnel\('([^']+)'\)">ویرایش<\/button>)/g,(m,button,id)=>`${button} <button class="btn btn-sm" onclick="openPersonnelSalaryForecastV62('${id}')">پیش‌بینی حقوق</button>`);
}
function personnelForecastStartMonthV62(year){
  const now=parseJDate(todayJ());
  return Number(year)===Number(now.y)?now.m:1;
}
function renderPersonnelSalaryForecastV62(id,forcedYear){
  const p=person(id);if(!p)return;
  const now=parseJDate(todayJ()),year=Math.floor(v6Num(forcedYear??$('pfv62_year')?.value)||now.y),start=personnelForecastStartMonthV62(year),cfg=salaryYearConfigV6(year),profile=salaryProfileOf(p),weeklyUnits=Object.values(normalizeScheduleByDayV6(profile.scheduleByDay)).reduce((s,x)=>s+scheduleShiftUnitsV6(x),0);
  const rows=[];let totalNet=0,totalMeals=0,totalReturns=0,totalHours=0;
  for(let month=start;month<=12;month++){
    const r=personnelForecastV6(p,year,month);totalNet+=r.finalNet;totalMeals+=r.mealMonthly;totalReturns+=r.returnMonthly;totalHours+=r.monthlyHours;
    rows.push(`<tr><td>${monthName(month)} ${year}</td><td>${v6Format(r.shiftUnits)}</td><td>${v6Format(r.monthlyHours,1)}</td><td>${tomanV6(r.agreedHourly)}</td><td>${tomanV6(r.baseMonthly)}</td><td>${tomanV6(r.mealMonthly)}</td><td>${tomanV6(r.returnMonthly)}</td><td>${tomanV6(r.incentive)}</td><td><b>${tomanV6(r.finalNet)}</b></td></tr>`);
  }
  const warnings=[];
  if(!v6Num(p.hourlyRate))warnings.push('نرخ توافقی ساعتی ثبت نشده و پیش‌بینی موقتاً با نرخ پیشنهادی مدل انجام شده است.');
  if(!weeklyUnits)warnings.push('برنامه کاری توافق‌شده برای این نیرو ثبت نشده است.');
  if(!cfg.isExact)warnings.push(`پایه حقوق سال ${year} تعریف نشده و آخرین پایه ثبت‌شده به‌صورت موقت استفاده شده است.`);
  $('modalTitle').textContent=`پیش‌بینی حقوق دریافتی — ${p.name}`;
  $('modalBody').innerHTML=`<div class="toolbar"><div class="field"><label>سال پیش‌بینی</label><input id="pfv62_year" type="number" value="${year}"></div><button class="btn btn-primary" onclick="renderPersonnelSalaryForecastV62('${id}')">محاسبه</button></div>${warnings.length?`<div class="notice warning">${warnings.map(esc).join('<br>')}</div>`:''}<div class="personnel-forecast-summary-v62"><div class="metric"><span>جمع دریافتی تا پایان سال</span><b>${tomanV6(totalNet)}</b></div><div class="metric"><span>جمع ساعات پیش‌بینی‌شده</span><b>${v6Format(totalHours,1)} ساعت</b></div><div class="metric"><span>غذا و برگشت</span><b>${tomanV6(totalMeals+totalReturns)}</b></div></div><div class="hint">محاسبه بر اساس برنامه کاری توافق‌شده، نرخ ساعتی ثبت‌شده، روزهای واقعی تقویم و تعطیلات رسمی است. برای سال جدید، ابتدا پایه حقوق همان سال را در تنظیمات مدل حقوق ثبت کنید.</div><div class="table-wrap" style="margin-top:12px"><table class="data-table"><thead><tr><th>ماه</th><th>شیفت</th><th>ساعت</th><th>نرخ توافقی</th><th>حقوق ساعت</th><th>غذا</th><th>برگشت</th><th>کارانه</th><th>دریافتی تخمینی</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
  $('modalFoot').innerHTML=`<button class="btn" onclick="closeModal()">بستن</button>`;
  setTimeout(enhanceNumericUIV6,0);
}
function openPersonnelSalaryForecastV62(id){
  $('modalBackdrop').classList.add('open');
  renderPersonnelSalaryForecastV62(id);
}
function installV62(){
  if(V62_INSTALLED||typeof state==='undefined'||!state||typeof viewsSettings!=='function'||typeof viewsPersonnel!=='function')return;
  V62_INSTALLED=true;v62EnsureState();
  V62_ORIGINAL_SETTINGS=viewsSettings;
  V62_ORIGINAL_PERSONNEL=viewsPersonnel;
  window.salaryQuickCalculatorV6=salaryQuickCalculatorV62;
  window.salaryQuickChangedV6=salaryQuickChangedV62;
  salaryCalcAfterRender=function(){salaryCalcChangedV6();salaryQuickChangedV62()};
  viewsSettings=viewsSettingsV62;viewsPersonnel=viewsPersonnelV62;
  views.settings=viewsSettingsV62;views.personnel=viewsPersonnelV62;
  saveLists=saveListsV62;
  window.salaryQuickChangedV6=salaryQuickChangedV62;
  window.salaryQuickBlurV62=salaryQuickBlurV62;
  window.openPersonnelSalaryForecastV62=openPersonnelSalaryForecastV62;
  window.renderPersonnelSalaryForecastV62=renderPersonnelSalaryForecastV62;
  window.saveLists=saveListsV62;
  renderView();
}
(function waitV62(){if(typeof state!=='undefined'&&state&&typeof views!=='undefined'&&typeof viewsPersonnel==='function')installV62();else setTimeout(waitV62,50)})();
})();
