import { ReactNode } from "react";
import cn from "classnames";

type CardProps = {
  children: ReactNode;
  className?: string;
  tone?: "default" | "accent";
};

export function Card({ children, className, tone = "default" }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-card shadow-card border border-[color-mix(in srgb,var(--accent-soft),#000 4%)]",
        "border-t border-t-[var(--ink)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
