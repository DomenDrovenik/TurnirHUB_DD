// Napolni bazo z demo podatki: uporabniki, ekipe in turnirji v različnih stanjih.
// Uporaba: npm run seed   (v Dockerju: docker compose exec api npm run seed)
// Skripta je varna: če demo podatki že obstajajo, ne naredi ničesar.
const crypto = require('node:crypto');
const bcrypt = require('bcrypt');
const prisma = require('../src/lib/prisma');
const { roundRobin, singleElimination } = require('../src/lib/schedule');

const PASSWORD = 'geslo1234';
const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();
const inDays = (days) => new Date(now + days * DAY);
const dateOnly = (days) => new Date(`${inDays(days).toISOString().slice(0, 10)}T00:00:00.000Z`);

const USERS = [
  { email: 'admin@demo.si', displayName: 'Admin', role: 'ADMIN' },
  { email: 'organizator@demo.si', displayName: 'Organizator', role: 'ORGANIZER' },
  ...[
    'Ana', 'Bor', 'Ciril', 'Dani', 'Eva', 'Franc', 'Gaja', 'Hana', 'Ivan', 'Jure', 'Klara', 'Luka', 'Maja', 'Nik',
    'Oto', 'Pia',
  ].map((name) => ({ email: `${name.toLowerCase()}@demo.si`, displayName: name, role: 'PLAYER' })),
];

// Prvi član je kapetan.
const TEAMS = [
  { name: 'Orli', members: ['Ana', 'Bor', 'Ciril'] },
  { name: 'Sokoli', members: ['Dani', 'Eva', 'Franc'] },
  { name: 'Volkovi', members: ['Gaja', 'Hana', 'Ivan'] },
  { name: 'Medvedi', members: ['Jure', 'Klara', 'Luka'] },
  { name: 'Rakete', members: ['Maja', 'Nik'] },
  { name: 'Zmaji', members: ['Oto', 'Pia'] },
];

const baseTournament = {
  sport: 'Košarka',
  location: 'Športna dvorana Tivoli, Ljubljana',
  maxTeams: 8,
  minPlayersPerTeam: 2,
  pointsWin: 3,
  pointsDraw: 1,
  pointsLoss: 0,
};

function matchRow(tournamentId, m, extra = {}) {
  return {
    id: crypto.randomUUID(),
    tournamentId,
    round: m.round,
    position: m.position,
    homeTeamId: m.home,
    awayTeamId: m.away,
    status: 'SCHEDULED',
    nextMatchId: null,
    nextMatchSlot: null,
    ...extra,
  };
}

async function main() {
  if (await prisma.user.findUnique({ where: { email: 'organizator@demo.si' } })) {
    console.log('Demo podatki že obstajajo, nič ni bilo dodano.');
    console.log('Za ponovni vnos izbriši bazo: docker compose down -v, nato znova zaženi storitve.');
    return;
  }

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  await prisma.$transaction(
    async (tx) => {
      // --- Uporabniki ---
      const users = {};
      for (const u of USERS) {
        users[u.displayName] = await tx.user.create({ data: { ...u, passwordHash } });
      }
      const organizerId = users.Organizator.id;

      // --- Ekipe ---
      const teams = {};
      for (const t of TEAMS) {
        const captain = users[t.members[0]];
        teams[t.name] = await tx.team.create({
          data: {
            name: t.name,
            sport: 'Košarka',
            captainId: captain.id,
            members: { create: t.members.map((name) => ({ userId: users[name].id })) },
          },
        });
      }
      const id = (name) => teams[name].id;

      // Prijave z zaporednimi časi, da je vrstni red prijave (nosilci) določen.
      let tick = 0;
      const registrations = (tournamentId, list) =>
        list.map(([team, status]) => ({
          tournamentId,
          teamId: id(team),
          status,
          createdAt: new Date(now - 100 * DAY + tick++ * 60 * 1000),
        }));

      // --- 1. Zaključena liga: vse tekme potrjene ---
      const finished = await tx.tournament.create({
        data: {
          ...baseTournament,
          organizerId,
          name: 'Pomladna liga',
          format: 'ROUND_ROBIN',
          startDate: dateOnly(-60),
          registrationDeadline: inDays(-70),
          status: 'FINISHED',
        },
      });
      const league = ['Orli', 'Sokoli', 'Volkovi', 'Medvedi'];
      await tx.registration.createMany({
        data: registrations(finished.id, league.map((t) => [t, 'APPROVED'])),
      });
      const finishedScores = [[2, 1], [0, 0], [3, 2], [1, 2], [2, 2], [0, 1]];
      await tx.match.createMany({
        data: roundRobin(league.map(id)).map((m, i) =>
          matchRow(finished.id, m, {
            status: 'CONFIRMED',
            homeScore: finishedScores[i][0],
            awayScore: finishedScores[i][1],
            reportedByTeamId: m.home,
          }),
        ),
      });

      // --- 2. Liga v teku: tekme v vseh stanjih ---
      const running = await tx.tournament.create({
        data: {
          ...baseTournament,
          organizerId,
          name: 'Poletna liga',
          format: 'ROUND_ROBIN',
          startDate: dateOnly(-10),
          registrationDeadline: inDays(-20),
          status: 'IN_PROGRESS',
        },
      });
      await tx.registration.createMany({
        data: registrations(running.id, league.map((t) => [t, 'APPROVED'])),
      });
      // 3 potrjene, 1 čaka na potrditev, 1 sporna, 1 še ni odigrana
      const runningStates = [
        { status: 'CONFIRMED', homeScore: 2, awayScore: 0 },
        { status: 'CONFIRMED', homeScore: 1, awayScore: 1 },
        { status: 'CONFIRMED', homeScore: 0, awayScore: 3 },
        { status: 'AWAITING_CONFIRMATION', homeScore: 2, awayScore: 1 },
        { status: 'DISPUTED', homeScore: 1, awayScore: 0 },
        { status: 'SCHEDULED' },
      ];
      await tx.match.createMany({
        data: roundRobin(league.map(id)).map((m, i) =>
          matchRow(running.id, m, {
            ...runningStates[i],
            ...(runningStates[i].homeScore !== undefined ? { reportedByTeamId: m.home } : {}),
          }),
        ),
      });

      // --- 3. Izločanje v teku: 5 ekip, prosti prehodi, odigrana ena tekma ---
      const cup = await tx.tournament.create({
        data: {
          ...baseTournament,
          organizerId,
          name: 'Izločilni pokal',
          format: 'SINGLE_ELIMINATION',
          startDate: dateOnly(-5),
          registrationDeadline: inDays(-15),
          status: 'IN_PROGRESS',
        },
      });
      const cupTeams = ['Orli', 'Sokoli', 'Volkovi', 'Medvedi', 'Rakete'];
      await tx.registration.createMany({
        data: registrations(cup.id, cupTeams.map((t) => [t, 'APPROVED'])),
      });
      const planned = singleElimination(cupTeams.map(id));
      const ids = new Map(planned.map((m) => [m.key, crypto.randomUUID()]));
      const byKey = new Map();
      const cupRows = planned.map((m) => {
        const row = matchRow(cup.id, m, {
          id: ids.get(m.key),
          status: m.bye ? 'CONFIRMED' : 'SCHEDULED',
          nextMatchId: m.nextKey ? ids.get(m.nextKey) : null,
          nextMatchSlot: m.nextSlot,
        });
        byKey.set(m.key, row);
        return row;
      });
      // Odigrana tekma 1. kroga (ni prostega prehoda); zmagovalec napreduje v naslednjo tekmo.
      const played = cupRows.find((r) => r.round === 1 && r.homeTeamId && r.awayTeamId);
      Object.assign(played, { status: 'CONFIRMED', homeScore: 71, awayScore: 64, reportedByTeamId: played.homeTeamId });
      const next = cupRows.find((r) => r.id === played.nextMatchId);
      next[played.nextMatchSlot === 'HOME' ? 'homeTeamId' : 'awayTeamId'] = played.homeTeamId;
      await tx.match.createMany({ data: [...cupRows].sort((a, b) => b.round - a.round) });

      // --- 4. Prijave zaprte: organizator lahko generira razpored ---
      const closed = await tx.tournament.create({
        data: {
          ...baseTournament,
          organizerId,
          name: 'Jesenska liga',
          format: 'ROUND_ROBIN',
          startDate: dateOnly(10),
          registrationDeadline: inDays(-1),
          status: 'REGISTRATION_CLOSED',
        },
      });
      await tx.registration.createMany({
        data: registrations(closed.id, [['Orli', 'APPROVED'], ['Rakete', 'APPROVED'], ['Zmaji', 'APPROVED'], ['Sokoli', 'REJECTED']]),
      });

      // --- 5. Prijave odprte: ekipe se lahko prijavijo, organizator potrdi ---
      const open = await tx.tournament.create({
        data: {
          ...baseTournament,
          organizerId,
          name: 'Zimski turnir',
          format: 'SINGLE_ELIMINATION',
          startDate: dateOnly(40),
          registrationDeadline: inDays(30),
          status: 'REGISTRATION_OPEN',
        },
      });
      await tx.registration.createMany({
        data: registrations(open.id, [['Volkovi', 'APPROVED'], ['Medvedi', 'PENDING']]),
      });

      // --- 6. Osnutek ---
      await tx.tournament.create({
        data: {
          ...baseTournament,
          organizerId,
          name: 'Spomladanski turnir (osnutek)',
          format: 'ROUND_ROBIN',
          startDate: dateOnly(120),
          registrationDeadline: inDays(100),
          status: 'DRAFT',
        },
      });
    },
    { timeout: 60000 },
  );

  console.log('Demo podatki so dodani.');
  console.log(`Geslo za vse račune: ${PASSWORD}`);
  console.log('');
  console.log('Računi:');
  for (const u of USERS) console.log(`  ${u.email.padEnd(24)} ${u.role}`);
  console.log('');
  console.log('Kapetani ekip: ana (Orli), dani (Sokoli), gaja (Volkovi), jure (Medvedi), maja (Rakete), oto (Zmaji)');
}

main()
  .catch((err) => {
    console.error('Seed ni uspel:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
