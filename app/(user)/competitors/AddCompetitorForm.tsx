"use client";

import { useActionState, useRef, useEffect } from "react";
import { addCompetitor, type CompState } from "@/app/actions/competitors";
import { PlusIcon } from "@/components/icons";

export function AddCompetitorForm() {
  const [state, action, pending] = useActionState<CompState, FormData>(
    addCompetitor,
    {},
  );
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.ok]);

  return (
    <form ref={ref} action={action} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <input
          name="channel"
          placeholder="Channel URL or @handle  (e.g. https://youtube.com/@MrBeast)"
          required
          className="min-w-[280px] flex-1 rounded-xl border border-border bg-panel-2 px-4 py-3 text-sm text-fg outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-1.5 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-accent-ink disabled:opacity-60"
        >
          <PlusIcon width={16} height={16} />
          {pending ? "Fetching…" : "Add competitor"}
        </button>
      </div>
      {state.error && <p className="text-sm text-flame">{state.error}</p>}
      {state.ok && <p className="text-sm text-accent">{state.ok}</p>}
    </form>
  );
}
