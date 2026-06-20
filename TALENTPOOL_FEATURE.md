# Talentpool Feature Branch

## Übersicht

Dieser Branch implementiert die vollständige Talentpool-Funktionalität für die Würth Elektronik Network Plattform. Die Funktion ermöglicht es Studierenden, ihre Fähigkeiten und Interessen zu registrieren und Würth-Personalern, potenzielle Kandidaten für offene Stellen zu finden.

## Neue Features

### 1. 📋 Talentpool für Studierende
- **Talentpool-Profil erstellen**: Studierende können ein Profil mit Bio, Karriereinteressen und Verfügbarkeitsdatum erstellen
- **Skills hinzufügen**: Fähigkeiten mit unterschiedlichen Proficiency-Levels (Anfänger, Fortgeschritten, Experte) hinzufügen
- **Module dokumentieren**: Belegte Module mit Noten und Semesterzahl hinzufügen
- **Karriereinteressen**: Interesse an Praktika, HiWi-Stellen oder Vollzeitstellen auswählen

### 2. 👥 Talentpool-Browser für Recruiter/Admins
- **Talente durchsuchen**: Nach Name, Bio, Skills und Positionstyp filtern
- **Detaillierte Kandidatenprofile**: Vollständige Übersicht über Skills, Module und Verfügbarkeit
- **Kontaktaufnahme**: Direkter Zugriff auf Kontaktinformationen

### 3. ⚙️ Stellenverwaltung für Admins
- **Neue Stellen erstellen**: Stellentitel, Abteilung, Standort, Typ und Beschreibung eingeben
- **Stellen bearbeiten**: Bestehende Stellenangebote anpassen
- **Stellen löschen**: Nicht mehr benötigte Angebote entfernen

## Neue Datenbankmodelle

### `student_skills`
```javascript
{
  id: UUID,
  student_id: UUID,
  skill_name: string,
  proficiency_level: 'beginner' | 'intermediate' | 'advanced',
  created_at: timestamp
}
```

### `student_modules`
```javascript
{
  id: UUID,
  student_id: UUID,
  module_name: string,
  grade: string,
  semester: string,
  created_at: timestamp
}
```

### `talent_profiles`
```javascript
{
  id: UUID,
  student_id: UUID (unique),
  interests: JSON,  // Array: ['internship', 'working_student', 'full_time']
  bio: string,
  availability_date: date,
  created_at: timestamp,
  updated_at: timestamp
}
```

## Neue Komponenten

### `src/components/StudentTalentForm.jsx`
Vollständiges Formular für Studierende zur Verwaltung ihres Talentpool-Profils:
- Bio und Persönliche Beschreibung
- Karriereinteressen (Checkboxes für Positionstypen)
- Verfügbarkeitsdatum
- Dynamisches Hinzufügen/Löschen von Skills
- Dynamisches Hinzufügen/Löschen von Modulen
- Automatische Speicherung in Supabase

### `src/components/TalentPoolBrowser.jsx`
Interface für Recruiter/Admins zur Kandidatensuche:
- Mehrere Filteroptionen (Name, Positionstyp, Skills)
- Detaillierte Kandidatenkartenansicht
- Anzeige aller Skills, Module und Verfügbarkeitsdaten
- Kontakt-Buttons für direkten Zugriff

### `src/components/JobManagement.jsx`
Admin-Interface zur Stellenverwaltung:
- Formular zum Erstellen neuer Stellen
- Bearbeitungsmodus für bestehende Stellen
- Löschen von Stellen
- Liste aller Stellenangebote mit Verwaltungsoptionen

## Änderungen an bestehenden Dateien

### `src/pages/Career.jsx`
- Komplett überarbeitet mit Tab-basiertem Interface
- Rollenbasierte Anzeigelogik:
  - **Alle**: Tab "Stellenangebote" zum Anschauen verfügbarer Jobs
  - **Studierende**: Zusätzlich Tab "Mein Profil" (StudentTalentForm)
  - **Admins/Recruiter**: Zusätzlich Tabs "Talentpool" und "Stellenverwaltung"
- Integration aller neuen Komponenten

### `supabase/migrations/schema.sql`
- Drei neue Tabellen hinzugefügt
- RLS-Policies für alle neuen Tabellen
- Row Level Security aktiviert für alle Tabellen

### `DOKUMENTATION.md`
- Neue Sektion "4. Talentpool-Funktion" mit vollständiger Dokumentation

## Workflow

### Für Studierende:
1. Zur Career-Seite navigieren
2. Tab "Mein Profil" auswählen
3. Bio, Interessen und Verfügbarkeitsdatum eintragen
4. Profil speichern
5. Skills mit Proficiency-Level hinzufügen
6. Belegte Module mit Noten dokumentieren

### Für Recruiter/Admins:
1. Zur Career-Seite navigieren
2. Tab "Talentpool" auswählen
3. Nach geeigneten Kandidaten suchen und filtern
4. Kandidatenprofile anschauen und Kontaktieren
5. Alternativ: Tab "Stellenverwaltung" für Job-Verwaltung

## Datenbank-Migrationen

Zwei neue Migration-Dateien wurden hinzugefügt:
1. `schema.sql` - Hauptschema mit allen Tabellen und RLS-Policies
2. `002_insert_demo_jobs.sql` - Demo-Stellenangebote

## Setup-Schritte

1. **Migrationen ausführen** (in Supabase Dashboard):
   - `schema.sql` ausführen
   - `002_insert_demo_jobs.sql` ausführen

2. **Dependencies installieren** (sollten bereits vorhanden sein):
   ```bash
   npm install
   ```

3. **Development Server starten**:
   ```bash
   npm run dev
   ```

## Testing

### Studierende testen:
1. Mit Studierende-Account anmelden
2. Zur Career-Seite gehen
3. "Mein Profil" Tab öffnen
4. Daten eingeben und speichern
5. Skills und Module hinzufügen

### Recruiter testen:
1. Mit Admin/Recruiter-Account anmelden
2. Zur Career-Seite gehen
3. "Talentpool" Tab öffnen
4. Nach eingefütterten Studierenden suchen
5. "Stellenverwaltung" Tab öffnen und neue Stellen erstellen

## Sicherheit (RLS-Policies)

Alle neuen Tabellen haben Row Level Security aktiviert:
- **Lesezugriff**: Alle authentifizierten Benutzer können alle Talentpool-Daten sehen
- **Schreibzugriff**: 
  - Studierende können nur ihre eigenen Skills, Module und Talentpool-Profil verwalten
  - Admins verwalten Jobs über JobManagement

## Bekannte Einschränkungen & Zukünftige Verbesserungen

- [ ] Messaging-System zwischen Recruiter und Kandidaten (aktuell nur "Kontakt"-Button)
- [ ] Matching-Algorithmus für automatische Vorschläge
- [ ] Benachrichtigungen bei neuen Job-Listings für interessierte Kandidaten
- [ ] PDF-Export von Kandidatenprofilen
- [ ] Bewerbungs-Tracking System
- [ ] Erweitertes Filterung und Ranking

## Abhängigkeiten

Keine zusätzlichen Abhängigkeiten benötigt - verwendet bereits vorhandene:
- React 18.3.1
- Supabase 2.108.2
- Lucide-React 1.21.0 (Icons)
- React Router 6.30.4

## Kontakt & Support

Bei Fragen zur Implementierung oder Bugs können diese auf GitHub als Issues gemeldet werden.

