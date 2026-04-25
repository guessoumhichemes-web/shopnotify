const fs = require('fs');
const path = require('path');

const TEMPLATES_FILE = path.join(__dirname, '../templates.json');

const DEFAULT_TEMPLATES = {
  fr: {
    confirmation: `🛍️ Bonjour {name} !

Merci pour votre commande *#{orderNumber}* sur {shop}.

📦 *Produits :*
{items}

💰 *Total :* {total}
📍 *Livraison :* {address}

Pouvez-vous confirmer votre commande en répondant *OUI* ou l'annuler en répondant *NON* ?`,

    reminder: `⏰ Rappel — Commande *#{orderNumber}*

Nous n'avons pas encore reçu votre confirmation.
Répondez *OUI* pour confirmer ou *NON* pour annuler.`,

    confirmed: `✅ Commande *#{orderNumber}* confirmée !
Merci {name}, nous préparons votre colis. 📦`,

    cancelled: `❌ Commande *#{orderNumber}* annulée.
Si c'est une erreur, contactez-nous directement.`,

    unknown: `❓ Je n'ai pas compris votre réponse.
Répondez simplement *OUI* pour confirmer ou *NON* pour annuler.`
  },

  es: {
    confirmation: `🛍️ ¡Hola {name}!

Gracias por tu pedido *#{orderNumber}* en {shop}.

📦 *Productos:*
{items}

💰 *Total:* {total}
📍 *Envío:* {address}

¿Puedes confirmar tu pedido respondiendo *SÍ* o cancelarlo respondiendo *NO*?`,

    reminder: `⏰ Recordatorio — Pedido *#{orderNumber}*

Aún no hemos recibido tu confirmación.
Responde *SÍ* para confirmar o *NO* para cancelar.`,

    confirmed: `✅ ¡Pedido *#{orderNumber}* confirmado!
Gracias {name}, estamos preparando tu paquete. 📦`,

    cancelled: `❌ Pedido *#{orderNumber}* cancelado.
Si es un error, contáctanos directamente.`,

    unknown: `❓ No he entendido tu respuesta.
Responde simplemente *SÍ* para confirmar o *NO* para cancelar.`
  }
};

// Charge les templates (JSON local ou défauts)
function loadTemplates() {
  try {
    if (fs.existsSync(TEMPLATES_FILE)) {
      const raw = fs.readFileSync(TEMPLATES_FILE, 'utf8');
      const saved = JSON.parse(raw);
      // Merge avec les défauts pour ne pas perdre de clés
      return {
        fr: { ...DEFAULT_TEMPLATES.fr, ...saved.fr },
        es: { ...DEFAULT_TEMPLATES.es, ...saved.es }
      };
    }
  } catch (e) {
    console.error('Erreur chargement templates:', e.message);
  }
  return JSON.parse(JSON.stringify(DEFAULT_TEMPLATES));
}

// Sauvegarde dans templates.json
function saveTemplates(templates) {
  fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(templates, null, 2), 'utf8');
}

// Détecte la langue depuis la commande Shopify
function detectLanguage(order) {
  // 1. Locale Shopify (langue dans laquelle le client a commandé)
  const locale = order.customer_locale || order.locale || '';
  if (locale.startsWith('fr')) return 'fr';
  if (locale.startsWith('es')) return 'es';

  // 2. Fallback : préfixe téléphonique
  const phone = order.shipping_address?.phone || order.phone || order.billing_address?.phone || '';
  const cleaned = phone.replace(/\s/g, '');
  if (cleaned.startsWith('+33') || cleaned.startsWith('0033')) return 'fr';
  if (cleaned.startsWith('+34') || cleaned.startsWith('0034')) return 'es';

  // 3. Fallback : pays de livraison
  const country = (order.shipping_address?.country_code || order.billing_address?.country_code || '').toUpperCase();
  if (['FR', 'BE', 'CH', 'LU', 'MC'].includes(country)) return 'fr';
  if (['ES'].includes(country)) return 'es';

  // 4. Défaut : espagnol (adapte selon ta boutique)
  return 'es';
}

// Remplace les variables dans un template
function renderTemplate(template, vars) {
  return template
    .replace(/{name}/g, vars.name || '')
    .replace(/{orderNumber}/g, vars.orderNumber || '')
    .replace(/{shop}/g, vars.shop || '')
    .replace(/{items}/g, vars.items || '')
    .replace(/{total}/g, vars.total || '')
    .replace(/{address}/g, vars.address || '');
}

// Récupère un message rendu
function getMessage(type, lang, vars) {
  const templates = loadTemplates();
  const langTemplates = templates[lang] || templates['es'];
  const template = langTemplates[type] || DEFAULT_TEMPLATES['es'][type] || '';
  return renderTemplate(template, vars);
}

module.exports = {
  loadTemplates,
  saveTemplates,
  detectLanguage,
  getMessage,
  DEFAULT_TEMPLATES
};
