from pydantic import BaseModel
from typing import Optional, List, Any


class Station(BaseModel):
    id: str
    name: str
    city: str
    zone: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    lines: Optional[List[str]] = []


class TransportLine(BaseModel):
    id: str
    name: str
    type: str          # subway, bus, tram, rail
    color: str
    stations: Optional[List[str]] = []


class RouteSegment(BaseModel):
    from_station: str
    to_station: str
    line: str
    line_type: str
    line_color: str
    travel_time: int   # minutes
    distance: float    # km


class RouteResult(BaseModel):
    path_stations: List[str]
    segments: List[RouteSegment]
    total_time: int
    total_distance: float
    transfers: int
    hops: int


class RouteRequest(BaseModel):
    source_id: str
    target_id: str
    max_hops: Optional[int] = 10


class NearbyStationsRequest(BaseModel):
    station_id: str
    hops: int = 2


class LineExplorerRequest(BaseModel):
    line_id: str


class HealthResponse(BaseModel):
    status: str
    db_connected: bool
    message: str
