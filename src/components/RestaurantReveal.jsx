import { useEffect, useRef, useState } from 'react';
import { getPlaceDetails, createMap, createMarker } from '../lib/googleMaps';
import './RestaurantReveal.css';

function RestaurantReveal({ restaurant, userLocation, onRate, onStartOver }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const placeDetails = await getPlaceDetails(restaurant.place_id);
        setDetails(placeDetails);

        // Initialize map with photos
        if (mapRef.current) {
          const location = {
            lat: placeDetails.geometry.location.lat(),
            lng: placeDetails.geometry.location.lng()
          };

          const map = await createMap(mapRef.current, {
            center: location,
            zoom: 16,
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true
          });

          await createMarker(map, location, {
            title: placeDetails.name,
            animation: window.google.maps.Animation.BOUNCE
          });
        }
      } catch (error) {
        console.error('Error fetching place details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [restaurant]);

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
        <button onClick={onStartOver} className="primary-button">
          Try Again
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
        <h1 className="restaurant-name">{details.name}</h1>
        <div className="restaurant-meta">
          <span className={`open-status ${openClass}`}>{isOpen}</span>
          <span className="price-level">{priceLevel}</span>
          {details.rating && (
            <span className="rating">
              {details.rating} ⭐ ({details.user_ratings_total} reviews)
            </span>
          )}
        </div>
      </div>

      {details.photos && details.photos.length > 0 && (
        <div className="photo-gallery">
          {details.photos.slice(0, 3).map((photo, index) => (
            <img
              key={index}
              src={photo.getUrl({ maxWidth: 400, maxHeight: 300 })}
              alt={`${details.name} photo ${index + 1}`}
              className="restaurant-photo"
            />
          ))}
        </div>
      )}

      <div className="restaurant-map" ref={mapRef}></div>

      <div className="restaurant-details">
        <div className="detail-section">
          <h3>Address</h3>
          <p>{details.formatted_address}</p>
        </div>

        {details.formatted_phone_number && (
          <div className="detail-section">
            <h3>Phone</h3>
            <p>
              <a href={`tel:${details.formatted_phone_number}`}>
                {details.formatted_phone_number}
              </a>
            </p>
          </div>
        )}

        {details.website && (
          <div className="detail-section">
            <h3>Website</h3>
            <p>
              <a href={details.website} target="_blank" rel="noopener noreferrer">
                Visit Website
              </a>
            </p>
          </div>
        )}

        {details.opening_hours?.weekday_text && (
          <div className="detail-section">
            <h3>Opening Hours</h3>
            <ul className="hours-list">
              {details.opening_hours.weekday_text.map((day, index) => (
                <li key={index}>{day}</li>
              ))}
            </ul>
          </div>
        )}

        {details.reviews && details.reviews.length > 0 && (
          <div className="detail-section">
            <h3>Recent Reviews</h3>
            <div className="reviews">
              {details.reviews.slice(0, 3).map((review, index) => (
                <div key={index} className="review">
                  <div className="review-header">
                    <strong>{review.author_name}</strong>
                    <span className="review-rating">{review.rating} ⭐</span>
                  </div>
                  <p className="review-text">{review.text}</p>
                  <span className="review-time">{review.relative_time_description}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="reveal-actions">
        <div className="rating-section">
          <h3>How was your experience?</h3>
          <div className="rating-buttons">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                onClick={() => onRate(rating)}
                className="rating-button"
                title={`${rating} star${rating !== 1 ? 's' : ''}`}
              >
                {'⭐'.repeat(rating)}
              </button>
            ))}
          </div>
        </div>

        <button onClick={onStartOver} className="start-over-button">
          Find Another Restaurant
        </button>
      </div>
    </div>
  );
}

export default RestaurantReveal;
