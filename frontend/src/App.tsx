import React, { useState, useEffect } from 'react';
import { RouteFinder } from './components/RouteFinder';
import { NetworkMap } from './components/NetworkMap';
import { NearbyExplorer } from './components/NearbyExplorer';
import { LineViewer } from './components/LineViewer';
import { CypherViewer } from './components/CypherViewer';
import { fetchHealth, fetchStats, fetchStations, fetchLines, findShortestPath } from './api';
import type { Station, TransportLine, DBStats, HealthStatus, RouteResult } from './types';
import {
  MapPin, Layers, Terminal, Map, Radio,
  Compass, RefreshCw, Shield, Clock, Zap,
  Search, ArrowLeftRight, ChevronDown,
} from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'routes' | 'network' | 'nearby' | 'lines' | 'cypher'>('routes');
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [stats, setStats] = useState<DBStats | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [lines, setLines] = useState<TransportLine[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [highlightedPath, setHighlightedPath] = useState<string[]>([]);

  // Hero booking form state
  const [bookingTab, setBookingTab] = useState<'oneway' | 'return'>('oneway');
  const [heroSource, setHeroSource] = useState('del_ndls');
  const [heroDest, setHeroDest] = useState('mum_csmt');
  const [heroLoading, setHeroLoading] = useState(false);
  const [heroResult, setHeroResult] = useState<RouteResult[] | null>(null);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [h, st, stationsData, linesData] = await Promise.all([
        fetchHealth().catch(() => ({ status: 'down', db_connected: false, message: 'Connecting...' })),
        fetchStats().catch(() => null),
        fetchStations().catch(() => []),
        fetchLines().catch(() => []),
      ]);
      setHealth(h);
      setStats(st);
      setStations(stationsData);
      setLines(linesData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadInitialData(); }, []);

  const handleHeroSwap = () => {
    const tmp = heroSource;
    setHeroSource(heroDest);
    setHeroDest(tmp);
  };

  const handleHeroSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroSource || !heroDest || heroSource === heroDest) return;
    setHeroLoading(true);
    setHeroResult(null);
    try {
      const results = await findShortestPath(heroSource, heroDest);
      setHeroResult(results);
      setHighlightedPath([heroSource, heroDest]);
      setActiveTab('routes');
      // Scroll to results
      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch {
      // fall through to route finder
    } finally {
      setHeroLoading(false);
    }
  };

  const handleRouteSelected = (srcId: string, tgtId: string) => {
    setHighlightedPath([srcId, tgtId]);
  };

  const navItems = [
    { id: 'routes' as const, label: 'Route Finder', icon: <Compass size={15} /> },
    { id: 'network' as const, label: 'All-India Map', icon: <Map size={15} /> },
    { id: 'nearby' as const, label: 'Nearby Hubs', icon: <Radio size={15} /> },
    { id: 'lines' as const, label: 'Corridors', icon: <Layers size={15} /> },
    { id: 'cypher' as const, label: 'openCypher', icon: <Terminal size={15} /> },
  ];

  const features = [
    {
      icon: <Shield size={26} />,
      title: 'All-India Coverage',
      desc: 'Delhi, Mumbai, Bengaluru, Chennai, Hyderabad, Kolkata + Vande Bharat inter-city corridors across 106 stations.',
    },
    {
      icon: <Clock size={26} />,
      title: 'Graph-Speed Routing',
      desc: 'openCypher shortest-path traversal on CognoDB returns multi-hop transit paths in under 20ms.',
    },
    {
      icon: <Zap size={26} />,
      title: 'Live Graph Database',
      desc: 'Backed by CognoDB Cloud (Bolt 5.x), a managed graph database with 232+ station connections.',
    },
    {
      icon: <Compass size={26} />,
      title: 'Multi-Modal Routes',
      desc: 'Metro, Suburban Rail, and High-Speed Rail combined. Auto-detects optimal line transfers.',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* ── TOPBAR ── */}
      <div className="topbar">
        <div className="topbar-inner">
          <div className="topbar-left">
            <span className="topbar-item">
              <MapPin size={13} />
              Pan-India Transport Network Explorer
            </span>
            <span className="topbar-item">
              <Zap size={13} />
              CognoDB Bolt 5.x • FastAPI • React
            </span>
          </div>
          <div className="topbar-right">
            {['f', 'tw', 'in', 'yt'].map((s) => (
              <span key={s} className="social-icon">{s[0].toUpperCase()}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── STICKY HEADER ── */}
      <header className="site-header">
        <div className="nav-inner">
          {/* Logo */}
          <a className="nav-logo" href="#" onClick={(e) => { e.preventDefault(); }}>
            <div className="nav-logo-icon">
              <Zap size={22} strokeWidth={2.5} />
            </div>
            <span className="nav-logo-text">
              BharatRoute <span>AI</span>
            </span>
          </a>

          {/* Nav Links */}
          <ul className="nav-links">
            {navItems.map((item) => (
              <li key={item.id} className="nav-link-item">
                <button
                  className={activeTab === item.id ? 'active' : ''}
                  onClick={() => setActiveTab(item.id)}
                >
                  {item.icon} {item.label}
                  <ChevronDown size={13} />
                </button>
              </li>
            ))}
          </ul>

          {/* Right: DB status + search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {stats && (
              <div className="stats-pill">
                {stats.stations} Stations • {stats.connections} Edges
              </div>
            )}
            <div className="nav-db-badge">
              <span className="db-dot" />
              {loading ? 'Connecting…' : health?.db_connected ? 'CognoDB Live' : 'Reconnecting…'}
            </div>
            {!health?.db_connected && !loading && (
              <button className="nav-search-btn" onClick={loadInitialData} title="Retry connection">
                <RefreshCw size={15} />
              </button>
            )}
            <button className="nav-search-btn" title="Search">
              <Search size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <section className="hero-section">
        <div className="hero-bg" />
        <div className="hero-content-wrapper">
          {/* Hero copy */}
          <div className="hero-text">
            <h1>
              Explore Every Route<br />Across <em>India</em>
            </h1>
            <p>
              Plan seamless journeys across Metro Corridors, Suburban Networks, and
              High-Speed Vande Bharat routes — powered by <strong>CognoDB Graph Database</strong> and openCypher traversal.
            </p>
            <button className="hero-read-more" onClick={() => document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' })}>
              Read More →
            </button>
          </div>

          {/* ── FLOATING BOOKING CARD ── */}
          <div className="booking-card">
            <div className="booking-tabs">
              <button
                className={`booking-tab ${bookingTab === 'oneway' ? 'active' : ''}`}
                onClick={() => setBookingTab('oneway')}
              >
                One-Way
              </button>
              <button
                className={`booking-tab ${bookingTab === 'return' ? 'active' : ''}`}
                onClick={() => setBookingTab('return')}
              >
                Return
              </button>
            </div>

            <div className="booking-body">
              <p className="booking-hint">Fill in the details below to find your route</p>

              <form onSubmit={handleHeroSearch}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-body)', display: 'block', marginBottom: '5px' }}>
                      From station, city or location
                    </label>
                    <select
                      className="booking-select"
                      value={heroSource}
                      onChange={(e) => setHeroSource(e.target.value)}
                    >
                      {stations.length === 0 && <option value="del_ndls">New Delhi (DEL)</option>}
                      {stations.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} — {s.city}</option>
                      ))}
                    </select>
                  </div>

                  <button type="button" className="booking-swap-btn" onClick={handleHeroSwap} title="Swap">
                    <ArrowLeftRight size={16} />
                  </button>

                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-body)', display: 'block', marginBottom: '5px' }}>
                      To station, city or location
                    </label>
                    <select
                      className="booking-select"
                      value={heroDest}
                      onChange={(e) => setHeroDest(e.target.value)}
                    >
                      {stations.length === 0 && <option value="mum_csmt">Mumbai CSMT</option>}
                      {stations.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} — {s.city}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <label className="booking-checkbox" style={{ marginBottom: '10px' }}>
                  <input type="checkbox" defaultChecked /> Add Nearby Stations
                </label>

                <div className="booking-fields-grid">
                  <div className="booking-field">
                    <label>Journey Mode</label>
                    <select className="booking-select">
                      <option>Shortest Path</option>
                      <option>Fewest Transfers</option>
                      <option>Express / High-Speed</option>
                    </select>
                  </div>
                  <div className="booking-field">
                    <label>Passengers</label>
                    <input type="number" className="booking-input" defaultValue={1} min={1} max={9} />
                  </div>
                </div>

                <label className="booking-checkbox" style={{ marginBottom: '14px' }}>
                  <input type="checkbox" /> Find by location on map
                </label>

                <button type="submit" className="booking-submit-btn" disabled={heroLoading || heroSource === heroDest}>
                  {heroLoading ? (
                    <><div className="spinner" /> Searching Graph...</>
                  ) : (
                    <><Search size={17} /> FIND ROUTE</>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES STRIP ── */}
      <section className="features-strip">
        <div className="features-strip-inner">
          {features.map((f, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-text">
                <h4>{f.title}</h4>
                <p>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CONTENT TABS SECTION ── */}
      <div id="results-section" className="page-wrapper">
        {/* Tab bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 className="section-title">
              {navItems.find(n => n.id === activeTab)?.label}
              <span> — BharatRoute AI</span>
            </h2>
            <p className="section-subtitle">CognoDB Graph Database • openCypher • Bolt 5.x Protocol</p>
          </div>
          <nav className="nav-tabs">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`nav-tab-btn ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab panels */}
        {activeTab === 'routes' && (
          <RouteFinder
            stations={stations}
            onSelectRouteStations={handleRouteSelected}
            initialSource={heroSource}
            initialDest={heroDest}
            preloadedRoutes={heroResult}
          />
        )}
        {activeTab === 'network' && (
          <NetworkMap stations={stations} lines={lines} highlightedPath={highlightedPath} />
        )}
        {activeTab === 'nearby' && <NearbyExplorer stations={stations} />}
        {activeTab === 'lines' && <LineViewer lines={lines} />}
        {activeTab === 'cypher' && <CypherViewer />}
      </div>

      {/* ── FOOTER ── */}
      <footer className="site-footer">
        <div className="footer-inner">
          <div>
            <div className="footer-brand">BharatRoute <span>AI</span></div>
            <div style={{ fontSize: '0.78rem', marginTop: '4px' }}>
              Powered by CognoDB Cloud • openCypher • FastAPI • React + TypeScript
            </div>
          </div>
          <div className="footer-links">
            <span onClick={() => setActiveTab('routes')}>Route Finder</span>
            <span onClick={() => setActiveTab('network')}>All-India Map</span>
            <span onClick={() => setActiveTab('cypher')}>openCypher</span>
            <span>GitHub</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
