# Setup Instructions

## Google Maps API Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top and select "New Project"
3. Enter a project name (e.g., "Where Should We Eat") and click "Create"

### 2. Enable Required APIs

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for and enable the following APIs:
   - **Maps JavaScript API** (for displaying maps)
   - **Places API** (for searching restaurants)
   - **Geocoding API** (for converting addresses to coordinates)

### 3. Create API Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the generated API key
4. Click on the API key to configure it
5. Under "API restrictions":
   - Select "Restrict key"
   - Check: Maps JavaScript API, Places API, Geocoding API
6. Under "Application restrictions" (for production):
   - Select "HTTP referrers (web sites)"
   - Add your domain (e.g., `https://yourdomain.com/*`)
   - For local development, add: `http://localhost:*`

### 4. Add API Key to Environment Variables

1. In the project root, create a `.env` file
2. Add your Google Maps API key:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

### 5. Enable Billing (Required)

Google Maps Platform requires a billing account to be enabled, even though they offer $200 free credits per month. This is more than enough for development and moderate usage.

1. Go to "Billing" in Google Cloud Console
2. Link a billing account or create a new one
3. The Places API usage for this app should stay well within the free tier

---

## Supabase Setup

### 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com/)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - Project name: "where-should-we-eat"
   - Database password: (create a strong password and save it)
   - Region: (choose closest to your users)
5. Click "Create new project" (takes ~2 minutes)

### 2. Create Database Schema

1. Once your project is ready, go to "SQL Editor" in the left sidebar
2. Click "New Query"
3. Copy and paste the following SQL:

```sql
-- Create user_sessions table to track unique users
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create restaurant_history table
CREATE TABLE restaurant_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL REFERENCES user_sessions(session_id),
  place_id TEXT NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  rating FLOAT,
  price_level INTEGER,
  cuisine_type TEXT,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  visited_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  revealed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better query performance
CREATE INDEX idx_restaurant_history_session_id ON restaurant_history(session_id);
CREATE INDEX idx_restaurant_history_place_id ON restaurant_history(place_id);
CREATE INDEX idx_restaurant_history_visited_at ON restaurant_history(visited_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_history ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous access (since we're using session-based tracking)
CREATE POLICY "Allow anonymous insert sessions" ON user_sessions
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous select own sessions" ON user_sessions
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert history" ON restaurant_history
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous select own history" ON restaurant_history
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "Allow anonymous update own history" ON restaurant_history
  FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);
```

4. Click "Run" to execute the query

### 3. Get Supabase Credentials

1. Go to "Settings" > "API" in the left sidebar
2. Copy the following values:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys")

### 4. Add Supabase Credentials to Environment Variables

1. Open the `.env` file in your project root
2. Add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

---

## Final .env File Example

Your `.env` file should look like this:

```
VITE_GOOGLE_MAPS_API_KEY=AIzaSyC...
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

**Important:** Never commit the `.env` file to version control. It's already included in `.gitignore`.

---

## Running the Application

1. Install dependencies (if you haven't already):
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser to the URL shown (usually `http://localhost:5173`)

---

## Testing the Setup

Once you've completed all the steps above:

1. The app should load without errors
2. You should be able to grant location permissions
3. The map should display properly
4. Restaurant search should return results
5. Your history should be saved to Supabase

If you encounter any issues, check the browser console for error messages and verify that all API keys are correctly set in the `.env` file.
