import Link from "next/link";
import { Search, MessageSquare, FileText, Shield } from "lucide-react";

const MODES = [
  {
    href: "/discover",
    icon: Search,
    title: "Find the Right Policy",
    subtitle: "Discovery & Comparison",
    description: "Tell us your health needs and budget. We'll find and compare the best-fit policies for you.",
    color: "from-blue-500 to-blue-600",
    examples: ["I need maternity coverage, budget ₹18k/year", "Compare top family floater plans"],
  },
  {
    href: "/qa",
    icon: MessageSquare,
    title: "Ask Your Policy",
    subtitle: "Coverage Q&A",
    description: "Upload your policy PDF. Ask any coverage question. Get answers with citations and hidden trap detection.",
    color: "from-purple-500 to-purple-600",
    examples: ["Is knee replacement surgery covered?", "What is my room rent limit?"],
  },
  {
    href: "/claim",
    icon: FileText,
    title: "Check a Claim",
    subtitle: "Claim Advisory",
    description: "Enter your diagnosis or upload a medical report. Know your claim eligibility before going to hospital.",
    color: "from-green-500 to-green-600",
    examples: ["Type 2 diabetes hospitalization", "Cataract surgery coverage?"],
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-5xl mx-auto px-4 pt-16 pb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Shield className="w-8 h-8 text-blue-600" />
          <span className="text-2xl font-black text-blue-700">PolicyAI</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 leading-tight">
          Your Health Insurance,{" "}
          <span className="text-blue-600">Simplified</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-3">
          68% of claim rejections happen because policyholders didn&apos;t understand their coverage.
          PolicyAI reads every page of your policy — including the hidden traps — so you don&apos;t have to.
        </p>
        <div className="text-sm text-gray-400">
          Powered by real policy documents from 10 major Indian insurers
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-6">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            return (
              <Link
                key={mode.href}
                href={mode.href}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all p-6 flex flex-col gap-4"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mode.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                    {mode.subtitle}
                  </div>
                  <div className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-700 transition">
                    {mode.title}
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">{mode.description}</p>
                </div>
                <div className="mt-auto">
                  <div className="text-xs text-gray-400 mb-1">Try:</div>
                  {mode.examples.map((ex, i) => (
                    <div key={i} className="text-xs bg-gray-50 border border-gray-100 rounded-lg px-2 py-1 mb-1 text-gray-600 italic">
                      &quot;{ex}&quot;
                    </div>
                  ))}
                </div>
                <div className={`text-sm font-semibold bg-gradient-to-r ${mode.color} bg-clip-text text-transparent`}>
                  Get Started →
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            { num: "30+", label: "Real Policy PDFs" },
            { num: "10", label: "Major Insurers" },
            { num: "8", label: "Hidden Trap Types Detected" },
            { num: "3-Layer", label: "Hybrid RAG Pipeline" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="text-2xl font-black text-blue-600">{stat.num}</div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
