# ShopNotify Knowledge Base

Your complete map of the ShopNotify codebase. Navigate by community or concept.

## Communities

- [[_COMMUNITY_API_Layer|API Layer]] — Express server + 7 endpoints
- [[_COMMUNITY_Persistence|Data Persistence]] — SQLite + CRUD
- [[_COMMUNITY_Shopify|Shopify Integration]] — Webhooks + order processing
- [[_COMMUNITY_WhatsApp|WhatsApp Messaging]] — Baileys client + handlers
- [[_COMMUNITY_Templates|Message Templates]] — Multi-language system
- [[_COMMUNITY_Flows|Critical Flows]] — End-to-end scenarios

## Quick Navigation

### Core Modules
- [[Express Server]] - Main HTTP server
- [[SQLite Persistence Layer]] - Database layer
- [[WhatsApp Baileys Client]] - Real-time messaging
- [[Template System]] - Message rendering

### Key Flows
- [[Shopify Webhook Handler]] → [[Order Confirmation Sender]] → Customer
- [[Message Sending & Receiving]] ← Customer response
- [[Automated Reminder Scheduler]] → 2-hour followup

### Cross-Cutting Concerns
- [[Phone Formatting]] (used in 4 places)
- [[Language Detection]] (Shopify, Templates, WhatsApp)
- [[Order Status Machine]] (pending → sent → confirmed/cancelled)

---

**Last updated:** 2026-04-26  
**Corpus:** 8 files, ~2,500 LOC  
**Total nodes:** 26 | Edges: 33 | Communities: 6
