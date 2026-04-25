const crypto = require('crypto');
const { addOrder } = require('./store');
const { detectLanguage } = require('./templates');

// ── Vérification signature Shopify ───────────────────────
function verifyWebhook(req) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) return true; // pas de secret configuré → on accepte (dev uniquement)

  const hmac = req.headers['x-shopify-hmac-sha256'];
  const body = req.body; // raw Buffer grâce à bodyParser.raw
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('base64');

  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(hash));
}

// ── Handler webhook commande créée ────────────────────────
async function handleShopifyWebhook(req, res) {
  // Vérifier l'authenticité
  if (!verifyWebhook(req)) {
    console.warn('⚠️  Webhook Shopify refusé : signature invalide');
    return res.status(401).json({ error: 'Signature invalide' });
  }

  // Accuser réception immédiatement (Shopify attend < 5s)
  res.status(200).json({ received: true });

  let order;
  try {
    order = JSON.parse(req.body.toString());
  } catch (err) {
    console.error('Erreur parsing webhook :', err.message);
    return;
  }

  console.log(`📦 Nouvelle commande Shopify #${order.order_number} — ${order.email}`);

  // Extraire le numéro de téléphone (billing ou shipping)
  const phone =
    order.billing_address?.phone ||
    order.shipping_address?.phone ||
    order.phone ||
    null;

  if (!phone) {
    console.warn(`⚠️  Commande #${order.order_number} sans numéro de téléphone — ignorée`);
    return;
  }

  // Détecte la langue
  const lang = detectLanguage(order);

  // Construire l'objet commande interne
  const newOrder = {
    id: `order_${order.id}`,
    shopifyId: order.order_number,
    shopifyNumericId: order.id,
    customerName: `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim(),
    email: order.email,
    phone,
    total: parseFloat(order.total_price).toFixed(2),
    currency: order.currency,
    shippingAddress: formatAddress(order.shipping_address),
    items: (order.line_items || []).map((item) => ({
      name: item.title,
      quantity: item.quantity,
      price: item.price,
    })),
    status: 'pending',
    lang,
    raw: order,
    createdAt: new Date().toISOString(),
  };

  addOrder(newOrder);

  // Envoyer le message WhatsApp (lazy import pour éviter dépendance circulaire)
  try {
    const { sendConfirmation } = require('./whatsapp');
    await sendConfirmation(newOrder.id);
  } catch (err) {
    console.error(`❌ Impossible d'envoyer WA pour #${order.order_number} :`, err.message);
  }
}

function formatAddress(addr) {
  if (!addr) return 'Non renseignée';
  return [addr.address1, addr.city, addr.zip, addr.country]
    .filter(Boolean)
    .join(', ');
}

module.exports = { handleShopifyWebhook };
