import React from 'react';
import {
  Compass,
  Map,
  Radio,
  Layers,
  Terminal,
  Zap,
} from 'lucide-react';
import type { DBStats, HealthStatus } from '../types';

interface NavbarProps {
  activeTab: 'routes' | 'network' | 'nearby' | 'lines' | 'cypher';
  setActiveTab: (tab: 'routes' | 'network' | 'nearby' | 'lines' | 'cypher') => void;
  health: HealthStatus | null;
  stats: DBStats | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  health,
  stats,
}) => {
  return (
    <header
      className="glass-panel"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 28px',
        flexWrap: 'wrap',
        gap: '16px',
      }}
    >
      {/* Brand & Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #00E59B 0%, #00C885 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#060911',
            boxShadow: '0 0 25px rgba(0, 229, 155, 0.45)',
          }}
        >
          <Zap size={26} strokeWidth={2.5} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '1.35rem',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                color: '#fff',
              }}
            >
              BharatRoute <span style={{ color: 'var(--careem-green)' }}>AI</span>
            </span>
            <span
              style={{
                background: 'rgba(0, 229, 155, 0.12)',
                color: 'var(--careem-green)',
                border: '1px solid rgba(0, 229, 155, 0.3)',
                padding: '2px 8px',
                borderRadius: '999px',
                fontSize: '0.7rem',
                fontWeight: 700,
              }}
            >
              CognoDB Graph
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            All-India Multi-Modal Transit & High-Speed Network
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="nav-tabs">
        <button
          className={`nav-tab-btn ${activeTab === 'routes' ? 'active' : ''}`}
          onClick={() => setActiveTab('routes')}
        >
          <Compass size={16} />
          Route Finder
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'network' ? 'active' : ''}`}
          onClick={() => setActiveTab('network')}
        >
          <Map size={16} />
          All-India Map
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'nearby' ? 'active' : ''}`}
          onClick={() => setActiveTab('nearby')}
        >
          <Radio size={16} />
          Multi-Hop Radius
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'lines' ? 'active' : ''}`}
          onClick={() => setActiveTab('lines')}
        >
          <Layers size={16} />
          Corridors & Hubs
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'cypher' ? 'active' : ''}`}
          onClick={() => setActiveTab('cypher')}
        >
          <Terminal size={16} />
          openCypher
        </button>
      </nav>

      {/* Database Status & Node Stats */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {stats && (
          <div
            style={{
              display: 'flex',
              gap: '12px',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              borderRight: '1px solid var(--border-subtle)',
              paddingRight: '14px',
            }}
          >
            <span>
              <strong style={{ color: 'var(--careem-green)' }}>{stats.stations}</strong> Stations
            </span>
            <span>
              <strong style={{ color: '#fff' }}>{stats.connections}</strong> Edges
            </span>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '999px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.8rem',
            fontWeight: 700,
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: health?.db_connected ? '#00E59B' : '#EF4444',
              boxShadow: health?.db_connected ? '0 0 10px #00E59B' : '0 0 10px #EF4444',
            }}
          />
          <span style={{ color: health?.db_connected ? '#F8FAFC' : '#FCA5A5' }}>
            {health?.db_connected ? 'CognoDB Live' : 'Reconnecting...'}
          </span>
        </div>
      </div>
    </header>
  );
};
