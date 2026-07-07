import { Topbar } from "@/components/ui/Topbar";
import { Card } from "@/components/ui/Card";
import { ChevronRight } from "@/components/icons";
import { createClient } from "@/lib/supabase/server";
import { getCompetitors, getVideos, daysAgoTs, type VideoRow } from "@/lib/queries";
import { fmtViews } from "@/lib/format";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const [competitors, videos] = await Promise.all([
    getCompetitors(supabase),
    getVideos(supabase, { limit: 500 }),
  ]);

  const monthAgo = daysAgoTs(30);
  const rows = competitors
    .map((c) => {
      const vids = videos.filter((v) => v.competitor_id === c.id);
      const views = vids.reduce((s, v) => s + (v.view_count ?? 0), 0);
      const top = vids.reduce<VideoRow | null>(
        (a, b) => ((b.view_count ?? 0) > (a?.view_count ?? -1) ? b : a),
        null,
      );
      return {
        ...c,
        videoCount: vids.length,
        views,
        avg: vids.length ? Math.round(views / vids.length) : 0,
        uploads30: vids.filter(
          (v) => v.published_at && new Date(v.published_at).getTime() >= monthAgo,
        ).length,
        top,
      };
    })
    .sort((a, b) => b.views - a.views);
  const maxViews = Math.max(...rows.map((r) => r.views), 1);

  return (
    <div className="stagger flex flex-col gap-6">
      <Topbar stat={`${fmtViews(rows.reduce((s, r) => s + r.views, 0))} total views`} />
      <div>
        <h1 className="text-4xl font-semibold tracking-tight">Analytics</h1>
        <p className="mt-2 text-muted">
          How your competitors stack up against each other.
        </p>
      </div>

      {rows.length === 0 ? (
        <Card className="flex h-40 items-center justify-center text-muted">
          Add competitors to see how they compare.
        </Card>
      ) : (
        <>
          <Card>
            <h2 className="mb-6 text-2xl font-semibold">Views by channel</h2>
            <div className="flex flex-col gap-4">
              {rows.map((r, i) => (
                <div key={r.id} className="flex items-center gap-4">
                  <span className="w-40 shrink-0 truncate text-sm">
                    {r.channel_title || r.handle || "—"}
                  </span>
                  <div className="h-4 flex-1 overflow-hidden rounded-full bg-panel-2">
                    <div
                      className="bar-grow-x h-full rounded-full"
                      style={{
                        width: `${Math.max((r.views / maxViews) * 100, 1.5)}%`,
                        background: r.color,
                        animationDelay: `${i * 80}ms`,
                      }}
                    />
                  </div>
                  <span className="w-16 shrink-0 text-right text-sm font-semibold">
                    {fmtViews(r.views)}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <div className="stagger grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((r) => (
              <Card key={r.id} className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  {r.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.thumbnail_url}
                      alt=""
                      className="h-10 w-10 rounded-full border-2 object-cover"
                      style={{ borderColor: r.color }}
                    />
                  ) : (
                    <span
                      className="h-10 w-10 rounded-full"
                      style={{ background: r.color }}
                    />
                  )}
                  <span className="truncate font-semibold">
                    {r.channel_title || r.handle || "—"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Stat label="Videos" value={String(r.videoCount)} />
                  <Stat label="Avg views" value={fmtViews(r.avg)} />
                  <Stat label="30d uploads" value={String(r.uploads30)} />
                </div>
                {r.top && (
                  <a
                    href={r.top.url ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="group mt-auto flex items-center justify-between gap-2 rounded-xl bg-panel-2 px-3.5 py-3 text-sm transition-colors hover:bg-[#242427]"
                  >
                    <span className="min-w-0">
                      <span className="block text-xs text-faint">
                        Top video · {fmtViews(r.top.view_count)} views
                      </span>
                      <span className="block truncate">{r.top.title}</span>
                    </span>
                    <ChevronRight
                      width={16}
                      height={16}
                      className="shrink-0 text-faint transition-transform group-hover:translate-x-0.5"
                    />
                  </a>
                )}
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-panel-2 p-3">
      <div className="text-xs text-faint">{label}</div>
      <div className="mt-0.5 truncate text-lg font-semibold">{value}</div>
    </div>
  );
}
