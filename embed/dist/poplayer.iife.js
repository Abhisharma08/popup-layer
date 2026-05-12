(function(){var e=`http://localhost:4000/api`;async function t(t){try{return await(await fetch(`${e}/embed/${t}`)).json()}catch{return{popups:[]}}}async function n(t){try{return await(await fetch(`${e}/embed/popup/${t}`)).json()}catch{return{popups:[]}}}async function r(t){try{await fetch(`${e}/leads`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(t)})}catch(e){console.error(`PopLayer: lead submission failed`,e)}}async function i(t,n,r=`A`){try{await fetch(`${e}/analytics/event`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({popupId:t,event:n,variant:r})})}catch{}}function a(e,t){let{triggers:n}=e,r=`poplayer_shown_${e.id}`;if(n.frequency===`once_per_session`&&sessionStorage.getItem(r))return;if(n.frequency===`once_per_day`){let e=localStorage.getItem(r);if(e&&Date.now()-e<864e5)return}if(n.urlMatch&&!new RegExp(n.urlMatch).test(window.location.href))return;let i=window.innerWidth<768;if(!(n.device===`mobile`&&!i)&&!(n.device===`desktop`&&i))if(n.type===`time_delay`)setTimeout(()=>{o(r,n.frequency),t()},(n.delaySeconds||5)*1e3);else if(n.type===`scroll_percent`){let e=()=>{window.scrollY/(document.body.scrollHeight-window.innerHeight)*100>=(n.scrollPercent||50)&&(window.removeEventListener(`scroll`,e),o(r,n.frequency),t())};window.addEventListener(`scroll`,e)}else if(n.type===`exit_intent`){let e=i=>{i.clientY<=5&&(document.removeEventListener(`mouseleave`,e),o(r,n.frequency),t())};document.addEventListener(`mouseleave`,e)}else o(r,n.frequency),t()}function o(e,t){t===`once_per_session`&&sessionStorage.setItem(e,`1`),t===`once_per_day`&&localStorage.setItem(e,Date.now())}function s(e,t){let{bgColor:n=`#fff`,accentColor:r=`#6366f1`,textColor:i=`#111`,borderRadius:a=12}=t;return`
    #poplayer-overlay-${e} {
      position: fixed; inset: 0; z-index: 999999;
      background: rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    #poplayer-overlay-${e} .poplayer-box {
      background: ${n}; color: ${i};
      border-radius: ${a}px;
      padding: 2rem; width: 90%; max-width: 440px;
      position: relative; box-shadow: 0 25px 60px rgba(0,0,0,0.3);
      animation: plFadeIn 0.3s ease;
    }
    #poplayer-overlay-${e} .poplayer-close {
      position: absolute; top: 12px; right: 16px;
      background: none; border: none; font-size: 1.5rem;
      cursor: pointer; color: #999; line-height: 1;
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
    @keyframes plFadeIn {
      from { opacity: 0; transform: scale(0.95); }
      to   { opacity: 1; transform: scale(1); }
    }
  `}function c(e){let{id:t,config:n}=e,a=document.createElement(`style`);a.textContent=s(t,n),document.head.appendChild(a);let o=document.createElement(`div`);o.id=`poplayer-overlay-${t}`,o.className=`poplayer-overlay`,o.innerHTML=l(t,n,e.type),document.body.appendChild(o),i(t,`VIEW`,e.variant),o.querySelector(`.poplayer-close`)?.addEventListener(`click`,()=>{o.remove(),i(t,`CLOSE`,e.variant)}),o.addEventListener(`click`,n=>{n.target===o&&(o.remove(),i(t,`CLOSE`,e.variant))}),o.querySelector(`.poplayer-form`)?.addEventListener(`submit`,async i=>{i.preventDefault();let a=new FormData(i.target),s={popupId:t,email:a.get(`email`)||``,name:a.get(`name`)||null,phone:a.get(`phone`)||null,sourceUrl:window.location.href,variant:e.variant},c={};for(let[e,t]of a.entries())[`email`,`name`,`phone`].includes(e)||(c[e]=t);Object.keys(c).length>0&&(s.customFields=c),await r(s),o.querySelector(`.poplayer-box`).innerHTML=`<div class="poplayer-success">✅ ${n.successMessage||`Thank you!`}</div>`,setTimeout(()=>o.remove(),2500)})}function l(e,t,n){let r=(t.fields||[]).map(e=>{if(typeof e==`string`)return e===`email`?`<input class="poplayer-input" type="email" name="email" placeholder="Your email" required />`:e===`name`?`<input class="poplayer-input" type="text" name="name" placeholder="Your name" />`:e===`phone`?`<input class="poplayer-input" type="tel" name="phone" placeholder="Phone number" />`:``;let t=e.required?`required`:``,n=e.placeholder||e.label||``,r=e.id||e.label?.toLowerCase().replace(/\s+/g,`_`)||``;return e.type===`textarea`?`<textarea class="poplayer-input" name="${r}" placeholder="${n}" rows="2" ${t}></textarea>`:e.type===`select`?`<select class="poplayer-input" name="${r}" ${t}><option value="">${n}</option></select>`:`<input class="poplayer-input" type="${e.type||`text`}" name="${r}" placeholder="${n}" ${t} />`}).join(``),i=t.showCouponCode&&t.couponCode?`<div class="poplayer-coupon">${t.couponCode}</div>`:``,a=n===`ANNOUNCEMENT`?`<button class="poplayer-btn poplayer-close">${t.ctaText||`Got it`}</button>`:`<form class="poplayer-form">${r}<button type="submit" class="poplayer-btn">${t.ctaText||`Submit`}</button></form>`;return`
    <div class="poplayer-box" id="poplayer-box-${e}">
      ${t.closeButton===!1?``:`<button class="poplayer-close">×</button>`}
      <h2 class="poplayer-headline">${t.headline||``}</h2>
      <p class="poplayer-subtext">${t.subtext||``}</p>
      ${i}
      ${a}
    </div>
  `}(async function(){let e=document.currentScript||document.querySelector(`script[data-popup-id]`)||document.querySelector(`script[data-site-id]`),r=e?.getAttribute(`data-popup-id`),i=e?.getAttribute(`data-site-id`);if(!r&&!i)return;let o;o=r?await n(r):await t(i);let{popups:s}=o;if(!(!s||s.length===0))for(let e of s){let t=`A`;if(e.abTestEnabled&&e.configB&&e.triggersB){let n=`poplayer_variant_${e.id}`,r=sessionStorage.getItem(n);r||(r=Math.random()<.5?`A`:`B`,sessionStorage.setItem(n,r)),t=r,t===`B`&&(e.config=e.configB,e.triggers=e.triggersB)}e.variant=t,a(e,()=>c(e))}})()})();