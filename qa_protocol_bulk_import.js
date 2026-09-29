'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const read=f=>fs.readFileSync(f,'utf8');
let checks=0;

function makeContext(initialHr){
  const nodes={
    modalTitle:{textContent:''},
    modalBody:{innerHTML:''},
    modalFoot:{innerHTML:''},
    modalBackdrop:{_classes:new Set(),classList:{add(x){this._classes?this._classes.add(x):null},remove(){},contains(){return true}}}
  };
  nodes.modalBackdrop.classList={
    add:x=>nodes.modalBackdrop._classes.add(x),
    remove:x=>nodes.modalBackdrop._classes.delete(x),
    contains:x=>nodes.modalBackdrop._classes.has(x)
  };
  const toasts=[],renderViewCalls=[];
  const document={
    getElementById:id=>nodes[id]||null,
    createElement:()=>({click(){},set href(v){this._href=v},set download(v){this._download=v}}),
    querySelectorAll:()=>[]
  };
  const c={
    document,
    window:null,
    state:JSON.parse(JSON.stringify(initialHr)),
    views:{},
    titles:{},
    pageHead:(t,d,actions)=>`<div class="page-head">${actions||''}</div>`,
    toast:(msg,err)=>{toasts.push({msg,err:!!err})},
    closeModal:()=>{nodes.modalBackdrop.classList.remove('open')},
    renderView:()=>{renderViewCalls.push(1)},
    confirm:()=>true,
    commit:async()=>true,
    setTimeout,
    Blob:class{constructor(parts,opts){this.parts=parts;this.type=opts&&opts.type}},
    URL:{createObjectURL:()=>'blob:mock',revokeObjectURL:()=>{}},
    FileReader:class{
      readAsText(file){
        this.result=file.__text;
        if(file.__readError){if(this.onerror)this.onerror();return}
        if(this.onload)this.onload();
      }
    },
    migrate:d=>{
      d=d||{};
      d.lists=d.lists||{};
      d.lists.protocolGroups=Array.isArray(d.lists.protocolGroups)?d.lists.protocolGroups:[];
      d.lists.sections=Array.isArray(d.lists.sections)?d.lists.sections:[];
      d.protocols=Array.isArray(d.protocols)?d.protocols:[];
      d.changeLog=Array.isArray(d.changeLog)?d.changeLog:[];
      d.checklistTemplates=Array.isArray(d.checklistTemplates)?d.checklistTemplates:[];
      d.checklistRecords=Array.isArray(d.checklistRecords)?d.checklistRecords:[];
      return d;
    },
    RayoJalali:{today:()=>'1405/06/01'},
    location:{pathname:'/settings.html',search:''},
    URLSearchParams,
    currentView:'protocols'
  };
  c.window=c;
  vm.createContext(c);
  return {c,nodes,toasts,renderViewCalls};
}

function loadModule(ctx){
  vm.runInContext(read('js/29-training-checklists-v9-7-0.js'),ctx.c);
}

function baseHr(){
  return {
    personnel:[{id:'EMP-00001',name:'کاربر تست'}],
    unknownFutureField:{keepMe:true},
    protocols:[],
    lists:{protocolGroups:[],sections:['سالن بالا','سالن پایین','آشپزخانه']},
    changeLog:[]
  };
}

function mockServer(initial){
  let data=JSON.parse(JSON.stringify(initial));
  return {
    get data(){return data},
    set data(v){data=v},
    async loadOrBootstrap(){return JSON.parse(JSON.stringify(data))},
    async loadModule(){return JSON.parse(JSON.stringify(data))},
    async saveModule(module,payload){data=JSON.parse(JSON.stringify(payload));return{ok:true,verified:true,checked:JSON.parse(JSON.stringify(data))}}
  };
}

function file(name,text,opts={}){
  return {name,size:Buffer.byteLength(text,'utf8'),__text:text,__readError:!!opts.readError};
}

function importFile(ctx,f){
  if(!ctx.nodes.modalBackdrop.classList.contains('open'))ctx.c.RayoTraining.openProtocolImport();
  ctx.c.RayoTraining.handleProtocolImportFile({target:{files:[f],value:''}});
}

async function submit(ctx){
  const p=ctx.c.RayoTraining.submitProtocolImport();
  return p;
}

(async()=>{
  // A) Valid multi-item file: audienceAll item + specific-section item + new group, saved successfully.
  {
    const ctx=makeContext(baseHr());
    loadModule(ctx);
    const server=mockServer(baseHr());
    ctx.c.RAYO_API_GATEWAY={loadOrBootstrap:server.loadOrBootstrap.bind(server),loadModule:server.loadModule.bind(server),saveModule:server.saveModule.bind(server)};
    const payload={schemaVersion:1,items:[
      {title:'قوانین حضور',content:'ساعت شروع را رعایت کنید.',type:'آیین‌نامه',group:'قوانین',audienceAll:true,audienceSections:[],isActive:true},
      {title:'آموزش سالن',content:'میزها را تمیز کنید.',type:'آموزش',group:'آموزش سالن',audienceAll:false,audienceSections:['سالن بالا'],isActive:true}
    ]};
    importFile(ctx,file('a.json',JSON.stringify(payload)));
    assert(ctx.nodes.modalBody.innerHTML.includes('قابل ثبت: 2'),'A: both rows valid in preview');
    await submit(ctx);
    assert.equal(server.data.protocols.length,2,'A: two protocols saved');
    assert.equal(server.data.lists.protocolGroups.length,2,'A: two groups created');
    assert.equal(server.data.personnel.length,1,'A: unrelated personnel untouched');
    assert.deepEqual(server.data.unknownFutureField,{keepMe:true},'A: unknown top-level key preserved');
    const p1=server.data.protocols.find(p=>p.title==='قوانین حضور');
    assert.equal(p1.audienceAll,true);assert.deepEqual(p1.audienceSections,[]);
    const p2=server.data.protocols.find(p=>p.title==='آموزش سالن');
    assert.deepEqual(p2.audienceSections,['سالن بالا']);
    assert(/^PROT-\d{5}$/.test(p1.id)&&/^PROT-\d{5}$/.test(p2.id),'A: generated ids follow app id scheme');
    checks++;
  }

  // B) Corrupt JSON is rejected with a clear error and no partial import state.
  {
    const ctx=makeContext(baseHr());
    loadModule(ctx);
    importFile(ctx,file('bad.json','{ "schemaVersion": 1, items: [ }'));
    assert(ctx.toasts.some(t=>t.err),'B: corrupt JSON produces an error toast');
    assert(!ctx.nodes.modalBody.innerHTML.includes('قابل ثبت'),'B: no preview table rendered for a broken file');
    checks++;
  }

  // C) Incomplete row (missing title) is flagged invalid; a valid sibling row is unaffected.
  {
    const ctx=makeContext(baseHr());
    loadModule(ctx);
    const payload={schemaVersion:1,items:[
      {title:'',content:'متن',type:'پروتکل',group:'',audienceAll:true,audienceSections:[],isActive:true},
      {title:'محتوای معتبر',content:'متن معتبر',type:'پروتکل',group:'',audienceAll:true,audienceSections:[],isActive:true}
    ]};
    importFile(ctx,file('c.json',JSON.stringify(payload)));
    assert(ctx.nodes.modalBody.innerHTML.includes('نامعتبر: 1'),'C: exactly one invalid row');
    assert(ctx.nodes.modalBody.innerHTML.includes('عنوان الزامی'),'C: missing-title error surfaced');
    assert(ctx.nodes.modalBody.innerHTML.includes('قابل ثبت: 1'),'C: valid sibling still importable');
    checks++;
  }

  // D) Unknown audience section is a hard error, never silently promoted to "all".
  {
    const ctx=makeContext(baseHr());
    loadModule(ctx);
    const payload={schemaVersion:1,items:[{title:'محتوا',content:'متن',type:'پروتکل',group:'',audienceAll:false,audienceSections:['بخش ناموجود'],isActive:true}]};
    importFile(ctx,file('d.json',JSON.stringify(payload)));
    assert(ctx.nodes.modalBody.innerHTML.includes('در فهرست بخش‌های فعلی وجود ندارد'),'D: unknown section rejected');
    assert(ctx.nodes.modalBody.innerHTML.includes('قابل ثبت: 0'),'D: nothing importable');
    checks++;
  }

  // D2) ی/ي and ک/ك and spacing differences still resolve to the real existing section/group.
  {
    const hr=baseHr();
    hr.lists.protocolGroups=[{id:'PGRP-00001',name:'قوانین  حضور',createdAt:'x'}];
    const ctx=makeContext(hr);
    loadModule(ctx);
    const payload={schemaVersion:1,items:[{title:'محتوا',content:'متن',type:'پروتکل',group:'قوانین حضور',audienceAll:false,audienceSections:['سالن بالا']}]};
    payload.items[0].isActive=true;
    importFile(ctx,file('d2.json',JSON.stringify(payload)));
    assert(ctx.nodes.modalBody.innerHTML.includes('قابل ثبت: 1'),'D2: fuzzy ی/ي and spacing match resolves to existing group/section');
    assert(!ctx.nodes.modalBody.innerHTML.includes('badge warn">گروه جدید'),'D2: matched existing group, no spurious "new group" badge');
    checks++;
  }

  // E) Ambiguous group name (two existing groups collide after normalization) errors instead of guessing.
  {
    const hr=baseHr();
    hr.lists.protocolGroups=[{id:'PGRP-00001',name:'كافه',createdAt:'x'},{id:'PGRP-00002',name:'کافه',createdAt:'x'}];
    const ctx=makeContext(hr);
    loadModule(ctx);
    const payload={schemaVersion:1,items:[{title:'محتوا',content:'متن',type:'پروتکل',group:'كافه',audienceAll:true,audienceSections:[],isActive:true}]};
    importFile(ctx,file('e.json',JSON.stringify(payload)));
    assert(ctx.nodes.modalBody.innerHTML.includes('مطابقت مبهم'),'E: ambiguous group reference is rejected');
    checks++;
  }

  // F) Executable HTML in content is escaped in the preview (no script/HTML execution from the file).
  {
    const ctx=makeContext(baseHr());
    loadModule(ctx);
    const payload={schemaVersion:1,items:[{title:'<img src=x onerror=alert(1)>',content:'<script>alert(2)</script>',type:'پروتکل',group:'',audienceAll:true,audienceSections:[],isActive:true}]};
    importFile(ctx,file('f.json',JSON.stringify(payload)));
    assert(!ctx.nodes.modalBody.innerHTML.includes('<script>alert'),'F: content is HTML-escaped in preview');
    assert(!ctx.nodes.modalBody.innerHTML.includes('<img src=x'),'F: title is HTML-escaped in preview');
    assert(ctx.nodes.modalBody.innerHTML.includes('&lt;script&gt;')||ctx.nodes.modalBody.innerHTML.includes('&lt;img'),'F: escaped markers present');
    checks++;
  }

  // G) Re-uploading the same already-saved file yields zero includable rows (no duplicate on re-import).
  {
    const ctx=makeContext(baseHr());
    loadModule(ctx);
    const server=mockServer(baseHr());
    ctx.c.RAYO_API_GATEWAY={loadOrBootstrap:server.loadOrBootstrap.bind(server),loadModule:server.loadModule.bind(server),saveModule:server.saveModule.bind(server)};
    const payload={schemaVersion:1,items:[{title:'محتوای یکتا',content:'متن یکتا',type:'پروتکل',group:'',audienceAll:true,audienceSections:[],isActive:true}]};
    importFile(ctx,file('g.json',JSON.stringify(payload)));
    await submit(ctx);
    assert.equal(server.data.protocols.length,1,'G: first import saved once');
    // Simulate re-opening the modal and re-selecting the exact same file.
    importFile(ctx,file('g.json',JSON.stringify(payload)));
    assert(ctx.nodes.modalBody.innerHTML.includes('قابل ثبت: 0'),'G: re-imported identical file has nothing includable');
    assert(ctx.nodes.modalBody.innerHTML.includes('تکراری: 1'),'G: re-imported row flagged as duplicate');
    checks++;
  }

  // H) Same title, different content is a conflict — excluded by default, included only after explicit opt-in.
  {
    const hr=baseHr();
    hr.protocols=[{id:'PROT-00001',title:'قوانین عمومی',type:'پروتکل',groupId:'',content:'متن قدیمی',audienceAll:true,audienceSections:[],isActive:true,createdAt:'x',updatedAt:'x'}];
    const ctx=makeContext(hr);
    loadModule(ctx);
    const server=mockServer(hr);
    ctx.c.RAYO_API_GATEWAY={loadOrBootstrap:server.loadOrBootstrap.bind(server),loadModule:server.loadModule.bind(server),saveModule:server.saveModule.bind(server)};
    const payload={schemaVersion:1,items:[{title:'قوانین عمومی',content:'متن کاملا متفاوت',type:'پروتکل',group:'',audienceAll:true,audienceSections:[],isActive:true}]};
    importFile(ctx,file('h.json',JSON.stringify(payload)));
    assert(ctx.nodes.modalBody.innerHTML.includes('تعارض عنوان'),'H: same title/different content flagged as conflict');
    assert(ctx.nodes.modalBody.innerHTML.includes('قابل ثبت: 0'),'H: conflict excluded from submission by default');
    ctx.c.RayoTraining.toggleImportConflict(0);
    assert(ctx.nodes.modalBody.innerHTML.includes('قابل ثبت: 1'),'H: explicit opt-in includes the conflicting row');
    await submit(ctx);
    assert.equal(server.data.protocols.length,2,'H: conflict row saved alongside the existing one after opt-in');
    checks++;
  }

  // I) Double-click guard: two concurrent submit calls only save once.
  {
    const ctx=makeContext(baseHr());
    loadModule(ctx);
    const server=mockServer(baseHr());
    let saveCalls=0;
    ctx.c.RAYO_API_GATEWAY={
      loadOrBootstrap:server.loadOrBootstrap.bind(server),
      loadModule:server.loadModule.bind(server),
      saveModule:async(m,payload)=>{saveCalls++;await new Promise(r=>setTimeout(r,5));return server.saveModule(m,payload)}
    };
    const payload={schemaVersion:1,items:[{title:'محتوای تک',content:'متن تک',type:'پروتکل',group:'',audienceAll:true,audienceSections:[],isActive:true}]};
    importFile(ctx,file('i.json',JSON.stringify(payload)));
    const p1=submit(ctx),p2=submit(ctx);
    await Promise.all([p1,p2]);
    assert.equal(saveCalls,1,'I: double-click only triggers one save call');
    assert.equal(server.data.protocols.length,1,'I: no duplicate protocol from double submit');
    checks++;
  }

  // J) Ambiguous failure that did NOT actually land: retry after reload saves exactly once, no duplicate.
  {
    const ctx=makeContext(baseHr());
    loadModule(ctx);
    const server=mockServer(baseHr());
    let attempt=0;
    ctx.c.RAYO_API_GATEWAY={
      loadOrBootstrap:server.loadOrBootstrap.bind(server),
      loadModule:server.loadModule.bind(server),
      saveModule:async(m,payload)=>{
        attempt++;
        if(attempt===1){const e=new Error('timeout');e.code='timeout';throw e}
        return server.saveModule(m,payload);
      }
    };
    const payload={schemaVersion:1,items:[{title:'محتوای بازیابی',content:'متن بازیابی',type:'پروتکل',group:'',audienceAll:true,audienceSections:[],isActive:true}]};
    importFile(ctx,file('j.json',JSON.stringify(payload)));
    await submit(ctx);
    assert(ctx.toasts.some(t=>t.err&&/نامشخص/.test(t.msg)),'J: first ambiguous attempt reports an unresolved-result message');
    assert.equal(server.data.protocols.length,0,'J: nothing landed server-side after the failed attempt');
    await submit(ctx);
    assert.equal(server.data.protocols.length,1,'J: retry after reload saves exactly once');
    checks++;
  }

  // K) Ambiguous failure that DID actually land is recognized via reload and treated as success (no duplicate retry needed).
  {
    const ctx=makeContext(baseHr());
    loadModule(ctx);
    const server=mockServer(baseHr());
    let attempt=0;
    ctx.c.RAYO_API_GATEWAY={
      loadOrBootstrap:server.loadOrBootstrap.bind(server),
      loadModule:async()=>{
        if(attempt===1){
          // Simulate the write having actually succeeded server-side despite the client-side error.
          const d=JSON.parse(JSON.stringify(server.data));
          d.protocols.push({id:'PROT-00001',title:'محتوای مبهم موفق',type:'پروتکل',groupId:'',content:'متن',audienceAll:true,audienceSections:[],isActive:true,createdAt:'x',updatedAt:'x'});
          return d;
        }
        return server.loadModule();
      },
      saveModule:async(m,payload)=>{
        attempt++;
        const e=new Error('timeout');e.code='timeout';throw e;
      }
    };
    const payload={schemaVersion:1,items:[{title:'محتوای مبهم موفق',content:'متن',type:'پروتکل',group:'',audienceAll:true,audienceSections:[],isActive:true}]};
    importFile(ctx,file('k.json',JSON.stringify(payload)));
    await submit(ctx);
    assert(ctx.toasts.some(t=>!t.err&&/تأیید شد/.test(t.msg)),'K: confirmed-via-reload success is reported to the user');
    assert(!ctx.nodes.modalBackdrop.classList.contains('open'),'K: modal closes once the ambiguous save is confirmed');
    checks++;
  }

  console.log(`PASS ${checks}: protocol bulk JSON import — valid batch, corrupt/invalid rows, section/group matching and ambiguity, XSS-safe preview, duplicate/conflict handling, double-submit guard, ambiguous-save retry safety`);
})().catch(err=>{console.error(err);process.exitCode=1});
