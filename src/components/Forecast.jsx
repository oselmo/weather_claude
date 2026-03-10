function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatHour(isoStr) {
  const d = new Date(isoStr)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })
}

export default function Forecast({ data }) {
  const { forecast, hourlyForecast, nwsSummaries } = data

  return (
    <div className="forecast">
      <h2 className="section-title">Hourly (24h)</h2>
      <div className="hourly-scroll">
        {hourlyForecast.map((h, i) => (
          <div key={i} className="hourly-card">
            <div className="hourly-time">{formatHour(h.time)}</div>
            <div className="hourly-emoji">{h.emoji}</div>
            <div className="hourly-temp">{h.temp}°</div>
            {h.precipProb > 0 && <div className="hourly-precip">💧{h.precipProb}%</div>}
          </div>
        ))}
      </div>

      <h2 className="section-title">7-Day Forecast</h2>
      <div className="daily-list">
        {forecast.map((day, i) => (
          <div key={i} className="daily-card">
            <div className="daily-date">{i === 0 ? 'Today' : formatDate(day.date)}</div>
            <div className="daily-emoji">{day.emoji}</div>
            <div className="daily-desc">{day.description}</div>
            <div className="daily-temps">
              <span className="daily-high">{day.high}°</span>
              <span className="daily-low">{day.low}°</span>
            </div>
            {day.precipProbability > 0 && (
              <div className="daily-precip">💧 {day.precipProbability}%</div>
            )}
            {nwsSummaries && nwsSummaries[i * 2] && (
              <div className="daily-nws">{nwsSummaries[i * 2].shortForecast}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
