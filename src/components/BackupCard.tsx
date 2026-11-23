import { useState, type ChangeEvent } from "react";
import { parseState } from "../state";
import type { AppState } from "../types";
import { Icon } from "./Icon";

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
    <section className="card backup-card" aria-labelledby="backup-title">
      <header className="card-header">
        <h2 id="backup-title">Backup</h2>
        <p className="caption">
          Data lives in this browser. Export a copy before clearing storage or switching devices.
        </p>
      </header>
      <div className="backup-actions">
        <button className="button primary" type="button" onClick={() => downloadJson(state, filename)}>
          <Icon name="download" size={16} />
          Export data
        </button>
        <label className="button secondary file-button">
          <Icon name="upload" size={16} />
          Import backup
          <input type="file" accept="application/json" onChange={handleImport} />
        </label>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
};
