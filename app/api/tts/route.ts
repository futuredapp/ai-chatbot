import { ElevenLabsClient } from 'elevenlabs';

// Ensure you have these in your .env.local file
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID; 

if (!ELEVENLABS_API_KEY) {
  throw new Error('Missing ELEVENLABS_API_KEY environment variable');
}

if (!ELEVENLABS_VOICE_ID) {
  console.warn(
    'Missing ELEVENLABS_VOICE_ID environment variable. Using a default voice.',
  );
}

// Initialize the ElevenLabs client
const client = new ElevenLabsClient({
  apiKey: ELEVENLABS_API_KEY,
});

// Helper function to convert Node.js stream (AsyncIterable) to Web Stream (ReadableStream)
function iteratorToStream(iterator: AsyncIterable<Uint8Array>): ReadableStream {
  return new ReadableStream({
    async pull(controller) {
      try {
        const { value, done } = await iterator[Symbol.asyncIterator]().next();
        if (done) {
          controller.close();
        } else {
          controller.enqueue(value);
        }
      } catch (error) {
        controller.error(error);
      }
    },
  });
}

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) {
      return new Response(JSON.stringify({ error: 'Text is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`[API /tts] Received request for text: "${text.substring(0, 50)}..."`);

    // Use the default voice if not provided
    const voiceId = ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB'; // Default to 'Adam' voice if not specified

    // Generate streaming audio response
    const audioStream = await client.textToSpeech.convertAsStream(
      voiceId,
      {
        text,
        model_id: 'eleven_multilingual_v2',
        output_format: 'mp3_44100_128',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 1.0,
          style: 0.0,
          use_speaker_boost: true,
          speed: 0.9,
        }
      }
    );

    // Convert the AsyncIterable to a ReadableStream
    const stream = iteratorToStream(audioStream);

    console.log(`[API /tts] Streaming audio response...`);

    // Return the stream response
    return new Response(stream, {
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });
  } catch (error: any) {
    console.error('[API /tts] Error generating speech:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate speech', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 