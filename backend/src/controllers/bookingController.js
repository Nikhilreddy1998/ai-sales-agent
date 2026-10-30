import { bookingService } from '../services/bookingService.js';
import { discountService } from '../services/discountService.js';

export const createBooking = async (req, res, next) => {
  try {
    const booking = bookingService.createBooking(req.body);
    return res.status(201).json({
      success: true,
      message: 'Booking successfully confirmed and recorded.',
      booking,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
        details: error.details || null,
      });
    }
    next(error);
  }
};

export const calculatePricing = async (req, res, next) => {
  try {
    const { sku, tier, requiredCapacity, objectionCount, promoCode, items } = req.body;

    if (sku) {
      const quotation = discountService.calculateQuotation({
        sku,
        tier: tier || 'STD',
        requiredCapacity: requiredCapacity || 1,
        objectionCount: objectionCount || 0,
        promoCode: promoCode || '',
      });

      return res.json({
        success: true,
        quotation,
      });
    }

    // Fallback for generic items calculation
    const pricing = discountService.calculateDiscount(items || [], promoCode || '');
    return res.json({
      success: true,
      pricing,
    });
  } catch (error) {
    next(error);
  }
};

export const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = bookingService.getBookingById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: `Booking with ID "${id}" was not found.`,
      });
    }

    return res.json({
      success: true,
      booking,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllBookings = async (req, res, next) => {
  try {
    const bookings = bookingService.getAllBookings();
    return res.json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    next(error);
  }
};
