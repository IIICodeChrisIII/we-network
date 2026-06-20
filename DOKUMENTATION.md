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

---

## 4. Talentpool-Funktion

### Überblick

Die Talentpool-Funktion ermöglicht:
- **Studierende**: Ein Profil mit ihren Skills, belegten Modulen und Karriereinteressen zu erstellen
- **Würth Personalisten (Admins)**: Die Talentpool zu durchsuchen und geeignete Kandidaten zu kontaktieren
- **Admins**: Neue Stellenangebote zu erstellen und zu verwalten

### Neue Datenbank-Tabellen

#### 1. `student_skills`
```sql
- id: UUID (Primärschlüssel)
- student_id: UUID (Referenz zu profiles)
- skill_name: Text (z.B. "Python", "React")
- proficiency_level: Text (beginner, intermediate, advanced)
- created_at: Timestamp
```

#### 2. `student_modules`
```sql
- id: UUID (Primärschlüssel)
- student_id: UUID (Referenz zu profiles)
- module_name: Text (z.B. "Softwareentwicklung I")
- grade: Text (z.B. "1.5")
- semester: Text (z.B. "3")
- created_at: Timestamp
```

#### 3. `talent_profiles`
```sql
- id: UUID (Primärschlüssel)
- student_id: UUID (Unique, Referenz zu profiles)
- interests: JSON (Array mit Positionstypen: "internship", "working_student", "full_time")
- bio: Text (Persönliche Beschreibung)
- availability_date: Date (Verfügbarkeitsdatum)
- created_at: Timestamp
- updated_at: Timestamp
```

### Neue Komponenten

#### 1. **StudentTalentForm.jsx** (`src/components/`)
Formular für Studierende zur Eingabe ihrer Talentpool-Informationen:
- Bio und persönliche Beschreibung
- Karriereinteressen auswählen
- Verfügbarkeitsdatum festlegen
- Skills mit Proficiency-Level hinzufügen
- Belegte Module mit Noten und Semester eingeben

#### 2. **TalentPoolBrowser.jsx** (`src/components/`)
Interface für Personalisten/Admins zum Durchsuchen der Talentpool:
- Filter nach Name/Bio
- Filter nach Positionstyp
- Filter nach Skills
- Detaillierte Ansicht der Studentenprofile mit allen Infos
- Kontakt-Buttons für direkten Zugriff auf Kontaktinfos

#### 3. **JobManagement.jsx** (`src/components/`)
Interface für Admins zur Verwaltung von Stellenangeboten:
- Neue Stellen erstellen (Titel, Abteilung, Standort, Typ, Beschreibung)
- Bestehende Stellen bearbeiten
- Stellen löschen
- Liste aller aktiven Stellenangebote

### Career.jsx überarbeitet

Die Career-Seite zeigt nun je nach Benutzerrolle unterschiedliche Tabs:

**Für alle Nutzer:**
- 📋 **Stellenangebote**: Alle verfügbaren Jobs anschauen

**Für Studierende (status='student'):**
- ✨ **Mein Profil**: StudentTalentForm zum Bearbeiten des Talentpool-Profils

**Für Admins/Recruiter (role='admin'|'specialist'):**
- 👥 **Talentpool**: TalentPoolBrowser zum Durchsuchen von Kandidaten
- ⚙️ **Stellenverwaltung**: JobManagement zur Verwaltung von Angeboten

### Row Level Security (RLS)

Alle neuen Tabellen haben RLS-Policies:
- **student_skills**: Alle können sie sehen, jeder Nutzer kann nur seine eigenen verwalten
- **student_modules**: Alle können sie sehen, jeder Nutzer kann nur seine eigenen verwalten
- **talent_profiles**: Alle können sie sehen, jeder Nutzer kann nur sein eigenes Profil verwalten

### Workflow

1. **Student erstellt Profil**:
   - Navigiert zu Career → "Mein Profil"
   - Füllt Bio, Interessen und Verfügbarkeitsdatum aus
   - Speichert das Profil
   - Fügt Skills mit Proficiency-Level hinzu
   - Fügt belegte Module mit Noten hinzu

2. **Admin sucht im Talentpool**:
   - Navigiert zu Career → "Talentpool"
   - Nutzt Filter zur Suche nach geeigneten Kandidaten
   - Sieht alle Skills, Module und Interessen des Kandidaten
   - Kontaktiert Studierende direkt, wenn eine passende Stelle entsteht

3. **Admin verwaltet Stellen**:
   - Navigiert zu Career → "Stellenverwaltung"
   - Erstellt neue Stellenangebote
   - Bearbeitet oder löscht bestehende Angebote
   - Diese werden dann allen Nutzern in der "Stellenangebote" Sektion angezeigt
