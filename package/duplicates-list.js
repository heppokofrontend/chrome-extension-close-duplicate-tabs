"use strict";(()=>{var c=e=>document.querySelector(e),s={focusCurrentWindowButton:c("#focus-current-window-button"),report:c("#report")};var y=(e,t)=>typeof e!="object"||e===null?{...t}:{...t,...e},w=e=>typeof e=="object"&&e!==null&&Object.values(e).every(t=>typeof t=="boolean"),S={ignorePathname:!1,ignoreQuery:!1,ignoreHash:!0,includeAllWindow:!1,includePinnedTabs:!1,forcedChangeURLWhenClickedAnchorLink:!1,noConfirm:!1,minCategorizeNumber:1,autoAvoidDuplicate:!1,updateBadgeMode:"none",useAdvancedPathRule:!1,advancedPathRules:{},shown:{},inputHistory:{}};async function d(e){let t=await chrome.storage.local.get(e);return e==="saveData"?y(t.saveData,S):e==="dialogOpenStatus"?w(t.dialogOpenStatus)?t.dialogOpenStatus:{}:t[e]}var T=e=>Array.isArray(e)&&typeof e[0]=="string"&&Array.isArray(e[1])&&e[1].every(t=>typeof t=="object"&&t!==null&&"id"in t&&"url"in t&&typeof t.id=="number"&&typeof t.url=="string");async function l(e){let t=await chrome.storage.session.get(e);switch(e){case"duplicatedEntries":return Array.isArray(t.duplicatedEntries)?t.duplicatedEntries.filter(T):[];case"lastWindowId":{let o=t.lastWindowId;return typeof o=="number"?Number.isNaN(o)?null:o:null}default:return t[e]}}var P=Promise.resolve();var u=chrome.i18n.getMessage("duplicates_window_not_found"),p=async()=>{let e=await l("lastWindowId");s.focusCurrentWindowButton.addEventListener("click",()=>{if(e===null){alert(u);return}chrome.windows.update(e,{focused:!0},()=>{chrome.runtime.lastError&&alert(u)})})};var m=e=>e.replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t]),g=(e,t,o)=>{let r=chrome.i18n.getMessage("duplicates_open_tab",String(t.id));e.insertAdjacentHTML("afterbegin",`
    <tr>
      <th scope="row"><button type="button" aria-label="${m(r)}">
        <span>${t.id}</span>
        <img src="./images/open.svg" />
      </button></th>
      <td class="title">
        <div>${m(t.title??"")}</div>
        <div role="alert"><span class="status">${o}</span></div>
      </td>
    </tr>
  `);let a=e.querySelector("button"),n=e.querySelector("tr");a?.addEventListener("click",()=>{let i=t.id;chrome.tabs.update(i,{active:!0},()=>{if(chrome.runtime.lastError&&n){n.dataset.closed="true",a.setAttribute("aria-disabled","true");return}chrome.windows.update(t.windowId,{focused:!0},()=>{chrome.runtime.lastError&&console.error(chrome.runtime.lastError.message)})})})};var v=`
  <thead>
    <tr>
      <th scope="col">Tab ID</th>
      <th scope="col">Title</th>
    </tr>
  </thead>
`,f=(e,t,o)=>{let r=document.createElement("div"),a=document.createElement("h2");a.textContent=e;let n=document.createElement("table"),i=document.createElement("tbody");for(let b of t)g(i,b,o);return n.insertAdjacentHTML("beforeend",v),n.appendChild(i),r.appendChild(a),r.appendChild(n),r};var h=async()=>{let e=await l("duplicatedEntries"),t=document.createDocumentFragment(),o=chrome.i18n.getMessage("duplicates_already_closed");for(let[r,a]of e){let n=f(r,a,o);t.appendChild(n)}s.report.appendChild(t)};d("saveData").then(e=>{document.body.dataset.includeAllWindow=String(e.includeAllWindow)});var x=async()=>{await p(),await h()};x();})();
