import { sessionService } from '../services/sessionService.js';
import { geminiService } from '../services/geminiService.js';

export const handleChatMessage = async (req, res, next) => {
  try {
    const { sessionId, message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Message string is required.',
      });
    }

    // 1. Retrieve or initialize conversation session
    const session = sessionService.getOrCreateSession(sessionId);

    // 2. Record user message
    sessionService.addMessage(session.id, 'user', message);

    // 3. Delegate to Gemini Service for consultation & response
    const geminiResult = await geminiService.generateReply({
      message,
      history: session.messages,
      sessionContext: session.currentCart,
    });

    // 4. Record agent response
    const modelMessage = sessionService.addMessage(
      session.id,
      'model',
      geminiResult.reply,
      { usage: geminiResult.usage, status: geminiResult.status }
    );

    return res.json({
      success: true,
      sessionId: session.id,
      reply: geminiResult.reply,
      message: modelMessage,
      currentCart: session.currentCart,
      session: {
        id: session.id,
        messagesCount: session.messages.length,
        updatedAt: session.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getSessionDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = sessionService.getSession(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: `Session with ID "${id}" was not found.`,
      });
    }

    return res.json({
      success: true,
      session,
    });
  } catch (error) {
    next(error);
  }
};

export const resetSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    sessionService.clearSession(id);

    return res.json({
      success: true,
      message: `Session "${id}" has been reset.`,
    });
  } catch (error) {
    next(error);
  }
};
