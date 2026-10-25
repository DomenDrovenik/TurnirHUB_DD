# Avtentikacija z JWT v httpOnly piškotku in bcrypt

## Kontekst in opis problema

Aplikacija ima tri vloge (PLAYER, ORGANIZER, ADMIN) in mora zaščititi poti glede na vlogo in lastništvo (npr. samo organizator turnirja potrjuje prijave nanj). Kako izvesti prijavo, shranjevanje gesel in prenos identitete med frontendom in backendom?

## Obravnavane možnosti

* JWT v httpOnly piškotku, gesla zgoščena z bcrypt
* JWT v localStorage, ki ga frontend pošilja v glavi Authorization
* Seje na strežniku (session ID v piškotku, seje v bazi ali Redisu)

## Rezultat odločitve

Izbrana možnost: "JWT v httpOnly piškotku in gesla z bcrypt", ker JavaScript v brskalniku piškotka z oznako httpOnly ne more prebrati, kar zmanjša tveganje kraje žetona ob napadu XSS, strežnik pa ne potrebuje shrambe sej. JWT v localStorage je izpostavljen XSS, seje na strežniku pa zahtevajo dodatno infrastrukturo.

### Posledice

* Dobro, ker ni dodatne infrastrukture (npr. Redis) in je žeton nedostopen skripti v brskalniku.
* Dobro, ker bcrypt s „soljo" otežuje ugibanje gesel ob uhajanju baze.
* Slabo, ker piškotki zahtevajo pravilno nastavitev CORS, `SameSite` in `Secure` ter zaščito pred CSRF.
* Slabo, ker je JWT težje takoj razveljaviti (npr. ob blokadi uporabnika); zato backend preverja tudi `is_blocked` in uporablja kratko veljavnost žetona.
