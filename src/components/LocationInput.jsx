import { useState, useEffect, useRef } from 'react';
import { getCurrentLocation, geocodeAddress, loadGoogleMaps } from '../lib/googleMaps';
import './LocationInput.css';

function LocationInput({ onLocationSet }) {
  const [inputMode, setInputMode] = useState('auto'); // 'auto' or 'manual'
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const autocompleteService = useRef(null);
  const inputRef = useRef(null);

  // Initialize Google Places Autocomplete Service
  useEffect(() => {
    const initAutocomplete = async () => {
      const google = await loadGoogleMaps();
      autocompleteService.current = new google.maps.places.AutocompleteService();
    };
    initAutocomplete();
  }, []);

  // Handle address input changes and fetch suggestions
  const handleAddressChange = async (e) => {
    const value = e.target.value;
    setAddress(value);
    setError(null);

    if (value.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (!autocompleteService.current) return;

    try {
      autocompleteService.current.getPlacePredictions(
        {
          input: value,
          types: ['geocode', 'establishment']
        },
        (predictions, status) => {
          if (status === 'OK' && predictions) {
            setSuggestions(predictions);
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        }
      );
    } catch (err) {
      console.error('Autocomplete error:', err);
    }
  };

  // Handle suggestion selection
  const handleSuggestionClick = async (suggestion) => {
    setAddress(suggestion.description);
    setShowSuggestions(false);
    setSuggestions([]);

    setLoading(true);
    setError(null);

    try {
      const result = await geocodeAddress(suggestion.description);
      onLocationSet({
        lat: result.lat,
        lng: result.lng,
        address: result.formatted_address
      });
    } catch (err) {
      setError({
        type: 'general',
        message: 'Could not find that address',
        instructions: 'Please try another address or use auto-detect'
      });
    } finally {
      setLoading(false);
    }
  };

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
      setError({
        type: 'general',
        message: 'Please enter an address',
        instructions: 'Type your city, address, or location'
      });
      return;
    }

    setLoading(true);
    setError(null);
    setShowSuggestions(false);

    try {
      const result = await geocodeAddress(address);
      onLocationSet({
        lat: result.lat,
        lng: result.lng,
        address: result.formatted_address
      });
    } catch (err) {
      setError({
        type: 'general',
        message: 'Could not find that address',
        instructions: 'Please try another address or select from suggestions above'
      });
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
          <div className="autocomplete-container">
            <input
              ref={inputRef}
              type="text"
              placeholder="Enter your address or location"
              value={address}
              onChange={handleAddressChange}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              disabled={loading}
              autoComplete="off"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="suggestions-dropdown">
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion.place_id}
                    className="suggestion-item"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <span className="suggestion-icon">📍</span>
                    <div className="suggestion-text">
                      <div className="suggestion-main">{suggestion.structured_formatting.main_text}</div>
                      <div className="suggestion-secondary">{suggestion.structured_formatting.secondary_text}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
