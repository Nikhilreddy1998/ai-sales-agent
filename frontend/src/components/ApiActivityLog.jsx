import React, { useState } from 'react';
import { Terminal, Trash2, ChevronDown, ChevronRight, Check, AlertCircle, Clock } from 'lucide-react';

export default function ApiActivityLog({ logs = [], onClearLogs }) {
  const [expandedLogId, setExpandedLogId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedLogId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="card-panel activity-log-panel">
      <div className="card-header">
        <div className="card-title-group">
          <Terminal size={18} className="text-accent" />
          <h2 className="card-title">API Activity Logs</h2>
          <span className="badge-count">{logs.length} events</span>
        </div>
        {logs.length > 0 && (
          <button
            onClick={onClearLogs}
            className="btn-icon-subtle"
            title="Clear Activity Logs"
            id="btn-clear-logs"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div className="logs-container">
        {logs.length === 0 ? (
          <div className="empty-logs-state">
            <Clock size={20} className="text-muted" />
            <p>No network activity logged yet. Send a chat message or fetch catalog to see live GET/POST calls.</p>
          </div>
        ) : (
          logs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            const isGet = log.method === 'GET';
            const isPost = log.method === 'POST';
            const isSuccess = log.status === 'SUCCESS';
            const isError = log.status === 'ERROR' || log.status === 'FAILED';

            return (
              <div
                key={log.id}
                className={`log-item ${isExpanded ? 'log-item-expanded' : ''}`}
                onClick={() => toggleExpand(log.id)}
              >
                <div className="log-summary-line">
                  <div className="log-left">
                    <span className="log-chevron">
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                    <span className={`method-badge ${isGet ? 'badge-get' : isPost ? 'badge-post' : ''}`}>
                      {log.method}
                    </span>
                    <span className="endpoint-text" title={log.endpoint}>
                      {log.endpoint}
                    </span>
                  </div>

                  <div className="log-right">
                    {log.durationMs !== null && (
                      <span className="duration-text">{log.durationMs}ms</span>
                    )}
                    <span
                      className={`status-code-badge ${
                        isSuccess ? 'code-success' : isError ? 'code-error' : 'code-pending'
                      }`}
                    >
                      {log.statusCode || (log.status === 'PENDING' ? '...' : 'ERR')}
                    </span>
                    <span className="log-time">{log.timestamp}</span>
                  </div>
                </div>

                {/* Collapsible Details */}
                {isExpanded && (
                  <div className="log-details-body" onClick={(e) => e.stopPropagation()}>
                    {log.requestPayload && (
                      <div className="payload-block">
                        <span className="payload-title">Request Payload:</span>
                        <pre className="payload-json">
                          {JSON.stringify(log.requestPayload, null, 2)}
                        </pre>
                      </div>
                    )}
                    {log.responsePayload && (
                      <div className="payload-block">
                        <span className="payload-title">Response Payload:</span>
                        <pre className="payload-json">
                          {JSON.stringify(log.responsePayload, null, 2)}
                        </pre>
                      </div>
                    )}
                    {log.error && (
                      <div className="payload-block text-error">
                        <span className="payload-title">Error:</span>
                        <div className="error-box">{log.error}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
