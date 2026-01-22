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

// List of fast food chains and supermarket restaurants to exclude
const EXCLUDED_FAST_FOOD_CHAINS = [
  // Fast food chains
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
  'chipotle',

  // Supermarket restaurants
  'coop restaurant',
  'migros restaurant',
  'aldi restaurant',
  'lidl restaurant',
  'walmart',
  'target cafe',
  'costco food court',
  'ikea restaurant',
  'whole foods',
  'trader joe',
  'safeway',
  'kroger',
  'publix',
  'carrefour',
  'tesco cafe',
  'asda cafe',
  'sainsbury',
  'waitrose cafe',
  'auchan',
  'leclerc',
  'intermarché',
  'casino',
  'monoprix'
];

// List of non-restaurant place types to exclude
const EXCLUDED_PLACE_TYPES = [
  'gas_station',
  'convenience_store',
  'store',
  'supermarket',
  'grocery_or_supermarket',
  'shopping_mall',
  'lodging',
  'car_dealer',
  'car_repair',
  'parking',
  'bank',
  'atm',
  'hospital',
  'pharmacy',
  'airport',
  'train_station',
  'transit_station',
  'bus_station',
  'subway_station',
  'school',
  'university',
  'library',
  'church',
  'mosque',
  'synagogue',
  'hindu_temple'
];

// Check if a place is a fast food chain or supermarket restaurant
const isFastFoodChain = (placeName) => {
  if (!placeName) return false;
  const lowerName = placeName.toLowerCase();
  return EXCLUDED_FAST_FOOD_CHAINS.some(chain => lowerName.includes(chain));
};

// Check if a place has non-restaurant types
const isNonRestaurant = (placeTypes) => {
  if (!placeTypes || placeTypes.length === 0) return false;

  // Check if it has restaurant-related types
  const restaurantTypes = ['restaurant', 'food', 'cafe', 'meal_takeaway', 'meal_delivery'];
  const hasRestaurantType = placeTypes.some(type => restaurantTypes.includes(type));

  // If it has restaurant types, it's a restaurant (including bars that serve food)
  if (hasRestaurantType) {
    return false;
  }

  // Only exclude bars/night clubs if they DON'T have restaurant types
  const barTypes = ['bar', 'night_club'];
  const isPureBar = placeTypes.some(type => barTypes.includes(type));

  if (isPureBar) {
    return true; // Exclude pure bars
  }

  // If it doesn't have restaurant types and has excluded types, exclude it
  return placeTypes.some(type => EXCLUDED_PLACE_TYPES.includes(type));
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
        // Filter out previously visited restaurants, fast food chains, supermarket restaurants, non-restaurants, and verify open status
        const filteredResults = results.filter(place => {
          // Exclude previously visited
          if (excludedPlaceIds.includes(place.place_id)) {
            return false;
          }

          // Exclude non-restaurant places (gas stations, stores, etc.)
          if (isNonRestaurant(place.types)) {
            return false;
          }

          // Exclude fast food chains and supermarket restaurants
          if (isFastFoodChain(place.name)) {
            return false;
          }

          // Double-check opening hours if available
          if (place.opening_hours) {
            const isOpen = place.opening_hours.isOpen?.() !== false;
            if (!isOpen) {
              return false;
            }
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

// Calculate travel duration with specific travel mode
export const calculateTravelDuration = async (origin, destination, mode = 'DRIVING') => {
  const google = await loadGoogleMaps();
  const service = new google.maps.DistanceMatrixService();

  return new Promise((resolve, reject) => {
    service.getDistanceMatrix(
      {
        origins: [origin],
        destinations: [destination],
        travelMode: google.maps.TravelMode[mode],
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
          const errorMsg = response?.rows?.[0]?.elements?.[0]?.status || status;
          reject(new Error(`Distance Matrix failed: ${errorMsg}`));
        }
      }
    );
  });
};

// Generate navigation URL that works with multiple map apps
export const getNavigationUrl = (lat, lng) => {
  // Universal maps URL that works across different platforms and apps
  // iOS: Opens in Apple Maps (or Google Maps if installed and preferred)
  // Android: Prompts user to choose their preferred map app
  // Desktop: Opens in Google Maps web version

  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isAndroid = /Android/i.test(navigator.userAgent);

  if (isIOS) {
    // Apple Maps URL scheme - works on all iOS devices
    // Will open in Apple Maps by default, or Google Maps if user prefers it
    return `maps://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`;
  } else if (isAndroid) {
    // Google Maps intent URL - lets Android users choose their preferred app
    // Works with Google Maps, Waze, HERE Maps, etc.
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  } else {
    // Desktop: Use Google Maps web URL
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }
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

// Calculate approximate travel time using straight-line distance (fallback)
export const calculateApproximateTravelTime = async (origin, destination) => {
  const google = await loadGoogleMaps();

  // Create LatLng objects
  const originLatLng = new google.maps.LatLng(origin.lat, origin.lng);
  const destLatLng = new google.maps.LatLng(destination.lat, destination.lng);

  // Calculate straight-line distance in meters
  const distanceMeters = google.maps.geometry.spherical.computeDistanceBetween(originLatLng, destLatLng);
  const distanceKm = distanceMeters / 1000;

  // Approximate travel times (these are rough estimates)
  // Driving: assume average 30 km/h in city (accounting for traffic, stops)
  // Walking: assume average 5 km/h
  const drivingMinutes = Math.round((distanceKm / 30) * 60);
  const walkingMinutes = Math.round((distanceKm / 5) * 60);

  // Format duration text
  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min${minutes !== 1 ? 's' : ''}`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours} hour${hours !== 1 ? 's' : ''} ${mins} min${mins !== 1 ? 's' : ''}` : `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
  };

  // Format distance text
  const formatDistance = (meters) => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    } else {
      return `${(meters / 1000).toFixed(1)} km`;
    }
  };

  return {
    driving: {
      distance: distanceMeters,
      duration: drivingMinutes * 60, // in seconds
      durationText: formatDuration(drivingMinutes),
      distanceText: formatDistance(distanceMeters)
    },
    walking: {
      distance: distanceMeters,
      duration: walkingMinutes * 60, // in seconds
      durationText: formatDuration(walkingMinutes),
      distanceText: formatDistance(distanceMeters)
    }
  };
};
