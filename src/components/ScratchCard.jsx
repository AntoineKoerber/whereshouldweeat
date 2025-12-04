import { useState } from 'react';
import './ScratchCard.css';

function ScratchCard({ restaurant, onComplete }) {
  const [isPressed, setIsPressed] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);

  const handleTouch = () => {
    if (isRevealing) return;

    setIsPressed(true);
    setIsRevealing(true);

    // Start reveal animation
    setTimeout(() => {
      onComplete();
    }, 2000);
  };

  // Get restaurant photo
  const photoUrl = restaurant.photos && restaurant.photos.length > 0
    ? restaurant.photos[0].getUrl({ maxWidth: 800, maxHeight: 600 })
    : null;

  return (
    <div className="scratch-card-reveal">
      <div className="scratch-content">
        <h2 className="scratch-title">Your Restaurant Awaits!</h2>
        <p className="scratch-instruction">
          {!isPressed ? 'Place your finger on the circle to reveal' : 'Revealing...'}
        </p>

        <div className="scratch-card-container">
          <div className={`scratch-card ${isRevealing ? 'revealing' : ''}`}>
            {/* Restaurant info underneath */}
            <div className="card-background">
              {photoUrl && (
                <img
                  src={photoUrl}
                  alt={restaurant.name}
                  className="card-image"
                />
              )}
              <div className="card-info">
                <h3 className="card-restaurant-name">{restaurant.name}</h3>
                {restaurant.vicinity && (
                  <p className="card-address">{restaurant.vicinity}</p>
                )}
              </div>
            </div>

            {/* Overlay with fingerprint spot */}
            {!isRevealing && (
              <div className="card-overlay">
                <div
                  className="fingerprint-spot"
                  onClick={handleTouch}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    handleTouch();
                  }}
                >
                  <div className="fingerprint-icon">👆</div>
                  <div className="pulse-ring"></div>
                  <div className="pulse-ring delay-1"></div>
                  <div className="pulse-ring delay-2"></div>
                </div>
                <p className="overlay-text">Touch Here</p>
              </div>
            )}
          </div>

          {isRevealing && (
            <div className="scratch-complete">
              <p>✨ Revealing your restaurant...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ScratchCard;
