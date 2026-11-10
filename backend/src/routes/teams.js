const express = require('express');
const prisma = require('../lib/prisma');
const { requireAuth, requireRole } = require('../middleware/auth');
const { UUID_RE } = require('../lib/tournamentRules');

const router = express.Router();

// Ekipe lahko ustvarjajo in v njih nastopajo igralci (tudi organizatorji, ki lahko vse kot igralec).
router.use(requireAuth, requireRole('PLAYER', 'ORGANIZER'));

const MEMBERS_INCLUDE = { members: { include: { user: true }, orderBy: { joinedAt: 'asc' } } };

// E-poštne naslove članov vidi samo kapetan.
function publicTeam(team, viewerId) {
  const viewerIsCaptain = team.captainId === viewerId;
  return {
    id: team.id,
    name: team.name,
    sport: team.sport,
    captainId: team.captainId,
    members: team.members.map((m) => ({
      userId: m.userId,
      displayName: m.user.displayName,
      email: viewerIsCaptain ? m.user.email : undefined,
      isCaptain: m.userId === team.captainId,
    })),
  };
}

// Poišče uporabnika po e-pošti ali po prikaznem imenu (ime mora biti natančno eno).
async function findUserByIdentifier(identifier) {
  if (identifier.includes('@')) {
    return { user: await prisma.user.findUnique({ where: { email: identifier.toLowerCase() } }) };
  }
  const users = await prisma.user.findMany({
    where: { displayName: { equals: identifier, mode: 'insensitive' } },
    take: 2,
  });
  if (users.length > 1) {
    return { ambiguous: true };
  }
  return { user: users[0] || null };
}

async function loadTeam(req, res, next) {
  if (!UUID_RE.test(req.params.id)) {
    return res.status(404).json({ error: 'Ekipa ne obstaja' });
  }
  const team = await prisma.team.findUnique({
    where: { id: req.params.id },
    include: MEMBERS_INCLUDE,
  });
  if (!team) {
    return res.status(404).json({ error: 'Ekipa ne obstaja' });
  }
  req.team = team;
  req.isMember = team.members.some((m) => m.userId === req.user.id);
  req.isCaptain = team.captainId === req.user.id;
  next();
}

function requireCaptain(req, res, next) {
  if (!req.isCaptain) {
    return res.status(403).json({ error: 'Samo kapetan lahko upravlja člane ekipe' });
  }
  next();
}

// Ekipe, katerih član je prijavljeni uporabnik
router.get('/mine', async (req, res) => {
  const teams = await prisma.team.findMany({
    where: { members: { some: { userId: req.user.id } } },
    include: MEMBERS_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });
  res.json({ teams: teams.map((t) => publicTeam(t, req.user.id)) });
});

// Ustvarjanje ekipe: ustvarjalec postane kapetan in član
router.post('/', async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const sport = typeof req.body?.sport === 'string' ? req.body.sport.trim() : '';

  const fields = {};
  if (!name) fields.name = 'Vnesite ime ekipe';
  else if (name.length > 60) fields.name = 'Ime je lahko dolgo največ 60 znakov';
  if (!sport) fields.sport = 'Vnesite šport';
  if (Object.keys(fields).length > 0) {
    return res.status(400).json({ error: 'Neveljavni podatki', fields });
  }

  // Ekipa in članstvo kapetana se ustvarita v eni operaciji.
  const team = await prisma.team.create({
    data: {
      name,
      sport,
      captainId: req.user.id,
      members: { create: { userId: req.user.id } },
    },
    include: MEMBERS_INCLUDE,
  });
  res.status(201).json({ team: publicTeam(team, req.user.id) });
});

// Podrobnosti ekipe (samo za člane)
router.get('/:id', loadTeam, (req, res) => {
  if (!req.isMember) {
    return res.status(403).json({ error: 'Nimate dostopa do te ekipe' });
  }
  res.json({ team: publicTeam(req.team, req.user.id) });
});

// Dodajanje člana (kapetan)
router.post('/:id/members', loadTeam, requireCaptain, async (req, res) => {
  const identifier = typeof req.body?.identifier === 'string' ? req.body.identifier.trim() : '';
  if (!identifier) {
    return res.status(400).json({
      error: 'Vnesite e-pošto ali uporabniško ime',
      fields: { identifier: 'Vnesite e-pošto ali uporabniško ime' },
    });
  }

  const { user, ambiguous } = await findUserByIdentifier(identifier);
  if (ambiguous) {
    return res.status(409).json({
      error: 'Več uporabnikov ima to ime, uporabite e-pošto',
      fields: { identifier: 'Več uporabnikov ima to ime, uporabite e-pošto' },
    });
  }
  if (!user) {
    return res.status(404).json({
      error: 'Uporabnik ni najden',
      fields: { identifier: 'Uporabnik ni najden' },
    });
  }

  try {
    await prisma.teamMember.create({ data: { teamId: req.team.id, userId: user.id } });
  } catch (err) {
    // Sestavljeni primarni ključ (team_id, user_id) prepreči podvojenega člana.
    if (err.code === 'P2002') {
      return res.status(409).json({
        error: 'Uporabnik je že član ekipe',
        fields: { identifier: 'Uporabnik je že član ekipe' },
      });
    }
    throw err;
  }

  const team = await prisma.team.findUnique({ where: { id: req.team.id }, include: MEMBERS_INCLUDE });
  res.status(201).json({ team: publicTeam(team, req.user.id) });
});

// Odstranjevanje člana (kapetan; kapetana samega ni mogoče odstraniti)
router.delete('/:id/members/:userId', loadTeam, requireCaptain, async (req, res) => {
  const { userId } = req.params;
  if (!UUID_RE.test(userId)) {
    return res.status(404).json({ error: 'Član ne obstaja' });
  }
  if (userId === req.team.captainId) {
    return res.status(409).json({ error: 'Kapetana ni mogoče odstraniti iz ekipe' });
  }

  const { count } = await prisma.teamMember.deleteMany({
    where: { teamId: req.team.id, userId },
  });
  if (count === 0) {
    return res.status(404).json({ error: 'Član ne obstaja v tej ekipi' });
  }

  const team = await prisma.team.findUnique({ where: { id: req.team.id }, include: MEMBERS_INCLUDE });
  res.json({ team: publicTeam(team, req.user.id) });
});

module.exports = router;
