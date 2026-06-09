# Multi-Snake Platform – Gymnasiearbete

Ett modernt, nätverksbaserat spel- och community-plattform byggt som ett examensarbete på Nacka Gymnasium (TDI20b). Systemet flyttar all speltillståndsberäkning till en centraliserad, auktoritär backend för att uppnå synkroniserat realtids-multiplayer och garantera en fuskfri spelupplevelse.

## 🚀 Projektöversikt

Plattformen erbjuder en fullständig social spelmiljö inspirerad av moderna communities som Chess.com. Användare kan skapa konton, anpassa sina profiler med unika uppladdade bilder, söka efter medspelare och kommunicera via en realtidschatt. 

Kärnan i projektet är en konkurrenskraftig multiplayer-variant av det klassiska spelet **Snake**, där två spelare möts på samma bräde under devisen: *den som överlever längst vinner*.

---

## 🛠 Teknisk Arkitektur & Dataflöde

Plattformen är uppbyggd kring en **hybrid nätverksarkitektur** uppdelad i tre lager: Frontend, Backend (Server) och Databas. Den kombinerar traditionella HTTP-anrop med full-duplex WebSocket-strömmar för att optimera resursallokering och latens.
