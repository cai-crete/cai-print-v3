import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GOOGLE_AI_API_KEY;
if (!apiKey) {
  console.error("No API key");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

// 1x1 pixels transparent PNG base64
const dummyImage = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

async function testVideo() {
  try {
    console.log("Calling generateVideos...");
    const operation = await ai.models.generateVideos({
      model: 'models/veo-3.1-lite-generate-preview',
      prompt: "Test prompt transition",
      image: {
        imageBytes: dummyImage,
        mimeType: "image/png"
      },
      config: {
        aspectRatio: "16:9",
        numberOfVideos: 1,
        durationSeconds: 8,
        lastFrame: {
          imageBytes: dummyImage,
          mimeType: "image/png"
        }
      }
    });
    console.log("Operation result:", operation);
  } catch (error) {
    console.error("API Error occurred!");
    console.error(error);
  }
}

testVideo();
