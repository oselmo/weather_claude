// Synoptic Data (formerly MesoWest) API
// Free tier: 500 req/day — sign up at https://synopticdata.com/mesonet-api/
// Set SYNOPTIC_TOKEN in your .env file (must be TOKEN, not API key)
// To get your token: https://api.synopticdata.com/v2/auth?apikey=YOUR_API_KEY

import fetch from 'node-fetch'

const BASE = 'https://api.synopticdata.com/v2'

// Unit notes from live API response (units=english):
//   air_temp / dew_point_temperature → Fahrenheit (already converted)
//   wind_speed / wind_gust           → knots  (must convert to mph)
//   pressure                         → Millibars (must convert to inHg)
//   relative_humidity                → %
//   visibility                       → miles
//   precip_accum_one_hour            → inches

const knotsToMph = (kt) => (kt != null ? Math.round(kt * 1.15078) : null)
const mbToInHg   = (mb) => (mb != null ? +(mb * 0.0295301).toFixed(2) : null)
const val        = (o)   => o?.value ?? null    // pull value from obs object

export async function fetchSynopticStations(lat, lon, token, stateCode = null) {
  if (!token) return { stations: [], error: 'No SYNOPTIC_TOKEN configured' }

  const params = new URLSearchParams({
    token,
    radius: `${lat},${lon},30`,  // lat,lon,radius_miles
    limit: 15,
    vars: 'air_temp,relative_humidity,wind_speed,wind_direction,wind_gust,pressure,dew_point_temperature,visibility,precip_accum_one_hour',
    units: 'english',
    output: 'json',
  })
  if (stateCode) params.set('state', stateCode)

  try {
    const res = await fetch(`${BASE}/stations/latest?${params}`)
    if (!res.ok) return { stations: [], error: `Synoptic API error: ${res.status}` }
    const data = await res.json()

    if (data.SUMMARY?.RESPONSE_CODE !== 1) {
      return { stations: [], error: data.SUMMARY?.RESPONSE_MESSAGE ?? 'Unknown Synoptic error' }
    }

    let rawStations = data.STATION ?? []

    // Post-filter by state (catches border stations that slipped through)
    if (stateCode) {
      rawStations = rawStations.filter((s) => !s.STATE || s.STATE === stateCode)
    }

    const stations = rawStations.slice(0, 10).map((s) => {
      const obs = s.OBSERVATIONS ?? {}

      // Each obs field is { value, date_time } — observation timestamp comes from air_temp
      const timestamp = obs.air_temp_value_1?.date_time ?? null

      return {
        stationId: s.STID,
        stationName: s.NAME,
        stateCode: s.STATE ?? null,
        network: s.MNET_SHORTNAME ?? s.NETWORK ?? null,
        elevation: s.ELEVATION ? `${(+s.ELEVATION).toFixed(0)} ft` : null,
        distance: s.DISTANCE != null ? `${(+s.DISTANCE).toFixed(1)} mi` : null,
        temp: val(obs.air_temp_value_1) != null
          ? Math.round(val(obs.air_temp_value_1))           // already °F
          : null,
        dewpoint: val(obs.dew_point_temperature_value_1d) != null
          ? Math.round(val(obs.dew_point_temperature_value_1d))  // already °F
          : null,
        humidity: val(obs.relative_humidity_value_1) != null
          ? Math.round(val(obs.relative_humidity_value_1))
          : null,
        windSpeed: knotsToMph(val(obs.wind_speed_value_1)),
        windDirection: val(obs.wind_direction_value_1) != null
          ? Math.round(val(obs.wind_direction_value_1))
          : null,
        windGust: knotsToMph(val(obs.wind_gust_value_1)),
        pressure: mbToInHg(val(obs.pressure_value_1d)),
        visibility: val(obs.visibility_value_1) != null
          ? +(val(obs.visibility_value_1)).toFixed(1)
          : null,
        precipLastHour: val(obs.precip_accum_one_hour_value_1) != null
          ? +(val(obs.precip_accum_one_hour_value_1)).toFixed(2)
          : null,
        timestamp,
        source: 'Synoptic Data',
      }
    })

    return { stations, error: null }
  } catch (err) {
    return { stations: [], error: err.message }
  }
}
