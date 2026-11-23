import { getModule, getQuestionTypeName } from "../coverage";
import type { Session } from "../types";

/** Parses YYYY-MM-DD as a local date; `new Date("2026-11-23")` would be UTC and can show the day before. */
const formatDate = (value: string): string => {
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00` : value);
  if (Number.isNaN(date.valueOf())) return value;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

interface SessionHistoryProps {
  className: string;
  sessions: Session[];
  onDelete: (sessionId: string) => void;
}

export const SessionHistory = ({ className, sessions, onDelete }: SessionHistoryProps) => (
  <div className="card log-card">
    <div className="card-header">
      <div>
        <p className="section-label">Session history</p>
        <h2>{className}</h2>
        <p className="card-subtitle">{sessions.length} sessions recorded</p>
      </div>
    </div>
    {sessions.length ? (
      <div className="session-list">
        {[...sessions]
          .sort((a, b) => b.date.localeCompare(a.date))
          .map((session) => {
            const names = session.questionTypeIds
              .flatMap((id) => getQuestionTypeName(id) ?? [])
              .sort((a, b) => a.localeCompare(b));
            return (
              <div key={session.id} className="session-item">
                <div>
                  <p className="session-date">{formatDate(session.date)}</p>
                  <p className="session-module">{getModule(session.moduleId).name}</p>
                  <p className="session-questions">
                    {names.length ? names.join(", ") : "No items recorded"}
                  </p>
                </div>
                <button className="ghost-button" type="button" onClick={() => onDelete(session.id)}>
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
