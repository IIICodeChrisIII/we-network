import React from 'react';
import { Link } from 'react-router-dom';
import { Newspaper, MessageSquare, Users, User, Briefcase, BarChart2, ArrowRight } from 'lucide-react';

const brackets = [
  {
    num: '01',
    eyebrow: 'Community',
    title: 'Austausch & News',
    desc: 'Bleib auf dem Laufenden und vernetze dich in Echtzeit mit dem Team.',
    links: [
      { name: 'Feed', path: '/feed', icon: <Newspaper size={18} /> },
      { name: 'Live Channels', path: '/channels', icon: <MessageSquare size={18} /> },
    ],
  },
  {
    num: '02',
    eyebrow: 'Netzwerk',
    title: 'Kontakte & Profil',
    desc: 'Finde Ansprechpartner und Spezialisten und pflege dein eigenes Profil.',
    links: [
      { name: 'Kontakte', path: '/contacts', icon: <Users size={18} /> },
      { name: 'Mein Profil', path: '/profile', icon: <User size={18} /> },
    ],
  },
  {
    num: '03',
    eyebrow: 'Karriere',
    title: 'Praktika & Jobs',
    desc: 'Entdecke Einstiegsmöglichkeiten und offene Stellen bei Würth Elektronik.',
    links: [
      { name: 'Karriereportal', path: '/career', icon: <Briefcase size={18} /> },
    ],
  },
  {
    num: '04',
    eyebrow: 'Insights',
    title: 'HR & Analytics',
    desc: 'Kennzahlen und Auswertungen für Talent Management und HR.',
    links: [
      { name: 'Analytics Dashboard', path: '/admin/dashboard', icon: <BarChart2 size={18} /> },
    ],
  },
];

export default function Landing() {
  return (
    <div className="landing animate-fade-in">
      <div className="landing-hero">
        <span className="landing-hero-eyebrow">WE Network</span>
        <h1 className="landing-hero-title">Willkommen im<br />Würth Elektronik Network</h1>
        <p className="landing-hero-tagline">More than you expect</p>
        <p className="landing-hero-desc">
          Die zentrale Plattform für Studenten, Praktikanten und Mitarbeiter –
          vernetzen, austauschen und Karrieremöglichkeiten entdecken.
        </p>
      </div>

      <div className="bracket-grid">
        {brackets.map((b) => (
          <div className="bracket-card" key={b.num}>
            <span className="bracket-num">{b.num}</span>
            <span className="bracket-eyebrow">{b.eyebrow}</span>
            <h2 className="bracket-title">{b.title}</h2>
            <p className="bracket-desc">{b.desc}</p>
            <div className="bracket-links">
              {b.links.map((l) => (
                <Link to={l.path} className="bracket-link" key={l.path}>
                  <span className="bracket-link-icon">{l.icon}</span>
                  <span className="bracket-link-name">{l.name}</span>
                  <ArrowRight size={16} className="bracket-link-arrow" />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
