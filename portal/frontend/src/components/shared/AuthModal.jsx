import React from "react";
import "../../styles/AuthModal.css";

/**
 * Modal that prompts users to authenticate
 */
function AuthModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Authentication Required</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-text">
            You need to be logged in to create provisioning requests.
          </p>
          <p className="modal-text">
            Feel free to explore the blueprints and test the cost estimates without logging in.
          </p>
        </div>

        <div className="modal-footer">
          <button className="modal-btn modal-btn--secondary" onClick={onClose}>
            Continue Exploring
          </button>
          <a href="/?tab=admin" className="modal-btn modal-btn--primary">
            Go to Login
          </a>
        </div>
      </div>
    </div>
  );
}

export default AuthModal;
