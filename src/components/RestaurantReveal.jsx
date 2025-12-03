import { useEffect, useRef, useState } from 'react';
import { getPlaceDetails, createMap, createMarker, calculateTravelDuration } from '../lib/googleMaps';
import './RestaurantReveal.css';

function RestaurantReveal({ restaurant, userLocation, onRate, onStartOver }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [travelInfo, setTravelInfo] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const placeDetails = await getPlaceDetails(restaurant.place_id);
        setDetails(placeDetails);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching place details:', error);
        setLoading(false);
      }
    };

    fetchDetails();
  }, [restaurant]);

  // Separate effect for map initialization after details are loaded
  useEffect(() => {
    const initMap = async () => {
      if (details && mapRef.current) {
        try {
          // Small delay to ensure DOM is ready
          await new Promise(resolve => setTimeout(resolve, 100));

          const location = {
            lat: details.geometry.location.lat(),
            lng: details.geometry.location.lng()
          };

          const map = await createMap(mapRef.current, {
            center: location,
            zoom: 16,
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true
          });

          await createMarker(map, location, {
            title: details.name,
            animation: window.google.maps.Animation.BOUNCE
          });
        } catch (error) {
          console.error('Error initializing map:', error);
        }
      }
    };

    initMap();
  }, [details]);

  // Fetch travel duration (driving) after details are loaded
  useEffect(() => {
    const fetchTravelInfo = async () => {
      if (details && userLocation) {
        try {
          const destination = {
            lat: details.geometry.location.lat(),
            lng: details.geometry.location.lng()
          };

          // Fetch driving duration
          const drivingData = await calculateTravelDuration(userLocation, destination, 'DRIVING');

          setTravelInfo({
            driving: drivingData
          });
        } catch (error) {
          console.error('Error fetching travel info:', error);
          // Don't block rendering if travel info fails
        }
      }
    };

    fetchTravelInfo();
  }, [details, userLocation]);

  if (loading) {
    return (
      <div className="restaurant-reveal loading">
        <div className="loader"></div>
        <p>Revealing your destination...</p>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="restaurant-reveal error">
        <p>Unable to load restaurant details.</p>
        <button onClick={onStartOver} className="start-over-btn">
          <span>Try Again</span>
        </button>
      </div>
    );
  }

  const priceLevel = details.price_level ? '$'.repeat(details.price_level) : 'N/A';

  // Determine if restaurant is open based on opening_hours data
  let isOpen = 'Unknown';
  let openClass = 'unknown';

  if (details.opening_hours) {
    // Check open_now property first (most reliable)
    if (details.opening_hours.open_now !== undefined) {
      isOpen = details.opening_hours.open_now ? 'Open Now' : 'Closed';
      openClass = details.opening_hours.open_now ? 'open' : 'closed';
    }
    // Try the isOpen() method as fallback
    else {
      try {
        const currentlyOpen = details.opening_hours.isOpen();
        isOpen = currentlyOpen ? 'Open Now' : 'Closed';
        openClass = currentlyOpen ? 'open' : 'closed';
      } catch (e) {
        // If both fail but we have hours, show "Check Hours Below"
        if (details.opening_hours.weekday_text) {
          isOpen = 'Check Hours Below';
          openClass = 'unknown';
        }
      }
    }
  } else {
    isOpen = 'Hours Not Available';
    openClass = 'unknown';
  }

  return (
    <div className="restaurant-reveal">
      <div className="reveal-header">
        <h1 className="reveal-name">{details.name}</h1>
        <p className="reveal-address">{details.formatted_address}</p>
        <div className={`reveal-status ${openClass}`}>{isOpen}</div>
      </div>

      {details.photos && details.photos.length > 0 && (
        <div className="reveal-photos">
          {details.photos.slice(0, 3).map((photo, index) => (
            <div key={index} className="reveal-photo">
              <img
                src={photo.getUrl({ maxWidth: 500, maxHeight: 400 })}
                alt={`${details.name} photo ${index + 1}`}
              />
            </div>
          ))}
        </div>
      )}

      <div className="reveal-info">
        <div className="info-stats">
          {details.rating && (
            <div className="stat-item">
              <div className="stat-label">Rating</div>
              <div className="stat-value">{details.rating} ⭐</div>
            </div>
          )}

          <div className="stat-item">
            <div className="stat-label">Price</div>
            <div className="stat-value">{priceLevel}</div>
          </div>

          {details.user_ratings_total && (
            <div className="stat-item">
              <div className="stat-label">Reviews</div>
              <div className="stat-value">{details.user_ratings_total.toLocaleString()}</div>
            </div>
          )}

          {travelInfo?.driving && (
            <div className="stat-item">
              <div className="stat-label">🚗 Drive Time</div>
              <div className="stat-value">{travelInfo.driving.durationText}</div>
              <div className="stat-sublabel">{travelInfo.driving.distanceText}</div>
            </div>
          )}
        </div>

        <div className="info-section">
          <h3>📍 Location</h3>
          <div
            ref={mapRef}
            className="reveal-map"
            style={{
              width: '100%',
              height: '350px',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              marginTop: 'var(--spacing-md)',
              border: '2px solid var(--glass-border)',
              boxShadow: 'var(--shadow-lg)'
            }}
          ></div>
        </div>

        {(details.formatted_phone_number || details.website) && (
          <div className="info-section">
            <h3>📞 Contact</h3>
            <div className="contact-links">
              {details.formatted_phone_number && (
                <a href={`tel:${details.formatted_phone_number}`} className="contact-link">
                  {details.formatted_phone_number}
                </a>
              )}
              {details.website && (
                <a href={details.website} target="_blank" rel="noopener noreferrer" className="contact-link">
                  Visit Website →
                </a>
              )}
            </div>
          </div>
        )}

        {details.opening_hours?.weekday_text && (
          <div className="info-section">
            <h3>🕐 Opening Hours</h3>
            <div className="hours-list">
              {details.opening_hours.weekday_text.map((hours, index) => {
                const [day, time] = hours.split(': ');
                return (
                  <div key={index} className="hours-item">
                    <span className="hours-day">{day}</span>
                    <span className="hours-time">{time}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {details.reviews && details.reviews.length > 0 && (
          <div className="info-section">
            <h3>📝 Reviews</h3>
            <div className="reviews-list">
              {details.reviews.slice(0, 4).map((review, index) => (
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
          </div>
        )}
      </div>

      <div className="rating-section">
        <h3>⭐ How was your experience?</h3>
        <div className="star-rating">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              onClick={() => onRate(rating)}
              className="star"
            >
              ⭐
            </button>
          ))}
        </div>
      </div>

      <div className="reveal-actions">
        <button
          onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${details.geometry.location.lat()},${details.geometry.location.lng()}`, '_blank')}
          className="navigate-btn"
        >
          <span>Navigate There</span>
        </button>
        <button onClick={onStartOver} className="start-over-btn">
          <span>Find Another Restaurant</span>
        </button>
      </div>
    </div>
  );
}

export default RestaurantReveal;
