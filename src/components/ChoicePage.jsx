import { useState, useEffect } from 'react';
import './ChoicePage.css';

function ChoicePage({ onChoice }) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Show loading for 2 seconds before presenting choices
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleChoice = (choice) => {
    onChoice(choice);
  };

  if (isLoading) {
    return (
      <div className="choice-page">
        <div className="choice-loading">
          <div className="loader"></div>
          <h2>Preparing your experience...</h2>
          <p>We've found the perfect place for you!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="choice-page">
      <div className="choice-content">
        <div className="choice-header">
          <h2>Your Restaurant Awaits!</h2>
          <p className="choice-tagline">
            How would you like to experience your culinary adventure?
          </p>
        </div>

        <div className="choice-cards">
          <button
            className="choice-card reveal-card"
            onClick={() => handleChoice('reveal')}
          >
            <div className="card-icon">🎁</div>
            <h3>Reveal Restaurant</h3>
            <p>See where you're going right away</p>
            <div className="card-action">
              <span>Show Me →</span>
            </div>
          </button>

          <button
            className="choice-card mystery-card"
            onClick={() => handleChoice('mystery')}
          >
            <div className="card-icon">🗺️</div>
            <h3>Keep It a Mystery</h3>
            <p>Get guided with hints and clues</p>
            <div className="card-action">
              <span>Surprise Me →</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChoicePage;
