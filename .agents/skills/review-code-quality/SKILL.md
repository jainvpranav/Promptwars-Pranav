---
name: review-code-quality
description: >
  Performs a deep code quality review across the codebase or specified files.
  Evaluates readability, maintainability, naming conventions, complexity,
  duplication, and adherence to SOLID / clean-code principles. Produces a
  structured Markdown report with severity-rated findings and concrete fixes.
---

# Skill: Code Quality Review

## Purpose
Systematically analyse code for quality issues that make a codebase hard to
read, extend, and maintain — before they accumulate into technical debt.

## When to Use
- Before merging a feature branch
- During sprint retrospectives / tech-debt cleanup sprints
- When onboarding to an unfamiliar codebase
- Triggered by: "review code quality", "check code quality", "code health check"

---

## Execution Steps

### 1 — Scope Detection
Identify files to review:
- If the user specifies files/folders, use those.
- Otherwise scan the entire repo, prioritising files changed in the last
  commit (`git diff --name-only HEAD~1`).

### 2 — Static Analysis (run scripts)
Execute `scripts/lint_check.py` to collect raw metrics:
- Cyclomatic complexity per function (flag > 10)
- Lines of code per function (flag > 40)
- Duplicate code blocks (> 6 identical lines)
- `TODO` / `FIXME` / `HACK` comment density

### 3 — Manual Pattern Review
Check for the following anti-patterns and record every violation:

| Category | Anti-Pattern | Severity |
|---|---|---|
| Naming | Single-letter variables outside loops | Medium |
| Naming | Inconsistent casing (camelCase vs snake_case in same file) | Low |
| Complexity | God-class / God-function (does too many things) | High |
| Complexity | Deep nesting (> 4 levels) | High |
| Duplication | Copy-pasted logic instead of helper extraction | High |
| Dead Code | Commented-out code blocks | Low |
| Dead Code | Unused imports / variables | Medium |
| SOLID | Violating Single Responsibility Principle | High |
| SOLID | Magic numbers/strings without named constants | Medium |
| Error Handling | Bare `except:` / `catch (e) {}` blocks | High |
| Error Handling | Silent failures (errors swallowed without logging) | High |

### 4 — Compile the Report
Write the report to `review_output/code_quality_report.md` using this template:

```markdown
# Code Quality Review — {date}

## Executive Summary
- Files reviewed: N
- Total findings: N  (🔴 High: N | 🟡 Medium: N | 🟢 Low: N)
- Overall health score: X / 10

## Findings

### 🔴 HIGH — {file}:{line}
**Issue:** [description]
**Why it matters:** [impact]
**Fix:**
\```language
// corrected code
\```

### 🟡 MEDIUM — …

### 🟢 LOW — …

## Refactoring Roadmap
| Priority | File | Action | Effort |
|---|---|---|---|
| 1 | … | … | 2h |

## Positive Patterns Observed
- …
```

### 5 — Present Findings
- Stream findings to the chat as you discover them (don't wait for full scan).
- Offer to apply any fix automatically when the user confirms.
- After fixing, re-run `scripts/lint_check.py` to verify improvement.

---

## Scoring Rubric

| Score | Meaning |
|---|---|
| 9–10 | Production-ready, exemplary code |
| 7–8  | Minor improvements suggested |
| 5–6  | Moderate tech debt, refactor soon |
| 3–4  | Significant issues, refactor before next release |
| 1–2  | Critical — do not ship without major rework |

---

## Leveraging This Skill for Better Results

**Tip 1 — Combine with the Security Review skill**
Run both together before any release: `review-code-quality` + `review-security`.
Security vulnerabilities often hide inside poorly structured code.

**Tip 2 — Add to CI/CD**
Attach `scripts/lint_check.py --ci --fail-on=high` to your pull-request
pipeline to block merges with High-severity findings.

**Tip 3 — Track Trends**
Run the skill weekly and store reports in `review_output/history/`. Compare
scores over time to measure team improvement.

**Tip 4 — Pair with Testing Review**
Low test coverage + high complexity = highest risk. Always run
`review-testing` after this skill to get the full risk picture.
