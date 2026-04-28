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

const { getMessage, detectLanguage, loadSequence } = require('./templates');
const { getOrder, updateOrderStatus, getOrders } = require('./store');
const { updateShopifyOrder, cancelShopifyOrder } = require('./shopify');

let sock = null;
let qrCodeData = null;
let pairingCode = null;
let isReady = false;
let myNumber = null;
let reconnectAttempts = 0;
let botActive = true;
let intentionalStop = false; // Prevents auto-reconnect on manual stop

const DATA_DIR = process.env.DATA_DIR || '/data';
const SESSION_DIR = path.join(DATA_DIR, '.wa_session_baileys');

// Générer un pairing code via le socket Baileys
async function requestPairingCode(phoneNumber) {
  if (!sock) throw new Error('Socket WhatsApp non initialisé');
  const phone = phoneNumber.replace(/\D/g, '');
  const code = await sock.requestPairingCode(phone);
  pairingCode = code;
  console.log(`✅ Pairing code généré: ${code}`);
  return code;
}

async function initWhatsApp() {
  intentionalStop = false; // Allow reconnection for this new session
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    browser: ['ShopNotify', 'Chrome', '1.0.0'],
    markOnlineOnConnect: false,
    syncFullHistory: false,
    printQRInTerminal: false,
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

      isReady = false;

      // If we stopped manually, do NOT reconnect
      if (intentionalStop) {
        console.log('🛑 Arrêt intentionnel — pas de reconnexion automatique');
        return;
      }

      console.log(`⚠️  WhatsApp déconnecté : code ${code}`);

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
  if (!botActive) {
    console.log('⏸ Bot désactivé — message non envoyé');
    return { sent: false, reason: 'bot_disabled' };
  }

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

  const phone = formatPhone(order.phone);
  const jid = `${phone}@s.whatsapp.net`; // ← JID en format Baileys

  // Charger la séquence et envoyer les messages
  const sequence = loadSequence();

  // Envoyer le 1er message (confirmation)
  if (sequence.length > 0) {
    // ✅ FIX: Toujours utiliser getMessage() pour rendre les variables correctement
    const message = getMessage('confirmation', lang, vars);

    await sock.sendMessage(jid, { text: message }); // ← Structure Baileys: { text: ... }
    updateOrderStatus(orderId, 'sent', { lang });
    console.log(`📤 Message envoyé à ${order.customerName} (${phone})`);
  }

  // Programmer les messages suivants
  for (let i = 1; i < sequence.length; i++) {
    const step = sequence[i];
    const delayMs = step.delayHours * 60 * 60 * 1000;

    setTimeout(async () => {
      const currentOrder = getOrder({ id: orderId });
      if (!currentOrder || !['sent', 'reminded'].includes(currentOrder.status)) return;

      if (!botActive) {
        console.log('⏸ Bot désactivé — message programmé non envoyé');
        return;
      }

      try {
        // ✅ FIX: Toujours utiliser getMessage() pour rendre les variables correctement
        const message = getMessage(step.id, lang, vars);

        await sock.sendMessage(jid, { text: message }); // ← Structure Baileys
        updateOrderStatus(orderId, 'reminded');
        console.log(`🔔 Message séquence ${step.id} envoyé pour commande #${order.shopifyId}`);
      } catch (err) {
        console.error(`Erreur envoi message ${step.id}:`, err.message);
      }
    }, delayMs);
  }

  return { sent: true, phone };
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
    pairingCode: pairingCode,
    phone: myNumber,
    active: botActive,
    status: isReady ? 'connected' : qrCodeData ? 'qr' : 'disconnected'
  };
}

async function sendManualMessage(phone, message) {
  if (!botActive) {
    console.log('⏸ Bot désactivé — message non envoyé');
    return { sent: false, reason: 'bot_disabled' };
  }

  if (!isReady) throw new Error('WhatsApp non connecté');
  const p = formatPhone(phone);
  const jid = `${p}@s.whatsapp.net`; // ← Format Baileys
  await sock.sendMessage(jid, { text: message }); // ← Structure Baileys
  console.log(`📤 Message manuel envoyé à ${p}`);
  return { sent: true, phone: p };
}

function stopWhatsApp() {
  intentionalStop = true; // Block auto-reconnect triggered by sock.end()
  if (sock) {
    sock.ev.removeAllListeners(); // Remove BEFORE end to drop the close event
    sock.end();
  }
  sock = null;
  qrCodeData = null;
  isReady = false;
  reconnectAttempts = 0;
  console.log('🛑 WhatsApp arrêté');
}

async function startQR() {
  stopWhatsApp();
  console.log('📸 Démarrage en mode QR...');
  await initWhatsApp();
}

async function startPairing(phoneNumber) {
  stopWhatsApp();
  intentionalStop = false; // Allow reconnection for this new pairing session
  console.log('📱 Démarrage en mode Pairing...');

  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    browser: ['ShopNotify', 'Chrome', '1.0.0'],
    markOnlineOnConnect: false,
    syncFullHistory: false,
    printQRInTerminal: false,
  });

  // Demander le code de pairing immédiatement
  if (!state.creds.registered) {
    const code = await sock.requestPairingCode(phoneNumber.replace(/\D/g, ''));
    pairingCode = code;
    console.log(`✅ Pairing code: ${code}`);
  }

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('📱 QR Code reçu, scan dans le dashboard...');
      qrCodeData = await qrcode.toDataURL(qr);
      isReady = false;
    }

    if (connection === 'open') {
      const info = sock.user;
      isReady = true;
      qrCodeData = null;
      myNumber = info?.id?.split(':')[0] || null;
      reconnectAttempts = 0;
      console.log(`✅ WhatsApp connecté : ${myNumber}`);
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      const loggedOut = code === DisconnectReason.loggedOut;

      isReady = false;

      if (intentionalStop) {
        console.log('🛑 Arrêt intentionnel — pas de reconnexion automatique');
        return;
      }

      console.log(`⚠️  WhatsApp déconnecté : code ${code}`);

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

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (msg.key.fromMe) continue;

      if (!msg.key.remoteJid?.endsWith('@s.whatsapp.net')) continue;

      try {
        await handleIncomingMessage(msg);
      } catch (err) {
        console.error('Erreur handleIncomingMessage:', err);
      }
    }
  });
}

async function disconnectWhatsApp() {
  stopWhatsApp();
  const fs = require('fs');
  try {
    fs.rmSync(SESSION_DIR, { recursive: true, force: true });
    console.log('🔌 Session supprimée — prêt pour un nouveau numéro');
  } catch (err) {
    console.error('Erreur suppression session:', err.message);
  }
}

function setBotActive(val) {
  botActive = val;
}

function getBotActive() {
  return botActive;
}

module.exports = {
  initWhatsApp,
  requestPairingCode,
  getStatus,
  sendConfirmation,
  sendManualMessage,
  stopWhatsApp,
  disconnectWhatsApp,
  startQR,
  startPairing,
  setBotActive,
  getBotActive
};
