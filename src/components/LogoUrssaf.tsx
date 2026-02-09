interface LogoUrssafProps {
  className?: string;
  width?: number;
}

const LogoUrssaf = ({ className = "", width = 120 }: LogoUrssafProps) => {
  const height = Math.round(width * 0.33);
  
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 360 120"
      width={width}
      height={height}
      className={className}
      role="img"
      aria-label="URSSAF - Au service de notre protection sociale"
    >
      {/* Blue background bar */}
      <rect x="0" y="0" width="360" height="90" rx="6" fill="#004A8F" />
      
      {/* URSSAF text */}
      <text
        x="180"
        y="62"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="bold"
        fontSize="52"
        fill="#FFFFFF"
        letterSpacing="6"
      >
        URSSAF
      </text>
      
      {/* Tagline */}
      <text
        x="180"
        y="110"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="400"
        fontSize="11"
        fill="currentColor"
        opacity="0.7"
      >
        Au service de notre protection sociale
      </text>
    </svg>
  );
};

export default LogoUrssaf;
