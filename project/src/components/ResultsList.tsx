import React from 'react'
import { Document } from '../lib/supabase'
import './ResultsList.css'

interface ResultsListProps {
  results: Document[]
  query: string
}

export default function ResultsList({ results, query }: ResultsListProps) {
  if (results.length === 0) {
    return (
      <div className="no-results">
        {query ? `No results found for "${query}"` : 'Enter a search query to get started'}
      </div>
    )
  }

  const highlight = (text: string, words: string[]) => {
    if (!words.length) return text
    const regex = new RegExp(`(${words.join('|')})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, i) =>
      words.some(w => w.toLowerCase() === part.toLowerCase())
        ? `<mark>${part}</mark>`
        : part
    ).join('')
  }

  const getExcerpt = (content: string, query: string, length = 150) => {
    const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 0)
    const lowerContent = content.toLowerCase()

    let startIdx = 0
    for (const word of words) {
      const idx = lowerContent.indexOf(word)
      if (idx !== -1) {
        startIdx = Math.max(0, idx - 50)
        break
      }
    }

    const excerpt = content.substring(startIdx, startIdx + length)
    return excerpt.length < content.length ? '...' + excerpt + '...' : excerpt
  }

  return (
    <div className="results-container">
      <div className="results-header">
        <h2>Results ({results.length})</h2>
      </div>
      <div className="results-list">
        {results.map((doc) => (
          <div key={doc.id} className="result-item">
            <div className="result-header">
              <h3 className="result-title">{doc.title}</h3>
              <span className="result-author">{doc.author}</span>
            </div>
            <p className="result-excerpt">
              {getExcerpt(doc.content, query)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
