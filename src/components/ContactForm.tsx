"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { profile } from "@/content/profile";

type State = { kind: "idle" } | { kind: "sending" } | { kind: "sent"; to: string } | { kind: "error"; message: string };

// Matches the caps enforced in worker/index.ts, so the browser stops the
// visitor before the server has to.
const LIMITS = { name: 100, email: 200, subject: 150, message: 5000 } as const;

const field =
  "w-full rounded-[10px] bg-surface px-4 py-3 text-[16px] text-ink shadow-[inset_0_0_0_1px_var(--line-2)] outline-none transition-shadow placeholder:text-ink-3 focus:shadow-[inset_0_0_0_2px_var(--ink)]";

function explain(status: number, serverMessage?: string): string {
  if (status === 429) return "Too many messages from this connection. Wait a few minutes and try again.";
  if (status === 413) return "That message is longer than the form accepts. Shorten it, or send it by email.";
  if (status >= 400 && status < 500 && serverMessage) {
    return serverMessage.charAt(0).toUpperCase() + serverMessage.slice(1) + ".";
  }
  return `The message did not go through. Email me directly at ${profile.email}.`;
}

export default function ContactForm() {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [count, setCount] = useState(0);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    setState({ kind: "sending" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const isJson = res.headers.get("content-type")?.includes("application/json");
      const body = isJson ? ((await res.json()) as { status?: string; message?: string }) : null;
      if (!res.ok || body?.status !== "success") {
        setState({ kind: "error", message: explain(res.status, body?.message) });
        return;
      }
      setState({ kind: "sent", to: data.email });
      form.reset();
      setCount(0);
    } catch {
      setState({ kind: "error", message: `Could not reach the server. Check your connection, or email me at ${profile.email}.` });
    }
  };

  const sending = state.kind === "sending";

  return (
    <form onSubmit={onSubmit} className="relative grid grid-cols-1 gap-5 sm:grid-cols-2">
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-[14px] font-semibold text-ink">
          Name
        </label>
        <input id="name" name="name" type="text" required autoComplete="name" maxLength={LIMITS.name} className={field} />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-[14px] font-semibold text-ink">
          Email
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" maxLength={LIMITS.email} className={field} />
      </div>
      <div className="flex flex-col gap-2 sm:col-span-2">
        <label htmlFor="subject" className="text-[14px] font-semibold text-ink">
          Subject <span className="font-normal text-ink-3">(optional)</span>
        </label>
        <input id="subject" name="subject" type="text" maxLength={LIMITS.subject} className={field} />
      </div>
      <div className="flex flex-col gap-2 sm:col-span-2">
        <div className="flex items-baseline justify-between gap-4">
          <label htmlFor="message" className="text-[14px] font-semibold text-ink">
            Message
          </label>
          <span className="text-[13px] tabular-nums text-ink-3" aria-hidden>
            {count > LIMITS.message * 0.8 ? `${LIMITS.message - count} left` : ""}
          </span>
        </div>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          maxLength={LIMITS.message}
          onChange={(e) => setCount(e.target.value.length)}
          className={`${field} min-h-[10rem] resize-y`}
        />
      </div>

      {/* Honeypot: hidden from people and from assistive tech; bots fill it.
          The name matches nothing in a browser or password-manager profile.
          It used to be "company", which autofill fills for anyone with a work
          address saved, and the Worker then dropped their real message. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="hp">Leave this field empty</label>
        <input
          id="hp"
          name="hp"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          data-1p-ignore=""
          data-lpignore="true"
          data-bwignore=""
          data-form-type="other"
        />
      </div>

      <div className="flex flex-col gap-4 sm:col-span-2 sm:flex-row sm:items-center">
        <button type="submit" disabled={sending} className="key key-primary">
          {sending && <Loader2 aria-hidden className="h-4 w-4 animate-spin" />}
          {sending ? "Sending" : "Send message"}
        </button>
        <p role="status" aria-live="polite" className="text-[15px] leading-snug">
          {state.kind === "sent" && <span className="text-ok">Message sent. I will reply to {state.to}.</span>}
          {state.kind === "error" && <span className="text-danger">{state.message}</span>}
        </p>
      </div>
    </form>
  );
}
