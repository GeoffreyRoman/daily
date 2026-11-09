-- Migration idempotente pour les fonctionnalités humeur, tags et favoris.
-- À exécuter sur la base PostgreSQL distante avant de déployer l'API.
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS prompt TEXT;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS mood VARCHAR(50);
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_journal_entries_favorite
  ON journal_entries(user_id, is_favorite);
CREATE INDEX IF NOT EXISTS idx_journal_entries_tags
  ON journal_entries USING GIN(tags);
