import { useState } from 'react';
import './ScratchCard.css';

function ScratchCard({ restaurant, onComplete }) {
  const [taps, setTaps] = useState([]);
  const [tapCount, setTapCount] = useState(0);
  const [isShattered, setIsShattered] = useState(false);
  const tapsNeeded = 8;

  const handleTap = (e) => {
    if (isShattered) return;

    // Get tap position
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX || e.touches?.[0]?.clientX) - rect.left) / rect.width * 100;
    const y = ((e.clientY || e.touches?.[0]?.clientY) - rect.top) / rect.height * 100;

    const newTapCount = tapCount + 1;
    setTapCount(newTapCount);

    // Add crack at tap position
    setTaps(prev => [...prev, { id: Date.now(), x, y }]);

    // Shatter when enough taps
    if (newTapCount >= tapsNeeded) {
      setIsShattered(true);
      setTimeout(() => {
        onComplete();
      }, 1500);
    }
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
          {isShattered
            ? 'Revealing...'
            : `Tap to break the glass (${tapCount}/${tapsNeeded})`
          }
        </p>

        <div className="scratch-card-container">
          <div className={`scratch-card ${isShattered ? 'shattered' : ''}`}>
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

            {/* Glass overlay */}
            {!isShattered && (
              <div
                className="card-overlay glass-overlay"
                onClick={handleTap}
                onTouchStart={(e) => {
                  e.preventDefault();
                  handleTap(e);
                }}
              >
                {/* Render cracks */}
                {taps.map((tap) => (
                  <div
                    key={tap.id}
                    className="crack"
                    style={{
                      left: `${tap.x}%`,
                      top: `${tap.y}%`,
                    }}
                  >
                    <svg className="crack-svg" viewBox="0 0 200 200">
                      {/* Radiating crack lines */}
                      <line x1="100" y1="100" x2="20" y2="30" className="crack-line" />
                      <line x1="100" y1="100" x2="180" y2="40" className="crack-line" />
                      <line x1="100" y1="100" x2="30" y2="170" className="crack-line" />
                      <line x1="100" y1="100" x2="170" y2="160" className="crack-line" />
                      <line x1="100" y1="100" x2="10" y2="100" className="crack-line" />
                      <line x1="100" y1="100" x2="190" y2="100" className="crack-line" />
                      <line x1="100" y1="100" x2="100" y2="10" className="crack-line" />
                      <line x1="100" y1="100" x2="100" y2="190" className="crack-line" />
                      {/* Impact point */}
                      <circle cx="100" cy="100" r="8" className="crack-impact" />
                    </svg>
                  </div>
                ))}

                <div className="glass-shine"></div>
                <p className="overlay-text">Tap to Shatter</p>
              </div>
            )}
          </div>

          {isShattered && (
            <div className="scratch-complete">
              <p>✨ Glass shattered! Revealing your restaurant...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ScratchCard;
