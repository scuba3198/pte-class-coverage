import React, { useMemo } from "react";
import { weightageChart } from "../../domain/data/weightage";
import type { WeightageTotals } from "../../domain/types";

/**
 * Component displaying the detailed PTE score weightage table.
 */
export const WeightageTable: React.FC = () => {
  const weightageTotals = useMemo((): WeightageTotals => {
    return weightageChart.reduce(
      (acc, entry) => {
        acc.listening += entry.scores.listening || 0;
        acc.speaking += entry.scores.speaking || 0;
        acc.reading += entry.scores.reading || 0;
        acc.writing += entry.scores.writing || 0;
        acc.total += entry.total || 0;
        return acc;
      },
      { listening: 0, speaking: 0, reading: 0, writing: 0, total: 0 },
    );
  }, []);

  const sortedWeightageChart = useMemo(() => {
    return [...weightageChart].sort((a, b) => b.total - a.total);
  }, []);

  return (
    <div className="card weightage-card">
      <div className="card-header">
        <div>
          <p className="section-label">Score weightage</p>
          <h2>Marks by question type</h2>
          <p className="card-subtitle">
            Based on the New Score Weightage Chart (PTE Academic / UKVI).
          </p>
        </div>
      </div>
      <div className="weightage-cards">
        {sortedWeightageChart.map((entry) => (
          <div
            key={`${entry.question}-${entry.module}`}
            className="card"
            style={{ marginBottom: "1rem" }}
          >
            <div style={{ padding: "16px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                  alignItems: "center",
                }}
              >
                <span
                  className={`weightage-module-cell weightage-row weightage-${entry.module.toLowerCase()}`}
                  style={{
                    fontSize: "0.75rem",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    background: `var(--weightage-row-${entry.module.toLowerCase()})`,
                  }}
                >
                  {entry.module}
                </span>
                <span className="weightage-card-value">{entry.total.toFixed(2)} pts</span>
              </div>

              <div className="weightage-card-question" style={{ marginBottom: "12px" }}>
                {entry.question}
              </div>

              <div className="weightage-card-grid">
                <div>
                  <span className="weightage-card-label">Avg Qs</span>
                  <span className="weightage-card-value">{entry.avgQs}</span>
                </div>
                {entry.scores.speaking ? (
                  <div>
                    <span className="weightage-card-label">Speaking</span>
                    <span className="weightage-card-value">{entry.scores.speaking.toFixed(2)}</span>
                  </div>
                ) : null}
                {entry.scores.writing ? (
                  <div>
                    <span className="weightage-card-label">Writing</span>
                    <span className="weightage-card-value">{entry.scores.writing.toFixed(2)}</span>
                  </div>
                ) : null}
                {entry.scores.reading ? (
                  <div>
                    <span className="weightage-card-label">Reading</span>
                    <span className="weightage-card-value">{entry.scores.reading.toFixed(2)}</span>
                  </div>
                ) : null}
                {entry.scores.listening ? (
                  <div>
                    <span className="weightage-card-label">Listening</span>
                    <span className="weightage-card-value">
                      {entry.scores.listening.toFixed(2)}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="weightage-table-wrap">
        <table className="weightage-table">
          <thead>
            <tr>
              <th>Module</th>
              <th>Weightage-wise Sequence of Questions</th>
              <th>Avg Qs</th>
              <th>Listening</th>
              <th>Speaking</th>
              <th>Reading</th>
              <th>Writing</th>
              <th>Total Marks</th>
            </tr>
          </thead>
          <tbody>
            {sortedWeightageChart.map((entry) => (
              <tr
                key={`${entry.question}-${entry.module}`}
                className={`weightage-row weightage-${entry.module.toLowerCase()}`}
              >
                <td className="weightage-module-cell">{entry.module}</td>
                <td className="weightage-question-cell">{entry.question}</td>
                <td className="weightage-avg">{entry.avgQs}</td>
                <td>{entry.scores.listening ? entry.scores.listening.toFixed(2) : ""}</td>
                <td>{entry.scores.speaking ? entry.scores.speaking.toFixed(2) : ""}</td>
                <td>{entry.scores.reading ? entry.scores.reading.toFixed(2) : ""}</td>
                <td>{entry.scores.writing ? entry.scores.writing.toFixed(2) : ""}</td>
                <td className="weightage-total">{entry.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="weightage-foot">
              <td colSpan={3} />
              <td>{weightageTotals.listening.toFixed(2)}</td>
              <td>{weightageTotals.speaking.toFixed(2)}</td>
              <td>{weightageTotals.reading.toFixed(2)}</td>
              <td>{weightageTotals.writing.toFixed(2)}</td>
              <td className="weightage-total">{weightageTotals.total.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
