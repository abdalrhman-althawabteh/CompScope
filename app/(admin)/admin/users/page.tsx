import Link from "next/link";
import { Topbar } from "@/components/ui/Topbar";
import { Card } from "@/components/ui/Card";
import { ChevronRight } from "@/components/icons";
import { createClient } from "@/lib/supabase/server";
import { deleteUser } from "@/app/actions/admin";
import { CreateUserForm } from "./CreateUserForm";

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  subscription_tier: string;
  subscription_status: string;
  created_at: string;
};

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select(
      "id, email, full_name, role, subscription_tier, subscription_status, created_at",
    )
    .order("created_at", { ascending: false });

  const users = (profiles ?? []) as Profile[];

  return (
    <div className="flex flex-col gap-6">
      <Topbar stat={`${users.length} accounts`} />
      <div>
        <h1 className="text-4xl font-semibold tracking-tight">Users</h1>
        <p className="mt-2 text-muted">
          Create and manage customer accounts and subscriptions.
        </p>
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">New account</h2>
        <CreateUserForm />
      </Card>

      <Card variant="white">
        <table className="w-full text-left">
          <thead>
            <tr className="text-xs text-neutral-400">
              <th className="pb-3 font-normal">User</th>
              <th className="pb-3 font-normal">Role</th>
              <th className="pb-3 font-normal">Tier</th>
              <th className="pb-3 font-normal">Status</th>
              <th className="pb-3 text-right font-normal">Manage</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-dashed border-neutral-200">
                <td className="py-3.5 pr-3">
                  <div className="font-medium text-neutral-900">
                    {u.full_name || "—"}
                  </div>
                  <div className="text-sm text-neutral-500">{u.email}</div>
                </td>
                <td className="py-3.5 pr-3">
                  <span
                    className={
                      "rounded-full px-3 py-1 text-xs font-medium " +
                      (u.role === "admin"
                        ? "bg-[#efe6ff] text-[#5b3ea6]"
                        : "bg-neutral-100 text-neutral-600")
                    }
                  >
                    {u.role}
                  </span>
                </td>
                <td className="py-3.5 pr-3 capitalize text-neutral-700">
                  {u.subscription_tier}
                </td>
                <td className="py-3.5 pr-3 capitalize text-neutral-700">
                  {u.subscription_status}
                </td>
                <td className="py-3.5">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="flex items-center gap-1 rounded-full bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white"
                    >
                      Manage <ChevronRight width={14} height={14} />
                    </Link>
                    {u.role !== "admin" && (
                      <form action={deleteUser}>
                        <input type="hidden" name="id" value={u.id} />
                        <button
                          type="submit"
                          className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-500 hover:border-flame hover:text-flame"
                        >
                          Delete
                        </button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
