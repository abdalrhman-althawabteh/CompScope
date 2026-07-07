"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  CompetitorsIcon,
  CalendarIcon,
  ChartIcon,
  SparkIcon,
  SettingsIcon,
  UsersIcon,
  LogoutIcon,
} from "@/components/icons";
import { signOut } from "@/app/actions/auth";

const NAV = [
  { href: "/dashboard", icon: HomeIcon, label: "Dashboard" },
  { href: "/competitors", icon: CompetitorsIcon, label: "Competitors" },
  { href: "/timeline", icon: CalendarIcon, label: "Timeline" },
  { href: "/analytics", icon: ChartIcon, label: "Analytics" },
  { href: "/assistant", icon: SparkIcon, label: "AI Assistant" },
  { href: "/settings", icon: SettingsIcon, label: "Settings" },
];

export function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const nav = isAdmin
    ? [...NAV, { href: "/admin/users", icon: UsersIcon, label: "Admin" }]
    : NAV;

  return (
    <aside className="flex w-[68px] shrink-0 flex-col items-center gap-2 py-6">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-panel-2 text-accent">
        <span className="text-xs font-semibold">+2</span>
      </div>

      <nav className="flex flex-1 flex-col items-center gap-3">
        {nav.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              title={label}
              aria-label={label}
              className={
                "flex h-11 w-11 items-center justify-center rounded-full transition-colors " +
                (active
                  ? "bg-white text-black"
                  : "bg-panel-2 text-muted hover:text-fg")
              }
            >
              <Icon />
            </Link>
          );
        })}
      </nav>

      <form action={signOut}>
        <button
          type="submit"
          title="Log out"
          aria-label="Log out"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-panel-2 text-muted hover:text-fg"
        >
          <LogoutIcon />
        </button>
      </form>
    </aside>
  );
}
