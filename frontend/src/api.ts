import type {
  Station,
  TransportLine,
  LineStationStop,
  RouteResult,
  NearbyStation,
  TransferStation,
  DBStats,
  HealthStatus,
} from './types';

const rawBase =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:8000' : 'https://cognodb-n8cr.onrender.com');
const API_BASE = rawBase.replace(/\/+$/, '');

export interface QueryLog {
  title: string;
  cypher: string;
  params: Record<string, unknown>;
  description: string;
  relationalAlternative: string;
  durationMs: number;
}

type QueryListener = (log: QueryLog) => void;
const queryListeners: QueryListener[] = [];

export function onQueryExecuted(listener: QueryListener) {
  queryListeners.push(listener);
  return () => {
    const idx = queryListeners.indexOf(listener);
    if (idx !== -1) queryListeners.splice(idx, 1);
  };
}

function notifyQuery(log: QueryLog) {
  queryListeners.forEach((fn) => fn(log));
}

export async function fetchHealth(): Promise<HealthStatus> {
  const start = performance.now();
  const res = await fetch(`${API_BASE}/health`);
  const data = await res.json();
  notifyQuery({
    title: 'Health & Connectivity Ping',
    cypher: 'RETURN 1',
    params: {},
    description: 'Verifies live connection and session pool to CognoDB Cloud.',
    relationalAlternative: 'SELECT 1;',
    durationMs: Math.round(performance.now() - start),
  });
  return data;
}

export async function fetchStats(): Promise<DBStats> {
  const start = performance.now();
  const res = await fetch(`${API_BASE}/stats`);
  const data = await res.json();
  notifyQuery({
    title: 'Database Graph Cardinality Stats',
    cypher: `MATCH (s:Station)  WITH count(s) AS stations
MATCH (l:Line)     WITH stations, count(l) AS lines
MATCH ()-[r:CONNECTED_TO]->() WITH stations, lines, count(r) AS connections
RETURN stations, lines, connections`,
    params: {},
    description: 'Aggregates total nodes and relationships in the transit network.',
    relationalAlternative:
      'SELECT (SELECT COUNT(*) FROM stations), (SELECT COUNT(*) FROM lines), (SELECT COUNT(*) FROM connections);',
    durationMs: Math.round(performance.now() - start),
  });
  return data;
}

export async function fetchStations(): Promise<Station[]> {
  const start = performance.now();
  const res = await fetch(`${API_BASE}/stations`);
  if (!res.ok) throw new Error('Failed to fetch stations');
  const data = await res.json();
  notifyQuery({
    title: 'List All Stations & Lines Served',
    cypher: `MATCH (s:Station)
OPTIONAL MATCH (s)<-[:STOPS_AT]-(l:Line)
WITH s, collect(l.name) AS lines
RETURN s.id, s.name, s.city, s.zone, s.lat, s.lon, lines
ORDER BY s.name`,
    params: {},
    description: 'Retrieves all stations with pattern-matched transit lines via OPTIONAL MATCH.',
    relationalAlternative:
      'SELECT s.*, array_agg(l.name) FROM stations s LEFT JOIN line_stops ls ON s.id = ls.station_id LEFT JOIN lines l ON ls.line_id = l.id GROUP BY s.id ORDER BY s.name;',
    durationMs: Math.round(performance.now() - start),
  });
  return data;
}

export async function fetchLines(): Promise<TransportLine[]> {
  const start = performance.now();
  const res = await fetch(`${API_BASE}/lines`);
  if (!res.ok) throw new Error('Failed to fetch transit lines');
  const data = await res.json();
  notifyQuery({
    title: 'List Transport Lines & Ordered Stations',
    cypher: `MATCH (l:Line)
OPTIONAL MATCH (l)-[:STOPS_AT]->(s:Station)
WITH l, collect(s.name) AS stations
RETURN l.id, l.name, l.type, l.color, stations
ORDER BY l.name`,
    params: {},
    description: 'Lists all transit corridors with connected network nodes.',
    relationalAlternative: 'Multi-table JOIN between lines, line_stops, and stations.',
    durationMs: Math.round(performance.now() - start),
  });
  return data;
}

export async function fetchLineStations(lineId: string): Promise<LineStationStop[]> {
  const start = performance.now();
  const res = await fetch(`${API_BASE}/lines/${lineId}/stations`);
  if (!res.ok) throw new Error(`Failed to fetch stations for line ${lineId}`);
  const data = await res.json();
  notifyQuery({
    title: 'Ordered Stops along Transit Line',
    cypher: `MATCH (l:Line {id: $line_id})-[r:STOPS_AT]->(s:Station)
RETURN s.id, s.name, s.city, s.zone, s.lat, s.lon, r.order AS stop_order
ORDER BY r.order`,
    params: { line_id: lineId },
    description: 'Traverses STOPS_AT relationships ordered by sequence stop number.',
    relationalAlternative:
      'SELECT s.*, ls.order FROM line_stops ls JOIN stations s ON ls.station_id = s.id WHERE ls.line_id = $1 ORDER BY ls.order;',
    durationMs: Math.round(performance.now() - start),
  });
  return data;
}

export async function findShortestPath(sourceId: string, targetId: string): Promise<RouteResult[]> {
  const start = performance.now();
  const res = await fetch(`${API_BASE}/routes/shortest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source_id: sourceId, target_id: targetId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No route found');
  }
  const data = await res.json();
  notifyQuery({
    title: 'Shortest Path Graph Traversal (multi-hop)',
    cypher: `MATCH (src:Station {id: $source_id}), (dst:Station {id: $target_id})
MATCH p = shortestPath((src)-[:CONNECTED_TO*1..15]-(dst))
WITH p, [n IN nodes(p) | n.name] AS station_names, relationships(p) AS rels
RETURN station_names,
       [r IN rels | { line: r.line, line_type: r.line_type, travel_time: r.travel_time, distance: r.distance }] AS segments,
       reduce(t = 0, r IN rels | t + r.travel_time) AS total_time,
       reduce(d = 0.0, r IN rels | d + r.distance) AS total_distance,
       length(p) AS hops`,
    params: { source_id: sourceId, target_id: targetId },
    description:
      'Native graph shortestPath algorithm traversing weighted edges across multi-line subway and rail corridors.',
    relationalAlternative:
      'Extremely complex recursive CTE with cycle detection (WITH RECURSIVE path_finder AS (...)), or custom Dijkstra stored procedure requiring multiple index scans per step.',
    durationMs: Math.round(performance.now() - start),
  });
  return data;
}

export async function fetchNearbyStations(stationId: string, hops: number): Promise<NearbyStation[]> {
  const start = performance.now();
  const res = await fetch(`${API_BASE}/stations/nearby`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ station_id: stationId, hops }),
  });
  if (!res.ok) throw new Error('Failed to fetch nearby stations');
  const data = await res.json();
  notifyQuery({
    title: `Multi-Hop Reachability Traversal (${hops} Hops)`,
    cypher: `MATCH (src:Station {id: $station_id})
MATCH p = (src)-[:CONNECTED_TO*1..${hops}]-(nearby:Station)
WHERE nearby.id <> $station_id
WITH nearby, min(length(p)) AS hops_away
RETURN nearby.id, nearby.name, nearby.city, nearby.zone, nearby.lat, nearby.lon, hops_away
ORDER BY hops_away, nearby.name
LIMIT 30`,
    params: { station_id: stationId, hops },
    description: `Explores variable-depth connectivity up to ${hops} degrees of separation from the origin.`,
    relationalAlternative: `Requires ${hops} chained self-JOINs on connections table or recursive CTE with depth tracking.`,
    durationMs: Math.round(performance.now() - start),
  });
  return data;
}

export async function fetchTransferStations(): Promise<TransferStation[]> {
  const start = performance.now();
  const res = await fetch(`${API_BASE}/stations/transfers`);
  if (!res.ok) throw new Error('Failed to fetch interchange stations');
  const data = await res.json();
  notifyQuery({
    title: 'Interchange Hubs (High Degree Centrality)',
    cypher: `MATCH (s:Station)<-[:STOPS_AT]-(l:Line)
WITH s, count(l) AS line_count, collect(l.name) AS lines
WHERE line_count > 1
RETURN s.id, s.name, s.city, line_count, lines
ORDER BY line_count DESC, s.name`,
    params: {},
    description: 'Finds intersection nodes serving multiple distinct transit lines.',
    relationalAlternative:
      'SELECT s.id, s.name, COUNT(DISTINCT ls.line_id) FROM stations s JOIN line_stops ls ON s.id = ls.station_id GROUP BY s.id HAVING COUNT(DISTINCT ls.line_id) > 1;',
    durationMs: Math.round(performance.now() - start),
  });
  return data;
}
