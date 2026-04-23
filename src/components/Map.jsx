import { useEffect, useRef, useState } from 'react';

// maplibre-gl is loaded dynamically after first render to avoid
// blocking initial paint. CSS is also imported dynamically.

const AIRSPACE_COLORS = [
  ['==', ['get', 'TYPE_CODE'], 'P'], '#ef4444',
  ['==', ['get', 'TYPE_CODE'], 'R'], '#ef4444',
  ['==', ['get', 'TYPE_CODE'], 'TFR'], '#ef4444',
  ['==', ['get', 'TYPE_CODE'], 'B'], '#f97316',
  ['==', ['get', 'CLASS'], 'B'], '#f97316',
  ['==', ['get', 'TYPE_CODE'], 'C'], '#eab308',
  ['==', ['get', 'CLASS'], 'C'], '#eab308',
  ['==', ['get', 'TYPE_CODE'], 'D'], '#eab308',
  ['==', ['get', 'CLASS'], 'D'], '#eab308',
  ['==', ['get', 'TYPE_CODE'], 'E'], '#22c55e',
  ['==', ['get', 'CLASS'], 'E'], '#22c55e',
  '#3b82f6',
];

export default function Map({ center, airspaceFeatures }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // ── Dynamic load: runs after first paint ───────────────────────────
  useEffect(() => {
    let cancelled = false;

    Promise.all([
      import('maplibre-gl'),
      import('maplibre-gl/dist/maplibre-gl.css'),
    ]).then(([{ default: maplibregl }]) => {
      if (cancelled || !containerRef.current) return;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: {
          version: 8,
          glyphs: 'https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf',
          sources: {
            protomaps: {
              type: 'vector',
              url: `https://api.protomaps.com/tiles/v3.json?key=DEMO_KEY`,
              attribution: '© Protomaps © OpenStreetMap',
            },
          },
          layers: [
            { id: 'background', type: 'background', paint: { 'background-color': '#0a0a0a' } },
            {
              id: 'water',
              type: 'fill',
              source: 'protomaps',
              'source-layer': 'water',
              paint: { 'fill-color': '#111827' },
            },
            {
              id: 'landuse',
              type: 'fill',
              source: 'protomaps',
              'source-layer': 'landuse',
              paint: { 'fill-color': '#141414' },
            },
            {
              id: 'roads',
              type: 'line',
              source: 'protomaps',
              'source-layer': 'roads',
              paint: { 'line-color': '#1f2937', 'line-width': 1 },
            },
            {
              id: 'boundaries',
              type: 'line',
              source: 'protomaps',
              'source-layer': 'boundaries',
              paint: { 'line-color': '#374151', 'line-width': 1 },
            },
            {
              id: 'places',
              type: 'symbol',
              source: 'protomaps',
              'source-layer': 'places',
              layout: {
                'text-field': ['get', 'name'],
                'text-font': ['Noto Sans Regular'],
                'text-size': 11,
              },
              paint: { 'text-color': '#6b7280', 'text-halo-color': '#0a0a0a', 'text-halo-width': 1 },
            },
          ],
        },
        center: [-98.5, 39.8],
        zoom: 4,
      });

      map.addControl(new maplibregl.NavigationControl(), 'bottom-right');

      // Opacity fade-in on load (CSS transition defined in index.css)
      map.on('load', () => {
        if (cancelled) return;
        if (containerRef.current) {
          containerRef.current.style.opacity = '1';
        }
        setMapLoaded(true);
      });

      mapRef.current = map;
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // ── Update airspace layer when features or map readiness change ────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const geojson = {
      type: 'FeatureCollection',
      features: airspaceFeatures || [],
    };

    if (map.getSource('airspace')) {
      map.getSource('airspace').setData(geojson);
    } else {
      map.addSource('airspace', { type: 'geojson', data: geojson });
      map.addLayer({
        id: 'airspace-fill',
        type: 'fill',
        source: 'airspace',
        paint: {
          'fill-color': ['case', ...AIRSPACE_COLORS],
          'fill-opacity': 0.25,
        },
      });
      map.addLayer({
        id: 'airspace-outline',
        type: 'line',
        source: 'airspace',
        paint: {
          'line-color': ['case', ...AIRSPACE_COLORS],
          'line-width': 1.5,
          'line-opacity': 0.7,
        },
      });
    }
  }, [airspaceFeatures, mapLoaded]);

  // ── Fly to center and place marker with pin-drop animation ─────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !center) return;

    map.flyTo({ center: [center.lng, center.lat], zoom: 13, duration: 1200 });

    if (markerRef.current) markerRef.current.remove();

    // maplibregl is guaranteed loaded by the time mapLoaded is true
    import('maplibre-gl').then(({ default: maplibregl }) => {
      const el = document.createElement('div');
      el.style.cssText = `
        width: 18px; height: 18px;
        border-radius: 50%;
        background: #f5f5f5;
        border: 3px solid #0a0a0a;
        box-shadow: 0 0 0 2px #f5f5f5, 0 2px 8px rgba(0,0,0,0.8);
      `;
      // Spring-feel pin-drop animation (keyframe defined in index.css)
      el.classList.add('pin-drop');

      markerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([center.lng, center.lat])
        .addTo(map);
    });
  }, [center, mapLoaded]);

  return (
    <div
      ref={containerRef}
      className="map-container"
      style={{ position: 'absolute', inset: 0, opacity: 0 }}
    />
  );
}
