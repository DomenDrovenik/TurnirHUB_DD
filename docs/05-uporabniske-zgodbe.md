# 05 – Uporabniške zgodbe

Vloge: **Igralec** (PLAYER), **Kapetan** (igralec, ki je ustvaril ekipo), **Organizator** (ORGANIZER), **Administrator** (ADMIN), **Obiskovalec** (neprijavljen uporabnik).

---

## US-01 – Registracija in prijava

- **Funkcionalnost:** F1 – Registracija in prijava z vlogami (MVP)
- **Uporabniška vloga:** Obiskovalec / Igralec

**Zgodba:** Kot obiskovalec se želim registrirati in prijaviti z e-pošto in geslom, da lahko dostopam do funkcij, ki so namenjene mojemu računu in vlogi.

**Acceptance criteria:**
1. Registracija zahteva veljaven e-poštni naslov, prikazno ime in geslo z vsaj 8 znaki; novemu uporabniku se dodeli vloga PLAYER.
2. Če e-pošta že obstaja, sistem zavrne registracijo s sporočilom „E-poštni naslov je že v uporabi“.
3. Ob uspešni prijavi sistem izda JWT v httpOnly piškotku, geslo pa je v bazi shranjeno le kot bcrypt zgoščena vrednost.
4. Ob napačnem geslu ali e-pošti sistem prikaže splošno napako brez razkritja, katero od obeh polj je napačno.
5. Blokiran uporabnik (`is_blocked = true`) se ne more prijaviti; sistem prikaže obvestilo o blokiranem računu.
6. Neprijavljen uporabnik, ki odpre zaščiteno pot, je preusmerjen na prijavo, uporabnik brez ustrezne vloge pa prejme napako 403.

---

## US-02 – Ustvarjanje in objava turnirja

- **Funkcionalnost:** F2 – Ustvarjanje in objava turnirja (MVP)
- **Uporabniška vloga:** Organizator

**Zgodba:** Kot organizator želim ustvariti turnir z izbranim športom, formatom in pravili ter ga objaviti, da se lahko ekipe nanj prijavijo.

**Acceptance criteria:**
1. Obrazec zahteva ime, šport, format (liga ali izločanje), lokacijo, datum začetka, rok prijav, največ ekip, najmanjše število igralcev v ekipi ter točke za zmago, remi in poraz.
2. Rok prijav mora biti pred datumom začetka, največ ekip mora biti vsaj 2; sicer sistem prikaže napako ob ustreznem polju.
3. Nov turnir se shrani v stanju DRAFT in ga vidi samo njegov organizator.
4. Ob objavi turnir preide v stanje REGISTRATION_OPEN in postane viden vsem uporabnikom.
5. Organizator lahko urejanje in preklic uporabi samo pri svojih turnirjih; poskus urejanja tujega turnirja vrne napako 403.

---

## US-03 – Ustvarjanje ekipe in upravljanje članov

- **Funkcionalnost:** F3 – Ustvarjanje ekipe in upravljanje članov (MVP)
- **Uporabniška vloga:** Igralec / Kapetan

**Zgodba:** Kot igralec želim ustvariti ekipo in vanjo dodajati soigralce, da lahko skupaj nastopamo na turnirjih.

**Acceptance criteria:**
1. Ob ustvarjanju ekipe (ime, šport) igralec samodejno postane kapetan in član ekipe.
2. Kapetan lahko doda člana z vnosom e-pošte ali uporabniškega imena; če uporabnik ne obstaja, sistem prikaže sporočilo „Uporabnik ni najden“.
3. Istega uporabnika ni mogoče dodati dvakrat v isto ekipo.
4. Kapetan lahko odstrani člana, svojega članstva pa ne more odstraniti, dokler je kapetan.
5. Člane ekipe lahko dodaja in odstranjuje samo kapetan; ostali člani te možnosti ne vidijo, API pa vrne napako 403.

---

## US-04 – Prijava ekipe na turnir

- **Funkcionalnost:** F4 – Prijava ekipe na turnir z validacijo in potrditvijo (MVP)
- **Uporabniška vloga:** Kapetan (prijava), Organizator (potrditev)

**Zgodba:** Kot kapetan želim ekipo prijaviti na turnir, kot organizator pa prijave potrditi ali zavrniti, da na turnirju nastopijo samo ekipe, ki izpolnjujejo pogoje.

**Acceptance criteria:**
1. Prijava je mogoča samo, če je turnir v stanju REGISTRATION_OPEN in rok prijav še ni potekel.
2. Sistem zavrne prijavo, če ima ekipa manj članov, kot je določeno z `min_players_per_team`, in izpiše, koliko igralcev manjka.
3. Sistem zavrne prijavo, če je kateri od članov že v drugi ekipi, prijavljeni na isti turnir.
4. Ista ekipa se ne more prijaviti dvakrat na isti turnir.
5. Uspešna prijava dobi status PENDING; organizator jo lahko potrdi (APPROVED) ali zavrne (REJECTED) in jo vidi na seznamu prijav svojega turnirja.
6. Prijavo lahko odda samo kapetan ekipe.

---

## US-05 – Samodejno generiranje razporeda

- **Funkcionalnost:** F5 – Samodejno generiranje razporeda (MVP)
- **Uporabniška vloga:** Organizator

**Zgodba:** Kot organizator želim po zaprtju prijav samodejno generirati razpored tekem, da mi ga ni treba sestavljati ročno in brez napak.

**Acceptance criteria:**
1. Generiranje je mogoče samo za turnir v stanju REGISTRATION_CLOSED in vsaj z 2 potrjenima ekipama; turnir nato preide v IN_PROGRESS.
2. Pri formatu ROUND_ROBIN vsaka ekipa igra z vsako drugo natanko enkrat, v istem kolu pa nobena ekipa ne nastopa več kot enkrat.
3. Pri formatu SINGLE_ELIMINATION se ustvari izločilno drevo; če število ekip ni potenca števila 2, dobijo najvišje postavljene ekipe prosti prehod (`away_team_id = null`).
4. Tekme v izločilnem drevesu so povezane z `next_match_id`, tako da je razvidno, kam napreduje zmagovalec.
5. Generiranje poteka v eni transakciji: ob napaki se ne shrani nobena tekma.
6. Razpored lahko generira samo organizator tega turnirja in samo enkrat.

---

## US-06 – Vnos in potrditev rezultata tekme

- **Funkcionalnost:** F6 – Vnos in potrditev rezultata tekme (MVP)
- **Uporabniška vloga:** Kapetan, Organizator

**Zgodba:** Kot kapetan želim vnesti rezultat tekme in ga mora nasprotnik potrditi, da so rezultati zanesljivi, spori pa rešljivi.

**Acceptance criteria:**
1. Rezultat lahko vnese samo kapetan ene od obeh ekip te tekme; tekma preide v stanje AWAITING_CONFIRMATION, zapiše se `reported_by_team_id`.
2. Rezultat lahko potrdi samo kapetan nasprotne ekipe (ne tisti, ki ga je vnesel); tekma preide v CONFIRMED.
3. Kapetan nasprotne ekipe lahko rezultat ospori; tekma preide v DISPUTED.
4. Pri sporni tekmi lahko organizator turnirja ročno vnese končni rezultat, tekma pa preide v CONFIRMED.
5. Rezultat mora biti nenegativno celo število za obe ekipi; neveljaven vnos sistem zavrne.
6. Pri izločilnem turnirju neodločen izid ni dovoljen.

---

## US-07 – Samodejna lestvica in napredovanje

- **Funkcionalnost:** F7 – Samodejna lestvica in napredovanje (MVP)
- **Uporabniška vloga:** Igralec / Organizator

**Zgodba:** Kot igralec želim, da se lestvica po vsakem potrjenem rezultatu samodejno osveži, da vedno vidim pravilno stanje, ne da bi kdo računal ročno.

**Acceptance criteria:**
1. Lestvica upošteva samo tekme v stanju CONFIRMED in točke po pravilih turnirja (`points_win`, `points_draw`, `points_loss`).
2. Pri enakem številu točk se ekipe razvrstijo po razliki v zadetkih, nato po medsebojnem izidu.
3. Po potrditvi rezultata je nova razvrstitev vidna ob naslednjem nalaganju strani, brez ročnega posredovanja.
4. Pri izločanju po potrditvi tekme zmagovalec samodejno zasede mesto v naslednji tekmi (`next_match_id`); ekipa s prostim prehodom napreduje brez tekme.
5. Potrditev rezultata in napredovanje tečeta v isti transakciji.
6. Ko je odigrana zadnja tekma, turnir preide v stanje FINISHED.

---

## US-08 – Pregled in iskanje turnirjev

- **Funkcionalnost:** F8 – Pregled in iskanje turnirjev
- **Uporabniška vloga:** Igralec

**Zgodba:** Kot igralec želim iskati turnirje po športu, datumu, kraju in stanju prijav, da hitro najdem turnir, na katerega se lahko prijavim.

**Acceptance criteria:**
1. Seznam prikazuje samo objavljene turnirje (ne DRAFT) z imenom, športom, krajem, datumom začetka in stanjem prijav.
2. Filtri za šport, kraj, datum in stanje prijav se lahko kombinirajo.
3. Seznam je razdeljen na strani po največ 20 turnirjev.
4. Če noben turnir ne ustreza filtrom, sistem prikaže sporočilo „Ni najdenih turnirjev“ in možnost ponastavitve filtrov.

---

## US-09 – Čakalna lista

- **Funkcionalnost:** F9 – Čakalna lista
- **Uporabniška vloga:** Kapetan, Organizator

**Zgodba:** Kot kapetan želim, da se ekipa ob polnem turnirju uvrsti na čakalno listo, da lahko nastopim, če se kakšna ekipa umakne.

**Acceptance criteria:**
1. Če je število potrjenih ekip enako `max_teams`, nova veljavna prijava dobi status WAITLISTED, kapetan pa vidi svoj položaj na listi.
2. Ob umiku ali zavrnitvi potrjene ekipe najstarejša prijava s statusom WAITLISTED samodejno postane PENDING.
3. Organizator vidi čakalno listo v vrstnem redu prijave.
4. Kapetan lahko prijavo na čakalni listi prekliče in izgubi svoj položaj.

---

## US-10 – Prestavitev in preklic tekme

- **Funkcionalnost:** F10 – Prestavitev in preklic tekme
- **Uporabniška vloga:** Organizator

**Zgodba:** Kot organizator želim prestaviti ali preklicati tekmo, da lahko reagiram na težave, ekipe pa so o tem obveščene.

**Acceptance criteria:**
1. Organizator lahko spremeni `scheduled_at` tekme v stanju SCHEDULED; nov čas ne sme biti v preteklosti.
2. Organizator lahko tekmo prekliče; tekma preide v stanje CANCELLED in se ne šteje v lestvico.
3. Po prestavitvi ali preklicu vsi člani obeh ekip prejmejo obvestilo v aplikaciji z novim časom oziroma razlogom.
4. Že potrjene tekme (CONFIRMED) ni mogoče prestaviti ali preklicati.
5. Tekmo lahko spreminja samo organizator tega turnirja.

---

## US-11 – Profil igralca in statistika

- **Funkcionalnost:** F11 – Profil igralca in statistika
- **Uporabniška vloga:** Igralec

**Zgodba:** Kot igralec želim na profilu videti svoje odigrane turnirje, zmage in poraze, da imam pregled nad svojimi rezultati.

**Acceptance criteria:**
1. Profil prikazuje prikazno ime, ekipe, katerih član je igralec, in število odigranih turnirjev.
2. Statistika zmag, remijev in porazov se izračuna iz potrjenih tekem (CONFIRMED) ekip, v katerih je igralec član.
3. Igralec lahko spremeni svoje prikazno ime; prazno ime sistem zavrne.
4. Ogled statistike ekipe je mogoč tudi na strani ekipe.

---

## US-12 – Javni prikaz turnirja

- **Funkcionalnost:** F12 – Javni prikaz turnirja
- **Uporabniška vloga:** Obiskovalec

**Zgodba:** Kot obiskovalec želim brez prijave videti lestvico, razpored in izločilno drevo turnirja, da lahko spremljam potek turnirja.

**Acceptance criteria:**
1. Stran objavljenega turnirja je dostopna brez prijave prek javne povezave.
2. Stran prikazuje lestvico (liga), razpored tekem z rezultati in stanjem ter izločilno drevo (izločanje).
3. Turnir v stanju DRAFT je za neprijavljene uporabnike nedostopen (napaka 404).
4. Javna stran ne prikazuje e-poštnih naslovov uporabnikov.
5. Stran je berljiva tudi na zaslonu mobilnega telefona.

---

## US-13 – Obvestila v aplikaciji

- **Funkcionalnost:** F13 – Obvestila v aplikaciji
- **Uporabniška vloga:** Igralec / Kapetan / Organizator

**Zgodba:** Kot uporabnik želim v aplikaciji prejemati obvestila o prijavah in tekmah, da ne zamudim pomembnih dogodkov.

**Acceptance criteria:**
1. Uporabnik prejme obvestilo ob potrditvi ali zavrnitvi prijave ekipe, ob novi tekmi, ob rezultatu za potrditev in ob sporu.
2. Neprebrana obvestila so označena, ob ikoni obvestil pa je prikazano njihovo število.
3. Uporabnik lahko obvestilo označi kot prebrano; število neprebranih se takoj zmanjša.
4. Uporabnik vidi samo svoja obvestila.

---

## US-14 – Administracija platforme

- **Funkcionalnost:** F14 – Administracija platforme
- **Uporabniška vloga:** Administrator

**Zgodba:** Kot administrator želim upravljati uporabnike in odstraniti neprimerne vsebine, da je platforma varna in urejena.

**Acceptance criteria:**
1. Administrator vidi seznam vseh uporabnikov z vlogo in stanjem računa ter ga lahko išče po e-pošti.
2. Administrator lahko uporabniku dodeli vlogo ORGANIZER ali ga blokira; blokiran uporabnik se takoj ne more več prijaviti.
3. Administrator lahko odstrani neprimeren turnir ali ekipo; odstranitev zahteva potrditev v pogovornem oknu.
4. Administratorskih poti ne more odpreti noben uporabnik z drugo vlogo (napaka 403).
5. Administrator ne more blokirati samega sebe.

---

## US-15 – Izvoz v koledar

- **Funkcionalnost:** F15 – Izvoz v koledar
- **Uporabniška vloga:** Igralec / Kapetan

**Zgodba:** Kot igralec želim tekme svoje ekipe izvoziti v .ics datoteko, da jih uvozim v Google ali Apple koledar in ne zamudim nobene tekme.

**Acceptance criteria:**
1. Prijavljen uporabnik lahko prenese .ics datoteko s tekmami vseh ekip, katerih član je.
2. Vsak dogodek vsebuje naslov „Ekipa A vs Ekipa B“, začetek (`scheduled_at`), lokacijo turnirja in stabilen UID.
3. Tekme s prostim prehodom in tekme brez določenega časa so izpuščene.
4. Datoteko se lahko uspešno uvozi v Google Calendar in Apple Calendar.
5. Neprijavljen uporabnik izvoza ne more uporabiti (napaka 401).