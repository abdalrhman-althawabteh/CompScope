import Link from "next/link";
import { Topbar } from "@/components/ui/Topbar";
import { Card, StatusPill } from "@/components/ui/Card";
import { BarChart, AreaChart } from "@/components/ui/Charts";
import { ChevronRight, ChevronDown } from "@/components/icons";
import { createClient } from "@/lib/supabase/server";
import { getCompetitors, getVideos, computeDashboard, trendOf, daysAgoTs } from "@/lib/queries";
import { fmtViews } from "@/lib/format";
import { DashboardChat } from "./DashboardChat";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data: profile }, competitors, videos] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user!.id).single(),
    getCompetitors(supabase),
    getVideos(supabase, { limit: 200 }),
  ]);

  const dash = computeDashboard(videos);
  const name = profile?.full_name?.split(" ")[0] || "there";
  const weekAgo = daysAgoTs(7);
  const uploadsThisWeek = videos.filter(
    (v) => v.published_at && new Date(v.published_at).getTime() >= weekAgo,
  ).length;
  const stats = [
    { label: "Competitors tracked", value: String(competitors.length), sub: "channels" },
    { label: "Uploads this week", value: String(uploadsThisWeek), sub: "last 7 days" },
    {
      label: "Avg views / video",
      value: videos.length ? fmtViews(Math.round(dash.totalViews / videos.length)) : "0",
      sub: `across ${videos.length} videos`,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Topbar stat={`${dash.totalViews ? fmtViews(dash.totalViews) : "0"} tracked views`} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_minmax(0,560px)]">
        <div className="rise">
          <h1 className="text-5xl font-semibold tracking-tight">Welcome, {name}!</h1>
          <p className="mt-3 max-w-md text-muted">
            Track your competitors and turn their moves into your next hit.
          </p>
        </div>
        <div className="stagger grid grid-cols-1 gap-3 sm:grid-cols-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex flex-col gap-1 rounded-2xl border border-border bg-panel p-4 transition-colors hover:border-faint"
            >
              <span className="text-sm text-muted">{s.label}</span>
              <span className="text-3xl font-semibold tracking-tight text-accent">
                {s.value}
              </span>
              <span className="text-xs text-faint">{s.sub}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="stagger grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Upload Activity</h2>
            <span className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-muted">
              By weekday <ChevronDown width={16} height={16} />
            </span>
          </div>
          <BarChart data={dash.uploads} />
        </Card>

        <Card variant="white">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Latest Videos</h2>
            <Link
              href="/timeline"
              className="flex items-center gap-1 text-sm text-neutral-500 transition-colors hover:text-neutral-900"
            >
              See all <ChevronRight width={16} height={16} />
            </Link>
          </div>
          {dash.latest.length === 0 ? (
            <p className="py-10 text-center text-sm text-neutral-400">
              No videos yet — add competitors and sync.
            </p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs text-neutral-400">
                  <th className="pb-3 font-normal">Title</th>
                  <th className="pb-3 font-normal">Channel</th>
                  <th className="pb-3 font-normal">Trend</th>
                  <th className="pb-3 text-right font-normal">Views</th>
                </tr>
              </thead>
              <tbody>
                {dash.latest.map((v) => (
                  <tr key={v.id} className="border-t border-dashed border-neutral-200">
                    <td className="max-w-[180px] truncate py-3.5 pr-3 font-medium text-neutral-900">
                      <a href={v.url ?? "#"} target="_blank" rel="noreferrer">
                        {v.title}
                      </a>
                    </td>
                    <td className="py-3.5 pr-3">
                      <span className="inline-flex items-center gap-1.5 text-sm text-neutral-600">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: v.competitor?.color ?? "#999" }}
                        />
                        {v.competitor?.channel_title ?? "—"}
                      </span>
                    </td>
                    <td className="py-3.5 pr-3">
                      <StatusPill status={trendOf(v.view_count)} />
                    </td>
                    <td className="py-3.5 text-right font-semibold text-neutral-900">
                      {fmtViews(v.view_count)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card variant="mint">
          <DashboardChat hasCompetitors={competitors.length > 0} />
        </Card>

        <Card variant="lavender" className="overflow-hidden">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Total Views</h2>
            <span className="rounded-full bg-white/40 px-3 py-1.5 text-sm">
              {fmtViews(dash.totalViews)}
            </span>
          </div>
          <div className="-mx-6 -mb-6 mt-4">
            <AreaChart points={dash.points} peakLabel={fmtViews(dash.peak)} />
          </div>
        </Card>
      </div>
    </div>
  );
}
