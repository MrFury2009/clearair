import { useState, useEffect } from 'react';
import Map from './components/Map';
import SearchBar from './components/SearchBar';
import VerdictSheet from './components/VerdictSheet';
import { checkAirspace } from './utils/rulesEngine';
import { airspaceData } from './data/airspace';

// FAA UAS DDS airspace GeoJSON — fetched at runtime; falls back to empty FeatureCollection
const FAA_GEOJSON_URL = 'https://uas-faa.opendata.arcgis.com/datasets/dd0d1b726e504f8bbd5bef4699a89e68_0.geojson';

export default function App() {
  const [userLocation, setUserLocation] = useState(null);
  const [verdict, setVerdict] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [airspaceFeatures, setAirspaceFeatures] = useState(airspaceData.features);
  const [dataStatus, setDataStatus] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    fetch(FAA_GEOJSON_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        if (data?.features?.length) {
          setAirspaceFeatures(data.features);
          setDataStatus('ready');
        } else {
          setDataStatus('fallback');
        }
      })
      .catch((err) => {
        console.error('[ClearAir] FAA airspace fetch failed:', err.message);
        if (!cancelled) setDataStatus('fallback');
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!userLocation) return;
    setIsChecking(true);
    const result = checkAirspace(userLocation.lat, userLocation.lng, airspaceFeatures);
    setVerdict(result);
    setIsChecking(false);
  }, [userLocation, airspaceFeatures]);

  function handleSearchResult({ lat, lng, label }) {
    setUserLocation({ lat, lng, label });
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100dvh', background: '#0a0a0a', overflow: 'hidden' }}>
      <Map center={userLocation} airspaceFeatures={airspaceFeatures} />

      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '56px',
        background: 'rgba(10,10,10,0.85)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid #1a1a1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        zIndex: 15,
      }}>
        <span style={{ fontFamily: 'monospace', fontSize: '13px', letterSpacing: '0.2em', color: '#f5f5f5', fontWeight: 'bold' }}>
          CLEARAIR
        </span>
        <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#444', letterSpacing: '0.15em' }}>
          {dataStatus === 'loading' ? 'LOADING AIRSPACE...' : dataStatus === 'ready' ? 'FAA DATA LIVE' : 'FALLBACK MODE'}
        </span>
      </div>

      <SearchBar onResult={handleSearchResult} />

      {isChecking && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          color: '#f5f5f5',
          fontFamily: 'monospace',
          fontSize: '12px',
          letterSpacing: '0.1em',
          zIndex: 30,
        }}>
          CHECKING...
        </div>
      )}

      <VerdictSheet verdict={verdict} onClose={() => setVerdict(null)} />
    </div>
  );
}
