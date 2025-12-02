import { searchRestaurants, calculateDrivingDuration } from '../lib/googleMaps';

// Smart search with automatic constraint relaxation
export const findRestaurants = async (userLocation, filters, excludedPlaceIds = []) => {
  const notifications = [];
  let currentFilters = { ...filters };
  let results = [];

  // Helper to check if we have enough results
  const hasEnoughResults = async (restaurants) => {
    if (restaurants.length < 3) return false;

    // Filter by duration if specified
    if (currentFilters.maxDuration) {
      const validRestaurants = [];

      for (const restaurant of restaurants) {
        try {
          const duration = await calculateDrivingDuration(
            userLocation,
            {
              lat: restaurant.geometry.location.lat(),
              lng: restaurant.geometry.location.lng()
            }
          );

          if (duration.duration <= currentFilters.maxDuration * 60) {
            validRestaurants.push({
              ...restaurant,
              drivingDuration: duration
            });
          }
        } catch (error) {
          console.error('Error calculating duration:', error);
          // Include restaurant anyway if duration calculation fails
          validRestaurants.push(restaurant);
        }
      }

      return validRestaurants.length >= 3 ? validRestaurants : null;
    }

    return restaurants;
  };

  // Try with original filters
  try {
    results = await searchRestaurants(userLocation, currentFilters, excludedPlaceIds);
    const validResults = await hasEnoughResults(results);

    if (validResults && validResults.length >= 3) {
      return { restaurants: validResults, notifications };
    }
  } catch (error) {
    console.error('Initial search failed:', error);
  }

  // Step 1: Relax perimeter (double it up to 50km)
  if (results.length < 3 && currentFilters.radius < 50000) {
    const originalRadius = currentFilters.radius;
    currentFilters.radius = Math.min(currentFilters.radius * 2, 50000);

    notifications.push({
      type: 'warning',
      message: `Not enough options found. Expanded search radius from ${(originalRadius / 1000).toFixed(1)}km to ${(currentFilters.radius / 1000).toFixed(1)}km.`
    });

    try {
      results = await searchRestaurants(userLocation, currentFilters, excludedPlaceIds);
      const validResults = await hasEnoughResults(results);

      if (validResults && validResults.length >= 3) {
        return { restaurants: validResults, notifications };
      }
    } catch (error) {
      console.error('Search with expanded radius failed:', error);
    }
  }

  // Step 2: Relax rating requirement (gradually from 4.5 down to 3.0)
  const originalRating = filters.minRating; // Keep the original user rating
  if (results.length < 3 && currentFilters.minRating > 3.0) {
    // Try reducing rating in 0.5 increments down to 3.0
    const ratingSteps = [];
    for (let rating = originalRating - 0.5; rating >= 3.0; rating -= 0.5) {
      ratingSteps.push(rating);
    }

    for (const rating of ratingSteps) {
      if (results.length >= 3) break;

      currentFilters.minRating = rating;

      notifications.push({
        type: 'warning',
        message: `Still searching... Lowered minimum rating from ${originalRating}+ to ${rating}+ stars.`
      });

      try {
        results = await searchRestaurants(userLocation, currentFilters, excludedPlaceIds);
        const validResults = await hasEnoughResults(results);

        if (validResults && validResults.length >= 3) {
          return { restaurants: validResults, notifications };
        }
      } catch (error) {
        console.error('Search with relaxed rating failed:', error);
      }
    }
  }

  // Step 3: Relax budget slightly (only increase by 1 level max)
  const originalBudget = filters.maxPriceLevel; // Keep the original user budget
  const budgetLabels = { 1: '$', 2: '$$', 3: '$$$', 4: '$$$$' };

  if (results.length < 3 && currentFilters.maxPriceLevel < 4) {
    // Only increase budget by 1 level
    const newBudget = Math.min(originalBudget + 1, 4);

    if (newBudget !== originalBudget) {
      currentFilters.maxPriceLevel = newBudget;

      notifications.push({
        type: 'warning',
        message: `Still not enough options. Relaxed budget from ${budgetLabels[originalBudget]} to ${budgetLabels[newBudget]} (max 1 level increase).`
      });

      try {
        results = await searchRestaurants(userLocation, currentFilters, excludedPlaceIds);
        const validResults = await hasEnoughResults(results);

        if (validResults && validResults.length >= 3) {
          return { restaurants: validResults, notifications };
        }
      } catch (error) {
        console.error('Search with relaxed budget failed:', error);
      }
    }
  }

  // Step 4: Remove cuisine type filter (only if user originally set one)
  if (results.length < 3 && filters.cuisineType && currentFilters.cuisineType) {
    const originalCuisine = filters.cuisineType;
    currentFilters.cuisineType = '';

    notifications.push({
      type: 'warning',
      message: `Broadening search... Removed "${originalCuisine}" cuisine filter to find more options.`
    });

    try {
      results = await searchRestaurants(userLocation, currentFilters, excludedPlaceIds);
      const validResults = await hasEnoughResults(results);

      if (validResults && validResults.length >= 3) {
        return { restaurants: validResults, notifications };
      }
    } catch (error) {
      console.error('Search without cuisine filter failed:', error);
    }
  }

  // If still not enough results, return error
  if (results.length < 3) {
    notifications.push({
      type: 'error',
      message: 'Unable to find enough restaurants matching your criteria. Please try different settings or a different location.'
    });
    return { restaurants: [], notifications };
  }

  return { restaurants: results, notifications };
};

// Randomly select one restaurant from the list
export const selectRandomRestaurant = (restaurants) => {
  if (restaurants.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * restaurants.length);
  return restaurants[randomIndex];
};
