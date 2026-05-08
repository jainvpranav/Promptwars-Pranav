#!/usr/bin/env python3
"""
lint_check.py — Static code quality analyser for review-code-quality skill.
Supports Python, TypeScript, JavaScript, and Go files.

Usage:
  python lint_check.py [path] [--ci] [--fail-on=high]
"""

import os
import sys
import re
import json
import argparse
from pathlib import Path
from dataclasses import dataclass, field
from typing import List, Dict

# ── Configuration ───────────────────────────────────────────────────────────
MAX_CYCLOMATIC   = 10
MAX_FUNC_LINES   = 40
MAX_FILE_LINES   = 300
DUP_MIN_LINES    = 6

SUPPORTED_EXT    = {".py", ".ts", ".tsx", ".js", ".jsx", ".go"}

SEVERITY_WEIGHTS = {"high": 3, "medium": 2, "low": 1}

# ── Data Models ─────────────────────────────────────────────────────────────
@dataclass
class Finding:
    file: str
    line: int
    category: str
    severity: str   # high | medium | low
    message: str
    suggestion: str = ""

@dataclass
class FileMetrics:
    path: str
    total_lines: int = 0
    blank_lines: int = 0
    comment_lines: int = 0
    todo_count: int = 0
    findings: List[Finding] = field(default_factory=list)

# ── Helpers ─────────────────────────────────────────────────────────────────
def get_files(root: str) -> List[Path]:
    result = []
    for p in Path(root).rglob("*"):
        if p.suffix in SUPPORTED_EXT and not any(
            part.startswith(".") or part in {"node_modules", "__pycache__", "dist", "build"}
            for part in p.parts
        ):
            result.append(p)
    return result

def count_cyclomatic(lines: List[str]) -> int:
    """Rough McCabe complexity: count branch keywords."""
    keywords = re.compile(
        r'\b(if|elif|else|for|while|case|catch|except|&&|\|\||\?)\b'
    )
    return 1 + sum(len(keywords.findall(l)) for l in lines)

def analyse_file(path: Path) -> FileMetrics:
    metrics = FileMetrics(path=str(path))
    try:
        lines = path.read_text(encoding="utf-8", errors="ignore").splitlines()
    except Exception:
        return metrics

    metrics.total_lines = len(lines)
    in_func = False
    func_start = 0
    func_lines_buf: List[str] = []
    func_name = ""

    func_re = re.compile(
        r'^\s*(def |function |const \w+ = \(\w*\) =>|func |\w+ \(.*\) \{)'
    )
    single_letter = re.compile(r'\b([a-zA-Z])\b(?!\s*[=:])')
    magic_number   = re.compile(r'(?<!\w)([2-9]\d{1,}|1[0-9]+)(?!\w)')  # >1 digit ints
    bare_except    = re.compile(r'^\s*(except:|catch\s*\(\s*\)\s*\{|catch\s*\(e\)\s*\{)')
    todo_re        = re.compile(r'#\s*(TODO|FIXME|HACK|XXX)', re.IGNORECASE)
    unused_import  = re.compile(r'^import\s+(\w+)')
    deep_nest_re   = re.compile(r'^(\s{16,})')  # 4+ levels (4sp each)

    imported_names: List[str] = []

    for i, line in enumerate(lines, 1):
        stripped = line.strip()

        # Blank / comment tracking
        if not stripped:
            metrics.blank_lines += 1
            continue
        if stripped.startswith(("#", "//", "*", "/*", "*/")):
            metrics.comment_lines += 1

        # TODO density
        if todo_re.search(line):
            metrics.todo_count += 1
            metrics.findings.append(Finding(
                file=str(path), line=i, category="Dead Code",
                severity="low", message=f"TODO/FIXME comment: {stripped[:80]}",
                suggestion="Resolve or track this in your issue tracker."
            ))

        # Bare except / empty catch
        if bare_except.match(line):
            metrics.findings.append(Finding(
                file=str(path), line=i, category="Error Handling",
                severity="high", message="Bare except/empty catch silences all errors.",
                suggestion="Catch specific exception types and log or re-raise."
            ))

        # Deep nesting
        if deep_nest_re.match(line):
            metrics.findings.append(Finding(
                file=str(path), line=i, category="Complexity",
                severity="high", message="Deep nesting detected (> 4 levels).",
                suggestion="Extract nested logic into named helper functions."
            ))

        # Magic numbers
        for m in magic_number.finditer(line):
            val = m.group(1)
            if int(val) not in {0, 1, 100, 200, 201, 204, 400, 401, 403, 404, 500}:
                metrics.findings.append(Finding(
                    file=str(path), line=i, category="Naming",
                    severity="medium",
                    message=f"Magic number {val} used directly.",
                    suggestion=f"Extract as a named constant, e.g. MAX_RETRIES = {val}"
                ))
                break  # one per line

        # Track imports for unused-import check
        m = unused_import.match(stripped)
        if m:
            imported_names.append((m.group(1), i))

        # Function boundary detection (simple heuristic)
        if func_re.match(line):
            if in_func and func_lines_buf:
                cc = count_cyclomatic(func_lines_buf)
                fl = len(func_lines_buf)
                if cc > MAX_CYCLOMATIC:
                    metrics.findings.append(Finding(
                        file=str(path), line=func_start, category="Complexity",
                        severity="high",
                        message=f"Function '{func_name}' has cyclomatic complexity ~{cc} (max {MAX_CYCLOMATIC}).",
                        suggestion="Break into smaller, single-purpose functions."
                    ))
                if fl > MAX_FUNC_LINES:
                    metrics.findings.append(Finding(
                        file=str(path), line=func_start, category="Complexity",
                        severity="high",
                        message=f"Function '{func_name}' is {fl} lines (max {MAX_FUNC_LINES}).",
                        suggestion="Extract sub-tasks into dedicated helpers."
                    ))
            in_func = True
            func_start = i
            func_lines_buf = []
            name_match = re.search(r'(def |function |func )(\w+)', line)
            func_name = name_match.group(2) if name_match else "<anonymous>"
        elif in_func:
            func_lines_buf.append(line)

    # File-level size
    if metrics.total_lines > MAX_FILE_LINES:
        metrics.findings.append(Finding(
            file=str(path), line=1, category="Complexity",
            severity="medium",
            message=f"File has {metrics.total_lines} lines (max {MAX_FILE_LINES}).",
            suggestion="Split into smaller modules with clear responsibilities."
        ))

    return metrics

# ── Score Calculation ────────────────────────────────────────────────────────
def compute_score(all_metrics: List[FileMetrics]) -> float:
    total_weight = sum(
        SEVERITY_WEIGHTS[f.severity]
        for m in all_metrics for f in m.findings
    )
    # Penalties curve: 0 = 10, 30pts = 5, 100pts = 1
    score = max(1.0, 10 - (total_weight / 5))
    return round(min(10.0, score), 1)

# ── Report Writer ────────────────────────────────────────────────────────────
def write_report(all_metrics: List[FileMetrics], output_dir: str) -> str:
    from datetime import date
    os.makedirs(output_dir, exist_ok=True)
    report_path = os.path.join(output_dir, "code_quality_report.md")

    highs   = [f for m in all_metrics for f in m.findings if f.severity == "high"]
    mediums = [f for m in all_metrics for f in m.findings if f.severity == "medium"]
    lows    = [f for m in all_metrics for f in m.findings if f.severity == "low"]
    score   = compute_score(all_metrics)

    lines = [
        f"# Code Quality Review — {date.today()}\n",
        "## Executive Summary",
        f"- **Files reviewed:** {len(all_metrics)}",
        f"- **Total findings:** {len(highs)+len(mediums)+len(lows)}"
        f"  (🔴 High: {len(highs)} | 🟡 Medium: {len(mediums)} | 🟢 Low: {len(lows)})",
        f"- **Overall health score:** {score} / 10\n",
        "---\n",
        "## Findings\n",
    ]

    for severity, emoji, group in [
        ("high", "🔴", highs), ("medium", "🟡", mediums), ("low", "🟢", lows)
    ]:
        for f in group:
            lines += [
                f"### {emoji} {severity.upper()} — `{f.file}:{f.line}`",
                f"**Category:** {f.category}",
                f"**Issue:** {f.message}",
                f"**Suggestion:** {f.suggestion}\n",
            ]

    lines += [
        "---\n",
        "## Files Scanned\n",
        "| File | Lines | TODOs | Findings |",
        "|---|---|---|---|",
    ]
    for m in all_metrics:
        lines.append(
            f"| `{m.path}` | {m.total_lines} | {m.todo_count} | {len(m.findings)} |"
        )

    Path(report_path).write_text("\n".join(lines), encoding="utf-8")
    return report_path

# ── CLI Entry Point ──────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="Code Quality Linter")
    parser.add_argument("path", nargs="?", default=".", help="Root path to analyse")
    parser.add_argument("--output", default="review_output", help="Output directory")
    parser.add_argument("--ci", action="store_true", help="CI mode: print JSON summary")
    parser.add_argument("--fail-on", choices=["high", "medium", "low"],
                        help="Exit with code 1 if findings of this severity exist")
    args = parser.parse_args()

    files = get_files(args.path)
    print(f"🔍 Analysing {len(files)} files …", file=sys.stderr)

    all_metrics = [analyse_file(f) for f in files]
    report_path = write_report(all_metrics, args.output)

    score = compute_score(all_metrics)
    highs = sum(1 for m in all_metrics for f in m.findings if f.severity == "high")

    if args.ci:
        summary = {
            "score": score,
            "files": len(all_metrics),
            "findings": {
                "high":   highs,
                "medium": sum(1 for m in all_metrics for f in m.findings if f.severity == "medium"),
                "low":    sum(1 for m in all_metrics for f in m.findings if f.severity == "low"),
            },
            "report": report_path,
        }
        print(json.dumps(summary, indent=2))
    else:
        print(f"✅ Report written to {report_path}")
        print(f"📊 Health score: {score}/10  |  🔴 High: {highs}")

    if args.fail_on:
        severity_map = {"high": highs,
                        "medium": sum(1 for m in all_metrics for f in m.findings if f.severity == "medium"),
                        "low":    sum(1 for m in all_metrics for f in m.findings if f.severity == "low")}
        if severity_map.get(args.fail_on, 0) > 0:
            sys.exit(1)

if __name__ == "__main__":
    main()
