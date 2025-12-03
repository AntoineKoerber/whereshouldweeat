import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Generate or retrieve session ID for anonymous user tracking
export const getSessionId = () => {
  let sessionId = localStorage.getItem('user_session_id');

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('user_session_id', sessionId);
  }

  return sessionId;
};

// Initialize user session in database
export const initializeSession = async () => {
  const sessionId = getSessionId();

  // Check if session exists
  const { data: existingSession } = await supabase
    .from('user_sessions')
    .select('id')
    .eq('session_id', sessionId)
    .single();

  // Create session if it doesn't exist
  if (!existingSession) {
    const { error } = await supabase
      .from('user_sessions')
      .insert({ session_id: sessionId });

    if (error) {
      console.error('Error creating session:', error);
    }
  }

  return sessionId;
};

// Save restaurant to history
export const saveRestaurantToHistory = async (restaurantData) => {
  const sessionId = getSessionId();

  const { data, error } = await supabase
    .from('restaurant_history')
    .insert({
      session_id: sessionId,
      place_id: restaurantData.place_id,
      name: restaurantData.name,
      address: restaurantData.formatted_address || restaurantData.vicinity,
      rating: restaurantData.rating,
      price_level: restaurantData.price_level,
      cuisine_type: restaurantData.types ? restaurantData.types.join(', ') : null,
      latitude: restaurantData.geometry.location.lat(),
      longitude: restaurantData.geometry.location.lng(),
      revealed: false
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving restaurant:', error);
    return null;
  }

  return data;
};

// Update restaurant rating
export const updateRestaurantRating = async (historyId, rating) => {
  const { data, error } = await supabase
    .from('restaurant_history')
    .update({ user_rating: rating })
    .eq('id', historyId)
    .select()
    .single();

  if (error) {
    console.error('Error updating rating:', error);
    return null;
  }

  return data;
};

// Mark restaurant as revealed
export const markAsRevealed = async (historyId) => {
  const { data, error } = await supabase
    .from('restaurant_history')
    .update({ revealed: true })
    .eq('id', historyId)
    .select()
    .single();

  if (error) {
    console.error('Error marking as revealed:', error);
    return null;
  }

  return data;
};

// Get visited restaurants (to exclude from future searches)
// Only excludes the last 10 restaurants to avoid running out of options
export const getVisitedPlaceIds = async () => {
  const sessionId = getSessionId();

  const { data, error } = await supabase
    .from('restaurant_history')
    .select('place_id')
    .eq('session_id', sessionId)
    .order('visited_at', { ascending: false })
    .limit(10); // Only exclude the last 10 restaurants

  if (error) {
    console.error('Error fetching history:', error);
    return [];
  }

  const excludedIds = data.map(item => item.place_id);
  console.log(`Excluding ${excludedIds.length} recently visited restaurants from search`);
  return excludedIds;
};

// Get user's restaurant history
export const getRestaurantHistory = async () => {
  const sessionId = getSessionId();

  const { data, error } = await supabase
    .from('restaurant_history')
    .select('*')
    .eq('session_id', sessionId)
    .order('visited_at', { ascending: false });

  if (error) {
    console.error('Error fetching history:', error);
    return [];
  }

  return data;
};
