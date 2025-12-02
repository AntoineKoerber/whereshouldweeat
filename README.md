# Where Should We Eat?

A mystery restaurant decision helper web app that takes the stress out of choosing where to eat. Simply set your preferences, and let the app surprise you with a randomly selected restaurant that meets your criteria!

## Features

- **Smart Location Detection**: Use automatic geolocation or manually enter your address
- **Customizable Filters**:
  - Distance/Perimeter (1-50 km)
  - Budget level ($ to $$$$)
  - Minimum rating (up to 4.5+ stars)
  - Maximum drive time (5-60 minutes)
  - Type of cuisine (20+ options)

- **Smart Constraint Relaxation**: If no restaurants match your exact criteria, the app automatically relaxes constraints in order (perimeter → budget → rating → cuisine) and notifies you of the changes

- **Mystery Mode**: The restaurant name stays hidden until you arrive and choose to reveal it

- **Google Maps Integration**:
  - View the mystery location on a map
  - Get directions directly to Google Maps
  - See restaurant photos, reviews, and details when revealed

- **User History & Ratings**:
  - Tracks previously visited restaurants (won't suggest the same place twice)
  - Rate your experience after visiting
  - Data persists across sessions using Supabase

## Tech Stack

- **Frontend**: React with Vite
- **Maps & Places**: Google Maps JavaScript API, Places API, Geocoding API
- **Database**: Supabase (PostgreSQL)
- **Styling**: Custom CSS with responsive design

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Google Maps API key
- Supabase account

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd where-should-we-eat
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

4. Configure your API keys in `.env`:
   - Follow the detailed setup instructions in [SETUP.md](./SETUP.md)
   - Add your Google Maps API key
   - Add your Supabase URL and anon key

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open your browser to `http://localhost:5173`

## Detailed Setup Instructions

For complete setup instructions including:
- How to create and configure a Google Maps API key
- How to set up Supabase database and tables
- Step-by-step configuration guide

See [SETUP.md](./SETUP.md)

## How It Works

1. **Set Your Location**: Choose between automatic geolocation or manual address entry
2. **Configure Preferences**: Set your desired perimeter, budget, rating, drive time, and cuisine type
3. **Smart Search**: The app searches Google Places API for matching restaurants
4. **Auto-Adjustment**: If fewer than 3 options are found, constraints are automatically relaxed
5. **Random Selection**: One restaurant is randomly chosen from the qualifying options
6. **Mystery Phase**: View the location on a map and get directions, but the name stays hidden
7. **Reveal**: When ready, reveal the restaurant details, photos, reviews, and more
8. **Rate & Remember**: Rate your experience and the app remembers what you've visited

## Project Structure

```
src/
├── components/          # React components
│   ├── LocationInput.jsx       # Location selection UI
│   ├── FilterSettings.jsx      # Restaurant filter controls
│   ├── MysteryDestination.jsx  # Mystery map view
│   └── RestaurantReveal.jsx    # Revealed restaurant details
├── lib/                 # Core utilities
│   ├── googleMaps.js           # Google Maps API integration
│   └── supabase.js             # Supabase client & helpers
├── services/            # Business logic
│   └── restaurantSearch.js     # Search & constraint relaxation
├── App.jsx              # Main application component
└── main.jsx             # Application entry point
```

## API Usage Notes

### Google Maps API Costs

This app uses three Google Maps APIs:
- Maps JavaScript API
- Places API (Nearby Search)
- Geocoding API

Google provides $200 of free monthly credits. For typical personal use, you should stay well within the free tier. However, monitor your usage at the [Google Cloud Console](https://console.cloud.google.com/).

### Supabase

Supabase's free tier includes:
- 500MB database
- 1GB file storage
- 50,000 monthly active users

More than sufficient for personal use.

## Deployment to Vercel

### Step 1: Push to GitHub

```bash
# Initialize git repository (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Where Should We Eat app"

# Create main branch
git branch -M main

# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git push -u origin main
```

### Step 2: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect the Vite configuration
5. Add environment variables in Project Settings → Environment Variables:
   - `VITE_GOOGLE_MAPS_API_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Click "Deploy"

### Step 3: Update Google Maps API Restrictions

After deployment:
1. Go to Google Cloud Console
2. Navigate to your API key
3. Add your Vercel domain to HTTP referrer restrictions:
   - Example: `https://your-app.vercel.app/*`
   - Also add: `https://*.vercel.app/*` for preview deployments

## Build Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

## Future Enhancements

Potential features to add:
- User accounts for cross-device history
- Share mystery destinations with friends
- Group decision mode (multiple users vote on preferences)
- "Surprise me completely" mode with minimal filters
- Weekly/monthly statistics on dining habits
- Integration with reservation systems

## Contributing

Feel free to submit issues or pull requests if you have suggestions for improvements!

## License

MIT License - feel free to use this project for your own purposes.

## Acknowledgments

- Google Maps Platform for location and places data
- Supabase for the backend database
- The mystery and excitement of trying new restaurants!
