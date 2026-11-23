import { useState } from "react";
import { BackupCard } from "./components/BackupCard";
import { ClassBar } from "./components/ClassBar";
import { ConfirmationModal } from "./components/ConfirmationModal";
import { CoverageCard } from "./components/CoverageCard";
import { HelpCard } from "./components/HelpCard";
import { Icon, Logomark } from "./components/Icon";
import { Login } from "./components/Login";
import { ModuleTabs } from "./components/ModuleTabs";
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
  confirmLabel: string;
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
        <Logomark size={40} />
        <p>Loading PTE Tracker...</p>
      </div>
    );
  }

  if (!user && !isGuest) {
    return <Login onContinueAsGuest={() => setIsGuest(true)} />;
  }

  // Falls back to the first class when none is picked yet or the picked one was removed.
  const activeClass = state.classes.find((c) => c.id === classId) ?? state.classes[0]!;
  const covered = state.coverage[activeClass.id] ?? {};
  const sessions = state.sessions[activeClass.id] ?? [];
  const selected =
    sessions.find((s) => s.date === sessionDate && s.moduleId === moduleId)?.questionTypeIds ?? [];

  const confirm = (confirmation: Confirmation) =>
    setConfirmation({
      ...confirmation,
      onConfirm: () => {
        confirmation.onConfirm();
        setConfirmation(null);
      },
    });

  const nextTheme = theme === "light" ? "dark" : "light";

  return (
    <div className="app">
      <header className="app-header">
        <div className="container header-inner">
          <div className="brand">
            <Logomark size={34} />
            <div>
              <h1 className="brand-name">PTE Class Coverage</h1>
              <p className="brand-subtitle">Academic score tracker</p>
            </div>
          </div>
          <div className="header-actions">
            <div className="account-pill">
              {user ? (
                <>
                  <span className="account-name" title={user.email}>
                    {user.email}
                  </span>
                  <button className="link-button" type="button" onClick={logout}>
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <span className="account-name">Guest</span>
                  <button className="link-button" type="button" onClick={() => setIsGuest(false)}>
                    Sign in
                  </button>
                </>
              )}
            </div>
            <button
              className="icon-button"
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${nextTheme} mode`}
              title={`Switch to ${nextTheme} mode`}
            >
              <Icon name={theme === "light" ? "moon" : "sun"} />
            </button>
          </div>
        </div>
      </header>

      <main className="container main">
        <ClassBar
          classes={state.classes}
          activeId={activeClass.id}
          onSelect={setClassId}
          onAdd={(name) => update((s) => addClass(s, name))}
          onReset={() =>
            confirm({
              title: `Reset class ${activeClass.name}?`,
              message:
                "This clears all coverage and session data for this class. This cannot be undone.",
              confirmLabel: "Reset class",
              onConfirm: () => update((s) => resetClass(s, activeClass.id)),
            })
          }
          onRemove={() =>
            confirm({
              title: `Remove class ${activeClass.name}?`,
              message:
                "All coverage and sessions for this class will be permanently deleted. This cannot be undone.",
              confirmLabel: "Remove class",
              onConfirm: () => update((s) => removeClass(s, activeClass.id)),
            })
          }
        />

        <ModuleTabs active={moduleId} covered={covered} onSelect={setModuleId} />

        <div className="workspace">
          <CoverageCard
            className={activeClass.name}
            moduleId={moduleId}
            covered={covered}
            onToggle={(typeId) => update((s) => toggleCoverage(s, activeClass.id, typeId))}
          />

          <div className="sidebar">
            <SessionCard
              moduleId={moduleId}
              date={sessionDate}
              alsoCover={alsoCover}
              selected={selected}
              onSetDate={setSessionDate}
              onSetAlsoCover={setAlsoCover}
              onToggle={(typeId) =>
                update((s) =>
                  toggleSessionItem(s, activeClass.id, sessionDate, moduleId, typeId, alsoCover),
                )
              }
            />
            <SessionHistory
              className={activeClass.name}
              sessions={sessions}
              onDelete={(sessionId) => update((s) => deleteSession(s, activeClass.id, sessionId))}
            />
          </div>
        </div>

        <section className="reference" aria-labelledby="reference-title">
          <header className="section-head">
            <h2 id="reference-title">Reference</h2>
            <p className="section-desc">Backups, a quick guide and the full score chart</p>
          </header>
          <div className="accordion">
            <BackupCard
              state={state}
              filename={`${activeClass.name.replace(/[^\w.-]+/g, "_")}-pte-backup.json`}
              onImport={(backup) => update((s) => mergeBackup(s, backup))}
            />
            <HelpCard />
            <WeightageTable />
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <div className="container footer-inner">
          <div className="footer-brand">
            <Logomark size={28} />
            <div>
              <p className="footer-name">PTE Class Coverage</p>
              <p className="footer-tagline">Academic score tracker</p>
            </div>
          </div>
          <p className="footer-credit">
            Designed and built by <strong>Mumukshu D.C</strong>
          </p>
          <p className="footer-copy">© {new Date().getFullYear()} PTE Class Coverage</p>
        </div>
      </footer>

      {confirmation && (
        <ConfirmationModal
          title={confirmation.title}
          message={confirmation.message}
          confirmLabel={confirmation.confirmLabel}
          onConfirm={confirmation.onConfirm}
          onCancel={() => setConfirmation(null)}
        />
      )}
    </div>
  );
};

export default App;
