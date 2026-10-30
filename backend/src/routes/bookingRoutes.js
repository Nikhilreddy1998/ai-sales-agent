import { Router } from 'express';
import {
  createBooking,
  calculatePricing,
  getBookingById,
  getAllBookings,
} from '../controllers/bookingController.js';

const router = Router();

// POST /api/bookings - Place a validated booking
router.post('/', createBooking);

// POST /api/bookings/calculate - Preview deterministic discount and final price
router.post('/calculate', calculatePricing);

// GET /api/bookings - List all bookings
router.get('/', getAllBookings);

// GET /api/bookings/:id - Get a specific booking by ID
router.get('/:id', getBookingById);

export default router;
