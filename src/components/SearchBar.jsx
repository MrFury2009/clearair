import { useState } from 'react';
import axios from 'axios';

export default function SearchBar({ onResult }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: { format: 'json', q: query.trim(), limit: 1 },
        headers: { 'Accept-Language': 'en' },
      });
      if (res.data.length === 0) {
        setError('Location not found');
        return;
      }
      const { lat, lon, display_name } = res.data[0];
      onResult({ lat: parseFloat(lat), lng: parseFloat(lon), label: display_name });
    } catch {
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  }

  function handleGps() {
    if (!navigator.geolocation) {
      setError('GPS not available');
      return;
    }
    setGpsLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onResult({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: 'My Location' });
        setGpsLoading(false);
      },
      () => {
        setError('GPS access denied');
        setGpsLoading(false);
      }
    );
  }

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-full max-w-lg px-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search address or location..."
          className="flex-1 bg-[#111111] border border-[#2a2a2a] text-[#f5f5f5] placeholder-[#555] rounded px-3 py-2 text-sm font-mono outline-none focus:border-[#444] transition-colors"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-[#1a1a1a] border border-[#2a2a2a] text-[#f5f5f5] px-3 py-2 rounded text-sm font-mono hover:border-[#444] transition-colors disabled:opacity-50"
        >
          {loading ? '...' : 'CHECK'}
        </button>
        <button
          type="button"
          onClick={handleGps}
          disabled={gpsLoading}
          title="Use My Location"
          className="bg-[#1a1a1a] border border-[#2a2a2a] text-[#f5f5f5] px-3 py-2 rounded text-sm font-mono hover:border-[#444] transition-colors disabled:opacity-50"
        >
          {gpsLoading ? '...' : '⊕'}
        </button>
      </form>
      {error && (
        <p className="mt-1 text-xs text-red-400 font-mono px-1">{error}</p>
      )}
    </div>
  );
}
