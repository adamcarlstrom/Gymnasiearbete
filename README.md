[🇬🇧 Read this in English](README.en.md)
# Multi-Snake Platform – Gymnasiearbete

Välkommen till en modern, nätverksbaserad spelplattform inspirerad av ledande community-sajter. Detta projekt är ett gymnasiearbete utvecklat på Nacka Gymnasium (TDI20b). Det huvudsakliga målet med projektet har varit att bygga en robust och server-auktoritär plattform för realtidsinteraktion, där all tung spel- och synkroniseringslogik flyttats till en säker backend för att garantera en rättvis och fuskfri upplevelse.

---

## 🚀 Huvudfunktioner

På plattformen kan användare interagera, tävla och hantera sin data genom ett flertal integrerade system:

* **Multiplayer-Snake:** Utmana en motståndare i realtid. Spelet körs helt på en centraliserad server, och matchen följer en enkel men tävlingsinriktad regel: den som överlever längst vinner.
* **Realtidschatt:** Kommunicera med andra spelare via ett blixtsnabbt WebSocket-system. Spelnavet håller dig ständigt uppdaterad med notifieringar direkt på meddelandeikonen när du får nya utmaningar eller chattmeddelanden.
* **Användarsök & Profiler:** Sök efter andra registrerade spelare i databasen, granska deras unika profiler, och ta del av deras matchhistorik och vinststatistik som visualiseras med responsiva diagram.
* **Kontroll över din data:** Hantera din egen profil fullt ut. Du kan anpassa din personliga information, byta profilbild, uppdatera ditt lösenord eller permanent radera ditt konto.

![Dashboard View](./assets/home_page.png)
![new_account](./assets/newAccount.png)
![Login](./assets/LogIn.png)
![profile_view](./assets/profile_view.png)
![win_rate](./assets/win_rate.png)
![game_begin](./assets/game_begin.png)
![game](./assets/game.png)
![messages](./assets/messages.png)

---

## 🛠 Teknisk Arkitektur & Nätverk

Plattformen kombinerar flera moderna teknologier för att optimera resursallokering och latens, uppdelat i en tydlig stack för backend och frontend.

### Hybrid Nätverksarkitektur
Systemet använder två olika kommunikationstekniker för att optimera dataflödet:
1.  **AJAX (HTTP POST):** Används för traditionella, asynkrona laddningar (såsom matchning i spelnavet eller verifiering av utmaningar). Detta gör att webbplatsen kan skicka och hämta data i bakgrunden utan att sidan behöver laddas om.
2.  **WebSockets (Socket.IO):** När matchen väl startar växlar systemet över till full-duplex-kommunikation. Denna persistenta anslutning strömmar spelarnas koordinater, inputs och klockans sekunder 10 gånger i sekunden med minimal fördröjning. Servern bearbetar dessa realtidsdata, uppdaterar det centrala speltillståndet, och sparar slutligen matchresultatet till databasen via ett trådisolerat exekveringsmönster.

### Backend & Databas
* **Språk & Ramverk:** Python och Flask, strukturerat med ett Blueprint-system för modulär filhantering.
* **Databas:** Relaterad SQLite-databas för snabb och lokal datalagring. Känsliga data, såsom användarlösenord, skyddas med enkelriktad kryptering (`flask-bcrypt`).
* **Säkerhet:** Server-side sessionshantering (`flask-session`) för säker användarautentisering.

### Frontend & Interaktion
* **Rendering:** HTML5 Canvas används för att dynamiskt rita upp spelet med hög prestanda.
* **Stil & Layout:** CSS3 och Bootstrap ger en responsiv layout som anpassar sig för olika skärmstorlekar.
* **Logik:** JavaScript hanterar klientens WebSocket-anslutningar, fångar tangentbordsinmatning och uppdaterar DOM-element i realtid.

---

## 📊 Databasstruktur

Kärnan i plattformens datalagring utgörs av tre huvudtabeller i SQLite som hanterar användare, meddelanden och matchhistorik.

### `users` (Användarkonton)
Hanterar all profilinformation och autentiseringsdata.
| Kolumnnamn | Datatyp | Beskrivning |
| :--- | :--- | :--- |
| `id` | INTEGER | Primärnyckel (Auto-increment) |
| `username` | TEXT | Användarens unika visningsnamn |
| `password` | TEXT | Hashat och krypterat lösenord |
| `description` | TEXT | Användarens personliga profilbeskrivning |
| `profile_picture` | TEXT | Filnamn på den uppladdade bilden (lagras i `/uploads`) |
| `date_created` | TEXT | Datum och tid då kontot skapades |

### `messages` (Realtidschatt)
Lagrar all kommunikation och hanterar notis-systemet.
| Kolumnnamn | Datatyp | Beskrivning |
| :--- | :--- | :--- |
| `id` | INTEGER | Primärnyckel |
| `sender_id` | INTEGER | Främmande nyckel (Användar-id för avsändaren) |
| `receiver_id` | INTEGER | Främmande nyckel (Användar-id för mottagaren) |
| `content` | TEXT | Själva meddelandetexten |
| `status` | INTEGER | Indikerar om meddelandet är läst (1) eller oläst (0) |
| `date` | TEXT | Tidsstämpel för när meddelandet skickades |

### `games_history` (Matchstatistik)
Sparar detaljerad data för avslutade matcher för att generera statistik och diagram.
| Kolumnnamn | Datatyp | Beskrivning |
| :--- | :--- | :--- |
| `id` | INTEGER | Primärnyckel |
| `player1_id` | INTEGER | Främmande nyckel (Spelare 1 / Blå) |
| `player2_id` | INTEGER | Främmande nyckel (Spelare 2 / Gul) |
| `winner_id` | INTEGER | Id för vinnaren (`NULL` vid oavgjort/head-on krock) |
| `score_player1` | INTEGER | Slutpoäng (antal frukter) för Spelare 1 |
| `score_player2` | INTEGER | Slutpoäng (antal frukter) för Spelare 2 |
| `duration` | INTEGER | Matchens totala längd mätt i sekunder |
| `date` | TEXT | Tidsstämpel för när matchen avslutades |

---

## 🛠 Installationsguide & Körning

För att köra projektet lokalt på din maskin behöver du Python installerat.

### 1. Installera Beroenden
Installera de nödvändiga paketen via terminalen:

```
pip install flask flask-session flask-bcrypt flask-socketio
```
2. Starta Servern
Navigera till projektets rotkatalog och exekvera startfilen:
```
python run.py
```
3. Anslut till Applikationen
Öppna en valfri modern webbläsare och navigera till:
http://localhost:5000/
-> Tips: För att testa multiplayer-funktionaliteten på en och samma dator kan du öppna ett extra inkognitofönster och logga in på ett separat testkonto.

👥 Utvecklare
* Adam Carlström – Nacka Gymnasium (TDI20b)
* Martin Nylund – Nacka Gymnasium (TDI20b)


