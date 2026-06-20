# 🚀 WE-Network: Projekt- & Feature-Dokumentation

Diese Dokumentation bietet einen schnellen und einfachen Überblick über die Plattform **WE-Network**. Wir haben diese Anwendung nicht nur als Chat-Tool entworfen, sondern als umfassendes, interaktives Ökosystem, das echte Probleme in der Hardware-Branche löst.

---

## 💡 1. Die Kernidee (Unsere Vision)
Wir bringen drei Zielgruppen zusammen, die oft aneinander vorbeireden:
1. **Studenten & Talente:** Suchen spannende Projekte, Hardware und Jobs.
2. **Tech-Startups:** Suchen kluge Köpfe für Problemlösungen und Recruiting.
3. **Würth Elektronik:** Sucht die Bindung zu Talenten und Innovatoren von morgen.

**Das Ergebnis:** Eine Plattform, auf der Wissen ausgetauscht wird, Engagement belohnt wird und Recruiting völlig natürlich passiert.

---

## ✨ 2. Unsere Top-Features im Detail

Wir haben viel Wert darauf gelegt, nicht nur "Standard"-Funktionen einzubauen, sondern intelligente Features, die den Nutzern einen echten Mehrwert bieten:

### 🎮 Gamification: Das "WE-Nodes" System
Nutzer sollen motiviert werden, aktiv zu sein. Deshalb haben wir eine eigene Plattform-Währung entwickelt: **Die WE-Nodes**.
- **Wie funktioniert das?** Im Hintergrund arbeitet eine smarte Event-Logik (`rewardEvents.js`). Schreibt ein Nutzer eine Chatnachricht oder löst er ein Problem, bekommt er in Echtzeit Nodes gutgeschrieben.
- **Der Mehrwert:** Studenten helfen sich gegenseitig, anstatt passiv zu konsumieren.

### 🛒 Der Hardware Reward Store
Was machen die Studenten mit den gesammelten WE-Nodes? Sie können sie in unserem Store gegen echte Würth-Hardware eintauschen!
- **Produkte:** Vom simplen Lineal über LEDs bis hin zum Sensor-Evaluation-Board.
- **Der Mehrwert für Würth:** Die Hardware landet genau bei den Leuten, die sie für innovative Bastel- und Uni-Projekte einsetzen. Perfektes, zielgerichtetes Sponsoring.

### 🤖 Hardware AI Assistant (Der KI-Bot)
Unten rechts im Store haben wir einen intelligenten Chatbot integriert.
- **Die Funktion:** Studenten können der KI ihr privates Bastelprojekt beschreiben (z.B. "Ich will Feuchtigkeit messen"). Die KI empfiehlt sofort die passenden Sensoren oder Platinen von Würth.
- **Die Umsetzung:** Wir haben einen performanten Mock-Agenten entwickelt, der absolut ausfallsicher und perfekt auf Würth-Bauteile getrimmt ist.

### 🎯 Tech Challenges (B2B Startup Connection)
Startups können im Community-Feed "Tech Challenges" posten.
- **Die Funktion:** Ein Startup sucht eine Lösung (z.B. für ein wasserdichtes Gehäuse). Sie setzen ein Kopfgeld (Bounty) von z.B. 50 WE-Nodes aus.
- **Der Flow:** Ein Student kommentiert seinen Lösungsansatz und kassiert vollautomatisch das Kopfgeld.
- **Der Mehrwert:** Startups bekommen kostenloses Schwarm-Wissen, Studenten bekommen Punkte für Hardware.

### 📊 Admin & HR Analytics Dashboard
Würth Elektronik profitiert immens von diesen Daten.
- **Die Funktion:** Ein eigenes Dashboard für Administratoren und Recruiter.
- **Die Daten:** Wir sehen in Diagrammen, wie viele User aktiv sind, welche Hardware im Store beliebt ist und wer die engagiertesten Problemlöser (Talente) der Plattform sind.
- **Der Mehrwert:** Das ist "Next-Level Recruiting". Man stellt keine unbekannten Bewerber mehr ein, sondern Talente, die man monatelang in der Community bei der Arbeit beobachtet hat.

### 💬 Echtzeit-Kommunikation (Channels)
Ein moderner Chat-Bereich (ähnlich wie Discord).
- **Die Funktion:** Verschiedene Räume für "Praktika", "Tech-Talk" oder allgemeine Fragen.
- **Die Technik:** Dank Supabase WebSockets werden alle Nachrichten bei allen Nutzern in **Echtzeit** ohne Neuladen der Seite angezeigt.

---

## 🎨 3. Design & User Experience (UX)
Wir haben uns bewusst gegen ein langweiliges, klassisches Corporate-Design entschieden. Die Zielgruppe sind junge Studenten und Startups.

*   **Glassmorphismus:** Menüs und Boxen sind leicht transparent und verschwommen (wie Milchglas). Das wirkt extrem hochwertig und modern.
*   **Micro-Animations:** Buttons leuchten auf, Chat-Nachrichten fahren weich herein, und das "Typing..." des Chatbots wirkt dynamisch. Das sorgt dafür, dass sich die Plattform "lebendig" anfühlt.
*   **Graceful Degradation (Fehlertoleranz):** Wir haben den Code so geschrieben, dass die App nicht abstürzt, wenn die Datenbank mal nicht reagiert. Bei fehlenden Punkten werden einfach "0 Nodes" angezeigt, anstatt einen Error zu werfen.

---

## 🛠️ 4. Technische Architektur
Wir haben einen modernen Tech-Stack gewählt:
- **Frontend:** React & Vite für blitzschnelle Ladezeiten.
- **Styling:** Komplett eigenes Vanilla CSS (keine standardisierten Tailwind-Templates), um maximale Kontrolle über die Animationen und das "Würth Rot" zu haben.
- **Backend & Datenbank:** Supabase (PostgreSQL) mit Row-Level-Security (RLS), damit Startups, Admins und Studenten streng getrennte Berechtigungen haben.
