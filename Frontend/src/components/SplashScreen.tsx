import type { ReactNode } from 'react';
import '../styles/splash.css';

interface SplashScreenProps {
  icon: ReactNode;
  title: string;
  description: string;
  methodTags: string[];
  onStart: () => void;
}

export function SplashScreen({ icon, title, description, methodTags, onStart }: SplashScreenProps) {
  return (
    <div className="splash">
      <div className="splash-icon">{icon}</div>
      <div className="splash-title">{title}</div>
      <div className="splash-desc">{description}</div>
      <div className="splash-methods">
        {methodTags.map((tag) => (
          <span key={tag} className="method-tag">{tag}</span>
        ))}
      </div>
      <button className="btn-start" onClick={onStart}>
        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Iniciar módulo
      </button>
    </div>
  );
}
