#!/usr/bin/env python3
"""
a11y_check.py — Accessibility static analyser for review-accessibility skill.
Parses HTML, JSX, and TSX files for common WCAG 2.1 AA violations.

Usage:
  python a11y_check.py [path] [--output dir] [--ci]
"""

import os
import re
import sys
import json
import argparse
from pathlib import Path
from dataclasses import dataclass, field
from typing import List

SKIP_DIRS = {".git", "node_modules", "__pycache__", "dist", "build", ".next", "venv"}
TARGET_EXTS = {".html", ".jsx", ".tsx", ".js", ".ts"}

@dataclass
class A11yFinding:
    file: str
    line: int
    wcag_id: str
    severity: str   # critical | high | medium | low
    element: str
    issue: str
    fix: str

def get_files(root: str) -> List[Path]:
    result = []
    for p in Path(root).rglob("*"):
        if p.is_file() and p.suffix in TARGET_EXTS:
            if not any(part in SKIP_DIRS for part in p.parts):
                result.append(p)
    return result

# ── Pattern Definitions ──────────────────────────────────────────────────────
IMG_NO_ALT    = re.compile(r'<img(?![^>]*\balt\s*=)[^>]*>', re.IGNORECASE)
IMG_WITH_ALT  = re.compile(r'<img[^>]*\balt\s*=\s*["\'][^"\']*["\'][^>]*>', re.IGNORECASE)

BTN_NO_NAME   = re.compile(r'<button(?![^>]*aria-label)(?![^>]*aria-labelledby)[^>]*>\s*</button>', re.IGNORECASE)
LINK_NO_NAME  = re.compile(r'<a(?![^>]*aria-label)(?![^>]*aria-labelledby)[^>]*>\s*</a>', re.IGNORECASE)
CLICK_DIV     = re.compile(r'<(div|span)[^>]*onClick[^>]*>(?![^<]*role=)', re.IGNORECASE)
INPUT_NO_LABEL= re.compile(r'<input(?![^>]*aria-label)(?![^>]*aria-labelledby)(?![^>]*id=)[^>]*/>', re.IGNORECASE)
IFRAME_NO_TITLE=re.compile(r'<iframe(?![^>]*title)[^>]*>', re.IGNORECASE)
NO_LANG       = re.compile(r'<html(?![^>]*lang)[^>]*>', re.IGNORECASE)
TAB_INDEX_NEG = re.compile(r'tabIndex\s*=\s*["\']?-[1-9]', re.IGNORECASE)
AUTO_FOCUS_UNSAFE=re.compile(r'autoFocus(?!=\{false\})', re.IGNORECASE)
CLICK_HREF_VOID =re.compile(r'href\s*=\s*["\']javascript:void', re.IGNORECASE)
DECORATIVE_NO_ARIA=re.compile(r'<img[^>]*alt\s*=\s*["\']["\'][^>]*(?!aria-hidden)', re.IGNORECASE)
LINK_NEW_TAB  = re.compile(r'target\s*=\s*["\']_blank["\'](?![^>]*rel=["\'][^"\']*noopener)', re.IGNORECASE)
DUPLICATE_ID  = {}  # tracked per-file

CHECKS = [
    # (pattern, wcag_id, severity, element_name, issue, fix)
    (IMG_NO_ALT, "1.1.1", "critical", "<img>",
     "Image missing `alt` attribute.",
     'Add alt="Descriptive text" or alt="" for decorative images.'),

    (BTN_NO_NAME, "4.1.2", "critical", "<button>",
     "Empty button has no accessible name.",
     "Add text content, aria-label, or aria-labelledby."),

    (LINK_NO_NAME, "4.1.2", "critical", "<a>",
     "Empty anchor has no accessible name.",
     "Add text content or aria-label."),

    (CLICK_DIV, "2.1.1", "high", "<div onClick>",
     "Clickable div/span is not keyboard accessible.",
     "Replace with <button> or add role='button' tabIndex={0} onKeyDown handler."),

    (INPUT_NO_LABEL, "1.3.1", "high", "<input>",
     "Input has no accessible label (no aria-label, aria-labelledby, or id for <label>).",
     "Associate a <label htmlFor='id'> or add aria-label."),

    (IFRAME_NO_TITLE, "4.1.2", "high", "<iframe>",
     "iframe missing `title` attribute.",
     'Add title="Description of iframe content".'),

    (NO_LANG, "3.1.1", "high", "<html>",
     "HTML element missing `lang` attribute.",
     'Add lang="en" (or appropriate language code) to <html>.'),

    (TAB_INDEX_NEG, "2.1.1", "medium", "tabIndex",
     "Negative tabIndex removes element from keyboard navigation.",
     "Use tabIndex={0} for focusable elements or remove tabIndex entirely."),

    (CLICK_HREF_VOID, "2.1.1", "medium", "<a href='javascript:void'>",
     "Link uses javascript:void — not keyboard friendly.",
     "Use <button> for actions, or provide a valid href."),

    (LINK_NEW_TAB, "3.2.2", "low", "target='_blank'",
     "Link opens in new tab without rel='noopener noreferrer'.",
     'Add rel="noopener noreferrer" and consider warning users (aria-label).'),
]

def analyse_file(path: Path) -> List[A11yFinding]:
    findings = []
    try:
        content = path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return findings

    lines = content.splitlines()

    for pattern, wcag_id, severity, element, issue, fix in CHECKS:
        for m in pattern.finditer(content):
            # Find line number from character offset
            line_no = content[:m.start()].count("\n") + 1
            findings.append(A11yFinding(
                file=str(path),
                line=line_no,
                wcag_id=wcag_id,
                severity=severity,
                element=element,
                issue=issue,
                fix=fix,
            ))

    # Check for duplicate IDs
    id_re = re.compile(r'\bid\s*=\s*["\']([^"\']+)["\']', re.IGNORECASE)
    ids_seen = {}
    for m in id_re.finditer(content):
        id_val = m.group(1)
        line_no = content[:m.start()].count("\n") + 1
        if id_val in ids_seen:
            findings.append(A11yFinding(
                file=str(path),
                line=line_no,
                wcag_id="4.1.1",
                severity="high",
                element=f'id="{id_val}"',
                issue=f'Duplicate id="{id_val}" (also at line {ids_seen[id_val]}).',
                fix="All `id` values must be unique per page.",
            ))
        else:
            ids_seen[id_val] = line_no

    return findings

def wcag_compliance_score(findings: List[A11yFinding]) -> float:
    weight = {"critical": 4, "high": 3, "medium": 2, "low": 1}
    total_weight = sum(weight.get(f.severity, 1) for f in findings)
    score = max(1.0, 10 - (total_weight / 3))
    return round(min(10.0, score), 1)

def write_report(all_findings: List[A11yFinding], output_dir: str) -> str:
    from datetime import date
    os.makedirs(output_dir, exist_ok=True)
    path = os.path.join(output_dir, "accessibility_report.md")

    criticals = [f for f in all_findings if f.severity == "critical"]
    highs     = [f for f in all_findings if f.severity == "high"]
    mediums   = [f for f in all_findings if f.severity == "medium"]
    lows      = [f for f in all_findings if f.severity == "low"]
    score     = wcag_compliance_score(all_findings)

    lines = [
        f"# Accessibility Review — {date.today()}\n",
        f"## WCAG 2.1 AA Score: {score}/10\n",
        f"- 🚨 Critical: {len(criticals)}  |  🔴 High: {len(highs)}"
        f"  |  🟡 Medium: {len(mediums)}  |  🟢 Low: {len(lows)}\n",
        "---\n",
        "## Findings\n",
        "| Severity | File | Line | WCAG | Element | Issue |",
        "|---|---|---|---|---|---|",
    ]

    severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    for f in sorted(all_findings, key=lambda x: severity_order.get(x.severity, 9)):
        emoji = {"critical": "🚨", "high": "🔴", "medium": "🟡", "low": "🟢"}.get(f.severity, "")
        lines.append(
            f"| {emoji} {f.severity} | `{f.file}` | {f.line}"
            f" | {f.wcag_id} | `{f.element}` | {f.issue} |"
        )

    lines += ["\n---\n", "## Fixes\n"]
    seen_fixes = set()
    for f in all_findings:
        key = (f.element, f.issue)
        if key not in seen_fixes:
            lines.append(f"**{f.element}** — {f.fix}\n")
            seen_fixes.add(key)

    lines += [
        "---\n",
        "## Quick Wins (< 15 min each)\n",
        "- Add `alt` attributes to all images",
        "- Add `lang` to `<html>` element",
        "- Replace icon-only `<button>` with `aria-label`",
        "- Add `title` to all `<iframe>` elements",
    ]

    Path(path).write_text("\n".join(lines), encoding="utf-8")
    return path

def main():
    parser = argparse.ArgumentParser(description="Accessibility Checker")
    parser.add_argument("path", nargs="?", default=".", help="Root path")
    parser.add_argument("--output", default="review_output", help="Output dir")
    parser.add_argument("--ci", action="store_true")
    args = parser.parse_args()

    files = get_files(args.path)
    print(f"🔍 Scanning {len(files)} files for accessibility issues…", file=sys.stderr)

    all_findings: List[A11yFinding] = []
    for f in files:
        all_findings.extend(analyse_file(f))

    report_path = write_report(all_findings, args.output)
    score = wcag_compliance_score(all_findings)

    if args.ci:
        print(json.dumps({
            "score": score,
            "findings": len(all_findings),
            "critical": sum(1 for f in all_findings if f.severity == "critical"),
            "report": report_path
        }, indent=2))
    else:
        print(f"✅ Report: {report_path}")
        print(f"📊 WCAG Score: {score}/10  |  🚨 Critical: {sum(1 for f in all_findings if f.severity == 'critical')}")

if __name__ == "__main__":
    main()
