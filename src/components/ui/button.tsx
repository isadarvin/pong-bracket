'use client';

import { ButtonHTMLAttributes, ReactNode } from "react";
import cn from "classnames";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg" | "icon";
  children: ReactNode;
};

const variantStyles: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-[var(--accent)] text-white hover:bg-[color-mix(in srgb,var(--accent),#000 8%)]",
  secondary:
    "border border-[var(--accent)] text-[var(--accent)] bg-white hover:bg-[var(--accent-soft)]",
  ghost:
    "text-[var(--accent)] hover:bg-[var(--accent-soft)] border border-transparent bg-transparent",
};

const sizeStyles: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-base",
  icon: "h-10 w-10 p-0 flex items-center justify-center",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  type,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "rounded-full font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ball)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] disabled:opacity-50 disabled:cursor-not-allowed",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      type={type ?? "button"}
      {...props}
    >
      {children}
    </button>
  );
}
