import { getGeminiClient } from '../config/gemini.js';
import { CATALOG } from './catalogService.js';

const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

/**
 * System instruction strictly enforcing separation of concerns (Requirement E):
 * Gemini understands natural-language, but delegates all authoritative pricing,
 * capacity mathematics, discount progression, and booking authorizations to the backend.
 */
export const SALES_AGENT_SYSTEM_PROMPT = `You are a consultative AI Sales Agent for enterprise hardware and networking solutions.

Available Official Catalog:
1. SKU_AIRPODS_PRO2: "AirPods Pro 2nd Gen" | Capacity: 1 user per unit | Pricing tiers: STD ($249), CARE ($279)
2. SKU_MESH_WIFI6:   "AeroMesh Wi-Fi 6E Home Pack" | Capacity: 2 coverage zones per pack | Pricing tiers: STD ($399), PRO ($499)
3. SKU_TEAM_HUB:     "SyncHub Conference Bar" | Capacity: 3 room units/teams | Pricing tiers: STD ($899), PRO ($1150)

Behavioral & Architecture Rules (MANDATORY):
1. You MUST NOT calculate final prices, units, or discounts yourself. The backend server calculates them deterministically.
2. In your conversational text, explain features, answer customer questions, recommend products, and present quotation details provided in the system context.
3. Detect customer intents accurately:
   - Identify which product SKU they are discussing.
   - Identify which tier (STD or CARE/PRO). Default to STD if unspecified.
   - Identify how much capacity / headcount / coverage zones they need (e.g. "I need Wi-Fi for 5 zones", "I have 4 people").
   - Detect PRICE OBJECTIONS: If the user says it is too expensive, asks for a discount, promo code, or a better deal, flag "hasPriceObjection": true.
   - Detect CUSTOMER DETAILS: If user provides name or email, extract them.
   - Detect EXPLICIT CONFIRMATION: If user explicitly confirms or approves the quote (e.g. "yes, confirm", "go ahead", "book it"), flag "isConfirmingBooking": true.

Always return your response in clean JSON format matching this schema:
{
  "reply": "Your friendly, professional sales answer to the user.",
  "intent": {
    "sku": "SKU_AIRPODS_PRO2" | "SKU_MESH_WIFI6" | "SKU_TEAM_HUB" | null,
    "tier": "STD" | "CARE" | "PRO" | null,
    "requiredCapacity": number | null,
    "hasPriceObjection": boolean,
    "customerName": string | null,
    "customerEmail": string | null,
    "isConfirmingBooking": boolean
  }
}`;

class GeminiService {
  /**
   * Generates a consultative response and extracts structured user intent.
   * @param {object} params
   * @param {string} params.message - Current user input
   * @param {Array} params.history - Previous messages
   * @param {object} [params.sessionContext] - Active quotation and cart state
   */
  async generateReply({ message, history = [], sessionContext = {} }) {
    if (!process.env.GEMINI_API_KEY) {
      return {
        reply: 'Hello! I am your AI Sales Agent. [Note: GEMINI_API_KEY is not configured yet in backend/.env.]',
        intent: {
          sku: null,
          tier: null,
          requiredCapacity: null,
          hasPriceObjection: false,
          customerName: null,
          customerEmail: null,
          isConfirmingBooking: false,
        },
        usage: null,
        status: 'api_key_missing',
      };
    }

    try {
      const client = getGeminiClient();

      const contents = [];

      // Append conversational history
      for (const turn of history.slice(-6)) {
        contents.push({
          role: turn.role === 'model' ? 'model' : 'user',
          parts: [{ text: turn.content }],
        });
      }

      // Add context hint about active quotation
      let contextNote = '';
      if (sessionContext.activeQuotation) {
        const q = sessionContext.activeQuotation;
        contextNote = `\n[System Context: Current Active Quotation: ${q.units} units of ${q.productName} (${q.tier} tier) for ${q.requiredCapacity} capacity. Subtotal: $${q.subtotal}. Discount: ${q.discountPercent}% (${q.promoCode || 'none'}). Final Price: $${q.finalPrice}. Objection Level: ${q.objectionLevel}/2]`;
      }

      contents.push({
        role: 'user',
        parts: [{ text: message + contextNote }],
      });

      const response = await client.models.generateContent({
        model: MODEL_NAME,
        contents,
        config: {
          systemInstruction: {
            parts: [{ text: SALES_AGENT_SYSTEM_PROMPT }],
          },
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      });

      let parsed = null;
      try {
        parsed = JSON.parse(response.text);
      } catch (parseErr) {
        // Fallback if not valid JSON
        parsed = {
          reply: response.text,
          intent: {
            sku: null,
            tier: null,
            requiredCapacity: null,
            hasPriceObjection: false,
            customerName: null,
            customerEmail: null,
            isConfirmingBooking: false,
          },
        };
      }

      return {
        reply: parsed.reply || response.text,
        intent: parsed.intent || {},
        usage: response.usageMetadata || null,
        status: 'success',
      };
    } catch (error) {
      console.error('[GeminiService] Error communicating with Gemini API:', error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
