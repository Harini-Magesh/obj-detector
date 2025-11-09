/*
  # Create Search Engine Schema

  1. New Tables
    - `documents`
      - `id` (uuid, primary key)
      - `title` (text)
      - `author` (text)
      - `content` (text)
      - `created_at` (timestamp)
    
    - `inverted_index`
      - `id` (uuid, primary key)
      - `word` (text)
      - `document_id` (uuid, foreign key)
      - `frequency` (integer)
      - `positions` (integer array)
  
  2. Indexes
    - Index on `inverted_index.word` for fast word lookups
    - Index on `inverted_index.document_id` for document queries
  
  3. Security
    - Enable RLS on both tables
    - Allow public read access (search engine is public-facing)
*/

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inverted_index (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word text NOT NULL,
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  frequency integer NOT NULL DEFAULT 1,
  positions integer[] DEFAULT ARRAY[]::integer[],
  created_at timestamptz DEFAULT now(),
  UNIQUE(word, document_id)
);

CREATE INDEX IF NOT EXISTS idx_inverted_index_word ON inverted_index(word);
CREATE INDEX IF NOT EXISTS idx_inverted_index_document_id ON inverted_index(document_id);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE inverted_index ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Documents are publicly readable"
  ON documents FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Inverted index is publicly readable"
  ON inverted_index FOR SELECT
  TO public
  USING (true);