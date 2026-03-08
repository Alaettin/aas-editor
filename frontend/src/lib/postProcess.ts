import { jsonrepair } from 'jsonrepair';
import type { ExtractionMetadata, Correction } from '../store/extractionStore';

// ─── Types ───

interface SubmodelElement {
  idShort?: string;
  modelType?: string;
  valueType?: string;
  value?: unknown;
  min?: string;
  max?: string;
  statements?: SubmodelElement[];
  annotations?: SubmodelElement[];
  [key: string]: unknown;
}

interface AasResult {
  aas?: Record<string, unknown>;
  submodel?: {
    idShort?: string;
    id?: string;
    submodelElements?: SubmodelElement[];
    [key: string]: unknown;
  };
  metadata?: {
    extractedProperties?: number;
    skippedItems?: string[];
    confidence?: number;
    warnings?: string[];
  };
}

export interface PostProcessResult {
  processed: Record<string, unknown>;
  metadata: ExtractionMetadata;
}

// ─── Main pipeline ───

export function postProcess(jsonString: string, pdfText: string): PostProcessResult {
  const corrections: Correction[] = [];
  const warnings: string[] = [];

  // Phase 1: JSON Repair
  let parsed: AasResult;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    try {
      parsed = JSON.parse(jsonrepair(jsonString));
      corrections.push({ type: 'json_repair', detail: 'JSON wurde repariert' });
    } catch {
      throw new Error('AI-Antwort ist kein gueltiges JSON');
    }
  }

  const elements = parsed.submodel?.submodelElements ?? [];

  // Phase 2: idShort Validierung
  validateIdShorts(elements, corrections);

  // Phase 3: Duplikat-Erkennung
  deduplicateIdShorts(elements, corrections);

  // Phase 4: valueType/value Konsistenz
  fixValueTypes(elements, corrections);

  // Phase 5: Halluzinations-Check
  let hallucinationSuspects = 0;
  if (pdfText) {
    hallucinationSuspects = checkHallucinations(elements, pdfText, warnings);
  }

  // Phase 6: Struktur-Bereinigung
  cleanupStructure(elements, corrections);

  // Collect metadata from AI + our corrections
  const aiMeta = parsed.metadata;
  const metadata: ExtractionMetadata = {
    extractedProperties: aiMeta?.extractedProperties ?? countProperties(elements),
    skippedItems: aiMeta?.skippedItems ?? [],
    confidence: aiMeta?.confidence ?? 0.5,
    warnings: [...(aiMeta?.warnings ?? []), ...warnings],
    corrections,
    hallucinationSuspects,
  };

  return { processed: parsed as Record<string, unknown>, metadata };
}

// ─── Phase 2: idShort Validierung ───

const IDSHORT_REGEX = /^[a-zA-Z][a-zA-Z0-9_]*$/;
const RESERVED_WORDS = new Set(['value', 'modelType', 'idShort', 'id', 'semanticId']);
const MAX_IDSHORT_LENGTH = 64;

function validateIdShorts(elements: SubmodelElement[], corrections: Correction[]): void {
  for (const elem of elements) {
    if (!elem.idShort) continue;

    const original = elem.idShort;

    // Fix invalid characters
    if (!IDSHORT_REGEX.test(elem.idShort)) {
      elem.idShort = elem.idShort
        .replace(/[^a-zA-Z0-9_]/g, '_')
        .replace(/^[^a-zA-Z]/, 'X');
      if (!elem.idShort) elem.idShort = 'Element';
    }

    // Truncate if too long
    if (elem.idShort.length > MAX_IDSHORT_LENGTH) {
      elem.idShort = elem.idShort.slice(0, MAX_IDSHORT_LENGTH);
    }

    // Fix reserved words
    if (RESERVED_WORDS.has(elem.idShort.toLowerCase())) {
      elem.idShort = `${elem.idShort}_1`;
    }

    if (elem.idShort !== original) {
      corrections.push({ type: 'idShort_fix', original, fixed: elem.idShort });
    }

    // Recurse into children
    if (Array.isArray(elem.value)) {
      validateIdShorts(elem.value as SubmodelElement[], corrections);
    }
    if (elem.statements) validateIdShorts(elem.statements, corrections);
    if (elem.annotations) validateIdShorts(elem.annotations, corrections);
  }
}

// ─── Phase 3: Duplikat-Erkennung ───

function deduplicateIdShorts(elements: SubmodelElement[], corrections: Correction[]): void {
  const seen = new Map<string, number>();

  for (const elem of elements) {
    if (!elem.idShort) continue;
    const key = elem.idShort;
    const count = seen.get(key) ?? 0;

    if (count > 0) {
      const newId = `${key}_${count + 1}`;
      corrections.push({ type: 'dedup', original: key, fixed: newId });
      elem.idShort = newId;
    }
    seen.set(key, count + 1);

    // Recurse into nested elements
    if (Array.isArray(elem.value) && elem.modelType === 'SubmodelElementCollection') {
      deduplicateIdShorts(elem.value as SubmodelElement[], corrections);
    }
    if (elem.statements) deduplicateIdShorts(elem.statements, corrections);
  }
}

// ─── Phase 4: valueType/value Konsistenz ───

const VALID_XS_TYPES = new Set([
  'xs:string', 'xs:boolean', 'xs:integer', 'xs:int', 'xs:long', 'xs:short',
  'xs:double', 'xs:float', 'xs:decimal', 'xs:date', 'xs:dateTime', 'xs:anyURI',
  'xs:byte', 'xs:unsignedInt', 'xs:unsignedLong', 'xs:unsignedShort', 'xs:unsignedByte',
  'xs:nonNegativeInteger', 'xs:positiveInteger', 'xs:nonPositiveInteger', 'xs:negativeInteger',
  'xs:base64Binary', 'xs:hexBinary', 'xs:duration', 'xs:time', 'xs:gYear', 'xs:gMonth',
  'xs:gDay', 'xs:gYearMonth', 'xs:gMonthDay',
]);

function fixValueTypes(elements: SubmodelElement[], corrections: Correction[]): void {
  for (const elem of elements) {
    if (elem.modelType === 'Property') {
      // Fix missing or invalid valueType
      if (!elem.valueType || !VALID_XS_TYPES.has(elem.valueType)) {
        const original = elem.valueType;
        elem.valueType = inferValueType(elem.value as string | undefined);
        if (original) {
          corrections.push({ type: 'valueType_fix', idShort: elem.idShort, original, fixed: elem.valueType });
        }
      }

      // Normalize boolean values
      if (elem.valueType === 'xs:boolean' && typeof elem.value === 'string') {
        const lower = elem.value.toLowerCase().trim();
        if (['ja', 'yes', '1', 'wahr', 'true'].includes(lower)) {
          elem.value = 'true';
        } else if (['nein', 'no', '0', 'falsch', 'false'].includes(lower)) {
          elem.value = 'false';
        }
      }
    }

    if (elem.modelType === 'Range') {
      if (!elem.valueType || !VALID_XS_TYPES.has(elem.valueType)) {
        elem.valueType = 'xs:double';
      }
    }

    // Recurse
    if (Array.isArray(elem.value) && typeof elem.value[0] === 'object' && 'idShort' in (elem.value[0] as object)) {
      fixValueTypes(elem.value as SubmodelElement[], corrections);
    }
    if (elem.statements) fixValueTypes(elem.statements, corrections);
    if (elem.annotations) fixValueTypes(elem.annotations, corrections);
  }
}

function inferValueType(value: string | undefined): string {
  if (!value) return 'xs:string';
  const v = value.trim();
  if (v === 'true' || v === 'false') return 'xs:boolean';
  if (/^-?\d+$/.test(v)) return 'xs:integer';
  if (/^-?\d+[.,]\d+$/.test(v)) return 'xs:double';
  return 'xs:string';
}

// ─── Phase 5: Halluzinations-Check ───

function checkHallucinations(
  elements: SubmodelElement[],
  pdfText: string,
  warnings: string[],
): number {
  let suspects = 0;
  const normalizedPdf = pdfText.toLowerCase().replace(/\s+/g, ' ');

  for (const elem of elements) {
    if (elem.modelType === 'Property' && typeof elem.value === 'string' && elem.value.trim()) {
      const val = elem.value.trim();
      // Skip very short or generic values
      if (val.length < 3 || val === 'true' || val === 'false' || val === '') continue;

      // Fuzzy check: is this value (or a close variant) found in the PDF text?
      const normalizedVal = val.toLowerCase().replace(/\s+/g, ' ');
      if (!normalizedPdf.includes(normalizedVal)) {
        // Try without units (e.g. "27.7 g" → "27.7")
        const numMatch = val.match(/^[\d.,+-]+/);
        if (numMatch) {
          const numStr = numMatch[0].replace(',', '.');
          if (!normalizedPdf.includes(numStr) && !normalizedPdf.includes(numMatch[0])) {
            suspects++;
            warnings.push(`Verdaechtiger Wert: "${elem.idShort}" = "${val}" — nicht im Dokument gefunden`);
          }
        } else {
          suspects++;
          warnings.push(`Verdaechtiger Wert: "${elem.idShort}" = "${val}" — nicht im Dokument gefunden`);
        }
      }
    }

    // Recurse
    if (Array.isArray(elem.value) && elem.modelType === 'SubmodelElementCollection') {
      suspects += checkHallucinations(elem.value as SubmodelElement[], pdfText, warnings);
    }
    if (elem.statements) {
      suspects += checkHallucinations(elem.statements, pdfText, warnings);
    }
  }

  return suspects;
}

// ─── Phase 6: Struktur-Bereinigung ───

function cleanupStructure(elements: SubmodelElement[], corrections: Correction[]): void {
  // Remove empty collections
  for (let i = elements.length - 1; i >= 0; i--) {
    const elem = elements[i];
    if (
      elem.modelType === 'SubmodelElementCollection' &&
      Array.isArray(elem.value) &&
      elem.value.length === 0
    ) {
      corrections.push({ type: 'remove_empty', idShort: elem.idShort });
      elements.splice(i, 1);
      continue;
    }

    // Unwrap single-element collections (flatten)
    if (
      elem.modelType === 'SubmodelElementCollection' &&
      Array.isArray(elem.value) &&
      elem.value.length === 1
    ) {
      // Keep the collection but note it — don't auto-flatten as it may be semantically meaningful
    }

    // Recurse into nested collections
    if (Array.isArray(elem.value) && elem.modelType === 'SubmodelElementCollection') {
      cleanupStructure(elem.value as SubmodelElement[], corrections);
    }
    if (elem.statements) cleanupStructure(elem.statements, corrections);
  }
}

// ─── Helpers ───

function countProperties(elements: SubmodelElement[]): number {
  let count = 0;
  for (const elem of elements) {
    if (elem.modelType === 'Property' || elem.modelType === 'MultiLanguageProperty' || elem.modelType === 'Range') {
      count++;
    }
    if (Array.isArray(elem.value) && typeof elem.value[0] === 'object') {
      count += countProperties(elem.value as SubmodelElement[]);
    }
    if (elem.statements) count += countProperties(elem.statements);
  }
  return count;
}
