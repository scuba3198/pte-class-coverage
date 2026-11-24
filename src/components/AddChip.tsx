import { useState } from "react";
import { Icon } from "./Icon";

interface AddChipProps {
  label: string;
  placeholder: string;
  inputLabel: string;
  saveLabel: string;
  onAdd: (name: string) => void;
}

/** A chip that turns into a small inline form for naming something new. */
export const AddChip = ({ label, placeholder, inputLabel, saveLabel, onAdd }: AddChipProps) => {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  const close = () => {
    setAdding(false);
    setName("");
  };

  if (!adding) {
    return (
      <button className="chip add-chip" type="button" onClick={() => setAdding(true)}>
        <Icon name="plus" size={16} />
        {label}
      </button>
    );
  }

  return (
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
        placeholder={placeholder}
        aria-label={inputLabel}
        autoFocus
      />
      <button className="icon-button small" type="submit" aria-label={saveLabel}>
        <Icon name="check" size={16} />
      </button>
    </form>
  );
};
