/**
 * Frontend API client with integrated activity logging.
 * Communicates strictly with the backend proxy (/api) to ensure no secrets or API keys are exposed.
 */

// Simple pub/sub system for real-time API activity logging
const listeners = new Set();

export const subscribeToApiLogs = (callback) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};

const notifyLog = (logEntry) => {
  listeners.forEach((cb) => {
    try {
      cb(logEntry);
    } catch (err) {
      console.error('Error in log listener:', err);
    }
  });
};

/**
 * Universal fetch wrapper that logs requests & responses for interview visibility
 */
async function loggedFetch(endpoint, options = {}) {
  const startTime = performance.now();
  const method = options.method || 'GET';
  const url = endpoint;
  const requestId = Math.random().toString(36).substring(2, 8);

  const initialLog = {
    id: requestId,
    timestamp: new Date().toLocaleTimeString(),
    method,
    endpoint,
    status: 'PENDING',
    statusCode: null,
    durationMs: null,
    requestPayload: options.body ? JSON.parse(options.body) : null,
    responsePayload: null,
    error: null,
  };

  notifyLog(initialLog);

  try {
    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });

    const durationMs = Math.round(performance.now() - startTime);
    const data = await response.json();

    const completedLog = {
      ...initialLog,
      status: response.ok ? 'SUCCESS' : 'ERROR',
      statusCode: response.status,
      durationMs,
      responsePayload: data,
      error: response.ok ? null : data.error || response.statusText,
    };

    notifyLog(completedLog);

    if (!response.ok) {
      const error = new Error(data.error || `HTTP error! status: ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    const durationMs = Math.round(performance.now() - startTime);
    const errorLog = {
      ...initialLog,
      status: 'FAILED',
      statusCode: error.status || 500,
      durationMs,
      error: error.message,
    };
    notifyLog(errorLog);
    throw error;
  }
}

export const api = {
  /**
   * Health check
   */
  async checkHealth() {
    return loggedFetch('/health');
  },

  /**
   * GET /api/catalog
   */
  async getCatalog(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/api/catalog${query ? `?${query}` : ''}`;
    return loggedFetch(endpoint);
  },

  /**
   * POST /api/chat
   */
  async sendMessage(sessionId, message) {
    return loggedFetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ sessionId, message }),
    });
  },

  /**
   * POST /api/bookings/calculate
   */
  async calculatePricing(items, promoCode) {
    return loggedFetch('/api/bookings/calculate', {
      method: 'POST',
      body: JSON.stringify({ items, promoCode }),
    });
  },

  /**
   * POST /api/bookings
   */
  async createBooking(bookingPayload) {
    return loggedFetch('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingPayload),
    });
  },

  /**
   * GET /api/bookings
   */
  async getBookings() {
    return loggedFetch('/api/bookings');
  },

  /**
   * DELETE /api/chat/session/:id
   */
  async resetSession(sessionId) {
    return loggedFetch(`/api/chat/session/${sessionId}`, {
      method: 'DELETE',
    });
  },
};
