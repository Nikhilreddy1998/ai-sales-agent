import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import catalogRoutes from './routes/catalogRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import agentRoutes from './routes/agentRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logger for visibility and interview debugging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Core API Routes
app.use('/api/catalog', catalogRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/chat', agentRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint ${req.method} ${req.originalUrl} not found`,
  });
});

// Central Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// Start listening
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 AI Sales Agent Backend running on port ${PORT}`);
  console.log(`   Health Check: http://localhost:${PORT}/health`);
  console.log(`   Catalog API:  http://localhost:${PORT}/api/catalog`);
  console.log(`   Bookings API: http://localhost:${PORT}/api/bookings`);
  console.log(`   Chat API:     http://localhost:${PORT}/api/chat`);
  console.log(`   Gemini Key:   ${process.env.GEMINI_API_KEY ? 'Configured ✅' : 'Not Set ⚠️'}`);
  console.log(`===============================================`);
});

export default app;
