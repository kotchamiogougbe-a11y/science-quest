/* ============================================================
   Kotchami — configuration du Tuteur IA
   ------------------------------------------------------------
   Colle ici l'URL de ta Cloud Function "tuteurIA" (voir GUIDE-SERVEUR.md),
   puis redéploie le site.

   Tant que endpoint reste vide (""), tout fonctionne :
   le bouton « Valider ma réponse » affiche la correction modèle.
   Dès que l'URL est renseignée, le tuteur IA s'active.
   ============================================================ */
window.KOTCHAMI_AI = {
  endpoint: ""   // ex : "https://europe-west1-science-quest-1487c.cloudfunctions.net/tuteurIA"
};
