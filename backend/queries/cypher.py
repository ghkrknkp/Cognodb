# ─────────────────────────────────────────────
#  ALL parameterised Cypher queries used by the app.
#  No string-concatenated Cypher anywhere in this file.
# ─────────────────────────────────────────────

# ── Stations ──────────────────────────────────

GET_ALL_STATIONS = """
MATCH (s:Station)
OPTIONAL MATCH (s)<-[:STOPS_AT]-(l:Line)
WITH s, collect(l.name) AS lines
RETURN s.id AS id,
       s.name AS name,
       s.city AS city,
       s.zone AS zone,
       s.lat  AS lat,
       s.lon  AS lon,
       lines
ORDER BY s.name
"""

SEARCH_STATIONS = """
MATCH (s:Station)
WHERE toLower(s.name) CONTAINS toLower($query)
   OR toLower(s.city) CONTAINS toLower($query)
OPTIONAL MATCH (s)<-[:STOPS_AT]-(l:Line)
WITH s, collect(l.name) AS lines
RETURN s.id AS id,
       s.name AS name,
       s.city AS city,
       s.zone AS zone,
       s.lat  AS lat,
       s.lon  AS lon,
       lines
LIMIT 20
"""

GET_STATION_BY_ID = """
MATCH (s:Station {id: $station_id})
OPTIONAL MATCH (s)<-[:STOPS_AT]-(l:Line)
WITH s, collect(l.name) AS lines
RETURN s.id AS id,
       s.name AS name,
       s.city AS city,
       s.zone AS zone,
       s.lat  AS lat,
       s.lon  AS lon,
       lines
"""

# ── Lines ──────────────────────────────────────

GET_ALL_LINES = """
MATCH (l:Line)
OPTIONAL MATCH (l)-[:STOPS_AT]->(s:Station)
WITH l, collect(s.name) AS stations
RETURN l.id    AS id,
       l.name  AS name,
       l.type  AS type,
       l.color AS color,
       stations
ORDER BY l.name
"""

GET_LINE_STATIONS = """
MATCH (l:Line {id: $line_id})-[r:STOPS_AT]->(s:Station)
RETURN s.id    AS id,
       s.name  AS name,
       s.city  AS city,
       s.zone  AS zone,
       s.lat   AS lat,
       s.lon   AS lon,
       r.order AS stop_order
ORDER BY r.order
"""

# ── Shortest Path (multi-hop traversal) ────────
# Uses allShortestPaths — a graph-native operation.
# Parameterised via $source_id and $target_id.

SHORTEST_PATH = """
MATCH (src:Station {id: $source_id}),
      (dst:Station {id: $target_id})
MATCH p = shortestPath((src)-[:CONNECTED_TO*1..15]-(dst))
WITH p,
     [n IN nodes(p) | n.name]    AS station_names,
     [n IN nodes(p) | n.id]      AS station_ids,
     relationships(p)             AS rels
RETURN station_ids,
       station_names,
       [r IN rels | {
           line:       r.line,
           line_type:  r.line_type,
           line_color: r.line_color,
           travel_time: r.travel_time,
           distance:    r.distance
       }] AS segments,
       reduce(t = 0, r IN rels | t + r.travel_time)  AS total_time,
       reduce(d = 0.0, r IN rels | d + r.distance)   AS total_distance,
       length(p) AS hops
LIMIT 3
"""

# ── Nearby Stations (multi-hop traversal) ──────
# Demonstrates multi-hop graph traversal (1-5 hops) that is
# awkward to express in SQL without complex recursive CTEs.

def get_nearby_stations_query(hops: int = 2) -> str:
    safe_hops = max(1, min(5, int(hops)))
    return f"""
    MATCH (src:Station {{id: $station_id}})
    MATCH p = (src)-[:CONNECTED_TO*1..{safe_hops}]-(nearby:Station)
    WHERE nearby.id <> $station_id
    WITH nearby, min(length(p)) AS hops_away
    RETURN nearby.id   AS id,
           nearby.name AS name,
           nearby.city AS city,
           nearby.zone AS zone,
           nearby.lat  AS lat,
           nearby.lon  AS lon,
           hops_away
    ORDER BY hops_away, nearby.name
    LIMIT 30
    """

# ── Transfer Stations (graph-only query) ────────
# Finds stations that are served by more than one line —
# i.e. interchange nodes in the graph.

TRANSFER_STATIONS = """
MATCH (s:Station)<-[:STOPS_AT]-(l:Line)
WITH s, count(l) AS line_count, collect(l.name) AS lines
WHERE line_count > 1
RETURN s.id    AS id,
       s.name  AS name,
       s.city  AS city,
       line_count,
       lines
ORDER BY line_count DESC, s.name
"""

# ── Stats ───────────────────────────────────────

DB_STATS = """
MATCH (s:Station)  WITH count(s) AS stations
MATCH (l:Line)     WITH stations, count(l) AS lines
MATCH ()-[r:CONNECTED_TO]->() WITH stations, lines, count(r) AS connections
RETURN stations, lines, connections
"""
