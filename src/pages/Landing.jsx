import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Newspaper, MessageSquare, Users, User, Briefcase, BarChart2, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import Footer from '../components/Footer';
import hero1 from '../assets/hero-1.webp';
import hero2 from '../assets/hero-2.avif';
import hero3 from '../assets/hero-3.avif';

const heroImages = [hero1, hero2, hero3];

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
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setSlide((s) => (s + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const goTo = (i) => setSlide((i + heroImages.length) % heroImages.length);

  return (
    <>
      <div className="landing animate-fade-in">
        <div className="landing-hero">
          <div className="hero-slides">
            {heroImages.map((img, i) => (
              <div
                key={i}
                className="hero-slide"
                style={{
                  backgroundImage: `url(${img})`,
                  backgroundPosition: i === 2 ? 'center 25%' : 'center',
                  opacity: i === slide ? 1 : 0,
                }}
              />
            ))}
            <div className="hero-scrim" />
          </div>

          <button className="hero-arrow hero-arrow-prev" onClick={() => goTo(slide - 1)} aria-label="Vorheriges Bild">
            <ChevronLeft size={26} />
          </button>
          <button className="hero-arrow hero-arrow-next" onClick={() => goTo(slide + 1)} aria-label="Nächstes Bild">
            <ChevronRight size={26} />
          </button>

          <div className="hero-content">
            <span className="landing-hero-eyebrow">WE Network</span>
            <h1 className="landing-hero-title">Willkommen im<br />Würth Elektronik Network</h1>
            <p className="landing-hero-tagline">More than you expect</p>
            <p className="landing-hero-desc">
              Die zentrale Plattform für Studenten, Praktikanten und Mitarbeiter –
              vernetzen, austauschen und Karrieremöglichkeiten entdecken.
            </p>
          </div>

          <div className="hero-dots">
            {heroImages.map((_, i) => (
              <button
                key={i}
                className={`hero-dot ${i === slide ? 'active' : ''}`}
                onClick={() => goTo(i)}
                aria-label={`Bild ${i + 1}`}
              />
            ))}
          </div>
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
      <Footer />
    </>
  );
}
