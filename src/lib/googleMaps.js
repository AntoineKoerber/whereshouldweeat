const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

if (!API_KEY) {
  console.error('Missing Google Maps API key. Please check your .env file.');
}

let googleMapsLoaded = false;
let loadPromise = null;

export const loadGoogleMaps = async () => {
  if (googleMapsLoaded) {
    return window.google;
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = (async () => {
    // Load the Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;

    return new Promise((resolve, reject) => {
      script.onload = () => {
        googleMapsLoaded = true;
        resolve(window.google);
      };
      script.onerror = () => {
        reject(new Error('Failed to load Google Maps'));
      };
      document.head.appendChild(script);
    });
  })();

  return loadPromise;
};

// Get user's current location using browser geolocation
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
};

// Geocode an address to get coordinates
export const geocodeAddress = async (address) => {
  const google = await loadGoogleMaps();
  const geocoder = new google.maps.Geocoder();

  return new Promise((resolve, reject) => {
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const location = results[0].geometry.location;
        resolve({
          lat: location.lat(),
          lng: location.lng(),
          formatted_address: results[0].formatted_address
        });
      } else {
        reject(new Error(`Geocoding failed: ${status}`));
      }
    });
  });
};

// List of fast food chains to exclude
const EXCLUDED_FAST_FOOD_CHAINS = [
  'mcdonald',
  'mcdo',
  'burger king',
  'burgerking',
  'bk',
  'kfc',
  'subway',
  'taco bell',
  'wendy',
  'five guys',
  'in-n-out',
  'white castle',
  'jack in the box',
  'carl\'s jr',
  'hardee',
  'sonic',
  'arby',
  'popeyes',
  'chick-fil-a',
  'chipotle'
];

// Check if a place is a fast food chain
const isFastFoodChain = (placeName) => {
  if (!placeName) return false;
  const lowerName = placeName.toLowerCase();
  return EXCLUDED_FAST_FOOD_CHAINS.some(chain => lowerName.includes(chain));
};

// Search for restaurants using Google Places API
export const searchRestaurants = async (location, filters, excludedPlaceIds = []) => {
  const google = await loadGoogleMaps();
  const map = new google.maps.Map(document.createElement('div'));
  const service = new google.maps.places.PlacesService(map);

  const request = {
    location: new google.maps.LatLng(location.lat, location.lng),
    radius: filters.radius, // in meters
    type: 'restaurant',
    openNow: true
  };

  // Add price level filter if specified
  if (filters.maxPriceLevel) {
    request.maxPriceLevel = filters.maxPriceLevel;
  }

  // Add minimum rating if specified
  if (filters.minRating) {
    request.minRating = filters.minRating;
  }

  // Add keyword for cuisine type if specified
  if (filters.cuisineType) {
    request.keyword = filters.cuisineType;
  }

  return new Promise((resolve, reject) => {
    service.nearbySearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        // Filter out previously visited restaurants, fast food chains, and verify open status
        const filteredResults = results.filter(place => {
          // Exclude previously visited
          if (excludedPlaceIds.includes(place.place_id)) {
            return false;
          }

          // Exclude fast food chains
          if (isFastFoodChain(place.name)) {
            return false;
          }

          // Double-check opening hours if available
          if (place.opening_hours) {
            return place.opening_hours.isOpen?.() !== false;
          }

          // Include if no opening hours data (benefit of the doubt)
          return true;
        });
        resolve(filteredResults);
      } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
        resolve([]);
      } else {
        reject(new Error(`Places search failed: ${status}`));
      }
    });
  });
};

// Get detailed information about a place
export const getPlaceDetails = async (placeId) => {
  const google = await loadGoogleMaps();
  const map = new google.maps.Map(document.createElement('div'));
  const service = new google.maps.places.PlacesService(map);

  const request = {
    placeId: placeId,
    fields: [
      'name',
      'formatted_address',
      'geometry',
      'rating',
      'user_ratings_total',
      'price_level',
      'photos',
      'types',
      'opening_hours',
      'formatted_phone_number',
      'website',
      'reviews'
    ]
  };

  return new Promise((resolve, reject) => {
    service.getDetails(request, (place, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        resolve(place);
      } else {
        reject(new Error(`Place details failed: ${status}`));
      }
    });
  });
};

// Calculate driving duration from origin to destination
export const calculateDrivingDuration = async (origin, destination) => {
  const google = await loadGoogleMaps();
  const service = new google.maps.DistanceMatrixService();

  return new Promise((resolve, reject) => {
    service.getDistanceMatrix(
      {
        origins: [origin],
        destinations: [destination],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC
      },
      (response, status) => {
        if (status === 'OK' && response.rows[0].elements[0].status === 'OK') {
          const element = response.rows[0].elements[0];
          resolve({
            distance: element.distance.value, // in meters
            duration: element.duration.value, // in seconds
            durationText: element.duration.text,
            distanceText: element.distance.text
          });
        } else {
          reject(new Error(`Distance Matrix failed: ${status}`));
        }
      }
    );
  });
};

// Generate Google Maps URL for navigation
export const getNavigationUrl = (lat, lng) => {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
};

// Create a map instance
export const createMap = async (container, options) => {
  const google = await loadGoogleMaps();
  return new google.maps.Map(container, options);
};

// Create a marker
export const createMarker = async (map, position, options = {}) => {
  const google = await loadGoogleMaps();
  return new google.maps.Marker({
    map,
    position,
    ...options
  });
};
