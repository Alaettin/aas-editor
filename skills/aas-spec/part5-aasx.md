# AAS Part 5 — Package File Format AASX (IDTA-01005, V3.1)

Definiert das AASX-Dateiformat zum Austausch von AAS-Daten als eigenständige Pakete. AASX basiert auf Open Packaging Conventions (OPC) und ist ein ZIP-Archiv mit definierter Struktur.

---

## 1. Was ist AASX?

- **AASX = ZIP-Archiv** mit definierter interner Struktur
- Enthält AAS-Serialisierungen (JSON oder XML) + Zusatzdateien (PDFs, Bilder, CAD etc.)
- Basiert auf **OPC (Open Packaging Conventions)** — dasselbe Format wie .docx, .xlsx, .pptx
- Dateierweiterung: `.aasx`
- MIME-Type: `application/asset-administration-shell-package+xml`

---

## 2. Paketstruktur

```
package.aasx (ZIP)
│
├── [Content_Types].xml                          ← PFLICHT: Content-Type-Mapping
│
├── _rels/
│   └── .rels                                    ← PFLICHT: Root Relationships
│
├── aasx/
│   ├── aasx-origin                              ← PFLICHT: Origin-Marker (leer)
│   │
│   ├── _rels/
│   │   └── aasx-origin.rels                     ← PFLICHT: AAS Relationships
│   │
│   └── xml/                                     ← AAS-Serialisierung
│       └── aas_env.json                         ← ODER aas_env.xml
│
└── aasx/                                        ← Zusatzdateien
    └── files/
        ├── thumbnail.png                        ← Vorschaubild
        ├── datasheet.pdf                        ← Datenblatt
        └── cad_model.step                       ← CAD-Datei
```

---

## 3. [Content_Types].xml

Definiert MIME-Types für alle Dateien im Paket:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="json" ContentType="application/json"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Default Extension="jpg" ContentType="image/jpeg"/>
  <Default Extension="pdf" ContentType="application/pdf"/>
  <Override PartName="/aasx/aasx-origin" ContentType="text/plain"/>
</Types>
```

### Regeln
- `<Default>` → gilt für alle Dateien mit dieser Extension
- `<Override>` → gilt für eine spezifische Datei (PartName)
- Jede Datei im Paket MUSS einen Content-Type haben (via Default oder Override)

---

## 4. Root Relationships (`_rels/.rels`)

Definiert die Beziehung vom Paket-Root zum AAS-Origin:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship
    Type="http://www.admin-shell.io/aasx/relationships/aasx-origin"
    Target="/aasx/aasx-origin"
    Id="rId1"/>
</Relationships>
```

---

## 5. AAS Origin (`aasx/aasx-origin`)

- **Leere Datei** (0 Bytes) — dient nur als Ankerpunkt
- Alle AAS-Daten werden über dessen Relationships verlinkt

---

## 6. AAS Origin Relationships (`aasx/_rels/aasx-origin.rels`)

Verlinkt die AAS-Serialisierung und optionale Zusatzdateien:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <!-- AAS Environment (JSON oder XML) -->
  <Relationship
    Type="http://www.admin-shell.io/aasx/relationships/aas-spec"
    Target="/aasx/xml/aas_env.json"
    Id="rId1"/>

  <!-- Thumbnail (optional) -->
  <Relationship
    Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/thumbnail"
    Target="/aasx/files/thumbnail.png"
    Id="rId2"/>

  <!-- Supplementary Files (optional, pro Datei ein Eintrag) -->
  <Relationship
    Type="http://www.admin-shell.io/aasx/relationships/aas-suppl"
    Target="/aasx/files/datasheet.pdf"
    Id="rId3"/>
</Relationships>
```

### Relationship Types

| Type-URI | Bedeutung |
|----------|-----------|
| `http://www.admin-shell.io/aasx/relationships/aasx-origin` | Root → Origin |
| `http://www.admin-shell.io/aasx/relationships/aas-spec` | Origin → AAS-Datei (JSON/XML) |
| `http://www.admin-shell.io/aasx/relationships/aas-suppl` | Origin → Zusatzdatei |
| `http://schemas.openxmlformats.org/package/2006/relationships/metadata/thumbnail` | Origin → Thumbnail |

---

## 7. AAS JSON-Serialisierung (Part 1, Annex)

Die JSON-Datei im AASX enthält ein **Environment**-Objekt:

```json
{
  "assetAdministrationShells": [
    {
      "id": "urn:example:aas:1",
      "idShort": "MyAAS",
      "modelType": "AssetAdministrationShell",
      "assetInformation": {
        "assetKind": "Instance",
        "globalAssetId": "urn:example:asset:1",
        "defaultThumbnail": {
          "path": "/aasx/files/thumbnail.png",
          "contentType": "image/png"
        }
      },
      "submodels": [
        {
          "type": "ModelReference",
          "keys": [{ "type": "Submodel", "value": "urn:example:sm:1" }]
        }
      ]
    }
  ],
  "submodels": [
    {
      "id": "urn:example:sm:1",
      "idShort": "TechnicalData",
      "modelType": "Submodel",
      "semanticId": {
        "type": "ExternalReference",
        "keys": [{ "type": "GlobalReference", "value": "https://admin-shell.io/ZVEI/TechnicalData/Submodel/1/2" }]
      },
      "submodelElements": [
        {
          "idShort": "MaxTemp",
          "modelType": "Property",
          "valueType": "xs:double",
          "value": "85.0",
          "semanticId": {
            "type": "ExternalReference",
            "keys": [{ "type": "GlobalReference", "value": "0173-1#02-AAB381#012" }]
          }
        },
        {
          "idShort": "ProductImage",
          "modelType": "File",
          "contentType": "image/png",
          "value": "/aasx/files/product.png"
        }
      ]
    }
  ],
  "conceptDescriptions": [
    {
      "id": "0173-1#02-AAB381#012",
      "modelType": "ConceptDescription",
      "embeddedDataSpecifications": [
        {
          "dataSpecification": {
            "type": "ExternalReference",
            "keys": [{ "type": "GlobalReference", "value": "https://admin-shell.io/DataSpecificationTemplates/DataSpecificationIec61360/3/0" }]
          },
          "dataSpecificationContent": {
            "preferredName": [
              { "language": "en", "text": "Max. operating temperature" },
              { "language": "de", "text": "Max. Betriebstemperatur" }
            ],
            "unit": "°C",
            "dataType": "REAL_MEASURE"
          }
        }
      ]
    }
  ]
}
```

### JSON-Regeln
- **modelType** Feld identifiziert den Typ jedes Objekts
- **Referenzen** verwenden `type` + `keys[]` Struktur
- **Dateipfade** in File/Blob-Elementen verweisen auf Pfade innerhalb des AASX-Pakets
- **Reihenfolge** der Felder ist nicht relevant
- **Null-Werte** werden weggelassen (nicht als `null` serialisiert)

---

## 8. AAS XML-Serialisierung

```xml
<?xml version="1.0" encoding="UTF-8"?>
<environment xmlns="https://admin-shell.io/aas/3/0">
  <assetAdministrationShells>
    <assetAdministrationShell>
      <id>urn:example:aas:1</id>
      <idShort>MyAAS</idShort>
      <assetInformation>
        <assetKind>Instance</assetKind>
        <globalAssetId>urn:example:asset:1</globalAssetId>
      </assetInformation>
      <submodels>
        <reference>
          <type>ModelReference</type>
          <keys>
            <key>
              <type>Submodel</type>
              <value>urn:example:sm:1</value>
            </key>
          </keys>
        </reference>
      </submodels>
    </assetAdministrationShell>
  </assetAdministrationShells>
  <submodels>
    <!-- ... -->
  </submodels>
  <conceptDescriptions>
    <!-- ... -->
  </conceptDescriptions>
</environment>
```

### XML-Regeln
- Root-Element: `<environment>`
- Namespace: `https://admin-shell.io/aas/3/0`
- Element-Namen: camelCase (wie JSON-Keys)
- Typ-Diskriminierung: über Element-Name (z.B. `<property>`, `<submodelElementCollection>`)

---

## 9. Import-Ablauf (für Editor)

```
1. Datei empfangen (.aasx / .json / .xml)
2. Format erkennen:
   a. .aasx → JSZip.loadAsync(file) → entpacken
   b. .json → JSON.parse() → direkt als Environment
   c. .xml  → fast-xml-parser → Environment-Objekt

3. Bei AASX:
   a. _rels/.rels lesen → aasx-origin finden
   b. aasx/_rels/aasx-origin.rels lesen → aas-spec Relationship finden
   c. AAS-Datei laden (JSON oder XML)
   d. Supplementary Files merken (Pfad → Blob-Mapping)

4. Environment parsen:
   a. assetAdministrationShells[] → AAS-Nodes
   b. submodels[] → Submodel-Nodes
   c. conceptDescriptions[] → CD-Nodes
   d. Referenzen auflösen (Shell.submodels → Submodel verlinken)
   e. File/Blob-Pfade → auf Supplementary Files mappen

5. Canvas-Layout generieren (Auto-Layout)
```

---

## 10. Export-Ablauf (für Editor)

```
1. Canvas-State → Environment-Objekt serialisieren
   a. Interne Felder strippen (_uid, position, etc.)
   b. Leere optionale Felder weglassen

2. JSON-Export:
   → JSON.stringify(environment, null, 2) → Download als .json

3. AASX-Export:
   a. JSZip erstellen
   b. [Content_Types].xml generieren
   c. _rels/.rels → aasx-origin Relationship
   d. aasx/aasx-origin → leere Datei
   e. aasx/_rels/aasx-origin.rels → aas-spec + aas-suppl Relationships
   f. aasx/xml/aas_env.json → Environment JSON
   g. Supplementary Files hinzufügen (Thumbnails, referenzierte Dateien)
   h. ZIP generieren → Download als .aasx

4. XML-Export:
   → fast-xml-parser.Builder → Download als .xml
```

---

## 11. Minimales AASX-Paket (Code-Beispiel)

```typescript
import JSZip from 'jszip';

function createMinimalAasx(environment: AasEnvironment): Blob {
  const zip = new JSZip();

  // [Content_Types].xml
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="json" ContentType="application/json"/>
  <Override PartName="/aasx/aasx-origin" ContentType="text/plain"/>
</Types>`);

  // _rels/.rels
  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Type="http://www.admin-shell.io/aasx/relationships/aasx-origin" Target="/aasx/aasx-origin" Id="rId1"/>
</Relationships>`);

  // aasx-origin (leere Datei)
  zip.file('aasx/aasx-origin', '');

  // aasx-origin relationships
  zip.file('aasx/_rels/aasx-origin.rels', `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Type="http://www.admin-shell.io/aasx/relationships/aas-spec" Target="/aasx/xml/aas_env.json" Id="rId1"/>
</Relationships>`);

  // AAS Environment JSON
  zip.file('aasx/xml/aas_env.json', JSON.stringify(environment, null, 2));

  return zip.generateAsync({ type: 'blob' });
}
```
