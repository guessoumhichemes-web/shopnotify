# Message Templates Community

**Nodes:** 4 (System, French templates, Spanish templates, language detector)  
**File:** src/templates.js  
**Purpose:** Multi-language message rendering + language detection

## Template Types

| Type | Usage | Variables |
|------|-------|-----------|
| `confirmation` | Sent when order received | {name}, {items}, {total}, {address}, {orderNumber}, {shop} |
| `reminder` | Sent 2 hours later if no response | {name}, {orderNumber} |
| `confirmed` | Sent when customer confirms | {name}, {orderNumber} |
| `cancelled` | Sent when customer cancels | {orderNumber} |
| `unknown` | Sent when response not recognized | none (or all) |

## French Templates (Example)

```markdown
confirmation: |
  🛍️ Bonjour {name} !
  
  Merci pour votre commande *#{orderNumber}* sur {shop}.
  
  📦 *Produits :*
  {items}
  
  💰 *Total :* {total}
  📍 *Livraison :* {address}
  
  Pouvez-vous confirmer votre commande en répondant *OUI* ou l'annuler en répondant *NON* ?

reminder: |
  ⏰ Rappel — Commande *#{orderNumber}*
  
  Nous n'avons pas encore reçu votre confirmation.
  Répondez *OUI* pour confirmer ou *NON* pour annuler.

... (confirmed, cancelled, unknown)
```

## Spanish Templates (Parallel Structure)

Same message types, Spanish language. Defaults loaded from `DEFAULT_TEMPLATES` constant in code.

## Language Detection Strategy

**Multi-source cascade:**

1. `order.customer_locale` or `order.locale` field
   - Value starts with 'fr' → French
   - Value starts with 'es' → Spanish

2. Phone number prefix
   - +33 or 0033 → French
   - +34 or 0034 → Spanish

3. Shipping/billing country code
   - FR, BE, CH, LU, MC → French (France + neighbors)
   - ES → Spanish

4. Fallback: Spanish (edit DEFAULT_COUNTRY_CODE env var to change)

## Template Loading & Persistence

```javascript
loadTemplates():
  1. Check if templates.json exists locally
  2. If yes: parse JSON, merge with defaults (fill in missing keys)
  3. If no: return DEFAULT_TEMPLATES
  
saveTemplates(customTemplates):
  1. Write customTemplates to templates.json
  
getMessage(type, lang, vars):
  1. Load templates
  2. Get langTemplates[type] or fallback to DEFAULT_TEMPLATES[lang][type]
  3. renderTemplate(template, vars)
```

## Template Rendering

```javascript
function renderTemplate(template, vars) {
  return template
    .replace(/{name}/g, vars.name || '')
    .replace(/{orderNumber}/g, vars.orderNumber || '')
    .replace(/{shop}/g, vars.shop || '')
    .replace(/{items}/g, vars.items || '')
    .replace(/{total}/g, vars.total || '')
    .replace(/{address}/g, vars.address || '');
}
```

Simple string replacement. No escaping (WhatsApp markdown uses `*bold*` which is literal).

## Editing Templates

### Via API

```bash
# Fetch current
GET /api/templates → { fr: {...}, es: {...} }

# Update custom
PUT /api/templates → body: { fr: {...}, es: {...} }

# Reset to defaults
POST /api/templates/reset
```

### Manually

Edit `templates.json` in project root:
```json
{
  "fr": {
    "confirmation": "Custom French template..."
  },
  "es": {
    "confirmation": "Custom Spanish template..."
  }
}
```

## Formatting Tricks

**WhatsApp Markdown:**
- `*bold*`
- `_italic_`
- `~strikethrough~`
- ``` code blocks ```

**Line breaks:** Literal `\n` in JSON (no escape needed in multi-line strings)

**Emoji:** Direct Unicode (✅, ❌, 📦, etc.)

## Related Nodes

- [[Language Detection Engine]] (detectLanguage)
- [[French Message Templates]] (DEFAULT_TEMPLATES.fr)
- [[Spanish Message Templates]] (DEFAULT_TEMPLATES.es)
- [[Order Confirmation Sender]] (uses getMessage)
- [[Templates Management API]] (/api/templates)

