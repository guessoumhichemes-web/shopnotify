# API Layer Community

**Nodes:** 8 (Express Server + 7 endpoints)  
**File:** src/index.js  
**Role:** All HTTP interfaces. Routes requests to handlers.

## Endpoints

| Route | Method | Handler | Purpose |
|-------|--------|---------|---------|
| `/` | GET | sendFile | Dashboard UI (public/index.html) |
| `/webhook/orders/create` | POST | handleShopifyWebhook | Receive new orders from Shopify |
| `/api/whatsapp/status` | GET | getStatus | WhatsApp connection status + QR code |
| `/api/orders` | GET | getPendingOrders | Fetch all orders (dashboard) |
| `/api/stats` | GET | getStats | Order counts & response rates |
| `/api/send/:orderId` | POST | sendConfirmation | Manually trigger WhatsApp send |
| `/api/message` | POST | sendManualMessage | Send custom message to phone |
| `/api/templates` | GET/PUT/POST | template ops | Load/save/reset message templates |

## Architecture

```
Express.listen(PORT)
  ├─ cors + static (public/)
  ├─ bodyParser (raw + JSON)
  └─ Routes
      ├─ GET /
      ├─ GET /api/whatsapp/status → whatsapp.getStatus()
      ├─ POST /webhook/orders/create → shopify.handleShopifyWebhook()
      ├─ GET /api/orders → store.getPendingOrders()
      ├─ GET /api/stats → store.getStats()
      ├─ POST /api/send/:orderId → whatsapp.sendConfirmation()
      ├─ POST /api/message → whatsapp.sendManualMessage()
      ├─ GET /api/templates → templates.loadTemplates()
      ├─ PUT /api/templates → templates.saveTemplates()
      └─ POST /api/templates/reset → templates.saveTemplates(DEFAULT_TEMPLATES)
```

## Initialization

```javascript
// Async IIFE at bottom of index.js
(async () => {
  await initDb();      // Load/create SQLite DB
  await initWhatsApp(); // Connect Baileys, display QR code
})();
```

Database initializes first, then WhatsApp. Both must succeed or process exits.

## Key Patterns

1. **Webhook Handling** - `bodyParser.raw()` for HMAC verification (Shopify sends raw buffer)
2. **CORS** - Enabled for dashboard AJAX from browser
3. **Static Files** - Serves public/index.html (dashboard UI)
4. **Error Handling** - Try/catch in sendConfirmation, returns 500 on WhatsApp errors

## Related Nodes

- [[Shopify Webhook Handler]] (destination of `/webhook/orders/create`)
- [[WhatsApp Baileys Client]] (`initWhatsApp()`)
- [[Store API Wrapper]] (used by `/api/orders`, `/api/stats`)
- [[Template System]] (used by `/api/templates/*`)

