import { GoogleGenAI } from '@google/genai'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

async function checkModels() {
  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) {
    console.error('API Key not found')
    return
  }
  
  const ai = new GoogleGenAI({ apiKey })
  try {
    const models = await ai.models.list()
    console.log('Available models:')
    models.forEach(m => console.log(m.name))
  } catch (err) {
    console.error('Failed to list models')
    console.error(err)
  }
}

checkModels()
