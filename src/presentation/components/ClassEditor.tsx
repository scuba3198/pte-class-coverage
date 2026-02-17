import React, { useState } from "react";
import type { ClassItem } from "../../domain/types";

interface ClassEditorProps {
  classes: ClassItem[];
  activeClassId: string;
  onAddClass: (name: string) => void;
  onRemoveClass: (id: string) => void;
  onSelectClass: (id: string) => void;
}

/**
 * Component for adding and removing classes.
 */
export const ClassEditor: React.FC<ClassEditorProps> = ({
  classes,
  activeClassId,
  onAddClass,
  onRemoveClass,
  onSelectClass,
}) => {
  const [newClassName, setNewClassName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newClassName.trim();
    if (name) {
      onAddClass(name);
      setNewClassName("");
    }
  };

  return (
    <section className="card class-editor">
      <h2>Manage classes</h2>
      <p>Add or remove classes. Data stays local in this browser.</p>
      <form className="class-editor-grid" onSubmit={handleSubmit}>
        <label>
          New class name
          <input
            type="text"
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
            placeholder="e.g., 11-12"
          />
        </label>
        <button className="primary-button add-class-button" type="submit">
          Add class
        </button>
      </form>
      <div className="class-list class-list-editor">
        {classes.map((classItem) => (
          <div key={classItem.id} className="class-chip-manage">
            <button
              className={classItem.id === activeClassId ? "class-chip active" : "class-chip"}
              type="button"
              onClick={() => onSelectClass(classItem.id)}
            >
              {classItem.name}
            </button>
            <button
              className="ghost-button"
              type="button"
              onClick={() => onRemoveClass(classItem.id)}
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
