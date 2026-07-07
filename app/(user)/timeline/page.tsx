import { Topbar } from "@/components/ui/Topbar";
import { Card } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/server";
import { getCompetitors, getVideos } from "@/lib/queries";
import { TimelineView } from "./TimelineView";

const DAYS = 14;

export default async function TimelinePage() {
  const supabase = await createClient();
  const [competitors, videos] = await Promise.all([
    getCompetitors(supabase),
    getVideos(supabase, { sinceDays: DAYS }),
  ]);

  // Build the day axis (oldest → today) on the server for deterministic rendering.
  const today = new Date();
  const days = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() - (DAYS - 1 - i));
    return d.toISOString().slice(0, 10);
  });

  return (
    <div className="stagger flex flex-col gap-6">
      <Topbar stat={`${DAYS}-day competitor timeline`} />
      <div>
        <h1 className="text-4xl font-semibold tracking-tight">Timeline</h1>
        <p className="mt-2 text-muted">
          Every dot is an upload. Colour = competitor. Click a dot for details.
        </p>
      </div>

      {competitors.length === 0 ? (
        <Card className="flex h-40 items-center justify-center text-muted">
          Add competitors to see their upload timeline.
        </Card>
      ) : (
        <TimelineView competitors={competitors} videos={videos} days={days} />
      )}
    </div>
  );
}
