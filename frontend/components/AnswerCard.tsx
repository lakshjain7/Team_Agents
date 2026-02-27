"use client";
import { AlertTriangle, CheckCircle, XCircle, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface HiddenCondition {
  type: string;
  description: string;
  impact: string;
}

interface Citation {
  text: string;
  page: number;
  section: string;
}

interface AnswerCardProps {
  verdict: "COVERED" | "NOT_COVERED" | "PARTIALLY_COVERED" | "AMBIGUOUS";
  practical_claimability: "GREEN" | "AMBER" | "RED";
  confidence: number;
  plain_answer: string;
  conditions: string[];
  hidden_conditions: HiddenCondition[];
  citations: Citation[];
  recommendation: string;
  question?: string;
  policy_name?: string;
}

const VERDICT_CONFIG = {
  COVERED: { label: "Covered", icon: CheckCircle, bg: "bg-green-50", border: "border-green-200", text: "text-green-700", badge: "bg-green-100 text-green-800" },
  NOT_COVERED: { label: "Not Covered", icon: XCircle, bg: "bg-red-50", border: "border-red-200", text: "text-red-700", badge: "bg-red-100 text-red-800" },
  PARTIALLY_COVERED: { label: "Partially Covered", icon: AlertTriangle, bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700", badge: "bg-yellow-100 text-yellow-800" },
  AMBIGUOUS: { label: "Ambiguous", icon: HelpCircle, bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-700", badge: "bg-gray-100 text-gray-800" },
};

const CLAIMABILITY_CONFIG = {
  GREEN: { label: "Easy to claim", color: "bg-green-500", text: "text-green-700" },
  AMBER: { label: "Conditions apply", color: "bg-yellow-500", text: "text-yellow-700" },
  RED: { label: "Likely denied", color: "bg-red-500", text: "text-red-700" },
};

const HIDDEN_TYPE_LABELS: Record<string, string> = {
  room_rent_trap: "Room Rent Trap",
  pre_auth_required: "Pre-Authorization Required",
  proportional_deduction: "Proportional Deduction",
  definition_trap: "Definition Trap",
  waiting_period: "Waiting Period",
  sub_limit: "Sub-Limit Cap",
  documentation: "Documentation Requirement",
  network_restriction: "Network Restriction",
};

export default function AnswerCard(props: AnswerCardProps) {
  const [showCitations, setShowCitations] = useState(false);
  const cfg = VERDICT_CONFIG[props.verdict] || VERDICT_CONFIG.AMBIGUOUS;
  const claimCfg = CLAIMABILITY_CONFIG[props.practical_claimability] || CLAIMABILITY_CONFIG.AMBER;
  const Icon = cfg.icon;

  return (
    <div className={`rounded-2xl border-2 ${cfg.border} ${cfg.bg} p-6 space-y-5`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Icon className={`w-8 h-8 ${cfg.text}`} />
          <div>
            <div className={`text-xl font-bold ${cfg.text}`}>{cfg.label}</div>
            {props.policy_name && (
              <div className="text-sm text-gray-500">{props.policy_name}</div>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${claimCfg.text} border`}>
            {claimCfg.label}
          </div>
          <div className="text-xs text-gray-500">Confidence: {props.confidence}%</div>
        </div>
      </div>

      {/* Confidence bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${claimCfg.color}`}
          style={{ width: `${props.confidence}%` }}
        />
      </div>

      {/* Plain answer */}
      <p className="text-gray-800 text-base leading-relaxed">{props.plain_answer}</p>

      {/* Conditions */}
      {props.conditions && props.conditions.length > 0 && (
        <div>
          <div className="text-sm font-semibold text-gray-700 mb-2">Conditions that apply:</div>
          <ul className="space-y-1">
            {props.conditions.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="mt-0.5 text-yellow-500">•</span> {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Hidden Conditions */}
      {props.hidden_conditions && props.hidden_conditions.length > 0 && (
        <div>
          <div className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" />
            Hidden Conditions Detected ({props.hidden_conditions.length})
          </div>
          <div className="space-y-2">
            {props.hidden_conditions.map((hc, i) => (
              <div key={i} className="bg-white border border-red-100 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                    {HIDDEN_TYPE_LABELS[hc.type] || hc.type}
                  </span>
                </div>
                <p className="text-sm text-gray-800">{hc.description}</p>
                <p className="text-xs text-red-600 mt-1 font-medium">Impact: {hc.impact}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendation */}
      {props.recommendation && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
          <div className="text-xs font-bold text-blue-700 mb-1">Recommended Action</div>
          <p className="text-sm text-blue-900">{props.recommendation}</p>
        </div>
      )}

      {/* Citations toggle */}
      {props.citations && props.citations.length > 0 && (
        <div>
          <button
            onClick={() => setShowCitations(!showCitations)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition"
          >
            {showCitations ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showCitations ? "Hide" : "Show"} {props.citations.length} citation{props.citations.length > 1 ? "s" : ""}
          </button>
          {showCitations && (
            <div className="mt-2 space-y-2">
              {props.citations.map((c, i) => (
                <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">
                    Page {c.page} — {c.section}
                  </div>
                  <p className="text-sm text-gray-700 italic">"{c.text}"</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
