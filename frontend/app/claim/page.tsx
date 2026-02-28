"use client";
import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Upload,
  FileText,
  Loader2,
  ChevronDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  listPolicies,
  claimCheck,
  extractConditions,
  extractConditionsFromFile,
  matchConditions,
  gapAnalysis,
} from "@/lib/api";

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
  show: { transition: { staggerChildren: 0.06 } },
};
const staggerChild = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 20 },
  },
};

/* ── Constants ── */
const TABS = ["Claim Check", "Medical Matching", "Gap Analysis"] as const;
type Tab = (typeof TABS)[number];

const SCORE_COLOR = (score: number) => {
  if (score >= 75) return "text-green-600";
  if (score >= 45) return "text-yellow-600";
  return "text-red-600";
};

const SCORE_BAR_COLOR = (score: number) => {
  if (score >= 75) return "bg-green-500";
  if (score >= 45) return "bg-yellow-500";
  return "bg-red-500";
};

const SEVERITY_COLORS: Record<string, string> = {
  HIGH: "border-red-300 bg-red-50",
  MEDIUM: "border-yellow-300 bg-yellow-50",
  LOW: "border-gray-200 bg-gray-50",
};

export default function ClaimPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Claim Check");
  const [policies, setPolicies] = useState<any[]>([]);
  const [selectedPolicyId, setSelectedPolicyId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Claim check state
  const [diagnosis, setDiagnosis] = useState("");
  const [treatmentType, setTreatmentType] = useState("hospitalization");

  // Medical matching state
  const [medicalText, setMedicalText] = useState("");
  const [conditions, setConditions] = useState<any[]>([]);

  // Gap analysis state
  const [gapPolicyId, setGapPolicyId] = useState("");

  useEffect(() => {
    listPolicies()
      .then((data) => {
        setPolicies(data.policies || []);
        if (data.policies?.length > 0)
          setSelectedPolicyId(data.policies[0].id);
      })
      .catch(console.error);
  }, []);

  async function handleClaimCheck() {
    if (!selectedPolicyId || !diagnosis.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await claimCheck(selectedPolicyId, diagnosis, treatmentType);
      setResult({ type: "claim", ...data });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleExtract() {
    if (!medicalText.trim()) return;
    setLoading(true);
    try {
      const data = await extractConditions(medicalText);
      setConditions(data.conditions || []);
      setResult({ type: "conditions", ...data });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleMatchConditions() {
    if (!conditions.length) return;
    setLoading(true);
    try {
      const data = await matchConditions(conditions);
      setResult({ type: "match", ...data });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleGapAnalysis() {
    const pid = gapPolicyId || selectedPolicyId;
    if (!pid) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await gapAnalysis(pid);
      setResult({ type: "gap", ...data });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleMedicalFileUpload(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const data = await extractConditionsFromFile(file);
      setConditions(data.conditions || []);
      setResult({ type: "conditions", ...data });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-bg-base">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <motion.div variants={scrollReveal} initial="hidden" animate="visible">
          <Link
            href="/"
            className="flex items-center gap-2 text-text-subtle hover:text-text-primary mb-8 text-sm transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <h1 className="text-3xl font-extrabold text-text-primary mb-2">
            Claim &amp; Health Analysis
          </h1>
          <p className="text-text-secondary mb-6">
            Check claim eligibility, match your health profile to policies, or
            analyze coverage gaps.
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          variants={scrollReveal}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.08 }}
        >
          <div className="flex gap-1 bg-bg-alt rounded-[16px] p-1 mb-6">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setResult(null);
                }}
                className={`flex-1 text-sm font-semibold py-2.5 rounded-[12px] transition relative ${
                  activeTab === tab
                    ? "bg-bg-card text-text-primary shadow-sm"
                    : "text-text-subtle hover:text-text-secondary"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {/* ── Claim Check Tab ── */}
          {activeTab === "Claim Check" && (
            <motion.div
              key="claim-check"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 120, damping: 22 }}
              className="space-y-4"
            >
              <div
                className="bg-bg-card rounded-[24px] border border-border-subtle p-5 space-y-3"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <label className="text-sm font-semibold text-text-primary">
                  Select Policy
                </label>
                <div className="relative">
                  <select
                    value={selectedPolicyId}
                    onChange={(e) => setSelectedPolicyId(e.target.value)}
                    className="w-full appearance-none bg-bg-alt border border-border-subtle rounded-[16px] px-4 py-2.5 text-sm text-text-primary outline-none focus:border-accent-sage transition pr-8"
                  >
                    {policies.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.user_label} — {p.insurer || p.filename}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-text-subtle pointer-events-none" />
                </div>
                <label className="text-sm font-semibold text-text-primary">
                  Diagnosis / Condition
                </label>
                <textarea
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g. Type 2 Diabetes, hospitalization for insulin adjustment and monitoring..."
                  className="w-full resize-none text-text-primary text-sm bg-bg-alt border border-border-subtle rounded-[16px] p-3 outline-none min-h-[70px] focus:border-accent-sage transition"
                />
                <div className="flex items-center gap-3">
                  <label className="text-sm font-semibold text-text-primary">
                    Treatment Type:
                  </label>
                  <select
                    value={treatmentType}
                    onChange={(e) => setTreatmentType(e.target.value)}
                    className="text-sm bg-bg-alt border border-border-subtle rounded-[12px] px-3 py-1.5 outline-none text-text-primary"
                  >
                    {[
                      "hospitalization",
                      "surgery",
                      "maternity",
                      "opd",
                      "critical_illness",
                    ].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleClaimCheck}
                  disabled={
                    loading || !selectedPolicyId || !diagnosis.trim()
                  }
                  className="w-full flex items-center justify-center gap-2 bg-accent-sage hover:bg-accent-sage-dark disabled:opacity-50 text-text-on-sage font-semibold py-3 rounded-full transition"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  {loading ? "Analyzing claim..." : "Check Claim Eligibility"}
                </button>
              </div>

              {/* Claim results */}
              <AnimatePresence>
                {result?.type === "claim" && !loading && (
                  <motion.div
                    key="claim-result"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{
                      type: "spring",
                      stiffness: 100,
                      damping: 20,
                    }}
                    className="space-y-4"
                  >
                    {/* Feasibility score */}
                    <div
                      className="bg-bg-card rounded-[24px] border border-border-subtle p-5"
                      style={{ boxShadow: "var(--shadow-card)" }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-bold text-text-primary">
                          Claim Feasibility Score
                        </div>
                        <div
                          className={`text-3xl font-extrabold ${SCORE_COLOR(
                            result.claim_feasibility_score
                          )}`}
                        >
                          {result.claim_feasibility_score}/100
                        </div>
                      </div>
                      <div className="w-full bg-bg-alt rounded-full h-3 mb-3 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${result.claim_feasibility_score}%`,
                          }}
                          transition={{
                            duration: 0.8,
                            ease: "easeOut",
                            delay: 0.2,
                          }}
                          className={`h-3 rounded-full ${SCORE_BAR_COLOR(
                            result.claim_feasibility_score
                          )}`}
                        />
                      </div>
                      <p className="text-text-secondary text-sm">
                        {result.plain_answer}
                      </p>
                    </div>

                    {/* Hidden conditions — staggered */}
                    {result.hidden_conditions?.length > 0 && (
                      <div
                        className="bg-bg-card rounded-[24px] border border-border-subtle p-5"
                        style={{ boxShadow: "var(--shadow-card)" }}
                      >
                        <div className="font-bold text-red-700 flex items-center gap-2 mb-3">
                          <AlertTriangle className="w-4 h-4" />{" "}
                          {result.hidden_conditions.length} Hidden Conditions
                        </div>
                        <motion.div
                          className="space-y-2"
                          variants={staggerContainer}
                          initial="hidden"
                          animate="show"
                        >
                          {result.hidden_conditions.map(
                            (hc: any, i: number) => (
                              <motion.div
                                key={i}
                                variants={staggerChild}
                                className="border border-red-100 bg-red-50 rounded-[16px] p-3"
                              >
                                <p className="text-sm font-semibold text-red-800">
                                  {hc.description}
                                </p>
                                <p className="text-xs text-red-600 mt-1">
                                  Impact: {hc.impact}
                                </p>
                              </motion.div>
                            )
                          )}
                        </motion.div>
                      </div>
                    )}

                    {/* Required documents */}
                    {result.required_documents?.length > 0 && (
                      <div
                        className="bg-bg-card rounded-[24px] border border-border-subtle p-5"
                        style={{ boxShadow: "var(--shadow-card)" }}
                      >
                        <div className="font-bold text-text-primary mb-3">
                          Required Documents
                        </div>
                        <motion.ul
                          className="space-y-1.5"
                          variants={staggerContainer}
                          initial="hidden"
                          animate="show"
                        >
                          {result.required_documents.map(
                            (doc: string, i: number) => (
                              <motion.li
                                key={i}
                                variants={staggerChild}
                                className="flex items-start gap-2 text-sm text-text-secondary"
                              >
                                <CheckCircle className="w-4 h-4 text-accent-sage mt-0.5 flex-shrink-0" />{" "}
                                {doc}
                              </motion.li>
                            )
                          )}
                        </motion.ul>
                      </div>
                    )}

                    {result.recommendation && (
                      <div className="bg-bg-sage-light/40 border border-accent-sage/20 rounded-[20px] p-4">
                        <div className="text-xs font-bold text-accent-sage mb-1">
                          Recommendation
                        </div>
                        <p className="text-sm text-text-primary">
                          {result.recommendation}
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── Medical Matching Tab ── */}
          {activeTab === "Medical Matching" && (
            <motion.div
              key="medical-matching"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 120, damping: 22 }}
              className="space-y-4"
            >
              <div
                className="bg-bg-card rounded-[24px] border border-border-subtle p-5 space-y-3"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <label className="text-sm font-semibold text-text-primary">
                  Describe your health conditions
                </label>
                <textarea
                  value={medicalText}
                  onChange={(e) => setMedicalText(e.target.value)}
                  placeholder="e.g. I have Type 2 Diabetes since 2018, mild hypertension, and a history of kidney stones..."
                  className="w-full resize-none text-text-primary text-sm bg-bg-alt border border-border-subtle rounded-[16px] p-3 outline-none min-h-[80px] focus:border-accent-sage transition"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleExtract}
                    disabled={loading || !medicalText.trim()}
                    className="flex-1 flex items-center justify-center gap-2 bg-accent-sage hover:bg-accent-sage-dark disabled:opacity-50 text-text-on-sage font-semibold py-2.5 rounded-full transition text-sm"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : null}
                    Extract Conditions
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 border border-border-subtle text-text-secondary hover:bg-bg-alt font-semibold py-2.5 px-4 rounded-full transition text-sm"
                  >
                    <Upload className="w-4 h-4" /> Upload Report
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleMedicalFileUpload}
                    className="hidden"
                  />
                </div>
              </div>

              <AnimatePresence>
                {conditions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-bg-card rounded-[24px] border border-border-subtle p-5"
                    style={{ boxShadow: "var(--shadow-card)" }}
                  >
                    <div className="font-semibold text-text-primary mb-3">
                      Extracted Conditions ({conditions.length})
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {conditions.map((c: any, i: number) => (
                        <span
                          key={i}
                          className="text-sm bg-bg-sage-light border border-accent-sage/20 text-accent-sage-dark px-3 py-1 rounded-full"
                        >
                          {c.name}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={handleMatchConditions}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 bg-dark hover:bg-dark-hover disabled:opacity-50 text-white font-semibold py-2.5 rounded-full transition text-sm"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : null}
                      Find Suitable Policies
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {result?.type === "match" && !loading && (
                  <motion.div
                    key="match-result"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                  >
                    <div className="font-bold text-text-primary">
                      Top Policy Recommendations
                    </div>
                    <motion.div
                      variants={staggerContainer}
                      initial="hidden"
                      animate="show"
                      className="space-y-3"
                    >
                      {result.recommended_policies?.map(
                        (p: any, i: number) => (
                          <motion.div
                            key={i}
                            variants={staggerChild}
                            whileHover={{
                              scale: 1.01,
                              y: -2,
                              boxShadow:
                                "0px 12px 30px rgba(0,0,0,0.05)",
                            }}
                            className="bg-bg-card rounded-[24px] border border-border-subtle p-4"
                            style={{ boxShadow: "var(--shadow-card)" }}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="font-semibold text-text-primary">
                                  {p.name}
                                </div>
                                <div className="text-xs text-text-subtle">
                                  {p.insurer}
                                </div>
                              </div>
                              {p.exclusion_flags?.length > 0 ? (
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-semibold">
                                  {p.exclusion_flags.length} flag
                                  {p.exclusion_flags.length > 1
                                    ? "s"
                                    : ""}
                                </span>
                              ) : (
                                <span className="text-xs bg-bg-sage-light text-accent-sage px-2 py-1 rounded-full font-semibold">
                                  No flags
                                </span>
                              )}
                            </div>
                            {p.exclusion_flags?.length > 0 && (
                              <div className="space-y-1">
                                {p.exclusion_flags.map(
                                  (flag: any, j: number) => (
                                    <div
                                      key={j}
                                      className="text-xs text-red-600 flex items-start gap-1"
                                    >
                                      <XCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                                      {flag.condition} may be excluded:
                                      &quot;{flag.exclusion}&quot;
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                          </motion.div>
                        )
                      )}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── Gap Analysis Tab ── */}
          {activeTab === "Gap Analysis" && (
            <motion.div
              key="gap-analysis"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 120, damping: 22 }}
              className="space-y-4"
            >
              <div
                className="bg-bg-card rounded-[24px] border border-border-subtle p-5 space-y-3"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <label className="text-sm font-semibold text-text-primary">
                  Select Policy to Analyze
                </label>
                <div className="relative">
                  <select
                    value={gapPolicyId || selectedPolicyId}
                    onChange={(e) => setGapPolicyId(e.target.value)}
                    className="w-full appearance-none bg-bg-alt border border-border-subtle rounded-[16px] px-4 py-2.5 text-sm text-text-primary outline-none focus:border-accent-sage transition pr-8"
                  >
                    {policies.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.user_label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-text-subtle pointer-events-none" />
                </div>
                <button
                  onClick={handleGapAnalysis}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-accent-sage hover:bg-accent-sage-dark disabled:opacity-50 text-text-on-sage font-semibold py-3 rounded-full transition"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                  {loading ? "Analyzing..." : "Analyze Coverage Gaps"}
                </button>
              </div>

              <AnimatePresence>
                {result?.type === "gap" && !loading && (
                  <motion.div
                    key="gap-result"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-bg-card rounded-[24px] border border-border-subtle p-4"
                      style={{ boxShadow: "var(--shadow-card)" }}
                    >
                      <div className="font-bold text-text-primary mb-1">
                        {result.policy_name}
                      </div>
                      <div className="text-sm text-text-subtle mb-3">
                        {result.gap_count} gaps identified ·{" "}
                        {result.high_risk_count} high risk
                      </div>
                    </motion.div>

                    <motion.div
                      variants={staggerContainer}
                      initial="hidden"
                      animate="show"
                      className="space-y-3"
                    >
                      {result.gaps?.map((gap: any, i: number) => (
                        <motion.div
                          key={i}
                          variants={staggerChild}
                          whileHover={{
                            scale: 1.01,
                            y: -2,
                          }}
                          className={`rounded-[20px] border p-4 ${
                            SEVERITY_COLORS[gap.severity] ||
                            SEVERITY_COLORS.LOW
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="font-semibold text-text-primary text-sm">
                              {gap.label}
                            </div>
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                gap.severity === "HIGH"
                                  ? "bg-red-100 text-red-700"
                                  : gap.severity === "MEDIUM"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-bg-alt text-text-subtle"
                              }`}
                            >
                              {gap.severity}
                            </span>
                          </div>
                          <p className="text-sm text-text-secondary mb-1">
                            {gap.description}
                          </p>
                          <p className="text-xs text-accent-sage font-medium">
                            {gap.recommendation}
                          </p>
                        </motion.div>
                      ))}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
