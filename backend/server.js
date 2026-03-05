import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = process.env.PORT || 3001;

// Supabase client with service role key for backend access
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('SUPABASE_URL und SUPABASE_SERVICE_KEY müssen gesetzt sein');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Security middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());
app.use(rateLimit({ windowMs: 60_000, max: 100, standardHeaders: true, legacyHeaders: false }));

// UUID format validation
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateUserId(req, res, next) {
  if (!UUID_RE.test(req.params.userId)) {
    return res.status(400).json(makeError(400, 'Ungültige User-ID'));
  }
  next();
}

// Decode Base64 ID with length check
function decodeBase64Id(encoded) {
  const decoded = Buffer.from(decodeURIComponent(encoded), 'base64').toString('utf-8');
  if (decoded.length > 500) throw new Error('ID zu lang');
  return decoded;
}

// --- AAS V3 API Endpoints (per-user via /:userId prefix) ---

// GET /:userId/shells - List all published shells for a user
app.get('/:userId/shells', validateUserId, async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 1000);
    const cursor = req.query.cursor;
    let offset = 0;

    if (cursor) {
      try {
        const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
        offset = decoded.offset || 0;
      } catch { /* ignore invalid cursor */ }
    }

    const { data, error, count } = await supabase
      .from('api_shells')
      .select('shell_json', { count: 'exact' })
      .eq('user_id', userId)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Supabase error (shells list):', error.message);
      return res.status(500).json(makeError(500, 'Interner Serverfehler'));
    }

    const total = count || 0;
    const hasMore = offset + limit < total;
    const nextCursor = hasMore
      ? Buffer.from(JSON.stringify({ offset: offset + limit, total })).toString('base64')
      : '';

    res.json({
      paging_metadata: { cursor: nextCursor },
      result: data.map((row) => row.shell_json),
    });
  } catch (err) {
    console.error('Unexpected error (shells list):', err);
    res.status(500).json(makeError(500, 'Interner Serverfehler'));
  }
});

// GET /:userId/shells/:aasId - Get single shell by ID for a user
app.get('/:userId/shells/:aasId', validateUserId, async (req, res) => {
  try {
    const { userId } = req.params;
    const aasId = decodeBase64Id(req.params.aasId);

    const { data, error } = await supabase
      .from('api_shells')
      .select('shell_json')
      .eq('user_id', userId)
      .eq('shell_id', aasId)
      .maybeSingle();

    if (error) {
      console.error('Supabase error (shell by ID):', error.message);
      return res.status(500).json(makeError(500, 'Interner Serverfehler'));
    }

    if (!data) {
      return res.status(404).json(makeError(404, 'AAS nicht gefunden'));
    }

    res.json(data.shell_json);
  } catch (err) {
    console.error('Unexpected error (shell by ID):', err);
    res.status(500).json(makeError(500, 'Interner Serverfehler'));
  }
});

// GET /:userId/submodels - List all published submodels for a user
app.get('/:userId/submodels', validateUserId, async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 1000);
    const cursor = req.query.cursor;
    let offset = 0;

    if (cursor) {
      try {
        const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
        offset = decoded.offset || 0;
      } catch { /* ignore invalid cursor */ }
    }

    const { data, error, count } = await supabase
      .from('api_submodels')
      .select('sm_json', { count: 'exact' })
      .eq('user_id', userId)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Supabase error (submodels list):', error.message);
      return res.status(500).json(makeError(500, 'Interner Serverfehler'));
    }

    const total = count || 0;
    const hasMore = offset + limit < total;
    const nextCursor = hasMore
      ? Buffer.from(JSON.stringify({ offset: offset + limit, total })).toString('base64')
      : '';

    res.json({
      paging_metadata: { cursor: nextCursor },
      result: data.map((row) => row.sm_json),
    });
  } catch (err) {
    console.error('Unexpected error (submodels list):', err);
    res.status(500).json(makeError(500, 'Interner Serverfehler'));
  }
});

// GET /:userId/submodels/:smId - Get single submodel by ID for a user
app.get('/:userId/submodels/:smId', validateUserId, async (req, res) => {
  try {
    const { userId } = req.params;
    const smId = decodeBase64Id(req.params.smId);

    const { data, error } = await supabase
      .from('api_submodels')
      .select('sm_json')
      .eq('user_id', userId)
      .eq('submodel_id', smId)
      .maybeSingle();

    if (error) {
      console.error('Supabase error (submodel by ID):', error.message);
      return res.status(500).json(makeError(500, 'Interner Serverfehler'));
    }

    if (!data) {
      return res.status(404).json(makeError(404, 'Submodel nicht gefunden'));
    }

    res.json(data.sm_json);
  } catch (err) {
    console.error('Unexpected error (submodel by ID):', err);
    res.status(500).json(makeError(500, 'Interner Serverfehler'));
  }
});

// AAS V3 error format
function makeError(code, text) {
  return {
    messages: [{
      messageType: 'Error',
      text,
      code: String(code),
      timestamp: new Date().toISOString(),
    }],
  };
}

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

app.listen(PORT, () => {
  console.log(`AAS API läuft auf http://localhost:${PORT}`);
  console.log(`  GET /:userId/shells`);
  console.log(`  GET /:userId/shells/:aasId`);
  console.log(`  GET /:userId/submodels`);
  console.log(`  GET /:userId/submodels/:smId`);
});
