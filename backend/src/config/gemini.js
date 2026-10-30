import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('[Gemini Config] Warning: GEMINI_API_KEY is not set in environment variables. LLM calls will fail until it is provided.');
}

/**
 * Initializes and returns the official Google Gemini SDK client.
 */
export const getGeminiClient = () => {
  const currentKey = process.env.GEMINI_API_KEY;
  if (!currentKey) {
    throw new Error('GEMINI_API_KEY environment variable is missing.');
  }
  return new GoogleGenAI({ apiKey: currentKey });
};

export const geminiClient = apiKey ? new GoogleGenAI({ apiKey }) : null;
