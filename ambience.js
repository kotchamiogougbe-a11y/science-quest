/* ============================================================================
   ambience.js — Ambiance sonore générative (Web Audio) + lecteur flottant
   Module partagé de l'écosystème Kotchami. Une seule source de vérité.
   - 3 ambiances : Cosmos · Concentration · Racines
   - Coupé par défaut (politique d'autoplay), activé au clic, choix mémorisé.
   - Aucun fichier audio : tout est synthétisé → léger, sans droits d'auteur.
   Soli Deo Gloria
   ========================================================================== */
(function(){
  'use strict';
  if(window.__ambienceLoaded) return;
  window.__ambienceLoaded = true;

  /* ---------- persistance ---------- */
  var K = { theme:'kotchami_amb_theme', vol:'kotchami_amb_vol' };
  function get(k,d){ try{ var v=localStorage.getItem(k); return v==null?d:v; }catch(e){ return d; } }
  function save(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }

  var THEMES = ['cosmos','focus','roots'];
  var state = {
    theme: (THEMES.indexOf(get(K.theme,'cosmos'))<0?'cosmos':get(K.theme,'cosmos')),
    vol: Math.min(1, Math.max(0, parseFloat(get(K.vol,'0.35'))||0.35)),
    playing: false
  };

  /* ---------- libellés (lus depuis i18n si dispo) ---------- */
  var FALLBACK = {
    amb_open:'Musique de fond', amb_title:'Ambiance sonore', amb_hint:'Choisis ton ambiance',
    amb_cosmos:'Cosmos', amb_cosmos_d:'Nappes spatiales, vastes et contemplatives',
    amb_focus:'Concentration', amb_focus_d:'Arpèges doux, pour étudier',
    amb_roots:'Racines', amb_roots_d:'Sonorités chaleureuses, inspiration africaine',
    amb_vol:'Volume', amb_play:'Activer le son', amb_pause:'Couper le son', amb_close:'Fermer'
  };
  function lang(){ try{ return (window.getLang && window.getLang()) || 'fr'; }catch(e){ return 'fr'; } }
  function tr(key){
    try{
      var lg=lang(), d=window.KI18N && window.KI18N[lg];
      if(d && d[key]!=null) return d[key];
    }catch(e){}
    return FALLBACK[key];
  }

  /* ============================================================
     MOTEUR AUDIO
     ============================================================ */
  var ctx=null, master=null, bus=null, wet=null, dry=null;
  var pads=[], chordTimer=null, noteTimer=null, lfo=null, chordIdx=0, filt=null;

  function mf(m){ return 440*Math.pow(2,(m-69)/12); } // midi -> Hz

  // progressions (en MIDI) par ambiance — quintes/octaves ouvertes = consonance
  var CHORDS = {
    cosmos: [[45,52,57,64],[41,48,53,60],[43,50,55,62],[40,47,52,59]],
    focus:  [[48,55,60,67],[45,52,57,64],[53,60,65,72],[50,57,62,69]],
    roots:  [[48,55,60,64],[53,60,65,69],[50,57,62,67],[45,52,57,64]]
  };
  // gammes pentatoniques pour mélodies (MIDI, octave haute)
  var PENTA = {
    cosmos: [69,72,74,76,79,81,84],          // A min penta
    focus:  [72,74,76,79,81,84,86],           // C maj penta
    roots:  [60,62,64,67,69,72,74]            // C maj penta chaleureuse
  };
  var CFG = {
    cosmos: { padType:'triangle', padGain:0.085, cutoff:760,  chordMs:16000, noteMs:2600, twinkle:0.75 },
    focus:  { padType:'sine',     padGain:0.05,  cutoff:1400, chordMs:7680,  noteMs:480 },
    roots:  { padType:'triangle', padGain:0.045, cutoff:1100, chordMs:8400,  noteMs:430 }
  };

  function makeImpulse(sec, decay){
    var rate=ctx.sampleRate, len=Math.floor(rate*sec), buf=ctx.createBuffer(2,len,rate);
    for(var c=0;c<2;c++){ var ch=buf.getChannelData(c);
      for(var i=0;i<len;i++){ ch[i]=(Math.random()*2-1)*Math.pow(1-i/len, decay); } }
    return buf;
  }

  function buildGraph(){
    master = ctx.createGain(); master.gain.value = 0.0001;
    master.connect(ctx.destination);
    dry = ctx.createGain(); dry.gain.value = 0.82; dry.connect(master);
    wet = ctx.createGain(); wet.gain.value = 0.45;
    var conv = ctx.createConvolver(); conv.buffer = makeImpulse(2.8, 2.6);
    conv.connect(wet); wet.connect(master);
    bus = ctx.createGain(); bus.gain.value = 1.0;
    bus.connect(dry); bus.connect(conv);
    // pads (4 voix) -> filtre commun -> bus
    filt = ctx.createBiquadFilter(); filt.type='lowpass'; filt.frequency.value=900; filt.Q.value=0.6;
    filt.connect(bus);
    pads = [];
    for(var v=0; v<4; v++){
      var o=ctx.createOscillator(), g=ctx.createGain();
      o.type='triangle'; o.frequency.value=mf(48); g.gain.value=0.0;
      o.connect(g); g.connect(filt); o.start();
      pads.push({osc:o, gain:g});
    }
    // LFO lent sur le filtre (mouvement)
    lfo = ctx.createOscillator(); var lg=ctx.createGain();
    lfo.frequency.value=0.05; lg.gain.value=260;
    lfo.connect(lg); lg.connect(filt.frequency); lfo.start();
  }

  function applyTheme(){
    var c=CFG[state.theme];
    filt.frequency.setTargetAtTime(c.cutoff, ctx.currentTime, 0.6);
    pads.forEach(function(p){ p.osc.type=c.padType; });
    chordIdx=0; setChord(true);
    // relancer les planificateurs aux bons tempos
    if(chordTimer) clearInterval(chordTimer);
    if(noteTimer) clearInterval(noteTimer);
    chordTimer=setInterval(function(){ chordIdx=(chordIdx+1)%4; setChord(false); }, c.chordMs);
    noteTimer=setInterval(tick, c.noteMs);
  }

  function setChord(first){
    var c=CFG[state.theme], notes=CHORDS[state.theme][chordIdx];
    pads.forEach(function(p,i){
      var f=mf(notes[i%notes.length]);
      if(first) p.osc.frequency.setValueAtTime(f, ctx.currentTime);
      else p.osc.frequency.setTargetAtTime(f, ctx.currentTime, 2.2);
      p.gain.gain.setTargetAtTime(c.padGain, ctx.currentTime, 1.5);
    });
  }

  function voice(freq, dur, type, peak, rel, pan){
    var o=ctx.createOscillator(), g=ctx.createGain(), p=ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    o.type=type||'sine'; o.frequency.value=freq;
    var n=ctx.currentTime;
    g.gain.setValueAtTime(0.0001, n);
    g.gain.exponentialRampToValueAtTime(peak, n+0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, n+dur+rel);
    o.connect(g);
    if(p){ p.pan.value = (pan==null? (Math.random()*1.4-0.7) : pan); g.connect(p); p.connect(bus); }
    else g.connect(bus);
    o.start(n); o.stop(n+dur+rel+0.05);
  }

  function drum(){
    var n=ctx.currentTime, len=Math.floor(ctx.sampleRate*0.18);
    var buf=ctx.createBuffer(1,len,ctx.sampleRate), d=buf.getChannelData(0);
    for(var i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3);
    var src=ctx.createBufferSource(); src.buffer=buf;
    var lp=ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=320;
    var g=ctx.createGain(); g.gain.setValueAtTime(0.0001,n);
    g.gain.exponentialRampToValueAtTime(0.18,n+0.01);
    g.gain.exponentialRampToValueAtTime(0.0001,n+0.22);
    src.connect(lp); lp.connect(g); g.connect(bus); src.start(n);
  }

  var step=0;
  function tick(){
    if(!ctx) return;
    var th=state.theme, sc=PENTA[th];
    if(th==='cosmos'){
      if(Math.random() < CFG.cosmos.twinkle){
        var m=sc[Math.floor(Math.random()*sc.length)] + (Math.random()<0.3?12:0);
        voice(mf(m), 0.4, 'sine', 0.07, 2.4, null);
      }
    } else if(th==='focus'){
      // arpège montant/descendant sur la penta
      var pat=[0,2,4,3,2,4,5,4,3,2,1,2];
      var idx=pat[step%pat.length]; step++;
      voice(mf(sc[idx%sc.length]), 0.18, 'triangle', 0.06, 0.6, ((step%2)?0.3:-0.3));
    } else if(th==='roots'){
      // mbira : plucks pentatoniques + tambour doux régulier
      if(step%4===0) drum();
      if(Math.random()<0.85){
        var j=Math.floor(Math.random()*sc.length);
        var low = Math.random()<0.4;
        voice(mf(sc[j]-(low?12:0)), 0.16, low?'triangle':'sine', 0.07, 0.5, (Math.random()*1.2-0.6));
      }
      step++;
    }
  }

  function ensure(){
    if(ctx) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    if(!AC) return;
    ctx = new AC();
    buildGraph();
  }

  function play(){
    ensure(); if(!ctx) return;
    if(ctx.state==='suspended') ctx.resume();
    applyTheme();
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(state.vol, ctx.currentTime, 0.8);
    state.playing=true; reflect();
  }
  function stop(){
    if(!ctx){ state.playing=false; reflect(); return; }
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.5);
    if(chordTimer) clearInterval(chordTimer);
    if(noteTimer) clearInterval(noteTimer);
    setTimeout(function(){ try{ if(ctx && ctx.state==='running') ctx.suspend(); }catch(e){} }, 700);
    state.playing=false; reflect();
  }
  function setVol(v){
    state.vol=Math.min(1,Math.max(0,v)); save(K.vol, state.vol.toFixed(2));
    if(ctx && state.playing) master.gain.setTargetAtTime(state.vol, ctx.currentTime, 0.2);
  }
  function setTheme(name){
    if(THEMES.indexOf(name)<0) return;
    state.theme=name; save(K.theme,name);
    if(state.playing) applyTheme(); else play();   // choisir une ambiance = la lancer
    reflect();
  }

  /* ============================================================
     INTERFACE (lecteur flottant) — auto-construite
     ============================================================ */
  var dock, panel, btn, volEl;

  function css(){
    var s=document.createElement('style');
    s.textContent = [
      '.amb-dock{position:fixed;right:16px;bottom:calc(16px + env(safe-area-inset-bottom));z-index:400;font-family:"Space Grotesk","Inter",sans-serif;}',
      '.amb-btn{width:48px;height:48px;border-radius:50%;border:1px solid rgba(197,158,80,.45);',
        'background:rgba(10,23,69,.78);color:#F5D98B;font-size:1.15rem;cursor:pointer;backdrop-filter:blur(8px);',
        '-webkit-backdrop-filter:blur(8px);box-shadow:0 6px 22px rgba(0,0,0,.35);transition:transform .2s,border-color .2s;display:flex;align-items:center;justify-content:center;}',
      '.amb-btn:hover{transform:translateY(-2px);border-color:rgba(197,158,80,.9);}',
      '.amb-dock.playing .amb-btn{animation:ambpulse 2.4s ease-in-out infinite;border-color:rgba(245,217,139,.8);}',
      '@keyframes ambpulse{0%,100%{box-shadow:0 0 0 0 rgba(245,217,139,.0),0 6px 22px rgba(0,0,0,.35);}50%{box-shadow:0 0 0 7px rgba(245,217,139,.10),0 6px 22px rgba(0,0,0,.35);}}',
      '@media(prefers-reduced-motion:reduce){.amb-dock.playing .amb-btn{animation:none;}}',
      '.amb-panel{position:absolute;left:0;bottom:60px;width:268px;background:rgba(8,17,46,.96);',
        'border:1px solid rgba(197,158,80,.25);border-radius:16px;padding:16px;opacity:0;visibility:hidden;',
        'transform:translateY(10px);transition:opacity .2s,visibility .2s,transform .2s;box-shadow:0 18px 50px rgba(0,0,0,.5);}',
      '.amb-panel.open{opacity:1;visibility:visible;transform:translateY(0);}',
      '.amb-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;}',
      '.amb-head span{color:#F5D98B;font-weight:600;font-size:.95rem;letter-spacing:.02em;}',
      '.amb-x{background:none;border:none;color:#8aa;cursor:pointer;font-size:1rem;line-height:1;padding:4px;}',
      '.amb-hint{color:#9fb0d8;font-size:.74rem;margin:0 0 12px;font-family:"Inter",sans-serif;}',
      '.amb-themes{display:flex;flex-direction:column;gap:8px;margin-bottom:14px;}',
      '.amb-theme{display:flex;align-items:center;gap:12px;width:100%;text-align:left;cursor:pointer;',
        'background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:11px;padding:10px 12px;transition:border-color .15s,background .15s;}',
      '.amb-theme:hover{background:rgba(255,255,255,.06);}',
      '.amb-theme.active{border-color:rgba(197,158,80,.85);background:rgba(197,158,80,.12);}',
      '.amb-ico{font-size:1.3rem;flex-shrink:0;}',
      '.amb-tt{display:flex;flex-direction:column;}',
      '.amb-tn{color:#F4F7FF;font-size:.86rem;font-weight:600;}',
      '.amb-theme small{color:#8ea0c8;font-size:.7rem;font-family:"Inter",sans-serif;line-height:1.25;}',
      '.amb-vol{display:flex;align-items:center;gap:10px;color:#9fb0d8;font-size:.74rem;margin-bottom:12px;}',
      '.amb-vol input{flex:1;accent-color:#C59E50;cursor:pointer;}',
      '.amb-toggle{width:100%;border:1px solid rgba(197,158,80,.4);background:rgba(197,158,80,.10);color:#F5D98B;',
        'border-radius:11px;padding:10px;cursor:pointer;font-family:"Space Grotesk",sans-serif;font-weight:600;font-size:.82rem;transition:background .15s;}',
      '.amb-toggle:hover{background:rgba(197,158,80,.2);}',
      '[dir="rtl"] .amb-dock{right:auto;left:16px;}',
      '[dir="rtl"] .amb-panel{left:auto;right:0;}',
      '[dir="rtl"] .amb-theme,[dir="rtl"] .amb-hint{text-align:right;}'
    ].join('');
    document.head.appendChild(s);
  }

  function el(tag, cls, attrs){
    var e=document.createElement(tag); if(cls) e.className=cls;
    if(attrs) for(var k in attrs) e.setAttribute(k,attrs[k]);
    return e;
  }
  function i18nspan(key){ var s=el('span'); s.setAttribute('data-i18n',key); s.textContent=tr(key); return s; }

  function themeRow(name, icon){
    var b=el('button','amb-theme',{'data-theme':name,'role':'radio'});
    b.appendChild(Object.assign(el('span','amb-ico'),{textContent:icon}));
    var tt=el('span','amb-tt');
    var n=el('span','amb-tn'); n.setAttribute('data-i18n','amb_'+name); n.textContent=tr('amb_'+name);
    var d=el('small'); d.setAttribute('data-i18n','amb_'+name+'_d'); d.textContent=tr('amb_'+name+'_d');
    tt.appendChild(n); tt.appendChild(d); b.appendChild(tt);
    b.addEventListener('click', function(){ setTheme(name); });
    return b;
  }

  function build(){
    css();
    dock=el('div','amb-dock');
    panel=el('div','amb-panel',{'role':'dialog','aria-label':tr('amb_title'),'aria-hidden':'true'});
    var head=el('div','amb-head');
    head.appendChild(i18nspan('amb_title'));
    var x=el('button','amb-x',{'aria-label':tr('amb_close')}); x.textContent='✕';
    x.addEventListener('click', closePanel); head.appendChild(x);
    panel.appendChild(head);
    var hint=el('p','amb-hint'); hint.setAttribute('data-i18n','amb_hint'); hint.textContent=tr('amb_hint');
    panel.appendChild(hint);
    var themes=el('div','amb-themes',{'role':'radiogroup','aria-label':tr('amb_title')});
    themes.appendChild(themeRow('cosmos','🌌'));
    themes.appendChild(themeRow('focus','🎐'));
    themes.appendChild(themeRow('roots','🪘'));
    panel.appendChild(themes);
    var vol=el('label','amb-vol');
    vol.appendChild(i18nspan('amb_vol'));
    volEl=el('input',null,{type:'range',min:'0',max:'100','aria-label':tr('amb_vol')});
    volEl.value=Math.round(state.vol*100);
    volEl.addEventListener('input', function(){ setVol(parseInt(volEl.value,10)/100); });
    vol.appendChild(volEl); panel.appendChild(vol);
    var tog=el('button','amb-toggle'); tog.id='ambToggle';
    tog.appendChild(i18nspan('amb_play'));
    tog.addEventListener('click', function(){ state.playing ? stop() : play(); });
    panel.appendChild(tog);

    btn=el('button','amb-btn',{'aria-haspopup':'dialog','aria-expanded':'false','aria-label':tr('amb_open')});
    btn.innerHTML='<span class="amb-note">♪</span>';
    btn.addEventListener('click', function(){ panel.classList.contains('open')?closePanel():openPanel(); });

    dock.appendChild(panel); dock.appendChild(btn);
    document.body.appendChild(dock);

    document.addEventListener('click', function(e){ if(!dock.contains(e.target)) closePanel(); });
    document.addEventListener('keydown', function(e){ if(e.key==='Escape') closePanel(); });
    reflect();
  }

  function openPanel(){ panel.classList.add('open'); panel.setAttribute('aria-hidden','false'); btn.setAttribute('aria-expanded','true'); }
  function closePanel(){ panel.classList.remove('open'); panel.setAttribute('aria-hidden','true'); btn.setAttribute('aria-expanded','false'); }

  function reflect(){
    if(!dock) return;
    dock.classList.toggle('playing', state.playing);
    btn.setAttribute('aria-label', tr('amb_open') + (state.playing?' — ♪':''));
    var rows=panel.querySelectorAll('.amb-theme');
    Array.prototype.forEach.call(rows, function(r){
      var on = r.getAttribute('data-theme')===state.theme;
      r.classList.toggle('active', on); r.setAttribute('aria-checked', on?'true':'false');
    });
    var tspan=panel.querySelector('#ambToggle span');
    if(tspan){ var key = state.playing?'amb_pause':'amb_play'; tspan.setAttribute('data-i18n',key); tspan.textContent=tr(key); }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
