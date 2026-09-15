
(function(){
'use strict';
let installed=false;
const ACCOMMODATION_ITEMS=['تیشرت','ایپرون','روپوش','کلاه','بیسیم','هندزفری بیسیم','پیجر','تشک','بالش','ملحفه'];
function normalizeAccommodation(p){
  if(!p)return p;
  const source=p.accommodation&&typeof p.accommodation==='object'?p.accommodation:{};
  p.accommodation={overnight:source.overnight===true,equipment:Array.isArray(source.equipment)?source.equipment.filter(x=>x&&ACCOMMODATION_ITEMS.includes(String(x.type||''))).map(x=>({type:String(x.type),quantity:Math.max(0,Math.floor(Number(x.quantity)||0)),deliveredAt:String(x.deliveredAt||''),notes:String(x.notes||'')})).filter(x=>x.quantity>0):[]};
  return p;
}
function accommodationItem(p,type){return normalizeAccommodation(p).accommodation.equipment.find(x=>x.type===type)||{type,quantity:0,deliveredAt:'',notes:''}}
function readAccommodationForm(){
  const equipment=ACCOMMODATION_ITEMS.map((type,i)=>({type,quantity:Math.max(0,Math.floor(Number(document.querySelector(`[data-accommodation-qty="${i}"]`)?.value)||0)),deliveredAt:String(document.querySelector(`[data-accommodation-date="${i}"]`)?.value||'').trim(),notes:String(document.querySelector(`[data-accommodation-notes="${i}"]`)?.value||'').trim()})).filter(x=>x.quantity>0);
  return{overnight:document.getElementById('pv_overnight')?.checked===true,equipment};
}
function enhanceAccommodationForm(p){
  const form=document.querySelector('#modalBody .form-grid');if(!form||form.querySelector('.personnel-accommodation-v641'))return;
  normalizeAccommodation(p);
  const section=document.createElement('section');section.className='personnel-accommodation-v641';
  section.innerHTML=`<div class="accommodation-title-v641"><span>🌙 اسکان شبانه و وسایل تحویلی</span><label><input id="pv_overnight" type="checkbox" ${p.accommodation.overnight?'checked':''}> این پرسنل شب‌خواب است</label></div><div class="table-wrap"><table class="data-table"><thead><tr><th>وسیله</th><th>تعداد تحویل</th><th>تاریخ تحویل</th><th>توضیحات</th></tr></thead><tbody>${ACCOMMODATION_ITEMS.map((type,i)=>{const x=accommodationItem(p,type);return`<tr><td>${esc(type)}</td><td><input data-accommodation-qty="${i}" type="number" min="0" step="1" value="${x.quantity||0}"></td><td><input data-accommodation-date="${i}" data-jalali="1" placeholder="1405/06/01" value="${esc(x.deliveredAt)}"></td><td><input data-accommodation-notes="${i}" placeholder="وضعیت یا توضیح تحویل" value="${esc(x.notes)}"></td></tr>`}).join('')}</tbody></table></div><div class="hint">فقط ردیف‌هایی که تعداد آن‌ها بیشتر از صفر باشد در پرونده ذخیره می‌شوند.</div>`;
  const notes=document.getElementById('pv_notes')?.closest('.field');if(notes)notes.insertAdjacentElement('beforebegin',section);else form.appendChild(section);
  window.RayoJalali?.mark?.();
}
function accommodationSummary(p){const rows=normalizeAccommodation(p).accommodation.equipment;return rows.length?rows.map(x=>`${esc(x.type)}: <b>${x.quantity.toLocaleString('fa-IR')}</b>${x.deliveredAt?` <small>(${esc(x.deliveredAt)})</small>`:''}`).join('<br>'):'<span class="muted">وسیله‌ای ثبت نشده</span>'}
function addStyle(){
  if(document.getElementById('rayo-v641-bank-style'))return;
  const st=document.createElement('style');st.id='rayo-v641-bank-style';st.textContent=`
  .bank-card-v641{grid-column:1/-1;border:1px solid #b2ddff;background:#f5fbff;border-radius:14px;padding:14px;margin:2px 0 4px;min-width:0}
  .bank-card-v641 .bank-title-v641{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:11px;color:#175cd3;font-weight:800}
  .bank-card-v641 .bank-title-v641 small{color:#475467;font-weight:500}
  .bank-grid-v641{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
  .bank-grid-v641 .field{min-width:0}
  .bank-grid-v641 input{width:100%}
  .bank-status-v641{display:inline-flex;flex-direction:column;gap:2px;max-width:190px}
  .bank-status-v641 b{font-size:12px}.bank-status-v641 small{font-size:10px;color:var(--muted)}
  .personnel-accommodation-v641{grid-column:1/-1;border:1px solid #d0d5dd;background:#fcfcfd;border-radius:14px;padding:14px;min-width:0}
  .accommodation-title-v641{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px;font-weight:800}.accommodation-title-v641 label{display:flex;align-items:center;gap:7px;font-weight:600}.personnel-accommodation-v641 input{min-width:110px;width:100%}
  @media(max-width:680px){.bank-grid-v641{grid-template-columns:1fr}.bank-card-v641,.personnel-accommodation-v641{padding:12px}.bank-card-v641 .bank-title-v641,.accommodation-title-v641{align-items:flex-start;flex-direction:column}}
  `;document.head.appendChild(st);
}
function enhanceBankFormV641(){
  addStyle();
  const ids=['pv_account_holder','pv_bank_name','pv_card_number','pv_account_number','pv_iban'];
  const fields=ids.map(id=>document.getElementById(id)?.closest('.field')).filter(Boolean);
  if(fields.length!==5||document.querySelector('.bank-card-v641'))return;
  const oldNote=[...document.querySelectorAll('#modalBody .taxonomy-note')].find(x=>x.textContent.includes('اطلاعات حساب دریافت حقوق'))?.closest('.field');
  if(oldNote)oldNote.remove();
  const card=document.createElement('section');card.className='bank-card-v641';
  card.innerHTML='<div class="bank-title-v641"><span>🏦 اطلاعات حساب دریافت حقوق</span><small>حساب می‌تواند به نام خود پرسنل یا شخص دیگری باشد.</small></div><div class="bank-grid-v641"></div>';
  const grid=card.querySelector('.bank-grid-v641');fields.forEach(f=>grid.appendChild(f));
  const phone=document.getElementById('pv_phone')?.closest('.field');
  const form=document.querySelector('#modalBody .form-grid');
  if(phone&&phone.parentNode===form)phone.insertAdjacentElement('afterend',card);else form?.prepend(card);
}
function editPersonnelV641(id){
  const p=normalizeAccommodation(id?person(id):{accommodation:{overnight:false,equipment:[]}});
  editPersonnelV64(id);
  setTimeout(()=>enhanceAccommodationForm(p),0);
}
function normalizeSalaryContractV641(p){
  if(!p)return p;const source=p.salaryContract&&typeof p.salaryContract==='object'?p.salaryContract:{};
  p.salaryContract={...source,type:source.type==='fixedMonthly'?'fixedMonthly':'hourly',monthlySalary:Math.max(0,n(source.monthlySalary)),updatedAt:String(source.updatedAt||'')};return p;
}
function refreshSalaryContractV641(){const fixed=$('pb_contract_type')?.value==='fixedMonthly';if($('pb_hourly_wrap'))$('pb_hourly_wrap').hidden=fixed;if($('pb_monthly_wrap'))$('pb_monthly_wrap').hidden=!fixed}
function openPersonnelBankV641(id){
  const p=normalizeSalaryContractV641(person(id));if(!p)return toast('پرسنل پیدا نشد',true);
  $('modalTitle').textContent=`حساب حقوق — ${p.name}`;
  $('modalBody').innerHTML=`<div class="form-grid"><div class="field"><label>نوع محاسبه حقوق</label><select id="pb_contract_type" onchange="refreshSalaryContractV641()"><option value="hourly" ${p.salaryContract.type==='hourly'?'selected':''}>ساعتی بر اساس کارکرد</option><option value="fixedMonthly" ${p.salaryContract.type==='fixedMonthly'?'selected':''}>ثابت ماهانه، مستقل از ساعت</option></select></div><div class="field" id="pb_hourly_wrap"><label>نرخ ساعتی توافق‌شده (تومان)</label><input id="pb_hourly" inputmode="numeric" value="${v6Format(p.hourlyRate)}"></div><div class="field" id="pb_monthly_wrap"><label>حقوق ثابت ماهانه (تومان)</label><input id="pb_monthly_salary" inputmode="numeric" value="${v6Format(p.salaryContract.monthlySalary)}"></div><div class="field"><label>گرید مدل حقوق</label><select id="pb_grade">${['A','B','C','D'].map(x=>`<option ${x===(p.gradeId||'D')?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>سابقه قابل محاسبه (ماه)</label><input id="pb_exp" type="number" min="0" value="${v6Num(p.experienceMonths)}"></div><div class="field"><label>رفت‌وآمد ماهانه (تومان)</label><input id="pb_transport" inputmode="numeric" value="${v6Format(p.transportMonthly)}"></div><div class="field"><label>فوق‌العاده ثابت (تومان)</label><input id="pb_fixed" inputmode="numeric" value="${v6Format(p.fixedAllowance)}"></div><div class="field"><label>سقف اعتبار ماهانه (تومان)</label><input id="pb_credit" inputmode="numeric" value="${v6Format(p.monthlyCredit)}"></div><div class="field"><label>سقف غذای پرسنلی (تومان)</label><input id="pb_meal" inputmode="numeric" value="${v6Format(p.mealCredit)}"></div><section class="bank-card-v641"><div class="bank-title-v641"><span>🏦 اطلاعات حساب دریافت حقوق</span><small>حساب می‌تواند به نام خود پرسنل یا شخص دیگری باشد.</small></div><div class="bank-grid-v641"><div class="field"><label>نام صاحب حساب</label><input id="pb_account_holder" value="${esc(p.accountHolderName||'')}"></div><div class="field"><label>نام بانک</label><input id="pb_bank_name" value="${esc(p.bankName||'')}"></div><div class="field"><label>شماره کارت</label><input id="pb_card_number" value="${esc(p.cardNumber||'')}" inputmode="numeric" placeholder="16 رقم"></div><div class="field"><label>شماره حساب</label><input id="pb_account_number" value="${esc(p.accountNumber||'')}" inputmode="numeric"></div><div class="field"><label>شماره شبا</label><input id="pb_iban" value="${esc(p.iban||'')}" dir="ltr" placeholder="IRxxxxxxxxxxxxxxxxxxxxxxxx"></div></div></section></div><div class="hint">در حالت ثابت ماهانه، مبلغ پایه بدون توجه به ساعت کارکرد و تأخیر محاسبه می‌شود؛ مزایا، کسورات، بیمه و پرداخت‌ها طبق روال فعلی اعمال می‌شوند.</div>`;
  $('modalFoot').innerHTML=`<button class="btn" onclick="closeModal()">انصراف</button><button class="btn btn-primary" onclick="savePersonnelBankV641('${id}')">ذخیره حساب حقوق</button>`;
  (window.openPersonnelModalAtTopV64||(()=>$('modalBackdrop').classList.add('open')))();refreshSalaryContractV641();setTimeout(enhanceNumericUIV6,0);
}
async function savePersonnelBankV641(id){
  const p=person(id);if(!p)return toast('پرسنل پیدا نشد',true);const selectedType=$('pb_contract_type').value,monthlySalary=n($('pb_monthly_salary').value),hourlyRate=n($('pb_hourly').value),type=selectedType==='fixedMonthly'||monthlySalary>0?'fixedMonthly':'hourly';
  if(type==='fixedMonthly'&&monthlySalary<=0)return toast('مبلغ حقوق ثابت ماهانه باید بیشتر از صفر باشد',true);if(type==='hourly'&&hourlyRate<=0)return toast('نرخ ساعتی توافق‌شده باید بیشتر از صفر باشد',true);
  p.salaryContract={...(p.salaryContract||{}),type,monthlySalary:type==='fixedMonthly'?monthlySalary:0,updatedAt:new Date().toISOString()};p.hourlyRate=type==='hourly'?hourlyRate:n(p.hourlyRate);p.gradeId=$('pb_grade').value;p.experienceMonths=Math.max(0,n($('pb_exp').value));p.transportMonthly=n($('pb_transport').value);p.fixedAllowance=n($('pb_fixed').value);p.monthlyCredit=n($('pb_credit').value);p.mealCredit=n($('pb_meal').value);
  p.accountHolderName=String($('pb_account_holder').value||'').trim();p.bankName=String($('pb_bank_name').value||'').trim();p.cardNumber=String($('pb_card_number').value||'').trim();p.accountNumber=String($('pb_account_number').value||'').trim();p.iban=String($('pb_iban').value||'').trim();p.salaryProfile={schedule:{},...(p.salaryProfile||{}),position:p.mainPosition,grade:p.gradeId,experienceMonths:p.experienceMonths,updatedAt:new Date().toISOString()};
  closeModal();await commit('ویرایش حساب و قرارداد حقوق پرسنل');renderView();toast('حساب حقوق پرسنل ذخیره شد');
}
function userAccessSummaryV953(p){const has=Boolean(p?.username),enabled=p?.userAccess?.enabled===true;return has?`<span class="bank-status-v641"><b dir="ltr">${esc(p.username)}</b><small>${enabled?'پنل فعال':'پنل غیرفعال'}</small></span>`:'<span class="badge warn">ثبت نشده</span>'}
function personnelPermissionsV954(p){return {cashReport:false,purchaseRequests:false,purchaseInvoices:false,tips:false,surveys:false,suppliersView:false,...(p?.userAccess?.permissions||{})}}
function openPersonnelAccessV953(id){
  const p=(state.personnel||[]).find(x=>x.id===id);if(!p)return toast('پرسنل پیدا نشد',true);const perm=personnelPermissionsV954(p);
  $('modalTitle').textContent=`نام کاربری و رمز عبور — ${p.name}`;
  $('modalBody').innerHTML=`<div class="form-grid"><div class="field"><label>نام کاربری</label><input id="pa_username" dir="ltr" autocomplete="off" value="${esc(p.username||'')}"></div><div class="field"><label>رمز عبور</label><div class="password-input-shell"><input id="pa_password" type="password" dir="ltr" autocomplete="new-password" value="${esc(p.userPassword||'')}"><button type="button" class="password-eye-btn" aria-label="نمایش رمز" onclick="RayoPassword.toggle('pa_password',this)">${window.RayoPassword?.iconHtml?.()||'👁'}</button></div></div><div class="field"><label>دسترسی به پنل</label><select id="pa_enabled"><option value="true" ${p.userAccess?.enabled===true?'selected':''}>فعال</option><option value="false" ${p.userAccess?.enabled!==true?'selected':''}>غیرفعال</option></select></div><div class="field"><label>وضعیت همکاری</label><div class="taxonomy-note" style="margin:0">${badge(p.status||'نامشخص')}</div></div><div class="field full"><label>دسترسی‌های اضافه</label><div class="form-grid"><label><input type="checkbox" data-pa-perm="cashReport" ${perm.cashReport?'checked':''}> ثبت گزارش صندوق روزانه</label><label><input type="checkbox" data-pa-perm="purchaseRequests" ${perm.purchaseRequests?'checked':''}> ثبت سفارش خرید</label><label><input type="checkbox" data-pa-perm="purchaseInvoices" ${perm.purchaseInvoices?'checked':''}> ثبت فاکتور خرید</label><label><input type="checkbox" data-pa-perm="tips" ${perm.tips?'checked':''}> ثبت انعام</label><label><input type="checkbox" data-pa-perm="surveys" ${perm.surveys?'checked':''}> ثبت نظرسنجی مشتری</label><label><input type="checkbox" data-pa-perm="suppliersView" ${perm.suppliersView?'checked':''}> مشاهده اطلاعات تأمین‌کنندگان</label></div></div></div><div class="hint" style="margin-top:12px">ورود به پنل فقط برای پرسنلی که «وضعیت همکاری = فعال» دارند و دسترسی پنل آن‌ها فعال است امکان‌پذیر است.</div>`;
  $('modalFoot').innerHTML=`<button class="btn" onclick="closeModal()">انصراف</button><button class="btn btn-primary" onclick="savePersonnelAccessV954('${id}')">ذخیره حساب کاربری</button>`;$('modalBackdrop').classList.add('open');
}
async function savePersonnelAccessV954(id){
  const p=(state.personnel||[]).find(x=>x.id===id);if(!p)return toast('پرسنل پیدا نشد',true);const username=String($('pa_username')?.value||'').trim(),password=String($('pa_password')?.value||'').trim(),enabled=$('pa_enabled')?.value==='true';
  const duplicate=username&&(state.personnel||[]).find(x=>x.id!==id&&String(x.username||'').trim().toLowerCase()===username.toLowerCase());if(duplicate)return toast(`نام کاربری «${username}» قبلاً برای ${duplicate.name} ثبت شده است`,true);if(enabled&&(!username||!password))return toast('برای فعال‌کردن پنل، نام کاربری و رمز عبور الزامی است',true);
  const permissions={cashReport:false,purchaseRequests:false,purchaseInvoices:false,tips:false,surveys:false,suppliersView:false};document.querySelectorAll('[data-pa-perm]').forEach(x=>permissions[x.dataset.paPerm]=x.checked);
  p.username=username;p.userPassword=password;p.userAccess={enabled,permissions,updatedAt:new Date().toISOString()};closeModal();await commit('ویرایش نام کاربری و دسترسی پنل پرسنل');renderView();toast('حساب کاربری پرسنل ذخیره شد');
}
function bankSummaryV641(p){
  const has=Boolean(p?.bankName||p?.accountHolderName||p?.cardNumber||p?.accountNumber||p?.iban);
  if(!has)return '<span class="badge warn">ثبت نشده</span>';
  return `<span class="bank-status-v641"><b>${esc(p.bankName||'بانک ثبت نشده')}</b><small>${esc(p.accountHolderName||'نام صاحب حساب ثبت نشده')}</small></span>`;
}
function salaryContractSummaryV641(p){normalizeSalaryContractV641(p);return p.salaryContract.type==='fixedMonthly'?`<span class="badge success">ثابت: ${tomanV6(p.salaryContract.monthlySalary)}</span>`:`<span class="badge">ساعتی: ${tomanV6(p.hourlyRate)}</span>`}
function viewsPersonnelV641(){
  const q=(ui.personnelSearch||'').toLowerCase();
  const items=state.personnel.filter(p=>(p.name+p.id+p.mainPosition+(p.section||'')+(p.subSection||'')+(p.personnelGroup||'')+(p.bankName||'')+(p.accountHolderName||'')+(p.cardNumber||'')+(p.accountNumber||'')+(p.iban||'')+(p.username||'')).toLowerCase().includes(q));
  const totalPersonnel=state.personnel.length;
  const overnight=state.personnel.filter(p=>normalizeAccommodation(p).accommodation.overnight),activeOvernight=overnight.filter(p=>p.status==='فعال');
  return pageHead('لیست پرسنل','اطلاعات پایه، اسکان شبانه، وسایل تحویلی، حساب حقوق و حساب کاربری هر نیرو.',`<button class="btn btn-primary" onclick="editPersonnel()">+ افزودن پرسنل</button>`)+`<div class="grid grid-2"><div class="card kpi"><div class="label">پرسنل شب‌خواب فعال</div><div class="value">${activeOvernight.length.toLocaleString('fa-IR')}</div><div class="sub">نفر</div></div><div class="card kpi"><div class="label">کل پرونده‌های شب‌خواب</div><div class="value">${overnight.length.toLocaleString('fa-IR')}</div><div class="sub">شامل غیرفعال‌ها</div></div></div><div class="card"><div class="toolbar"><div class="field"><label>جست‌وجو</label><input value="${esc(ui.personnelSearch)}" data-live-filter="ui.personnelSearch" oninput="rayoLiveFilter(this,ui,'personnelSearch')" placeholder="نام، کد، سکشن، پوزیشن، بانک یا نام کاربری"></div><button class="btn" onclick="goView('staffingCapacity')">تحلیل ظرفیت پرسنل</button></div></div><div class="card"><div class="section-head"><h2>فهرست پرسنل</h2><div><span class="badge">کل پرسنل: ${totalPersonnel.toLocaleString('fa-IR')}</span> <span class="badge success">فیلترشده: ${items.length.toLocaleString('fa-IR')}</span></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>کد</th><th>نام</th><th>گروه</th><th>سکشن / محدوده</th><th>پوزیشن اصلی</th><th>شب‌خواب</th><th>وسایل تحویلی</th><th>حساب حقوق</th><th>حساب کاربری</th><th>وضعیت</th><th></th></tr></thead><tbody>${items.map(p=>`<tr><td>${p.id}</td><td><b>${esc(p.name)}</b></td><td><span class="group-badge ${groupClassV5(p.personnelGroup)}">${esc(p.personnelGroup||inferPersonnelGroupV5(p))}</span></td><td>${esc(v63LocationLabel(p.section,p.subSection))}</td><td>${esc(p.mainPosition||'—')}</td><td>${badge(normalizeAccommodation(p).accommodation.overnight?'بله':'خیر')}</td><td>${accommodationSummary(p)}</td><td>${bankSummaryV641(p)}</td><td>${userAccessSummaryV953(p)}</td><td>${badge(p.status)}</td><td><button class="btn btn-sm" onclick="editPersonnel('${p.id}')">ویرایش</button> <button class="btn btn-sm" onclick="openPersonnelAccessV953('${p.id}')">نام کاربری / رمز</button> <button class="btn btn-sm" onclick="openPersonnelBankV641('${p.id}')">حساب حقوق</button> <button class="btn btn-sm" onclick="openPersonnelSalaryForecastV62('${p.id}')">پیش‌بینی حقوق</button> <button class="btn btn-danger btn-sm" onclick="removeItem('personnel','${p.id}','حذف پرسنل')">حذف</button></td></tr>`).join('')||'<tr><td colspan="11" class="empty">رکوردی نیست.</td></tr>'}</tbody></table></div></div>`;
}
function install(){
  if(installed||typeof state==='undefined'||!state||typeof window.editPersonnelV64!=='function'||typeof views==='undefined'){setTimeout(install,60);return}
  installed=true;addStyle();
  state.personnel=(state.personnel||[]).map(normalizeAccommodation).map(normalizeSalaryContractV641);
  const baseMigrate=migrate;migrate=function(d){const x=baseMigrate(d);x.personnel=(x.personnel||[]).map(normalizeAccommodation).map(normalizeSalaryContractV641);return x};
  editPersonnel=editPersonnelV641;window.editPersonnel=editPersonnelV641;window.openPersonnelBankV641=openPersonnelBankV641;window.openPersonnelSalaryAccountV641=openPersonnelBankV641;window.savePersonnelBankV641=savePersonnelBankV641;window.refreshSalaryContractV641=refreshSalaryContractV641;window.openPersonnelAccessV953=openPersonnelAccessV953;window.savePersonnelAccessV954=savePersonnelAccessV954;
  viewsPersonnel=viewsPersonnelV641;views.personnel=viewsPersonnelV641;
  window.RayoPersonnelAccommodation={items:ACCOMMODATION_ITEMS.slice(),readForm:readAccommodationForm,normalize:normalizeAccommodation};
  state.meta=state.meta||{};state.meta.schemaVersion='2.6.4.2';state.meta.source='Rayo HR Dashboard V6.4.2 — overnight personnel and issued equipment';
  renderView();
}
install();
})();
