-- Enable RLS on all user-data tables
-- Run this in Supabase Dashboard → SQL Editor

-- ============================================================
-- projects
-- ============================================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- api_shells (published AAS shells)
-- ============================================================
ALTER TABLE api_shells ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_shells" ON api_shells
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_shells" ON api_shells
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_shells" ON api_shells
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- api_submodels (published submodels)
-- ============================================================
ALTER TABLE api_submodels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_submodels" ON api_submodels
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_submodels" ON api_submodels
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_submodels" ON api_submodels
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- external_repositories
-- ============================================================
ALTER TABLE external_repositories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_repos" ON external_repositories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_repos" ON external_repositories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_repos" ON external_repositories
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_repos" ON external_repositories
  FOR DELETE USING (auth.uid() = user_id);
