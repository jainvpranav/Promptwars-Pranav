#!/usr/bin/env python3
"""
secrets_scan.py — Detects hardcoded secrets, API keys, and credentials.

Usage:
  python secrets_scan.py [path] [--ci] [--fail-on-any]
"""

import os
import re
import sys
import json
import argparse
from pathlib import Path
from dataclasses import dataclass, field
from typing import List, Tuple

SKIP_DIRS = {".git", "node_modules", "__pycache__", "dist", "build", ".next", "venv", ".venv"}
SKIP_EXTS = {".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".woff", ".woff2",
             ".ttf", ".eot", ".mp4", ".mp3", ".pdf", ".zip"}

# ── Secret Patterns ──────────────────────────────────────────────────────────
PATTERNS: List[Tuple[str, str, str]] = [
    # (name, regex, severity)
    ("AWS Access Key",          r'AKIA[0-9A-Z]{16}',                                  "critical"),
    ("AWS Secret Key",          r'(?i)aws.{0,20}secret.{0,20}["\'][0-9a-zA-Z/+]{40}', "critical"),
    ("GCP API Key",             r'AIza[0-9A-Za-z\-_]{35}',                            "critical"),
    ("GitHub Token",            r'ghp_[0-9a-zA-Z]{36}|github_pat_[0-9a-zA-Z_]{82}',  "critical"),
    ("Stripe Secret Key",       r'sk_live_[0-9a-zA-Z]{24}',                           "critical"),
    ("Stripe Publishable Key",  r'pk_live_[0-9a-zA-Z]{24}',                           "high"),
    ("SendGrid API Key",        r'SG\.[0-9A-Za-z\-_]{22}\.[0-9A-Za-z\-_]{43}',       "critical"),
    ("Slack Token",             r'xox[baprs]-[0-9A-Za-z\-]{10,}',                    "high"),
    ("JWT Secret",              r'(?i)(jwt.?secret|jwt.?key)\s*[=:]\s*["\'][^"\']{8,}', "critical"),
    ("Generic Password",        r'(?i)(password|passwd|pwd)\s*[=:]\s*["\'][^"\']{4,}', "high"),
    ("Generic API Key",         r'(?i)(api.?key|apikey|api.?secret)\s*[=:]\s*["\'][^"\']{8,}', "high"),
    ("Private Key Block",       r'-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY',    "critical"),
    ("DB Connection String",    r'(?i)(mongodb|postgres|mysql|redis):\/\/[^:]+:[^@]+@', "critical"),
    ("Firebase Config",         r'(?i)firebase.*["\']AIza[0-9A-Za-z\-_]{35}',         "high"),
    ("Hardcoded Bearer Token",  r'(?i)bearer\s+[a-zA-Z0-9\-_]{20,}',                 "medium"),
]

# Patterns in test/mock files get downgraded to "info"
TEST_PATH_RE = re.compile(r'(test|spec|mock|fixture|__test__|\.test\.|\.spec\.)', re.IGNORECASE)

@dataclass
class SecretFinding:
    file: str
    line: int
    pattern_name: str
    severity: str
    masked_value: str

def mask(value: str) -> str:
    """Show only first 4 and last 2 chars."""
    if len(value) <= 8:
        return "[REDACTED]"
    return value[:4] + "*" * (len(value) - 6) + value[-2:]

def scan_file(path: Path) -> List[SecretFinding]:
    findings = []
    in_test = bool(TEST_PATH_RE.search(str(path)))
    try:
        content = path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return findings

    for i, line in enumerate(content.splitlines(), 1):
        # Skip commented-out lines in Python / JS
        stripped = line.strip()
        if stripped.startswith(("#", "//", "*")):
            continue
        for name, pattern, severity in PATTERNS:
            m = re.search(pattern, line)
            if m:
                sev = "info" if in_test else severity
                findings.append(SecretFinding(
                    file=str(path),
                    line=i,
                    pattern_name=name,
                    severity=sev,
                    masked_value=mask(m.group(0)),
                ))
    return findings

def get_files(root: str) -> List[Path]:
    result = []
    for p in Path(root).rglob("*"):
        if p.is_file() and p.suffix not in SKIP_EXTS:
            if not any(part in SKIP_DIRS for part in p.parts):
                result.append(p)
    return result

def write_report(findings: List[SecretFinding], output_dir: str) -> str:
    from datetime import date
    os.makedirs(output_dir, exist_ok=True)
    path = os.path.join(output_dir, "security_secrets_report.md")

    criticals = [f for f in findings if f.severity == "critical"]
    highs     = [f for f in findings if f.severity == "high"]
    mediums   = [f for f in findings if f.severity == "medium"]

    lines = [
        f"# Secrets Scan Report — {date.today()}\n",
        f"## Summary",
        f"- 🚨 Critical: {len(criticals)}  |  🔴 High: {len(highs)}  |  🟡 Medium: {len(mediums)}\n",
        "## Findings\n",
        "| Severity | File | Line | Type | Masked Value |",
        "|---|---|---|---|---|",
    ]
    for f in sorted(findings, key=lambda x: ["critical","high","medium","low","info"].index(x.severity)):
        emoji = {"critical": "🚨", "high": "🔴", "medium": "🟡", "low": "🟢", "info": "ℹ️"}.get(f.severity, "")
        lines.append(f"| {emoji} {f.severity} | `{f.file}` | {f.line} | {f.pattern_name} | `{f.masked_value}` |")

    lines += [
        "\n## Recommended Actions",
        "1. **Immediately rotate** any exposed credentials.",
        "2. Add secrets to a secrets manager (e.g. AWS Secrets Manager, GCP Secret Manager, HashiCorp Vault).",
        "3. Add `scripts/secrets_scan.py --ci --fail-on-any` as a pre-commit hook.",
        "4. Add the affected files to `.gitignore` if they are config files.",
        "5. Audit git history for previously committed secrets: `git log -p | grep -E 'AKIA|sk_live|AIza'`",
    ]

    Path(path).write_text("\n".join(lines), encoding="utf-8")
    return path

def main():
    parser = argparse.ArgumentParser(description="Secrets Scanner")
    parser.add_argument("path", nargs="?", default=".", help="Root path")
    parser.add_argument("--output", default="review_output", help="Output dir")
    parser.add_argument("--ci", action="store_true", help="Output JSON")
    parser.add_argument("--fail-on-any", action="store_true", help="Exit 1 if any finding")
    args = parser.parse_args()

    files = get_files(args.path)
    print(f"🔍 Scanning {len(files)} files for secrets …", file=sys.stderr)

    all_findings: List[SecretFinding] = []
    for f in files:
        all_findings.extend(scan_file(f))

    report_path = write_report(all_findings, args.output)

    if args.ci:
        print(json.dumps({
            "findings": len(all_findings),
            "critical": sum(1 for f in all_findings if f.severity == "critical"),
            "high":     sum(1 for f in all_findings if f.severity == "high"),
            "report":   report_path,
        }, indent=2))
    else:
        print(f"✅ Secrets scan complete. Report: {report_path}")
        print(f"🚨 Critical: {sum(1 for f in all_findings if f.severity == 'critical')}")

    if args.fail_on_any and all_findings:
        sys.exit(1)

if __name__ == "__main__":
    main()
