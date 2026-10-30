import React from 'react';
import { Bot, RefreshCw, Activity, CheckCircle, AlertTriangle } from 'lucide-react';

export default function Header({ isConnected, onResetSession, sessionId }) {
  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="logo-badge">
          <Bot size={22} className="logo-icon" />
        </div>
        <div>
          <h1 className="header-title">AI Sales Agent</h1>
          <p className="header-subtitle">
            Consultative Solution Selling • Deterministic Discounts • Live Booking
          </p>
        </div>
      </div>

      <div className="header-actions">
        <div className={`status-pill ${isConnected ? 'status-online' : 'status-offline'}`}>
          {isConnected ? (
            <>
              <CheckCircle size={14} />
              <span>Backend Connected</span>
            </>
          ) : (
            <>
              <AlertTriangle size={14} />
              <span>Backend Disconnected</span>
            </>
          )}
        </div>

        {sessionId && (
          <span className="session-tag" title="Active Session ID">
            ID: {sessionId.slice(0, 8)}...
          </span>
        )}

        <button
          onClick={onResetSession}
          className="btn-secondary"
          title="Reset conversation session"
          id="btn-reset-session"
        >
          <RefreshCw size={15} />
          <span>New Session</span>
        </button>
      </div>
    </header>
  );
}
