"use strict";(()=>{var o=t=>chrome.i18n.getMessage(t),s=document.querySelectorAll("[data-i18n]");for(let t of s){let{i18n:e}=t.dataset;if(!e)continue;let n=o(e);t.textContent=n}})();
