import { useState, useCallback, useEffect } from 'react'
import SearchBar from './components/SearchBar.jsx'
import CurrentWeather from './components/CurrentWeather.jsx'
import Forecast from './components/Forecast.jsx'
import RadarMap from './components/RadarMap.jsx'
import LocalWeather from './components/LocalWeather.jsx'
import DataSources from './components/DataSources.jsx'
import { fetchWeather } from './services/weatherAggregator.js'
import { fetchLocalWeather } from './services/localWeatherService.js'
import './App.css'

const STORAGE_KEY = 'weather_last_location'

export default function App() {
  const [weatherData, setWeatherData] = useState(null)
  const [localData, setLocalData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadLocation = useCallback(async ({ name, lat, lon, admin1, countryCode }) => {
    setLoading(true)
    setError(null)
    setLocalData(null)
    try {
      const [data, local] = await Promise.all([
        fetchWeather(lat, lon, name),
        fetchLocalWeather(lat, lon, admin1, countryCode),
      ])
      setWeatherData(data)
      setLocalData(local)
    } catch (e) {
      setError(e.message ?? 'Failed to fetch weather data.')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleLocationSelect = useCallback((loc) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loc))
    loadLocation(loc)
  }, [loadLocation])

  // Restore last searched location on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try { loadLocation(JSON.parse(saved)) } catch { /* ignore corrupt data */ }
    }
  }, [loadLocation])

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">🌸 Weather</h1>
        <SearchBar onSelect={handleLocationSelect} />
      </header>

      <main className="app-main">
        {loading && <div className="status-msg">Loading weather data…</div>}
        {error && <div className="status-msg error">{error}</div>}

        {!loading && !weatherData && !error && (
          <div className="empty-state">
            <p>Search for a city to get started.</p>
          </div>
        )}

        {weatherData && !loading && (
          <>
            <CurrentWeather data={weatherData} alerts={weatherData.alerts} />
            <RadarMap lat={weatherData.current.lat} lon={weatherData.current.lon} />
            <Forecast data={weatherData} />
            <LocalWeather data={localData} />
            <DataSources weatherData={weatherData} localData={localData} />
          </>
        )}
      </main>
    </div>
  )
}
