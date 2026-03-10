import { fetchOpenMeteo, fetchOpenMeteoModels, wmoDescription, wmoEmoji } from './openMeteo.js'
import { fetchNWSAlerts, fetchNWSForecasts, fetchNWSStationObservations } from './nwsService.js'

const avg      = arr => { const v = arr.filter(x => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null }
const avgRound = arr => { const v = avg(arr); return v != null ? Math.round(v) : null }

function buildAveragedHourly(models, nwsHourly) {
  const baseline = models[0]
  if (!baseline) return []
  const now = new Date()
  return baseline.hourly.time
    .map((time, i) => {
      const temps  = models.map(m => m.hourly.temperature_2m[i]).filter(x => x != null)
      const probs  = models.map(m => m.hourly.precipitation_probability[i]).filter(x => x != null)
      const winds  = models.map(m => m.hourly.wind_speed_10m?.[i]).filter(x => x != null)
      if (nwsHourly) {
        const nws = nwsHourly.find(h => h.time.substring(0, 13) === time.substring(0, 13))
        if (nws?.temp      != null) temps.push(nws.temp)
        if (nws?.precipProb != null) probs.push(nws.precipProb)
        if (nws?.windSpeed  != null) winds.push(nws.windSpeed)
      }
      return {
        time,
        temp: avgRound(temps),
        weatherCode: baseline.hourly.weather_code[i],
        emoji: wmoEmoji(baseline.hourly.weather_code[i]),
        precipProb: avgRound(probs),
        windSpeed: avgRound(winds),
        modelCount: temps.length,
      }
    })
    .filter(h => new Date(h.time) >= now)
    .slice(0, 24)
}

function buildAveragedDaily(models) {
  const baseline = models[0]
  if (!baseline) return []
  return baseline.daily.time.map((date, i) => ({
    date,
    high: avgRound(models.map(m => m.daily.temperature_2m_max[i])),
    low:  avgRound(models.map(m => m.daily.temperature_2m_min[i])),
    weatherCode: baseline.daily.weather_code[i],
    description: wmoDescription(baseline.daily.weather_code[i]),
    emoji: wmoEmoji(baseline.daily.weather_code[i]),
    precipSum: +(avg(models.map(m => m.daily.precipitation_sum[i])) ?? 0).toFixed(2),
    precipProbability: avgRound(models.map(m => m.daily.precipitation_probability_max[i])),
    windMax: avgRound(models.map(m => m.daily.wind_speed_10m_max[i])),
    sunrise: baseline.daily.sunrise[i],
    sunset:  baseline.daily.sunset[i],
    modelCount: models.length,
  }))
}

export async function fetchWeather(lat, lon, locationName) {
  // Fetch all sources in parallel
  const [meteo, models, alerts, nwsForecasts, stationObservations] = await Promise.all([
    fetchOpenMeteo(lat, lon),
    fetchOpenMeteoModels(lat, lon),
    fetchNWSAlerts(lat, lon),
    fetchNWSForecasts(lat, lon),
    fetchNWSStationObservations(lat, lon),
  ])
  const nwsForecast = nwsForecasts.textPeriods
  const nwsHourly   = nwsForecasts.hourlyPeriods

  const c = meteo.current
  const effectiveModels = models.length > 0 ? models : [meteo]

  // Prefer real NOAA station temp/humidity/wind if available and recent (< 2h old)
  const primaryStation = stationObservations[0]
  const stationIsRecent =
    primaryStation?.timestamp &&
    Date.now() - new Date(primaryStation.timestamp).getTime() < 2 * 60 * 60 * 1000

  const current = {
    location: locationName,
    lat,
    lon,
    // Use station-observed values when fresh; fall back to model (Open-Meteo)
    temp: stationIsRecent && primaryStation.temp != null
      ? primaryStation.temp
      : Math.round(c.temperature_2m),
    feelsLike: stationIsRecent && (primaryStation.windChill ?? primaryStation.heatIndex) != null
      ? (primaryStation.windChill ?? primaryStation.heatIndex)
      : Math.round(c.apparent_temperature),
    humidity: stationIsRecent && primaryStation.humidity != null
      ? primaryStation.humidity
      : c.relative_humidity_2m,
    windSpeed: stationIsRecent && primaryStation.windSpeed != null
      ? primaryStation.windSpeed
      : Math.round(c.wind_speed_10m),
    windGust: stationIsRecent ? primaryStation.windGust : null,
    windDir: stationIsRecent && primaryStation.windDirection != null
      ? primaryStation.windDirection
      : c.wind_direction_10m,
    dewpoint: stationIsRecent ? primaryStation.dewpoint : null,
    barometricPressure: stationIsRecent ? primaryStation.barometricPressure : null,
    precipitation: c.precipitation,
    precipLastHour: stationIsRecent ? primaryStation.precipLastHour : null,
    precipLast3Hours: stationIsRecent ? primaryStation.precipLast3Hours : null,
    cloudCover: c.cloud_cover,
    cloudLayers: stationIsRecent ? primaryStation.cloudLayers : [],
    visibility: stationIsRecent && primaryStation.visibility != null
      ? primaryStation.visibility
      : +(c.visibility / 1609.34).toFixed(1), // convert m → miles
    weatherCode: c.weather_code,
    description: stationIsRecent && primaryStation.textDescription
      ? primaryStation.textDescription
      : wmoDescription(c.weather_code),
    emoji: wmoEmoji(c.weather_code),
    maxTemp24h: stationIsRecent ? primaryStation.maxTemp24h : null,
    minTemp24h: stationIsRecent ? primaryStation.minTemp24h : null,
    tempSource: stationIsRecent && primaryStation.temp != null ? primaryStation.stationId : 'Open-Meteo',
  }

  // Build multi-model averaged forecast and hourly
  const forecast      = buildAveragedDaily(effectiveModels)
  const hourlyForecast = buildAveragedHourly(effectiveModels, nwsHourly)

  // NWS narrative summaries (US only)
  const nwsSummaries = nwsForecast
    ? nwsForecast.slice(0, 14).map((p) => ({
        name: p.name,
        shortForecast: p.shortForecast,
        detailedForecast: p.detailedForecast,
        isDaytime: p.isDaytime,
      }))
    : null

  const modelLabels = effectiveModels.map(m => m._label).filter(Boolean)
  const activeSources = [
    ...modelLabels,
    ...(nwsHourly   ? ['NWS Hourly'] : []),
    ...(nwsForecast ? ['NWS Forecast'] : []),
    ...(stationObservations.length > 0 ? [`NOAA Stations (${stationObservations.length})`] : []),
  ]

  // Rich metadata for the DataSources panel
  const sourceMeta = [
    {
      id: 'open-meteo',
      name: `Open-Meteo (${modelLabels.length > 0 ? modelLabels.join(', ') : 'GFS'})`,
      status: 'ok',
      url: 'https://open-meteo.com',
      description: `Multi-model average from ${modelLabels.join(', ')} weather models. Provides current conditions, hourly & 7-day forecast.`,
      details: `Free · No API key · Global · ${modelLabels.length} model${modelLabels.length !== 1 ? 's' : ''} averaged`,
      usedFor: ['Current weather', '7-day forecast (averaged)', 'Hourly forecast (averaged)'],
    },
    {
      id: 'nws-forecast',
      name: 'NWS Forecast',
      status: nwsForecast ? 'ok' : 'unavailable',
      url: 'https://api.weather.gov',
      description: 'US National Weather Service official forecast text and hourly gridpoint data from local forecast offices.',
      details: 'Free · No API key · US only',
      usedFor: nwsForecast
        ? ['Forecast narrative summaries', ...(nwsHourly ? ['Hourly forecast (averaged in)'] : [])]
        : [],
      note: nwsForecast ? null : 'Outside US coverage area',
    },
    {
      id: 'nws-alerts',
      name: 'NWS Alerts',
      status: alerts.length > 0 ? 'active' : 'ok',
      url: 'https://api.weather.gov',
      description: 'Active weather watches, warnings, and advisories from the National Weather Service.',
      details: 'Free · No API key · US only',
      usedFor: ['Weather alerts & warnings'],
      count: alerts.length,
      note: alerts.length > 0 ? `${alerts.length} active alert${alerts.length > 1 ? 's' : ''}` : 'No active alerts',
    },
    {
      id: 'noaa-stations',
      name: 'NOAA Observation Stations',
      status: stationObservations.length > 0 ? 'ok' : 'unavailable',
      url: 'https://api.weather.gov',
      description: 'Real measured sensor data from physical NOAA weather stations near the location.',
      details: 'Free · No API key · US only',
      usedFor: stationObservations.length > 0
        ? ['Current temp, humidity, wind (observed)', 'Barometric pressure', 'Precipitation accumulation', 'Dewpoint']
        : [],
      stations: stationObservations.map((s) => ({ id: s.stationId, name: s.stationName })),
      note: stationObservations.length > 0
        ? `${stationObservations.length} station${stationObservations.length > 1 ? 's' : ''} found`
        : 'Outside US coverage area',
    },
    {
      id: 'rainviewer',
      name: 'RainViewer Radar',
      status: 'ok',
      url: 'https://www.rainviewer.com/api.html',
      description: 'Live precipitation radar tiles updated every 10 minutes, displayed on the map.',
      details: 'Free · No API key · Global coverage',
      usedFor: ['Radar map overlay'],
    },
  ]

  return {
    current,
    forecast,
    hourlyForecast,
    alerts,
    nwsSummaries,
    stationObservations,
    sources: activeSources,
    sourceMeta,
  }
}
