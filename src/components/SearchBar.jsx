import { useState, useRef, useEffect } from 'react'
import { searchLocation } from '../services/geocoding.js'

export default function SearchBar({ onSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const timeoutRef = useRef(null)

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await searchLocation(query)
        setResults(data)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 400)
    return () => clearTimeout(timeoutRef.current)
  }, [query])

  function handleSelect(loc) {
    setQuery('')
    setResults([])
    onSelect({
      name: [loc.name, loc.admin1, loc.country].filter(Boolean).join(', '),
      lat: loc.latitude,
      lon: loc.longitude,
      admin1: loc.admin1 ?? null,       // state / province / region name
      countryCode: loc.country_code ?? null,
    })
  }

  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="Search city..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="search-input"
      />
      {loading && <div className="search-loading">Searching…</div>}
      {results.length > 0 && (
        <ul className="search-results">
          {results.map((loc, i) => (
            <li key={i} onClick={() => handleSelect(loc)} className="search-result-item">
              {loc.name}{loc.admin1 ? `, ${loc.admin1}` : ''}{loc.country ? `, ${loc.country}` : ''}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
