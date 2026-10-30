import { Router } from 'express';
import { getCatalog, getProductById } from '../controllers/catalogController.js';

const router = Router();

// GET /api/catalog - List all products or filter by query params
router.get('/', getCatalog);

// GET /api/catalog/:id - Get a specific product by ID
router.get('/:id', getProductById);

export default router;
