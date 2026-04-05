import React from 'react';

interface LogoProps {
  className?: string;
  hideText?: boolean;
}

export const LogoMark: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <svg 
      width="40" 
      height="40" 
      viewBox="0 0 40 40" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`flex-shrink-0 ${className}`}
    >
      <rect width="40" height="40" rx="12" fill="#0F172A" />
      
      {/* SmartGRID - Unique Mesh Pattern */}
      <path d="M10 10H14V14H10V10Z" fill="#00D1FF" fillOpacity="0.6" />
      <path d="M16 10H20V14H16V10Z" fill="#00D1FF" fillOpacity="0.8" />
      <path d="M22 10H26V14H22V10Z" fill="#00D1FF" fillOpacity="0.4" />
      <path d="M28 10H30V14H28V10Z" fill="#00D1FF" fillOpacity="0.2" />
      
      <path d="M10 16H14V20H10V16Z" fill="#00D1FF" fillOpacity="0.9" />
      <path d="M16 16H20V20H16V16Z" fill="#00D1FF" />
      <path d="M22 16H26V20H22V16Z" fill="#00D1FF" fillOpacity="0.7" />
      <path d="M28 16H30V20H28V16Z" fill="#00D1FF" fillOpacity="0.3" />
      
      <path d="M10 22H14V26H10V22Z" fill="#00D1FF" fillOpacity="0.5" />
      <path d="M16 22H20V26H16V22Z" fill="#00D1FF" fillOpacity="0.9" />
      <path d="M22 22H26V26H22V22Z" fill="#00D1FF" />
      <path d="M28 22H30V26H28V22Z" fill="#00D1FF" fillOpacity="0.4" />

      <path d="M10 28H14V30H10V28Z" fill="#00D1FF" fillOpacity="0.2" />
      <path d="M16 28H20V30H16V28Z" fill="#00D1FF" fillOpacity="0.4" />
      <path d="M22 28H26V30H22V28Z" fill="#00D1FF" fillOpacity="0.6" />
      <path d="M28 28H30V30H28V28Z" fill="#00D1FF" fillOpacity="0.8" />
      
      {/* Subtle Glow Effect */}
      <circle cx="20" cy="20" r="12" fill="url(#paint0_radial)" fillOpacity="0.3" />
      
      <defs>
        <radialGradient id="paint0_radial" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(20 20) rotate(90) scale(12)">
          <stop stopColor="#00D1FF" />
          <stop offset="1" stopColor="#00D1FF" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
};

export const Logo: React.FC<LogoProps> = ({ className = "", hideText = false }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoMark />
      
      {!hideText && (
        <div className="flex flex-col justify-center">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00D1FF] leading-none mb-0.5">
            TSC
          </span>
          <span className="text-xl font-black text-slate-900 leading-none tracking-tight">
            SLEEP<span className="text-indigo-600">AUDIT</span> AI
          </span>
        </div>
      )}
    </div>
  );
};
