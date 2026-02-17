import React, { useState } from "react";

/**
 * Component providing usage guidance.
 */
export const HelpCard: React.FC = () => {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="card help-card">
      <div className="card-header">
        <div>
          <p className="section-label">Help</p>
          <h2>How to use this tracker</h2>
          <p className="card-subtitle">A quick guide for students and teachers.</p>
        </div>
        <button className="ghost-button" type="button" onClick={() => setShowHelp((prev) => !prev)}>
          {showHelp ? "Hide" : "Show"}
        </button>
      </div>
      {showHelp && (
        <div className="help-list">
          <p>
            1. Choose your class, then pick a module tab (Speaking, Writing, Reading, Listening).
          </p>
          <p>2. The coverage grid shows only the top tasks that reach 72+ marks for that module.</p>
          <p>
            3. Tap a pill to mark it Covered. Each pill shows the marks it adds for that module.
          </p>
          <p>
            4. Use the session log to record what you practiced today. It auto-saves as you tap.
          </p>
          <p>5. Cross-module tasks show a badge like (S/W/R/L) to show the original section.</p>
          <p>6. Use Manage Classes to add or remove classes as your schedule changes.</p>
          <p>7. Export a backup regularly if you might clear browser data or switch devices.</p>
        </div>
      )}
    </div>
  );
};
