# Weather Claude

A full-stack weather app that aggregates data from multiple sources — forecast models, radar, NOAA observation stations, Synoptic sensors, and local TV station weather pages — into a single unified view.

Live at [weather-claude-olivia.com](https://weather-claude-olivia.com)

---

## Features

- **Multi-model forecast averaging** — GFS, ECMWF, and ICON models are fetched in parallel and averaged for hourly and 7-day forecasts
- **NWS integration** — US National Weather Service alerts, text forecasts, and hourly gridpoint data
- **NOAA observation stations** — Real sensor readings (pressure, dewpoint, wind chill, heat index, precipitation) from the nearest stations within 100 miles
- **Composite radar map** — Blends RainViewer, NEXRAD (Iowa State Mesonet), and Environment Canada radar into a single layer using a NEXRAD color scale. Sources are selected by zoom level
- **Synoptic Data** — Real-time observations from 40,000+ sensors across the US
- **Local TV station weather** — Scraped weather data from nearby TV station websites (TEGNA, Nexstar, Hearst, Gray, Sinclair, Scripps)
- **Location search** — Global location search via Open-Meteo geocoding, persisted across sessions

---

## Tech Stack

**Frontend**: React 18, Vite, Leaflet

**Backend**: Node.js, Express, Cheerio

**APIs used** (all free):
| Source | Data |
|--------|------|
| Open-Meteo | Multi-model forecast (GFS, ECMWF, ICON), current conditions |
| NWS (weather.gov) | US alerts, text forecast, hourly gridpoint, observation stations |
| Synoptic Data | 40k+ real-time sensor stations (requires free API token) |
| RainViewer | Global radar tiles |
| Iowa State Mesonet | NEXRAD radar tiles |
| Environment Canada | Canadian radar via WMS |
| Open-Meteo Geocoding | Location search |

---

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── SearchBar.jsx        # Location search with debounce
│   │   ├── CurrentWeather.jsx   # Current conditions, alerts, station obs
│   │   ├── Forecast.jsx         # 24-hour and 7-day forecast
│   │   ├── RadarMap.jsx         # Composite radar map (Leaflet)
│   │   ├── LocalWeather.jsx     # Synoptic + TV station data
│   │   └── DataSources.jsx      # Source status panel
│   └── services/
│       ├── geocoding.js         # Location search
│       ├── openMeteo.js         # Open-Meteo multi-model fetch
│       ├── nwsService.js        # NWS alerts, forecasts, stations
│       ├── weatherAggregator.js # Aggregates and averages all sources
│       └── localWeatherService.js # Calls the Express backend
└── server/
    ├── index.js                 # Express entry point
    ├── routes/weather.js        # GET /api/local-weather
    ├── services/synoptic.js     # Synoptic Data API wrapper
    └── scrapers/
        ├── scraper.js           # TV station HTML scraper (Cheerio)
        └── stationRegistry.js   # TV station list with coords and selectors
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A free [Synoptic Data API token](https://synopticdata.com/mesonet-api/) (optional — app works without it, Synoptic section will be skipped)

### Install

```bash
git clone https://github.com/YOUR_USERNAME/weather-claude.git
cd weather-claude
npm install
```

### Configure

```bash
cp .env.example .env
```

Edit `.env`:
```
SYNOPTIC_TOKEN=your_token_here
```

### Run (local dev)

```bash
npm run dev
```

Starts both the Vite frontend (localhost:5173) and Express backend (localhost:3001) concurrently.

To run separately:
```bash
npm run dev:frontend   # Vite only
npm run dev:server     # Express only
```

### Build (frontend only)

```bash
npm run build
```

Compiles the React app to `dist/`. Only needed for the **frontend** — the Express backend is plain Node.js and runs directly without building.

Set `VITE_API_URL` in `.env.production` before building so the frontend knows where to send API requests:
```
VITE_API_URL=https://your-domain.com
```

### Production (EC2)

On the server, only the Express backend runs. Start it directly with PM2:
```bash
pm2 start server/index.js --name weather-backend
```

The built frontend (`dist/`) is served separately via S3 + CloudFront — not from EC2.

---

## Environment Variables

| Variable | Where | Description |
|----------|-------|-------------|
| `SYNOPTIC_TOKEN` | server `.env` | Synoptic Data API token. Get one free at synopticdata.com |
| `PORT` | server `.env` | Express port (default: 3001) |
| `FRONTEND_ORIGIN` | server `.env` | CORS allowed origin in production |
| `VITE_API_URL` | `.env.production` | Backend URL used by the frontend build |

---

## Deployment (AWS)

The app is deployed as:
- **Frontend**: S3 + CloudFront
- **Backend**: EC2 (t2.micro), managed by PM2
- **API routing**: CloudFront forwards `/api/*` to EC2, so the frontend only talks to one HTTPS origin
- **Domain**: Route 53 + ACM certificate

See the deployment notes in the project for the full setup.
