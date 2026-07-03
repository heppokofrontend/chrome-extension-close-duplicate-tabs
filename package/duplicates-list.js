"use strict";(()=>{chrome.storage.local.get("saveData",({saveData:e})=>{document.body.dataset.includeAllWindow=String(e.includeAllWindow??!1)});var y=async()=>{let{lastWindowId:e}=await chrome.storage.session.get("lastWindowId");document.querySelector("#return button")?.addEventListener("click",()=>{typeof e=="number"&&chrome.windows.update(e,{focused:!0},()=>{if(chrome.runtime.lastError){alert(chrome.i18n.getMessage("duplicates_already_closed"));return}})});let{duplicatedEntries:i}=await chrome.storage.session.get("duplicatedEntries"),l=i,u=document.querySelector("#container"),o=document.createDocumentFragment(),m=`
    <thead>
      <tr>
        <th scope="col">Tab ID</th>
        <th scope="col">Title</th>
      </tr>
    </thead>
  `,p=chrome.i18n.getMessage("duplicates_already_closed");for(let[h,b]of l){let n=document.createElement("div"),s=document.createElement("h2");s.textContent=h;let a=document.createElement("table"),r=document.createElement("tbody");for(let t of b){r.insertAdjacentHTML("afterbegin",`
        <tr>
          <th scope="row"><button type="button" aria-label="${String(t.id)}\u3092\u958B\u304F">
            <span>${String(t.id)}</span>
            <img src="./images/open.svg" />
          </button></th>
          <td class="title">
            <div>${t.title??""}</div>
            <div role="alert"><span class="status">${p}</span></div>
          </td>
        </tr>
      `);let c=r.querySelector("button"),d=r.querySelector("tr");c?.addEventListener("click",()=>{let g=t.id;chrome.tabs.update(g,{active:!0},()=>{if(chrome.runtime.lastError&&d){d.dataset.closed="true",c.setAttribute("aria-disabled","true");return}chrome.windows.update(t.windowId,{focused:!0},()=>{if(chrome.runtime.lastError){console.error(chrome.runtime.lastError.message);return}})})})}a.insertAdjacentHTML("beforeend",m),a.appendChild(r),n.appendChild(s),n.appendChild(a),o.appendChild(n)}u?.appendChild(o)};y();})();
