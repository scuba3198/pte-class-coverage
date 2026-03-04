import React, { useState } from "react";
import { useApp } from "./hooks/useApp";
import { ClassBar } from "./components/ClassBar";
import { CoverageCard } from "./components/CoverageCard";
import { SessionCard } from "./components/SessionCard";
import { SessionHistory } from "./components/SessionHistory";
import { ClassEditor } from "./components/ClassEditor";
import { BackupCard } from "./components/BackupCard";
import { HelpCard } from "./components/HelpCard";
import { WeightageTable } from "./components/WeightageTable";
import { ConfirmationModal } from "./components/ConfirmationModal";
import { Login } from "./components/Login";
import viteLogo from "../assets/vite.svg";
import "./styles/App.css";

const App: React.FC = () => {
  const {
    state,
    isLoading,
    user,
    isGuestMode,
    activeClass,
    activeModule,
    activeSkill,
    sessionDate,
    applyToCoverage,
    modules,
    coverageForClass,
    coverageEntries,
    currentSessions,
    activeSessionSelection,
    coverageCounts,
    moduleCoverageCounts,
    coverageMarksTotal,
    handlers,
    theme,
  } = useApp();

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDestructive: boolean;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => { },
    isDestructive: false,
  });

  const closeModal = () => setConfirmModal((prev) => ({ ...prev, isOpen: false }));

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    isDestructive = false,
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        closeModal();
      },
      isDestructive,
    });
  };

  if (isLoading) {
    return (
      <div className="loading-screen">
        <p>Loading PTE Tracker...</p>
      </div>
    );
  }

  // Show login only if not signed in AND not in guest mode
  if (!user && !isGuestMode) {
    return (
      <Login
        onLoginSuccess={handlers.refreshState}
        onContinueAsGuest={() => handlers.setGuestMode(true)}
      />
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div className="brand">
            <div className="brand-mark">
              <img src={viteLogo} alt="PTE" />
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
              <button className="logout-button" onClick={handlers.logout}>
                Sign Out
              </button>
            </div>
          ) : (
            <div className="auth-guest">
              <div className="auth-info">
                <p className="auth-label">Mode</p>
                <p className="auth-value">Guest (Local Only)</p>
              </div>
              <button className="login-link-button" onClick={() => handlers.setGuestMode(false)}>
                Sign In
              </button>
            </div>
          )}
          <div className="theme-toggle">
            <button
              className="theme-toggle-button"
              onClick={handlers.toggleTheme}
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
          activeClassId={activeClass.id}
          onSelectClass={handlers.setActiveClassId}
          onResetClass={() =>
            showConfirm(
              "Reset Class Data",
              "Are you sure you want to reset all coverage and session data for this class? This cannot be undone.",
              () => handlers.manageClass({ type: "RESET_CLASS", classId: activeClass.id }),
              true,
            )
          }
        />

        <div className="main-grid">
          <div className="primary-column">
            <ClassEditor
              classes={state.classes}
              activeClassId={activeClass.id}
              onAddClass={(name) => handlers.manageClass({ type: "ADD_CLASS", name })}
              onRemoveClass={(id) =>
                showConfirm(
                  "Remove Class",
                  "Are you sure you want to remove this class? All associated coverage and sessions will be permanently deleted.",
                  () => handlers.manageClass({ type: "REMOVE_CLASS", classId: id }),
                  true,
                )
              }
              onSelectClass={handlers.setActiveClassId}
            />

            <CoverageCard
              activeClassName={activeClass.name}
              activeModule={activeModule}
              activeSkill={activeSkill}
              modules={modules}
              coverageForClass={coverageForClass}
              coverageEntries={coverageEntries}
              coverageMarksTotal={coverageMarksTotal}
              coverageCounts={coverageCounts}
              moduleCoverageCounts={moduleCoverageCounts}
              onSelectModule={handlers.setActiveModuleId}
              onToggleCoverage={handlers.toggleCoverage}
            />

            <SessionCard
              activeModule={activeModule}
              modules={modules}
              sessionDate={sessionDate}
              applyToCoverage={applyToCoverage}
              sessionSelection={activeSessionSelection}
              coverageEntries={coverageEntries}
              onSelectModule={handlers.setActiveModuleId}
              onSetDate={handlers.setSessionDate}
              onSetApplyToCoverage={handlers.setApplyToCoverage}
              onToggleItem={(questionTypeId) =>
                handlers.manageSession({
                  type: "TOGGLE_ITEM",
                  classId: activeClass.id,
                  date: sessionDate,
                  moduleId: activeModule.id,
                  questionTypeId,
                  applyToCoverage,
                })
              }
            />
          </div>

          <div className="secondary-column">
            <SessionHistory
              activeClassName={activeClass.name}
              sessions={currentSessions}
              onDeleteSession={(sessionId) =>
                handlers.manageSession({
                  type: "DELETE_SESSION",
                  classId: activeClass.id,
                  sessionId,
                })
              }
            />

            <BackupCard
              onExport={() => handlers.exportData(`${activeClass.name}-pte-backup.json`)}
              onImport={handlers.importData}
            />

            <HelpCard />
          </div>
        </div>

        <WeightageTable />
      </main>

      <footer className="app-footer">
        <p>© {new Date().getFullYear()} PTE Academic Score Weightage Tracker</p>
      </footer>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeModal}
        isDestructive={confirmModal.isDestructive}
        confirmLabel="Proceed"
      />
    </div>
  );
};

export default App;
