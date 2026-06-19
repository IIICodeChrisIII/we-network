# Würth Elektronik Network

Zentrale Plattform für Studenten, Praktikanten und Mitarbeiter von Würth Elektronik, um sich zu vernetzen, auszutauschen und Karrieremöglichkeiten zu entdecken.

## Features
- **News Feed:** Unternehmensupdates und Events
- **Live Channels:** Discord-ähnliche Chaträume für direkten Austausch (Realtime)
- **Career Portal:** Praktika und Jobs direkt bei Würth Elektronik
- **HR Dashboard:** Analysen und Metriken für den Bereich HR/Talent Management

## Technologie
- React + Vite
- Tailwind CSS (via custom index.css)
- Supabase (PostgreSQL, Auth, Realtime WebSockets)
- Lucide React (Icons), Recharts (Charts)

## Lokales Setup
1. Repository klonen
2. `npm install`
3. Erstelle eine `.env.local` Datei mit deinen Supabase-Zugangsdaten:
   ```env
   VITE_SUPABASE_URL="https://DEIN_PROJEKT.supabase.co"
   VITE_SUPABASE_ANON_KEY="dein-anon-key"
   ```
4. `npm run dev` starten

## Datenbank Setup
Das Datenbankschema befindet sich in `supabase/migrations/schema.sql`. Dieses Skript muss im Supabase SQL Editor ausgeführt werden, um die Tabellen und Berechtigungen zu erstellen.
