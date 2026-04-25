---
type: community
cohesion: 0.70
members: 6
---

# API: GET /api/whatsapp/status

**Cohesion:** 0.70 - tightly connected
**Members:** 6 nodes

## Members
- [[@whiskeysocketsbaileys WhatsApp Client]] - document - /Users/hichem/Desktop/shopnotify/ShopNotify.md
- [[API GET apiwhatsappstatus]] - document - /Users/hichem/Desktop/shopnotify/public/index.html
- [[QR Code Scan Overlay UI]] - document - /Users/hichem/Desktop/shopnotify/public/index.html
- [[Rationale Migrate to Baileys over whatsapp-web.js]] - document - /Users/hichem/Desktop/shopnotify/ShopNotify.md
- [[pollWA() - WhatsApp Status Polling (3s interval)]] - document - /Users/hichem/Desktop/shopnotify/public/index.html
- [[whatsapp-web.js (Replaced Library)]] - document - /Users/hichem/Desktop/shopnotify/ShopNotify.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/API:_GET_/api/whatsapp/status
SORT file.name ASC
```

## Connections to other communities
- 1 edge to [[_COMMUNITY_Order Status State Machine]]
- 1 edge to [[_COMMUNITY_API GET apiorders]]

## Top bridge nodes
- [[@whiskeysocketsbaileys WhatsApp Client]] - degree 4, connects to 1 community
- [[API GET apiwhatsappstatus]] - degree 2, connects to 1 community