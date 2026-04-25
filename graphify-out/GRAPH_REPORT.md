# Graph Report - .  (2026-04-25)

## Corpus Check
- Corpus is ~7,328 words - fits in a single context window. You may not need a graph.

## Summary
- 62 nodes · 80 edges · 9 communities detected
- Extraction: 72% EXTRACTED · 28% INFERRED · 0% AMBIGUOUS · INFERRED: 22 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_API GET apiorders|API: GET /api/orders]]
- [[_COMMUNITY_API GETPUT apitemplates|API: GET/PUT /api/templates]]
- [[_COMMUNITY_addOrder()|addOrder()]]
- [[_COMMUNITY_formatPhone()|formatPhone()]]
- [[_COMMUNITY_Order Status State Machine|Order Status State Machine]]
- [[_COMMUNITY_API GET apiwhatsappstatus|API: GET /api/whatsapp/status]]
- [[_COMMUNITY_getMessage()|getMessage()]]
- [[_COMMUNITY_formatAddress()|formatAddress()]]
- [[_COMMUNITY_ShopNotify README|ShopNotify README]]

## God Nodes (most connected - your core abstractions)
1. `src/index.js - Express Server & Routes` - 12 edges
2. `sendConfirmation()` - 8 edges
3. `src/whatsapp.js - WhatsApp Baileys Client` - 8 edges
4. `handleShopifyWebhook()` - 6 edges
5. `src/shopify.js - Shopify Webhook Handler` - 6 edges
6. `getMessage()` - 5 edges
7. `handleIncomingMessage()` - 4 edges
8. `@whiskeysockets/baileys WhatsApp Client` - 4 edges
9. `updateOrderStatus()` - 3 edges
10. `formatPhone()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `addOrder()` --calls--> `handleShopifyWebhook()`  [INFERRED]
  /Users/hichem/Desktop/shopnotify/src/store.js → /Users/hichem/Desktop/shopnotify/src/shopify.js
- `getOrder()` --calls--> `sendConfirmation()`  [INFERRED]
  /Users/hichem/Desktop/shopnotify/src/store.js → /Users/hichem/Desktop/shopnotify/src/whatsapp.js
- `src/index.js - Express Server & Routes` --implements--> `API: GET /api/whatsapp/status`  [INFERRED]
  /Users/hichem/Desktop/shopnotify/ShopNotify.md → /Users/hichem/Desktop/shopnotify/public/index.html
- `src/index.js - Express Server & Routes` --implements--> `API: GET/PUT /api/templates`  [INFERRED]
  /Users/hichem/Desktop/shopnotify/ShopNotify.md → /Users/hichem/Desktop/shopnotify/public/index.html
- `updateOrderStatus()` --calls--> `sendConfirmation()`  [INFERRED]
  /Users/hichem/Desktop/shopnotify/src/store.js → /Users/hichem/Desktop/shopnotify/src/whatsapp.js
- `handleShopifyWebhook()` --calls--> `sendConfirmation()`  [INFERRED]
  /Users/hichem/Desktop/shopnotify/src/shopify.js → /Users/hichem/Desktop/shopnotify/src/whatsapp.js
- `handleIncomingMessage()` --calls--> `getMessage()`  [INFERRED]
  /Users/hichem/Desktop/shopnotify/src/whatsapp.js → /Users/hichem/Desktop/shopnotify/src/templates.js
- `sendConfirmation()` --calls--> `detectLanguage()`  [INFERRED]
  /Users/hichem/Desktop/shopnotify/src/whatsapp.js → /Users/hichem/Desktop/shopnotify/src/templates.js
- `sendConfirmation()` --calls--> `getMessage()`  [INFERRED]
  /Users/hichem/Desktop/shopnotify/src/whatsapp.js → /Users/hichem/Desktop/shopnotify/src/templates.js
- `src/index.js - Express Server & Routes` --implements--> `API: GET /api/orders`  [INFERRED]
  /Users/hichem/Desktop/shopnotify/ShopNotify.md → /Users/hichem/Desktop/shopnotify/public/index.html

## Hyperedges (group relationships)
- **Full Order Confirmation Flow** — shopnotifymd_shopify_webhook, shopnotifymd_src_whatsappjs, shopnotifymd_order_status_flow, shopnotifymd_inmemory_store, shopnotifymd_language_detection [EXTRACTED 1.00]
- **Multilingual WhatsApp Messaging System** — shopnotifymd_language_detection, shopnotifymd_templates_system, shopnotifymd_src_whatsappjs, shopnotifymd_src_templatesjs [EXTRACTED 1.00]
- **Real-Time Dashboard Data Pipeline** — indexhtml_loaddata, indexhtml_pollwa, indexhtml_api_orders, indexhtml_api_stats, indexhtml_api_whatsapp_status [EXTRACTED 1.00]

## Communities

### Community 0 - "API: GET /api/orders"
Cohesion: 0.7
Nodes (11): API: GET /api/orders, API: POST /api/send/:orderId, API: GET /api/stats, ShopNotify Web Dashboard, loadData() - Orders & Stats Loader (10s interval), dotenv Environment Variables, Express HTTP Server, In-Memory Order Store (+3 more)

### Community 1 - "API: GET/PUT /api/templates"
Cohesion: 0.7
Nodes (10): API: GET/PUT /api/templates, Template Editor UI (FR/ES), axios HTTP Client, Bug Fix: Circular Dependency shopify.js/whatsapp.js, HMAC Webhook Signature Verification, Multilingual Auto-Detection (FR/ES), Shopify Webhook Integration, src/shopify.js - Shopify Webhook Handler (+2 more)

### Community 2 - "addOrder()"
Cohesion: 0.7
Nodes (5): addOrder(), getOrder(), getOrders(), updateOrderStatus(), handleIncomingMessage()

### Community 3 - "formatPhone()"
Cohesion: 0.7
Nodes (4): formatPhone(), scheduleReminder(), sendConfirmation(), sendManualMessage()

### Community 4 - "Order Status State Machine"
Cohesion: 0.7
Nodes (6): Order Status State Machine, Flexible Phone Number Matching (endsWith), pino Logger, qrcode Library, Automatic Reminder After 2h, src/whatsapp.js - WhatsApp Baileys Client

### Community 5 - "API: GET /api/whatsapp/status"
Cohesion: 0.7
Nodes (6): API: GET /api/whatsapp/status, pollWA() - WhatsApp Status Polling (3s interval), QR Code Scan Overlay UI, @whiskeysockets/baileys WhatsApp Client, Rationale: Migrate to Baileys over whatsapp-web.js, whatsapp-web.js (Replaced Library)

### Community 6 - "getMessage()"
Cohesion: 0.7
Nodes (3): getMessage(), loadTemplates(), renderTemplate()

### Community 7 - "formatAddress()"
Cohesion: 0.7
Nodes (4): formatAddress(), handleShopifyWebhook(), verifyWebhook(), detectLanguage()

### Community 8 - "ShopNotify README"
Cohesion: 0.7
Nodes (3): ShopNotify README, ngrok Tunnel for Local Webhooks, ShopNotify Technical Doc

## Knowledge Gaps
- **11 isolated node(s):** `Express HTTP Server`, `Shopify Webhook Integration`, `HMAC Webhook Signature Verification`, `Order Status State Machine`, `Automatic Reminder After 2h` (+6 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `src/index.js - Express Server & Routes` connect `API: GET /api/orders` to `API: GET/PUT /api/templates`, `Order Status State Machine`, `API: GET /api/whatsapp/status`?**
  _High betweenness centrality (0.201) - this node is a cross-community bridge._
- **Why does `src/whatsapp.js - WhatsApp Baileys Client` connect `Order Status State Machine` to `API: GET /api/orders`, `API: GET/PUT /api/templates`, `API: GET /api/whatsapp/status`?**
  _High betweenness centrality (0.125) - this node is a cross-community bridge._
- **Why does `sendConfirmation()` connect `formatPhone()` to `addOrder()`, `getMessage()`, `formatAddress()`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `src/index.js - Express Server & Routes` (e.g. with `API: GET /api/orders` and `API: GET /api/stats`) actually correct?**
  _`src/index.js - Express Server & Routes` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `sendConfirmation()` (e.g. with `getOrder()` and `updateOrderStatus()`) actually correct?**
  _`sendConfirmation()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `handleShopifyWebhook()` (e.g. with `addOrder()` and `detectLanguage()`) actually correct?**
  _`handleShopifyWebhook()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Express HTTP Server`, `Shopify Webhook Integration`, `HMAC Webhook Signature Verification` to the rest of the system?**
  _11 weakly-connected nodes found - possible documentation gaps or missing edges._