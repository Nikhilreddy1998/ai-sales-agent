import { Router } from 'express';
import {
  handleChatMessage,
  getSessionDetails,
  resetSession,
} from '../controllers/agentController.js';

const router = Router();

// POST /api/chat - Send message to AI Sales Agent
router.post('/', handleChatMessage);

// GET /api/chat/session/:id - Retrieve conversation session
router.get('/session/:id', getSessionDetails);

// DELETE /api/chat/session/:id - Reset conversation session
router.delete('/session/:id', resetSession);

export default router;
