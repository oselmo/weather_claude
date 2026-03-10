import fetch from 'node-fetch'
import * as cheerio from 'cheerio'

const TIMEOUT_MS = 8000

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
}

// Try each selector string in order, return first non-empty match
function trySelectors($ ,selectorStr) {
  if (!selectorStr) return null
  for (const sel of selectorStr.split(',').map((s) => s.trim())) {
    const text = $(sel).first().text().trim()
    if (text) return text
  }
  return null
}

// Extract a temperature number from a text string
function parseTemp(text) {
  if (!text) return null
  const match = text.match(/-?\d+/)
  return match ? parseInt(match[0], 10) : null
}

// Try to pull structured weather data out of JSON-LD or application/json script blocks
function extractJsonLd($) {
  let result = {}
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const d = JSON.parse($(el).html())
      if (d?.['@type'] === 'WeatherForecast' || d?.temperature) {
        result = { ...result, ...d }
      }
    } catch { /* ignore */ }
  })
  return result
}

export async function scrapeStation(station) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(station.url, {
      headers: BROWSER_HEADERS,
      signal: controller.signal,
      redirect: 'follow',
    })
    clearTimeout(timeout)

    if (!res.ok) {
      return { callsign: station.callsign, market: station.market, url: station.url, error: `HTTP ${res.status}` }
    }

    const html = await res.text()
    const $ = cheerio.load(html)

    // Remove script/style noise
    $('script, style, noscript').remove()

    const { selectors } = station
    const tempText = trySelectors($, selectors.temp)
    const condText = trySelectors($, selectors.condition)
    const narrativeText = trySelectors($, selectors.narrative)
    const jsonLd = extractJsonLd($)

    const temp = parseTemp(tempText)

    // Fallback: look for any element with a number that looks like a temp near °
    let fallbackTemp = null
    if (temp == null) {
      $('*').each((_, el) => {
        const t = $(el).clone().children().remove().end().text().trim()
        if (/^-?\d{1,3}°?F?$/.test(t)) {
          fallbackTemp = parseInt(t, 10)
          return false
        }
      })
    }

    return {
      callsign: station.callsign,
      market: station.market,
      url: station.url,
      distance: station.distance,
      group: station.group,
      temp: temp ?? fallbackTemp,
      condition: condText || null,
      narrative: narrativeText ? narrativeText.slice(0, 300) : null,
      jsonLd: Object.keys(jsonLd).length > 0 ? jsonLd : null,
      scrapedAt: new Date().toISOString(),
    }
  } catch (err) {
    clearTimeout(timeout)
    return {
      callsign: station.callsign,
      market: station.market,
      url: station.url,
      distance: station.distance,
      error: err.name === 'AbortError' ? 'timeout' : err.message,
    }
  }
}
