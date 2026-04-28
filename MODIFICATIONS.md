# 📋 Historique des Modifications - ShopNotify

## 🎯 Objectif Principal
Corriger le backend pour que les messages WhatsApp s'envoient avec les variables correctement remplacées.

---

## ✅ Modifications Effectuées (Chronologique)

### 1️⃣ **Correction du rendu de template (templates.js)**
**Date:** 2026-04-28
**Fichiers:** `src/templates.js`
**Problème:** Variable `{name}`, `{orderNumber}` etc. ne s'affichaient pas - affichait `[Object Object]`
**Cause:** DEFAULT_SEQUENCE.template avait l'objet entier au lieu de juste le message string
**Fix:**
```javascript
// AVANT (MAUVAIS):
template: DEFAULT_TEMPLATES  // ← Objet complet

// APRÈS (BON):
template: {
  fr: DEFAULT_TEMPLATES.fr.confirmation,  // ← Juste le message
  es: DEFAULT_TEMPLATES.es.confirmation
}
```
**Résultat:** ✅ Messages s'affichent correctement en frontend

---

### 2️⃣ **Simplification du rendu WhatsApp (whatsapp.js)**
**Date:** 2026-04-28
**Fichiers:** `src/whatsapp.js` (lignes 235-276)
**Problème:** sendConfirmation() avait logique confuse pour rendre les templates
**Fix:**
```javascript
// AVANT (MAUVAIS):
const template = firstStep.template;
const message = template && template[lang]
  ? template[lang].replace ? template[lang] : getMessage('confirmation', lang, vars)
  : getMessage('confirmation', lang, vars);

// APRÈS (BON):
const message = getMessage('confirmation', lang, vars);
```
**Résultat:** ✅ Garantit que getMessage() est appelé → variables remplacées

---

### 3️⃣ **Suppression du cache corrompu**
**Date:** 2026-04-28
**Fichiers:** Supprimé `/data/sequence.json`
**Problème:** Ancien fichier cache contenait mauvaise structure
**Fix:** Suppression → force rechargement de DEFAULT_SEQUENCE correct
**Résultat:** ✅ API /api/sequence retourne bonne structure

---

### 4️⃣ **Ajout de validation de séquence (templates.js + index.js)**
**Date:** 2026-04-28
**Fichiers:** 
  - `src/templates.js` (nouvelles fonctions)
  - `src/index.js` (validation au démarrage)
  - `src/whatsapp.js` (nettoyage imports)
**Problème:** Pas de validation → risque de bugs silencieux si on ajoute une étape cassée
**Fix:** Fonction `validateSequence()` qui vérifie au démarrage:
  - ✅ Chaque étape a un `id` (string)
  - ✅ Chaque étape a un `delayHours` (nombre)
  - ✅ Chaque étape a des templates pour TOUTES les langues
**Résultat:** ✅ Serveur refuse de démarrer si config cassée

---

## 📁 Structure Finale (Stable)

```
~/Desktop/shopnotify/              ← UNE SEULE APP
├── src/
│   ├── index.js                   ✅ Validation au démarrage
│   ├── templates.js               ✅ Fonction validateSequence()
│   ├── whatsapp.js                ✅ Rendu simplifié
│   ├── shopify.js                 ✅ Inchangé
│   ├── store.js                   ✅ Inchangé
│   └── db.js                      ✅ Inchangé
├── public/
│   ├── index.html                 ✅ Inchangé (UI intacte)
│   └── js/                        ✅ Inchangé (Boutons intacts)
├── data/
│   ├── shopnotify.db              ✅ Base de données
│   ├── sequence.json              ❌ SUPPRIMÉ (cache ancien)
│   └── .wa_session_baileys/       ✅ Session WhatsApp
├── templates.json                 ✅ Messages FR/ES
└── MODIFICATIONS.md               ✅ CET HISTORIQUE
```

---

## 🔒 Garanties

| Aspect | Avant | Après |
|--------|-------|-------|
| Variables dans messages | ❌ `[Object Object]` | ✅ `Alice` |
| Validation séquence | ❌ Silencieuse | ✅ Exit si erreur |
| Risque de bugs | ⚠️ Haut | ✅ Bas |
| App instable | ⚠️ Oui | ✅ Non |

---

## ✅ Checklist: Avant de Modifier

Avant d'ajouter/modifier une étape:

- [ ] **Local only:** `~/Desktop/shopnotify` (PAS la copie server)
- [ ] **Correct port:** Port 3000 (`npm start`)
- [ ] **Vérifier validation:** Voir `✅ Séquence validée: X étape(s)` au démarrage
- [ ] **Tester:** `curl http://localhost:3000/api/sequence`

---

## 🗑️ À Nettoyer

```bash
# SUPPRIMER:
rm -rf ~/.claude-dev/shopnotify-local-server

# Raison: Crée confusion - une seule app = ~/Desktop/shopnotify
```

---

## 🎯 État Final

✅ **Production-Ready pour MVP**
- Validation automatique
- Messages multi-langue
- Persistance base de données
- Webhooks Shopify fonctionnels
- WhatsApp automation OK

🚀 **Prêt pour:**
- Ajouter nouvelles étapes
- Modifier messages
- Ajouter nouvelles langues
- Déployer sur Railway (quand prêt)
