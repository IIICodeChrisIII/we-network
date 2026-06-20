import React, { useState } from 'react';
import { ShoppingBag, Star, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import NodeBalance from '../components/NodeBalance';
import AIAssistant from '../components/AIAssistant';
import { supabase } from '../lib/supabase';

const MOCK_REWARDS = [
  {
    id: 1,
    tier: 1,
    name: 'Würth FR4-PCB-Lineal vergoldet',
    description: 'Hochwertiges PCB-Lineal mit gängigen SMD-Footprints, vergoldeten Kontakten und AWG-Leiterbahnen. Ideal für deinen nächsten Hardware-Hack.',
    price: 500,
    euroPrice: 9.99,
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    stock: 45
  },
  {
    id: 2,
    tier: 2,
    name: 'MagI³C Power-Module Kit',
    description: 'Evaluierungsboard-Kit für die effiziente Spannungswandlung mit unseren MagI³C Power-Modulen. Perfekt für kompakte Designs.',
    price: 1500,
    euroPrice: 49.99,
    image: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=800&q=80',
    stock: 12
  },
  {
    id: 3,
    tier: 2,
    name: 'FeatherWing Sensor-Shield',
    description: 'Ein vielseitiges Sensor-Shield (Temperatur, Feuchtigkeit, Druck) im Feather-Format für dein nächstes IoT-Projekt.',
    price: 1500,
    euroPrice: 34.90,
    image: 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?auto=format&fit=crop&w=800&q=80',
    stock: 8
  },
  {
    id: 4,
    tier: 3,
    name: 'Black-Box Hacker-Kit',
    description: 'Das ultimative Hardware-Hacker Kit. Enthält einen STM32 Nucleo, ein Oszilloskop-Modul, diverse Sensoren und Würth-Bauteile.',
    price: 3000,
    euroPrice: 129.00,
    image: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=80',
    stock: 3
  },
  {
    id: 5,
    tier: 1,
    name: 'WE-MAPI SMD Power Inductor',
    description: 'Kleinste magnetisch geschirmte Leistungsdrossel der Welt. Hohe Strombelastbarkeit für kompakte DC/DC-Wandler.',
    price: 300,
    euroPrice: 5.49,
    image: 'https://images.unsplash.com/photo-1580828343064-fdd4eaa41f04?auto=format&fit=crop&w=800&q=80',
    stock: 120
  },
  {
    id: 6,
    tier: 1,
    name: 'WL-SMDC Waterclear LED',
    description: 'Hochhelle SMD Mono-color Ceramic LED. Perfekt für Statusanzeigen in rauen industriellen Umgebungen.',
    price: 150,
    euroPrice: 2.99,
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
    stock: 500
  },
  {
    id: 7,
    tier: 2,
    name: 'WE-RJ45 LAN Transformer',
    description: '10/100/1000 Base-T RJ45 Buchse mit integrierten Magnetics. Überspannungsschutz und EMI-Filter inklusive.',
    price: 800,
    euroPrice: 12.50,
    image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
    stock: 35
  },
  {
    id: 8,
    tier: 2,
    name: 'WCAP-CSGP MLCC Kondensatoren-Kit',
    description: 'Sortiment an keramischen Vielschichtkondensatoren (MLCC). Verschiedene Kapazitäten in Bauform 0603 und 0805.',
    price: 1200,
    euroPrice: 24.90,
    image: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?auto=format&fit=crop&w=800&q=80',
    stock: 50
  },
  {
    id: 9,
    tier: 3,
    name: 'Sensor-Evaluation-Board',
    description: 'Vollständiges Evaluation-Board mit WE-Sensoren (Beschleunigung, Feuchte, Temperatur, Druck) inkl. I2C/SPI-Schnittstelle.',
    price: 2500,
    euroPrice: 89.00,
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    stock: 10
  },
  {
    id: 10,
    tier: 1,
    name: 'WE-CAIR Luftspule',
    description: 'Hochstrom-Luftspule mit extrem hohem Gütefaktor und niedrigem Gleichstromwiderstand für HF-Anwendungen.',
    price: 400,
    euroPrice: 6.99,
    image: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=800&q=80',
    stock: 200
  }
];

export default function RewardStore() {
  const [user, setUser] = useState(null);
  const [selectedReward, setSelectedReward] = useState(null);
  const [checkoutMode, setCheckoutMode] = useState(null); // 'euro' or 'nodes'
  const [checkoutStatus, setCheckoutStatus] = useState(null);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  const handleCheckout = (reward) => {
    // Phase 3 Simulation
    setCheckoutStatus('processing');
    
    setTimeout(() => {
      // Simulate successful checkout and email trigger
      console.log(`[RewardStore] Triggered Email to Würth Versand for Reward ID: ${reward.id}`);
      setCheckoutStatus('success');
      
      setTimeout(() => {
        setCheckoutStatus(null);
        setCheckoutMode(null);
        setSelectedReward(null);
      }, 3000);
    }, 1500);
  };

  const openCheckout = (reward, mode) => {
    setSelectedReward(reward);
    setCheckoutMode(mode);
  };

  return (
    <div className="page-content animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShoppingBag size={32} color="var(--accent-red)" />
            Produkte
          </h1>
          <p className="page-description">Löse deine verdienten WE-Nodes gegen exklusive Würth-Hardware ein.</p>
        </div>
        <NodeBalance userId={user?.id} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
        {MOCK_REWARDS.map(reward => (
          <div key={reward.id} className="card" style={{ display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
            <div style={{ height: '180px', background: '#e0e0e0', position: 'relative' }}>
              <img src={reward.image} alt={reward.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--bg-glass)', backdropFilter: 'blur(4px)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                <Star size={14} color="var(--accent-red)" fill="var(--accent-red)" />
                Tier {reward.tier}
              </div>
            </div>
            
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--text-primary)' }}>{reward.name}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px', flex: 1, lineHeight: '1.5' }}>
                {reward.description}
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    €{reward.euroPrice.toFixed(2)}
                  </div>
                  <button 
                    className="btn btn-primary" 
                    style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                    onClick={() => openCheckout(reward, 'euro')}
                  >
                    In den Warenkorb
                  </button>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(226, 0, 26, 0.05)', borderRadius: '8px', border: '1px dashed var(--accent-red)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-red)', fontWeight: '600', fontSize: '0.9rem' }}>
                    <Sparkles size={16} />
                    Oder gratis mit Nodes
                  </div>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '6px 12px', fontSize: '0.85rem', borderColor: 'var(--accent-red)', color: 'var(--accent-red)' }}
                    onClick={() => openCheckout(reward, 'nodes')}
                  >
                    {reward.price} Nodes
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Checkout Modal Simulation */}
      {selectedReward && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card animate-fade-in" style={{ width: '90%', maxWidth: '400px', padding: '32px', textAlign: 'center' }}>
            {checkoutStatus === 'success' ? (
              <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
                <CheckCircle size={48} color="var(--accent-green)" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>Bestellung bestätigt!</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Dein {selectedReward.name} macht sich bald auf den Weg. Eine Bestätigung wurde an den Würth-Versand geschickt.</p>
              </div>
            ) : checkoutStatus === 'processing' ? (
              <div>
                <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-red)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                <p>Verarbeite Transaktion...</p>
              </div>
            ) : (
              <div>
                <AlertCircle size={48} color={checkoutMode === 'nodes' ? "var(--accent-red)" : "var(--text-primary)"} style={{ margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '1.4rem', marginBottom: '16px' }}>
                  {checkoutMode === 'nodes' ? 'Mit WE-Nodes bezahlen' : 'Kaufvorgang abschließen'}
                </h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                  {checkoutMode === 'nodes' ? (
                    <>Möchtest du <strong>{selectedReward.price} WE-Nodes</strong> für "{selectedReward.name}" einlösen?</>
                  ) : (
                    <>Möchtest du "{selectedReward.name}" für <strong>€{selectedReward.euroPrice.toFixed(2)}</strong> kaufen?</>
                  )}
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button className="btn btn-secondary" onClick={() => { setSelectedReward(null); setCheckoutMode(null); }}>Abbrechen</button>
                  <button className="btn btn-primary" onClick={() => handleCheckout(selectedReward)}>
                    {checkoutMode === 'nodes' ? 'Jetzt einlösen' : 'Kaufen'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hardware AI Assistant */}
      <AIAssistant />
    </div>
  );
}
