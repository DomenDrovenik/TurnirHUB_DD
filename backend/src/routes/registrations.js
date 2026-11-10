const express = require('express');
const prisma = require('../lib/prisma');
const { requireAuth, requireRole } = require('../middleware/auth');
const { UUID_RE } = require('../lib/tournamentRules');

const router = express.Router();

// Napaka z znanim HTTP statusom; znotraj transakcije prekine postopek.
class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Prijave, ki zasedajo igralce in mesta (zavrnjene ne štejejo).
const ACTIVE_STATUSES = ['PENDING', 'APPROVED'];

function publicRegistration(r) {
  return {
    id: r.id,
    status: r.status,
    createdAt: r.createdAt,
    team: r.team && {
      id: r.team.id,
      name: r.team.name,
      sport: r.team.sport,
      memberCount: r.team.members ? r.team.members.length : undefined,
      captain: r.team.captain && { displayName: r.team.captain.displayName, email: r.team.captain.email },
    },
    tournament: r.tournament && {
      id: r.tournament.id,
      name: r.tournament.name,
      startDate: r.tournament.startDate.toISOString().slice(0, 10),
      status: r.tournament.status,
    },
  };
}

function handleError(err, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message });
  }
  return next(err);
}

// Prijava ekipe na turnir (samo kapetan)
router.post(
  '/tournaments/:id/registrations',
  requireAuth,
  requireRole('PLAYER', 'ORGANIZER'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const teamId = typeof req.body?.teamId === 'string' ? req.body.teamId : '';
      if (!UUID_RE.test(id)) throw new ApiError(404, 'Turnir ne obstaja');
      if (!UUID_RE.test(teamId)) throw new ApiError(400, 'Izberite ekipo');

      const registration = await prisma.$transaction(async (tx) => {
        // Zaklep vrstice turnirja: sočasne prijave in potrditve se izvajajo ena za drugo.
        await tx.$queryRaw`SELECT id FROM tournaments WHERE id = ${id}::uuid FOR UPDATE`;

        const tournament = await tx.tournament.findUnique({ where: { id } });
        if (!tournament || tournament.status === 'DRAFT') throw new ApiError(404, 'Turnir ne obstaja');

        const team = await tx.team.findUnique({
          where: { id: teamId },
          include: { members: { include: { user: true } } },
        });
        if (!team) throw new ApiError(404, 'Ekipa ne obstaja');
        if (team.captainId !== req.user.id) {
          throw new ApiError(403, 'Prijavo lahko odda samo kapetan ekipe');
        }

        if (tournament.status !== 'REGISTRATION_OPEN') {
          throw new ApiError(409, 'Prijave na ta turnir niso odprte');
        }
        if (tournament.registrationDeadline <= new Date()) {
          throw new ApiError(409, 'Rok prijav je potekel');
        }

        const missing = tournament.minPlayersPerTeam - team.members.length;
        if (missing > 0) {
          throw new ApiError(
            409,
            `Ekipa ima premalo članov: manjka še ${missing} (najmanj ${tournament.minPlayersPerTeam})`,
          );
        }

        const existing = await tx.registration.findUnique({
          where: { tournamentId_teamId: { tournamentId: id, teamId } },
        });
        if (existing) throw new ApiError(409, 'Ekipa je že prijavljena na ta turnir');

        // Noben igralec ne sme nastopati v dveh ekipah istega turnirja.
        const memberIds = team.members.map((m) => m.userId);
        const others = await tx.registration.findMany({
          where: {
            tournamentId: id,
            status: { in: ACTIVE_STATUSES },
            team: { members: { some: { userId: { in: memberIds } } } },
          },
          include: { team: { include: { members: { include: { user: true } } } } },
        });
        const clashing = new Set();
        for (const other of others) {
          for (const m of other.team.members) {
            if (memberIds.includes(m.userId)) clashing.add(m.user.displayName);
          }
        }
        if (clashing.size > 0) {
          throw new ApiError(
            409,
            `Že prijavljeni v drugi ekipi na tem turnirju: ${[...clashing].join(', ')}`,
          );
        }

        const approved = await tx.registration.count({
          where: { tournamentId: id, status: 'APPROVED' },
        });
        if (approved >= tournament.maxTeams) throw new ApiError(409, 'Turnir je že poln');

        return tx.registration.create({ data: { tournamentId: id, teamId } });
      });

      res.status(201).json({ registration: { id: registration.id, status: registration.status } });
    } catch (err) {
      if (err.code === 'P2002') {
        return res.status(409).json({ error: 'Ekipa je že prijavljena na ta turnir' });
      }
      return handleError(err, res, next);
    }
  },
);

// Seznam prijav turnirja (samo organizator turnirja)
router.get(
  '/tournaments/:id/registrations',
  requireAuth,
  requireRole('ORGANIZER'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!UUID_RE.test(id)) throw new ApiError(404, 'Turnir ne obstaja');
      const tournament = await prisma.tournament.findUnique({ where: { id } });
      if (!tournament) throw new ApiError(404, 'Turnir ne obstaja');
      if (tournament.organizerId !== req.user.id) {
        throw new ApiError(403, 'Nimate dovoljenja za ogled prijav tega turnirja');
      }
      const registrations = await prisma.registration.findMany({
        where: { tournamentId: id },
        include: { team: { include: { captain: true, members: true } } },
        orderBy: { createdAt: 'asc' },
      });
      res.json({
        tournament: { id: tournament.id, name: tournament.name, maxTeams: tournament.maxTeams },
        registrations: registrations.map(publicRegistration),
      });
    } catch (err) {
      handleError(err, res, next);
    }
  },
);

// Potrditev ali zavrnitev prijave (samo organizator turnirja)
router.post(
  '/tournaments/:id/registrations/:registrationId/status',
  requireAuth,
  requireRole('ORGANIZER'),
  async (req, res, next) => {
    try {
      const { id, registrationId } = req.params;
      const next_ = typeof req.body?.status === 'string' ? req.body.status : '';
      if (!UUID_RE.test(id) || !UUID_RE.test(registrationId)) {
        throw new ApiError(404, 'Prijava ne obstaja');
      }
      if (!['APPROVED', 'REJECTED'].includes(next_)) {
        throw new ApiError(400, 'Status mora biti APPROVED ali REJECTED');
      }

      const updated = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM tournaments WHERE id = ${id}::uuid FOR UPDATE`;

        const tournament = await tx.tournament.findUnique({ where: { id } });
        if (!tournament) throw new ApiError(404, 'Turnir ne obstaja');
        if (tournament.organizerId !== req.user.id) {
          throw new ApiError(403, 'Nimate dovoljenja za upravljanje prijav tega turnirja');
        }

        const registration = await tx.registration.findUnique({ where: { id: registrationId } });
        if (!registration || registration.tournamentId !== id) {
          throw new ApiError(404, 'Prijava ne obstaja');
        }
        if (registration.status !== 'PENDING') {
          throw new ApiError(409, 'Prijava je že obravnavana');
        }

        if (next_ === 'APPROVED') {
          const approved = await tx.registration.count({
            where: { tournamentId: id, status: 'APPROVED' },
          });
          if (approved >= tournament.maxTeams) {
            throw new ApiError(409, 'Doseženo je največje število ekip na turnirju');
          }
        }

        return tx.registration.update({ where: { id: registrationId }, data: { status: next_ } });
      });

      res.json({ registration: { id: updated.id, status: updated.status } });
    } catch (err) {
      handleError(err, res, next);
    }
  },
);

// Prijave ekipe (vidijo člani ekipe)
router.get(
  '/teams/:id/registrations',
  requireAuth,
  requireRole('PLAYER', 'ORGANIZER'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!UUID_RE.test(id)) throw new ApiError(404, 'Ekipa ne obstaja');
      const team = await prisma.team.findUnique({ where: { id }, include: { members: true } });
      if (!team) throw new ApiError(404, 'Ekipa ne obstaja');
      if (!team.members.some((m) => m.userId === req.user.id)) {
        throw new ApiError(403, 'Nimate dostopa do te ekipe');
      }
      const registrations = await prisma.registration.findMany({
        where: { teamId: id },
        include: { tournament: true },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ registrations: registrations.map(publicRegistration) });
    } catch (err) {
      handleError(err, res, next);
    }
  },
);

module.exports = router;
