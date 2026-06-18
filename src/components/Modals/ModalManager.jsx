'use client';

import React, { useEffect } from 'react';
import { useNexaFlow } from '@/context/NexaFlowContext';
import { 
  X, 
  Check, 
  Loader2, 
  AlertTriangle, 
  AlertCircle, 
  HelpCircle, 
  ExternalLink, 
  RefreshCw,
  Cpu,
  Wallet 
} from 'lucide-react';
import './ModalManager.css';

export default function ModalManager() {
  const { modalStack, closeModal } = useNexaFlow();

  // Handle ESC key press globally for dismissible modals
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === 'Escape' && modalStack.length > 0) {
        const topModal = modalStack[modalStack.length - 1];
        if (topModal.dismissible !== false) {
          closeModal(topModal.id);
          if (topModal.onCancel) topModal.onCancel();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [modalStack, closeModal]);

  if (!modalStack || modalStack.length === 0) return null;

  // Handle Tab key focus trapping for a specific modal container
  const handleModalKeyDown = (e, modal) => {
    if (e.key === 'Tab') {
      const container = document.getElementById(`modal-${modal.id}`);
      if (!container) return;

      const focusable = Array.from(
        container.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter(el => !el.disabled);

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) { // Shift + Tab
        if (document.activeElement === first) {
          last.focus();
          e.preventDefault();
        }
      } else { // Tab
        if (document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    }
  };

  // Helper to format addresses
  const shortAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="modal-overlays-container">
      {modalStack.map((modal, index) => {
        // Only render/show the top-most modal overlay, but keep others in the stack
        const isTop = index === modalStack.length - 1;
        if (!isTop) return null;

        const isDismissible = modal.dismissible !== false;
        // Skew modal card rotation slightly based on ID length or index for neobrutalist vibe
        const skewClass = index % 2 === 0 ? 'skew-left' : 'skew-right';

        return (
          <div 
            key={modal.id} 
            className="modal-overlay"
            onClick={() => {
              if (isDismissible) {
                closeModal(modal.id);
                if (modal.onCancel) modal.onCancel();
              }
            }}
          >
            <div 
              id={`modal-${modal.id}`}
              className={`modal-container ${skewClass}`}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => handleModalKeyDown(e, modal)}
              role="dialog"
              aria-modal="true"
              aria-labelledby={`title-${modal.id}`}
            >
              {/* Colored top Neobrutalist tape */}
              <div className={`modal-header-tape ${modal.type}`} />

              {/* Close button */}
              {isDismissible && (
                <button 
                  className="modal-close-btn"
                  onClick={() => {
                    closeModal(modal.id);
                    if (modal.onCancel) modal.onCancel();
                  }}
                  aria-label="Close modal"
                >
                  <X size={16} />
                </button>
              )}

              <div className="modal-content-inner">
                {/* Header Section */}
                <div className="modal-header-block">
                  <div className={`modal-icon-badge ${modal.type}`}>
                    {(modal.type === 'confirm' || modal.type === 'wallet-select') && <HelpCircle size={22} />}
                    {modal.type === 'loading' && <Loader2 className="modal-loading-spinner" size={22} />}
                    {modal.type === 'success' && <Check size={22} />}
                    {modal.type === 'error' && <AlertCircle size={22} />}
                    {modal.type === 'warning' && <AlertTriangle size={22} />}
                    {modal.type === 'tx-status' && (
                      modal.txStatus === 'success' ? <Check size={22} /> :
                      modal.txStatus === 'failed' ? <AlertCircle size={22} /> :
                      modal.txStatus === 'rejected' ? <AlertTriangle size={22} /> :
                      <Loader2 className="modal-loading-spinner" size={22} />
                    )}
                  </div>
                  <div className="modal-title-text">
                    <h3 id={`title-${modal.id}`}>{modal.title || 'Notification'}</h3>
                    {modal.subtitle && <span>{modal.subtitle}</span>}
                  </div>
                </div>

                {/* Body Description */}
                {modal.description && (
                  <div className="modal-body-desc">
                    {modal.description}
                  </div>
                )}

                {/* Wallet Selection Grid */}
                {modal.type === 'wallet-select' && (
                  <div className="wallet-select-grid">
                    <button 
                      className="wallet-select-card"
                      onClick={() => {
                        closeModal(modal.id);
                        if (modal.onSelectSmart) modal.onSelectSmart();
                      }}
                    >
                      <div className="wallet-select-icon" style={{ backgroundColor: 'var(--color-primary)' }}>
                        <Cpu size={20} color="var(--text-main)" />
                      </div>
                      <div className="wallet-select-details">
                        <div className="wallet-select-name">Passkey Smart Account</div>
                        <div className="wallet-select-address">{shortAddress(modal.smartAddress)}</div>
                        <div className="wallet-select-balance">{modal.smartBalance} USDC</div>
                      </div>
                    </button>

                    <button 
                      className="wallet-select-card"
                      onClick={() => {
                        closeModal(modal.id);
                        if (modal.onSelectEoa) modal.onSelectEoa();
                      }}
                    >
                      <div className="wallet-select-icon" style={{ backgroundColor: 'var(--color-success)' }}>
                        <Wallet size={20} color="var(--text-main)" />
                      </div>
                      <div className="wallet-select-details">
                        <div className="wallet-select-name">Connected EOA Wallet</div>
                        <div className="wallet-select-address">{shortAddress(modal.eoaAddress)}</div>
                        <div className="wallet-select-balance">{modal.eoaBalance} USDC</div>
                      </div>
                    </button>
                  </div>
                )}

                {/* Details Table (If key-value stats are passed) */}
                {modal.details && modal.details.length > 0 && (
                  <div className="modal-details-box">
                    {modal.details.map((detail, idx) => (
                      <div key={idx} className="modal-details-row">
                        <span className="modal-details-label">{detail.label}</span>
                        <span className={`modal-details-value ${detail.isAddress ? 'address' : ''}`}>
                          {detail.isAddress ? shortAddress(detail.value) : detail.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Blockchain transaction stages tracking */}
                {modal.type === 'tx-status' && modal.steps && modal.steps.length > 0 && (
                  <div className="modal-tx-steps">
                    {modal.steps.map((step, idx) => (
                      <div 
                        key={idx} 
                        className={`modal-tx-step ${
                          step.status === 'active' ? 'active' : 
                          step.status === 'completed' ? 'completed' : 
                          step.status === 'failed' ? 'failed' : ''
                        }`}
                      >
                        <div className="modal-tx-step-dot">
                          {step.status === 'completed' ? <Check size={10} /> : idx + 1}
                        </div>
                        <div style={{ flex: 1 }}>{step.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Loading bar for loader variants */}
                {modal.type === 'loading' && !modal.hideProgressBar && (
                  <div className="modal-loading-bar-container">
                    <div className="modal-loading-bar-fill" />
                  </div>
                )}

                {/* Explorer Link (Web3 Transactions) */}
                {modal.txHash && (
                  <div className="modal-details-box" style={{ marginTop: -4 }}>
                    <div className="modal-details-row">
                      <span className="modal-details-label">Tx Hash</span>
                      <a 
                        href={`https://explorer.testnet.arc.network/tx/${modal.txHash}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="modal-details-value address"
                        style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
                      >
                        {shortAddress(modal.txHash)}
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                )}

                {/* Action Buttons Footer */}
                {modal.type !== 'loading' && modal.type !== 'wallet-select' && (
                  <div className="modal-actions-footer">
                    {/* Secondary button */}
                    {modal.type === 'confirm' || modal.type === 'warning' ? (
                      <button 
                        className="btn btn-secondary"
                        onClick={() => {
                          closeModal(modal.id);
                          if (modal.onCancel) modal.onCancel();
                        }}
                      >
                        {modal.cancelText || 'Cancel'}
                      </button>
                    ) : null}

                    {/* Primary Button */}
                    {modal.type === 'error' && modal.onRetry ? (
                      <button 
                        className="btn btn-primary"
                        onClick={async () => {
                          closeModal(modal.id);
                          await modal.onRetry();
                        }}
                      >
                        <RefreshCw size={14} style={{ marginRight: 4 }} />
                        {modal.retryText || 'Retry'}
                      </button>
                    ) : (
                      modal.onConfirm && (
                        <button 
                          className={`btn ${
                            modal.type === 'confirm' ? 'btn-primary' : 
                            modal.type === 'warning' ? 'btn-danger' : 
                            modal.type === 'success' ? 'btn-success' : 'btn-primary'
                          }`}
                          onClick={async () => {
                            // Close modal unless manual close is specified
                            if (modal.keepOpenOnConfirm !== true) {
                              closeModal(modal.id);
                            }
                            await modal.onConfirm();
                          }}
                        >
                          {modal.confirmText || 'Confirm'}
                        </button>
                      )
                    )}

                    {/* Close / Dismiss action for informational dialogs */}
                    {!modal.onConfirm && !modal.onRetry && (
                      <button 
                        className="btn btn-secondary"
                        onClick={() => {
                          closeModal(modal.id);
                          if (modal.onCancel) modal.onCancel();
                        }}
                      >
                        {modal.closeText || 'Close'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
