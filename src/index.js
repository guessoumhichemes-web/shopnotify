require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { initDb } = require('./db');
const { initWhatsApp, getStatus, sendConfirmation, sendManualMessage } = require('./whatsapp');
const { handleShopifyWebhook } = require('./shopify');
const { getPendingOrders, getStats } = require('./store');
const { loadTemplates, saveTemplates, DEFAULT_TEMPLATES } = require('./templates');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));
app.use('/webhook', bodyParser.raw({ type: 'application/json' }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/api/whatsapp/status', (req, res) => {
  res.json(getStatus());
});

app.post('/webhook/orders/create', handleShopifyWebhook);

app.get('/api/orders', (req, res) => {
  res.json(getPendingOrders());
});

app.get('/api/stats', (req, res) => {
  res.json(getStats());
});

app.post('/api/send/:orderId', async (req, res) => {
  const { orderId } = req.params;
  try {
    const result = await sendConfirmation(orderId);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Envoi manuel d'un message depuis la page Conversations
app.post('/api/message', async (req, res) => {
  const { phone, message } = req.body;
  if (!phone || !message) return res.status(400).json({ success: false, error: 'phone et message requis' });
  try {
    const result = await sendManualMessage(phone, message);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Templates et messages automatiques
app.get('/api/templates', (req, res) => {
  res.json(loadTemplates());
});

app.put('/api/templates', (req, res) => {
  try {
    const templates = req.body;
    if (!templates.fr || !templates.es) {
      return res.status(400).json({ error: 'Templates fr et es requis' });
    }
    saveTemplates(templates);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/templates/reset', (req, res) => {
  saveTemplates(DEFAULT_TEMPLATES);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`\n🚀 ShopNotify démarré sur http://localhost:${PORT}`);
  console.log(`📱 Ouvre le dashboard pour scanner le QR WhatsApp\n`);
});

// ⭐ Initialisation DB SQLite + WhatsApp
(async () => {
  try {
    await initDb();
    console.log('✅ Database initialisée');
  } catch (err) {
    console.error('❌ Erreur initialisation Database:', err);
    process.exit(1);
  }

  try {
    await initWhatsApp();
  } catch (err) {
    console.error('❌ Erreur initialisation WhatsApp:', err);
    process.exit(1);
  }
})();
