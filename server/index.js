import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import weatherRouter from './routes/weather.js'

const app = express()
const PORT = process.env.PORT ?? 3001

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  ...(process.env.FRONTEND_ORIGIN ? [process.env.FRONTEND_ORIGIN] : []),
]
app.use(cors({ origin: ALLOWED_ORIGINS }))
app.use(express.json())

app.use('/api', weatherRouter)

app.get('/health', (_, res) => res.json({ ok: true }))

app.listen(PORT, () => {
  console.log(`Weather backend running on http://localhost:${PORT}`)
  if (!process.env.SYNOPTIC_TOKEN) {
    console.warn('  ⚠  SYNOPTIC_TOKEN not set — Synoptic Data will be skipped.')
    console.warn('     Get a free key at https://synopticdata.com/mesonet-api/')
  }
})
