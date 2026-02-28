"use client";
import { motion } from "framer-motion";

interface ComparisonRow {
  dimension: string;
  [policyName: string]: string | number | boolean;
}

interface ComparisonTableProps {
  policies: { id: string; name: string; insurer: string }[];
  comparison_table: ComparisonRow[];
  ai_summary?: string;
  best_for?: Record<string, string>;
}

export default function ComparisonTable({ policies, comparison_table, ai_summary, best_for }: ComparisonTableProps) {
  const policyNames = policies.map((p) => p.name);

  return (
    <div className="space-y-4">
      {/* AI Summary */}
      {ai_summary && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="bg-bg-sage-light/40 border border-accent-sage/20 rounded-[20px] p-4"
        >
          <div className="text-sm font-bold text-accent-sage mb-1">AI Comparison Summary</div>
          <p className="text-sm text-text-primary">{ai_summary}</p>
        </motion.div>
      )}

      {/* Best for */}
      {best_for && Object.keys(best_for).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(best_for).map(([policy, reason]) => (
            <div key={policy} className="bg-bg-sage-light border border-accent-sage/20 rounded-[16px] px-3 py-2">
              <span className="text-xs font-bold text-accent-sage-dark">{policy}</span>
              <span className="text-xs text-accent-sage"> — {reason}</span>
            </div>
          ))}
        </div>
      )}

      {/* Comparison matrix */}
      <div className="overflow-x-auto rounded-[20px] border border-border-subtle">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-bg-alt border-b border-border-subtle">
              <th className="text-left py-3 px-4 font-semibold text-text-subtle w-48">Feature</th>
              {policyNames.map((name) => (
                <th key={name} className="text-center py-3 px-4 font-semibold text-text-primary">
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparison_table.map((row, i) => (
              <motion.tr
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03, type: "spring", stiffness: 120, damping: 20 }}
                className={i % 2 === 0 ? "bg-bg-card" : "bg-bg-alt/50"}
              >
                <td className="py-2.5 px-4 text-text-subtle font-medium">{row.dimension}</td>
                {policyNames.map((name) => {
                  const val = row[name];
                  return (
                    <td key={name} className="py-2.5 px-4 text-center text-text-primary">
                      <CellValue value={val} />
                    </td>
                  );
                })}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CellValue({ value }: { value: string | number | boolean }) {
  if (value === "Yes") return <span className="text-green-600 font-semibold">✓ Yes</span>;
  if (value === "No") return <span className="text-red-400">✗ No</span>;
  if (value === "—") return <span className="text-gray-400">—</span>;
  if (typeof value === "number")
    return <span>{value.toLocaleString("en-IN")}</span>;
  return <span>{String(value)}</span>;
}
