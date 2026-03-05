# AAS Part 3a — Data Specification IEC 61360 (IDTA-01003-a, V3.1)

Definiert das DataSpecification-Template nach IEC 61360 für ConceptDescriptions. Dies ist das primäre Mittel zur semantischen Beschreibung von Properties im AAS-Kontext (z.B. über eCl@ss oder IEC CDD).

---

## 1. Einordnung im Metamodell

```
ConceptDescription
  └── embeddedDataSpecifications: EmbeddedDataSpecification[]
        ├── dataSpecification: Reference        ← Verweis auf IEC 61360 Template-ID
        └── dataSpecificationContent: DataSpecificationIec61360
```

Die Standard-Template-ID für IEC 61360:
```
https://admin-shell.io/DataSpecificationTemplates/DataSpecificationIec61360/3/0
```

---

## 2. EmbeddedDataSpecification

| Attribut | Typ | Kard. |
|----------|-----|-------|
| dataSpecification | Reference (ExternalReference) | **1** |
| dataSpecificationContent | DataSpecificationContent | **1** |

---

## 3. DataSpecificationIec61360

Erbt: DataSpecificationContent (abstract)

| Attribut | Typ | Kard. | Beschreibung |
|----------|-----|-------|--------------|
| preferredName | LangStringPreferredNameTypeIec61360[] | **1..\*** | Bevorzugter Name (mind. EN) |
| shortName | LangStringShortNameTypeIec61360[] | 0..* | Kurzname (max 18 Zeichen) |
| unit | string | 0..1 | Einheit (z.B. "°C", "mm", "kg") |
| unitId | Reference | 0..1 | Verweis auf Einheiten-Definition |
| sourceOfDefinition | string | 0..1 | Quelle der Definition |
| symbol | string | 0..1 | Formelzeichen |
| dataType | DataTypeIec61360 | 0..1 | Datentyp nach IEC 61360 |
| definition | LangStringDefinitionTypeIec61360[] | 0..* | Ausführliche Definition |
| valueFormat | string | 0..1 | Wertformat (z.B. "NR1..3" für Dezimalzahl) |
| valueList | ValueList | 0..1 | Vordefinierte Wertliste |
| value | string | 0..1 | Vordefinierter Wert |
| levelType | LevelType | 0..1 | Min/Nom/Typ/Max-Kennzeichnung |

### Constraints
- `preferredName` MUSS mindestens einen Eintrag mit `language="en"` enthalten
- `value` und `valueList` sind gegenseitig ausschließend
- Wenn `dataType` gesetzt ist, muss `value` dazu passen

---

## 4. DataTypeIec61360 (Enum)

| Wert | Beschreibung |
|------|-------------|
| `DATE` | Datum |
| `STRING` | Zeichenkette |
| `STRING_TRANSLATABLE` | Übersetzbarer Text |
| `INTEGER_MEASURE` | Ganzzahl mit Einheit |
| `INTEGER_COUNT` | Ganzzahl (Anzahl) |
| `INTEGER_CURRENCY` | Ganzzahl (Währung) |
| `REAL_MEASURE` | Fließkomma mit Einheit |
| `REAL_COUNT` | Fließkomma (Anzahl) |
| `REAL_CURRENCY` | Fließkomma (Währung) |
| `BOOLEAN` | Wahrheitswert |
| `IRI` | Internationalized Resource Identifier |
| `IRDI` | International Registration Data Identifier |
| `RATIONAL` | Rationale Zahl |
| `RATIONAL_MEASURE` | Rationale Zahl mit Einheit |
| `TIME` | Zeitangabe |
| `TIMESTAMP` | Zeitstempel |
| `FILE` | Datei |
| `HTML` | HTML-Inhalt |
| `BLOB` | Binärdaten |

---

## 5. ValueList & ValueReferencePair

Für Properties mit vordefinierten Auswahlwerten (Enumerationen).

### ValueList

| Attribut | Typ | Kard. |
|----------|-----|-------|
| valueReferencePairs | ValueReferencePair[] | **1..\*** |

### ValueReferencePair

| Attribut | Typ | Kard. |
|----------|-----|-------|
| value | string | **1** |
| valueId | Reference | **1** |

---

## 6. LevelType

Kennzeichnet, ob ein Wert ein Minimum, Nennwert, typischer Wert oder Maximum ist.

| Attribut | Typ | Kard. |
|----------|-----|-------|
| min | boolean | **1** |
| nom | boolean | **1** |
| typ | boolean | **1** |
| max | boolean | **1** |

Beispiel: `{ min: false, nom: true, typ: false, max: false }` → Nennwert

---

## 7. Measurement Units (Part 3b)

Part 3b definiert ein separates DataSpecification-Template für Maßeinheiten. In der Praxis werden Einheiten meist direkt über das `unit`/`unitId`-Feld in DataSpecificationIec61360 referenziert.

Häufige Einheiten-Referenzen (eCl@ss):
```
°C    → 0173-1#05-AAA563#002
mm    → 0173-1#05-AAA480#002
kg    → 0173-1#05-AAA426#002
V     → 0173-1#05-AAA550#002
A     → 0173-1#05-AAA341#002
W     → 0173-1#05-AAA552#002
Hz    → 0173-1#05-AAA409#002
Pa    → 0173-1#05-AAA494#002
m/s   → 0173-1#05-AAA469#002
```

---

## 8. Vollständiges Beispiel

Eine ConceptDescription für "Maximale Betriebstemperatur":

```json
{
  "id": "0173-1#02-AAB381#012",
  "idShort": "MaxOperatingTemperature",
  "modelType": "ConceptDescription",
  "embeddedDataSpecifications": [{
    "dataSpecification": {
      "type": "ExternalReference",
      "keys": [{
        "type": "GlobalReference",
        "value": "https://admin-shell.io/DataSpecificationTemplates/DataSpecificationIec61360/3/0"
      }]
    },
    "dataSpecificationContent": {
      "preferredName": [
        { "language": "en", "text": "Maximum operating temperature" },
        { "language": "de", "text": "Maximale Betriebstemperatur" }
      ],
      "shortName": [
        { "language": "en", "text": "MaxOpTemp" }
      ],
      "unit": "°C",
      "unitId": {
        "type": "ExternalReference",
        "keys": [{ "type": "GlobalReference", "value": "0173-1#05-AAA563#002" }]
      },
      "dataType": "REAL_MEASURE",
      "definition": [
        { "language": "en", "text": "Maximum temperature at which the device can operate continuously" },
        { "language": "de", "text": "Maximale Temperatur, bei der das Gerät dauerhaft betrieben werden kann" }
      ],
      "levelType": { "min": false, "nom": false, "typ": false, "max": true }
    }
  }]
}
```

### Zugehörige Property mit semanticId
```json
{
  "idShort": "MaxOperatingTemperature",
  "modelType": "Property",
  "valueType": "xs:double",
  "value": "85.0",
  "semanticId": {
    "type": "ExternalReference",
    "keys": [{ "type": "GlobalReference", "value": "0173-1#02-AAB381#012" }]
  }
}
```

Die `semanticId` der Property verweist auf die `id` der ConceptDescription.

---

## 9. eCl@ss IRDI-Format

eCl@ss IRDIs folgen dem Muster:
```
0173-1#XX-YYYYYY#ZZZ

0173-1    → eCl@ss Registrierungsnummer
XX        → Segment-Typ:
              01 = Klasse
              02 = Property
              05 = Einheit
              07 = Wertliste
YYYYYY    → Eindeutige ID
ZZZ       → Versionsnummer
```

Beispiele:
```
0173-1#01-AKN468#017   → Klasse: "Elektromotor"
0173-1#02-AAB381#012   → Property: "Max. Betriebstemperatur"
0173-1#05-AAA563#002   → Einheit: "°C"
```
