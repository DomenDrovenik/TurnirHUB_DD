const test = require('node:test');
const assert = require('node:assert');
const { roundRobin, seedOrder, singleElimination } = require('../src/lib/schedule');

const teams = (n) => Array.from({ length: n }, (_, i) => `T${i + 1}`);

test('krožni sistem: vsak par natanko enkrat, nobena ekipa dvakrat v kolu', () => {
  for (let n = 2; n <= 12; n += 1) {
    const matches = roundRobin(teams(n));
    assert.equal(matches.length, (n * (n - 1)) / 2, `število tekem za ${n} ekip`);

    const pairs = new Set();
    for (const m of matches) {
      assert.notEqual(m.home, m.away);
      pairs.add([m.home, m.away].sort().join('|'));
    }
    assert.equal(pairs.size, matches.length, `podvojen par pri ${n} ekipah`);

    const rounds = new Map();
    for (const m of matches) {
      if (!rounds.has(m.round)) rounds.set(m.round, []);
      rounds.get(m.round).push(m.home, m.away);
    }
    for (const [round, list] of rounds) {
      assert.equal(new Set(list).size, list.length, `ekipa dvakrat v kolu ${round} pri ${n} ekipah`);
    }
    assert.equal(rounds.size, n % 2 === 0 ? n - 1 : n, `število kol za ${n} ekip`);
  }
});

test('krožni sistem: sodo število ekip nima praznih kol', () => {
  const matches = roundRobin(teams(6));
  for (let round = 1; round <= 5; round += 1) {
    assert.equal(matches.filter((m) => m.round === round).length, 3);
  }
});

test('krožni sistem: premalo ekip ne ustvari tekem', () => {
  assert.deepEqual(roundRobin([]), []);
  assert.deepEqual(roundRobin(['A']), []);
});

test('vrstni red nosilcev', () => {
  assert.deepEqual(seedOrder(2), [1, 2]);
  assert.deepEqual(seedOrder(4), [1, 4, 2, 3]);
  assert.deepEqual(seedOrder(8), [1, 8, 4, 5, 2, 7, 3, 6]);
});

test('izločanje: potenca števila 2 nima prostih prehodov', () => {
  for (const n of [2, 4, 8, 16]) {
    const matches = singleElimination(teams(n));
    assert.equal(matches.length, n - 1);
    assert.equal(matches.filter((m) => m.bye).length, 0);
    assert.equal(matches.filter((m) => m.round === 1).length, n / 2);
  }
});

test('izločanje: prosti prehodi pripadajo najvišjim nosilcem', () => {
  for (let n = 2; n <= 20; n += 1) {
    const list = teams(n);
    const matches = singleElimination(list);
    let size = 2;
    while (size < n) size *= 2;
    const byes = size - n;

    assert.equal(matches.length, size - 1, `število tekem za ${n} ekip`);
    const byeMatches = matches.filter((m) => m.bye);
    assert.equal(byeMatches.length, byes);
    assert.deepEqual(
      byeMatches.map((m) => m.home).sort(),
      list.slice(0, byes).sort(),
      `prosti prehod ni pri najvišjih nosilcih za ${n} ekip`,
    );
    for (const m of byeMatches) assert.equal(m.away, null);

    // Vsaka ekipa nastopa v prvem krogu natanko enkrat.
    const firstRound = matches.filter((m) => m.round === 1).flatMap((m) => [m.home, m.away]).filter(Boolean);
    assert.deepEqual([...firstRound].sort(), [...list].sort());
  }
});

test('izločanje: tekme so povezane z naslednjo tekmo in zmagovalec s prostim prehodom je že vpisan', () => {
  for (let n = 2; n <= 20; n += 1) {
    const matches = singleElimination(teams(n));
    const byKey = new Map(matches.map((m) => [m.key, m]));
    const finalRound = Math.max(...matches.map((m) => m.round));

    const feeders = new Map();
    for (const m of matches) {
      if (m.round === finalRound) {
        assert.equal(m.nextKey, null);
        assert.equal(m.nextSlot, null);
      } else {
        const next = byKey.get(m.nextKey);
        assert.ok(next, 'naslednja tekma obstaja');
        assert.equal(next.round, m.round + 1);
        feeders.set(m.nextKey, (feeders.get(m.nextKey) || 0) + 1);
        if (m.bye) assert.equal(next[m.nextSlot === 'HOME' ? 'home' : 'away'], m.home);
      }
    }
    // V vsako tekmo iz naslednjih krogov vodita natanko dve tekmi.
    for (const m of matches.filter((x) => x.round > 1)) assert.equal(feeders.get(m.key), 2);
    assert.equal(matches.filter((m) => m.round === finalRound).length, 1);
  }
});

test('izločanje: najvišja nosilca se srečata šele v finalu', () => {
  const matches = singleElimination(teams(8));
  const byKey = new Map(matches.map((m) => [m.key, m]));
  const path = (team) => {
    let m = matches.find((x) => x.round === 1 && (x.home === team || x.away === team));
    const keys = [m.key];
    while (m.nextKey) {
      m = byKey.get(m.nextKey);
      keys.push(m.key);
    }
    return keys;
  };
  const a = path('T1');
  const b = path('T2');
  const common = a.filter((k) => b.includes(k));
  assert.deepEqual(common, ['3-0']);
});
