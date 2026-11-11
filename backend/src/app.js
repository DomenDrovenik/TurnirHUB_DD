const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const tournamentRoutes = require('./routes/tournaments');
const teamRoutes = require('./routes/teams');
const registrationRoutes = require('./routes/registrations');
const scheduleRoutes = require('./routes/schedule');

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api', registrationRoutes);
app.use('/api', scheduleRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Pot ne obstaja' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Neveljaven JSON v zahtevku' });
  }
  console.error(err);
  res.status(500).json({ error: 'Napaka na strežniku' });
});

module.exports = app;
