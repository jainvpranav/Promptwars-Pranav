---
name: review-testing
description: >
  Audits the test suite for coverage gaps, quality anti-patterns, missing
  test types (unit, integration, e2e), flaky tests, and inadequate edge-case
  coverage. Generates a concrete testing improvement plan and, where possible,
  scaffolds missing test files.
---

# Skill: Testing Review

## Purpose
Ensure that the codebase is backed by a trustworthy, comprehensive test suite
that catches regressions and validates behaviour — not just line coverage.

## When to Use
- Before any release or feature merge
- When coverage drops or CI becomes "green but broken"
- After major refactors
- Triggered by: "review tests", "testing review", "improve test coverage",
  "write tests", "check test quality"

---

## Execution Steps

### 1 — Coverage Analysis
Run `scripts/coverage_check.py` to collect:
- Overall line / branch / function coverage %
- Per-file coverage breakdown
- Files with 0% coverage
- Functions that are "tested" but without assertions (assertion-free tests)

Coverage targets (adjust if project defines its own):
| Layer | Minimum Target |
|---|---|
| Unit Tests | 80% line coverage |
| Integration Tests | Key user flows covered |
| E2E Tests | All critical paths (auth, checkout, etc.) |

### 2 — Test Quality Audit

For every existing test file, check for:

| Anti-Pattern | Description | Severity |
|---|---|---|
| No assertions | Test calls code but never asserts anything | High |
| Testing implementation | Asserting on internal state/private methods | High |
| Mocking too much | Mocks replace so much that the test proves nothing | High |
| Copy-paste tests | Identical tests with minor var changes (use parametrize) | Medium |
| Non-deterministic / flaky | Tests that use `sleep()`, real time, or random seeds | High |
| No edge cases | Only happy path tested; no nulls, empties, boundaries | High |
| Slow tests | Unit tests taking > 500ms (indicates missing mocks) | Medium |
| Magic test data | Unexplained hardcoded data without context | Low |
| Missing teardown | Tests pollute shared state (DB rows, global variables) | High |

### 3 — Test Type Coverage Matrix
Verify the presence of each test type:

| Type | Present? | Count | Notes |
|---|---|---|---|
| Unit Tests | ✅/❌ | N | |
| Integration Tests | ✅/❌ | N | |
| E2E / Browser Tests | ✅/❌ | N | |
| Contract Tests | ✅/❌ | N | |
| Performance/Load Tests | ✅/❌ | N | |
| Snapshot Tests | ✅/❌ | N | |
| Accessibility Tests | ✅/❌ | N | |

### 4 — Gap Identification
Cross-reference the code's critical paths against existing tests:
- Auth flows (login, logout, token refresh, MFA)
- Data mutations (create, update, delete)
- Error states (invalid input, network failure, timeout)
- Security boundaries (unauthorised access attempts)
- Edge cases (empty arrays, null users, max string length)

### 5 — Generate Missing Tests
For each high-priority gap, scaffold a test file using the project's existing
test framework (detect from `package.json` / `pytest.ini` / `jest.config.*`):

```typescript
// Example: auto-scaffolded test for auth service
describe('AuthService', () => {
  describe('login()', () => {
    it('should return a JWT token on valid credentials', async () => { /* … */ });
    it('should throw UnauthorizedException on wrong password', async () => { /* … */ });
    it('should throw UnauthorizedException on unknown user', async () => { /* … */ });
    it('should lock account after 5 failed attempts', async () => { /* … */ });
  });
});
```

### 6 — Compile the Testing Report
Write to `review_output/testing_report.md`:

```markdown
# Testing Review — {date}

## Coverage Summary
| Metric | Current | Target | Status |
|---|---|---|---|
| Line Coverage | N% | 80% | ⚠️ |
| Branch Coverage | N% | 70% | ✅ |
| Function Coverage | N% | 90% | ❌ |

## Test Quality Findings

### 🔴 HIGH — Assertion-Free Test in `{file}:{line}`
**Issue:** Test `{name}` contains no assertions.
**Fix:** Add `expect(result).toBe(expectedValue);`

## Test Gap Matrix
| Feature | Unit | Integration | E2E |
|---|---|---|---|
| User Auth | ✅ | ❌ | ❌ |
| Product CRUD | ✅ | ✅ | ❌ |

## Generated Test Stubs
- `tests/auth.service.spec.ts` — 4 test stubs scaffolded
- `tests/product.integration.spec.ts` — 2 integration test stubs

## Recommended Testing Roadmap
| Priority | Action | Effort |
|---|---|---|
| 1 | Add E2E tests for auth flow | 4h |
| 2 | Parametrize duplicate tests in X | 1h |
```

---

## Leveraging This Skill for Better Results

**Tip 1 — Coverage ≠ Quality**
A 100% coverage score with zero assertions is meaningless. Always run this
skill with the quality audit, not just the coverage number.

**Tip 2 — Mutation Testing**
After achieving > 80% coverage, run mutation testing (e.g. `stryker`) to
verify your tests actually catch bugs — not just exercise code paths.

**Tip 3 — Test Data Factories**
Replace magic test data with factories/fixtures (e.g. `factory_boy`, `faker`)
to make tests self-documenting and easier to maintain.

**Tip 4 — CI Enforcement**
Add `--coverageThreshold` to Jest / `--cov-fail-under` to pytest to
fail CI when coverage drops below your target.

**Tip 5 — Combine with Efficiency Review**
Slow tests slow down developers. After fixing test quality, profile your test
suite with `--verbose` and parallelise or mock expensive I/O.
