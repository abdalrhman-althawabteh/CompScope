"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { ChevronRight } from "@/components/icons";
import { fmtViews } from "@/lib/format";

type Competitor = { id: string; channel_title: string | null; color: string };
type Video = {
  id: string;
  competitor_id: string;
  title: string | null;
  url: string | null;
  published_at: string | null;
  view_count: number | null;
  like_count: number | null;
  comment_count: number | null;
};

export function TimelineView({
  competitors,
  videos,
  days,
}: {
  competitors: Competitor[];
  videos: Video[];
  days: string[];
}) {
  const [active, setActive] = useState<Video | null>(null);
  const colOf = (c: Competitor) => c.color;
  const nameOf = (id: string) =>
    competitors.find((c) => c.id === id)?.channel_title ?? "—";
  const cols = { gridTemplateColumns: `repeat(${days.length}, minmax(28px, 1fr))` };

  return (
    <>
      <Card className="overflow-x-auto">
        <div
          className="grid items-center gap-1 pl-40 text-center text-[11px] text-faint"
          style={cols}
        >
          {days.map((d) => (
            <div key={d}>{new Date(d).getUTCDate()}</div>
          ))}
        </div>

        <div className="stagger mt-3 flex flex-col gap-3">
          {competitors.map((c) => (
            <div key={c.id} className="flex items-center">
              <div className="flex w-40 shrink-0 items-center gap-2 pr-4">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ background: colOf(c) }}
                />
                <span className="truncate text-sm">{c.channel_title}</span>
              </div>
              <div
                className="grid flex-1 items-center gap-1 rounded-xl bg-panel-2 py-2.5"
                style={cols}
              >
                {days.map((d) => {
                  const v = videos.find(
                    (x) =>
                      x.competitor_id === c.id &&
                      x.published_at?.slice(0, 10) === d,
                  );
                  return (
                    <div key={d} className="flex justify-center">
                      {v ? (
                        <button
                          onClick={() => setActive(v)}
                          title={v.title ?? ""}
                          className="h-3.5 w-3.5 rounded-full transition hover:scale-125 hover:ring-2 hover:ring-white/30"
                          style={{ background: colOf(c) }}
                        />
                      ) : (
                        <span className="h-1 w-1 rounded-full bg-[#2c2c2c]" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setActive(null)}
        >
          <div
            className="pop-in w-full max-w-md rounded-[var(--radius-card)] border border-border bg-panel p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-2 text-sm text-muted">
              <span className="ml-auto">{active.published_at?.slice(0, 10)}</span>
            </div>
            <div className="mb-1 text-xs text-faint">{nameOf(active.competitor_id)}</div>
            <h3 className="text-xl font-semibold">{active.title}</h3>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <Stat label="Views" value={fmtViews(active.view_count)} />
              <Stat label="Likes" value={fmtViews(active.like_count)} />
              <Stat label="Comments" value={fmtViews(active.comment_count)} />
            </div>
            {active.url && (
              <a
                href={active.url}
                target="_blank"
                rel="noreferrer"
                className="mt-6 flex items-center justify-center gap-1 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-ink"
              >
                Watch on YouTube <ChevronRight width={16} height={16} />
              </a>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-panel-2 p-4">
      <div className="text-xs text-faint">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}
