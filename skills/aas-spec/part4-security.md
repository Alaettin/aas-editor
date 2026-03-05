# AAS Part 4 — Security (IDTA-01004, V3.0)

Definiert das Access Control Model für die AAS. Ermöglicht feingranulare Zugriffssteuerung auf AAS-Ressourcen basierend auf Attribute-Based Access Control (ABAC).

---

## 1. Grundkonzepte

### Authentifizierung vs. Autorisierung
- **Authentifizierung:** Identität des Anfragenden verifizieren (z.B. via OAuth2, X.509)
- **Autorisierung:** Berechtigungen prüfen basierend auf Access Rules

### ABAC (Attribute-Based Access Control)
Zugriffsregeln werden über Attribute definiert, nicht über feste Rollen:
- **Subject-Attribute:** Wer darf? (User-ID, Gruppen, Rollen, Organisationen)
- **Resource-Attribute:** Worauf? (AAS, Submodel, SubmodelElement, Property)
- **Action-Attribute:** Was tun? (Read, Write, Execute, Delete)
- **Condition-Attribute:** Unter welchen Bedingungen? (Zeit, Kontext)

---

## 2. Access Rule Model

### AccessRule Struktur
```
AccessRule
  subject: SubjectAttributes      ← Wer
  resource: ResourceAttributes    ← Worauf
  action: Action                  ← Was
  effect: Effect                  ← Allow | Deny
  condition: Condition            ← Wann (optional)
```

### SubjectAttributes
Identifizieren den Anfragenden:
```
- subjectId: Identifier           ← Eindeutige ID des Subjects
- role: string                    ← Rolle (z.B. "operator", "maintenance")
- group: string                   ← Gruppenmitgliedschaft
- organization: string            ← Organisation
- customAttributes: Key-Value[]   ← Erweiterbare Attribute
```

### ResourceAttributes
Identifizieren die geschützte Ressource:
```
- aasId: Identifier               ← AAS-ID (oder Wildcard *)
- submodelId: Identifier          ← Submodel-ID (oder Wildcard *)
- submodelElementPath: string     ← idShort-Pfad (oder Wildcard *)
- attributeNames: string[]        ← Spezifische Attribute (selektive Disclosure)
```

### Actions
```
Read      ← Lesen (GET)
Write     ← Schreiben (POST, PUT, PATCH)
Execute   ← Operationen ausführen (Invoke)
Delete    ← Löschen (DELETE)
```

### Effect
```
Allow     ← Zugriff erlaubt
Deny      ← Zugriff verweigert (hat Vorrang bei Konflikten)
```

---

## 3. Zugriffsebenen

### Registry-Level
Steuert, welche AAS/Submodel-Descriptors sichtbar sind:
- Globale Sichtbarkeit: Alle oder keine Descriptors
- Selektive Sichtbarkeit: Nur bestimmte Descriptors für bestimmte Subjects
- Attribut-Filterung: Bestimmte Descriptor-Felder ausblenden

### Repository-Level
Steuert den Zugriff auf die eigentlichen AAS-Daten:
- AAS-Level: Zugriff auf einzelne Shells
- Submodel-Level: Zugriff auf einzelne Submodels
- SubmodelElement-Level: Zugriff auf einzelne Properties/Collections
- Attribut-Level: Selektive Disclosure einzelner Felder

---

## 4. Regelauswertung

### Priorität
1. Explizite `Deny`-Regeln haben Vorrang vor `Allow`-Regeln
2. Spezifischere Regeln haben Vorrang vor allgemeineren
3. Keine passende Regel → Default: **Deny** (Closed-World Assumption)

### Regel-Matching
```
Anfrage: { subject: "user:alice", resource: "/shells/abc/submodels/xyz", action: "Read" }

Regel 1: { subject: "user:alice", resource: "/shells/*", action: "Read", effect: "Allow" }
  → Matcht ✓ → Allow

Regel 2: { subject: "*", resource: "/shells/abc/submodels/xyz/submodel-elements/Secret*", action: "*", effect: "Deny" }
  → Matcht nicht (anderer Pfad) → Skip
```

---

## 5. Selektive Disclosure

Ermöglicht das Ausblenden bestimmter Attribute in Antworten:
```json
{
  "subject": { "role": "external-viewer" },
  "resource": {
    "submodelId": "urn:example:sm:technical-data",
    "attributeNames": ["value", "description"]
  },
  "action": "Read",
  "effect": "Allow"
}
```
→ Der externe Viewer sieht nur `value` und `description`, nicht `idShort`, `semanticId` etc.

---

## 6. JSON-Serialisierung (Beispiel)

```json
{
  "accessRules": [
    {
      "subject": {
        "subjectId": "user:operator-1",
        "role": "operator"
      },
      "resource": {
        "aasId": "urn:example:aas:pump-1",
        "submodelId": "*",
        "submodelElementPath": "*"
      },
      "action": "Read",
      "effect": "Allow"
    },
    {
      "subject": {
        "role": "maintenance"
      },
      "resource": {
        "aasId": "urn:example:aas:pump-1",
        "submodelId": "urn:example:sm:maintenance-log"
      },
      "action": ["Read", "Write"],
      "effect": "Allow"
    },
    {
      "subject": {
        "subjectId": "*"
      },
      "resource": {
        "submodelId": "urn:example:sm:secret-data"
      },
      "action": "*",
      "effect": "Deny"
    }
  ]
}
```

---

## 7. Relevanz für den AAS Editor

Für den Canvas Editor sind folgende Security-Aspekte relevant:

| Aspekt | Anwendung |
|--------|-----------|
| Multi-Tenancy | Tenant-basierte Isolation über JWT Claims |
| API Key Auth | Externe Systeme greifen auf Tenant-API zu |
| Submodel-Level Access | Bestimmte Submodels nur für bestimmte Rollen sichtbar |
| Read-Only Sharing | Viewer-Rolle für geteilte AAS-Templates |
| Selective Disclosure | Export ohne sensible Properties |
