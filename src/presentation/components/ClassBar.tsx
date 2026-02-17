import React from "react";
import type { ClassItem } from "../../domain/types";

interface ClassBarProps {
  classes: ClassItem[];
  activeClassId: string;
  onSelectClass: (id: string) => void;
  onResetClass: () => void;
}

/**
 * Component for selecting and resetting classes.
 */
export const ClassBar: React.FC<ClassBarProps> = ({
  classes,
  activeClassId,
  onSelectClass,
  onResetClass,
}) => {
  return (
    <section className="class-bar">
      <div>
        <p className="section-label">Classes</p>
        <div className="class-list">
          {classes.map((classItem) => (
            <button
              key={classItem.id}
              className={classItem.id === activeClassId ? "class-chip active" : "class-chip"}
              type="button"
              onClick={() => onSelectClass(classItem.id)}
            >
              {classItem.name}
            </button>
          ))}
        </div>
      </div>
      <div className="class-actions">
        <button className="ghost-button" type="button" onClick={onResetClass}>
          Reset class cycle
        </button>
      </div>
    </section>
  );
};
