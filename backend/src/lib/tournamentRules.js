const FORMATS = ['ROUND_ROBIN', 'SINGLE_ELIMINATION'];

// Dovoljeni ročni prehodi stanj turnirja.
// Prehod v IN_PROGRESS opravi generiranje razporeda (US-05), v FINISHED pa zadnja potrjena tekma.
const TRANSITIONS = {
  DRAFT: ['REGISTRATION_OPEN', 'CANCELLED'],
  REGISTRATION_OPEN: ['REGISTRATION_CLOSED', 'CANCELLED'],
  REGISTRATION_CLOSED: ['CANCELLED'],
  IN_PROGRESS: ['CANCELLED'],
  FINISHED: [],
  CANCELLED: [],
};

// Stanja, v katerih je turnir še mogoče urejati.
const EDITABLE_STATUSES = ['DRAFT', 'REGISTRATION_OPEN'];

// Polja, ki jih po objavi ni več mogoče spreminjati (pravila turnirja).
const LOCKED_AFTER_PUBLISH = [
  'format',
  'maxTeams',
  'minPlayersPerTeam',
  'pointsWin',
  'pointsDraw',
  'pointsLoss',
];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function asString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function asInt(value) {
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  if (typeof value === 'string' && /^-?\d+$/.test(value.trim())) return Number(value);
  return null;
}

// Prebere in preveri telo zahtevka. Vrne { data, fields }; fields je prazen, če je vse v redu.
function parseTournamentInput(body = {}) {
  const fields = {};

  const name = asString(body.name);
  if (!name) fields.name = 'Vnesite ime turnirja';
  else if (name.length > 100) fields.name = 'Ime je lahko dolgo največ 100 znakov';

  const sport = asString(body.sport);
  if (!sport) fields.sport = 'Vnesite šport';

  const format = asString(body.format);
  if (!FORMATS.includes(format)) fields.format = 'Izberite format (liga ali izločanje)';

  const location = asString(body.location);
  if (!location) fields.location = 'Vnesite lokacijo';

  let startDate = null;
  const startDateStr = asString(body.startDate);
  if (DATE_RE.test(startDateStr)) {
    const parsed = new Date(`${startDateStr}T00:00:00.000Z`);
    if (!Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === startDateStr) {
      startDate = parsed;
    }
  }
  if (!startDate) fields.startDate = 'Vnesite veljaven datum začetka';

  let registrationDeadline = null;
  const deadlineStr = asString(body.registrationDeadline);
  if (deadlineStr) {
    const parsed = new Date(deadlineStr);
    if (!Number.isNaN(parsed.getTime())) registrationDeadline = parsed;
  }
  if (!registrationDeadline) fields.registrationDeadline = 'Vnesite veljaven rok prijav';

  if (startDate && registrationDeadline && registrationDeadline >= startDate) {
    fields.registrationDeadline = 'Rok prijav mora biti pred datumom začetka';
  }

  const maxTeams = asInt(body.maxTeams);
  if (maxTeams === null || maxTeams < 2 || maxTeams > 128) {
    fields.maxTeams = 'Največ ekip mora biti med 2 in 128';
  }

  const minPlayersPerTeam = asInt(body.minPlayersPerTeam);
  if (minPlayersPerTeam === null || minPlayersPerTeam < 1 || minPlayersPerTeam > 50) {
    fields.minPlayersPerTeam = 'Najmanjše število igralcev mora biti med 1 in 50';
  }

  const points = {};
  for (const [key, label] of [
    ['pointsWin', 'zmago'],
    ['pointsDraw', 'remi'],
    ['pointsLoss', 'poraz'],
  ]) {
    const value = asInt(body[key]);
    if (value === null || value < 0 || value > 100) {
      fields[key] = `Točke za ${label} morajo biti celo število med 0 in 100`;
    }
    points[key] = value;
  }

  return {
    fields,
    data: {
      name,
      sport,
      format,
      location,
      startDate,
      registrationDeadline,
      maxTeams,
      minPlayersPerTeam,
      ...points,
    },
  };
}

function publicTournament(t) {
  return {
    id: t.id,
    organizerId: t.organizerId,
    name: t.name,
    sport: t.sport,
    format: t.format,
    location: t.location,
    startDate: t.startDate.toISOString().slice(0, 10),
    registrationDeadline: t.registrationDeadline.toISOString(),
    maxTeams: t.maxTeams,
    minPlayersPerTeam: t.minPlayersPerTeam,
    pointsWin: t.pointsWin,
    pointsDraw: t.pointsDraw,
    pointsLoss: t.pointsLoss,
    status: t.status,
  };
}

module.exports = {
  TRANSITIONS,
  EDITABLE_STATUSES,
  LOCKED_AFTER_PUBLISH,
  UUID_RE,
  parseTournamentInput,
  publicTournament,
};
