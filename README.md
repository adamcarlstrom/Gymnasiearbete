# Multi-Snake Platform – Gymnasiearbete

Ett modernt, nätverksbaserat spel- och community-plattform byggt som ett examensarbete på Nacka Gymnasium (TDI20b). Systemet flyttar all speltillståndsberäkning till en centraliserad, auktoritär backend för att uppnå synkroniserat realtids-multiplayer och garantera en fuskfri spelupplevelse.

## 🚀 Projektöversikt

Plattformen erbjuder en fullständig social spelmiljö inspirerad av moderna communities som Chess.com. Användare kan skapa konton, anpassa sina profiler med unika uppladdade bilder, söka efter medspelare och kommunicera via en realtidschatt. 

Kärnan i projektet är en konkurrenskraftig multiplayer-variant av det klassiska spelet **Snake**, där två spelare möts på samma bräde under devisen: *den som överlever längst vinner*.

---

## 🛠 Teknisk Arkitektur & Dataflöde

Plattformen är uppbyggd kring en **hybrid nätverksarkitektur** uppdelad i tre lager: Frontend, Backend (Server) och Databas. Den kombinerar traditionella HTTP-anrop med full-duplex WebSocket-strömmar för att optimera resursallokering och latens.

   [ Frontend UI: HTML5 / JS Canvas ]
        /                       \
AJAX (HTTP POST)           WebSockets (Socket.IO)
[Diskret data/Staging]     [Realtid: Inputs/Frames]
/

v                             v
[ Flask Server Router ] <---> [ Authoritative Physics Engine ]
|
(Trådisolerad Commit)
v
[ SQLite Database File ]


### 1. Klienten (Frontend)
Utvecklad med **HTML5, CSS3 (Bootstrap)** och **JavaScript**. Spelytan renderas dynamiskt via **HTML5 Canvas**. För att garantera synkronisering fungerar frontenden som en *"dum renderingmotor"*. Den kör inga egna timers eller kollisionsberäkningar; den rensar endast skärmen och ritar upp koordinater som distribueras av backend-servern 10 gånger i sekunden, samt fångar upp användarens keystrokes (`W, A, S, D`) för direkt vidarebefordran till servern.

### 2. Servern (Backend)
Drivs av **Python** och webbramverket **Flask**. Applikationen är strukturerad med ett **Blueprint-system** för ren och modulär fil- och komponenthantering. Realtidskommunikationen hanteras via **Flask-SocketIO** (WebSockets). 
* **Staging-fas:** Matchning och pre-game hanteras via asynkrona **AJAX-anrop (HTTP POST)** och Socket-rum för att synkronisera "Ready-Up"-statusen med en serverstyrd nedräkningstimer.
* **Auktoritär Spelmotor:** När en match startas, initierar servern en isolerad bakgrundstråd (`start_background_task`) som utgör spelets källsanning. Servern beräknar ormarnas positionsförändringar, validerar riktningsbyten (förhindrar 180-graders självkollisioner mellan server-ticks), hanterar slumpmässig generering av frukter (4 aktiva simultant) samt utvärderar vägg-, själv- och head-on-kollisioner.

### 3. Databasen (Persistens)
En lokal **SQLite**-databas lagrar alla användarprofiler och matchresultat. Användarsessioner hanteras via `flask-session`, och känsliga användardata skyddas genom enkelriktad lösenordskryptering via `flask-bcrypt`. När en match avslutas i backend-tråden exekveras ett säkert, trådisolerat `INSERT`-kommando med ett strukturerat `try/except/finally`-mönster för att logga matchstatistiken utan att låsa databasfilen för övriga tjänster.

---

## 📊 Databasstruktur (`games_history`)

Tabellen `games_history` har uppgraderats för att spara detaljerad matchanalys och prestandadata:

| Kolumnnamn | Datatyp | Beskrivning |
| :--- | :--- | :--- |
| `id` | INTEGER | Primärnyckel (Auto-increment) |
| `player1_id` | INTEGER | Främmande nyckel kopplad till användar-id för Spelare 1 (Blå) |
| `player2_id` | INTEGER | Främmande nyckel kopplad till användar-id för Spelare 2 (Gul) |
| `winner_id` | INTEGER / NULL | Id för vinnaren. Innehåller `NULL` vid oavgjort (head-on krock på samma tick) |
| `date` | TEXT | Datum och tidstämpel för matchens avslut |
| `duration` | INTEGER | Matchens totala längd mätt i sekunder |
| `score_player1` | INTEGER | Slutgiltig poäng (antal tagna frukter) för Spelare 1 |
| `score_player2` | INTEGER | Slutgiltig poäng (antal tagna frukter) för Spelare 2 |

---

## 🛠 Installationsguide & Körning

### Systemkrav
Projektet kräver att **Python 3.12** (eller senare) samt pakethanteraren `pip` finns installerat på din lokala maskin.

### 1. Installera Beroenden
Installera de nödvändiga Flask- och nätverksbiblioteken genom att köra följande kommando i din terminal:

```bash
pip install flask flask-session flask-bcrypt flask-socketio
2. Starta Servern
Navigera till projektets rotkatalog och starta applikationen genom att köra startfilen:

Bash
python run.py
3. Anslut till Applikationen
När servern indikerar att den lyssnar på inkommande anrop, öppna en valfri modern webbläsare (t.ex. Chrome, Firefox eller Edge) och navigera till:

Plaintext
http://localhost:5000/
Obs: För att testa multiplayer-funktionaliteten lokalt kan du öppna ett extra inkognitofönster och logga in på ett separat sekundärt testkonto.

👥 Utvecklare
Adam Carlström – Nacka Gymnasium (TDI20b)

Martin Nylund – Nacka Gymnasium (TDI20b)
