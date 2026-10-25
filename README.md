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

## Dokumentacija

Podrobna dokumentacija je v mapi [`docs/`](docs/):

1. [Zasnova rešitve](docs/01-zasnova-resitve.md)
2. [Funkcionalnosti in obseg](docs/02-funkcionalnosti-in-obseg.md)
3. [Podatkovni model](docs/03-podatkovni-model.md)
4. [Arhitektura in tehnološki sklad](docs/04-arhitektura-in-tehnoloski-sklad.md)
5. [Uporabniške zgodbe](docs/05-uporabniske-zgodbe.md)
6. [Wireframes](docs/06-wireframes.md)
7. [Arhitekturne odločitve (ADR)](docs/adr/)