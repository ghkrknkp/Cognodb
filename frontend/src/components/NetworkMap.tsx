import React, { useState, useMemo } from 'react';
import type { Station, TransportLine } from '../types';
import { Layers, ZoomIn, ZoomOut, RotateCcw, MapPin } from 'lucide-react';

interface NetworkMapProps {
  stations: Station[];
  lines: TransportLine[];
  onSelectStation?: (stationId: string) => void;
  highlightedPath?: string[];
}

export const NetworkMap: React.FC<NetworkMapProps> = ({
  stations,
  lines: _lines,
  onSelectStation,
  highlightedPath = [],
}) => {
  const [selectedCity, setSelectedCity] = useState<string>('ALL');
  const [hoveredStation, setHoveredStation] = useState<Station | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Filter stations based on city
  const cityFilteredStations = useMemo(() => {
    if (selectedCity === 'ALL') return stations;
    return stations.filter((s) => s.city.toLowerCase().includes(selectedCity.toLowerCase()));
  }, [stations, selectedCity]);

  // Map station GPS coordinates to SVG canvas space (India bounds: Lat 8 to 32, Lon 68 to 90)
  const mappedStations = useMemo(() => {
    if (!cityFilteredStations.length) return [];
    const valid = cityFilteredStations.filter((s) => s.lat && s.lon);
    if (!valid.length) return [];

    // Geographical bounds of India with comfortable padding
    const minLat = 8.5;
    const maxLat = 32.0;
    const minLon = 69.0;
    const maxLon = 89.5;

    const pad = 50;
    const width = 940;
    const height = 620;

    return valid.map((s) => {
      // Invert lat for SVG Y (higher lat = North = lower Y)
      const x = pad + ((s.lon! - minLon) / (maxLon - minLon)) * (width - 2 * pad);
      const y = height - (pad + ((s.lat! - minLat) / (maxLat - minLat)) * (height - 2 * pad));
      return {
        ...s,
        svgX: x,
        svgY: y,
      };
    });
  }, [cityFilteredStations]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Map Controls Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '14px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* City Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <Layers size={16} color="var(--careem-green)" />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            Filter Map:
          </span>
          {['ALL', 'Delhi', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune'].map((c) => (
            <button
              key={c}
              className={`city-pill ${selectedCity === c ? 'active' : ''}`}
              style={{ padding: '4px 12px', fontSize: '0.75rem' }}
              onClick={() => setSelectedCity(c)}
            >
              {c === 'ALL' ? 'Pan-India Network' : c}
            </button>
          ))}
        </div>

        {/* Zoom & Reset Controls */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            className="btn-secondary"
            onClick={() => setZoom((z) => Math.min(3.0, z + 0.25))}
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
          <button
            className="btn-secondary"
            onClick={() => setZoom((z) => Math.max(0.6, z - 0.25))}
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
          <button
            className="btn-secondary"
            onClick={() => {
              setZoom(1);
              setOffset({ x: 0, y: 0 });
            }}
            title="Reset Map View"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div
        className="glass-panel"
        style={{
          height: '660px',
          position: 'relative',
          overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : 'grab',
          background: 'radial-gradient(ellipse at center, #0B1120 0%, #030712 100%)',
          borderRadius: '20px',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 940 620"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
        >
          <defs>
            <radialGradient id="indiaGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00E59B" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#00E59B" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Grid lines */}
          <pattern id="indiaGrid" width="45" height="45" patternUnits="userSpaceOnUse">
            <path d="M 45 0 L 0 0 0 45" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
          </pattern>
          <rect width="940" height="620" fill="url(#indiaGrid)" />

          {/* Major National Transit Arteries Background Lines */}
          {/* Delhi to Mumbai */}
          <line x1="420" y1="120" x2="220" y2="390" stroke="rgba(225, 29, 72, 0.25)" strokeWidth="3" strokeDasharray="6 4" />
          {/* Delhi to Varanasi to Kolkata */}
          <line x1="420" y1="120" x2="680" y2="220" stroke="rgba(139, 92, 246, 0.25)" strokeWidth="3" strokeDasharray="6 4" />
          <line x1="680" y1="220" x2="880" y2="300" stroke="rgba(139, 92, 246, 0.25)" strokeWidth="3" strokeDasharray="6 4" />
          {/* Mumbai to Pune */}
          <line x1="220" y1="390" x2="260" y2="420" stroke="rgba(245, 158, 11, 0.4)" strokeWidth="3" />
          {/* Bengaluru to Chennai */}
          <line x1="430" y1="520" x2="550" y2="510" stroke="rgba(59, 130, 246, 0.35)" strokeWidth="3" />
          {/* Bengaluru to Hyderabad */}
          <line x1="430" y1="520" x2="470" y2="440" stroke="rgba(16, 185, 129, 0.35)" strokeWidth="3" />
          {/* Chennai to Kochi */}
          <line x1="550" y1="510" x2="380" y2="580" stroke="rgba(236, 72, 153, 0.3)" strokeWidth="3" strokeDasharray="6 4" />

          {/* Station Nodes */}
          {mappedStations.map((s) => {
            const isHighlighted = highlightedPath.includes(s.name) || highlightedPath.includes(s.id);
            const isInterchange = (s.lines?.length || 0) > 1;

            return (
              <g
                key={s.id}
                transform={`translate(${s.svgX}, ${s.svgY})`}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredStation(s)}
                onMouseLeave={() => setHoveredStation(null)}
                onClick={() => onSelectStation && onSelectStation(s.id)}
              >
                {/* Outer Glow */}
                {(isHighlighted || isInterchange) && (
                  <circle
                    r={isHighlighted ? 18 : 11}
                    fill={isHighlighted ? 'rgba(0, 229, 155, 0.35)' : 'rgba(99, 102, 241, 0.25)'}
                    className="pulse-glow"
                  />
                )}

                {/* Main Node Circle */}
                <circle
                  r={isHighlighted ? 9 : isInterchange ? 6 : 4.5}
                  fill={
                    isHighlighted
                      ? '#00E59B'
                      : isInterchange
                      ? '#F59E0B'
                      : '#E2E8F0'
                  }
                  stroke="#060911"
                  strokeWidth="2"
                />

                {/* Node Label */}
                <text
                  x="9"
                  y="3.5"
                  fill={isHighlighted ? '#00E59B' : '#94A3B8'}
                  fontSize={isHighlighted ? '12px' : isInterchange ? '10px' : '8.5px'}
                  fontWeight={isHighlighted || isInterchange ? '800' : '500'}
                  style={{
                    textShadow: '0 1px 4px #000',
                    pointerEvents: 'none',
                    userSelect: 'none',
                  }}
                >
                  {s.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Station Card */}
        {hoveredStation && (
          <div
            style={{
              position: 'absolute',
              bottom: '24px',
              left: '24px',
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid var(--border-glow)',
              backdropFilter: 'blur(16px)',
              padding: '16px 20px',
              borderRadius: '16px',
              boxShadow: '0 12px 35px rgba(0,0,0,0.7)',
              minWidth: '240px',
              pointerEvents: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <MapPin size={18} color="var(--careem-green)" />
              <strong style={{ fontSize: '1.05rem', color: '#fff' }}>{hoveredStation.name}</strong>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              City / Region: <strong style={{ color: '#fff' }}>{hoveredStation.city}</strong>
            </p>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>CONNECTED TRANSIT LINES:</span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                {hoveredStation.lines?.map((ln, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      background: 'rgba(255,255,255,0.08)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      color: '#E2E8F0',
                    }}
                  >
                    {ln}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Map Legend */}
        <div
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(11, 17, 32, 0.85)',
            border: '1px solid var(--border-subtle)',
            padding: '14px 18px',
            borderRadius: '14px',
            fontSize: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            backdropFilter: 'blur(12px)',
          }}
        >
          <span style={{ fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '2px' }}>
            ALL-INDIA MAP LEGEND:
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F59E0B' }} />
            <span>Interchange Hub (Multi-Line / Junction)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#E2E8F0' }} />
            <span>Standard Metro / Station Stop</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#00E59B' }} />
            <span>Active Traversal Path</span>
          </div>
        </div>
      </div>
    </div>
  );
};
