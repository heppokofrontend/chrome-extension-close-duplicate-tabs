"use strict";(()=>{var T=(e,t)=>typeof e!="object"||e===null?{...t}:{...t,...e},D={ignorePathname:!1,ignoreQuery:!1,ignoreHash:!0,includeAllWindow:!1,includePinnedTabs:!1,forcedChangeURLWhenClickedAnchorLink:!1,noConfirm:!1,minCategorizeNumber:1,autoAvoidDuplicate:!1,shown:{}},u=async()=>{let{saveData:e}=await chrome.storage.local.get("saveData");return T(e,D)};var x=Promise.resolve();var m=e=>e.replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t]);u().then(e=>{document.body.dataset.includeAllWindow=String(e.includeAllWindow)});var S=async()=>{let{lastWindowId:e}=await chrome.storage.session.get("lastWindowId");document.querySelector("#return button")?.addEventListener("click",()=>{typeof e=="number"&&chrome.windows.update(e,{focused:!0},()=>{if(chrome.runtime.lastError){alert(chrome.i18n.getMessage("duplicates_already_closed"));return}})});let{duplicatedEntries:i}=await chrome.storage.session.get("duplicatedEntries"),p=Array.isArray(i)?i:[],h=document.querySelector("#container"),s=document.createDocumentFragment(),g=`
    <thead>
      <tr>
        <th scope="col">Tab ID</th>
        <th scope="col">Title</th>
      </tr>
    </thead>
  `,b=chrome.i18n.getMessage("duplicates_already_closed");for(let[y,f]of p){let r=document.createElement("div"),c=document.createElement("h2");c.textContent=y;let o=document.createElement("table"),n=document.createElement("tbody");for(let a of f){let v=chrome.i18n.getMessage("duplicates_open_tab",String(a.id));n.insertAdjacentHTML("afterbegin",`
        <tr>
          <th scope="row"><button type="button" aria-label="${m(v)}">
            <span>${a.id}</span>
            <img src="./images/open.svg" />
          </button></th>
          <td class="title">
            <div>${m(a.title??"")}</div>
            <div role="alert"><span class="status">${b}</span></div>
          </td>
        </tr>
      `);let l=n.querySelector("button"),d=n.querySelector("tr");l?.addEventListener("click",()=>{let w=a.id;chrome.tabs.update(w,{active:!0},()=>{if(chrome.runtime.lastError&&d){d.dataset.closed="true",l.setAttribute("aria-disabled","true");return}chrome.windows.update(a.windowId,{focused:!0},()=>{if(chrome.runtime.lastError){console.error(chrome.runtime.lastError.message);return}})})})}o.insertAdjacentHTML("beforeend",g),o.appendChild(n),r.appendChild(c),r.appendChild(o),s.appendChild(r)}h?.appendChild(s)};S();})();
