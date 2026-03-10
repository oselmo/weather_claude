function windDirLabel(deg) {
  const dirs = ['N','NE','E','SE','S','SW','W','NW']
  return dirs[Math.round(deg / 45) % 8]
}

function formatObsTime(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export default function CurrentWeather({ data, alerts }) {
  const { current, stationObservations } = data

  return (
    <div className="current-weather">
      <div className="cw-location">{current.location}</div>
      <div className="cw-main">
        <span className="cw-emoji">{current.emoji}</span>
        <span className="cw-temp">{current.temp}°F</span>
      </div>
      <div className="cw-desc">{current.description}</div>
      <div className="cw-feels">Feels like {current.feelsLike}°F</div>

      <div className="cw-details">
        <div className="cw-detail"><span className="detail-label">Humidity</span><span>{current.humidity}%</span></div>
        <div className="cw-detail">
          <span className="detail-label">Wind</span>
          <span>
            {current.windSpeed} mph {current.windDir != null ? windDirLabel(current.windDir) : ''}
            {current.windGust ? ` (gusts ${current.windGust})` : ''}
          </span>
        </div>
        {current.dewpoint != null && (
          <div className="cw-detail"><span className="detail-label">Dewpoint</span><span>{current.dewpoint}°F</span></div>
        )}
        {current.barometricPressure != null && (
          <div className="cw-detail"><span className="detail-label">Pressure</span><span>{current.barometricPressure} inHg</span></div>
        )}
        <div className="cw-detail"><span className="detail-label">Visibility</span><span>{current.visibility} mi</span></div>
        <div className="cw-detail"><span className="detail-label">Cloud cover</span><span>{current.cloudCover}%</span></div>
        {current.precipLastHour != null && current.precipLastHour > 0 && (
          <div className="cw-detail"><span className="detail-label">Precip (1h)</span><span>{current.precipLastHour}"</span></div>
        )}
        {current.precipLast3Hours != null && current.precipLast3Hours > 0 && (
          <div className="cw-detail"><span className="detail-label">Precip (3h)</span><span>{current.precipLast3Hours}"</span></div>
        )}
        {current.maxTemp24h != null && (
          <div className="cw-detail"><span className="detail-label">24h High</span><span>{current.maxTemp24h}°F</span></div>
        )}
        {current.minTemp24h != null && (
          <div className="cw-detail"><span className="detail-label">24h Low</span><span>{current.minTemp24h}°F</span></div>
        )}
      </div>

      {alerts.length > 0 && (
        <div className="alerts">
          {alerts.map((a, i) => (
            <div key={i} className={`alert alert-${a.severity?.toLowerCase() ?? 'unknown'}`}>
              <strong>{a.event}</strong>
              <p>{a.headline}</p>
            </div>
          ))}
        </div>
      )}

      {stationObservations?.length > 0 && (
        <div className="stations-section">
          <div className="stations-title">Nearby NOAA Observation Stations</div>
          {stationObservations.map((s, i) => (
            <div key={i} className="station-card">
              <div className="station-header">
                <span className="station-id">{s.stationId}</span>
                <span className="station-name">{s.stationName}</span>
                {s.timestamp && <span className="station-time">as of {formatObsTime(s.timestamp)}</span>}
              </div>
              <div className="station-obs">
                {s.temp != null && <span className="station-obs-item"><span className="obs-label">Temp</span> {s.temp}°F</span>}
                {s.dewpoint != null && <span className="station-obs-item"><span className="obs-label">Dew</span> {s.dewpoint}°F</span>}
                {s.humidity != null && <span className="station-obs-item"><span className="obs-label">RH</span> {s.humidity}%</span>}
                {s.windSpeed != null && (
                  <span className="station-obs-item">
                    <span className="obs-label">Wind</span> {s.windSpeed} mph
                    {s.windDirection != null ? ` ${windDirLabel(s.windDirection)}` : ''}
                    {s.windGust ? ` G${s.windGust}` : ''}
                  </span>
                )}
                {s.barometricPressure != null && <span className="station-obs-item"><span className="obs-label">Pres</span> {s.barometricPressure} inHg</span>}
                {s.visibility != null && <span className="station-obs-item"><span className="obs-label">Vis</span> {s.visibility} mi</span>}
                {s.textDescription && <span className="station-obs-item station-obs-desc">{s.textDescription}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="cw-sources">Sources: {data.sources.join(' · ')}</div>
    </div>
  )
}
