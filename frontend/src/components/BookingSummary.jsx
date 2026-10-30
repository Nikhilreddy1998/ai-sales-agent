import React from 'react';
import { ShoppingCart, CheckCircle2, Tag, ShieldCheck, FileText, ArrowRight } from 'lucide-react';

export default function BookingSummary({ bookingDraft, confirmedBooking, onSimulateOrder }) {
  const hasItems = bookingDraft?.items && bookingDraft.items.length > 0;
  const pricing = bookingDraft?.pricing || {
    subtotal: 0,
    discountPercentage: 0,
    discountAmount: 0,
    finalPrice: 0,
    appliedRules: [],
  };

  return (
    <div className="card-panel">
      <div className="card-header">
        <div className="card-title-group">
          <ShoppingCart size={18} className="text-accent" />
          <h2 className="card-title">Booking Summary</h2>
        </div>
        {confirmedBooking && (
          <span className="badge-success">
            <CheckCircle2 size={13} /> Confirmed
          </span>
        )}
      </div>

      {/* Confirmed Booking Display */}
      {confirmedBooking ? (
        <div className="confirmed-booking-card">
          <div className="confirmed-header">
            <div className="confirmed-icon">
              <ShieldCheck size={28} />
            </div>
            <div>
              <span className="confirmed-label">Booking Confirmation</span>
              <div className="booking-id-pill" id="display-booking-id">
                {confirmedBooking.bookingId}
              </div>
            </div>
          </div>

          <div className="booking-details-grid">
            <div className="detail-item">
              <span className="detail-label">Customer</span>
              <span className="detail-value">{confirmedBooking.customer?.name}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Email</span>
              <span className="detail-value">{confirmedBooking.customer?.email}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Status</span>
              <span className="detail-value text-success">{confirmedBooking.status}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Booked At</span>
              <span className="detail-value">
                {new Date(confirmedBooking.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          <div className="confirmed-items-list">
            <span className="section-subtitle">Items Booked:</span>
            {confirmedBooking.items.map((item, idx) => (
              <div key={idx} className="summary-item-row">
                <span>{item.name} × {item.quantity}</span>
                <span>${item.itemTotal.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="pricing-breakdown">
            <div className="price-row">
              <span>Subtotal</span>
              <span>${confirmedBooking.pricing.subtotal.toFixed(2)}</span>
            </div>
            {confirmedBooking.pricing.discountAmount > 0 && (
              <div className="price-row text-discount">
                <span>Discount ({confirmedBooking.pricing.discountPercentage}%)</span>
                <span>-${confirmedBooking.pricing.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="price-row total-row">
              <span>Final Price</span>
              <span className="final-price-value">${confirmedBooking.pricing.finalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>
      ) : (
        /* Draft / Live Calculation State */
        <div className="draft-booking-view">
          {hasItems ? (
            <div className="draft-items-list">
              <span className="section-subtitle">Selected Items:</span>
              {bookingDraft.items.map((item, idx) => (
                <div key={idx} className="summary-item-row">
                  <div>
                    <span className="item-name">{item.name}</span>
                    <span className="item-meta">
                      Qty: {item.quantity} × ${Number(item.price).toFixed(2)}
                    </span>
                  </div>
                  <span className="item-total">
                    ${(Number(item.price) * Number(item.quantity)).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-cart-state">
              <FileText size={28} className="text-muted" />
              <p>No items in draft yet. Inquire via the chat agent or test a sample order below.</p>
              <button
                onClick={onSimulateOrder}
                className="btn-outline-small"
                id="btn-sample-draft"
              >
                <span>Load Sample Order (5 Starter Cloud Suites)</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* Pricing & Deterministic Discount Breakdown */}
          <div className="pricing-breakdown">
            <div className="price-row">
              <span>Subtotal</span>
              <span id="price-subtotal">${pricing.subtotal.toFixed(2)}</span>
            </div>

            <div className="price-row">
              <span className="discount-label">
                <Tag size={14} />
                <span>Deterministic Discount</span>
              </span>
              <span className={pricing.discountAmount > 0 ? 'text-discount' : 'text-muted'}>
                {pricing.discountPercentage > 0 ? `-${pricing.discountPercentage}% (-$${pricing.discountAmount.toFixed(2)})` : '$0.00'}
              </span>
            </div>

            {pricing.appliedRules && pricing.appliedRules.length > 0 && (
              <div className="rules-tags">
                {pricing.appliedRules.map((rule, idx) => (
                  <span key={idx} className="rule-chip">
                    {rule}
                  </span>
                ))}
              </div>
            )}

            <div className="price-row total-row">
              <span>Final Price</span>
              <span className="final-price-value" id="price-final">
                ${pricing.finalPrice.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
