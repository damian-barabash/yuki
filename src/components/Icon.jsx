// One line-icon set for the whole UI (24×24, 2px round strokes) — replaces emoji.
const P = {
  home: <><path d="M4 11.2 12 4l8 7.2" /><path d="M6.5 9.8V19a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V9.8" /><path d="M10 20v-4.5a2 2 0 0 1 4 0V20" /></>,
  food: <><path d="M3.5 12.5h17a8.5 8.5 0 0 1-17 0Z" /><path d="M8 8.5c0-1.6 1.4-1.9 1.4-3.5M12 8.5c0-1.6 1.4-1.9 1.4-3.5M16 8.5c0-1.6 1.4-1.9 1.4-3.5" /></>,
  scale: <><rect x="3.5" y="4" width="17" height="16" rx="4" /><path d="M8 9.5a5.6 5.6 0 0 1 8 0" /><path d="m12 12.5 2-3.2" /></>,
  broom: <><path d="m14.5 3.5-4 8" /><path d="M7.2 10.6 14 14l-2.2 5.2c-.5 1.2-1.9 1.6-3 .9l-4.4-2.6c-1.1-.7-1.3-2.1-.5-3.1z" /><path d="m7.5 15.8 3.4 2" /><path d="M18 5.5v3M16.5 7h3M19 13v2M18 14h2" /></>,
  drop: <><path d="M12 3.5s6 6.3 6 10.7a6 6 0 0 1-12 0C6 9.8 12 3.5 12 3.5Z" /><path d="M9.2 14.6a2.9 2.9 0 0 0 2.4 2.7" /></>,
  gear: <><circle cx="12" cy="12" r="3" /><path d="M12 3.2v2.3M12 18.5v2.3M3.2 12h2.3M18.5 12h2.3M5.8 5.8l1.6 1.6M16.6 16.6l1.6 1.6M18.2 5.8l-1.6 1.6M7.4 16.6l-1.6 1.6" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  x: <path d="m6 6 12 12M18 6 6 18" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  right: <path d="m9 5.5 6.5 6.5L9 18.5" />,
  down: <path d="m5.5 9 6.5 6.5L18.5 9" />,
  left: <path d="M15 5.5 8.5 12l6.5 6.5" />,
  calendar: <><rect x="3.5" y="5" width="17" height="15.5" rx="3.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
  star: <path d="m12 3.8 2.5 5.3 5.7.7-4.2 4 1.1 5.7-5.1-2.8-5.1 2.8 1.1-5.7-4.2-4 5.7-.7z" />,
  refresh: <><path d="M19.5 12a7.5 7.5 0 1 1-2.4-5.5" /><path d="M19.8 4v4h-4" /></>,
  print: <><path d="M7 8.5V4h10v4.5" /><rect x="3.5" y="8.5" width="17" height="8" rx="2.5" /><path d="M7 14h10v6H7z" /></>,
  vet: <><path d="M6 3.5v5a4 4 0 0 0 8 0v-5" /><path d="M10 12.5V15a4.5 4.5 0 0 0 9 0v-1.2" /><circle cx="19" cy="11.5" r="2.2" /></>,
  logout: <><path d="M14 4.5H7a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h7" /><path d="M10.5 12H20m-3.5-3.5L20 12l-3.5 3.5" /></>,
  user: <><circle cx="12" cy="8.5" r="4" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></>,
  crown: <path d="m4 8 4 4 4-6.5L16 12l4-4-1.5 10.5h-13z" />,
  lock: <><rect x="5" y="10.5" width="14" height="10" rx="3" /><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" /></>,
  trash: <><path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l.8 12a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4l.8-12" /></>,
  spark: <><path d="M11 3.5 12.6 9 18 10.6 12.6 12.2 11 17.7 9.4 12.2 4 10.6 9.4 9z" /><path d="M18.5 15.5v4M16.5 17.5h4" /></>,
  heart: <path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z" />,
  alert: <><path d="M12 4 3 19.5h18z" /><path d="M12 10v4.5M12 17.3v.2" /></>,
  moon: <path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10Z" />,
  pill: <><rect x="3" y="8" width="18" height="8" rx="4" transform="rotate(-35 12 12)" /><path d="m9.7 8.7 4.6 6.6" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.8" /></>,
}

export default function Icon({ name, size = 22, stroke = 2, className = '', style }) {
  return (
    <svg
      className={`ico ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ display: 'block', flex: '0 0 auto', ...style }}
    >
      {P[name] || null}
    </svg>
  )
}
