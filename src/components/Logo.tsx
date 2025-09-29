import type { FC } from 'react';

interface BtbLogoProps {
  width?: number;
  height?: number;
  className?: string;
  href?: string;
  target?: string;
  bgColor?: string;
  color?: string;
  primaryColor?: string;
  secondaryColor?: string;
  textColor?: string;
  accentColor?: string;
}

const BtbLogo: FC<BtbLogoProps> = ({
  width = 206.9,
  height = 182.093,
  className = "",
  href = "https://www.btbintl.com",
  target = "_self",
  bgColor = "transparent",
  primaryColor = "#2d2b8c",
  secondaryColor = "#1a1940",
  accentColor = "#ff7e29",
  textColor = "#2d2b8c"
}) => {
  const logoContent = (
    <svg
      preserveAspectRatio="xMidYMid meet"
      viewBox="0 0 394.629 211.57"
      height={height}
      width={width}
      className={className}
      style={{ backgroundColor: bgColor }}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="BTB Business Travel Bureau"
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="100%" stopColor={secondaryColor} />
        </linearGradient>
        <clipPath id="clip0">
          <path d="M58 37h137v174.57H58Zm0 0" />
        </clipPath>
      </defs>
      
      <g>
        <path d="M179.84 104.484c-.028.024-.035.028 0 0" fill={textColor} />
        <path d="m179.84 104.484.078-.062-.078.062" fill={textColor} />
        <path d="M0 28.988h50.855V.105H0Zm0 0" fill={accentColor} />
        
        {/* Main logo shape with gradient */}
        <path
          d="M191.5 93.473c-6.844-7.547-16.223-12.739-26.8-14.203.03-6.407.245-25.5.245-25.5-1.097-24.782-31.27-22.016-34.351-22.22l-71.164-.624L58.828 0h70.477c38.11.11 58.05 18.875 60.597 32.602 1.91 10.293 1.414 40.316 1.598 60.87"
          fill="url(#logoGradient)"
        />
        
        <g clipPath="url(#clip0)">
          <path
            d="M164.195 92.176c-7.465-3.973-28.62-5.578-33.234-5.18v25.883s37.703-1.805 36.062 36.11c0 0-.543 33.093-34.972 32.491H84.516L83.383 37.055H58.832V211.57h69.234c12.454 0 24.797-3.148 35.762-9.644 14.602-8.653 29.95-24.723 30.52-54.145 0 0 1.289-20.46-9.356-38.347-4.894-8.227-12.754-12.985-20.797-17.258"
            fill="url(#logoGradient)"
          />
        </g>
        
        <path 
          d="M156.926 112.898h-65V87.055h39.156c14.273 0 25.844 11.57 25.844 25.843" 
          fill={accentColor}
          fillOpacity="0.8"
        />
        
        {/* BTB Text with gradient */}
        <text x="204.08" y="157.798" fill="url(#logoGradient)" fontSize="36" fontWeight="bold" fontFamily="Arial, sans-serif">
          BTB
        </text>
        
        {/* Business Travel text with accent color */}
        <text x="205.632" y="180.798" fill={accentColor} fontSize="13" fontWeight="600" fontFamily="Arial, sans-serif">
          BUSINESS TRAVEL
        </text>
        
        {/* Bureau text with accent color */}
        <text x="205.632" y="203.022" fill={accentColor} fontSize="13" fontWeight="600" fontFamily="Arial, sans-serif">
          BUREAU
        </text>
      </g>
    </svg>
  );

  return href ? (
    <a href={href} target={target} rel={target === "_blank" ? "noopener noreferrer" : undefined}>
      {logoContent}
    </a>
  ) : (
    logoContent
  );
};

export default BtbLogo;
