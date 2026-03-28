-- FADJR Migration: restaurant_ratings + user_favorites
-- À exécuter dans Supabase Dashboard > SQL Editor
-- https://supabase.com/dashboard/project/bpvrqphmxrnjrbjtaxuw/sql

-- Table: Notations restaurants
CREATE TABLE IF NOT EXISTS restaurant_ratings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  viande_rating integer DEFAULT 0 CHECK (viande_rating >= 0 AND viande_rating <= 5),
  accueil_rating integer DEFAULT 0 CHECK (accueil_rating >= 0 AND accueil_rating <= 5),
  prix_rating integer DEFAULT 0 CHECK (prix_rating >= 0 AND prix_rating <= 5),
  review text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(restaurant_id, user_id)
);

-- Table: Favoris cross-device
CREATE TABLE IF NOT EXISTS user_favorites (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, restaurant_id)
);

-- RLS
ALTER TABLE restaurant_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Policies ratings
CREATE POLICY "ratings_read_all" ON restaurant_ratings FOR SELECT USING (true);
CREATE POLICY "ratings_insert_own" ON restaurant_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ratings_update_own" ON restaurant_ratings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "ratings_delete_own" ON restaurant_ratings FOR DELETE USING (auth.uid() = user_id);

-- Policies favorites
CREATE POLICY "favs_own" ON user_favorites FOR ALL USING (auth.uid() = user_id);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_ratings_restaurant ON restaurant_ratings(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_favs_user ON user_favorites(user_id);
