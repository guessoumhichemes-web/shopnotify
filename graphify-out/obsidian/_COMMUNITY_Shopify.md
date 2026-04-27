# Shopify Integration Community

**Nodes:** 3 (Webhook handler, signature verification, order processing)  
**File:** src/shopify.js  
**Purpose:** Receive + validate + process new orders

## Webhook Flow

```
Shopify → POST /webhook/orders/create (HTTPS)
           ↓
[verifyWebhook()]
  ├─ Extract HMAC from header
  ├─ Compute SHA256(secret, body)
  ├─ Compare (timing-safe)
  └─ Return 401 if invalid
           ↓ (200 OK immediately)
[handleShopifyWebhook()]
  ├─ Parse JSON body
  ├─ Extract phone (billing | shipping | order)
  ├─ detectLanguage() → 'fr' or 'es'
  ├─ formatAddress()
  ├─ Build order object
  ├─ store.addOrder() → SQLite
  └─ whatsapp.sendConfirmation() (async, may fail)
```

## Order Object Constructed

```javascript
{
  id: "order_<shopify_id>",
  shopifyId: 123456,              // Order number (customer-facing)
  shopifyNumericId: 4567890123,   // Numeric ID for API
  customerName: "Jean Dupont",
  email: "jean@example.com",
  phone: "+33 6 12 34 56 78",     // Raw from Shopify
  total: "99.99",
  currency: "EUR",
  shippingAddress: "123 Rue de Rivoli, Paris, 75001, France",
  items: [
    { name: "Widget", quantity: 2, price: "49.99" }
  ],
  status: "pending",              // Will become "sent" if WA succeeds
  lang: "fr",                     // From detectLanguage()
  raw: {...},                     // Full Shopify webhook
  createdAt: "2026-04-26T..."
}
```

## Language Detection (in Shopify context)

1. `order.customer_locale` or `order.locale` (starts with 'fr' → French)
2. Phone prefix (+33/0033 → French, +34/0034 → Spanish)
3. `shipping_address.country_code` (FR → French, ES → Spanish)
4. Fallback: Spanish (configurable, matches store location)

## Signature Verification (HMAC-SHA256)

Shopify includes `X-Shopify-Hmac-SHA256` header. We verify:
```javascript
const hmac = req.headers['x-shopify-hmac-sha256'];
const hash = crypto.createHmac('sha256', SHOPIFY_WEBHOOK_SECRET)
  .update(req.body) // Must be raw Buffer, not parsed JSON
  .digest('base64');
crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(hash));
```

**Critical:** Must use `bodyParser.raw()` for webhook route, not `.json()`.

## Address Formatting

```javascript
function formatAddress(addr) {
  return [addr.address1, addr.city, addr.zip, addr.country]
    .filter(Boolean)
    .join(', ');
  // → "123 Rue de Rivoli, Paris, 75001, France"
}
```

Used in message template as `{address}`.

## Error Handling

- Invalid signature → 401 response, webhook rejected, no order created
- Missing phone → Log warning, order created but status='pending', no WA send
- JSON parse error → Log, return (silent fail, Shopify retries)
- WA send fails → Order created as pending, visible in dashboard for retry

## Related Nodes

- [[Webhook Signature Verification]] (verifyWebhook)
- [[Order Processing Pipeline]] (handleShopifyWebhook)
- [[Language Detection Engine]] (detectLanguage)
- [[Store API Wrapper]] (addOrder)
- [[Order Confirmation Sender]] (sendConfirmation, lazy import)

