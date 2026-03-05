# Testing

## Setup

Tests use [Vitest](https://vitest.dev/) with the `node` environment (default).

```bash
cd frontend
npm run test        # watch mode
npx vitest run      # single run
```

## Test Structure

```
frontend/src/
├── lib/__tests__/
│   └── extractText.test.ts      # File extension & type detection helpers
├── store/__tests__/
│   ├── aasStore.test.ts          # AAS store CRUD, canvas ops, container helpers
│   └── aiStore.test.ts           # AI settings, provider switch, model validation
└── utils/__tests__/
    ├── constants.test.ts         # XSD types, key types, element types
    ├── exportAas.test.ts         # JSON export for all AAS element types
    ├── ids.test.ts               # UUID and URN generation
    └── importAas.test.ts         # JSON import, node creation, layout
```

## Test Coverage (128 tests)

| File | Tests | Coverage |
|------|-------|----------|
| `aasStore.test.ts` | 36 | Shell/Submodel/CD CRUD, element ops, delete cascades, duplicate, canvas load/clear, import, concept description toggle, `isContainerElement`, `getContainerChildren` |
| `exportAas.test.ts` | 33 | JSON export for Property, MLP, Range, Blob, File, Reference, SMC, SML, Entity, Operation, annotated relationships |
| `aiStore.test.ts` | 16 | Default state, setEnabled/setProvider/setModel/setApiKey persistence, provider switch resets model, deprecated model migration, PROVIDER_MODELS validation |
| `extractText.test.ts` | 15 | `getFileExtension` (case, dots, empty), `isSupportedDocument` (all formats), `isImageFile` (PNG/JPG/WEBP) |
| `importAas.test.ts` | 14 | JSON import, shell/submodel/element parsing, node position layout |
| `constants.test.ts` | 9 | XSD type list, key type list, element type list completeness |
| `ids.test.ts` | 5 | UUID format, URN generation |

## Mocking Notes

- **aiStore tests**: `localStorage` is mocked via `Map`-based polyfill (node env has no `localStorage`)
- **extractText tests**: `pdfjs-dist` and `mammoth` are mocked since they need browser APIs; only pure utility functions are tested
- **aasStore tests**: Zustand store is reset via `setState()` in `beforeEach`

## Adding Tests

1. Create test file in `__tests__/` directory next to the source
2. Use `describe`/`it`/`expect` from Vitest (globals enabled)
3. For browser-API-dependent modules, mock the heavy imports and test pure logic
4. Reset shared state in `beforeEach`
