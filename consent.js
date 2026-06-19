/* ============================================================================
   consent.js — Consentement aux cookies (RGPD) + Google Consent Mode v2
   Module partagé. La mesure d'audience (GA) ne démarre qu'après accord.
   Choix mémorisé · multilingue · RTL · accessible.
   Soli Deo Gloria
   ========================================================================== */
(function(){
  'use strict';
  if(window.__consentLoaded) return; window.__consentLoaded = true;

  var KEY='kotchami_consent';
  function get(){ try{ return localStorage.getItem(KEY); }catch(e){ return null; } }
  function set(v){ try{ localStorage.setItem(KEY,v); }catch(e){} }

  var FB={ consent_text:"Ce site utilise des cookies pour mesurer l'audience et améliorer ton expérience.",
           consent_accept:'Accepter', consent_refuse:'Refuser' };
  function lang(){ try{ return (window.getLang && window.getLang())||'fr'; }catch(e){ return 'fr'; } }
  function tr(k){ try{ var d=window.KI18N && window.KI18N[lang()]; if(d && d[k]!=null) return d[k]; }catch(e){} return FB[k]; }

  function grant(){ if(window.gtag) window.gtag('consent','update',{analytics_storage:'granted'}); }

  function build(){
    var bar=document.createElement('div');
    bar.id='cookieConsent';
    bar.setAttribute('role','region');
    bar.setAttribute('aria-label','Consentement aux cookies');
    bar.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:16px;z-index:1300;'
      +'width:min(640px,calc(100% - 32px));background:rgba(8,17,46,.97);border:1px solid rgba(197,158,80,.28);'
      +'border-radius:16px;padding:16px 18px;box-shadow:0 18px 50px rgba(0,0,0,.5);display:flex;gap:14px;'
      +'align-items:center;flex-wrap:wrap;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);';
    var txt=document.createElement('p');
    txt.setAttribute('data-i18n','consent_text'); txt.textContent=tr('consent_text');
    txt.style.cssText='flex:1 1 220px;margin:0;color:#cdd6ee;font-family:"Inter",sans-serif;font-size:.82rem;line-height:1.45;';
    var btns=document.createElement('div');
    btns.style.cssText='display:flex;gap:10px;flex:0 0 auto;';
    var refuse=document.createElement('button');
    refuse.setAttribute('data-i18n','consent_refuse'); refuse.textContent=tr('consent_refuse');
    refuse.style.cssText='padding:9px 16px;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:none;color:#aeb9d6;cursor:pointer;font-family:"Space Grotesk",sans-serif;font-size:.82rem;';
    var accept=document.createElement('button');
    accept.setAttribute('data-i18n','consent_accept'); accept.textContent=tr('consent_accept');
    accept.style.cssText='padding:9px 18px;border-radius:10px;border:none;background:linear-gradient(135deg,#C59E50,#F5D98B);color:#0A1745;cursor:pointer;font-family:"Space Grotesk",sans-serif;font-weight:600;font-size:.82rem;';
    accept.addEventListener('click', function(){ set('granted'); grant(); dismiss(bar); });
    refuse.addEventListener('click', function(){ set('denied'); dismiss(bar); });
    btns.appendChild(refuse); btns.appendChild(accept);
    var moreTxt={fr:'Politique cookies',en:'Cookie policy',ar:'سياسة الارتباط',es:'Política de cookies',pt:'Política de cookies',sw:'Sera ya vidakuzi'};
    var _l=(window.getLang&&window.getLang())||'fr';
    var more=document.createElement('a');
    more.href='mentions-legales.html#cookies';
    more.textContent=moreTxt[_l]||moreTxt.fr;
    more.style.cssText='color:#F5D98B;text-decoration:underline;margin-inline-start:6px;font-size:.82rem;white-space:nowrap;';
    txt.appendChild(document.createTextNode(' ')); txt.appendChild(more);
    bar.appendChild(txt); bar.appendChild(btns);
    document.body.appendChild(bar);
    setTimeout(function(){ accept.focus(); }, 50);
  }
  function dismiss(bar){ bar.style.transition='opacity .25s,transform .25s'; bar.style.opacity='0';
    bar.style.transform='translateX(-50%) translateY(8px)'; setTimeout(function(){ bar.remove(); }, 260); }

  function init(){
    var c=get();
    if(c==='granted'){ grant(); return; }
    if(c==='denied'){ return; }
    build();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
