import { randomUUID } from 'crypto';

/**
 * In-memory session store managing conversation history,
 * customer profile, price objection counters, and active quotations.
 */
class SessionService {
  constructor() {
    this.sessions = new Map();
  }

  /**
   * Retrieves an existing session or creates a new one.
   * @param {string} [sessionId]
   * @returns {object} Session data
   */
  getOrCreateSession(sessionId) {
    if (sessionId && this.sessions.has(sessionId)) {
      return this.sessions.get(sessionId);
    }

    const id = sessionId || `sess-${randomUUID().substring(0, 8)}`;
    const newSession = {
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
      objectionCount: 0, // 0: Initial (0%), 1: First Objection (SAVE10, 10%), 2: Second Objection (CLOSENOW15, 15%)
      activeQuotation: null, // Immutable server-generated quotation
      customer: {
        name: null,
        email: null,
      },
      currentCart: {
        items: [],
        subtotal: 0,
        discountPercentage: 0,
        discountAmount: 0,
        finalPrice: 0,
      },
      confirmedBooking: null,
      context: {
        pendingConfirmation: false,
        isConfirmed: false,
      },
    };

    this.sessions.set(id, newSession);
    return newSession;
  }

  /**
   * Returns a session by ID.
   * @param {string} sessionId
   */
  getSession(sessionId) {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Records a user objection and increments the objection level (capped at 2).
   * @param {string} sessionId
   * @returns {number} New objection count
   */
  registerPriceObjection(sessionId) {
    const session = this.getOrCreateSession(sessionId);
    session.objectionCount = Math.min(2, (session.objectionCount || 0) + 1);
    session.updatedAt = new Date().toISOString();
    return session.objectionCount;
  }

  /**
   * Updates or locks the active quotation for the session.
   * @param {string} sessionId
   * @param {object} quotation
   */
  setActiveQuotation(sessionId, quotation) {
    const session = this.getOrCreateSession(sessionId);
    session.activeQuotation = quotation;
    session.currentCart = {
      items: [
        {
          sku: quotation.sku,
          name: quotation.productName,
          tier: quotation.tier,
          quantity: quotation.units,
          price: quotation.unitPrice,
          requiredCapacity: quotation.requiredCapacity,
          itemTotal: quotation.subtotal,
        },
      ],
      subtotal: quotation.subtotal,
      discountPercentage: quotation.discountPercent,
      discountAmount: quotation.discountAmount,
      promoCode: quotation.promoCode,
      finalPrice: quotation.finalPrice,
      quotationId: quotation.quotationId,
    };
    session.context.pendingConfirmation = true;
    session.updatedAt = new Date().toISOString();
    return session.activeQuotation;
  }

  /**
   * Updates customer profile in session.
   * @param {string} sessionId
   * @param {object} customerData
   */
  updateCustomer(sessionId, customerData = {}) {
    const session = this.getOrCreateSession(sessionId);
    if (customerData.name) session.customer.name = customerData.name.trim();
    if (customerData.email) session.customer.email = customerData.email.trim();
    session.updatedAt = new Date().toISOString();
    return session.customer;
  }

  /**
   * Appends a message to the conversation history.
   * @param {string} sessionId
   * @param {'user' | 'model' | 'system'} role
   * @param {string} content
   * @param {object} [metadata]
   */
  addMessage(sessionId, role, content, metadata = {}) {
    const session = this.getOrCreateSession(sessionId);
    const message = {
      id: randomUUID(),
      role,
      content,
      metadata,
      timestamp: new Date().toISOString(),
    };
    session.messages.push(message);
    session.updatedAt = new Date().toISOString();
    return message;
  }

  /**
   * Resets or clears a session.
   * @param {string} sessionId
   */
  clearSession(sessionId) {
    return this.sessions.delete(sessionId);
  }
}

export const sessionService = new SessionService();
