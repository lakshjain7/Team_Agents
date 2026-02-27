"use client";
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Upload, FileText, Loader2, ChevronDown, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { listPolicies, claimCheck, extractConditions, extractConditionsFromFile, matchConditions, gapAnalysis } from "@/lib/api";

const TABS = ["Claim Check", "Medical Matching", "Gap Analysis"] as const;
type Tab = typeof TABS[number];

const SCORE_COLOR = (score: number) => {
  if (score >= 75) return "text-green-600";
  if (score >= 45) return "text-yellow-600";
  return "text-red-600";
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
    listPolicies().then((data) => {
      setPolicies(data.policies || []);
      if (data.policies?.length > 0) setSelectedPolicyId(data.policies[0].id);
    }).catch(console.error);
  }, []);

  async function handleClaimCheck() {
    if (!selectedPolicyId || !diagnosis.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await claimCheck(selectedPolicyId, diagnosis, treatmentType);
      setResult({ type: "claim", ...data });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleExtract() {
    if (!medicalText.trim()) return;
    setLoading(true);
    try {
      const data = await extractConditions(medicalText);
      setConditions(data.conditions || []);
      setResult({ type: "conditions", ...data });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleMatchConditions() {
    if (!conditions.length) return;
    setLoading(true);
    try {
      const data = await matchConditions(conditions);
      setResult({ type: "match", ...data });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleGapAnalysis() {
    const pid = gapPolicyId || selectedPolicyId;
    if (!pid) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await gapAnalysis(pid);
      setResult({ type: "gap", ...data });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleMedicalFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const data = await extractConditionsFromFile(file);
      setConditions(data.conditions || []);
      setResult({ type: "conditions", ...data });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-8 text-sm transition">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <h1 className="text-3xl font-black text-gray-900 mb-2">Claim & Health Analysis</h1>
        <p className="text-gray-500 mb-6">Check claim eligibility, match your health profile to policies, or analyze coverage gaps.</p>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setResult(null); }}
              className={`flex-1 text-sm font-semibold py-2 rounded-lg transition ${activeTab === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── Claim Check Tab ── */}
        {activeTab === "Claim Check" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
              <label className="text-sm font-semibold text-gray-700">Select Policy</label>
              <div className="relative">
                <select
                  value={selectedPolicyId}
                  onChange={(e) => setSelectedPolicyId(e.target.value)}
                  className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-green-400 transition pr-8"
                >
                  {policies.map((p) => (
                    <option key={p.id} value={p.id}>{p.user_label} — {p.insurer || p.filename}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              <label className="text-sm font-semibold text-gray-700">Diagnosis / Condition</label>
              <textarea
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="e.g. Type 2 Diabetes, hospitalization for insulin adjustment and monitoring..."
                className="w-full resize-none text-gray-800 text-sm bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none min-h-[70px] focus:border-green-400 transition"
              />
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-gray-700">Treatment Type:</label>
                <select
                  value={treatmentType}
                  onChange={(e) => setTreatmentType(e.target.value)}
                  className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 outline-none"
                >
                  {["hospitalization", "surgery", "maternity", "opd", "critical_illness"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleClaimCheck}
                disabled={loading || !selectedPolicyId || !diagnosis.trim()}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                {loading ? "Analyzing claim..." : "Check Claim Eligibility"}
              </button>
            </div>

            {result?.type === "claim" && !loading && (
              <div className="space-y-4">
                {/* Feasibility score */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-bold text-gray-900">Claim Feasibility Score</div>
                    <div className={`text-3xl font-black ${SCORE_COLOR(result.claim_feasibility_score)}`}>
                      {result.claim_feasibility_score}/100
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                    <div
                      className={`h-3 rounded-full ${result.claim_feasibility_score >= 75 ? "bg-green-500" : result.claim_feasibility_score >= 45 ? "bg-yellow-500" : "bg-red-500"}`}
                      style={{ width: `${result.claim_feasibility_score}%` }}
                    />
                  </div>
                  <p className="text-gray-700 text-sm">{result.plain_answer}</p>
                </div>

                {/* Hidden conditions */}
                {result.hidden_conditions?.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <div className="font-bold text-red-700 flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4" /> {result.hidden_conditions.length} Hidden Conditions
                    </div>
                    <div className="space-y-2">
                      {result.hidden_conditions.map((hc: any, i: number) => (
                        <div key={i} className="border border-red-100 bg-red-50 rounded-xl p-3">
                          <p className="text-sm font-semibold text-red-800">{hc.description}</p>
                          <p className="text-xs text-red-600 mt-1">Impact: {hc.impact}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Required documents */}
                {result.required_documents?.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <div className="font-bold text-gray-900 mb-3">Required Documents</div>
                    <ul className="space-y-1.5">
                      {result.required_documents.map((doc: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" /> {doc}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.recommendation && (
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                    <div className="text-xs font-bold text-blue-700 mb-1">Recommendation</div>
                    <p className="text-sm text-blue-900">{result.recommendation}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Medical Matching Tab ── */}
        {activeTab === "Medical Matching" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
              <label className="text-sm font-semibold text-gray-700">Describe your health conditions</label>
              <textarea
                value={medicalText}
                onChange={(e) => setMedicalText(e.target.value)}
                placeholder="e.g. I have Type 2 Diabetes since 2018, mild hypertension, and a history of kidney stones..."
                className="w-full resize-none text-gray-800 text-sm bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none min-h-[80px] focus:border-green-400 transition"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleExtract}
                  disabled={loading || !medicalText.trim()}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition text-sm"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Extract Conditions
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold py-2.5 px-4 rounded-xl transition text-sm"
                >
                  <Upload className="w-4 h-4" /> Upload Report
                </button>
                <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleMedicalFileUpload} className="hidden" />
              </div>
            </div>

            {conditions.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="font-semibold text-gray-800 mb-3">Extracted Conditions ({conditions.length})</div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {conditions.map((c: any, i: number) => (
                    <span key={i} className="text-sm bg-orange-50 border border-orange-200 text-orange-800 px-3 py-1 rounded-full">
                      {c.name}
                    </span>
                  ))}
                </div>
                <button
                  onClick={handleMatchConditions}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition text-sm"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Find Suitable Policies
                </button>
              </div>
            )}

            {result?.type === "match" && !loading && (
              <div className="space-y-3">
                <div className="font-bold text-gray-900">Top Policy Recommendations</div>
                {result.recommended_policies?.map((p: any, i: number) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-semibold text-gray-900">{p.name}</div>
                        <div className="text-xs text-gray-500">{p.insurer}</div>
                      </div>
                      {p.exclusion_flags?.length > 0 ? (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-semibold">
                          {p.exclusion_flags.length} flag{p.exclusion_flags.length > 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">No flags</span>
                      )}
                    </div>
                    {p.exclusion_flags?.length > 0 && (
                      <div className="space-y-1">
                        {p.exclusion_flags.map((flag: any, j: number) => (
                          <div key={j} className="text-xs text-red-600 flex items-start gap-1">
                            <XCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                            {flag.condition} may be excluded: &quot;{flag.exclusion}&quot;
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Gap Analysis Tab ── */}
        {activeTab === "Gap Analysis" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
              <label className="text-sm font-semibold text-gray-700">Select Policy to Analyze</label>
              <div className="relative">
                <select
                  value={gapPolicyId || selectedPolicyId}
                  onChange={(e) => setGapPolicyId(e.target.value)}
                  className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-green-400 transition pr-8"
                >
                  {policies.map((p) => (
                    <option key={p.id} value={p.id}>{p.user_label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              <button
                onClick={handleGapAnalysis}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                {loading ? "Analyzing..." : "Analyze Coverage Gaps"}
              </button>
            </div>

            {result?.type === "gap" && !loading && (
              <div className="space-y-3">
                <div className="bg-white rounded-2xl border border-gray-200 p-4">
                  <div className="font-bold text-gray-900 mb-1">{result.policy_name}</div>
                  <div className="text-sm text-gray-500 mb-3">
                    {result.gap_count} gaps identified · {result.high_risk_count} high risk
                  </div>
                </div>
                {result.gaps?.map((gap: any, i: number) => (
                  <div key={i} className={`rounded-2xl border p-4 ${SEVERITY_COLORS[gap.severity] || SEVERITY_COLORS.LOW}`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-semibold text-gray-900 text-sm">{gap.label}</div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        gap.severity === "HIGH" ? "bg-red-100 text-red-700" :
                        gap.severity === "MEDIUM" ? "bg-yellow-100 text-yellow-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>{gap.severity}</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-1">{gap.description}</p>
                    <p className="text-xs text-blue-700 font-medium">{gap.recommendation}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
