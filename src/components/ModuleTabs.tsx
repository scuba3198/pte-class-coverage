import { getCoverageEntries } from "../coverage";
import { modules } from "../data";
import type { ModuleId } from "../types";

interface ModuleTabsProps {
  active: ModuleId;
  covered: Record<string, boolean>;
  onSelect: (id: ModuleId) => void;
}

/** The one module switcher; it drives both the coverage grid and the session log. */
export const ModuleTabs = ({ active, covered, onSelect }: ModuleTabsProps) => (
  <div className="module-tabs" role="tablist" aria-label="Module">
    {modules.map((m) => {
      const entries = getCoverageEntries(m.id);
      const done = entries.filter((e) => covered[e.typeId]).length;
      return (
        <button
          key={m.id}
          className="module-tab"
          data-module={m.id}
          type="button"
          role="tab"
          aria-selected={m.id === active}
          onClick={() => onSelect(m.id)}
        >
          <span className="dot" aria-hidden="true" />
          <span className="module-tab-name">{m.name}</span>
          <span className="module-tab-count">
            <span aria-hidden="true">
              {done}/{entries.length}
            </span>
            <span className="sr-only">{`, ${done} of ${entries.length} covered`}</span>
          </span>
        </button>
      );
    })}
  </div>
);
