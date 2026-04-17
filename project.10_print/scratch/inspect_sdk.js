const { GoogleGenAI } = require('@google/genai');

try {
  const ai = new GoogleGenAI({ apiKey: 'dummy' });
  console.log('AI Object Properties:', Object.keys(ai));
  if (ai.models) {
    console.log('Models Object Properties:', Object.keys(ai.models));
  }
} catch (e) {
  console.log('Error creating AI object:', e.message);
}
