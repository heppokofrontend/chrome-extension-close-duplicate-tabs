"use strict";(()=>{var S=(e,t)=>typeof e!="object"||e===null?{...t}:{...t,...e},c={ignorePathname:!1,ignoreQuery:!1,ignoreHash:!0,includeAllWindow:!1,includePinnedTabs:!1,forcedChangeURLWhenClickedAnchorLink:!1,noConfirm:!1,minCategorizeNumber:1,autoAvoidDuplicate:!1,updateBadgeMode:"none",useAdvancedPathRule:!1,advancedPathRules:{},shown:{}},p=async()=>{let{saveData:e}=await chrome.storage.local.get("saveData");return S(e,c)};var P=Promise.resolve();var m=e=>e.replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t]);p().then(e=>{document.body.dataset.includeAllWindow=String(e.includeAllWindow)});var U=async()=>{let{lastWindowId:e}=await chrome.storage.session.get("lastWindowId");document.querySelector("#return button")?.addEventListener("click",()=>{typeof e=="number"&&chrome.windows.update(e,{focused:!0},()=>{if(chrome.runtime.lastError){alert(chrome.i18n.getMessage("duplicates_already_closed"));return}})});let{duplicatedEntries:i}=await chrome.storage.session.get("duplicatedEntries"),f=Array.isArray(i)?i:[],b=document.querySelector("#container"),s=document.createDocumentFragment(),y=`
    <thead>
      <tr>
        <th scope="col">Tab ID</th>
        <th scope="col">Title</th>
      </tr>
    </thead>
  `,h=chrome.i18n.getMessage("duplicates_already_closed");for(let[g,T]of f){let a=document.createElement("div"),d=document.createElement("h2");d.textContent=g;let o=document.createElement("table"),n=document.createElement("tbody");for(let r of T){let w=chrome.i18n.getMessage("duplicates_open_tab",String(r.id));n.insertAdjacentHTML("afterbegin",`
        <tr>
          <th scope="row"><button type="button" aria-label="${m(w)}">
            <span>${r.id}</span>
            <img src="./images/open.svg" />
          </button></th>
          <td class="title">
            <div>${m(r.title??"")}</div>
            <div role="alert"><span class="status">${h}</span></div>
          </td>
        </tr>
      `);let l=n.querySelector("button"),u=n.querySelector("tr");l?.addEventListener("click",()=>{let v=r.id;chrome.tabs.update(v,{active:!0},()=>{if(chrome.runtime.lastError&&u){u.dataset.closed="true",l.setAttribute("aria-disabled","true");return}chrome.windows.update(r.windowId,{focused:!0},()=>{if(chrome.runtime.lastError){console.error(chrome.runtime.lastError.message);return}})})})}o.insertAdjacentHTML("beforeend",y),o.appendChild(n),a.appendChild(d),a.appendChild(o),s.appendChild(a)}b?.appendChild(s)};U();})();
