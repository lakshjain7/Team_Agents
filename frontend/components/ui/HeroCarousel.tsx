"use client";

import { motion } from "framer-motion";

type Card = {
  id: string;
  title: string;
  subtitle: string;
};

const cards: Card[] = [
  {
    id: "upload-1",
    title: "AI Parsing Uploaded Policy",
    subtitle: "Extracting clauses & risk entities",
  },
  {
    id: "clause-1",
    title: "⚠ Waiting Period Detected",
    subtitle: "24-month restriction identified",
  },
  {
    id: "sim-1",
    title: "Room Rent Cap Analysis",
    subtitle: "Checking proportional deductions",
  },
  {
    id: "risk-1",
    title: "Claim Rejection Risk Model",
    subtitle: "Probability computation in progress",
  },
  {
    id: "risk-2",
    title: "Co-pay Clause Identified",
    subtitle: "User liability calculated",
  },
  {
    id: "sim-2",
    title: "Simulation Preview Ready",
    subtitle: "Estimated payout breakdown generated",
  },
];

export default function HeroCarousel() {
  const loopCards = [...cards, ...cards];

  return (
    <div className="relative w-full overflow-hidden py-16 bg-[#F6F4F0]">
      <div className="pointer-events-none absolute left-0 top-0 h-full w-32 bg-gradient-to-r from-[#F6F4F0] to-transparent z-20" />
      <div className="pointer-events-none absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-[#F6F4F0] to-transparent z-20" />

      <motion.div
        className="flex w-max gap-8 px-4"
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          duration: 35,
          ease: "linear",
          repeat: Infinity,
        }}
      >
        {loopCards.map((card, index) => (
          <motion.div
            key={`${card.id}-${index}`}
            whileHover={{
              scale: 1.02,
              y: -6,
              boxShadow: "0px 20px 40px rgba(0,0,0,0.08)",
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="min-w-[360px] rounded-3xl bg-white/70 backdrop-blur-xl border border-neutral-200 p-7 shadow-sm transition-colors hover:bg-white cursor-default"
          >
            <div className="flex items-center justify-between mb-5">
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="h-1.5 w-12 rounded-full bg-[#748C74]"
              />

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Live
                </span>
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-bold text-[#1C1C1C] leading-snug tracking-tight">
              {card.title}
            </h3>

            <p className="text-neutral-500 mt-2 text-sm leading-relaxed">
              {card.subtitle}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
