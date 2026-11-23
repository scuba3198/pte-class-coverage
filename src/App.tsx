import { useState } from "react";
import { BackupCard } from "./components/BackupCard";
import { ClassBar } from "./components/ClassBar";
import { ClassEditor } from "./components/ClassEditor";
import { ConfirmationModal } from "./components/ConfirmationModal";
import { CoverageCard } from "./components/CoverageCard";
import { HelpCard } from "./components/HelpCard";
import { Login } from "./components/Login";
import { SessionCard } from "./components/SessionCard";
import { SessionHistory } from "./components/SessionHistory";
import { WeightageTable } from "./components/WeightageTable";
import {
  addClass,
  deleteSession,
  mergeBackup,
  removeClass,
  resetClass,
  toggleCoverage,
  toggleSessionItem,
  today,
} from "./state";
import type { ModuleId } from "./types";
import { useTracker } from "./useTracker";
import "./styles/App.css";

interface Confirmation {
  title: string;
  message: string;
  onConfirm: () => void;
}

const App = () => {
  const { state, update, loading, user, isGuest, setIsGuest, theme, toggleTheme, logout } =
    useTracker();

  const [classId, setClassId] = useState("");
  const [moduleId, setModuleId] = useState<ModuleId>("speaking");
  const [sessionDate, setSessionDate] = useState(today);
  const [alsoCover, setAlsoCover] = useState(true);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  if (loading) {
    return (
      <div className="loading-screen">
        <p>Loading PTE Tracker...</p>
      </div>
    );
  }

  if (!user && !isGuest) {
    return <Login onContinueAsGuest={() => setIsGuest(true)} />;
  }

  // Falls back to the first class when none is picked yet or the picked one was removed.
  const activeClass = state.classes.find((c) => c.id === classId) ?? state.classes[0]!;
  const sessions = state.sessions[activeClass.id] ?? [];
  const selected =
    sessions.find((s) => s.date === sessionDate && s.moduleId === moduleId)?.questionTypeIds ?? [];

  const confirm = (title: string, message: string, onConfirm: () => void) =>
    setConfirmation({
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmation(null);
      },
    });

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div className="brand">
            <div className="brand-mark">
              <img src={`${import.meta.env.BASE_URL}vite.svg`} alt="PTE" />
            </div>
            <div className="brand-text">
              <h1>
                PTE Class Coverage
                <span className="brand-signature">by Mumukshu D.C</span>
              </h1>
              <p className="brand-overline">Academic Score Tracker</p>
            </div>
          </div>
        </div>

        <div className="auth-panel">
          {user ? (
            <div className="auth-signed-in">
              <div className="auth-info">
                <p className="auth-label">Teacher</p>
                <p className="auth-value">{user.email}</p>
              </div>
              <button className="logout-button" onClick={logout}>
                Sign Out
              </button>
            </div>
          ) : (
            <div className="auth-guest">
              <div className="auth-info">
                <p className="auth-label">Mode</p>
                <p className="auth-value">Guest (Local Only)</p>
              </div>
              <button className="login-link-button" onClick={() => setIsGuest(false)}>
                Sign In
              </button>
            </div>
          )}
          <div className="theme-toggle">
            <button
              className="theme-toggle-button"
              onClick={toggleTheme}
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? "🌙" : "☀️"}
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">
        <ClassBar
          classes={state.classes}
          activeId={activeClass.id}
          onSelect={setClassId}
          onReset={() =>
            confirm(
              "Reset Class Data",
              "Are you sure you want to reset all coverage and session data for this class? This cannot be undone.",
              () => update((s) => resetClass(s, activeClass.id)),
            )
          }
        />

        <div className="main-grid">
          <div className="primary-column">
            <ClassEditor
              classes={state.classes}
              activeId={activeClass.id}
              onAdd={(name) => update((s) => addClass(s, name))}
              onRemove={(id) =>
                confirm(
                  "Remove Class",
                  "Are you sure you want to remove this class? All associated coverage and sessions will be permanently deleted.",
                  () => update((s) => removeClass(s, id)),
                )
              }
              onSelect={setClassId}
            />

            <CoverageCard
              className={activeClass.name}
              moduleId={moduleId}
              covered={state.coverage[activeClass.id] ?? {}}
              onSelectModule={setModuleId}
              onToggle={(typeId) => update((s) => toggleCoverage(s, activeClass.id, typeId))}
            />

            <SessionCard
              moduleId={moduleId}
              date={sessionDate}
              alsoCover={alsoCover}
              selected={selected}
              onSelectModule={setModuleId}
              onSetDate={setSessionDate}
              onSetAlsoCover={setAlsoCover}
              onToggle={(typeId) =>
                update((s) =>
                  toggleSessionItem(s, activeClass.id, sessionDate, moduleId, typeId, alsoCover),
                )
              }
            />
          </div>

          <div className="secondary-column">
            <SessionHistory
              className={activeClass.name}
              sessions={sessions}
              onDelete={(sessionId) => update((s) => deleteSession(s, activeClass.id, sessionId))}
            />

            <BackupCard
              state={state}
              filename={`${activeClass.name.replace(/[^\w.-]+/g, "_")}-pte-backup.json`}
              onImport={(backup) => update((s) => mergeBackup(s, backup))}
            />

            <HelpCard />
          </div>
        </div>

        <WeightageTable />
      </main>

      <footer className="app-footer">
        <p>© {new Date().getFullYear()} PTE Academic Score Weightage Tracker</p>
      </footer>

      {confirmation && (
        <ConfirmationModal
          title={confirmation.title}
          message={confirmation.message}
          onConfirm={confirmation.onConfirm}
          onCancel={() => setConfirmation(null)}
        />
      )}
    </div>
  );
};

export default App;
