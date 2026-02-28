"use client";

import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import SectionWrapper from "@/components/ui/SectionWrapper";
import MotionWrapper from "@/components/ui/MotionWrapper";

const avatarImages = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=400&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=400&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=400&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=400&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=400&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=400&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=400&fit=crop&crop=face",
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 20 },
  },
};

export default function HeroSection() {
  return (
    <SectionWrapper className="pt-20 pb-16">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="text-center max-w-3xl mx-auto"
      >
        {/* Headline */}
        <motion.h1
          variants={itemVariants}
          className="text-text-primary font-extrabold leading-[1.05] tracking-tight mb-6"
          style={{ fontSize: "clamp(40px, 6vw, 68px)" }}
        >
          Streamline Your Team,
          <br />
          <span className="text-text-primary">Supercharge Your Workflow</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={itemVariants}
          className="text-text-secondary text-lg leading-relaxed max-w-xl mx-auto mb-8"
        >
          All-in-one platform to plan, collaborate,
          <br className="hidden sm:block" />
          and deliver — faster and smarter.
        </motion.p>

        {/* CTA */}
        <motion.div variants={itemVariants} className="flex justify-center mb-16">
          <Button variant="primary" size="lg">
            Get started for Free
            <span className="ml-1 w-6 h-6 rounded-full bg-bg-base/20 flex items-center justify-center text-xs">
              →
            </span>
          </Button>
        </motion.div>
      </motion.div>

      {/* Avatar Marquee Row */}
      <MotionWrapper className="relative overflow-hidden mt-8">
        <div className="flex animate-marquee" style={{ width: "max-content" }}>
          {[...avatarImages, ...avatarImages].map((src, i) => (
            <div
              key={i}
              className="flex-shrink-0 mx-2 w-[160px] h-[200px] rounded-[20px] overflow-hidden"
              style={{ boxShadow: "var(--shadow-float)" }}
            >
              <img
                src={src}
                alt="Team member"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </MotionWrapper>
    </SectionWrapper>
  );
}
