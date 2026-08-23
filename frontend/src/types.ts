export interface Station {
  id: string;
  name: string;
  city: string;
  zone?: string;
  lat?: number;
  lon?: number;
  lines?: string[];
}

export interface TransportLine {
  id: string;
  name: string;
  type: string;
  color: string;
  stations?: string[];
}

export interface LineStationStop {
  id: string;
  name: string;
  city: string;
  zone?: string;
  lat?: number;
  lon?: number;
  stop_order: number;
}

export interface RouteSegment {
  from_station: string;
  to_station: string;
  line: string;
  line_type: string;
  line_color: string;
  travel_time: number;
  distance: number;
}

export interface RouteResult {
  path_stations: string[];
  segments: RouteSegment[];
  total_time: number;
  total_distance: number;
  transfers: number;
  hops: number;
}

export interface NearbyStation {
  id: string;
  name: string;
  city: string;
  zone?: string;
  lat?: number;
  lon?: number;
  hops_away: number;
}

export interface TransferStation {
  id: string;
  name: string;
  city: string;
  line_count: number;
  lines: string[];
}

export interface DBStats {
  stations: number;
  lines: number;
  connections: number;
}

export interface HealthStatus {
  status: string;
  db_connected: boolean;
  message: string;
}
