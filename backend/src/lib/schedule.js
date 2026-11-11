// Algoritma za generiranje razporeda. Funkciji sta čisti (brez baze), zato ju je enostavno testirati.

// Krožni sistem (circle method): vsaka ekipa igra z vsako drugo natanko enkrat.
// Pri lihem številu ekip ima v vsakem kolu ena ekipa prosto (tekma se ne ustvari).
// Vrne [{ round, position, home, away }], kolo se šteje od 1.
function roundRobin(teamIds) {
  const teams = [...teamIds];
  if (teams.length < 2) return [];
  if (teams.length % 2 === 1) teams.push(null); // null = prosto kolo

  const n = teams.length;
  const matches = [];
  let rotating = teams.slice(1);

  for (let round = 1; round < n; round += 1) {
    const circle = [teams[0], ...rotating];
    let position = 0;
    for (let i = 0; i < n / 2; i += 1) {
      const a = circle[i];
      const b = circle[n - 1 - i];
      if (a !== null && b !== null) {
        // Prva ekipa menja domače/gostujoče igrišče, da je razporeditev bolj poštena.
        const swap = i === 0 && round % 2 === 0;
        matches.push({ round, position, home: swap ? b : a, away: swap ? a : b });
        position += 1;
      }
    }
    rotating = [rotating[rotating.length - 1], ...rotating.slice(0, -1)];
  }
  return matches;
}

// Vrstni red nosilcev v prvem krogu: 1 in 2 se lahko srečata šele v finalu.
// Za velikost 8 vrne [1, 8, 4, 5, 2, 7, 3, 6] (pari: 1-8, 4-5, 2-7, 3-6).
function seedOrder(size) {
  let order = [1];
  while (order.length < size) {
    const total = order.length * 2 + 1;
    order = order.flatMap((seed) => [seed, total - seed]);
  }
  return order;
}

// Izločilno drevo. Ekipe so podane po nosilcih (prva = najvišje postavljena).
// Če število ekip ni potenca števila 2, najvišji nosilci dobijo prosti prehod
// (away = null v prvem krogu), zmagovalec takšne tekme pa je že vpisan v naslednjo tekmo.
// Vrne [{ key, round, position, home, away, bye, nextKey, nextSlot }].
function singleElimination(teamIds) {
  const count = teamIds.length;
  if (count < 2) return [];

  let size = 2;
  while (size < count) size *= 2;
  const totalRounds = Math.log2(size);

  const matches = [];
  const byKey = new Map();
  for (let round = 1; round <= totalRounds; round += 1) {
    const inRound = size / 2 ** round;
    for (let position = 0; position < inRound; position += 1) {
      const match = {
        key: `${round}-${position}`,
        round,
        position,
        home: null,
        away: null,
        bye: false,
        nextKey: round < totalRounds ? `${round + 1}-${Math.floor(position / 2)}` : null,
        nextSlot: round < totalRounds ? (position % 2 === 0 ? 'HOME' : 'AWAY') : null,
      };
      matches.push(match);
      byKey.set(match.key, match);
    }
  }

  const order = seedOrder(size);
  for (let position = 0; position < size / 2; position += 1) {
    const high = order[position * 2];
    const low = order[position * 2 + 1];
    const match = byKey.get(`1-${position}`);
    match.home = teamIds[high - 1];
    match.away = low <= count ? teamIds[low - 1] : null;
    if (match.away === null) {
      match.bye = true;
      const next = byKey.get(match.nextKey);
      next[match.nextSlot === 'HOME' ? 'home' : 'away'] = match.home;
    }
  }
  return matches;
}

module.exports = { roundRobin, seedOrder, singleElimination };
