export default function SudarshanLoader({
  size = 'md',
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const dim = size === 'sm' ? 56 : size === 'lg' ? 108 : 80

  const outerPetals = Array.from({ length: 16 }, (_, i) => i * 22.5)
  const innerPetals = Array.from({ length: 8 }, (_, i) => i * 45)
  const spokes = Array.from({ length: 8 }, (_, i) => i * 45)
  const spokeDots = Array.from({ length: 8 }, (_, i) => i * 45 + 22.5)

  return (
    <svg
      width={dim}
      height={dim}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      className={`animate-spin-slow ${className}`}
      aria-label="Loading"
      role="img"
    >
      {/* 12-toothed serrated outer star — weapon edge */}
      <polygon
        points="100,4 121.5,19.8 148,16.9 158.7,41.3 183.1,52 180.2,78.5 196,100 180.2,121.5 183.1,148 158.7,158.7 148,183.1 121.5,180.2 100,196 78.5,180.2 52,183.1 41.3,158.7 16.9,148 19.8,121.5 4,100 19.8,78.5 16.9,52 41.3,41.3 52,16.9 78.5,19.8"
        fill="#F4722B"
      />

      {/* Bright saffron glow ring behind the dark disc */}
      <circle cx="100" cy="100" r="84" fill="#F4722B" opacity="0.18" />

      {/* Main disc — indigo but not pitch black */}
      <circle cx="100" cy="100" r="82" fill="#3B3464" />

      {/* Outer gold rings */}
      <circle cx="100" cy="100" r="80" fill="none" stroke="#F0C040" strokeWidth="3" />
      <circle cx="100" cy="100" r="75" fill="none" stroke="#F0C040" strokeWidth="0.8" opacity="0.5" />

      {/* 16 outer lotus petals — bright saffron */}
      {outerPetals.map((angle) => (
        <ellipse
          key={angle}
          cx="100"
          cy="28"
          rx="5"
          ry="11"
          fill="#F4722B"
          stroke="#F0C040"
          strokeWidth="0.8"
          transform={`rotate(${angle}, 100, 100)`}
        />
      ))}

      {/* Separator rings */}
      <circle cx="100" cy="100" r="62" fill="none" stroke="#F0C040" strokeWidth="2" />
      <circle cx="100" cy="100" r="60" fill="none" stroke="#D4884A" strokeWidth="0.6" opacity="0.7" />

      {/* 8 gold diamond spokes */}
      {spokes.map((angle) => (
        <path
          key={angle}
          d="M 100,41 L 96.5,51 L 100,59 L 103.5,51 Z"
          fill="#F0C040"
          transform={`rotate(${angle}, 100, 100)`}
        />
      ))}

      {/* 8 inter-spoke terracotta dots */}
      {spokeDots.map((angle) => (
        <circle
          key={angle}
          cx="100"
          cy="50"
          r="2.8"
          fill="#D4884A"
          transform={`rotate(${angle}, 100, 100)`}
        />
      ))}

      {/* Inner ring */}
      <circle cx="100" cy="100" r="40" fill="none" stroke="#F0C040" strokeWidth="2.5" />
      <circle cx="100" cy="100" r="37" fill="none" stroke="#D4884A" strokeWidth="0.7" opacity="0.8" />

      {/* 8 inner lotus petals */}
      {innerPetals.map((angle) => (
        <ellipse
          key={`i${angle}`}
          cx="100"
          cy="65"
          rx="3.5"
          ry="8"
          fill="#D4884A"
          stroke="#F0C040"
          strokeWidth="0.7"
          transform={`rotate(${angle}, 100, 100)`}
        />
      ))}

      {/* Center disc */}
      <circle cx="100" cy="100" r="27" fill="#3B3464" />

      {/* Center decorative rings */}
      <circle cx="100" cy="100" r="25" fill="none" stroke="#F0C040" strokeWidth="2" />
      <circle cx="100" cy="100" r="20" fill="none" stroke="#F4722B" strokeWidth="1" opacity="0.8" />

      {/* Center saffron jewel */}
      <circle cx="100" cy="100" r="16" fill="#F4722B" />

      {/* Hub */}
      <circle cx="100" cy="100" r="9" fill="#3B3464" />

      {/* Center golden dot */}
      <circle cx="100" cy="100" r="5" fill="#F0C040" />
    </svg>
  )
}
