import React, { useState } from 'react';
import { ShoppingCart, CheckCircle2, Tag, ShieldCheck, FileText, ArrowRight, Zap, Check } from 'lucide-react';

export default function BookingSummary({
  activeQuotation,
  confirmedBooking,
  customer,
  onConfirmBooking,
  onSimulateQuote,
  onTriggerObjection,
  isSubmitting,
}) {
  const [customerName, setCustomerName] = useState(customer?.name || '');
  const [customerEmail, setCustomerEmail] = useState(customer?.email || '');

  const hasQuote = Boolean(activeQuotation);

  const handleConfirmClick = () => {
    const finalName = customerName || customer?.name || 'Customer';
    const finalEmail = customerEmail || customer?.email || 'customer@example.com';
    onConfirmBooking({ name: finalName, email: finalEmail });
  };

  return (
    <div className="card-panel">
      <div className="card-header">
        <div className="card-title-group">
          <ShoppingCart size={18} className="text-accent" />
          <h2 className="card-title">Quotation & Booking</h2>
        </div>
        {confirmedBooking ? (
          <span className="badge-success">
            <CheckCircle2 size={13} /> Confirmed
          </span>
        ) : activeQuotation ? (
          <span className="session-tag" title="Active Quotation ID">
            {activeQuotation.quotationId}
          </span>
        ) : null}
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
              <span className="detail-label">Quotation Ref</span>
              <span className="detail-value font-mono">{confirmedBooking.quotationId}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Status</span>
              <span className="detail-value text-success">{confirmedBooking.status}</span>
            </div>
          </div>

          <div className="confirmed-items-list">
            <span className="section-subtitle">Booked Solution:</span>
            {confirmedBooking.items.map((item, idx) => (
              <div key={idx} className="summary-item-row">
                <div>
                  <span className="item-name">{item.name} ({item.tier})</span>
                  <span className="item-meta">{item.formula}</span>
                </div>
                <span className="item-total">${item.itemTotal?.toFixed(2)}</span>
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
                <span>Discount ({confirmedBooking.pricing.discountPercentage}% - {confirmedBooking.pricing.promoCode})</span>
                <span>-${confirmedBooking.pricing.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="price-row total-row">
              <span>Final Paid Price</span>
              <span className="final-price-value">${confirmedBooking.pricing.finalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>
      ) : hasQuote ? (
        /* Active Quotation Breakdown */
        <div className="draft-booking-view">
          <div className="draft-items-list">
            <span className="section-subtitle">Solution Specification:</span>
            <div className="quote-spec-card">
              <div className="spec-header">
                <span className="spec-sku">{activeQuotation.sku}</span>
                <span className="spec-tier-badge">{activeQuotation.tier} TIER</span>
              </div>
              <h4 className="spec-product-name">{activeQuotation.productName}</h4>
              
              <div className="formula-callout" title="Capacity calculation formula">
                <Zap size={14} className="text-accent" />
                <span className="font-mono">{activeQuotation.formula}</span>
              </div>

              <div className="spec-meta-grid">
                <div>
                  <span className="detail-label">Required Capacity</span>
                  <span className="detail-value">{activeQuotation.requiredCapacity}</span>
                </div>
                <div>
                  <span className="detail-label">Unit Capacity</span>
                  <span className="detail-value">{activeQuotation.capacityPerUnit}</span>
                </div>
                <div>
                  <span className="detail-label">Calculated Units</span>
                  <span className="detail-value font-mono font-bold">{activeQuotation.units}</span>
                </div>
                <div>
                  <span className="detail-label">Unit Price</span>
                  <span className="detail-value">${activeQuotation.unitPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & Objection Progression Breakdown */}
          <div className="pricing-breakdown">
            <div className="price-row">
              <span>Subtotal ({activeQuotation.units} × ${activeQuotation.unitPrice})</span>
              <span className="font-mono">${activeQuotation.subtotal.toFixed(2)}</span>
            </div>

            <div className="price-row">
              <span className="discount-label">
                <Tag size={14} />
                <span>Deterministic Discount</span>
              </span>
              <span className={activeQuotation.discountAmount > 0 ? 'text-discount font-mono' : 'text-muted'}>
                {activeQuotation.discountPercent > 0
                  ? `-${activeQuotation.discountPercent}% (-$${activeQuotation.discountAmount.toFixed(2)})`
                  : '0% (Standard Rate)'}
              </span>
            </div>

            {activeQuotation.discountLabel && (
              <div className="rules-tags">
                <span className="rule-chip">
                  {activeQuotation.discountLabel}
                </span>
                {activeQuotation.promoCode && (
                  <span className="rule-chip font-mono font-bold">
                    CODE: {activeQuotation.promoCode}
                  </span>
                )}
              </div>
            )}

            <div className="price-row total-row">
              <span>Final Authorized Price</span>
              <span className="final-price-value" id="price-final">
                ${activeQuotation.finalPrice.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Customer Input & Confirmation Section */}
          <div className="booking-action-section">
            <span className="section-subtitle">Confirm Customer Details:</span>
            <div className="customer-input-grid">
              <input
                type="text"
                placeholder="Full Name (e.g. John Doe)"
                value={customerName || customer?.name || ''}
                onChange={(e) => setCustomerName(e.target.value)}
                className="input-subtle"
                id="input-customer-name"
              />
              <input
                type="email"
                placeholder="Work Email (e.g. john@company.com)"
                value={customerEmail || customer?.email || ''}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="input-subtle"
                id="input-customer-email"
              />
            </div>

            <button
              onClick={handleConfirmClick}
              disabled={isSubmitting}
              className="btn-confirm-booking"
              id="btn-confirm-booking"
            >
              <Check size={16} />
              <span>{isSubmitting ? 'Processing Booking...' : 'Explicitly Confirm & Book Quotation'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Empty / Starter State */
        <div className="empty-cart-state">
          <FileText size={32} className="text-muted" />
          <p>No active quotation yet. Request a product quote in chat or select a test scenario below.</p>
          
          <div className="scenario-buttons">
            <button
              onClick={() => onSimulateQuote('SKU_MESH_WIFI6', 'STD', 5)}
              className="btn-outline-small"
            >
              <span>Quote AeroMesh (5 zones, STD)</span>
              <ArrowRight size={13} />
            </button>
            <button
              onClick={() => onSimulateQuote('SKU_TEAM_HUB', 'PRO', 7)}
              className="btn-outline-small"
            >
              <span>Quote SyncHub (7 teams, PRO)</span>
              <ArrowRight size={13} />
            </button>
            <button
              onClick={() => onSimulateQuote('SKU_AIRPODS_PRO2', 'CARE', 4)}
              className="btn-outline-small"
            >
              <span>Quote AirPods Pro (4 users, CARE)</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Objection Testing Controls for Live Interview Demo */}
      {hasQuote && !confirmedBooking && (
        <div className="objection-testing-toolbar">
          <span className="toolbar-label">Interview Objection Progression:</span>
          <div className="toolbar-buttons">
            <button
              onClick={() => onTriggerObjection(1)}
              className={`btn-toolbar ${activeQuotation.objectionLevel >= 1 ? 'btn-toolbar-active' : ''}`}
              title="Level 1: SAVE10 (10% off)"
            >
              1st Objection (SAVE10)
            </button>
            <button
              onClick={() => onTriggerObjection(2)}
              className={`btn-toolbar ${activeQuotation.objectionLevel >= 2 ? 'btn-toolbar-active' : ''}`}
              title="Level 2: CLOSENOW15 (15% off)"
            >
              2nd Objection (CLOSENOW15)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
