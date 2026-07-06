export default function PlugIllustration() {
  return (
    <svg
      viewBox="0 0 800 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-[600px]"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      {/* Shadows */}
      <ellipse cx="310" cy="175" rx="100" ry="8" fill="black" opacity={0.06} />
      <ellipse cx="490" cy="175" rx="100" ry="8" fill="black" opacity={0.06} />

      {/* --- BLUE CABLE (left) --- */}
      {/* Cable wire */}
      <path
        d="M0 90 Q100 90 160 90 Q200 90 210 100 L230 120"
        stroke="#0F5DFF"
        strokeWidth="12"
        strokeLinecap="round"
        fill="none"
      />

      {/* Male plug body */}
      <rect
        x="220"
        y="110"
        width="100"
        height="40"
        rx="10"
        fill="url(#blueGrad)"
        stroke="#0F5DFF"
        strokeWidth="1.5"
      />
      {/* Gloss highlight */}
      <rect
        x="222"
        y="112"
        width="96"
        height="14"
        rx="7"
        fill="white"
        opacity={0.25}
      />
      {/* Prongs (metal pins) */}
      <rect x="320" y="118" width="22" height="6" rx="2" fill="#B0C4DE" />
      <rect x="320" y="136" width="22" height="6" rx="2" fill="#B0C4DE" />
      {/* Prong tips */}
      <rect x="342" y="118" width="4" height="6" rx="1" fill="#8AA8CE" />
      <rect x="342" y="136" width="4" height="6" rx="1" fill="#8AA8CE" />

      {/* Cable entry detail on plug */}
      <rect x="222" y="118" width="8" height="24" rx="2" fill="white" opacity={0.15} />

      {/* --- GREEN SOCKET (right) --- */}
      {/* Cable wire */}
      <path
        d="M800 90 Q700 90 640 90 Q600 90 590 100 L570 120"
        stroke="#2ECC40"
        strokeWidth="12"
        strokeLinecap="round"
        fill="none"
      />

      {/* Female socket body */}
      <rect
        x="480"
        y="110"
        width="100"
        height="40"
        rx="10"
        fill="url(#greenGrad)"
        stroke="#2ECC40"
        strokeWidth="1.5"
      />
      {/* Gloss highlight */}
      <rect
        x="482"
        y="112"
        width="96"
        height="14"
        rx="7"
        fill="white"
        opacity={0.25}
      />
      {/* Socket holes */}
      <rect x="484" y="118" width="20" height="6" rx="2" fill="#1A8A28" />
      <rect x="484" y="136" width="20" height="6" rx="2" fill="#1A8A28" />
      {/* Socket hole depth */}
      <rect x="484" y="118" width="8" height="6" rx="1" fill="#146B1F" />
      <rect x="484" y="136" width="8" height="6" rx="1" fill="#146B1F" />

      {/* Cable entry detail on socket */}
      <rect x="570" y="118" width="8" height="24" rx="2" fill="white" opacity={0.15} />

      {/* --- SPARKS / ENERGY BETWEEN PLUGS --- */}
      {/* Spark 1 - blue */}
      <path
        d="M380 110 L386 100 L392 110 L386 120 Z"
        fill="#4EA5FF"
        opacity={0.7}
      />
      {/* Spark 2 - green */}
      <path
        d="M400 130 L406 118 L412 130 L406 142 Z"
        fill="#2ECC40"
        opacity={0.7}
      />
      {/* Spark 3 - small blue dot */}
      <circle cx="390" cy="140" r="3" fill="#4EA5FF" opacity={0.5} />
      {/* Spark 4 - small green dot */}
      <circle cx="395" cy="105" r="2.5" fill="#2ECC40" opacity={0.5} />
      {/* Spark 5 - tiny */}
      <circle cx="385" cy="128" r="2" fill="#4EA5FF" opacity={0.4} />

      {/* Lightning bolt */}
      <path
        d="M396 114 L393 124 L400 124 L396 136"
        stroke="#F5A623"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity={0.6}
      />

      {/* Gradients */}
      <defs>
        <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4EA5FF" />
          <stop offset="100%" stopColor="#0F5DFF" />
        </linearGradient>
        <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5EE078" />
          <stop offset="100%" stopColor="#2ECC40" />
        </linearGradient>
      </defs>
    </svg>
  )
}
