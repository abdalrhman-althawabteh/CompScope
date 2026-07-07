import { Topbar } from "@/components/ui/Topbar";
import { Card } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/server";
import { getCompetitors, getVideoCounts } from "@/lib/queries";
import { removeCompetitor, syncCompetitorAction, syncAll } from "@/app/actions/competitors";
import { AddCompetitorForm } from "./AddCompetitorForm";

const fmtSynced = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString() : "never";

export default async function CompetitorsPage() {
  const supabase = await createClient();
  const [competitors, counts] = await Promise.all([
    getCompetitors(supabase),
    getVideoCounts(supabase),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <Topbar stat={`${competitors.length} competitors tracked`} />
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">Competitors</h1>
          <p className="mt-2 text-muted">
            Add competitor YouTube channels. We pull their latest 50 uploads.
          </p>
        </div>
        {competitors.length > 0 && (
          <form action={syncAll}>
            <button className="rounded-full border border-border px-4 py-2 text-sm text-muted hover:text-fg">
              Sync all now
            </button>
          </form>
        )}
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Add a channel</h2>
        <AddCompetitorForm />
      </Card>

      {competitors.length === 0 ? (
        <Card className="flex h-40 items-center justify-center text-muted">
          No competitors yet — add one above to start tracking.
        </Card>
      ) : (
        <Card variant="white">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs text-neutral-400">
                <th className="pb-3 font-normal">Channel</th>
                <th className="pb-3 font-normal">Videos</th>
                <th className="pb-3 font-normal">Last synced</th>
                <th className="pb-3 text-right font-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {competitors.map((c) => (
                <tr key={c.id} className="border-t border-dashed border-neutral-200">
                  <td className="py-3.5 pr-3">
                    <span className="inline-flex items-center gap-2 font-medium text-neutral-900">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ background: c.color }}
                      />
                      {c.channel_title || c.handle || "—"}
                    </span>
                  </td>
                  <td className="py-3.5 pr-3 text-neutral-700">
                    {counts[c.id] ?? 0}
                  </td>
                  <td className="py-3.5 pr-3 text-neutral-500">
                    {fmtSynced(c.last_synced_at)}
                  </td>
                  <td className="py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <form action={syncCompetitorAction}>
                        <input type="hidden" name="id" value={c.id} />
                        <button className="rounded-full bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white">
                          Sync
                        </button>
                      </form>
                      <form action={removeCompetitor}>
                        <input type="hidden" name="id" value={c.id} />
                        <button className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-500 hover:border-flame hover:text-flame">
                          Remove
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
