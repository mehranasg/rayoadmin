(()=>{
'use strict';
const A=x=>Array.isArray(x)?x:[];
const S=x=>String(x??'').trim();
const E=s=>typeof esc==='function'?esc(s):String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const DEFAULT_PERMISSIONS={cashReport:false,purchaseRequests:false,purchaseInvoices:false,tips:false,surveys:false,suppliersView:false,inventoryWaste:false,inventoryTransfers:false,inventoryCounts:false,inventoryConsumption:false,reservations:false};
const LABELS={cashReport:'گزارش صندوق',purchaseRequests:'سفارش خرید',purchaseInvoices:'فاکتور خرید',tips:'انعام',surveys:'نظرسنجی',suppliersView:'مشاهده تأمین‌کنندگان',inventoryWaste:'ثبت ضایعات/پرتی',inventoryTransfers:'انتقال موجودی',inventoryCounts:'شمارش موجودی',inventoryConsumption:'ثبت مصرف مجاز',reservations:'ثبت رزرو و بیعانه'};
const ui={search:'',employmentStatus:'',accessStatus:''};
function people(){return A(state?.personnel)}
function activePersonnel(p){return S(p?.status)==='فعال'}
function perms(p){return {...DEFAULT_PERMISSIONS,...(p?.userAccess?.permissions||{})}}
function accessSummary(p){
  if(!S(p?.username)) return '<span class="badge warn">حساب تعریف نشده</span>';
  if(!activePersonnel(p)) return '<span class="badge danger">پرسنل غیرفعال</span>';
  return p?.userAccess?.enabled===true?'<span class="badge success">دسترسی فعال</span>':'<span class="badge warn">دسترسی غیرفعال</span>';
}
function permissionSummary(p){
  const enabled=Object.entries(perms(p)).filter(([,v])=>v).map(([k])=>LABELS[k]);
  return enabled.length?enabled.map(x=>`<span class="badge">${E(x)}</span>`).join(' '):'<span class="muted">بدون دسترسی اضافه</span>';
}
function filtered(){
  const q=S(ui.search).toLowerCase();
  return people().filter(p=>{
    if(ui.employmentStatus&&S(p?.status)!==ui.employmentStatus)return false;
    if(ui.accessStatus==='enabled'&&p?.userAccess?.enabled!==true)return false;
    if(ui.accessStatus==='disabled'&&(!S(p?.username)||p?.userAccess?.enabled===true))return false;
    if(ui.accessStatus==='undefined'&&S(p?.username))return false;
    if(!q)return true;
    return `${p.id||''} ${p.name||''} ${p.username||''} ${p.mainPosition||''} ${p.personnelGroup||''} ${p.section||''} ${p.subSection||''}`.toLowerCase().includes(q);
  });
}
function view(){
  const rows=filtered();
  return pageHead('مدیریت دسترسی‌ها','فعال یا غیرفعال‌کردن پنل پرسنل و تعریف یا ویرایش نام کاربری، رمز عبور و دسترسی‌ها')+
  `<div class="card"><div class="toolbar"><div class="field" style="min-width:260px"><label>جست‌وجو</label><input value="${E(ui.search)}" placeholder="نام، کد پرسنلی یا نام کاربری" oninput="RayoUserManagement.ui.search=this.value;renderView()"></div><div class="field"><label>وضعیت همکاری</label><select onchange="RayoUserManagement.ui.employmentStatus=this.value;renderView()"><option value="فعال" ${ui.employmentStatus==='فعال'?'selected':''}>فعال</option><option value="غیرفعال" ${ui.employmentStatus==='غیرفعال'?'selected':''}>غیرفعال</option><option value="" ${ui.employmentStatus===''?'selected':''}>همه پرسنل</option></select></div><div class="field"><label>دسترسی پنل</label><select onchange="RayoUserManagement.ui.accessStatus=this.value;renderView()"><option value="" ${ui.accessStatus===''?'selected':''}>همه</option><option value="enabled" ${ui.accessStatus==='enabled'?'selected':''}>فعال</option><option value="disabled" ${ui.accessStatus==='disabled'?'selected':''}>غیرفعال</option><option value="undefined" ${ui.accessStatus==='undefined'?'selected':''}>حساب تعریف نشده</option></select></div></div><div class="hint">به‌صورت پیش‌فرض همه پرسنل نمایش داده می‌شوند. برای محدودکردن لیست از فیلتر وضعیت همکاری یا وضعیت دسترسی پنل استفاده کنید.</div></div>`+
  `<div class="card"><div class="table-wrap"><table class="data-table"><thead><tr><th>کد</th><th>نام</th><th>گروه</th><th>سکشن / محدوده</th><th>پوزیشن</th><th>وضعیت همکاری</th><th>نام کاربری</th><th>دسترسی پنل</th><th></th></tr></thead><tbody>${rows.map(p=>`<tr><td>${E(p.id||'—')}</td><td><b>${E(p.name||'—')}</b></td><td>${E(p.personnelGroup||'—')}</td><td>${E([p.section,p.subSection].filter(Boolean).join(' / ')||'—')}</td><td>${E(p.mainPosition||'—')}</td><td>${typeof badge==='function'?badge(p.status||'نامشخص'):E(p.status||'نامشخص')}</td><td>${S(p.username)?`<b dir="ltr">${E(p.username)}</b>`:'<span class="muted">تعریف نشده</span>'}</td><td>${accessSummary(p)}</td><td><button class="btn btn-primary btn-sm" onclick="openUserManagementEditorV955('${E(p.id)}')">مدیریت دسترسی</button></td></tr>`).join('')||'<tr><td colspan="9" class="empty">پرسنلی با این فیلتر پیدا نشد.</td></tr>'}</tbody></table></div></div>`;
}

function openEditor(id){
  const p=people().find(x=>x.id===id);if(!p)return toast('پرسنل پیدا نشد',true);
  const pm=perms(p), isActive=activePersonnel(p);
  modalTitle.textContent=`مدیریت دسترسی — ${p.name}`;
  modalBody.innerHTML=`<div class="form-grid">
    <div class="field"><label>نام کاربری</label><input id="um_username" dir="ltr" autocomplete="off" value="${E(p.username||'')}"></div>
    <div class="field"><label>رمز عبور</label><div class="password-input-shell"><input id="um_password" type="password" dir="ltr" autocomplete="new-password" value="${E(p.userPassword||'')}"><button type="button" class="password-eye-btn" aria-label="نمایش رمز" onclick="RayoPassword.toggle('um_password',this)">${window.RayoPassword?.iconHtml?.()||'👁'}</button></div></div>
    <div class="field"><label>وضعیت دسترسی به پنل پرسنل</label><select id="um_enabled"><option value="true" ${p.userAccess?.enabled===true?'selected':''}>فعال</option><option value="false" ${p.userAccess?.enabled!==true?'selected':''}>غیرفعال</option></select></div>
    <div class="field"><label>وضعیت همکاری</label><div class="taxonomy-note" style="margin:0">${typeof badge==='function'?badge(p.status||'نامشخص'):E(p.status||'نامشخص')}</div></div>
    <div class="field full"><label>دسترسی‌های اضافه</label><div class="form-grid um-permission-grid">
      <label class="um-permission-option"><input type="checkbox" data-um-perm="cashReport" ${pm.cashReport?'checked':''}><span>ثبت گزارش صندوق روزانه</span></label>
      <label class="um-permission-option"><input type="checkbox" data-um-perm="purchaseRequests" ${pm.purchaseRequests?'checked':''}><span>ثبت سفارش خرید</span></label>
      <label class="um-permission-option"><input type="checkbox" data-um-perm="purchaseInvoices" ${pm.purchaseInvoices?'checked':''}><span>ثبت فاکتور خرید</span></label>
      <label class="um-permission-option"><input type="checkbox" data-um-perm="tips" ${pm.tips?'checked':''}><span>ثبت انعام</span></label>
      <label class="um-permission-option"><input type="checkbox" data-um-perm="surveys" ${pm.surveys?'checked':''}><span>ثبت نظرسنجی مشتری</span></label><label class="um-permission-option"><input type="checkbox" data-um-perm="suppliersView" ${pm.suppliersView?'checked':''}><span>مشاهده اطلاعات تأمین‌کنندگان</span></label>
      <label class="um-permission-option"><input type="checkbox" data-um-perm="inventoryWaste" ${pm.inventoryWaste?'checked':''}><span>ثبت ضایعات/پرتی مواد</span></label>
      <label class="um-permission-option"><input type="checkbox" data-um-perm="inventoryConsumption" ${pm.inventoryConsumption?'checked':''}><span>ثبت مصرف مجاز/پرسنلی</span></label>
      <label class="um-permission-option"><input type="checkbox" data-um-perm="inventoryTransfers" ${pm.inventoryTransfers?'checked':''}><span>ثبت انتقال موجودی</span></label>
      <label class="um-permission-option"><input type="checkbox" data-um-perm="inventoryCounts" ${pm.inventoryCounts?'checked':''}><span>ثبت شمارش موجودی</span></label>
      <label class="um-permission-option"><input type="checkbox" data-um-perm="reservations" ${pm.reservations?'checked':''}><span>ثبت رزرو و بیعانه (صندوقدار)</span></label>
    </div></div>
  </div>${!isActive?'<div class="hint" style="margin-top:12px">این پرسنل غیرفعال است؛ حتی با نام کاربری و رمز صحیح امکان ورود به پنل را ندارد.</div>':'<div class="hint" style="margin-top:12px">برای ورود، هم وضعیت همکاری پرسنل و هم دسترسی پنل باید فعال باشد.</div>'}`;
  modalFoot.innerHTML=`<button class="btn" onclick="closeModal()">انصراف</button><button class="btn btn-primary" onclick="saveUserManagementV955('${E(id)}')">ذخیره دسترسی</button>`;
  modalBackdrop.classList.add('open');
}
async function saveEditor(id){
  const p=people().find(x=>x.id===id);if(!p)return toast('پرسنل پیدا نشد',true);
  const username=S(document.getElementById('um_username')?.value), password=S(document.getElementById('um_password')?.value), enabled=document.getElementById('um_enabled')?.value==='true';
  const dup=username&&people().find(x=>x.id!==id&&S(x.username).toLowerCase()===username.toLowerCase());
  if(dup)return toast(`نام کاربری «${username}» قبلاً برای ${dup.name} ثبت شده است`,true);
  if(enabled&&(!username||!password))return toast('برای فعال‌کردن پنل، نام کاربری و رمز عبور الزامی است',true);
  const permissions={...DEFAULT_PERMISSIONS};document.querySelectorAll('[data-um-perm]').forEach(el=>permissions[el.dataset.umPerm]=el.checked);
  p.username=username;p.userPassword=password;p.userAccess={enabled,permissions,updatedAt:new Date().toISOString()};
  closeModal();
  if(typeof commit==='function')await commit('ویرایش دسترسی پنل پرسنل');
  else if(typeof saveData==='function')await saveData(true);
  renderView();toast('دسترسی پنل پرسنل ذخیره شد');
}
function install(){
  if(typeof views==='undefined'||typeof titles==='undefined'||typeof state==='undefined'||!state)return setTimeout(install,80);
  titles.userManagement='مدیریت دسترسی‌ها';views.userManagement=view;
  Object.assign(window,{RayoUserManagement:{ui},openUserManagementEditorV955:openEditor,saveUserManagementV955:saveEditor});
  const file=(location.pathname.split('/').pop()||'').toLowerCase(),q=new URLSearchParams(location.search).get('view');
  if(file==='personnel.html'&&q==='userManagement')(currentView==='userManagement'&&renderView());
}
install();
})();
