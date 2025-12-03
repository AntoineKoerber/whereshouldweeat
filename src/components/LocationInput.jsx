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

      // More specific error messages with instructions
      if (err.message && err.message.includes('denied')) {
        setError({
          type: 'permission',
          message: 'Location access blocked',
          instructions: 'To enable location access: Tap the address bar → Site Settings → Location → Allow'
        });
      } else if (err.code === 1) {
        setError({
          type: 'permission',
          message: 'Location access blocked',
          instructions: 'To enable location access: Tap the address bar → Site Settings → Location → Allow'
        });
      } else if (err.code === 2) {
        setError({
          type: 'unavailable',
          message: 'Location unavailable',
          instructions: 'Please check that location services are enabled on your device'
        });
      } else if (err.code === 3) {
        setError({
          type: 'timeout',
          message: 'Location request timed out',
          instructions: 'Please try again or use manual address entry'
        });
      } else {
        setError({
          type: 'general',
          message: 'Could not detect location',
          instructions: 'Please use manual address entry below'
        });
      }

      // Don't auto-switch anymore - let user see the instructions
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
          <p>Click the button below and allow location access when prompted by your browser</p>
          <button
            onClick={handleAutoLocation}
            disabled={loading}
            className="primary-button"
          >
            <span>{loading ? 'Getting Location...' : 'Use My Location'}</span>
          </button>
          <p className="location-hint">💡 Your browser will ask for permission to access your location</p>
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

      {error && (
        <div className="error-message">
          <div className="error-title">❌ {error.message}</div>
          <div className="error-instructions">{error.instructions}</div>
          <button
            onClick={() => setInputMode('manual')}
            className="switch-to-manual-btn"
          >
            Switch to Manual Entry
          </button>
        </div>
      )}
    </div>
  );
}

export default LocationInput;
