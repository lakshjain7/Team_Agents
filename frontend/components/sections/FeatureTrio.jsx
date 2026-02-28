"use client";

import Card from "@/components/ui/Card";
import SectionWrapper from "@/components/ui/SectionWrapper";
import MotionWrapper from "@/components/ui/MotionWrapper";

const features = [
  {
    icon: "🔄",
    title: "Real-Time Collaboration",
    description:
      "Connect with your team and keep projects in sync with built-in messaging, file sharing, and live editing.",
  },
  {
    icon: "📋",
    title: "Task & Project Tracking",
    description:
      "Assign tasks, set deadlines, and visualize progress with boards, lists, and timeline adapted to your workflow.",
  },
  {
    icon: "📊",
    title: "Performance Insights",
    description:
      "Access real-time analytics with custom dashboards that surface productivity trends, bottlenecks, and team capacity.",
  },
];

export default function FeatureTrio() {
  return (
    <SectionWrapper className="py-20">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature, i) => (
          <MotionWrapper key={feature.title} delay={i * 0.1}>
            <Card className="p-8 h-full">
              <div className="text-2xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-bold text-text-primary mb-3">
                {feature.title}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                {feature.description}
              </p>
            </Card>
          </MotionWrapper>
        ))}
      </div>
    </SectionWrapper>
  );
}
