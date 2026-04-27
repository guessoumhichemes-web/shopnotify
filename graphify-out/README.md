# ShopNotify Knowledge Graph Output

Generated: 2026-04-26  
Corpus: 8 source files (6 code + 2 config) | ~2,500 lines  
Graph: 26 nodes | 33 edges | 6 communities

---

## Files in This Directory

### 1. `graph.json`
Machine-readable knowledge graph. Structure:
- **nodes**: 26 concepts (modules, functions, classes, flows)
- **edges**: 33 relationships (calls, implements, references, etc.)
- **hyperedges**: 3 multi-node patterns (integration flows, architecture layers)
- **confidence tags**: EXTRACTED (100% certain), INFERRED (reasonable inference), AMBIGUOUS (uncertain)

Use for: Programmatic queries, visualization, GraphQL/Neo4j import

### 2. `GRAPH_REPORT.md`
Comprehensive analysis covering:
- **God Nodes** - Most connected concepts (Express Server, WhatsApp Client, Store API)
- **Surprising Connections** - Cross-cutting concerns (phone formatting, language detection, state machine)
- **Community Map** - 6 functional clusters (API layer, persistence, Shopify, WhatsApp, templates, flows)
- **Data Flow Diagram** - End-to-end order lifecycle
- **Architecture Patterns** - Event-driven, lazy imports, facades, async schedulers
- **Module Summary** - Quick reference table
- **Recommendations** - Extract shared utilities, consolidate language detection, add state validation

### 3. `obsidian/` Directory
Self-contained Obsidian vault (no external dependencies). Open as a vault in Obsidian app:
1. In Obsidian: File → Open vault as folder → select `obsidian/`
2. View `index.md` to navigate by community or flow
3. Click [[WikiLinks]] to jump between concepts
4. Use Obsidian Graph View to visualize connections (Ctrl+Alt+G)

**Files:**
- `index.md` - Start here. Navigation hub.
- `_COMMUNITY_*.md` - 5 community overviews with node lists, code examples, patterns
- `_COMMUNITY_Flows.md` - 5 critical end-to-end flows (order receipt, customer response, reminders, etc.)

---

## How to Use

### For Code Review
1. Read `GRAPH_REPORT.md` → understand architecture
2. Check "Surprising Connections" → identify refactoring opportunities
3. Jump to specific modules via obsidian/ notes

### For Onboarding
1. Start with `obsidian/index.md`
2. Read [[_COMMUNITY_API_Layer]] to understand HTTP routes
3. Read [[_COMMUNITY_Shopify]] + [[_COMMUNITY_WhatsApp]] to understand message flow
4. Open `GRAPH_REPORT.md` → "Data Flow Diagram" for the big picture

### For Debugging
1. Search `graph.json` for node name (e.g., "sendConfirmation")
2. Find all edges (what it calls, what calls it)
3. Jump to source file + line number in editor

### For Architecture Evolution
1. Identify current patterns in GRAPH_REPORT.md → "Architecture Patterns"
2. Check "Cross-Cutting Concerns" for candidates to extract (phone formatting, language detection)
3. Use state machine diagram in `_COMMUNITY_Flows.md` to propose valid state transitions

---

## Next Steps

### Short-term (this sprint)
1. Extract `src/phoneUtils.js` - consolidate 4 phone formatting locations
2. Move `detectLanguage()` to single source of truth (templates.js)
3. Add strict order status validation

### Medium-term (1-2 sprints)
1. Add error handling for WhatsApp send failures (mark as `failed`, implement retry endpoint)
2. Add automated backups of shopnotify.db
3. Implement request logging + monitoring (Sentry for errors)

### Long-term (post-launch)
1. Database migration path (SQLite → PostgreSQL) once user base grows
2. Implement full state machine validation (enum + transitions)
3. Add rate limiting to webhook handler
4. Multi-store support (handle multiple Shopify shops)

---

## Related Documents

- `../MISE_A_JOUR.md` - Deployment progress (85% complete)
- `../.claude/plans/SHOPNOTIFY_STATUS.md` - Session continuation guide
- `../README.md` (if exists) - Project overview

---

## Regenerating the Graph

When you modify the codebase:

**Option 1: Quick update (code-only changes)**
```bash
/graphify /Users/hichem/Desktop/shopnotify --update
```
Rebuilds graph using cached analysis for docs + papers. Re-extracts only changed code files.

**Option 2: Full rebuild (after major refactors)**
```bash
rm -rf graphify-out/
/graphify /Users/hichem/Desktop/shopnotify
```
Complete re-analysis from scratch.

---

## Questions Answered by This Graph

1. **"How does an order flow from Shopify to WhatsApp?"**
   - Follow hyperedge: `flow_shopify_to_whatsapp`

2. **"What are all the dependencies of the WhatsApp client?"**
   - Look at `whatsapp_client` node + all incoming edges

3. **"Where does language detection happen?"**
   - `templates_detection` node + `shopify_languagedetection`
   - See "Surprising Connections" for why they're separate

4. **"How is phone number matching implemented?"**
   - See `db_crud` node (getOrderByPhone) + "Cross-Cutting Concerns" in report

5. **"What happens if a customer doesn't respond for 2 hours?"**
   - See `whatsapp_reminder` node + `_COMMUNITY_Flows.md` → Flow 3

---

## Graph Statistics

| Metric | Value |
|--------|-------|
| Nodes | 26 |
| Edges | 33 |
| Hyperedges | 3 |
| Communities | 6 |
| Avg edges/node | 2.5 |
| Max-degree node | Express Server (7) |
| Confidence: EXTRACTED | 100% |
| Confidence: INFERRED | 0% |
| Confidence: AMBIGUOUS | 0% |

---

**Generated by:** Direct codebase analysis (no LLM extraction)  
**Last updated:** 2026-04-26  
**Vault format:** Obsidian-compatible markdown
