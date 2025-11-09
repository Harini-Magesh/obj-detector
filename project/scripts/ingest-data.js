import { createClient } from '@supabase/supabase-js'
import natural from 'natural'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const stopwords = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'up', 'about', 'into', 'through', 'during', 'is', 'are', 'was', 'were',
  'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'when', 'where',
  'why', 'how', 'as', 'if', 'than', 'because', 'while', 'where', 'so', 'not', 'no',
])

const documents = [
  {
    title: 'Alice in Wonderland',
    author: 'Lewis Carroll',
    content: `Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do. Once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, "and what is the use of a book," thought Alice, "without pictures or conversation?" So she was considering in her own mind, as well as she could, whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her. There was nothing so very remarkable in that; nor did Alice think it so very much out of the way to hear the Rabbit say to itself, "Oh dear! Oh dear! I shall be too late!"`,
  },
  {
    title: 'Frankenstein',
    author: 'Mary Shelley',
    content: `You will rejoice to hear that no disaster has accompanied the commencement of an enterprise which you have regarded with such evil forebodings. I arrived here yesterday, and my first task is to assure my dear sister of my welfare and increasing confidence in the success of my undertaking. I am already far north of London, and as I walk in the streets of Ingolstadt, I feel the chill of anticipation in every step. I have cross-examined my undertaking, and I assure you the prospect of success is not without merit. The creatures of my dreams shall be realized, and the unknown shall be made known.`,
  },
  {
    title: 'A Tale of Two Cities',
    author: 'Charles Dickens',
    content: `It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness. We had everything before us, we had nothing before us, we were all going direct to Heaven, we were all going direct the other way—in short, the period was so far like the present period, that some of its noisiest authorities insisted on its being received, for good or for evil, in the superlative degree of comparison only. There were a king with a large jaw and a queen with a fair face, on the throne of England. There were a king with a large jaw and a queen with a fair face, on the throne of France.`,
  },
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

async function ingestData() {
  console.log('Starting data ingestion...')

  try {
    for (const doc of documents) {
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
        console.error(`Error inserting document ${doc.title}:`, docError)
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
          .select()

        if (indexError) {
          console.error(`Error indexing word "${word}":`, indexError)
        }
      }

      console.log(`✓ Ingested ${doc.title} with ${wordFrequency.size} unique words`)
    }

    console.log('\n✓ Data ingestion complete!')
  } catch (error) {
    console.error('Fatal error during ingestion:', error)
    process.exit(1)
  }
}

ingestData()
