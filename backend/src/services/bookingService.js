import { randomUUID } from 'crypto';
import { catalogService } from './catalogService.js';
import { discountService } from './discountService.js';

class BookingService {
  constructor() {
    this.bookings = new Map();
    // Cache of recent hashes/signatures to prevent duplicate submissions
    this.idempotencyTokens = new Set();
  }

  /**
   * Generates a human-friendly unique booking ID.
   */
  generateBookingId() {
    const timestamp = Date.now().toString().slice(-4);
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `BK-${timestamp}-${randomHex}`;
  }

  /**
   * Validates a booking payload before creating a record.
   * @param {object} payload
   */
  validateBooking(payload) {
    const errors = [];

    if (!payload) {
      errors.push('Booking payload is missing.');
      return { isValid: false, errors };
    }

    const { customer, items, isConfirmed } = payload;

    if (!isConfirmed) {
      errors.push('Booking must be explicitly confirmed by the user before placement.');
    }

    if (!customer || !customer.name || !customer.name.trim()) {
      errors.push('Customer name is required.');
    }

    if (!customer || !customer.email || !customer.email.includes('@')) {
      errors.push('A valid customer email address is required.');
    }

    if (!Array.isArray(items) || items.length === 0) {
      errors.push('Booking must contain at least one product item.');
    } else {
      for (const item of items) {
        if (!item.productId) {
          errors.push('Each item must specify a productId.');
        } else {
          const product = catalogService.getProductById(item.productId);
          if (!product) {
            errors.push(`Product with ID "${item.productId}" was not found in the catalog.`);
          }
        }
        if (!item.quantity || Number(item.quantity) <= 0) {
          errors.push(`Invalid quantity for item ${item.productId || 'unknown'}.`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Checks whether this request is a duplicate.
   * @param {string} idempotencyKey
   * @param {string} customerEmail
   * @param {Array} items
   */
  isDuplicate(idempotencyKey, customerEmail, items) {
    if (idempotencyKey && this.idempotencyTokens.has(idempotencyKey)) {
      return true;
    }

    // Secondary duplicate guard: Check if identical pending booking exists for customer within recent window
    const signature = `${customerEmail}:${JSON.stringify(items.map((i) => ({ id: i.productId, q: i.quantity })))}`;
    if (this.idempotencyTokens.has(signature)) {
      return true;
    }

    return false;
  }

  /**
   * Creates a booking with pricing calculation, validation, and duplicate guards.
   * @param {object} payload
   */
  createBooking(payload) {
    const { customer, items, promoCode, idempotencyKey, sessionId } = payload;

    // 1. Validation
    const validation = this.validateBooking(payload);
    if (!validation.isValid) {
      const err = new Error(validation.errors.join(' '));
      err.statusCode = 400;
      err.details = validation.errors;
      throw err;
    }

    // 2. Duplicate Prevention
    if (this.isDuplicate(idempotencyKey, customer.email, items)) {
      const err = new Error('Duplicate booking detected. This order has already been processed.');
      err.statusCode = 409;
      throw err;
    }

    // 3. Enrich items with catalog data & deterministic pricing
    const enrichedItems = items.map((item) => {
      const product = catalogService.getProductById(item.productId);
      return {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: Number(item.quantity),
        itemTotal: Number((product.price * Number(item.quantity)).toFixed(2)),
      };
    });

    const pricing = discountService.calculateDiscount(enrichedItems, promoCode);

    // 4. Record booking
    const bookingId = this.generateBookingId();
    const bookingRecord = {
      bookingId,
      sessionId: sessionId || null,
      customer: {
        name: customer.name.trim(),
        email: customer.email.trim(),
      },
      items: enrichedItems,
      pricing,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
    };

    this.bookings.set(bookingId, bookingRecord);

    // Register idempotency key & signature (valid for deduplication)
    if (idempotencyKey) {
      this.idempotencyTokens.add(idempotencyKey);
    }
    const signature = `${customer.email}:${JSON.stringify(items.map((i) => ({ id: i.productId, q: i.quantity })))}`;
    this.idempotencyTokens.add(signature);

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
