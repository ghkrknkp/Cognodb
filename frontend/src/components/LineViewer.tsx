import React, { useState, useEffect } from 'react';
import type { TransportLine, LineStationStop, TransferStation } from '../types';
import { fetchLineStations, fetchTransferStations } from '../api';
import { Layers, ArrowLeftRight, MapPin } from 'lucide-react';

interface LineViewerProps {
  lines: TransportLine[];
}

export const LineViewer: React.FC<LineViewerProps> = ({ lines }) => {
  const [selectedLineId, setSelectedLineId] = useState<string>(lines[0]?.id || '');
  const [stops, setStops] = useState<LineStationStop[]>([]);
  const [transfers, setTransfers] = useState<TransferStation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (lines.length > 0 && !selectedLineId) setSelectedLineId(lines[0].id);
  }, [lines]);

  useEffect(() => {
    const loadData = async () => {
      if (!selectedLineId) return;
      setLoading(true);
      try {
        const [stopsData, transferData] = await Promise.all([
          fetchLineStations(selectedLineId),
          fetchTransferStations(),
        ]);
        setStops(stopsData);
        setTransfers(transferData);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    loadData();
  }, [selectedLineId]);

  const activeLine = lines.find((l) => l.id === selectedLineId);

  const typeLabel: Record<string, string> = {
    metro: 'Metro',
    suburban: 'Suburban Rail',
    high_speed: 'High-Speed / Vande Bharat',
    monorail: 'Monorail',
    light_rail: 'Light Rail',
  };

  return (
    <div className="main-grid">
      {/* Left: Line list + interchange hubs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Line selector */}
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <Layers size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-dark)' }}>Transit Corridors</h2>
                <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{lines.length} routes in graph</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', maxHeight: '340px', overflowY: 'auto', paddingRight: '4px' }}>
              {lines.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setSelectedLineId(l.id)}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '11px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                    borderLeft: `4px solid ${l.color}`,
                    background: selectedLineId === l.id ? `${l.color}14` : 'var(--bg)',
                    transition: 'all 0.2s',
                    textAlign: 'left',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: selectedLineId === l.id ? 'var(--text-dark)' : 'var(--text-body)' }}>
                      {l.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                      {typeLabel[l.type] || l.type}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px',
                    background: selectedLineId === l.id ? `${l.color}22` : 'var(--border)',
                    color: selectedLineId === l.id ? l.color : 'var(--text-muted)',
                    border: selectedLineId === l.id ? `1px solid ${l.color}50` : '1px solid transparent',
                  }}>
                    {l.stations?.length || 0} stops
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Interchange hubs */}
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <ArrowLeftRight size={18} color="var(--primary)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-dark)' }}>Interchange Hubs</h3>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Stations with highest graph degree centrality acting as line transfer junctions:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
              {transfers.map((ts) => (
                <div key={ts.id} style={{ padding: '11px 14px', borderRadius: '10px', background: 'var(--bg)', border: '1.5px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.88rem', color: 'var(--text-dark)' }}>{ts.name}</strong>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-light)', padding: '2px 8px', borderRadius: '999px', border: '1px solid rgba(255,107,0,0.2)' }}>
                      {ts.line_count} Lines
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {ts.lines.map((ln, i) => (
                      <span key={i} style={{ fontSize: '0.65rem', color: 'var(--text-muted)', background: 'var(--border)', padding: '2px 7px', borderRadius: '4px' }}>{ln}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right: Station stops */}
      <div className="card">
        <div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: activeLine?.color || 'var(--primary)', display: 'inline-block', boxShadow: `0 0 8px ${activeLine?.color || 'var(--primary)'}80` }} />
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-dark)' }}>{activeLine?.name}</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Ordered via <code style={{ background: '#EEF2FF', color: '#4F46E5', padding: '1px 5px', borderRadius: '4px', fontSize: '0.72rem' }}>[:STOPS_AT]</code> relationship
                </p>
              </div>
            </div>
            <span className="line-tag" style={{ backgroundColor: activeLine?.color || 'var(--primary)', fontSize: '0.75rem' }}>
              {(activeLine?.type || 'TRANSIT').toUpperCase()} CORRIDOR
            </span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: '56px' }} />)}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '580px', overflowY: 'auto', paddingRight: '6px' }}>
              {stops.map((st, idx) => (
                <div key={st.id} className="itinerary-step">
                  {idx < stops.length - 1 && (
                    <div className="itinerary-line" style={{ backgroundColor: activeLine?.color || 'var(--primary)' }} />
                  )}
                  <div className="itinerary-node" style={{
                    backgroundColor: activeLine?.color || 'var(--primary)',
                    boxShadow: `0 0 8px ${activeLine?.color || 'var(--primary)'}60`,
                  }}>
                    <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#fff' }}>{st.stop_order}</span>
                  </div>
                  <div style={{
                    flex: 1, padding: '10px 14px', borderRadius: '10px',
                    background: 'var(--bg)', border: '1.5px solid var(--border)', marginBottom: '10px',
                    transition: 'border-color 0.2s',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--text-dark)' }}>{st.name}</strong>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Stop #{st.stop_order}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={11} /> {st.city} {st.zone ? `· Zone ${st.zone}` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
