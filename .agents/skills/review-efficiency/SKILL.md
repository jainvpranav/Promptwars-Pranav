---
name: review-efficiency
description: >
  Analyses code for performance and resource-efficiency issues. Detects
  unnecessary re-renders, N+1 query patterns, memory leaks, blocking I/O,
  unoptimised algorithms (O(n²)+), missing caching, and bundle-size bloat.
  Produces a ranked optimization roadmap with estimated impact.
---

# Skill: Efficiency & Performance Review

## Purpose
Identify bottlenecks and wasteful patterns that degrade user experience,
increase infrastructure costs, or cause scalability ceiling.

## When to Use
- Performance complaints or regressions reported
- Pre-launch load testing preparation
- After adding new database queries or data processing pipelines
- Triggered by: "performance review", "efficiency review", "why is this slow",
  "optimise my code", "reduce bundle size"

---

## Execution Steps

### 1 — Identify the Performance Budget
Ask (or infer from the project type):
- **Frontend**: Target Lighthouse score ≥ 90, LCP < 2.5s, CLS < 0.1
- **Backend API**: Target p99 latency < 200ms, p50 < 50ms
- **Data Pipeline**: Target throughput, memory ceiling

### 2 — Frontend Analysis
Run `scripts/perf_check.py --target=frontend`:

Check for:
| Issue | Impact | Heuristic |
|---|---|---|
| Unoptimised images | High | `<img>` without `loading="lazy"` or without size attributes |
| Large bundle | High | `import` of full libraries (e.g. `import _ from 'lodash'`) |
| Blocking scripts | High | `<script>` without `async`/`defer` |
| Unused CSS | Medium | Large CSS files with low selector specificity |
| Missing memoisation | Medium | `useEffect` / `useMemo` / `useCallback` anti-patterns in React |
| Waterfall requests | High | Sequential fetch chains that could be parallelised |
| Missing HTTP caching headers | Medium | API responses without `Cache-Control` |

### 3 — Backend Analysis

Check for:
| Issue | Impact | Pattern |
|---|---|---|
| N+1 queries | Critical | Loop containing DB call; no `.select_related()` / eager load |
| Missing DB indexes | Critical | `WHERE` / `ORDER BY` on non-indexed columns |
| Synchronous I/O in async context | High | `requests.get()` inside `async def` |
| In-memory pagination | High | Loading full dataset then slicing in Python/JS |
| Redundant computation | Medium | Same expensive computation repeated in a loop |
| Missing caching | Medium | Frequently called function with no memoisation / Redis cache |
| Unbounded queries | Critical | No `LIMIT` clause on queries that can return millions of rows |

### 4 — Algorithm Complexity Check
For each non-trivial function, estimate Big-O:
- Flag O(n²) or worse where n can grow unbounded
- Suggest better algorithm/data-structure (e.g., set lookup vs. list scan)

### 5 — Memory & Resource Leaks
- Event listeners added without corresponding removal
- Streams / file handles opened without `finally` / `with` / `using`
- Growing in-memory caches with no eviction policy
- Circular references preventing garbage collection

### 6 — Compile the Efficiency Report
Write to `review_output/efficiency_report.md`:

```markdown
# Efficiency Review — {date}

## Performance Budget Status
| Metric | Target | Estimated Current | Status |
|---|---|---|---|
| LCP | < 2.5s | ~?s | ⚠️ |
| Bundle Size | < 250KB | ?KB | … |
| p99 API Latency | < 200ms | ?ms | … |

## Findings — Ranked by Impact

### 🔴 CRITICAL — N+1 Query in `{file}:{line}`
**What:** Loop executes {N} DB queries instead of 1.
**Impact:** {N}x more DB load; will degrade at scale.
**Fix:**
\```python
# Before
for user in users:
    orders = Order.objects.filter(user=user)  # N queries

# After
users = User.objects.prefetch_related("order_set").all()  # 1+1 queries
\```
**Estimated speedup:** ~{N}x

### 🟡 MEDIUM — …

## Optimization Roadmap
| # | Finding | Effort | Est. Impact |
|---|---|---|---|
| 1 | Batch DB queries | 2h | 10x less DB load |
| 2 | Add Redis cache for X | 4h | 80% cache-hit rate |

## Quick Wins (< 30 min each)
- [ ] Add `loading="lazy"` to all below-fold images
- [ ] Switch `import _ from 'lodash'` → `import debounce from 'lodash/debounce'`
- [ ] Add `defer` to non-critical `<script>` tags
```

---

## Leveraging This Skill for Better Results

**Tip 1 — Always Measure First**
Run `scripts/perf_check.py --baseline` before and after any optimisation to
quantify improvement, not just estimate it.

**Tip 2 — Pair with Testing Review**
Performance regressions usually lack regression tests. After this review,
add a `review-testing` pass to add load/stress tests for critical paths.

**Tip 3 — Database Index Review**
Ask your DB admin to run `EXPLAIN ANALYZE` on the queries flagged in this
report. Real query plans always beat static analysis.

**Tip 4 — Front-End Bundle Analysis**
For Next.js / Vite projects, run `npm run build -- --analyze` to get a visual
bundle tree map and then re-run this skill to validate fixes.

**Tip 5 — Cache Invalidation Strategy**
When adding caches, always design the invalidation strategy first. A stale
cache is often worse than no cache.
