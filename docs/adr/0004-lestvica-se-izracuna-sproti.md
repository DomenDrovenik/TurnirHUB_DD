# Lestvica se izračuna sproti in se ne shranjuje

## Kontekst in opis problema

Po vsakem potrjenem rezultatu se mora lestvica turnirja posodobiti (točke po pravilih turnirja, razlika v zadetkih, medsebojni izid). Ali lestvico hranimo kot ločeno entiteto v bazi ali jo računamo iz tekem?

## Obravnavane možnosti

* Izračun sproti iz potrjenih tekem (status CONFIRMED) ob vsakem zahtevku
* Shranjena tabela lestvice, ki se posodobi ob potrditvi rezultata
* Izračun sproti z vmesnim predpomnilnikom (cache)

## Rezultat odločitve

Izbrana možnost: "Izračun sproti iz potrjenih tekem", ker s tem preprečimo podvojene podatke in neskladja med rezultati in lestvico. Amaterski turnirji imajo nekaj deset tekem, zato je zmogljivost več kot dovolj, predpomnilnik pa bi dodal kompleksnost brez koristi.

### Posledice

* Dobro, ker je en vir resnice (tekme): popravek rezultata, npr. po razrešenem sporu, se samodejno odraža v lestvici.
* Dobro, ker ni dodatne tabele, migracij in kode za sinhronizacijo.
* Slabo, ker vsak zahtevek za lestvico sproži izračun, kar bi pri zelo velikih turnirjih lahko postalo počasno.
* Slabo, ker mora biti logika razvrščanja (točke, razlika v zadetkih, medsebojni izid) natančno implementirana in testirana v kodi.
