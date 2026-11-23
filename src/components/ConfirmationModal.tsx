import { useEffect, useRef, type KeyboardEvent } from "react";

interface ConfirmationModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal = ({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) => {
  const dialog = useRef<HTMLDivElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);

  // Starts on the safe choice, and returns focus to whatever opened the dialog once it closes.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    cancel.current?.focus();
    return () => opener?.focus();
  }, []);

  useEffect(() => {
    const closeOnEscape = (e: globalThis.KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onCancel]);

  // Keeps Tab cycling between the dialog's buttons.
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Tab" || !dialog.current) return;
    const buttons = [...dialog.current.querySelectorAll("button")];
    const first = buttons[0]!;
    const last = buttons[buttons.length - 1]!;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        ref={dialog}
        className="modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-message"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <h2 id="modal-title">{title}</h2>
        <p id="modal-message">{message}</p>
        <div className="modal-actions">
          <button className="button secondary" type="button" onClick={onCancel} ref={cancel}>
            Cancel
          </button>
          <button className="button destructive" type="button" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
