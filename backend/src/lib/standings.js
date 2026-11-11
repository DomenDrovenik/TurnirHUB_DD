// Izračun lestvice. Funkcija je čista (brez baze), zato jo je enostavno testirati.
//
// teams:   [{ id, name }]
// matches: [{ homeTeamId, awayTeamId, homeScore, awayScore, status }]
// rules:   { pointsWin, pointsDraw, pointsLoss }
//
// Upoštevane so samo tekme v stanju CONFIRMED z obema ekipama in rezultatom.
// Razvrščanje: točke, razlika v zadetkih, medsebojni izid, nazadnje ime ekipe (za stalen vrstni red).

function emptyRow(team) {
  return {
    teamId: team.id,
    name: team.name,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDiff: 0,
    points: 0,
  };
}

function isCounted(match) {
  return (
    match.status === 'CONFIRMED' &&
    match.homeTeamId &&
    match.awayTeamId &&
    Number.isInteger(match.homeScore) &&
    Number.isInteger(match.awayScore)
  );
}

// Doda tekmo v tabelo obeh ekip, ki sta v njej (ekipe izven `rows` se preskočijo).
function applyMatch(rows, match, rules) {
  const home = rows.get(match.homeTeamId);
  const away = rows.get(match.awayTeamId);
  const sides = [
    [home, match.homeScore, match.awayScore],
    [away, match.awayScore, match.homeScore],
  ];
  for (const [row, scored, conceded] of sides) {
    if (!row) continue;
    row.played += 1;
    row.goalsFor += scored;
    row.goalsAgainst += conceded;
    row.goalDiff = row.goalsFor - row.goalsAgainst;
    if (scored > conceded) {
      row.won += 1;
      row.points += rules.pointsWin;
    } else if (scored === conceded) {
      row.drawn += 1;
      row.points += rules.pointsDraw;
    } else {
      row.lost += 1;
      row.points += rules.pointsLoss;
    }
  }
}

function buildRows(teams, matches, rules) {
  const rows = new Map(teams.map((t) => [t.id, emptyRow(t)]));
  for (const match of matches) applyMatch(rows, match, rules);
  return rows;
}

// Medsebojni izid ekip z enakim številom točk in enako razliko: mini lestvica samo iz tekem med njimi.
function headToHead(group, matches, rules) {
  const rows = buildRows(group, matches, rules);
  return (teamId) => {
    const r = rows.get(teamId);
    return { points: r.points, goalDiff: r.goalDiff };
  };
}

function computeStandings(teams, matches, rules) {
  const counted = matches.filter(isCounted);
  const rows = [...buildRows(teams, counted, rules).values()];

  rows.sort((a, b) => b.points - a.points || b.goalDiff - a.goalDiff);

  // Znotraj skupin z enakimi točkami in razliko odloča medsebojni izid.
  const sorted = [];
  let i = 0;
  while (i < rows.length) {
    let j = i + 1;
    while (j < rows.length && rows[j].points === rows[i].points && rows[j].goalDiff === rows[i].goalDiff) j += 1;
    const group = rows.slice(i, j);
    if (group.length > 1) {
      const ids = new Set(group.map((r) => r.teamId));
      const between = counted.filter((m) => ids.has(m.homeTeamId) && ids.has(m.awayTeamId));
      const h2h = headToHead(group.map((r) => ({ id: r.teamId, name: r.name })), between, rules);
      group.sort((a, b) => {
        const ha = h2h(a.teamId);
        const hb = h2h(b.teamId);
        return hb.points - ha.points || hb.goalDiff - ha.goalDiff || a.name.localeCompare(b.name, 'sl');
      });
    }
    sorted.push(...group);
    i = j;
  }

  return sorted.map((row, index) => ({ position: index + 1, ...row }));
}

module.exports = { computeStandings };
