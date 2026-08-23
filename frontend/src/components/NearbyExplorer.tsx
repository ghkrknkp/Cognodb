import React, { useState, useEffect } from 'react';
import type { Station, NearbyStation } from '../types';
import { fetchNearbyStations } from '../api';
import { Radio, MapPin, Gauge, Info } from 'lucide-react';

interface NearbyExplorerProps {
  stations: Station[];
}

export const NearbyExplorer: React.FC<NearbyExplorerProps> = ({ stations }) => {
  const [stationId, setStationId] = useState<string>(stations[0]?.id || 'mum_dadar');
  const [hops, setHops] = useState<number>(2);
  const [nearby, setNearby] = useState<NearbyStation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadNearby = async () => {
    if (!stationId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNearbyStations(stationId, hops);
      setNearby(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch nearby stations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadNearby(); }, [stationId, hops]);

  const selectedStation = stations.find((s) => s.id === stationId);

  const hopColor = (h: number) => {
    if (h === 1) return { bg: '#DCFCE7', color: '#16A34A' };
    if (h === 2) return { bg: '#EEF2FF', color: '#4F46E5' };
    return { bg: '#FEF3C7', color: '#D97706' };
  };

  return (
    <div className="main-grid">
      {/* Left: Controls */}
      <div className="card">
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <Radio size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-dark)' }}>Multi-Hop Radius</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Graph traversal across N hops from any station</p>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label"><MapPin size={13} color="var(--primary)" /> Origin Station</label>
            <select className="select-input" value={stationId} onChange={(e) => setStationId(e.target.value)}>
              {stations.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.city})</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label"><Gauge size={13} color="#F59E0B" /> Traversal Depth</label>
              <span style={{ background: '#FEF3C7', color: '#D97706', padding: '3px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700 }}>
                {hops} {hops === 1 ? 'Hop' : 'Hops'}
              </span>
            </div>
            <input
              type="range" min="1" max="5" step="1" value={hops}
              onChange={(e) => setHops(parseInt(e.target.value, 10))}
              style={{ width: '100%', marginTop: '10px', accentColor: 'var(--primary)', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              <span>1 (Direct)</span><span>2</span><span>3</span><span>4</span><span>5 (Extended)</span>
            </div>
          </div>

          {/* Graph vs SQL callout */}
          <div style={{ marginTop: '20px', padding: '16px', borderRadius: '12px', background: '#EEF2FF', border: '1px solid #C7D2FE' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Info size={16} color="#4F46E5" />
              <strong style={{ fontSize: '0.82rem', color: '#3730A3' }}>Why Graph Traversal Wins:</strong>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#4338CA', lineHeight: 1.55 }}>
              In SQL, finding all reachable nodes within <strong>{hops} hops</strong> requires {hops} sequential JOINs or a recursive CTE. In CognoDB it's one native pattern:
            </p>
            <pre style={{ marginTop: '10px', padding: '10px', background: '#1E1B4B', borderRadius: '8px', fontSize: '0.7rem', color: '#A5B4FC', overflowX: 'auto', lineHeight: 1.6 }}>
{`MATCH (s:Station {id: "${stationId}"})
MATCH p=(s)-[:CONNECTED_TO*1..${hops}]-(n:Station)
RETURN DISTINCT n`}
            </pre>
          </div>
        </div>
      </div>

      {/* Right: Results Grid */}
      <div className="card">
        <div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                Reachable from {selectedStation?.name}
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                <strong style={{ color: 'var(--primary)' }}>{nearby.length}</strong> stations within a {hops}-hop radius
              </p>
            </div>
            {loading && <div className="spinner" style={{ borderTopColor: 'var(--primary)', borderColor: 'rgba(255,107,0,0.2)' }} />}
          </div>

          {error && (
            <div className="alert alert-error"><span>{error}</span></div>
          )}

          {!loading && nearby.length === 0 && !error && (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <div className="empty-icon"><Radio size={30} /></div>
              <h3>No Results Yet</h3>
              <p>Select a station and adjust the hop radius to explore the network graph.</p>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '12px', maxHeight: '500px', overflowY: 'auto', paddingRight: '4px' }}>
            {nearby.map((st) => {
              const c = hopColor(st.hops_away);
              return (
                <div key={st.id} style={{
                  padding: '14px', borderRadius: '12px',
                  background: '#fff', border: '1.5px solid var(--border)',
                  display: 'flex', flexDirection: 'column', gap: '8px',
                  transition: 'box-shadow 0.2s, border-color 0.2s',
                  cursor: 'default',
                }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--primary)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-sm)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-dark)', lineHeight: 1.3 }}>{st.name}</strong>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: c.bg, color: c.color, whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {st.hops_away} {st.hops_away === 1 ? 'Hop' : 'Hops'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    {st.city} {st.zone ? `· Zone ${st.zone}` : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
