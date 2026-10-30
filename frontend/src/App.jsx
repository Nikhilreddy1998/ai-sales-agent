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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logs, setLogs] = useState([]);
  const [activeQuotation, setActiveQuotation] = useState(null);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [customer, setCustomer] = useState({ name: '', email: '' });

  // Subscribe to real-time API activity events
  useEffect(() => {
    const unsubscribe = subscribeToApiLogs((newLog) => {
      setLogs((prevLogs) => {
        const existingIdx = prevLogs.findIndex((l) => l.id === newLog.id);
        if (existingIdx !== -1) {
          const updated = [...prevLogs];
          updated[existingIdx] = newLog;
          return updated;
        }
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

      if (response.activeQuotation) {
        setActiveQuotation(response.activeQuotation);
      }

      if (response.customer) {
        setCustomer(response.customer);
      }

      if (response.confirmedBooking) {
        setConfirmedBooking(response.confirmedBooking);
      }
    } catch (err) {
      console.error('[App] Chat error:', err);
      const errorMessage = {
        id: Math.random().toString(36).substring(2, 9),
        role: 'model',
        content: `Error communicating with sales backend: ${err.message}. Please verify the backend is running on port 5000.`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Explicit Booking Confirmation (Requirement D)
  const handleConfirmBooking = async (customerData) => {
    if (!activeQuotation) return;
    setIsSubmitting(true);

    try {
      const response = await api.createBooking({
        sessionId,
        quotationId: activeQuotation.quotationId,
        customer: customerData,
        isConfirmed: true,
      });

      if (response.booking) {
        setConfirmedBooking(response.booking);
        setCustomer(customerData);

        const confirmationMsg = {
          id: Math.random().toString(36).substring(2, 9),
          role: 'model',
          content: `🎉 Booking confirmed! Your reference ID is **${response.booking.bookingId}**. An order confirmation for ${response.booking.items[0]?.name} ($${response.booking.pricing.finalPrice}) has been sent to ${customerData.email}.`,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, confirmationMsg]);
      }
    } catch (err) {
      alert(`Booking Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Simulate or calculate a specific quote scenario
  const handleSimulateQuote = async (sku, tier, capacity) => {
    try {
      const res = await api.calculatePricing({
        sku,
        tier,
        requiredCapacity: capacity,
        objectionCount: 0,
      });

      if (res && res.quotation) {
        setActiveQuotation(res.quotation);
        setConfirmedBooking(null);
      }
    } catch (err) {
      console.error('Failed to calculate quotation:', err);
    }
  };

  // Trigger objection progression level (Level 1: SAVE10, Level 2: CLOSENOW15)
  const handleTriggerObjection = async (level) => {
    if (!activeQuotation) return;

    try {
      const res = await api.calculatePricing({
        sku: activeQuotation.sku,
        tier: activeQuotation.tier,
        requiredCapacity: activeQuotation.requiredCapacity,
        objectionCount: level,
      });

      if (res && res.quotation) {
        setActiveQuotation(res.quotation);
      }
    } catch (err) {
      console.error('Failed to trigger objection discount:', err);
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
    setActiveQuotation(null);
    setConfirmedBooking(null);
    setCustomer({ name: '', email: '' });
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
            activeQuotation={activeQuotation}
            confirmedBooking={confirmedBooking}
            customer={customer}
            onConfirmBooking={handleConfirmBooking}
            onSimulateQuote={handleSimulateQuote}
            onTriggerObjection={handleTriggerObjection}
            isSubmitting={isSubmitting}
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
