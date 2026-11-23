import { useState, type ChangeEvent } from "react";
import { parseState } from "../state";
import type { AppState } from "../types";

const downloadJson = (data: unknown, filename: string) => {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

interface BackupCardProps {
  state: AppState;
  filename: string;
  onImport: (backup: AppState) => void;
}

export const BackupCard = ({ state, filename, onImport }: BackupCardProps) => {
  const [error, setError] = useState("");

  const handleImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    try {
      onImport(parseState(JSON.parse(await file.text())));
      setError("");
    } catch {
      setError("Invalid backup file format.");
    }
    // Lets the same file be picked again after fixing it.
    input.value = "";
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
        <button
          className="primary-button"
          type="button"
          onClick={() => downloadJson(state, filename)}
        >
          Export data
        </button>
        <label className="ghost-button file-button">
          Import backup
          <input type="file" accept="application/json" onChange={handleImport} />
        </label>
      </div>
      {error && <p className="auth-message error">{error}</p>}
      <p className="backup-note">
        Data is stored locally in this browser. Export a backup if you plan to clear browser
        storage.
      </p>
    </div>
  );
};
