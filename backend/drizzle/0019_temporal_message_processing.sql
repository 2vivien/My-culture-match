ALTER TABLE temporal_messages ADD COLUMN IF NOT EXISTS processing_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS temporal_messages_processing_idx
  ON temporal_messages(processing_at)
  WHERE revealed_at IS NULL AND cancelled_at IS NULL;
