export default function SudarshanLoader({
  size = 'md',
  px,
  spin = true,
  fast = false,
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg'
  px?: number
  spin?: boolean
  fast?: boolean
  className?: string
}) {
  const dim = px ?? (size === 'sm' ? 56 : size === 'lg' ? 108 : 80)

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
      style={spin ? { willChange: 'transform' } : undefined}
      className={`${spin ? (fast ? 'animate-spin-download' : 'animate-spin-slow') : ''} ${className}`}
      aria-label="Loading"
      role="img"
    >
      {/* 12-toothed serrated outer star */}
      <polygon
        points="100,4 121.5,19.8 148,16.9 158.7,41.3 183.1,52 180.2,78.5 196,100 180.2,121.5 183.1,148 158.7,158.7 148,183.1 121.5,180.2 100,196 78.5,180.2 52,183.1 41.3,158.7 16.9,148 19.8,121.5 4,100 19.8,78.5 16.9,52 41.3,41.3 52,16.9 78.5,19.8"
        fill="#E36414"
      />

      {/* Warm cream disc - no dark blue showing between spokes */}
      <circle cx="100" cy="100" r="82" fill="#FEF5EC" />

      {/* Outer saffron ring */}
      <circle cx="100" cy="100" r="80" fill="none" stroke="#E36414" strokeWidth="2.5" />

      {/* 16 outer lotus petals */}
      {outerPetals.map((angle) => (
        <ellipse
          key={angle}
          cx="100"
          cy="28"
          rx="5"
          ry="11"
          fill="#E36414"
          stroke="#D4A017"
          strokeWidth="0.7"
          transform={`rotate(${angle}, 100, 100)`}
        />
      ))}

      {/* Gold separator ring */}
      <circle cx="100" cy="100" r="62" fill="none" stroke="#D4A017" strokeWidth="2" />

      {/* 8 dark indigo diamond spokes */}
      {spokes.map((angle) => (
        <path
          key={angle}
          d="M 100,41 L 96.5,51 L 100,59 L 103.5,51 Z"
          fill="#2F2A44"
          transform={`rotate(${angle}, 100, 100)`}
        />
      ))}

      {/* 8 saffron inter-spoke dots */}
      {spokeDots.map((angle) => (
        <circle
          key={angle}
          cx="100"
          cy="50"
          r="2.5"
          fill="#E36414"
          transform={`rotate(${angle}, 100, 100)`}
        />
      ))}

      {/* Gold inner ring */}
      <circle cx="100" cy="100" r="40" fill="none" stroke="#D4A017" strokeWidth="2.5" />

      {/* 8 inner terracotta petals */}
      {innerPetals.map((angle) => (
        <ellipse
          key={`i${angle}`}
          cx="100"
          cy="65"
          rx="3.5"
          ry="8"
          fill="#C67D53"
          stroke="#D4A017"
          strokeWidth="0.6"
          transform={`rotate(${angle}, 100, 100)`}
        />
      ))}

      {/* Center hub - dark with gold ring */}
      <circle cx="100" cy="100" r="27" fill="#2F2A44" />
      <circle cx="100" cy="100" r="25" fill="none" stroke="#D4A017" strokeWidth="1.5" />

      {/* Center saffron jewel */}
      <circle cx="100" cy="100" r="16" fill="#E36414" />

      {/* Hub core */}
      <circle cx="100" cy="100" r="9" fill="#2F2A44" />

      {/* Golden dot */}
      <circle cx="100" cy="100" r="5" fill="#D4A017" />
    </svg>
  )
}
