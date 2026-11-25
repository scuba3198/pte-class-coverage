import { useState } from "react";
import { getModule, getQuestionTypeName } from "../coverage";
import { readPref, writePref } from "../prefs";
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

const OPEN_KEY = "pte-tracker-history-open";

interface SessionHistoryProps {
  className: string;
  sessions: Session[];
  onDelete: (sessionId: string) => void;
}

export const SessionHistory = ({ className, sessions, onDelete }: SessionHistoryProps) => {
  // Expanded unless the user collapsed it, and remembered across visits.
  const [open, setOpen] = useState(() => readPref(OPEN_KEY) !== "0");

  return (
    <section className="sidebar-section" aria-labelledby="history-title">
      <details
        className="collapsible"
        open={open}
        onToggle={(e) => {
          setOpen(e.currentTarget.open);
          writePref(OPEN_KEY, e.currentTarget.open ? "1" : "0");
        }}
      >
        <summary>
          <div className="section-head">
            <h2 id="history-title">
              Session history <span className="count-badge">{sessions.length}</span>
            </h2>
            <p className="section-desc">Everything logged for class {className}</p>
          </div>
          <Icon name="chevron" size={20} />
        </summary>
        {sessions.length ? (
          <ul className="session-list">
            {[...sessions]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((session) => {
                // Tags are identified by id: two question types can share a name.
                const tags = [...new Set(session.questionTypeIds)]
                  .flatMap((id) => {
                    const name = getQuestionTypeName(id);
                    return name ? [{ id, name }] : [];
                  })
                  .sort((a, b) => a.name.localeCompare(b.name));
                return (
                  <li key={session.id} className="session-item" data-module={session.moduleId}>
                    <span className="dot" aria-hidden="true" />
                    <div className="session-body">
                      <p className="session-meta">
                        <span className="session-date">{formatDate(session.date)}</span>
                        <span className="session-module">{getModule(session.moduleId).name}</span>
                      </p>
                      {tags.length ? (
                        <ul className="session-tags">
                          {tags.map(({ id, name }) => (
                            <li key={id} className="tag">
                              {name}
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
      </details>
    </section>
  );
};
