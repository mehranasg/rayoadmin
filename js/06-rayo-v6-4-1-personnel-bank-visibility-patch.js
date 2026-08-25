
(function(){
'use strict';
let installed=false;
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
  @media(max-width:680px){.bank-grid-v641{grid-template-columns:1fr}.bank-card-v641{padding:12px}.bank-card-v641 .bank-title-v641{align-items:flex-start;flex-direction:column}}
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
  editPersonnelV64(id);
  setTimeout(enhanceBankFormV641,0);
}
function openPersonnelBankV641(id){
  editPersonnelV641(id);
  setTimeout(()=>document.querySelector('.bank-card-v641')?.scrollIntoView({behavior:'smooth',block:'start'}),80);
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
function viewsPersonnelV641(){
  const q=(ui.personnelSearch||'').toLowerCase();
  const items=state.personnel.filter(p=>(p.name+p.id+p.mainPosition+(p.section||'')+(p.subSection||'')+(p.personnelGroup||'')+(p.bankName||'')+(p.accountHolderName||'')+(p.cardNumber||'')+(p.accountNumber||'')+(p.iban||'')+(p.username||'')).toLowerCase().includes(q));
  return pageHead('لیست پرسنل','اطلاعات پایه، حساب دریافت حقوق و حساب کاربری پنل هر نیرو.',`<button class="btn btn-primary" onclick="editPersonnel()">+ افزودن پرسنل</button>`)+`<div class="card"><div class="toolbar"><div class="field"><label>جست‌وجو</label><input value="${esc(ui.personnelSearch)}" data-live-filter="ui.personnelSearch" oninput="rayoLiveFilter(this,ui,'personnelSearch')" placeholder="نام، کد، سکشن، پوزیشن، بانک یا نام کاربری"></div><button class="btn" onclick="goView('staffingCapacity')">تحلیل ظرفیت پرسنل</button></div></div><div class="card"><div class="table-wrap"><table class="data-table"><thead><tr><th>کد</th><th>نام</th><th>گروه</th><th>سکشن / محدوده</th><th>پوزیشن اصلی</th><th>رده آشپزخانه</th><th>بک‌آپ</th><th>بیمه</th><th>شروع کار</th><th>نرخ توافقی ساعتی</th><th>حساب حقوق</th><th>حساب کاربری</th><th>وضعیت</th><th></th></tr></thead><tbody>${items.map(p=>`<tr><td>${p.id}</td><td><b>${esc(p.name)}</b></td><td><span class="group-badge ${groupClassV5(p.personnelGroup)}">${esc(p.personnelGroup||inferPersonnelGroupV5(p))}</span></td><td>${esc(v63LocationLabel(p.section,p.subSection))}</td><td>${esc(p.mainPosition||'—')}</td><td>${esc(p.kitchenRank||'—')}</td><td>${esc(p.backupPosition||'—')}</td><td>${badge(p.insurance||'نامشخص')}</td><td>${esc(p.startDate||'—')}</td><td>${tomanV6(p.hourlyRate)}</td><td>${bankSummaryV641(p)}</td><td>${userAccessSummaryV953(p)}</td><td>${badge(p.status)}</td><td><button class="btn btn-sm" onclick="editPersonnel('${p.id}')">ویرایش</button> <button class="btn btn-sm" onclick="openPersonnelAccessV953('${p.id}')">نام کاربری / رمز</button> <button class="btn btn-sm" onclick="openPersonnelBankV641('${p.id}')">حساب حقوق</button> <button class="btn btn-sm" onclick="openPersonnelSalaryForecastV62('${p.id}')">پیش‌بینی حقوق</button> <button class="btn btn-danger btn-sm" onclick="removeItem('personnel','${p.id}','حذف پرسنل')">حذف</button></td></tr>`).join('')||'<tr><td colspan="14" class="empty">رکوردی نیست.</td></tr>'}</tbody></table></div></div>`;
}
function install(){
  if(installed||typeof state==='undefined'||!state||typeof window.editPersonnelV64!=='function'||typeof views==='undefined'){setTimeout(install,60);return}
  installed=true;addStyle();
  editPersonnel=editPersonnelV641;window.editPersonnel=editPersonnelV641;window.openPersonnelBankV641=openPersonnelBankV641;window.openPersonnelAccessV953=openPersonnelAccessV953;window.savePersonnelAccessV954=savePersonnelAccessV954;
  viewsPersonnel=viewsPersonnelV641;views.personnel=viewsPersonnelV641;
  state.meta=state.meta||{};state.meta.schemaVersion='2.6.4.1';state.meta.source='Rayo HR Dashboard V6.4.1 — visible personnel banking section';
  renderView();
}
install();
})();
