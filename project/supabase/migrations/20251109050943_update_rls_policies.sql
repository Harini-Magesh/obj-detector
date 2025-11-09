/*
  # Update RLS policies to allow inserts

  Allow authenticated users and service role to insert documents and index data.
  This is necessary for the data ingestion process to work.
*/

DROP POLICY IF EXISTS "Documents are publicly readable" ON documents;
DROP POLICY IF EXISTS "Inverted index is publicly readable" ON inverted_index;

CREATE POLICY "Documents are publicly readable"
  ON documents FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Documents can be inserted"
  ON documents FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Inverted index is publicly readable"
  ON inverted_index FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Inverted index can be inserted"
  ON inverted_index FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);