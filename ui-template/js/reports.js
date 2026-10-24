/* Rayo UI Template — reports page */
(function(){
'use strict';
const M=window.MOCK;
const sum=(a,k)=>a.reduce((s,x)=>s+x[k],0);
const mil=v=>RT.n1(v/1e6);
function hexA(hex,a){const n=parseInt(hex.replace('#',''),16);return`rgba(${n>>16&255},${n>>8&255},${n&255},${a})`}

/* ================= Profit & loss ================= */
function renderPnlKpis(){
  const p=M.pnl,rev=sum(p,'revenue'),net=sum(p,'net'),pay=sum(p,'payroll'),cogs=sum(p,'cogs');
  const k=[
    ['درآمد سالانه','trending-up',RT.money(rev),'تومان',8.2],
    ['سود خالص','piggy-bank',RT.money(net),'تومان',11.4],
    ['حاشیه سود خالص','percent',RT.n1(net/rev*100),'٪',1.1],
    ['سهم حقوق از فروش','users',RT.n1(pay/rev*100),'٪',-.6]
  ];
  document.getElementById('pnlKpis').innerHTML=k.map(([l,ic,v,u,d])=>`
    <div class="card kpi"><div class="kpi-top"><span class="kpi-label"><span class="kpi-icon"><i data-lucide="${ic}"></i></span>${l}</span>${RT.delta(d)}</div>
    <div class="kpi-value">${v}<small>${u}</small></div><div class="kpi-foot"><span>نسبت به سال ۱۴۰۴</span></div></div>`).join('');
}
function pnlOption(t){
  const p=M.pnl;
  const bar=(name,key,color,top)=>({name,type:'bar',stack:'r',data:p.map(x=>x[key]),barWidth:'52%',itemStyle:{color,borderRadius:top?[6,6,0,0]:0},emphasis:{focus:'series'}});
  return Object.assign(RT.base(t),{
    legend:{top:0,right:0,icon:'roundRect',itemWidth:10,itemHeight:10,itemGap:16,textStyle:{color:t.text2,fontFamily:t.font,fontSize:12}},
    grid:{left:4,right:4,top:40,bottom:0,containLabel:true},
    tooltip:Object.assign(RT.base(t).tooltip,{axisPointer:{type:'shadow',shadowStyle:{color:hexA(t.text3,.08)}},formatter:ps=>{
      const x=p[ps[0].dataIndex];
      return`<div style="font-weight:700;margin-bottom:6px">${x.month} · درآمد ${RT.money(x.revenue)}</div>`+ps.map(s=>RT.tipRow(s.color,s.seriesName,s.seriesType==='line'?RT.pct(s.value):RT.money(s.value))).join('');
    }}),
    xAxis:RT.axis(t,{type:'category',data:M.months,inverse:true,splitLine:{show:false}}),
    yAxis:[
      RT.axis(t,{type:'value',position:'right',axisLabel:{color:t.text3,fontFamily:t.font,fontSize:11,formatter:v=>RT.short(v)}}),
      RT.axis(t,{type:'value',position:'left',min:0,max:40,splitLine:{show:false},axisLabel:{color:t.text3,fontFamily:t.font,fontSize:11,formatter:v=>RT.n(v)+'٪'}})
    ],
    series:[
      bar('بهای مواد','cogs',hexA(t.palette[4],.55)),
      bar('حقوق و دستمزد','payroll',hexA(t.palette[3],.75)),
      bar('سربار','overhead',hexA(t.palette[2],.8)),
      bar('سود خالص','net',t.palette[0],true),
      {name:'حاشیه سود',type:'line',yAxisIndex:1,data:p.map(x=>+(x.net/x.revenue*100).toFixed(1)),smooth:.3,symbol:'circle',symbolSize:7,
        lineStyle:{width:2,color:t.palette[1]},itemStyle:{color:t.palette[1],borderColor:t.surface,borderWidth:2}}
    ]
  });
}
function waterfallOption(t){
  const p=M.pnl,rev=sum(p,'revenue'),c=sum(p,'cogs'),pay=sum(p,'payroll'),o=sum(p,'overhead'),net=rev-c-pay-o;
  const names=['درآمد','بهای مواد','حقوق','سربار','سود خالص'];
  const base=[0,rev-c,rev-c-pay,net,0],val=[rev,c,pay,o,net];
  const colors=[t.palette[1],t.danger,t.danger,t.danger,t.palette[0]];
  return Object.assign(RT.base(t),{
    grid:{left:4,right:4,top:28,bottom:0,containLabel:true},
    tooltip:Object.assign(RT.base(t).tooltip,{axisPointer:{type:'none'},formatter:ps=>{const s=ps.find(x=>x.seriesName==='v');return RT.tipRow(s.color,names[s.dataIndex],RT.money(val[s.dataIndex]))+`<div style="font-size:11px;color:${t.text3};margin-top:4px">${RT.pct(val[s.dataIndex]/rev*100)} از درآمد</div>`}}),
    xAxis:RT.axis(t,{type:'category',data:names,inverse:true,splitLine:{show:false},axisLabel:{color:t.text2,fontFamily:t.font,fontSize:11,interval:0}}),
    yAxis:RT.axis(t,{type:'value',position:'right',name:'میلیارد تومان',nameTextStyle:{color:t.text3,fontFamily:t.font,fontSize:11,align:'right'},axisLabel:{color:t.text3,fontFamily:t.font,fontSize:11,formatter:v=>RT.n(v/1e9)}}),
    series:[
      {name:'base',type:'bar',stack:'w',data:base,itemStyle:{color:'transparent'},emphasis:{disabled:true},silent:true},
      {name:'v',type:'bar',stack:'w',barWidth:'56%',data:val.map((v,i)=>({value:v,itemStyle:{color:i===0||i===4?colors[i]:hexA(colors[i],.75),borderRadius:6}})),
        label:{show:true,position:'top',color:t.text2,fontFamily:t.font,fontSize:11,fontWeight:700,formatter:p=>(p.dataIndex>0&&p.dataIndex<4?'−':'')+RT.n1(p.value/1e9)}}
    ]
  });
}
function renderPnlTable(){
  const p=M.pnl,tot=k=>sum(p,k);
  const row=(x,tag='td')=>{const m=x.net/x.revenue*100;return`<tr><${tag}>${x.month}</${tag}><${tag} class="num">${mil(x.revenue)}</${tag}><${tag} class="num">${mil(x.cogs)}</${tag}><${tag} class="num">${mil(x.payroll)}</${tag}><${tag} class="num">${mil(x.overhead)}</${tag}><${tag} class="num"><b>${mil(x.net)}</b></${tag}><${tag}><div class="row"><div class="meter ${m>=28?'ok':m>=24?'warn':'bad'}" style="width:90px"><i style="width:${Math.min(100,m/40*100)}%"></i></div><span class="num">${RT.pct(m)}</span></div></${tag}></tr>`};
  const total={month:'جمع سال',revenue:tot('revenue'),cogs:tot('cogs'),payroll:tot('payroll'),overhead:tot('overhead'),net:tot('net')};
  document.getElementById('pnlTable').innerHTML=`<thead><tr><th>ماه</th><th class="num">درآمد</th><th class="num">بهای مواد</th><th class="num">حقوق</th><th class="num">سربار</th><th class="num">سود خالص</th><th>حاشیه سود</th></tr></thead>
    <tbody>${p.map(x=>row(x)).join('')}</tbody><tfoot>${row(total).replace(/<tr>/,'<tr>')}</tfoot>`;
}

/* ================= Menu engineering ================= */
const QUAD={
  star:{label:'ستاره',tone:'success',ci:1,hint:'محبوب و پرسود؛ کیفیت و جایگاه را حفظ کنید.'},
  plow:{label:'اسب کاری',tone:'warning',ci:2,hint:'محبوب ولی کم‌سود؛ قیمت یا رسپی را بازبینی کنید.'},
  puzzle:{label:'معما',tone:'info',ci:3,hint:'پرسود ولی کم‌فروش؛ معرفی و جایگاه در منو را تقویت کنید.'},
  dog:{label:'ضعیف',tone:'danger',ci:0,hint:'کم‌فروش و کم‌سود؛ حذف یا بازطراحی را بررسی کنید.'}
};
const avgQty=M.menuEng.reduce((s,x)=>s+x.qty,0)/M.menuEng.length;
const avgMargin=M.menuEng.reduce((s,x)=>s+x.margin*x.qty,0)/M.menuEng.reduce((s,x)=>s+x.qty,0);
const quadOf=x=>x.qty>=avgQty?(x.margin>=avgMargin?'star':'plow'):(x.margin>=avgMargin?'puzzle':'dog');
const quadColor=(t,q)=>q==='dog'?t.danger:t.palette[QUAD[q].ci];

function scatterOption(t){
  const maxProfit=Math.max(...M.menuEng.map(x=>x.qty*x.margin));
  const series=Object.keys(QUAD).map(q=>({
    name:QUAD[q].label,type:'scatter',
    data:M.menuEng.filter(x=>quadOf(x)===q).map(x=>({value:[x.qty,x.margin],name:x.name,raw:x})),
    symbolSize:d=>10+Math.sqrt(d[0]*d[1]/maxProfit)*26,
    itemStyle:{color:hexA(quadColor(t,q),.8),borderColor:t.surface,borderWidth:2},
    label:{show:true,formatter:p=>p.name,position:'top',color:t.text2,fontFamily:t.font,fontSize:11},
    labelLayout:{hideOverlap:true},
    emphasis:{scale:1.15,label:{color:t.text,fontWeight:700}}
  }));
  series[0].markLine={silent:true,symbol:'none',lineStyle:{color:t.text3,type:[4,4],width:1},label:{show:false},data:[{xAxis:avgQty},{yAxis:avgMargin}]};
  /* quadrant captions pinned to the plot corners */
  const cap=(text,q,pos)=>Object.assign({type:'text',silent:true,style:{text,fill:hexA(quadColor(t,q),.9),font:`700 13px ${t.font}`}},pos);
  return Object.assign(RT.base(t),{
    graphic:[
      cap('★ ستاره','star',{right:32,top:36}),
      cap('اسب کاری','plow',{right:32,bottom:64}),
      cap('معما','puzzle',{left:84,top:36}),
      cap('ضعیف','dog',{left:84,bottom:64})
    ],
    grid:{left:8,right:16,top:24,bottom:28,containLabel:true},
    tooltip:Object.assign(RT.base(t).tooltip,{trigger:'item',formatter:p=>{const x=p.data.raw;return`<div style="font-weight:700;margin-bottom:6px">${x.name} <span style="color:${p.color}">· ${p.seriesName}</span></div>`+RT.tipRow(p.color,'تعداد فروش',RT.n(x.qty))+RT.tipRow(p.color,'سود هر واحد',RT.n(x.margin)+' ت')+RT.tipRow(p.color,'سود کل',RT.money(x.qty*x.margin))}}),
    xAxis:RT.axis(t,{type:'value',name:'محبوبیت →',nameLocation:'middle',nameGap:28,nameTextStyle:{color:t.text3,fontFamily:t.font},axisLabel:{color:t.text3,fontFamily:t.font,fontSize:11,formatter:v=>RT.n(v)}}),
    yAxis:RT.axis(t,{type:'value',name:'سود هر واحد',nameTextStyle:{color:t.text3,fontFamily:t.font,align:'left'},axisLabel:{color:t.text3,fontFamily:t.font,fontSize:11,formatter:v=>RT.short(v)}}),
    series
  });
}
function renderMenuSide(){
  document.getElementById('quadLegend').innerHTML=Object.keys(QUAD).map(q=>`<span><i style="background:var(--${QUAD[q].tone==='success'?'c2':QUAD[q].tone==='warning'?'c3':QUAD[q].tone==='info'?'c4':'danger'})"></i>${QUAD[q].label}</span>`).join('');
  document.getElementById('quadGuide').innerHTML=Object.keys(QUAD).map(q=>{
    const n=M.menuEng.filter(x=>quadOf(x)===q).length;
    return`<div class="list-item"><span class="badge badge-${QUAD[q].tone}">${QUAD[q].label}</span><div class="grow"><small style="color:var(--text-2)">${QUAD[q].hint}</small></div><b class="num">${RT.n(n)}</b></div>`;
  }).join('');
  const rows=[...M.menuEng].sort((a,b)=>b.qty*b.margin-a.qty*a.margin),total=rows.reduce((s,x)=>s+x.qty*x.margin,0);
  document.getElementById('menuTable').innerHTML=`<thead><tr><th>آیتم</th><th>دسته</th><th class="num">تعداد فروش</th><th class="num">سود هر واحد (ت)</th><th class="num">سود کل</th><th>سهم سود</th><th>طبقه</th></tr></thead><tbody>${rows.map(x=>{
    const q=quadOf(x),share=x.qty*x.margin/total*100;
    return`<tr><td><b>${x.name}</b></td><td class="muted">${x.cat}</td><td class="num">${RT.n(x.qty)}</td><td class="num">${RT.n(x.margin)}</td><td class="num">${RT.money(x.qty*x.margin)}</td>
      <td><div class="row"><div class="meter" style="width:90px"><i style="width:${share/ (rows[0].qty*rows[0].margin/total*100)*100}%"></i></div><span class="num muted">${RT.pct(share)}</span></div></td>
      <td><span class="badge badge-${QUAD[q].tone}">${QUAD[q].label}</span></td></tr>`}).join('')}</tbody>`;
}

/* ================= Purchase & inventory ================= */
function treemapOption(t){
  return Object.assign(RT.base(t),{
    tooltip:Object.assign(RT.base(t).tooltip,{trigger:'item',formatter:p=>RT.tipRow(p.color,p.treePathInfo.slice(1).map(x=>x.name).join(' / '),RT.money(p.value))}),
    series:[{type:'treemap',roam:false,nodeClick:false,breadcrumb:{show:false},left:0,right:0,top:0,bottom:0,
      data:M.suppliers.map((g,i)=>({name:g.name,children:g.children.map((c,j)=>({name:c.name,value:c.value,itemStyle:{color:hexA(t.palette[i%6],1-j*.2)}}))})),
      levels:[
        {itemStyle:{borderColor:t.surface,borderWidth:4,gapWidth:4,borderRadius:10}},
        {itemStyle:{borderColor:t.surface,borderWidth:0,gapWidth:2,borderRadius:8}}
      ],
      label:{show:true,overflow:'truncate',fontFamily:t.font,fontSize:12,color:'#fff',formatter:p=>`{n|${p.name}}\n{v|${RT.money(p.value)}}`,
        rich:{n:{fontFamily:t.font,fontSize:12,fontWeight:700,color:'#fff',lineHeight:20},v:{fontFamily:t.font,fontSize:11,color:'rgba(255,255,255,.85)'}}}
    }]
  });
}
function varianceOption(t){
  const d=M.variance;
  return Object.assign(RT.base(t),{
    grid:{left:16,right:8,top:8,bottom:8,containLabel:true},
    tooltip:Object.assign(RT.base(t).tooltip,{axisPointer:{type:'shadow',shadowStyle:{color:hexA(t.text3,.08)}},formatter:p=>RT.tipRow(p[0].color,p[0].name,(p[0].value>0?'+':'')+RT.n1(p[0].value)+'٪')}),
    xAxis:RT.axis(t,{type:'value',min:-6,max:3,axisLabel:{color:t.text3,fontFamily:t.font,fontSize:11,formatter:v=>RT.n(v)+'٪'}}),
    yAxis:RT.axis(t,{type:'category',data:d.map(x=>x.name),position:'right',inverse:true,splitLine:{show:false},axisLabel:{color:t.text2,fontFamily:t.font,fontSize:12}}),
    series:[{type:'bar',barWidth:14,data:d.map(x=>({value:x.value,itemStyle:{color:x.value<0?t.danger:t.warning,borderRadius:x.value<0?[7,0,0,7]:[0,7,7,0]}})),
      label:{show:true,position:'outside',color:t.text2,fontFamily:t.font,fontSize:11,formatter:p=>(p.value>0?'+':'−')+RT.n1(Math.abs(p.value))+'٪'},
      markLine:{silent:true,symbol:'none',label:{show:false},lineStyle:{color:t.text3,width:1},data:[{xAxis:0}]}}]
  });
}

/* ================= Survey ================= */
function gaugeOption(t){
  const v=4.4;
  return Object.assign(RT.base(t),{
    series:[{type:'gauge',min:0,max:5,startAngle:210,endAngle:-30,radius:'92%',center:['50%','56%'],
      progress:{show:true,roundCap:true,width:16,itemStyle:{color:new echarts.graphic.LinearGradient(1,0,0,0,[{offset:0,color:t.palette[2]},{offset:1,color:t.palette[0]}])}},
      axisLine:{roundCap:true,lineStyle:{width:16,color:[[1,t.surface3]]}},
      pointer:{show:false},axisTick:{show:false},splitLine:{show:false},axisLabel:{show:false},
      anchor:{show:false},title:{show:true,offsetCenter:[0,'34%'],color:t.text3,fontFamily:t.font,fontSize:12},
      detail:{valueAnimation:true,offsetCenter:[0,'-4%'],fontFamily:t.font,fontSize:38,fontWeight:800,color:t.text,formatter:x=>RT.n1(x)},
      data:[{value:v,name:'از ۵ امتیاز'}]}]
  });
}
function radarOption(t){
  const s=M.survey;
  return Object.assign(RT.base(t),{
    tooltip:Object.assign(RT.base(t).tooltip,{trigger:'item',formatter:p=>`<b>${p.name}</b>`+s.dims.map((d,i)=>RT.tipRow(p.color,d,RT.n1(p.value[i]))).join('')}),
    radar:{radius:'70%',center:['50%','52%'],splitNumber:4,shape:'polygon',
      indicator:s.dims.map(n=>({name:n,max:5,min:0})),
      axisName:{color:t.text2,fontFamily:t.font,fontSize:12},
      splitLine:{lineStyle:{color:t.border}},splitArea:{areaStyle:{color:[t.surface,hexA(t.text3,.04)]}},axisLine:{lineStyle:{color:t.border}}},
    series:[{type:'radar',symbol:'circle',symbolSize:6,data:[
      {name:'ماه قبل',value:s.prev,lineStyle:{color:t.palette[4],width:1.5,type:[4,4]},itemStyle:{color:t.palette[4]},areaStyle:{color:hexA(t.palette[4],.08)}},
      {name:'ماه جاری',value:s.now,lineStyle:{color:t.palette[0],width:2.5},itemStyle:{color:t.palette[0],borderColor:t.surface,borderWidth:2},areaStyle:{color:hexA(t.palette[0],.2)}}
    ]}]
  });
}

/* ================= Boot (charts mount lazily per tab) ================= */
const PANELS={
  profit:()=>{RT.chart('pnlChart',pnlOption);RT.chart('waterfall',waterfallOption)},
  menu:()=>RT.chart('scatter',scatterOption),
  supply:()=>{RT.chart('treemap',treemapOption);RT.chart('variance',varianceOption)},
  survey:()=>{RT.chart('gauge',gaugeOption);RT.chart('radar',radarOption)}
};
const mounted={};
document.addEventListener('DOMContentLoaded',()=>{
  renderPnlKpis();renderPnlTable();renderMenuSide();
  const show=RT.tabs(document.querySelector('[data-tabs="rep"]'),key=>{
    if(!mounted[key]){mounted[key]=true;requestAnimationFrame(PANELS[key])}
  });
  const q=new URLSearchParams(location.search).get('tab');
  show(PANELS[q]?q:'profit');
  RT.icons();
});
})();
