import { InputHTMLAttributes } from "react";
import cn from "classnames";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <label className="flex flex-col gap-2 text-sm text-[var(--ink-soft)]">
      {label && <span className="font-semibold text-[var(--ink)]">{label}</span>}
      <input
        className={cn(
          "h-11 px-3 rounded-md border border-transparent border-b-2 bg-[var(--bg)] focus:border-b-[var(--accent)] focus:outline-none transition-colors text-[var(--ink)]",
          error ? "border-b-[var(--danger)]" : "border-b-[var(--ink-soft)]",
          className,
        )}
        {...props}
      />
      {error && <span className="text-xs text-[var(--danger)]">{error}</span>}
    </label>
  );
}
