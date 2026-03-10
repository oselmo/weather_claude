// Open-Meteo Geocoding API — free, no key
export async function searchLocation(query) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Geocoding request failed')
  const data = await res.json()
  return data.results ?? []
}
