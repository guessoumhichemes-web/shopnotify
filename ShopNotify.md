# ShopNotify ⚡
> Bot Shopify + WhatsApp — confirmation automatique des commandes par message WhatsApp

---

## 🧭 Contexte du projet

Application Node.js qui :
1. Reçoit les nouvelles commandes Shopify via webhook
2. Détecte automatiquement la langue du client (FR/ES)
3. Envoie automatiquement un message WhatsApp dans la bonne langue
4. Détecte la réponse (OUI/NON) et met à jour Shopify
5. Affiche un dashboard web en temps réel

**Choix technique clé :** on utilise `@whiskeysockets/baileys` (WebSocket direct) — plus rapide, plus léger, pas de Chromium, moins de risques de ban.

---

## 📁 Structure des fichiers

```
shopnotify/
├── src/
│   ├── index.js           → Serveur Express, routes API
│   ├── whatsapp.js        → Client WhatsApp Baileys (QR, envoi, réception, multilingue)
│   ├── shopify.js         → Webhook Shopify (HMAC + parsing + détection langue)
│   ├── store.js           → Store en mémoire (commandes + stats)
│   └── templates.js       → Templates multilingues (FR/ES) + détection langue
├── public/
│   └── index.html         → Dashboard web (stats, commandes, conversations, templates, config)
├── .env                   → Variables d'environnement
├── .wa_session_baileys/   → Session WhatsApp Baileys (ne pas supprimer)
├── templates.json         → Messages personnalisés (créé automatiquement)
└── package.json
```

---

## 🔌 Stack technique

| Outil | Usage |
|---|---|
| Node.js ≥18 | Runtime |
| Express | Serveur HTTP + API REST |
| @whiskeysockets/baileys | Client WhatsApp via WebSocket (remplace whatsapp-web.js) |
| pino | Logger minimal pour Baileys |
| qrcode | Génère le QR en base64 pour le dashboard |
| axios | Appels API Shopify |
| dotenv | Variables d'environnement |

---

## 🌐 Routes API

| Méthode | Route | Description |
|---|---|---|
| GET | `/` | Dashboard HTML |
| GET | `/api/whatsapp/status` | Statut WA → `{ status, connected, qr, phone }` |
| GET | `/api/orders` | Liste toutes les commandes |
| GET | `/api/stats` | Stats du jour |
| POST | `/api/send/:orderId` | Envoyer WA de confirmation pour une commande |
| POST | `/api/message` | Envoyer un message manuel (phone + message) |
| POST | `/webhook/orders/create` | Webhook Shopify nouvelle commande |
| GET | `/api/templates` | Récupère tous les templates (FR + ES) |
| PUT | `/api/templates` | Sauvegarde les templates modifiés |
| POST | `/api/templates/reset` | Remet les templates par défaut |

---

## ⚙️ Variables d'environnement (.env)

```env
SHOPIFY_STORE=ma-boutique.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SHOPIFY_WEBHOOK_SECRET=mon_secret_webhook
PORT=3000
REMINDER_DELAY_MINUTES=120
DEFAULT_COUNTRY_CODE=34
```

---

## 💬 Logique WhatsApp (Baileys)

### Différences vs whatsapp-web.js
| Ancien (whatsapp-web.js) | Nouveau (Baileys) |
|---|---|
| `@c.us` | `@s.whatsapp.net` |
| `client.sendMessage(to, text)` | `sock.sendMessage(jid, { text })` |
| `msg.reply(text)` | `sock.sendMessage(msg.key.remoteJid, { text })` |
| `client.on('message', ...)` | `sock.ev.on('messages.upsert', ...)` |
| Session dans `.wa_session/` | Session dans `.wa_session_baileys/` |
| Puppeteer/Chromium | WebSocket direct |

### Mots-clés reconnus (réponse client)
- **OUI** → `OUI, YES, SI, SÍ, OK, 1, Y` → commande confirmée
- **NON** → `NON, NO, N, 0, ANNULER, CANCEL` → commande annulée
- **Autre** → le bot redemande (dans la langue du client)

### Reconnexion automatique
- Jusqu'à **5 tentatives** espacées de 5s
- Si session invalidée (loggedOut) → supprimer `.wa_session_baileys/` et relancer

### Statuts d'une commande
```
pending → sent → confirmed
                → cancelled
         → reminded → confirmed
                    → cancelled
         → failed
```

### Format numéro de téléphone
- Les `+` et espaces sont supprimés
- Si commence par `0` → remplacé par `DEFAULT_COUNTRY_CODE`
- Matching flexible : `a === b || a.endsWith(b) || b.endsWith(a)`

---

## 🌍 Système multilingue

### Détection automatique de langue (par ordre de priorité)
1. **Locale Shopify** (`customer_locale`) — ex: `fr-FR`, `es-ES`
2. **Préfixe téléphonique** — `+33`/`0033` → FR · `+34`/`0034` → ES
3. **Pays de livraison** — FR, BE, CH, LU, MC → FR · ES → ES
4. **Défaut** → Espagnol

### Templates disponibles par langue
| Clé | Déclencheur |
|---|---|
| `confirmation` | Envoi initial à la réception de commande |
| `reminder` | Relance après `REMINDER_DELAY_MINUTES` sans réponse |
| `confirmed` | Quand le client répond OUI |
| `cancelled` | Quand le client répond NON |
| `unknown` | Si le client répond autre chose |

### Variables disponibles dans les templates
| Variable | Valeur |
|---|---|
| `{name}` | Prénom + nom du client |
| `{orderNumber}` | Numéro de commande Shopify |
| `{shop}` | Nom de la boutique |
| `{items}` | Liste des produits |
| `{total}` | Montant total |
| `{address}` | Adresse de livraison |

---

## 🔄 Flux automatique

```
Commande Shopify créée
    ↓ webhook POST /webhook/orders/create
Vérification HMAC Shopify
    ↓
Extraction : nom, téléphone, produits, total, adresse
    ↓
Détection langue (locale → téléphone → pays → défaut ES)
    ↓
addOrder() → store en mémoire
    ↓
sendConfirmation() → sock.sendMessage(jid, { text }) en Baileys
    ↓ (après REMINDER_DELAY_MINUTES sans réponse)
Relance automatique (même langue)
    ↓ (réponse client reçue via messages.upsert)
updateOrderStatus() + updateShopifyOrder() ou cancelShopifyOrder()
```

---

## 📊 Dashboard — Sections

| Section | Icône | Contenu |
|---|---|---|
| Dashboard | ◈ | Métriques du jour + flux automatisé + activité récente |
| Statistiques | ◑ | Chiffres clés, barre répartition, cercle taux réponse, liste sans réponse |
| Commandes | ▦ | Toutes les commandes avec statut |
| Conversations | ◎ | Historique messages + envoi manuel |
| Templates WA | ▤ | Éditeur messages par langue (FR/ES) avec sauvegarde JSON |
| Configuration | ⊡ | Shopify, WhatsApp, automatisations |

---

## 🐛 Bugs réglés

- **Réponse client non détectée** : matching numéro trop strict → comparaison flexible `endsWith`
- **QR code non affiché** : dashboard utilisait `s.state` mais l'API retourne `s.status`
- **Dépendance circulaire** : `shopify.js` importait `whatsapp.js` au niveau module → lazy import
- **Cache npm corrompu** : fichiers root dans `~/.npm` → `npm install --cache /tmp/npm-cache`
- **WhatsApp bloquait le scan** : `whatsapp-web.js` + Puppeteer détecté → migré vers Baileys WebSocket

---

## 🚀 Lancer le projet

```bash
# Terminal 1 — serveur
cd ~/Desktop/shopnotify
npm start

# Terminal 2 — tunnel public (pour webhook Shopify)
ngrok http 3000
```

Dashboard : http://localhost:3000
URL webhook Shopify : `https://XXXX.ngrok-free.app/webhook/orders/create`

**⚠️ ngrok gratuit = nouvelle URL à chaque redémarrage** → mettre à jour le webhook Shopify.

### Si session WhatsApp invalide
```bash
rm -rf .wa_session_baileys/
npm start
```

---

## 📋 Fonctionnalités en place

- [x] Connexion WhatsApp par QR code (Baileys WebSocket)
- [x] Reconnexion automatique (5 tentatives)
- [x] Réception webhooks Shopify
- [x] Détection automatique de langue (locale → téléphone → pays)
- [x] Envoi message de confirmation dans la bonne langue
- [x] Détection réponse OUI/NON multilingue
- [x] Mise à jour Shopify (tag + annulation)
- [x] Relance automatique après 2h (même langue)
- [x] Dashboard web complet
- [x] Envoi manuel depuis le dashboard
- [x] Éditeur de messages par langue (FR/ES) avec sauvegarde JSON
- [x] Section Statistiques (taux réponse, répartition, commandes sans réponse)

## 📋 Fonctionnalités à ajouter

- [ ] Base de données persistante (SQLite ou PostgreSQL)
- [ ] Hébergement permanent (Railway ou Render)
- [ ] Support d'autres langues (EN, AR, etc.)
- [ ] Historique des conversations complet
- [ ] Notifications push si échec d'envoi
- [ ] Export CSV des commandes

---

## 💡 Comment ajouter une fonctionnalité (workflow)

1. Copier ce fichier dans une nouvelle discussion Claude
2. Décrire la fonctionnalité souhaitée
3. Claude génère le code
4. Remplacer le(s) fichier(s) dans `src/` ou `public/`
5. Redémarrer : `Ctrl+C` puis `npm start`

---

## 📦 Dépendances

```json
{
  "@whiskeysockets/baileys": "latest",
  "axios": "^1.6.0",
  "body-parser": "^1.20.2",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1",
  "express": "^4.18.2",
  "pino": "latest",
  "qrcode": "^1.5.3"
}
```
