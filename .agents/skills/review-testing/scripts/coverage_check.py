#!/usr/bin/env python3
"""
coverage_check.py — Analyses test coverage and test quality for review-testing skill.

Usage:
  python coverage_check.py [path] [--output dir]
"""

import os
import re
import sys
import json
import argparse
from pathlib import Path
from dataclasses import dataclass, field
from typing import List, Dict, Tuple

SKIP_DIRS = {".git", "node_modules", "__pycache__", "dist", "build", ".next", "venv"}
SOURCE_EXTS = {".py", ".ts", ".tsx", ".js", ".jsx"}
TEST_PATTERNS = re.compile(
    r'(\.test\.|\.spec\.|_test\.|tests/|__tests__/|test_)', re.IGNORECASE
)
ASSERTION_PATTERNS = re.compile(
    r'(expect\(|assert\s|assertEqual|assertTrue|assertRaises|toBe\(|toEqual\(|'
    r'toContain\(|toHaveBeenCalled|toThrow|should\.|must\.|verify\()', re.IGNORECASE
)
SKIP_PATTERNS = re.compile(r'(\.skip\(|xtest\(|xit\(|xdescribe\(|@pytest\.mark\.skip)')
SLEEP_PATTERNS = re.compile(r'(time\.sleep|await sleep|setTimeout.*\d{3,})')

@dataclass
class TestFileAnalysis:
    path: str
    test_count: int = 0
    assertion_count: int = 0
    skip_count: int = 0
    flaky_indicators: int = 0
    issues: List[str] = field(default_factory=list)

@dataclass
class SourceFileAnalysis:
    path: str
    function_count: int = 0
    has_test: bool = False
    test_file: str = ""

def get_files(root: str) -> Tuple[List[Path], List[Path]]:
    source_files, test_files = [], []
    for p in Path(root).rglob("*"):
        if p.is_file() and p.suffix in SOURCE_EXTS:
            if any(part in SKIP_DIRS for part in p.parts):
                continue
            if TEST_PATTERNS.search(str(p)):
                test_files.append(p)
            else:
                source_files.append(p)
    return source_files, test_files

FUNC_RE = re.compile(r'^\s*(def |function |const \w+ = (\(|\w).*=>|async function )')

def analyse_source_file(path: Path, test_paths: List[str]) -> SourceFileAnalysis:
    analysis = SourceFileAnalysis(path=str(path))
    try:
        lines = path.read_text(encoding="utf-8", errors="ignore").splitlines()
        analysis.function_count = sum(1 for l in lines if FUNC_RE.match(l))
    except Exception:
        pass

    # Look for a corresponding test file
    stem = path.stem
    for tp in test_paths:
        if stem in tp:
            analysis.has_test = True
            analysis.test_file = tp
            break
    return analysis

def analyse_test_file(path: Path) -> TestFileAnalysis:
    analysis = TestFileAnalysis(path=str(path))
    try:
        lines = path.read_text(encoding="utf-8", errors="ignore").splitlines()
    except Exception:
        return analysis

    test_re = re.compile(r'^\s*(it\(|test\(|def test_|describe\()', re.IGNORECASE)
    current_test_start = None
    current_test_assertions = 0

    for i, line in enumerate(lines, 1):
        if test_re.match(line):
            # End of previous test
            if current_test_start is not None and current_test_assertions == 0:
                analysis.issues.append(
                    f"Line {current_test_start}: Test block has NO assertions (assertion-free test)."
                )
            analysis.test_count += 1
            current_test_start = i
            current_test_assertions = 0

        if ASSERTION_PATTERNS.search(line):
            analysis.assertion_count += 1
            current_test_assertions += 1

        if SKIP_PATTERNS.search(line):
            analysis.skip_count += 1

        if SLEEP_PATTERNS.search(line):
            analysis.flaky_indicators += 1
            analysis.issues.append(
                f"Line {i}: `sleep()` in test — potential flakiness/non-determinism."
            )

    # Check last test
    if current_test_start is not None and current_test_assertions == 0:
        analysis.issues.append(
            f"Line {current_test_start}: Last test block has NO assertions."
        )

    return analysis

def write_report(
    source_analyses: List[SourceFileAnalysis],
    test_analyses: List[TestFileAnalysis],
    output_dir: str
) -> str:
    from datetime import date
    os.makedirs(output_dir, exist_ok=True)
    path = os.path.join(output_dir, "testing_report.md")

    total_src = len(source_analyses)
    covered = sum(1 for s in source_analyses if s.has_test)
    coverage_pct = round((covered / total_src * 100) if total_src else 0, 1)

    total_tests = sum(t.test_count for t in test_analyses)
    total_assertions = sum(t.assertion_count for t in test_analyses)
    total_skips = sum(t.skip_count for t in test_analyses)
    total_flaky = sum(t.flaky_indicators for t in test_analyses)
    quality_issues = [i for t in test_analyses for i in t.issues]

    status = "✅" if coverage_pct >= 80 else ("⚠️" if coverage_pct >= 50 else "❌")

    lines = [
        f"# Testing Review — {date.today()}\n",
        "## Coverage Summary",
        f"| Metric | Value | Target | Status |",
        f"|---|---|---|---|",
        f"| Source files with tests | {covered}/{total_src} | 100% | {status} |",
        f"| Estimated file coverage | {coverage_pct}% | 80% | {status} |",
        f"| Total tests | {total_tests} | — | — |",
        f"| Total assertions | {total_assertions} | — | — |",
        f"| Skipped tests | {total_skips} | 0 | {'⚠️' if total_skips else '✅'} |",
        f"| Flaky indicators | {total_flaky} | 0 | {'🔴' if total_flaky else '✅'} |\n",
        "---\n",
        "## Test Quality Issues\n",
    ]

    if quality_issues:
        for issue in quality_issues:
            lines.append(f"- ⚠️ {issue}")
    else:
        lines.append("✅ No test quality issues found.")

    lines += [
        "\n---\n",
        "## Source Files Without Tests\n",
        "| File | Functions | Has Test |",
        "|---|---|---|",
    ]
    for s in source_analyses:
        if not s.has_test:
            lines.append(f"| `{s.path}` | {s.function_count} | ❌ |")

    lines += [
        "\n---\n",
        "## Test Files Analysed\n",
        "| File | Tests | Assertions | Skipped | Issues |",
        "|---|---|---|---|---|",
    ]
    for t in test_analyses:
        lines.append(
            f"| `{t.path}` | {t.test_count} | {t.assertion_count}"
            f" | {t.skip_count} | {len(t.issues)} |"
        )

    lines += [
        "\n---\n",
        "## Recommendations\n",
        f"1. Add tests for the {total_src - covered} untested source files.",
        "2. Replace all assertion-free tests with meaningful assertions.",
        "3. Remove `sleep()` calls — use mocks or `waitFor()` instead.",
        f"4. Resolve {total_skips} skipped tests (or delete them).",
    ]

    Path(path).write_text("\n".join(lines), encoding="utf-8")
    return path

def main():
    parser = argparse.ArgumentParser(description="Test Coverage Checker")
    parser.add_argument("path", nargs="?", default=".", help="Root path")
    parser.add_argument("--output", default="review_output", help="Output dir")
    parser.add_argument("--ci", action="store_true")
    args = parser.parse_args()

    src_files, test_files = get_files(args.path)
    test_paths = [str(t) for t in test_files]

    print(f"🔍 Analysing {len(src_files)} source files and {len(test_files)} test files…",
          file=sys.stderr)

    source_analyses = [analyse_source_file(f, test_paths) for f in src_files]
    test_analyses   = [analyse_test_file(f) for f in test_files]

    report_path = write_report(source_analyses, test_analyses, args.output)

    covered = sum(1 for s in source_analyses if s.has_test)
    pct = round((covered / len(source_analyses) * 100) if source_analyses else 0, 1)

    if args.ci:
        print(json.dumps({
            "coverage_pct": pct,
            "source_files": len(source_analyses),
            "test_files": len(test_files),
            "quality_issues": sum(len(t.issues) for t in test_analyses),
            "report": report_path
        }, indent=2))
    else:
        print(f"✅ Report: {report_path}")
        print(f"📊 Coverage: {pct}%  |  Tests: {sum(t.test_count for t in test_analyses)}")

if __name__ == "__main__":
    main()
