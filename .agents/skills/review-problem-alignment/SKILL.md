---
name: review-problem-alignment
description: >
  Reviews whether the implemented code accurately and completely solves the
  original problem statement or product requirements. Identifies scope gaps,
  requirement misinterpretations, missing acceptance criteria, and feature
  drift. Produces a requirements-traceability matrix and gap analysis.
---

# Skill: Problem Statement Alignment Review

## Purpose
Verify that the code being written actually solves the right problem — catching
requirement misalignments, scope creep, and missing acceptance criteria before
they reach users.

## When to Use
- At the end of a feature sprint before demo / release
- When a PR seems "done" but stakeholders report it "doesn't do what was asked"
- During backlog refinement to verify estimates against actual complexity
- Triggered by: "problem alignment review", "does this meet requirements",
  "requirements review", "acceptance criteria check", "does this solve the problem"

---

## Execution Steps

### 1 — Gather the Problem Statement
Collect the requirements from:
1. Ask the user to provide or point to: PRD, ticket description, user stories,
   or a verbal description of what the feature should do.
2. If no formal doc exists, infer requirements by reading the existing code,
   tests, and commit history.

> **If no requirements exist**: Flag this as a critical process gap. Offer to
> write acceptance criteria together with the user before proceeding.

### 2 — Parse Acceptance Criteria
Extract or derive acceptance criteria (AC) in Given-When-Then format:

```gherkin
# Example derived AC
Given: A user is logged in
When:  They submit the checkout form with valid payment details
Then:  An order is created, confirmation email sent, inventory decremented
```

### 3 — Build the Requirements Traceability Matrix (RTM)
For each AC:
- Find the code that implements it (search functions, components, routes)
- Find the test that verifies it
- Rate implementation completeness: ✅ Full | ⚠️ Partial | ❌ Missing

Example RTM:
| # | Requirement | Implementation | Test | Status |
|---|---|---|---|---|
| AC-1 | User can log in with email/password | `auth.service.ts:login()` | `auth.spec.ts:L12` | ✅ |
| AC-2 | Locked after 5 failed attempts | `auth.service.ts:checkLock()` | ❌ None | ⚠️ |
| AC-3 | Confirmation email sent on order | ❌ Not found | ❌ None | ❌ |

### 4 — Gap Analysis

#### Missing Requirements
List all AC items with ❌ or ⚠️ status. For each:
- Confirm with user whether it was intentionally deferred or genuinely missed
- Estimate implementation effort
- Assign risk level (user-facing vs. internal)

#### Over-Engineering / Scope Creep
Identify code that was added beyond what the requirements asked for:
- New abstractions not required by any AC
- Extra configuration options with no documented use case
- UI elements not in the design spec

#### Requirement Misinterpretations
Where the implementation does something different from what was specified:
- Different data model than specified
- Different business rule applied
- API contract mismatch from spec

### 5 — Edge Case Coverage
For each core requirement, check if these edge cases are handled:
| Edge Case | Handled? |
|---|---|
| Empty/null inputs | ? |
| Maximum input length | ? |
| Concurrent requests | ? |
| Partial failures (one step succeeds, next fails) | ? |
| User with no permissions attempting the action | ? |
| Mobile / small screen variant | ? |
| Network offline state | ? |

### 6 — User Journey Walkthrough
Mentally walk through the user journey end-to-end:
1. What does the user see/do first?
2. What happens at each step?
3. What are the error states?
4. Does the output match what the problem statement promised?

### 7 — Compile the Alignment Report
Write to `review_output/alignment_report.md`:

```markdown
# Problem Alignment Review — {date}

## Problem Statement (as understood)
> {paste or summarise the original problem/requirement here}

## Alignment Score: N/10
(Based on % of AC items fully implemented and tested)

## Requirements Traceability Matrix
| # | Requirement | Code Reference | Test Reference | Status |
|---|---|---|---|---|
| AC-1 | … | … | … | ✅ / ⚠️ / ❌ |

## Gaps Found

### ❌ MISSING — AC-3: Confirmation email on order
**Impact:** Users receive no confirmation after checkout — critical UX gap.
**Effort to implement:** ~4 hours
**Recommendation:** Implement before release; use Firebase Functions + SendGrid.

### ⚠️ PARTIAL — AC-2: Account lockout after 5 failed logins
**What's there:** Lock logic exists in `auth.service.ts`
**What's missing:** Lockout is not tested; no UI feedback shown to user.
**Recommendation:** Add test + toast notification.

## Scope Creep Identified
- `PremiumAnalyticsModule` was added but is not in any requirement. Consider
  moving to a separate ticket.

## Edge Cases Not Covered
| Edge Case | Requirement | Recommendation |
|---|---|---|
| Order with 0 items | AC-Checkout | Disable submit button; validate server-side |
| Network failure mid-checkout | AC-Checkout | Add retry + idempotency key |

## Recommended Next Steps
1. Implement missing confirmation email (AC-3) — Blocks release
2. Add lockout UI feedback (AC-2) — Should-have
3. Write tests for account lockout — Required by definition of done
4. Create ticket for PremiumAnalyticsModule out-of-scope work
```

---

## Leveraging This Skill for Better Results

**Tip 1 — Write ACs Before Coding**
The best time to run this skill is *before* implementation begins. Use it to
convert vague requirements into testable acceptance criteria that guide development.

**Tip 2 — Pair with Testing Review**
Every AC should have at least one test. After this review, run `review-testing`
to ensure all AC gaps are covered by new tests.

**Tip 3 — Definition of Done**
Attach the RTM to your PR description. A PR is only "done" when all AC items
are ✅ with at least one test each.

**Tip 4 — Living Documentation**
Store the RTM in the repo (`docs/requirements/feature-name.md`) so future
engineers understand why specific design decisions were made.

**Tip 5 — Stakeholder Demos**
Use the gap analysis section as the agenda for your stakeholder demo.
Walk through ✅ items to show what's done, and ⚠️/❌ to align on what's next.

**Tip 6 — Combine All Reviews for Release Gating**
Before any release, run the full review suite:
```
review-problem-alignment → review-code-quality → review-security
→ review-testing → review-efficiency → review-accessibility
→ review-google-services (if applicable)
```
Use the combined scores to make a data-driven go/no-go release decision.
