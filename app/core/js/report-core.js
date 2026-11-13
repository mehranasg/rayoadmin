/* Rayo — management reports over a period of months (read only, pure; no DOM, nothing is saved).
   Used by js/pages/reports-real.js («گزارش‌ها»: خلاصهٔ مالک، سود و زیان دوره، آمار فروش، روند محصولات، حقوق و پرسنل).
   - span / prevKey / nextKey: month keys ('1405/08') of a period that ends in a month.
   - sumPnl: the profit and loss of several months added up (each month from FinanceWrite.pnl; rules in
     BUSINESS_RULES «سود و زیان»). Percentages are of the net sales of the whole period.
   - salesMonths: item sales of the imported sales files inside each calendar month. A file that covers several days
     is spread evenly over its days (same per-day rule as the inventory engine); the material cost of an item is its
     recipe of that day × the cost of that day.
   - groupOf: the report group of a menu category (آشپزخانه، بار، نوشیدنی سرد، کیک و دسر، قلیان، سایر) from its name.
   - payrollPeriod / payrollForecast: salary of the months of the period (PayrollCore rows) and the contract forecast
     of a month. Tips are outside the salary and reported next to it. */
(function(){
'use strict';
const A=x=>Array.isArray(x)?x:[],S=x=>String(x??'').trim(),N=v=>{const n=Number(v);return Number.isFinite(n)?n:0},pad=n=>String(n).padStart(2,'0');
const prevKey=k=>{let [y,m]=k.split('/').map(Number);m--;if(m<1){m=12;y--}return y+'/'+pad(m)};
const nextKey=k=>{let [y,m]=k.split('/').map(Number);m++;if(m>12){m=1;y++}return y+'/'+pad(m)};
const span=(end,n)=>{const out=[];let k=end;for(let i=0;i<n;i++){out.unshift(k);k=prevKey(k)}return out};
/* change of a value against its base, in percent; null when the base is zero */
const growth=(now,base)=>N(base)?(N(now)-N(base))/Math.abs(N(base))*100:null;

/* ---------- profit and loss of a period ----------
   rows: [{k, r}] — r is the month's FinanceWrite.pnl result. */
const PNL_SUMS=['grossSales','vat','sales','otherIncome','income','materials','staffMeal','payroll','expenseTotal','costs','beforeReserve','reserve','profit'];
function sumPnl(rows){const t={};for(const f of PNL_SUMS)t[f]=rows.reduce((s,o)=>s+N(o.r?.[f]),0);
 t.materialParts={std:0,waste:0,shortage:0};const by=new Map;
 for(const o of rows){for(const p of ['std','waste','shortage'])t.materialParts[p]+=N(o.r?.materialParts?.[p]);for(const e of A(o.r?.expenses))by.set(e.category,(by.get(e.category)||0)+N(e.amount))}
 t.expenses=[...by].map(([category,amount])=>({category,amount})).sort((a,b)=>b.amount-a.amount);
 t.gross=t.sales-t.materials;t.totalCost=t.costs+t.reserve;t.pct=a=>t.sales?a/t.sales*100:null;
 t.months=rows.map(o=>{const r=o.r||{},cost=N(r.costs)+N(r.reserve);return{k:o.k,sales:N(r.sales),materials:N(r.materials),payroll:N(r.payroll),staffMeal:N(r.staffMeal),other:N(r.expenseTotal),reserve:N(r.reserve),cost,profit:N(r.profit),margin:N(r.sales)?N(r.profit)/N(r.sales)*100:null,flags:A(r.flags),noSales:!(N(r.grossSales)>0)}});
 t.withSales=t.months.filter(m=>!m.noSales).length;t.flagged=t.months.filter(m=>m.noSales||m.flags.length).length;t.complete=t.flagged===0;
 return t}

/* ---------- item sales of each month ----------
   M: InvEngine.build model; E: InvEngine; keys: month keys.
   → {items: Map(menuItemId → {name, qty:{k}, amt:{k}, cost:{k}, noCost}), days:{k: days covered by a sales file}} */
function salesMonths(M,E,keys){const CAL=E.CAL,rng=keys.map(k=>{const r=E.monthRange(k);return{k,a:CAL.i(r.from),b:CAL.i(r.to)}}).filter(g=>g.a!==null&&g.b!==null),items=new Map,cover=new Map(rng.map(g=>[g.k,new Set])),cc=new Map;
 // material cost of one unit of a menu item on a day (null = no recipe or no cost)
 const unit=(id,d)=>{const ck=id+'|'+d;if(cc.has(ck))return cc.get(ck);const day=CAL.k(d);let sum=0,any=false;for(const rl of M.recipeAt(id,day)){if(M.recipeDeducts&&!M.recipeDeducts(rl.ingredientId,day))continue;const g=M.gross(M.ing.get(rl.ingredientId),rl,1),c=M.costAt(rl.ingredientId,day);if(Number.isFinite(g)&&c!==null&&c!==undefined){sum+=g*c;any=true}}const v=any?sum:null;cc.set(ck,v);return v};
 for(const s of A(M.sales))for(const l of A(s.lines)){const ld=l.date?CAL.i(l.date):null,a=ld??s.a,b=ld??s.b,n=b-a+1,q=N(l.quantity),amt=N(l.saleAmountToman);if(!(n>0))continue;
  for(const g of rng){const lo=Math.max(a,g.a),hi=Math.min(b,g.b);if(hi<lo)continue;const part=(hi-lo+1)/n;let o=items.get(l.menuItemId);if(!o)items.set(l.menuItemId,o={name:S(l.sourceName),qty:{},amt:{},cost:{},noCost:false});
   o.qty[g.k]=(o.qty[g.k]||0)+q*part;o.amt[g.k]=(o.amt[g.k]||0)+amt*part;const set=cover.get(g.k);
   for(let d=lo;d<=hi;d++){set.add(d);const u=unit(l.menuItemId,d);if(u===null)o.noCost=true;else o.cost[g.k]=(o.cost[g.k]||0)+u*q/n}}}
 const days={};for(const [k,set] of cover)days[k]=set.size;return{items,days}}

/* ---------- report groups of the menu ---------- */
const GROUPS=[{id:'kitchen',label:'آشپزخانه',icon:'chef-hat'},{id:'bar',label:'بار و نوشیدنی‌ها',icon:'coffee'},{id:'cold',label:'نوشیدنی‌های سرد',icon:'cup-soda'},{id:'dessert',label:'کیک و دسر',icon:'cake-slice'},{id:'hookah',label:'قلیان',icon:'wind'},{id:'other',label:'سایر',icon:'package'}];
const norm=s=>S(s).replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/[‌‏]/g,' ').replace(/\s+/g,' ');
function groupOf(category){const c=norm(category);if(/قلیان/.test(c))return'hookah';if(/کیک|دسر|شیرینی/.test(c))return'dessert';if(/نوشیدنی.{0,6}سرد|نوشابه/.test(c))return'cold';
 if(/اسپرسو|قهوه|دمنوش|چای|نوشیدنی|سردنوش|ماکت|موکت|اسموتی|شیک|میوه|(^| )بار( |$)/.test(c))return'bar';if(/غذا|سالاد|پیتزا|پاستا|ساندویچ|صبحانه|برگر|پیشنهاد|جونیور|سوپ|استیک|خوراک/.test(c))return'kitchen';return'other'}
/* totals of the period by group, category and item. menu: Map(id → menu item) */
function salesSummary(sm,menu,keys){const groups=new Map(GROUPS.map(g=>[g.id,{...g,qty:0,amt:0,cost:0,byMonth:{},cats:new Map}])),rows=[];
 for(const [id,o] of sm.items){const m=menu.get(id),cat=S(m?.category)||'بدون دسته',g=groups.get(groupOf(cat));let q=0,a=0,c=0;
  for(const k of keys){const qk=o.qty[k]||0,ak=o.amt[k]||0;if(!qk&&!ak)continue;q+=qk;a+=ak;c+=o.cost[k]||0;const bm=g.byMonth[k]||(g.byMonth[k]={qty:0,amt:0});bm.qty+=qk;bm.amt+=ak}
  if(!q&&!a)continue;g.qty+=q;g.amt+=a;g.cost+=c;const ct=g.cats.get(cat)||{name:cat,qty:0,amt:0};ct.qty+=q;ct.amt+=a;g.cats.set(cat,ct);rows.push({id,name:S(m?.name)||o.name||id,category:cat,group:g.id,qty:q,amt:a,cost:c,noCost:o.noCost})}
 const list=[...groups.values()].filter(g=>g.qty||g.amt).map(g=>({...g,cats:[...g.cats.values()].sort((x,y)=>y.qty-x.qty)}));
 return{groups:list,rows:rows.sort((x,y)=>y.qty-x.qty),qty:list.reduce((s,g)=>s+g.qty,0),amt:list.reduce((s,g)=>s+g.amt,0),cost:list.reduce((s,g)=>s+g.cost,0)}}
/* monthly series of one entity: 'g:<group id>', 'c:<category>', 'i:<menu item id>' or 'all' */
function entitySeries(sm,menu,ent,keys){const kind=ent==='all'?'all':ent.slice(0,1),val=ent.slice(2),q=keys.map(()=>0),a=keys.map(()=>0),c=keys.map(()=>0);let noCost=false,n=0;
 for(const [id,o] of sm.items){const cat=S(menu.get(id)?.category)||'بدون دسته';if(kind==='i'?id!==val:kind==='c'?cat!==val:kind==='g'?groupOf(cat)!==val:false)continue;let used=false;
  keys.forEach((k,i)=>{if(o.qty[k]||o.amt[k])used=true;q[i]+=o.qty[k]||0;a[i]+=o.amt[k]||0;c[i]+=o.cost[k]||0});if(used){n++;if(o.noCost)noCost=true}}
 return{qty:q,amt:a,cost:c,gross:a.map((v,i)=>v-c[i]),items:n,noCost}}

/* ---------- salary of a period ----------
   PC: PayrollCore; hr: personnel doc; today: 'YYYY/MM/DD'. A month before the start month or in the future has no rows. */
const PAY_F=['base','overtime','undertime','additions','deductions','menu','net','advance','paid','balance'];
const groupName=p=>S(p?.personnelGroup)||S(p?.section)||'سایر';
function payrollPeriod(PC,hr,keys,today){const byId=new Map(A(hr?.personnel).map(p=>[p.id,p])),people=new Map,groups=new Map,total=Object.fromEntries(PAY_F.map(f=>[f,0]));total.tips=0;
 const months=keys.map(k=>{const [y,m]=k.split('/').map(Number),state=PC.monthState(hr,y,m,today),o={k,state,people:0,hourly:0,fixed:0,tips:0,groups:{},flagged:0};for(const f of PAY_F)o[f]=0;
  o.tips=A(hr?.tipGroups).filter(g=>!PC.isVoid(g)&&PC.D(g.receiveDate).slice(0,7)===k).reduce((s,g)=>s+N(g.totalAmount),0);total.tips+=o.tips;
  if(state==='before'||state==='future')return o;
  for(const r of PC.monthRows(hr,y,m)){const p=byId.get(r.personnelId),g=groupName(p);o.people++;if(r.contract?.type==='hourly')o.hourly++;else if(r.contract?.type==='fixed')o.fixed++;if(A(r.flags).length)o.flagged++;
   for(const f of PAY_F){o[f]+=N(r[f]);total[f]+=N(r[f])}o.groups[g]=(o.groups[g]||0)+N(r.net);groups.set(g,(groups.get(g)||0)+N(r.net));
   const x=people.get(r.personnelId)||{id:r.personnelId,name:S(p?.name)||r.personnelId,group:g,months:0,net:0,advance:0,paid:0,balance:0,additions:0,deductions:0,menu:0};x.months++;for(const f of ['net','advance','paid','balance','additions','deductions','menu'])x[f]+=N(r[f]);people.set(r.personnelId,x)}
  return o});
 const counted=months.filter(m=>m.state!=='before'&&m.state!=='future');
 return{months,total,counted:counted.length,avgPeople:counted.length?counted.reduce((s,m)=>s+m.people,0)/counted.length:0,groups:[...groups].map(([name,net])=>({name,net})).sort((a,b)=>b.net-a.net),people:[...people.values()].sort((a,b)=>b.net-a.net)}}
/* contract forecast of a month for the people who are active now: fixed = monthly salary, hourly = rate × contract
   hours, both prorated by the days employed in that month (PayrollCore.forecast) */
function payrollForecast(PC,hr,y,m){const first=`${y}/${pad(m)}/01`,rows=A(hr?.personnel).filter(p=>S(p.status)==='فعال').map(p=>{const c=PC.contractOf(p,y,m),hours=c.type==='hourly'?N(c.monthlyHours)||N(c.agreedShifts)*N(c.hoursPerShift):0,start=PC.D(p.startDate);
  return{id:p.id,name:S(p.name)||p.id,group:groupName(p),type:c.type,hourly:c.type==='hourly'?N(c.hourly):0,hours,amount:Math.max(0,Math.round(PC.forecast(hr,p,y,m))),isNew:!!start&&start>=prevKey(`${y}/${pad(m)}`)+'/01',late:!!start&&start>first}}).sort((a,b)=>b.amount-a.amount);
 const sum=t=>rows.filter(r=>r.type===t).reduce((s,r)=>s+r.amount,0),groups=new Map;for(const r of rows)groups.set(r.group,(groups.get(r.group)||0)+r.amount);
 return{rows,total:rows.reduce((s,r)=>s+r.amount,0),hourly:sum('hourly'),fixed:sum('fixed'),nHourly:rows.filter(r=>r.type==='hourly').length,nFixed:rows.filter(r=>r.type==='fixed').length,noContract:rows.filter(r=>r.type==='none').length,noHours:rows.filter(r=>r.type==='hourly'&&!r.hours).length,groups:[...groups].map(([name,amount])=>({name,amount})).sort((a,b)=>b.amount-a.amount)}}

window.ReportCore={prevKey,nextKey,span,growth,sumPnl,salesMonths,GROUPS,groupOf,salesSummary,entitySeries,payrollPeriod,payrollForecast,groupName};
})();
