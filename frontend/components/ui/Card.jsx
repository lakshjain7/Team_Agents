"use client";

import { motion } from "framer-motion";

export default function Card({
  children,
  className = "",
  hover = true,
  ...props
}) {
  return (
    <motion.div
      className={`bg-bg-card border border-border-subtle rounded-[24px] overflow-hidden ${className}`}
      style={{ boxShadow: "var(--shadow-card)" }}
      whileHover={
        hover
          ? {
              scale: 1.02,
              y: -5,
              boxShadow: "var(--shadow-card-hover)",
            }
          : {}
      }
      transition={{ duration: 0.3, ease: "easeOut" }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
