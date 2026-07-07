"use client";

import { useActionState, useRef, useEffect } from "react";
import { createUser, type AdminState } from "@/app/actions/admin";
import { PlusIcon } from "@/components/icons";

export function CreateUserForm() {
  const [state, action, pending] = useActionState<AdminState, FormData>(
    createUser,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form
      ref={formRef}
      action={action}
      className="flex flex-wrap items-end gap-3"
    >
      <Field name="email" type="email" placeholder="user@email.com" label="Email" />
      <Field name="full_name" placeholder="Full name" label="Name" />
      <Field name="password" type="password" placeholder="Temp password" label="Password" />
      <label className="flex flex-col gap-1 text-xs text-muted">
        Tier
        <select
          name="tier"
          defaultValue="free"
          className="rounded-xl border border-border bg-panel-2 px-3 py-2.5 text-sm text-fg outline-none focus:border-accent"
        >
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="business">Business</option>
        </select>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-1.5 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink disabled:opacity-60"
      >
        <PlusIcon width={16} height={16} /> {pending ? "Creating…" : "Create user"}
      </button>

      {state.error && (
        <p className="w-full text-sm text-flame">{state.error}</p>
      )}
      {state.ok && <p className="w-full text-sm text-accent">{state.ok}</p>}
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  placeholder,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-muted">
      {label}
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={name !== "full_name"}
        className="rounded-xl border border-border bg-panel-2 px-3 py-2.5 text-sm text-fg outline-none focus:border-accent"
      />
    </label>
  );
}
