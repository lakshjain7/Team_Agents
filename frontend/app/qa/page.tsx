"use client";
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Upload, MessageSquare, Loader2, ChevronDown } from "lucide-react";
import Link from "next/link";
import { listPolicies, uploadPolicy, askQuestion } from "@/lib/api";
import AnswerCard from "@/components/AnswerCard";

const EXAMPLE_QUESTIONS = [
  "Is knee replacement surgery covered?",
  "What is my room rent limit and how does it affect other charges?",
  "Are pre-existing diseases like diabetes covered?",
  "Is AYUSH treatment covered?",
  "What happens if I am admitted to a non-network hospital?",
  "Is maternity covered? What is the waiting period?",
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
    listPolicies().then((data) => {
      setPolicies(data.policies || []);
      if (data.policies?.length > 0) setSelectedPolicyId(data.policies[0].id);
    }).catch(console.error);
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
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-8 text-sm transition">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <h1 className="text-3xl font-black text-gray-900 mb-2">Ask Your Policy</h1>
        <p className="text-gray-500 mb-6">
          Select a pre-loaded policy or upload your own. Ask any coverage question and get instant answers with hidden condition detection.
        </p>

        {/* Policy selector */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-700">Select Policy</div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition font-medium"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {uploading ? "Uploading..." : "Upload PDF"}
            </button>
            <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleUpload} className="hidden" />
          </div>

          {policies.length === 0 ? (
            <div className="text-sm text-gray-400 text-center py-4">
              No policies loaded yet. Upload a PDF or wait for startup seeder.
            </div>
          ) : (
            <div className="relative">
              <select
                value={selectedPolicyId}
                onChange={(e) => setSelectedPolicyId(e.target.value)}
                className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-purple-400 transition pr-8"
              >
                {policies.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.user_label} ({p.insurer || p.filename})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          )}

          {selectedPolicy && (
            <div className="text-xs text-gray-400">
              {selectedPolicy.chunk_count} chunks indexed · {selectedPolicy.filename}
            </div>
          )}
        </div>

        {/* Question input */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-4">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a coverage question, e.g. 'Is knee replacement surgery covered?'"
            className="w-full resize-none text-gray-800 text-base outline-none min-h-[70px] placeholder:text-gray-400"
          />
          <div className="flex items-center justify-between mt-2">
            <div className="flex gap-2 flex-wrap">
              {EXAMPLE_QUESTIONS.slice(0, 3).map((q) => (
                <button
                  key={q}
                  onClick={() => setQuestion(q)}
                  className="text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 px-2 py-1 rounded-lg transition"
                >
                  {q.slice(0, 35)}…
                </button>
              ))}
            </div>
            <button
              onClick={handleAsk}
              disabled={loading || !selectedPolicyId || !question.trim()}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
              {loading ? "Analyzing..." : "Ask"}
            </button>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Running 3-layer hybrid RAG analysis…</p>
            <p className="text-gray-400 text-xs mt-1">Checking coverage + definitions + exclusions</p>
          </div>
        )}

        {/* Answer */}
        {answer && !loading && (
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
        )}
      </div>
    </main>
  );
}
