import { getGeminiClient } from '../config/gemini.js';
import { catalogService } from './catalogService.js';
import { discountService } from './discountService.js';

const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

/**
 * System instruction defining the persona and deterministic rules for the AI Sales Agent.
 */
export const SALES_AGENT_SYSTEM_PROMPT = `You are a consultative, professional AI Sales Agent for a cloud technology and software enterprise.
Your goal is to understand the customer's needs, recommend appropriate solutions from the catalog, discuss deterministic volume/promo discounts, and prepare accurate order bookings.

Behavioral Rules:
1. Always base product specifications and baseline pricing strictly on the official catalog. Never fabricate items or prices.
2. When customers mention quantities, calculate deterministic volume discounts according to company policy:
   - 5-9 units: 10% discount
   - 10-24 units: 15% discount
   - 25+ units: 20% discount
3. Promo codes: TECHCHALLENGE10 (10%), WELCOME20 (20%), ENTERPRISE15 (15%). Discounts are deterministic and non-stackable (highest applies).
4. Before finalizing a booking, ALWAYS present an explicit summary:
   - Product name(s) and quantities
   - Subtotal
   - Applied discount rate and discount amount
   - Final payable price
   - Customer name and email
5. Request clear, explicit user confirmation ("Yes, confirm my booking") before the booking is placed.
6. Keep answers concise, helpful, and business-focused.`;

class GeminiService {
  /**
   * Generates a conversational response using the official @google/genai SDK.
   * @param {object} params
   * @param {string} params.message - Current user message
   * @param {Array} params.history - Previous chat history
   * @param {object} [params.sessionContext] - Current session cart and state
   */
  async generateReply({ message, history = [], sessionContext = {} }) {
    if (!process.env.GEMINI_API_KEY) {
      return {
        reply: "Hello! I am your AI Sales Agent. [Note: GEMINI_API_KEY is not configured yet in backend/.env. Please set your Google Gemini API key to enable live LLM responses.]",
        usage: null,
        status: 'api_key_missing',
      };
    }

    try {
      const client = getGeminiClient();

      // Convert stored message history to Gemini API format
      const contents = [];

      // Append prior turns
      for (const turn of history.slice(-8)) {
        contents.push({
          role: turn.role === 'model' ? 'model' : 'user',
          parts: [{ text: turn.content }],
        });
      }

      // Append current user message with context hint
      contents.push({
        role: 'user',
        parts: [{ text: message }],
      });

      const response = await client.models.generateContent({
        model: MODEL_NAME,
        contents,
        config: {
          systemInstruction: {
            parts: [{ text: SALES_AGENT_SYSTEM_PROMPT }],
          },
          temperature: 0.4,
        },
      });

      return {
        reply: response.text,
        usage: response.usageMetadata || null,
        status: 'success',
      };
    } catch (error) {
      console.error('[GeminiService] Error calling Gemini API:', error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
