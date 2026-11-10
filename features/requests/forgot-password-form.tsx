/** Presentational recovery form retained until the backend exposes a reset-password contract. */

"use client";

import { ArrowLeft, CheckCircle2, Lock, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Wordmark } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/core";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.includes("@")) {
      setError("Enter a valid work email address.");
      return;
    }

    setError("");
    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 550);
  }

  return (
    <main className="min-h-screen flex flex-col justify-between p-6 sm:p-10 bg-[#0B0F15] text-white">
      {/* Top Bar */}
      <div className="flex items-center justify-between max-w-4xl mx-auto w-full">
        <Wordmark href="/login" />
        <span className="flex items-center gap-1.5 text-xs text-slate-400">
          <ShieldCheck size={14} className="text-emerald-400" /> Secure Organization Access
        </span>
      </div>

      {/* Card */}
      <section className="w-full max-w-md mx-auto my-auto bg-white border border-border rounded-3xl p-8 sm:p-9 shadow-2xl text-ink space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-brand-soft border border-brand/20 grid place-items-center text-brand shrink-0">
            {submitted ? (
              <CheckCircle2 size={20} className="text-emerald-600" />
            ) : (
              <Lock size={20} />
            )}
          </div>
          <div>
            <span className="text-[10.5px] font-bold text-brand uppercase tracking-wider block">
              Identity Verification
            </span>
            <h1 className="text-xl font-bold text-ink tracking-tight">
              {submitted ? "Recovery link dispatched" : "Reset workspace password"}
            </h1>
          </div>
        </div>

        <p className="text-xs text-muted leading-relaxed">
          {submitted
            ? `If ${email} is linked to a registered hospital or blood bank coordinator account, cryptographic reset instructions have been dispatched.`
            : "Enter your official organization work email. A temporary authentication recovery link will be sent to your inbox."}
        </p>

        {!submitted ? (
          <form onSubmit={submit} noValidate className="space-y-4">
            <div>
              <label
                htmlFor="recovery-email"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Work Email Address
              </label>
              <div className="relative flex items-center">
                <Mail size={16} className="absolute left-3.5 text-muted pointer-events-none" />
                <input
                  id="recovery-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="coordinator@hospital.org"
                  aria-invalid={Boolean(error)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-border-strong text-xs font-medium text-ink placeholder:text-muted focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>
              {error && (
                <span className="text-critical text-[11px] font-medium block mt-1.5" role="alert">
                  • {error}
                </span>
              )}
            </div>

            <Button
              type="submit"
              isLoading={submitting}
              loadingText="Verifying account…"
              className="w-full h-11 text-xs"
            >
              Send recovery instructions
            </Button>
          </form>
        ) : (
          <Button
            type="button"
            variant="secondary"
            onClick={() => setSubmitted(false)}
            className="w-full h-11 text-xs"
          >
            Use another work email
          </Button>
        )}

        <div className="pt-2 border-t border-border flex items-center justify-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:text-brand-dark transition-colors"
          >
            <ArrowLeft size={14} /> Return to sign in
          </Link>
        </div>
      </section>

      {/* Footer */}
      <p className="text-center text-[10.5px] text-slate-500">
        HemoGrid Operational Console · FIPS 140-2 Level 3 Cryptographic Access
      </p>
    </main>
  );
}
