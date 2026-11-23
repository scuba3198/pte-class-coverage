import { getModule } from "../coverage";
import { weightageChart } from "../data";
import type { SkillKey } from "../types";
import { Icon } from "./Icon";

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
  <details className="accordion-row">
    <summary>
      <span className="accordion-text">
        <span className="accordion-title">Score weightage by question type</span>
        <span className="accordion-desc">Marks per question type, PTE Academic / UKVI</span>
      </span>
      <Icon name="chevron" size={20} />
    </summary>
    <div className="accordion-body">
      <p className="body-text">
        Based on the New Score Weightage Chart (PTE Academic / UKVI), sorted by total marks.
      </p>
      <div className="table-wrap">
        <table className="weightage-table">
          <thead>
            <tr>
              <th>Module</th>
              <th>Question type</th>
              <th className="num">Avg Qs</th>
              <th className="num">Listening</th>
              <th className="num">Speaking</th>
              <th className="num">Reading</th>
              <th className="num">Writing</th>
              <th className="num total">Total marks</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((entry) => (
              <tr key={entry.typeId} data-module={entry.module}>
                <td className="module-cell">
                  <span className="dot" aria-hidden="true" />
                  {getModule(entry.module).name}
                </td>
                <td>{entry.question}</td>
                <td className="num">{entry.avgQs}</td>
                {skills.map((s) => (
                  <td key={s} className="num">
                    {entry.scores[s] ? (
                      entry.scores[s].toFixed(2)
                    ) : (
                      <span className="muted">–</span>
                    )}
                  </td>
                ))}
                <td className="num total">{entry.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th colSpan={3} scope="row">
                Total
              </th>
              {skills.map((s) => (
                <td key={s} className="num">
                  {totals[s].toFixed(2)}
                </td>
              ))}
              <td className="num total">{totals.total.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </details>
);
