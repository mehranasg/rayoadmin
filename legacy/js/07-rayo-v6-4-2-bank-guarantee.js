
(function(){
  const wait=()=>{
    if(typeof state==='undefined'||typeof editPersonnelV63!=='function'||typeof savePersonnelV63!=='function'){setTimeout(wait,80);return;}
    // Base V6.3 functions now contain the banking fields directly. Bind them as a safe fallback.
    if(typeof window.editPersonnel!=='function') window.editPersonnel=editPersonnelV63;
    window.__RAYO_BANK_FIELDS_VERSION__='6.4.2';
  };
  wait();
})();
