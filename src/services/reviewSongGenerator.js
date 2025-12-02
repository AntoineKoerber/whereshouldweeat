// Service to generate singing reviews using AI text-to-speech

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;

// Format reviews into song lyrics (text only, no emojis)
export const formatReviewsAsLyrics = (reviews) => {
  if (!reviews || reviews.length === 0) {
    return "No reviews available, but I'm sure it's great! Let's give it a try!";
  }

  // Take top 3 reviews and format them
  const topReviews = reviews.slice(0, 3);

  let lyrics = "Here's what people say about this place.\n\n";

  topReviews.forEach((review, index) => {
    // Extract key phrases from review (first sentence or up to 100 chars)
    let reviewText = review.text;
    const firstSentence = reviewText.split('.')[0];
    const snippet = firstSentence.length > 100
      ? firstSentence.substring(0, 100) + '...'
      : firstSentence;

    // Format as verse with rating in words
    const ratingText = `${review.rating} out of 5 stars`;

    lyrics += `Review number ${index + 1}, rated ${ratingText}:\n`;
    lyrics += `${snippet}\n\n`;
  });

  lyrics += "That's what the reviews say today!";

  return lyrics;
};

// Generate sung version of reviews using ElevenLabs TTS with singing
export const generateReviewSong = async (reviews) => {
  if (!ELEVENLABS_API_KEY) {
    throw new Error('ElevenLabs API key not configured. Please add VITE_ELEVENLABS_API_KEY to your .env file.');
  }

  const lyrics = formatReviewsAsLyrics(reviews);

  try {
    // Use ElevenLabs text-to-speech with a voice that can sing
    // Voice ID for singing voice (you'll need to get this from ElevenLabs)
    const voiceId = 'pNInz6obpgDQGcFmaJgB'; // Adam voice (can be changed)

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: lyrics,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.5, // More expressive
          use_speaker_boost: true
        }
      })
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.statusText}`);
    }

    const audioBlob = await response.blob();
    return URL.createObjectURL(audioBlob);
  } catch (error) {
    console.error('Error generating review song:', error);
    throw error;
  }
};

// Alternative: Use browser's built-in speech synthesis (free, no API needed)
export const speakReviewsAsSong = (reviews) => {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Speech synthesis not supported in this browser'));
      return;
    }

    const lyrics = formatReviewsAsLyrics(reviews);
    const utterance = new SpeechSynthesisUtterance(lyrics);

    // Try to make it more musical
    utterance.rate = 0.8; // Slower pace
    utterance.pitch = 1.2; // Higher pitch
    utterance.volume = 1.0;

    // Try to find a good voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice =>
      voice.name.includes('Samantha') || // macOS
      voice.name.includes('Google UK English Female') || // Chrome
      voice.name.includes('Female')
    );

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = (error) => reject(error);

    window.speechSynthesis.speak(utterance);
  });
};

// Helper to stop any currently playing speech
export const stopSpeaking = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};
