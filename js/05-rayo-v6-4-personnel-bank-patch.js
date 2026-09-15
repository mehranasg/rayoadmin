
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
function openPersonnelModalAtTopV64(){
  const backdrop=$('modalBackdrop'),modal=backdrop?.querySelector('.modal'),body=$('modalBody');
  backdrop?.classList.add('open');
  if(modal)modal.scrollTop=0;if(body)body.scrollTop=0;
  requestAnimationFrame(()=>{if(modal)modal.scrollTop=0;if(body)body.scrollTop=0});
}
function refreshPersonnelEmploymentEndV64(){
  const wrap=$('pv_employment_end_wrap'),input=$('pv_employment_end');if(!wrap||!input)return;
  const ended=$('pv_status')?.value==='اتمام همکاری';wrap.hidden=!ended;input.required=ended;
}
const PERSONNEL_ACCOMMODATION_ITEMS_V64=['تیشرت','ایپرون','روپوش','کلاه','بیسیم','هندزفری بیسیم','پیجر','تشک','بالش','ملحفه'];
let personnelEquipmentEditingV64=[];
function normalizePersonnelAccommodationV64(p){
  const source=p?.accommodation&&typeof p.accommodation==='object'?p.accommodation:{};
  return{overnight:source.overnight===true,equipment:Array.isArray(source.equipment)?source.equipment:[]};
}
function readPersonnelAccommodationV64(){
  const hasEquipmentInputs=Boolean(document.querySelector('[data-accommodation-qty]'));
  const equipment=hasEquipmentInputs?PERSONNEL_ACCOMMODATION_ITEMS_V64.map((type,i)=>({type,quantity:Math.max(0,Math.floor(Number(document.querySelector(`[data-accommodation-qty="${i}"]`)?.value)||0)),deliveredAt:String(document.querySelector(`[data-accommodation-date="${i}"]`)?.value||'').trim(),notes:String(document.querySelector(`[data-accommodation-notes="${i}"]`)?.value||'').trim()})).filter(x=>x.quantity>0):personnelEquipmentEditingV64.map(x=>({...x}));
  return{overnight:$('pv_overnight')?.checked===true,equipment};
}
function renderPersonnelAccommodationV64(p){
  const form=document.querySelector('#modalBody .form-grid');if(!form||form.querySelector('.personnel-accommodation-v641'))return;
  const accommodation=normalizePersonnelAccommodationV64(p);personnelEquipmentEditingV64=accommodation.equipment.map(x=>({...x}));
  const section=document.createElement('section');section.className='personnel-accommodation-v641';section.style.cssText='grid-column:1/-1;border:2px solid #a6f4c5;background:#f6fef9;border-radius:14px;padding:14px;min-width:0';
  section.innerHTML=`<label style="display:flex;align-items:center;gap:8px;font-weight:800"><input id="pv_overnight" type="checkbox" ${accommodation.overnight?'checked':''}> این پرسنل شب‌خواب است</label>`;
  const notes=$('pv_notes')?.closest('.field');if(notes)notes.insertAdjacentElement('beforebegin',section);else form.appendChild(section);
  window.RayoJalali?.mark?.();
}
window.RayoPersonnelAccommodation={...(window.RayoPersonnelAccommodation||{}),items:PERSONNEL_ACCOMMODATION_ITEMS_V64.slice(),readForm:readPersonnelAccommodationV64,normalize:p=>{if(p)p.accommodation=normalizePersonnelAccommodationV64(p);return p}};
function editPersonnelV64(id){
  const p=normalizeBankFields(id?person(id):{status:'فعال',personnelGroup:'سالن',section:'سالن',subSection:state.lists.hallSubSections?.[0]||'سالن بالا',mainPosition:'سالن‌کار',backupPosition:'',kitchenRank:'',transportMonthly:0,fixedAllowance:0,hourlyRate:0,monthlyCredit:0,mealCredit:0,gradeId:'D',experienceMonths:0});
  p.personnelGroup=p.personnelGroup||inferPersonnelGroupV5(p);
  $('modalTitle').textContent=id?'ویرایش پرسنل':'افزودن پرسنل';
  $('modalBody').innerHTML=`<div class="taxonomy-note">«سالن» یک سکشن اصلی است. سالن بالا و سالن پایین فقط به‌عنوان محدوده زیرمجموعه سکشن سالن ثبت می‌شوند.</div><div class="form-grid" style="margin-top:12px"><div class="field"><label>نام و نام خانوادگی</label><input id="pv_name" value="${esc(p.name||'')}"></div><div class="field"><label>گروه کلی</label><select id="pv_group" onchange="refreshPersonnelTaxonomyV63()">${PERSONNEL_TAXONOMY_V5.groups.map(x=>`<option ${x===p.personnelGroup?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>سکشن اصلی</label><select id="pv_section" onchange="refreshPersonnelTaxonomyV63()"></select></div><div class="field v63-subsection-field" id="pv_sub_wrap"><label>محدوده سکشن سالن</label><select id="pv_sub"></select></div><div class="field"><label>پوزیشن اصلی</label><select id="pv_main" onchange="refreshPersonnelRankV5()"></select></div><div class="field"><label>پوزیشن بک‌آپ</label><select id="pv_backup"></select></div><div class="field" id="pv_rank_wrap"><label>رده آشپزخانه</label><select id="pv_rank">${PERSONNEL_TAXONOMY_V5.kitchenRanks.map(x=>`<option ${x===(p.kitchenRank||'آشپز')?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>ملیت</label><select id="pv_nationality">${optionList(state.lists.nationalities,p.nationality)}</select></div><div class="field"><label>وضعیت بیمه</label><select id="pv_insurance">${optionList(state.lists.insuranceStatuses,p.insurance)}</select></div><div class="field"><label>تاریخ شروع</label><input id="pv_start" value="${esc(p.startDate||'')}" placeholder="1405/04/01"></div><div class="field"><label>شماره تماس</label><input id="pv_phone" value="${esc(p.phone||'')}"></div><div class="field"><label>نوع همکاری</label><select id="pv_employment">${optionList(state.lists.employmentTypes,p.employmentType)}</select></div><div class="field"><label>وضعیت همکاری</label><select id="pv_status">${optionList(state.lists.employmentStatuses,p.status)}</select></div><div class="field full"><label>توضیحات</label><textarea id="pv_notes">${esc(p.notes||'')}</textarea></div></div>`;
  renderPersonnelAccommodationV64(p);
  const statusField=$('pv_status')?.closest('.field');
  if(statusField){
    $('pv_status').addEventListener('change',refreshPersonnelEmploymentEndV64);
    statusField.insertAdjacentHTML('afterend',`<div class="field" id="pv_employment_end_wrap"><label>تاریخ اتمام همکاری</label><input id="pv_employment_end" data-jalali="1" value="${esc(p.employmentEndDate||'')}" placeholder="1405/06/20"></div>`);
    refreshPersonnelEmploymentEndV64();window.RayoJalali?.mark?.();
  }
  $('modalFoot').innerHTML=`<button class="btn" onclick="closeModal()">انصراف</button><button class="btn btn-primary" onclick="savePersonnelV64('${id||''}')">ذخیره</button>`;
  openPersonnelModalAtTopV64();
  refreshPersonnelTaxonomyV63(p.section,p.mainPosition,p.backupPosition,p.subSection);
  setTimeout(enhanceNumericUIV6,0);
}
async function savePersonnelV64(id){
  const g=$('pv_group').value,section=$('pv_section').value,subSection=(g==='سالن'&&section==='سالن')?($('pv_sub')?.value||''):'',main=$('pv_main').value,backup=$('pv_backup').value;
  if(!$('pv_name').value.trim())return toast('نام الزامی است',true);
  if(section==='سالن'&&!subSection)return toast('محدوده سالن را انتخاب کنید',true);
  if(!sectionsForGroupV51(g).includes(section)||!positionsForGroupV51(g).includes(main)||(backup&&!positionsForGroupV51(g).includes(backup)))return toast('ترکیب گروه، سکشن و پوزیشن معتبر نیست',true);
  const status=$('pv_status').value,employmentEndDate=bankValue('pv_employment_end');
  if(status==='اتمام همکاری'&&!employmentEndDate)return toast('تاریخ اتمام همکاری الزامی است',true);
  if(employmentEndDate&&!parseJDate(employmentEndDate))return toast('تاریخ اتمام همکاری معتبر نیست',true);
  if(employmentEndDate&&parseJDate($('pv_start').value)&&dateCode(employmentEndDate)<dateCode($('pv_start').value))return toast('تاریخ اتمام همکاری نمی‌تواند قبل از تاریخ شروع باشد',true);
  const o={name:$('pv_name').value.trim(),personnelGroup:g,section,subSection,mainPosition:main,backupPosition:backup,kitchenRank:g==='آشپزخانه'?$('pv_rank').value:'',nationality:$('pv_nationality').value,insurance:$('pv_insurance').value,startDate:$('pv_start').value,phone:$('pv_phone').value,employmentType:$('pv_employment').value,status,accommodation:window.RayoPersonnelAccommodation?.readForm?.()||{overnight:false,equipment:[]},notes:$('pv_notes').value};
  let p;
  if(id){p=person(id);Object.assign(p,o)}else{p={id:uid('EMP',state.personnel,4),gradeId:'D',experienceMonths:0,hourlyRate:0,transportMonthly:0,fixedAllowance:0,monthlyCredit:0,mealCredit:0,salaryContract:{type:'hourly',monthlySalary:0},...o};state.personnel.push(p)}
  p.employmentEndDate=employmentEndDate;
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
  window.__rayoNativePersonnelAccessV953=true;window.editPersonnel=editPersonnelV64;window.savePersonnelV64=savePersonnelV64;window.refreshPersonnelEmploymentEndV64=refreshPersonnelEmploymentEndV64;window.openPersonnelModalAtTopV64=openPersonnelModalAtTopV64;
}

install();
})();
