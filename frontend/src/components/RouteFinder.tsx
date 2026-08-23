import React, { useState, useMemo } from 'react';
import {
  Compass,
  ArrowLeftRight,
  Clock,
  MapPin,
  Search,
  AlertCircle,
  ShieldCheck,
  Train,
  TrainFront,
  Coins,
  Leaf,
  Share2,
  Star,
} from 'lucide-react';
import type { Station, RouteResult } from '../types';
import { findShortestPath } from '../api';

interface RouteFinderProps {
  stations: Station[];
  onSelectRouteStations?: (sourceId: string, targetId: string) => void;
  initialSource?: string;
  initialDest?: string;
  preloadedRoutes?: RouteResult[] | null;
}

export const RouteFinder: React.FC<RouteFinderProps> = ({
  stations,
  onSelectRouteStations,
  initialSource = 'del_ndls',
  initialDest = 'mum_csmt',
  preloadedRoutes = null,
}) => {
  const [sourceId, setSourceId] = useState<string>(initialSource);
  const [targetId, setTargetId] = useState<string>(initialDest);
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(false);
  const [routes, setRoutes] = useState<RouteResult[] | null>(preloadedRoutes);
  const [error, setError] = useState<string | null>(null);

  const filteredStations = useMemo(() => {
    return stations.filter((s) =>
      selectedCityFilter === 'ALL' ||
      s.city.toLowerCase().includes(selectedCityFilter.toLowerCase())
    );
  }, [stations, selectedCityFilter]);

  const handleSwap = () => {
    setSourceId(targetId);
    setTargetId(sourceId);
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!sourceId || !targetId) return;
    if (sourceId === targetId) {
      setError('Origin and destination cannot be the same station.');
      setRoutes(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const results = await findShortestPath(sourceId, targetId);
      setRoutes(results);
      if (onSelectRouteStations) onSelectRouteStations(sourceId, targetId);
    } catch (err: any) {
      setError(err.message || 'No path found between selected stations in the graph.');
      setRoutes(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePreset = (src: string, tgt: string) => {
    setSourceId(src);
    setTargetId(tgt);
  };

  const getModeIcon = (type: string) =>
    type === 'high_speed'
      ? <Train size={15} color="#FF6B00" />
      : <TrainFront size={15} color="#2ECC71" />;

  const getEstimatedFare = (dist: number, isHS: boolean) =>
    isHS ? Math.max(120, Math.round(dist * 2.2)) : Math.max(20, Math.round(dist * 3.5));

  const getCarbonSaved = (dist: number) => (dist * 0.14).toFixed(1);

  const presets = [
    { src: 'del_ndls', tgt: 'mum_csmt',      label: 'Delhi → Mumbai Express',        tag: 'Vande Bharat',    color: '#FF6B00' },
    { src: 'blr_majestic', tgt: 'chn_central', label: 'Bengaluru → Chennai',          tag: 'High-Speed Rail', color: '#3B82F6' },
    { src: 'del_ndls', tgt: 'del_cyber_city',  label: 'New Delhi → Gurgaon City',    tag: 'Yellow Line',     color: '#F59E0B' },
    { src: 'kol_howrah', tgt: 'kol_salt_lake_v', label: 'Howrah → Salt Lake Sec V', tag: 'Underwater Metro', color: '#2ECC71' },
    { src: 'mum_bandra', tgt: 'pun_hinjawadi', label: 'Mumbai BKC → Pune IT Hub',   tag: 'Express Corridor', color: '#8B5CF6' },
  ];

  return (
    <div className="main-grid">
      {/* ── LEFT: Controls ── */}
      <div className="card">
        <div className="card-body">
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '10px',
              background: 'var(--primary-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--primary)',
            }}>
              <Compass size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                Plan Your Route
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                CognoDB openCypher shortest-path engine
              </p>
            </div>
          </div>

          {/* City Filter */}
          <div style={{ marginBottom: '18px' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Filter by Region:
            </p>
            <div className="city-pill-strip">
              {['ALL', 'Delhi', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune'].map((city) => (
                <button
                  key={city}
                  type="button"
                  className={`city-pill ${selectedCityFilter === city ? 'active' : ''}`}
                  onClick={() => setSelectedCityFilter(city)}
                >
                  {city === 'ALL' ? '🇮🇳 Pan-India' : city}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSearch}>
            <div className="form-group">
              <label className="form-label">
                <MapPin size={13} color="var(--primary)" /> Origin — From
              </label>
              <select className="select-input" value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
                {filteredStations.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} — {s.city}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', margin: '-4px 0 12px' }}>
              <button type="button" className="btn-secondary" onClick={handleSwap} style={{ padding: '7px 16px', width: 'auto' }}>
                <ArrowLeftRight size={14} /> Swap Stations
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">
                <MapPin size={13} color="#EF4444" /> Destination — To
              </label>
              <select className="select-input" value={targetId} onChange={(e) => setTargetId(e.target.value)}>
                {filteredStations.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} — {s.city}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !sourceId || !targetId || sourceId === targetId}
              style={{ marginTop: '8px' }}
            >
              {loading ? (
                <><div className="spinner" style={{ borderTopColor: '#fff' }} /> Graph Traversal Running…</>
              ) : (
                <><Search size={17} /> Find Shortest Route</>
              )}
            </button>
          </form>

          {/* Presets */}
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '10px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              ⚡ Popular Routes:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {presets.map((p, i) => (
                <button
                  key={i}
                  className="btn-secondary"
                  style={{ justifyContent: 'space-between', fontSize: '0.82rem', padding: '9px 14px' }}
                  onClick={() => handlePreset(p.src, p.tgt)}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Train size={13} color={p.color} /> {p.label}
                  </span>
                  <span style={{
                    padding: '2px 8px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700,
                    background: `${p.color}18`, color: p.color, border: `1px solid ${p.color}40`,
                  }}>
                    {p.tag}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Results ── */}
      <div className="card">
        <div className="card-body">

          {/* Loading skeleton */}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="skeleton" style={{ height: '44px', width: '60%' }} />
              <div className="skeleton" style={{ height: '100px' }} />
              <div className="skeleton" style={{ height: '180px' }} />
              <div className="skeleton" style={{ height: '140px' }} />
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="alert alert-error">
              <AlertCircle size={22} color="#B91C1C" />
              <div>
                <strong>No Route Found</strong>
                <p style={{ fontSize: '0.85rem', marginTop: '3px' }}>{error}</p>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && !routes && (
            <div className="empty-state">
              <div className="empty-icon"><Search size={34} /></div>
              <h3>Find Any Route Across India</h3>
              <p>
                Select your origin and destination, then click <strong>Find Shortest Route</strong>.
                CognoDB calculates the graph-shortest path across 106 stations and 232 connections in milliseconds.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
                {['Metro', 'Suburban Rail', 'Vande Bharat', 'High-Speed'].map((t) => (
                  <span key={t} style={{
                    padding: '5px 14px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700,
                    background: 'var(--primary-light)', color: 'var(--primary)',
                    border: '1px solid rgba(255,107,0,0.2)',
                  }}>{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {!loading && routes && routes.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {routes.map((route, rIdx) => {
                const hasHS = route.segments.some((s) => s.line_type === 'high_speed');
                const estFare = getEstimatedFare(route.total_distance, hasHS);
                const co2 = getCarbonSaved(route.total_distance);

                return (
                  <div key={rIdx}>
                    {/* Route badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Star size={16} color="var(--primary)" fill="var(--primary)" />
                        <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-dark)' }}>
                          Optimal Route Found
                        </span>
                      </div>
                      <button className="btn-secondary" style={{ padding: '6px 12px', width: 'auto', fontSize: '0.8rem' }}>
                        <Share2 size={13} /> Share
                      </button>
                    </div>

                    {/* Metric cards */}
                    <div className="metric-grid" style={{ marginBottom: '16px' }}>
                      <div className="metric-card" style={{ borderLeftColor: 'var(--primary)', borderLeftWidth: '3px' }}>
                        <div className="metric-label" style={{ color: 'var(--primary)' }}>
                          <Clock size={11} style={{ display: 'inline', marginRight: '4px' }} />
                          DURATION
                        </div>
                        <div className="metric-value">
                          {route.total_time >= 60
                            ? `${Math.floor(route.total_time / 60)}h ${route.total_time % 60}m`
                            : `${route.total_time} min`}
                        </div>
                      </div>

                      <div className="metric-card" style={{ borderLeftColor: '#3B82F6', borderLeftWidth: '3px' }}>
                        <div className="metric-label" style={{ color: '#3B82F6' }}>
                          DISTANCE
                        </div>
                        <div className="metric-value">{route.total_distance.toFixed(1)} km</div>
                      </div>

                      <div className="metric-card" style={{ borderLeftColor: '#F59E0B', borderLeftWidth: '3px' }}>
                        <div className="metric-label" style={{ color: '#F59E0B' }}>
                          <Coins size={11} style={{ display: 'inline', marginRight: '4px' }} />
                          EST. FARE
                        </div>
                        <div className="metric-value">₹{estFare}</div>
                      </div>

                      <div className="metric-card" style={{ borderLeftColor: '#2ECC71', borderLeftWidth: '3px' }}>
                        <div className="metric-label" style={{ color: '#2ECC71' }}>
                          <Leaf size={11} style={{ display: 'inline', marginRight: '4px' }} />
                          CO₂ SAVED
                        </div>
                        <div className="metric-value">{co2} kg</div>
                      </div>
                    </div>

                    {/* Transfers info */}
                    <div className="alert alert-info" style={{ marginBottom: '20px' }}>
                      <ShieldCheck size={18} color="var(--primary)" />
                      <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                        {route.transfers === 0
                          ? 'Direct connection — zero line transfers required'
                          : `${route.transfers} line transfer${route.transfers > 1 ? 's' : ''} required`}
                      </span>
                      <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {route.hops} stations
                      </span>
                    </div>

                    {/* Itinerary */}
                    <h4 style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '16px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      Step-by-Step Itinerary:
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {route.segments.map((seg, idx) => (
                        <div key={idx} className="itinerary-step">
                          <div className="itinerary-line" style={{ backgroundColor: seg.line_color || 'var(--primary)' }} />
                          <div className="itinerary-node" style={{
                            backgroundColor: seg.line_color || 'var(--primary)',
                            boxShadow: `0 0 10px ${seg.line_color || 'var(--primary)'}60`,
                          }}>
                            {getModeIcon(seg.line_type)}
                          </div>
                          <div className="itinerary-content">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <strong style={{ fontSize: '1rem', color: 'var(--text-dark)', fontWeight: 800 }}>
                                {seg.from_station}
                              </strong>
                              <span className="line-tag" style={{ backgroundColor: seg.line_color || 'var(--primary)' }}>
                                {seg.line}
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--text-muted)', margin: '6px 0' }}>
                              <span><Clock size={12} style={{ display: 'inline', marginRight: '3px' }} />{seg.travel_time} min</span>
                              <span>📏 {seg.distance.toFixed(1)} km</span>
                              <span style={{ textTransform: 'capitalize' }}>{seg.line_type.replace('_', ' ')}</span>
                            </div>
                            {idx === route.segments.length - 1 && (
                              <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'var(--primary-light)', borderRadius: '8px', border: '1px solid rgba(255,107,0,0.2)' }}>
                                <MapPin size={16} color="var(--primary)" fill="var(--primary-light)" />
                                <strong style={{ fontSize: '0.95rem', color: 'var(--primary)', fontWeight: 800 }}>
                                  Arrived: {seg.to_station}
                                </strong>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
