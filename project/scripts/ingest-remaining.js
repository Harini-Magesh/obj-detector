import { createClient } from '@supabase/supabase-js'
import natural from 'natural'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

const stopwords = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'up', 'about', 'into', 'through', 'during', 'is', 'are', 'was', 'were',
  'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'when', 'where',
  'why', 'how', 'as', 'if', 'than', 'because', 'while', 'so', 'not', 'no',
])

const remainingDocuments = [
  {
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    content: `It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife. However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered as the rightful property of some one or other of their daughters. "My dear Mr. Bennet," said his lady to him one day, "have you heard that Netherfield Park is let at last?" Mr. Bennet replied that he had not. "But it is," returned she; "for Mrs. Long has just been here, and she told me all about it."`,
  },
  {
    title: 'Sherlock Holmes: A Scandal in Bohemia',
    author: 'Arthur Conan Doyle',
    content: `To Sherlock Holmes she is always the woman. I have seldom heard him mention her under any other name. In his eyes she eclipses and predominates the whole of her sex. It was not that he felt any emotion akin to love for Irene Adler. All emotions, and that one particularly, were abhorrent to his cold, precise but admirably balanced mind. He was, I take it, the most perfect reasoning and observing machine that the world has seen, but as a lover he would have placed himself in a false position. He never spoke of the softer passions, save with a gibe and a sneer.`,
  },
]

async function ingestDocuments() {
  console.log('Ingesting remaining documents...')

  for (const doc of remainingDocuments) {
    console.log(`Ingesting: ${doc.title}`)

    const { data: insertedDoc, error: docError } = await supabase
      .from('documents')
      .insert({
        title: doc.title,
        author: doc.author,
        content: doc.content,
      })
      .select()
      .single()

    if (docError) {
      console.error(`Error inserting ${doc.title}:`, docError.message)
      continue
    }

    const tokenizer = new natural.WordTokenizer()
    const tokens = tokenizer.tokenize(doc.content.toLowerCase())
    const wordFrequency = new Map()
    const wordPositions = new Map()

    tokens.forEach((token, index) => {
      if (token.match(/^[a-z]+$/) && !stopwords.has(token)) {
        wordFrequency.set(token, (wordFrequency.get(token) || 0) + 1)
        if (!wordPositions.has(token)) {
          wordPositions.set(token, [])
        }
        wordPositions.get(token).push(index)
      }
    })

    let indexedCount = 0
    for (const [word, frequency] of wordFrequency.entries()) {
      const positions = wordPositions.get(word) || []
      const { error: indexError } = await supabase
        .from('inverted_index')
        .insert({
          word,
          document_id: insertedDoc.id,
          frequency,
          positions,
        })

      if (!indexError) indexedCount++
    }

    console.log(`✓ ${doc.title}: indexed ${indexedCount} words`)
  }

  console.log('✓ Ingestion complete!')
}

ingestDocuments().catch(console.error)
