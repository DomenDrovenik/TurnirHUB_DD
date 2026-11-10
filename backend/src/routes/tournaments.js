const express = require('express');
const prisma = require('../lib/prisma');
const { requireAuth, optionalAuth, requireRole } = require('../middleware/auth');
const {
  TRANSITIONS,
  EDITABLE_STATUSES,
  LOCKED_AFTER_PUBLISH,
  UUID_RE,
  parseTournamentInput,
  publicTournament,
} = require('../lib/tournamentRules');

const router = express.Router();

// Naloži turnir iz :id in preveri, da pripada prijavljenemu organizatorju.
async function loadOwnTournament(req, res, next) {
  if (!UUID_RE.test(req.params.id)) {
    return res.status(404).json({ error: 'Turnir ne obstaja' });
  }
  const tournament = await prisma.tournament.findUnique({ where: { id: req.params.id } });
  if (!tournament) {
    return res.status(404).json({ error: 'Turnir ne obstaja' });
  }
  if (tournament.organizerId !== req.user.id) {
    return res.status(403).json({ error: 'Nimate dovoljenja za urejanje tega turnirja' });
  }
  req.tournament = tournament;
  next();
}

// Turnirji prijavljenega organizatorja
router.get('/mine', requireAuth, requireRole('ORGANIZER'), async (req, res) => {
  const tournaments = await prisma.tournament.findMany({
    where: { organizerId: req.user.id },
    orderBy: { startDate: 'desc' },
  });
  res.json({ tournaments: tournaments.map(publicTournament) });
});

// Ustvarjanje turnirja (vedno v stanju DRAFT)
router.post('/', requireAuth, requireRole('ORGANIZER'), async (req, res) => {
  const { data, fields } = parseTournamentInput(req.body);
  if (Object.keys(fields).length > 0) {
    return res.status(400).json({ error: 'Neveljavni podatki', fields });
  }

  const tournament = await prisma.tournament.create({
    data: { ...data, organizerId: req.user.id, status: 'DRAFT' },
  });
  res.status(201).json({ tournament: publicTournament(tournament) });
});

// Podrobnosti turnirja: objavljene vidijo vsi, osnutek (DRAFT) samo organizator
router.get('/:id', optionalAuth, async (req, res) => {
  if (!UUID_RE.test(req.params.id)) {
    return res.status(404).json({ error: 'Turnir ne obstaja' });
  }
  const tournament = await prisma.tournament.findUnique({ where: { id: req.params.id } });
  const isOwner = tournament && req.user && tournament.organizerId === req.user.id;
  if (!tournament || (tournament.status === 'DRAFT' && !isOwner)) {
    return res.status(404).json({ error: 'Turnir ne obstaja' });
  }
  res.json({ tournament: publicTournament(tournament) });
});

// Urejanje turnirja
router.put('/:id', requireAuth, requireRole('ORGANIZER'), loadOwnTournament, async (req, res) => {
  const current = req.tournament;

  if (!EDITABLE_STATUSES.includes(current.status)) {
    return res.status(409).json({ error: 'Turnirja v tem stanju ni več mogoče urejati' });
  }

  const { data, fields } = parseTournamentInput(req.body);
  if (Object.keys(fields).length > 0) {
    return res.status(400).json({ error: 'Neveljavni podatki', fields });
  }

  // Po objavi pravil turnirja ni več dovoljeno spreminjati.
  if (current.status !== 'DRAFT') {
    const changed = LOCKED_AFTER_PUBLISH.filter((key) => data[key] !== current[key]);
    if (changed.length > 0) {
      return res.status(409).json({
        error: 'Po objavi ni mogoče spreminjati formata, števila ekip in točkovanja',
      });
    }
  }

  const tournament = await prisma.tournament.update({ where: { id: current.id }, data });
  res.json({ tournament: publicTournament(tournament) });
});

// Prehod stanja (objava, zaprtje prijav, preklic)
router.post(
  '/:id/status',
  requireAuth,
  requireRole('ORGANIZER'),
  loadOwnTournament,
  async (req, res) => {
    const current = req.tournament;
    const next = typeof req.body?.status === 'string' ? req.body.status : '';

    if (!(TRANSITIONS[current.status] || []).includes(next)) {
      return res.status(409).json({
        error: `Prehod iz stanja ${current.status} v ${next || '(prazno)'} ni dovoljen`,
      });
    }
    if (next === 'REGISTRATION_OPEN' && current.registrationDeadline <= new Date()) {
      return res.status(409).json({ error: 'Rok prijav je že potekel, uredite ga pred objavo' });
    }

    const tournament = await prisma.tournament.update({
      where: { id: current.id },
      data: { status: next },
    });
    res.json({ tournament: publicTournament(tournament) });
  },
);

module.exports = router;
