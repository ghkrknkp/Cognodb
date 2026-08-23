import React, { useState, useEffect } from 'react';
import type { QueryLog } from '../api';
import { onQueryExecuted } from '../api';
import { Terminal, Database, ShieldCheck, CheckCircle2, Zap } from 'lucide-react';

export const CypherViewer: React.FC = () => {
  const [logs, setLogs] = useState<QueryLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<QueryLog | null>(null);

  useEffect(() => {
    const unsub = onQueryExecuted((log) => {
      setLogs((prev) => [log, ...prev.slice(0, 19)]);
      setSelectedLog(log);
    });
    return unsub;
  }, []);

  const defaultQueries: QueryLog[] = [
    {
      title: 'Shortest Path Graph Traversal',
      cypher: `MATCH (src:Station {id: $source_id}), (dst:Station {id: $target_id})
MATCH p = shortestPath((src)-[:CONNECTED_TO*1..15]-(dst))
WITH p,
     [n IN nodes(p) | n.name] AS station_names,
     relationships(p) AS rels
RETURN station_names,
       [r IN rels | {
         line: r.line,
         travel_time: r.travel_time,
         distance: r.distance
       }] AS segments,
       reduce(t = 0, r IN rels | t + r.travel_time) AS total_time,
       reduce(d = 0.0, r IN rels | d + r.distance) AS total_distance,
       length(p) AS hops`,
      params: { source_id: 'del_ndls', target_id: 'mum_csmt' },
      description: 'Traverses weighted relationships across rail & metro network to find the optimal path in a single graph expression.',
      relationalAlternative: 'Requires complex recursive CTE (WITH RECURSIVE) with path tracking and cycle detection, or an external Dijkstra algorithm run in application code.',
      durationMs: 42,
    },
    {
      title: 'Variable-Depth Reachability (N Hops)',
      cypher: `MATCH (src:Station {id: $station_id})
MATCH p = (src)-[:CONNECTED_TO*1..$hops]-(nearby:Station)
WHERE nearby.id <> $station_id
WITH nearby, min(length(p)) AS hops_away
RETURN nearby.id, nearby.name, nearby.city, hops_away
ORDER BY hops_away, nearby.name
LIMIT 30`,
      params: { station_id: 'mum_dadar', hops: 2 },
      description: 'Finds all stations within N degrees of separation. Graph index-free adjacency enables O(depth) performance regardless of total table size.',
      relationalAlternative: 'Requires N nested self-JOINs on a transit_connections table or a deep recursive depth-level scan.',
      durationMs: 18,
    },
    {
      title: 'Interchange Centrality & Line Aggregation',
      cypher: `MATCH (s:Station)<-[:STOPS_AT]-(l:Line)
WITH s, count(l) AS line_count, collect(l.name) AS lines
WHERE line_count > 1
RETURN s.id, s.name, s.city, line_count, lines
ORDER BY line_count DESC`,
      params: {},
      description: 'Detects high-centrality intersection nodes serving multiple distinct transit lines — a natural graph pattern.',
      relationalAlternative: 'Requires GROUP BY and HAVING clauses over a junction table with multi-table aggregation — verbose and harder to extend.',
      durationMs: 25,
    },
  ];

  const activeLog = selectedLog || logs[0] || defaultQueries[0];
  const allLogs = logs.length > 0 ? logs : defaultQueries;

  return (
    <div className="main-grid">
      {/* Left: Query list */}
      <div className="card">
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#1E1B4B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A5B4FC' }}>
              <Terminal size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-dark)' }}>Cypher Query Log</h2>
              <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>Live openCypher queries executed on CognoDB</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {allLogs.map((log, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedLog(log)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  borderLeft: activeLog.title === log.title ? '4px solid #4F46E5' : '4px solid var(--border)',
                  background: activeLog.title === log.title ? '#EEF2FF' : 'var(--bg)',
                  textAlign: 'left', transition: 'all 0.2s',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: activeLog.title === log.title ? '#3730A3' : 'var(--text-dark)' }}>
                    {log.title}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    ⚡ {log.durationMs}ms · Parameterised
                  </div>
                </div>
                <CheckCircle2 size={16} color="#16A34A" />
              </button>
            ))}
          </div>

          {/* Security note */}
          <div style={{ marginTop: '20px', padding: '14px', borderRadius: '10px', background: '#F0FFF4', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <ShieldCheck size={18} color="#16A34A" style={{ flexShrink: 0, marginTop: '2px' }} />
            <p style={{ fontSize: '0.74rem', color: '#065F46', lineHeight: 1.5 }}>
              <strong>100% Parameterized Cypher</strong> — All queries use Neo4j driver parameters (e.g. <code style={{ background: '#DCFCE7', color: '#166534', padding: '1px 5px', borderRadius: '3px' }}>$source_id</code>). Zero string concatenation — no Cypher injection risk.
            </p>
          </div>
        </div>
      </div>

      {/* Right: Query detail */}
      <div className="card">
        <div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '6px' }}>
                {activeLog.title}
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                {activeLog.description}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '999px', background: '#EEF2FF', border: '1px solid #C7D2FE' }}>
              <Zap size={13} color="#4F46E5" />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#4338CA' }}>{activeLog.durationMs} ms</span>
            </div>
          </div>

          {/* Cypher query */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                openCypher Query:
              </span>
              <span style={{ fontSize: '0.7rem', color: '#60A5FA', fontWeight: 600 }}>CognoDB · Bolt 5.x</span>
            </div>
            <pre className="code-block">{activeLog.cypher}</pre>
          </div>

          {/* Parameters */}
          {Object.keys(activeLog.params).length > 0 && (
            <div style={{ marginBottom: '18px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                Query Parameters:
              </span>
              <pre className="code-block" style={{ color: '#F9A8D4' }}>
                {JSON.stringify(activeLog.params, null, 2)}
              </pre>
            </div>
          )}

          {/* SQL comparison */}
          <div style={{ padding: '16px', borderRadius: '12px', background: '#FFF5F5', border: '1.5px solid #FECACA' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Database size={16} color="#DC2626" />
              <strong style={{ fontSize: '0.84rem', color: '#991B1B' }}>
                Why SQL Databases Find This Difficult:
              </strong>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#7F1D1D', lineHeight: 1.55 }}>
              {activeLog.relationalAlternative}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
