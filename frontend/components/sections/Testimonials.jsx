"use client";

import SectionWrapper from "@/components/ui/SectionWrapper";
import MotionWrapper from "@/components/ui/MotionWrapper";

const testimonialImages = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=400&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=400&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=400&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=400&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=400&fit=crop&crop=face",
];

export default function Testimonials() {
  return (
    <SectionWrapper className="py-24">
      <MotionWrapper className="text-center mb-14">
        <h2 className="text-4xl md:text-5xl font-extrabold text-text-primary leading-tight mb-4">
          Loved by Teams Around the
          <br />
          World
        </h2>
        <p className="text-text-secondary text-base max-w-xl mx-auto">
          From startups to global companies, thousands of teams rely on us to stay organized, connected,
          and productive — every single day.
        </p>
      </MotionWrapper>

      {/* Avatar Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        {testimonialImages.map((src, i) => (
          <MotionWrapper key={i} delay={i * 0.08}>
            <div
              className="rounded-[20px] overflow-hidden aspect-[3/4] cursor-pointer"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <img
                src={src}
                alt={`Team member ${i + 1}`}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            </div>
          </MotionWrapper>
        ))}
      </div>
    </SectionWrapper>
  );
}
