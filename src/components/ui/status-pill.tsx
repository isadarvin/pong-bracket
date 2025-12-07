import cn from "classnames";

type Status = "joining" | "in_progress" | "completed";

export function StatusPill({ status }: { status: Status }) {
  const copy =
    status === "joining" ? "Joining" : status === "in_progress" ? "In progress" : "Completed";

  return (
    <span
      className={cn(
        "px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wide",
        status === "joining" && "bg-[var(--warning-soft)] text-[var(--ink)]",
        status === "in_progress" && "bg-[var(--accent-soft)] text-[var(--accent)]",
        status === "completed" && "bg-sand-100 text-[var(--ink-soft)] border border-sand-300",
      )}
    >
      {copy}
    </span>
  );
}
