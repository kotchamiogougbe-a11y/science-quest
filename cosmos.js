/* ═══════════════════════════════════════════════════════════
   KOTCHAMI — cosmos.js · Fond vivant partagé de l'écosystème
   Une seule source de vérité pour toutes les pages.
   Dessine sur <canvas id="starfield"> : nébuleuse + particules
   (couleurs des 3 piliers) + constellations + étoiles filantes.
   • Intensité « intense » par défaut
   • Densité bridée automatiquement sur mobile
   • Respecte prefers-reduced-motion (fond fixe)
═══════════════════════════════════════════════════════════ */
(function(){
  var canvas = document.getElementById('starfield');
  if(!canvas) return;
  canvas.setAttribute('aria-hidden','true');
  canvas.setAttribute('role','presentation');
  canvas.setAttribute('tabindex','-1');
  var ctx = canvas.getContext('2d');
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Palette = identité des 3 piliers (or = Science Quest, cosmos = INFINITIA, vert = SAPIENTIA)
  var COLORS = [
    {c:[245,217,139], w:44}, {c:[197,158,80], w:13},
    {c:[126,180,255], w:23}, {c:[34,208,110], w:9}, {c:[244,247,255], w:11}
  ];
  var total = 0; for(var k=0;k<COLORS.length;k++) total += COLORS[k].w;
  function pickColor(){ var r=Math.random()*total; for(var i=0;i<COLORS.length;i++){ if((r-=COLORS[i].w)<=0) return COLORS[i].c; } return COLORS[0].c; }

  var W,H,DPR, particles=[], comets=[], nebula=[];
  var mouse={x:-9999,y:-9999,nx:0,ny:0,active:false};
  function isMobile(){ return Math.min(window.innerWidth,window.innerHeight)<620 || ('ontouchstart' in window); }

  // INTENSE : dense; bridé de moitié sur mobile
  function targetCount(){
    var base = (W*H)/6000;
    if(isMobile()) base *= 0.5;
    return Math.max(34, Math.min(320, Math.round(base)));
  }

  function makeParticle(){
    var layer=Math.random(), depth=0.4+layer*1.6;
    var r=(0.6+layer*2.0)*(Math.random()*0.8+0.6);
    var roll=Math.random(), type='dot';
    if(roll>0.6 && roll<0.9) type='dash'; else if(roll>=0.9) type='glint';
    var col = type==='glint' ? [245,217,139] : pickColor();
    return {x:Math.random()*W,y:Math.random()*H,
      vx:(Math.random()-0.5)*0.18*depth, vy:(-0.06-Math.random()*0.16)*depth,
      r:r,depth:depth,type:type,col:col,ox:0,oy:0,
      rot:Math.random()*Math.PI, vrot:(Math.random()-0.5)*0.01,
      base:0.4+Math.random()*0.5, tw:Math.random()*Math.PI*2, tws:0.6+Math.random()*1.4};
  }
  function makeNebula(){
    var cols=[[245,217,139],[245,217,139],[126,180,255],[34,208,110]];
    nebula = cols.map(function(c){ return {
      x:Math.random()*W, y:Math.random()*H,
      r:Math.min(W,H)*(0.35+Math.random()*0.3), col:c,
      vx:(Math.random()-0.5)*0.10, vy:(Math.random()-0.5)*0.08,
      ph:Math.random()*Math.PI*2, ps:0.0003+Math.random()*0.0004 }; });
  }
  function build(){ particles=[]; var n=targetCount(); for(var i=0;i<n;i++) particles.push(makeParticle()); }

  function resize(){
    DPR=Math.min(window.devicePixelRatio||1,2);
    W=window.innerWidth; H=window.innerHeight;
    canvas.width=W*DPR; canvas.height=H*DPR;
    canvas.style.width=W+'px'; canvas.style.height=H+'px';
    ctx.setTransform(DPR,0,0,DPR,0,0);
    makeNebula(); build();
  }

  function spawnComet(big){
    var fromLeft=Math.random()<0.5, y=Math.random()*H*0.55;
    comets.push({x:fromLeft?-40:W+40,y:y,vx:(fromLeft?1:-1)*((big?7:5)+Math.random()*3),
      vy:(1.1+Math.random()*1.5),life:1,len:(big?180:120)+Math.random()*80,big:!!big});
  }
  var cometTimer=3500+Math.random()*4000;

  function drawNebula(t){
    ctx.globalCompositeOperation='lighter';
    for(var i=0;i<nebula.length;i++){
      var b=nebula[i]; b.x+=b.vx; b.y+=b.vy;
      if(b.x<-b.r)b.x=W+b.r; if(b.x>W+b.r)b.x=-b.r; if(b.y<-b.r)b.y=H+b.r; if(b.y>H+b.r)b.y=-b.r;
      var pulse=0.07+0.035*Math.sin(t*b.ps+b.ph);
      var px=b.x+mouse.nx*22, py=b.y+mouse.ny*22;
      var g=ctx.createRadialGradient(px,py,0,px,py,b.r);
      g.addColorStop(0,'rgba('+b.col[0]+','+b.col[1]+','+b.col[2]+','+pulse+')');
      g.addColorStop(1,'rgba('+b.col[0]+','+b.col[1]+','+b.col[2]+',0)');
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(px,py,b.r,0,7); ctx.fill();
    }
    ctx.globalCompositeOperation='source-over';
  }

  function drawParticle(p,t){
    var tw=p.base*(0.55+0.45*Math.sin(t*0.001*p.tws+p.tw));
    var x=p.x+p.ox, y=p.y+p.oy, r=p.col[0], g=p.col[1], b=p.col[2];
    if(p.type==='glint'){
      var s=p.r*2.6, grd=ctx.createRadialGradient(x,y,0,x,y,s*2.2);
      grd.addColorStop(0,'rgba('+r+','+g+','+b+','+tw+')'); grd.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(x,y,s*2.2,0,7); ctx.fill();
      ctx.strokeStyle='rgba('+r+','+g+','+b+','+tw+')'; ctx.lineWidth=0.9;
      ctx.beginPath(); ctx.moveTo(x-s,y);ctx.lineTo(x+s,y); ctx.moveTo(x,y-s);ctx.lineTo(x,y+s);
      ctx.moveTo(x-s*0.6,y-s*0.6);ctx.lineTo(x+s*0.6,y+s*0.6); ctx.moveTo(x-s*0.6,y+s*0.6);ctx.lineTo(x+s*0.6,y-s*0.6);
      ctx.stroke();
    } else if(p.type==='dash'){
      ctx.save(); ctx.translate(x,y); ctx.rotate(p.rot);
      ctx.strokeStyle='rgba('+r+','+g+','+b+','+tw+')'; ctx.lineWidth=p.r*0.9; ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(-p.r*1.9,0); ctx.lineTo(p.r*1.9,0); ctx.stroke(); ctx.restore();
    } else {
      ctx.fillStyle='rgba('+r+','+g+','+b+','+tw+')';
      ctx.beginPath(); ctx.arc(x,y,p.r,0,7); ctx.fill();
    }
  }

  // Constellations via grille de voisinage (≈ O(n), fluide même dense)
  var CELL=128;
  function drawLines(){
    var max2=CELL*CELL, cols=Math.ceil(W/CELL)+2, grid={};
    for(var i=0;i<particles.length;i++){
      var p=particles[i], cx=((p.x/CELL)|0)+1, cy=((p.y/CELL)|0)+1, key=cx+'_'+cy;
      (grid[key]||(grid[key]=[])).push(p);
    }
    function link(a,b){
      var dx=(a.x+a.ox)-(b.x+b.ox), dy=(a.y+a.oy)-(b.y+b.oy), d2=dx*dx+dy*dy;
      if(d2<max2){
        var al=(1-d2/max2)*0.18, r=(a.col[0]+b.col[0])>>1, g=(a.col[1]+b.col[1])>>1, bl=(a.col[2]+b.col[2])>>1;
        ctx.strokeStyle='rgba('+r+','+g+','+bl+','+al+')'; ctx.lineWidth=0.5;
        ctx.beginPath(); ctx.moveTo(a.x+a.ox,a.y+a.oy); ctx.lineTo(b.x+b.ox,b.y+b.oy); ctx.stroke();
      }
    }
    for(var key in grid){
      var parts=key.split('_'), gx=+parts[0], gy=+parts[1], cellP=grid[key];
      for(var a=0;a<cellP.length;a++){
        // dans la même cellule
        for(var b2=a+1;b2<cellP.length;b2++) link(cellP[a],cellP[b2]);
        // cellules voisines (3 directions pour éviter doublons)
        var neigh=[[gx+1,gy],[gx,gy+1],[gx+1,gy+1],[gx-1,gy+1]];
        for(var n=0;n<neigh.length;n++){
          var nk=neigh[n][0]+'_'+neigh[n][1], np=grid[nk];
          if(!np) continue;
          for(var m=0;m<np.length;m++) link(cellP[a],np[m]);
        }
      }
    }
  }

  function step(t){
    ctx.clearRect(0,0,W,H);
    drawNebula(t);
    for(var i=0;i<particles.length;i++){
      var p=particles[i];
      p.x+=p.vx; p.y+=p.vy; p.rot+=p.vrot;
      if(p.y<-10)p.y=H+10; if(p.x<-10)p.x=W+10; if(p.x>W+10)p.x=-10;
      if(mouse.active){
        var dx=p.x-mouse.x, dy=p.y-mouse.y, d2=dx*dx+dy*dy, R=150;
        if(d2<R*R){ var d=Math.sqrt(d2)||1, f=(R-d)/R; p.ox+=(dx/d)*f*4.5; p.oy+=(dy/d)*f*4.5; }
      }
      p.ox=(p.ox*0.86)+(mouse.nx*15*p.depth)*0.06; p.oy=(p.oy*0.86)+(mouse.ny*15*p.depth)*0.06;
    }
    ctx.globalCompositeOperation='lighter';
    drawLines();
    for(var j=0;j<particles.length;j++) drawParticle(particles[j],t);
    ctx.globalCompositeOperation='source-over';

    cometTimer-=16; if(cometTimer<=0){ spawnComet(Math.random()<0.3); cometTimer=4000+Math.random()*5000; }
    ctx.globalCompositeOperation='lighter';
    for(var c=comets.length-1;c>=0;c--){
      var k=comets[c]; k.x+=k.vx; k.y+=k.vy; k.life-=0.011;
      if(k.life<=0||k.x<-80||k.x>W+80){ comets.splice(c,1); continue; }
      var tx=k.x-k.vx*(k.len/6), ty=k.y-k.vy*(k.len/6);
      var grd=ctx.createLinearGradient(k.x,k.y,tx,ty);
      grd.addColorStop(0,'rgba(245,217,139,'+(0.9*k.life)+')'); grd.addColorStop(1,'rgba(245,217,139,0)');
      ctx.strokeStyle=grd; ctx.lineWidth=k.big?2.6:1.8; ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(k.x,k.y); ctx.lineTo(tx,ty); ctx.stroke();
      ctx.fillStyle='rgba(255,255,255,'+k.life+')'; ctx.beginPath(); ctx.arc(k.x,k.y,k.big?2.2:1.6,0,7); ctx.fill();
    }
    ctx.globalCompositeOperation='source-over';
  }

  var last=0;
  function loop(now){ step(now); last=now; requestAnimationFrame(loop); }
  function start(){
    resize();
    if(reduced){ drawNebula(0); for(var i=0;i<particles.length;i++) drawParticle(particles[i],0); return; }
    requestAnimationFrame(loop);
  }

  var rT;
  window.addEventListener('resize', function(){ clearTimeout(rT); rT=setTimeout(resize,150); }, {passive:true});
  window.addEventListener('mousemove', function(e){ mouse.x=e.clientX; mouse.y=e.clientY; mouse.active=true; mouse.nx=(e.clientX/W-0.5)*2; mouse.ny=(e.clientY/H-0.5)*2; });
  window.addEventListener('mouseout', function(){ mouse.active=false; mouse.x=-9999; mouse.y=-9999; });
  window.addEventListener('touchmove', function(e){ var t=e.touches[0]; if(!t) return; mouse.x=t.clientX; mouse.y=t.clientY; mouse.active=true; mouse.nx=(t.clientX/W-0.5)*2; mouse.ny=(t.clientY/H-0.5)*2; }, {passive:true});
  window.addEventListener('deviceorientation', function(e){ if(e.gamma==null) return; mouse.nx=Math.max(-1,Math.min(1,e.gamma/35)); mouse.ny=Math.max(-1,Math.min(1,(e.beta-45)/35)); });

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
