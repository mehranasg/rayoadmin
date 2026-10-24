/* Rayo UI Template — dashboard page */
(function(){
'use strict';
const M=window.MOCK;
const sum=(a,k)=>a.reduce((s,x)=>s+x[k],0);
const gradient=(c,a1,a2)=>new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:hexA(c,a1)},{offset:1,color:hexA(c,a2)}]);
function hexA(hex,a){const h=hex.replace('#','');const n=parseInt(h.length===3?h.split('').map(x=>x+x).join(''):h,16);return`rgba(${n>>16&255},${n>>8&255},${n&255},${a})`}

let range=30,data=M.days(90);
const slice=()=>data.slice(-range);

/* ---------- KPIs ---------- */
function renderKpis(){
  const d=slice(),sales=sum(d,'sales'),prev=sum(d,'prev'),orders=sum(d,'orders'),cogs=sum(d,'cogs');
  const avg=sales/orders,cogsPct=cogs/sales*100;
  const k=[
    {label:'فروش خالص',icon:'wallet',value:RT.money(sales),unit:'تومان',delta:(sales/prev-1)*100,series:d.map(x=>x.sales),foot:`${RT.n(range)} روز اخیر`},
    {label:'تعداد فاکتور',icon:'receipt',value:RT.n(orders),unit:'فاکتور',delta:6.4,series:d.map(x=>x.orders),foot:`میانگین روزانه ${RT.n(orders/range)}`},
    {label:'میانگین هر فاکتور',icon:'shopping-bag',value:RT.n(avg/1000),unit:'هزار تومان',delta:2.1,series:d.map(x=>x.sales/x.orders),foot:'هدف: ۳۲۰ هزار'},
    {label:'بهای تمام‌شده',icon:'calculator',value:RT.n1(cogsPct),unit:'٪ فروش',delta:-1.3,series:d.map(x=>x.cogs/x.sales*100),foot:'هدف: زیر ۳۲٪',invert:true}
  ];
  document.getElementById('kpis').innerHTML=k.map((x,i)=>`
    <div class="card kpi">
      <div class="kpi-top"><span class="kpi-label"><span class="kpi-icon"><i data-lucide="${x.icon}"></i></span>${x.label}</span>${deltaBadge(x.delta,x.invert)}</div>
      <div class="kpi-value">${x.value}<small>${x.unit}</small></div>
      <div class="kpi-foot"><span>${x.foot}</span><div class="spark" id="spark${i}"></div></div>
    </div>`).join('');
  k.forEach((x,i)=>RT.chart('spark'+i,t=>{
    const good=x.invert?x.delta<=0:x.delta>=0,c=good?t.success:t.danger;
    return{animation:false,grid:{left:0,right:0,top:4,bottom:4},xAxis:{type:'category',show:false,inverse:true,boundaryGap:false},yAxis:{type:'value',show:false,scale:true},
      series:[{type:'line',data:x.series,smooth:.4,symbol:'none',lineStyle:{width:1.6,color:c},areaStyle:{color:gradient(c,.22,0)}}]};
  }));
}
function deltaBadge(v,invert){
  const good=invert?v<=0:v>=0;
  return`<span class="badge ${good?'badge-success':'badge-danger'} plain"><i data-lucide="${v>=0?'arrow-up-right':'arrow-down-right'}" style="width:12px;height:12px"></i>${RT.n1(Math.abs(v))}٪</span>`;
}

/* ---------- Trend ---------- */
function trendOption(t){
  const d=slice(),labels=d.map(x=>RT.date(x.date));
  return Object.assign(RT.base(t),{
    grid:{left:4,right:4,top:16,bottom:0,containLabel:true},
    tooltip:Object.assign(RT.base(t).tooltip,{formatter:p=>{
      const i=p[0].dataIndex,x=d[i];
      return`<div style="font-weight:700;margin-bottom:6px">${RT.date(x.date,{weekday:'long',day:'numeric',month:'long'})}</div>`+
        RT.tipRow(t.palette[0],'دورهٔ جاری',RT.money(x.sales))+RT.tipRow(t.text3,'دورهٔ قبل',RT.money(x.prev))+RT.tipRow(t.palette[1],'فاکتور',RT.n(x.orders));
    }}),
    xAxis:RT.axis(t,{type:'category',data:labels,inverse:true,boundaryGap:false,splitLine:{show:false},axisLabel:{color:t.text3,fontFamily:t.font,fontSize:11,interval:Math.ceil(range/8)-1}}),
    yAxis:RT.axis(t,{type:'value',position:'right',axisLabel:{color:t.text3,fontFamily:t.font,fontSize:11,formatter:v=>RT.short(v)}}),
    series:[
      {name:'دورهٔ جاری',type:'line',data:d.map(x=>x.sales),smooth:.35,symbol:'circle',symbolSize:7,showSymbol:false,
        lineStyle:{width:2.5,color:t.palette[0]},itemStyle:{color:t.palette[0],borderColor:t.surface,borderWidth:2},
        areaStyle:{color:gradient(t.palette[0],.24,.01)},emphasis:{focus:'none'}},
      {name:'دورهٔ قبل',type:'line',data:d.map(x=>x.prev),smooth:.35,symbol:'none',lineStyle:{width:1.5,type:[5,5],color:t.text3}}
    ]
  });
}
function renderTrendStats(){
  const d=slice(),best=d.reduce((a,b)=>b.sales>a.sales?b:a),total=sum(d,'sales');
  document.getElementById('trendStats').innerHTML=`
    <div><small>جمع فروش</small><b>${RT.money(total)}</b></div>
    <div><small>میانگین روزانه</small><b>${RT.money(total/range)}</b></div>
    <div><small>بهترین روز</small><b>${RT.date(best.date)}</b></div>
    <div><small>رشد نسبت به قبل</small><b class="up">${RT.pct((total/sum(d,'prev')-1)*100)}</b></div>`;
}

/* ---------- Donut ---------- */
function donutOption(t){
  const total=M.categories.reduce((s,x)=>s+x.value,0);
  return Object.assign(RT.base(t),{
    tooltip:Object.assign(RT.base(t).tooltip,{trigger:'item',formatter:p=>RT.tipRow(p.color,p.name,RT.money(p.value))+`<div class="muted" style="margin-top:4px;font-size:11px">${RT.pct(p.percent)} از کل</div>`}),
    graphic:[
      {type:'text',left:'center',top:'40%',style:{text:'کل فروش',fill:t.text3,font:`12px ${t.font}`,textAlign:'center'}},
      {type:'text',left:'center',top:'50%',style:{text:RT.money(total),fill:t.text,font:`800 18px ${t.font}`,textAlign:'center'}}
    ],
    series:[{type:'pie',radius:['64%','86%'],center:['50%','50%'],padAngle:2,itemStyle:{borderRadius:6},label:{show:false},
      emphasis:{scale:true,scaleSize:4},data:M.categories.map(c=>({name:c.name,value:c.value}))}]
  });
}
function renderCatList(){
  const total=M.categories.reduce((s,x)=>s+x.value,0);
  document.getElementById('catList').innerHTML=M.categories.slice(0,4).map((c,i)=>`
    <div class="list-item"><i style="width:10px;height:10px;border-radius:3px;background:var(--c${i+1})"></i><span class="grow">${c.name}</span><b class="num">${RT.pct(c.value/total*100)}</b></div>`).join('');
}

/* ---------- Heatmap ---------- */
function heatOption(t){
  const h=M.heat(),max=Math.max(...h.data.map(x=>x[2]));
  return Object.assign(RT.base(t),{
    grid:{left:4,right:4,top:4,bottom:28,containLabel:true},
    tooltip:Object.assign(RT.base(t).tooltip,{trigger:'item',formatter:p=>`<b>${h.wd[p.value[1]]} · ساعت ${RT.n(h.hours[p.value[0]])}</b><br>${RT.n(p.value[2])} فاکتور`}),
    xAxis:RT.axis(t,{type:'category',data:h.hours.map(RT.n),inverse:true,splitLine:{show:false}}),
    yAxis:RT.axis(t,{type:'category',data:h.wd,position:'right',splitLine:{show:false}}),
    visualMap:{min:0,max,calculable:false,orient:'horizontal',left:'center',bottom:0,itemWidth:10,itemHeight:140,
      text:['زیاد','کم'],textStyle:{color:t.text3,fontFamily:t.font,fontSize:11},
      inRange:{color:[t.surface3,hexA(t.palette[0],.45),t.palette[0]]}},
    series:[{type:'heatmap',data:h.data,itemStyle:{borderColor:t.surface,borderWidth:3,borderRadius:6},emphasis:{itemStyle:{borderColor:t.text,borderWidth:1}}}]
  });
}

/* ---------- Lists & table ---------- */
function renderTopItems(){
  const max=M.topItems[0].qty;
  document.getElementById('topItems').innerHTML=M.topItems.map((x,i)=>`
    <div class="rank-row"><span class="idx">${RT.n(i+1)}</span>
      <div><div class="row between"><span>${x.name}</span><b class="num">${RT.n(x.qty)}</b></div><div class="bar"><i style="width:${x.qty/max*100}%"></i></div></div>
      <span></span>
    </div>`).join('');
}
function renderCash(){
  const rows=M.cashReports.map(x=>{
    const diff=x.counted-x.sepidz,abs=Math.abs(diff);
    const st=abs===0?['badge-success','منطبق']:abs<=100000?['badge-warning','جزئی']:['badge-danger','نیاز به بررسی'];
    return`<tr>
      <td><div class="cell-main"><div class="thumb"><i data-lucide="${x.shift==='صبح'?'sunrise':'moon'}"></i></div><div><b>${x.date}</b><small>شیفت ${x.shift}</small></div></div></td>
      <td>${x.cashier}</td>
      <td class="num">${RT.n(x.sepidz)}</td>
      <td class="num">${RT.n(x.counted)}</td>
      <td class="num ${diff<0?'down':diff>0?'up':'muted'}">${diff===0?'—':(diff>0?'+':'−')+RT.n(abs)}</td>
      <td><span class="badge ${st[0]}">${st[1]}</span></td>
    </tr>`;
  }).join('');
  document.getElementById('cashTable').innerHTML=`<thead><tr><th>تاریخ</th><th>صندوقدار</th><th class="num">سپیدز (تومان)</th><th class="num">شمارش</th><th class="num">مغایرت</th><th>وضعیت</th></tr></thead><tbody>${rows}</tbody>`;
}
function renderAlerts(){
  document.getElementById('alerts').innerHTML=M.alerts.map(a=>`
    <div class="list-item"><div class="thumb" style="background:var(--${a.tone}-soft);color:var(--${a.tone})"><i data-lucide="${a.icon}"></i></div>
      <div class="grow"><b>${a.title}</b><small>${a.meta}</small></div><i data-lucide="chevron-left" class="muted"></i></div>`).join('');
}

/* ---------- Boot ---------- */
let trendChart;
document.addEventListener('DOMContentLoaded',()=>{
  renderKpis();renderTrendStats();renderCatList();renderTopItems();renderCash();renderAlerts();
  trendChart=RT.chart('trend',trendOption);
  RT.chart('donut',donutOption);
  RT.chart('heat',heatOption);
  document.querySelectorAll('#range button').forEach(b=>b.addEventListener('click',()=>{
    document.querySelectorAll('#range button').forEach(x=>x.classList.toggle('active',x===b));
    range=+b.dataset.r;renderKpis();renderTrendStats();trendChart.mount();RT.icons();
  }));
  RT.icons();
});
})();
