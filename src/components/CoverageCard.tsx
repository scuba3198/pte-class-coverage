import { entryLabel, getCoverageEntries, getModule } from "../coverage";
import type { ModuleId } from "../types";
import { Icon } from "./Icon";

const RING_RADIUS = 30;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

const ProgressRing = ({ percent }: { percent: number }) => (
  <div className="progress-ring">
    <svg viewBox="0 0 72 72" aria-hidden="true">
      <circle className="progress-ring-track" cx="36" cy="36" r={RING_RADIUS} />
      <circle
        className="progress-ring-value"
        cx="36"
        cy="36"
        r={RING_RADIUS}
        strokeDasharray={RING_LENGTH}
        strokeDashoffset={RING_LENGTH * (1 - percent / 100)}
        opacity={percent ? 1 : 0}
      />
    </svg>
    <span className="progress-ring-label">
      {percent}
      <small>%</small>
    </span>
  </div>
);

interface CoverageCardProps {
  className: string;
  moduleId: ModuleId;
  covered: Record<string, boolean>;
  onToggle: (typeId: string) => void;
}

/** The module's top question types (72+ marks) for one class; click one to toggle it covered. */
export const CoverageCard = ({ className, moduleId, covered, onToggle }: CoverageCardProps) => {
  const module = getModule(moduleId);
  const entries = getCoverageEntries(moduleId);
  const coveredCount = entries.filter((e) => covered[e.typeId]).length;
  const marks = entries.reduce(
    (sum, e) => sum + (covered[e.typeId] ? (e.scores[moduleId] ?? 0) : 0),
    0,
  );
  const percent = Math.round((coveredCount / entries.length) * 100) || 0;

  return (
    <section className="coverage" data-module={moduleId} aria-labelledby="coverage-title">
      <header className="coverage-header">
        <ProgressRing percent={percent} />
        <div className="coverage-heading">
          <p className="eyebrow">Class {className}</p>
          <h2 id="coverage-title">{module.name} coverage</h2>
          <p className="section-desc">Top question types that add up to 72+ marks</p>
        </div>
        <dl className="coverage-stats">
          <div>
            <dt>Question types</dt>
            <dd>
              <strong>{coveredCount}</strong> of {entries.length} covered
            </dd>
          </div>
          <div>
            <dt>Marks covered</dt>
            <dd>
              <strong>{Math.round(marks)}</strong> / 90
            </dd>
          </div>
        </dl>
      </header>
      <ul className="question-list">
        {entries.map((entry) => {
          const isCovered = Boolean(covered[entry.typeId]);
          return (
            <li key={entry.typeId}>
              <button
                className="question-row"
                type="button"
                aria-pressed={isCovered}
                onClick={() => onToggle(entry.typeId)}
              >
                <span className="status-circle" aria-hidden="true">
                  <Icon name="check" size={14} />
                </span>
                <span className="question-name">{entryLabel(entry, moduleId)}</span>
                <span className="question-marks">{`${(entry.scores[moduleId] ?? 0).toFixed(2)} marks`}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
