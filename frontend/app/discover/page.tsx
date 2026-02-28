"use client";
import { useState } from "react";
import { Search, ArrowLeft, BarChart2, Loader2, Zap, Target, ListFilter } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { discoverPolicies, comparePolicies } from "@/lib/api";
import PolicyCard from "@/components/PolicyCard";
import ComparisonTable from "@/components/ComparisonTable";

/* ── Motion Variants ── */
const scrollReveal = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 20 },
  },
};
const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const staggerChild = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 20 },
  },
};

/* ── Static Data ── */
const EXAMPLE_QUERIES = [
  "I need maternity coverage, I have diabetes, budget ₹18,000/year, family of 3",
  "Best family floater plan under ₹12,000/year with OPD coverage",
  "Senior citizen plan with no room rent limit and mental health coverage",
];

const DISCOVERY_STEPS = [
  { icon: Zap, label: "Extract Needs", desc: "GPT-4o-mini parses your query into structured requirements" },
  { icon: Target, label: "Score Policies", desc: "PolicyRanker scores across 5 dimensions" },
  { icon: ListFilter, label: "Rank & Compare", desc: "Results sorted by match percentage" },
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
    <main className="min-h-screen bg-bg-base">
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <motion.div variants={scrollReveal} initial="hidden" animate="visible">
          <Link
            href="/"
            className="flex items-center gap-2 text-text-subtle hover:text-text-primary mb-8 text-sm transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <h1 className="text-3xl font-extrabold text-text-primary mb-2">
            Find the Right Policy
          </h1>
          <p className="text-text-secondary mb-6">
            Describe your needs in plain English. We&apos;ll match and rank the
            best policies for you.
          </p>
        </motion.div>

        {/* Query input */}
        <motion.div
          variants={scrollReveal}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.1 }}
        >
          <div
            className="bg-bg-card rounded-[24px] border border-border-subtle p-5 mb-4"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. I need maternity coverage, have diabetes, budget ₹18,000/year, family of 3..."
              className="w-full resize-none bg-transparent text-text-primary text-base outline-none min-h-[80px] placeholder:text-text-subtle"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.metaKey) handleDiscover();
              }}
            />
            <div className="flex items-center justify-between mt-2">
              <div className="flex gap-2 flex-wrap">
                {EXAMPLE_QUERIES.slice(0, 2).map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setQuery(ex)}
                    className="text-xs bg-bg-alt hover:bg-border-default text-text-secondary px-2.5 py-1 rounded-full transition"
                  >
                    {ex.slice(0, 40)}…
                  </button>
                ))}
              </div>
              <button
                onClick={handleDiscover}
                disabled={loading || !query.trim()}
                className="flex items-center gap-2 bg-accent-sage hover:bg-accent-sage-dark disabled:opacity-50 text-text-on-sage text-sm font-semibold px-5 py-2.5 rounded-full transition"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Find Policies
              </button>
            </div>
          </div>
        </motion.div>

        {/* Empty state — before any search */}
        {!result && !loading && (
          <motion.div
            variants={scrollReveal}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
            className="mt-8"
          >
            <div className="text-xs font-semibold text-text-subtle uppercase tracking-wider mb-3">
              How Discovery Works
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {DISCOVERY_STEPS.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.label}
                    className="bg-bg-card border border-border-subtle rounded-[20px] p-4 text-center"
                    style={{ boxShadow: "var(--shadow-card)" }}
                  >
                    <div className="w-9 h-9 bg-bg-sage-light rounded-xl mx-auto mb-2 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-accent-sage" />
                    </div>
                    <div className="text-xs font-bold text-text-primary mb-0.5">
                      {step.label}
                    </div>
                    <div className="text-[11px] text-text-subtle leading-snug">
                      {step.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Loading */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <div
              className="bg-bg-card rounded-[24px] border border-border-subtle p-8 text-center"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <Loader2 className="w-8 h-8 animate-spin text-accent-sage mx-auto mb-3" />
              <p className="text-text-secondary text-sm">
                Extracting requirements &amp; scoring policies…
              </p>
              <p className="text-text-subtle text-xs mt-1">
                Ranking across budget fit, coverage match, PED wait, exclusion
                risk, network size
              </p>
            </div>
          </motion.div>
        )}

        {/* Results */}
        <AnimatePresence mode="wait">
          {result && !loading && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              className="space-y-6 mt-6"
            >
              {/* Extracted requirements */}
              {result.extracted_requirements && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="bg-bg-sage-light/40 border border-accent-sage/20 rounded-[20px] p-4"
                >
                  <div className="text-xs font-bold text-accent-sage mb-2">
                    We understood your needs as:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.extracted_requirements.needs?.map((n: string) => (
                      <span
                        key={n}
                        className="text-xs bg-bg-sage-light text-accent-sage-dark px-2.5 py-1 rounded-full font-medium"
                      >
                        {n}
                      </span>
                    ))}
                    {result.extracted_requirements.budget_max && (
                      <span className="text-xs bg-bg-sage-light text-accent-sage-dark px-2.5 py-1 rounded-full font-medium">
                        Budget: ₹
                        {Number(
                          result.extracted_requirements.budget_max
                        ).toLocaleString("en-IN")}
                        /yr
                      </span>
                    )}
                    {result.extracted_requirements.preferred_type && (
                      <span className="text-xs bg-bg-sage-light text-accent-sage-dark px-2.5 py-1 rounded-full font-medium">
                        {result.extracted_requirements.preferred_type.replace(
                          "_",
                          " "
                        )}
                      </span>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Compare bar */}
              <AnimatePresence>
                {selected.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div
                      className="bg-bg-card border border-accent-sage/30 rounded-[20px] p-3 flex items-center justify-between"
                      style={{ boxShadow: "var(--shadow-card)" }}
                    >
                      <div className="text-sm text-text-secondary">
                        <span className="font-semibold text-text-primary">
                          {selected.length}
                        </span>{" "}
                        policy{selected.length > 1 ? "ies" : ""} selected
                        {selected.map((p) => (
                          <span
                            key={p.id}
                            className="ml-2 text-xs bg-bg-alt px-2 py-0.5 rounded-full"
                          >
                            {p.name}
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={handleCompare}
                        disabled={selected.length < 2 || comparing}
                        className="flex items-center gap-2 bg-dark hover:bg-dark-hover disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-full transition"
                      >
                        {comparing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <BarChart2 className="w-4 h-4" />
                        )}
                        Compare
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Policy cards — staggered */}
              <motion.div
                className="grid md:grid-cols-2 gap-4"
                variants={staggerContainer}
                initial="hidden"
                animate="show"
              >
                {result.policies?.map((p: any) => (
                  <motion.div key={p.id} variants={staggerChild}>
                    <PolicyCard
                      {...p}
                      onCompare={toggleCompare}
                      isSelected={!!selected.find((s) => s.id === p.id)}
                    />
                  </motion.div>
                ))}
              </motion.div>

              {/* Comparison table */}
              {compareResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  className="bg-bg-card rounded-[24px] border border-border-subtle p-6"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  <h2 className="text-xl font-bold text-text-primary mb-4">
                    Policy Comparison
                  </h2>
                  <ComparisonTable {...compareResult} />
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
