// Open-Meteo Weather API — free, no key, global coverage
const BASE = 'https://api.open-meteo.com/v1/forecast'

const CURRENT_VARS = [
  'temperature_2m',
  'relative_humidity_2m',
  'apparent_temperature',
  'weather_code',
  'wind_speed_10m',
  'wind_direction_10m',
  'precipitation',
  'cloud_cover',
  'visibility',
].join(',')

const HOURLY_VARS = [
  'temperature_2m',
  'weather_code',
  'precipitation_probability',
  'wind_speed_10m',
].join(',')

const DAILY_VARS = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'precipitation_sum',
  'precipitation_probability_max',
  'wind_speed_10m_max',
  'sunrise',
  'sunset',
].join(',')

// Fetch hourly + daily from 3 weather models (GFS, ECMWF, ICON) for multi-model averaging
const FORECAST_MODELS = ['gfs_seamless', 'ecmwf_ifs025', 'icon_global']
const MODEL_LABELS    = ['GFS', 'ECMWF', 'ICON']

export async function fetchOpenMeteoModels(lat, lon) {
  const baseParams = {
    latitude: lat,
    longitude: lon,
    hourly: HOURLY_VARS,
    daily: DAILY_VARS,
    temperature_unit: 'fahrenheit',
    wind_speed_unit: 'mph',
    precipitation_unit: 'inch',
    timezone: 'auto',
    forecast_days: 7,
  }
  const results = await Promise.allSettled(
    FORECAST_MODELS.map(model =>
      fetch(`${BASE}?${new URLSearchParams({ ...baseParams, models: model })}`)
        .then(r => r.ok ? r.json() : null)
        .catch(() => null)
    )
  )
  return results
    .map((r, i) => r.status === 'fulfilled' && r.value
      ? { ...r.value, _label: MODEL_LABELS[i] }
      : null
    )
    .filter(Boolean)
}

export async function fetchOpenMeteo(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: CURRENT_VARS,
    hourly: HOURLY_VARS,
    daily: DAILY_VARS,
    temperature_unit: 'fahrenheit',
    wind_speed_unit: 'mph',
    precipitation_unit: 'inch',
    timezone: 'auto',
    forecast_days: 7,
  })
  const res = await fetch(`${BASE}?${params}`)
  if (!res.ok) throw new Error('Open-Meteo request failed')
  return res.json()
}

// WMO Weather Code descriptions
export function wmoDescription(code) {
  const map = {
    0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Fog', 48: 'Icy fog',
    51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
    61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
    71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Slight showers', 81: 'Moderate showers', 82: 'Violent showers',
    85: 'Slight snow showers', 86: 'Heavy snow showers',
    95: 'Thunderstorm', 96: 'Thunderstorm w/ hail', 99: 'Thunderstorm w/ heavy hail',
  }
  return map[code] ?? 'Unknown'
}

export function wmoEmoji(code) {
  if (code === 0 || code === 1) return '☀️'
  if (code === 2) return '⛅'
  if (code === 3) return '☁️'
  if (code <= 48) return '🌫️'
  if (code <= 55) return '🌦️'
  if (code <= 65) return '🌧️'
  if (code <= 77) return '❄️'
  if (code <= 82) return '🌧️'
  if (code <= 86) return '🌨️'
  return '⛈️'
}
