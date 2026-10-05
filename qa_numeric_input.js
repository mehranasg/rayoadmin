const fs=require('fs'),vm=require('vm'),assert=require('assert');
const listeners={};
class HTMLInputElement{constructor(attrs={}){this._v=attrs.value||'';this.attrs={type:'text',inputmode:'decimal',...attrs};this.dataset={};this.classList={contains:()=>false};this.labels=[{textContent:'مبلغ (تومان)'}];this.readOnly=false;this.disabled=false;this.id='x';this.name=''}
 getAttribute(k){return this.attrs[k]??null}hasAttribute(k){return k in this.attrs}setAttribute(k,v){this.attrs[k]=v}matches(){return false}closest(){return null}setSelectionRange(){}}
Object.defineProperty(HTMLInputElement.prototype,'value',{configurable:true,get(){return this._v},set(v){this._v=String(v)}});
const document={readyState:'loading',addEventListener:(t,f)=>{(listeners[t]=listeners[t]||[]).push(f)},querySelectorAll:()=>[],activeElement:null};
const ctx={window:{},document,HTMLInputElement,location:{pathname:'/x.html',search:''},sessionStorage:{getItem:()=>null},setTimeout:()=>0,console,URLSearchParams};
ctx.window=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync(require('path').join(__dirname,'js/35-operational-closeout-v10-2.js'),'utf8'),ctx);
const fire=(t,el)=>listeners[t].forEach(f=>f({target:el}));
const inp=new HTMLInputElement({value:'1250000'});ctx.RayoNumberUX.scan(inp);
assert.equal(inp._v,'۱٬۲۵۰٬۰۰۰');assert.equal(inp.value,'1250000');
fire('focusin',inp);assert.equal(inp._v,'');assert.equal(inp.value,'1250000','value held while focused');
fire('focusout',inp);assert.equal(inp._v,'۱٬۲۵۰٬۰۰۰','restored on blur without typing');
fire('focusin',inp);inp._v='۳۵۰۰';fire('input',inp);assert.equal(inp._v,'۳٬۵۰۰');assert.equal(inp.value,'3500');fire('focusout',inp);assert.equal(inp.value,'3500');
fire('focusin',inp);inp._v='5';fire('input',inp);inp._v='';fire('input',inp);fire('focusout',inp);assert.equal(inp.value,'','typed then cleared stays empty');
const zero=new HTMLInputElement({value:'0'});ctx.RayoNumberUX.scan(zero);fire('focusin',zero);assert.equal(zero._v,'');fire('focusout',zero);assert.equal(zero.value,'0');
const prog=new HTMLInputElement({value:'10'});ctx.RayoNumberUX.scan(prog);fire('focusin',prog);prog.value=20;assert.equal(prog.value,'20');fire('focusout',prog);assert.equal(prog.value,'20','programmatic set wins');
console.log('numeric UX ok');
