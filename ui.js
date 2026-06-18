/* ═══════════════════════════════════════════════════════════
   KOTCHAMI — ui.js · Interactions communes partagées
   • Header : ajoute .scrolled au-delà de 40px de défilement
   • Reveal : révèle les éléments .reveal à l'entrée dans l'écran
═══════════════════════════════════════════════════════════ */
(function(){
  function init(){
    var hdr = document.getElementById('hdr');
    if(hdr){
      window.addEventListener('scroll', function(){
        hdr.classList.toggle('scrolled', window.scrollY > 40);
      }, {passive:true});
    }
    var els = document.querySelectorAll('.reveal');
    if(els.length){
      if(!('IntersectionObserver' in window)){
        for(var i=0;i<els.length;i++) els[i].classList.add('visible');
        return;
      }
      var obs = new IntersectionObserver(function(entries){
        entries.forEach(function(e,i){
          if(e.isIntersecting){
            setTimeout(function(){ e.target.classList.add('visible'); }, i*70);
            obs.unobserve(e.target);
          }
        });
      }, {threshold:.1});
      els.forEach(function(el){ obs.observe(el); });
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
