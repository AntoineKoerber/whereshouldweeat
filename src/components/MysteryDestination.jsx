import { useEffect, useRef, useState } from 'react';
import { createMap, createMarker, getNavigationUrl, getPlaceDetails } from '../lib/googleMaps';
import './MysteryDestination.css';

function MysteryDestination({ restaurant, userLocation, onReveal, travelInfo }) {
  const mapRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [todayHours, setTodayHours] = useState(null);
  const [placeDetails, setPlaceDetails] = useState(null);

  // Fetch place details to get opening hours
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const details = await getPlaceDetails(restaurant.place_id);
        setPlaceDetails(details);

        // Get today's opening hours
        if (details.opening_hours?.weekday_text) {
          const today = new Date().getDay();
          // weekday_text is ordered starting from Sunday (0)
          const todayIndex = today;
          setTodayHours(details.opening_hours.weekday_text[todayIndex]);
        }
      } catch (error) {
        console.error('Error fetching place details:', error);
      }
    };

    fetchDetails();
  }, [restaurant]);

  useEffect(() => {
    if (mapRef.current && restaurant) {
      const initMap = async () => {
        const location = {
          lat: restaurant.geometry.location.lat(),
          lng: restaurant.geometry.location.lng()
        };

        const map = await createMap(mapRef.current, {
          center: location,
          zoom: 15,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true
        });

        // Add marker for restaurant
        await createMarker(map, location, {
          title: 'Mystery Restaurant',
          animation: window.google.maps.Animation.DROP
        });

        // Add marker for user location
        await createMarker(map, userLocation, {
          title: 'Your Location',
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#4285F4',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2
          }
        });

        setMapInstance(map);
      };

      initMap();
    }
  }, [restaurant, userLocation]);

  const handleNavigate = () => {
    const url = getNavigationUrl(
      restaurant.geometry.location.lat(),
      restaurant.geometry.location.lng()
    );
    window.open(url, '_blank');
  };

  // Helper function to hide restaurant name in review text
  const hideRestaurantName = (text, restaurantName) => {
    if (!restaurantName || !text) return text;

    // Create a case-insensitive regex to find the restaurant name
    const nameRegex = new RegExp(restaurantName, 'gi');
    return text.replace(nameRegex, '███████');
  };

  const handleShowReviews = async () => {
    if (showReviews) {
      setShowReviews(false);
      return;
    }

    if (reviews.length > 0) {
      setShowReviews(true);
      return;
    }

    setLoadingReviews(true);

    try {
      // Fetch detailed place info to get reviews
      const details = await getPlaceDetails(restaurant.place_id);

      if (!details.reviews || details.reviews.length === 0) {
        alert('No reviews available for this restaurant yet!');
        setLoadingReviews(false);
        return;
      }

      // Take top 3-4 reviews and hide restaurant name
      const processedReviews = details.reviews.slice(0, 4).map(review => ({
        ...review,
        text: hideRestaurantName(review.text, details.name)
      }));

      setReviews(processedReviews);
      setShowReviews(true);
      setLoadingReviews(false);
    } catch (error) {
      console.error('Error loading reviews:', error);
      alert('Unable to load reviews. Please try again.');
      setLoadingReviews(false);
    }
  };

  const priceLevel = restaurant.price_level
    ? '$'.repeat(restaurant.price_level)
    : 'N/A';

  const rating = restaurant.rating ? `${restaurant.rating} ⭐` : 'No rating';

  // Check if restaurant is currently open
  let isOpen = true; // Default to true if no data
  if (restaurant.opening_hours) {
    // Check open_now property first (most reliable)
    if (restaurant.opening_hours.open_now !== undefined) {
      isOpen = restaurant.opening_hours.open_now;
    }
    // Try the isOpen() method as fallback
    else if (typeof restaurant.opening_hours.isOpen === 'function') {
      try {
        isOpen = restaurant.opening_hours.isOpen();
      } catch (e) {
        // If method fails, assume open
        isOpen = true;
      }
    }
  }
  const openStatus = isOpen ? 'Open Now' : 'Currently Closed';
  const openClass = isOpen ? 'open' : 'closed';

  return (
    <div className="mystery-destination">
      <div className="mystery-header">
        <h2>Your Mystery Destination Awaits!</h2>
        <p className="mystery-tagline">
          Adventure time! We've found the perfect spot for you.
        </p>
        <button onClick={handleNavigate} className="lets-go-button">
          <span>Let's Go! 🚗</span>
        </button>
      </div>

      <div className="mystery-map" ref={mapRef}></div>

      <div className="mystery-info">
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Rating</span>
            <span className="info-value">{rating}</span>
          </div>

          <div className="info-item">
            <span className="info-label">Price</span>
            <span className="info-value">{priceLevel}</span>
          </div>

          <div className="info-item">
            <span className="info-label">🚗 Drive Time</span>
            <span className="info-value">
              {travelInfo?.driving ? travelInfo.driving.durationText : 'Calculating...'}
            </span>
            {travelInfo?.driving && (
              <span className="info-sublabel">{travelInfo.driving.distanceText}</span>
            )}
          </div>

          <div className="info-item">
            <span className="info-label">Today's Hours</span>
            <span className="info-value info-hours">
              {todayHours ? (
                <>
                  <span className={`status-dot ${openClass}`}></span>
                  {todayHours.split(': ')[1] || 'Check hours'}
                </>
              ) : (
                'Loading...'
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="mystery-actions">
        <button onClick={onReveal} className="reveal-button">
          <span>Reveal Restaurant</span>
        </button>

        <button
          onClick={handleShowReviews}
          className={`review-button ${showReviews ? 'active' : ''}`}
          disabled={loadingReviews}
        >
          <span>{loadingReviews ? 'Loading...' : showReviews ? 'Hide Reviews' : '📝 Read Reviews'}</span>
        </button>
      </div>

      {showReviews && reviews.length > 0 && (
        <div className="mystery-reviews">
          <h3>What People Are Saying</h3>
          <div className="reviews-list">
            {reviews.map((review, index) => (
              <div key={index} className="review-card">
                <div className="review-header">
                  <div className="review-author">
                    <strong>{review.author_name}</strong>
                    <span className="review-time">{review.relative_time_description}</span>
                  </div>
                  <div className="review-rating">
                    {'⭐'.repeat(review.rating)}
                  </div>
                </div>
                <p className="review-text">{review.text}</p>
              </div>
            ))}
          </div>
          <p className="review-note">
            Note: Restaurant name hidden to preserve the mystery!
          </p>
        </div>
      )}

      <div className="mystery-hint">
        <p>
          The restaurant name will remain a mystery until you click "Reveal Restaurant"!
        </p>
      </div>
    </div>
  );
}

export default MysteryDestination;
