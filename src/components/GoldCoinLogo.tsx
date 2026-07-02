import React from "react";

interface GoldCoinLogoProps {
  className?: string;
  size?: number;
}

export const GoldCoinLogo: React.FC<GoldCoinLogoProps> = ({ className = "", size = 48 }) => {
  return (
    <div 
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      id="gold-coin-logo-wrapper"
    >
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full drop-shadow-[0_4px_12px_rgba(245,158,11,0.3)] animate-soft-pulse"
      >
        <defs>
          {/* Gold Bar Gradients */}
          <linearGradient id="goldBarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="30%" stopColor="#F59E0B" />
            <stop offset="70%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#92400E" />
          </linearGradient>
          
          <linearGradient id="goldCoinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="40%" stopColor="#FBBF24" />
            <stop offset="80%" stopColor="#EAB308" />
            <stop offset="100%" stopColor="#CA8A04" />
          </linearGradient>

          <radialGradient id="goldGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Glow */}
        <circle cx="50" cy="50" r="45" fill="url(#goldGlow)" opacity="0.35" />

        {/* Back Gold Bar (Isometric stylized) */}
        <path 
          d="M 25 45 L 65 25 L 75 32 L 35 52 Z" 
          fill="url(#goldBarGrad)" 
          stroke="#78350F" 
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Top reflections for gold bar */}
        <path 
          d="M 25 45 L 65 25 L 68 28 L 30 48 Z" 
          fill="#FEF08A" 
          opacity="0.3"
        />

        {/* Main Stacked Gold Coins */}
        {/* Coin 1 (Bottom stacked left) */}
        <ellipse cx="40" cy="68" rx="20" ry="12" fill="#854D0E" />
        <ellipse cx="40" cy="64" rx="20" ry="12" fill="url(#goldCoinGrad)" stroke="#78350F" strokeWidth="1.5" />
        <ellipse cx="40" cy="64" rx="14" ry="8" fill="none" stroke="#FEF08A" strokeWidth="1" strokeDasharray="3,3" />

        {/* Coin 2 (Middle stacked) */}
        <ellipse cx="55" cy="56" rx="22" ry="13" fill="#854D0E" />
        <ellipse cx="55" cy="52" rx="22" ry="13" fill="url(#goldCoinGrad)" stroke="#78350F" strokeWidth="1.5" />
        <ellipse cx="55" cy="52" rx="16" ry="9" fill="none" stroke="#FEF08A" strokeWidth="1" strokeDasharray="3,3" />
        {/* Embossed Symbol on Center Coin ($/Currency/Gold sign) */}
        <path 
          d="M 52 48 Q 55 45 58 48 Q 61 51 55 54 Q 49 57 52 60" 
          fill="none" 
          stroke="#78350F" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
        />
        <line x1="55" y1="44" x2="55" y2="58" stroke="#78350F" strokeWidth="2" strokeLinecap="round" />

        {/* Shiny Sparkle Stars */}
        <path d="M 75 15 L 77 22 L 84 24 L 77 26 L 75 33 L 73 26 L 66 24 L 73 22 Z" fill="#FFFFFF" />
        <path d="M 22 70 L 23 74 L 27 75 L 23 76 L 22 80 L 21 76 L 17 75 L 21 74 Z" fill="#FFFFFF" />
      </svg>
    </div>
  );
};
