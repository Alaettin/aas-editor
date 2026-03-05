import 'dotenv/config';
import express from 'express';
import cors from 'cors';
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

app.use(cors());
app.use(express.json());

// --- AAS V3 API Endpoints (per-user via /:userId prefix) ---

// GET /:userId/shells - List all published shells for a user
app.get('/:userId/shells', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 100, 1000);
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
      return res.status(500).json(makeError(500, error.message));
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
    res.status(500).json(makeError(500, err.message));
  }
});

// GET /:userId/shells/:aasId - Get single shell by ID for a user
app.get('/:userId/shells/:aasId', async (req, res) => {
  try {
    const { userId } = req.params;
    const aasId = Buffer.from(decodeURIComponent(req.params.aasId), 'base64').toString('utf-8');

    const { data, error } = await supabase
      .from('api_shells')
      .select('shell_json')
      .eq('user_id', userId)
      .eq('shell_id', aasId)
      .maybeSingle();

    if (error) {
      return res.status(500).json(makeError(500, error.message));
    }

    if (!data) {
      return res.status(404).json(makeError(404, `AAS mit ID "${aasId}" nicht gefunden`));
    }

    res.json(data.shell_json);
  } catch (err) {
    res.status(500).json(makeError(500, err.message));
  }
});

// GET /:userId/submodels - List all published submodels for a user
app.get('/:userId/submodels', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 100, 1000);
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
      return res.status(500).json(makeError(500, error.message));
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
    res.status(500).json(makeError(500, err.message));
  }
});

// GET /:userId/submodels/:smId - Get single submodel by ID for a user
app.get('/:userId/submodels/:smId', async (req, res) => {
  try {
    const { userId } = req.params;
    const smId = Buffer.from(decodeURIComponent(req.params.smId), 'base64').toString('utf-8');

    const { data, error } = await supabase
      .from('api_submodels')
      .select('sm_json')
      .eq('user_id', userId)
      .eq('submodel_id', smId)
      .maybeSingle();

    if (error) {
      return res.status(500).json(makeError(500, error.message));
    }

    if (!data) {
      return res.status(404).json(makeError(404, `Submodel mit ID "${smId}" nicht gefunden`));
    }

    res.json(data.sm_json);
  } catch (err) {
    res.status(500).json(makeError(500, err.message));
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

app.listen(PORT, () => {
  console.log(`AAS API läuft auf http://localhost:${PORT}`);
  console.log(`  GET /:userId/shells`);
  console.log(`  GET /:userId/shells/:aasId`);
  console.log(`  GET /:userId/submodels`);
  console.log(`  GET /:userId/submodels/:smId`);
});
