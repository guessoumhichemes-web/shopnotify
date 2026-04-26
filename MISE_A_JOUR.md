# ShopNotify - Mise à Jour Complète 📊

## ✅ Terminé

### Phase 1: Persistance SQLite
- ✅ Créé `src/db.js` - Wrapper SQLite complet (CRUD orders, stats)
- ✅ Modifié `src/store.js` - Remplacé Map en mémoire par SQLite
- ✅ Modifié `src/index.js` - Initialisation DB au démarrage
- ✅ Créé `.gitignore` - Exclusion shopnotify.db, .env, node_modules

### Phase 2: Infrastructure Railway
- ✅ Repository GitHub créé (`shopnotify`)
- ✅ Déployé sur Railway (projet active)
- ✅ Auto-CI/CD configuré (git push → auto-deploy)
- ✅ Domaine public: `https://shopnotify-production.up.railway.app`

### Phase 3: Intégration Shopify
- ✅ App Shopify créée (`ShopNotify`)
- ✅ Scopes configurés (`read_orders`, `write_orders`)
- ✅ App installée dans la boutique
- ✅ Webhook secret obtenu: `[WEBHOOK_SECRET - voir Partner Dashboard]`

---

## 🚨 À FAIRE - URGENT

### 1️⃣ Vérifier Railway (Service)
**Status:** Service n'est PAS actif (404 error)
- [ ] Ouvre https://railway.app
- [ ] Va dans le projet ShopNotify
- [ ] Vérifie le statut: Running / Failed / Stopped?
- [ ] Si Failed: vérifies les logs
- [ ] Si Stopped: réactive-le

### 2️⃣ Configurer Variables Environment Railway
**Quand:** Une fois le service actif

Variables à ajouter dans Railway Dashboard → Project → Variables:
```
SHOPIFY_WEBHOOK_SECRET=[voir dans le Partner Dashboard]
DEFAULT_COUNTRY_CODE=34
NODE_ENV=production
REMINDER_DELAY_MINUTES=120
PORT=3000
```

### 3️⃣ Configurer Webhook Shopify
**Quand:** Une fois Railway actif + variables configurées

Dans Shopify Admin:
- URL: `https://shopnotify-production.up.railway.app/webhook/orders/create`
- Topic: `orders/create`
- Secret: [utiliser le secret du Partner Dashboard]

### 4️⃣ Test End-to-End
**Quand:** Tout est configuré

Créer une commande test dans Shopify → vérifier que le message WhatsApp est envoyé

---

## 📁 Architecture Finalisée

```
shopnotify/
├── src/
│   ├── db.js              ← SQLite persistence (150 lignes)
│   ├── store.js           ← API wrapper DB (refactorisé)
│   ├── shopify.js         ← Webhook handler
│   ├── whatsapp.js        ← Baileys client
│   ├── templates.js       ← Message templates (multi-langue)
│   └── index.js           ← Express server + init DB
├── public/                ← UI dashboard (HTML/CSS/JS)
├── .env                   ← JAMAIS COMMITTED (local only)
├── .gitignore             ← Exclude .env, shopnotify.db
├── package.json           ← sql.js, Node >=20
└── shopnotify.db          ← SQLite file (persisted en Railway volume)
```

---

## 🔑 Identifiants

| Variable | Valeur |
|----------|--------|
| Store Domain | `zjcysn-33.myshopify.com` |
| Webhook Secret | Voir Partner Dashboard (Settings) |
| Country Code | `34` (Espagne) |
| Railway URL | `https://shopnotify-production.up.railway.app` |

---

## 📋 Prochaines Sessions

**Quand tu ouvres une nouvelle session et dis "Obsidian":**
```
/graphify
```
Ça regénère automatiquement le graphe de connaissance avec le code mis à jour.

**Pour activer le bot:**
```
1. Vérifier Railway
2. Ajouter les variables environment
3. Configurer le webhook Shopify
4. Tester avec une vraie commande
```

---

**Status Global:** 85% complété ✅ (Reste: Activer Railway + Variables + Webhook)
