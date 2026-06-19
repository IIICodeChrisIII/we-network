# Würth Elektronik Network - Projekt Dokumentation

Diese Datei erklärt, wie das Projekt aufgebaut ist, welche Dateien sich im Repository befinden und wie die zugrundeliegende Architektur (speziell Supabase) funktioniert.

## 1. Welche Dateien befinden sich lokal im Repository?

Das lokale Repository enthält den **Frontend-Code** (die sichtbare Benutzeroberfläche), der im Browser des Nutzers ausgeführt wird. Die wichtigsten Ordner und Dateien sind:

*   **`src/` (Source-Ordner)**: Hier liegt der gesamte Programmcode für die React-Applikation.
    *   **`src/pages/`**: Enthält die einzelnen Ansichten/Seiten der App (z.B. `Login.jsx` für die Anmeldung, `News.jsx` für den Newsfeed, `Channels.jsx` für den Chat).
    *   **`src/components/`**: Enthält wiederverwendbare Bausteine, die auf mehreren Seiten vorkommen (z.B. `Sidebar.jsx` für die Navigation).
    *   **`src/lib/`**: Enthält Hilfsscripte, insbesondere `supabase.js`, welches die Verbindung zur Datenbank herstellt.
    *   **`src/App.jsx` & `src/main.jsx`**: Der Einstiegspunkt der Applikation, wo entschieden wird, welche Seite unter welcher URL geladen wird (Routing).
    *   **`src/index.css`**: Das Design, die Farben ("Würth Rot") und die Animationen (Glassmorphismus-Effekt).
*   **`supabase/migrations/`**: Enthält die SQL-Datei (`schema.sql`), die den Aufbau der Datenbank (Tabellen, Berechtigungen) beschreibt.
*   **`package.json`**: Die Liste aller installierten Fremdbibliotheken (z.B. React, Lucide-Icons, Supabase-Client).
*   **`.env.local` (ignoriert)**: Eine Datei, die aus Sicherheitsgründen nicht ins Git hochgeladen wird. Sie enthält die geheimen Passwörter/Schlüssel, um sich mit der Datenbank zu verbinden.

---

## 2. Was ist Supabase?

**Supabase** ist ein sogenanntes "Backend-as-a-Service" (BaaS) und eine Open-Source-Alternative zu Google Firebase. 
Anstatt dass wir einen eigenen Server programmieren müssen, der Nutzer registriert und Datenbankabfragen verarbeitet, übernimmt Supabase diese Arbeit komplett für uns in der Cloud.

Supabase stellt uns drei wesentliche Dienste für dieses Projekt zur Verfügung:
1.  **PostgreSQL Datenbank:** Eine extrem robuste, relationale Datenbank, in der alle Posts, Profile und Chat-Nachrichten gespeichert werden.
2.  **Authentication (Login-System):** Ein fertiges, sicheres System zur Nutzerregistrierung (E-Mail/Passwort) inklusive Verschlüsselung.
3.  **Realtime WebSockets:** Eine Technologie, durch die unsere App sofort benachrichtigt wird, wenn sich Daten ändern (z.B. wenn jemand eine Chat-Nachricht in `Channels.jsx` schreibt, taucht sie bei allen anderen sofort ohne Seiten-Neuladen auf).

---

## 3. Wie funktioniert das Projekt insgesamt?

Die Architektur lässt sich in einem simplen Kreislauf erklären:

1.  **Start (Frontend):** Der Nutzer öffnet die Website (welche durch Vite gebaut wurde) im Browser. Der React-Code läuft lokal im Browser des Nutzers.
2.  **Anfrage (Supabase Client):** Wenn der Nutzer z.B. den "News"-Reiter öffnet, führt der Code in `News.jsx` einen Befehl aus (z.B. `supabase.from('posts').select('*')`).
3.  **Kommunikation:** Dieser Befehl wird über das Internet direkt an die Supabase-Server geschickt. Dabei nutzt die App den geheimen Schlüssel aus der `.env.local` Datei zur Authentifizierung.
4.  **Datenbank:** Supabase prüft die Berechtigungen (RLS = Row Level Security) und fragt die PostgreSQL Datenbank ab.
5.  **Antwort:** Die Datenbank schickt die Posts als "JSON"-Datenpaket zurück an das Frontend.
6.  **Darstellung:** React nimmt diese Rohdaten und rendert für jeden Post eine schöne "Glassmorphismus"-Karte auf dem Bildschirm des Nutzers.
