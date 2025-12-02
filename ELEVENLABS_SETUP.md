# ElevenLabs Setup for Singing Reviews

The "Listen to Reviews" feature can use **ElevenLabs AI** to generate more expressive and natural-sounding speech. While the feature works without it (using your browser's built-in voice), ElevenLabs provides much better quality.

## What is ElevenLabs?

ElevenLabs is an AI text-to-speech service that creates very realistic and expressive voices. It's more musical and engaging than standard text-to-speech.

## Setup Instructions

### 1. Sign Up for ElevenLabs

1. Go to [https://elevenlabs.io/](https://elevenlabs.io/)
2. Click "Sign Up" (can use Google account)
3. Choose a plan:
   - **Free Tier**: 10,000 characters/month (good for testing, ~30-40 reviews)
   - **Creator**: $5/month for 30,000 characters (~100-120 reviews)
   - **Pro**: $22/month for 100,000 characters

### 2. Get Your API Key

1. Once logged in, click on your profile icon (top right)
2. Go to "Settings" or "Profile"
3. Navigate to "API Keys"
4. Click "Generate API Key" or copy existing key
5. **Save this key securely** - you'll need it next

### 3. Add API Key to Your App

1. Open your `.env` file in the project root
2. Add your ElevenLabs API key:
   ```
   VITE_ELEVENLABS_API_KEY=your_api_key_here
   ```
3. Save the file
4. Restart your development server (`npm run dev`)

### 4. Test the Feature

1. Refresh your browser
2. Select a restaurant and reach the Mystery Destination screen
3. Click "🎵 Listen to Reviews"
4. The reviews should now be spoken with much better quality and expression!

## How It Works

- **With ElevenLabs**: Reviews are sent to ElevenLabs API, converted to expressive speech, and played back
- **Without ElevenLabs**: Reviews use your browser's built-in speech synthesis (free but lower quality)

The app automatically detects if you have an API key and uses the best available option.

## Cost Estimate

Typical review song: ~200-300 characters

- **Free tier**: ~40 review songs/month
- **Creator ($5/month)**: ~120 review songs/month
- **Pro ($22/month)**: ~400 review songs/month

For personal use, the free tier is usually sufficient!

## Troubleshooting

### "API key not configured" error
- Make sure the `.env` file has the correct key
- Restart the dev server after adding the key
- Check that the variable starts with `VITE_`

### "API error" or audio doesn't play
- Check your ElevenLabs account usage (might have hit limit)
- Verify the API key is correct
- App will automatically fall back to browser speech if ElevenLabs fails

### Still sounds robotic
- ElevenLabs doesn't truly "sing" but creates very expressive speech
- For actual singing, you'd need specialized music generation AI (Suno AI, etc.)
- The current implementation focuses on engaging, theatrical narration of reviews

## Optional: Choose a Different Voice

Want to customize the voice? In `src/services/reviewSongGenerator.js`, change the `voiceId`:

```javascript
const voiceId = 'pNInz6obpgDQGcFmaJgB'; // Current voice
```

Available voices (visit ElevenLabs website to hear samples):
- Adam: `pNInz6obpgDQGcFmaJgB` (default)
- Antoni: `ErXwobaYiN019PkySvjV`
- Arnold: `VR6AewLTigWG4xSOukaG`
- Bella: `EXAVITQu4vr4xnSDxMaL`
- Elli: `MF3mGyEYCl7XYWbV9V6O`
- Josh: `TxGEqnHWrfWFTfGW9XjX`
- Rachel: `21m00Tcm4TlvDq8ikWAM`
- Sam: `yoZ06aMxZJJ28mfd3POQ`

Pick one, replace the ID, and restart the server!
