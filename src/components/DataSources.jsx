const STATUS_ICON = { ok: '✓', active: '⚠', unavailable: '—', error: '✗' }
const STATUS_CLASS = { ok: 'ds-ok', active: 'ds-active', unavailable: 'ds-unavail', error: 'ds-error' }

function SourceRow({ source }) {
  const icon = STATUS_ICON[source.status] ?? '?'
  const cls = STATUS_CLASS[source.status] ?? ''

  return (
    <div className={`ds-row ${cls}`}>
      <div className="ds-row-header">
        <span className={`ds-status-badge ${cls}`}>{icon}</span>
        <a href={source.url} target="_blank" rel="noopener noreferrer" className="ds-name">
          {source.name}
        </a>
        <span className="ds-details">{source.details}</span>
        {source.note && <span className="ds-note">{source.note}</span>}
      </div>
      <div className="ds-desc">{source.description}</div>
      {source.usedFor?.length > 0 && (
        <div className="ds-used-for">
          {source.usedFor.map((u, i) => <span key={i} className="ds-tag">{u}</span>)}
        </div>
      )}
      {source.stations?.length > 0 && (
        <div className="ds-station-ids">
          {source.stations.map((s, i) => (
            <span key={i} className="ds-station-chip" title={s.name}>{s.id}</span>
          ))}
        </div>
      )}
    </div>
  )
}

function buildLocalSourceMeta(localData) {
  if (!localData) {
    return [{
      id: 'backend',
      name: 'Backend Server',
      status: 'error',
      url: null,
      description: 'Local proxy server for TV station scraping and Synoptic Data — not running.',
      details: 'Run: npm run dev',
      usedFor: [],
      note: 'Start backend to enable local sources',
    }]
  }

  const meta = []

  // Synoptic
  const synStations = localData.synoptic?.stations ?? []
  const synError = localData.synoptic?.error
  meta.push({
    id: 'synoptic',
    name: 'Synoptic Data (MesoWest)',
    status: synStations.length > 0 ? 'ok' : (synError?.includes('No SYNOPTIC_TOKEN') ? 'unavailable' : 'error'),
    url: 'https://synopticdata.com/mesonet-api/',
    description: 'Real-time observations from 40,000+ stations: airports, highways, schools, farms, and more.',
    details: 'Free tier · API key required · .env setup',
    usedFor: synStations.length > 0 ? ['Hyperlocal sensor readings', 'Multi-network aggregation'] : [],
    note: synStations.length > 0
      ? `${synStations.length} stations within 30 mi`
      : (synError ?? 'No stations found'),
  })

  // TV stations
  const tvStations = localData.tvStations ?? []
  const tvOk = tvStations.filter((s) => !s.error && (s.temp != null || s.condition))
  const tvFailed = tvStations.filter((s) => s.error)

  if (tvStations.length > 0) {
    meta.push({
      id: 'tv-stations',
      name: 'Local TV Stations',
      status: tvOk.length > 0 ? 'ok' : 'error',
      url: null,
      description: 'Weather data scraped from local broadcast TV affiliate websites (Tegna, Hearst, Nexstar, Gray, Sinclair, Scripps networks).',
      details: 'Scraped · No API key · US markets',
      usedFor: tvOk.length > 0 ? tvOk.map((s) => `${s.callsign} — ${s.market}`) : [],
      note: tvFailed.length > 0
        ? `${tvFailed.length} station${tvFailed.length > 1 ? 's' : ''} blocked/unavailable`
        : null,
    })
  }

  return meta
}

export default function DataSources({ weatherData, localData }) {
  if (!weatherData) return null

  const coreMeta = weatherData.sourceMeta ?? []
  const localMeta = buildLocalSourceMeta(localData)
  const allSources = [...coreMeta, ...localMeta]

  const okCount = allSources.filter((s) => s.status === 'ok' || s.status === 'active').length
  const totalCount = allSources.length

  return (
    <div className="data-sources">
      <div className="ds-header">
        <h2 className="section-title">Data Sources</h2>
        <span className="ds-summary">{okCount} of {totalCount} active for {weatherData.current.location}</span>
      </div>
      <div className="ds-list">
        {allSources.map((s) => <SourceRow key={s.id} source={s} />)}
      </div>
    </div>
  )
}
