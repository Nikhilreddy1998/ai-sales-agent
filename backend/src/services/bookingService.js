import { randomUUID } from 'crypto';
import { catalogService } from './catalogService.js';
import { discountService } from './discountService.js';
import { sessionService } from './sessionService.js';

class BookingService {
  constructor() {
    this.bookings = new Map();
    // Cache of recent tokens and signatures with timestamps to prevent memory leaks and duplicates
    this.idempotencyTokens = new Map(); // token -> timestamp
    this.TTL_MS = 5 * 60 * 1000; // 5 minute deduplication window
  }

  /**
   * Cleans up expired idempotency tokens to avoid memory leaks.
   */
  cleanupExpiredTokens() {
    const now = Date.now();
    for (const [key, timestamp] of this.idempotencyTokens.entries()) {
      if (now - timestamp > this.TTL_MS) {
        this.idempotencyTokens.delete(key);
      }
    }
  }

  /**
   * Generates a unique booking confirmation ID.
   */
  generateBookingId() {
    const timestamp = Date.now().toString().slice(-4);
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `BK-${timestamp}-${randomHex}`;
  }

  /**
   * Validates a booking request.
   * Requirement D: Must use the exact latest confirmed quotation & explicit confirmation.
   *
   * @param {object} payload
   */
  validateBooking(payload) {
    const errors = [];

    if (!payload) {
      errors.push('Booking payload is missing.');
      return { isValid: false, errors };
    }

    const { customer, isConfirmed, sessionId, quotationId } = payload;

    if (!isConfirmed) {
      errors.push('Booking must be explicitly confirmed by the customer before placement.');
    }

    if (!customer || !customer.name || !customer.name.trim()) {
      errors.push('Customer name is required.');
    }

    if (!customer || !customer.email || !customer.email.includes('@')) {
      errors.push('A valid customer email address is required.');
    }

    // Verify session and quotation binding
    if (sessionId) {
      const session = sessionService.getSession(sessionId);
      if (!session) {
        errors.push(`Session "${sessionId}" was not found.`);
      } else if (!session.activeQuotation) {
        errors.push('No active quotation found for this session. Please request a quote first.');
      } else if (quotationId && session.activeQuotation.quotationId !== quotationId) {
        errors.push('Quotation mismatch. The submitted quotation has expired or been superseded by a newer quote.');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Checks whether this request is a duplicate submission.
   * @param {string} idempotencyKey
   * @param {string} customerEmail
   * @param {string} quotationId
   */
  isDuplicate(idempotencyKey, customerEmail, quotationId) {
    this.cleanupExpiredTokens();
    const now = Date.now();

    if (idempotencyKey && this.idempotencyTokens.has(idempotencyKey)) {
      return true;
    }

    const signature = `${customerEmail.trim().toLowerCase()}:${quotationId}`;
    if (this.idempotencyTokens.has(signature)) {
      return true;
    }

    return false;
  }

  /**
   * Creates a confirmed booking tied to the authoritative quotation.
   * @param {object} payload
   */
  createBooking(payload) {
    const { customer, isConfirmed, sessionId, idempotencyKey, quotationId, items } = payload;

    // 1. Validation
    const validation = this.validateBooking(payload);
    if (!validation.isValid) {
      const err = new Error(validation.errors.join(' '));
      err.statusCode = 400;
      err.details = validation.errors;
      throw err;
    }

    // 2. Resolve authoritative quotation
    let quotation = null;
    if (sessionId) {
      const session = sessionService.getSession(sessionId);
      if (session && session.activeQuotation) {
        quotation = session.activeQuotation;
      }
    }

    // Fallback quotation creation if passed directly with items and promo code
    if (!quotation && Array.isArray(items) && items.length > 0) {
      const firstItem = items[0];
      quotation = discountService.calculateQuotation({
        sku: firstItem.sku || firstItem.productId,
        tier: firstItem.tier || 'STD',
        requiredCapacity: firstItem.requiredCapacity || firstItem.quantity || 1,
        promoCode: payload.promoCode || '',
      });
    }

    if (!quotation) {
      const err = new Error('Cannot place booking without a valid quotation.');
      err.statusCode = 400;
      throw err;
    }

    // 3. Duplicate Prevention Guard
    if (this.isDuplicate(idempotencyKey, customer.email, quotation.quotationId)) {
      const err = new Error('Duplicate booking detected. This quotation has already been booked.');
      err.statusCode = 409;
      throw err;
    }

    // 4. Record confirmed booking
    const bookingId = this.generateBookingId();
    const now = Date.now();
    const bookingRecord = {
      bookingId,
      quotationId: quotation.quotationId,
      sessionId: sessionId || null,
      customer: {
        name: customer.name.trim(),
        email: customer.email.trim(),
      },
      items: [
        {
          sku: quotation.sku,
          name: quotation.productName,
          tier: quotation.tier,
          unitPrice: quotation.unitPrice,
          requiredCapacity: quotation.requiredCapacity,
          capacityPerUnit: quotation.capacityPerUnit,
          units: quotation.units,
          formula: quotation.formula,
          itemTotal: quotation.subtotal,
        },
      ],
      pricing: {
        subtotal: quotation.subtotal,
        discountPercentage: quotation.discountPercent,
        discountAmount: quotation.discountAmount,
        promoCode: quotation.promoCode,
        discountLabel: quotation.discountLabel,
        finalPrice: quotation.finalPrice,
      },
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
    };

    this.bookings.set(bookingId, bookingRecord);

    // Save tokens in deduplication cache with timestamp
    if (idempotencyKey) {
      this.idempotencyTokens.set(idempotencyKey, now);
    }
    const signature = `${customer.email.trim().toLowerCase()}:${quotation.quotationId}`;
    this.idempotencyTokens.set(signature, now);

    // Update session state
    if (sessionId) {
      const session = sessionService.getSession(sessionId);
      if (session) {
        session.confirmedBooking = bookingRecord;
        session.context.pendingConfirmation = false;
        session.context.isConfirmed = true;
      }
    }

    return bookingRecord;
  }

  /**
   * Retrieves a booking by its ID.
   * @param {string} bookingId
   */
  getBookingById(bookingId) {
    return this.bookings.get(bookingId) || null;
  }

  /**
   * Lists all existing bookings.
   */
  getAllBookings() {
    return Array.from(this.bookings.values());
  }
}

export const bookingService = new BookingService();
