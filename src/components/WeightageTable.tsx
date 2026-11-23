import { getModule } from "../coverage";
import { weightageChart } from "../data";
import type { SkillKey } from "../types";

const skills: SkillKey[] = ["listening", "speaking", "reading", "writing"];

const rows = [...weightageChart].sort((a, b) => b.total - a.total);

const totals = {
  ...Object.fromEntries(
    skills.map((s) => [s, weightageChart.reduce((sum, e) => sum + (e.scores[s] ?? 0), 0)]),
  ),
  total: weightageChart.reduce((sum, e) => sum + e.total, 0),
} as Record<SkillKey | "total", number>;

/** The full PTE score weightage chart, with column totals. */
export const WeightageTable = () => (
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
          {rows.map((entry) => (
            <tr key={entry.typeId} className={`weightage-row weightage-${entry.module}`}>
              <td className="weightage-module-cell">{getModule(entry.module).name}</td>
              <td className="weightage-question-cell">{entry.question}</td>
              <td className="weightage-avg">{entry.avgQs}</td>
              {skills.map((s) => (
                <td key={s}>{entry.scores[s] ? entry.scores[s].toFixed(2) : ""}</td>
              ))}
              <td className="weightage-total">{entry.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="weightage-foot">
            <td colSpan={3} />
            {skills.map((s) => (
              <td key={s}>{totals[s].toFixed(2)}</td>
            ))}
            <td className="weightage-total">{totals.total.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
);
