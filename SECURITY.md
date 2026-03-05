# Sicherheit — AAS Canvas Editor

## Architektur

```
Browser ──(HTTPS)──▸ Supabase Auth (Login, Register)
       ──(HTTPS)──▸ Supabase DB   (Projekte, API-Daten) ← RLS schützt Zugriff
       ──(HTTP) ──▸ Express API    (öffentliche AAS V3 Endpoints)
```

| Schicht | Technologie | Authentifizierung |
|---------|-------------|-------------------|
| Frontend | React + Supabase JS | JWT via `supabase.auth` |
| Datenbank | Supabase (PostgreSQL) | Row Level Security (RLS) |
| Backend API | Express.js | Keine (öffentlich by design) |

## Implementierte Maßnahmen

### Authentifizierung
- **Supabase Auth** — E-Mail + Passwort, JWT-basiert
- Frontend nutzt den **Anon Key** (`sb_publishable_*`) — öffentlich, eingeschränkt durch RLS
- Backend nutzt den **Service Role Key** (`sb_secret_*`) — nur serverseitig, nie an den Client

### Datenbank-Isolierung (RLS)
Row Level Security auf allen Tabellen stellt sicher, dass Benutzer nur ihre eigenen Daten sehen.

**Erforderliche Policies (Supabase Dashboard → Authentication → Policies):**

| Tabelle | Policy | Regel |
|---------|--------|-------|
| `projects` | SELECT / INSERT / UPDATE / DELETE | `auth.uid() = user_id` |
| `api_shells` | SELECT / INSERT / DELETE | `auth.uid() = user_id` |
| `api_submodels` | SELECT / INSERT / DELETE | `auth.uid() = user_id` |

> **Wichtig:** Ohne RLS kann jeder authentifizierte Benutzer alle Daten aller Benutzer lesen. RLS im Supabase Dashboard unter Table Editor → Policies prüfen.

### Backend API (Express)
- **Helmet** — setzt Security-Headers (CSP, X-Frame-Options, HSTS, X-Content-Type-Options)
- **Rate Limiting** — 100 Requests / Minute pro IP (`express-rate-limit`)
- **UUID-Validierung** — `userId` Parameter wird auf UUID-Format geprüft (400 bei ungültigem Format)
- **Input-Längenbegrenzung** — Base64-decoded IDs maximal 500 Zeichen
- **Fehler-Anonymisierung** — Interne Supabase-Fehler werden nur geloggt, der Client bekommt `"Interner Serverfehler"`
- **CORS** — Aktuell offen (`*`), für Produktion auf die Frontend-Domain einschränken

### Bot-Schutz (Cloudflare Turnstile)
- **CAPTCHA** auf Login- und Register-Seite via Cloudflare Turnstile (Supabase-native Integration)
- **Optional:** Wenn `VITE_TURNSTILE_SITE_KEY` nicht gesetzt ist, wird das Widget nicht gerendert und Login funktioniert normal
- **Aktivierung:** Cloudflare Dashboard → Turnstile → Site Key erstellen, dann in Supabase Dashboard → Auth → Bot Protection → Turnstile Secret Key eintragen

### Frontend
- **Kein XSS** — React JSX escaped alle Werte automatisch, kein `dangerouslySetInnerHTML`
- **Kein `eval()`** — Nirgends verwendet
- **Supabase SDK** — Parametrisierte Queries, kein SQL-Injection-Risiko
- **Projektname** — Auf 100 Zeichen begrenzt (Frontend + Store)

## Secrets-Management

### `.env` Dateien
| Datei | Enthält | In Git? |
|-------|---------|---------|
| `frontend/.env` | Supabase URL, Anon Key, API URL, Turnstile Key | Nein (`.gitignore`) |
| `backend/.env` | Supabase URL, Service Role Key, Port | Nein (`.gitignore`) |
| `*.env.example` | Platzhalter ohne echte Keys | Ja |

### Regeln
- `.env` und `.env.*` sind in `.gitignore` — nie committen
- Service Role Key **nie** im Frontend oder in Client-Code verwenden
- Bei Verdacht auf Key-Leak: Sofort im Supabase Dashboard rotieren (Settings → API)

## API-Sicherheit

Die Backend-API (`/:userId/shells`, `/:userId/submodels`) ist **öffentlich by design** — sie dient als AAS V3 Repository für Dritte. Jeder der die User-ID kennt kann die publizierten Shells/Submodels lesen.

**Schutzmaßnahmen:**
- Nur publizierte Daten sind sichtbar (nicht alle Projektdaten)
- Rate Limiting verhindert Massen-Scraping
- UUID-Validierung verhindert ungültige Queries
- Keine Schreib-Endpoints — rein lesend

## Deployment-Checkliste

- [x] RLS auf allen Tabellen aktiviert und Policies gesetzt
- [x] `backend/.env` mit echtem Service Role Key (nicht committet)
- [x] `frontend/.env` mit echtem Anon Key (nicht committet)
- [ ] CORS im Backend auf Frontend-Domain einschränken
- [ ] HTTPS für Backend-API (z.B. hinter Nginx/Caddy Reverse Proxy)
- [x] Supabase-Projekt: E-Mail-Bestätigung aktiviert
- [x] Service Role Key rotiert

## Bekannte Einschränkungen

| Thema | Status | Risiko |
|-------|--------|--------|
| CORS offen (`*`) | Akzeptabel für Entwicklung | In Produktion einschränken |
| Keine E-Mail-Enumeration-Schutz | Supabase-Standard | Niedrig |
| CAPTCHA bei Login/Register | Cloudflare Turnstile implementiert (optional) | Erledigt |
| Projektname-Längenlimit | Max 100 Zeichen (Frontend + Store) | Erledigt |
| API ohne Auth | By design (öffentliches Repository) | Akzeptiert |
