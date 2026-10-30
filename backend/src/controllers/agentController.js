import { sessionService } from '../services/sessionService.js';
import { geminiService } from '../services/geminiService.js';
import { discountService } from '../services/discountService.js';
import { catalogService } from '../services/catalogService.js';
import { bookingService } from '../services/bookingService.js';

export const handleChatMessage = async (req, res, next) => {
  try {
    const { sessionId, message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Message string is required.',
      });
    }

    // 1. Retrieve or initialize conversation session
    const session = sessionService.getOrCreateSession(sessionId);

    // 2. Record user message
    sessionService.addMessage(session.id, 'user', message);

    // 3. Delegate to Gemini Service for consultation & intent extraction
    const geminiResult = await geminiService.generateReply({
      message,
      history: session.messages,
      sessionContext: {
        activeQuotation: session.activeQuotation,
        customer: session.customer,
      },
    });

    const intent = geminiResult.intent || {};

    // 4. Update customer information if detected
    if (intent.customerName || intent.customerEmail) {
      sessionService.updateCustomer(session.id, {
        name: intent.customerName,
        email: intent.customerEmail,
      });
    }

    // 5. Handle Price Objection Progression (Requirement C)
    if (intent.hasPriceObjection) {
      sessionService.registerPriceObjection(session.id);
    }

    // 6. Recalculate or update Deterministic Quotation (Requirements A, B, C)
    const targetSku = intent.sku || (session.activeQuotation ? session.activeQuotation.sku : null);
    if (targetSku) {
      const product = catalogService.getProductBySku(targetSku);
      if (product) {
        const requiredCapacity = intent.requiredCapacity || (session.activeQuotation ? session.activeQuotation.requiredCapacity : product.capacity);
        const tier = intent.tier || (session.activeQuotation ? session.activeQuotation.tier : 'STD');

        const quotation = discountService.calculateQuotation({
          sku: product.sku,
          tier,
          requiredCapacity,
          objectionCount: session.objectionCount,
        });

        sessionService.setActiveQuotation(session.id, quotation);
      }
    }

    // 7. Handle Explicit Booking Confirmation (Requirement D)
    let autoBooking = null;
    if (intent.isConfirmingBooking && session.activeQuotation && session.customer.email && session.customer.name) {
      try {
        autoBooking = bookingService.createBooking({
          sessionId: session.id,
          quotationId: session.activeQuotation.quotationId,
          customer: session.customer,
          isConfirmed: true,
        });
      } catch (bookingErr) {
        // If validation or duplicate error occurs, log it
        console.warn('[Agent Controller] Auto-booking warning:', bookingErr.message);
      }
    }

    // 8. Record agent response
    const modelMessage = sessionService.addMessage(
      session.id,
      'model',
      geminiResult.reply,
      {
        usage: geminiResult.usage,
        intent,
        quotationId: session.activeQuotation?.quotationId || null,
        bookingId: autoBooking?.bookingId || null,
      }
    );

    return res.json({
      success: true,
      sessionId: session.id,
      reply: geminiResult.reply,
      message: modelMessage,
      activeQuotation: session.activeQuotation,
      currentCart: session.currentCart,
      customer: session.customer,
      confirmedBooking: autoBooking || session.confirmedBooking,
      objectionLevel: session.objectionCount,
    });
  } catch (error) {
    next(error);
  }
};

export const getSessionDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = sessionService.getSession(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: `Session with ID "${id}" was not found.`,
      });
    }

    return res.json({
      success: true,
      session,
    });
  } catch (error) {
    next(error);
  }
};

export const resetSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    sessionService.clearSession(id);

    return res.json({
      success: true,
      message: `Session "${id}" has been reset.`,
    });
  } catch (error) {
    next(error);
  }
};
