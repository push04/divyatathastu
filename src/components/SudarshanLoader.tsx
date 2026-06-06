/**
 * Sudarshan Chakra spinning loader — replaces the plain ॐ text spinner.
 * The 12-pointed disc (Vishnu's divine wheel) rotates via animate-spin-slow.
 */
export default function SudarshanLoader({
  size = 'md',
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const dim = size === 'sm' ? 32 : size === 'lg' ? 60 : 44

  return (
    <svg
      width={dim}
      height={dim}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={`animate-spin-slow ${className}`}
      aria-label="Loading"
      role="img"
    >
      {/* 12-pointed outer star rim (6 peaks + 6 valleys) */}
      <polygon
        points="50,5 66.5,21.4 89,27.5 83,50 89,72.5 66.5,78.6 50,95 33.5,78.6 11,72.5 17,50 11,27.5 33.5,21.4"
        fill="#E36414"
      />
      {/* Outer ring */}
      <circle cx="50" cy="50" r="29" fill="none" stroke="#C67D53" strokeWidth="2.5" />
      {/* 6 main spokes */}
      <g stroke="#2F2A44" strokeWidth="3" strokeLinecap="round">
        <line x1="50" y1="50" x2="50" y2="22" />
        <line x1="50" y1="50" x2="74.2" y2="36" />
        <line x1="50" y1="50" x2="74.2" y2="64" />
        <line x1="50" y1="50" x2="50" y2="78" />
        <line x1="50" y1="50" x2="25.8" y2="64" />
        <line x1="50" y1="50" x2="25.8" y2="36" />
      </g>
      {/* Inner decorative ring */}
      <circle cx="50" cy="50" r="14" fill="none" stroke="#C67D53" strokeWidth="2" />
      {/* Center hub */}
      <circle cx="50" cy="50" r="9" fill="#2F2A44" />
      {/* Center jewel */}
      <circle cx="50" cy="50" r="4" fill="#E36414" />
    </svg>
  )
}
