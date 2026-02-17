import React from "react";
import type { Module, ResolvedWeightageEntry } from "../../domain/types";

interface SessionCardProps {
  activeModule: Module;
  modules: readonly Module[];
  sessionDate: string;
  applyToCoverage: boolean;
  sessionSelection: string[];
  coverageEntries: ResolvedWeightageEntry[];
  onSelectModule: (id: string) => void;
  onSetDate: (date: string) => void;
  onSetApplyToCoverage: (apply: boolean) => void;
  onToggleItem: (id: string) => void;
}

/**
 * Component for logging new class sessions.
 */
export const SessionCard: React.FC<SessionCardProps> = ({
  activeModule,
  modules,
  sessionDate,
  applyToCoverage,
  sessionSelection,
  coverageEntries,
  onSelectModule,
  onSetDate,
  onSetApplyToCoverage,
  onToggleItem,
}) => {
  const moduleInitials: Record<string, string> = {
    speaking: "S",
    writing: "W",
    reading: "R",
    listening: "L",
  };

  return (
    <div className="card session-card">
      <div className="card-header">
        <div>
          <p className="section-label">Session log</p>
          <h2>Auto-saved session</h2>
          <p className="card-subtitle">Add what you learned in class today.</p>
        </div>
      </div>
      <div className="module-tabs">
        {modules.map((m) => (
          <button
            key={`session-tab-${m.id}`}
            className={m.id === activeModule.id ? "module-tab active" : "module-tab"}
            type="button"
            onClick={() => onSelectModule(m.id)}
          >
            {m.name}
          </button>
        ))}
      </div>
      <div className="session-controls">
        <label>
          Date
          <input type="date" value={sessionDate} onChange={(e) => onSetDate(e.target.value)} />
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={applyToCoverage}
            onChange={(e) => onSetApplyToCoverage(e.target.checked)}
          />
          Also mark as covered
        </label>
      </div>
      <div className="question-grid compact">
        {coverageEntries.map((entry) => {
          const isSelected = sessionSelection.includes(entry.questionTypeId || "");
          const originSuffix =
            entry.originModuleId && entry.originModuleId !== activeModule.id
              ? ` (${moduleInitials[entry.originModuleId] || "?"})`
              : "";

          return (
            <button
              key={`${entry.questionTypeId}-${activeModule.id}-session`}
              className={isSelected ? "question-card selected" : "question-card"}
              type="button"
              onClick={() => onToggleItem(entry.questionTypeId || "")}
            >
              <span className="question-name">{`${entry.question}${originSuffix}`}</span>
              <span className="question-status">{isSelected ? "Included" : "Tap to add"}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
