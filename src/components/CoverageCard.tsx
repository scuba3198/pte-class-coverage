import { entryLabel, getCoverageEntries, getModule } from "../coverage";
import type { ModuleId } from "../types";
import { ModuleTabs } from "./ModuleTabs";

interface CoverageCardProps {
  className: string;
  moduleId: ModuleId;
  covered: Record<string, boolean>;
  onSelectModule: (id: ModuleId) => void;
  onToggle: (typeId: string) => void;
}

/** Overall and per-module coverage for one class; click a question type to toggle it. */
export const CoverageCard = ({
  className,
  moduleId,
  covered,
  onSelectModule,
  onToggle,
}: CoverageCardProps) => {
  const module = getModule(moduleId);
  const entries = getCoverageEntries(moduleId);
  const coveredCount = entries.filter((e) => covered[e.typeId]).length;
  const marks = entries.reduce(
    (sum, e) => sum + (covered[e.typeId] ? (e.scores[moduleId] ?? 0) : 0),
    0,
  );
  const moduleCovered = module.questionTypes.filter((q) => covered[q.id]).length;

  return (
    <div className="card coverage-card">
      <div className="card-header">
        <div>
          <p className="section-label">Overall coverage</p>
          <h2>{className}</h2>
          <p className="card-subtitle">
            {coveredCount} of {entries.length} question types covered (72+ marks)
          </p>
          <p className="card-subtitle">{`Coverage total: ${Math.round(marks)} / 90`}</p>
        </div>
        <div className="progress-ring">
          <span>{Math.round((coveredCount / entries.length) * 100) || 0}%</span>
        </div>
      </div>
      <ModuleTabs active={moduleId} onSelect={onSelectModule} />
      <div className="coverage-summary">
        <p>
          {module.name}: {moduleCovered} of {module.questionTypes.length} covered
        </p>
      </div>
      <div className="question-grid">
        {entries.map((entry) => {
          const isCovered = covered[entry.typeId];
          return (
            <button
              key={entry.typeId}
              className={isCovered ? "question-card covered" : "question-card"}
              type="button"
              onClick={() => onToggle(entry.typeId)}
            >
              <span className="question-name">{entryLabel(entry, moduleId)}</span>
              <span className="question-status">{isCovered ? "Covered" : "Not yet"}</span>
              <span className="question-status">{`${(entry.scores[moduleId] ?? 0).toFixed(2)} marks`}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
