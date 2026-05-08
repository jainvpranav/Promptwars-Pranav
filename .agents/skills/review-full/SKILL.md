---
name: review-full
description: >
  Master review orchestrator. Runs ALL review skills in sequence (code quality,
  security, efficiency, testing, accessibility, google services, and problem
  alignment) and produces a unified executive report with a combined release
  readiness score. Use this before any major release or milestone.
---

# Skill: Full Review Suite (Orchestrator)

## Purpose
Run every review skill in the correct dependency order, deduplicate overlapping
findings, and produce a single executive report that enables a **data-driven
go/no-go release decision**.

## When to Use
- Pre-release gating (feature freeze, RC, or production deploy)
- End of sprint review
- New team member onboarding (understand codebase health at a glance)
- Triggered by: "full review", "complete review", "run all reviews",
  "pre-release review", "release readiness check"

---

## Execution Order

Run skills in this dependency order (each informs the next):

```
1. review-problem-alignment   ← Are we solving the right problem?
2. review-code-quality        ← Is the code well-structured?
3. review-security            ← Is it safe?
4. review-efficiency          ← Is it fast and cost-efficient?
5. review-testing             ← Is it verifiable?
6. review-accessibility       ← Is it inclusive?
7. review-google-services     ← Are integrations optimal? (if applicable)
```

For each skill:
1. Load the skill's `SKILL.md` and follow its execution steps.
2. Run its scripts if applicable.
3. Write the individual report to `review_output/`.
4. Extract the top 3 findings for the consolidated report.

---

## Consolidated Report Template

Write to `review_output/full_review_report.md`:

```markdown
# Full Review Report — {Project Name} — {date}

## 🎯 Release Readiness Verdict

| Dimension | Score | Status |
|---|---|---|
| Problem Alignment | N/10 | ✅ / ⚠️ / ❌ |
| Code Quality | N/10 | ✅ / ⚠️ / ❌ |
| Security | N/10 | ✅ / ⚠️ / ❌ |
| Efficiency | N/10 | ✅ / ⚠️ / ❌ |
| Testing | N/10 | ✅ / ⚠️ / ❌ |
| Accessibility | N/10 | ✅ / ⚠️ / ❌ |
| Google Services | N/10 | ✅ / ⚠️ / ❌ |
| **OVERALL** | **N/10** | **🟢 GO / 🔴 NO-GO** |

**Release Recommendation:** {GO / CONDITIONAL GO / NO-GO}
**Rationale:** {brief explanation}

---

## 🚨 Blockers (Must Fix Before Release)
<!-- All HIGH/CRITICAL findings from all reviews -->

1. **[Security]** Hardcoded API key in `config.js:L14`
2. **[Alignment]** Confirmation email (AC-3) not implemented
3. **[Testing]** Auth flow has 0% test coverage

---

## ⚠️ Should-Fix (Fix Before Next Sprint)

1. **[Code Quality]** `processOrder()` has complexity score 18 — refactor
2. **[Efficiency]** N+1 query in `UserList.tsx`
3. **[Accessibility]** 4 images missing `alt` attributes

---

## 🟢 Observations (Nice to Have)

1. **[Code Quality]** Several TODO comments — track in issue board
2. **[Google Services]** Consider Firebase Remote Config for feature flags

---

## Detailed Reports
- [Code Quality Report](./code_quality_report.md)
- [Security Report](./security_report.md)
- [Efficiency Report](./efficiency_report.md)
- [Testing Report](./testing_report.md)
- [Accessibility Report](./accessibility_report.md)
- [Google Services Report](./google_services_report.md)
- [Alignment Report](./alignment_report.md)

---

## Recommended Action Plan

### This Sprint (Blockers)
| # | Action | Owner | Effort | Skill |
|---|---|---|---|---|
| 1 | Rotate & move API key to env | DevOps | 30m | Security |
| 2 | Implement confirmation email | Backend | 4h | Alignment |
| 3 | Add auth flow tests | QA | 3h | Testing |

### Next Sprint (Should-Fix)
| # | Action | Effort | Skill |
|---|---|---|---|
| 1 | Refactor `processOrder()` | 2h | Code Quality |
| 2 | Batch DB queries | 3h | Efficiency |
| 3 | Add `alt` to images | 30m | Accessibility |

### Backlog (Nice to Have)
| # | Action | Skill |
|---|---|---|
| 1 | Resolve TODO comments | Code Quality |
| 2 | Add Firebase Remote Config | Google Services |
```

---

## Scoring System

### Per-Review Score
Each review skill scores 1–10:
- **9–10**: Excellent — no or minor issues
- **7–8**: Good — a few medium findings
- **5–6**: Moderate — multiple medium or one high finding
- **3–4**: Poor — multiple high findings
- **1–2**: Critical — one or more critical blockers

### Overall Score
```
Overall = weighted_average([
  alignment    × 1.5,   # Most important: solving the right problem
  security     × 1.5,   # Equally important: protecting users
  code_quality × 1.0,
  testing      × 1.0,
  efficiency   × 0.8,
  accessibility × 0.8,
  google_svc   × 0.4,   # Conditional: only included if Google services used
])
```

### Verdict Thresholds
| Score | Verdict |
|---|---|
| ≥ 8.0 | 🟢 **GO** — Ready to release |
| 6.0–7.9 | 🟡 **CONDITIONAL GO** — Release with documented mitigations |
| < 6.0 | 🔴 **NO-GO** — Fix blockers before release |

Any single **Critical** finding = automatic NO-GO regardless of score.

---

## Leveraging the Full Review Suite for Maximum Value

**Combine with GitHub Actions (CI/CD)**
```yaml
# .github/workflows/review.yml
name: Full Review Suite
on: [pull_request]
jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: python .agents/skills/review-code-quality/scripts/lint_check.py . --ci --fail-on=high
      - run: python .agents/skills/review-security/scripts/secrets_scan.py . --ci --fail-on-any
```

**Weekly Health Tracking**
Run the full review weekly (e.g., every Monday) and store reports in
`review_output/history/YYYY-MM-DD/`. Chart the overall score over time to
measure team and codebase improvement.

**Onboarding New Team Members**
Point new engineers to the most recent full review report to understand
the codebase's known issues, technical debt priorities, and established patterns.

**Pre-Demo Checklist**
Before any stakeholder demo, run `review-problem-alignment` alone (fastest)
to confirm the demo features match what was promised.

**Investor / Audit Readiness**
A clean full review report (score ≥ 8.0) demonstrates engineering maturity
to investors, enterprise customers, and compliance auditors.
