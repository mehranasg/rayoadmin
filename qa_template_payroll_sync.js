// Payroll engine of the new panel = the salary calculation of js/00-base.js, extracted unchanged.
//   node qa_template_payroll_sync.js --write   → (re)builds ui-template/js/payroll-engine.js from js/00-base.js
//   node qa_template_payroll_sync.js           → fails when payroll-engine.js no longer matches js/00-base.js
// Extraction: js/00-base.js is split into top-level statements (every split point is checked with the JavaScript parser,
// syntax only, nothing is executed); the statements needed by the roots below are copied in file order into a function
// that receives the personnel document as `state` (the global the original code reads).
'use strict';
const fs=require('fs'),path=require('path');
const SRC=path.join(__dirname,'js/00-base.js'),OUT=path.join(__dirname,'ui-template/js/payroll-engine.js');
const ROOTS=['payrollRowsForPeriod','calcPayroll','calcPayrollLive','payrollPeopleForPeriod','payrollClosure','payrollStartPeriod','payrollBeforeStart','tipShares','payrollNetToman'];
const EXCLUDE=new Set(['state']);// passed in
const parses=code=>{try{new Function(code);return true}catch(_){return false}};
function statements(src){const lines=src.split(/\r?\n/),out=[];let buf='';
 for(const line of lines){buf+=(buf?'\n':'')+line;if(!parses(buf))continue;
  // split the parsed chunk at top-level statement boundaries
  let rest=buf;for(;;){let cut=-1;const re=/;(?=(?:const|let|var|function|async function|class)\s)|}(?=(?:function|async function)\s)/g;let m;
   while((m=re.exec(rest))){const k=m.index+1;if(parses(rest.slice(0,k))&&parses(rest.slice(k))){cut=k;break}}
   if(cut<0){out.push(rest);break}out.push(rest.slice(0,cut));rest=rest.slice(cut)}
  buf=''}
 if(buf.trim())out.push(buf);return out.map(s=>s.replace(/^\s+/,''))}
function declared(st){const names=[];let m=st.match(/^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/);if(m)return[m[1]];m=st.match(/^(const|let|var)\s+/);if(!m)return names;
 // declarators at depth 0: split at commas that leave both sides parseable as declarations
 const body=st.slice(m[0].length).replace(/;\s*$/,'');let start=0;for(let i=0;i<=body.length;i++){if(i<body.length&&body[i]!==',')continue;const part=body.slice(start,i);if(parses('var '+part+';')){const n=part.match(/^\s*([A-Za-z_$][\w$]*)/);if(n)names.push(n[1]);start=i+1}}return names}
function build(){const src=fs.readFileSync(SRC,'utf8'),sts=statements(src),decl=new Map;sts.forEach((s,i)=>{for(const n of declared(s))if(!decl.has(n))decl.set(n,i)});
 const need=new Set,queue=[...ROOTS];while(queue.length){const n=queue.shift();if(EXCLUDE.has(n)||!decl.has(n))continue;const i=decl.get(n);if(need.has(i))continue;need.add(i);for(const id of new Set(sts[i].match(/[A-Za-z_$][\w$]*/g)||[]))if(decl.has(id)&&!EXCLUDE.has(id)&&!need.has(decl.get(id)))queue.push(id)}
 const body=[...need].sort((a,b)=>a-b).map(i=>sts[i]).join('\n');
 return `/* Rayo UI Template — payroll-engine.js — GENERATED, do not edit.
   The salary calculation of js/00-base.js (${need.size} top-level statements needed by ${ROOTS.join(', ')}), copied unchanged
   by qa_template_payroll_sync.js --write; the same check fails when js/00-base.js changes and this file is not rebuilt.
   PayrollEngine(state) runs them against a personnel document (the \`state\` the original code reads). */
(function(){
window.PayrollEngine=function(state){
'use strict';
${body}
return {${ROOTS.filter(r=>decl.has(r)).join(',')}};
};
})();
`}
const want=build();
if(process.argv.includes('--write')){fs.writeFileSync(OUT,want);console.log('qa_template_payroll_sync: written',OUT,want.length,'chars')}
else{const have=fs.existsSync(OUT)?fs.readFileSync(OUT,'utf8').replace(/\r\n/g,'\n'):'';const ok=have===want.replace(/\r\n/g,'\n');console.log(ok?'qa_template_payroll_sync: payroll-engine.js matches js/00-base.js':'qa_template_payroll_sync: FAIL — run node qa_template_payroll_sync.js --write');process.exit(ok?0:1)}
