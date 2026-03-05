# AAS Part 2 — Application Programming Interfaces (IDTA-01002, V3.1)

HTTP/REST API Spezifikation für AAS-Dienste. Definiert alle Endpunkte, Service-Profile und Interaktionsmuster.

---

## 1. Service-Interfaces (Übersicht)

| Interface | Beschreibung |
|-----------|-------------|
| **AAS Repository** | CRUD für mehrere Asset Administration Shells |
| **Submodel Repository** | CRUD für mehrere Submodels |
| **ConceptDescription Repository** | CRUD für ConceptDescriptions |
| **AAS Service** | Operationen auf einer einzelnen AAS |
| **Submodel Service** | Operationen auf einem einzelnen Submodel |
| **AAS Registry** | Registrierung und Discovery von AAS Descriptors |
| **Submodel Registry** | Registrierung und Discovery von Submodel Descriptors |
| **AAS Discovery** | Suche nach AAS anhand von Asset-IDs |
| **Serialization API** | Export eines kompletten AAS Environment |
| **Description API** | Self-Description des Servers (Capabilities) |

---

## 2. AAS Repository API

Base Path: `/shells`

| Method | Pfad | Beschreibung | Status |
|--------|------|-------------|--------|
| GET | `/shells` | Alle Shells auflisten | 200 |
| POST | `/shells` | Neue Shell anlegen | 201 |
| GET | `/shells/{aasIdentifier}` | Shell abrufen | 200 |
| PUT | `/shells/{aasIdentifier}` | Shell aktualisieren | 204 |
| DELETE | `/shells/{aasIdentifier}` | Shell löschen | 204 |
| GET | `/shells/{aasIdentifier}/asset-information` | AssetInformation abrufen | 200 |
| PUT | `/shells/{aasIdentifier}/asset-information` | AssetInformation aktualisieren | 204 |
| GET | `/shells/{aasIdentifier}/asset-information/thumbnail` | Thumbnail abrufen | 200 |
| PUT | `/shells/{aasIdentifier}/asset-information/thumbnail` | Thumbnail setzen | 204 |
| DELETE | `/shells/{aasIdentifier}/asset-information/thumbnail` | Thumbnail löschen | 204 |
| GET | `/shells/{aasIdentifier}/submodel-refs` | Submodel-Referenzen auflisten | 200 |
| POST | `/shells/{aasIdentifier}/submodel-refs` | Submodel-Referenz hinzufügen | 201 |
| DELETE | `/shells/{aasIdentifier}/submodel-refs/{submodelIdentifier}` | Submodel-Referenz entfernen | 204 |

**Hinweis:** `{aasIdentifier}` und `{submodelIdentifier}` sind Base64URL-kodierte Identifier.

---

## 3. Submodel Repository API

Base Path: `/submodels`

| Method | Pfad | Beschreibung | Status |
|--------|------|-------------|--------|
| GET | `/submodels` | Alle Submodels auflisten | 200 |
| POST | `/submodels` | Neues Submodel anlegen | 201 |
| GET | `/submodels/{submodelIdentifier}` | Submodel abrufen | 200 |
| PUT | `/submodels/{submodelIdentifier}` | Submodel aktualisieren | 204 |
| DELETE | `/submodels/{submodelIdentifier}` | Submodel löschen | 204 |
| PATCH | `/submodels/{submodelIdentifier}` | Submodel teilweise aktualisieren | 204 |

### SubmodelElements (verschachtelt unter Submodel)

| Method | Pfad | Beschreibung | Status |
|--------|------|-------------|--------|
| GET | `/submodels/{id}/submodel-elements` | Alle Elemente auflisten | 200 |
| POST | `/submodels/{id}/submodel-elements` | Element anlegen | 201 |
| GET | `/submodels/{id}/submodel-elements/{idShortPath}` | Element per Pfad abrufen | 200 |
| PUT | `/submodels/{id}/submodel-elements/{idShortPath}` | Element aktualisieren | 204 |
| POST | `/submodels/{id}/submodel-elements/{idShortPath}` | Kind-Element anlegen | 201 |
| DELETE | `/submodels/{id}/submodel-elements/{idShortPath}` | Element löschen | 204 |
| PATCH | `/submodels/{id}/submodel-elements/{idShortPath}` | Element teilweise aktualisieren | 204 |

### idShortPath-Format
Verschachtelte Elemente werden per Punkt-Pfad adressiert:
```
/submodel-elements/Collection1.Property1          ← Element in Collection
/submodel-elements/List1[0]                       ← Erstes Element in List
/submodel-elements/Collection1.List1[2].Property1 ← Tief verschachtelt
```

### Datei-Operationen (File/Blob-Elemente)

| Method | Pfad | Beschreibung |
|--------|------|-------------|
| GET | `.../{idShortPath}/attachment` | Datei herunterladen |
| PUT | `.../{idShortPath}/attachment` | Datei hochladen |
| DELETE | `.../{idShortPath}/attachment` | Datei löschen |

### Operation-Aufruf

| Method | Pfad | Beschreibung |
|--------|------|-------------|
| POST | `.../{idShortPath}/invoke` | Operation synchron ausführen |
| POST | `.../{idShortPath}/invoke-async` | Operation asynchron starten |
| GET | `.../{idShortPath}/operation-status/{handleId}` | Async-Status abfragen |
| GET | `.../{idShortPath}/operation-results/{handleId}` | Async-Ergebnis abholen |

---

## 4. ConceptDescription Repository API

Base Path: `/concept-descriptions`

| Method | Pfad | Beschreibung | Status |
|--------|------|-------------|--------|
| GET | `/concept-descriptions` | Alle CDs auflisten | 200 |
| POST | `/concept-descriptions` | Neue CD anlegen | 201 |
| GET | `/concept-descriptions/{cdIdentifier}` | CD abrufen | 200 |
| PUT | `/concept-descriptions/{cdIdentifier}` | CD aktualisieren | 204 |
| DELETE | `/concept-descriptions/{cdIdentifier}` | CD löschen | 204 |

---

## 5. Serialization API

| Method | Pfad | Beschreibung |
|--------|------|-------------|
| GET | `/serialization` | Komplettes AAS Environment exportieren |

**Query-Parameter:**
- `aasIds` — Base64URL-kodierte AAS-IDs (kommasepariert)
- `submodelIds` — Base64URL-kodierte Submodel-IDs (kommasepariert)
- `includeConceptDescriptions` — boolean (default: true)

**Accept-Header:**
- `application/json` → AAS JSON
- `application/xml` → AAS XML
- `application/asset-administration-shell-package+xml` → AASX

---

## 6. AAS Registry API

Base Path: `/shell-descriptors`

| Method | Pfad | Beschreibung |
|--------|------|-------------|
| GET | `/shell-descriptors` | Alle AAS Descriptors auflisten |
| POST | `/shell-descriptors` | AAS Descriptor registrieren |
| GET | `/shell-descriptors/{aasIdentifier}` | AAS Descriptor abrufen |
| PUT | `/shell-descriptors/{aasIdentifier}` | AAS Descriptor aktualisieren |
| DELETE | `/shell-descriptors/{aasIdentifier}` | AAS Descriptor löschen |
| GET | `/shell-descriptors/{aasIdentifier}/submodel-descriptors` | Submodel Descriptors auflisten |
| POST | `/shell-descriptors/{aasIdentifier}/submodel-descriptors` | Submodel Descriptor hinzufügen |
| GET | `/shell-descriptors/{aasIdentifier}/submodel-descriptors/{smId}` | Submodel Descriptor abrufen |
| PUT | `/shell-descriptors/{aasIdentifier}/submodel-descriptors/{smId}` | Submodel Descriptor aktualisieren |
| DELETE | `/shell-descriptors/{aasIdentifier}/submodel-descriptors/{smId}` | Submodel Descriptor entfernen |

### AssetAdministrationShellDescriptor
```json
{
  "id": "urn:example:aas:1",
  "idShort": "MyAAS",
  "assetKind": "Instance",
  "globalAssetId": "urn:example:asset:1",
  "endpoints": [{
    "protocolInformation": {
      "href": "https://example.com/api/v3.0/shells/dXJuOmV4YW1wbGU6YWFzOjE",
      "endpointProtocol": "HTTP",
      "endpointProtocolVersion": ["1.1"]
    },
    "interface": "AAS-3.0"
  }],
  "submodelDescriptors": [...]
}
```

---

## 7. Submodel Registry API

Base Path: `/submodel-descriptors`

| Method | Pfad | Beschreibung |
|--------|------|-------------|
| GET | `/submodel-descriptors` | Alle Submodel Descriptors auflisten |
| POST | `/submodel-descriptors` | Submodel Descriptor registrieren |
| GET | `/submodel-descriptors/{submodelIdentifier}` | Submodel Descriptor abrufen |
| PUT | `/submodel-descriptors/{submodelIdentifier}` | Submodel Descriptor aktualisieren |
| DELETE | `/submodel-descriptors/{submodelIdentifier}` | Submodel Descriptor löschen |

---

## 8. AAS Discovery API

Base Path: `/lookup`

| Method | Pfad | Beschreibung |
|--------|------|-------------|
| GET | `/lookup/shells` | AAS-IDs anhand von Asset-IDs suchen |
| POST | `/lookup/shells` | SpecificAssetId zu einer AAS verknüpfen |
| DELETE | `/lookup/shells/{aasIdentifier}` | Alle Asset-Links einer AAS löschen |
| GET | `/lookup/shells/{aasIdentifier}` | Asset-Links einer AAS abrufen |

**Query-Parameter für GET `/lookup/shells`:**
- `assetIds` — Base64URL-kodierte SpecificAssetId-Paare

---

## 9. Description API

| Method | Pfad | Beschreibung |
|--------|------|-------------|
| GET | `/description` | Self-Description des Servers |

Antwort enthält die unterstützten Service-Profile (interfaces).

---

## 10. Pagination

Alle Listen-Endpunkte unterstützen Cursor-basierte Pagination:

**Request:**
```
GET /shells?limit=10&cursor=eyJpZCI6MTB9
```

**Response:**
```json
{
  "result": [...],
  "paging_metadata": {
    "cursor": "eyJpZCI6MjB9"
  }
}
```
- `limit` — Max. Ergebnisse pro Seite (Server kann eigenes Maximum erzwingen)
- `cursor` — Opaker Cursor-String für nächste Seite
- Wenn `paging_metadata.cursor` fehlt → letzte Seite

---

## 11. SerializationModifier

Query-Parameter die das Response-Format steuern:

### Level
| Wert | Beschreibung |
|------|-------------|
| `deep` | Vollständige Hierarchie (Default) |
| `core` | Nur direkte Kinder, keine Verschachtelung |

### Content
| Wert | Beschreibung |
|------|-------------|
| `normal` | Vollständiges Element (Default) |
| `metadata` | Nur Metadaten (kein value) |
| `value` | Nur Werte (kein modelType, idShort etc.) |
| `reference` | Nur Referenzen |
| `path` | Nur idShort-Pfade |

### Extent
| Wert | Beschreibung |
|------|-------------|
| `withBlobValue` | Blob-/File-Inhalte inline (Default) |
| `withoutBlobValue` | Blob-/File-Inhalte ausschließen |

**Beispiel:** `GET /submodels/{id}?level=core&content=value&extent=withoutBlobValue`

---

## 12. Error Response

Standard-Fehlerstruktur für alle Endpunkte:
```json
{
  "messages": [{
    "code": "404",
    "correlationId": "abc-123",
    "messageType": "Error",
    "text": "Submodel not found",
    "timestamp": "2025-01-15T10:30:00Z"
  }]
}
```

### HTTP Status Codes

| Code | Verwendung |
|------|-----------|
| 200 | Erfolgreiche GET-Anfrage |
| 201 | Ressource erfolgreich erstellt (POST) |
| 204 | Erfolgreich, kein Content (PUT, DELETE) |
| 400 | Ungültige Anfrage (Validierungsfehler) |
| 401 | Nicht authentifiziert |
| 403 | Nicht autorisiert |
| 404 | Ressource nicht gefunden |
| 409 | Konflikt (z.B. ID existiert bereits) |
| 500 | Server-Fehler |

---

## 13. Identifier-Encoding

Alle Identifier in URL-Pfaden müssen **Base64URL-kodiert** werden (RFC 4648, ohne Padding):
```
Identifier: urn:example:submodel:1
Base64URL:  dXJuOmV4YW1wbGU6c3VibW9kZWw6MQ

URL: /submodels/dXJuOmV4YW1wbGU6c3VibW9kZWw6MQ
```

---

## 14. Content-Types

| Content-Type | Beschreibung |
|-------------|-------------|
| `application/json` | AAS JSON (Standard) |
| `application/xml` | AAS XML |
| `application/asset-administration-shell-package+xml` | AASX Paket |
| `multipart/form-data` | Datei-Upload (Thumbnail, Attachment) |
