import { useState, useEffect } from 'react';
import LocationInput from './components/LocationInput';
import FilterSettings from './components/FilterSettings';
import MysteryDestination from './components/MysteryDestination';
import RestaurantReveal from './components/RestaurantReveal';
import { findRestaurants, selectRandomRestaurant } from './services/restaurantSearch';
import {
  initializeSession,
  saveRestaurantToHistory,
  updateRestaurantRating,
  markAsRevealed,
  getVisitedPlaceIds
} from './lib/supabase';
import './App.css';

const STEPS = {
  LOCATION: 'location',
  FILTERS: 'filters',
  SEARCHING: 'searching',
  MYSTERY: 'mystery',
  REVEALED: 'revealed'
};

function App() {
  const [step, setStep] = useState(STEPS.LOCATION);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [historyId, setHistoryId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drivingInfo, setDrivingInfo] = useState(null);

  // Initialize Supabase session on mount
  useEffect(() => {
    initializeSession();
  }, []);

  const handleLocationSet = (location) => {
    setUserLocation(location);
    setStep(STEPS.FILTERS);
  };

  const handleSearch = async (filters) => {
    setLoading(true);
    setNotifications([]);
    setStep(STEPS.SEARCHING);

    try {
      // Get previously visited restaurants to exclude
      const excludedPlaceIds = await getVisitedPlaceIds();

      // Search for restaurants with smart constraint relaxation
      const { restaurants, notifications: searchNotifications } = await findRestaurants(
        userLocation,
        filters,
        excludedPlaceIds
      );

      // Show any notifications from the search
      if (searchNotifications.length > 0) {
        setNotifications(searchNotifications);
      }

      // If we have enough restaurants, pick one randomly
      if (restaurants.length >= 3) {
        const chosen = selectRandomRestaurant(restaurants);
        setSelectedRestaurant(chosen);

        // Extract driving info if available
        if (chosen.drivingDuration) {
          setDrivingInfo(chosen.drivingDuration);
        }

        // Save to history
        const historyRecord = await saveRestaurantToHistory(chosen);
        if (historyRecord) {
          setHistoryId(historyRecord.id);
        }

        setStep(STEPS.MYSTERY);
      } else {
        // Not enough restaurants found
        setStep(STEPS.FILTERS);
      }
    } catch (error) {
      console.error('Search error:', error);
      setNotifications([
        {
          type: 'error',
          message: 'An error occurred while searching for restaurants. Please try again.'
        }
      ]);
      setStep(STEPS.FILTERS);
    } finally {
      setLoading(false);
    }
  };

  const handleReveal = async () => {
    if (historyId) {
      await markAsRevealed(historyId);
    }
    setStep(STEPS.REVEALED);
  };

  const handleRate = async (rating) => {
    if (historyId) {
      await updateRestaurantRating(historyId, rating);
      setNotifications([
        {
          type: 'success',
          message: `Thanks for rating! Your ${rating}-star review has been saved.`
        }
      ]);
    }
  };

  const handleStartOver = () => {
    setSelectedRestaurant(null);
    setHistoryId(null);
    setDrivingInfo(null);
    setNotifications([]);
    setStep(STEPS.FILTERS);
  };

  const handleChangeLocation = () => {
    setUserLocation(null);
    setSelectedRestaurant(null);
    setHistoryId(null);
    setDrivingInfo(null);
    setNotifications([]);
    setStep(STEPS.LOCATION);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Where Should We Eat?</h1>
        <p className="app-subtitle">Let us choose your next culinary adventure</p>
      </header>

      {notifications.length > 0 && (
        <div className="notifications">
          {notifications.map((notification, index) => (
            <div key={index} className={`notification ${notification.type}`}>
              {notification.message}
            </div>
          ))}
        </div>
      )}

      <main className="app-main">
        {step === STEPS.LOCATION && (
          <LocationInput onLocationSet={handleLocationSet} />
        )}

        {step === STEPS.FILTERS && (
          <div>
            <FilterSettings
              onSearch={handleSearch}
              userLocation={userLocation}
            />
            <div className="change-location">
              <button onClick={handleChangeLocation} className="text-button">
                Change Location
              </button>
            </div>
          </div>
        )}

        {step === STEPS.SEARCHING && (
          <div className="searching">
            <div className="loader"></div>
            <h2>Finding the perfect spot for you...</h2>
            <p>Analyzing restaurants in your area</p>
          </div>
        )}

        {step === STEPS.MYSTERY && selectedRestaurant && (
          <MysteryDestination
            restaurant={selectedRestaurant}
            userLocation={userLocation}
            onReveal={handleReveal}
            drivingInfo={drivingInfo}
          />
        )}

        {step === STEPS.REVEALED && selectedRestaurant && (
          <RestaurantReveal
            restaurant={selectedRestaurant}
            userLocation={userLocation}
            onRate={handleRate}
            onStartOver={handleStartOver}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>Powered by Google Maps &amp; Supabase</p>
      </footer>
    </div>
  );
}

export default App;
