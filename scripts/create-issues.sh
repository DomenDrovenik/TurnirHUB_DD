#!/usr/bin/env bash
# Ustvari GitHub Issues za MVP uporabniške zgodbe (US-01 do US-07).
#
# Uporaba:
#   ./scripts/create-issues.sh uporabnik/repozitorij              # samo Issues + oznake
#   ./scripts/create-issues.sh uporabnik/repozitorij "TurnirHub"  # Issues dodani tudi v GitHub Project
#   DRY_RUN=1 ./scripts/create-issues.sh uporabnik/repozitorij    # samo izpis, nič se ne ustvari
#
# Pogoji: nameščen in prijavljen `gh` (gh auth login).
# Za dodajanje v Project je potrebna še pravica "project": gh auth refresh -s project

set -euo pipefail

REPO="${1:?Uporaba: $0 uporabnik/repozitorij [ime-projekta]}"
PROJECT="${2:-}"
DRY_RUN="${DRY_RUN:-0}"

COUNT=0

# Oznake (labels) za uporabniške zgodbe
create_label() {
  local name="$1" desc="$2"
  if [ "$DRY_RUN" = "1" ]; then
    echo "[label] $name – $desc"
  else
    gh label create "$name" --repo "$REPO" --color "0e8a16" --description "$desc" --force >/dev/null
  fi
}

# issue <US> <F> <naslov> <opis>
issue() {
  local us="$1" f="$2" title="$3" desc="$4"
  local body
  body="## Opis
${desc}

## Pripadajoča uporabniška zgodba
**${us}** (funkcionalnost ${f}). Kriteriji sprejema so v \`docs/05-uporabniske-zgodbe.md\`.

## Opravljeno, ko
- [ ] naloga je implementirana
- [ ] izpolnjuje ustrezne kriterije sprejema iz ${us}
- [ ] spremembe so v pull requestu, združenem v \`main\`"

  COUNT=$((COUNT + 1))
  if [ "$DRY_RUN" = "1" ]; then
    echo "[issue $COUNT] [$us] $title"
    return
  fi

  local args=(--repo "$REPO" --title "[$us] $title" --body "$body" --label "$us")
  if [ -n "$PROJECT" ]; then
    args+=(--project "$PROJECT")
  fi
  gh issue create "${args[@]}"
}

# ---------- Oznake ----------
create_label "US-01" "Registracija in prijava z vlogami"
create_label "US-02" "Ustvarjanje in objava turnirja"
create_label "US-03" "Ustvarjanje ekipe in upravljanje članov"
create_label "US-04" "Prijava ekipe na turnir"
create_label "US-05" "Samodejno generiranje razporeda"
create_label "US-06" "Vnos in potrditev rezultata tekme"
create_label "US-07" "Samodejna lestvica in napredovanje"

# ---------- US-01: Registracija in prijava (F1) ----------
issue US-01 F1 "Podatkovni model User in prva migracija" \
  "Dodaj model User v Prisma shemo (email, password_hash, display_name, role, is_blocked, created_at) in ustvari prvo migracijo."
issue US-01 F1 "API za registracijo" \
  "Končna točka POST /api/auth/register z validacijo e-pošte in gesla (vsaj 8 znakov), zavrnitvijo podvojene e-pošte in shranjevanjem gesla z bcrypt. Nov uporabnik dobi vlogo PLAYER."
issue US-01 F1 "API za prijavo z JWT v httpOnly piškotku" \
  "Končna točka POST /api/auth/login: preveri geslo, zavrne blokirane uporabnike, izda JWT v httpOnly piškotku. Napaka ob napačnih podatkih ne razkrije, katero polje je napačno."
issue US-01 F1 "Middleware za preverjanje JWT in vlog" \
  "Express middleware, ki preveri veljavnost žetona in vlogo (PLAYER / ORGANIZER / ADMIN). Neprijavljen uporabnik dobi 401, uporabnik brez ustrezne vloge pa 403."
issue US-01 F1 "Frontend: strani za registracijo in prijavo" \
  "React strani z obrazcema za registracijo in prijavo, prikaz napak iz API-ja in preusmeritev po uspešni prijavi."
issue US-01 F1 "Frontend: zaščitene poti glede na vlogo" \
  "Zaščitene poti v Reactu: neprijavljen uporabnik je preusmerjen na prijavo, navigacija prikazuje samo povezave, ki jih vloga dovoljuje."

# ---------- US-02: Ustvarjanje in objava turnirja (F2) ----------
issue US-02 F2 "Podatkovni model Tournament in migracija" \
  "Dodaj model Tournament (organizator, ime, šport, format, lokacija, datum začetka, rok prijav, max_teams, min_players_per_team, točkovanje, status) in migracijo."
issue US-02 F2 "API za ustvarjanje in urejanje turnirja" \
  "POST in PUT /api/tournaments z validacijo (rok prijav pred začetkom, vsaj 2 ekipi). Dovoljeno samo vlogi ORGANIZER in samo za lastne turnirje; nov turnir je v stanju DRAFT."
issue US-02 F2 "API za objavo turnirja in prehode stanj" \
  "Objava turnirja (DRAFT → REGISTRATION_OPEN) in preverjanje dovoljenih prehodov stanj življenjskega cikla na strežniku."
issue US-02 F2 "Frontend: obrazec za ustvarjanje turnirja" \
  "Obrazec z vsemi polji turnirja, validacijo na odjemalcu in prikazom napak iz API-ja."
issue US-02 F2 "Frontend: pregled in objava lastnih turnirjev" \
  "Stran organizatorja s seznamom lastnih turnirjev, njihovim stanjem in gumbom za objavo."

# ---------- US-03: Ekipe in člani (F3) ----------
issue US-03 F3 "Podatkovna modela Team in TeamMember" \
  "Dodaj modela Team in TeamMember (sestavljen primarni ključ team_id + user_id) in migracijo."
issue US-03 F3 "API za ustvarjanje ekipe" \
  "POST /api/teams: igralec ustvari ekipo in samodejno postane kapetan ter član."
issue US-03 F3 "API za dodajanje in odstranjevanje članov" \
  "Dodajanje člana po e-pošti ali uporabniškem imenu, preprečitev podvojenega člana, odstranjevanje člana. Dovoljeno samo kapetanu; kapetan ne more odstraniti sebe."
issue US-03 F3 "Frontend: ustvarjanje ekipe in upravljanje članov" \
  "Strani za ustvarjanje ekipe, prikaz članov in dodajanje/odstranjevanje članov (možnosti vidne samo kapetanu)."

# ---------- US-04: Prijava ekipe na turnir (F4) ----------
issue US-04 F4 "Podatkovni model Registration in migracija" \
  "Dodaj model Registration (turnir, ekipa, status PENDING / APPROVED / REJECTED / WAITLISTED) z omejitvijo UNIQUE (tournament_id, team_id)."
issue US-04 F4 "API za prijavo ekipe z validacijo" \
  "POST /api/tournaments/:id/registrations: preveri stanje turnirja, rok prijav, prosta mesta, minimalno število igralcev in da noben igralec ni hkrati v dveh ekipah istega turnirja. Prijavo odda samo kapetan."
issue US-04 F4 "API za potrditev ali zavrnitev prijave" \
  "Organizator turnirja potrdi (APPROVED) ali zavrne (REJECTED) prijavo. Preverjanje lastništva turnirja in števila potrjenih ekip v transakciji."
issue US-04 F4 "Frontend: prijava ekipe na turnir" \
  "Gumb in obrazec za prijavo ekipe na turnir, prikaz razlogov zavrnitve (npr. premalo igralcev)."
issue US-04 F4 "Frontend: seznam prijav za organizatorja" \
  "Pregled prijav na turnir z gumboma Potrdi in Zavrni."

# ---------- US-05: Generiranje razporeda (F5) ----------
issue US-05 F5 "Podatkovni model Match in migracija" \
  "Dodaj model Match (turnir, krog, domača in gostujoča ekipa, čas, rezultat, status, reported_by_team_id, next_match_id) in migracijo."
issue US-05 F5 "Algoritem krožnega sistema (circle method)" \
  "Funkcija, ki za podan seznam ekip vrne razpored, v katerem vsaka ekipa igra z vsako drugo natanko enkrat in nobena ne igra dvakrat v istem kolu. Vključi enotne teste za sodo in liho število ekip."
issue US-05 F5 "Algoritem izločilnega drevesa s prostimi prehodi" \
  "Funkcija, ki ustvari izločilno drevo; pri številu ekip, ki ni potenca števila 2, dodeli proste prehode (bye) in poveže tekme z next_match_id. Vključi enotne teste."
issue US-05 F5 "API za generiranje razporeda v transakciji" \
  "POST /api/tournaments/:id/schedule: samo organizator, samo za turnir v stanju REGISTRATION_CLOSED z vsaj 2 potrjenima ekipama. Vse tekme se shranijo v eni transakciji, turnir preide v IN_PROGRESS, ponovno generiranje ni dovoljeno."
issue US-05 F5 "Frontend: sprožitev in prikaz razporeda" \
  "Gumb za generiranje razporeda (organizator) in prikaz tekem po kolih."

# ---------- US-06: Vnos in potrditev rezultata (F6) ----------
issue US-06 F6 "API za vnos rezultata" \
  "POST /api/matches/:id/result: rezultat vnese samo kapetan ene od obeh ekip, vrednosti so nenegativna cela števila, tekma preide v AWAITING_CONFIRMATION in zapiše se reported_by_team_id."
issue US-06 F6 "API za potrditev ali oporekanje rezultatu" \
  "POST /api/matches/:id/confirm in /dispute: odgovori lahko samo kapetan nasprotne ekipe. Potrditev nastavi CONFIRMED, oporekanje pa DISPUTED."
issue US-06 F6 "API za razrešitev spora (organizator)" \
  "Organizator turnirja lahko pri tekmi v stanju DISPUTED ročno določi končni rezultat. Pri izločanju neodločen izid ni dovoljen."
issue US-06 F6 "Frontend: stran tekme z vnosom in potrditvijo" \
  "Stran tekme z obrazcem za vnos rezultata, gumboma Potrdi/Ospori za nasprotnega kapetana in območjem za organizatorja pri sporni tekmi."

# ---------- US-07: Lestvica in napredovanje (F7) ----------
issue US-07 F7 "Servis za izračun lestvice" \
  "Izračun lestvice iz potrjenih tekem (status CONFIRMED) po pravilih turnirja (points_win, points_draw, points_loss) z razvrščanjem po točkah, razliki v zadetkih in medsebojnem izidu."
issue US-07 F7 "Enotni testi razvrščanja lestvice" \
  "Testi za izračun točk in vse tri stopnje razvrščanja, vključno z enakim številom točk in medsebojnim izidom."
issue US-07 F7 "API za lestvico" \
  "GET /api/tournaments/:id/standings vrne trenutno lestvico, izračunano sproti."
issue US-07 F7 "Napredovanje zmagovalca v izločilnem drevesu" \
  "Po potrditvi rezultata se zmagovalec v isti transakciji vpiše v naslednjo tekmo (next_match_id); ekipa s prostim prehodom napreduje brez tekme. Po zadnji tekmi turnir preide v FINISHED."
issue US-07 F7 "Frontend: prikaz lestvice" \
  "Tabela lestvice (mesto, ekipa, odigrane tekme, zmage, remiji, porazi, razlika, točke) na strani turnirja."

echo
if [ "$DRY_RUN" = "1" ]; then
  echo "Suhi zagon: ustvarilo bi se $COUNT Issue-jev."
else
  echo "Ustvarjenih Issue-jev: $COUNT"
fi
