
# Pregled projekta TurnirHUB

## 1. Pregled implementiranih MVP funkcionalnosti

Na podlagi pregleda dokumentacije in izvorne kode so bile identificirane naslednje implementirane MVP funkcionalnosti:

- **F1 – Registracija in prijava uporabnikov:** Registracija, prijava z JWT-avtentikacijo ter preverjanje uporabniških vlog in dovoljenj.
- **F2 – Upravljanje turnirjev:** Ustvarjanje, urejanje, objava in upravljanje statusov turnirjev.
- **F3 – Upravljanje ekip:** Ustvarjanje ekip ter dodajanje in odstranjevanje članov.
- **F4 – Prijava ekip na turnir:** Oddaja prijav, preverjanje pogojev ter odobritev oziroma zavrnitev prijav.
- **F5 – Generiranje razporedov:** Generiranje ligaških in izločilnih razporedov tekem.
- **F6 – Upravljanje rezultatov:** Vnos in potrjevanje rezultatov ter obravnava spornih rezultatov.
- **F7 – Lestvice in napredovanje:** Samodejni izračun lestvic in napredovanje zmagovalcev v izločilnem sistemu.

Pregled izvorne kode kaže, da so osrednje MVP funkcionalnosti implementirane.

## 2. Pregled uporabniških zgodb

### US-01 – Registracija in prijava uporabnikov

Implementirana sta registracija in prijava uporabnikov. Aplikacija uporablja JWT-žetone, shranjene v piškotkih. Backend preverja veljavnost žetona ter dostop glede na uporabniško vlogo.

**Ocena:** Osnovna funkcionalnost je implementirana.

### US-03 – Upravljanje ekip

Uporabniki lahko ustvarijo ekipo, njen ustvarjalec pa postane kapetan. Kapetan lahko upravlja člane ekipe, vključno z njihovim dodajanjem in odstranjevanjem.

**Ocena:** Osnovna funkcionalnost je implementirana.

### US-04 – Prijava ekip na turnir

Aplikacija omogoča prijavo ekip na turnir ter preverja prijavne roke, velikost ekipe in podvojene prijave. Organizator lahko prijave odobri ali zavrne.

**Ocena:** Osnovna funkcionalnost je implementirana.

### US-05 – Generiranje razporeda tekem

Implementirano je samodejno generiranje razporedov za ligaški in izločilni sistem tekmovanja. Algoritma podpirata različne velikosti turnirjev in posebnosti izločilnega sistema.

**Ocena:** Osnovna funkcionalnost je implementirana.

### US-07 – Lestvice in napredovanje

Aplikacija omogoča izračun lestvic na podlagi potrjenih rezultatov tekem. Pri izločilnih turnirjih podpira napredovanje zmagovalcev v naslednji krog.

**Ocena:** Osnovna funkcionalnost je implementirana.

## 3. Sklep

Na podlagi pregleda dokumentacije in izvorne kode je mogoče ugotoviti, da projekt TurnirHUB vključuje vseh sedem predvidenih MVP funkcionalnosti. Pregledanih je bilo tudi pet uporabniških zgodb, za katere so bile identificirane ustrezne implementacije.