import Link from "next/link";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/ui/Topbar";
import { Card } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/server";
import { fmtViews } from "@/lib/format";
import { updateSubscription, updatePassword } from "@/app/actions/admin";

export default async function ManageUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: u } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();
  if (!u) notFound();

  // Admin RLS bypass lets us read this customer's data.
  const [{ data: comps }, { data: vids }, { data: convos }] = await Promise.all([
    supabase
      .from("competitors")
      .select("id, channel_title, color, last_synced_at")
      .eq("owner_id", id)
      .order("created_at"),
    supabase
      .from("videos")
      .select(
        "id, title, url, published_at, view_count, competitor:competitors(channel_title, color)",
      )
      .eq("owner_id", id)
      .order("published_at", { ascending: false })
      .limit(8),
    supabase
      .from("ai_conversations")
      .select("id, title, updated_at")
      .eq("owner_id", id)
      .order("updated_at", { ascending: false })
      .limit(8),
  ]);

  const field =
    "rounded-xl border border-border bg-panel-2 px-3 py-2.5 text-sm text-fg outline-none focus:border-accent";

  return (
    <div className="stagger flex flex-col gap-6">
      <Topbar stat="Manage account" />
      <Link href="/admin/users" className="text-sm text-muted hover:text-fg">
        ← Back to users
      </Link>
      <div>
        <h1 className="text-4xl font-semibold tracking-tight">
          {u.full_name || u.email}
        </h1>
        <p className="mt-2 text-muted">
          {u.email} · role <span className="capitalize">{u.role}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Subscription</h2>
          <form action={updateSubscription} className="flex flex-col gap-3">
            <input type="hidden" name="id" value={u.id} />
            <label className="flex flex-col gap-1 text-xs text-muted">
              Tier
              <select name="tier" defaultValue={u.subscription_tier} className={field}>
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="business">Business</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-muted">
              Status
              <select
                name="status"
                defaultValue={u.subscription_status}
                className={field}
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="canceled">Canceled</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-muted">
              Expires at
              <input
                type="date"
                name="expires_at"
                defaultValue={u.subscription_expires_at?.slice(0, 10) ?? ""}
                className={field}
              />
            </label>
            <button
              type="submit"
              className="mt-1 rounded-xl bg-accent py-2.5 text-sm font-semibold text-accent-ink"
            >
              Save subscription
            </button>
          </form>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold">Reset password</h2>
          <form action={updatePassword} className="flex flex-col gap-3">
            <input type="hidden" name="id" value={u.id} />
            <label className="flex flex-col gap-1 text-xs text-muted">
              New password (8+ chars)
              <input
                type="password"
                name="password"
                minLength={8}
                required
                className={field}
              />
            </label>
            <button
              type="submit"
              className="mt-1 rounded-xl border border-border py-2.5 text-sm font-semibold hover:border-faint"
            >
              Update password
            </button>
          </form>
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">
          Competitors{" "}
          <span className="text-muted">({comps?.length ?? 0})</span>
        </h2>
        {comps && comps.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {comps.map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-panel-2 px-3 py-1.5 text-sm"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: c.color }}
                />
                {c.channel_title}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">No competitors tracked.</p>
        )}
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Recent videos</h2>
        {vids && vids.length > 0 ? (
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs text-faint">
                <th className="pb-3 font-normal">Title</th>
                <th className="pb-3 font-normal">Channel</th>
                <th className="pb-3 text-right font-normal">Views</th>
              </tr>
            </thead>
            <tbody>
              {vids.map((v) => {
                const comp = v.competitor as unknown as {
                  channel_title: string | null;
                  color: string;
                } | null;
                return (
                  <tr key={v.id} className="border-t border-border">
                    <td className="max-w-[220px] truncate py-3 pr-3 font-medium text-fg">
                      <a href={v.url ?? "#"} target="_blank" rel="noreferrer">
                        {v.title}
                      </a>
                    </td>
                    <td className="py-3 pr-3">
                      <span className="inline-flex items-center gap-1.5 text-sm text-muted">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: comp?.color ?? "#999" }}
                        />
                        {comp?.channel_title ?? "—"}
                      </span>
                    </td>
                    <td className="py-3 text-right font-semibold text-fg">
                      {fmtViews(v.view_count)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-muted">No videos synced yet.</p>
        )}
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">
          AI conversations{" "}
          <span className="text-muted">({convos?.length ?? 0})</span>
        </h2>
        {convos && convos.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {convos.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between rounded-xl bg-panel-2 px-3 py-2 text-sm"
              >
                <span className="truncate">{c.title || "Untitled"}</span>
                <span className="shrink-0 pl-3 text-xs text-faint">
                  {new Date(c.updated_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No conversations yet.</p>
        )}
      </Card>
    </div>
  );
}
