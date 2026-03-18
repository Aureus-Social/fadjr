-- ═══════════════════════════════════════════════════════════════
-- FADJR Sprint 5 — Migration Supabase
-- Exécuter dans : Supabase Dashboard → SQL Editor
-- Projet : bpvrqphmxrnjrbjtaxuw (Frankfurt)
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Table profiles ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT,
  city          TEXT DEFAULT 'Bruxelles',
  lat           NUMERIC(10,6) DEFAULT 50.8503,
  lng           NUMERIC(10,6) DEFAULT 4.3517,
  notif_enabled BOOLEAN DEFAULT false,
  lang          TEXT DEFAULT 'fr',
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- RLS profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Utilisateur voit son propre profil"
  ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Utilisateur modifie son propre profil"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Utilisateur met a jour son propre profil"
  ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- ── 2. Table prayer_tracker ───────────────────────────────────
CREATE TABLE IF NOT EXISTS prayer_tracker (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  prayers     JSONB NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

-- RLS prayer_tracker
ALTER TABLE prayer_tracker ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tracker visible par l'utilisateur"
  ON prayer_tracker FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Tracker inseré par l'utilisateur"
  ON prayer_tracker FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Tracker mis a jour par l'utilisateur"
  ON prayer_tracker FOR UPDATE USING (auth.uid() = user_id);

-- ── 3. Trigger auto updated_at ────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_tracker
  BEFORE UPDATE ON prayer_tracker
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Vérification ──────────────────────────────────────────────
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('profiles', 'prayer_tracker');
