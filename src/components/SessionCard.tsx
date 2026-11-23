import { entryLabel, getCoverageEntries } from "../coverage";
import type { ModuleId } from "../types";
import { Icon } from "./Icon";

interface SessionCardProps {
  moduleId: ModuleId;
  date: string;
  alsoCover: boolean;
  selected: string[];
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
  onSetDate,
  onSetAlsoCover,
  onToggle,
}: SessionCardProps) => (
  <section className="sidebar-section" data-module={moduleId} aria-labelledby="session-title">
    <header className="section-head">
      <h2 id="session-title">Log a session</h2>
      <p className="section-desc">Tap what you taught. Changes save automatically.</p>
    </header>
    <div className="session-controls">
      <label className="field">
        <span className="field-label">Date</span>
        <input
          className="control"
          type="date"
          value={date}
          onChange={(e) => e.target.value && onSetDate(e.target.value)}
        />
      </label>
      <label className="switch">
        <input
          type="checkbox"
          role="switch"
          checked={alsoCover}
          onChange={(e) => onSetAlsoCover(e.target.checked)}
        />
        <span className="switch-track" aria-hidden="true" />
        <span>Also mark as covered</span>
      </label>
    </div>
    <div className="session-chips">
      {getCoverageEntries(moduleId).map((entry) => {
        const isSelected = selected.includes(entry.typeId);
        return (
          <button
            key={entry.typeId}
            className="chip session-chip"
            type="button"
            aria-pressed={isSelected}
            onClick={() => onToggle(entry.typeId)}
          >
            <Icon name={isSelected ? "check" : "plus"} size={14} />
            {entryLabel(entry, moduleId)}
          </button>
        );
      })}
    </div>
  </section>
);
