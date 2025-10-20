// Minimal Oura OAuth 2.0 scaffold for local development
// Requires Node 18+ (global fetch)
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'

const app = express()
const PORT = process.env.PORT || 8080

// Config via env
const OURA_CLIENT_ID = process.env.OURA_CLIENT_ID || ''
const OURA_CLIENT_SECRET = process.env.OURA_CLIENT_SECRET || ''
const OURA_REDIRECT_URI = process.env.OURA_REDIRECT_URI || 'http://localhost:8080/auth/oura/callback'
const OURA_AUTH_URL = process.env.OURA_AUTH_URL || 'https://cloud.ouraring.com/oauth/authorize'
const OURA_TOKEN_URL = process.env.OURA_TOKEN_URL || 'https://api.ouraring.com/oauth/token'
const OURA_SCOPES = process.env.OURA_SCOPES || 'daily heartrate personal sleep readiness'

// naive in-memory state store
const stateStore = new Map()

// naive token store to local file for prototyping
const dataDir = path.join(process.cwd(), 'server', 'data')
const tokenFile = path.join(dataDir, 'tokens.json')
function readTokens() {
  try {
    return JSON.parse(fs.readFileSync(tokenFile, 'utf-8'))
  } catch {
    return {}
  }
}
function writeTokens(obj) {
  fs.mkdirSync(dataDir, { recursive: true })
  fs.writeFileSync(tokenFile, JSON.stringify(obj, null, 2))
}

app.get('/health', (_req, res) => res.json({ ok: true }))

app.get('/auth/oura', (req, res) => {
  if (!OURA_CLIENT_ID || !OURA_CLIENT_SECRET) {
    return res.status(500).send('Oura OAuth not configured. Set OURA_CLIENT_ID/OURA_CLIENT_SECRET in .env')
  }
  const state = Math.random().toString(36).slice(2)
  stateStore.set(state, Date.now())
  const url = new URL(OURA_AUTH_URL)
  url.searchParams.set('client_id', OURA_CLIENT_ID)
  url.searchParams.set('redirect_uri', OURA_REDIRECT_URI)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', OURA_SCOPES)
  url.searchParams.set('state', state)
  res.redirect(url.toString())
})

app.get('/auth/oura/callback', async (req, res) => {
  const { code, state } = req.query
  if (!code || !state) return res.status(400).send('Missing code/state')
  if (!stateStore.has(state)) return res.status(400).send('Invalid state')
  stateStore.delete(state)
  try {
    const body = new URLSearchParams()
    body.set('grant_type', 'authorization_code')
    body.set('code', String(code))
    body.set('redirect_uri', OURA_REDIRECT_URI)
    body.set('client_id', OURA_CLIENT_ID)
    body.set('client_secret', OURA_CLIENT_SECRET)
    const resp = await fetch(OURA_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    if (!resp.ok) {
      const txt = await resp.text()
      return res.status(502).send(`Token exchange failed: ${resp.status} ${txt}`)
    }
    const token = await resp.json()
    const tokens = readTokens()
    tokens['demo'] = { provider: 'oura', token, savedAt: new Date().toISOString() }
    writeTokens(tokens)
    // Redirect back to app Data Manager
    const appUrl = process.env.APP_URL || 'http://localhost:5173/data'
    res.redirect(`${appUrl}?oura=connected`)
  } catch (e) {
    console.error(e)
    res.status(500).send('Token exchange error')
  }
})

app.get('/api/oura/status', (_req, res) => {
  const t = readTokens()['demo']
  res.json({ connected: !!t, savedAt: t?.savedAt })
})

// Example pass-through endpoint (will work only with valid tokens)
app.get('/api/oura/daily-sleep', async (_req, res) => {
  const t = readTokens()['demo']
  if (!t?.token?.access_token) return res.status(401).json({ error: 'Not connected' })
  const end = new Date().toISOString().slice(0, 10)
  const start = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
  try {
    const url = `https://api.ouraring.com/v2/usercollection/daily_sleep?start_date=${start}&end_date=${end}`
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${t.token.access_token}` } })
    const json = await resp.json()
    res.json(json)
  } catch (e) {
    res.status(502).json({ error: 'Fetch failed' })
  }
})

// Disconnect: remove stored token (prototype only)
app.delete('/api/oura/token', (req, res) => {
  const tokens = readTokens()
  if (tokens['demo']) {
    delete tokens['demo']
    writeTokens(tokens)
  }
  res.json({ ok: true })
})

// Garmin placeholder (requires Garmin Health partner access)
app.get('/auth/garmin', (_req, res) => {
  res.status(501).send('Garmin Health API integration pending (not yet built)')
})

app.listen(PORT, () => {
  console.log(`Auth server listening on http://localhost:${PORT}`)
})
const APP_URL = process.env.APP_URL || 'http://localhost:5173'
app.use(cors({ origin: APP_URL }))
app.use(express.json())
