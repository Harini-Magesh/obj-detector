import React, { useState } from 'react'
import SearchBar from './components/SearchBar'
import ResultsList from './components/ResultsList'
import { Document } from './lib/supabase'
import './App.css'

export default function App() {
  const [results, setResults] = useState<Document[]>([])
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = (searchResults: Document[]) => {
    setResults(searchResults)
  }

  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery)
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>Text Search Engine</h1>
          <p>Search across classic literature from Project Gutenberg</p>
        </div>
      </header>

      <main className="app-main">
        <div className="search-container">
          <SearchBar
            onSearch={handleSearch}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        </div>

        <div className="results-container">
          <ResultsList results={results} query={query} />
        </div>
      </main>
    </div>
  )
}
