import type { Institute } from "../types";
import { AddChip } from "./AddChip";
import { Icon } from "./Icon";

interface InstituteBarProps {
  institutes: Institute[];
  activeId: string;
  onSelect: (id: string) => void;
  onAdd: (name: string) => void;
  onRemove: () => void;
}

/** Picks the active institute, adds new ones inline, and removes the active one. */
export const InstituteBar = ({
  institutes,
  activeId,
  onSelect,
  onAdd,
  onRemove,
}: InstituteBarProps) => (
  <section className="class-bar" aria-label="Institutes">
    <span className="eyebrow class-bar-label">Institute</span>
    <div className="class-chips">
      {institutes.map((i) => (
        <button
          key={i.id}
          className="chip class-chip"
          type="button"
          aria-pressed={i.id === activeId}
          onClick={() => onSelect(i.id)}
        >
          {i.name}
        </button>
      ))}
      <AddChip
        label="Add institute"
        placeholder="e.g. City College"
        inputLabel="New institute name"
        saveLabel="Save institute"
        onAdd={onAdd}
      />
    </div>
    <div className="class-actions">
      <button
        className="button ghost danger"
        type="button"
        onClick={onRemove}
        disabled={institutes.length <= 1}
        title={institutes.length <= 1 ? "Keep at least one institute" : undefined}
      >
        <Icon name="trash" size={16} />
        Remove
      </button>
    </div>
  </section>
);
