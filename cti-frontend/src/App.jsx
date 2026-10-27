import { useCallback, useEffect, useState } from 'react';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ThreatAnalyst from './pages/ThreatAnalyst.jsx';
import VulnerabilityExplorer from './pages/VulnerabilityExplorer.jsx';
import VulnerabilityDetail from './pages/VulnerabilityDetail.jsx';

import { ROUTES } from './lib/routes.js';

const CVE_PREFIX = '/vulnerabilities/';

function parsePath() {
  const hash = window.location.hash.replace(/^#/, '');
  if (hash.startsWith(CVE_PREFIX)) {
    const cveId = hash.slice(CVE_PREFIX.length);
    // Preserve any ?back= query encoded after the CVE ID
    const [id, query] = cveId.split('?');
    const params = new URLSearchParams(query || '');
    return { route: '__detail__', cveId: id, back: params.get('back') || '/explorer' };
  }
  const route = ROUTES.some((r) => r.path === hash) ? hash : '/';
  return { route, cveId: null, back: null };
}

export default function App() {
  const [state, setState] = useState(parsePath);

  useEffect(() => {
    const onHash = () => {
      setState(parsePath());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = useCallback((to) => {
    window.location.hash = to;
  }, []);

  const { route, cveId, back } = state;
  const isDetail = route === '__detail__';

  return (
    <div className="app">
      <a className="skip-link" href="#main">Skip to main content</a>
      <Header path={isDetail ? '/explorer' : route} navigate={navigate} />
      <main id="main" className="container main">
        {/* Detail page is rendered on demand, not kept mounted */}
        {isDetail ? (
          <VulnerabilityDetail cveId={cveId} navigate={navigate} backHref={back} />
        ) : (
          <>
            {/* Keep the three main pages mounted to preserve state across tab switches */}
            <section hidden={route !== '/'}><Dashboard navigate={navigate} active={route === '/'} /></section>
            <section hidden={route !== '/analyst'}><ThreatAnalyst /></section>
            <section hidden={route !== '/explorer'}><VulnerabilityExplorer navigate={navigate} /></section>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
