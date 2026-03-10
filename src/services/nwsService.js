// National Weather Service API — free, no key, US only
const BASE = 'https://api.weather.gov'
const HEADERS = { 'User-Agent': 'WeatherApp/1.0 (contact@weatherapp.local)' }

// Haversine distance in miles between two lat/lon points
function distanceMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.8
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export async function fetchNWSAlerts(lat, lon) {
  try {
    const res = await fetch(`${BASE}/alerts/active?point=${lat},${lon}`, { headers: HEADERS })
    if (!res.ok) return []
    const data = await res.json()
    return (data.features ?? []).map((f) => ({
      event: f.properties.event,
      headline: f.properties.headline,
      severity: f.properties.severity,
      urgency: f.properties.urgency,
      description: f.properties.description,
      expires: f.properties.expires,
    }))
  } catch {
    return []
  }
}

// Returns both 7-day text forecast AND hourly gridpoint forecast in one /points lookup.
export async function fetchNWSForecasts(lat, lon) {
  try {
    const pointRes = await fetch(`${BASE}/points/${lat},${lon}`, { headers: HEADERS })
    if (!pointRes.ok) return { textPeriods: null, hourlyPeriods: null }
    const props = (await pointRes.json()).properties ?? {}

    const [textRes, hourlyRes] = await Promise.all([
      props.forecast       ? fetch(props.forecast,       { headers: HEADERS }) : Promise.resolve(null),
      props.forecastHourly ? fetch(props.forecastHourly, { headers: HEADERS }) : Promise.resolve(null),
    ])

    const textPeriods = textRes?.ok
      ? ((await textRes.json()).properties?.periods ?? null)
      : null

    let hourlyPeriods = null
    if (hourlyRes?.ok) {
      hourlyPeriods = ((await hourlyRes.json()).properties?.periods ?? []).map(p => ({
        time: p.startTime,
        temp: p.temperatureUnit === 'F' ? p.temperature : Math.round(p.temperature * 9 / 5 + 32),
        windSpeed: parseInt(p.windSpeed) || null,
        precipProb: p.probabilityOfPrecipitation?.value ?? null,
        shortForecast: p.shortForecast,
      }))
    }

    return { textPeriods, hourlyPeriods }
  } catch {
    return { textPeriods: null, hourlyPeriods: null }
  }
}

export async function fetchNWSForecast(lat, lon) {
  const { textPeriods } = await fetchNWSForecasts(lat, lon)
  return textPeriods
}

// Fetch actual measured observations from up to 3 nearest NOAA weather stations.
// Covers real sensor data: barometric pressure, dewpoint, heat index, wind chill, etc.
export async function fetchNWSStationObservations(lat, lon) {
  try {
    // The correct stations URL comes from the /points response, not /points/{lat},{lon}/stations
    const pointRes = await fetch(`${BASE}/points/${lat},${lon}`, { headers: HEADERS })
    if (!pointRes.ok) return []
    const pointData = await pointRes.json()
    const stationsUrl = pointData.properties?.observationStations
    if (!stationsUrl) return []

    const stationsRes = await fetch(`${stationsUrl}?limit=10`, { headers: HEADERS })
    if (!stationsRes.ok) return []
    const stationsData = await stationsRes.json()
    const stations = (stationsData.features ?? [])
      .filter(s => {
        const [sLon, sLat] = s.geometry?.coordinates ?? []
        return sLat != null && distanceMiles(lat, lon, sLat, sLon) <= 100
      })
      .slice(0, 3)
    if (stations.length === 0) return []

    const observations = await Promise.all(
      stations.map((station) => fetchSingleStationObs(station))
    )
    return observations.filter(Boolean)
  } catch {
    return []
  }
}

async function fetchSingleStationObs(station) {
  try {
    const stationId = station.properties.stationIdentifier
    const stationName = station.properties.name
    const res = await fetch(`${BASE}/stations/${stationId}/observations/latest`, { headers: HEADERS })
    if (!res.ok) return null
    const data = await res.json()
    const p = data.properties
    if (!p) return null

    // NWS values arrive in SI units — convert to imperial
    const cToF = (c) => (c != null ? Math.round(c * 9 / 5 + 32) : null)
    const msToMph = (ms) => (ms != null ? Math.round(ms * 2.23694) : null)
    const paToInHg = (pa) => (pa != null ? +(pa / 3386.39).toFixed(2) : null)
    const mToMiles = (m) => (m != null ? +(m / 1609.34).toFixed(1) : null)
    const mmToIn = (mm) => (mm != null ? +(mm / 25.4).toFixed(2) : null)

    return {
      stationId,
      stationName,
      timestamp: p.timestamp,
      textDescription: p.textDescription || null,
      temp: cToF(p.temperature?.value),
      dewpoint: cToF(p.dewpoint?.value),
      windDirection: p.windDirection?.value ?? null,
      windSpeed: msToMph(p.windSpeed?.value),
      windGust: msToMph(p.windGust?.value),
      windChill: cToF(p.windChill?.value),
      heatIndex: cToF(p.heatIndex?.value),
      humidity: p.relativeHumidity?.value != null ? Math.round(p.relativeHumidity.value) : null,
      barometricPressure: paToInHg(p.barometricPressure?.value),
      seaLevelPressure: paToInHg(p.seaLevelPressure?.value),
      visibility: mToMiles(p.visibility?.value),
      precipLastHour: mmToIn(p.precipitationLastHour?.value),
      precipLast3Hours: mmToIn(p.precipitationLast3Hours?.value),
      precipLast6Hours: mmToIn(p.precipitationLast6Hours?.value),
      maxTemp24h: cToF(p.maxTemperatureLast24Hours?.value),
      minTemp24h: cToF(p.minTemperatureLast24Hours?.value),
      cloudLayers: (p.cloudLayers ?? []).map((cl) => ({
        base: cl.base?.value != null ? Math.round(cl.base.value * 3.28084) + ' ft' : null,
        amount: cl.amount,
      })),
      presentWeather: (p.presentWeather ?? [])
        .map((w) => w.weather)
        .filter(Boolean),
      source: 'NOAA Observation Station',
    }
  } catch {
    return null
  }
}
