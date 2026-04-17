import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GOOGLE_AI_API_KEY;
if (!apiKey) {
  console.error("No API key");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function testPro() {
  try {
    console.log("Calling gemini-2.5-pro...");
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
      config: { temperature: 0.2 }
    });
    console.log("Result text:", res.text);
  } catch (error) {
    console.error("API Error occurred!");
    console.error(error);
  }
}

testPro();
