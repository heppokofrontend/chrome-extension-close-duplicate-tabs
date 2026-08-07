"use strict";(()=>{var f=e=>document.querySelector(e),i={focusCurrentWindowButton:f("#focus-current-window-button"),report:f("#report")};var l=(e,t)=>{let o=chrome.i18n.getMessage(e,t);if(o==="")throw new Error(`i18n message not found: ${e}`);return o};var E=(e,t)=>typeof e!="object"||e===null?{...t}:{...t,...e},v=e=>typeof e=="object"&&e!==null&&Object.values(e).every(t=>typeof t=="boolean"),x={ignorePathname:!1,ignoreQuery:!1,ignoreHash:!0,includeAllWindow:!1,includePinnedTabs:!1,forcedChangeURLWhenClickedAnchorLink:!1,noConfirm:!1,minCategorizeNumber:1,autoAvoidDuplicate:!1,updateBadgeMode:"none",useAdvancedPathRule:!1,advancedPathRules:{},shown:{},inputHistory:{}};async function h(e){let t=await chrome.storage.local.get(e);return e==="saveData"?E(t.saveData,x):e==="dialogOpenStatus"?v(t.dialogOpenStatus)?t.dialogOpenStatus:{}:t[e]}var A=e=>Array.isArray(e)&&typeof e[0]=="string"&&Array.isArray(e[1])&&e[1].every(t=>typeof t=="object"&&t!==null&&"id"in t&&"url"in t&&typeof t.id=="number"&&typeof t.url=="string");async function c(e){let t=await chrome.storage.session.get(e);switch(e){case"duplicatedEntries":return Array.isArray(t.duplicatedEntries)?t.duplicatedEntries.filter(A):[];case"lastWindowId":{let o=t.lastWindowId;return typeof o=="number"?Number.isNaN(o)?null:o:null}default:return t[e]}}var W=Promise.resolve();var b=chrome.i18n.getMessage("duplicates_window_not_found"),y=async()=>{let e=await c("lastWindowId");i.focusCurrentWindowButton.addEventListener("click",()=>{if(e===null){alert(b);return}chrome.windows.update(e,{focused:!0},()=>{chrome.runtime.lastError&&alert(b)})})};var u=e=>e.replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t]),w=(e,t)=>{let o=l("duplicates_open_tab",String(t.id)),a=l("duplicates_close_tab",t.title??String(t.id)),r=l("duplicates_already_closed");e.insertAdjacentHTML("afterbegin",`
    <tr>
      <th scope="row"><button type="button" class="btn-focus" aria-label="${u(o)}">
        <span>${t.id}</span>
        <img src="./images/open.svg" alt="" />
      </button></th>
      <td class="title">
        <div>${u(t.title??"")}</div>
        <div role="alert"><span class="status"></span></div>
      </td>
      <td class="close">
        <button type="button" aria-label="${t.id}: ${u(a)}">
          <img src="./images/close.svg" alt="" />
        </button>
      </td>
    </tr>
  `);let n=e.querySelector("tr"),s=n?.querySelector(".status"),p=n?.querySelector("th button"),m=n?.querySelector("td.close button"),g=d=>{n&&(n.dataset.status=d),p?.setAttribute("aria-disabled","true"),m?.setAttribute("aria-disabled","true"),s&&(s.textContent=r)};p?.addEventListener("click",()=>{let d=t.id;chrome.tabs.update(d,{active:!0},()=>{if(chrome.runtime.lastError){g("already-closed");return}chrome.windows.update(t.windowId,{focused:!0},()=>{chrome.runtime.lastError&&console.error(chrome.runtime.lastError.message)})})}),m?.addEventListener("click",()=>{g("closed"),chrome.tabs.remove(t.id,()=>{chrome.runtime.lastError&&console.error(chrome.runtime.lastError.message)})})};var P=`
  <thead>
    <tr>
      <th scope="col">Tab ID</th>
      <th scope="col">Title</th>
      <th scope="col">Close</th>
    </tr>
  </thead>
`,S=(e,t)=>{let o=document.createElement("div"),a=document.createElement("h2");a.textContent=e;let r=document.createElement("table"),n=document.createElement("tbody");for(let s of t)w(n,s);return r.insertAdjacentHTML("beforeend",P),r.appendChild(n),o.appendChild(a),o.appendChild(r),o};var T=async()=>{let e=await c("duplicatedEntries"),t=document.createDocumentFragment();for(let[o,a]of e){let r=S(o,a);t.appendChild(r)}i.report.appendChild(t)};h("saveData").then(e=>{document.body.dataset.includeAllWindow=String(e.includeAllWindow)});var D=async()=>{await y(),await T(),setTimeout(()=>{document.body.dataset.transition="ready"},300)};D();})();
