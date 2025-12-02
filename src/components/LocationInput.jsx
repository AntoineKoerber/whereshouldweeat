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
      setError(
        err.message === 'User denied Geolocation'
          ? 'Please enable location permissions to use auto-location'
          : 'Failed to get your location. Please try manual entry.'
      );
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
          onClick={() => setInputMode('auto')}
          disabled={loading}
        >
          Auto-detect
        </button>
        <button
          className={inputMode === 'manual' ? 'active' : ''}
          onClick={() => setInputMode('manual')}
          disabled={loading}
        >
          Enter Address
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
            {loading ? 'Getting Location...' : 'Use My Location'}
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
            {loading ? 'Finding Location...' : 'Set Location'}
          </button>
        </form>
      )}

      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

export default LocationInput;
