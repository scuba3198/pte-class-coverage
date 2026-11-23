import { modules } from "../data";
import type { ModuleId } from "../types";

export const ModuleTabs = ({
  active,
  onSelect,
}: {
  active: ModuleId;
  onSelect: (id: ModuleId) => void;
}) => (
  <div className="module-tabs">
    {modules.map((m) => (
      <button
        key={m.id}
        className={m.id === active ? "module-tab active" : "module-tab"}
        type="button"
        onClick={() => onSelect(m.id)}
      >
        {m.name}
      </button>
    ))}
  </div>
);
