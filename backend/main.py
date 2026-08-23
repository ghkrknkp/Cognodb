"""
main.py — FastAPI application for Transport Route Explorer
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from neo4j import exceptions as neo4j_exc

from database import get_session, close_driver
from models.schemas import (
    RouteRequest, NearbyStationsRequest,
    HealthResponse, RouteResult, RouteSegment,
    Station, TransportLine,
)
from queries import cypher

# ──────────────────────────────────────────────────────────────────────────────
#  Lifecycle
# ──────────────────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    close_driver()


app = FastAPI(
    title="Transport Route Explorer API",
    description="Graph-powered public transport routing backed by CognoDB",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────────────────────────────────────────────────────────────────────
#  Helpers
# ──────────────────────────────────────────────────────────────────────────────

def db_error_handler(e: Exception):
    if isinstance(e, neo4j_exc.ServiceUnavailable):
        raise HTTPException(503, detail="Database is unreachable. Please try again later.")
    if isinstance(e, neo4j_exc.AuthError):
        raise HTTPException(503, detail="Database authentication failed.")
    if isinstance(e, EnvironmentError):
        raise HTTPException(503, detail=str(e))
    raise HTTPException(500, detail=f"Unexpected error: {str(e)}")


# ──────────────────────────────────────────────────────────────────────────────
#  Health
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse, tags=["Health"])
def health_check():
    try:
        with get_session() as session:
            session.run("RETURN 1")
        return HealthResponse(status="ok", db_connected=True, message="CognoDB connected OK")
    except Exception as e:
        return HealthResponse(status="degraded", db_connected=False, message=str(e))


# ──────────────────────────────────────────────────────────────────────────────
#  Stations
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/stations", tags=["Stations"])
def list_stations():
    """Return all stations with their served lines."""
    try:
        with get_session() as session:
            result = session.run(cypher.GET_ALL_STATIONS)
            return [dict(r) for r in result]
    except Exception as e:
        db_error_handler(e)


@app.get("/stations/search", tags=["Stations"])
def search_stations(q: str = Query(..., min_length=1)):
    """Full-text search stations by name or city."""
    try:
        with get_session() as session:
            result = session.run(cypher.SEARCH_STATIONS, query=q)
            return [dict(r) for r in result]
    except Exception as e:
        db_error_handler(e)


@app.get("/stations/transfers", tags=["Stations"])
def transfer_stations():
    """Return interchange stations served by more than one line."""
    try:
        with get_session() as session:
            result = session.run(cypher.TRANSFER_STATIONS)
            return [dict(r) for r in result]
    except Exception as e:
        db_error_handler(e)


@app.get("/stations/{station_id}", tags=["Stations"])
def get_station(station_id: str):
    """Get a single station by ID."""
    try:
        with get_session() as session:
            result = session.run(cypher.GET_STATION_BY_ID, station_id=station_id)
            row = result.single()
            if not row:
                raise HTTPException(404, detail=f"Station '{station_id}' not found.")
            return dict(row)
    except HTTPException:
        raise
    except Exception as e:
        db_error_handler(e)


@app.post("/stations/nearby", tags=["Stations"])
def nearby_stations(req: NearbyStationsRequest):
    """Multi-hop traversal: find stations reachable within N hops."""
    try:
        with get_session() as session:
            query = cypher.get_nearby_stations_query(req.hops)
            result = session.run(
                query,
                station_id=req.station_id,
            )
            return [dict(r) for r in result]
    except Exception as e:
        db_error_handler(e)


# ──────────────────────────────────────────────────────────────────────────────
#  Lines
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/lines", tags=["Lines"])
def list_lines():
    """Return all transport lines."""
    try:
        with get_session() as session:
            result = session.run(cypher.GET_ALL_LINES)
            return [dict(r) for r in result]
    except Exception as e:
        db_error_handler(e)


@app.get("/lines/{line_id}/stations", tags=["Lines"])
def line_stations(line_id: str):
    """Return ordered stations for a given line."""
    try:
        with get_session() as session:
            result = session.run(cypher.GET_LINE_STATIONS, line_id=line_id)
            rows = [dict(r) for r in result]
            if not rows:
                raise HTTPException(404, detail=f"Line '{line_id}' not found.")
            return rows
    except HTTPException:
        raise
    except Exception as e:
        db_error_handler(e)


# ──────────────────────────────────────────────────────────────────────────────
#  Route Finding (Shortest Path — graph-native)
# ──────────────────────────────────────────────────────────────────────────────

@app.post("/routes/shortest", tags=["Routes"])
def shortest_path(req: RouteRequest):
    """
    Find the shortest path between two stations using graph traversal.
    Returns up to 3 paths sorted by number of hops.
    """
    if req.source_id == req.target_id:
        raise HTTPException(400, detail="Source and destination must be different.")
    try:
        with get_session() as session:
            result = session.run(
                cypher.SHORTEST_PATH,
                source_id=req.source_id,
                target_id=req.target_id,
            )
            paths = []
            for row in result:
                segments = []
                station_ids   = row["station_ids"]
                station_names = row["station_names"]
                raw_segs      = row["segments"]

                for i, seg in enumerate(raw_segs):
                    segments.append(RouteSegment(
                        from_station=station_names[i],
                        to_station=station_names[i + 1],
                        line=seg.get("line", ""),
                        line_type=seg.get("line_type", ""),
                        line_color=seg.get("line_color", "#888"),
                        travel_time=seg.get("travel_time", 0) or 0,
                        distance=float(seg.get("distance", 0) or 0),
                    ))

                # Count transfers (line changes)
                lines_used = [s.line for s in segments]
                transfers = sum(
                    1 for i in range(1, len(lines_used))
                    if lines_used[i] != lines_used[i - 1]
                )

                paths.append(RouteResult(
                    path_stations=station_names,
                    segments=segments,
                    total_time=row["total_time"] or 0,
                    total_distance=float(row["total_distance"] or 0),
                    transfers=transfers,
                    hops=row["hops"],
                ))
            if not paths:
                raise HTTPException(404, detail="No route found between those stations.")
            return paths
    except HTTPException:
        raise
    except Exception as e:
        db_error_handler(e)


# ──────────────────────────────────────────────────────────────────────────────
#  Stats
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/stats", tags=["Stats"])
def db_stats():
    """Return high-level database statistics."""
    try:
        with get_session() as session:
            result = session.run(cypher.DB_STATS)
            row = result.single()
            return {
                "stations":    row["stations"],
                "lines":       row["lines"],
                "connections": row["connections"],
            }
    except Exception as e:
        db_error_handler(e)
