import { useState } from "react";
import type { ClassItem } from "../types";

interface ClassEditorProps {
  classes: ClassItem[];
  activeId: string;
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
  onSelect: (id: string) => void;
}

export const ClassEditor = ({ classes, activeId, onAdd, onRemove, onSelect }: ClassEditorProps) => {
  const [name, setName] = useState("");

  return (
    <section className="card class-editor">
      <h2>Manage classes</h2>
      <p>Add or remove classes. Data stays local in this browser.</p>
      <form
        className="class-editor-grid"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          onAdd(name);
          setName("");
        }}
      >
        <label>
          New class name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., 11-12"
          />
        </label>
        <button className="primary-button add-class-button" type="submit">
          Add class
        </button>
      </form>
      <div className="class-list class-list-editor">
        {classes.map((c) => (
          <div key={c.id} className="class-chip-manage">
            <button
              className={c.id === activeId ? "class-chip active" : "class-chip"}
              type="button"
              onClick={() => onSelect(c.id)}
            >
              {c.name}
            </button>
            <button
              className="ghost-button"
              type="button"
              onClick={() => onRemove(c.id)}
              disabled={classes.length <= 1}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};
