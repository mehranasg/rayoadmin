/* Rayo UI Template — inventory page */
(function(){
'use strict';
const S=window.MOCK.stock;
const status=x=>x.qty<x.min?['bad','badge-danger','زیر حداقل']:x.qty<x.min*1.3?['warn','badge-warning','نزدیک حداقل']:['ok','badge-success','کافی'];
let cat='همه';

function renderKpis(){
  const value=S.reduce((s,x)=>s+x.value,0),low=S.filter(x=>x.qty<x.min).length,near=S.filter(x=>x.qty>=x.min&&x.qty<x.min*1.3).length;
  const k=[['ارزش موجودی','wallet',RT.money(value),'تومان'],['تعداد اقلام','boxes',RT.n(S.length),'قلم'],['زیر حداقل','alert-triangle',RT.n(low),'قلم'],['نزدیک حداقل','clock',RT.n(near),'قلم']];
  document.getElementById('stockKpis').innerHTML=k.map(([l,ic,v,u],i)=>`
    <div class="card kpi"><div class="kpi-top"><span class="kpi-label"><span class="kpi-icon" ${i===2?'style="background:var(--danger-soft);color:var(--danger)"':i===3?'style="background:var(--warning-soft);color:var(--warning)"':''}><i data-lucide="${ic}"></i></span>${l}</span></div>
    <div class="kpi-value">${v}<small>${u}</small></div></div>`).join('');
}
function renderChips(){
  const cats=['همه',...new Set(S.map(x=>x.cat))];
  document.getElementById('chips').innerHTML=cats.map(c=>`<button class="chip ${c===cat?'active':''}" data-cat="${c}">${c}<span class="count">${RT.n(c==='همه'?S.length:S.filter(x=>x.cat===c).length)}</span></button>`).join('');
  document.querySelectorAll('#chips .chip').forEach(b=>b.onclick=()=>{cat=b.dataset.cat;renderChips();renderTable()});
}
function renderTable(){
  const q=document.getElementById('q').value.trim();
  const rows=S.filter(x=>(cat==='همه'||x.cat===cat)&&(!q||x.name.includes(q)||x.code.toLowerCase().includes(q.toLowerCase())));
  document.getElementById('countInfo').textContent=`نمایش ${RT.n(rows.length)} از ${RT.n(S.length)} قلم`;
  document.getElementById('stockTable').innerHTML=`<thead><tr><th>کالا</th><th>دسته</th><th class="num">موجودی</th><th>سطح موجودی</th><th>وضعیت</th><th>سطح کنترل</th><th>آخرین شمارش</th><th class="num">ارزش (تومان)</th><th></th></tr></thead>
  <tbody>${rows.length?rows.map(x=>{const s=status(x);return`<tr>
    <td><div class="cell-main"><div class="thumb"><i data-lucide="${x.icon}"></i></div><div><b>${x.name}</b><small class="num" dir="ltr" style="text-align:right">${x.code}</small></div></div></td>
    <td class="muted">${x.cat}</td>
    <td class="num"><b>${RT.n1(x.qty)}</b> <span class="muted">${x.unit}</span></td>
    <td><div class="meter ${s[0]}" style="width:110px" title="حداقل ${RT.n(x.min)} · حداکثر ${RT.n(x.max)}"><i style="width:${Math.min(100,x.qty/x.max*100)}%"></i></div></td>
    <td><span class="badge ${s[1]}">${s[2]}</span></td>
    <td><span class="badge plain ${x.level==='دقیق'?'badge-accent':'badge-neutral'}">${x.level}</span></td>
    <td class="muted">${x.count}</td>
    <td class="num">${RT.n(x.value)}</td>
    <td><button class="btn btn-ghost btn-sm btn-icon" aria-label="بیشتر"><i data-lucide="ellipsis"></i></button></td>
  </tr>`}).join(''):`<tr><td colspan="9"><div class="empty"><div class="thumb"><i data-lucide="search-x"></i></div><h3>موردی پیدا نشد</h3><p>عبارت جستجو یا فیلتر را تغییر دهید.</p></div></td></tr>`}</tbody>`;
  RT.icons();
}
function renderReorder(){
  const rows=S.filter(x=>x.qty<x.min);
  document.getElementById('reorderTable').innerHTML=`<thead><tr><th>کالا</th><th class="num">موجودی</th><th class="num">حداقل</th><th class="num">پیشنهاد سفارش</th><th>تأمین‌کنندهٔ پیش‌فرض</th><th></th></tr></thead><tbody>${rows.map(x=>`<tr>
    <td><div class="cell-main"><div class="thumb" style="background:var(--danger-soft);color:var(--danger)"><i data-lucide="${x.icon}"></i></div><div><b>${x.name}</b><small>${x.cat}</small></div></div></td>
    <td class="num down">${RT.n1(x.qty)} ${x.unit}</td><td class="num muted">${RT.n(x.min)}</td>
    <td class="num"><b>${RT.n(x.max-x.qty)}</b> ${x.unit}</td><td>${x.cat==='لبنیات'?'لبنیات پگاه':x.cat==='سیروپ'?'رُست‌هاوس':'پک‌سازان'}</td>
    <td><label class="check"><input type="checkbox" checked>انتخاب</label></td></tr>`).join('')}</tbody>`;
}

document.addEventListener('DOMContentLoaded',()=>{
  renderKpis();renderChips();renderTable();renderReorder();
  document.getElementById('q').addEventListener('input',renderTable);
  RT.tabs(document.querySelector('[data-tabs="inv"]'));
  RT.icons();
});
})();
