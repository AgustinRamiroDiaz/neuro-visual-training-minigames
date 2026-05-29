ALTER TABLE play_history ADD COLUMN IF NOT EXISTS client_id TEXT;

UPDATE play_history
SET client_id = id::text
WHERE client_id IS NULL;

ALTER TABLE play_history ALTER COLUMN client_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS play_history_user_client_id_idx
ON play_history (user_id, client_id);
