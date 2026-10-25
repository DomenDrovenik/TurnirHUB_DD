# 01 – Zasnova rešitve

## Ime rešitve

**TurnirHub** – spletna platforma za organizacijo amaterskih športnih turnirjev.

## Namen rešitve in problem

Amaterske turnirje (košarka, nogomet, odbojka, mali nogomet, šah) danes organizatorji običajno vodijo prek skupin na družbenih omrežjih, sporočil in Excelovih tabel. Pri tem se pojavijo ponavljajoči se problemi:

- prijave ekip so razpršene po sporočilih, organizator težko spremlja, kdo je prijavljen in kdo ne,
- razpored tekem se sestavlja ročno, kar je počasno in nagnjeno k napakam (ekipa igra dvakrat zapored, napačni pari),
- rezultati se zbirajo po sporočilih in se jih včasih ne da preveriti, lestvico je treba ročno preračunavati,
- igralci in ekipe nimajo enega mesta, kjer bi videli razpored, rezultate in stanje na lestvici.

**TurnirHub** ta problem rešuje tako, da na enem mestu omogoča objavo turnirja, prijavo in potrditev ekip, samodejno generiranje razporeda, vnos in potrjevanje rezultatov ter samodejni izračun lestvice.

## Ciljni uporabniki

- **Organizatorji turnirjev** – športna društva, šolski in študentski športni klubi, fitnes centri in rekreativne skupine, ki enkrat ali večkrat letno pripravijo turnir.
- **Igralci in kapetani ekip** – rekreativni športniki, ki iščejo turnirje in se želijo prijaviti s svojo ekipo.
- **Administratorji platforme** – skrbijo za moderiranje uporabnikov in vsebin.

## Kratek opis delovanja

1. Organizator ustvari turnir (šport, format – liga ali izločanje, rok prijav, največ ekip, pravila točkovanja) in ga objavi.
2. Igralec ustvari ekipo, vanjo doda soigralce in jo kot kapetan prijavi na turnir. Sistem preveri pogoje (rok prijav, prosta mesta, minimalno število igralcev).
3. Organizator prijave potrdi ali zavrne. Če so mesta polna, ekipa pristane na čakalni listi.
4. Ko so prijave zaprte, sistem samodejno generira razpored tekem (vsak z vsakim ali izločilni boji).
5. Po tekmi kapetan ene ekipe vnese rezultat, kapetan nasprotne ekipe ga potrdi (v primeru težavrazreši organizator).
6. Po potrjenem rezultatu se lestvica (oz. izločilno drevo) osveži samodejno.

## Primer uporabe

Društvo za mali nogomet v Mariboru želi organizirati turnir za 8 ekip. Organizator objavi turnir, kapetani ekip se prijavijo prek spletne strani, organizator potrdi prijave, sistem ustvari razpored in po vsaki odigrani tekmi se lestvica sama posodobi. Vsi udeleženci ves čas vidijo aktualno stanje na eni strani.
