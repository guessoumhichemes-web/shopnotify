# Data Persistence Community

**Nodes:** 4 (SQLite layer, CRUD, API wrapper, Stats)  
**Files:** src/db.js, src/store.js  
**Purpose:** Durable order storage + analytics

## Architecture

```
Store API (src/store.js)
  ↓
SQLite Layer (src/db.js)
  ├─ CRUD: insertOrder, getOrderById, getOrderByPhone, updateOrder, deleteOrder
  ├─ Stats: aggregates counts by status
  └─ File: shopnotify.db (persisted via saveDb())
```

## Orders Table Schema

```sql
CREATE TABLE orders (
  id TEXT PRIMARY KEY,              -- "order_<shopify_id>"
  shopifyId INTEGER,                -- #123456
  shopifyNumericId INTEGER,         -- Numeric ID for API calls
  customerName TEXT,                -- "John Doe"
  email TEXT,
  phone TEXT,                       -- Raw phone from order
  total TEXT,                       -- "99.99"
  currency TEXT,                    -- "EUR"
  shippingAddress TEXT,             -- Formatted "123 Main St, Paris, 75001, FR"
  items TEXT,                       -- JSON array
  status TEXT,                      -- pending|sent|reminded|confirmed|cancelled|failed
  lang TEXT,                        -- "fr" or "es"
  raw TEXT,                         -- Full Shopify webhook JSON
  createdAt TEXT,                   -- ISO timestamp
  updatedAt TEXT                    -- Last status change
)
```

## CRUD Operations

- **insertOrder** - Create new order from Shopify webhook
- **getOrderById** - Fetch by primary key
- **getOrderByPhone** - Flexible phone matching (strips digits, checks endsWith)
- **getAllOrders** - For dashboard display (sorted DESC by createdAt)
- **getOrdersByStatus** - For filtering (pending, confirmed, etc.)
- **updateOrder** - Change status + lang
- **deleteOrder** - Rare (cleanup)

## Stats Query

Aggregates counts by status:
```
SELECT
  COUNT(*) as total,
  SUM(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
  SUM(CASE WHEN status = 'sent' THEN 1 END) as sent_count,
  ...
FROM orders
```

Computes response rate: `(confirmed + cancelled) / sent * 100%`

## Phone Matching Problem

**Flexible matching in `getOrderByPhone()`:**
```javascript
const cleanPhone = phone.replace(/\D/g, ''); // '34 612 345 678' → '34612345678'
if (
  orderPhone === cleanPhone ||       // Exact match
  orderPhone.endsWith(cleanPhone) || // Order has country code, query doesn't
  cleanPhone.endsWith(orderPhone)    // Query has country code, order doesn't
) return order;
```

**Risk:** 2 different numbers could match (e.g., `612345678` matches both `34612345678` and `34112345678`). Consider stricter validation.

## Persistence Strategy

- **File-based:** `shopnotify.db` persisted to disk via `saveDb()`
- **In-memory:** sql.js loads entire DB into RAM
- **Railway volume:** Persists across server restarts
- **Backup:** No automated backups (manual export only)

## Related Nodes

- [[Store API Wrapper]] (abstraction layer)
- [[Orders Retrieval Endpoint]] (uses `getPendingOrders()`)
- [[Statistics Endpoint]] (uses `getStats()`)

