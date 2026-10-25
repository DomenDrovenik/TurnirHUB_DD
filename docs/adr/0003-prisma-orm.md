# Uporaba Prisma ORM za dostop do baze

## Kontekst in opis problema

Backend v Node.js mora dostopati do PostgreSQL baze z več povezanimi entitetami, shema pa se bo skozi razvoj spreminjala. Kako dostopati do podatkov in upravljati spremembe sheme?

## Obravnavane možnosti

* Prisma ORM
* Ročni SQL prek knjižnice `pg`
* Drug ORM (Sequelize, TypeORM)

## Rezultat odločitve

Izbrana možnost: "Prisma ORM", ker ponuja tipsko varen dostop do baze, vgrajene migracije in manj ponavljajoče kode kot ročni SQL. Shema je opisana na enem mestu (`schema.prisma`), podporo za transakcije (`$transaction`) pa potrebujemo za kritične operacije. Sequelize in TypeORM imata zahtevnejšo tipsko podporo.

### Posledice

* Dobro, ker se napake v imenih polj in tipih odkrijejo že med razvojem.
* Dobro, ker so migracije verzionirane skupaj s kodo in ponovljive na vsakem okolju.
* Slabo, ker je dodatna odvisnost in korak generiranja odjemalca.
* Slabo, ker je zelo zahtevne poizvedbe včasih treba napisati kot surov SQL.
