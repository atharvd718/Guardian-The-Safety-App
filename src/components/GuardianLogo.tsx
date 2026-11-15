import React, { useState } from 'react';
import logoImage from '../assets/images/guardian_safety_logo_1794738275547.jpg';

interface GuardianLogoProps {
  size?: number;
  className?: string;
  showWordmark?: boolean;
}

export const GuardianLogo: React.FC<GuardianLogoProps> = ({
  size = 40,
  className = '',
  showWordmark = false,
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div
        style={{ width: size, height: size }}
        className="rounded-2xl overflow-hidden shrink-0 border border-[var(--color-border)] bg-[#FFF5F7] shadow-sm flex items-center justify-center"
      >
        {!imgFailed ? (
          <img
            src={logoImage}
            alt="Guardian Women's Safety Emblem"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
            <rect width="100" height="100" fill="#FFF5F7" />
            <path
              d="M50 14C39 20 27 23 19 25V49C19 69 32 84 50 90C68 84 81 69 81 49V25C73 23 61 20 50 14Z"
              fill="#C2185B"
            />
            <path
              d="M50 38C45 38 41 42 41 47C41 54 50 62 50 62C50 62 59 54 59 47C59 42 55 38 50 38Z"
              fill="#FFFDF9"
            />
          </svg>
        )}
      </div>

      {showWordmark && (
        <span className="font-serif font-bold tracking-tight text-[var(--color-foreground)] whitespace-nowrap">
          Guardian
        </span>
      )}
    </div>
  );
};
