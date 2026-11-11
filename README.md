# TurnirHub

**TurnirHub** je spletna platforma za organizacijo amaterskih športnih turnirjev (košarka, nogomet, odbojka, mali nogomet, šah). Na enem mestu omogoča objavo turnirja, prijavo in potrditev ekip, samodejno generiranje razporeda, vnos in potrjevanje rezultatov ter samodejni izračun lestvice.

Organizatorji tako ne potrebujejo več skupin na družbenih omrežjih, sporočil in Excelovih tabel, igralci in ekipe pa imajo razpored, rezultate in lestvico na enem mestu.

## Glavne funkcionalnosti

- registracija in prijava z vlogami (igralec, organizator, administrator),
- ustvarjanje in objava turnirjev (liga ali izločanje),
- ustvarjanje ekip in prijava ekip na turnir z validacijo in potrditvijo organizatorja,
- samodejno generiranje razporeda (krožni sistem ali izločilno drevo),
- vnos in potrditev rezultatov tekem,
- samodejna lestvica in napredovanje v izločilnem drevesu,
- izvoz tekem v koledar (.ics).

## Uporabljene tehnologije

| Področje | Tehnologija |
|---|---|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Node.js, Express (REST API) |
| Podatkovna baza | PostgreSQL, Prisma ORM |
| Avtentikacija | JWT, bcrypt |
| Lokalni razvoj | Docker Compose |

## Lokalni zagon

Za zagon je dovolj [Docker](https://www.docker.com/) (Docker Desktop z ukazom `docker compose`).

1. Kloniraj repozitorij in ustvari datoteko z nastavitvami:

   ```bash
   git clone https://github.com/DomenDrovenik/TurnirHUB_DD.git
   cd TurnirHUB_DD
   cp .env.example .env
   ```

   Za lokalni preizkus vrednosti v `.env` delujejo take, kot so. Če jih spremeniš, mora biti geslo enako v `POSTGRES_PASSWORD` in `DATABASE_URL`. Datoteke `.env` ne potiskaj na GitHub.

2. Zaženi vse storitve (baza, API, spletni vmesnik):

   ```bash
   docker compose up --build
   ```

   Ob prvem zagonu API samodejno izvede migracije baze.

3. Odpri aplikacijo:

   | Storitev | Naslov |
   |---|---|
   | Spletni vmesnik | http://localhost:5173 |
   | API | http://localhost:3000 (preverjanje: `/api/health`) |
   | PostgreSQL | localhost:5432 |

### Demo podatki

Baza je po prvem zagonu prazna. Za preizkus lahko v drugem terminalu (ko storitve tečejo) dodaš demo podatke:

```bash
docker compose exec api npm run seed
```

Skripta ustvari uporabnike, ekipe in šest turnirjev v različnih stanjih. Če demo podatki že obstajajo, ne naredi ničesar. Za ponoven vnos izbriši bazo (`docker compose down -v`) in znova zaženi storitve.

Geslo za vse demo račune je `geslo1234`.

| Račun | Vloga | Opomba |
|---|---|---|
| `organizator@demo.si` | organizator | upravlja vse demo turnirje |
| `admin@demo.si` | administrator | |
| `ana@demo.si` | igralec | kapetan ekipe Orli |
| `dani@demo.si` | igralec | kapetan ekipe Sokoli |
| `gaja@demo.si` | igralec | kapetan ekipe Volkovi |
| `jure@demo.si` | igralec | kapetan ekipe Medvedi |
| `maja@demo.si` | igralec | kapetan ekipe Rakete |
| `oto@demo.si` | igralec | kapetan ekipe Zmaji |

Ostali igralci so člani ekip (`bor@`, `ciril@`, `eva@`, `franc@`, `hana@`, `ivan@`, `klara@`, `luka@`, `nik@`, `pia@` z domeno `@demo.si`).

| Turnir | Format | Stanje | Kaj lahko preizkusiš |
|---|---|---|---|
| Pomladna liga | liga | zaključen | končna lestvica, vse tekme potrjene |
| Poletna liga | liga | v teku | tekme v vseh stanjih: potrjena, čaka na potrditev, sporna, še neodigrana |
| Izločilni pokal | izločanje | v teku | prosti prehodi, napredovanje zmagovalca, vnos rezultatov |
| Jesenska liga | liga | prijave zaprte | generiranje razporeda (organizator) |
| Zimski turnir | izločanje | prijave odprte | prijava ekipe (npr. Rakete ali Zmaji), potrditev prijav |
| Spomladanski turnir | liga | osnutek | objava turnirja |

### Vloge uporabnikov

Registracija vedno ustvari uporabnika z vlogo igralca (PLAYER). Vlogo organizatorja ali administratorja dodeliš z ukazom (v drugem terminalu, ko storitve tečejo):

```bash
docker compose exec api npm run set-role -- ime@primer.si ORGANIZER
```

Možne vloge so `PLAYER`, `ORGANIZER` in `ADMIN`. Po spremembi vloge se uporabnik odjavi in znova prijavi.

### Uporabni ukazi

| Namen | Ukaz |
|---|---|
| Ustavi storitve (podatki ostanejo) | `docker compose stop` |
| Ugasni in odstrani kontejnerje (podatki ostanejo) | `docker compose down` |
| Ugasni in **izbriši podatke v bazi** | `docker compose down -v` |
| Ponovni zagon po spremembi odvisnosti (`package.json`) | `docker compose up --build --renew-anon-volumes` |
| Izpis dnevnika API-ja | `docker compose logs -f api` |
| Enotni testi (backend) | `docker compose exec api npm test` |

## Dokumentacija

Podrobna dokumentacija je v mapi [`docs/`](docs/):

1. [Zasnova rešitve](docs/01-zasnova-resitve.md)
2. [Funkcionalnosti in obseg](docs/02-funkcionalnosti-in-obseg.md)
3. [Podatkovni model](docs/03-podatkovni-model.md) (s [popravki po implementaciji](docs/03.1-podatkovni-model-popravki.md))
4. [Arhitektura in tehnološki sklad](docs/04-arhitektura-in-tehnoloski-sklad.md)
5. [Uporabniške zgodbe](docs/05-uporabniske-zgodbe.md)
6. [Wireframes](docs/06-wireframes.md)
7. [Arhitekturne odločitve (ADR)](docs/adr/)
