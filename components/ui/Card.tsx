import type { ReactNode } from "react";

type Variant = "dark" | "white" | "lavender" | "mint";

const VARIANTS: Record<Variant, string> = {
  dark: "bg-panel text-fg border border-border",
  white: "bg-white text-black",
  lavender: "bg-lavender text-[#241a3d]",
  mint: "bg-mint text-[#1a2913]",
};

export function Card({
  variant = "dark",
  className = "",
  children,
}: {
  variant?: Variant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-[var(--radius-card)] p-6 ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </div>
  );
}

export function StatusPill({
  status,
}: {
  status: "hot" | "rising" | "flat";
}) {
  const map = {
    hot: { label: "Hot", cls: "bg-[#efe6ff] text-[#5b3ea6]" },
    rising: { label: "Rising", cls: "bg-[#e6f7dc] text-[#3f7a1f]" },
    flat: { label: "Flat", cls: "bg-[#efefef] text-[#6b6b6b]" },
  }[status];
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${map.cls}`}
    >
      {map.label}
    </span>
  );
}
