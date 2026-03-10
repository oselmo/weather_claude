function windDirLabel(deg) {
  const dirs = ['N','NE','E','SE','S','SW','W','NW']
  return dirs[Math.round(deg / 45) % 8]
}

function formatTime(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function SynopticSection({ stations }) {
  if (!stations?.length) return null
  return (
    <div className="local-section">
      <div className="local-section-title">Synoptic Network Stations (40k+ sensors)</div>
      <div className="synoptic-grid">
        {stations.map((s, i) => (
          <div key={i} className="synoptic-card">
            <div className="synoptic-header">
              <span className="synoptic-id">{s.stationId}</span>
              <span className="synoptic-name">{s.stationName}</span>
              {s.distance && <span className="synoptic-dist">{s.distance}</span>}
            </div>
            {s.network && <div className="synoptic-network">{s.network}{s.elevation ? ` · ${s.elevation}` : ''}</div>}
            <div className="synoptic-obs">
              {s.temp != null && <span className="syn-item"><span className="obs-label">Temp</span> {s.temp}°F</span>}
              {s.dewpoint != null && <span className="syn-item"><span className="obs-label">Dew</span> {s.dewpoint}°F</span>}
              {s.humidity != null && <span className="syn-item"><span className="obs-label">RH</span> {s.humidity}%</span>}
              {s.windSpeed != null && (
                <span className="syn-item">
                  <span className="obs-label">Wind</span> {s.windSpeed} mph
                  {s.windDirection != null ? ` ${windDirLabel(s.windDirection)}` : ''}
                  {s.windGust ? ` G${s.windGust}` : ''}
                </span>
              )}
              {s.pressure != null && <span className="syn-item"><span className="obs-label">Pres</span> {s.pressure} inHg</span>}
              {s.visibility != null && <span className="syn-item"><span className="obs-label">Vis</span> {s.visibility} mi</span>}
              {s.precipLastHour != null && s.precipLastHour > 0 && (
                <span className="syn-item"><span className="obs-label">Precip 1h</span> {s.precipLastHour}"</span>
              )}
            </div>
            {s.timestamp && <div className="synoptic-time">Observed {formatTime(s.timestamp)}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

function TvStationsSection({ stations }) {
  const valid = (stations ?? []).filter((s) => !s.error && (s.temp != null || s.condition || s.narrative))
  const errored = (stations ?? []).filter((s) => s.error)

  if (!valid.length && !errored.length) return null

  return (
    <div className="local-section">
      <div className="local-section-title">Local TV Station Weather</div>
      {valid.map((s, i) => (
        <div key={i} className="tv-card">
          <div className="tv-header">
            <span className="tv-callsign">{s.callsign}</span>
            <span className="tv-market">{s.market}</span>
            {s.distance != null && <span className="tv-dist">{s.distance} mi away</span>}
            <a href={s.url} target="_blank" rel="noopener noreferrer" className="tv-link">↗</a>
          </div>
          <div className="tv-obs">
            {s.temp != null && <span className="syn-item"><span className="obs-label">Temp</span> {s.temp}°F</span>}
            {s.condition && <span className="syn-item"><span className="obs-label">Cond</span> {s.condition}</span>}
          </div>
          {s.narrative && <div className="tv-narrative">{s.narrative}</div>}
        </div>
      ))}
      {errored.length > 0 && (
        <div className="tv-errors">
          {errored.map((s, i) => (
            <span key={i} className="tv-error-item">
              {s.callsign} ({s.market}) — {s.error === 'timeout' ? 'timed out' : s.error}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function LocalWeather({ data }) {
  if (!data) {
    return (
      <div className="local-weather local-weather-unavailable">
        <span>Local station data unavailable — is the backend server running? (<code>npm run dev</code>)</span>
      </div>
    )
  }

  const hasSynoptic = data.synoptic?.stations?.length > 0
  const hasTv = data.tvStations?.some((s) => !s.error && (s.temp != null || s.condition))
  if (!hasSynoptic && !hasTv) return null

  return (
    <div className="local-weather">
      <h2 className="section-title">Local Weather Sources</h2>
      {data.synoptic?.error && !hasSynoptic && (
        <p className="local-warning">{data.synoptic.error}</p>
      )}
      <SynopticSection stations={data.synoptic?.stations} />
      <TvStationsSection stations={data.tvStations} />
      <div className="local-fetched">
        Data fetched {data.fromCache ? '(cached) ' : ''}at {formatTime(data.fetchedAt)}
      </div>
    </div>
  )
}
