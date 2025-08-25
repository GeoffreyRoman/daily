-- Migration pour passer au stockage des images en base64
-- ATTENTION: Sauvegardez votre base de données avant d'exécuter ce script !

-- 1. Supprimer l'ancienne table entry_images si elle existe
DROP TABLE IF EXISTS entry_images;

-- 2. Créer la nouvelle table avec le stockage base64
CREATE TABLE entry_images (
    id SERIAL PRIMARY KEY,
    entry_id INTEGER NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    image_data TEXT NOT NULL, -- Base64 de l'image
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Créer l'index pour les performances
CREATE INDEX idx_entry_images_entry_id ON entry_images(entry_id);

-- 4. Supprimer les colonnes images de journal_entries si elles existent
ALTER TABLE journal_entries DROP COLUMN IF EXISTS images;

SELECT 'Migration terminée ! Les images seront maintenant stockées en base64.' as message;
