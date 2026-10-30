import { randomUUID } from 'crypto';

/**
 * In-memory session store for conversation and cart/booking state.
 * In production or scaling setups, this could be backed by Redis or a database.
 */
class SessionService {
  constructor() {
    this.sessions = new Map();
  }

  /**
   * Retrieves an existing session or creates a new one if not found.
   * @param {string} [sessionId]
   * @returns {object} Session data
   */
  getOrCreateSession(sessionId) {
    if (sessionId && this.sessions.has(sessionId)) {
      return this.sessions.get(sessionId);
    }

    const id = sessionId || randomUUID();
    const newSession = {
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
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
        customerName: null,
        customerEmail: null,
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
   * Updates session cart / order draft state.
   * @param {string} sessionId
   * @param {object} cartData
   */
  updateCart(sessionId, cartData) {
    const session = this.getOrCreateSession(sessionId);
    session.currentCart = {
      ...session.currentCart,
      ...cartData,
    };
    session.updatedAt = new Date().toISOString();
    return session.currentCart;
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
