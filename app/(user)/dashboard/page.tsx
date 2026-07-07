import Link from "next/link";
import { Topbar } from "@/components/ui/Topbar";
import { Card, StatusPill } from "@/components/ui/Card";
import { BarChart, AreaChart } from "@/components/ui/Charts";
import { PlusIcon, SparkIcon, ChevronRight, ChevronDown } from "@/components/icons";
import { createClient } from "@/lib/supabase/server";
import { getVideos, computeDashboard, trendOf } from "@/lib/queries";
import { fmtViews } from "@/lib/format";

const AI_CARDS = [
  { title: "Idea Generator", sub: "Fresh video angles" },
  { title: "Trend Analyzer", sub: "What's spiking now" },
  { title: "Report AI", sub: "Weekly competitor recap" },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user!.id)
    .single();

  const videos = await getVideos(supabase, { limit: 200 });
  const dash = computeDashboard(videos);
  const name = profile?.full_name?.split(" ")[0] || "there";

  return (
    <div className="flex flex-col gap-6">
      <Topbar stat={`${dash.totalViews ? fmtViews(dash.totalViews) : "0"} tracked views`} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_minmax(0,560px)]">
        <div>
          <h1 className="text-5xl font-semibold tracking-tight">Welcome, {name}!</h1>
          <p className="mt-3 max-w-md text-muted">
            Track your competitors and turn their moves into your next hit.
          </p>
        </div>
        <div className="flex items-stretch gap-3 overflow-x-auto">
          <Link
            href="/competitors"
            className="flex h-full min-h-[92px] w-14 items-center justify-center rounded-2xl bg-white text-black"
          >
            <PlusIcon />
          </Link>
          {AI_CARDS.map((c) => (
            <Link
              href="/assistant"
              key={c.title}
              className="flex min-w-[190px] items-center justify-between gap-4 rounded-2xl border border-border bg-panel px-5"
            >
              <div>
                <div className="flex items-center gap-1.5 font-medium">
                  {c.title}
                  <SparkIcon width={16} height={16} className="text-accent" />
                </div>
                <div className="mt-1 text-sm text-muted">{c.sub}</div>
              </div>
              <ChevronRight width={18} height={18} className="text-faint" />
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
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
              className="flex items-center gap-1 text-sm text-neutral-500"
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

        <Card variant="mint" className="relative overflow-hidden">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <SparkIcon width={20} height={20} /> AI Suggestion
          </div>
          <p className="mt-4 max-w-xs text-[15px] leading-relaxed">
            Ask the AI to spot patterns across your competitors&rsquo; recent
            uploads and suggest your next video.
          </p>
          <Link
            href="/assistant"
            className="mt-6 inline-flex rounded-full bg-black px-6 py-3 text-sm font-medium text-white"
          >
            ASK THE AI
          </Link>
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
