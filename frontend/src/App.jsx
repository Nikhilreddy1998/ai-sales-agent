import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ChatInterface from './components/ChatInterface';
import BookingSummary from './components/BookingSummary';
import ApiActivityLog from './components/ApiActivityLog';
import { api, subscribeToApiLogs } from './services/api';
import './App.css';

export default function App() {
  const [sessionId, setSessionId] = useState(() => 'sess-' + Math.random().toString(36).substring(2, 10));
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [logs, setLogs] = useState([]);
  const [bookingDraft, setBookingDraft] = useState({
    items: [],
    pricing: {
      subtotal: 0,
      discountPercentage: 0,
      discountAmount: 0,
      finalPrice: 0,
      appliedRules: [],
    },
  });
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Subscribe to real-time API activity events
  useEffect(() => {
    const unsubscribe = subscribeToApiLogs((newLog) => {
      setLogs((prevLogs) => {
        // If updating an existing pending log
        const existingIdx = prevLogs.findIndex((l) => l.id === newLog.id);
        if (existingIdx !== -1) {
          const updated = [...prevLogs];
          updated[existingIdx] = newLog;
          return updated;
        }
        // Otherwise prepend new log at top
        return [newLog, ...prevLogs.slice(0, 49)];
      });
    });

    return () => unsubscribe();
  }, []);

  // Check backend health & fetch catalog on initial load
  useEffect(() => {
    const initApp = async () => {
      try {
        const health = await api.checkHealth();
        if (health && health.status === 'ok') {
          setIsConnected(true);
        }
        // Fetch catalog to verify GET integration and populate activity log
        await api.getCatalog();
      } catch (err) {
        console.warn('[App Init] Backend not reachable yet:', err.message);
        setIsConnected(false);
      }
    };

    initApp();
  }, []);

  // Send message to AI Sales Agent
  const handleSendMessage = async (text) => {
    const userMessage = {
      id: Math.random().toString(36).substring(2, 9),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await api.sendMessage(sessionId, text);
      const agentMessage = {
        id: response.message?.id || Math.random().toString(36).substring(2, 9),
        role: 'model',
        content: response.reply,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, agentMessage]);

      if (response.currentCart && response.currentCart.items?.length > 0) {
        setBookingDraft({
          items: response.currentCart.items,
          pricing: {
            subtotal: response.currentCart.subtotal || 0,
            discountPercentage: response.currentCart.discountPercentage || 0,
            discountAmount: response.currentCart.discountAmount || 0,
            finalPrice: response.currentCart.finalPrice || 0,
            appliedRules: response.currentCart.appliedRules || [],
          },
        });
      }
    } catch (err) {
      console.error('[App] Chat error:', err);
      const errorMessage = {
        id: Math.random().toString(36).substring(2, 9),
        role: 'model',
        content: `Error communicating with sales backend: ${err.message}. Please verify the backend server is running on port 5000.`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset conversation session
  const handleResetSession = async () => {
    try {
      if (sessionId) {
        await api.resetSession(sessionId);
      }
    } catch (e) {
      // ignore reset errors
    }
    const newId = 'sess-' + Math.random().toString(36).substring(2, 10);
    setSessionId(newId);
    setMessages([]);
    setBookingDraft({
      items: [],
      pricing: {
        subtotal: 0,
        discountPercentage: 0,
        discountAmount: 0,
        finalPrice: 0,
        appliedRules: [],
      },
    });
    setConfirmedBooking(null);
  };

  // Simulate loading sample order items into draft & calculating deterministic discount
  const handleSimulateOrder = async () => {
    try {
      const sampleItems = [
        { productId: 'prod-001', name: 'Starter Cloud Suite', price: 49.99, quantity: 5 },
      ];
      const res = await api.calculatePricing(sampleItems, 'WELCOME20');
      if (res && res.pricing) {
        setBookingDraft({
          items: sampleItems,
          pricing: res.pricing,
        });
      }
    } catch (err) {
      console.error('Failed to simulate sample pricing:', err);
    }
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="app-layout">
      <Header
        isConnected={isConnected}
        onResetSession={handleResetSession}
        sessionId={sessionId}
      />

      <main className="dashboard-grid">
        {/* Left Column: Chat Consultation Stream */}
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />

        {/* Right Column: Booking Summary & Activity Logs */}
        <div className="side-panels-stack">
          <BookingSummary
            bookingDraft={bookingDraft}
            confirmedBooking={confirmedBooking}
            onSimulateOrder={handleSimulateOrder}
          />

          <ApiActivityLog
            logs={logs}
            onClearLogs={handleClearLogs}
          />
        </div>
      </main>
    </div>
  );
}
