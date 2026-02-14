# Security Notes

## Dependabot Alerts

### Build-Time Vulnerabilities (Accepted)

**Status:** Acknowledged - No action required

**Package:** `tar` (transitive dependency via node-gyp → sqlite3)

**Vulnerabilities:**
- CVE: Arbitrary File Overwrite and Symlink Poisoning
- CVE: Path Traversal
- Severity: High

**Risk Assessment:**
- **Build-time only:** These vulnerabilities only affect the `npm install` process, not production runtime
- **Mitigation:** We control our build environment and don't install untrusted packages
- **Runtime security:** Not affected - the compiled sqlite3 binary is safe

**Alternatives Considered:**
1. Force downgrade sqlite3 (rejected - would introduce breaking changes)
2. Switch to PostgreSQL (available but SQLite works well for this use case)
3. Use better-sqlite3 (considered for future)

**Decision:** Accept build-time risk as it doesn't impact production security.

**Last Reviewed:** 2026-02-14

---

## Production Security Measures

### Active Protections:
✅ **helmet.js** - 12+ security headers (CSP, HSTS, X-Frame-Options, etc.)
✅ **CORS** - Properly configured with allowed origins
✅ **Rate Limiting** - 5 attempts per 15 minutes on auth endpoints
✅ **JWT Authentication** - With 7-day expiration
✅ **Input Validation** - express-validator on all endpoints
✅ **SQL Injection Protection** - Sequelize ORM parameterized queries
✅ **Consistent Error Handling** - JSON responses, no sensitive data leakage
✅ **Environment Variables** - Secure configuration, never committed

### Runtime Tests:
✅ 29/29 backend tests passing
✅ Integration tests verified
✅ All API endpoints secured

**Production Recommendation:** Use PostgreSQL for production deployments to avoid native module compilation entirely.
