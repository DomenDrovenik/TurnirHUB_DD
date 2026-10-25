# Uporaba PostgreSQL kot podatkovne baze

## Kontekst in opis problema

TurnirHub upravlja močno povezane podatke: uporabniki so člani ekip, ekipe se prijavljajo na turnirje, turnirji vsebujejo tekme, tekme v izločilnem drevesu kažejo na naslednjo tekmo. Pravila (npr. ena prijava ekipe na turnir) morajo veljati tudi na ravni baze, ne le v kodi. Katero vrsto podatkovne baze uporabiti?

## Obravnavane možnosti

* PostgreSQL (relacijska baza)
* MongoDB (dokumentna baza)
* SQLite (datotečna relacijska baza)

## Rezultat odločitve

Izbrana možnost: "PostgreSQL", ker so podatki izrazito relacijski (razmerja 1:N in M:N prek vez TeamMember in Registration), potrebujemo tuje ključe, enolične omejitve (npr. `UNIQUE (tournament_id, team_id)`) in transakcije. MongoDB nima tujih ključev, zato bi morala povezave in celovitost skrbeti aplikacija; SQLite pa je slabše primerna za spletno aplikacijo s sočasnimi uporabniki.

### Posledice

* Dobro, ker referenčna celovitost in enolične omejitve preprečijo napačne podatke že v bazi.
* Dobro, ker transakcije omogočajo atomarne operacije, sprotni izračun lestvice pa je preprost z združevanjem (JOIN, GROUP BY).
* Slabo, ker spremembe sheme zahtevajo migracije.
* Slabo, ker lokalni razvoj potrebuje še en zagnan servis (rešeno z Docker Compose, glej ADR-0006).
