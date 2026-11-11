const crypto = require('node:crypto');
const express = require('express');
const prisma = require('../lib/prisma');
const { requireAuth, requireRole } = require('../middleware/auth');
const { UUID_RE } = require('../lib/tournamentRules');
const { roundRobin, singleElimination } = require('../lib/schedule');
const { computeStandings } = require('../lib/standings');

const router = express.Router();

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function publicMatch(m, format) {
  return {
    id: m.id,
    round: m.round,
    position: m.position,
    status: m.status,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    home: m.homeTeam ? { id: m.homeTeam.id, name: m.homeTeam.name } : null,
    away: m.awayTeam ? { id: m.awayTeam.id, name: m.awayTeam.name } : null,
    isBye: format === 'SINGLE_ELIMINATION' && m.round === 1 && m.homeTeamId !== null && m.awayTeamId === null,
    nextMatchId: m.nextMatchId,
  };
}

// Pretvori izračunan razpored v vrstice za tabelo matches. ID-je določimo vnaprej,
// da lahko tekme med seboj povežemo z next_match_id in vse shranimo z enim vstavljanjem.
function buildRows(tournament, teamIds) {
  if (tournament.format === 'ROUND_ROBIN') {
    return roundRobin(teamIds).map((m) => ({
      id: crypto.randomUUID(),
      tournamentId: tournament.id,
      round: m.round,
      position: m.position,
      homeTeamId: m.home,
      awayTeamId: m.away,
      status: 'SCHEDULED',
      nextMatchId: null,
      nextMatchSlot: null,
    }));
  }

  const planned = singleElimination(teamIds);
  const ids = new Map(planned.map((m) => [m.key, crypto.randomUUID()]));
  return planned
    .map((m) => ({
      id: ids.get(m.key),
      tournamentId: tournament.id,
      round: m.round,
      position: m.position,
      homeTeamId: m.home,
      awayTeamId: m.away,
      // Tekma s prostim prehodom se ne igra, zato je takoj zaključena.
      status: m.bye ? 'CONFIRMED' : 'SCHEDULED',
      nextMatchId: m.nextKey ? ids.get(m.nextKey) : null,
      nextMatchSlot: m.nextSlot,
    }))
    .sort((a, b) => b.round - a.round); // najprej finale, da referenčne tekme že obstajajo
}

// Generiranje razporeda (samo organizator turnirja, samo enkrat)
router.post(
  '/tournaments/:id/schedule',
  requireAuth,
  requireRole('ORGANIZER'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!UUID_RE.test(id)) throw new ApiError(404, 'Turnir ne obstaja');

      const count = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM tournaments WHERE id = ${id}::uuid FOR UPDATE`;

        const tournament = await tx.tournament.findUnique({ where: { id } });
        if (!tournament) throw new ApiError(404, 'Turnir ne obstaja');
        if (tournament.organizerId !== req.user.id) {
          throw new ApiError(403, 'Nimate dovoljenja za generiranje razporeda tega turnirja');
        }

        if ((await tx.match.count({ where: { tournamentId: id } })) > 0) {
          throw new ApiError(409, 'Razpored je že generiran');
        }
        if (tournament.status !== 'REGISTRATION_CLOSED') {
          throw new ApiError(409, 'Razpored je mogoče generirati samo, ko so prijave zaprte');
        }

        // Nosilci so določeni po vrstnem redu prijave: prej prijavljena ekipa je višje postavljena.
        const approved = await tx.registration.findMany({
          where: { tournamentId: id, status: 'APPROVED' },
          orderBy: { createdAt: 'asc' },
        });
        if (approved.length < 2) {
          throw new ApiError(409, 'Za razpored sta potrebni vsaj 2 potrjeni ekipi');
        }

        const rows = buildRows(tournament, approved.map((r) => r.teamId));
        await tx.match.createMany({ data: rows });
        await tx.tournament.update({ where: { id }, data: { status: 'IN_PROGRESS' } });
        return rows.length;
      });

      res.status(201).json({ matches: count, status: 'IN_PROGRESS' });
    } catch (err) {
      if (err instanceof ApiError) return res.status(err.status).json({ error: err.message });
      return next(err);
    }
  },
);

// Razpored turnirja (javno za objavljene turnirje)
router.get('/tournaments/:id/matches', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!UUID_RE.test(id)) throw new ApiError(404, 'Turnir ne obstaja');
    const tournament = await prisma.tournament.findUnique({ where: { id } });
    if (!tournament || tournament.status === 'DRAFT') throw new ApiError(404, 'Turnir ne obstaja');

    const matches = await prisma.match.findMany({
      where: { tournamentId: id },
      include: { homeTeam: true, awayTeam: true },
      orderBy: [{ round: 'asc' }, { position: 'asc' }],
    });
    res.json({
      tournament: { id: tournament.id, name: tournament.name, format: tournament.format, status: tournament.status },
      matches: matches.map((m) => publicMatch(m, tournament.format)),
    });
  } catch (err) {
    if (err instanceof ApiError) return res.status(err.status).json({ error: err.message });
    return next(err);
  }
});

// Lestvica turnirja: izračunana sproti iz potrjenih tekem (javno za objavljene turnirje)
router.get('/tournaments/:id/standings', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!UUID_RE.test(id)) throw new ApiError(404, 'Turnir ne obstaja');
    const tournament = await prisma.tournament.findUnique({ where: { id } });
    if (!tournament || tournament.status === 'DRAFT') throw new ApiError(404, 'Turnir ne obstaja');

    const registrations = await prisma.registration.findMany({
      where: { tournamentId: id, status: 'APPROVED' },
      include: { team: true },
    });
    const matches = await prisma.match.findMany({ where: { tournamentId: id, status: 'CONFIRMED' } });

    const standings = computeStandings(
      registrations.map((r) => ({ id: r.team.id, name: r.team.name })),
      matches,
      {
        pointsWin: tournament.pointsWin,
        pointsDraw: tournament.pointsDraw,
        pointsLoss: tournament.pointsLoss,
      },
    );
    res.json({
      tournament: { id: tournament.id, name: tournament.name, format: tournament.format, status: tournament.status },
      standings,
    });
  } catch (err) {
    if (err instanceof ApiError) return res.status(err.status).json({ error: err.message });
    return next(err);
  }
});

module.exports = router;
