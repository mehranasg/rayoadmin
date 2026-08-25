(function(){
'use strict';
/*
  تنها محل نگهداری دامنه API رایو.
  اگر دامنه عوض شد فقط API_ORIGIN را تغییر دهید.
*/
window.RAYO_ENV=Object.freeze({
  API_ORIGIN:'https://chat.yekzan.com',
  API_PREFIX:'/api/v1.0',
  API_CONTROLLER:'/RayoData',
  TIMEOUT_MS:25000,
  BUILD:'10.10.0'
});
})();
