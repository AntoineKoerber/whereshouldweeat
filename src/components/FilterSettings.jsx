import { useState } from 'react';
import './FilterSettings.css';

const CUISINE_OPTIONS = [
  { value: '', label: 'Surprise Me!' },
  { value: 'italian', label: 'Italian' },
  { value: 'chinese', label: 'Chinese' },
  { value: 'thai', label: 'Thai' },
  { value: 'mexican', label: 'Mexican' },
  { value: 'mediterranean', label: 'Mediterranean' },
  { value: 'indian', label: 'Indian' },
  { value: 'french', label: 'French' },
  { value: 'japanese', label: 'Japanese / Sushi' },
  { value: 'korean', label: 'Korean' },
  { value: 'middle eastern', label: 'Middle Eastern' },
  { value: 'seafood', label: 'Seafood' },
  { value: 'CUSTOM', label: '✏️ Tell Me...' }
];

const BUDGET_LEVELS = [
  { value: 4, label: '$$$$', description: 'Very Expensive' },
  { value: 3, label: '$$$', description: 'Expensive' },
  { value: 2, label: '$$', description: 'Moderate' },
  { value: 1, label: '$', description: 'Inexpensive' }
];

function FilterSettings({ onSearch, userLocation }) {
  const [filters, setFilters] = useState({
    radius: 10000, // 10km in meters
    maxPriceLevel: 2, // $$ (Moderate) by default
    minRating: 4, // 4+ stars by default
    cuisineType: '', // Empty = "Surprise Me"
    maxDuration: 20 // 20 minutes max drive
  });

  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customCuisine, setCustomCuisine] = useState('');

  const handleRadiusChange = (e) => {
    setFilters({ ...filters, radius: parseInt(e.target.value) * 1000 });
  };

  const handleBudgetChange = (value) => {
    setFilters({ ...filters, maxPriceLevel: value });
  };

  const handleRatingChange = (e) => {
    setFilters({ ...filters, minRating: parseFloat(e.target.value) });
  };

  const handleCuisineChange = (e) => {
    const value = e.target.value;

    if (value === 'CUSTOM') {
      setShowCustomInput(true);
      setFilters({ ...filters, cuisineType: '' });
    } else {
      setShowCustomInput(false);
      setCustomCuisine('');
      setFilters({ ...filters, cuisineType: value });
    }
  };

  const handleCustomCuisineChange = (e) => {
    const value = e.target.value;
    setCustomCuisine(value);
    setFilters({ ...filters, cuisineType: value });
  };

  const handleDurationChange = (e) => {
    setFilters({ ...filters, maxDuration: parseInt(e.target.value) });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(filters);
  };

  const radiusKm = filters.radius / 1000;

  return (
    <div className="filter-settings">
      <h2>What are you looking for?</h2>

      <form onSubmit={handleSubmit}>
        <div className="filter-group">
          <label>
            Distance (Perimeter)
            <span className="filter-value">{radiusKm} km</span>
          </label>
          <input
            type="range"
            min="1"
            max="50"
            value={radiusKm}
            onChange={handleRadiusChange}
            className="slider"
          />
          <div className="range-labels">
            <span>1 km</span>
            <span>50 km</span>
          </div>
        </div>

        <div className="filter-group">
          <label>Budget</label>
          <div className="budget-options">
            {BUDGET_LEVELS.map((level) => (
              <button
                key={level.value}
                type="button"
                className={`budget-button ${
                  filters.maxPriceLevel >= level.value ? 'active' : ''
                }`}
                onClick={() => handleBudgetChange(level.value)}
                title={level.description}
              >
                {level.label}
              </button>
            ))}
          </div>
          <p className="budget-description">
            {BUDGET_LEVELS.find((l) => l.value === filters.maxPriceLevel)?.description}
          </p>
        </div>

        <div className="filter-group">
          <label>
            Minimum Rating
            <span className="filter-value">
              {filters.minRating > 0 ? `${filters.minRating}+ stars` : 'Any rating'}
            </span>
          </label>
          <input
            type="range"
            min="0"
            max="4.5"
            step="0.5"
            value={filters.minRating}
            onChange={handleRatingChange}
            className="slider"
          />
          <div className="range-labels">
            <span>Any</span>
            <span>4.5+</span>
          </div>
        </div>

        <div className="filter-group">
          <label>
            Maximum Drive Time
            <span className="filter-value">{filters.maxDuration} min</span>
          </label>
          <input
            type="range"
            min="5"
            max="60"
            step="5"
            value={filters.maxDuration}
            onChange={handleDurationChange}
            className="slider"
          />
          <div className="range-labels">
            <span>5 min</span>
            <span>60 min</span>
          </div>
        </div>

        <div className="filter-group">
          <label>Type of Cuisine</label>
          <select
            value={showCustomInput ? 'CUSTOM' : filters.cuisineType}
            onChange={handleCuisineChange}
            className="cuisine-select"
          >
            {CUISINE_OPTIONS.map((cuisine) => (
              <option key={cuisine.value} value={cuisine.value}>
                {cuisine.label}
              </option>
            ))}
          </select>

          {showCustomInput && (
            <div className="custom-cuisine-input">
              <input
                type="text"
                value={customCuisine}
                onChange={handleCustomCuisineChange}
                placeholder="Type your cuisine (e.g., Thai, Lebanese, Ethiopian...)"
                className="custom-input"
                autoFocus
              />
              <p className="input-hint">
                Tell us what you're craving!
              </p>
            </div>
          )}
        </div>

        <button type="submit" className="search-button">
          Find Me a Restaurant!
        </button>
      </form>
    </div>
  );
}

export default FilterSettings;
