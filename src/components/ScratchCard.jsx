import { useState, useRef, useEffect } from 'react';
import './ScratchCard.css';

function ScratchCard({ restaurant, onComplete }) {
  const canvasRef = useRef(null);
  const [isScratching, setIsScratching] = useState(false);
  const [scratchPercentage, setScratchPercentage] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    // Set canvas size
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Draw scratch-off layer with gradient
    const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    gradient.addColorStop(0, '#6366f1');
    gradient.addColorStop(0.5, '#8b5cf6');
    gradient.addColorStop(1, '#d946ef');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Add text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 24px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Scratch to Reveal', rect.width / 2, rect.height / 2 - 20);

    ctx.font = '18px system-ui';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText('Your Restaurant', rect.width / 2, rect.height / 2 + 20);

    // Add scratch effect overlay
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * rect.width;
      const y = Math.random() * rect.height;
      ctx.fillRect(x, y, 2, 2);
    }
  }, []);

  const calculateScratchPercentage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;

    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    let transparentPixels = 0;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] < 128) {
        transparentPixels++;
      }
    }

    const percentage = (transparentPixels / (pixels.length / 4)) * 100;
    return percentage;
  };

  const lastPositionRef = useRef(null);
  const scratchCountRef = useRef(0);
  const lastCheckRef = useRef(0);

  const scratch = (x, y) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const canvasX = (x - rect.left) * scaleX;
    const canvasY = (y - rect.top) * scaleY;

    ctx.globalCompositeOperation = 'destination-out';

    // If we have a last position, draw a line between points for smooth scratching
    if (lastPositionRef.current) {
      const lastX = lastPositionRef.current.x;
      const lastY = lastPositionRef.current.y;

      ctx.lineWidth = 60 * window.devicePixelRatio;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(canvasX, canvasY);
      ctx.stroke();
    }

    // Draw circle at current position
    ctx.beginPath();
    ctx.arc(canvasX, canvasY, 30 * window.devicePixelRatio, 0, Math.PI * 2);
    ctx.fill();

    lastPositionRef.current = { x: canvasX, y: canvasY };
    scratchCountRef.current++;

    // Only calculate percentage every 10 scratches for performance
    if (scratchCountRef.current - lastCheckRef.current >= 10) {
      lastCheckRef.current = scratchCountRef.current;

      const percentage = calculateScratchPercentage();
      setScratchPercentage(percentage);

      // Complete when 80% scratched
      if (percentage >= 80 && !hasCompleted) {
        setHasCompleted(true);
        setTimeout(() => {
          onComplete();
        }, 500);
      }
    }
  };

  const handleMouseDown = (e) => {
    setIsScratching(true);
    lastPositionRef.current = null;
    scratch(e.clientX, e.clientY);
  };

  const handleMouseMove = (e) => {
    if (!isScratching) return;
    scratch(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    setIsScratching(false);
    lastPositionRef.current = null;
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    setIsScratching(true);
    lastPositionRef.current = null;
    const touch = e.touches[0];
    scratch(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    if (!isScratching) return;
    const touch = e.touches[0];
    scratch(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    setIsScratching(false);
    lastPositionRef.current = null;
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
          Scratch the card to reveal your destination
        </p>

        <div className="scratch-card-container">
          <div className="scratch-card">
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

            {/* Scratch-off canvas */}
            <canvas
              ref={canvasRef}
              className="scratch-canvas"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
          </div>

          {/* Progress indicator */}
          {scratchPercentage > 0 && scratchPercentage < 80 && (
            <div className="scratch-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${scratchPercentage}%` }}
                />
              </div>
              <p className="progress-text">
                {Math.round(scratchPercentage)}% revealed
              </p>
            </div>
          )}

          {hasCompleted && (
            <div className="scratch-complete">
              <p>✨ Revealed! Opening details...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ScratchCard;
