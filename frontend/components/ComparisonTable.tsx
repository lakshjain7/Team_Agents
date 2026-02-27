"use client";

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
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <div className="text-sm font-bold text-blue-700 mb-1">AI Comparison Summary</div>
          <p className="text-sm text-blue-900">{ai_summary}</p>
        </div>
      )}

      {/* Best for */}
      {best_for && Object.keys(best_for).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(best_for).map(([policy, reason]) => (
            <div key={policy} className="bg-green-50 border border-green-100 rounded-xl px-3 py-2">
              <span className="text-xs font-bold text-green-700">{policy}</span>
              <span className="text-xs text-green-600"> — {reason}</span>
            </div>
          ))}
        </div>
      )}

      {/* Comparison matrix */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-600 w-48">Feature</th>
              {policyNames.map((name) => (
                <th key={name} className="text-center py-3 px-4 font-semibold text-gray-800">
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparison_table.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="py-2.5 px-4 text-gray-600 font-medium">{row.dimension}</td>
                {policyNames.map((name) => {
                  const val = row[name];
                  return (
                    <td key={name} className="py-2.5 px-4 text-center text-gray-800">
                      <CellValue value={val} />
                    </td>
                  );
                })}
              </tr>
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
