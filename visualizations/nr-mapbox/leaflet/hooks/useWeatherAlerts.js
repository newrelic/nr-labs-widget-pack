import { useState, useEffect, useRef, useCallback } from 'react';
import {
  NWS_ALERTS_URL,
  WEATHER_ALERT_POLL_MS,
  SEVERITY_LEVELS
} from '../constants';

// Compute the center point of an alert's geometry
function computeCenter(geometry) {
  if (!geometry) return null;

  if (geometry.type === 'Point') {
    return { lat: geometry.coordinates[1], lng: geometry.coordinates[0] };
  }

  // For Polygon / MultiPolygon, average all coordinate pairs
  let coords = [];

  if (geometry.type === 'Polygon') {
    coords = geometry.coordinates[0]; // outer ring
  } else if (geometry.type === 'MultiPolygon') {
    geometry.coordinates.forEach(polygon => {
      coords = coords.concat(polygon[0]);
    });
  } else if (geometry.type === 'GeometryCollection') {
    geometry.geometries.forEach(g => {
      const c = computeCenter(g);
      if (c) coords.push([c.lng, c.lat]);
    });
  } else {
    return null;
  }

  if (!coords.length) return null;

  const sumLng = coords.reduce((acc, c) => acc + c[0], 0);
  const sumLat = coords.reduce((acc, c) => acc + c[1], 0);
  return {
    lat: sumLat / coords.length,
    lng: sumLng / coords.length
  };
}

// Check if a coordinate falls within a bounding box
function isWithinBounds(lat, lng, bounds) {
  if (!bounds) return true; // no bounds = show all
  const sw = bounds.getSouthWest ? bounds.getSouthWest() : bounds._southWest;
  const ne = bounds.getNorthEast ? bounds.getNorthEast() : bounds._northEast;
  if (!sw || !ne) return true;

  return lat >= sw.lat && lat <= ne.lat && lng >= sw.lng && lng <= ne.lng;
}

// Parse an NWS alert feature into a normalized object
function parseAlert(feature) {
  const p = feature.properties || {};
  const centroid = computeCenter(feature.geometry);
  if (!centroid) return null;

  return {
    id: feature.id || p.id,
    headline: p.headline || p.event || 'Weather Alert',
    description: p.description || '',
    instruction: p.instruction || '',
    event: p.event || 'Unknown',
    severity: p.severity || 'Unknown',
    urgency: p.urgency || 'Unknown',
    certainty: p.certainty || 'Unknown',
    areaDesc: p.areaDesc || '',
    onset: p.onset || p.effective || null,
    expires: p.expires || p.ends || null,
    nwsUrl: p['@id'] || null,
    centroid
  };
}

// Hook that fetches and returns active NWS weather alerts (every 5 min)
export function useWeatherAlerts({ enabled, minSeverity, mapBounds }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);
  const abortRef = useRef(null);

  const minLevel = SEVERITY_LEVELS[minSeverity] ?? SEVERITY_LEVELS.Minor;

  const fetchAlerts = useCallback(async () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(NWS_ALERTS_URL, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'nr-labs-widget-pack/nr-mapbox (newrelic.com)',
          Accept: 'application/geo+json'
        }
      });

      if (!res.ok) {
        // eslint-disable-next-line no-console
        console.error(`NWS API error: ${res.status} ${res.statusText}`);
        return false;
      }

      const geojson = await res.json();
      const features = geojson.features || [];

      const parsed = features.map(parseAlert).filter(a => {
        if (!a) return false;

        const alertLevel =
          SEVERITY_LEVELS[a.severity] ?? SEVERITY_LEVELS.Unknown;
        if (alertLevel < minLevel) return false;

        return isWithinBounds(a.centroid.lat, a.centroid.lng, mapBounds);
      });

      setAlerts(parsed);
    } catch (err) {
      if (err.name === 'AbortError') return; // component unmounted or re-fetched
      // eslint-disable-next-line no-console
      console.error('[useWeatherAlerts] Fetch failed:', err);
      setError(err.message || 'Failed to load weather alerts');
    } finally {
      setLoading(false);
    }
  }, [minLevel, mapBounds]);

  useEffect(() => {
    if (!enabled) {
      setAlerts([]);
      setLoading(false);
      setError(null);
      return;
    }

    fetchAlerts();

    intervalRef.current = setInterval(fetchAlerts, WEATHER_ALERT_POLL_MS);

    return () => {
      clearInterval(intervalRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [enabled, fetchAlerts]);

  return { alerts, loading, error };
}

export default useWeatherAlerts;
