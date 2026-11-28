-- Profil Love : réponses au questionnaire de première utilisation (6 questions, modifiables).
CREATE TABLE IF NOT EXISTS love_profiles (
  user_id    TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  answers    JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
