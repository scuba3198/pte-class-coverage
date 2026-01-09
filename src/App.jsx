import './App.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import kiecLogo from './assets/kiec-logo.png';
import {
  buildDefaultState,
  classDefaults,
  getCoverageEntriesForSkill,
  getCoverageQuestionTypeIdsForSkill,
  getAllQuestionTypes,
  getModuleById,
  getModuleIdByQuestionTypeId,
  getQuestionTypeById,
  modules,
  normalizeState,
  weightageChart,
} from './state';

const STORAGE_KEY = 'pte-tracker-state-v1';
const THEME_KEY = 'pte-tracker-theme';

const createSessionId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const defaultState = buildDefaultState();
const defaultClassId = classDefaults[0].id;
const defaultModuleId = modules[0].id;

const formatDate = (value) => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) {
    return value;
  }
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const downloadJson = (data, filename) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const sortByName = (items) => [...items].sort((a, b) => a.name.localeCompare(b.name));

const getInitialTheme = () => {
  try {
    const stored = window.localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
  } catch {
    // Ignore storage errors.
  }

  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light';
};

const readStoredState = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultState;
    }
    return normalizeState(JSON.parse(raw));
  } catch {
    return defaultState;
  }
};

const writeStoredState = (state) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota/storage errors and keep state in memory.
  }
};

function App() {
  const [state, setState] = useState(() => readStoredState());
  const [activeClassId, setActiveClassId] = useState(defaultClassId);
  const [activeModuleId, setActiveModuleId] = useState(defaultModuleId);
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [applyToCoverage, setApplyToCoverage] = useState(true);
  const [importError, setImportError] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [theme, setTheme] = useState(() => getInitialTheme());
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
    writeStoredState(state);
  }, [state]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Ignore storage errors.
    }
  }, [theme]);

  const updateState = (updater) => {
    setState((prevState) => normalizeState(updater(prevState)));
  };

  const activeClass = state.classes.find((classItem) => classItem.id === activeClassId) ||
    state.classes[0];
  const activeModule = getModuleById(activeModuleId);
  const coverageForClass = useMemo(
    () => state.coverage[activeClassId] || {},
    [state.coverage, activeClassId]
  );
  const sessionsForClass = useMemo(
    () => state.sessions[activeClassId] || [],
    [state.sessions, activeClassId]
  );

  const activeSkill = useMemo(() => {
    const skillMap = {
      speaking: 'speaking',
      writing: 'writing',
      reading: 'reading',
      listening: 'listening',
    };
    return skillMap[activeModuleId] || 'speaking';
  }, [activeModuleId]);

  const coverageEntries = useMemo(
    () => getCoverageEntriesForSkill(activeSkill, 72),
    [activeSkill]
  );
  const sortedCoverageEntries = useMemo(() => {
    return [...coverageEntries].sort(
      (a, b) => (b.scores[activeSkill] || 0) - (a.scores[activeSkill] || 0)
    );
  }, [coverageEntries, activeSkill]);
  const coverageQuestionTypeIds = useMemo(
    () => getCoverageQuestionTypeIdsForSkill(activeSkill, 72),
    [activeSkill]
  );
  const coverageMarksTotal = useMemo(
    () => coverageEntries.reduce((sum, entry) => sum + (entry.scores[activeSkill] || 0), 0),
    [coverageEntries, activeSkill]
  );

  const coverageCounts = useMemo(() => {
    const covered = coverageQuestionTypeIds.filter((id) => coverageForClass[id]).length;
    return { covered, total: coverageQuestionTypeIds.length };
  }, [coverageForClass, coverageQuestionTypeIds]);

  const moduleCoverageCounts = useMemo(() => {
    return coverageQuestionTypeIds.reduce(
      (acc, questionTypeId) => {
        if (coverageForClass[questionTypeId]) {
          acc.covered += 1;
        }
        acc.total += 1;
        return acc;
      },
      { covered: 0, total: 0 }
    );
  }, [coverageQuestionTypeIds, coverageForClass]);

  const sessionSelection = useMemo(() => {
    const existingSession = sessionsForClass.find(
      (entry) => entry.date === sessionDate && entry.moduleId === activeModuleId
    );
    return existingSession ? [...existingSession.questionTypeIds] : [];
  }, [activeModuleId, sessionDate, sessionsForClass]);

  const toggleCoverage = (questionTypeId) => {
    updateState((prevState) => {
      const nextState = normalizeState(prevState);
      nextState.coverage[activeClassId][questionTypeId] =
        !nextState.coverage[activeClassId][questionTypeId];
      return nextState;
    });
  };

  const toggleSessionItem = (questionTypeId) => {
    const nextSelection = sessionSelection.includes(questionTypeId)
      ? sessionSelection.filter((id) => id !== questionTypeId)
      : [...sessionSelection, questionTypeId];

    updateState((prevState) => {
      const nextState = normalizeState(prevState);
      const sessions = nextState.sessions[activeClassId];
      const existingIndex = sessions.findIndex(
        (entry) => entry.date === sessionDate && entry.moduleId === activeModuleId
      );

      if (!nextSelection.length) {
        if (existingIndex !== -1) {
          sessions.splice(existingIndex, 1);
        }
        return nextState;
      }

      const sessionId = existingIndex !== -1 ? sessions[existingIndex].id : createSessionId();
      const sessionEntry = {
        id: sessionId,
        date: sessionDate,
        moduleId: activeModuleId,
        questionTypeIds: [...nextSelection],
        note: '',
      };

      if (existingIndex !== -1) {
        sessions[existingIndex] = sessionEntry;
      } else {
        sessions.push(sessionEntry);
      }

      sessions.sort((a, b) => a.date.localeCompare(b.date));

      if (applyToCoverage) {
        nextSelection.forEach((selectedId) => {
          nextState.coverage[activeClassId][selectedId] = true;
        });
      }

      return nextState;
    });
  };

  const deleteSession = (sessionId) => {
    updateState((prevState) => {
      const nextState = normalizeState(prevState);
      nextState.sessions[activeClassId] = nextState.sessions[activeClassId].filter(
        (entry) => entry.id !== sessionId
      );
      return nextState;
    });
  };

  const resetClass = () => {
    if (!window.confirm(`Reset coverage and session log for ${activeClass.name}?`)) {
      return;
    }

    updateState((prevState) => {
      const nextState = normalizeState(prevState);
      Object.keys(nextState.coverage[activeClassId]).forEach((questionTypeId) => {
        nextState.coverage[activeClassId][questionTypeId] = false;
      });
      nextState.sessions[activeClassId] = [];
      return nextState;
    });
  };

  const addClass = () => {
    const name = newClassName.trim();
    if (!name) {
      return;
    }

    const defaultMatch = classDefaults.find((classItem) => classItem.name === name);
    const classId = defaultMatch && !stateRef.current.classes.some((item) => item.id === defaultMatch.id)
      ? defaultMatch.id
      : `class-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const questionTypeIds = getAllQuestionTypes().map((item) => item.id);

    updateState((prevState) => {
      const nextState = normalizeState(prevState);
      nextState.classes = [...nextState.classes, { id: classId, name }];
      const defaultOrder = classDefaults.map((classItem) => classItem.id);
      const defaultsInOrder = defaultOrder
        .map((id) => nextState.classes.find((classItem) => classItem.id === id))
        .filter(Boolean);
      const customClasses = nextState.classes.filter((classItem) => !defaultOrder.includes(classItem.id));
      nextState.classes = [...defaultsInOrder, ...customClasses];
      nextState.coverage[classId] = {};
      questionTypeIds.forEach((questionTypeId) => {
        nextState.coverage[classId][questionTypeId] = false;
      });
      nextState.sessions[classId] = [];
      return nextState;
    });

    setNewClassName('');
    setActiveClassId(classId);
  };

  const removeClass = (classId) => {
    const classesCount = stateRef.current.classes.length;
    if (classesCount <= 1) {
      window.alert('At least one class is required.');
      return;
    }
    if (!window.confirm('Remove this class and all saved coverage + sessions?')) {
      return;
    }

    let nextActiveId = activeClassId;
    updateState((prevState) => {
      const nextState = normalizeState(prevState);
      const remainingClasses = nextState.classes.filter((classItem) => classItem.id !== classId);
      if (!remainingClasses.length) {
        return nextState;
      }
      nextState.classes = remainingClasses;
      delete nextState.coverage[classId];
      delete nextState.sessions[classId];
      if (!remainingClasses.some((classItem) => classItem.id === activeClassId)) {
        nextActiveId = remainingClasses[0].id;
      }
      return nextState;
    });

    if (nextActiveId !== activeClassId) {
      setActiveClassId(nextActiveId);
    }
  };

  const exportData = () => {
    downloadJson(stateRef.current, `pte-tracker-${new Date().toISOString().slice(0, 10)}.json`);
  };

  const importData = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const normalized = normalizeState(parsed);
      setImportError('');
      updateState(() => normalized);
    } catch {
      setImportError('Invalid backup file. Please select a valid JSON export.');
    }
  };

  const sortedSessions = useMemo(() => {
    return [...sessionsForClass].sort((a, b) => b.date.localeCompare(a.date));
  }, [sessionsForClass]);

  const weightageTotals = useMemo(() => {
    return weightageChart.reduce(
      (acc, entry) => {
        acc.listening += entry.scores.listening || 0;
        acc.speaking += entry.scores.speaking || 0;
        acc.reading += entry.scores.reading || 0;
        acc.writing += entry.scores.writing || 0;
        acc.total += entry.total || 0;
        return acc;
      },
      { listening: 0, speaking: 0, reading: 0, writing: 0, total: 0 }
    );
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark">
            <img src={kiecLogo} alt="KIEC trademark logo" />
          </div>
          <div>
            <p className="brand-overline">
              KIEC PTE Tracker <span className="brand-signature">by Mumukshu D.C</span>
            </p>
            <h1>Class Coverage Studio</h1>
            <p className="brand-subtitle">
              Track PTE Academic question types by class, module, and session.
            </p>
          </div>
        </div>
        <div className="auth-panel">
          <div className="sync-pill sync-synced">
            <span className="sync-dot" />
            Saved locally
          </div>
          <div className="auth-signed-in">
            <div>
              <p className="auth-label">Storage</p>
              <p className="auth-value">Local browser storage</p>
            </div>
          </div>
          <div className="theme-toggle">
            <p className="auth-label">Theme</p>
            <button
              className="ghost-button"
              type="button"
              onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
            >
              {theme === 'light' ? 'Switch to dark' : 'Switch to light'}
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="class-bar">
          <div>
            <p className="section-label">Classes</p>
            <div className="class-list">
              {state.classes.map((classItem) => (
                <button
                  key={classItem.id}
                  className={classItem.id === activeClassId ? 'class-chip active' : 'class-chip'}
                  type="button"
                  onClick={() => setActiveClassId(classItem.id)}
                >
                  {classItem.name}
                </button>
              ))}
            </div>
          </div>
          <div className="class-actions">
            <button className="ghost-button" type="button" onClick={resetClass}>
              Reset class cycle
            </button>
          </div>
        </section>

        <section className="card class-editor">
          <h2>Manage classes</h2>
          <p>Add or remove classes. Data stays local in this browser.</p>
          <form
            className="class-editor-grid"
            onSubmit={(event) => {
              event.preventDefault();
              addClass();
            }}
          >
            <label>
              New class name
              <input
                type="text"
                value={newClassName}
                onChange={(event) => setNewClassName(event.target.value)}
                placeholder="e.g., 11-12"
              />
            </label>
            <button className="primary-button add-class-button" type="submit">
              Add class
            </button>
          </form>
          <div className="class-list class-list-editor">
            {state.classes.map((classItem) => (
              <div key={classItem.id} className="class-chip-manage">
                <button
                  className={classItem.id === activeClassId ? 'class-chip active' : 'class-chip'}
                  type="button"
                  onClick={() => setActiveClassId(classItem.id)}
                >
                  {classItem.name}
                </button>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => removeClass(classItem.id)}
                  disabled={state.classes.length <= 1}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="overview">
          <div className="card coverage-card">
            <div className="card-header">
              <div>
                <p className="section-label">Overall coverage</p>
                <h2>{activeClass.name}</h2>
                <p className="card-subtitle">
                  {coverageCounts.covered} of {coverageCounts.total} question types covered (72+ marks)
                </p>
                <p className="card-subtitle">{`Coverage total: ${coverageMarksTotal} / 90`}</p>
              </div>
              <div className="progress-ring">
                <span>{Math.round((coverageCounts.covered / coverageCounts.total) * 100) || 0}%</span>
              </div>
            </div>
            <div className="module-tabs">
              {modules.map((module) => (
                <button
                  key={module.id}
                  className={module.id === activeModuleId ? 'module-tab active' : 'module-tab'}
                  type="button"
                  onClick={() => setActiveModuleId(module.id)}
                >
                  {module.name}
                </button>
              ))}
            </div>
            <div className="coverage-summary">
              <p>
                {activeModule.name}: {moduleCoverageCounts.covered} of {moduleCoverageCounts.total}{' '}
                covered
              </p>
            </div>
            <div className="question-grid">
              {sortedCoverageEntries.map((entry) => {
                const originModuleId =
                  entry.originModuleId || getModuleIdByQuestionTypeId(entry.questionTypeId);
                const moduleInitials = {
                  speaking: 'S',
                  writing: 'W',
                  reading: 'R',
                  listening: 'L',
                };
                const originSuffix =
                  originModuleId && originModuleId !== activeModuleId
                    ? ` (${moduleInitials[originModuleId] || '?'})`
                    : '';
                const isCovered = coverageForClass[entry.questionTypeId];

                return (
                  <button
                    key={`${entry.questionTypeId}-${activeModuleId}`}
                    className={isCovered ? 'question-card covered' : 'question-card'}
                    type="button"
                    onClick={() => toggleCoverage(entry.questionTypeId)}
                  >
                    <span className="question-name">{`${entry.question}${originSuffix}`}</span>
                    <span className="question-status">{isCovered ? 'Covered' : 'Not yet'}</span>
                    <span className="question-status">{`${entry.scores[activeSkill]} marks`}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card session-card">
            <div className="card-header">
              <div>
                <p className="section-label">Session log</p>
                <h2>Auto-saved session</h2>
                <p className="card-subtitle">Selections update your session instantly.</p>
              </div>
            </div>
            <div className="session-controls">
              <label>
                Date
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(event) => setSessionDate(event.target.value)}
                />
              </label>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={applyToCoverage}
                  onChange={(event) => setApplyToCoverage(event.target.checked)}
                />
                Also mark as covered
              </label>
            </div>
            <div className="question-grid compact">
              {sortedCoverageEntries.map((entry) => {
                const originModuleId =
                  entry.originModuleId || getModuleIdByQuestionTypeId(entry.questionTypeId);
                const moduleInitials = {
                  speaking: 'S',
                  writing: 'W',
                  reading: 'R',
                  listening: 'L',
                };
                const originSuffix =
                  originModuleId && originModuleId !== activeModuleId
                    ? ` (${moduleInitials[originModuleId] || '?'})`
                    : '';
                const isSelected = sessionSelection.includes(entry.questionTypeId);

                return (
                  <button
                    key={`${entry.questionTypeId}-${activeModuleId}-session`}
                    className={isSelected ? 'question-card selected' : 'question-card'}
                    type="button"
                    onClick={() => toggleSessionItem(entry.questionTypeId)}
                  >
                    <span className="question-name">{`${entry.question}${originSuffix}`}</span>
                    <span className="question-status">{isSelected ? 'Included' : 'Tap to add'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card log-card">
            <div className="card-header">
              <div>
                <p className="section-label">Session history</p>
                <h2>{activeClass.name}</h2>
                <p className="card-subtitle">
                  {sessionsForClass.length} sessions recorded
                </p>
              </div>
            </div>
            {sortedSessions.length ? (
              <div className="session-list">
                {sortedSessions.map((entry) => {
                  const module = getModuleById(entry.moduleId);
                  const questionNames = sortByName(
                    entry.questionTypeIds
                      .map((id) => getQuestionTypeById(id))
                      .filter(Boolean)
                  ).map((item) => item.name);

                  return (
                    <div key={entry.id} className="session-item">
                      <div>
                        <p className="session-date">{formatDate(entry.date)}</p>
                        <p className="session-module">{module.name}</p>
                        <p className="session-questions">
                          {questionNames.length ? questionNames.join(', ') : 'No items recorded'}
                        </p>
                      </div>
                      <button
                        className="ghost-button"
                        type="button"
                        onClick={() => deleteSession(entry.id)}
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

          <div className="card backup-card">
            <div className="card-header">
              <div>
                <p className="section-label">Backup</p>
                <h2>Export or restore</h2>
                <p className="card-subtitle">
                  Download a JSON backup or import one to restore.
                </p>
              </div>
            </div>
            <div className="backup-actions">
              <button className="primary-button" type="button" onClick={exportData}>
                Export data
              </button>
              <label className="ghost-button file-button">
                Import backup
                <input type="file" accept="application/json" onChange={importData} />
              </label>
            </div>
            {importError ? <p className="auth-message error">{importError}</p> : null}
            <p className="backup-note">
              Data is stored locally in this browser. Export a backup if you plan to clear browser
              storage.
            </p>
          </div>

          <div className="card help-card">
            <div className="card-header">
              <div>
                <p className="section-label">Help</p>
                <h2>How to use this tracker</h2>
                <p className="card-subtitle">A quick guide for students and teachers.</p>
              </div>
              <button
                className="ghost-button"
                type="button"
                onClick={() => setShowHelp((prev) => !prev)}
              >
                {showHelp ? 'Hide' : 'Show'}
              </button>
            </div>
            {showHelp ? (
              <div className="help-list">
                <p>
                  1. Choose your class, then pick a module tab (Speaking, Writing, Reading, Listening).
                </p>
                <p>
                  2. The coverage grid shows only the top tasks that reach 72+ marks for that module.
                </p>
                <p>
                  3. Tap a pill to mark it Covered. Each pill shows the marks it adds for that module.
                </p>
                <p>
                  4. Use the session log to record what you practiced today. It auto-saves as you tap.
                </p>
                <p>
                  5. Cross-module tasks show a badge like (S/W/R/L) to show the original section.
                </p>
                <p>
                  6. Use Manage Classes to add or remove classes as your schedule changes.
                </p>
                <p>
                  7. Export a backup regularly if you might clear browser data or switch devices.
                </p>
              </div>
            ) : null}
          </div>

          <div className="card weightage-card">
            <div className="card-header">
              <div>
                <p className="section-label">Score weightage</p>
                <h2>Marks by question type</h2>
                <p className="card-subtitle">
                  Based on the New Score Weightage Chart (PTE Academic / UKVI).
                </p>
              </div>
            </div>
          <div className="weightage-table-wrap">
            <table className="weightage-table">
              <thead>
                <tr>
                  <th>Module</th>
                  <th>Weightage-wise Sequence of Questions</th>
                    <th>Avg Qs</th>
                    <th>Listening</th>
                    <th>Speaking</th>
                    <th>Reading</th>
                    <th>Writing</th>
                    <th>Total Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {weightageChart.map((entry) => (
                    <tr
                      key={`${entry.question}-${entry.module}`}
                      className={`weightage-row weightage-${entry.module.toLowerCase()}`}
                    >
                      <td className="weightage-module-cell">{entry.module}</td>
                      <td className="weightage-question-cell">{entry.question}</td>
                      <td className="weightage-avg">{entry.avgQs}</td>
                      <td>{entry.scores.listening ? entry.scores.listening.toFixed(2) : ''}</td>
                      <td>{entry.scores.speaking ? entry.scores.speaking.toFixed(2) : ''}</td>
                      <td>{entry.scores.reading ? entry.scores.reading.toFixed(2) : ''}</td>
                      <td>{entry.scores.writing ? entry.scores.writing.toFixed(2) : ''}</td>
                      <td className="weightage-total">{entry.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="weightage-foot">
                    <td colSpan="3" />
                    <td>{weightageTotals.listening.toFixed(2)}</td>
                    <td>{weightageTotals.speaking.toFixed(2)}</td>
                    <td>{weightageTotals.reading.toFixed(2)}</td>
                    <td>{weightageTotals.writing.toFixed(2)}</td>
                    <td className="weightage-total">{weightageTotals.total.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="weightage-cards">
              {weightageChart.map((entry) => (
                <div
                  key={`${entry.question}-${entry.module}-card`}
                  className={`weightage-entry-card weightage-${entry.module.toLowerCase()}`}
                >
                  <div className="weightage-card-header">
                    <span className="weightage-card-module">{entry.module}</span>
                    <span className="weightage-card-question">{entry.question}</span>
                  </div>
                  <div className="weightage-card-grid">
                    <div>
                      <span className="weightage-card-label">Avg Qs</span>
                      <span className="weightage-card-value">{entry.avgQs}</span>
                    </div>
                    <div>
                      <span className="weightage-card-label">Listening</span>
                      <span className="weightage-card-value">
                        {entry.scores.listening ? entry.scores.listening.toFixed(2) : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="weightage-card-label">Speaking</span>
                      <span className="weightage-card-value">
                        {entry.scores.speaking ? entry.scores.speaking.toFixed(2) : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="weightage-card-label">Reading</span>
                      <span className="weightage-card-value">
                        {entry.scores.reading ? entry.scores.reading.toFixed(2) : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="weightage-card-label">Writing</span>
                      <span className="weightage-card-value">
                        {entry.scores.writing ? entry.scores.writing.toFixed(2) : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="weightage-card-label">Total</span>
                      <span className="weightage-card-value">{entry.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
              <div className="weightage-entry-card weightage-total-card">
                <div className="weightage-card-header">
                  <span className="weightage-card-module">Totals</span>
                  <span className="weightage-card-question">All modules</span>
                </div>
                <div className="weightage-card-grid">
                  <div>
                    <span className="weightage-card-label">Listening</span>
                    <span className="weightage-card-value">{weightageTotals.listening.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="weightage-card-label">Speaking</span>
                    <span className="weightage-card-value">{weightageTotals.speaking.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="weightage-card-label">Reading</span>
                    <span className="weightage-card-value">{weightageTotals.reading.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="weightage-card-label">Writing</span>
                    <span className="weightage-card-value">{weightageTotals.writing.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="weightage-card-label">Total</span>
                    <span className="weightage-card-value">{weightageTotals.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
            <p className="backup-note">
              Source: New Score Weightage Chart in the AlfaPTE guide (Aug 7, 2025 update).
            </p>
          </div>
        </section>
      </main>

      <footer>
        <p>
          Question types sourced from Pearson PTE Academic test format pages. Keep an eye on updates
          from Pearson for any changes.
        </p>
        <p>Independent project (personal use). Not an official institute product.</p>
      </footer>
    </div>
  );
}

export default App;
