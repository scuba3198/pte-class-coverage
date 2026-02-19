import React from "react";
import type { Module, ResolvedWeightageEntry, SkillKey } from "../../domain/types";

interface CoverageCardProps {
  activeClassName: string;
  activeModule: Module;
  activeSkill: SkillKey;
  modules: readonly Module[];
  coverageForClass: Record<string, boolean>;
  coverageEntries: ResolvedWeightageEntry[];
  coverageMarksTotal: number;
  coverageCounts: { covered: number; total: number };
  moduleCoverageCounts: { covered: number; total: number };
  onSelectModule: (id: string) => void;
  onToggleCoverage: (id: string) => void;
}

/**
 * Component displaying overall and module-specific coverage.
 */
export const CoverageCard: React.FC<CoverageCardProps> = ({
  activeClassName,
  activeModule,
  activeSkill,
  modules,
  coverageForClass,
  coverageEntries,
  coverageMarksTotal,
  coverageCounts,
  moduleCoverageCounts,
  onSelectModule,
  onToggleCoverage,
}) => {
  const moduleInitials: Record<string, string> = {
    speaking: "S",
    writing: "W",
    reading: "R",
    listening: "L",
  };

  return (
    <div className="card coverage-card">
      <div className="card-header">
        <div>
          <p className="section-label">Overall coverage</p>
          <h2>{activeClassName}</h2>
          <p className="card-subtitle">
            {coverageCounts.covered} of {coverageCounts.total} question types covered (72+ marks)
          </p>
          <p className="card-subtitle">{`Coverage total: ${Math.round(coverageMarksTotal)} / 90`}</p>
        </div>
        <div className="progress-ring">
          <span>{Math.round((coverageCounts.covered / coverageCounts.total) * 100) || 0}%</span>
        </div>
      </div>
      <div className="module-tabs">
        {modules.map((m) => (
          <button
            key={m.id}
            className={m.id === activeModule.id ? "module-tab active" : "module-tab"}
            type="button"
            onClick={() => onSelectModule(m.id)}
          >
            {m.name}
          </button>
        ))}
      </div>
      <div className="coverage-summary">
        <p>
          {activeModule.name}: {moduleCoverageCounts.covered} of {moduleCoverageCounts.total}{" "}
          covered
        </p>
      </div>
      <div className="question-grid">
        {coverageEntries.map((entry) => {
          const isCovered = coverageForClass[entry.questionTypeId || ""];
          const originSuffix =
            entry.originModuleId && entry.originModuleId !== activeModule.id
              ? ` (${moduleInitials[entry.originModuleId] || "?"})`
              : "";

          return (
            <button
              key={`${entry.questionTypeId}-${activeModule.id}`}
              className={isCovered ? "question-card covered" : "question-card"}
              type="button"
              onClick={() => onToggleCoverage(entry.questionTypeId || "")}
            >
              <span className="question-name">{`${entry.question}${originSuffix}`}</span>
              <span className="question-status">{isCovered ? "Covered" : "Not yet"}</span>
              <span className="question-status">{`${(entry.scores[activeSkill] ?? 0).toFixed(2)} marks`}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
