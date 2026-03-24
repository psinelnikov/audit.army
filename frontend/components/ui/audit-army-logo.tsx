interface AuditArmyLogoProps {
  size?: number;
  className?: string;
  gradient?: boolean;
}

export default function AuditArmyLogo({ size = 24, className = "", gradient = false }: AuditArmyLogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Gradient definitions */}
      {gradient && (
        <defs>
          <linearGradient id="camo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.29 0.06 120)" />
            <stop offset="50%" stopColor="oklch(0.42 0.08 85)" />
            <stop offset="100%" stopColor="oklch(0.54 0.08 60)" />
          </linearGradient>
        </defs>
      )}
      
      {/* Rounded square background */}
      <rect 
        x="2" 
        y="2" 
        width="20" 
        height="20" 
        rx="4" 
        ry="4"
        className={gradient ? "stroke-border" : "fill-primary stroke-border"}
        strokeWidth="1"
        fill={gradient ? "url(#camo-gradient)" : undefined}
      />
      
      {/* Star positioned slightly lower */}
      <path 
        d="M12 5l2.18 4.42 4.88 0.71-3.53 3.44 0.83 4.86L12 15.93l-4.36 2.5 0.83-4.86-3.53-3.44 4.88-0.71L12 5z"
        className={gradient ? "stroke-primary-foreground" : "fill-primary-foreground stroke-primary-foreground"}
        strokeWidth="0.5"
        strokeLinejoin="round"
        fill={gradient ? "oklch(0.96 0.02 78)" : undefined}
      />
    </svg>
  );
}
