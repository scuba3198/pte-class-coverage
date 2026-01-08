import './App.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  buildDefaultState,
  classDefaults,
  getCoverageEntriesForSkill,
  getCoverageQuestionTypeIdsForSkill,
  getModuleById,
  getModuleIdByQuestionTypeId,
  getQuestionTypeById,
  modules,
  normalizeState,
  weightageChart,
} from './state';

const STORAGE_KEY = 'pte-tracker-state-v1';

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

const readStoredState = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultState;
    }
    return normalizeState(JSON.parse(raw));
  } catch (error) {
    return defaultState;
  }
};

const writeStoredState = (state) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    // Ignore quota/storage errors and keep state in memory.
  }
};

function App() {
  const [state, setState] = useState(() => readStoredState());
  const [activeClassId, setActiveClassId] = useState(defaultClassId);
  const [activeModuleId, setActiveModuleId] = useState(defaultModuleId);
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [sessionSelection, setSessionSelection] = useState([]);
  const [applyToCoverage, setApplyToCoverage] = useState(true);
  const [showClassEditor, setShowClassEditor] = useState(false);
  const [importError, setImportError] = useState('');
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
    writeStoredState(state);
  }, [state]);

  const updateState = (updater) => {
    setState((prevState) => normalizeState(updater(prevState)));
  };

  const activeClass = state.classes.find((classItem) => classItem.id === activeClassId) ||
    state.classes[0];
  const activeModule = getModuleById(activeModuleId);
  const coverageForClass = state.coverage[activeClassId] || {};
  const sessionsForClass = state.sessions[activeClassId] || [];

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

  useEffect(() => {
    setSessionSelection([]);
  }, [activeClassId, activeModuleId]);

  const toggleCoverage = (questionTypeId) => {
    updateState((prevState) => {
      const nextState = normalizeState(prevState);
      nextState.coverage[activeClassId][questionTypeId] =
        !nextState.coverage[activeClassId][questionTypeId];
      return nextState;
    });
  };

  const toggleSessionItem = (questionTypeId) => {
    setSessionSelection((prev) =>
      prev.includes(questionTypeId)
        ? prev.filter((id) => id !== questionTypeId)
        : [...prev, questionTypeId]
    );
  };

  const saveSession = () => {
    if (!sessionSelection.length) {
      return;
    }

    updateState((prevState) => {
      const nextState = normalizeState(prevState);
      const sessionEntry = {
        id: createSessionId(),
        date: sessionDate,
        moduleId: activeModuleId,
        questionTypeIds: [...sessionSelection],
        note: '',
      };

      nextState.sessions[activeClassId] = [
        ...nextState.sessions[activeClassId],
        sessionEntry,
      ].sort((a, b) => a.date.localeCompare(b.date));

      if (applyToCoverage) {
        sessionSelection.forEach((questionTypeId) => {
          nextState.coverage[activeClassId][questionTypeId] = true;
        });
      }

      return nextState;
    });

    setSessionSelection([]);
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

  const updateClassName = (classId, name) => {
    updateState((prevState) => {
      const nextState = normalizeState(prevState);
      nextState.classes = nextState.classes.map((classItem) =>
        classItem.id === classId ? { ...classItem, name } : classItem
      );
      return nextState;
    });
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
    } catch (error) {
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
          <div className="brand-mark">K</div>
          <div>
            <p className="brand-overline">KIEC PTE Tracker</p>
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
            <button
              className="ghost-button"
              type="button"
              onClick={() => setShowClassEditor((prev) => !prev)}
            >
              {showClassEditor ? 'Hide class names' : 'Edit class names'}
            </button>
          </div>
        </section>

        {showClassEditor ? (
          <section className="card class-editor">
            <h2>Class names</h2>
            <p>Rename classes any time. Names are saved locally in this browser.</p>
            <div className="class-editor-grid">
              {state.classes.map((classItem) => (
                <label key={classItem.id}>
                  {classItem.name}
                  <input
                    type="text"
                    value={classItem.name}
                    onChange={(event) => updateClassName(classItem.id, event.target.value)}
                  />
                </label>
              ))}
            </div>
          </section>
        ) : null}

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
              {coverageEntries.map((entry) => {
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
                <h2>Add a session</h2>
                <p className="card-subtitle">Record what you covered today.</p>
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
              {coverageEntries.map((entry) => {
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
            <button className="primary-button" type="button" onClick={saveSession}>
              Save session
            </button>
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
      </footer>
    </div>
  );
}

export default App;
