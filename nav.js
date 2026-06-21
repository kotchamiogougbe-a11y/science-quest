/* ============================================================================
   nav.js — Menu de navigation globale (bouton ☰ + panneau coulissant)
   Module partagé. Additif : ne modifie pas les barres existantes.
   - Donne une navigation complète sur TOUTES les pages.
   - Accessible (clavier, ARIA, piège de focus, Échap), RTL, multilingue.
   - La vitrine reste en place ; le menu glisse par-dessus.
   Soli Deo Gloria
   ========================================================================== */
(function(){
  'use strict';
  if(window.__navLoaded) return; window.__navLoaded = true;

  var FALLBACK = {
    menu_label:'Menu', menu_nav:'Navigation', menu_close:'Fermer le menu',
    nav_home:'Accueil', nav_sq:'Science Quest', nav_inf:'INFINITIA', nav_sap:'SAPIENTIA',
    nav_books:'Livres', nav_community:'Communauté', nav_blog:'Blog', nav_about:'À propos',
    btn_connect:'Se connecter', btn_create:'Créer un compte', btn_install:'Installer l\'app',
    install_hint:'📱 Android : menu ⋮ du navigateur → « Installer l\'application ». 🍏 iPhone : bouton Partager → « Sur l\'écran d\'accueil ».'
  };
  function lang(){ try{ return (window.getLang && window.getLang()) || 'fr'; }catch(e){ return 'fr'; } }
  function tr(key){ try{ var d=window.KI18N && window.KI18N[lang()]; if(d && d[key]!=null) return d[key]; }catch(e){} return FALLBACK[key]||key; }

  var LINKS = [
    ['🏠','nav_home','index.html'],
    ['🧪','nav_sq','science-quest.html'],
    ['🔭','nav_inf','infinitia.html'],
    ['🏛','nav_sap','sapientia.html'],
    ['📚','nav_books','index.html#services'],
    ['🤝','nav_community','index.html#services'],
    ['✍️','nav_blog','index.html'],
    ['💡','nav_about','index.html#vision']
  ];

  var btn, panel, backdrop, lastFocus;

  /* ── PWA : installation + service worker (partagé sur toutes les pages) ── */
  var deferredPrompt = (typeof window!=='undefined' && window.__bip) ? window.__bip : null;
  window.addEventListener('beforeinstallprompt', function(e){
    e.preventDefault();
    deferredPrompt = e; window.__bip = e;
    var b = document.getElementById('navInstall') || document.getElementById('btnInstall');
    if(b){ b.classList.add('show'); b.style.display='inline-flex'; }
  });
  function getPrompt(){ return deferredPrompt || (window.__bip || null); }
  function doInstall(){
    var p = getPrompt();
    if(!p) return;
    p.prompt();
    p.userChoice.finally(function(){
      deferredPrompt=null; window.__bip=null;
      var b=document.getElementById('navInstall'); if(b) b.classList.remove('show');
    });
  }
  // Clic sur le bouton d'installation : invite native si dispo, sinon menu + instructions
  function installClick(){
    if(getPrompt()){ doInstall(); return; }
    if(typeof open==='function') open();
    var h = panel && panel.querySelector('.nav-install-hint');
    if(h) h.classList.add('show');
  }
  window.addEventListener('appinstalled', function(){
    deferredPrompt=null;
    var b=document.getElementById('navInstall'); if(b) b.classList.remove('show');
  });
  if('serviceWorker' in navigator && !window.__swNav){
    window.__swNav=true;
    window.addEventListener('load', function(){
      navigator.serviceWorker.register('sw.js').catch(function(){});
    });
  }

  function css(){
    var s=document.createElement('style');
    s.textContent = [
      '.nav-burger{display:none;align-items:center;justify-content:center;width:42px;height:42px;border-radius:11px;',
        'border:1px solid rgba(197,158,80,.4);background:rgba(10,23,69,.6);color:#F5D98B;font-size:1.15rem;cursor:pointer;',
        'transition:border-color .2s,background .2s;flex-shrink:0;}',
      '.nav-burger:hover{border-color:rgba(197,158,80,.9);background:rgba(10,23,69,.85);}',
      '.nav-install{display:none;align-items:center;gap:6px;height:42px;padding:0 13px;border-radius:11px;',
        'border:1px solid rgba(61,126,255,.5);background:rgba(61,126,255,.1);color:#7EB4FF;',
        'font-family:"Space Grotesk",sans-serif;font-weight:600;font-size:.78rem;cursor:pointer;white-space:nowrap;',
        'transition:background .2s,border-color .2s;flex-shrink:0;}',
      '.nav-install.show{display:inline-flex;}',
      '@media(max-width:920px){.nav-install{display:inline-flex;}}',
      '@media(display-mode:standalone){.nav-install,.nav-cta-install,.nav-install-hint{display:none !important;}}',
      '.nav-install:hover{background:rgba(61,126,255,.2);border-color:rgba(61,126,255,.8);}',
      '.nav-cta-install{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;margin-top:10px;',
        'padding:12px;border-radius:12px;border:1px solid rgba(61,126,255,.5);background:rgba(61,126,255,.1);',
        'color:#7EB4FF;font-family:"Space Grotesk",sans-serif;font-weight:600;font-size:.9rem;cursor:pointer;}',
      '.nav-cta-install:hover{background:rgba(61,126,255,.2);}',
      '.nav-install-hint{display:none;color:#9fb0d8;font-size:.76rem;line-height:1.55;margin:8px 4px 0;',
        'font-family:"Inter",sans-serif;background:rgba(255,255,255,.04);border-radius:10px;padding:11px 13px;}',
      '.nav-install-hint.show{display:block;}',
      '@media(max-width:920px){.nav-burger{display:inline-flex;}',
        '.h-actions .btn-connect,.h-actions .btn-start{display:none !important;}}',
      '.nav-backdrop{position:fixed;inset:0;background:rgba(2,6,23,.62);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);',
        'opacity:0;visibility:hidden;transition:opacity .28s,visibility .28s;z-index:1200;}',
      '.nav-backdrop.open{opacity:1;visibility:visible;}',
      '.nav-panel{position:fixed;top:0;right:0;height:100%;height:100dvh;width:min(86vw,360px);z-index:1201;',
        'background:linear-gradient(180deg,#0A1745,#070F2C);border-left:1px solid rgba(197,158,80,.22);',
        'box-shadow:-20px 0 60px rgba(0,0,0,.5);transform:translateX(105%);transition:transform .32s cubic-bezier(.4,0,.2,1);',
        'display:flex;flex-direction:column;padding:18px 16px calc(18px + env(safe-area-inset-bottom));overflow-y:auto;overscroll-behavior:contain;}',
      '.nav-panel.open{transform:translateX(0);}',
      '[dir="rtl"] .nav-panel{right:auto;left:0;border-left:none;border-right:1px solid rgba(197,158,80,.22);transform:translateX(-105%);box-shadow:20px 0 60px rgba(0,0,0,.5);}',
      '[dir="rtl"] .nav-panel.open{transform:translateX(0);}',
      '.nav-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;}',
      '.nav-head b{font-family:"Cormorant Garamond",serif;color:#F5D98B;font-size:1.3rem;font-weight:600;letter-spacing:.04em;}',
      '.nav-x{width:38px;height:38px;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:none;color:#cdd6ee;font-size:1.05rem;cursor:pointer;}',
      '.nav-x:hover{background:rgba(255,255,255,.06);}',
      '.nav-cap{font-family:"Space Grotesk",sans-serif;font-size:.66rem;letter-spacing:.18em;text-transform:uppercase;color:#7587b5;margin:6px 6px 8px;}',
      '.nav-link{display:flex;align-items:center;gap:14px;padding:13px 14px;border-radius:12px;color:#EAF0FF;text-decoration:none;',
        'font-family:"Space Grotesk",sans-serif;font-size:1rem;font-weight:500;transition:background .15s;}',
      '.nav-link:hover,.nav-link:focus-visible{background:rgba(197,158,80,.13);outline:none;}',
      '.nav-link .ic{font-size:1.25rem;width:26px;text-align:center;flex-shrink:0;}',
      '.nav-sep{height:1px;background:rgba(255,255,255,.08);margin:14px 8px;}',
      '.nav-cta{display:flex;flex-direction:column;gap:10px;margin-top:auto;padding-top:14px;}',
      '.nav-cta button{width:100%;padding:13px;border-radius:12px;font-family:"Space Grotesk",sans-serif;font-weight:600;font-size:.92rem;cursor:pointer;border:1px solid transparent;}',
      '.nav-cta .nc-ghost{background:none;border-color:rgba(197,158,80,.45);color:#F5D98B;}',
      '.nav-cta .nc-ghost:hover{background:rgba(197,158,80,.12);}',
      '.nav-cta .nc-solid{background:linear-gradient(135deg,#C59E50,#F5D98B);color:#0A1745;}',
      '.nav-sdg{text-align:center;color:#5e6f9c;font-size:.66rem;letter-spacing:.12em;margin-top:14px;font-family:"Space Grotesk",sans-serif;}',
      '[dir="rtl"] .nav-link,[dir="rtl"] .nav-cap{text-align:right;}'
    ].join('');
    document.head.appendChild(s);
  }

  function build(){
    var actions = document.querySelector('.h-actions');
    if(!actions) return;
    css();

    btn = document.createElement('button');
    btn.className='nav-burger';
    btn.setAttribute('aria-haspopup','dialog');
    btn.setAttribute('aria-expanded','false');
    btn.setAttribute('aria-controls','navPanel');
    btn.setAttribute('aria-label', tr('menu_label'));
    btn.innerHTML='☰';
    btn.addEventListener('click', open);
    actions.insertBefore(btn, actions.firstChild);

    // Bouton « Installer l'application » (ajouté seulement si la page n'en a pas déjà un)
    if(!document.getElementById('btnInstall')){
      var ib=document.createElement('button');
      ib.className='nav-install'; ib.id='navInstall';
      ib.setAttribute('data-i18n','btn_install');
      ib.innerHTML='⬇ <span data-i18n="btn_install">'+tr('btn_install')+'</span>';
      ib.addEventListener('click', installClick);
      actions.insertBefore(ib, actions.firstChild);
      if(getPrompt()) ib.classList.add("show");
    }

    backdrop=document.createElement('div'); backdrop.className='nav-backdrop';
    backdrop.addEventListener('click', close);

    panel=document.createElement('aside');
    panel.className='nav-panel'; panel.id='navPanel';
    panel.setAttribute('role','dialog'); panel.setAttribute('aria-modal','true');
    panel.setAttribute('aria-label', tr('menu_label')); panel.setAttribute('aria-hidden','true');

    var head=document.createElement('div'); head.className='nav-head';
    var b=document.createElement('b'); b.setAttribute('data-i18n','menu_label'); b.textContent=tr('menu_label');
    var x=document.createElement('button'); x.className='nav-x'; x.setAttribute('aria-label',tr('menu_close')); x.innerHTML='✕';
    x.addEventListener('click', close);
    head.appendChild(b); head.appendChild(x); panel.appendChild(head);

    var cap=document.createElement('div'); cap.className='nav-cap'; cap.setAttribute('data-i18n','menu_nav'); cap.textContent=tr('menu_nav');
    panel.appendChild(cap);

    LINKS.forEach(function(l){
      var a=document.createElement('a'); a.className='nav-link'; a.href=l[2];
      a.innerHTML='<span class="ic">'+l[0]+'</span>';
      var sp=document.createElement('span'); sp.setAttribute('data-i18n',l[1]); sp.textContent=tr(l[1]);
      a.appendChild(sp);
      a.addEventListener('click', close);
      panel.appendChild(a);
    });

    var sep=document.createElement('div'); sep.className='nav-sep'; panel.appendChild(sep);
    var cta=document.createElement('div'); cta.className='nav-cta';
    var c1=document.createElement('button'); c1.className='nc-ghost'; c1.setAttribute('data-i18n','btn_connect'); c1.textContent=tr('btn_connect');
    var c2=document.createElement('button'); c2.className='nc-solid'; c2.setAttribute('data-i18n','btn_create'); c2.textContent=tr('btn_create');
    c1.addEventListener('click', function(){ window.location.href='mon-espace.html'; });
    c2.addEventListener('click', function(){ window.location.href='mon-espace.html'; });
    cta.appendChild(c1); cta.appendChild(c2); panel.appendChild(cta);

    // Bouton « Installer l'application » — toujours visible dans le menu
    var inst=document.createElement('button'); inst.className='nav-cta-install';
    inst.innerHTML='📲 <span data-i18n="btn_install">'+tr('btn_install')+'</span>';
    var hint=document.createElement('p'); hint.className='nav-install-hint';
    hint.setAttribute('data-i18n','install_hint'); hint.textContent=tr('install_hint');
    inst.addEventListener('click', function(){
      if(deferredPrompt){ doInstall(); }
      else { hint.classList.toggle('show'); }
    });
    panel.appendChild(inst); panel.appendChild(hint);
    var sdg=document.createElement('div'); sdg.className='nav-sdg'; sdg.textContent='Soli Deo Gloria'; panel.appendChild(sdg);

    document.body.appendChild(backdrop);
    document.body.appendChild(panel);

    document.addEventListener('keydown', function(e){
      if(e.key==='Escape' && panel.classList.contains('open')) close();
      if(e.key==='Tab' && panel.classList.contains('open')) trap(e);
    });
  }

  function focusables(){ return panel.querySelectorAll('a[href],button:not([disabled])'); }
  function trap(e){
    var f=focusables(); if(!f.length) return;
    var first=f[0], last=f[f.length-1];
    if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); }
  }
  function open(){
    lastFocus=document.activeElement;
    backdrop.classList.add('open'); panel.classList.add('open');
    panel.setAttribute('aria-hidden','false'); btn.setAttribute('aria-expanded','true');
    document.body.style.overflow='hidden';
    var x=panel.querySelector('.nav-x'); if(x) x.focus();
  }
  function close(){
    backdrop.classList.remove('open'); panel.classList.remove('open');
    panel.setAttribute('aria-hidden','true'); btn.setAttribute('aria-expanded','false');
    document.body.style.overflow='';
    if(lastFocus && lastFocus.focus) lastFocus.focus();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
