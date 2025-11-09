import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

export interface Document {
  id: string
  title: string
  author: string
  content: string
  created_at: string
}

export interface InvertedIndexEntry {
  id: string
  word: string
  document_id: string
  frequency: number
  positions: number[]
  created_at: string
}

export async function searchDocuments(query: string): Promise<Document[]> {
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 0)

  if (words.length === 0) return []

  const { data: results, error } = await supabase
    .from('inverted_index')
    .select('document_id, frequency')
    .in('word', words)

  if (error) {
    console.error('Search error:', error)
    return []
  }

  const docScores = new Map<string, number>()
  results.forEach(r => {
    const current = docScores.get(r.document_id) || 0
    docScores.set(r.document_id, current + r.frequency)
  })

  const sortedIds = Array.from(docScores.entries())
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0])

  if (sortedIds.length === 0) return []

  const { data: documents, error: docError } = await supabase
    .from('documents')
    .select('*')
    .in('id', sortedIds)

  if (docError) {
    console.error('Document fetch error:', docError)
    return []
  }

  return documents.sort((a, b) => sortedIds.indexOf(a.id) - sortedIds.indexOf(b.id))
}

export async function getDocuments(): Promise<Document[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching documents:', error)
    return []
  }

  return data || []
}
