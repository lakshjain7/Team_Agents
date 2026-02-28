"use client";

import { motion } from "framer-motion";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  href,
  ...props
}) {
  const base =
    "inline-flex items-center justify-center font-semibold transition-colors duration-200 cursor-pointer";

  const variants = {
    primary:
      "bg-text-primary text-bg-base hover:bg-text-secondary",
    secondary:
      "border border-border-default text-text-primary hover:bg-bg-alt",
    ghost:
      "text-text-secondary hover:text-text-primary hover:bg-bg-alt",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm gap-1.5",
    md: "px-6 py-3 text-sm gap-2",
    lg: "px-8 py-4 text-base gap-2.5",
  };

  const classes = `${base} rounded-full ${variants[variant]} ${sizes[size]} ${className}`;

  const Component = href ? motion.a : motion.button;

  return (
    <Component
      className={classes}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      href={href}
      {...props}
    >
      {children}
    </Component>
  );
}
