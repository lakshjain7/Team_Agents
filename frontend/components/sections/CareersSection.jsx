"use client";

import SectionWrapper from "@/components/ui/SectionWrapper";
import MotionWrapper from "@/components/ui/MotionWrapper";
import Card from "@/components/ui/Card";

const jobs = [
  {
    department: "Design",
    title: "Senior Art Director",
    description:
      "We're looking for a senior-level Art Director to join our creative team.",
    tags: ["Remote", "Full-time"],
  },
  {
    department: "Development",
    title: "Backend Developer",
    description:
      "We're looking for a senior-level Backend DevDirector to join our creative team.",
    tags: ["Hybrid", "Full-time"],
  },
  {
    department: "Design",
    title: "UX Designer",
    description:
      "We're looking for a senior-level Art Director to join our creative team.",
    tags: ["Remote", "Contract"],
  },
];

export default function CareersSection() {
  return (
    <SectionWrapper className="py-24">
      <MotionWrapper className="text-center mb-14">
        <h2 className="text-4xl md:text-5xl font-extrabold text-text-primary leading-tight mb-4">
          Join our Team
        </h2>
        <p className="text-text-secondary text-base max-w-xl mx-auto">
          A diverse group of passionate professionals, each bringing unique skills and experience to drive innovation and excellence in every project we undertake.
        </p>
      </MotionWrapper>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Job cards */}
        <div className="flex flex-col gap-5">
          {jobs.map((job, i) => (
            <MotionWrapper key={job.title} delay={i * 0.1}>
              <Card className="p-6 cursor-pointer" hover>
                <span className="text-xs font-semibold text-accent-sage uppercase tracking-wider mb-2 block">
                  {job.department}
                </span>
                <h3 className="text-lg font-bold text-text-primary mb-2">
                  {job.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed mb-4">
                  {job.description}
                </p>
                <div className="flex gap-2">
                  {job.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 text-xs font-medium text-text-secondary bg-bg-alt rounded-full border border-border-subtle"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </Card>
            </MotionWrapper>
          ))}
        </div>

        {/* Image */}
        <MotionWrapper delay={0.2} className="hidden md:block">
          <div
            className="rounded-[24px] overflow-hidden h-full min-h-[450px]"
            style={{ boxShadow: "var(--shadow-float)" }}
          >
            <img
              src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&h=800&fit=crop&crop=face"
              alt="Join our team"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </MotionWrapper>
      </div>
    </SectionWrapper>
  );
}
