# Kritične operacije se izvajajo znotraj transakcij

## Kontekst in opis problema

Nekatere operacije spreminjajo več zapisov hkrati: generiranje razporeda ustvari veliko tekem, potrditev rezultata v izločilnem drevesu posodobi tekmo in vpiše zmagovalca v naslednjo tekmo, odobritev prijave mora upoštevati največje število ekip. Če se operacija ustavi na pol poti ali dva zahtevka tekmujeta za zadnje prosto mesto, baza ostane v neskladnem stanju.

## Obravnavane možnosti

* Kritične operacije v transakcijah (Prisma `$transaction`)
* Posamezne neodvisne poizvedbe brez transakcije
* Kompenzacijska logika v aplikaciji (ročno razveljavljanje korakov ob napaki)

## Rezultat odločitve

Izbrana možnost: "Transakcije za generiranje razporeda, potrditev rezultata z napredovanjem in odobritev prijav", ker se ob napaki razveljavijo vse spremembe operacije, preverjanje pogojev pa poteka znotraj iste transakcije. Brez transakcij bi napaka sredi operacije pustila nepopolne podatke, ročno razveljavljanje pa je zapleteno, baza pa to funkcijo že ponuja.

### Posledice

* Dobro, ker se razpored shrani v celoti ali pa sploh ne.
* Dobro, ker sta potrditev rezultata in napredovanje zmagovalca atomarna.
* Slabo, ker transakcije držijo zaklepe in lahko pri sočasnih zahtevkih povzročijo čakanje.
* Slabo, ker je transakcijske poti treba posebej testirati (uspeh in napaka sredi operacije).
