import { useCallback, useEffect, useRef, useState } from 'react'
import L from 'leaflet'

// Convert XYZ tile coords to EPSG:3857 bounding box for WMS
function tileToBbox(z, x, y) {
  const R = 6378137
  const lon1 = (x / 2 ** z) * 360 - 180
  const lon2 = ((x + 1) / 2 ** z) * 360 - 180
  const n1 = Math.PI - (2 * Math.PI * y) / 2 ** z
  const n2 = Math.PI - (2 * Math.PI * (y + 1)) / 2 ** z
  const lat1 = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n1) - Math.exp(-n1)))
  const lat2 = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n2) - Math.exp(-n2)))
  const minx = lon1 * (Math.PI / 180) * R
  const maxx = lon2 * (Math.PI / 180) * R
  const miny = Math.log(Math.tan((lat2 + 90) * (Math.PI / 360))) * R
  const maxy = Math.log(Math.tan((lat1 + 90) * (Math.PI / 360))) * R
  return `${minx},${miny},${maxx},${maxy}`
}

function ecRadarUrl(z, x, y) {
  const bbox = tileToBbox(z, x, y)
  return `https://geo.weather.gc.ca/geomet?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=RADAR_1KM_RRAI&CRS=EPSG:3857&BBOX=${bbox}&WIDTH=256&HEIGHT=256&FORMAT=image/png&STYLES=`
}

const IEM_URL = 'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png'

function resolveUrl(template, z, x, y) {
  return template.replace('{z}', z).replace('{x}', x).replace('{y}', y)
}

function loadImage(url) {
  return new Promise(resolve => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = url
  })
}

// Extract a 0-1 precipitation intensity from an arbitrary radar pixel.
// Uses HUE as the primary signal: all major radar color schemes (RainViewer,
// NEXRAD, EC) go cool→warm with intensity — blues/greens = light, reds = heavy.
function pixelIntensity(r, g, b, a) {
  if (a < 15) return 0
  const nr = r / 255, ng = g / 255, nb = b / 255
  const max = Math.max(nr, ng, nb)
  const min = Math.min(nr, ng, nb)
  const d = max - min
  if (d < 0.12) return 0  // near-gray = background / no data

  // Compute hue 0–360
  let h
  if      (max === nr) h = 60 * (((ng - nb) / d + 6) % 6)
  else if (max === ng) h = 60 * ( (nb - nr) / d + 2)
  else                 h = 60 * ( (nr - ng) / d + 4)

  // Map hue to intensity — cool hues = light precip, warm hues = heavy
  let base
  if      (h >= 200 && h < 260) base = 0.05 + (h - 200) / 60 * 0.10  // cyan→blue   0.05–0.15
  else if (h >= 130 && h < 200) base = 0.15 + (200 - h) / 70 * 0.15  // green→cyan  0.15–0.30
  else if (h >=  90 && h < 130) base = 0.30 + (130 - h) / 40 * 0.15  // yel-grn     0.30–0.45
  else if (h >=  50 && h <  90) base = 0.45 + ( 90 - h) / 40 * 0.15  // yellow      0.45–0.60
  else if (h >=  20 && h <  50) base = 0.60 + ( 50 - h) / 30 * 0.15  // orange      0.60–0.75
  else if (h <   20 || h >= 340) base = 0.75 + 0.10                   // red         0.75–0.85
  else if (h >= 280 && h < 340) base = 0.85 + (340 - h) / 60 * 0.10  // purple-mag  0.85–0.95
  else                           base = 0.10                           // deep blue

  // Weight by saturation and alpha so faint/washed-out pixels rank lower
  const sat = d / max
  return base * sat * (a / 255)
}

// Standard NEXRAD reflectivity color table (matches WSR-88D display)
const COLOR_STOPS = [
  [0.05, [  4, 233, 231]],   // light cyan      – ~5  dBZ
  [0.13, [  1, 159, 244]],   // sky blue        – ~10 dBZ
  [0.21, [  3,   0, 244]],   // dark blue       – ~15 dBZ
  [0.30, [  2, 253,   2]],   // bright green    – ~20 dBZ
  [0.38, [  1, 197,   1]],   // medium green    – ~25 dBZ
  [0.46, [  0, 142,   0]],   // dark green      – ~30 dBZ
  [0.54, [253, 248,   2]],   // yellow          – ~35 dBZ
  [0.62, [229, 188,   0]],   // yellow-orange   – ~40 dBZ
  [0.70, [253, 149,   0]],   // orange          – ~45 dBZ
  [0.78, [253,   0,   0]],   // red             – ~50 dBZ
  [0.86, [212,   0,   0]],   // dark red        – ~55 dBZ
  [0.93, [188,   0,   0]],   // deeper red      – ~60 dBZ
  [1.00, [248,   0, 253]],   // magenta         – ~65+ dBZ
]

function intensityToRgb(v) {
  if (v < COLOR_STOPS[0][0]) return null
  for (let i = 1; i < COLOR_STOPS.length; i++) {
    if (v <= COLOR_STOPS[i][0]) {
      const t = (v - COLOR_STOPS[i - 1][0]) / (COLOR_STOPS[i][0] - COLOR_STOPS[i - 1][0])
      const [c1, c2] = [COLOR_STOPS[i - 1][1], COLOR_STOPS[i][1]]
      return [
        Math.round(c1[0] + t * (c2[0] - c1[0])),
        Math.round(c1[1] + t * (c2[1] - c1[1])),
        Math.round(c1[2] + t * (c2[2] - c1[2])),
      ]
    }
  }
  return COLOR_STOPS[COLOR_STOPS.length - 1][1]
}

// Custom GridLayer that composites multiple radar sources onto a single canvas tile
const CompositeRadarLayer = L.GridLayer.extend({
  initialize(options) {
    L.GridLayer.prototype.initialize.call(this, options)
    this._urlTemplates = options.urlTemplates || []
    this._includeEC = options.includeEC !== false
  },

  setUrlTemplates(templates, includeEC = true) {
    this._urlTemplates = templates
    this._includeEC = includeEC
    this.redraw()
  },

  createTile(coords, done) {
    const W = 256
    const canvas = document.createElement('canvas')
    canvas.width = W; canvas.height = W

    const { z, x, y } = coords
    const urls = [
      ...this._urlTemplates.map(t => resolveUrl(t, z, x, y)),
      ...(this._includeEC ? [ecRadarUrl(z, x, y)] : []),
    ]

    Promise.all(urls.map(loadImage)).then(images => {
      const loaded = images.filter(Boolean)
      if (!loaded.length) { done(null, canvas); return }

      // Scratch canvas to read each source's pixels
      const scratch = document.createElement('canvas')
      scratch.width = W; scratch.height = W
      const sctx = scratch.getContext('2d')

      // Max intensity per pixel across all sources
      const intensity = new Float32Array(W * W)

      for (const img of loaded) {
        sctx.clearRect(0, 0, W, W)
        sctx.drawImage(img, 0, 0, W, W)
        const px = sctx.getImageData(0, 0, W, W).data
        for (let i = 0; i < px.length; i += 4) {
          const v = pixelIntensity(px[i], px[i + 1], px[i + 2], px[i + 3])
          const idx = i >> 2
          if (v > intensity[idx]) intensity[idx] = v
        }
      }

      // Render merged intensity through single NWS color ramp
      const ctx = canvas.getContext('2d')
      const out = ctx.createImageData(W, W)
      for (let i = 0; i < W * W; i++) {
        const color = intensityToRgb(intensity[i])
        if (!color) continue
        out.data[i * 4]     = color[0]
        out.data[i * 4 + 1] = color[1]
        out.data[i * 4 + 2] = color[2]
        out.data[i * 4 + 3] = 210
      }
      ctx.putImageData(out, 0, 0)
      done(null, canvas)
    })

    return canvas
  },
})

export default function RadarMap({ lat, lon }) {
  const containerRef   = useRef(null)
  const mapRef         = useRef(null)
  const layerRef       = useRef(null)
  const intervalRef    = useRef(null)
  const rvTemplateRef  = useRef(null)   // latest RainViewer URL template

  const [radarTime, setRadarTime] = useState(null)
  const [activeSources, setActiveSources] = useState([])

  // Build and apply source list based on current zoom level
  // zoom 2–4: RainViewer only (global coverage)
  // zoom 5+:  RainViewer + NEXRAD (IEM) + EC
  const applySourcesForZoom = useCallback((zoom) => {
    const templates = []
    const names = []
    if (rvTemplateRef.current) {
      templates.push(rvTemplateRef.current)
      names.push('RainViewer')
    }
    const includeRegional = zoom >= 5
    if (includeRegional) {
      templates.push(IEM_URL)
      names.push('NEXRAD')
      names.push('EC')
    }
    layerRef.current?.setUrlTemplates(templates, includeRegional)
    setActiveSources(names)
  }, [])

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: [lat, lon],
      zoom: 7,
      minZoom: 2,
      maxZoom: 19,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
      maxNativeZoom: 19,
    }).addTo(map)

    const compositeLayer = new CompositeRadarLayer({
      urlTemplates: [],
      maxNativeZoom: 7,
      maxZoom: 19,
      opacity: 1,
    })
    compositeLayer.addTo(map)

    mapRef.current  = map
    layerRef.current = compositeLayer

    // Re-evaluate sources whenever the user zooms
    map.on('zoomend', () => applySourcesForZoom(map.getZoom()))

    return () => {
      clearInterval(intervalRef.current)
      map.remove()
      mapRef.current  = null
      layerRef.current = null
    }
  }, [applySourcesForZoom])

  // Fetch RainViewer URL and update composite layer
  useEffect(() => {
    let cancelled = false

    async function refresh() {
      try {
        const res  = await fetch('https://api.rainviewer.com/public/weather-maps.json')
        const data = await res.json()
        const frames = data.radar?.past
        if (frames?.length) {
          const latest = frames[frames.length - 1]
          rvTemplateRef.current = `${data.host}${latest.path}/256/{z}/{x}/{y}/4/1_1.png`
          if (!cancelled) setRadarTime(new Date(latest.time * 1000))
        }
      } catch { /* RainViewer unavailable */ }

      if (cancelled) return

      // Apply sources for current zoom (falls back to default zoom 7 before map is ready)
      applySourcesForZoom(mapRef.current?.getZoom() ?? 7)
    }

    const initDelay = setTimeout(() => {
      if (!cancelled) {
        refresh()
        intervalRef.current = setInterval(refresh, 2 * 60 * 1000)
      }
    }, 100)

    return () => {
      cancelled = true
      clearTimeout(initDelay)
      clearInterval(intervalRef.current)
    }
  }, [applySourcesForZoom])

  return (
    <div className="radar-section">
      <h2 className="section-title">Radar</h2>
      <div className="radar-map-container" style={{ position: 'relative' }}>
        <div ref={containerRef} style={{ height: '100%', width: '100%' }} />

        {activeSources.length > 0 && (
          <div className="radar-legend">
            <span className="radar-legend-dot" />
            {activeSources.join(' + ')}
            {radarTime && (
              <> · {radarTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {radarTime.toLocaleDateString([], { month: 'short', day: 'numeric' })}</>
            )}
            <span className="radar-legend-refresh"> · auto-refreshes every 2 min</span>
          </div>
        )}
      </div>
    </div>
  )
}
