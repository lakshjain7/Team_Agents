"use client";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ── Types ── */
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

/* ── Config maps ── */
const VERDICT_CONFIG = {
  COVERED: {
    label: "Covered",
    icon: CheckCircle,
    bg: "bg-bg-sage-light/40",
    border: "border-accent-sage/30",
    text: "text-accent-sage-dark",
    badge: "bg-bg-sage-light text-accent-sage-dark",
  },
  NOT_COVERED: {
    label: "Not Covered",
    icon: XCircle,
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    badge: "bg-red-100 text-red-800",
  },
  PARTIALLY_COVERED: {
    label: "Partially Covered",
    icon: AlertTriangle,
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    text: "text-yellow-700",
    badge: "bg-yellow-100 text-yellow-800",
  },
  AMBIGUOUS: {
    label: "Ambiguous",
    icon: HelpCircle,
    bg: "bg-bg-alt",
    border: "border-border-subtle",
    text: "text-text-secondary",
    badge: "bg-bg-alt text-text-secondary",
  },
};

const CLAIMABILITY_CONFIG = {
  GREEN: {
    label: "Easy to claim",
    color: "bg-green-500",
    text: "text-green-700",
  },
  AMBER: {
    label: "Conditions apply",
    color: "bg-yellow-500",
    text: "text-yellow-700",
  },
  RED: {
    label: "Likely denied",
    color: "bg-red-500",
    text: "text-red-700",
  },
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

/* ── Motion Variants ── */
const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const staggerChild = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 120, damping: 20 },
  },
};

/* ── Component ── */
export default function AnswerCard(props: AnswerCardProps) {
  const [showCitations, setShowCitations] = useState(false);
  const cfg = VERDICT_CONFIG[props.verdict] || VERDICT_CONFIG.AMBIGUOUS;
  const claimCfg =
    CLAIMABILITY_CONFIG[props.practical_claimability] ||
    CLAIMABILITY_CONFIG.AMBER;
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className={`rounded-[24px] border-2 ${cfg.border} ${cfg.bg} p-6 space-y-5`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Icon className={`w-8 h-8 ${cfg.text}`} />
          <div>
            <div className={`text-xl font-bold ${cfg.text}`}>{cfg.label}</div>
            {props.policy_name && (
              <div className="text-sm text-text-subtle">
                {props.policy_name}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div
            className={`px-3 py-1 rounded-full text-sm font-semibold ${claimCfg.text} border`}
          >
            {claimCfg.label}
          </div>
          <div className="text-xs text-text-subtle">
            Confidence: {props.confidence}%
          </div>
        </div>
      </div>

      {/* Confidence bar — animated width */}
      <div className="w-full bg-bg-alt rounded-full h-2 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${props.confidence}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
          className={`h-2 rounded-full ${claimCfg.color}`}
        />
      </div>

      {/* Plain answer */}
      <p className="text-text-primary text-base leading-relaxed">
        {props.plain_answer}
      </p>

      {/* Conditions */}
      {props.conditions && props.conditions.length > 0 && (
        <div>
          <div className="text-sm font-semibold text-text-primary mb-2">
            Conditions that apply:
          </div>
          <ul className="space-y-1">
            {props.conditions.map((c, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-text-secondary"
              >
                <span className="mt-0.5 text-yellow-500">•</span> {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Hidden Conditions — staggered entrance */}
      {props.hidden_conditions && props.hidden_conditions.length > 0 && (
        <div>
          <div className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" />
            Hidden Conditions Detected ({props.hidden_conditions.length})
          </div>
          <motion.div
            className="space-y-2"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            {props.hidden_conditions.map((hc, i) => (
              <motion.div
                key={i}
                variants={staggerChild}
                className="bg-bg-card border border-red-100 rounded-[16px] p-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                    {HIDDEN_TYPE_LABELS[hc.type] || hc.type}
                  </span>
                </div>
                <p className="text-sm text-text-primary">{hc.description}</p>
                <p className="text-xs text-red-600 mt-1 font-medium">
                  Impact: {hc.impact}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

      {/* Recommendation */}
      {props.recommendation && (
        <div className="bg-bg-sage-light/40 border border-accent-sage/20 rounded-[16px] p-3">
          <div className="text-xs font-bold text-accent-sage mb-1">
            Recommended Action
          </div>
          <p className="text-sm text-text-primary">{props.recommendation}</p>
        </div>
      )}

      {/* Citations — smooth accordion */}
      {props.citations && props.citations.length > 0 && (
        <div>
          <button
            onClick={() => setShowCitations(!showCitations)}
            className="flex items-center gap-1 text-sm text-text-subtle hover:text-text-primary transition"
          >
            {showCitations ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            {showCitations ? "Hide" : "Show"} {props.citations.length}{" "}
            citation{props.citations.length > 1 ? "s" : ""}
          </button>
          <AnimatePresence>
            {showCitations && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="mt-2 space-y-2">
                  {props.citations.map((c, i) => (
                    <div
                      key={i}
                      className="bg-bg-alt border border-border-subtle rounded-[12px] p-3"
                    >
                      <div className="text-xs text-text-subtle mb-1">
                        Page {c.page} — {c.section}
                      </div>
                      <p className="text-sm text-text-secondary italic">
                        &ldquo;{c.text}&rdquo;
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
