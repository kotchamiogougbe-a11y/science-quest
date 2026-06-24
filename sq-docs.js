/* ============================================================
   sq-docs.js — Moteur « Analyse de documents » (Acte 2 Premium)
   Science Quest · Kotchami / Le Passeur de sciences — Soli Deo Gloria
   ------------------------------------------------------------
   Fondation réutilisable pour TOUTES les missions.
   Un acte 2 = un objet "scénario" (données déclaratives, 6 langues).
   Les SVG sont langue-neutres : un seul graphique sert les 6 langues.

   API publique :
     KotchamiDocs.mount(rootEl, scenario, { lang, premium, onComplete })
     KotchamiDocs.render.pedigree(model)  -> string SVG
     KotchamiDocs.render.electro(model)   -> string SVG
     KotchamiDocs.render.graph(model)     -> string SVG
     KotchamiDocs.render.punnett(model)   -> string HTML
   ============================================================ */
window.KotchamiDocs = (function () {
  "use strict";

  /* ---------- libellés d'interface (6 langues) ---------- */
  var UI = {
    fr:{aide:"💡 Une aide",cont:"Continuer →",diag:"Voir le diagnostic →",bilan:"📓 Bilan de l'analyse",
        step:"Étape",toEstablish:"à établir",justif:"Justification",aideN:"Aide",
        lockTitle:"Analyse de documents — Premium",
        lockDesc:"Cette enquête fait partie de l'accompagnement Premium : raisonne sur des documents inédits, comme à l'épreuve.",
        lockCta:"Débloquer avec Premium →",replay:"↻ Refaire l'enquête",diagLbl:"Diagnostic établi",
        certNote:"🎓 Diagnostic posé → ton certificat de mission est débloqué.",cert:"🎓 Obtenir mon certificat",
        tierMast:"Maîtrise",tierProg:"En progression",tierRev:"À retravailler",
        clickHint:"Clique sur un individu pour l'identifier.",hlHint:"Document mis en évidence pour cette étape."},
    en:{aide:"💡 A hint",cont:"Continue →",diag:"See the diagnosis →",bilan:"📓 Analysis log",
        step:"Step",toEstablish:"to establish",justif:"Reasoning",aideN:"Hint",
        lockTitle:"Document analysis — Premium",
        lockDesc:"This investigation is part of Premium: reason on unseen documents, exam-style.",
        lockCta:"Unlock with Premium →",replay:"↻ Replay",diagLbl:"Diagnosis established",
        certNote:"🎓 Diagnosis reached → your mission certificate is unlocked.",cert:"🎓 Get my certificate",
        tierMast:"Mastery",tierProg:"Progressing",tierRev:"To review",
        clickHint:"Click an individual to identify them.",hlHint:"Document highlighted for this step."},
    ar:{aide:"💡 تلميح",cont:"متابعة →",diag:"عرض التشخيص →",bilan:"📓 حصيلة التحليل",
        step:"خطوة",toEstablish:"قيد الإثبات",justif:"التعليل",aideN:"تلميح",
        lockTitle:"تحليل الوثائق — Premium",
        lockDesc:"هذا التحقيق جزء من مرافقة Premium: استدلّ على وثائق جديدة كما في الامتحان.",
        lockCta:"افتح مع Premium →",replay:"↻ إعادة التحقيق",diagLbl:"التشخيص المُثبَت",
        certNote:"🎓 تمّ التشخيص → شهادة مهمتك مفتوحة.",cert:"🎓 احصل على شهادتي",
        tierMast:"إتقان",tierProg:"في تقدّم",tierRev:"يحتاج مراجعة",
        clickHint:"انقر على فرد للتعرّف عليه.",hlHint:"الوثيقة مُبرَزة لهذه الخطوة."},
    es:{aide:"💡 Una pista",cont:"Continuar →",diag:"Ver el diagnóstico →",bilan:"📓 Balance del análisis",
        step:"Etapa",toEstablish:"por establecer",justif:"Justificación",aideN:"Pista",
        lockTitle:"Análisis de documentos — Premium",
        lockDesc:"Esta investigación es parte de Premium: razona sobre documentos inéditos, como en el examen.",
        lockCta:"Desbloquear con Premium →",replay:"↻ Repetir",diagLbl:"Diagnóstico establecido",
        certNote:"🎓 Diagnóstico alcanzado → tu certificado se ha desbloqueado.",cert:"🎓 Obtener mi certificado",
        tierMast:"Dominio",tierProg:"En progreso",tierRev:"Por repasar",
        clickHint:"Haz clic en un individuo para identificarlo.",hlHint:"Documento resaltado para esta etapa."},
    pt:{aide:"💡 Uma ajuda",cont:"Continuar →",diag:"Ver o diagnóstico →",bilan:"📓 Balanço da análise",
        step:"Etapa",toEstablish:"por estabelecer",justif:"Justificação",aideN:"Ajuda",
        lockTitle:"Análise de documentos — Premium",
        lockDesc:"Esta investigação faz parte do Premium: raciocina sobre documentos inéditos, como no exame.",
        lockCta:"Desbloquear com Premium →",replay:"↻ Repetir",diagLbl:"Diagnóstico estabelecido",
        certNote:"🎓 Diagnóstico alcançado → o teu certificado foi desbloqueado.",cert:"🎓 Obter o meu certificado",
        tierMast:"Domínio",tierProg:"Em progresso",tierRev:"A rever",
        clickHint:"Clica num indivíduo para o identificar.",hlHint:"Documento destacado para esta etapa."},
    sw:{aide:"💡 Dokezo",cont:"Endelea →",diag:"Ona utambuzi →",bilan:"📓 Muhtasari wa uchambuzi",
        step:"Hatua",toEstablish:"itakayothibitishwa",justif:"Maelezo",aideN:"Dokezo",
        lockTitle:"Uchambuzi wa hati — Premium",
        lockDesc:"Uchunguzi huu ni sehemu ya Premium: fikiri juu ya hati mpya, kama mtihanini.",
        lockCta:"Fungua kwa Premium →",replay:"↻ Rudia uchunguzi",diagLbl:"Utambuzi umethibitishwa",
        certNote:"🎓 Utambuzi umefikiwa → cheti chako kimefunguliwa.",cert:"🎓 Pata cheti changu",
        tierMast:"Umahiri",tierProg:"Unaendelea",tierRev:"Pa kurudia",
        clickHint:"Bofya mtu ili kumtambua.",hlHint:"Hati imeangaziwa kwa hatua hii."}
  };

  function pick(obj, lang){ if(obj==null) return ""; if(typeof obj==="string") return obj; return obj[lang]!=null?obj[lang]:obj.fr; }
  function ui(lang){ return UI[lang]||UI.fr; }
  function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

  /* ============================================================
     BRIQUES DE RENDU (SVG langue-neutres)
     ============================================================ */

  /* --- Pédigree ---
     model = { R:15, people:{ "I-1":{s:"M",a:false,x:180,y:70,n:"..."}, ... },
               couples:[["I-1","I-2"],...],
               sibs:[{mid:[x,y], kids:["..."], bus:Y}, ...] }  */
  function renderPedigree(model){
    var R = model.R||15, P=model.people, s="";
    (model.couples||[]).forEach(function(c){
      var A=P[c[0]], B=P[c[1]];
      s+='<line class="sqd-link" x1="'+(A.x+R)+'" y1="'+A.y+'" x2="'+(B.x-R)+'" y2="'+B.y+'"/>';
    });
    (model.sibs||[]).forEach(function(sb){
      var mx=sb.mid[0], my=sb.mid[1], xs=sb.kids.map(function(k){return P[k].x;});
      var minx=Math.min.apply(null,[mx].concat(xs)), maxx=Math.max.apply(null,[mx].concat(xs));
      s+='<line class="sqd-link" x1="'+mx+'" y1="'+my+'" x2="'+mx+'" y2="'+sb.bus+'"/>';
      s+='<line class="sqd-link" x1="'+minx+'" y1="'+sb.bus+'" x2="'+maxx+'" y2="'+sb.bus+'"/>';
      sb.kids.forEach(function(k){var K=P[k];
        s+='<line class="sqd-link" x1="'+K.x+'" y1="'+sb.bus+'" x2="'+K.x+'" y2="'+(K.y-R)+'"/>';});
    });
    Object.keys(P).forEach(function(id){
      var p=P[id];
      var shape = p.s==="M"
        ? '<rect class="sqd-sym '+(p.a?"sqd-aff":"")+'" x="'+(p.x-R)+'" y="'+(p.y-R)+'" width="'+(2*R)+'" height="'+(2*R)+'" rx="2"/>'
        : '<circle class="sqd-sym '+(p.a?"sqd-aff":"")+'" cx="'+p.x+'" cy="'+p.y+'" r="'+R+'"/>';
      var halo = p.s==="M"
        ? '<rect class="sqd-halo" x="'+(p.x-R-6)+'" y="'+(p.y-R-6)+'" width="'+(2*R+12)+'" height="'+(2*R+12)+'" rx="5"/>'
        : '<circle class="sqd-halo" cx="'+p.x+'" cy="'+p.y+'" r="'+(R+6)+'"/>';
      var nm = p.n?'<text class="sqd-nm" x="'+p.x+'" y="'+(p.y+R+30)+'">'+esc(p.n)+'</text>':"";
      s+='<g class="sqd-indiv" data-id="'+id+'">'+halo+shape+
         '<text class="sqd-lbl" x="'+p.x+'" y="'+(p.y+R+16)+'">'+id+'</text>'+nm+'</g>';
    });
    return s;
  }

  /* --- Électrophorèse ---
     model = { samples:[{id,n,bands:["HbA","HbS"]},...],
               levels:{HbS:150,HbA:300}, x0:170, lw:120, top:70, bot:360 } */
  function renderElectro(model){
    var x0=model.x0||170, lw=model.lw||120, top=model.top||70, bot=model.bot||360,
        S=model.samples, L=model.levels, s="";
    s+='<rect x="'+(x0-30)+'" y="'+top+'" width="'+(lw*S.length+30)+'" height="'+(bot-top)+'" rx="6" fill="rgba(18,36,99,0.5)" stroke="rgba(255,255,255,0.1)"/>';
    s+='<text class="sqd-gellbl" x="'+(x0-58)+'" y="'+(top+14)+'">– (dépôt)</text>';
    s+='<text class="sqd-gellbl" x="'+(x0-58)+'" y="'+(bot-4)+'">+ (anode)</text>';
    Object.keys(L).forEach(function(k){
      s+='<line class="sqd-gelref" x1="'+(x0-30)+'" y1="'+L[k]+'" x2="'+(x0+lw*S.length)+'" y2="'+L[k]+'"/>';
      s+='<text class="sqd-gellbl" x="'+(x0+lw*S.length+6)+'" y="'+(L[k]+4)+'">'+k+'</text>';
    });
    S.forEach(function(g,i){
      var cx=x0+lw*i+lw/2;
      s+='<g class="sqd-lane" data-id="'+g.id+'">';
      s+='<rect class="sqd-well" x="'+(cx-26)+'" y="'+(top+6)+'" width="52" height="10" rx="2"/>';
      g.bands.forEach(function(b){ s+='<rect class="sqd-band" x="'+(cx-30)+'" y="'+(L[b]-6)+'" width="60" height="12" rx="3"/>'; });
      s+='<text class="sqd-lbl" x="'+cx+'" y="'+(bot+20)+'">'+g.id+'</text>';
      if(g.n) s+='<text class="sqd-nm" x="'+cx+'" y="'+(bot+36)+'">'+esc(g.n)+'</text>';
      s+='</g>';
    });
    return s;
  }

  /* --- Graphe / grille (LIRE · COMPARER · CALCULER) ---
     model = { w:760,h:420, xLabel,yLabel, xMin,xMax,yMin,yMax, xStep,yStep,
               series:[{name,color,points:[[x,y],...]}], markers:[{x,y,label}] } */
  function renderGraph(model){
    var w=model.w||760, h=model.h||420, pad=54;
    var xMin=model.xMin||0, xMax=model.xMax||10, yMin=model.yMin||0, yMax=model.yMax||10;
    var xStep=model.xStep||1, yStep=model.yStep||1, s="";
    function X(v){ return pad + (v-xMin)/(xMax-xMin)*(w-2*pad); }
    function Y(v){ return (h-pad) - (v-yMin)/(yMax-yMin)*(h-2*pad); }
    // grille
    for(var gx=xMin; gx<=xMax+1e-9; gx+=xStep){
      s+='<line class="sqd-grid" x1="'+X(gx)+'" y1="'+Y(yMin)+'" x2="'+X(gx)+'" y2="'+Y(yMax)+'"/>';
      s+='<text class="sqd-axlbl" x="'+X(gx)+'" y="'+(Y(yMin)+18)+'" text-anchor="middle">'+(+gx.toFixed(2))+'</text>';
    }
    for(var gy=yMin; gy<=yMax+1e-9; gy+=yStep){
      s+='<line class="sqd-grid" x1="'+X(xMin)+'" y1="'+Y(gy)+'" x2="'+X(xMax)+'" y2="'+Y(gy)+'"/>';
      s+='<text class="sqd-axlbl" x="'+(X(xMin)-8)+'" y="'+(Y(gy)+4)+'" text-anchor="end">'+(+gy.toFixed(2))+'</text>';
    }
    // axes
    s+='<line class="sqd-axis" x1="'+X(xMin)+'" y1="'+Y(yMin)+'" x2="'+X(xMax)+'" y2="'+Y(yMin)+'"/>';
    s+='<line class="sqd-axis" x1="'+X(xMin)+'" y1="'+Y(yMin)+'" x2="'+X(xMin)+'" y2="'+Y(yMax)+'"/>';
    if(model.xLabel) s+='<text class="sqd-axname" x="'+(w/2)+'" y="'+(h-8)+'" text-anchor="middle">'+esc(model.xLabel)+'</text>';
    if(model.yLabel) s+='<text class="sqd-axname" x="14" y="'+(h/2)+'" text-anchor="middle" transform="rotate(-90 14 '+(h/2)+')">'+esc(model.yLabel)+'</text>';
    // séries
    (model.series||[]).forEach(function(se){
      var d=se.points.map(function(p,i){return (i?"L":"M")+X(p[0])+" "+Y(p[1]);}).join(" ");
      s+='<path d="'+d+'" fill="none" stroke="'+(se.color||"#C59E50")+'" stroke-width="2.4"/>';
      se.points.forEach(function(p){ s+='<circle cx="'+X(p[0])+'" cy="'+Y(p[1])+'" r="3.2" fill="'+(se.color||"#C59E50")+'"/>'; });
    });
    (model.markers||[]).forEach(function(m){
      s+='<circle cx="'+X(m.x)+'" cy="'+Y(m.y)+'" r="5" fill="none" stroke="#7EB4FF" stroke-width="2"/>';
      if(m.label) s+='<text class="sqd-axlbl" x="'+(X(m.x)+8)+'" y="'+(Y(m.y)-6)+'">'+esc(m.label)+'</text>';
    });
    return s;
  }

  /* --- Échiquier de croisement ---
     model = { rows:["A","S"], cols:["A","S"], cells:[["A//A","A//S"],["A//S","S//S"]], ill:["S//S"] } */
  function renderPunnett(model){
    var ill=model.ill||[], h='<table class="sqd-punnett"><tr><th></th>';
    model.cols.forEach(function(c){h+='<th>'+esc(c)+'</th>';});
    h+='</tr>';
    model.rows.forEach(function(r,ri){
      h+='<tr><th>'+esc(r)+'</th>';
      model.cells[ri].forEach(function(cell){
        h+='<td class="'+(ill.indexOf(cell)>=0?"sqd-ill":"")+'">'+esc(cell)+'</td>';
      });
      h+='</tr>';
    });
    return h+'</table>';
  }

  /* --- Schéma de chromosomes (métaphase, crossing-over, anaphase…) ---
     Chromosome = 2 chromatides (bâtonnets) + centromère ; bar = chromatide simple (bi-colore possible).
     model = { cells:[{cx,cy,rx,ry,equator,caption,chromos:[{x,y,h,color,label}]}],
               bars:[{x,top,h,color|segs:[{frac,color}],top1,bot1}],
               legend:[{color,t}], labels:[{x,y,t,anchor}] } */
  function drawChromosome(x,y,h,color,label){
    var w=7, gap=5, top=y-h/2;
    var s='<rect x="'+(x-gap-w)+'" y="'+top+'" width="'+w+'" height="'+h+'" rx="'+(w/2)+'" fill="'+color+'"/>'+
          '<rect x="'+(x+gap)+'" y="'+top+'" width="'+w+'" height="'+h+'" rx="'+(w/2)+'" fill="'+color+'"/>'+
          '<circle cx="'+x+'" cy="'+y+'" r="5" fill="#0A1745" stroke="'+color+'" stroke-width="2"/>';
    if(label) s+='<text class="sqd-scenelbl" x="'+x+'" y="'+(top-6)+'" text-anchor="middle">'+esc(label)+'</text>';
    return s;
  }
  function drawBar(b){
    var w=12, x=b.x, top=b.top, h=b.h, s='', yy=top;
    var segs=b.segs||[{frac:1,color:b.color||"#C59E50"}];
    segs.forEach(function(sg){ var sh=h*sg.frac;
      s+='<rect x="'+x+'" y="'+yy+'" width="'+w+'" height="'+sh+'" rx="6" fill="'+sg.color+'"/>'; yy+=sh; });
    if(b.top1) s+='<text class="sqd-scenelbl" x="'+(x+w/2)+'" y="'+(top-6)+'" text-anchor="middle">'+esc(b.top1)+'</text>';
    if(b.bot1) s+='<text class="sqd-scenelbl" x="'+(x+w/2)+'" y="'+(top+h+16)+'" text-anchor="middle">'+esc(b.bot1)+'</text>';
    return s;
  }
  function renderScene(model){
    var s="";
    (model.cells||[]).forEach(function(c){
      s+='<ellipse cx="'+c.cx+'" cy="'+c.cy+'" rx="'+c.rx+'" ry="'+c.ry+'" fill="rgba(18,36,99,0.35)" stroke="rgba(126,180,255,0.35)" stroke-width="2"/>';
      if(c.equator) s+='<line class="sqd-eq" x1="'+(c.cx-c.rx+14)+'" y1="'+c.cy+'" x2="'+(c.cx+c.rx-14)+'" y2="'+c.cy+'"/>';
      (c.chromos||[]).forEach(function(ch){ s+=drawChromosome(ch.x,ch.y,ch.h,ch.color,ch.label); });
      if(c.caption) s+='<text class="sqd-scenecap" x="'+c.cx+'" y="'+(c.cy+c.ry+26)+'" text-anchor="middle">'+esc(c.caption)+'</text>';
    });
    (model.bars||[]).forEach(function(b){ s+=drawBar(b); });
    (model.legend||[]).forEach(function(lg,i){ var lx=18, ly=26+i*22;
      s+='<rect x="'+lx+'" y="'+(ly-11)+'" width="13" height="13" rx="2" fill="'+lg.color+'"/>'+
         '<text class="sqd-scenelbl" x="'+(lx+20)+'" y="'+ly+'">'+esc(lg.t)+'</text>'; });
    (model.labels||[]).forEach(function(l){ s+='<text class="sqd-scenecap" x="'+l.x+'" y="'+l.y+'"'+(l.anchor?' text-anchor="'+l.anchor+'"':'')+'>'+esc(l.t)+'</text>'; });
    return s;
  }

  /* --- Test d'agglutination (groupes sanguins) ---
     model = { antisera:["anti-A","anti-B"], x0,step,y0,rh,
               samples:[{id, react:[true,false]}] }  // react[j] = agglutine avec antisera[j] */
  function renderAggl(model){
    var anti=model.antisera||["anti-A","anti-B"];
    var x0=model.x0||300, step=model.step||190, y0=model.y0||78, rh=model.rh||0, rw=46, s="";
    anti.forEach(function(a,j){ s+='<text class="sqd-aggl-h" x="'+(x0+j*step)+'" y="40" text-anchor="middle">'+esc(a)+'</text>'; });
    (model.samples||[]).forEach(function(sp,i){
      var cy=y0+rw+i*(2*rw+60);
      s+='<text class="sqd-scenelbl" x="'+(x0-step/2-4)+'" y="'+(cy+4)+'" text-anchor="end">'+esc(sp.id||"")+'</text>';
      sp.react.forEach(function(r,j){
        var cx=x0+j*step;
        s+='<circle cx="'+cx+'" cy="'+cy+'" r="'+rw+'" fill="rgba(238,240,245,0.08)" stroke="rgba(126,180,255,0.4)" stroke-width="1.5"/>';
        if(r){
          [[-18,-10,9],[6,-16,7],[19,6,10],[-9,15,8],[-21,9,6],[11,19,6],[1,1,7]].forEach(function(c){
            s+='<circle cx="'+(cx+c[0])+'" cy="'+(cy+c[1])+'" r="'+c[2]+'" fill="#C7506B"/>'; });
          s+='<text class="sqd-aggl-r" x="'+cx+'" y="'+(cy+rw+22)+'" text-anchor="middle">(+)</text>';
        } else {
          s+='<circle cx="'+cx+'" cy="'+cy+'" r="'+(rw-9)+'" fill="rgba(199,80,107,0.16)"/>';
          s+='<text class="sqd-aggl-r" x="'+cx+'" y="'+(cy+rw+22)+'" text-anchor="middle">(–)</text>';
        }
      });
    });
    return s;
  }

  /* --- Caryotype (aberrations chromosomiques) ---
     model = { rows:[ [ {n:"1",count:2,h:40} | {n:"XY",heights:[28,16]}, ... ], ... ],
               highlight:"21", y0,rowH,padX,w } */
  function drawKaryoChromo(x,top,h,color){
    var w=8;
    return '<rect x="'+(x-w/2)+'" y="'+top+'" width="'+w+'" height="'+h+'" rx="'+(w/2)+'" fill="'+color+'"/>'+
           '<circle cx="'+x+'" cy="'+(top+h*0.42)+'" r="3.5" fill="#0A1745"/>';
  }
  function renderKaryotype(model){
    var s="", colN=model.color||"#9AA8C8", colHi=model.colorHi||"#C7506B";
    var W=model.w||760, padX=model.padX||30, y0=model.y0||120, rowH=model.rowH||150;
    (model.rows||[]).forEach(function(row,ri){
      var y=y0+ri*rowH, n=row.length, gap=(W-2*padX)/n;
      row.forEach(function(g,gi){
        var gx=padX+gap*(gi+0.5), hi=(g.n===model.highlight);
        var hs=g.heights?g.heights.slice():[]; if(!hs.length){ var hh=g.h||30, cnt=g.count||2; for(var z=0;z<cnt;z++) hs.push(hh); }
        var maxh=Math.max.apply(null,hs);
        if(hi) s+='<rect x="'+(gx-gap*0.4)+'" y="'+(y-maxh-20)+'" width="'+(gap*0.8)+'" height="'+(maxh+40)+'" rx="6" fill="rgba(199,80,107,0.12)" stroke="'+colHi+'" stroke-width="1.5"/>';
        var cw=12, startx=gx-(hs.length-1)*cw/2;
        hs.forEach(function(h2,k){ s+=drawKaryoChromo(startx+k*cw, y-h2, h2, hi?colHi:colN); });
        s+='<text class="sqd-karyo-n" x="'+gx+'" y="'+(y+16)+'" text-anchor="middle">'+esc(g.n)+(hi?" ("+hs.length+")":"")+'</text>';
      });
    });
    return s;
  }

  var render = { pedigree:renderPedigree, electro:renderElectro, graph:renderGraph, punnett:renderPunnett, scene:renderScene, aggl:renderAggl, karyotype:renderKaryotype };

  /* ============================================================
     STYLES injectés une seule fois
     ============================================================ */
  function injectCSS(){
    if(document.getElementById("sqd-css")) return;
    var css=document.createElement("style"); css.id="sqd-css";
    css.textContent=[
".sqd-wrap{font-family:'Inter',sans-serif;color:var(--blanc,#EEF0F5);}",
".sqd-doc{background:var(--card2,rgba(18,36,99,0.6));border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:18px;margin:14px 0;}",
".sqd-tabs{display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;}",
".sqd-tab{font-family:'JetBrains Mono',monospace;font-size:.66rem;letter-spacing:.08em;color:var(--gris,#9AA8C8);background:var(--nuit3,#122463);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:8px 14px;cursor:pointer;}",
".sqd-tab.on{color:#07090F;background:linear-gradient(135deg,var(--or,#C59E50),var(--or2,#F5D98B));border-color:transparent;font-weight:500;}",
".sqd-svg{width:100%;height:auto;display:block;}",
".sqd-cap{font-family:'JetBrains Mono',monospace;font-size:.62rem;color:var(--gris2,#5A6A92);letter-spacing:.05em;text-align:center;margin-top:10px;}",
".sqd-legend{display:flex;gap:16px;flex-wrap:wrap;justify-content:center;margin-top:12px;font-size:.72rem;color:var(--gris,#9AA8C8);}",
".sqd-legend i{display:inline-block;width:13px;height:13px;border:2px solid var(--blanc,#EEF0F5);margin-right:5px;vertical-align:-2px;}",
".sqd-legend .ci{border-radius:50%;}.sqd-legend .fl{background:var(--or,#C59E50);}",
".sqd-grid2{display:grid;grid-template-columns:1.7fr 1fr;gap:16px;margin-top:16px;align-items:start;}",
"@media(max-width:760px){.sqd-grid2{grid-template-columns:1fr;}}",
".sqd-step{background:var(--card,rgba(12,26,77,0.55));border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:22px;}",
".sqd-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;}",
".sqd-no{font-family:'JetBrains Mono',monospace;font-size:.66rem;letter-spacing:.1em;color:var(--gris,#9AA8C8);}",
".sqd-verb{font-family:'JetBrains Mono',monospace;font-size:.6rem;letter-spacing:.14em;color:#07090F;background:linear-gradient(135deg,var(--cosmos,#3D7EFF),var(--cosmos2,#7EB4FF));padding:4px 10px;border-radius:6px;text-transform:uppercase;font-weight:600;}",
".sqd-q{font-family:'Cormorant Garamond',serif;font-size:1.35rem;font-weight:600;line-height:1.32;margin-bottom:18px;}",
".sqd-opts{display:flex;flex-direction:column;gap:10px;}",
".sqd-opt{text-align:left;background:var(--nuit3,#122463);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:13px 16px;color:var(--blanc,#EEF0F5);font-family:'Inter',sans-serif;font-size:.92rem;line-height:1.4;cursor:pointer;transition:border-color .2s,background .2s,transform .15s;}",
".sqd-opt:hover{border-color:rgba(197,158,80,0.5);transform:translateX(3px);}",
".sqd-opt.correct{border-color:var(--vert,#22D06E);background:rgba(34,208,110,0.12);}",
".sqd-opt.wrong{border-color:#E2674A;background:rgba(226,103,74,0.12);}",
".sqd-opt:disabled{cursor:default;opacity:.85;}.sqd-opt.correct:hover,.sqd-opt.wrong:hover{transform:none;}",
".sqd-actions{display:flex;gap:10px;margin-top:16px;flex-wrap:wrap;}",
".sqd-btn{font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:.8rem;border-radius:9px;padding:10px 18px;cursor:pointer;border:none;}",
".sqd-ghost{background:transparent;border:1px solid rgba(197,158,80,0.35);color:var(--or,#C59E50);}",
".sqd-ghost:disabled{opacity:.35;cursor:default;}",
".sqd-go{background:linear-gradient(135deg,var(--or3,#8A6520),var(--or,#C59E50),var(--or2,#F5D98B));color:#07090F;font-weight:700;}",
".sqd-hint{background:rgba(61,126,255,0.08);border:1px solid rgba(61,126,255,0.22);border-radius:10px;padding:12px 15px;margin-top:14px;font-size:.85rem;line-height:1.5;color:var(--cosmos2,#7EB4FF);display:none;}",
".sqd-hint.show{display:block;}",
".sqd-hint .l,.sqd-justif .l{font-family:'JetBrains Mono',monospace;font-size:.58rem;letter-spacing:.1em;text-transform:uppercase;display:block;margin-bottom:5px;}",
".sqd-hint .l{color:var(--cosmos,#3D7EFF);}",
".sqd-justif{background:rgba(34,208,110,0.07);border:1px solid rgba(34,208,110,0.22);border-radius:10px;padding:14px 16px;margin-top:14px;font-size:.88rem;line-height:1.55;color:var(--blanc,#EEF0F5);display:none;}",
".sqd-justif.show{display:block;}.sqd-justif .l{color:var(--vert,#22D06E);}.sqd-justif b,.sqd-q b{color:var(--or2,#F5D98B);}",
".sqd-bilan{background:var(--card2,rgba(18,36,99,0.6));border:1px solid rgba(197,158,80,0.16);border-radius:16px;padding:20px;position:sticky;top:14px;}",
".sqd-bilan .h{font-family:'JetBrains Mono',monospace;font-size:.64rem;letter-spacing:.12em;color:var(--or,#C59E50);text-transform:uppercase;margin-bottom:14px;}",
".sqd-track{height:6px;background:var(--nuit3,#122463);border-radius:100px;overflow:hidden;margin-bottom:16px;}",
".sqd-fill{height:100%;width:0;background:linear-gradient(90deg,var(--or,#C59E50),var(--or2,#F5D98B));border-radius:100px;transition:width .5s ease;}",
".sqd-bilan ul{list-style:none;display:flex;flex-direction:column;gap:11px;margin:0;padding:0;}",
".sqd-bilan li{font-size:.8rem;line-height:1.45;color:var(--gris2,#5A6A92);padding-left:24px;position:relative;}",
".sqd-bilan li::before{content:'○';position:absolute;left:0;top:0;}",
".sqd-bilan li.done{color:var(--blanc,#EEF0F5);}.sqd-bilan li.done::before{content:'✓';color:var(--vert,#22D06E);font-weight:700;}",
".sqd-bilan li b{color:var(--or2,#F5D98B);}",
".sqd-punnett{margin-top:14px;border-collapse:collapse;font-family:'Space Grotesk',sans-serif;font-size:.85rem;}",
".sqd-punnett td,.sqd-punnett th{border:1px solid rgba(255,255,255,0.15);padding:9px 16px;text-align:center;}",
".sqd-punnett th{color:var(--or,#C59E50);font-weight:700;background:rgba(197,158,80,0.08);}",
".sqd-punnett .sqd-ill{color:#E2674A;font-weight:700;background:rgba(226,103,74,0.1);}",
".sqd-end{display:none;background:var(--card2,rgba(18,36,99,0.6));border:1px solid rgba(197,158,80,0.2);border-radius:18px;padding:32px;margin-top:16px;text-align:center;}",
".sqd-end.show{display:block;}.sqd-end .em{font-size:3rem;}",
".sqd-end .tier{font-family:'Cormorant Garamond',serif;font-size:1.9rem;font-weight:600;margin:6px 0;}",
".sqd-end .bdg{font-family:'JetBrains Mono',monospace;font-size:.7rem;letter-spacing:.12em;color:var(--or,#C59E50);text-transform:uppercase;margin-bottom:18px;}",
".sqd-diag{text-align:left;background:var(--nuit2,#0C1A4D);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:18px 20px;margin:0 auto 18px;max-width:560px;font-size:.9rem;line-height:1.6;}",
".sqd-diag .l{font-family:'JetBrains Mono',monospace;font-size:.6rem;letter-spacing:.12em;color:var(--cosmos2,#7EB4FF);text-transform:uppercase;display:block;margin-bottom:8px;}",
".sqd-diag b{color:var(--or2,#F5D98B);}",
".sqd-note{font-size:.8rem;color:var(--gris,#9AA8C8);margin-bottom:18px;}",
/* gate premium */
".sqd-lock{background:var(--card2,rgba(18,36,99,0.6));border:1px solid rgba(197,158,80,0.25);border-radius:18px;padding:34px;text-align:center;}",
".sqd-lock .em{font-size:2.6rem;}",
".sqd-lock h3{font-family:'Cormorant Garamond',serif;font-size:1.7rem;font-weight:600;margin:8px 0 10px;}",
".sqd-lock p{color:var(--gris,#9AA8C8);font-size:.92rem;line-height:1.6;max-width:520px;margin:0 auto 20px;}",
/* svg classes */
".sqd-indiv{cursor:pointer;}",
".sqd-sym{stroke:var(--blanc,#EEF0F5);stroke-width:2.4;fill:transparent;transition:.25s;}",
".sqd-sym.sqd-aff{fill:var(--or,#C59E50);}",
".sqd-halo{fill:none;stroke:var(--cosmos2,#7EB4FF);stroke-width:0;opacity:0;transition:.3s;}",
".sqd-indiv.hl .sqd-halo{stroke-width:3;opacity:.9;}.sqd-indiv.hl .sqd-sym{stroke:var(--or2,#F5D98B);}",
".sqd-lbl{font-family:'JetBrains Mono',monospace;font-size:11px;fill:var(--gris,#9AA8C8);text-anchor:middle;}",
".sqd-nm{font-family:'Space Grotesk',sans-serif;font-size:10px;fill:var(--cosmos2,#7EB4FF);text-anchor:middle;font-weight:500;}",
".sqd-link{stroke:var(--gris,#9AA8C8);stroke-width:1.6;fill:none;}",
".sqd-band{fill:var(--or2,#F5D98B);transition:.25s;}.sqd-lane.hl .sqd-band{fill:var(--vert,#22D06E);}",
".sqd-gelref{stroke:var(--gris2,#5A6A92);stroke-width:1;stroke-dasharray:4 4;}",
".sqd-gellbl{font-family:'JetBrains Mono',monospace;font-size:10px;fill:var(--gris,#9AA8C8);}",
".sqd-well{fill:var(--nuit4,#193080);stroke:var(--gris2,#5A6A92);stroke-width:1;}",
".sqd-grid{stroke:rgba(255,255,255,0.06);stroke-width:1;}.sqd-axis{stroke:var(--gris,#9AA8C8);stroke-width:1.5;}",
".sqd-axlbl{font-family:'JetBrains Mono',monospace;font-size:10px;fill:var(--gris2,#5A6A92);}",
".sqd-axname{font-family:'Space Grotesk',sans-serif;font-size:12px;fill:var(--gris,#9AA8C8);}",
".sqd-eq{stroke:rgba(245,217,139,0.5);stroke-width:1.5;stroke-dasharray:5 5;}",
".sqd-scenelbl{font-family:'JetBrains Mono',monospace;font-size:12px;fill:var(--blanc,#EEF0F5);}",
".sqd-scenecap{font-family:'Space Grotesk',sans-serif;font-size:13px;fill:var(--gris,#9AA8C8);}",
".sqd-aggl-h{font-family:'Space Grotesk',sans-serif;font-size:14px;fill:var(--or2,#F5D98B);font-weight:600;}",
".sqd-aggl-r{font-family:'JetBrains Mono',monospace;font-size:13px;fill:var(--gris,#9AA8C8);}",
".sqd-karyo-n{font-family:'JetBrains Mono',monospace;font-size:11px;fill:var(--gris,#9AA8C8);}",
"@media(prefers-reduced-motion:reduce){.sqd-wrap *{transition:none!important;animation:none!important;}}"
].join("");
    document.head.appendChild(css);
  }

  /* ============================================================
     MOTEUR D'ENQUÊTE
     ============================================================ */
  function isPremium(){
    try { return localStorage.getItem("kotchami_premium")==="1"; } catch(e){ return false; }
  }

  function mount(root, scenario, opts){
    opts = opts||{};
    var lang = opts.lang || (function(){try{return localStorage.getItem("kotchami_lang")||"fr";}catch(e){return "fr";}})();
    if(!UI[lang]) lang="fr";
    var T = ui(lang);
    var premium = (opts.premium!=null) ? opts.premium : isPremium();
    injectCSS();
    root.classList.add("sqd-wrap");

    /* --- Gate Premium --- */
    if(!premium){
      root.innerHTML =
        '<div class="sqd-lock"><div class="em">🔒</div>'+
        '<h3>'+esc(T.lockTitle)+'</h3><p>'+esc(T.lockDesc)+'</p>'+
        '<a class="sqd-btn sqd-go" href="mon-espace.html?premium=1" style="display:inline-block;text-decoration:none">'+esc(T.lockCta)+'</a></div>';
      return;
    }

    var steps = scenario.steps;
    var docs = scenario.docs||{};
    var cur=0, hintsUsed=0, wrongs=0, answered=false;

    /* squelette */
    root.innerHTML =
      '<div class="sqd-doc">'+
        '<div class="sqd-tabs" id="sqd-tabs"></div>'+
        '<div id="sqd-stage"></div>'+
        '<div class="sqd-legend" id="sqd-legend"><span><i></i>homme</span><span><i class="ci"></i>femme</span><span><i class="fl"></i>atteint</span></div>'+
        '<div class="sqd-cap" id="sqd-cap"></div>'+
      '</div>'+
      '<div class="sqd-grid2">'+
        '<div class="sqd-step" id="sqd-stepcard">'+
          '<div class="sqd-top"><span class="sqd-no" id="sqd-no"></span><span class="sqd-verb" id="sqd-verb"></span></div>'+
          '<div class="sqd-q" id="sqd-q"></div>'+
          '<div class="sqd-opts" id="sqd-opts"></div>'+
          '<div class="sqd-hint" id="sqd-hint"><span class="l" id="sqd-hintl"></span><span id="sqd-hintt"></span></div>'+
          '<div class="sqd-justif" id="sqd-justif"><span class="l">'+esc(T.justif)+'</span><span id="sqd-justift"></span></div>'+
          '<div class="sqd-actions">'+
            '<button class="sqd-btn sqd-ghost" id="sqd-bhint">'+esc(T.aide)+'</button>'+
            '<button class="sqd-btn sqd-go" id="sqd-bnext" style="display:none"></button>'+
          '</div>'+
        '</div>'+
        '<div class="sqd-bilan"><div class="h">'+esc(T.bilan)+'</div>'+
          '<div class="sqd-track"><div class="sqd-fill" id="sqd-fill"></div></div>'+
          '<ul id="sqd-bilanlist"></ul></div>'+
      '</div>'+
      '<div class="sqd-end" id="sqd-end"></div>';

    var $=function(id){return root.querySelector("#"+id);};

    /* tabs documents */
    var docKeys = Object.keys(docs);
    var tabsEl=$("sqd-tabs");
    docKeys.forEach(function(k,i){
      var b=document.createElement("button");
      b.className="sqd-tab"+(i===0?" on":""); b.dataset.k=k;
      b.textContent=docs[k].label?pick(docs[k].label,lang):k;
      b.onclick=function(){ showDoc(k); };
      tabsEl.appendChild(b);
    });

    function renderDoc(k){
      var d=docs[k];
      if(d.type==="pedigree") return '<svg class="sqd-svg" viewBox="'+(d.viewBox||"0 0 880 600")+'">'+renderPedigree(d.model)+'</svg>';
      if(d.type==="electro")  return '<svg class="sqd-svg" viewBox="'+(d.viewBox||"0 0 880 460")+'">'+renderElectro(d.model)+'</svg>';
      if(d.type==="graph")    return '<svg class="sqd-svg" viewBox="'+(d.viewBox||"0 0 760 420")+'">'+renderGraph(d.model)+'</svg>';
      if(d.type==="scene")    return '<svg class="sqd-svg" viewBox="'+(d.viewBox||"0 0 760 420")+'">'+renderScene(d.model)+'</svg>';
      if(d.type==="aggl")     return '<svg class="sqd-svg" viewBox="'+(d.viewBox||"0 0 760 320")+'">'+renderAggl(d.model)+'</svg>';
      if(d.type==="karyotype")return '<svg class="sqd-svg" viewBox="'+(d.viewBox||"0 0 760 320")+'">'+renderKaryotype(d.model)+'</svg>';
      return "";
    }
    function showDoc(k){
      $("sqd-stage").innerHTML=renderDoc(k);
      Array.prototype.forEach.call(tabsEl.children,function(b){b.classList.toggle("on",b.dataset.k===k);});
      $("sqd-legend").style.display = (docs[k].type==="pedigree")?"flex":"none";
      applyHL();
      // clic d'identification (étape de lecture pédigree)
      if(steps[cur] && steps[cur].clickable && docs[k].type==="pedigree"){
        Array.prototype.forEach.call($("sqd-stage").querySelectorAll(".sqd-indiv"),function(g){
          g.onclick=function(){
            var id=g.dataset.id, p=docs[k].model.people[id];
            var sx=(p.s==="M")?"♂":"♀", ph=p.a?"●":"○";
            $("sqd-cap").innerHTML='<b style="color:var(--or2)">'+id+'</b>'+(p.n?" ("+esc(p.n)+")":"")+" — "+sx+" "+ph;
            highlightPed([id]);
          };
        });
      }
      curDocKey=k;
    }
    var curDocKey=docKeys[0];

    function highlightPed(ids){
      var stage=$("sqd-stage");
      Array.prototype.forEach.call(stage.querySelectorAll(".sqd-indiv"),function(g){g.classList.toggle("hl",ids.indexOf(g.dataset.id)>=0);});
    }
    function highlightLane(ids){
      var stage=$("sqd-stage");
      Array.prototype.forEach.call(stage.querySelectorAll(".sqd-lane"),function(g){g.classList.toggle("hl",ids.indexOf(g.dataset.id)>=0);});
    }
    function applyHL(){
      var st=steps[cur]; if(!st||!st.hl) return;
      if(docs[curDocKey] && docs[curDocKey].type==="pedigree" && st.hl.pedigree) highlightPed(st.hl.pedigree);
      if(docs[curDocKey] && docs[curDocKey].type==="electro" && st.hl.electro) highlightLane(st.hl.electro);
    }

    function renderBilan(){
      var ul=$("sqd-bilanlist"); ul.innerHTML="";
      steps.forEach(function(st,i){
        var li=document.createElement("li");
        if(i<cur){ li.className="done"; li.innerHTML=pick(st.concl,lang); }
        else li.textContent=T.step+" "+(i+1)+" — "+T.toEstablish;
        ul.appendChild(li);
      });
      $("sqd-fill").style.width=(cur/steps.length*100)+"%";
    }

    function loadStep(){
      var st=steps[cur]; answered=false;
      $("sqd-no").textContent=T.step+" "+(cur+1)+" / "+steps.length;
      $("sqd-verb").textContent=pick(st.verb,lang);
      var qhtml=pick(st.q,lang);
      if(st.punnett) qhtml+=renderPunnett(st.punnett);
      $("sqd-q").innerHTML=qhtml;

      // doc à montrer
      var target = st.doc==="both" ? docKeys[0] : (st.doc||docKeys[0]);
      if(docs[target]) showDoc(target); else { $("sqd-stage").innerHTML=""; }
      $("sqd-cap").textContent = st.clickable ? T.clickHint : (st.doc==="punnett"||!docs[target]?"":T.hlHint);

      // options
      var opts=$("sqd-opts"); opts.innerHTML="";
      st.opts.forEach(function(o,idx){
        var b=document.createElement("button");
        b.className="sqd-opt"; b.innerHTML=pick(o.t,lang);
        b.onclick=function(){ answer(idx,b); };
        opts.appendChild(b);
      });
      // reset aides/justif
      var h=$("sqd-hint"); h.classList.remove("show"); h._n=0;
      $("sqd-justif").classList.remove("show");
      $("sqd-bhint").disabled=false; $("sqd-bhint").style.display="inline-block";
      $("sqd-bnext").style.display="none";
      renderBilan();
    }

    $("sqd-bhint").onclick=function(){
      var st=steps[cur], h=$("sqd-hint"), n=h._n||0;
      if(n>=st.hints.length) return;
      $("sqd-hintl").textContent=T.aideN+" "+(n+1)+"/"+st.hints.length;
      $("sqd-hintt").innerHTML=pick(st.hints[n],lang);
      h.classList.add("show"); h._n=n+1; hintsUsed++;
      if(h._n>=st.hints.length) $("sqd-bhint").disabled=true;
    };

    function answer(idx,btn){
      if(answered) return;
      var st=steps[cur];
      if(st.opts[idx].c){
        answered=true;
        Array.prototype.forEach.call($("sqd-opts").children,function(b,i){
          b.disabled=true; if(st.opts[i].c) b.classList.add("correct");
        });
        $("sqd-justift").innerHTML=pick(st.justif,lang);
        $("sqd-justif").classList.add("show");
        $("sqd-bhint").style.display="none";
        var nb=$("sqd-bnext"); nb.style.display="inline-block";
        nb.textContent=(cur===steps.length-1)?T.diag:T.cont;
        nb.onclick=nextStep;
      } else {
        wrongs++; btn.classList.add("wrong"); btn.disabled=true;
      }
    }

    function nextStep(){
      cur++;
      if(cur>=steps.length){ showEnd(); return; }
      loadStep();
      $("sqd-stepcard").scrollIntoView({behavior:"smooth",block:"center"});
    }

    function showEnd(){
      renderBilan(); $("sqd-fill").style.width="100%";
      $("sqd-stepcard").style.display="none";
      var tier,em,bdg, B=scenario.badges||{};
      if(hintsUsed===0 && wrongs===0){tier=T.tierMast;em="🏆";bdg=B.gold?pick(B.gold,lang):"";}
      else if(wrongs<=2){tier=T.tierProg;em="⭐";bdg=B.silver?pick(B.silver,lang):"";}
      else {tier=T.tierRev;em="🌱";bdg=B.bronze?pick(B.bronze,lang):"";}
      var diagLines=(scenario.diagnosis?pick(scenario.diagnosis,lang):[])||[];
      var diagHtml=Array.isArray(diagLines)?diagLines.join("<br>"):diagLines;
      var certBtn = (window.KotchamiCert)
        ? '<button class="sqd-btn sqd-go" id="sqd-cert">'+esc(T.cert)+'</button> '
        : '';
      var end=$("sqd-end");
      end.innerHTML=
        '<div class="em">'+em+'</div><div class="tier">'+esc(tier)+'</div>'+
        (bdg?'<div class="bdg">'+esc(bdg)+'</div>':'')+
        '<div class="sqd-diag"><span class="l">'+esc(T.diagLbl)+'</span>'+diagHtml+'</div>'+
        '<div class="sqd-note">'+esc(T.certNote)+'</div>'+
        certBtn+
        '<button class="sqd-btn sqd-ghost" id="sqd-replay">'+esc(T.replay)+'</button>';
      end.classList.add("show");
      if(window.KotchamiCert && $("sqd-cert")){
        $("sqd-cert").onclick=function(){
          window.KotchamiCert.open({
            missionName: scenario.mission?pick(scenario.mission,lang):"",
            universe: scenario.universe?pick(scenario.universe,lang):"",
            level: scenario.level||"Terminale D",
            badge: bdg, pct: (wrongs===0?100:80), lang: lang
          });
        };
      }
      $("sqd-replay").onclick=function(){ cur=0;hintsUsed=0;wrongs=0;answered=false;
        end.classList.remove("show"); $("sqd-stepcard").style.display="block"; loadStep();
        root.scrollIntoView({behavior:"smooth",block:"start"});
      };
      if(opts.onComplete) opts.onComplete({tier:tier,hintsUsed:hintsUsed,wrongs:wrongs});
      end.scrollIntoView({behavior:"smooth",block:"center"});
    }

    loadStep();
  }

  return { mount:mount, render:render, isPremium:isPremium };
})();
