"use strict";(()=>{var T=(e,t)=>typeof e!="object"||e===null?{...t}:{...t,...e},w={ignorePathname:!1,ignoreQuery:!1,ignoreHash:!0,includeAllWindow:!1,includePinnedTabs:!1,forcedChangeURLWhenClickedAnchorLink:!1,noConfirm:!1,minCategorizeNumber:1,autoAvoidDuplicate:!1,updateBadgeMode:"none",shown:{}},u=async()=>{let{saveData:e}=await chrome.storage.local.get("saveData");return T(e,w)};var U=Promise.resolve();var p=e=>e.replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t]);u().then(e=>{document.body.dataset.includeAllWindow=String(e.includeAllWindow)});var S=async()=>{let{lastWindowId:e}=await chrome.storage.session.get("lastWindowId");document.querySelector("#return button")?.addEventListener("click",()=>{typeof e=="number"&&chrome.windows.update(e,{focused:!0},()=>{if(chrome.runtime.lastError){alert(chrome.i18n.getMessage("duplicates_already_closed"));return}})});let{duplicatedEntries:i}=await chrome.storage.session.get("duplicatedEntries"),m=Array.isArray(i)?i:[],h=document.querySelector("#container"),s=document.createDocumentFragment(),g=`
    <thead>
      <tr>
        <th scope="col">Tab ID</th>
        <th scope="col">Title</th>
      </tr>
    </thead>
  `,b=chrome.i18n.getMessage("duplicates_already_closed");for(let[y,f]of m){let r=document.createElement("div"),d=document.createElement("h2");d.textContent=y;let o=document.createElement("table"),n=document.createElement("tbody");for(let a of f){let D=chrome.i18n.getMessage("duplicates_open_tab",String(a.id));n.insertAdjacentHTML("afterbegin",`
        <tr>
          <th scope="row"><button type="button" aria-label="${p(D)}">
            <span>${a.id}</span>
            <img src="./images/open.svg" />
          </button></th>
          <td class="title">
            <div>${p(a.title??"")}</div>
            <div role="alert"><span class="status">${b}</span></div>
          </td>
        </tr>
      `);let c=n.querySelector("button"),l=n.querySelector("tr");c?.addEventListener("click",()=>{let v=a.id;chrome.tabs.update(v,{active:!0},()=>{if(chrome.runtime.lastError&&l){l.dataset.closed="true",c.setAttribute("aria-disabled","true");return}chrome.windows.update(a.windowId,{focused:!0},()=>{if(chrome.runtime.lastError){console.error(chrome.runtime.lastError.message);return}})})})}o.insertAdjacentHTML("beforeend",g),o.appendChild(n),r.appendChild(d),r.appendChild(o),s.appendChild(r)}h?.appendChild(s)};S();})();
