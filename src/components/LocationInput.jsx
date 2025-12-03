import { useState } from 'react';
import { getCurrentLocation, geocodeAddress } from '../lib/googleMaps';
import './LocationInput.css';

function LocationInput({ onLocationSet }) {
  const [inputMode, setInputMode] = useState('auto'); // 'auto' or 'manual'
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAutoLocation = async () => {
    setLoading(true);
    setError(null);

    try {
      const location = await getCurrentLocation();
      onLocationSet(location);
    } catch (err) {
      console.error('Geolocation error:', err);

      // More specific error messages
      if (err.message && err.message.includes('denied')) {
        setError('Location access denied. Please enable location permissions or use manual entry.');
      } else if (err.code === 1) {
        setError('Location access denied. Please enable location permissions or use manual entry.');
      } else if (err.code === 2) {
        setError('Location unavailable. Please try manual entry.');
      } else if (err.code === 3) {
        setError('Location request timed out. Please try again or use manual entry.');
      } else {
        setError('Could not detect location. Please use manual entry.');
      }

      // Auto-switch to manual mode after error
      setInputMode('manual');
    } finally {
      setLoading(false);
    }
  };

  const handleManualLocation = async (e) => {
    e.preventDefault();

    if (!address.trim()) {
      setError('Please enter an address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await geocodeAddress(address);
      onLocationSet({
        lat: result.lat,
        lng: result.lng,
        address: result.formatted_address
      });
    } catch (err) {
      setError('Could not find that address. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="location-input">
      <h2>Where are you?</h2>

      <div className="location-mode-toggle">
        <button
          className={inputMode === 'auto' ? 'active' : ''}
          onClick={() => {
            setInputMode('auto');
            setError(null);
          }}
          disabled={loading}
        >
          <span>Auto-detect</span>
        </button>
        <button
          className={inputMode === 'manual' ? 'active' : ''}
          onClick={() => {
            setInputMode('manual');
            setError(null);
          }}
          disabled={loading}
        >
          <span>Enter Address</span>
        </button>
      </div>

      {inputMode === 'auto' ? (
        <div className="auto-location">
          <p>Let us detect your current location</p>
          <button
            onClick={handleAutoLocation}
            disabled={loading}
            className="primary-button"
          >
            <span>{loading ? 'Getting Location...' : 'Use My Location'}</span>
          </button>
        </div>
      ) : (
        <form onSubmit={handleManualLocation} className="manual-location">
          <input
            type="text"
            placeholder="Enter your address or location"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="primary-button"
          >
            <span>{loading ? 'Finding Location...' : 'Set Location'}</span>
          </button>
        </form>
      )}

      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

export default LocationInput;
