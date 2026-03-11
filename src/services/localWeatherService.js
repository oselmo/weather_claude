const BACKEND = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export async function fetchLocalWeather(lat, lon, admin1, countryCode) {
  try {
    const params = new URLSearchParams({ lat, lon })
    if (admin1) params.set('admin1', admin1)
    if (countryCode) params.set('countryCode', countryCode)
    const res = await fetch(`${BACKEND}/api/local-weather?${params}`)
    if (!res.ok) return null
    const contentType = res.headers.get('content-type') ?? ''
    if (!contentType.includes('application/json')) return null
    return res.json()
  } catch {
    // Backend not running or unreachable — degrade gracefully
    return null
  }
}
