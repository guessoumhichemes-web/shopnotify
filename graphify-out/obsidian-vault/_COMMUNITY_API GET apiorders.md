---
type: community
cohesion: 0.70
members: 11
---

# API: GET /api/orders

**Cohesion:** 0.70 - tightly connected
**Members:** 11 nodes

## Members
- [[API GET apiorders]] - document - /Users/hichem/Desktop/shopnotify/public/index.html
- [[API GET apistats]] - document - /Users/hichem/Desktop/shopnotify/public/index.html
- [[API POST apisendorderId]] - document - /Users/hichem/Desktop/shopnotify/public/index.html
- [[Express HTTP Server]] - document - /Users/hichem/Desktop/shopnotify/ShopNotify.md
- [[In-Memory Order Store]] - document - /Users/hichem/Desktop/shopnotify/ShopNotify.md
- [[Rationale In-Memory Store (MVP Trade-off)]] - document - /Users/hichem/Desktop/shopnotify/ShopNotify.md
- [[ShopNotify Web Dashboard]] - document - /Users/hichem/Desktop/shopnotify/public/index.html
- [[dotenv Environment Variables]] - document - /Users/hichem/Desktop/shopnotify/ShopNotify.md
- [[loadData() - Orders & Stats Loader (10s interval)]] - document - /Users/hichem/Desktop/shopnotify/public/index.html
- [[srcindex.js - Express Server & Routes]] - document - /Users/hichem/Desktop/shopnotify/ShopNotify.md
- [[srcstore.js - In-Memory Data Store]] - document - /Users/hichem/Desktop/shopnotify/ShopNotify.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/API:_GET_/api/orders
SORT file.name ASC
```

## Connections to other communities
- 3 edges to [[_COMMUNITY_API GETPUT apitemplates]]
- 1 edge to [[_COMMUNITY_Order Status State Machine]]
- 1 edge to [[_COMMUNITY_API GET apiwhatsappstatus]]

## Top bridge nodes
- [[srcindex.js - Express Server & Routes]] - degree 12, connects to 3 communities