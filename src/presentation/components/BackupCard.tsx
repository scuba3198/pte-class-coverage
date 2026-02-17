import React, { useState } from "react";

interface BackupCardProps {
  onExport: () => void;
  onImport: (jsonData: string) => Promise<{ ok: boolean; error?: string }>;
}

/**
 * Component for data export and restoration.
 */
export const BackupCard: React.FC<BackupCardProps> = ({ onExport, onImport }) => {
  const [importError, setImportError] = useState("");

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = await onImport(text);
      if (result.ok) {
        setImportError("");
      } else {
        setImportError(result.error || "Import failed");
      }
    } catch {
      setImportError("Invalid backup file format.");
    }
  };

  return (
    <div className="card backup-card">
      <div className="card-header">
        <div>
          <p className="section-label">Backup</p>
          <h2>Export or restore</h2>
          <p className="card-subtitle">Download a JSON backup or import one to restore.</p>
        </div>
      </div>
      <div className="backup-actions">
        <button className="primary-button" type="button" onClick={onExport}>
          Export data
        </button>
        <label className="ghost-button file-button">
          Import backup
          <input type="file" accept="application/json" onChange={handleImport} />
        </label>
      </div>
      {importError && <p className="auth-message error">{importError}</p>}
      <p className="backup-note">
        Data is stored locally in this browser. Export a backup if you plan to clear browser
        storage.
      </p>
    </div>
  );
};
