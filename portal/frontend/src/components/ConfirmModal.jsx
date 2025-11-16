import React from "react";
import "../styles/Modal.css";

function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", type = "warning" }) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className={`modal-header modal-header--${type}`}>
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {typeof message === 'string' ? <p>{message}</p> : message}
        </div>
        <div className="modal-footer">
          <button className="modal-btn modal-btn--secondary" onClick={onClose}>
            {cancelText}
          </button>
          <button className={`modal-btn modal-btn--${type === 'warning' ? 'danger' : 'primary'}`} onClick={handleConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
