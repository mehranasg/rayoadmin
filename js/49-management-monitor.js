(()=>{'use strict';
/* Management monitor (index.html?view=monitor): the restaurant's state at a glance for the owner.
   Read-only: every figure comes from the owning module's own calculation (finance 20: obligations, checks, monthly P&L;
   inventory 32: current position value and waste estimate; 40: reorder assessment; assets 12: valuation; HR 00: payroll
   month metrics; cash reports through the finance support data). Nothing is written and no module is initialized. */
if(window.__RAYO_MONITOR_INSTALLED)return;window.__RAYO_MONITOR_INSTALLED=true;
const A=x=>Array.isArray(x)?x:[],S=x=>String(x??'').trim(),N=x=>{const n=Number(x);return Number.isFinite(n)?n:0},E=x=>S(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const F=(x,d=0)=>N(x).toLocaleString('fa-IR',{maximumFractionDigits:d}),M=x=>x===null||x===undefined?'—':`${F(Math.round(x))} تومان`;
const MONTHS=['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
const today=()=>window.RayoJalali?.today?.()||(typeof todayJ==='function'?todayJ():'');
const st={loading:false,loadedAt:'',data:null,errors:[]};
function short(v){if(v===null||v===undefined)return'—';v=Math.round(N(v));const a=Math.abs(v);return a>=1e9?`${(v/1e9).toLocaleString('fa-IR',{maximumFractionDigits:2})} میلیارد`:a>=1e6?`${(v/1e6).toLocaleString('fa-IR',{maximumFractionDigits:1})} میلیون`:F(v)}
function axisLabel(r,n){const fa=v=>String(v).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);return n<=8?MONTHS[r.m-1]:fa(String(r.y).slice(2)+'/'+String(r.m).padStart(2,'0'))}
function monthLabel(y,m){return `${MONTHS[m-1]} ${y.toLocaleString('fa-IR',{useGrouping:false})}`}
function addMonth(y,m,step){m+=step;while(m<1){m+=12;y--}while(m>12){m-=12;y++}return[y,m]}
function activeReport(r){return r&&r.isArchived!==true&&!['void','cancelled','ابطال‌شده'].includes(r.status)}
function sales(r){return(N(r.netReceivable)+N(r.snappAmount))/10}
async function step(name,fn){try{return await fn()}catch(e){st.errors.push(`${name}: ${e?.message||e}`);return null}}
async function load(force=false){if(st.loading||(st.data&&!force))return;st.loading=true;st.errors=[];if(typeof renderView==='function'&&currentView==='monitor')renderView();
 const t=today(),[ty,tm]=t.split('/').map(Number),d={today:t,year:ty,month:tm};
 const finOk=await step('مالی',()=>window.RayoFinanceLedger?.load?.());
 const L=window.RayoFinanceLedger,support=finOk?L.support():{};
 if(finOk){d.ledger=await step('تعهدات',()=>L.summary());
  const reports=A(support.cash?.reports).filter(activeReport),first=reports.map(r=>S(r.date)).filter(x=>/^\d{4}\/\d{2}/.test(x)).sort()[0]||t;let [y,m]=first.split('/').map(Number),guard=0;if(ty*12+tm-(y*12+m)>35)[y,m]=addMonth(ty,tm,-35);
  d.months=[];let cum=0;while((y<ty||(y===ty&&m<=tm))&&guard++<40){const c=L.monthCalc(y,m);cum+=N(c.profit);d.months.push({y,m,label:monthLabel(y,m),sales:N(c.sales),purchases:N(c.purchases),payroll:N(c.payroll)+N(c.bonus),other:N(c.otherExpense)-N(c.otherIncome),tax:N(c.vat)+N(c.tax),profit:N(c.profit),cum,payrollFinal:!!c.auto?.payrollSource?.startsWith('سند')});[y,m]=addMonth(y,m,1)}
  const inMonth=(r,yy,mm)=>S(r.date).startsWith(`${yy}/${String(mm).padStart(2,'0')}`),[py,pm]=addMonth(ty,tm,-1),day=+t.split('/')[2],mrows=reports.filter(r=>inMonth(r,ty,tm)),prevSame=reports.filter(r=>inMonth(r,py,pm)&&+S(r.date).split('/')[2]<=day),yest=(()=>{const ds=reports.map(r=>S(r.date)).filter(x=>x<t).sort();return ds.at(-1)})();
  d.cash={todayReport:reports.find(r=>S(r.date)===t)||null,todaySales:reports.filter(r=>S(r.date)===t).reduce((a,r)=>a+sales(r),0),lastDate:yest||'',lastSales:reports.filter(r=>S(r.date)===yest).reduce((a,r)=>a+sales(r),0),monthSales:mrows.reduce((a,r)=>a+sales(r),0),monthDays:mrows.length,prevSameSales:prevSame.reduce((a,r)=>a+sales(r),0),variance:mrows.reduce((a,r)=>a+N(r.finalVariance),0)/10,badDays:mrows.filter(r=>Math.abs(N(r.finalVariance))>(N(support.cash?.settings?.discrepancyLimit)||1000000)).length,missingDays:Math.max(0,day-new Set(mrows.map(r=>S(r.date))).size)}}
 d.inventory=await step('انبار',async()=>{if(!await window.RayoInventoryV10?.ensure?.())throw Error('بارگذاری انبار انجام نشد');const p=window.getPricingState?.()||{},inv=window.getInventoryState?.()||{},ings=A(p.ingredients).filter(i=>i.status!=='غیرفعال'&&i.itemType!=='NON_STOCK');let value=0,incomplete=0,reorder=0;for(const i of ings){const pos=window.RayoOpsAnalytics.currentPosition(i.id,t);if(Number.isFinite(pos?.value))value+=pos.value;else incomplete++;try{if(window.RayoReorder?.assess?.(i,inv,pos)?.need)reorder++}catch(_){}}
  const mk=`${t.slice(0,7)}`,waste=[...A(inv.wasteRecords),...A(inv.consumptionRecords)].filter(w=>S(w.date).startsWith(mk)&&w.status!=='void'&&S(w.reviewStatus)!=='ردشده'&&['WASTE','SPILL','EXPIRY','BREAKAGE','MISSING'].includes(S(w.eventType)||'WASTE')),wasteValue=waste.reduce((a,w)=>a+N(window.RayoInventoryV10.wasteEstimate?.(w.type==='menu'||w.type==='asset'?w.type:'ingredient',w.itemId,N(w.quantity),w.date)),0),pendingWaste=[...A(inv.wasteRecords),...A(inv.consumptionRecords)].filter(w=>w.reportedByPersonnelId&&w.status!=='void'&&!['تأییدشده','ضایعات ثبت‌شده','موجه','بسته‌شده','ردشده'].includes(S(w.reviewStatus))).length;
  return{value,incomplete,items:ings.length,reorder,wasteValue,wasteCount:waste.length,pendingCounts:A(inv.stocktakes).filter(x=>x.status==='submitted').length,pendingWaste}});
 d.assets=await step('اموال',async()=>{await window.amEnsureLoaded?.(true);return window.getAssetsValuation?.()??null});
 d.hr=await step('پرسنل',()=>{if(typeof state==='undefined'||!state||typeof monthMetrics!=='function')return null;const mm=monthMetrics(ty,tm);return{unpaid:N(mm.unpaid),net:N(mm.net),incomplete:mm.incompleteCount||0,active:A(state.personnel).filter(p=>p.status==='فعال').length,pendingLeave:A(state.leaveRequests).filter(x=>x.status==='در انتظار').length}});
 st.data=d;st.loading=false;st.loadedAt=new Date().toLocaleTimeString('fa-IR',{hour:'2-digit',minute:'2-digit'});if(typeof renderView==='function'&&currentView==='monitor')renderView()}
/* KPI value: amounts of a billion or more are shortened, the exact figure stays in the tooltip. */
function money(v){return v===null||v===undefined?'—':Math.abs(N(v))>=1e9?`<span title="${E(M(v))}">${short(v)} تومان</span>`:M(v)}
function kpi(label,value,sub='',cls=''){return `<div class="card kpi mon-kpi ${cls}"><div class="label">${label}</div><div class="value">${value}</div>${sub?`<div class="sub">${sub}</div>`:''}</div>`}
/* Bars with a zero baseline (profit/loss: teal above, orange below), one series; hover title on every bar. */
function barChart(rows,key,title,polar){if(!rows.length)return '<div class="empty">داده‌ای برای نمودار نیست.</div>';const W=520,H=230,pl=92,pr=8,pt=14,pb=30,iw=W-pl-pr,ih=H-pt-pb,vals=rows.map(r=>r[key]),hi=Math.max(0,...vals),lo=Math.min(0,...vals),span=(hi-lo)||1,y=v=>pt+(hi-v)/span*ih,bw=Math.max(4,Math.min(34,iw/rows.length*0.6)),x=i=>pl+(i+.5)*iw/rows.length,every=Math.max(1,Math.ceil(rows.length/12));
 return `<svg class="mon-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${E(title)}" style="direction:ltr">${[hi,(hi+lo)/2,lo].map(v=>`<line x1="${pl}" x2="${W-pr}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" class="mon-grid"/><text x="${pl-6}" y="${(y(v)+4).toFixed(1)}" text-anchor="end">${E(short(v))}</text>`).join('')}<line x1="${pl}" x2="${W-pr}" y1="${y(0).toFixed(1)}" y2="${y(0).toFixed(1)}" class="mon-axis"/>
 ${rows.map((r,i)=>{const v=r[key],top=Math.min(y(v),y(0)),h=Math.max(1,Math.abs(y(v)-y(0)));return `<g class="mon-bar ${polar&&v<0?'neg':'pos'}"><rect x="${(x(i)-bw/2).toFixed(1)}" y="${top.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="3"/><rect class="hit" x="${(x(i)-iw/rows.length/2).toFixed(1)}" y="${pt}" width="${(iw/rows.length).toFixed(1)}" height="${ih}"><title>${E(r.label)}: ${E(M(v))}</title></rect></g>`}).join('')}
 ${rows.map((r,i)=>i%every===0||i===rows.length-1?`<text x="${x(i).toFixed(1)}" y="${H-12}" text-anchor="middle">${E(axisLabel(r,rows.length))}</text>`:'').join('')}</svg>`}
function lineChart(rows,key,title){if(!rows.length)return '<div class="empty">داده‌ای برای نمودار نیست.</div>';const W=520,H=210,pl=92,pr=8,pt=14,pb=30,iw=W-pl-pr,ih=H-pt-pb,vals=rows.map(r=>r[key]),hi=Math.max(0,...vals),lo=Math.min(0,...vals),span=(hi-lo)||1,y=v=>pt+(hi-v)/span*ih,x=i=>pl+(rows.length>1?i*iw/(rows.length-1):iw/2),every=Math.max(1,Math.ceil(rows.length/12)),pts=rows.map((r,i)=>`${x(i).toFixed(1)},${y(r[key]).toFixed(1)}`).join(' ');
 return `<svg class="mon-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${E(title)}" style="direction:ltr">${[hi,(hi+lo)/2,lo].map(v=>`<line x1="${pl}" x2="${W-pr}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" class="mon-grid"/><text x="${pl-6}" y="${(y(v)+4).toFixed(1)}" text-anchor="end">${E(short(v))}</text>`).join('')}<line x1="${pl}" x2="${W-pr}" y1="${y(0).toFixed(1)}" y2="${y(0).toFixed(1)}" class="mon-axis"/><polyline class="mon-line" points="${pts}"/>
 ${rows.map((r,i)=>`<circle class="mon-dot ${r[key]<0?'neg':''}" cx="${x(i).toFixed(1)}" cy="${y(r[key]).toFixed(1)}" r="4"><title>${E(r.label)}: ${E(M(r[key]))}</title></circle>`).join('')}
 ${rows.map((r,i)=>i%every===0||i===rows.length-1?`<text x="${x(i).toFixed(1)}" y="${H-12}" text-anchor="middle">${E(axisLabel(r,rows.length))}</text>`:'').join('')}</svg>`}
function alerts(d){const out=[],add=(level,text,href)=>out.push(`<a class="mon-alert ${level}" href="${href}"><span class="mon-alert-dot" aria-hidden="true"></span><span>${text}</span><b aria-hidden="true">‹</b></a>`);
 if(d.cash&&!d.cash.todayReport)add('warn',`گزارش صندوق امروز (${E(d.today)}) هنوز ثبت نشده است`,'cash-report-admin.html?tab=entry');
 if(d.cash?.missingDays>1)add('warn',`${F(d.cash.missingDays)} روز از این ماه گزارش صندوق ندارد`,'cash-report-admin.html?tab=reports');
 if(d.cash?.badDays)add('bad',`${F(d.cash.badDays)} روز این ماه مغایرت صندوق بیش از حد مجاز دارد`,'cash-report-admin.html?tab=reports');
 if(d.ledger?.overdue>0)add('bad',`تعهدات سررسیدگذشته: ${M(d.ledger.overdue)}`,'finance.html?view=payables');
 if(d.inventory?.reorder)add('warn',`${F(d.inventory.reorder)} قلم به نقطهٔ سفارش رسیده است`,'inventory.html?tab=reorder');
 if(d.inventory?.pendingCounts)add('warn',`${F(d.inventory.pendingCounts)} شمارش انبار منتظر تأیید مدیر است`,'inventory.html?tab=count');
 if(d.inventory?.pendingWaste)add('warn',`${F(d.inventory.pendingWaste)} گزارش ضایعات پرسنل منتظر بررسی است`,'inventory.html?tab=waste');
 if(d.inventory?.incomplete)add('info',`ارزش ${F(d.inventory.incomplete)} قلم انبار به‌علت نبود قیمت یا شمارش ناقص است`,'inventory.html?tab=stock');
 if(d.hr?.pendingLeave)add('info',`${F(d.hr.pendingLeave)} درخواست مرخصی در انتظار پاسخ`,'personnel.html?view=leaveRequests');
 return out.length?out.join(''):'<div class="success-box">مورد فوری برای پیگیری وجود ندارد.</div>'}
function view(){const head=typeof pageHead==='function'?pageHead('پنل مانیتورینگ',st.loadedAt?`وضعیت لحظه‌ای مجموعه — آخرین به‌روزرسانی ${st.loadedAt}`:'وضعیت لحظه‌ای مجموعه',`<button class="btn" ${st.loading?'disabled':''} onclick="RayoMonitor.refresh()">${st.loading?'<span class="btn-spinner" aria-hidden="true"></span> در حال دریافت…':'↻ به‌روزرسانی'}</button>`):'';
 if(!st.data){setTimeout(()=>load(),0);return head+'<div class="card empty" role="status"><span class="btn-spinner" aria-hidden="true"></span> در حال جمع‌آوری اطلاعات همهٔ بخش‌ها…</div>'}
 const d=st.data,inv=d.inventory,l=d.ledger,c=d.cash,cur=d.months?.at(-1),prev=d.months?.at(-2),growth=c&&c.prevSameSales?(c.monthSales/c.prevSameSales-1)*100:null,payables=l?N(l.payable)+N(l.supplierDebt):null,
  net=[inv?.value,l?.receivable,d.assets].every(v=>v===null||v===undefined)?null:N(inv?.value)+N(l?.receivable)-N(payables)-N(d.hr?.unpaid),months=A(d.months),total=months.reduce((a,x)=>a+x.profit,0);
 return head+`${st.errors.length?`<div class="notice danger">بخشی از اطلاعات دریافت نشد و در محاسبه نیامده است: ${E(st.errors.join(' | '))}</div>`:''}
 <div class="mon-section"><h2>موارد نیازمند توجه</h2><div class="mon-alerts">${alerts(d)}</div></div>
 <div class="mon-section"><h2>وضعیت جاری دارایی و تعهدات</h2><div class="grid grid-4">
 ${kpi('ارزش موجودی انبار',money(inv?.value??null),inv?`${F(inv.items)} قلم${inv.incomplete?` — ${F(inv.incomplete)} قلم ناقص`:''}`:'دریافت نشد')}
 ${kpi('طلب‌ها (مطالبات)',M(l?.receivable??null),l?`چک دریافتی وصول‌نشده: ${M(l.receivedChecks)}`:'دریافت نشد','pos')}
 ${kpi('بدهی‌ها',M(payables),l?`تأمین‌کنندگان ${M(l.supplierDebt)} + سایر ${M(l.payable)}`:'دریافت نشد','neg')}
 ${kpi('حقوق پرداخت‌نشدهٔ این ماه',M(d.hr?.unpaid??null),d.hr?`حقوق خالص پیش‌بینی ${M(d.hr.net)} — ${F(d.hr.active)} نفر فعال`:'دریافت نشد')}
 ${kpi('چک‌های صادرهٔ پاس‌نشده',M(l?.issuedChecks??null),l?`سررسیدگذشته: ${M(l.overdue)}`:'')}
 ${kpi('ارزش روز اموال',money(d.assets??null),'تجهیزات و دارایی‌های ثابت')}
 ${kpi('خالص وضعیت جاری (تقریبی)',money(net),'موجودی انبار + طلب − بدهی − حقوق پرداخت‌نشده',net!==null&&net<0?'neg':'pos')}
 ${kpi('ضایعات این ماه',M(inv?.wasteValue??null),inv?`<a href="inventory.html?tab=reports">${F(inv.wasteCount)} رویداد — گزارش کامل</a>`:'')}
 </div></div>
 <div class="mon-section"><h2>عملکرد ${E(monthLabel(d.year,d.month))}</h2><div class="grid grid-4">
 ${kpi('فروش امروز',c?.todayReport?M(c.todaySales):'ثبت نشده',c?.lastDate?`آخرین روز ثبت‌شده قبل (${E(c.lastDate)}): ${M(c.lastSales)}`:'')}
 ${kpi('فروش ماه تا امروز',money(c?.monthSales??null),c?`${F(c.monthDays)} روز ثبت‌شده${growth!==null?` — <span class="${growth<0?'mon-neg':'mon-pos'}">${growth>=0?'+':''}${F(growth,1)}٪</span> نسبت به همین بازهٔ ماه قبل`:''}`:'')}
 ${kpi('میانگین فروش روزانه',M(c&&c.monthDays?c.monthSales/c.monthDays:null),'بر اساس روزهای ثبت‌شده')}
 ${kpi('سود/زیان مدیریتی ماه',money(cur?.profit??null),cur?`${cur.payrollFinal?'':'حقوق ماه هنوز قطعی نشده — '}ماه قبل: ${M(prev?.profit??null)}`:'',cur&&cur.profit<0?'neg':'pos')}
 </div></div>
 <div class="mon-section grid grid-2"><div class="card"><div class="section-head"><h2>سود و زیان ماهانه</h2><span class="muted">از ${E(months[0]?.label||'—')}</span></div><div class="mon-legend"><span><i class="pos"></i>سود</span><span><i class="neg"></i>زیان</span></div>${barChart(months,'profit','سود و زیان ماهانه',true)}</div>
 <div class="card"><div class="section-head"><h2>سود و زیان تجمعی از ابتدا</h2><b class="${total<0?'mon-neg':'mon-pos'}">${M(total)}</b></div>${lineChart(months,'cum','سود و زیان تجمعی')}</div></div>
 <div class="mon-section grid grid-2"><div class="card"><div class="section-head"><h2>فروش ماهانه</h2><a class="btn btn-sm" href="cash-report-admin.html?tab=trend">روند کامل</a></div>${barChart(months,'sales','فروش ماهانه',false)}</div>
 <div class="card"><div class="section-head"><h2>ترکیب هزینه‌ها — ${E(cur?.label||'')}</h2></div>${cur?costMix(cur):'<div class="empty">—</div>'}</div></div>
 <details class="card"><summary><b>جدول ماهانه (منبع نمودارها)</b></summary><div class="table-wrap"><table class="data-table" data-pagination="native"><thead><tr><th>ماه</th><th>فروش</th><th>خرید</th><th>حقوق و پاداش</th><th>سایر هزینه (خالص)</th><th>مالیات و ارزش افزوده</th><th>سود/زیان</th><th>تجمعی</th></tr></thead><tbody>${months.slice().reverse().map(x=>`<tr><td>${E(x.label)}</td><td>${M(x.sales)}</td><td>${M(x.purchases)}</td><td>${M(x.payroll)}${x.payrollFinal?'':'<br><small class="muted">قطعی نشده</small>'}</td><td>${M(x.other)}</td><td>${M(x.tax)}</td><td class="${x.profit<0?'mon-neg':''}"><b>${M(x.profit)}</b></td><td class="${x.cum<0?'mon-neg':''}">${M(x.cum)}</td></tr>`).join('')}</tbody></table></div><p class="muted">سود/زیان همان محاسبهٔ «امور مالی ← سود و زیان» است (فروش صندوق، فاکتورهای خرید، سند قطعی حقوق، هزینه‌ها و مالیات تخمینی با اصلاحات دستی ماه).</p></details>`}
function costMix(x){const parts=[['خرید مواد',x.purchases],['حقوق و پاداش',x.payroll],['سایر هزینه‌ها',Math.max(0,x.other)],['مالیات و ارزش افزوده',x.tax]],sum=parts.reduce((a,p)=>a+Math.max(0,p[1]),0)||1;return `<div class="mon-mix">${parts.map(([l,v])=>`<div class="mon-mix-row"><span>${l}</span><span class="mon-mix-track"><i style="width:${(Math.max(0,v)/sum*100).toFixed(1)}%"></i></span><b>${F(x.sales?v/x.sales*100:0,1)}٪ فروش</b><small>${M(v)}</small></div>`).join('')}</div>`}
function install(){if(typeof views==='undefined'||typeof titles==='undefined')return setTimeout(install,100);if(views.monitor)return;views.monitor=view;titles.monitor='پنل مانیتورینگ';window.RayoMonitor={refresh:()=>load(true),data:()=>st.data};if(typeof currentView!=='undefined'&&currentView==='monitor'&&typeof renderView==='function')renderView()}
install();
})();
