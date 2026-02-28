"use client";

export default function SectionWrapper({
  children,
  className = "",
  bg = "",
  id = "",
}) {
  return (
    <section
      id={id}
      className={`px-4 sm:px-6 lg:px-8 ${bg} ${className}`}
    >
      <div className="max-w-[1200px] mx-auto">{children}</div>
    </section>
  );
}
