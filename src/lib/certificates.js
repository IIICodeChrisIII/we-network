import {
  GraduationCap, BadgeCheck, Briefcase, Cpu, ShieldCheck, Users,
  BookOpen, Zap, Factory, Trophy, Star,
} from 'lucide-react';

// Kategorien für die Anzeige
export const CATEGORY_LABEL = {
  verification: 'Verifiziert',
  status: 'Status',
  event: 'Event',
};

// Katalog aller Zertifikate / Status (Beispiel-Daten).
// Jedes Zertifikat: id, label, description, icon, color, category, issuer, date(optional).
export const CERTIFICATES = {
  // ── Verifizierung ──────────────────────────────────────────
  stipendiat: {
    id: 'stipendiat', label: 'Verifizierter Stipendiat',
    description: 'Verifiziertes Würth Elektronik Förderstipendium.',
    icon: GraduationCap, color: '#c79a2b', category: 'verification',
    issuer: 'Würth Elektronik', date: 'seit 2025',
  },

  // ── Status ─────────────────────────────────────────────────
  mitarbeiter: {
    id: 'mitarbeiter', label: 'Würth Elektronik Mitarbeiter',
    description: 'Festangestellt bei Würth Elektronik.',
    icon: BadgeCheck, color: '#e2001a', category: 'status', issuer: 'Würth Elektronik',
  },
  praktikant: {
    id: 'praktikant', label: 'Praktikant',
    description: 'Absolviert ein Praktikum bei Würth Elektronik.',
    icon: Briefcase, color: '#e2001a', category: 'status', issuer: 'Würth Elektronik',
  },
  werkstudent: {
    id: 'werkstudent', label: 'Werkstudent',
    description: 'Werkstudent:in bei Würth Elektronik.',
    icon: Briefcase, color: '#e2001a', category: 'status', issuer: 'Würth Elektronik',
  },
  tech_specialist: {
    id: 'tech_specialist', label: 'Tech Specialist',
    description: 'Verifizierter Experte für Mentoring und Fachfragen.',
    icon: Cpu, color: '#6d28d9', category: 'status', issuer: 'Würth Elektronik',
  },
  hr_team: {
    id: 'hr_team', label: 'HR & Talent Team',
    description: 'Mitglied des HR- / Talent-Management-Teams.',
    icon: ShieldCheck, color: '#0f766e', category: 'status', issuer: 'Würth Elektronik',
  },
  network_member: {
    id: 'network_member', label: 'WE Network Mitglied',
    description: 'Teil des Würth Elektronik Student Networks.',
    icon: Users, color: '#475569', category: 'status', issuer: 'WE Network', date: 'seit 2024',
  },

  // ── Events ─────────────────────────────────────────────────
  gastvorlesung_ki: {
    id: 'gastvorlesung_ki', label: 'Gastvorlesung: KI & Embedded Systems',
    description: 'Teilnahme an der Gastvorlesung „KI & Embedded Systems".',
    icon: BookOpen, color: '#1d4ed8', category: 'event', issuer: 'Würth Elektronik', date: '14. Mai 2026',
  },
  gastvorlesung_emv: {
    id: 'gastvorlesung_emv', label: 'Gastvorlesung: EMV-Grundlagen',
    description: 'Teilnahme an der Gastvorlesung zu EMV-Grundlagen.',
    icon: Zap, color: '#0891b2', category: 'event', issuer: 'Würth Elektronik', date: '3. März 2026',
  },
  werksfuehrung: {
    id: 'werksfuehrung', label: 'Werksführung Niedernhall',
    description: 'Besuch und Führung durch das Werk in Niedernhall.',
    icon: Factory, color: '#b45309', category: 'event', issuer: 'Würth Elektronik', date: '28. Nov. 2025',
  },
  power_workshop: {
    id: 'power_workshop', label: 'Power Supply Hardware Design Workshop',
    description: 'Teilnahme am Power Supply Hardware Design Workshop.',
    icon: Cpu, color: '#c2410c', category: 'event', issuer: 'Würth Elektronik', date: '23.–26. Jun. 2026',
  },
  hackathon_2026: {
    id: 'hackathon_2026', label: 'WE Hackathon 2026 – Teilnehmer',
    description: 'Teilnahme am Würth Elektronik Hackathon 2026.',
    icon: Trophy, color: '#ca8a04', category: 'event', issuer: 'Würth Elektronik', date: '20. Jun. 2026',
  },
  embedded_world: {
    id: 'embedded_world', label: 'Embedded World 2026 – Standbesuch',
    description: 'Besuch des Würth Elektronik Messestands auf der Embedded World 2026.',
    icon: Star, color: '#db2777', category: 'event', issuer: 'Würth Elektronik', date: '10. März 2026',
  },
};

const EVENT_IDS = ['gastvorlesung_ki', 'gastvorlesung_emv', 'werksfuehrung', 'power_workshop', 'hackathon_2026', 'embedded_world'];
const ORDER = { verification: 0, status: 1, event: 2 };

// Stabiler Hash aus einem String (FNV-1a)
function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Beispiel-Logik: leitet die Zertifikate einer Person deterministisch ab,
// damit das Feature ohne DB-Änderung sofort funktioniert.
// Später ersetzbar durch eine echte Supabase-Abfrage (z.B. Tabelle user_certificates).
export function getCertificates(profile) {
  if (!profile) return [];
  const seed = String(
    profile.id || `${profile.first_name || ''}-${profile.last_name || ''}-${profile.university || ''}` || 'anon'
  );
  const h = hashSeed(seed);
  const ids = [];

  if (profile.status === 'employee') ids.push('mitarbeiter');
  else if (profile.status === 'intern') ids.push('praktikant');
  else if (profile.status === 'working_student') ids.push('werkstudent');

  if (profile.role === 'specialist') ids.push('tech_specialist');
  if (profile.role === 'admin') ids.push('hr_team');

  ids.push('network_member');

  if (h % 3 === 0) ids.push('stipendiat');

  const eventCount = 1 + (h % 3); // 1..3 Events
  for (let i = 0; i < eventCount; i++) {
    const ev = EVENT_IDS[(h >>> (i * 4)) % EVENT_IDS.length];
    if (!ids.includes(ev)) ids.push(ev);
  }

  return [...new Set(ids)]
    .map((id) => CERTIFICATES[id])
    .filter(Boolean)
    .sort((a, b) => (ORDER[a.category] ?? 9) - (ORDER[b.category] ?? 9));
}
