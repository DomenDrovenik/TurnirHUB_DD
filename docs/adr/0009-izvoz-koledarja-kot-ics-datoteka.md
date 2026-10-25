# Izvoz tekem v koledar kot .ics datoteka

## Kontekst in opis problema

Igralci želijo tekme svoje ekipe imeti v Google ali Apple koledarju (funkcionalnost F15). Ali ponudimo enkratni izvoz datoteke ali naročnino na iCal povezavo, ki se samodejno osvežuje?

## Obravnavane možnosti

* Enkratni izvoz `.ics` datoteke za prijavljenega uporabnika
* Naročnina na iCal povezavo z osebnim žetonom
* Brez izvoza v koledar

## Rezultat odločitve

Izbrana možnost: "Enkratni izvoz .ics datoteke", ker se datoteka generira iz obstoječih podatkov (tekme, ekipe, lokacija turnirja) in zadostuje navadna pot, zaščitena z JWT; podatkovni model in avtentikacija ostaneta nespremenjena. Naročnina bi zahtevala skrivni žeton v bazi, javno pot brez JWT in ponastavitev žetona, kar presega obseg prve različice.

### Posledice

* Dobro, ker ni novih polj ali entitet v podatkovnem modelu in ni izjeme od avtentikacije z JWT.
* Dobro, ker je implementacija preprosta (ena končna točka).
* Slabo, ker se prestavitev tekme ne pozna v koledarju, dokler uporabnik ne prenese nove datoteke.
* Slabo, ker lahko ponoven uvoz ustvari podvojene dogodke; to omilimo s stabilnim UID (`match-<id>@turnirhub`).
