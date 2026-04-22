import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const TILE_URL = 'https://api.protomaps.com/tiles/v3/{z}/{x}/{y}.pbf?key=DEMO_KEY';

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

  useEffect(() => {
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
    mapRef.current = map;

    return () => map.remove();
  }, []);

  // Update airspace layer when features change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

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
  }, [airspaceFeatures]);

  // Fly to center and place marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !center) return;

    map.flyTo({ center: [center.lng, center.lat], zoom: 13, duration: 1200 });

    if (markerRef.current) markerRef.current.remove();

    const el = document.createElement('div');
    el.style.cssText = `
      width: 18px; height: 18px;
      border-radius: 50%;
      background: #f5f5f5;
      border: 3px solid #0a0a0a;
      box-shadow: 0 0 0 2px #f5f5f5, 0 2px 8px rgba(0,0,0,0.8);
    `;
    markerRef.current = new maplibregl.Marker({ element: el })
      .setLngLat([center.lng, center.lat])
      .addTo(map);
  }, [center]);

  return <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />;
}
