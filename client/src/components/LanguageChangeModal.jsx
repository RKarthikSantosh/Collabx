import './LanguageChangeModal.css';

function LanguageChangeModal({ userName, newLanguage, onConfirm, isOpen }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content language-change-modal">
        <div className="modal-icon">🔔</div>
        <h2 className="modal-title">Language Changed</h2>
        <p className="modal-message">
          <strong>{userName}</strong> changed the language to <strong>{newLanguage.toUpperCase()}</strong>
        </p>
        <div className="modal-info">
          All collaborators will now code in <strong>{newLanguage}</strong>
        </div>
        <button className="modal-button" onClick={onConfirm}>
          ✓ OK
        </button>
      </div>
    </div>
  );
}

export default LanguageChangeModal;
