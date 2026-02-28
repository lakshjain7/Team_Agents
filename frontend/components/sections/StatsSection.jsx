"use client";

import Card from "@/components/ui/Card";
import SectionWrapper from "@/components/ui/SectionWrapper";
import MotionWrapper from "@/components/ui/MotionWrapper";

const stats = [
  {
    value: "+85%",
    label: "Team Productivity",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=500&fit=crop",
  },
  {
    value: "12h",
    label: "Saved Weekly",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=500&fit=crop",
  },
  {
    value: "25,000+",
    label: "Users Worldwide",
    image: "https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=400&h=500&fit=crop",
  },
];

export default function StatsSection() {
  return (
    <SectionWrapper className="py-24">
      <MotionWrapper className="text-center mb-14">
        <h2 className="text-4xl md:text-5xl font-extrabold text-text-primary leading-tight mb-4">
          Proven Results, Real Impact
        </h2>
        <p className="text-text-secondary text-base max-w-xl mx-auto">
          See how teams around the world are working faster, communicating better, and getting more done
          with our all-in-one management platform.
        </p>
      </MotionWrapper>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <MotionWrapper key={stat.label} delay={i * 0.12}>
            <Card className="overflow-hidden h-full" hover>
              <div className="h-[280px] overflow-hidden">
                <img
                  src={stat.image}
                  alt={stat.label}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-6 text-center">
                <div className="text-4xl font-extrabold text-text-primary mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-text-secondary">{stat.label}</div>
              </div>
            </Card>
          </MotionWrapper>
        ))}
      </div>
    </SectionWrapper>
  );
}
