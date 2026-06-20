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
8. [Channel-System im Detail](#8-channel-system-im-detail)
9. [Projektstruktur](#9-projektstruktur)
10. [Lokales Setup](#10-lokales-setup)
11. [Supabase SQL (einmalig ausführen)](#11-supabase-sql-einmalig-ausführen)
12. [Test-Daten & Utility-Scripts](#12-test-daten--utility-scripts)
13. [Hackathon-Roadmap (4 Personen)](#13-hackathon-roadmap-4-personen)
14. [Arbeitsweise & Contribution-Guide](#14-arbeitsweise--contribution-guide)
15. [Bekannte Limitierungen & nächste Schritte](#15-bekannte-limitierungen--nächste-schritte)

---

## 1. Was ist diese Platform?

Das **WE Network** ist ein internes soziales Netzwerk, das Studierende mit Würth Elektronik verbindet — ähnlich wie LinkedIn, aber speziell für den Würth-Kosmos. Drei Nutzertypen agieren auf derselben Platform:

| Rolle | Beschreibung |
|---|---|
| **Studierende** | Registrieren sich mit ihrer Universität, tauschen sich aus, finden Jobs |
| **Specialists** | Würth-Experten mit rotem Badge im Chat, sichtbar im Kontakte-Verzeichnis |
| **Admin / HR** | Erstellt Channels, sieht das Analytics-Dashboard, kann Rollen setzen |

Ziel: Würth Elektronik als attraktiven Arbeitgeber positionieren, Talent-Pipeline aufbauen und direkten Austausch zwischen Studierenden und Experten ermöglichen.

---

## 2. Aktuelle Features

### Vollständig implementiert

| Feature | Seite | Notizen |
|---|---|---|
| E-Mail/Passwort Login & Registrierung | `/login` | inkl. Uni-Dropdown bei Registrierung |
| Google OAuth | `/login` | Vollständig |
| Shibboleth University SSO | `/login` | Placeholder (Alert) |
| Hochschul-Auswahl (200+ deutsche Unis) | `/login`, `/profile` | Drop-up mit Logo, Name, Stadt |
| News Feed — Posts lesen & erstellen | `/feed` | |
| Kommentare auf Posts (Reddit-Style) | `/feed` | benötigt `comments`-Tabelle in DB |
| Like-Counter anzeigen | `/feed` | Klick zeigt Zahl, erhöht sie noch nicht |
| Live-Chat mit Echtzeit-Updates | `/channels` | WebSocket + 2s Polling |
| Optimistisches UI für Nachrichten | `/channels` | Nachricht erscheint vor Server-Bestätigung |
| Mehrere Chat-Channels | `/channels` | Sidebar mit Kanalwechsel |
| Nur letzte 150 Nachrichten laden | `/channels` | "Ältere laden"-Button oben |
| Admin: Channel erstellen (Popup-Modal) | `/channels` | nur für `role='admin'` sichtbar |
| Uni-spezifische Channels | `/channels` | `uni-<slug>` — nur für passende Studis |
| Suchleiste für Channels | `/channels` | Filter in Echtzeit |
| Profil-Hover-Card | `/channels` | Über Name hovern: Avatar, Uni, Bio, DM-Button |
| Privat-Nachrichten (DM) | `/messages` | Konversationsliste + Echtzeit-Chat |
| DM starten über Hover-Card | `/channels` | Button → navigiert zu `/messages?with=userId` |
| DM starten über Kontakte | `/contacts` | Message-Button navigiert zu `/messages` |
| Profilbild hochladen | `/profile` | Base64 in avatar_url gespeichert |
| Profil bearbeiten | `/profile` | Name, Bio, Status, Uni, Studiengang, Semester |
| Stellenangebote anzeigen | `/career` | |
| Tech Specialists-Verzeichnis | `/contacts` | Message-Button zu DMs verlinkt |
| HR Analytics Dashboard | `/admin/dashboard` | nur für `role='admin'` |
| Echtzeit-Diagramme (Line + Bar) | `/admin/dashboard` | |
| Studenten-Tabelle mit Suche | `/admin/dashboard` | |
| WE Logo in Navbar | Alle | GIF-Logo aus `src/assets/we-logo.gif` |
| Navbar ausblendet beim Scrollen | Alle | Erscheint wieder beim Hochscrollen |

### Stubs / Nicht fertig

- **Likes**: Counter wird angezeigt aber nicht inkrementiert (kein DB-Update)
- **Route-Guard**: Alle Seiten ohne Login erreichbar (kein Auth-Check in `App.jsx`)
- **Shibboleth SSO**: Nur Alert, keine echte SAML-Integration
- **Job-Bewerbung**: "Apply Now" Button ist Stub
- **Mobile Navigation**: Navbar verschwindet auf kleinen Screens, kein Hamburger-Menü

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
Logos:      Google Favicon API (https://www.google.com/s2/favicons?domain=...&sz=64)
```

**Bewusste Design-Entscheidungen:**
- **Kein Backend-Server** — alle DB-Anfragen gehen direkt vom Browser zu Supabase via REST/WebSocket. RLS-Policies schützen die Daten.
- **Kein Tailwind** — alle Styles in `src/index.css` als CSS-Variablen. Glassmorphismus via `backdrop-filter: blur()`.
- **Inline Styles** werden stark genutzt (kein CSS Modules). Für ein Hackathon-MVP akzeptabel.
- **Keine globale State-Lösung** — jede Page holt ihre eigenen Daten direkt via Supabase SDK.

---

## 4. Architektur & Datenfluss

```
┌─────────────────────────────────────────────────────────┐
│                        BROWSER                          │
│                                                         │
│  React SPA (Vite Bundle)                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │ News.jsx │  │Channels  │  │Messages  │  │Admin   │  │
│  │          │  │.jsx      │  │.jsx      │  │Dashbrd │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬────┘  │
│       └─────────────┴─────────────┴─────────────┘       │
│                           │                             │
│  ┌────────────────────────▼────────────────────────┐    │
│  │         supabase.js (SDK Client)                │    │
│  └────────────────────────┬────────────────────────┘    │
└───────────────────────────┼─────────────────────────────┘
                            │ HTTPS + WSS
                  ┌─────────▼──────────┐
                  │   SUPABASE CLOUD   │
                  │                    │
                  │  REST (PostgREST)  │◄── SELECT/INSERT/UPDATE
                  │  Realtime (WS)     │◄── postgres_changes Events
                  │  Auth (GoTrue)     │◄── signIn / signUp / OAuth
                  │  PostgreSQL DB     │
                  └────────────────────┘
```

**Wie Realtime-Chat funktioniert:**

```
1. Nutzer öffnet /channels oder /messages
2. Komponente subscribt: supabase.channel('messages:channel_id=eq.<uuid>')
   → WebSocket-Verbindung zu Supabase Realtime
3. Parallel: setInterval alle 2000ms → Poll für neue Nachrichten via .gt('created_at', lastTimestamp)
4. Anderer Nutzer sendet Nachricht → INSERT in messages-Tabelle
5. Supabase emittiert postgres_changes Event
6. Subscriber empfängt → Nachricht erscheint SOFORT bei allen
   (Optimistic Update: eigene Nachricht erscheint noch vor Server-Bestätigung)
7. Deduplizierung: Poll-Ergebnisse werden gegen vorhandene IDs gefiltert
```

---

## 5. Datenbank-Schema

```sql
-- Alle Tabellen haben Row Level Security (RLS) aktiviert

profiles          -- Erweiterung von auth.users
  id              uuid  PRIMARY KEY (FK → auth.users)
  first_name      text
  last_name       text
  university      text  -- Exakter Name aus GERMAN_UNIVERSITIES Liste
  degree          text
  semester        text
  status          text  -- 'student' | 'intern' | 'working_student' | 'employee'
  role            text  -- 'user' | 'admin' | 'specialist'
  avatar_url      text  -- Base64 Data-URL (lokal gespeichert)
  bio             text
  created_at      timestamptz

channels          -- Chat-Räume aller Typen
  id              uuid  PRIMARY KEY
  name            text  -- 'general' | 'uni-tu-muenchen' | 'dm-abc12345-def67890'
  description     text  -- DMs: 'dm:uuid1:uuid2' (für Teilnehmer-Lookup)
  created_at      timestamptz

messages          -- Chat-Nachrichten (Channels + DMs)
  id              uuid  PRIMARY KEY
  channel_id      uuid  FK → channels
  user_id         uuid  FK → profiles
  content         text
  created_at      timestamptz

posts             -- News Feed Beiträge
  id              uuid  PRIMARY KEY
  author_id       uuid  FK → profiles
  title           text
  content         text
  type            text  -- 'news' | 'event' | 'job'
  likes           integer  DEFAULT 0
  created_at      timestamptz

comments          -- Kommentare auf Posts (muss ggf. noch erstellt werden)
  id              uuid  PRIMARY KEY
  post_id         uuid  FK → posts
  user_id         uuid  FK → profiles
  content         text
  created_at      timestamptz

jobs              -- Stellenangebote (nur über Supabase Dashboard anlegen)
  id              uuid  PRIMARY KEY
  title           text
  department      text
  location        text
  type            text  -- 'internship' | 'working_student' | 'full_time'
  description     text
  created_at      timestamptz
```

**RLS-Policies:**

| Tabelle | Lesen | Schreiben |
|---|---|---|
| profiles | Jeder (auch anonym) | Nur eigenes Profil |
| channels | Jeder | Nur Admins (normale) oder jeder für `dm-%` |
| messages | Jeder | Nur als eingeloggter User |
| posts | Jeder | Nur als eingeloggter User (eigene author_id) |
| comments | Jeder | Nur als eingeloggter User |
| jobs | Jeder | Nur über Supabase Dashboard |

---

## 6. UX-Flow: Wie navigiert ein Nutzer?

```
/login
  ├── Login (E-Mail + Passwort | Google OAuth | Shibboleth Placeholder)
  └── Registrierung
        ├── Vorname, Nachname
        ├── E-Mail, Passwort
        ├── Hochschule (Dropdown, 200+ deutsche Unis mit Logo)
        ├── Studiengang, Semester
        └── → nach Registrierung: erneut einloggen

── TOP NAVBAR ──────────────────────────────────────────────────────────────────
  WE Logo | Feed | Channels | Nachrichten | Kontakte | Karriere | Analytics | Avatar | Logout
────────────────────────────────────────────────────────────────────────────────

/feed — News Feed
  • Posts lesen (neueste zuerst)
  • Eigenen Post schreiben (Titel + Text)
  • Kommentare auf- und zuklappen (Reddit-Style)
  • Like-Zähler (noch nicht funktional beim Klick)

/channels — Live Chat
  ├── Linke Sidebar
  │     • Suchleiste für Channels
  │     • Channel-Liste (sichtbar je nach Rolle und Uni)
  │     • Admin-Button "+" → Popup-Modal zum Channel erstellen
  ├── Chat-Bereich
  │     • Letzte 150 Nachrichten; "Ältere laden"-Button oben
  │     • Nachrichteingabe (Enter oder Button)
  │     • Optimistic UI: eigene Nachricht erscheint sofort
  └── Hover-Card (über Absendernamen hovern)
        • Avatar über rotem Banner
        • Name, Rolle-Badges, Status
        • Uni (mit Logo), Studiengang, Semester, Bio
        • "Nachricht"-Button → /messages?with=userId
        • "Profil"-Button

/messages — Private Nachrichten
  ├── Linke Sidebar: Konversationsliste mit Suche
  │     • Letzter Nachricht-Preview + Zeitstempel
  │     • Neue Konversation via ?with=userId Query-Param
  └── Chat-Bereich
        • Blasen-Design: eigene Nachrichten rechts (rot), andere links
        • Kompakte Gruppierung wenn gleicher Absender < 1 Min. apart
        • Echtzeit via WebSocket + 2s Polling

/contacts — Tech Specialists
  • Kacheln: Initialen-Avatar, Name, Bio
  • "Message"-Button → /messages?with=specialistId

/career — Stellenangebote
  • Karten: Titel, Department, Standort, Typ
  • "Apply Now" (Stub)

/admin/dashboard — HR Analytics (nur für role='admin')
  • 4 Stat-Kacheln: Total Users, Talent Pool, Hires, Messages
  • Line Chart: Platform Activity
  • Bar Chart: User Funnel (Student → Intern → Employee)
  • Tabelle: alle Nutzer mit Suchfeld

/profile — Eigenes Profil
  • Name, Bio, Status-Dropdown
  • Hochschul-Auswahl (Drop-up, 200+ deutsche Unis, Logo + Stadt)
  • Profilbild hochladen (JPG/PNG, max 2MB → Base64)
  • "Save Changes" via Supabase upsert
```

---

## 7. Rollen & Berechtigungen

Das System kennt zwei orthogonale Konzepte:

**`status`** — Karriere-Journey des Nutzers:

| Wert | Bedeutung |
|---|---|
| `student` | An der Uni eingeschrieben |
| `intern` | Praktikant bei Würth |
| `working_student` | Werkstudent bei Würth |
| `employee` | Festangestellter |

**`role`** — Berechtigungen auf der Platform:

| Wert | Berechtigungen |
|---|---|
| `user` | Standard (alle Studierenden). Kann eigene DM-Channels erstellen |
| `specialist` | Wie `user`, aber erscheint im Kontakte-Verzeichnis mit rotem Badge |
| `admin` | Kann beliebige Channels erstellen, sieht Analytics-Dashboard |

**Rollen setzen:**
- Über das Supabase Dashboard: Table Editor → `profiles` → `role`-Feld bearbeiten
- Über das Script: `node create_test_accounts.js`
- Über `check_roles.js`: prüft aktuelle Rollen in der DB

> **Hinweis:** Es gibt noch keinen technischen Route-Guard. Alle Seiten sind ohne Login erreichbar. Das muss vor einem echten Launch gesichert werden.

---

## 8. Channel-System im Detail

Channels haben drei Typen die am Namens-Pattern erkennbar sind:

| Pattern | Beispiel | Sichtbar für |
|---|---|---|
| Normaler Name | `general`, `internships` | Alle Nutzer |
| `uni-<slug>` | `uni-tu-muenchen` | Studis dieser Uni + Admins |
| `dm-<id1>-<id2>` | `dm-abc12345-def67890` | Nur die zwei Teilnehmer |

**Slug-Normalisierung** (`normalizeUni(name)`):
```
"TU München" → "tu-muenchen"
"Universität Hamburg" → "universitat-hamburg"
lowercase → Leerzeichen = Bindestrich → Sonderzeichen entfernt
```

**DM-Channel Beschreibung** enthält die vollen UUIDs beider Teilnehmer:
```
description: "dm:uuid-von-user1:uuid-von-user2"
```
Das erlaubt `Messages.jsx`, alle DM-Konversationen eines Nutzers effizient zu laden.

**Benötigte RLS-Policies** (einmalig im Supabase SQL Editor ausführen — siehe [Abschnitt 11](#11-supabase-sql-einmalig-ausführen)).

---

## 9. Projektstruktur

```
W-rth-Hackathon/
│
├── src/
│   ├── main.jsx              Einstiegspunkt: ReactDOM.render()
│   ├── App.jsx               Router: alle Routen + AppLayout-Wrapper
│   ├── index.css             GESAMTES Styling (CSS-Variablen, Glassmorphismus)
│   │
│   ├── assets/
│   │   ├── we-logo.gif       WE Logo (Navbar)
│   │   ├── we-logo-full.png  Logo Variante
│   │   ├── hero-1.webp       Landing Page Hero-Bilder
│   │   ├── hero-2.avif
│   │   └── hero-3.avif
│   │
│   ├── lib/
│   │   ├── supabase.js       Singleton Supabase-Client (liest .env.local)
│   │   └── universities.js   ~200 deutsche Hochschulen mit Domain für Logo-API
│   │
│   ├── components/
│   │   ├── Sidebar.jsx       Top-Navbar: Logo, Navigation, Avatar, Logout
│   │   └── Footer.jsx        Footer-Komponente
│   │
│   └── pages/
│       ├── Landing.jsx        Startseite mit Hero-Sektion
│       ├── Login.jsx          Login + Registrierung (inkl. Uni-Dropdown)
│       ├── News.jsx           News Feed (Posts + Reddit-Style Kommentare)
│       ├── Channels.jsx       Live-Chat (Admin-Modal, Hover-Card, Uni-Channels)
│       ├── Messages.jsx       Private Nachrichten / DMs
│       ├── Contacts.jsx       Specialists-Verzeichnis
│       ├── Career.jsx         Stellenangebote
│       ├── Profile.jsx        Profil bearbeiten (inkl. Uni-Dropdown)
│       └── AdminDashboard.jsx HR-Metriken + Studenten-Tabelle
│
├── scripts/
│   └── seed-test-users.mjs   Erstellt Demo-Nutzer und befüllt DB mit Testdaten
│
├── check_roles.js             Zeigt aktuelle Rollen aller Nutzer in der DB
├── create_test_accounts.js    Erstellt Test-Accounts mit korrekten Rollen
├── fix_profiles.js            Repariert Profile ohne university/role-Feld
│
├── index.html
├── vite.config.js             (host: true für Netzwerk-Zugriff)
├── package.json
└── .env.local                 (NICHT IM GIT) Supabase-Keys
```

---

## 10. Lokales Setup

### Voraussetzungen
- Node.js ≥ 18
- npm ≥ 9
- Zugang zum Supabase-Projekt (URL + Anon Key)

### Schritt 1: Klonen & installieren

```bash
git clone <repo-url>
cd W-rth-Hackathon
npm install
```

### Schritt 2: Environment Variables

Erstelle `.env.local` im Root:

```env
VITE_SUPABASE_URL=https://bbnvrugxtznxcxjdtszk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJibnZydWd4dHpueGN4amR0c3prIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4OTA5MTYsImV4cCI6MjA5NzQ2NjkxNn0.FGRqcGgMB4cpqoDnqo3cFDTXGD4zcW-BjVoq4YVmmT8
```

> Der Anon-Key ist per Design öffentlich — RLS-Policies schützen die Daten.

### Schritt 3: Dev-Server starten

```bash
npm run dev
# → http://localhost:5173
# → auch über lokales Netzwerk erreichbar (host: true in vite.config.js)
```

### Schritt 4: Production Build

```bash
npm run build    # → /dist
npm run preview  # lokale Vorschau
```

---

## 11. Supabase SQL (einmalig ausführen)

Im **Supabase Dashboard → SQL Editor** ausführen. Nur nötig wenn das Projekt neu ist oder die Policies fehlen.

### Channel Insert Policies

```sql
-- Admins dürfen beliebige Channels erstellen
CREATE POLICY "Admins can create channels." ON public.channels
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Alle eingeloggten User dürfen DM-Channels erstellen
CREATE POLICY "Users can create DM channels." ON public.channels
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND name LIKE 'dm-%'
);
```

Bei Duplicate-Fehler zuerst droppen:

```sql
DROP POLICY IF EXISTS "Admins can create channels." ON public.channels;
DROP POLICY IF EXISTS "Users can create DM channels." ON public.channels;
```

### Comments-Tabelle (für News Feed Kommentare)

```sql
CREATE TABLE IF NOT EXISTS public.comments (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id     uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id     uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content     text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone." ON public.comments
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own comments." ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Realtime für Comments aktivieren
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
```

---

## 12. Test-Daten & Utility-Scripts

### Test-Accounts erstellen

```bash
node create_test_accounts.js
```

### Rollen in DB prüfen

```bash
node check_roles.js
```

### Kaputte Profile reparieren

```bash
node fix_profiles.js
```

### Vollständiger Seed (Posts, Channels, Demo-Daten)

```bash
node scripts/seed-test-users.mjs
```

### Test-Zugangsdaten

| Name | E-Mail | Passwort | Rolle | Status |
|---|---|---|---|---|
| Max Mustermann | max.mustermann@wuerth-test.de | WuerthTest2026! | user | student |
| Anna Schmidt | anna.schmidt@wuerth-test.de | WuerthTest2026! | user | intern |
| Lukas Weber | lukas.weber@wuerth-test.de | WuerthTest2026! | user | student |
| Sarah Müller | sarah.mueller@wuerth-test.de | WuerthTest2026! | specialist | student |
| Admin Würth | admin@wuerth-test.de | WuerthAdmin2026! | admin | employee |

---

## 13. Hackathon-Roadmap (4 Personen)

### Übersicht

```
Person A — Infrastructure & Auth
Person B — Social Features (Feed & Engagement)
Person C — Communication (Chat & Realtime)  ← größtenteils fertig
Person D — HR & Career (Dashboard & Jobs)
```

---

### Person A — Infrastructure & Auth

```
[ ] 1. Route-Guard
       → ProtectedRoute-Wrapper in App.jsx
       → supabase.auth.getSession() → redirect /login wenn kein User
       → Admin-Dashboard: nur mit role='admin' zugänglich

[ ] 2. Auth-State global (Context oder zustand)
       → Verhindert dass jede Page getUser() separat aufruft
       → Navbar, Channels, Messages usw. nutzen denselben User

[ ] 3. Shibboleth SSO (Uni-Login) anbinden
       → Supabase Custom OAuth oder SAML 2.0
       → Mock: .edu/.de Domain-Check reicht für Hackathon

[ ] 4. Deployment
       → Vercel / Netlify: npm run build → /dist hochladen
       → .env.local als Environment Variables eintragen

[ ] 5. Mobile Navigation
       → Aktuell: Navbar blendet sich bei < 768px aus
       → Hamburger-Menü oder Bottom-Tab-Bar
```

**Schlüsseldateien:** `src/App.jsx`, `src/components/Sidebar.jsx`

---

### Person B — Social Features

```
[ ] 1. Like-Funktion (DB-Update)
       → Aktuell: Button zeigt Zahl, macht kein UPDATE
       → supabase.from('posts').update({ likes: post.likes + 1 }).eq('id', id)
       → Bonus: eigene likes-Tabelle um Doppel-Likes zu verhindern

[ ] 2. Post löschen (eigene Posts)
       → DELETE-Button nur wenn post.author_id === currentUser.id
       → supabase.from('posts').delete().eq('id', post.id)

[ ] 3. Post-Filter: News / Events / Jobs
       → Filter-Buttons über dem Feed
       → .eq('type', activeFilter) in der Query

[ ] 4. Event-Post-Typ
       → "Event"-Toggle beim Erstellen → type='event'
       → Event-Posts bekommen Datum-Feld + Event-Badge

[ ] 5. Bild-Upload auf Posts
       → Supabase Storage Bucket 'post-images'
       → URL in posts.image_url speichern
```

**Schlüsseldateien:** `src/pages/News.jsx`

---

### Person C — Communication ✅ (größtenteils fertig)

```
[x] Admin Channel-Erstellung (Popup-Modal)
[x] Uni-spezifische Channels (uni-<slug>)
[x] Profil-Hover-Card mit DM-Button
[x] Private Nachrichten (/messages)
[x] DMs von Contacts-Seite starten

[ ] Ungelesene Nachrichten-Indikator
    → Roter Dot neben Channel wenn neue Nachrichten
    → localStorage: last_read_<channelId> = timestamp

[ ] Nachrichten-Reaktionen (Emojis)
    → Tabelle: reactions (message_id, user_id, emoji)
    → Hover-Menü unter jeder Nachricht

[ ] Markdown in Nachrichten
    → npm install react-markdown
    → **fett**, _kursiv_, `code`
```

**Schlüsseldateien:** `src/pages/Channels.jsx`, `src/pages/Messages.jsx`

---

### Person D — HR & Career

```
[ ] 1. Job-Bewerbung
       → Tabelle: applications (job_id, user_id, message, status)
       → "Apply Now" öffnet Modal mit Kurztext
       → Status: pending | reviewed | accepted | rejected

[ ] 2. Admin: Jobs anlegen
       → Formular im Dashboard oder eigener Tab
       → supabase.from('jobs').insert({ title, department, ... })

[ ] 3. Bewerbungs-Übersicht im Dashboard
       → Wer hat sich auf was beworben?
       → Status per Dropdown änderbar

[ ] 4. Echte Zeitreihen im Chart
       → SELECT DATE(created_at), COUNT(*) FROM profiles GROUP BY DATE
       → Echtes Registrierungs-Wachstum statt Prozentwerte

[ ] 5. Job-Filter & Suche
       → Filter nach Typ (Praktikum / Werkstudent / Vollzeit)
       → Suche: .ilike('title', '%keyword%')
```

**Schlüsseldateien:** `src/pages/AdminDashboard.jsx`, `src/pages/Career.jsx`

---

### Sprint-Plan (Hackathon, ~8 Stunden)

```
00:00 – 01:00   Onboarding
                Alle: repo klonen, .env.local, npm run dev
                Supabase SQL (Abschnitt 11) ausführen
                → Ziel: Jeder sieht Platform lokal

01:00 – 05:00   Entwicklung (parallel)
                A: Route-Guard + Auth-Context + Deployment
                B: Like-Update + Post-Delete + Filter
                C: Unread-Indikator + Reaktionen
                D: Bewerbungsformular + Admin-Jobs

05:00 – 06:30   Integration & Testing
                → Person A merged Branches
                → Seed-Script für Demo-Daten laufen lassen
                → Gemeinsam Supabase-Schema prüfen

06:30 – 07:30   Demo vorbereiten
                → Demo-Flow durchspielen (s.u.)
                → Deploy-Link testen

07:30 – 08:00   Puffer / Präsentation
```

---

### Demo-Flow für die Präsentation

```
1. /login → als Max Mustermann einloggen (student, TU München)
2. /feed  → Post schreiben + Kommentar hinterlassen
3. /channels → in #general schreiben
             → Über einen Namen hovern: Profil-Card zeigen
             → "Nachricht" klicken → DM öffnet sich
4. /messages → DM-Konversation zeigen
5. [2. Tab als Admin] → /admin/dashboard
             → Stats: X Users, Y Messages (live)
             → Neuen Channel erstellen: "uni-tu-muenchen" für TU-Studis
6. [1. Tab als Max] → neuer Channel erscheint in Sidebar
7. /career → offene Stellen zeigen
8. /contacts → Specialist mit rotem Badge zeigen + Message
```

---

## 14. Arbeitsweise & Contribution-Guide

### Supabase-Abfragen — das Standard-Pattern

```javascript
// Lesen mit JOIN
const { data, error } = await supabase
  .from('posts')
  .select('*, profiles(first_name, last_name, role)')
  .order('created_at', { ascending: false })
  .limit(50);
if (error) { console.error(error); return; }
setData(data);

// Schreiben
const { error } = await supabase
  .from('messages')
  .insert({ channel_id, user_id, content });

// Aktualisieren
await supabase.from('profiles').update({ bio }).eq('id', userId);

// Löschen
await supabase.from('posts').delete().eq('id', postId);
```

### Neue Page anlegen

```bash
touch src/pages/NeueSeite.jsx
```

```jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function NeueSeite() {
  const [data, setData] = useState([]);
  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from('tabelle').select('*');
    setData(data || []);
  };

  return (
    <div className="page-content animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Titel</h1>
      </div>
    </div>
  );
}
```

In `App.jsx` Route hinzufügen:
```jsx
import NeueSeite from './pages/NeueSeite';
<Route path="/neu" element={<AppLayout><NeueSeite /></AppLayout>} />
```

In `Sidebar.jsx` Nav-Item hinzufügen:
```jsx
{ name: 'Neu', path: '/neu', icon: <SomeIcon size={16} /> }
```

### Design-System (CSS-Variablen)

```css
/* Farben */
--accent-red: #cc0000;         /* Hauptakzent Würth */
--accent-red-light: #e63636;   /* Hover */
--bg-primary: #0c0d10;         /* Seiten-Background */
--bg-secondary: #14151a;       /* Karten-Hintergrund */
--bg-tertiary: #1e1f26;        /* Input-Felder */

/* Utility-Klassen */
.card            → Glassmorphismus-Karte mit Hover-Effekt
.card-static     → Karte ohne Hover-Animation (für Chat-Panels)
.btn-primary     → Roter CTA-Button
.btn-secondary   → Dunkler Button
.badge-red       → Rotes Badge (Specialist, Event)
.badge-blue      → Blaues Badge
.input-field     → Einheitliches Input-Styling
.page-content    → Scrollbarer Seitenbereich mit Padding
.animate-fade-in → Fade-in beim Mounten
```

### Git-Workflow

```bash
git pull origin main                    # immer zuerst
git checkout -b personB/like-feature    # Feature-Branch
git add src/pages/News.jsx
git commit -m "feat: implement like button with db update"
git push origin personB/like-feature
# → Person A merged
```

**Konflikt-gefährdete Dateien** (vorher kommunizieren):
- `src/App.jsx` — neue Routen
- `src/components/Sidebar.jsx` — neue Nav-Items
- `src/index.css` — neue Styles

### Supabase Dashboard — wichtige Stellen

```
Table Editor    → Daten direkt ansehen/bearbeiten, Rollen setzen
SQL Editor      → Schema-Migrations, neue Policies
Authentication  → Nutzer verwalten; "Confirm email" für Hackathon DEAKTIVIEREN
Database → Replication → messages + comments Tabelle für Realtime aktivieren
Logs            → Fehlersuche
```

---

## 15. Bekannte Limitierungen & nächste Schritte

### Sicherheit (vor echtem Launch)

- **Kein Route-Guard** — `/admin/dashboard` ohne Login erreichbar
- **Kein Rollen-Check im Frontend** — Admin-UI ist sichtbar wenn man die URL kennt
- **Avatar als Base64** — bei vielen Nutzern wird die profiles-Tabelle sehr groß; auf Supabase Storage migrieren

### UX-Lücken

- **Mobile:** Navbar verschwindet auf < 768px, kein Hamburger-Menü
- **DM-Liste zeigt nur Konversationen mit UUIDs in der description** — alte DMs ohne `dm:uuid:uuid`-Format erscheinen nicht in `/messages`
- **Likes** werden angezeigt aber nicht persistiert

### Fehlende Features für MVP+

- Push-Benachrichtigungen (Supabase Edge Functions + Web Push)
- Moderations-Tools (Nachrichten / Posts als Admin löschen)
- Job-Bewerbungen end-to-end
- E-Mail-Benachrichtigungen bei DMs
- Globale Suche über alle Inhalte
- Shibboleth/SAML SSO echte Integration

---

*Erstellt für den TUM Science Hack / Wörth Hackathon — Juni 2026*
