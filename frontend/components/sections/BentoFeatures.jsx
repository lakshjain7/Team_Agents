"use client";

import { motion } from "framer-motion";
import SectionWrapper from "@/components/ui/SectionWrapper";
import MotionWrapper from "@/components/ui/MotionWrapper";

const infoCards = [
  {
    tag: "Stay Updated, Always",
    title: "Keep everyone on the same page",
    description:
      "Shared goals, clear timelines, and transparent updates help your team move together with purpose.",
  },
  {
    tag: "Real-Time Efficiency",
    title: "Work faster, with less friction",
    description:
      "Automate the busywork and streamline workflows so your team can focus entirely on what matters.",
  },
  {
    tag: "Make Smarter Decisions",
    title: "Insights you can act on",
    description:
      "Real-time progress tracking and performance data help you lead with clarity and confidence.",
  },
];

export default function BentoFeatures() {
  return (
    <SectionWrapper className="py-24">
      {/* Section heading */}
      <MotionWrapper className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-extrabold text-text-primary leading-tight mb-4">
          Everything Your Team Needs to
          <br />
          Work Smarter
        </h2>
        <p className="text-text-secondary text-base max-w-xl mx-auto">
          From task tracking to real-time chat, our features are built to keep your team connected, organized,
          and moving forward—together.
        </p>
      </MotionWrapper>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Row 1: Large image left + Two stacked cards right */}
        <MotionWrapper className="md:col-span-7">
          <div
            className="rounded-[24px] overflow-hidden h-[380px] relative"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <img
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=500&fit=crop"
              alt="Team collaboration"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/50 to-transparent">
              <span className="text-white/80 text-xs font-medium">Built-In Team Chat</span>
            </div>
          </div>
        </MotionWrapper>

        <div className="md:col-span-5 flex flex-col gap-5">
          <MotionWrapper delay={0.1}>
            <div
              className="rounded-[24px] overflow-hidden h-[180px] relative"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <img
                src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&h=300&fit=crop"
                alt="Task assignment"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
                <span className="text-white/80 text-xs font-medium">Task Assignment</span>
              </div>
            </div>
          </MotionWrapper>

          <MotionWrapper delay={0.2}>
            <div
              className="rounded-[24px] overflow-hidden h-[180px] relative bg-bg-sage-light"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <img
                src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&h=300&fit=crop"
                alt="Project overview"
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
                <span className="text-white/80 text-xs font-medium">Project Overview</span>
              </div>
            </div>
          </MotionWrapper>
        </div>

        {/* Row 2: Two equal cards */}
        <MotionWrapper className="md:col-span-6" delay={0.15}>
          <div className="bg-bg-card border border-border-subtle rounded-[24px] p-8 h-full" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="text-2xl mb-3">📅</div>
            <h3 className="text-lg font-bold text-text-primary mb-2">Real-Time Scheduling</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Plan meetings, set deadlines, and keep your team&apos;s day on the same page.
            </p>
          </div>
        </MotionWrapper>

        <MotionWrapper className="md:col-span-6" delay={0.2}>
          <div className="bg-bg-card border border-border-subtle rounded-[24px] p-8 h-full" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="text-2xl mb-3">📈</div>
            <h3 className="text-lg font-bold text-text-primary mb-2">Progress Tracking</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Visualize team performance with dashboards that highlight what&apos;s done and what&apos;s next.
            </p>
          </div>
        </MotionWrapper>
      </div>

      {/* Info Cards Row below bento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-16">
        {infoCards.map((card, i) => (
          <MotionWrapper key={card.title} delay={i * 0.1}>
            <div className="bg-bg-sage-light rounded-[24px] p-8" style={{ boxShadow: "var(--shadow-card)" }}>
              <span className="text-xs font-semibold text-accent-sage uppercase tracking-wider mb-3 block">
                {card.tag}
              </span>
              <h3 className="text-lg font-bold text-text-primary mb-3">
                {card.title}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                {card.description}
              </p>
            </div>
          </MotionWrapper>
        ))}
      </div>
    </SectionWrapper>
  );
}
