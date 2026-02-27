"use client";
import { Building2, Users, Star, ChevronRight } from "lucide-react";

interface PolicyCardProps {
  id: string;
  name: string;
  insurer: string;
  type: string;
  premium_min?: number;
  premium_max?: number;
  match_score?: number;
  match_reasons?: string[];
  covers_maternity?: boolean;
  covers_opd?: boolean;
  covers_mental_health?: boolean;
  restoration_benefit?: boolean;
  network_hospitals?: number;
  waiting_period_preexisting_years?: number;
  onSelect?: (id: string, name: string) => void;
  onCompare?: (id: string, name: string) => void;
  isSelected?: boolean;
}

const SCORE_COLOR = (score: number) => {
  if (score >= 80) return "text-green-600 bg-green-50";
  if (score >= 60) return "text-yellow-600 bg-yellow-50";
  return "text-red-600 bg-red-50";
};

export default function PolicyCard(props: PolicyCardProps) {
  const score = props.match_score ?? 0;

  return (
    <div className={`bg-white rounded-2xl border-2 ${props.isSelected ? "border-blue-400" : "border-gray-100"} shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="font-bold text-gray-900 text-base leading-tight">{props.name}</div>
          <div className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
            <Building2 className="w-3.5 h-3.5" /> {props.insurer}
          </div>
        </div>
        {score > 0 && (
          <div className={`text-sm font-bold px-2 py-1 rounded-full ${SCORE_COLOR(score)}`}>
            {score}% match
          </div>
        )}
      </div>

      {/* Premium */}
      {props.premium_min && (
        <div className="text-sm text-gray-700">
          <span className="font-semibold">₹{props.premium_min.toLocaleString("en-IN")}</span>
          {props.premium_max && <span className="text-gray-400"> – ₹{props.premium_max.toLocaleString("en-IN")}</span>}
          <span className="text-gray-400"> /yr</span>
        </div>
      )}

      {/* Feature pills */}
      <div className="flex flex-wrap gap-1.5">
        {props.covers_maternity && <Pill label="Maternity" color="green" />}
        {props.covers_opd && <Pill label="OPD" color="blue" />}
        {props.covers_mental_health && <Pill label="Mental Health" color="purple" />}
        {props.restoration_benefit && <Pill label="Restoration" color="orange" />}
        {props.network_hospitals && props.network_hospitals >= 10000 && (
          <Pill label={`${Math.round(props.network_hospitals / 1000)}k+ Hospitals`} color="gray" />
        )}
        {props.waiting_period_preexisting_years && props.waiting_period_preexisting_years <= 2 && (
          <Pill label="2yr PED Wait" color="green" />
        )}
      </div>

      {/* Match reasons */}
      {props.match_reasons && props.match_reasons.length > 0 && (
        <ul className="text-xs text-gray-500 space-y-0.5">
          {props.match_reasons.slice(0, 3).map((r, i) => (
            <li key={i} className="flex items-start gap-1">
              <Star className="w-3 h-3 mt-0.5 text-yellow-400 flex-shrink-0" />
              {r}
            </li>
          ))}
        </ul>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        {props.onSelect && (
          <button
            onClick={() => props.onSelect!(props.id, props.name)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 rounded-xl transition flex items-center justify-center gap-1"
          >
            Ask a Question <ChevronRight className="w-4 h-4" />
          </button>
        )}
        {props.onCompare && (
          <button
            onClick={() => props.onCompare!(props.id, props.name)}
            className={`px-3 py-2 rounded-xl text-sm font-semibold border transition ${
              props.isSelected
                ? "bg-blue-100 border-blue-400 text-blue-700"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {props.isSelected ? "✓ Added" : "Compare"}
          </button>
        )}
      </div>
    </div>
  );
}

function Pill({ label, color }: { label: string; color: string }) {
  const colors: Record<string, string> = {
    green: "bg-green-100 text-green-700",
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
    orange: "bg-orange-100 text-orange-700",
    gray: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[color] || colors.gray}`}>
      {label}
    </span>
  );
}
