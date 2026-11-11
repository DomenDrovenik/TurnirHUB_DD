const test = require('node:test');
const assert = require('node:assert');
const { computeStandings } = require('../src/lib/standings');

const RULES = { pointsWin: 3, pointsDraw: 1, pointsLoss: 0 };
const T = (...names) => names.map((n) => ({ id: n, name: n }));
const M = (home, away, homeScore, awayScore, status = 'CONFIRMED') => ({
  homeTeamId: home,
  awayTeamId: away,
  homeScore,
  awayScore,
  status,
});
const order = (rows) => rows.map((r) => r.teamId);

test('točke po pravilih turnirja in osnovna statistika', () => {
  const rows = computeStandings(T('A', 'B', 'C'), [M('A', 'B', 2, 0), M('B', 'C', 1, 1), M('C', 'A', 0, 1)], RULES);
  const a = rows.find((r) => r.teamId === 'A');
  assert.deepEqual(
    { played: a.played, won: a.won, drawn: a.drawn, lost: a.lost, gf: a.goalsFor, ga: a.goalsAgainst, gd: a.goalDiff, pts: a.points },
    { played: 2, won: 2, drawn: 0, lost: 0, gf: 3, ga: 0, gd: 3, pts: 6 },
  );
  const b = rows.find((r) => r.teamId === 'B');
  assert.equal(b.points, 1);
  assert.equal(b.lost, 1);
  assert.equal(b.drawn, 1);
  // B in C imata po 1 točko; C ima razliko -1, B pa -2.
  assert.deepEqual(order(rows), ['A', 'C', 'B'])
});

test('prilagojeno točkovanje (zmaga 2, remi 1, poraz 1)', () => {
  const rows = computeStandings(T('A', 'B'), [M('A', 'B', 1, 0), M('B', 'A', 2, 2)], { pointsWin: 2, pointsDraw: 1, pointsLoss: 1 });
  assert.equal(rows.find((r) => r.teamId === 'A').points, 3);
  assert.equal(rows.find((r) => r.teamId === 'B').points, 2);
});

test('upoštevane so samo potrjene tekme', () => {
  const rows = computeStandings(
    T('A', 'B'),
    [M('A', 'B', 5, 0, 'AWAITING_CONFIRMATION'), M('A', 'B', 5, 0, 'DISPUTED'), M('A', 'B', 5, 0, 'SCHEDULED'), M('A', 'B', 1, 0, 'CONFIRMED')],
    RULES,
  );
  assert.equal(rows[0].played, 1);
  assert.equal(rows[0].goalsFor, 1);
});

test('tekme brez druge ekipe (prosti prehod) se ne štejejo', () => {
  const rows = computeStandings(T('A', 'B'), [{ homeTeamId: 'A', awayTeamId: null, homeScore: null, awayScore: null, status: 'CONFIRMED' }], RULES);
  assert.equal(rows[0].played, 0);
});

test('ekipe brez tekem so na lestvici z ničlami', () => {
  const rows = computeStandings(T('A', 'B', 'C'), [M('A', 'B', 1, 0)], RULES);
  assert.equal(rows.length, 3);
  assert.equal(rows.find((r) => r.teamId === 'C').points, 0);
});

test('razvrščanje 1: več točk je više', () => {
  const rows = computeStandings(T('A', 'B', 'C'), [M('A', 'B', 0, 1), M('B', 'C', 1, 0), M('A', 'C', 1, 1)], RULES);
  assert.equal(rows[0].teamId, 'B');
});

test('razvrščanje 2: pri enakih točkah odloča razlika v zadetkih', () => {
  const rows = computeStandings(T('A', 'B', 'X', 'Y'), [M('A', 'X', 4, 0), M('B', 'Y', 1, 0), M('A', 'Y', 0, 1), M('B', 'X', 0, 1)], RULES);
  const a = rows.find((r) => r.teamId === 'A');
  const b = rows.find((r) => r.teamId === 'B');
  assert.equal(a.points, b.points);
  assert.equal(a.goalDiff, 3);
  assert.equal(b.goalDiff, 0);
  assert.ok(a.position < b.position);
});

test('razvrščanje 3: pri enakih točkah in razliki odloča medsebojni izid', () => {
  // A in B: 3 točke, razlika 0. A je B premagal. F1 (3 točke, razlika +1) je prvi, F2 zadnji.
  const matches = [M('A', 'B', 1, 0), M('A', 'F1', 0, 1), M('B', 'F2', 1, 0)];
  for (const input of [matches, [...matches].reverse()]) {
    const rows = computeStandings(T('A', 'B', 'F1', 'F2'), input, RULES);
    assert.deepEqual(order(rows), ['F1', 'A', 'B', 'F2']);
  }
  // Obratno: če je B premagal A, sta zamenjana.
  const reverse = [M('B', 'A', 1, 0), M('A', 'F1', 1, 0), M('F2', 'B', 0, 1)];
  const rows = computeStandings(T('A', 'B', 'F1', 'F2'), reverse, RULES);
  assert.ok(order(rows).indexOf('B') < order(rows).indexOf('A'));
});

test('razvrščanje 3: medsebojni izid pri remiju odloči razlika iz medsebojnih tekem, nato ime', () => {
  const rows = computeStandings(T('B', 'A'), [M('A', 'B', 1, 1)], RULES);
  assert.deepEqual(order(rows), ['A', 'B']); // popolnoma enaki: po imenu
});

test('mesta so zaporedna od 1', () => {
  const rows = computeStandings(T('A', 'B', 'C'), [], RULES);
  assert.deepEqual(rows.map((r) => r.position), [1, 2, 3]);
});
