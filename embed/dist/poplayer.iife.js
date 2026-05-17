(function(){var e=`http://localhost:4000/api`;function t(t){t&&/^https?:\/\//i.test(t)&&(e=t.replace(/\/$/,``),console.log(`PopLayer: API Base set to`,e))}function n(e){if(!e?.src)return null;try{return`${new URL(e.src).origin}/api`}catch{return null}}async function r(t){try{return await(await fetch(`${e}/embed/${t}`)).json()}catch{return{popups:[]}}}async function i(t){try{return await(await fetch(`${e}/embed/popup/${t}`)).json()}catch{return{popups:[]}}}async function a(t){try{await fetch(`${e}/leads`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(t)})}catch(e){console.error(`PopLayer: lead submission failed`,e)}}async function o(t,n,r=`A`){try{await fetch(`${e}/analytics/event`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({popupId:t,event:n,variant:r})})}catch{}}function s(e,t){let{triggers:n}=e,r=`poplayer_shown_${e.id}`;if(n.frequency===`once_per_session`&&sessionStorage.getItem(r))return;if(n.frequency===`once_per_day`){let e=localStorage.getItem(r);if(e&&Date.now()-e<864e5)return}if(n.urlMatch)try{if(!new RegExp(n.urlMatch).test(window.location.href))return}catch{return}let i=window.innerWidth<768;if(!(n.device===`mobile`&&!i)&&!(n.device===`desktop`&&i))if(n.type===`time_delay`)setTimeout(()=>{c(r,n.frequency),t()},(n.delaySeconds||5)*1e3);else if(n.type===`scroll_percent`){let e=()=>{let i=document.body.scrollHeight-window.innerHeight;(i<=0?100:window.scrollY/i*100)>=(n.scrollPercent||50)&&(window.removeEventListener(`scroll`,e),c(r,n.frequency),t())};window.addEventListener(`scroll`,e)}else if(n.type===`exit_intent`){let e=i=>{i.clientY<=5&&(document.removeEventListener(`mouseleave`,e),c(r,n.frequency),t())};document.addEventListener(`mouseleave`,e)}else c(r,n.frequency),t()}function c(e,t){t===`once_per_session`&&sessionStorage.setItem(e,`1`),t===`once_per_day`&&localStorage.setItem(e,Date.now())}function l(e,t){let{bgColor:n=`#fff`,accentColor:r=`#6366f1`,textColor:i=`#111`,borderRadius:a=12}=t;return`
    #poplayer-overlay-${e} {
      position: fixed; inset: 0; z-index: 999999;
      background: rgba(0,0,0,0.65);
      backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    #poplayer-overlay-${e} .poplayer-box {
      background: ${n}; color: ${i};
      border-radius: ${a}px;
      width: 90%; max-width: 440px;
      position: relative; box-shadow: 0 25px 60px rgba(0,0,0,0.3);
      animation: plFadeIn 0.3s ease;
      overflow: hidden; display: flex; flex-direction: column;
    }
    #poplayer-overlay-${e} .poplayer-box.side-by-side {
      flex-direction: row; max-width: 700px;
    }
    #poplayer-overlay-${e} .poplayer-content {
      padding: 2rem; flex: 1; position: relative;
    }
    #poplayer-overlay-${e} .poplayer-image {
      flex: 1; overflow: hidden; min-height: 200px;
    }
    #poplayer-overlay-${e} .poplayer-image img {
      width: 100%; height: 100%; object-cover: cover;
      display: block; min-height: 100%;
    }
    #poplayer-overlay-${e} .poplayer-close {
      position: absolute; top: 12px; right: 16px;
      background: none; border: none; font-size: 1.5rem;
      cursor: pointer; color: #999; line-height: 1; z-index: 10;
    }
    #poplayer-overlay-${e} .poplayer-headline {
      font-size: 1.5rem; font-weight: 700; margin: 0 0 0.5rem;
    }
    #poplayer-overlay-${e} .poplayer-subtext {
      font-size: 0.9rem; opacity: 0.7; margin-bottom: 1.25rem;
    }
    #poplayer-overlay-${e} .poplayer-input {
      width: 100%; padding: 0.6rem 0.85rem;
      border: 1px solid #e5e7eb; border-radius: 8px;
      margin-bottom: 0.75rem; font-size: 0.9rem; box-sizing: border-box;
    }
    #poplayer-overlay-${e} .poplayer-btn {
      width: 100%; padding: 0.75rem;
      background: ${r}; color: white;
      border: none; border-radius: 8px;
      font-size: 1rem; font-weight: 600; cursor: pointer;
    }
    #poplayer-overlay-${e} .poplayer-coupon {
      border: 2px dashed ${r}; color: ${r};
      text-align: center; padding: 0.75rem;
      border-radius: 8px; font-family: monospace;
      font-size: 1.25rem; font-weight: 700;
      letter-spacing: 0.15em; margin-bottom: 1rem;
    }
    #poplayer-overlay-${e} .poplayer-success {
      text-align: center; padding: 2rem; font-size: 1.1rem; font-weight: 600;
    }

    @media (max-width: 640px) {
      #poplayer-overlay-${e} .poplayer-box.side-by-side {
        flex-direction: column;
        max-width: 400px;
      }
      #poplayer-overlay-${e} .poplayer-image {
        min-height: 160px;
        max-height: 200px;
      }
      #poplayer-overlay-${e} .poplayer-headline {
        font-size: 1.25rem;
      }
      #poplayer-overlay-${e} .poplayer-content {
        padding: 1.5rem;
      }
    }

    @keyframes plFadeIn {
      from { opacity: 0; transform: scale(0.95); }
      to   { opacity: 1; transform: scale(1); }
    }
  `}function u(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#039;`)}function d(e){return String(e||``).toLowerCase().replace(/\s+/g,`_`).replace(/[^a-z0-9_-]/g,``)}function f(e){let{id:t,config:n}=e;if(document.getElementById(`poplayer-overlay-${t}`))return;let r=document.createElement(`style`);r.textContent=l(t,n),document.head.appendChild(r);let i=document.createElement(`div`);i.id=`poplayer-overlay-${t}`,i.className=`poplayer-overlay`,i.innerHTML=p(t,n,e.type),document.body.appendChild(i),o(t,`VIEW`,e.variant),i.querySelector(`.poplayer-close`)?.addEventListener(`click`,()=>{i.remove(),o(t,`CLOSE`,e.variant)}),i.querySelector(`.poplayer-form`)?.addEventListener(`submit`,async r=>{r.preventDefault();let o=new FormData(r.target),s={popupId:t,email:o.get(`email`)||``,name:o.get(`name`)||null,phone:o.get(`phone`)||null,sourceUrl:window.location.href,variant:e.variant},c={};for(let[e,t]of o.entries())[`email`,`name`,`phone`].includes(e)||(c[e]=t);Object.keys(c).length>0&&(s.customFields=c),await a(s),i.querySelector(`.poplayer-box`).innerHTML=`<div class="poplayer-success">${u(n.successMessage||`Thank you!`)}</div>`,setTimeout(()=>i.remove(),2500)})}function p(t,n,r){let i=(n.fields||[]).map(e=>{let t=e.required?`required`:``,n=u(e.placeholder||e.label||``),r=d(e.id||e.label||``),i=[`text`,`email`,`tel`,`number`,`url`].includes(e.type)?e.type:`text`;return r?e.type===`hidden`?`<input type="hidden" name="${r}" value="${u(e.value||``)}" />`:e.type===`textarea`?`<textarea class="poplayer-input" name="${r}" placeholder="${n}" rows="2" ${t}></textarea>`:e.type===`select`?`<select class="poplayer-input" name="${r}" ${t}>
        <option value="" disabled selected>${n}</option>
        ${(Array.isArray(e.options)?e.options:[]).map(e=>{let t=u(e);return`<option value="${t}">${t}</option>`}).join(``)}
      </select>`:`<input class="poplayer-input" type="${i}" name="${r}" placeholder="${n}" ${t} />`:``}).join(``),a=n.showCouponCode&&n.couponCode?`<div class="poplayer-coupon">${u(n.couponCode)}</div>`:``,o=r===`ANNOUNCEMENT`?`<button class="poplayer-btn poplayer-close">${u(n.ctaText||`Got it`)}</button>`:`<form class="poplayer-form">${i}<button type="submit" class="poplayer-btn">${u(n.ctaText||`Submit`)}</button></form>`,s=t=>t?t.startsWith(`http`)?t:`${e.replace(/\/api$/,``).replace(/\/$/,``)}${t.startsWith(`/`)?``:`/`}${t}`:``,c=n.layout===`side-by-side`&&n.imageUrl,l=n.imageUrl?`<div class="poplayer-image"><img src="${s(n.imageUrl)}" alt="Popup" /></div>`:``,f=`
    <div class="poplayer-content">
      ${n.closeButton===!1?``:`<button class="poplayer-close">&times;</button>`}
      <h2 class="poplayer-headline">${u(n.headline||``)}</h2>
      <p class="poplayer-subtext">${u(n.subtext||``)}</p>
      ${a}
      ${o}
    </div>
  `;return`
    <div class="poplayer-box ${c?`side-by-side`:``}" id="poplayer-box-${t}">
      ${c&&n.imageSide===`left`?l:``}
      ${f}
      ${c&&n.imageSide===`right`?l:``}
    </div>
  `}function m(){let e=document.querySelector(`script[src*="poplayer.iife.js"]`);if(e)return e;let t=document.currentScript;if(t?.src&&/poplayer\.iife\.js/i.test(t.src))return t;let n=document.querySelectorAll(`script[data-popup-id], script[data-site-id]`);for(let e of n)if(e.src&&/poplayer\.iife\.js/i.test(e.src))return e;return t||document.querySelector(`script[data-popup-id]`)||document.querySelector(`script[data-site-id]`)}(async function(){let e=m(),a=e?.getAttribute(`data-popup-id`),o=e?.getAttribute(`data-site-id`),c=e?.getAttribute(`data-api-url`);if(!a&&!o)return;let l=n(e);t(c||l);let u;u=a?await i(a):await r(o);let{popups:d}=u;if(!(!d||d.length===0))for(let e of d){let t=`A`;if(e.abTestEnabled&&e.configB&&e.triggersB){let n=`poplayer_variant_${e.id}`,r=sessionStorage.getItem(n);r||(r=Math.random()<.5?`A`:`B`,sessionStorage.setItem(n,r)),t=r,t===`B`&&(e.config=e.configB,e.triggers=e.triggersB)}e.variant=t,s(e,()=>f(e))}})()})();