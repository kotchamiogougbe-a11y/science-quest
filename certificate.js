/* ============================================================
   certificate.js — Générateur de certificats Kotchami
   Réutilisable par TOUTE mission. Multilingue (6 langues),
   réservé au Premium, rendu canvas à la charte (navy/or).

   Usage depuis une mission :
     KotchamiCert.open({
       missionName, universe, level, levelEmoji, badge, pct, lang
     });
   - Premium  -> aperçu net + champ nom + téléchargement PNG
   - Gratuit  -> aperçu filigrané + invitation à passer Premium
   ============================================================ */
(function(){
  var L = {
    fr:{title:"CERTIFICAT DE RÉUSSITE",attest:"Ce certificat atteste que",accomplished:"a accompli avec succès la mission",universe:"Univers",score:"Score",awarded:"Décerné le",getBtn:"Obtenir mon certificat",download:"📥 Télécharger mon certificat",close:"Fermer",nameLbl:"Nom sur le certificat",namePh:"Ton nom complet",lockedTitle:"🎓 Ton certificat officiel t'attend",lockedMsg:"Le certificat de réussite signé Kotchami fait partie de l'accompagnement Premium.",unlock:"Débloquer avec Premium →",preview:"APERÇU",passeur:"Le Passeur de sciences"},
    en:{title:"CERTIFICATE OF ACHIEVEMENT",attest:"This certifies that",accomplished:"has successfully completed the mission",universe:"Universe",score:"Score",awarded:"Awarded on",getBtn:"Get my certificate",download:"📥 Download my certificate",close:"Close",nameLbl:"Name on the certificate",namePh:"Your full name",lockedTitle:"🎓 Your official certificate awaits",lockedMsg:"The certificate of achievement signed by Kotchami is part of Premium support.",unlock:"Unlock with Premium →",preview:"PREVIEW",passeur:"The Ferryman of Sciences"},
    ar:{title:"شهادة إنجاز",attest:"تشهد هذه الشهادة بأنّ",accomplished:"قد أنجز بنجاح مهمة",universe:"عالَم",score:"النتيجة",awarded:"مُنحت بتاريخ",getBtn:"احصل على شهادتي",download:"📥 حمّل شهادتي",close:"إغلاق",nameLbl:"الاسم على الشهادة",namePh:"اسمك الكامل",lockedTitle:"🎓 شهادتك الرسمية بانتظارك",lockedMsg:"شهادة الإنجاز الموقّعة من كوتشامي جزء من مرافقة Premium.",unlock:"افتح مع Premium →",preview:"معاينة",passeur:"مُعبِّر العلوم"},
    es:{title:"CERTIFICADO DE LOGRO",attest:"Este certificado acredita que",accomplished:"ha completado con éxito la misión",universe:"Universo",score:"Puntuación",awarded:"Otorgado el",getBtn:"Obtener mi certificado",download:"📥 Descargar mi certificado",close:"Cerrar",nameLbl:"Nombre en el certificado",namePh:"Tu nombre completo",lockedTitle:"🎓 Tu certificado oficial te espera",lockedMsg:"El certificado de logro firmado por Kotchami forma parte del acompañamiento Premium.",unlock:"Desbloquear con Premium →",preview:"VISTA PREVIA",passeur:"El Passeur de las ciencias"},
    pt:{title:"CERTIFICADO DE CONQUISTA",attest:"Este certificado atesta que",accomplished:"concluiu com sucesso a missão",universe:"Universo",score:"Pontuação",awarded:"Atribuído em",getBtn:"Obter o meu certificado",download:"📥 Descarregar o meu certificado",close:"Fechar",nameLbl:"Nome no certificado",namePh:"O teu nome completo",lockedTitle:"🎓 O teu certificado oficial aguarda",lockedMsg:"O certificado de conquista assinado por Kotchami faz parte do acompanhamento Premium.",unlock:"Desbloquear com Premium →",preview:"PRÉ-VISUALIZAÇÃO",passeur:"O Passeur das ciências"},
    sw:{title:"CHETI CHA UFANISI",attest:"Cheti hiki kinathibitisha kwamba",accomplished:"amekamilisha kwa mafanikio dhamira",universe:"Ulimwengu",score:"Alama",awarded:"Kimetolewa",getBtn:"Pata cheti changu",download:"📥 Pakua cheti changu",close:"Funga",nameLbl:"Jina kwenye cheti",namePh:"Jina lako kamili",lockedTitle:"🎓 Cheti chako rasmi kinakungoja",lockedMsg:"Cheti cha ufanisi kilichotiwa saini na Kotchami ni sehemu ya msaada wa Premium.",unlock:"Fungua na Premium →",preview:"HAKIKISHO",passeur:"Mpitishaji wa Sayansi"}
  };
  var LOCALE={fr:'fr-FR',en:'en-GB',ar:'ar',es:'es-ES',pt:'pt-PT',sw:'sw'};

  function pick(o){ if(o&&o.lang&&L[o.lang])return o.lang; try{var l=localStorage.getItem('kotchami_lang');return L[l]?l:'fr';}catch(e){return 'fr';} }
  function isPremium(){ try{return !!localStorage.getItem('kotchami_premium');}catch(e){return false;} }
  function storedName(){ try{var n=localStorage.getItem('kotchami_auth');return (n&&n!=='1')?n:'';}catch(e){return '';} }

  function draw(canvas, opts, name, locked){
    var W=1600,H=1130,ctx=canvas.getContext('2d');
    canvas.width=W;canvas.height=H;
    var lg=pick(opts), t=L[lg], rtl=(lg==='ar');
    ctx.textAlign='center'; ctx.textBaseline='alphabetic';
    try{ ctx.direction = rtl?'rtl':'ltr'; }catch(e){}
    // fond navy radial
    var g=ctx.createRadialGradient(W/2,H*0.42,80,W/2,H*0.5,W*0.78);
    g.addColorStop(0,'#0e1b46');g.addColorStop(1,'#060f2b');
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    // halo doré
    var gl=ctx.createRadialGradient(W/2,H*0.40,40,W/2,H*0.40,W*0.42);
    gl.addColorStop(0,'rgba(212,170,90,0.13)');gl.addColorStop(1,'rgba(212,170,90,0)');
    ctx.fillStyle=gl;ctx.fillRect(0,0,W,H);
    // étoiles (clairsemées au centre)
    for(var i=0;i<95;i++){var x=44+Math.random()*(W-88),y=44+Math.random()*(H-88);
      if(y>250&&y<900&&x>170&&x<W-170&&Math.random()<0.82)continue;
      var b=70+Math.floor(Math.random()*150);ctx.fillStyle='rgb('+b+','+b+','+Math.min(255,Math.floor(b*1.05))+')';
      var s=Math.random()<0.22?2:1;ctx.fillRect(x,y,s,s);}
    var gold='#C59E50',goldL='#F3D88C',cream='#E9EEF8',blue='#9FB2D8';
    // cadre double + coins
    ctx.strokeStyle=gold;ctx.lineWidth=3;ctx.strokeRect(36,36,W-72,H-72);
    ctx.strokeStyle='rgba(150,120,62,0.8)';ctx.lineWidth=1.5;ctx.strokeRect(50,50,W-100,H-100);
    ctx.strokeStyle='#E7C77A';ctx.lineWidth=3;
    [[50,50,1,1],[W-50,50,-1,1],[50,H-50,1,-1],[W-50,H-50,-1,-1]].forEach(function(c){
      ctx.beginPath();ctx.moveTo(c[0],c[1]+26*c[3]);ctx.lineTo(c[0],c[1]);ctx.lineTo(c[0]+26*c[2],c[1]);ctx.stroke();});
    function ctext(txt,font,y,fill,track){ctx.font=font;ctx.fillStyle=fill;
      try{ ctx.letterSpacing=(track&&!rtl)?(track+'px'):'0px'; }catch(e){}
      ctx.fillText(txt,W/2,y);
      try{ ctx.letterSpacing='0px'; }catch(e){}}
    // contenu
    ctext('KOTCHAMI · SCIENCE QUEST',"500 26px 'Space Grotesk',sans-serif",150,'#C9A864',6);
    ctext(t.title,"700 64px 'Space Grotesk',sans-serif",242,goldL,0);
    ctx.strokeStyle='#E7C77A';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(W/2-70,282);ctx.lineTo(W/2+70,282);ctx.stroke();
    ctext(t.attest,"italic 36px 'Cormorant Garamond',serif",362,cream,0);
    ctext(name||'—',"700 94px 'Cormorant Garamond',serif",474,goldL,0);
    var nw=Math.min(ctx.measureText(name||'—').width,W-320);
    ctx.strokeStyle='rgba(197,158,80,0.5)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(W/2-nw/2-24,496);ctx.lineTo(W/2+nw/2+24,496);ctx.stroke();
    ctext(t.accomplished,"italic 34px 'Cormorant Garamond',serif",562,cream,0);
    ctext(opts.missionName||'',"600 48px 'Space Grotesk',sans-serif",628,'#FFFFFF',0);
    ctext(t.universe+' · '+(opts.universe||''),"400 30px 'Space Grotesk',sans-serif",688,blue,0);
    if(opts.badge) ctext((opts.levelEmoji?opts.levelEmoji+' ':'')+opts.badge,"500 34px 'Space Grotesk',sans-serif",742,'#E7C77A',0);
    if(opts.pct!=null) ctext(t.score+' : '+opts.pct+'%',"400 28px 'Space Grotesk',sans-serif",788,blue,0);
    var d=new Date(),ds;try{ds=d.toLocaleDateString(LOCALE[lg]||'fr-FR',{year:'numeric',month:'long',day:'numeric'});}catch(e){ds=d.toLocaleDateString();}
    ctext(t.awarded+' '+ds,"400 26px 'Space Grotesk',sans-serif",866,'#8696B8',0);
    // signature
    ctext('Kotchami Ogougbe',"600 46px 'Cormorant Garamond',serif",968,goldL,0);
    ctext(t.passeur,"italic 27px 'Cormorant Garamond',serif",1004,'#C9A864',0);
    ctext('Soli Deo Gloria',"500 22px 'Space Grotesk',sans-serif",1052,'#8696B8',2);
    // filigrane si verrouillé
    if(locked){ctx.save();ctx.translate(W/2,H/2);ctx.rotate(-Math.PI/9);
      ctx.font="700 140px 'Space Grotesk',sans-serif";ctx.fillStyle='rgba(231,199,122,0.15)';ctx.textAlign='center';
      try{ctx.letterSpacing='10px';}catch(e){}
      ctx.fillText(t.preview,0,40);ctx.restore();}
  }

  function open(opts){
    opts=opts||{};
    var lg=pick(opts), t=L[lg], premium=isPremium();
    var ov=document.createElement('div');
    ov.setAttribute('dir', lg==='ar'?'rtl':'ltr');
    ov.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(4,8,22,0.86);display:flex;align-items:center;justify-content:center;padding:18px;overflow:auto;';
    var card=document.createElement('div');
    card.style.cssText='max-width:760px;width:100%;background:#0a1330;border:1px solid rgba(197,158,80,0.4);border-radius:18px;padding:18px;box-shadow:0 20px 60px rgba(0,0,0,0.6);';
    var canvas=document.createElement('canvas');
    canvas.style.cssText='width:100%;height:auto;border-radius:10px;display:block;';
    card.appendChild(canvas);
    var name=storedName();
    function redraw(){ draw(canvas,opts,name||'—',!premium); }
    if(document.fonts&&document.fonts.load){
      Promise.all([
        document.fonts.load("700 64px 'Space Grotesk'"),
        document.fonts.load("700 94px 'Cormorant Garamond'"),
        document.fonts.load("italic 34px 'Cormorant Garamond'")
      ]).then(redraw).catch(redraw);
    } else { redraw(); }

    var ctr=document.createElement('div');
    ctr.style.cssText='margin-top:14px;display:flex;flex-direction:column;gap:10px;';
    if(premium){
      var lbl=document.createElement('label');lbl.textContent=t.nameLbl;lbl.style.cssText='color:#cdd8ef;font:500 14px system-ui;';
      var inp=document.createElement('input');inp.type='text';inp.value=name;inp.placeholder=t.namePh;
      inp.style.cssText='width:100%;padding:11px 13px;border-radius:9px;border:1px solid rgba(197,158,80,0.4);background:#0e1838;color:#fff;font:500 15px system-ui;box-sizing:border-box;';
      inp.oninput=function(){name=inp.value.trim();redraw();};
      var dl=document.createElement('button');dl.textContent=t.download;
      dl.style.cssText='padding:14px;border:none;border-radius:10px;cursor:pointer;font:600 15px system-ui;background:linear-gradient(135deg,#C59E50,#E7C77A);color:#1a1304;';
      dl.onclick=function(){ try{ canvas.toBlob(function(b){var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='certificat-kotchami.png';document.body.appendChild(a);a.click();a.remove();}); }catch(e){} };
      ctr.appendChild(lbl);ctr.appendChild(inp);ctr.appendChild(dl);
    } else {
      var lt=document.createElement('div');lt.textContent=t.lockedTitle;lt.style.cssText='color:#F3D88C;font:700 19px system-ui;text-align:center;';
      var lm=document.createElement('div');lm.textContent=t.lockedMsg;lm.style.cssText='color:#cdd8ef;font:400 15px system-ui;text-align:center;line-height:1.5;';
      var un=document.createElement('a');un.href='mon-espace.html?premium=1';un.textContent=t.unlock;
      un.style.cssText='display:block;text-align:center;text-decoration:none;padding:14px;border-radius:10px;font:600 15px system-ui;background:linear-gradient(135deg,#C59E50,#E7C77A);color:#1a1304;';
      ctr.appendChild(lt);ctr.appendChild(lm);ctr.appendChild(un);
    }
    var cl=document.createElement('button');cl.textContent=t.close;
    cl.style.cssText='padding:11px;border:1px solid rgba(255,255,255,0.18);border-radius:10px;cursor:pointer;background:transparent;color:#aebbd6;font:500 14px system-ui;';
    cl.onclick=function(){ov.remove();};
    ctr.appendChild(cl);
    card.appendChild(ctr);
    ov.appendChild(card);
    ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});
    document.body.appendChild(ov);
  }

  window.KotchamiCert = {
    open: open,
    isPremium: isPremium,
    getBtnLabel: function(lg){ lg=(L[lg]?lg:pick()); return '🎓 '+L[lg].getBtn; }
  };
})();
