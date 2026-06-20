# WE Network — Technisches Setup & Übersicht

Dieses Repository enthält den Frontend-Code für das WE Network, eine Plattform zur Vernetzung von Studierenden und Würth Elektronik.

## Tech Stack

Das Projekt ist eine Single-Page Application (SPA) und verwendet moderne Webtechnologien:
- **Frontend-Framework:** React 18
- **Build-Tool:** Vite 5
- **Routing:** React Router v6
- **Styling:** Reines CSS mit CSS Variables (kein Tailwind)
- **Icons:** Lucide React
- **Charts:** Recharts
- **Backend/Datenbank/Auth:** Supabase JS SDK v2 (PostgreSQL, GoTrue Auth, Realtime WebSockets)

## Projektstruktur

Die Struktur des `src/`-Verzeichnisses ist wie folgt aufgebaut:
- `assets/`: Statische Dateien wie Logos und Bilder.
- `components/`: Wiederverwendbare UI-Komponenten (z.B. Sidebar, Navigationsleisten, Talentpool-Formulare).
- `lib/`: Hilfsscripte, insbesondere die Konfiguration für Supabase (`supabase.js`) und externe Daten (z.B. Universitäten).
- `pages/`: Die einzelnen Ansichten der Anwendung (z.B. Landing, Login, News, Channels, Career).
- `App.jsx` / `main.jsx`: Einstiegspunkte und Routing-Konfiguration.
- `index.css`: Globale Styles und CSS-Variablen.

## Technisches Setup

Um das Projekt lokal auszuführen, befolge diese Schritte:

### 1. Repository klonen und Abhängigkeiten installieren
```bash
git clone <repo-url>
cd we-network
npm install
```

### 2. Umgebungsvariablen konfigurieren
Erstelle eine `.env.local` Datei im Hauptverzeichnis des Projekts und füge deine Supabase-Keys ein:
```env
VITE_SUPABASE_URL=deine_supabase_url
VITE_SUPABASE_ANON_KEY=dein_supabase_anon_key
```

### 3. Datenbank Setup (Supabase)
Führe die bereitgestellten SQL-Skripte im Supabase Dashboard unter "SQL Editor" aus:
- Führe den Inhalt von `supabase/migrations/schema.sql` aus, um alle Tabellen und Row Level Security (RLS) Policies zu erstellen.
- (Optional) Führe `supabase/migrations/002_insert_demo_jobs.sql` aus, um Test-Stellenangebote einzufügen.

### 4. Entwicklungsserver starten
```bash
npm run dev
```
Die Anwendung ist nun unter `http://localhost:5173` erreichbar.

### 5. Testdaten (Optional)
Du kannst Test-Benutzer und -Daten generieren, indem du folgende Skripte im Terminal ausführst:
```bash
node create_test_accounts.js
node scripts/seed-test-users.mjs
```
