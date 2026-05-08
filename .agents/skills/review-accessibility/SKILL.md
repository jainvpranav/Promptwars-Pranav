---
name: review-accessibility
description: >
  Audits UI code (HTML, JSX/TSX, CSS) for WCAG 2.1 AA compliance and
  inclusive design issues. Checks semantic HTML, keyboard navigation, ARIA
  labels, colour contrast, focus management, and screen-reader compatibility.
  Produces a WCAG-mapped findings report with concrete code fixes.
---

# Skill: Accessibility Review

## Purpose
Ensure that the product is usable by people with visual, motor, auditory, and
cognitive disabilities, meeting WCAG 2.1 Level AA requirements — and reducing
legal risk from accessibility lawsuits.

## When to Use
- Before any public release or major UI update
- After adding new interactive components (modals, forms, data tables)
- When integrating third-party UI libraries
- Triggered by: "accessibility review", "a11y review", "WCAG check",
  "screen reader review", "check accessibility"

---

## Execution Steps

### 1 — Automated Scan
Run `scripts/a11y_check.py` to parse all HTML / JSX / TSX files and flag:
- Missing `alt` attributes on `<img>`
- `<button>` / `<a>` with no accessible name (no text, no `aria-label`)
- Form inputs without associated `<label>` or `aria-labelledby`
- `<div>` / `<span>` used as interactive elements without `role` + `tabindex`
- Missing `lang` attribute on `<html>`
- `<iframe>` without `title`

### 2 — WCAG 2.1 AA Checklist

#### Perceivable
| Criterion | ID | Check |
|---|---|---|
| Text alternatives for non-text content | 1.1.1 | All `<img>` have meaningful `alt`; decorative images have `alt=""` |
| Captions for video | 1.2.2 | All `<video>` have `<track kind="captions">` |
| Information not conveyed by colour alone | 1.4.1 | Error states use icon + text, not just red colour |
| Colour contrast (AA) | 1.4.3 | Normal text ≥ 4.5:1 ratio; large text ≥ 3:1 |
| Resize text | 1.4.4 | Layout works at 200% text zoom |
| Reflow | 1.4.10 | Content reflows at 320px width without horizontal scroll |
| Non-text contrast | 1.4.11 | UI components have ≥ 3:1 contrast against adjacent colour |

#### Operable
| Criterion | ID | Check |
|---|---|---|
| All functionality via keyboard | 2.1.1 | Tab order logical; no keyboard traps |
| No seizure-inducing content | 2.3.1 | No flashing > 3 times/sec |
| Skip navigation | 2.4.1 | "Skip to main content" link present |
| Page titles | 2.4.2 | Each page has a unique, descriptive `<title>` |
| Focus visible | 2.4.7 | Focus ring visible on all interactive elements |
| Link purpose | 2.4.4 | No "click here" / "read more" links without context |

#### Understandable
| Criterion | ID | Check |
|---|---|---|
| Language of page | 3.1.1 | `<html lang="en">` (or appropriate code) |
| Error identification | 3.3.1 | Form errors identify the field and describe the issue |
| Labels or instructions | 3.3.2 | All form fields have visible labels |
| Error suggestion | 3.3.3 | Error messages suggest how to fix |

#### Robust
| Criterion | ID | Check |
|---|---|---|
| Valid HTML | 4.1.1 | No duplicate IDs, properly nested elements |
| Name, role, value | 4.1.2 | All custom components have correct ARIA roles and states |
| Status messages | 4.1.3 | Status messages exposed via `aria-live` regions |

### 3 — Colour Contrast Analysis
For each colour pair found in CSS:
- Extract foreground + background hex values
- Compute WCAG contrast ratio
- Flag pairs below 4.5:1 (normal text) or 3:1 (large text / UI components)
- Suggest adjusted colours maintaining the same hue

### 4 — Keyboard Navigation Trace
Mentally trace Tab → Shift+Tab through each interactive component and verify:
- Tab order matches visual order
- All interactive elements reachable
- No focus traps (except intentional modal traps with Escape to exit)
- Focus returns correctly after modal close / route change

### 5 — ARIA Audit
- `aria-label` / `aria-labelledby` used correctly (not redundantly)
- `role` values are valid WAI-ARIA roles
- Required owned elements present (e.g. `role="listbox"` contains `role="option"`)
- `aria-required`, `aria-invalid`, `aria-expanded` toggled programmatically

### 6 — Compile the Accessibility Report
Write to `review_output/accessibility_report.md`:

```markdown
# Accessibility Review — {date}

## WCAG 2.1 AA Compliance Score
Estimated compliance: N% (N of M criteria met)

## Critical Findings (Blockers)

### ❌ WCAG 1.1.1 — Missing alt text — `{file}:{line}`
\```jsx
// Before
<img src="/hero.jpg" />

// After
<img src="/hero.jpg" alt="Team collaborating on a whiteboard" />
// Decorative: <img src="/divider.svg" alt="" aria-hidden="true" />
\```

### ❌ WCAG 1.4.3 — Insufficient colour contrast — `button.primary`
**Foreground:** #6B7280 on **Background:** #FFFFFF → Ratio: 4.0:1 (needs 4.5:1)
**Fix:** Change to #4B5563 → Ratio: 5.9:1 ✅

## Full WCAG Checklist
| ID | Criterion | Status | Notes |
|---|---|---|---|
| 1.1.1 | Text Alternatives | ⚠️ Partial | 3 images missing alt |
| 1.4.3 | Contrast (Minimum) | ❌ Fail | 2 colour pairs below threshold |
| 2.1.1 | Keyboard | ✅ Pass | |
…

## Quick Fix List
- [ ] Add `alt` to 3 images in `HeroSection.tsx`
- [ ] Add `lang="en"` to `_document.tsx`
- [ ] Replace `<div onClick={…}>` with `<button>` in `Dropdown.tsx`
- [ ] Add `aria-label` to icon-only buttons in `Toolbar.tsx`
```

---

## Leveraging This Skill for Better Results

**Tip 1 — Screen Reader Testing**
Pair static analysis with actual VoiceOver (Mac) or NVDA (Windows) testing on
your critical user flows. Static tools miss dynamic accessibility issues.

**Tip 2 — Semantic HTML First**
The single highest-leverage fix is usually replacing `<div>` / `<span>` with
the correct semantic element (`<button>`, `<nav>`, `<main>`, `<article>`).
This gives keyboard support, ARIA roles, and focus management for free.

**Tip 3 — Design System Integration**
Add accessibility checks to your design system component library tests.
Fixing accessibility at the component level fixes it everywhere it's used.

**Tip 4 — Colour Palette Audit**
Run this skill on your design tokens / CSS variables file first to audit
the whole palette at once, rather than file by file.

**Tip 5 — Automated in CI**
Install `axe-core` or `jest-axe` and add `expect(await axe(element)).toHaveNoViolations()`
to your component tests for automatic WCAG regression prevention.
