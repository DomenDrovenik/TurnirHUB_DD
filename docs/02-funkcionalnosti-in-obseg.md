# 02 – Funkcionalnosti in obseg

## Uporabniške vloge

### 1. Igralec (PLAYER)

**Lahko:**
- se registrira, prijavi in ureja svoj profil,
- išče in pregleda javne turnirje, razporede, rezultate in lestvice,
- ustvari ekipo (s tem postane njen kapitan) in vanjo vabi igralce,
- kot kapetan prijavi svojo ekipo na turnir,
- kot kapetan vnese rezultat tekme svoje ekipe oziroma potrdi rezultat nasprotnika.

**Ne more:**
- ustvarjati ali urejati turnirjev,
- potrjevati prijav ekip,
- spreminjati rezultatov tujih ekip ali razreševati sporov,
- upravljati drugih uporabnikov.

### 2. Organizator (ORGANIZER)

**Lahko:**
- vse, kar lahko igralec,
- ustvari, uredi, objavi in prekliče **svoje** turnirje,
- potrdi ali zavrne prijave ekip, upravlja čakalno listo,
- zapre prijave in sproži generiranje razporeda,
- razreši sporne rezultate in ročno popravi rezultat,
- prestavi ali prekliče tekmo.

**Ne more:**
- urejati turnirjev drugih organizatorjev,
- blokirati uporabnikov ali brisati tujih vsebin na ravni platforme.

### 3. Administrator (ADMIN)

**Lahko:**
- pregleduje in upravlja vse uporabnike (dodelitev vloge organizatorja, blokada računa),
- pregleduje in odstrani neprimerne turnirje in ekipe,
- vpogled v vse podatke platforme.

**Ne more:**
- sodelovati kot igralec v tekmi ali vnašati rezultatov v imenu ekip (razen z izrecno odločitvijo v sporu),
- spreminjati pravil točkovanja že začetih turnirjev.

## Predvidene funkcionalnosti

Oznaka **MVP** = ključna za prvo delujočo različico. Oznaka **[D]** = domensko specifična funkcionalnost.

| # | Funkcionalnost | Opis | MVP |
|---|---|---|---|
| F1 | Registracija in prijava z vlogami | Registracija z e-pošto in geslom, prijava, vloge PLAYER / ORGANIZER / ADMIN, zaščita poti glede na vlogo. | **MVP** |
| F2 | Ustvarjanje in objava turnirja **[D]** | Organizator določi šport, format (liga / izločanje), rok prijav, največ ekip, najmanjše število igralcev v ekipi, točkovanje (zmaga/remi/poraz). Turnir ima življenjski cikel: osnutek → odprte prijave → zaprte prijave → v teku → zaključen. | **MVP** |
| F3 | Ustvarjanje ekipe in upravljanje članov | Igralec ustvari ekipo in postane kapetan, dodaja ali odstranjuje člane (po e-pošti ali uporabniškem imenu). | **MVP** |
| F4 | Prijava ekipe na turnir z validacijo in potrditvijo **[D]** | Sistem preveri rok prijav, prosta mesta, minimalno število igralcev in da igralec ni hkrati v dveh ekipah istega turnirja. Organizator prijavo potrdi ali zavrne. | **MVP** |
| F5 | Samodejno generiranje razporeda **[D]** | Ob zaprtju prijav sistem za potrjene ekipe generira razpored: krožni sistem (vsak z vsakim, algoritem „circle method") ali izločilno drevo s prostimi prehodi (bye), če število ekip ni potenca števila 2. | **MVP** |
| F6 | Vnos in potrditev rezultata tekme **[D]** | Kapetan ene ekipe vnese rezultat, kapetan druge ga potrdi. Če ga ospori, tekma preide v stanje „sporno" in odloči organizator. | **MVP** |
| F7 | Samodejna lestvica in napredovanje **[D]** | Po potrjenem rezultatu se samodejno preračunajo točke po pravilih turnirja (z razlikovanjem po razliki v zadetkih in medsebojnem izidu). Pri izločanju zmagovalec samodejno napreduje v naslednji krog. | **MVP** |
| F8 | Pregled in iskanje turnirjev | Seznam javnih turnirjev s filtri po športu, datumu, kraju in stanju prijav. | |
| F9 | Čakalna lista | Ko je turnir poln, se nove ekipe uvrstijo na čakalno listo; ob umiku ekipe prva na listi samodejno napreduje. | |
| F10 | Prestavitev in preklic tekme | Organizator prestavi ali prekliče tekmo; prizadete ekipe dobijo obvestilo. | |
| F11 | Profil igralca in statistika | Pregled odigranih turnirjev, zmag in porazov posameznega igralca oz. ekipe. | |
| F12 | Javni prikaz turnirja | Javna stran turnirja z lestvico, razporedom in izločilnim drevesom, dostopna brez prijave. | |
| F13 | Obvestila v aplikaciji | Obvestila o potrditvi prijave, novi tekmi, rezultatu za potrditev ali sporu. | |
| F14 | Administracija platforme | Upravljanje uporabnikov (vloge, blokada), odstranitev neprimernih turnirjev in ekip. | |
| F15 | Izvoz v koledar | Igralec ali kapetan lahko tekme svoje ekipe izvozi kot iCal (.ics) datoteko | |

**Skupaj: 15 funkcionalnosti, od tega 7 MVP** (F1–F7). Domensko specifične funkcionalnosti znotraj MVP: F2, F4, F5, F6, F7 (zahtevano je vsaj 3).

## Kasnejše nadgradnje

1. **Rezultati v živo** – prikaz rezultatov v realnem času prek WebSocketov.
2. **ELO lestvica** – sistem ocenjevanja moči ekip in igralcev skozi več turnirjev.
3. **Mobilna aplikacija** – namestljiva aplikacija s potisnimi obvestili.

## Out of scope

Naslednjih stvari v tem projektu **ne bomo** implementirali:

- prenos tekem v živo (video streaming) in snemanje posnetkov,
- sodniški sistem (dodeljevanje sodnikov, sodniška poročila),
- rezervacija in upravljanje prizorišč (igrišč, dvoran),
- stavnice, napovedi in kakršnakoli denarna igra,
- klepet med uporabniki in družabno omrežje (komentarji, sledilci).
