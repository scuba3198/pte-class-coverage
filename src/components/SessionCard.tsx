import { entryLabel, getCoverageEntries } from "../coverage";
import type { ModuleId } from "../types";
import { ModuleTabs } from "./ModuleTabs";

interface SessionCardProps {
  moduleId: ModuleId;
  date: string;
  alsoCover: boolean;
  selected: string[];
  onSelectModule: (id: ModuleId) => void;
  onSetDate: (date: string) => void;
  onSetAlsoCover: (alsoCover: boolean) => void;
  onToggle: (typeId: string) => void;
}

/** Records which question types were taught on a given day; every click saves. */
export const SessionCard = ({
  moduleId,
  date,
  alsoCover,
  selected,
  onSelectModule,
  onSetDate,
  onSetAlsoCover,
  onToggle,
}: SessionCardProps) => (
  <div className="card session-card">
    <div className="card-header">
      <div>
        <p className="section-label">Session log</p>
        <h2>Auto-saved session</h2>
        <p className="card-subtitle">Add what you learned in class today.</p>
      </div>
    </div>
    <ModuleTabs active={moduleId} onSelect={onSelectModule} />
    <div className="session-controls">
      <label>
        Date
        <input
          type="date"
          value={date}
          onChange={(e) => e.target.value && onSetDate(e.target.value)}
        />
      </label>
      <label className="toggle">
        <input
          type="checkbox"
          checked={alsoCover}
          onChange={(e) => onSetAlsoCover(e.target.checked)}
        />
        Also mark as covered
      </label>
    </div>
    <div className="question-grid compact">
      {getCoverageEntries(moduleId).map((entry) => {
        const isSelected = selected.includes(entry.typeId);
        return (
          <button
            key={entry.typeId}
            className={isSelected ? "question-card selected" : "question-card"}
            type="button"
            onClick={() => onToggle(entry.typeId)}
          >
            <span className="question-name">{entryLabel(entry, moduleId)}</span>
            <span className="question-status">{isSelected ? "Included" : "Tap to add"}</span>
          </button>
        );
      })}
    </div>
  </div>
);
