# Ločen React frontend in REST API backend

## Kontekst in opis problema

Aplikacija ima bogat uporabniški vmesnik (filtri, lestvice, razporedi, izločilno drevo) in zahtevno poslovno logiko (validacija prijav, generiranje razporeda, potrjevanje rezultatov, preverjanje pravic po vlogah). Kako razdeliti odgovornosti med prikaz in strežnik?

## Obravnavane možnosti

* Ločen React frontend (Vite) in Node.js/Express REST API
* Monolitna aplikacija z izrisom na strežniku (npr. Next.js ali Express s predlogami)
* GraphQL API namesto REST

## Rezultat odločitve

Izbrana možnost: "Ločen React frontend in Express REST API (JSON prek HTTPS)", ker jasno loči odgovornosti: frontend skrbi za prikaz, backend za pravila in varnost, ki jih odjemalec ne more obiti. Monolit bi mešal vmesnik in logiko, GraphQL pa je za približno deset končnih točk nepotrebna kompleksnost.

### Posledice

* Dobro, ker je poslovna logika na enem mestu in jo je mogoče testirati neodvisno od vmesnika.
* Dobro, ker lahko isti API pozneje uporabi mobilna aplikacija (kasnejša nadgradnja iz dokumenta 02).
* Slabo, ker sta dva projekta za vzdrževanje.
* Slabo, ker je potrebna konfiguracija CORS in piškotkov med frontendom in backendom.
