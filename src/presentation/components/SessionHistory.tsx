import React from "react";
import type { Session } from "../../domain/types";
import { getModuleById, getQuestionTypeById } from "../../domain/logic/coverage";

interface SessionHistoryProps {
  activeClassName: string;
  sessions: Session[];
  onDeleteSession: (id: string) => void;
}

/**
 * Component displaying historical class sessions.
 */
export const SessionHistory: React.FC<SessionHistoryProps> = ({
  activeClassName,
  sessions,
  onDeleteSession,
}) => {
  const formatDate = (value: string): string => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.valueOf())) return value;
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const sortedSessions = [...sessions].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="card log-card">
      <div className="card-header">
        <div>
          <p className="section-label">Session history</p>
          <h2>{activeClassName}</h2>
          <p className="card-subtitle">{sessions.length} sessions recorded</p>
        </div>
      </div>
      {sortedSessions.length ? (
        <div className="session-list">
          {sortedSessions.map((entry) => {
            const module = getModuleById(entry.moduleId);
            const questionNames = entry.questionTypeIds
              .map((id) => getQuestionTypeById(id))
              .filter((item): item is NonNullable<typeof item> => !!item)
              .map((item) => item.name)
              .sort((a, b) => a.localeCompare(b));

            return (
              <div key={entry.id} className="session-item">
                <div>
                  <p className="session-date">{formatDate(entry.date)}</p>
                  <p className="session-module">{module.name}</p>
                  <p className="session-questions">
                    {questionNames.length ? questionNames.join(", ") : "No items recorded"}
                  </p>
                </div>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => onDeleteSession(entry.id)}
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <p>No sessions yet. Add one on the left to start tracking.</p>
        </div>
      )}
    </div>
  );
};
