(()=>{"use strict";const e=(e,r)=>{const n=new URL(e),{origin:o,hash:s,search:t}=n,a=n.pathname.replace(/\/index\.(x?html?|php|cgi|aspx)$/,"/");return r?.noHash&&r?.noQuery?`${o}${a}`:r?.noHash?`${o}${a}${t}`:r?.noQuery?`${o}${a}${s}`:`${o}${a}${t}${s}`},r={remove(r,n){const o=r.filter(((r,o,s)=>{const t=({url:o})=>o&&r.url&&e(o,n)===e(r.url,n),a=s.findIndex(t),c=[...s].reverse(),i=s.length-c.findIndex(t)-1;return a===o&&i!==o}));for(const{id:e}of o)e&&chrome.tabs.remove(e)},reload(e){for(const{id:r}of e)r&&chrome.tabs.reload(r)}},n=({task:e,ignore:n})=>{chrome.tabs.query({currentWindow:!0},(o=>{console.log(n),r[e]?.(o,n)}))};chrome.runtime.onConnect.addListener((e=>{e.onMessage.addListener(n)}))})();