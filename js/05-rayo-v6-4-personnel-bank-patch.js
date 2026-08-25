
(function(){
'use strict';
let installed=false;
window.__rayoNativePersonnelAccessV953=true;
function normalizeBankFields(p){
  if(!p)return p;
  p.bankName=String(p.bankName||p.salaryBankName||'').trim();
  p.accountHolderName=String(p.accountHolderName||p.bankAccountHolder||'').trim();
  p.accountNumber=String(p.accountNumber||p.bankAccountNumber||'').trim();
  p.cardNumber=String(p.cardNumber||p.bankCardNumber||'').trim();
  p.iban=String(p.iban||p.bankIban||p.sheba||'').trim();
  return p;
}
function bankValue(id){const el=$(id);return el?String(el.value||'').trim():''}
function editPersonnelV64(id){
  const p=normalizeBankFields(id?person(id):{status:'فعال',personnelGroup:'سالن',section:'سالن',subSection:state.lists.hallSubSections?.[0]||'سالن بالا',mainPosition:'سالن‌کار',backupPosition:'',kitchenRank:'',transportMonthly:0,fixedAllowance:0,hourlyRate:0,monthlyCredit:0,mealCredit:0,gradeId:'D',experienceMonths:0});
  p.personnelGroup=p.personnelGroup||inferPersonnelGroupV5(p);
  $('modalTitle').textContent=id?'ویرایش پرسنل':'افزودن پرسنل';
  $('modalBody').innerHTML=`<div class="taxonomy-note">«سالن» یک سکشن اصلی است. سالن بالا و سالن پایین فقط به‌عنوان محدوده زیرمجموعه سکشن سالن ثبت می‌شوند.</div><div class="form-grid" style="margin-top:12px"><div class="field"><label>نام و نام خانوادگی</label><input id="pv_name" value="${esc(p.name||'')}"></div><div class="field"><label>گروه کلی</label><select id="pv_group" onchange="refreshPersonnelTaxonomyV63()">${PERSONNEL_TAXONOMY_V5.groups.map(x=>`<option ${x===p.personnelGroup?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>سکشن اصلی</label><select id="pv_section" onchange="refreshPersonnelTaxonomyV63()"></select></div><div class="field v63-subsection-field" id="pv_sub_wrap"><label>محدوده سکشن سالن</label><select id="pv_sub"></select></div><div class="field"><label>پوزیشن اصلی</label><select id="pv_main" onchange="refreshPersonnelRankV5()"></select></div><div class="field"><label>پوزیشن بک‌آپ</label><select id="pv_backup"></select></div><div class="field" id="pv_rank_wrap"><label>رده آشپزخانه</label><select id="pv_rank">${PERSONNEL_TAXONOMY_V5.kitchenRanks.map(x=>`<option ${x===(p.kitchenRank||'آشپز')?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>ملیت</label><select id="pv_nationality">${optionList(state.lists.nationalities,p.nationality)}</select></div><div class="field"><label>وضعیت بیمه</label><select id="pv_insurance">${optionList(state.lists.insuranceStatuses,p.insurance)}</select></div><div class="field"><label>تاریخ شروع</label><input id="pv_start" value="${esc(p.startDate||'')}" placeholder="1405/04/01"></div><div class="field"><label>شماره تماس</label><input id="pv_phone" value="${esc(p.phone||'')}"></div><div class="field"><label>نوع همکاری</label><select id="pv_employment">${optionList(state.lists.employmentTypes,p.employmentType)}</select></div><div class="field"><label>وضعیت همکاری</label><select id="pv_status">${optionList(state.lists.employmentStatuses,p.status)}</select></div><div class="field"><label>گرید مدل حقوق</label><select id="pv_grade">${['A','B','C','D'].map(x=>`<option ${x===(p.gradeId||'D')?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>سابقه قابل محاسبه (ماه)</label><input id="pv_exp" type="number" value="${v6Num(p.experienceMonths)}"></div><div class="field"><label>نرخ ساعتی توافق‌شده</label><input id="pv_hourly" type="text" inputmode="numeric" value="${v6Format(p.hourlyRate)}"></div><div class="field"><label>رفت‌وآمد ماهانه</label><input id="pv_transport" type="text" inputmode="numeric" value="${v6Format(p.transportMonthly)}"></div><div class="field"><label>فوق‌العاده ثابت</label><input id="pv_fixed" type="text" inputmode="numeric" value="${v6Format(p.fixedAllowance)}"></div><div class="field"><label>سقف اعتبار ماهانه</label><input id="pv_credit" type="text" inputmode="numeric" value="${v6Format(p.monthlyCredit)}"></div><div class="field"><label>سقف غذای پرسنلی</label><input id="pv_meal" type="text" inputmode="numeric" value="${v6Format(p.mealCredit)}"></div><div class="field full"><div class="taxonomy-note"><b>اطلاعات حساب دریافت حقوق</b><br><span class="muted">حساب می‌تواند به نام خود پرسنل یا شخص دیگری باشد.</span></div></div><div class="field"><label>نام صاحب حساب</label><input id="pv_account_holder" value="${esc(p.accountHolderName||'')}" autocomplete="off"></div><div class="field"><label>نام بانک</label><input id="pv_bank_name" value="${esc(p.bankName||'')}" autocomplete="off"></div><div class="field"><label>شماره کارت</label><input id="pv_card_number" value="${esc(p.cardNumber||'')}" inputmode="numeric" autocomplete="off" placeholder="16 رقم"></div><div class="field"><label>شماره حساب</label><input id="pv_account_number" value="${esc(p.accountNumber||'')}" inputmode="numeric" autocomplete="off"></div><div class="field full"><label>شماره شبا</label><input id="pv_iban" value="${esc(p.iban||'')}" dir="ltr" autocomplete="off" placeholder="IRxxxxxxxxxxxxxxxxxxxxxxxx"></div><div class="field full"><label>توضیحات</label><textarea id="pv_notes">${esc(p.notes||'')}</textarea></div></div>`;
  $('modalFoot').innerHTML=`<button class="btn" onclick="closeModal()">انصراف</button><button class="btn btn-primary" onclick="savePersonnelV64('${id||''}')">ذخیره</button>`;
  $('modalBackdrop').classList.add('open');
  refreshPersonnelTaxonomyV63(p.section,p.mainPosition,p.backupPosition,p.subSection);
  setTimeout(enhanceNumericUIV6,0);
}
async function savePersonnelV64(id){
  const g=$('pv_group').value,section=$('pv_section').value,subSection=(g==='سالن'&&section==='سالن')?($('pv_sub')?.value||''):'',main=$('pv_main').value,backup=$('pv_backup').value;
  if(!$('pv_name').value.trim())return toast('نام الزامی است',true);
  if(section==='سالن'&&!subSection)return toast('محدوده سالن را انتخاب کنید',true);
  if(!sectionsForGroupV51(g).includes(section)||!positionsForGroupV51(g).includes(main)||(backup&&!positionsForGroupV51(g).includes(backup)))return toast('ترکیب گروه، سکشن و پوزیشن معتبر نیست',true);
  const o={name:$('pv_name').value.trim(),personnelGroup:g,section,subSection,mainPosition:main,backupPosition:backup,kitchenRank:g==='آشپزخانه'?$('pv_rank').value:'',nationality:$('pv_nationality').value,insurance:$('pv_insurance').value,startDate:$('pv_start').value,phone:$('pv_phone').value,employmentType:$('pv_employment').value,status:$('pv_status').value,gradeId:$('pv_grade').value,experienceMonths:n($('pv_exp').value),hourlyRate:n($('pv_hourly').value),transportMonthly:n($('pv_transport').value),fixedAllowance:n($('pv_fixed').value),monthlyCredit:n($('pv_credit').value),mealCredit:n($('pv_meal').value),accountHolderName:bankValue('pv_account_holder'),bankName:bankValue('pv_bank_name'),cardNumber:bankValue('pv_card_number'),accountNumber:bankValue('pv_account_number'),iban:bankValue('pv_iban'),notes:$('pv_notes').value};
  let p;
  if(id){p=person(id);Object.assign(p,o)}else{p={id:uid('EMP',state.personnel,4),...o};state.personnel.push(p)}
  delete p.tipGroup;
  p.salaryProfile={position:main,grade:p.gradeId||'D',experienceMonths:p.experienceMonths||0,schedule:{weekdayMorning:0,weekdayEvening:0,thursdayMorning:0,thursdayEvening:0,fridayMorning:0,fridayEvening:0,fullWeekday:0,fullThursday:0,fullFriday:0},returnAid:0,incentive:0,contractMonthly:0,calculationMonth:parseJDate(todayJ()).m,updatedAt:new Date().toISOString(),...(p.salaryProfile||{}),position:main};
  closeModal();await commit(id?'ویرایش پرسنل':'افزودن پرسنل');
}
function install(){
  if(installed||typeof state==='undefined'||!state||typeof window.__RAYO_V63__==='undefined'){setTimeout(install,60);return}
  installed=true;
  state.personnel=(state.personnel||[]).map(normalizeBankFields);
  state.meta=state.meta||{};state.meta.schemaVersion='2.6.4';state.meta.source='Rayo HR Dashboard V6.4 — personnel banking details';
  const baseMigrate=migrate;
  migrate=function(d){const x=baseMigrate(d);x.personnel=(x.personnel||[]).map(normalizeBankFields);x.meta=x.meta||{};x.meta.schemaVersion='2.6.4';x.meta.source='Rayo HR Dashboard V6.4 — personnel banking details';return x};
  editPersonnel=editPersonnelV64;savePersonnelV63=savePersonnelV64;savePersonnelV5=savePersonnelV64;
  window.__rayoNativePersonnelAccessV953=true;window.editPersonnel=editPersonnelV64;window.savePersonnelV64=savePersonnelV64;
}

install();
})();
