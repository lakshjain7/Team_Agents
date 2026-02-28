"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield, Search, MessageSquare, FileText, AlertTriangle,
  BarChart2, Scan, ArrowRight, Database, Zap,
} from "lucide-react";
import HeroCarousel from "@/components/ui/HeroCarousel";

/* ── Motion Variants ───────────────────────────────────────────── */

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

/* ── Data (100 % from README — zero fictional content) ─────────── */

const MODES = [
  {
    href: "/discover",
    icon: Search,
    color: "bg-accent-sage",
    title: "Find the Right Policy",
    subtitle: "Discovery & Comparison",
    description:
      "Tell us your health needs and budget. GPT-4o-mini extracts structured requirements and PolicyRanker scores all catalog policies by budget fit, coverage match, PED wait, and exclusion risk.",
    examples: [
      "I need maternity coverage, budget ₹18k/year",
      "Compare top family floater plans",
    ],
  },
  {
    href: "/qa",
    icon: MessageSquare,
    color: "bg-dark",
    title: "Ask Your Policy",
    subtitle: "Coverage Q&A + Hidden Traps",
    description:
      "Upload your policy PDF. Ask any coverage question. Our 3-layer hybrid RAG pipeline cross-references definitions, exclusions, and conditions — detecting 8 types of hidden traps.",
    examples: [
      "Is knee replacement surgery covered?",
      "What is my room rent limit?",
    ],
  },
  {
    href: "/claim",
    icon: FileText,
    color: "bg-accent-sage",
    title: "Check a Claim",
    subtitle: "Claim Advisory + Gap Analysis",
    description:
      "Enter your diagnosis or upload a medical report. Get a Claim Feasibility Score, required document checklist, and coverage gap analysis — before you go to the hospital.",
    examples: [
      "Type 2 diabetes hospitalization",
      "Cataract surgery coverage?",
    ],
  },
];

const HIDDEN_TRAPS = [
  { type: "Room Rent Trap", desc: "Room rent cap causes ALL charges to be proportionally reduced" },
  { type: "Pre-Auth Required", desc: "Missing pre-authorization → entire claim denied" },
  { type: "Proportional Deduction", desc: "Sub-limit breach cuts your entire bill proportionally" },
  { type: "Definition Trap", desc: "Key terms defined narrowly (e.g. 'Hospitalization' = 24+ hrs only)" },
  { type: "Waiting Period", desc: "Specific illness or PED waiting period still applies" },
  { type: "Sub-Limit Cap", desc: "Hidden cap on specific treatments within broad coverage" },
  { type: "Documentation", desc: "Non-obvious or time-sensitive document requirements" },
  { type: "Network Restriction", desc: "Non-network hospital means co-pay or full exclusion" },
];

const STATS = [
  { num: "30+", label: "Real Policy PDFs Indexed" },
  { num: "10", label: "Major Indian Insurers" },
  { num: "8", label: "Hidden Trap Types Detected" },
  { num: "3-Layer", label: "Hybrid RAG Pipeline" },
];

const PIPELINE_LAYERS = [
  {
    icon: Search,
    step: "01",
    title: "Semantic + Keyword Fusion",
    desc: "pgvector cosine similarity + tsvector BM25 keyword search merged via Reciprocal Rank Fusion (k=60)",
  },
  {
    icon: FileText,
    step: "02",
    title: "Definition Cross-Reference",
    desc: "Section-filtered semantic search over definitions to catch narrow term interpretations",
  },
  {
    icon: AlertTriangle,
    step: "03",
    title: "Exclusion & Condition Scan",
    desc: "Targeted search across exclusions, conditions, limits, and waiting period sections",
  },
];

const PROCESSING_FLOW = [
  { icon: FileText, label: "Upload PDF" },
  { icon: Database, label: "Chunk & Embed" },
  { icon: Search, label: "3-Layer RAG" },
  { icon: Zap, label: "GPT-4o Analysis" },
  { icon: Shield, label: "Cited Verdict" },
];

const SCORING_DIMS = [
  "Budget Fit",
  "Coverage Match",
  "PED Wait Period",
  "Exclusion Risk",
  "Network Size",
];

const COVERAGE_AREAS = [
  "Room Rent",
  "ICU Limits",
  "Pre/Post Hospitalization",
  "Day Care",
  "Ambulance",
  "Maternity",
  "Mental Health",
];

/* ── Component ─────────────────────────────────────────────────── */

export default function Home() {
  return (
    <main className="min-h-screen bg-bg-base">
      {/* ─── Navbar ─── */}
      <header className="sticky top-0 z-50 bg-bg-base/90 backdrop-blur-md border-b border-border-subtle">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-accent-sage" />
            <span className="text-lg font-extrabold text-text-primary tracking-tight">
              PolicyAI
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Features</a>
            <a href="#pipeline" className="text-sm text-text-secondary hover:text-text-primary transition-colors">How It Works</a>
            <a href="#traps" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Hidden Traps</a>
          </nav>

          <Link
            href="/discover"
            className="hidden sm:inline-flex items-center gap-2 bg-dark text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-dark-hover transition"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="px-4 sm:px-6 lg:px-8 pt-20 pb-10">
        <div className="max-w-[1200px] mx-auto">
          <motion.div
            variants={scrollReveal}
            initial="hidden"
            animate="visible"
            className="text-center max-w-3xl mx-auto"
          >
            {/* Floating pill badge */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-bg-sage-light text-accent-sage text-xs font-semibold mb-6"
            >
              <Shield className="w-3.5 h-3.5" />
              AI-Powered Insurance Intelligence
            </motion.div>

            <h1
              className="text-text-primary font-extrabold leading-[1.05] tracking-tight mb-6"
              style={{ fontSize: "clamp(36px, 5.5vw, 64px)" }}
            >
              Your Health Insurance,
              <br />
              <span className="text-accent-sage">Simplified</span>
            </h1>

            <p className="text-text-secondary text-lg leading-relaxed max-w-xl mx-auto mb-4">
              68% of claim rejections happen because policyholders didn&apos;t
              understand their coverage. PolicyAI reads every page of your
              policy&nbsp;&mdash; including the hidden traps&nbsp;&mdash; so you
              don&apos;t have to.
            </p>

            <p className="text-text-subtle text-sm mb-10">
              Powered by real policy documents from 10 major Indian insurers
            </p>

            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link
                href="/discover"
                className="inline-flex items-center gap-2 bg-accent-sage hover:bg-accent-sage-dark text-text-on-sage px-6 py-3 rounded-full text-sm font-semibold transition"
              >
                <Search className="w-4 h-4" /> Find a Policy
              </Link>
              <Link
                href="/qa"
                className="inline-flex items-center gap-2 bg-dark hover:bg-dark-hover text-white px-6 py-3 rounded-full text-sm font-semibold transition"
              >
                <MessageSquare className="w-4 h-4" /> Ask Your Policy
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Hero Carousel ─── */}
      <HeroCarousel />

      {/* ─── Processing Flow Strip ─── */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16 pt-4">
        <div className="max-w-[1200px] mx-auto">
          <motion.div
            variants={scrollReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            <div
              className="bg-bg-card border border-border-subtle rounded-[24px] p-5 flex items-center justify-between gap-2 overflow-x-auto"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              {PROCESSING_FLOW.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={step.label} className="flex items-center gap-2 min-w-0">
                    <div className="flex items-center gap-2.5 min-w-fit">
                      <div className="w-8 h-8 bg-bg-sage-light rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-accent-sage" />
                      </div>
                      <span className="text-xs font-bold text-text-primary whitespace-nowrap">
                        {step.label}
                      </span>
                    </div>
                    {i < PROCESSING_FLOW.length - 1 && (
                      <ArrowRight className="w-4 h-4 text-text-subtle/40 flex-shrink-0 mx-1" />
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Three Mode Cards ─── */}
      <section id="features" className="px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-[1200px] mx-auto">
          <motion.div
            className="grid md:grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
          >
            {MODES.map((mode) => {
              const Icon = mode.icon;
              return (
                <motion.div
                  key={mode.href}
                  variants={staggerChild}
                  whileHover={{
                    scale: 1.015,
                    y: -4,
                    boxShadow: "0px 12px 30px rgba(0,0,0,0.05)",
                  }}
                >
                  <Link
                    href={mode.href}
                    className="group bg-bg-card border border-border-subtle rounded-[24px] p-7 flex flex-col gap-5 h-full transition-colors"
                    style={{ boxShadow: "var(--shadow-card)" }}
                  >
                    <div
                      className={`w-12 h-12 ${mode.color} rounded-2xl flex items-center justify-center`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-text-subtle uppercase tracking-wider mb-1.5">
                        {mode.subtitle}
                      </div>
                      <div className="text-xl font-bold text-text-primary mb-2 group-hover:text-accent-sage transition-colors">
                        {mode.title}
                      </div>
                      <p className="text-sm text-text-secondary leading-relaxed">
                        {mode.description}
                      </p>
                    </div>

                    <div className="mt-auto pt-2">
                      <div className="text-xs text-text-subtle mb-1.5">Try:</div>
                      {mode.examples.map((ex, j) => (
                        <div
                          key={j}
                          className="text-xs bg-bg-alt border border-border-subtle rounded-[12px] px-3 py-1.5 mb-1.5 text-text-secondary italic"
                        >
                          &quot;{ex}&quot;
                        </div>
                      ))}
                    </div>

                    <div className="text-sm font-semibold text-accent-sage flex items-center gap-1">
                      Get Started <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ─── Stats Bar ─── */}
      <section className="px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-[1200px] mx-auto">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
          >
            {STATS.map((stat) => (
              <motion.div
                key={stat.label}
                variants={staggerChild}
                whileHover={{
                  scale: 1.015,
                  y: -4,
                  boxShadow: "0px 12px 30px rgba(0,0,0,0.05)",
                }}
                className="bg-bg-card border border-border-subtle rounded-[24px] p-6 text-center cursor-default"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div className="text-2xl font-extrabold text-accent-sage mb-1">
                  {stat.num}
                </div>
                <div className="text-xs text-text-subtle">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── 3-Layer RAG Pipeline ─── */}
      <section id="pipeline" className="bg-bg-sage px-4 sm:px-6 lg:px-8 py-24">
        <div className="max-w-[1200px] mx-auto">
          <motion.div
            variants={scrollReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="text-center mb-14"
          >
            <h2 className="text-4xl font-extrabold text-text-on-sage leading-tight mb-4">
              3-Layer Hybrid RAG Pipeline
            </h2>
            <p className="text-bg-sage-light/80 text-base max-w-xl mx-auto">
              Every question triggers a multi-layer retrieval process that
              cross-references definitions, exclusions, and conditions — catching
              traps a single search would miss.
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
          >
            {PIPELINE_LAYERS.map((layer) => {
              const Icon = layer.icon;
              return (
                <motion.div
                  key={layer.title}
                  variants={staggerChild}
                  whileHover={{ scale: 1.015, y: -4 }}
                  className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-[24px] p-7 relative"
                >
                  <div className="absolute top-5 right-5 text-3xl font-extrabold text-white/10 leading-none select-none">
                    {layer.step}
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-text-on-sage" />
                  </div>
                  <h3 className="text-base font-bold text-text-on-sage mb-2">
                    {layer.title}
                  </h3>
                  <p className="text-sm text-bg-sage-light/70 leading-relaxed">
                    {layer.desc}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ─── Bento: Full Platform Features ─── */}
      <section className="px-4 sm:px-6 lg:px-8 py-24">
        <div className="max-w-[1200px] mx-auto">
          <motion.div
            variants={scrollReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="text-center mb-14"
          >
            <h2 className="text-4xl font-extrabold text-text-primary leading-tight mb-4">
              Full Insurance Lifecycle Coverage
            </h2>
            <p className="text-text-secondary text-base max-w-xl mx-auto">
              From finding the right policy to filing a successful claim — every
              step powered by AI.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-12 gap-5"
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
          >
            {/* Discovery — large card, spans 2 rows */}
            <motion.div
              variants={staggerChild}
              whileHover={{
                scale: 1.01,
                y: -3,
                boxShadow: "0px 12px 30px rgba(0,0,0,0.05)",
              }}
              className="md:col-span-7 md:row-span-2"
            >
              <Link
                href="/discover"
                className="block bg-bg-card border border-border-subtle rounded-[24px] p-8 h-full transition-colors"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-bg-sage-light rounded-2xl flex items-center justify-center">
                    <Search className="w-5 h-5 text-accent-sage" />
                  </div>
                  <span className="text-xs font-semibold text-text-subtle uppercase tracking-wider">
                    Discovery &amp; Comparison
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-text-primary mb-3">
                  Natural Language Policy Discovery
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed mb-5">
                  Describe your needs in plain English. GPT-4o-mini extracts
                  structured requirements (needs, budget, conditions, policy
                  type). PolicyRanker scores all catalog policies across 5
                  dimensions.
                </p>
                <div className="flex flex-wrap gap-2 mb-5">
                  <span className="text-xs bg-bg-sage-light text-accent-sage px-3 py-1 rounded-full font-medium">
                    19-Dimension Comparison
                  </span>
                  <span className="text-xs bg-bg-sage-light text-accent-sage px-3 py-1 rounded-full font-medium">
                    AI Summary
                  </span>
                  <span className="text-xs bg-bg-sage-light text-accent-sage px-3 py-1 rounded-full font-medium">
                    Match Scoring
                  </span>
                </div>
                {/* Scoring dimensions — real density fill */}
                <div className="bg-bg-alt/60 rounded-[16px] p-4">
                  <div className="text-xs font-semibold text-text-subtle uppercase tracking-wider mb-2.5">
                    5 Scoring Dimensions
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {SCORING_DIMS.map((d) => (
                      <span
                        key={d}
                        className="text-[11px] bg-bg-card border border-border-subtle text-text-secondary px-2.5 py-1 rounded-full"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Q&A — right column row 1 */}
            <motion.div
              variants={staggerChild}
              whileHover={{ scale: 1.01, y: -3 }}
              className="md:col-span-5"
            >
              <Link
                href="/qa"
                className="block bg-dark rounded-[24px] p-7 h-full transition-opacity hover:opacity-95"
                style={{ boxShadow: "var(--shadow-float)" }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-white/15 rounded-2xl flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                    Q&amp;A + Hidden Traps
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Policy Q&amp;A with Citations
                </h3>
                <p className="text-sm text-white/70 leading-relaxed mb-4">
                  Upload any policy PDF. Ask any coverage question. Get a cited
                  verdict (COVERED / NOT_COVERED / PARTIALLY_COVERED) with
                  confidence score and 8 hidden trap checks.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-white/15 text-white/80 px-3 py-1 rounded-full font-medium">
                    PDF Upload
                  </span>
                  <span className="text-xs bg-white/15 text-white/80 px-3 py-1 rounded-full font-medium">
                    Exact Citations
                  </span>
                  <span className="text-xs bg-white/15 text-white/80 px-3 py-1 rounded-full font-medium">
                    Confidence Score
                  </span>
                </div>
              </Link>
            </motion.div>

            {/* Coverage areas — right column row 2 */}
            <motion.div
              variants={staggerChild}
              whileHover={{
                scale: 1.015,
                y: -4,
                boxShadow: "0px 12px 30px rgba(0,0,0,0.05)",
              }}
              className="md:col-span-5"
            >
              <div
                className="bg-bg-sage-light/40 border border-accent-sage/20 rounded-[24px] p-6 h-full"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div className="text-xs font-semibold text-accent-sage uppercase tracking-wider mb-3">
                  7 Coverage Areas Analyzed
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {COVERAGE_AREAS.map((area) => (
                    <div
                      key={area}
                      className="flex items-center gap-2 text-xs text-text-primary"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-accent-sage flex-shrink-0" />
                      {area}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Row 3: Claim + Medical + Gap */}
            <motion.div
              variants={staggerChild}
              whileHover={{
                scale: 1.015,
                y: -4,
                boxShadow: "0px 12px 30px rgba(0,0,0,0.05)",
              }}
              className="md:col-span-4"
            >
              <Link
                href="/claim"
                className="block bg-bg-card border border-border-subtle rounded-[24px] p-7 h-full transition-colors"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div className="w-10 h-10 bg-bg-sage-light rounded-2xl flex items-center justify-center mb-4">
                  <FileText className="w-5 h-5 text-accent-sage" />
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2">
                  Claim Eligibility Advisory
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Computes Claim Feasibility Score (0–100) with deductions for
                  hidden traps. Returns required document checklist by claim
                  type.
                </p>
              </Link>
            </motion.div>

            <motion.div
              variants={staggerChild}
              whileHover={{
                scale: 1.015,
                y: -4,
                boxShadow: "0px 12px 30px rgba(0,0,0,0.05)",
              }}
              className="md:col-span-4"
            >
              <Link
                href="/claim"
                className="block bg-bg-sage-light border border-accent-sage/20 rounded-[24px] p-7 h-full transition-colors"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div className="w-10 h-10 bg-accent-sage rounded-2xl flex items-center justify-center mb-4">
                  <Scan className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2">
                  Medical Report Matching
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Input health conditions or upload a medical report PDF. AI
                  extracts conditions and matches against all catalog
                  policies&apos; exclusion lists.
                </p>
              </Link>
            </motion.div>

            <motion.div
              variants={staggerChild}
              whileHover={{
                scale: 1.015,
                y: -4,
                boxShadow: "0px 12px 30px rgba(0,0,0,0.05)",
              }}
              className="md:col-span-4"
            >
              <Link
                href="/claim"
                className="block bg-bg-card border border-border-subtle rounded-[24px] p-7 h-full transition-colors"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div className="w-10 h-10 bg-bg-sage-light rounded-2xl flex items-center justify-center mb-4">
                  <BarChart2 className="w-5 h-5 text-accent-sage" />
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2">
                  Coverage Gap Analyzer
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Scans any policy against 7 critical coverage areas + 3 dynamic
                  checks. Each gap rated by severity with plain-English
                  recommendations.
                </p>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── Hidden Traps ─── */}
      <section id="traps" className="bg-bg-alt px-4 sm:px-6 lg:px-8 py-24">
        <div className="max-w-[1200px] mx-auto">
          <motion.div
            variants={scrollReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="text-center mb-14"
          >
            <h2 className="text-4xl font-extrabold text-text-primary leading-tight mb-4">
              8 Hidden Trap Types We Detect
            </h2>
            <p className="text-text-secondary text-base max-w-xl mx-auto">
              These are the real reasons claims get rejected. PolicyAI checks for
              every one of them in your policy.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
          >
            {HIDDEN_TRAPS.map((trap) => (
              <motion.div
                key={trap.type}
                variants={staggerChild}
                whileHover={{
                  scale: 1.02,
                  y: -5,
                  boxShadow: "0px 12px 30px rgba(0,0,0,0.05)",
                }}
                className="bg-bg-card border border-border-subtle rounded-[24px] p-6"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div className="w-8 h-8 bg-bg-sage-light rounded-xl flex items-center justify-center mb-3">
                  <AlertTriangle className="w-4 h-4 text-accent-sage" />
                </div>
                <h3 className="text-sm font-bold text-text-primary mb-1.5">
                  {trap.type}
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {trap.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── CTA Strip ─── */}
      <section className="px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-[1200px] mx-auto">
          <motion.div
            variants={scrollReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="bg-dark rounded-[24px] p-10 md:p-14 text-center"
            style={{ boxShadow: "var(--shadow-float)" }}
          >
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
              Understand Your Policy Before You Need It
            </h2>
            <p className="text-white/70 text-base max-w-lg mx-auto mb-8">
              Upload your policy PDF and start asking questions. Get cited
              answers with hidden trap detection in seconds.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link
                href="/qa"
                className="inline-flex items-center gap-2 bg-accent-sage hover:bg-accent-sage-dark text-text-on-sage px-6 py-3 rounded-full text-sm font-semibold transition"
              >
                <MessageSquare className="w-4 h-4" /> Upload &amp; Ask
              </Link>
              <Link
                href="/discover"
                className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-6 py-3 rounded-full text-sm font-semibold transition"
              >
                <Search className="w-4 h-4" /> Discover Policies
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-bg-alt border-t border-border-subtle py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-accent-sage" />
            <span className="font-bold text-text-primary">PolicyAI</span>
          </div>
          <p className="text-xs text-text-subtle text-center">
            3-Layer Hybrid RAG · GPT-4o-mini · Supabase pgvector · 10 Major
            Indian Insurers
          </p>
          <nav className="flex items-center gap-4">
            <Link href="/discover" className="text-xs text-text-subtle hover:text-text-primary transition-colors">
              Discovery
            </Link>
            <Link href="/qa" className="text-xs text-text-subtle hover:text-text-primary transition-colors">
              Q&amp;A
            </Link>
            <Link href="/claim" className="text-xs text-text-subtle hover:text-text-primary transition-colors">
              Claims
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
