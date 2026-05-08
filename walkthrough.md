# Review Skills Suite — Walkthrough

## What Was Built

A complete suite of **7 review skills** for Antigravity, installed in your Promptwars workspace at `.agents/skills/`. Each skill is self-contained with a `SKILL.md` and executable Python scripts.

---

## Skills Created

| Skill | Trigger Phrases | Script(s) |
|---|---|---|
| `review-code-quality` | "review code quality", "code health check" | `lint_check.py` |
| `review-security` | "security audit", "find vulnerabilities", "check for secrets" | `secrets_scan.py` |
| `review-efficiency` | "performance review", "why is this slow", "reduce bundle size" | *(pattern-based)* |
| `review-testing` | "review tests", "improve test coverage", "write tests" | `coverage_check.py` |
| `review-accessibility` | "a11y review", "WCAG check", "screen reader review" | `a11y_check.py` |
| `review-google-services` | "firebase review", "GCP review", "google maps review" | *(pattern-based)* |
| `review-problem-alignment` | "does this meet requirements", "acceptance criteria check" | *(analysis-based)* |
| `review-full` | "full review", "pre-release review", "run all reviews" | *orchestrates all above* |

---

## File Structure

```
Promptwars/
└── .agents/
    └── skills/
        ├── review-code-quality/
        │   ├── SKILL.md
        │   └── scripts/lint_check.py
        ├── review-security/
        │   ├── SKILL.md
        │   └── scripts/secrets_scan.py
        ├── review-efficiency/
        │   └── SKILL.md
        ├── review-testing/
        │   ├── SKILL.md
        │   └── scripts/coverage_check.py
        ├── review-accessibility/
        │   ├── SKILL.md
        │   └── scripts/a11y_check.py
        ├── review-google-services/
        │   └── SKILL.md
        ├── review-problem-alignment/
        │   └── SKILL.md
        └── review-full/
            └── SKILL.md          ← Master orchestrator
```

---

## How to Use Each Skill

### 1. Code Quality
**Prompt:** `"Review the code quality of my project"`
- Scores cyclomatic complexity, duplication, naming, SOLID violations
- Runs `lint_check.py` for metrics
- Outputs: `review_output/code_quality_report.md` with score/10

### 2. Security
**Prompt:** `"Do a security audit"` or `"Check for secrets in my code"`
- Scans for hardcoded API keys, AWS/GCP credentials, JWT secrets, weak crypto
- Runs `secrets_scan.py` across all tracked files
- Outputs: `review_output/security_report.md` (secrets masked, never revealed)

### 3. Efficiency
**Prompt:** `"Performance review"` or `"Why is my app slow?"`
- Detects N+1 queries, missing indexes, blocking I/O, O(n²) algorithms, bundle bloat
- Maps to Lighthouse targets (LCP, CLS, bundle size)
- Outputs: `review_output/efficiency_report.md` with optimization roadmap

### 4. Testing
**Prompt:** `"Review my tests"` or `"Improve test coverage"`
- Runs `coverage_check.py` for file-level coverage mapping
- Detects assertion-free tests, flaky tests, missing edge cases
- Scaffolds missing test stubs automatically
- Outputs: `review_output/testing_report.md`

### 5. Accessibility
**Prompt:** `"WCAG review"` or `"Accessibility audit"`
- Runs `a11y_check.py` on all HTML/JSX/TSX files
- Maps findings to WCAG 2.1 AA criteria (1.1.1, 1.4.3, 2.1.1, etc.)
- Outputs: `review_output/accessibility_report.md` with WCAG score/10

### 6. Google Services
**Prompt:** `"Firebase review"` or `"GCP review"` or `"Check my Google integrations"`
- Detects Firebase, Maps, GA4, Vertex AI, BigQuery, Cloud Run usage
- Checks for open Firestore rules, deprecated APIs, cost risks, missing error handling
- Suggests missed Google services that would add value
- Outputs: `review_output/google_services_report.md`

### 7. Problem Alignment
**Prompt:** `"Does this code solve the problem?"` or `"Requirements review"`
- Builds a Requirements Traceability Matrix (RTM) mapping ACs → code → tests
- Identifies scope creep, missing features, and misinterpretations
- Outputs: `review_output/alignment_report.md`

### 8. Full Review (Master)
**Prompt:** `"Full review"` or `"Pre-release check"` or `"Run all reviews"`
- Orchestrates all 7 reviews in the correct dependency order
- Calculates a weighted overall score with go/no-go verdict
- Outputs: `review_output/full_review_report.md` + all individual reports

---

## Recommended Workflow

```
┌─────────────────────────────────────────────┐
│  Before starting a feature                  │
│  → review-problem-alignment                 │
│    (Define acceptance criteria first)        │
└────────────────────┬────────────────────────┘
                     ▼
┌─────────────────────────────────────────────┐
│  During development (iterative)             │
│  → review-code-quality (per PR)             │
│  → review-security (on auth/data changes)   │
└────────────────────┬────────────────────────┘
                     ▼
┌─────────────────────────────────────────────┐
│  Before release (full gate)                 │
│  → review-full                              │
│    Score ≥ 8.0 = 🟢 GO                      │
│    Score 6-8   = 🟡 CONDITIONAL GO          │
│    Score < 6   = 🔴 NO-GO                   │
└─────────────────────────────────────────────┘
```

---

## CI/CD Integration

Add to `.github/workflows/ci.yml`:
```yaml
- name: Code Quality Gate
  run: python .agents/skills/review-code-quality/scripts/lint_check.py . --ci --fail-on=high

- name: Secrets Scan Gate
  run: python .agents/skills/review-security/scripts/secrets_scan.py . --ci --fail-on-any

- name: Accessibility Gate
  run: python .agents/skills/review-accessibility/scripts/a11y_check.py . --ci
```

---

## Score Interpretation

| Score | Meaning | Action |
|---|---|---|
| 9–10 | Excellent | Ship with confidence |
| 7–8 | Good | Ship with minor follow-up tickets |
| 5–6 | Moderate | Fix medium findings before release |
| 3–4 | Poor | Multiple high findings — delay release |
| 1–2 | Critical | Block release, escalate |

> Any single **Critical** finding (hardcoded secret, open Firestore rules, missing auth) = automatic block.
