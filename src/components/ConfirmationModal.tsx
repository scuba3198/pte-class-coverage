interface ConfirmationModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal = ({
  title,
  message,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) => (
  <div className="modal-overlay" onClick={onCancel}>
    <div className="modal-content card" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h3>{title}</h3>
      </div>
      <div className="modal-body">
        <p>{message}</p>
      </div>
      <div className="modal-footer">
        <button className="button secondary" onClick={onCancel}>
          Cancel
        </button>
        <button className="button destructive" onClick={onConfirm}>
          Proceed
        </button>
      </div>
    </div>
  </div>
);
