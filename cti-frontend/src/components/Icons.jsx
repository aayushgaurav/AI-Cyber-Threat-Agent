export function ShieldLogo({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="AI Cyber Threat Intelligence Agent logo">
      <path d="M32 4 8 13v17c0 15 10 26 24 30 14-4 24-15 24-30V13z" fill="#075687" />
      <path d="M32 10 14 17v13c0 11 7 20 18 24 11-4 18-13 18-24V17z" fill="#0788C9" />
      <circle cx="32" cy="29" r="7" fill="none" stroke="#fff" strokeWidth="3" />
      <path d="M32 36v10M26 41h12" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

const paths = {
  dashboard: 'M3 13h8V3H3zm0 8h8v-6H3zm10 0h8V11h-8zm0-18v6h8V3z',
  analyst: 'M4 4h16v12H8l-4 4zM8 8h8M8 12h5',
  search: 'M10 4a6 6 0 1 0 3.5 10.9L19 20.4 20.4 19l-5.5-5.5A6 6 0 0 0 10 4z',
  database: 'M12 3c-4.4 0-8 1.3-8 3v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6c0-1.7-3.6-3-8-3zm0 2c3.3 0 6 .8 6 1s-2.7 1-6 1-6-.8-6-1 2.7-1 6-1z',
  pulse: 'M3 12h4l3-8 4 16 3-8h4',
  source: 'M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5z',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  alert: 'M12 3 2 21h20zM12 10v5M12 18v.01',
  chevron: 'M6 9l6 6 6-6',
  menu: 'M4 6h16M4 12h16M4 18h16',
  close: 'M6 6l12 12M18 6 6 18',
  send: 'M3 11 21 3l-8 18-2-7z',
  info: 'M12 8v.01M11 12h1v5h1M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z',
};

export function Icon({ name, size = 20, className = '' }) {
  const d = paths[name];
  const filled = name === 'dashboard' || name === 'database' || name === 'source';
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}
