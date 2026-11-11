const express = require('express');
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const { UUID_RE } = require('../lib/tournamentRules');

const router = express.Router();

class ApiError extends Error {
  constructor(status, message, fields) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

const MATCH_INCLUDE = { homeTeam: true, awayTeam: true, tournament: true };

function parseScore(value, label) {
  const ok =
    (typeof value === 'number' && Number.isInteger(value)) ||
    (typeof value === 'string' && /^\d+$/.test(value.trim()));
  const number = ok ? Number(value) : NaN;
  if (!ok || number < 0 || number > 999) {
    return { error: `${label} mora biti celo število med 0 in 999` };
  }
  return { value: number };
}

// Prebere in preveri rezultat; pri izločilnem formatu neodločen izid ni dovoljen.
function parseResult(body, format) {
  const fields = {};
  const home = parseScore(body?.homeScore, 'Rezultat domače ekipe');
  const away = parseScore(body?.awayScore, 'Rezultat gostujoče ekipe');
  if (home.error) fields.homeScore = home.error;
  if (away.error) fields.awayScore = away.error;
  if (Object.keys(fields).length > 0) {
    throw new ApiError(400, 'Neveljaven rezultat', fields);
  }
  if (format === 'SINGLE_ELIMINATION' && home.value === away.value) {
    throw new ApiError(400, 'Pri izločanju neodločen izid ni dovoljen', {
      awayScore: 'Pri izločanju neodločen izid ni dovoljen',
    });
  }
  return { homeScore: home.value, awayScore: away.value };
}

// Naloži tekmo iz :id; tekma mora imeti obe ekipi (tekme s prostim prehodom se ne igrajo).
async function loadMatch(req, res, next) {
  try {
    if (!UUID_RE.test(req.params.id)) throw new ApiError(404, 'Tekma ne obstaja');
    const match = await prisma.match.findUnique({ where: { id: req.params.id }, include: MATCH_INCLUDE });
    if (!match || match.tournament.status === 'DRAFT') throw new ApiError(404, 'Tekma ne obstaja');
    req.match = match;
    return next();
  } catch (err) {
    if (err instanceof ApiError) return res.status(err.status).json({ error: err.message });
    return next(err);
  }
}

function requirePlayable(match) {
  if (!match.homeTeam || !match.awayTeam) {
    throw new ApiError(409, 'Tekma še nima obeh ekip');
  }
}

// Kaj lahko prijavljeni uporabnik stori s to tekmo.
function permissions(match, userId) {
  const homeCaptain = match.homeTeam?.captainId === userId;
  const awayCaptain = match.awayTeam?.captainId === userId;
  const playable = Boolean(match.homeTeam && match.awayTeam) && match.tournament.status === 'IN_PROGRESS';
  const reporterIsHome = match.reportedByTeamId === match.homeTeamId;
  const isResponder = match.reportedByTeamId && (reporterIsHome ? awayCaptain : homeCaptain);
  return {
    canReport: playable && match.status === 'SCHEDULED' && (homeCaptain || awayCaptain),
    canRespond: playable && match.status === 'AWAITING_CONFIRMATION' && Boolean(isResponder),
    canResolve:
      match.status === 'DISPUTED' && match.tournament.organizerId === userId,
  };
}

function publicMatch(match, userId) {
  return {
    id: match.id,
    round: match.round,
    status: match.status,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    home: match.homeTeam && { id: match.homeTeam.id, name: match.homeTeam.name },
    away: match.awayTeam && { id: match.awayTeam.id, name: match.awayTeam.name },
    reportedByTeamId: match.reportedByTeamId,
    tournament: {
      id: match.tournament.id,
      name: match.tournament.name,
      format: match.tournament.format,
      status: match.tournament.status,
    },
    permissions: permissions(match, userId),
  };
}

const wrap = (handler) => async (req, res, next) => {
  try {
    await handler(req, res);
  } catch (err) {
    if (err instanceof ApiError) {
      return res.status(err.status).json({ error: err.message, ...(err.fields ? { fields: err.fields } : {}) });
    }
    return next(err);
  }
};

// Ko je tekma potrjena: zmagovalec izločilne tekme zasede mesto v naslednji tekmi,
// ko so vse tekme potrjene, pa turnir preide v FINISHED.
async function afterConfirmed(tx, match, homeScore, awayScore) {
  if (match.nextMatchId) {
    if (homeScore === awayScore) throw new ApiError(400, 'Pri izločanju neodločen izid ni dovoljen');
    const winnerId = homeScore > awayScore ? match.homeTeamId : match.awayTeamId;
    await tx.match.update({
      where: { id: match.nextMatchId },
      data: match.nextMatchSlot === 'HOME' ? { homeTeamId: winnerId } : { awayTeamId: winnerId },
    });
  }
  const open = await tx.match.count({
    where: { tournamentId: match.tournamentId, status: { notIn: ['CONFIRMED', 'CANCELLED'] } },
  });
  if (open === 0) {
    await tx.tournament.update({ where: { id: match.tournamentId }, data: { status: 'FINISHED' } });
  }
}

// Atomarna sprememba stanja: uspe samo, če je tekma še v pričakovanem stanju.
// Potrditev rezultata in napredovanje tečeta v isti transakciji; zaklep vrstice turnirja
// poskrbi, da sočasni potrditvi zadnjih tekem ne zgrešita prehoda v FINISHED.
async function transition(match, from, data) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM tournaments WHERE id = ${match.tournamentId}::uuid FOR UPDATE`;

    const { count } = await tx.match.updateMany({
      where: { id: match.id, status: from },
      data: { ...data },
    });
    if (count === 0) throw new ApiError(409, 'Stanje tekme se je medtem spremenilo, osvežite stran');

    if (data.status === 'CONFIRMED') {
      await afterConfirmed(
        tx,
        match,
        data.homeScore ?? match.homeScore,
        data.awayScore ?? match.awayScore,
      );
    }
    return tx.match.findUnique({ where: { id: match.id }, include: MATCH_INCLUDE });
  });
}

// Podrobnosti tekme z dovoljenji prijavljenega uporabnika
router.get('/matches/:id', requireAuth, loadMatch, (req, res) => {
  res.json({ match: publicMatch(req.match, req.user.id) });
});

// 1. Vnos rezultata (kapetan ene od obeh ekip)
router.post(
  '/matches/:id/result',
  requireAuth,
  loadMatch,
  wrap(async (req, res) => {
    const { match } = req;
    requirePlayable(match);
    const reporterTeam =
      match.homeTeam.captainId === req.user.id
        ? match.homeTeam
        : match.awayTeam.captainId === req.user.id
          ? match.awayTeam
          : null;
    if (!reporterTeam) throw new ApiError(403, 'Rezultat lahko vnese samo kapetan ene od obeh ekip');
    if (match.tournament.status !== 'IN_PROGRESS') throw new ApiError(409, 'Turnir ni v teku');
    if (match.status !== 'SCHEDULED') throw new ApiError(409, 'Rezultat za to tekmo je že vnesen');

    const result = parseResult(req.body, match.tournament.format);
    const updated = await transition(match, 'SCHEDULED', {
      ...result,
      status: 'AWAITING_CONFIRMATION',
      reportedByTeamId: reporterTeam.id,
    });
    res.json({ match: publicMatch(updated, req.user.id) });
  }),
);

// Odziv na vneseni rezultat (potrditev ali oporekanje): samo kapetan nasprotne ekipe
function respondHandler(nextStatus) {
  return wrap(async (req, res) => {
    const { match } = req;
    if (match.status !== 'AWAITING_CONFIRMATION') {
      throw new ApiError(409, 'Tekma ne čaka na potrditev rezultata');
    }
    if (!permissions(match, req.user.id).canRespond) {
      throw new ApiError(403, 'Rezultat lahko potrdi ali ospori samo kapetan nasprotne ekipe');
    }
    const updated = await transition(match, 'AWAITING_CONFIRMATION', { status: nextStatus });
    res.json({ match: publicMatch(updated, req.user.id) });
  });
}
router.post('/matches/:id/confirm', requireAuth, loadMatch, respondHandler('CONFIRMED'));
router.post('/matches/:id/dispute', requireAuth, loadMatch, respondHandler('DISPUTED'));

// Razrešitev spora: organizator turnirja ročno določi končni rezultat
router.post(
  '/matches/:id/resolve',
  requireAuth,
  loadMatch,
  wrap(async (req, res) => {
    const { match } = req;
    if (match.tournament.organizerId !== req.user.id) {
      throw new ApiError(403, 'Spor lahko razreši samo organizator turnirja');
    }
    if (match.status !== 'DISPUTED') throw new ApiError(409, 'Tekma ni sporna');
    const result = parseResult(req.body, match.tournament.format);
    const updated = await transition(match, 'DISPUTED', { ...result, status: 'CONFIRMED' });
    res.json({ match: publicMatch(updated, req.user.id) });
  }),
);

module.exports = router;
