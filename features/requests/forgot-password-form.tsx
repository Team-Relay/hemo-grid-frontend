"use client";

import { ArrowLeft, CheckCircle2, Mail } from "lucide-react";
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
    }, 650);
  }

  return (
    <main className="auth-simple-shell">
      <div className="auth-simple-topbar">
        <Wordmark />
        <span>Secure organization access</span>
      </div>
      <section className="auth-simple-card">
        <span className="auth-simple-icon">
          {submitted ? <CheckCircle2 size={21} /> : <Mail size={21} />}
        </span>
        <p className="eyebrow">Account recovery</p>
        <h1>{submitted ? "Check your email" : "Reset your password"}</h1>
        <p>
          {submitted
            ? `If ${email} belongs to a HemoGrid workspace, password reset instructions have been prepared.`
            : "Enter the work email associated with your organization. This demo validates the complete recovery interaction locally."}
        </p>

        {!submitted ? (
          <form onSubmit={submit} noValidate>
            <div className="field">
              <label htmlFor="recovery-email">Work email</label>
              <input
                id="recovery-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@organization.org"
                aria-invalid={Boolean(error)}
              />
              {error && (
                <span className="field-error" role="alert">
                  {error}
                </span>
              )}
            </div>
            <Button type="submit" isLoading={submitting} loadingText="Preparing instructions…">
              Send recovery instructions
            </Button>
          </form>
        ) : (
          <Button type="button" variant="secondary" onClick={() => setSubmitted(false)}>
            Use another email
          </Button>
        )}

        <Link href="/login" className="back-link auth-back-link">
          <ArrowLeft size={14} /> Return to sign in
        </Link>
      </section>
    </main>
  );
}
