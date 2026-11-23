import { Icon } from "./Icon";

const steps = [
  "Pick a class, then a module: Speaking, Writing, Reading or Listening.",
  "The coverage grid lists only the top question types that reach 72+ marks for that module.",
  "Click a question type to mark it covered. Each one shows the marks it adds to the module.",
  "Log what you practised today in Log a session. It saves as you tap.",
  "Question types from another module carry its initial, for example (S) or (L).",
  "Use Add class, Reset and Remove in the class bar as your schedule changes.",
  "Export a backup regularly if you might clear browser data or switch devices.",
];

export const HelpCard = () => (
  <details className="card disclosure help-card">
    <summary>
      <span className="disclosure-text">
        <span className="disclosure-title">How to use this tracker</span>
        <span className="caption">A quick guide for teachers and students</span>
      </span>
      <Icon name="chevron" size={18} />
    </summary>
    <ol className="help-list">
      {steps.map((step) => (
        <li key={step}>{step}</li>
      ))}
    </ol>
  </details>
);
