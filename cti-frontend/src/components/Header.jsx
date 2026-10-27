import { useState } from 'react';
import { ShieldLogo, Icon } from './Icons.jsx';
import StatusIndicator from './StatusIndicator.jsx';
import { ROUTES } from '../lib/routes.js';

export default function Header({ path, navigate }) {
  const [open, setOpen] = useState(false);

  const go = (to) => (event) => {
    event.preventDefault();
    setOpen(false);
    navigate(to);
  };

  return (
    <header className="site-header">
      <div className="container header-top">
        <a className="brand" href="#/" onClick={go('/')}>
          <ShieldLogo />
          <span className="brand-text">
            <strong>AI Cyber Threat Intelligence Agent</strong>
            <small>Known Exploited Vulnerabilities research assistant</small>
          </span>
        </a>
        <div className="header-actions">
          <StatusIndicator />
          <button
            type="button"
            className="menu-toggle"
            aria-expanded={open}
            aria-controls="primary-nav"
            onClick={() => setOpen((v) => !v)}
          >
            <Icon name={open ? 'close' : 'menu'} />
            <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
          </button>
        </div>
      </div>
      <nav id="primary-nav" className={`nav-strip ${open ? 'open' : ''}`} aria-label="Primary">
        <ul className="container nav-list">
          {ROUTES.map((route) => (
            <li key={route.path}>
              <a
                href={`#${route.path}`}
                onClick={go(route.path)}
                className={path === route.path ? 'active' : ''}
                aria-current={path === route.path ? 'page' : undefined}
              >
                {route.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
