"use client";
import { useState } from "react";
import { Search, ArrowLeft, BarChart2, Loader2 } from "lucide-react";
import Link from "next/link";
import { discoverPolicies, comparePolicies } from "@/lib/api";
import PolicyCard from "@/components/PolicyCard";
import ComparisonTable from "@/components/ComparisonTable";

const EXAMPLE_QUERIES = [
  "I need maternity coverage, I have diabetes, budget ₹18,000/year, family of 3",
  "Best family floater plan under ₹12,000/year with OPD coverage",
  "Senior citizen plan with no room rent limit and mental health coverage",
];

export default function DiscoverPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [selected, setSelected] = useState<{ id: string; name: string }[]>([]);
  const [comparing, setComparing] = useState(false);
  const [compareResult, setCompareResult] = useState<any>(null);

  async function handleDiscover() {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    setCompareResult(null);
    try {
      const data = await discoverPolicies(query);
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function toggleCompare(id: string, name: string) {
    setSelected((prev) => {
      const exists = prev.find((p) => p.id === id);
      if (exists) return prev.filter((p) => p.id !== id);
      if (prev.length >= 3) return prev;
      return [...prev, { id, name }];
    });
  }

  async function handleCompare() {
    if (selected.length < 2) return;
    setComparing(true);
    try {
      const data = await comparePolicies(selected.map((p) => p.id));
      setCompareResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setComparing(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-8 text-sm transition">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <h1 className="text-3xl font-black text-gray-900 mb-2">Find the Right Policy</h1>
        <p className="text-gray-500 mb-6">Describe your needs in plain English. We&apos;ll match and rank the best policies for you.</p>

        {/* Query input */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-4">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. I need maternity coverage, have diabetes, budget ₹18,000/year, family of 3..."
            className="w-full resize-none text-gray-800 text-base outline-none min-h-[80px] placeholder:text-gray-400"
            onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) handleDiscover(); }}
          />
          <div className="flex items-center justify-between mt-2">
            <div className="flex gap-2 flex-wrap">
              {EXAMPLE_QUERIES.slice(0, 2).map((ex) => (
                <button
                  key={ex}
                  onClick={() => setQuery(ex)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded-lg transition"
                >
                  {ex.slice(0, 40)}…
                </button>
              ))}
            </div>
            <button
              onClick={handleDiscover}
              disabled={loading || !query.trim()}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Find Policies
            </button>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Extracted requirements */}
            {result.extracted_requirements && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <div className="text-xs font-bold text-blue-700 mb-2">We understood your needs as:</div>
                <div className="flex flex-wrap gap-2">
                  {result.extracted_requirements.needs?.map((n: string) => (
                    <span key={n} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{n}</span>
                  ))}
                  {result.extracted_requirements.budget_max && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      Budget: ₹{Number(result.extracted_requirements.budget_max).toLocaleString("en-IN")}/yr
                    </span>
                  )}
                  {result.extracted_requirements.preferred_type && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {result.extracted_requirements.preferred_type.replace("_", " ")}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Compare bar */}
            {selected.length > 0 && (
              <div className="bg-white border border-blue-200 rounded-xl p-3 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  <span className="font-semibold">{selected.length}</span> policy{selected.length > 1 ? "ies" : ""} selected for comparison
                  {selected.map((p) => (
                    <span key={p.id} className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded-full">{p.name}</span>
                  ))}
                </div>
                <button
                  onClick={handleCompare}
                  disabled={selected.length < 2 || comparing}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
                >
                  {comparing ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart2 className="w-4 h-4" />}
                  Compare
                </button>
              </div>
            )}

            {/* Policy cards */}
            <div className="grid md:grid-cols-2 gap-4">
              {result.policies?.map((p: any) => (
                <PolicyCard
                  key={p.id}
                  {...p}
                  onCompare={toggleCompare}
                  isSelected={!!selected.find((s) => s.id === p.id)}
                />
              ))}
            </div>

            {/* Comparison table */}
            {compareResult && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Policy Comparison</h2>
                <ComparisonTable {...compareResult} />
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
