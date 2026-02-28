"use client";
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Upload, MessageSquare, Loader2, ChevronDown, Search, FileText, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { listPolicies, uploadPolicy, askQuestion } from "@/lib/api";
import AnswerCard from "@/components/AnswerCard";

/* ── Motion Variants ── */
const scrollReveal = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 20 },
  },
};

/* ── Data ── */
const EXAMPLE_QUESTIONS = [
  "Is knee replacement surgery covered?",
  "What is my room rent limit and how does it affect other charges?",
  "Are pre-existing diseases like diabetes covered?",
  "Is AYUSH treatment covered?",
  "What happens if I am admitted to a non-network hospital?",
  "Is maternity covered? What is the waiting period?",
];

const RAG_STAGES = [
  { icon: Search, label: "Layer 1: Semantic + Keyword", desc: "pgvector cosine + tsvector BM25 fusion" },
  { icon: FileText, label: "Layer 2: Definition Cross-Ref", desc: "Section-filtered definition search" },
  { icon: AlertTriangle, label: "Layer 3: Exclusion Scan", desc: "Targeted exclusion & condition search" },
];

export default function QAPage() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [selectedPolicyId, setSelectedPolicyId] = useState("");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [answer, setAnswer] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listPolicies()
      .then((data) => {
        setPolicies(data.policies || []);
        if (data.policies?.length > 0) setSelectedPolicyId(data.policies[0].id);
      })
      .catch(console.error);
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const data = await uploadPolicy(file);
      const refreshed = await listPolicies();
      setPolicies(refreshed.policies || []);
      setSelectedPolicyId(data.policy_id);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  }

  async function handleAsk() {
    if (!selectedPolicyId || !question.trim()) return;
    setLoading(true);
    setAnswer(null);
    try {
      const data = await askQuestion(selectedPolicyId, question);
      setAnswer(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const selectedPolicy = policies.find((p) => p.id === selectedPolicyId);

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
            Ask Your Policy
          </h1>
          <p className="text-text-secondary mb-6">
            Select a pre-loaded policy or upload your own. Ask any coverage
            question and get instant answers with hidden condition detection.
          </p>
        </motion.div>

        {/* Policy selector */}
        <motion.div
          variants={scrollReveal}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.08 }}
        >
          <div
            className="bg-bg-card rounded-[24px] border border-border-subtle p-5 mb-4 space-y-3"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-text-primary">
                Select Policy
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 text-xs bg-bg-alt hover:bg-border-default text-text-secondary px-3 py-1.5 rounded-full transition font-medium"
              >
                {uploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                {uploading ? "Uploading..." : "Upload PDF"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleUpload}
                className="hidden"
              />
            </div>

            {policies.length === 0 ? (
              <div className="text-sm text-text-subtle text-center py-4">
                No policies loaded yet. Upload a PDF or wait for startup seeder.
              </div>
            ) : (
              <div className="relative">
                <select
                  value={selectedPolicyId}
                  onChange={(e) => setSelectedPolicyId(e.target.value)}
                  className="w-full appearance-none bg-bg-alt border border-border-subtle rounded-[16px] px-4 py-2.5 text-sm text-text-primary outline-none focus:border-accent-sage transition pr-8"
                >
                  {policies.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.user_label} ({p.insurer || p.filename})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-text-subtle pointer-events-none" />
              </div>
            )}

            {selectedPolicy && (
              <div className="text-xs text-text-subtle">
                {selectedPolicy.chunk_count} chunks indexed ·{" "}
                {selectedPolicy.filename}
              </div>
            )}
          </div>
        </motion.div>

        {/* Question input */}
        <motion.div
          variants={scrollReveal}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.15 }}
        >
          <div
            className="bg-bg-card rounded-[24px] border border-border-subtle p-5 mb-4"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a coverage question, e.g. 'Is knee replacement surgery covered?'"
              className="w-full resize-none bg-transparent text-text-primary text-base outline-none min-h-[70px] placeholder:text-text-subtle"
            />
            <div className="flex items-center justify-between mt-2">
              <div className="flex gap-2 flex-wrap">
                {EXAMPLE_QUESTIONS.slice(0, 3).map((q) => (
                  <button
                    key={q}
                    onClick={() => setQuestion(q)}
                    className="text-xs bg-bg-sage-light/50 hover:bg-bg-sage-light text-accent-sage px-2.5 py-1 rounded-full transition"
                  >
                    {q.slice(0, 35)}…
                  </button>
                ))}
              </div>
              <button
                onClick={handleAsk}
                disabled={loading || !selectedPolicyId || !question.trim()}
                className="flex items-center gap-2 bg-accent-sage hover:bg-accent-sage-dark disabled:opacity-50 text-text-on-sage text-sm font-semibold px-5 py-2.5 rounded-full transition"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MessageSquare className="w-4 h-4" />
                )}
                {loading ? "Analyzing..." : "Ask"}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Enhanced loading state — 3-layer pipeline visualization */}
        <AnimatePresence>
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-bg-card rounded-[24px] border border-border-subtle p-6"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="flex items-center gap-3 mb-5">
                <Loader2 className="w-5 h-5 animate-spin text-accent-sage" />
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    Running 3-layer hybrid RAG analysis…
                  </p>
                  <p className="text-xs text-text-subtle">
                    Cross-referencing definitions, exclusions &amp; conditions
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {RAG_STAGES.map((stage, i) => {
                  const Icon = stage.icon;
                  return (
                    <motion.div
                      key={stage.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.15 }}
                      className="bg-bg-alt rounded-[16px] p-3"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-3.5 h-3.5 text-accent-sage" />
                        <span className="text-[11px] font-bold text-text-primary">
                          {stage.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-text-subtle leading-snug">
                        {stage.desc}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state — before any question */}
        {!answer && !loading && (
          <motion.div
            variants={scrollReveal}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.25 }}
            className="mt-6"
          >
            <div className="text-xs font-semibold text-text-subtle uppercase tracking-wider mb-3">
              What Happens When You Ask
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {RAG_STAGES.map((stage) => {
                const Icon = stage.icon;
                return (
                  <div
                    key={stage.label}
                    className="bg-bg-card border border-border-subtle rounded-[20px] p-4 text-center"
                    style={{ boxShadow: "var(--shadow-card)" }}
                  >
                    <div className="w-9 h-9 bg-bg-sage-light rounded-xl mx-auto mb-2 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-accent-sage" />
                    </div>
                    <div className="text-xs font-bold text-text-primary mb-0.5">
                      {stage.label}
                    </div>
                    <div className="text-[11px] text-text-subtle leading-snug">
                      {stage.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Answer */}
        <AnimatePresence mode="wait">
          {answer && !loading && (
            <motion.div
              key="answer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              className="mt-6"
            >
              <AnswerCard
                verdict={answer.verdict}
                practical_claimability={answer.practical_claimability}
                confidence={answer.confidence}
                plain_answer={answer.plain_answer}
                conditions={answer.conditions}
                hidden_conditions={answer.hidden_conditions}
                citations={answer.citations}
                recommendation={answer.recommendation}
                question={answer.question}
                policy_name={answer.policy_name}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
