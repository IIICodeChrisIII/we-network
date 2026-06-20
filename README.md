# WE Network — Würth Elektronik Student Platform

Eine zentrale Vernetzungsplattform für Studierende, Praktikanten und Mitarbeiter von Würth Elektronik. Entwickelt als MVP im Rahmen des TUM Science Hack / Wörth Hackathons.

---

## Inhaltsverzeichnis

1. [Was ist diese Platform?](#1-was-ist-diese-platform)
2. [Aktuelle Features](#2-aktuelle-features)
3. [Technologie-Stack](#3-technologie-stack)
4. [Architektur & Datenfluss](#4-architektur--datenfluss)
5. [Datenbank-Schema](#5-datenbank-schema)
6. [UX-Flow: Wie navigiert ein Nutzer?](#6-ux-flow-wie-navigiert-ein-nutzer)
7. [Rollen & Berechtigungen](#7-rollen--berechtigungen)
8. [Projektstruktur](#8-projektstruktur)
9. [Lokales Setup](#9-lokales-setup)
10. [Test-Daten seeden](#10-test-daten-seeden)
11. [Hackathon-Roadmap (4 Personen)](#11-hackathon-roadmap-4-personen)
12. [Arbeitsweise & Contribution-Guide](#12-arbeitsweise--contribution-guide)
13. [Bekannte Limitierungen & nächste Schritte](#13-bekannte-limitierungen--nächste-schritte)

---

## 1. Was ist diese Platform?

Das **WE Network** ist ein internes soziales Netzwerk, das Studierende mit Würth Elektronik verbindet — ähnlich wie LinkedIn, aber speziell für den Würth-Kosmos. Es gibt drei Nutzertypen, die alle auf derselben Platform agieren:

| Rolle | Beschreibung |
|---|---|
| **Studierende** | Registrieren sich, tauschen sich aus, finden Jobs |
| **Specialists** | Würth-Experten, antworten auf Fragen im Chat, erkennbar am roten Badge |
| **HR / Admin** | Sieht alle Nutzer im Dashboard, trackt Conversion-Metriken |

Das Ziel der Platform: Würth Elektronik als attraktiven Arbeitgeber positionieren, eine Talent-Pipeline aufbauen und direkten Austausch zwischen Studierenden und Experten ermöglichen.

---

## 2. Aktuelle Features

### ✅ Fertig implementiert

| Feature | Seite | Status |
|---|---|---|
| E-Mail/Passwort Login & Registrierung | `/login` | Vollständig |
| Google OAuth | `/login` | Vollständig |
| Shibboleth University Login | `/login` | Placeholder (Alert) |
| News Feed — Posts lesen & erstellen | `/` | Vollständig |
| Live-Chat mit Echtzeit-Updates | `/channels` | Vollständig |
| Optimistische UI (Nachrichten erscheinen sofort) | `/channels` | Vollständig |
| Kanalwechsel (mehrere Channels) | `/channels` | Vollständig |
| Stellenangebote anzeigen | `/career` | Vollständig |
| Tech Specialists-Verzeichnis | `/contacts` | Vollständig |
| Nutzerprofil bearbeiten | `/profile` | Vollständig |
| HR Analytics Dashboard | `/admin/dashboard` | Vollständig |
| Echtzeit-Diagramme (Line + Bar) | `/admin/dashboard` | Vollständig |
| Studenten-Tabelle mit Suchfeld | `/admin/dashboard` | Vollständig |
| Responsives Layout (Mobile Navbar versteckt) | Alle | Teilweise |

### ⚠️ Stubs / Nicht fertig

- **Likes** auf Posts: Button vorhanden, aber `likes`-Counter wird nicht inkrementiert
- **Kommentare** auf Posts: Alert "coming soon"
- **Teilen** von Posts: Alert "coming soon"
- **Bild-Upload** im Profil: Button vorhanden, keine Funktion
- **Filter** auf Karriere-Seite: Button vorhanden, keine Funktion
- **Direkt-Nachrichten** im Kontakte-Verzeichnis: Button vorhanden, keine Funktion
- **Auth-Guard**: Seiten sind ohne Login erreichbar (kein Route-Schutz)
- **Shibboleth SSO**: Nur Alert, keine echte Integration

---

## 3. Technologie-Stack

```
Browser
  └── React 18 (SPA)
        ├── React Router v6        (Client-Side Routing)
        ├── Lucide React           (Icon-Library)
        ├── Recharts               (Charts im Dashboard)
        └── Supabase JS SDK v2     (Datenbank + Auth + Realtime)
              └── Supabase Cloud
                    ├── PostgreSQL (Datenbank)
                    ├── Auth       (JWT-basiertes Login-System)
                    └── Realtime   (WebSocket Subscriptions)

Build-Tool: Vite 5
Styling:    Reines CSS mit CSS Custom Properties (kein Tailwind, kein UI-Framework)
Font:       Inter (Google Fonts)
```

**Bewusste Design-Entscheidungen:**
- **Kein Backend-Server** — alle Datenbankabfragen gehen direkt vom Browser zu Supabase via REST/WebSocket. Das macht Deployment trivial, aber bedeutet: Supabase-URL und Anon-Key sind clientseitig sichtbar (der Anon-Key ist per Design öffentlich; RLS schützt die Daten).
- **Kein Tailwind / kein UI-Framework** — alle Styles sind in `src/index.css` als CSS-Variablen definiert. Glassmorphismus-Effekt via `backdrop-filter: blur()`.
- **Inline Styles** werden stark verwendet (kein Stylemodule-Pattern). Das ist für ein Hackathon-MVP akzeptabel, sollte bei Wachstum refactored werden.

---

## 4. Architektur & Datenfluss

```
┌─────────────────────────────────────────────────────────┐
│                        BROWSER                          │
│                                                         │
│  React SPA (Vite Bundle)                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ News.jsx │  │Channels  │  │ Admin    │  ...          │
│  │          │  │.jsx      │  │Dashboard │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
│       │             │             │                     │
│  ┌────▼─────────────▼─────────────▼─────────────────┐   │
│  │            supabase.js (SDK Client)               │   │
│  └────────────────────┬──────────────────────────────┘   │
└───────────────────────┼─────────────────────────────────┘
                        │
              ┌─────────▼──────────┐
              │   SUPABASE CLOUD   │
              │                    │
              │  ┌──────────────┐  │
              │  │  REST API    │◄─┼── SELECT/INSERT/UPDATE
              │  │  (PostgREST) │  │   (CRUD-Operationen)
              │  └──────────────┘  │
              │                    │
              │  ┌──────────────┐  │
              │  │  Realtime    │◄─┼── WebSocket Subscription
              │  │  (WebSocket) │  │   (Live-Chat in Channels)
              │  └──────────────┘  │
              │                    │
              │  ┌──────────────┐  │
              │  │  Auth        │◄─┼── signIn / signUp / OAuth
              │  │  (GoTrue)    │  │
              │  └──────────────┘  │
              │                    │
              │  ┌──────────────┐  │
              │  │  PostgreSQL  │  │
              │  │  Database    │  │
              │  └──────────────┘  │
              └────────────────────┘
```

**Wie eine typische Daten-Operation abläuft (Beispiel: Post laden):**

```
1. Nutzer navigiert zu "/"
2. News.jsx wird gerendert → useEffect() feuert
3. supabase.from('posts').select('*, profiles(first_name, last_name)')
   → HTTP GET an https://<projekt>.supabase.co/rest/v1/posts
4. Supabase prüft: Ist ein JWT-Token im Header? → RLS-Policy: "Posts viewable by everyone"
5. PostgreSQL query: SELECT posts.*, profiles.first_name, profiles.last_name
                     FROM posts JOIN profiles ON posts.author_id = profiles.id
6. JSON-Response zurück an Browser
7. setPosts(data) → React rendert die Karten
```

**Wie Realtime (Chat) funktioniert:**

```
1. Nutzer öffnet /channels
2. Channels.jsx subscribt auf: supabase.channel('messages:channel_id=eq.<uuid>')
   → WebSocket-Verbindung zu Supabase Realtime
3. Anderer Nutzer sendet Nachricht → INSERT in messages-Tabelle
4. Supabase Realtime emittiert postgres_changes Event
5. Subscriber empfängt payload → Nachricht erscheint SOFORT bei allen Nutzern
   (Optimistic Update: eigene Nachricht erscheint noch vor Server-Bestätigung)
```

---

## 5. Datenbank-Schema

```sql
-- Alle Tabellen haben Row Level Security (RLS) aktiviert

profiles          -- Erweiterung von auth.users
  id              uuid  (FK → auth.users, Primary Key)
  first_name      text
  last_name       text
  university      text
  degree          text
  semester        text
  status          text  -- 'student' | 'intern' | 'working_student' | 'employee'
  role            text  -- 'user' | 'admin' | 'specialist'
  avatar_url      text
  bio             text
  created_at      timestamptz

channels          -- Chat-Räume
  id              uuid
  name            text  -- z.B. 'general', 'internships-2026'
  description     text
  created_at      timestamptz

messages          -- Chat-Nachrichten
  id              uuid
  channel_id      uuid  (FK → channels)
  user_id         uuid  (FK → profiles)
  content         text
  created_at      timestamptz

posts             -- News Feed Beiträge
  id              uuid
  author_id       uuid  (FK → profiles)
  title           text
  content         text
  type            text  -- 'news' | 'event' | 'job'
  likes           integer  (default 0)
  created_at      timestamptz

jobs              -- Stellenangebote
  id              uuid
  title           text
  department      text
  location        text
  type            text  -- 'internship' | 'working_student' | 'full_time'
  description     text
  created_at      timestamptz
```

**RLS-Policies (Zusammenfassung):**

| Tabelle | Lesen | Schreiben |
|---|---|---|
| profiles | Jeder (auch anonym) | Nur eigenes Profil |
| channels | Jeder | Nicht über Client möglich |
| messages | Jeder | Nur als eingeloggter User (eigene user_id) |
| posts | Jeder | Nur als eingeloggter User (eigene author_id) |
| jobs | Jeder | Nicht über Client möglich (nur über Supabase Dashboard) |

---

## 6. UX-Flow: Wie navigiert ein Nutzer?

```
┌─────────────────────────────────────────────────────┐
│                     /login                          │
│  ┌────────────────────────────────────────────┐     │
│  │  Email + Passwort  │  Google OAuth         │     │
│  │  Shibboleth (SSO)  │  "Register here"      │     │
│  └────────────────────────────────────────────┘     │
└─────────────────────────┬───────────────────────────┘
                          │ Login erfolgreich
                          ▼
┌─────────────────────────────────────────────────────┐
│            TOP NAVBAR (immer sichtbar)              │
│  WE Network  │ Feed │ Channels │ Kontakte │ Karriere │ Analytics │  [Avatar] [Logout]
└──────┬───────┴──────┴──────────┴──────────┴─────────┴───────────┘
       │
       ├── /           → News Feed
       │     • Posts lesen (neueste zuerst)
       │     • Eigenen Post schreiben (Titel + Text)
       │     • Like / Comment / Share (letzte 2 als Stub)
       │
       ├── /channels   → Live Chat
       │     • Links: Liste der Channels (#general, #internships-2026, #tech-talk)
       │     • Rechts: Nachrichtenverlauf + Eingabefeld
       │     • Specialists haben roten Avatar + "Specialist"-Badge
       │     • Eigene Nachricht erscheint sofort (Optimistic UI)
       │
       ├── /contacts   → Tech Specialists Verzeichnis
       │     • Kacheln mit Profil-Bild (Initialen), Name, Bio
       │     • "Message" und "Mail" Buttons (aktuell Stubs)
       │     • Zeigt nur Nutzer mit role='specialist'
       │
       ├── /career     → Stellenangebote
       │     • Karten mit Job-Titel, Department, Standort, Typ
       │     • "Apply Now" Button (aktuell Stub)
       │     • Jobs werden aus der jobs-Tabelle geladen
       │
       ├── /admin/dashboard → HR Analytics
       │     • 4 Stat-Kacheln: Total Users, Talent Pool, Internships/Hires, Messages
       │     • Line Chart: Platform Activity Over Time (basiert auf total-User-Count)
       │     • Bar Chart: User Funnel — Student → Intern → Employee
       │     • Tabelle: alle Nutzer mit University, Major, Status, Aktionen
       │
       └── /profile    → Eigenes Profil bearbeiten
             • Name, Bio, Status (Student/Intern/...), University
             • "Upload Photo" (aktuell Stub)
             • Save speichert via supabase.from('profiles').upsert(...)
```

---

## 7. Rollen & Berechtigungen

Das System kennt zwei orthogonale Konzepte:

**`status`** — wo befindet sich der Nutzer in seiner Karriere-Journey:
- `student` — noch an der Uni
- `intern` — Praktikant bei Würth
- `working_student` — Werkstudent bei Würth
- `employee` — Festangestellter

**`role`** — was darf der Nutzer auf der Platform:
- `user` — Standard-Nutzer (alle registrierten Studierenden)
- `specialist` — Würth-Experte, erscheint im Kontakte-Verzeichnis mit Badge im Chat
- `admin` — HR-Mitarbeiter, sieht das Analytics-Dashboard

> **Hinweis:** Es gibt aktuell keinen technischen Route-Guard. Alle Seiten sind auch ohne Login erreichbar. Das Admin-Dashboard ist unter `/admin/dashboard` direkt erreichbar. Das muss vor einem echten Launch gesichert werden.

**Rollen setzen:** Aktuell nur über das Supabase Dashboard (Table Editor → profiles → role-Feld) oder über das Seed-Script.

---

## 8. Projektstruktur

```
W-rth-Hackathon/
│
├── src/
│   ├── main.jsx              Einstiegspunkt: ReactDOM.render()
│   ├── App.jsx               Router: definiert alle Routen und das AppLayout
│   ├── index.css             GESAMTES Styling: CSS-Variablen, Komponenten, Animationen
│   │
│   ├── lib/
│   │   └── supabase.js       Singleton: erstellt den Supabase-Client (liest .env.local)
│   │
│   ├── components/
│   │   └── Sidebar.jsx       Top-Navbar mit Navigation, Avatar, Logout
│   │
│   └── pages/
│       ├── Login.jsx          Login + Registrierung + Google OAuth
│       ├── News.jsx           News Feed (Posts lesen + erstellen)
│       ├── Channels.jsx       Live-Chat (Realtime WebSocket)
│       ├── Contacts.jsx       Specialists-Verzeichnis
│       ├── Career.jsx         Stellenangebote
│       ├── Profile.jsx        Nutzerprofil bearbeiten
│       └── AdminDashboard.jsx HR-Metriken + Studenten-Tabelle
│
├── supabase/
│   └── migrations/
│       └── schema.sql         Datenbankschema (einmalig im Supabase SQL Editor ausführen)
│
├── scripts/
│   └── seed-test-users.mjs   Erstellt 5 Test-Nutzer und befüllt die DB mit Demo-Daten
│
├── public/
│   └── vite.svg
│
├── index.html                 HTML-Einstiegspunkt (Vite)
├── vite.config.js             Vite-Konfiguration (host: true für Netzwerk-Zugriff)
├── package.json
└── .env.local                 (NICHT IM GIT) Supabase-Keys
```

**Wichtige Konvention:** Jede Page-Komponente ist vollständig self-contained — sie holt ihre eigenen Daten direkt via Supabase SDK. Es gibt keine globale State-Management-Lösung (kein Redux, kein Context für Daten). Das macht es einfach, an einzelnen Seiten zu arbeiten, ohne die anderen zu verstehen.

---

## 9. Lokales Setup

### Voraussetzungen
- Node.js ≥ 18
- npm ≥ 9
- Zugang zum Supabase-Projekt (URL + Anon Key)

### Schritt 1: Repository klonen & Dependencies installieren

```bash
git clone <repo-url>
cd W-rth-Hackathon
npm install
```

### Schritt 2: Environment Variables setzen

Erstelle eine Datei `.env.local` im Root-Verzeichnis:

```env
VITE_SUPABASE_URL=https://bbnvrugxtznxcxjdtszk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJibnZydWd4dHpueGN4amR0c3prIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4OTA5MTYsImV4cCI6MjA5NzQ2NjkxNn0.FGRqcGgMB4cpqoDnqo3cFDTXGD4zcW-BjVoq4YVmmT8
```

> Der Anon-Key ist per Design öffentlich (er ist in der Seed-Datei als Referenz bereits enthalten). Die Sicherheit liegt in den RLS-Policies der Datenbank.

### Schritt 3: Dev-Server starten

```bash
npm run dev
```

Die App läuft auf [http://localhost:5173](http://localhost:5173).

Mit `host: true` in `vite.config.js` ist der Dev-Server auch über das lokale Netzwerk (z.B. Handy im gleichen WLAN) erreichbar.

### Schritt 4: Datenbank einrichten (nur einmalig nötig)

Falls du ein neues Supabase-Projekt verwendest:
1. Öffne das Supabase-Dashboard → **SQL Editor**
2. Kopiere den Inhalt von `supabase/migrations/schema.sql`
3. Führe ihn aus

### Schritt 5: Build für Production

```bash
npm run build       # Erstellt einen optimierten Bundle in /dist
npm run preview     # Vorschau des Production-Builds lokal
```

---

## 10. Test-Daten seeden

Das Seed-Script erstellt 5 Test-Nutzer, befüllt die DB mit Demo-Posts und testet Realtime:

```bash
node scripts/seed-test-users.mjs
```

**Test-Zugangsdaten nach dem Seeden:**

| Name | E-Mail | Passwort | Rolle | Status |
|---|---|---|---|---|
| Max Mustermann | max.mustermann@wuerth-test.de | WuerthTest2026! | user | student |
| Anna Schmidt | anna.schmidt@wuerth-test.de | WuerthTest2026! | user | intern |
| Lukas Weber | lukas.weber@wuerth-test.de | WuerthTest2026! | user | student |
| Sarah Müller | sarah.mueller@wuerth-test.de | WuerthTest2026! | specialist | student |
| Admin Würth | admin@wuerth-test.de | WuerthAdmin2026! | admin | employee |

> **Tipp:** Um Sarah als Specialist im Chat-Badge sehen zu können, logge dich als Max ein und sende eine Nachricht. Dann in einem anderen Browser/Inkognito-Tab als Sarah einloggen und antworten.

---

## 11. Hackathon-Roadmap (4 Personen)

Die Platform ist als MVP fertig. Die Roadmap beschreibt, was die 4 Personen im Hackathon parallel bauen sollen, um aus dem MVP ein überzeugendes Demo zu machen.

### Übersicht der Rollen

```
Person A — Infrastructure & Auth Lead
Person B — Social Features (Feed & Engagement)
Person C — Communication (Chat & Realtime)
Person D — HR & Career (Dashboard & Jobs)
```

---

### Person A — Infrastructure & Auth Lead

**Verantwortung:** Die gesamte Plattform steht oder fällt mit einer stabilen Basis. Person A sorgt dafür, dass das Fundament steht, bevor alle anderen bauen.

**Aufgaben (priorisiert):**

```
[ ] 1. Route-Guard implementieren
       → Alle Seiten außer /login erfordern eingeloggten Nutzer
       → In App.jsx: ProtectedRoute-Wrapper mit supabase.auth.getSession() check

[ ] 2. Auth-State global verfügbar machen
       → React Context oder einfaches useState in App.jsx
       → Verhindert, dass jede Page-Komponente selbst supabase.auth.getUser() aufruft
       → Navbar bekommt User-State direkt, kein extra Fetch

[ ] 3. Shibboleth SSO (Uni-Login) anbinden
       → Supabase unterstützt SAML 2.0 (Enterprise Plan) oder Custom OAuth
       → Für den Hackathon: Mock-SSO mit hardcoded .edu Domain-Check reicht

[ ] 4. Deployment
       → Vercel oder Netlify: npm run build → drag & drop /dist
       → .env.local als Environment Variables in der Deployment-Platform setzen
       → Custom Domain optional

[ ] 5. Mobile Navigation
       → Aktuell blendet sich die Navbar auf Mobile aus (display: none)
       → Hamburger-Menü oder Bottom-Navigation implementieren
```

**Schlüsseldateien:** `src/App.jsx`, `src/components/Sidebar.jsx`, `src/lib/supabase.js`

---

### Person B — Social Features

**Verantwortung:** Der News Feed ist die Startseite — das erste was Nutzer sehen. Er muss lebendig wirken und Engagement erzeugen.

**Aufgaben (priorisiert):**

```
[ ] 1. Like-Funktion implementieren
       → Aktuell: likes-Counter in posts-Tabelle vorhanden, Button macht nichts
       → UPDATE posts SET likes = likes + 1 WHERE id = post.id
       → Sicherstellen: Nutzer kann nur einmal liken (eigene likes-Tabelle nötig)

[ ] 2. Event-Post-Typ hinzufügen
       → Button "Event" ist schon in der UI (News.jsx Zeile 75)
       → State: isEvent toggle → type='event' beim INSERT
       → Event-Posts bekommen badge-red "Event"-Badge (bereits implementiert, Zeile 102)

[ ] 3. Post-Filter: News / Events / Jobs
       → Filter-Buttons über dem Feed
       → useState für aktiven Filter, .eq('type', filter) in der Supabase-Query

[ ] 4. Kommentare (einfache Version)
       → Neue Tabelle comments (id, post_id, user_id, content, created_at)
       → Unter jedem Post: ausklappbare Kommentar-Sektion
       → RLS: Jeder kann lesen, eingeloggte User können schreiben

[ ] 5. Post löschen (eigene Posts)
       → DELETE-Button nur bei eigenen Posts sichtbar (post.author_id === currentUser.id)
       → supabase.from('posts').delete().eq('id', post.id)
```

**Schlüsseldateien:** `src/pages/News.jsx`, `supabase/migrations/schema.sql`

---

### Person C — Communication & Realtime

**Verantwortung:** Der Chat ist das Herzstück der Community. Er muss flüssig, zuverlässig und mit guten Features ausgestattet sein.

**Aufgaben (priorisiert):**

```
[ ] 1. Channel erstellen (als Nutzer oder Admin)
       → Input + Button: neuen Channel-Namen eingeben
       → supabase.from('channels').insert({ name, description })
       → Channels-Liste links aktualisiert sich automatisch

[ ] 2. Markdown / Formatierung in Nachrichten
       → Einfache Bold-/Italic-Unterstützung via **text** oder _text_
       → Library: react-markdown (npm install react-markdown)
       → Nur in der Anzeige, nicht im Input

[ ] 3. Nachrichten-Reaktionen (Emojis)
       → Neue Tabelle: reactions (id, message_id, user_id, emoji)
       → Unter jeder Nachricht: kleine Emoji-Buttons (+1, ❤️, 🎉)
       → Realtime: Reaktionen erscheinen live

[ ] 4. Ungelesene Nachrichten-Indikator
       → Roter Dot neben Channel-Name wenn neue Nachrichten vorhanden
       → localStorage: last_read_<channel_id> = timestamp speichern
       → Vergleiche mit created_at der neuesten Nachricht

[ ] 5. Direkt-Nachrichten (DMs)
       → In Contacts.jsx: "Message"-Button triggert DM-Channel
       → Spezial-Channel mit name='dm:<user_a>:<user_b>' Pattern
       → Gleiche Message-Infrastruktur nutzen
```

**Schlüsseldateien:** `src/pages/Channels.jsx`, `src/pages/Contacts.jsx`

---

### Person D — HR & Career

**Verantwortung:** Aus Würth-Perspektive ist das Dashboard die wichtigste Seite — sie muss den ROI der Platform demonstrieren. Die Karriere-Seite muss Jobs wirklich bewerbbar machen.

**Aufgaben (priorisiert):**

```
[ ] 1. Job-Bewerbung implementieren
       → Neue Tabelle: applications (id, job_id, user_id, message, status, created_at)
       → "Apply Now" öffnet ein Modal: kurze Nachricht + Bewerbung absenden
       → Status: 'pending' | 'reviewed' | 'accepted' | 'rejected'

[ ] 2. Admin: Jobs hinzufügen & verwalten
       → Im Dashboard: Formular "Neue Stelle ausschreiben"
       → supabase.from('jobs').insert({ title, department, location, type })
       → Job-Verwaltungs-Tab im Admin-Dashboard

[ ] 3. Bewerbungs-Übersicht im Dashboard
       → Tabelle: Wer hat sich auf was beworben?
       → Status-Änderung durch Admin: Dropdown per Row
       → Trigger: E-Mail-Benachrichtigung via Supabase Edge Functions (optional)

[ ] 4. Dashboard-Charts mit echten Zeitreihen
       → Aktuell: activity-Data ist fiktiv (Prozentsätze von total)
       → Neue Query: SELECT DATE(created_at), COUNT(*) FROM profiles GROUP BY DATE
       → Zeige echtes Wachstum der Registrierungen über Zeit

[ ] 5. Job-Filter & Suche auf der Karriere-Seite
       → Filter: Typ (Praktikum / Werkstudent / Vollzeit), Standort
       → Suche: .ilike('title', '%keyword%') in der Query
       → "Filter Options"-Button in Career.jsx ist bereits als Stub vorhanden
```

**Schlüsseldateien:** `src/pages/AdminDashboard.jsx`, `src/pages/Career.jsx`, `supabase/migrations/schema.sql`

---

### Sprint-Planung (Hackathon, ~8 Stunden)

```
00:00 – 01:00   Onboarding
                Alle: repo klonen, .env.local einrichten, npm run dev
                → Ziel: Jeder sieht die Platform lokal laufen

01:00 – 05:00   Hauptentwicklung (parallel)
                A: Route-Guard + Auth-Context + Deployment aufsetzen
                B: Likes + Events + Filter im Feed
                C: Channel-Erstellung + Markdown + Unread-Indikator
                D: Bewerbungsformular + Admin-Jobs-Verwaltung

05:00 – 06:30   Integration & Testing
                → Person A merged alle Branches und löst Konflikte
                → Gemeinsam Supabase-Schema aktualisieren falls neue Tabellen
                → Seed-Script laufen lassen für Demo-Daten

06:30 – 07:30   Demo vorbereiten
                → Alle melden sich mit Test-Accounts an
                → Durchspielen des Demo-Flows (s.u.)
                → Deploy-Link testen

07:30 – 08:00   Puffer / Präsentation
```

---

### Demo-Flow für die Präsentation

```
1. Browser öffnen → /login
2. Als Max Mustermann einloggen (student)
3. → Feed: einen Post schreiben ("Ich freue mich auf das Praktikum!")
4. → Like-Button klicken (Zähler steigt)
5. → Channels: in #general schreiben
6. → (Parallel: Admin-Tab) Als Admin einloggen → Dashboard zeigen
   • Statistiken live: X Users, Y Messages
   • User Funnel Chart
7. → Career: offene Stellen zeigen, auf "Apply Now" klicken
8. → Contacts: Sarah Müller (Specialist) mit rotem Badge zeigen
9. → Admin sendet Nachricht in Channel: erscheint mit rotem "Specialist"-Badge
```

---

## 12. Arbeitsweise & Contribution-Guide

### Wie man an einer neuen Feature arbeitet

**Schritt 1: Immer zuerst das Schema verstehen**

Bevor du Code schreibst, frage dich: Brauche ich eine neue Tabelle oder reicht eine bestehende?
- Neue Tabelle → zu `supabase/migrations/schema.sql` hinzufügen UND im Supabase Dashboard SQL Editor ausführen
- Alle müssen über Schema-Änderungen informiert werden (kurze Nachricht im Team-Chat)

**Schritt 2: Supabase-Abfragen schreiben**

Das Pattern ist immer gleich:

```javascript
// Lesen
const { data, error } = await supabase
  .from('tabelle')
  .select('*, andere_tabelle(feld1, feld2)')   // JOIN via FK
  .eq('spalte', wert)                           // WHERE
  .order('created_at', { ascending: false });   // ORDER BY

if (error) { console.error(error); return; }
setData(data);

// Schreiben
const { error } = await supabase
  .from('tabelle')
  .insert({ spalte1: wert1, spalte2: wert2 });

// Aktualisieren
const { error } = await supabase
  .from('tabelle')
  .update({ spalte: neuerWert })
  .eq('id', rowId);

// Löschen
const { error } = await supabase
  .from('tabelle')
  .delete()
  .eq('id', rowId);
```

**Schritt 3: Neuen Style hinzufügen**

Alle Styles sind in `src/index.css`. Das Design-System basiert auf CSS-Variablen:

```css
/* Würth Rot Farbpalette */
--accent-red: #cc0000;         /* Hauptakzent */
--accent-red-light: #e63636;   /* Hover-Zustand */
--accent-glow: rgba(204,0,0,0.35); /* Box-Shadow Glow */

/* Dark Mode Hintergründe */
--bg-primary: #0c0d10;         /* Seitenbackground */
--bg-secondary: #14151a;       /* Login-Karte */
--bg-card: rgba(20,21,28,0.6); /* Glassmorphismus-Karten */

/* Verfügbare Utility-Klassen */
.card          → Glassmorphismus-Karte mit Hover-Effekt
.btn-primary   → Roter CTA-Button mit Glow
.btn-secondary → Dunkler sekundärer Button
.badge-red     → Rotes Badge (Specialist, Event)
.badge-green   → Grünes Badge (Actively Hiring)
.badge-blue    → Blaues Badge (Student)
.text-accent   → Rote Textfarbe
.animate-fade-in → Fade-in Animation beim Mount
```

**Schritt 4: Eine neue Page anlegen**

```bash
# 1. Datei erstellen
touch src/pages/MeineNeueSeite.jsx

# 2. Grundstruktur
```

```jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function MeineNeueSeite() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data, error } = await supabase.from('tabelle').select('*');
    if (!error) setData(data);
  };

  return (
    <div className="page-content animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Mein Titel</h1>
        <p className="page-description">Beschreibung</p>
      </div>
      {/* Inhalt */}
    </div>
  );
}
```

```jsx
// 3. Route in App.jsx hinzufügen
import MeineNeueSeite from './pages/MeineNeueSeite';
// ...
<Route path="/neu" element={<AppLayout><MeineNeueSeite /></AppLayout>} />

// 4. Navbar-Link in Sidebar.jsx hinzufügen
{ name: 'Neu', path: '/neu', icon: <StarIcon size={16} /> }
```

### Git-Workflow im Team

```bash
# Vor dem Start: immer aktuellen Stand holen
git pull origin main

# Feature-Branch erstellen (Naming: <person>/<feature>)
git checkout -b personB/like-feature

# Regelmäßig committen
git add src/pages/News.jsx
git commit -m "feat: implement like button with counter update"

# Wenn fertig: Branch pushen
git push origin personB/like-feature

# → Person A macht den Merge (um Konflikte zentral zu lösen)
```

**Häufige Konfliktstellen:**
- `supabase/migrations/schema.sql` — wenn zwei Personen neue Tabellen hinzufügen
- `src/App.jsx` — wenn neue Routen hinzukommen
- `src/components/Sidebar.jsx` — wenn neue Navbar-Links hinzukommen

→ Diese Dateien frühzeitig kommunizieren, bevor man sie ändert.

### Supabase Dashboard — Wichtige Stellen

```
app.supabase.com → Projekt öffnen

Table Editor        → Tabellen und Daten direkt ansehen/bearbeiten
                      Gut für: Rollen setzen, Demo-Daten manuell eintragen

SQL Editor          → SQL direkt ausführen
                      Gut für: Schema-Migrations, komplexe Queries testen

Authentication      → Nutzer verwalten, E-Mail-Bestätigung ein/ausschalten
                      Wichtig: "Confirm email" muss DEAKTIVIERT sein für den Hackathon

Database → Replication → Realtime-Events aktivieren
                      Wichtig: messages-Tabelle muss in der Replication-Tabelle sein

Logs                → Was geht schief? Hier nachsehen
```

---

## 13. Bekannte Limitierungen & nächste Schritte

### Sicherheit (vor echtem Launch beheben)

- **Kein Route-Guard** — `/admin/dashboard` ist ohne Login erreichbar
- **Keine Rollen-Prüfung** — Jeder kann Jobs anlegen wenn er die Supabase-API direkt aufruft (RLS-Policy fehlt für INSERT auf jobs)
- **Admin-Dashboard für alle** — sollte nur für `role='admin'` zugänglich sein

### UX-Lücken

- **Mobile:** Navbar verschwindet auf Screens < 768px, kein Hamburger-Menü
- **Leere Zustände:** Wenn keine Posts / Jobs / Contacts vorhanden, gibt es keinen hilfreichen "Noch keine Daten"-State
- **Error Handling:** Die meisten Fehler werden nur `console.error()`-geloggt, nicht dem Nutzer angezeigt
- **Loading States:** Inkonsistent — manche Pages zeigen "Loading...", andere zeigen nichts

### Fehlende Features für MVP+

- Benachrichtigungen (Push oder In-App)
- Bewerbungs-Management für Jobs
- DM (Direkt-Nachrichten) zwischen Nutzern
- Moderations-Tools (Posts / Nachrichten löschen als Admin)
- E-Mail-Integration (Supabase Auth unterstützt Email-Templates)
- Suche über alle Inhalte

---

*Erstellt für den TUM Science Hack / Wörth Hackathon — Juni 2026*
