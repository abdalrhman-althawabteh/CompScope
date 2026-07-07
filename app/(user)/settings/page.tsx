import { Topbar } from "@/components/ui/Topbar";
import { Card } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/server";

type SyncRun = {
  id: string;
  started_at: string;
  source: string;
  status: string;
  competitors_synced: number;
  videos_upserted: number;
};

const statusCls: Record<string, string> = {
  success: "bg-[#e6f7dc] text-[#3f7a1f]",
  error: "bg-flame/15 text-flame",
  running: "bg-[#efe6ff] text-[#5b3ea6]",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data: profile }, { data: runs }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, email, subscription_tier, subscription_status, subscription_expires_at")
      .eq("id", user!.id)
      .single(),
    supabase
      .from("sync_runs")
      .select("id, started_at, source, status, competitors_synced, videos_upserted")
      .order("started_at", { ascending: false })
      .limit(10),
  ]);

  const history = (runs ?? []) as SyncRun[];

  return (
    <div className="stagger flex flex-col gap-6">
      <Topbar stat="Settings" />
      <div>
        <h1 className="text-4xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-2 text-muted">Your account, plan, and sync activity.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Account</h2>
          <dl className="flex flex-col gap-3 text-sm">
            <Row label="Name" value={profile?.full_name || "—"} />
            <Row label="Email" value={profile?.email || "—"} />
            <Row label="Plan" value={profile?.subscription_tier} capitalize />
            <Row label="Status" value={profile?.subscription_status} capitalize />
            <Row
              label="Renews"
              value={profile?.subscription_expires_at?.slice(0, 10) || "—"}
            />
          </dl>
          <p className="mt-4 text-xs text-faint">
            Plan changes are managed by your admin.
          </p>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold">Sync history</h2>
          {history.length === 0 ? (
            <p className="py-8 text-center text-sm text-faint">
              No syncs yet — runs appear here after the daily sync or a manual one.
            </p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs text-faint">
                  <th className="pb-3 font-normal">When</th>
                  <th className="pb-3 font-normal">Source</th>
                  <th className="pb-3 font-normal">Status</th>
                  <th className="pb-3 text-right font-normal">Videos</th>
                </tr>
              </thead>
              <tbody>
                {history.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="py-3 pr-3">
                      {new Date(r.started_at).toLocaleString()}
                    </td>
                    <td className="py-3 pr-3 capitalize text-muted">{r.source}</td>
                    <td className="py-3 pr-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${statusCls[r.status] ?? "bg-panel-2 text-muted"}`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 text-right font-semibold">
                      {r.videos_upserted}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  capitalize,
}: {
  label: string;
  value?: string | null;
  capitalize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-2">
      <dt className="text-muted">{label}</dt>
      <dd className={capitalize ? "capitalize" : ""}>{value || "—"}</dd>
    </div>
  );
}
