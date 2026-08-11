"use strict";(()=>{var S=t=>document.querySelector(t),l={focusCurrentWindowButton:S("#focus-current-window-button"),report:S("#report")};var a=(t,e,o)=>{let n=chrome.i18n.getMessage(t,e);if(n===""&&!o?.allowEmpty)throw new Error(`i18n message not found: ${t}`);return n};var M=(t,e)=>typeof t!="object"||t===null?{...e}:{...e,...t},D=t=>typeof t=="object"&&t!==null&&Object.values(t).every(e=>typeof e=="boolean"),P={ignorePathname:!1,ignoreQuery:!1,ignoreHash:!0,includeAllWindow:!1,includePinnedTabs:!1,forcedChangeURLWhenClickedAnchorLink:!1,noConfirm:!1,minCategorizeNumber:1,autoAvoidDuplicate:!1,updateBadgeMode:"none",useAdvancedPathRule:!1,advancedPathRules:{},shown:{},inputHistory:{}};async function w(t){let e=await chrome.storage.local.get(t);return t==="saveData"?M(e.saveData,P):t==="dialogOpenStatus"?D(e.dialogOpenStatus)?e.dialogOpenStatus:{}:e[t]}var I=t=>Array.isArray(t)&&typeof t[0]=="string"&&Array.isArray(t[1])&&t[1].every(e=>typeof e=="object"&&e!==null&&"id"in e&&"url"in e&&typeof e.id=="number"&&typeof e.url=="string");async function d(t){let e=await chrome.storage.session.get(t);switch(t){case"duplicatedEntries":return Array.isArray(e.duplicatedEntries)?e.duplicatedEntries.filter(I):[];case"lastWindowId":{let o=e.lastWindowId;return typeof o=="number"?Number.isNaN(o)?null:o:null}default:return e[t]}}var H=Promise.resolve();var T=chrome.i18n.getMessage("duplicates_window_not_found"),A=async()=>{let t=await d("lastWindowId");l.focusCurrentWindowButton.addEventListener("click",()=>{if(t===null){alert(T);return}chrome.windows.update(t,{focused:!0},()=>{chrome.runtime.lastError&&alert(T)})})};var L=1e3,m=6e4,u=36e5,g=864e5,E=(t,e=Date.now())=>{let o=Math.max(0,e-t);if(o<m)return a("duplicates_last_accessed_seconds",String(Math.floor(o/L)));if(o<u)return a("duplicates_last_accessed_minutes",String(Math.floor(o/m)));if(o<g){let i=Math.floor(o/u),s=Math.floor(o%u/m);return a("duplicates_last_accessed_hours",[String(i),String(s)])}let n=Math.floor(o/g),r=Math.floor(o%g/u);return a("duplicates_last_accessed_days",[String(n),String(r)])};var c=t=>t.replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e]);var _=(t,e)=>{let o=a("duplicates_open_tab",String(e.id)),n=a("duplicates_close_tab",e.title??String(e.id)),r=a("duplicates_already_closed"),i=e.lastAccessed===void 0?"":E(e.lastAccessed);t.insertAdjacentHTML("afterbegin",`
    <tr>
      <th scope="row"><button type="button" class="btn-focus" aria-label="${c(o)}">
        <span>${e.id}</span>
        <img src="./images/open.svg" alt="" />
      </button></th>
      <td class="title">
        <div>${c(e.title??"")}</div>
        <div role="alert"><span class="status"></span></div>
      </td>
      <td class="last-accessed">${c(i)}</td>
      <td class="close">
        <button type="button" aria-label="${e.id}: ${c(n)}">
          <img src="./images/close.svg" alt="" />
        </button>
      </td>
    </tr>
  `);let s=t.querySelector("tr"),f=s?.querySelector(".status"),h=s?.querySelector("th button"),b=s?.querySelector("td.close button"),y=p=>{s&&(s.dataset.status=p),h?.setAttribute("aria-disabled","true"),b?.setAttribute("aria-disabled","true"),f&&(f.textContent=r)};h?.addEventListener("click",()=>{let p=e.id;chrome.tabs.update(p,{active:!0},()=>{if(chrome.runtime.lastError){y("already-closed");return}chrome.windows.update(e.windowId,{focused:!0},()=>{chrome.runtime.lastError&&console.error(chrome.runtime.lastError.message)})})}),b?.addEventListener("click",()=>{y("closed"),chrome.tabs.remove(e.id,()=>{chrome.runtime.lastError&&console.error(chrome.runtime.lastError.message)})})};var R=`
  <thead>
    <tr>
      <th scope="col">Tab ID</th>
      <th scope="col">Title</th>
      <th scope="col">Last Accessed</th>
      <th scope="col">Close</th>
    </tr>
  </thead>
`,x=(t,e)=>{let o=document.createElement("div"),n=document.createElement("h2");n.textContent=t;let r=document.createElement("table"),i=document.createElement("tbody");for(let s of e)_(i,s);return r.insertAdjacentHTML("beforeend",R),r.appendChild(i),o.appendChild(n),o.appendChild(r),o};var v=async()=>{let t=await d("duplicatedEntries"),e=document.createDocumentFragment();for(let[o,n]of t){let r=x(o,n);e.appendChild(r)}l.report.appendChild(e)};w("saveData").then(t=>{document.body.dataset.includeAllWindow=String(t.includeAllWindow)});var U=async()=>{await A(),await v(),setTimeout(()=>{document.body.dataset.transition="ready"},300)};U();})();
