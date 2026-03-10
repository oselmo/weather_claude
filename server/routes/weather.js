import { Router } from 'express'
import { findNearestStations, REGION_CODE } from '../scrapers/stationRegistry.js'
import { scrapeStation } from '../scrapers/scraper.js'
import { fetchSynopticStations } from '../services/synoptic.js'

const router = Router()

// Simple in-memory cache: key → { data, expires }
const cache = new Map()
const CACHE_TTL_MS = 15 * 60 * 1000  // 15 minutes

function getCached(key) {
  const entry = cache.get(key)
  if (entry && Date.now() < entry.expires) return entry.data
  cache.delete(key)
  return null
}
function setCached(key, data) {
  cache.set(key, { data, expires: Date.now() + CACHE_TTL_MS })
}

// GET /api/local-weather?lat=X&lon=Y&admin1=Colorado&countryCode=US
router.get('/local-weather', async (req, res) => {
  const lat = parseFloat(req.query.lat)
  const lon = parseFloat(req.query.lon)
  const admin1 = req.query.admin1 ?? null          // full state/province name
  const countryCode = req.query.countryCode ?? null

  if (isNaN(lat) || isNaN(lon)) {
    return res.status(400).json({ error: 'lat and lon are required' })
  }

  const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)},${admin1 ?? ''}`
  const cached = getCached(cacheKey)
  if (cached) return res.json({ ...cached, fromCache: true })

  // Find TV stations in the same state/province only
  const nearestStations = findNearestStations(lat, lon, { admin1, count: 3 })

  const stateCode = admin1 ? (REGION_CODE[admin1] ?? null) : null

  const [scrapeResults, synopticResult] = await Promise.all([
    Promise.all(nearestStations.map(scrapeStation)),
    fetchSynopticStations(lat, lon, process.env.SYNOPTIC_TOKEN, stateCode),
  ])

  const payload = {
    tvStations: scrapeResults,
    synoptic: synopticResult,
    fetchedAt: new Date().toISOString(),
    fromCache: false,
  }

  setCached(cacheKey, payload)
  res.json(payload)
})

export default router
