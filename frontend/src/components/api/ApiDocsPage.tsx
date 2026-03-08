import { useState } from 'react';
import { Play, Copy, Check, ChevronRight, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

function safeBase64(input: string): string {
  try {
    return btoa(input);
  } catch {
    return '';
  }
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

function Base64Encoder() {
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);
  const encoded = safeBase64(input);

  const copyResult = () => {
    if (!encoded) return;
    navigator.clipboard.writeText(encoded);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '16px 20px',
        marginBottom: 32,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
        Base64 Encoder
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Klartext-ID</div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="z.B. urn:example:aas:1"
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: 'var(--bg-base)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: 'var(--text-primary)',
              fontSize: 13,
              fontFamily: "'JetBrains Mono', monospace",
              outline: 'none',
              transition: 'border-color 0.15s ease',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          />
        </div>

        <ArrowRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 18 }} />

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Base64</div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              minHeight: 37,
            }}
          >
            <code
              style={{
                flex: 1,
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                color: encoded ? 'var(--accent)' : 'var(--text-muted)',
                wordBreak: 'break-all',
                userSelect: 'all',
              }}
            >
              {encoded || '\u2014'}
            </code>
            <button
              onClick={copyResult}
              disabled={!encoded}
              style={{
                padding: 4,
                backgroundColor: 'transparent',
                border: 'none',
                color: encoded ? 'var(--text-muted)' : 'var(--border)',
                cursor: encoded ? 'pointer' : 'default',
                flexShrink: 0,
                transition: 'color 0.15s ease',
              }}
              title="Kopieren"
              onMouseEnter={(e) => encoded && (e.currentTarget.style.color = 'var(--text-secondary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = encoded ? 'var(--text-muted)' : 'var(--border)')}
            >
              {copied ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface Endpoint {
  method: string;
  path: string;
  shortDesc: string;
  description: string;
  params?: { name: string; description: string; example: string }[];
  exampleUrl: string;
  responseExample: string;
}

function buildEndpoints(userId: string): Endpoint[] {
  const base = `${apiBaseUrl}/${userId}`;
  return [
    {
      method: 'GET',
      path: '/shells',
      shortDesc: 'Alle Shells auflisten',
      description: 'Alle publizierten Asset Administration Shells auflisten. Unterstützt Pagination via limit und cursor.',
      params: [
        { name: 'limit', description: 'Max. Anzahl Ergebnisse (Standard: 100)', example: '10' },
        { name: 'cursor', description: 'Pagination-Cursor für nächste Seite', example: '' },
      ],
      exampleUrl: `${base}/shells`,
      responseExample: `{
  "paging_metadata": { "cursor": "" },
  "result": [
    {
      "idShort": "MyShell",
      "id": "urn:example:aas:1",
      "assetInformation": { "assetKind": "Instance", ... },
      "submodels": [ ... ],
      "modelType": "AssetAdministrationShell"
    }
  ]
}`,
    },
    {
      method: 'GET',
      path: '/shells/{aasId}',
      shortDesc: 'Einzelne Shell abrufen',
      description: 'Eine einzelne AAS anhand ihrer ID abrufen.',
      params: [
        { name: 'aasId', description: 'Die ID der AAS (Base64-encoded)', example: btoa('urn:example:aas:1') },
      ],
      exampleUrl: `${base}/shells/${btoa('urn:example:aas:1')}`,
      responseExample: `{
  "idShort": "MyShell",
  "id": "urn:example:aas:1",
  "assetInformation": { ... },
  "submodels": [ ... ],
  "modelType": "AssetAdministrationShell"
}`,
    },
    {
      method: 'GET',
      path: '/submodels',
      shortDesc: 'Alle Submodels auflisten',
      description: 'Alle publizierten Submodels auflisten. Unterstützt Pagination via limit und cursor.',
      params: [
        { name: 'limit', description: 'Max. Anzahl Ergebnisse (Standard: 100)', example: '10' },
        { name: 'cursor', description: 'Pagination-Cursor für nächste Seite', example: '' },
      ],
      exampleUrl: `${base}/submodels`,
      responseExample: `{
  "paging_metadata": { "cursor": "" },
  "result": [
    {
      "idShort": "Nameplate",
      "id": "urn:example:sm:1",
      "kind": "Instance",
      "submodelElements": [ ... ],
      "modelType": "Submodel"
    }
  ]
}`,
    },
    {
      method: 'GET',
      path: '/submodels/{smId}',
      shortDesc: 'Einzelnes Submodel abrufen',
      description: 'Ein einzelnes Submodel anhand seiner ID abrufen.',
      params: [
        { name: 'smId', description: 'Die ID des Submodels (Base64-encoded)', example: btoa('urn:example:sm:1') },
      ],
      exampleUrl: `${base}/submodels/${btoa('urn:example:sm:1')}`,
      responseExample: `{
  "idShort": "Nameplate",
  "id": "urn:example:sm:1",
  "kind": "Instance",
  "submodelElements": [ ... ],
  "modelType": "Submodel"
}`,
    },
  ];
}

/** Render path with template variables highlighted in accent color */
function renderPath(path: string) {
  const parts = path.split(/(\{[^}]+\})/);
  return parts.map((part, i) =>
    part.startsWith('{') ? (
      <span key={i} style={{ color: 'var(--accent)' }}>{part}</span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

function EndpointCard({ ep }: { ep: Endpoint }) {
  const [expanded, setExpanded] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedExample, setCopiedExample] = useState(false);
  const [hovered, setHovered] = useState(false);

  // Editable parameter values
  const [paramValues, setParamValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const p of ep.params ?? []) init[p.name] = p.example;
    return init;
  });

  // Build the live URL from base + param values
  const buildUrl = () => {
    let url = ep.exampleUrl;
    // Replace path params (already Base64, no extra encoding needed)
    for (const p of ep.params ?? []) {
      if (p.example && paramValues[p.name] && p.example !== paramValues[p.name]) {
        url = url.replace(p.example, paramValues[p.name]);
      }
    }
    // Add query params (limit, cursor) if they have values
    const queryParams = (ep.params ?? [])
      .filter((p) => ['limit', 'cursor'].includes(p.name) && paramValues[p.name])
      .map((p) => `${p.name}=${encodeURIComponent(paramValues[p.name])}`)
      .join('&');
    if (queryParams) url += `?${queryParams}`;
    return url;
  };

  const liveUrl = buildUrl();

  const tryIt = async () => {
    setLoading(true);
    setResponse(null);
    setResponseStatus(null);
    try {
      const res = await fetch(liveUrl);
      setResponseStatus(res.status);
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      setResponseStatus(0);
      setResponse(`Fehler: ${err instanceof Error ? err.message : String(err)}`);
    }
    setLoading(false);
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(liveUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 1500);
  };

  const copyExample = () => {
    navigator.clipboard.writeText(ep.responseExample);
    setCopiedExample(true);
    setTimeout(() => setCopiedExample(false), 1500);
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderTop: `1px solid ${hovered || expanded ? 'var(--border-hover)' : 'var(--border)'}`,
        borderRight: `1px solid ${hovered || expanded ? 'var(--border-hover)' : 'var(--border)'}`,
        borderBottom: `1px solid ${hovered || expanded ? 'var(--border-hover)' : 'var(--border)'}`,
        borderLeft: '3px solid #22c55e',
        borderRadius: 12,
        overflow: 'hidden',
        transition: 'border-color 0.15s ease',
      }}
    >
      {/* Collapsed Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 16px',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span
          style={{
            padding: '3px 8px',
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 700,
            fontFamily: "'JetBrains Mono', monospace",
            color: '#fff',
            backgroundColor: '#22c55e',
            flexShrink: 0,
          }}
        >
          {ep.method}
        </span>
        <span
          style={{
            fontSize: 13,
            fontFamily: "'JetBrains Mono', monospace",
            color: 'var(--text-primary)',
          }}
        >
          {renderPath(ep.path)}
        </span>
        <span
          style={{
            flex: 1,
            fontSize: 12,
            color: 'var(--text-muted)',
            textAlign: 'right',
            marginRight: 4,
          }}
        >
          {ep.shortDesc}
        </span>
        <ChevronRight
          size={16}
          style={{
            color: 'var(--text-muted)',
            transition: 'transform 0.2s ease',
            transform: expanded ? 'rotate(90deg)' : 'none',
            flexShrink: 0,
          }}
        />
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '14px 0', lineHeight: 1.5 }}>
            {ep.description}
          </p>

          {/* Parameters */}
          {ep.params && (
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Parameter
              </span>
              <div style={{ marginTop: 8, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                {ep.params.map((p, i) => (
                  <div
                    key={p.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '8px 12px',
                      fontSize: 12,
                      backgroundColor: i % 2 === 0 ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                    }}
                  >
                    <code
                      style={{
                        padding: '2px 8px',
                        backgroundColor: 'var(--accent-subtle)',
                        color: 'var(--accent)',
                        borderRadius: 4,
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 11,
                        fontWeight: 600,
                        flexShrink: 0,
                        minWidth: 60,
                      }}
                    >
                      {p.name}
                    </code>
                    <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{p.description}</span>
                    <input
                      type="text"
                      value={paramValues[p.name] ?? ''}
                      onChange={(e) => setParamValues((prev) => ({ ...prev, [p.name]: e.target.value }))}
                      placeholder={p.example || p.name}
                      style={{
                        width: 200,
                        padding: '4px 8px',
                        backgroundColor: 'var(--bg-base)',
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        color: 'var(--text-primary)',
                        fontSize: 11,
                        fontFamily: "'JetBrains Mono', monospace",
                        outline: 'none',
                        transition: 'border-color 0.15s ease',
                        flexShrink: 0,
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Example Response */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Beispiel-Response
              </span>
              <button
                onClick={copyExample}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '2px 8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: 11,
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                {copiedExample ? <Check size={12} style={{ color: 'var(--success)' }} /> : <Copy size={12} />}
                {copiedExample ? 'Kopiert' : 'Kopieren'}
              </button>
            </div>
            <pre
              style={{
                padding: 14,
                backgroundColor: 'var(--bg-elevated)',
                borderRadius: 8,
                border: '1px solid var(--border)',
                fontSize: 11,
                color: 'var(--text-secondary)',
                fontFamily: "'JetBrains Mono', monospace",
                overflow: 'auto',
                maxHeight: 200,
                whiteSpace: 'pre-wrap',
                lineHeight: 1.5,
              }}
            >
              {ep.responseExample}
            </pre>
          </div>

          {/* Try It Section */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              backgroundColor: 'var(--bg-elevated)',
              borderRadius: 8,
              border: '1px solid var(--border)',
            }}
          >
            <code
              style={{
                flex: 1,
                fontSize: 11,
                color: 'var(--text-muted)',
                fontFamily: "'JetBrains Mono', monospace",
                wordBreak: 'break-all',
              }}
            >
              {liveUrl}
            </code>
            <button
              onClick={copyUrl}
              style={{
                padding: 4,
                backgroundColor: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
              title="URL kopieren"
            >
              {copiedUrl ? <Check size={13} style={{ color: 'var(--success)' }} /> : <Copy size={13} />}
            </button>
            <div style={{ width: 1, height: 20, backgroundColor: 'var(--border)', flexShrink: 0 }} />
            <button
              onClick={tryIt}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 14px',
                backgroundColor: 'var(--accent)',
                border: 'none',
                borderRadius: 6,
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                flexShrink: 0,
                transition: 'all 0.15s ease',
              }}
            >
              <Play size={11} />
              {loading ? 'Lädt...' : 'Ausprobieren'}
            </button>
          </div>

          {/* Live Response */}
          {response && (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Response
                </span>
                {responseStatus !== null && (
                  <span
                    style={{
                      padding: '1px 8px',
                      borderRadius: 9999,
                      fontSize: 11,
                      fontWeight: 600,
                      fontFamily: "'JetBrains Mono', monospace",
                      backgroundColor: responseStatus >= 200 && responseStatus < 300 ? 'var(--success-subtle)' : 'rgba(239, 68, 68, 0.1)',
                      color: responseStatus >= 200 && responseStatus < 300 ? 'var(--success)' : 'var(--error)',
                    }}
                  >
                    {responseStatus === 0 ? 'Error' : responseStatus}
                  </span>
                )}
              </div>
              <pre
                style={{
                  padding: 14,
                  backgroundColor: 'var(--bg-base)',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                  fontFamily: "'JetBrains Mono', monospace",
                  overflow: 'auto',
                  maxHeight: 400,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  lineHeight: 1.5,
                }}
              >
                {response}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Inline API docs section (for embedding in ApiConfigPage) */
export function ApiDocsSection() {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? '';
  const endpoints = buildEndpoints(userId);

  return (
    <div>
      {/* Base64 Encoder */}
      <Base64Encoder />

      {/* Endpoints */}
      <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
        Endpoints
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {endpoints.map((ep, i) => (
          <EndpointCard key={i} ep={ep} />
        ))}
      </div>
    </div>
  );
}

export function ApiDocsPage() {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? '';
  const userBaseUrl = `${apiBaseUrl}/${userId}`;
  const endpoints = buildEndpoints(userId);
  const [copiedBase, setCopiedBase] = useState(false);

  const copyBaseUrl = () => {
    navigator.clipboard.writeText(userBaseUrl);
    setCopiedBase(true);
    setTimeout(() => setCopiedBase(false), 1500);
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>
          API Dokumentation
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.6 }}>
          AAS V3 Repository API (IDTA-01002). Alle Endpoints sind öffentlich zugänglich.
        </p>
      </div>

      {/* Base URL */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '14px 16px',
          marginBottom: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Base URL</span>
          <code
            style={{
              fontSize: 13,
              color: 'var(--accent)',
              fontFamily: "'JetBrains Mono', monospace",
              wordBreak: 'break-all',
            }}
          >
            {userBaseUrl}
          </code>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: 'var(--success)' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              LIVE
            </span>
          </div>
          <button
            onClick={copyBaseUrl}
            style={{
              padding: '4px 8px',
              backgroundColor: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'color 0.15s ease',
            }}
            title="Base URL kopieren"
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            {copiedBase ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      {/* Base64 Encoder */}
      <Base64Encoder />

      {/* Endpoints */}
      <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
        Endpoints
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {endpoints.map((ep, i) => (
          <EndpointCard key={i} ep={ep} />
        ))}
      </div>
    </div>
  );
}
