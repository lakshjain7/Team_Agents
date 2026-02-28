"use client";

import SectionWrapper from "@/components/ui/SectionWrapper";
import MotionWrapper from "@/components/ui/MotionWrapper";

const featureItems = [
  {
    title: "Integrated Calendar",
    description: "Sync tasks and deadlines effortlessly with the team across your projects.",
  },
  {
    title: "File Sharing",
    description: "Upload and collaborate on files directly within project boards.",
  },
  {
    title: "Project Boards",
    description: "Organize work visually with kanban boards, lists, and custom views.",
  },
  {
    title: "Role-Based Permissions",
    description: "Control access levels and manage team roles with granular permissions.",
  },
  {
    title: "Notes & Docs",
    description: "Create and share team documentation in one connected workspace.",
  },
  {
    title: "Automated Updates",
    description: "Get automatic project status updates and task progress notifications.",
  },
];

const gridFeatures = [
  {
    icon: "📁",
    title: "Project Management",
    description: "Plan, assign, and track tasks across every project to keep on time and on budget.",
  },
  {
    icon: "🌐",
    title: "Remote Team Collaboration",
    description: "Stay connected via messaging, shared boards, and live updates.",
  },
  {
    icon: "📊",
    title: "Performance Monitoring",
    description: "Track progress, find bottleneck areas, and optimize team output.",
  },
  {
    icon: "🎨",
    title: "Creative Team Workflow",
    description: "Manage creative briefs, feedback, and task delivery in one place.",
  },
];

export default function HighlightSection() {
  return (
    <>
      {/* Features That Keep Teams Moving */}
      <SectionWrapper className="py-24">
        <MotionWrapper className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-extrabold text-text-primary leading-tight mb-4">
            Features That Keep Teams
            <br />
            Moving
          </h2>
          <p className="text-text-secondary text-base max-w-xl mx-auto">
            From task tracking to real-time updates, every tool is designed to boost collaboration, clarity, and momentum.
          </p>
        </MotionWrapper>

        {/* Feature list with image */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Left: Feature list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {featureItems.map((item, i) => (
              <MotionWrapper key={item.title} delay={i * 0.08}>
                <div className="bg-bg-card border border-border-subtle rounded-[24px] p-6" style={{ boxShadow: "var(--shadow-card)" }}>
                  <h3 className="text-base font-bold text-text-primary mb-2">{item.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{item.description}</p>
                </div>
              </MotionWrapper>
            ))}
          </div>

          {/* Right: Large image */}
          <MotionWrapper delay={0.2}>
            <div className="rounded-[24px] overflow-hidden h-full min-h-[400px]" style={{ boxShadow: "var(--shadow-float)" }}>
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&h=800&fit=crop&crop=face"
                alt="Team member working"
                className="w-full h-full object-cover"
              />
            </div>
          </MotionWrapper>
        </div>
      </SectionWrapper>

      {/* Green Highlight Section - Built for Every Team */}
      <section className="bg-bg-sage py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Phone mockup */}
            <MotionWrapper className="flex justify-center">
              <div
                className="w-[260px] h-[520px] rounded-[40px] bg-text-primary overflow-hidden relative"
                style={{ boxShadow: "var(--shadow-float)" }}
              >
                <div className="absolute inset-2 rounded-[36px] overflow-hidden bg-bg-base">
                  <img
                    src="https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=300&h=600&fit=crop"
                    alt="App interface"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </MotionWrapper>

            {/* Text + Feature grid */}
            <div>
              <MotionWrapper>
                <h2 className="text-4xl md:text-5xl font-extrabold text-text-on-sage leading-tight mb-4">
                  Built for Every Team,
                  <br />
                  Ready for Any Workflow
                </h2>
                <p className="text-bg-sage-light/80 text-base mb-10 max-w-md">
                  From remote collaboration to onsite planning, our platform adapts to the way you work — no matter the industry or team.
                </p>
              </MotionWrapper>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {gridFeatures.map((f, i) => (
                  <MotionWrapper key={f.title} delay={i * 0.1}>
                    <div className="bg-white/10 backdrop-blur-sm rounded-[20px] p-5 border border-white/10">
                      <div className="text-xl mb-2">{f.icon}</div>
                      <h3 className="text-sm font-bold text-text-on-sage mb-1">{f.title}</h3>
                      <p className="text-xs text-bg-sage-light/70 leading-relaxed">{f.description}</p>
                    </div>
                  </MotionWrapper>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
