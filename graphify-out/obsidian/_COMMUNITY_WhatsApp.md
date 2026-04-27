# WhatsApp Messaging Community

**Nodes:** 6 (Baileys client, connection, messaging, confirmation, reminders, phone fmt)  
**File:** src/whatsapp.js  
**Purpose:** Real-time two-way WhatsApp messaging

## Architecture

```
Baileys Socket (makeWASocket)
  ├─ Connection Manager
  │   ├─ QR code generation (first scan)
  │   ├─ Reconnection logic (5 retries)
  │   └─ Session persistence (.wa_session_baileys/)
  │
  ├─ Event Handlers
  │   ├─ creds.update → Save auth state
  │   ├─ connection.update → Track QR/connected/disconnected
  │   └─ messages.upsert → handleIncomingMessage()
  │
  ├─ Message Sending
  │   ├─ sendConfirmation(orderId) → Confirmation + reminder schedule
  │   ├─ sendManualMessage(phone, message) → Custom message
  │   └─ sendMessage(jid, { text: ... }) → Raw Baileys send
  │
  └─ Reminder Scheduler
      └─ setTimeout() → Check status → Re-send if still pending
```

## Phone → JID Format

Baileys requires JID (Jabber ID) format:
```javascript
// Input: "+33 6 12 34 56 78" or "0612345678"
const jid = formatPhone(phone) + "@s.whatsapp.net";
// Output: "33612345678@s.whatsapp.net"

function formatPhone(phone) {
  let p = phone.replace(/\D/g, ''); // Strip non-digits
  if (p.startsWith('0')) {
    const countryCode = process.env.DEFAULT_COUNTRY_CODE || '34';
    p = countryCode + p.slice(1); // "0612345678" → "33612345678"
  }
  return p;
}
```

## Message Flow (Incoming)

```
Customer texts bot on WhatsApp
  ↓
Baileys receives (messages.upsert event)
  ↓
[handleIncomingMessage]
  ├─ Extract text (conversation, textMessage, caption, etc.)
  ├─ Strip non-digits from sender phone
  ├─ Find matching order in DB (flexible phone match)
  ├─ Validate order status (sent or reminded only)
  ├─ Parse intent
  │   ├─ OUI/YES/SI/SÍ/OK/1/Y → confirmed
  │   └─ NON/NO/N/0/ANNULER/CANCEL → cancelled
  ├─ Update DB status
  ├─ Render response template (lang-aware)
  └─ Send reply via sendMessage()
```

## Confirmation Flow

```
New order created by Shopify
  ↓
[sendConfirmation(orderId)]
  ├─ Fetch order from DB
  ├─ Render template (confirmation message)
  ├─ Format phone → JID
  ├─ Send via Baileys (sock.sendMessage)
  ├─ Update status: pending → sent
  ├─ Schedule reminder
  │   └─ setTimeout(REMINDER_DELAY_MINUTES * 60 * 1000)
  │       └─ [Reminder trigger at delay time]
  │           ├─ Re-fetch order
  │           ├─ Check status still 'sent'
  │           ├─ Render reminder message
  │           └─ Send + update status: sent → reminded
  └─ Return { sent: true, phone }
```

## Session Persistence

```
.wa_session_baileys/
  ├─ creds.json                      -- Auth credentials
  ├─ app-state-sync-key-*.json       -- Sync keys
  ├─ device-list-*.json              -- Device list
  ├─ lid-mapping-*.json              -- ID mapping
  └─ app-state-sync-version-*.json   -- Version tracking
```

On Railway, mount volume at `/app/.wa_session_baileys` so it persists across restarts.

## Connection States

```
qr → Display QR code for first scan
open → Connected (myNumber set, isReady = true)
close → Disconnected
  └─ If loggedOut (user logged out on phone): exit
  └─ Else: retry up to 5 times, 5s delay between retries
```

## Related Nodes

- [[Baileys Library]] (@whiskeysockets/baileys)
- [[Order Confirmation Sender]] (sendConfirmation)
- [[Message Sending & Receiving]] (handleIncomingMessage)
- [[Automated Reminder Scheduler]] (scheduleReminder)

