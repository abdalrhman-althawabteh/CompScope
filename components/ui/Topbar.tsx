import { LogoMark } from "@/components/icons";

export function Topbar({ stat }: { stat?: string }) {
  return (
    <header className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-accent">
        <LogoMark />
        <span className="text-xl font-semibold tracking-tight text-fg">
          CompScope
        </span>
      </div>

      {stat && (
        <div className="hidden items-center gap-2 rounded-full border border-border bg-panel px-5 py-2.5 text-sm md:flex">
          <span className="font-semibold text-accent">{stat.split(" ")[0]}</span>
          <span className="text-muted">
            {stat.split(" ").slice(1).join(" ")}
          </span>
        </div>
      )}

      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-flame to-lavender ring-2 ring-flame/40" />
    </header>
  );
}
