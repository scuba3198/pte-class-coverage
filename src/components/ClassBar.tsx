import { useState } from "react";
import type { ClassItem } from "../types";
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
export const ClassBar = ({ classes, activeId, onSelect, onAdd, onReset, onRemove }: ClassBarProps) => {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  const close = () => {
    setAdding(false);
    setName("");
  };

  return (
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
        {adding ? (
          <form
            className="add-class-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) onAdd(name);
              close();
            }}
          >
            <input
              className="add-class-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && close()}
              onBlur={() => !name.trim() && close()}
              placeholder="e.g. 11-12"
              aria-label="New class name"
              autoFocus
            />
            <button className="icon-button small" type="submit" aria-label="Save class">
              <Icon name="check" size={16} />
            </button>
          </form>
        ) : (
          <button className="chip add-chip" type="button" onClick={() => setAdding(true)}>
            <Icon name="plus" size={16} />
            Add class
          </button>
        )}
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
};
