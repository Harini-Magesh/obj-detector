import React, { useState } from 'react'
import { searchDocuments, Document } from '../lib/supabase'
import './SearchBar.css'

interface SearchBarProps {
  onSearch: (results: Document[]) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

export default function SearchBar({ onSearch, isLoading, setIsLoading }: SearchBarProps) {
  const [query, setQuery] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsLoading(true)
    try {
      const results = await searchDocuments(query)
      onSearch(results)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSearch} className="search-bar">
      <div className="search-input-wrapper">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search across all documents..."
          className="search-input"
          disabled={isLoading}
        />
        <button type="submit" className="search-button" disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>
    </form>
  )
}
