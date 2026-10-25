# Docker Compose za lokalni razvoj in zagon

## Kontekst in opis problema

Projekt sestavljajo trije deli (PostgreSQL, backend, frontend). Vsak član ekipe in ocenjevalec mora imeti možnost zagnati celotno okolje brez ročne namestitve baze in usklajevanja verzij orodij.

## Obravnavane možnosti

* Docker Compose (storitve `db`, `api`, `web`)
* Ročna namestitev PostgreSQL, Node.js in zagon vsakega dela posebej
* Samo baza v Dockerju, backend in frontend lokalno

## Rezultat odločitve

Izbrana možnost: "Docker Compose", ker en ukaz (`docker compose up --build`) zažene celotno okolje z enakimi verzijami na vseh računalnikih. Ročna namestitev je zamudna in nagnjena k razlikam med računalniki, zagon samo baze v Dockerju pa ne zagotavlja enotnega okolja za Node.js.

### Posledice

* Dobro, ker je okolje ponovljivo in ni težav tipa „pri meni dela".
* Dobro, ker nova oseba lahko zažene projekt brez namestitve PostgreSQL.
* Slabo, ker zahteva nameščen Docker.
* Slabo, ker je potrebno dodatno vzdrževanje Dockerfile datotek.
