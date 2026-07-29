# NBN Regressietesten – Playwright

Geautomatiseerde regressietests voor het NBN QA-platform, gebouwd met Playwright.
Dit document is bedoeld als overdrachtsdocumentatie: alles wat nodig is om de
tests te begrijpen, uit te voeren, uit te breiden, en de bekende beperkingen
te kennen.

---

## 1. Setup

### Vereisten
- GitHub Codespaces (of lokale Node.js-omgeving met Playwright)
- Een `.env`-bestand in de root van het project met:

```env
NBN_QA_EMAIL=jouw.testaccount@nbn.be
NBN_QA_PASSWORD=HetWachtwoord
```
### Lokale Node.js-omgeving als alternatief voor Codespaces

Naast GitHub Codespaces kan dit project ook volledig lokaal draaien, op je eigen computer, zonder GitHub 
of een cloud-omgeving nodig te hebben. Vereisten: Node.js (versie 18 of hoger) en npm geïnstalleerd op je machine.

Verschillen met Codespaces:

Geen browser-gebaseerde VS Code nodig — je gebruikt gewoon je eigen editor en terminal
Geen VNC/Xvfb-omweg nodig voor Codegen: npx playwright codegen <url> opent gewoon een echt browservenster op je scherm, rechtstreeks
Geen Codespaces-verbruik/kosten (zie sectie 1) — alles draait op je eigen hardware
.env blijft exact hetzelfde principe: een lokaal bestand, nooit gecommit

Setup:

bash
git clone <repository-url>
cd nbn-regression-demo
npm install
npx playwright install   # installeert de browser-binaries lokaal

Daarna werkt alles identiek aan de Codespaces-instructies in dit document (.env aanmaken, npx playwright test ... draaien).
> ⚠️ Zie sectie 6 ("Bekende beperkingen") voor belangrijke kanttekeningen
> over het testaccount — sommige tests "verbruiken" permanent data van dit
> account (echte aankopen, taalversies).

### Installatie
```bash
npm install
```

> 💡 **Codespaces-verbruik**: een gratis GitHub-account krijgt 120 core
> hours/maand (≈60 uur runtime op een 2-core Codespace). Sluit je Codespace
> altijd expliciet af (niet enkel het browsertabblad) wanneer je klaar bent,
> anders blijft de runtime doortikken. Check je verbruik via
> [github.com/settings/billing](https://github.com/settings/billing).

### Voor collega's: hoe dit project overnemen/meewerken

**Belangrijk:** GitHub Codespaces zijn persoonlijk gekoppeld aan een
GitHub-account. Een collega kan **niet** in Jan's Codespace inloggen of die
"overnemen" — iedereen werkt in zijn **eigen** Codespace, op **dezelfde**
repository. Dat werkt zo:

```
        NBN GitHub Repository
                │
      ┌─────────┴─────────┐
      │                    │
 Jan's Codespace      Yvan's Codespace
 (eigen VM,           (eigen VM,
  terminal, browser)   terminal, browser)
```

Iedereen krijgt een eigen virtuele omgeving, maar werkt op dezelfde code
(tests, helpers, `playwright.config.ts`, ...) via git. Er hoeft dus
**niets apart gedownload of overgezet te worden** — alle testbestanden,
helpers en de Playwright-configuratie zitten gewoon in deze repository.
Wie een nieuwe Codespace opent op deze repo, krijgt automatisch dezelfde
mapstructuur (`tests/`, `helpers/`, `playwright.config.ts`) mee.

**Het enige dat NIET automatisch meekomt: `.env`.** Dat bestand staat
bewust in `.gitignore` (bevat wachtwoorden), dus elke persoon maakt **zelf**
een eigen `.env` aan met een eigen testaccount (zie sectie hierboven).

**Stappen voor een collega om dit project te draaien:**
1. Repository openen op GitHub
2. **Code → Codespaces → Create codespace on main**
3. `npm install`
4. Eigen `.env`-bestand aanmaken met een testaccount
5. `npx playwright test` — klaar

Als je wil dat een collega **exact** jouw huidige staat overneemt (bv. na
een fix), moet je je wijzigingen eerst `commit`en en `push`en naar de
repository — pas dan kan die persoon een nieuwe Codespace starten op die
commit en (op `.env` na) dezelfde omgeving krijgen.

### Tests draaien
Eén test:
```bash
npx playwright test tests/RT-LOGIN-001.spec.ts --project=chromium
```

Meerdere tests, na elkaar (aangeraden bij tests die hetzelfde account/mandje
delen, om onderlinge beïnvloeding te vermijden):
```bash
npx playwright test tests/RT-CART-001.spec.ts tests/RT-CART-002.spec.ts --project=chromium --workers=1
```

Met zichtbare browser (handig om mee te kijken of te debuggen):
```bash
npx playwright test tests/RT-LOGIN-001.spec.ts --project=chromium --headed
```

HTML-rapport bekijken na een run:
```bash
npx playwright show-report
```

---

## 2. Projectstructuur

```
tests/
  RT-LOGIN-*.spec.ts   Login, logout, lockout
  RT-REG-*.spec.ts     Registratie, e-mailverificatie
  RT-CART-*.spec.ts    Winkelmandje
  RT-CHK-*.spec.ts     Checkout / betaling
  RT-STD-*.spec.ts     Normen openen/downloaden
  RT-ORD-*.spec.ts     Orderhistoriek
  RT-PWD-*.spec.ts     Wachtwoord reset

helpers/
  login.ts             Centrale login-helper
  cart.ts               Winkelmandje leegmaken vóór een test
  standardPicker.ts     Automatisch een nog-koopbare norm/taal kiezen
  ownedStandard.ts      Automatisch een reeds-bezeten norm/taal kiezen
  humanInput.ts          Terminal-pauze voor manuele verificatiecode-invoer
  emailVerification.ts   Graph API-aanpak voor automatische mailbox-toegang
                         (nog niet actief, wacht op IT-toegang — zie sectie 6)
  testData.ts            Unieke testdata-generatie (e-mailadressen, wachtwoorden)
```

---

## 3. Helpers – wat ze doen en waarom

### `helpers/login.ts`
Centrale login-functie, gebruikt door zo goed als elke test.
```typescript
await login(page, process.env.NBN_QA_EMAIL!, process.env.NBN_QA_PASSWORD!);
```
Handelt de cookiebanner af, vult in, en wacht op een betrouwbaar signaal
(redirect naar `/frontend/home`) i.p.v. de tragere/onbetrouwbare `networkidle`.

### `helpers/cart.ts` – `ensureCartIsEmpty(page)`
Maakt het winkelmandje leeg vóór een cart- of checkout-test start. Nodig
omdat tests anders afhankelijk worden van wat een vorige testrun heeft
achtergelaten (zie sectie 6, "state-lekken tussen tests").

### `helpers/standardPicker.ts` – `addFirstAvailableStandardToCart(page, searchTerm)`
Zoekt op een brede term en kiest automatisch de eerste **nog-koopbare**
norm/taal, in plaats van een specifieke norm te hardcoden. Gebruikt in alle
CHK-tests. Sluit bewust "NBN EN 1090-3" uit (gereserveerd voor de CART-tests,
zie sectie 6).

### `helpers/ownedStandard.ts`
Twee functies, voor tests die een **al bezeten** norm nodig hebben (STD-tests):
- `getFirstOwnedStandardTitle(page)` — haalt de titel van de eerste eigen norm
  op via de "My Standards"-widget op de homepage
- `clickOwnedLanguageVersion(page)` — klikt op een reeds-bezeten taalversie.
  Onderscheidt "open"-links van "koop"-knoppen **positioneel** (verticale
  locatie t.o.v. de sectiekopjes), niet enkel op naam — want koopknoppen
  tonen niet altijd een prijs in hun naam (zie sectie 6).

### `helpers/humanInput.ts` – `askForVerificationCode()`
Pauzeert de test en vraagt de tester de verificatiecode manueel in de
terminal in te typen. Tijdelijke oplossing zolang er geen geautomatiseerde
mailbox-toegang is. **Werkt enkel interactief**, niet in CI/onbemand.

### `helpers/emailVerification.ts`
Klaar-gezette Graph API-integratie om verificatiecodes automatisch op te
halen uit de testmailbox. **Nog niet in gebruik** — vereist een app-registratie
in Microsoft Entra ID met `Mail.Read`-rechten (aangevraagd bij IT, zie sectie 6).

### `helpers/testData.ts`
Genereert unieke testdata voor registratietests (bv. `jan.de.wit+AI{n}@nbn.be`).

---

## 4. Volledig testoverzicht

### ✅ Volledig werkend (23)

| Test | Omschrijving |
|---|---|
| RT-LOGIN-001 | Succesvolle login |
| RT-LOGIN-002 | Login met verkeerd wachtwoord |
| RT-LOGIN-003 | Login met niet-bestaand e-mailadres |
| RT-LOGIN-004 | Logout |
| RT-REG-002 | Registratie: ongeldige verificatiecode |
| RT-REG-003 | Registratie: verlopen verificatiecode (simulatie via oude code) |
| RT-CART-001 t/m 004 | Winkelmandje: toevoegen, bekijken, verwijderen |
| RT-CHK-001 | Checkout zonder PO-nummer |
| RT-CHK-002 | Checkout met PO-nummer |
| RT-CHK-003 | Checkout via online betaling |
| RT-CHK-004 | Checkout via Pay Later/Invoice |
| RT-CHK-007 | Orderbevestiging na checkout |
| RT-STD-001 t/m 004 | Norm openen (Home/zoekresultaten/detail) + downloaden |
| RT-ORD-002 | Factuur-download beschikbaarheid |
| RT-PWD-001 | Wachtwoord reset aanvragen |
| RT-PWD-003 | Wachtwoord reset: ongeldige code |

### 🔶 Klaar, vereist handmatige input (niet CI-geschikt)

| Test | Vereist |
|---|---|
| RT-REG-001 | Manuele invoer van een echte verificatiecode via terminal-pauze |

### ⏳ Geblokkeerd — vereist extra setup

| Test(s) | Blocker |
|---|---|
| RT-LOGIN-005, 006 | Apart testaccount nodig (voor lockout, zonder het hoofdaccount te vergrendelen) + weten hoe lang/hoe een lockout opheft |
| RT-LOGIN-007 | Apart testaccount nodig (om de teller-reset te testen zonder interferentie) |
| RT-CHK-005, 006 | Testaccount met een actieve **kredietlijn** nodig |
| RT-PWD-002, 005, 006 | Vereisen een geldige reset-code (human-input mogelijk, analoog aan REG-001) |
| RT-PWD-004 | Overgeslagen: "verlopen code" niet zinvol te onderscheiden van "foute code" zonder echt te wachten (zie REG-003-discussie) |
| RT-REG-004 t/m 009 | Registratieformulier (bedrijfskoppeling) + Company Administrator-rol nodig |
| RT-TEAM-001 t/m 007 | Company Administrator-rol nodig; TEAM-002 vereist bovendien een SSO-geconfigureerd bedrijf |
| RT-REQ-001 t/m 017 | Company Administrator-rol + toegang tot het NBN **back office** (apart systeem) |
| RT-RR-001 t/m 003 | Bedrijf met actieve "Reading Room"-service nodig |
| RT-PUR-001, 002 | "Approved User"-rol nodig (hebben enkel Portal User) |
| RT-ORD-001 | 3 aparte accounts nodig (Company Admin, Approved User, Portal User) |
| RT-COL-001 t/m 005 | Nog te bevestigen of het testaccount aan een bedrijf met actief abonnement gekoppeld is |

### ❌ Niet haalbaar met Playwright

| Test(s) | Waarom |
|---|---|
| RT-ASTM-001 t/m 006 | Draaien in externe desktop PDF-lezers (Adobe Reader DC, Acrobat DC, PDF-XChange) met DRM-bescherming — buiten het bereik van browserautomatisering. Zou een apart tool vereisen (bv. desktop-UI-automatisering). |

---

---

## 5. Individuele testcommando's (copy-paste)

Handig voor wie niet vertrouwd is met Playwright-commando's: kopieer gewoon
de regel voor de test die je wil draaien.

**Login**
```bash
npx playwright test tests/RT-LOGIN-001.spec.ts --project=chromium
npx playwright test tests/RT-LOGIN-002.spec.ts --project=chromium
npx playwright test tests/RT-LOGIN-003.spec.ts --project=chromium
npx playwright test tests/RT-LOGIN-004.spec.ts --project=chromium
```

**Registratie**
```bash
npx playwright test tests/RT-REG-002.spec.ts --project=chromium
npx playwright test tests/RT-REG-003.spec.ts --project=chromium
npx playwright test tests/RT-REG-001.spec.ts --project=chromium --headed   # human-input, zie sectie 3
```

**Winkelmandje**
```bash
npx playwright test tests/RT-CART-001.spec.ts --project=chromium
npx playwright test tests/RT-CART-002.spec.ts --project=chromium
npx playwright test tests/RT-CART-003.spec.ts --project=chromium
npx playwright test tests/RT-CART-004.spec.ts --project=chromium
```

**Checkout** (⚠️ elke test hier is een échte aankoop, zie sectie 6)
```bash
npx playwright test tests/RT-CHK-001.spec.ts --project=chromium
npx playwright test tests/RT-CHK-002.spec.ts --project=chromium
npx playwright test tests/RT-CHK-003.spec.ts --project=chromium
npx playwright test tests/RT-CHK-004.spec.ts --project=chromium
npx playwright test tests/RT-CHK-007.spec.ts --project=chromium
```

**Normen openen/downloaden**
```bash
npx playwright test tests/RT-STD-001.spec.ts --project=chromium
npx playwright test tests/RT-STD-002.spec.ts --project=chromium
npx playwright test tests/RT-STD-003.spec.ts --project=chromium
npx playwright test tests/RT-STD-004.spec.ts --project=chromium
```

**Orderhistoriek & wachtwoord**
```bash
npx playwright test tests/RT-ORD-002.spec.ts --project=chromium
npx playwright test tests/RT-PWD-001.spec.ts --project=chromium
npx playwright test tests/RT-PWD-003.spec.ts --project=chromium
```

**Alles tegelijk draaien**
```bash
npx playwright test --project=chromium --workers=1
```

**Laatste HTML-rapport bekijken**
```bash
npx playwright show-report
```

---

## 6. Codegen-workflow (nieuwe tests toevoegen)

Dit project gebruikt Playwright Codegen om selectors te vinden door de test
manueel uit te voeren. Omdat Codespaces geen grafisch scherm heeft, gebruiken
we een virtueel scherm via VNC:

```bash
# Eenmalig per sessie: VNC-omgeving opstarten
Xvfb :99 -screen 0 1280x800x24 &
DISPLAY=:99 fluxbox &
x11vnc -display :99 -forever -nopw &
websockify --web=/usr/share/novnc/ 6080 localhost:5900 &
```

Poort 6080 openen via de **Ports**-tab in VS Code, en `/vnc.html` toevoegen
aan de URL om het scherm in de browser te zien.

```bash
mkdir -p recordings
DISPLAY=:99 npx playwright codegen --output=recordings/NAAM.spec.ts <start-URL>
```

Doorloop de teststappen manueel in het VNC-scherm; Codegen schrijft de
gegenereerde selectors rechtstreeks naar het opgegeven bestand.

**Let op:** Codegen neemt élke toetsaanslag/correctie letterlijk op — het
resultaat is rommelig en moet altijd opgeschoond worden tot de eindstappen,
nooit 1-op-1 overgenomen.

---

## 7. Bekende beperkingen & belangrijke kanttekeningen

### Mailbox-toegang (verificatiecodes)
Microsoft heeft **IMAP met gewoon wachtwoord voor Exchange Online/M365** sinds
oktober 2022 volledig uitgeschakeld. Automatische toegang tot verificatiecodes
vereist **OAuth2 via Microsoft Graph API**, wat een app-registratie in
Microsoft Entra ID vereist. Tot die toegang er is, gebruiken we een
**human-input-pauze** (`helpers/humanInput.ts`) als tussenoplossing (intussen niet meer relevant, die optie gingen we niet doen).

### Elke checkout is een échte, onomkeerbare aankoop
Er is geen sandbox/mock-modus voor checkout — elke geslaagde CHK-test koopt
**écht** een taalversie van een norm, permanent op het testaccount. Dit heeft twee gevolgen:
1. **Taal/normverbruik**: met slechts 3 taalversies (Frans/Engels/Duits) per
   norm, lopen checkout-tests snel door de voorraad heen. Oplossing:
   `standardPicker.ts` kiest automatisch een verse, nog-koopbare combinatie
   i.p.v. een norm hard te coderen.
2. **Norm "NBN EN 1090-3" is gereserveerd voor de CART-tests** (met de
   Duitse taalversie) — die tests ronden nooit een echte aankoop af, dus deze
   norm blijft daar veilig herbruikbaar. `standardPicker.ts` sluit deze norm
   expliciet uit om conflicten te vermijden.

### State-lekken tussen tests
Cart- en checkout-tests laten soms data achter (items in het mandje,
voltooide aankopen) die een volgende testrun kan beïnvloeden. `ensureCartIsEmpty()`
lost dit gedeeltelijk op voor het winkelmandje; wees alert bij nieuwe tests
op vergelijkbare afhankelijkheden.

### ⚠️ Waarschuwing: vermijd herhaaldelijk opnieuw draaien van falende login-gerelateerde tests
Het platform vergrendelt een account automatisch na 5 opeenvolgende mislukte inlogpogingen (zie RT-LOGIN-005). 
Als een test faalt vóór het inloggen volledig lukt (bv. door een verkeerd wachtwoord in .env, een tijdelijke bug, of een verkeerde selector),
en je blijft de test snel na elkaar herhalen zonder de oorzaak op te lossen, loop je het risico je eigen testaccount per ongeluk te vergrendelen  
dat is al eerder gebeurd tijdens deze ontwikkeling. Controleer bij een mislukte test eerst de foutmelding/trace vóór je opnieuw draait, 
en vermijd blind herhaaldelijk retry'en.

### Testaccount-wissel
Als het testaccount ooit gewijzigd wordt (bv. door een vergrendeling), zijn
de meeste tests inmiddels **generiek gemaakt** (STD-, CHK-tests) en blijven
ze werken zonder aanpassing. Uitzondering: nieuwe accounts bezitten
aanvankelijk **geen** normen/orders — draai eerst 1-2 CHK-tests om data te
genereren vóór je STD-/ORD-tests test.

### UI-architectuurpatronen om te onthouden
- **Modals met sluitknop (X) zitten telkens in een `<iframe>`** (winkelmandje,
  verwijder-bevestiging, PDF-viewer) — bevestigd patroon over de hele site.
- **Prijs-teksten hebben soms wel/geen spatie** na het €-teken, afhankelijk
  van de pagina — gebruik `/€\s*\d+,\d+/`, niet `/€\d+,\d+/`.
- **Vermijd hard waits** (`waitForTimeout`) voor verwerkingstijd na checkout;
  geef de assertion zelf een ruime timeout — Playwright's `expect()` polt
  automatisch en stopt zodra het element verschijnt.
- **Koop-knoppen tonen niet altijd een prijs in hun naam** — op sommige
  pagina's (bv. detailpagina bereikt via "My Standards") zijn koop- en
  open-links naamgewijs niet te onderscheiden; gebruik positionele logica
  (zie `ownedStandard.ts`) in plaats van puur naam-matching.

---

## 8. Openstaande vragen aan Yvan / IT

- Graph API app-registratie voor mailbox-toegang (Tenant ID, Client ID, Client Secret)
- Apart testaccount voor lockout-tests (LOGIN-005/006/007), zonder het hoofdaccount te vergrendelen
- Testaccount met kredietlijn (CHK-005/006)
- Company Administrator- en Approved User-testaccounts (voor TEAM, REQ, RR, PUR, ORD-001, REG-004 t/m 009)
- Bevestiging of het huidige account aan een bedrijf met actief abonnement gekoppeld is (COL-tests)

---

## 9. Individuele testcommando's (copy-paste)

Als je zelf niet vertrouwd bent met Playwright, Codespaces, of de structuur van dit project: 
plak de volledige inhoud van deze README.md in een gesprek met Claude (of een andere AI-assistent) en leg uit wat je wil doen 
(bv. "ik wil test X draaien", "ik krijg deze foutmelding", "ik wil een nieuwe test toevoegen"). 
De README bevat genoeg context (helpers, bekende beperkingen, architectuurpatronen) om een AI meteen goed op weg te helpen zonder dat je alles zelf hoeft uit te leggen.