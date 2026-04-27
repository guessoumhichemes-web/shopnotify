# Critical Flows

High-level scenarios that cross community boundaries.

## Flow 1: Order Receipt → Confirmation

**Trigger:** Shopify order created  
**Duration:** Synchronous (< 5s)

```
Shopify
  ↓ (webhook POST)
Express Server (/webhook/orders/create)
  ↓
Shopify Webhook Handler
  ├─ Verify HMAC signature
  ├─ Parse order JSON
  ├─ detectLanguage() [from Templates]
  ├─ formatAddress()
  └─ addOrder() [Store API → SQLite]
      ↓
      [Async] Order Confirmation Sender
          ├─ Fetch from DB
          ├─ Render template [Templates]
          ├─ Format phone [Phone Utils]
          ├─ Send via Baileys [WhatsApp Client]
          ├─ Update status: pending → sent
          └─ Schedule reminder (setTimeout)

Response to Shopify: 200 OK (before WA send completes)
```

**Key:** Shopify webhook returns 200 immediately. WhatsApp send is async/fire-and-forget.

## Flow 2: Customer Response → Update

**Trigger:** Customer texts bot  
**Duration:** Real-time (message arrives, processed in ~1-2s)

```
Customer (WhatsApp)
  ↓ (sends message)
Baileys Socket (receives via messages.upsert event)
  ↓
handleIncomingMessage()
  ├─ Extract text + sender phone
  ├─ Find order [Store API → getOrders() + flexible match]
  ├─ Validate status is sent/reminded
  ├─ Parse intent (OUI/NON)
  ├─ Update status: sent → confirmed/cancelled [Store API → updateOrder]
  ├─ Render response [Templates + Language]
  └─ Send reply [Baileys Client]

Order now marked confirmed/cancelled in DB
Dashboard updates on next /api/orders fetch
```

**Key:** Matching by flexible phone number. Order status validated before accepting response.

## Flow 3: Automatic Reminder

**Trigger:** 2 hours after confirmation sent  
**Duration:** Fire once, no user input

```
[2 hours pass]
  ↓
setTimeout callback fires (scheduleReminder)
  ├─ Re-fetch order [Store API → getOrderById]
  ├─ Check status is still 'sent' [not confirmed/cancelled]
  ├─ Render reminder [Templates]
  ├─ Send via Baileys
  └─ Update status: sent → reminded

Dashboard shows order moved to reminded status
```

**Key:** Respects order state — only sends if still waiting for response. If customer already responded, reminder is skipped.

## Flow 4: Manual Resend

**Trigger:** User clicks "Send" on dashboard  
**Duration:** Synchronous (< 2s)

```
User clicks "Send Message" button
  ↓
POST /api/send/:orderId
  ↓
Express Handler
  └─ sendConfirmation(orderId) [WhatsApp]
      ├─ Fetch order
      ├─ Check WhatsApp connected (isReady)
      └─ Send + update status
          
Returns { success: true, result: { sent: true, phone } }
Dashboard shows notification
```

**Key:** Can resend even if status is not 'pending'. Useful for recovery from WhatsApp errors.

## Flow 5: Custom Message (From Dashboard)

**Trigger:** User types message in "Conversations" tab, sends to phone  
**Duration:** Synchronous

```
User inputs phone + message in dashboard
  ↓
POST /api/message { phone, message }
  ↓
Express Handler
  └─ sendManualMessage(phone, message) [WhatsApp]
      ├─ Format phone → JID
      ├─ Check WhatsApp connected
      └─ Send
          
Returns { success: true, result: { sent: true, phone } }
```

**Key:** No order lookup. Sends to any phone number. Useful for broadcast or support replies.

---

## State Machine Diagram

```
┌─────────────┐
│   pending   │ (order received from Shopify)
└──────┬──────┘
       │ [Send WhatsApp]
       ↓
┌─────────────┐
│    sent     │ (waiting for response)
└──────┬──────┘
       │ [Customer responds OUI]  [2 hours pass]
       ├──→ confirmed            ├──→ reminded
       │                         │
       │ [Customer responds NON] │ [2 hours + customer responds]
       └──→ cancelled            └──→ confirmed/cancelled
```

**Valid transitions:**
- pending → sent (only)
- sent → confirmed, cancelled, reminded
- reminded → confirmed, cancelled
- confirmed, cancelled → (terminal)

**Invalid (rejected):**
- pending → confirmed (skip sent)
- confirmed → sent (reopen)

---

## Related Nodes

- [[Shopify Webhook Handler]] (initiates flow 1)
- [[WhatsApp Baileys Client]] (executes flows 1-5)
- [[Order Confirmation Sender]] (flow 1 + 4)
- [[Message Sending & Receiving]] (flow 2)
- [[Automated Reminder Scheduler]] (flow 3)
- [[Store API Wrapper]] (all flows need DB lookups)
- [[Template System]] (all flows need message rendering)

