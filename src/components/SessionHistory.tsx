import { getModule, getQuestionTypeName } from "../coverage";
import type { Session } from "../types";
import { Icon } from "./Icon";

/** Parses YYYY-MM-DD as a local date; `new Date("2026-11-23")` would be UTC and can show the day before. */
const formatDate = (value: string): string => {
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00` : value);
  if (Number.isNaN(date.valueOf())) return value;
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

interface SessionHistoryProps {
  className: string;
  sessions: Session[];
  onDelete: (sessionId: string) => void;
}

export const SessionHistory = ({ className, sessions, onDelete }: SessionHistoryProps) => (
  <section className="sidebar-section" aria-labelledby="history-title">
    <header className="section-head">
      <h2 id="history-title">
        Session history <span className="count-badge">{sessions.length}</span>
      </h2>
      <p className="section-desc">Everything logged for class {className}</p>
    </header>
    {sessions.length ? (
      <ul className="session-list">
        {[...sessions]
          .sort((a, b) => b.date.localeCompare(a.date))
          .map((session) => {
            const names = session.questionTypeIds
              .flatMap((id) => getQuestionTypeName(id) ?? [])
              .sort((a, b) => a.localeCompare(b));
            return (
              <li key={session.id} className="session-item" data-module={session.moduleId}>
                <span className="dot" aria-hidden="true" />
                <div className="session-body">
                  <p className="session-meta">
                    <span className="session-date">{formatDate(session.date)}</span>
                    <span className="session-module">{getModule(session.moduleId).name}</span>
                  </p>
                  {names.length ? (
                    <ul className="session-tags">
                      {names.map((n) => (
                        <li key={n} className="tag">
                          {n}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="caption">No items recorded</p>
                  )}
                </div>
                <button
                  className="icon-button"
                  type="button"
                  aria-label="Remove session"
                  title="Remove session"
                  onClick={() => onDelete(session.id)}
                >
                  <Icon name="trash" size={16} />
                </button>
              </li>
            );
          })}
      </ul>
    ) : (
      <p className="empty-state">
        No sessions yet. Logged sessions for this class will appear here.
      </p>
    )}
  </section>
);
