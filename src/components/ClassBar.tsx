import type { ClassItem } from "../types";
import { AddChip } from "./AddChip";
import { Icon } from "./Icon";

interface ClassBarProps {
  classes: ClassItem[];
  activeId: string;
  onSelect: (id: string) => void;
  onAdd: (name: string) => void;
  onReset: () => void;
  onRemove: () => void;
}

/** Picks the active class, adds new ones inline, and resets or removes the active one. */
export const ClassBar = ({
  classes,
  activeId,
  onSelect,
  onAdd,
  onReset,
  onRemove,
}: ClassBarProps) => (
  <section className="class-bar" aria-label="Classes">
    <span className="eyebrow class-bar-label">Class</span>
    <div className="class-chips">
      {classes.map((c) => (
        <button
          key={c.id}
          className="chip class-chip"
          type="button"
          aria-pressed={c.id === activeId}
          onClick={() => onSelect(c.id)}
        >
          {c.name}
        </button>
      ))}
      <AddChip
        label="Add class"
        placeholder="e.g. 11-12"
        inputLabel="New class name"
        saveLabel="Save class"
        onAdd={onAdd}
      />
    </div>
    <div className="class-actions">
      <button className="button ghost" type="button" onClick={onReset}>
        <Icon name="reset" size={16} />
        Reset
      </button>
      <button
        className="button ghost danger"
        type="button"
        onClick={onRemove}
        disabled={classes.length <= 1}
        title={classes.length <= 1 ? "Keep at least one class" : undefined}
      >
        <Icon name="trash" size={16} />
        Remove
      </button>
    </div>
  </section>
);
