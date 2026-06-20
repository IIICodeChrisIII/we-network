import { getCertificates } from '../lib/certificates';

// Discord-Style Badges, die vor dem Namen stehen. Hover über ein Badge
// zeigt einen Tooltip mit Name, Beschreibung und Aussteller.
export default function CertificateBadges({ profile, max = 4, size = 18 }) {
  const certs = getCertificates(profile);
  if (!certs.length) return null;

  const shown = certs.slice(0, max);
  const extra = certs.length - shown.length;

  return (
    <span className="cert-badges">
      {shown.map((c) => {
        const Icon = c.icon;
        return (
          <span className="cert-badge" key={c.id}>
            <span
              className="cert-badge__chip"
              style={{ width: size, height: size, color: c.color, background: `${c.color}22` }}
            >
              <Icon size={Math.round(size * 0.6)} strokeWidth={2.4} />
            </span>
            <span className="cert-badge__tip" role="tooltip">
              <span className="cert-badge__tip-title">{c.label}</span>
              <span className="cert-badge__tip-desc">{c.description}</span>
              <span className="cert-badge__tip-meta">{c.issuer}{c.date ? ` · ${c.date}` : ''}</span>
            </span>
          </span>
        );
      })}
      {extra > 0 && <span className="cert-badge cert-badge--more">+{extra}</span>}
    </span>
  );
}