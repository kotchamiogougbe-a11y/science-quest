/* ═══════════════════════════════════════════════════════════
   KOTCHAMI — Serveur Cloud Functions
   Tuteur IA pour Science Quest (correction de rédactions)
   Modèle : Claude Haiku 4.5 (~1 FCFA / correction)
   La clé API vit UNIQUEMENT côté serveur (secret Firebase).
   Soli Deo Gloria
═══════════════════════════════════════════════════════════ */

const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");

// La clé Claude est stockée comme SECRET Firebase (jamais dans le code)
const CLAUDE_KEY = defineSecret("CLAUDE_KEY");

// ─── Le tuteur IA ───────────────────────────────────────────
exports.tuteur = onRequest(
  {
    secrets: [CLAUDE_KEY],
    cors: true,           // autorise l'appel depuis le navigateur
    region: "us-central1",
    maxInstances: 10,     // garde-fou contre les pics de coût
  },
  async (req, res) => {
    // On n'accepte que POST
    if (req.method !== "POST") {
      res.status(405).json({ error: "Méthode non autorisée." });
      return;
    }

    try {
      const body = req.body || {};
      // Accepte les deux conventions de nommage (chromosoma.html + générique)
      const sujet = body.sujet || body.question || "";
      const reponseEleve = body.reponseEleve || body.answer || "";
      const correctionModele = body.correctionModele || body.modelAnswer || "";
      const langue = body.langue || body.lang || "fr";

      // Validation simple
      if (!reponseEleve || reponseEleve.trim().length < 10) {
        res.status(400).json({
          error: "La réponse de l'élève est trop courte pour être évaluée.",
        });
        return;
      }

      // Noms de langues pour le prompt
      const langues = {
        fr: "français", en: "anglais", ar: "arabe",
        es: "espagnol", pt: "portugais", sw: "swahili",
      };
      const langueNom = langues[langue] || "français";

      // ─── Le prompt système (la personnalité du tuteur) ───
      const systemPrompt = `Tu es un tuteur pédagogique bienveillant et exigeant, dans l'esprit de "Le Passeur de sciences" : comprendre avant de mémoriser, bâtir sur du roc.

Tu corriges la rédaction d'un élève en ${langueNom}. Tu réponds TOUJOURS en ${langueNom}.

Ta réponse suit EXACTEMENT cette structure en 3 parties, courte et claire :

✅ **Ce qui est réussi** : (1 à 3 points précis et encourageants sur ce que l'élève a bien fait)

🔧 **À améliorer** : (1 à 3 points concrets, sans démolir — explique POURQUOI et COMMENT)

💡 **Conseil du Passeur** : (UNE phrase clé pour progresser, mémorable)

Règles :
- Sois bienveillant mais honnête : ne félicite pas ce qui est faux.
- Reste concis (l'élève doit pouvoir tout lire en 30 secondes).
- Appuie-toi sur la correction modèle pour juger, mais valorise les bonnes idées même formulées autrement.
- Ne réécris PAS toute la rédaction à sa place : guide-le.
- Utilise un ton chaleureux, jamais condescendant.`;

      // ─── Le message utilisateur ───
      const userMessage = `SUJET DE LA RÉDACTION :
${sujet || "(non précisé)"}

CORRECTION MODÈLE (référence pour juger) :
${correctionModele || "(non fournie — évalue selon les standards scientifiques)"}

RÉDACTION DE L'ÉLÈVE :
${reponseEleve}

Donne ton retour en 3 parties (✅ / 🔧 / 💡), en ${langueNom}.`;

      // ─── Appel à l'API Claude ───
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": CLAUDE_KEY.value(),
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 700,
          system: systemPrompt,
          messages: [{ role: "user", content: userMessage }],
        }),
      });

      if (!r.ok) {
        const errText = await r.text();
        console.error("Erreur API Claude :", r.status, errText);
        res.status(502).json({
          error: "Le tuteur est momentanément indisponible. Réessaie dans un instant.",
        });
        return;
      }

      const data = await r.json();
      let feedback = (data.content || [])
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();

      // Conversion legere markdown -> HTML pour un affichage propre dans l'app
      // **gras** -> <b>gras</b>  et  *italique* -> <i>italique</i>
      feedback = feedback
        .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
        .replace(/\*([^*]+)\*/g, "<i>$1</i>");

      res.json({ feedback: feedback || "" });
    } catch (e) {
      console.error("Erreur serveur tuteur :", e);
      res.status(500).json({ error: "Erreur interne du serveur." });
    }
  }
);
