# Security Hardening

## Status: COMPLETE

## Implementiert

### KRITISCH
- [x] K1: CORS konfiguriert — `CORS_ORIGIN` env var wird jetzt genutzt
- [x] K2: Body-Size-Limit — `express.json({ limit: '1mb' })`
- [x] K3: Negativer limit-Parameter — `Math.max(1, Math.min(..., 100))`
- [x] K4: nginx Security Headers — CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- [x] K5: Logout Cleanup — sessionStorage + alle Stores werden geleert

### HOCH
- [x] H1: Gemini Key als Header — nicht mehr als URL-Parameter
- [x] H2: RLS-Policies als SQL — `supabase/migrations/001_enable_rls.sql`
- [x] H3: Defense-in-Depth — explizite `user_id` Filter in allen Queries
- [x] H4: URL-Validierung — private IPs und Cloud-Metadata blockiert

### MITTEL
- [x] M1: Per-userId Rate Limiting — 20 req/min pro userId+IP
- [x] M2: Signierte Cursor — HMAC-signiert, Offset nicht manipulierbar
- [x] M3: Prompt Injection — Document Boundaries + explizite Warnung
- [x] M5: Passwort-Policy — 10 Zeichen, Gross/Klein + Zahl
- [ ] M4: Structured Logging — noch nicht implementiert (Winston/Pino)

### NIEDRIG
- [ ] N1: UUID-Enumeration Mitigation
- [ ] N2: security.txt
- [x] N3: HTTPS-Redirect im Backend (production mode)
- [ ] N4: Docker-Image Anon Key

## Verifizierung
- 329 Frontend-Tests gruen
- 21 Backend-Tests gruen
- 0 TypeScript-Fehler
- SECURITY.md aktualisiert
