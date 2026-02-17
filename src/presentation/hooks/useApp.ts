import { useContext, useMemo, useState } from "react";
import { AppContext } from "../context/AppContext";
import { modules } from "../../domain/data/modules";
import {
  getCoverageEntriesForSkill,
  getCoverageQuestionTypeIdsForSkill,
  getModuleById,
} from "../../domain/logic/coverage";
import type { SkillKey } from "../../domain/types";

/**
 * Custom hook to consume the AppContext and provide UI-specific state and actions.
 */
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }

  const { state, actions, isLoading, theme } = context;

  // UI-only state (doesn't need persistence in AppState)
  const [activeClassId, setActiveClassId] = useState(state.classes[0]?.id || "");
  const [activeModuleId, setActiveModuleId] = useState("speaking");
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().slice(0, 10));
  const [applyToCoverage, setApplyToCoverage] = useState(true);

  // Derived state
  const activeClass = useMemo(
    () => state.classes.find((c) => c.id === activeClassId) || state.classes[0],
    [state.classes, activeClassId],
  );

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
    () => state.coverage[activeClassId] || {},
    [state.coverage, activeClassId],
  );

  const currentSessions = useMemo(
    () => state.sessions[activeClassId] || [],
    [state.sessions, activeClassId],
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
      if (coverageForClass[entry.questionTypeId || ""]) {
        return sum + (entry.scores[activeSkill] || 0);
      }
      return sum;
    }, 0);
  }, [coverageEntries, coverageForClass, activeSkill]);

  return {
    state,
    isLoading,
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
      toggleCoverage: (questionTypeId: string) =>
        actions.toggleCoverage(activeClassId, questionTypeId),
      manageSession: actions.manageSession,
      manageClass: actions.manageClass,
      exportData: actions.exportData,
      exportData: actions.exportData,
      importData: actions.importData,
      toggleTheme: actions.toggleTheme,
    },
    theme,
  };
};
