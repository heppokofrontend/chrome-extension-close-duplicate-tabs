"use strict";(()=>{var w=e=>document.querySelector(e),l={focusCurrentWindowButton:w("#focus-current-window-button"),report:w("#report")};var P=(e,t)=>typeof e=="object"&&!Array.isArray(e)?{substitutions:void 0,options:e}:{substitutions:e,options:t},i=(e,t,o)=>{let{substitutions:n,options:r}=P(t,o),s=chrome.i18n.getMessage(e,n);if(s===""&&r?.allowEmpty!==!0)throw new Error(`i18n message not found: ${e}`);return s};var I=(e,t)=>typeof e!="object"||e===null?{...t}:{...t,...e},S=e=>typeof e=="object"&&e!==null&&Object.values(e).every(t=>typeof t=="boolean"),D={ignorePathname:!1,ignoreQuery:!1,ignoreHash:!0,includeAllWindow:!1,includePinnedTabs:!1,includeGroupedTabs:!0,forcedChangeURLWhenClickedAnchorLink:!1,noConfirm:!1,minCategorizeNumber:1,autoAvoidDuplicate:!1,updateBadgeMode:"none",useAdvancedPathRule:!1,advancedPathRules:{google:{origin:"https://www.google.com",pathname:!1,query:!0,hash:!0,allowedQueryParams:"q"},youtube:{origin:"https://www.youtube.com",pathname:!1,query:!0,hash:!0,allowedQueryParams:"v"}},shown:{},inputHistory:{}};async function T(e){let t=await chrome.storage.local.get(e);if(e==="saveData")return I(t.saveData,D);if(e==="disclosureOpenStatus"){let o="dialogOpenStatus",n=await chrome.storage.local.get(o),r=S(n[o])?n[o]:{};return chrome.storage.local.remove(o),chrome.storage.local.remove("dangerZoneIsOpen"),S(t.disclosureOpenStatus)?t.disclosureOpenStatus:(await chrome.storage.local.set({disclosureOpenStatus:r}),r)}return t[e]}var L=e=>Array.isArray(e)&&typeof e[0]=="string"&&Array.isArray(e[1])&&e[1].every(t=>typeof t=="object"&&t!==null&&"id"in t&&"url"in t&&typeof t.id=="number"&&typeof t.url=="string");async function d(e){let t=await chrome.storage.session.get(e);switch(e){case"duplicatedEntries":return Array.isArray(t.duplicatedEntries)?t.duplicatedEntries.filter(L):[];case"lastWindowId":{let o=t.lastWindowId;return typeof o=="number"?Number.isNaN(o)?null:o:null}default:return t[e]}}var k=Promise.resolve();var A=chrome.i18n.getMessage("duplicates_window_not_found"),v=async()=>{let e=await d("lastWindowId");l.focusCurrentWindowButton.addEventListener("click",()=>{if(e===null){alert(A);return}chrome.windows.update(e,{focused:!0},()=>{chrome.runtime.lastError&&alert(A)})})};var R=1e3,m=6e4,u=36e5,g=864e5,_=(e,t=Date.now())=>{let o=Math.max(0,t-e);if(o<m)return i("duplicates_last_accessed_seconds",String(Math.floor(o/R)));if(o<u)return i("duplicates_last_accessed_minutes",String(Math.floor(o/m)));if(o<g){let s=Math.floor(o/u),a=Math.floor(o%u/m);return i("duplicates_last_accessed_hours",[String(s),String(a)])}let n=Math.floor(o/g),r=Math.floor(o%g/u);return i("duplicates_last_accessed_days",[String(n),String(r)])};var c=e=>e.replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t]);var E=(e,t)=>{let o=i("duplicates_open_tab",String(t.id)),n=i("duplicates_close_tab",t.title??String(t.id)),r=i("duplicates_already_closed"),s=t.lastAccessed===void 0?"":_(t.lastAccessed);e.insertAdjacentHTML("afterbegin",`
    <tr>
      <th scope="row"><button type="button" class="btn-focus" aria-label="${c(o)}">
        <span>${t.id}</span>
        <img src="./images/open.svg" alt="" />
      </button></th>
      <td class="title">
        <div>${c(t.title??"")}</div>
        <div role="alert"><span class="status"></span></div>
      </td>
      <td class="last-accessed">${c(s)}</td>
      <td class="close">
        <button type="button" aria-label="${t.id}: ${c(n)}">
          <img src="./images/close.svg" alt="" />
        </button>
      </td>
    </tr>
  `);let a=e.querySelector("tr"),f=a?.querySelector(".status"),h=a?.querySelector("th button"),b=a?.querySelector("td.close button"),y=p=>{a&&(a.dataset.status=p),h?.setAttribute("aria-disabled","true"),b?.setAttribute("aria-disabled","true"),f&&(f.textContent=r)};h?.addEventListener("click",()=>{let p=t.id;chrome.tabs.update(p,{active:!0},()=>{if(chrome.runtime.lastError){y("already-closed");return}chrome.windows.update(t.windowId,{focused:!0},()=>{chrome.runtime.lastError&&console.error(chrome.runtime.lastError.message)})})}),b?.addEventListener("click",()=>{y("closed"),chrome.tabs.remove(t.id,()=>{chrome.runtime.lastError&&console.error(chrome.runtime.lastError.message)})})};var W=`
  <thead>
    <tr>
      <th scope="col">Tab ID</th>
      <th scope="col">Title</th>
      <th scope="col">Last Accessed</th>
      <th scope="col">Close</th>
    </tr>
  </thead>
`,x=(e,t)=>{let o=document.createElement("div"),n=document.createElement("h2");n.textContent=e;let r=document.createElement("table"),s=document.createElement("tbody");for(let a of t)E(s,a);return r.insertAdjacentHTML("beforeend",W),r.appendChild(s),o.appendChild(n),o.appendChild(r),o};var M=async()=>{let e=await d("duplicatedEntries"),t=document.createDocumentFragment();for(let[o,n]of e){let r=x(o,n);t.appendChild(r)}l.report.appendChild(t)};T("saveData").then(e=>{document.body.dataset.includeAllWindow=String(e.includeAllWindow)});var U=async()=>{await v(),await M(),setTimeout(()=>{document.body.dataset.transition="ready"},300)};U();})();
