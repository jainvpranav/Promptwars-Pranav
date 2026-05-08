---
name: review-security
description: >
  Performs a comprehensive security audit of the codebase. Detects OWASP Top 10
  vulnerabilities, secrets/credentials leakage, injection flaws, insecure
  dependencies, misconfigured auth, and unsafe crypto practices. Outputs a
  prioritised remediation plan.
---

# Skill: Security Review

## Purpose
Find exploitable vulnerabilities and secret leaks **before** they reach
production, following OWASP Top 10 (2021) and SANS CWE Top 25.

## When to Use
- Pre-release security gates
- After adding new auth flows, file uploads, or external integrations
- When onboarding to a codebase that will handle PII / financial data
- Triggered by: "security review", "security audit", "find vulnerabilities", "check for secrets"

---

## Execution Steps

### 1 — Secrets & Credentials Scan
Run `scripts/secrets_scan.py` across all tracked files.

Look for:
- Hardcoded API keys, passwords, tokens (regex patterns)
- Private keys (PEM blocks)
- Connection strings with credentials embedded
- `.env` files accidentally committed (check `.gitignore`)
- AWS/GCP/Azure credential patterns

> **STOP and alert immediately** if any real secrets are found. Do not
> include secret values in the report; mask as `[REDACTED]`.

### 2 — OWASP Top 10 Check

| OWASP Category | What to Look For |
|---|---|
| A01 — Broken Access Control | Missing auth middleware, IDOR patterns, forced browsing paths |
| A02 — Cryptographic Failures | MD5/SHA1 for passwords, HTTP (not HTTPS), unencrypted sensitive storage |
| A03 — Injection | SQL/NoSQL string concatenation, unsanitised `exec()`/`eval()`, shell injection |
| A04 — Insecure Design | No rate limiting, missing CSRF tokens, business logic flaws |
| A05 — Security Misconfiguration | Debug mode enabled, CORS `*`, default credentials, verbose error messages |
| A06 — Vulnerable Components | Packages with known CVEs (cross-ref `package.json` / `requirements.txt`) |
| A07 — Auth Failures | Weak passwords policy, no MFA option, JWT `alg:none` |
| A08 — Software Integrity | No subresource integrity on CDN scripts, unsigned artefacts |
| A09 — Logging Failures | PII logged, no audit trail for sensitive ops, logs to stdout only |
| A10 — SSRF | User-supplied URLs fetched server-side without allowlist |

### 3 — Dependency Vulnerability Check
- For Node.js: parse `package.json` / `package-lock.json`, flag packages with
  known CVEs using the public advisories database snapshot in
  `resources/npm_advisories.json`.
- For Python: parse `requirements.txt` / `Pipfile`, flag using
  `resources/pypi_advisories.json`.

### 4 — Compile the Security Report
Write to `review_output/security_report.md`:

```markdown
# Security Review — {date}

## Risk Summary
- 🚨 Critical: N  |  🔴 High: N  |  🟡 Medium: N  |  🟢 Low: N
- Secrets found: YES/NO

## Critical & High Findings

### [CRITICAL] {CWE-ID} — {Title} — {file}:{line}
**OWASP Category:** A0X
**Description:** …
**Proof of Concept (safe):** `…`
**Remediation:**
\```diff
- vulnerable_code()
+ secure_code()
\```
**References:** CWE-XXX, OWASP ASVS 4.x.x

## Dependency Vulnerabilities
| Package | Version | CVE | Severity | Fix |
|---|---|---|---|---|

## Remediation Roadmap
| Priority | Finding | Effort | Owner |
|---|---|---|---|

## Compliance Notes
- GDPR: …
- SOC 2: …
- HIPAA (if applicable): …
```

### 5 — Fix & Verify
- Offer automated patch for any finding where a safe one-line fix exists.
- For complex findings, provide a step-by-step remediation guide.
- Re-run secrets scan after any fix to verify no regression.

---

## Leveraging This Skill for Better Results

**Tip 1 — Shift-Left Security**
Add `scripts/secrets_scan.py --ci --fail-on-any` as a git pre-commit hook so
secrets never reach the remote.

**Tip 2 — Pair with Code Quality Review**
Injection vulnerabilities are often buried in complex, untested code.
Running `review-code-quality` first surfaces the highest-risk areas.

**Tip 3 — Dependency Pinning**
After this review, pin all dependencies to exact versions and add
`npm audit` / `pip-audit` to your CI pipeline.

**Tip 4 — Threat Modelling**
Use the findings report as input into a STRIDE threat modelling session
with your team to prioritise remediation effort.

**Tip 5 — Schedule Regular Scans**
Security is not one-and-done. Schedule this skill to run on every PR
that touches auth, data access, or external integrations.
