import { useState, useEffect, useRef } from 'react';
import './GiftBoxReveal.css';

function GiftBoxReveal({ onComplete }) {
  const [clickCount, setClickCount] = useState(0);
  const [shakeKey, setShakeKey] = useState(0);
  const [isExploding, setIsExploding] = useState(false);
  const [totalClicksNeeded] = useState(() => Math.floor(Math.random() * 7) + 3); // Random between 3 and 9
  const isExplodingRef = useRef(false);

  const handleBoxClick = () => {
    // Prevent clicks during explosion
    if (isExplodingRef.current) return;

    if (clickCount < totalClicksNeeded - 1) {
      setClickCount(prev => prev + 1);
      // Increment key to force re-trigger animation even if clicked rapidly
      setShakeKey(prev => prev + 1);
    } else {
      // Final click - trigger explosion
      isExplodingRef.current = true;
      setIsExploding(true);
      setTimeout(() => {
        onComplete();
      }, 1200);
    }
  };

  return (
    <div className="gift-box-reveal">
      <div className="reveal-content">
        <h2 className="reveal-title">Your Restaurant Awaits!</h2>
        <p className="reveal-instruction">Click to Open</p>

        <div
          key={shakeKey}
          className={`gift-box-container ${!isExploding ? 'shake' : ''} ${isExploding ? 'explode' : ''}`}
          onClick={handleBoxClick}
        >
          <div className="gift-box">
            <div className="box-lid">
              <div className="ribbon-horizontal"></div>
              <div className="ribbon-vertical"></div>
              <div className="bow">
                <div className="bow-left"></div>
                <div className="bow-right"></div>
                <div className="bow-center"></div>
              </div>
            </div>
            <div className="box-body">
              <div className="ribbon-horizontal"></div>
              <div className="ribbon-vertical"></div>
            </div>
          </div>

          {/* Confetti particles for explosion */}
          {isExploding && (
            <div className="confetti-container">
              {[...Array(30)].map((_, i) => (
                <div
                  key={i}
                  className="confetti"
                  style={{
                    '--angle': `${(360 / 30) * i}deg`,
                    '--color': ['#6366f1', '#f43f5e', '#10b981', '#f59e0b'][i % 4]
                  }}
                ></div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GiftBoxReveal;
