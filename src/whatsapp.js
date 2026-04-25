// src/whatsapp.js
// ShopNotify ⚡ — Client WhatsApp via Baileys (remplace whatsapp-web.js)
// Migration depuis whatsapp-web.js vers Baileys
// ⚠️  UNIQUEMENT changements: JID (@s.whatsapp.net au lieu de @c.us) 
//                             et structure du message ({ text: } au lieu de string brut)

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require('@whiskeysockets/baileys');
const qrcode = require('qrcode');
const pino = require('pino');
const path = require('path');

const { getMessage, detectLanguage } = require('./templates');
const { getOrder, updateOrderStatus, getOrders } = require('./store');
const { updateShopifyOrder, cancelShopifyOrder } = require('./shopify');

let sock = null;
let qrCodeData = null;
let isReady = false;
let myNumber = null;
let reconnectAttempts = 0;

const SESSION_DIR = path.resolve(process.cwd(), '.wa_session_baileys');

async function initWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),     // Pas de logs verbeux
    browser: ['ShopNotify', 'Chrome', '1.0.0'],
    markOnlineOnConnect: false,             // Tu reçois les notifs sur ton tel
    syncFullHistory: false,                 // Pas de sync d'historique
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    // ========== QR CODE ==========
    if (qr) {
      console.log('📱 QR Code reçu, scan dans le dashboard...');
      qrCodeData = await qrcode.toDataURL(qr);
      isReady = false;
    }

    // ========== CONNECTÉ ==========
    if (connection === 'open') {
      const info = sock.user;
      isReady = true;
      qrCodeData = null;
      myNumber = info?.id?.split(':')[0] || null;
      reconnectAttempts = 0;
      console.log(`✅ WhatsApp connecté : ${myNumber}`);
    }

    // ========== DÉCONNECTÉ ==========
    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      const loggedOut = code === DisconnectReason.loggedOut;

      console.log(`⚠️  WhatsApp déconnecté : code ${code}`);
      isReady = false;

      if (loggedOut) {
        console.log('❌ Session invalidée. Supprime .wa_session_baileys/ et relance.');
        return;
      }

      if (reconnectAttempts < 5) {
        reconnectAttempts++;
        console.log(`🔄 Tentative de reconnexion ${reconnectAttempts}/5 dans 5s...`);
        setTimeout(initWhatsApp, 5000);
      } else {
        console.log('⛔ Trop de tentatives. Vérifie ta connexion.');
      }
    }
  });

  // ========== RÉCEPTION MESSAGES ==========
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      // Ignore tes propres messages
      if (msg.key.fromMe) continue;

      // Ignore les groupes et autres
      if (!msg.key.remoteJid?.endsWith('@s.whatsapp.net')) continue;

      try {
        await handleIncomingMessage(msg);
      } catch (err) {
        console.error('Erreur handleIncomingMessage:', err);
      }
    }
  });
}

async function handleIncomingMessage(msg) {
  // Extraction du texte
  const body = (
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.imageMessage?.caption ||
    msg.message?.videoMessage?.caption ||
    ''
  ).trim().toUpperCase();

  if (!body) return;

  // Extraction du numéro
  const from = msg.key.remoteJid.replace('@s.whatsapp.net', '').replace(/\D/g, '');

  console.log(`📩 Message reçu de : ${msg.key.remoteJid} → ${from}`);
  console.log(`📝 Contenu : "${msg.message?.conversation || '(pas de texte)'}"`);

  // Cherche la commande correspondant à ce numéro
  const orders = getOrders();
  const order = orders.find(o => {
    const a = o.phone?.replace(/\D/g, '') || '';
    const b = from;
    return a === b || a.endsWith(b) || b.endsWith(a);
  });

  if (!order) {
    console.log('⚠️  Aucune commande trouvée pour ce numéro');
    return;
  }

  if (!['sent', 'reminded'].includes(order.status)) {
    console.log(`ℹ️  Commande déjà traitée (statut: ${order.status}), message ignoré`);
    return;
  }

  const lang = order.lang || 'es';
  const vars = {
    name: order.customerName,
    orderNumber: order.shopifyId,
    shop: process.env.SHOPIFY_STORE || 'notre boutique',
    items: '',
    total: order.total,
    address: order.shippingAddress
  };

  // Mots-clés OUI
  if (/^(OUI|YES|SI|S[IÍ]|OK|1|Y)$/.test(body)) {
    updateOrderStatus(order.id, 'confirmed');
    await updateShopifyOrder(order.shopifyNumericId, 'confirmed');
    
    // ⚠️  Baileys n'a pas .reply(), on envoie un message normal
    const replyText = getMessage('confirmed', lang, vars);
    await sock.sendMessage(msg.key.remoteJid, { text: replyText });
    
    console.log(`✅ Commande #${order.shopifyId} confirmée par ${order.customerName}`);
    return;
  }

  // Mots-clés NON
  if (/^(NON|NO|N|0|ANNULER|CANCEL)$/.test(body)) {
    updateOrderStatus(order.id, 'cancelled');
    await cancelShopifyOrder(order.shopifyNumericId);
    
    const replyText = getMessage('cancelled', lang, vars);
    await sock.sendMessage(msg.key.remoteJid, { text: replyText });
    
    console.log(`❌ Commande #${order.shopifyId} annulée par ${order.customerName}`);
    return;
  }

  // Réponse non reconnue
  const unknownText = getMessage('unknown', lang, vars);
  await sock.sendMessage(msg.key.remoteJid, { text: unknownText });
}

async function sendConfirmation(orderId) {
  if (!isReady) throw new Error('WhatsApp non connecté');

  const order = getOrder({ id: orderId });
  if (!order) throw new Error(`Commande ${orderId} introuvable`);

  const lang = order.lang || detectLanguage(order.raw || {});

  const items = (order.items || [])
    .map(i => `  • ${i.name} x${i.quantity}`)
    .join('\n');

  const vars = {
    name: order.customerName,
    orderNumber: order.shopifyId,
    shop: process.env.SHOPIFY_STORE || 'notre boutique',
    items,
    total: order.total,
    address: order.shippingAddress
  };

  const message = getMessage('confirmation', lang, vars);
  const phone = formatPhone(order.phone);
  const jid = `${phone}@s.whatsapp.net`; // ← JID en format Baileys

  await sock.sendMessage(jid, { text: message }); // ← Structure Baileys: { text: ... }
  updateOrderStatus(orderId, 'sent', { lang });

  console.log(`📤 Message envoyé à ${order.customerName} (${phone})`);

  // Programmer une relance automatique
  const delayMinutes = parseInt(process.env.REMINDER_DELAY_MINUTES || '120');
  scheduleReminder(orderId, delayMinutes, lang);

  return { sent: true, phone };
}

function scheduleReminder(orderId, delayMinutes, lang) {
  setTimeout(async () => {
    const order = getOrder({ id: orderId });
    if (!order || order.status !== 'sent') return;

    const phone = formatPhone(order.phone);
    const jid = `${phone}@s.whatsapp.net`;
    const vars = {
      name: order.customerName,
      orderNumber: order.shopifyId
    };

    try {
      const message = getMessage('reminder', lang, vars);
      await sock.sendMessage(jid, { text: message }); // ← Structure Baileys
      updateOrderStatus(orderId, 'reminded');
      console.log(`🔔 Relance envoyée pour commande #${order.shopifyId}`);
    } catch (err) {
      console.error('Erreur relance :', err.message);
    }
  }, delayMinutes * 60 * 1000);
}

function formatPhone(phone) {
  let p = phone.replace(/\D/g, '');
  if (p.startsWith('0')) {
    const countryCode = process.env.DEFAULT_COUNTRY_CODE || '34';
    p = countryCode + p.slice(1);
  }
  return p;
}

function getStatus() {
  return {
    connected: isReady,
    qr: qrCodeData,
    phone: myNumber,
    status: isReady ? 'connected' : qrCodeData ? 'qr' : 'disconnected'
  };
}

async function sendManualMessage(phone, message) {
  if (!isReady) throw new Error('WhatsApp non connecté');
  const p = formatPhone(phone);
  const jid = `${p}@s.whatsapp.net`; // ← Format Baileys
  await sock.sendMessage(jid, { text: message }); // ← Structure Baileys
  console.log(`📤 Message manuel envoyé à ${p}`);
  return { sent: true, phone: p };
}

module.exports = {
  initWhatsApp,
  getStatus,
  sendConfirmation,
  sendManualMessage
};
