import { useContext, useEffect, useMemo, useState } from "react";
import { AppContext } from "../context/AppContext";
import { modules } from "../../domain/data/modules";
import {
  getCoverageEntriesForSkill,
  getCoverageQuestionTypeIdsForSkill,
  getModuleById,
} from "../../domain/logic/coverage";
import { toLocalDateString } from "../../domain/logic/date";
import {
  createClassId,
  createModuleId,
  type ClassId,
  type ModuleId,
  type QuestionTypeId,
  type SkillKey,
} from "../../domain/types";

/**
 * Custom hook to consume the AppContext and provide UI-specific state and actions.
 */
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }

  const { state, actions, isLoading, user, isGuestMode, theme } = context;

  // UI-only state (doesn't need persistence in AppState)
  const [activeClassId, setActiveClassId] = useState<ClassId>(createClassId(""));
  const [activeModuleId, setActiveModuleId] = useState<ModuleId>(createModuleId("speaking"));
  const [sessionDate, setSessionDate] = useState(toLocalDateString());
  const [applyToCoverage, setApplyToCoverage] = useState(true);

  // Set initial activeClassId once state is loaded
  useEffect(() => {
    const firstClass = state.classes[0];
    if (!activeClassId && firstClass) {
      setActiveClassId(firstClass.id);
    }
  }, [state.classes, activeClassId]);

  // Derived state
  const activeClass = useMemo(() => {
    return (
      state.classes.find((c) => c.id === activeClassId) ||
      state.classes[0] || { id: createClassId(""), name: "No Class" }
    );
  }, [state.classes, activeClassId]);

  // Sync activeClassId if the current class is removed
  useEffect(() => {
    if (activeClass && activeClass.id !== activeClassId && activeClass.id !== "") {
      setActiveClassId(activeClass.id);
    }
  }, [activeClass, activeClassId]);

  const activeModule = useMemo(() => getModuleById(activeModuleId), [activeModuleId]);

  const activeSkill = useMemo((): SkillKey => {
    if (activeModuleId === "speaking") return "speaking";
    if (activeModuleId === "writing") return "writing";
    if (activeModuleId === "reading") return "reading";
    return "listening";
  }, [activeModuleId]);

  const coverageEntries = useMemo(() => getCoverageEntriesForSkill(activeSkill), [activeSkill]);

  const coverageQuestionTypeIds = useMemo(
    () => getCoverageQuestionTypeIdsForSkill(activeSkill),
    [activeSkill],
  );

  const coverageForClass = useMemo(
    () => (activeClass && activeClass.id ? state.coverage[activeClass.id] || {} : {}),
    [state.coverage, activeClass],
  );

  const currentSessions = useMemo(
    () => (activeClass && activeClass.id ? state.sessions[activeClass.id] || [] : []),
    [state.sessions, activeClass],
  );

  const activeSessionSelection = useMemo(() => {
    const session = currentSessions.find(
      (s) => s.date === sessionDate && s.moduleId === activeModuleId,
    );
    return session?.questionTypeIds || [];
  }, [currentSessions, sessionDate, activeModuleId]);

  // Derived counts
  const coverageCounts = useMemo(() => {
    const covered = coverageQuestionTypeIds.filter((id) => coverageForClass[id]).length;
    return { covered, total: coverageQuestionTypeIds.length };
  }, [coverageQuestionTypeIds, coverageForClass]);

  const moduleQuestionTypeIds = useMemo(
    () => activeModule.questionTypes.map((q) => q.id),
    [activeModule],
  );

  const moduleCoverageCounts = useMemo(() => {
    const covered = moduleQuestionTypeIds.filter((id) => coverageForClass[id]).length;
    return { covered, total: moduleQuestionTypeIds.length };
  }, [moduleQuestionTypeIds, coverageForClass]);

  const coverageMarksTotal = useMemo(() => {
    return coverageEntries.reduce((sum, entry) => {
      const qid = entry.questionTypeId;
      if (qid && coverageForClass[qid]) {
        return sum + (entry.scores[activeSkill] || 0);
      }
      return sum;
    }, 0);
  }, [coverageEntries, coverageForClass, activeSkill]);

  return {
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
    handlers: {
      setActiveClassId,
      setActiveModuleId,
      setSessionDate,
      setApplyToCoverage,
      toggleCoverage: (questionTypeId: QuestionTypeId) =>
        activeClass && activeClass.id && actions.toggleCoverage(activeClass.id, questionTypeId),
      manageSession: actions.manageSession,
      manageClass: actions.manageClass,
      exportData: actions.exportData,
      importData: actions.importData,
      toggleTheme: actions.toggleTheme,
      refreshState: actions.refreshState,
      logout: actions.logout,
      setGuestMode: actions.setGuestMode,
    },
    theme,
  };
};
