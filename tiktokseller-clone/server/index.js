const express = require('express')
const cors = require('cors')

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

const demoUser = {
  email: 'demo@tiktokshop.com',
  password: 'Demo123!',
  name: 'Demo Seller',
  region: 'Philippines',
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'tiktokshop-clone-api' })
})

app.post('/api/signup', (req, res) => {
  const { mode, phoneCode, phoneNumber, email } = req.body || {}

  if (mode === 'phone') {
    if (!phoneCode || !phoneNumber) {
      return res.status(400).json({ ok: false, message: 'Phone code and number are required.' })
    }
  }

  if (mode === 'email') {
    if (!email) {
      return res.status(400).json({ ok: false, message: 'Email is required.' })
    }
  }

  const submissionId = Math.random().toString(36).slice(2, 8)
  return res.json({ ok: true, submissionId })
})

app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {}

  if (!email || !password) {
    return res.status(400).json({ ok: false, message: 'Email and password are required.' })
  }

  if (email === demoUser.email && password === demoUser.password) {
    return res.json({
      ok: true,
      token: 'demo-token-123',
      profile: {
        name: demoUser.name,
        email: demoUser.email,
        region: demoUser.region,
      },
    })
  }

  return res.status(401).json({ ok: false, message: 'Invalid credentials' })
})

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`)
})
