import type { ClassItem } from "../types";

interface ClassBarProps {
  classes: ClassItem[];
  activeId: string;
  onSelect: (id: string) => void;
  onReset: () => void;
}

export const ClassBar = ({ classes, activeId, onSelect, onReset }: ClassBarProps) => (
  <section className="class-bar">
    <div>
      <p className="section-label">Classes</p>
      <div className="class-list">
        {classes.map((c) => (
          <button
            key={c.id}
            className={c.id === activeId ? "class-chip active" : "class-chip"}
            type="button"
            onClick={() => onSelect(c.id)}
          >
            {c.name}
          </button>
        ))}
      </div>
    </div>
    <div className="class-actions">
      <button className="ghost-button" type="button" onClick={onReset}>
        Reset class cycle
      </button>
    </div>
  </section>
);
