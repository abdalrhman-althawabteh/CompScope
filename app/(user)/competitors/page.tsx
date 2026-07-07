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
    <div className="stagger flex flex-col gap-6">
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
            <button className="rounded-full border border-border px-4 py-2 text-sm text-muted transition-colors hover:border-faint hover:text-fg">
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
        <Card>
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs text-faint">
                <th className="pb-3 font-normal">Channel</th>
                <th className="pb-3 font-normal">Videos</th>
                <th className="pb-3 font-normal">Last synced</th>
                <th className="pb-3 text-right font-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {competitors.map((c) => (
                <tr
                  key={c.id}
                  className="border-t border-border transition-colors hover:bg-panel-2/60"
                >
                  <td className="py-3 pr-3">
                    <span className="inline-flex items-center gap-3 font-medium">
                      {c.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.thumbnail_url}
                          alt=""
                          className="h-9 w-9 rounded-full border-2 object-cover"
                          style={{ borderColor: c.color }}
                        />
                      ) : (
                        <span
                          className="h-9 w-9 rounded-full"
                          style={{ background: c.color }}
                        />
                      )}
                      {c.channel_title || c.handle || "—"}
                    </span>
                  </td>
                  <td className="py-3 pr-3 text-muted">{counts[c.id] ?? 0}</td>
                  <td className="py-3 pr-3 text-muted">
                    {fmtSynced(c.last_synced_at)}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center justify-end gap-2">
                      <form action={syncCompetitorAction}>
                        <input type="hidden" name="id" value={c.id} />
                        <button className="rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-accent-ink transition-opacity hover:opacity-85">
                          Sync
                        </button>
                      </form>
                      <form action={removeCompetitor}>
                        <input type="hidden" name="id" value={c.id} />
                        <button className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-flame hover:text-flame">
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
