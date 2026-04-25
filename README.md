# ShopNotify ⚡
### Shopify → WhatsApp order confirmation bot

Chaque nouvelle commande Shopify déclenche automatiquement un message WhatsApp.  
Le client répond OUI/NON, et Shopify est mis à jour en temps réel.

---

## 🚀 Installation (5 minutes)

### 1. Prérequis
- Node.js 18+ installé
- Un compte Shopify avec accès admin
- Ton numéro WhatsApp principal (ou un numéro dédié)

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configurer l'environnement
```bash
cp .env.example .env
```

Edite `.env` avec tes valeurs :

| Variable | Comment l'obtenir |
|---|---|
| `SHOPIFY_STORE` | URL de ta boutique ex: `ma-boutique.myshopify.com` |
| `SHOPIFY_ACCESS_TOKEN` | Admin Shopify → Apps → "Développer des apps" → Créer une app → Permissions API admin → `read_orders, write_orders` |
| `SHOPIFY_WEBHOOK_SECRET` | Généré dans l'étape webhook ci-dessous |

### 4. Démarrer le serveur
```bash
npm start
```

Ouvre **http://localhost:3000** dans ton navigateur.

### 5. Scanner le QR Code
- Ouvre WhatsApp sur ton téléphone
- Appareils liés → Lier un appareil
- Scanne le QR affiché sur le dashboard

### 6. Configurer le webhook Shopify
Dans ton admin Shopify :

1. **Paramètres** → **Notifications** → **Webhooks**
2. Cliquer **"Créer un webhook"**
3. Remplir :
   - Événement : `Création de commande`
   - Format : `JSON`
   - URL : `https://TON-DOMAINE.com/webhook/orders/create`
4. Copier le **Secret de signature** → coller dans `.env` → `SHOPIFY_WEBHOOK_SECRET`

> 💡 **Pour les tests en local**, utilise [ngrok](https://ngrok.com) :
> ```bash
> ngrok http 3000
> ```
> Utilise l'URL ngrok `https://xxxx.ngrok.io` comme URL webhook.

---

## 💬 Flux automatique

```
Commande Shopify
      ↓
  Webhook reçu
      ↓
  WhatsApp envoyé au client
      ↓
  Client répond OUI → Commande taguée "confirmée" sur Shopify ✅
  Client répond NON → Commande annulée sur Shopify ❌
  Pas de réponse   → Relance automatique après 2h 🔔
```

## 📝 Mots-clés reconnus

| Réponse client | Action |
|---|---|
| OUI, YES, SI, OK, 1, Y | Commande confirmée |
| NON, NO, N, 0, ANNULER, CANCEL | Commande annulée |
| Autre | Le bot redemande OUI ou NON |

---

## 🔧 Pour la production

- Héberge sur **Railway** ou **Render** (gratuit pour commencer)
- Remplace le store en mémoire (`src/store.js`) par **SQLite** ou **PostgreSQL**
- Ajoute un certificat SSL (géré automatiquement par Railway/Render)

---

## ⚠️ Notes importantes

- `whatsapp-web.js` utilise WhatsApp Web (non officiel). Utilise un numéro dédié pour éviter tout risque de bannissement.
- La session WhatsApp est sauvegardée dans `.wa_session/` — pas besoin de rescanner à chaque redémarrage.
- Les données des commandes sont en mémoire : elles sont perdues au redémarrage (migre vers une DB pour la production).
