import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Newspaper, MessageSquare, Users, User, Briefcase, BarChart2, ArrowRight, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Footer from '../components/Footer';
import hero1 from '../assets/hero-1.webp';
import hero2 from '../assets/hero-2.avif';
import hero3 from '../assets/hero-3.avif';

const heroImages = [hero1, hero2, hero3];

export default function Landing() {
  const [slide, setSlide] = useState(0);
  const { t } = useTranslation();

  const brackets = [
    {
      num: '01',
      eyebrow: t('landing.eyebrow_1'),
      title: t('landing.title_1'),
      desc: t('landing.desc_1'),
      links: [
        { name: t('landing.link_feed'), path: '/feed', icon: <Newspaper size={18} /> },
        { name: t('landing.link_channels'), path: '/channels', icon: <MessageSquare size={18} /> },
      ],
    },
    {
      num: '02',
      eyebrow: t('landing.eyebrow_2'),
      title: t('landing.title_2'),
      desc: t('landing.desc_2'),
      links: [
        { name: t('landing.link_contacts'), path: '/contacts', icon: <Users size={18} /> },
        { name: t('landing.link_profile'), path: '/profile', icon: <User size={18} /> },
      ],
    },
    {
      num: '03',
      eyebrow: t('landing.eyebrow_3'),
      title: t('landing.title_3'),
      desc: t('landing.desc_3'),
      links: [
        { name: t('landing.link_career'), path: '/career', icon: <Briefcase size={18} /> },
      ],
    },
    {
      num: '04',
      eyebrow: t('landing.eyebrow_4'),
      title: t('landing.title_4'),
      desc: t('landing.desc_4'),
      links: [
        { name: t('landing.link_products'), path: '/network/rewards', icon: <Package size={18} /> },
      ],
    },
  ];

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

          <button className="hero-arrow hero-arrow-prev" onClick={() => goTo(slide - 1)} aria-label={t('landing.prev_img')}>
            <ChevronLeft size={26} />
          </button>
          <button className="hero-arrow hero-arrow-next" onClick={() => goTo(slide + 1)} aria-label={t('landing.next_img')}>
            <ChevronRight size={26} />
          </button>

          <div className="hero-content">
            <span className="landing-hero-eyebrow">WE Network</span>
            <h1 className="landing-hero-title" dangerouslySetInnerHTML={{ __html: t('landing.welcome_html') }} />
            <p className="landing-hero-tagline">{t('landing.tagline')}</p>
            <p className="landing-hero-desc">
              {t('landing.hero_desc')}
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
            <div className="bracket-card" key={b.eyebrow}>
              <span className="bracket-eyebrow">{b.eyebrow}</span>
              <h2 className="bracket-title">{b.title}</h2>
              <p className="bracket-desc">{b.desc}</p>
              <div className="bracket-links">
                {b.links.map((l) => (
                  l.external ? (
                    <a href={l.path} target="_blank" rel="noopener noreferrer" className="bracket-link" key={l.path}>
                      <span className="bracket-link-icon">{l.icon}</span>
                      <span className="bracket-link-name">{l.name}</span>
                      <ArrowRight size={16} className="bracket-link-arrow" />
                    </a>
                  ) : (
                    <Link to={l.path} className="bracket-link" key={l.path}>
                      <span className="bracket-link-icon">{l.icon}</span>
                      <span className="bracket-link-name">{l.name}</span>
                      <ArrowRight size={16} className="bracket-link-arrow" />
                    </Link>
                  )
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
