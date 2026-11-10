"use client";

import { useActionState, useState } from "react";
import {
  Activity,
  ArrowRight,
  Building2,
  Check,
  Eye,
  EyeOff,
  Landmark,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { loginAction } from "@/app/actions/auth";
import { Wordmark } from "@/components/layout/app-shell";
import { Button, cn } from "@/components/ui/core";
import { initialLoginState } from "@/lib/auth/login-action-state";

const roles = [
  {
    id: "hospital",
    label: "Hospital",
    email: "hospital.demo@hemogrid.local",
    password: "HospitalDemo123!",
    icon: Building2,
  },
  {
    id: "blood-bank",
    label: "Blood bank",
    email: "bank.demo@hemogrid.local",
    password: "BankDemo123!",
    icon: Landmark,
  },
  {
    id: "admin",
    label: "Platform admin",
    email: "admin.demo@hemogrid.local",
    password: "AdminDemo123!",
    icon: ShieldCheck,
  },
] as const;

export function LoginForm() {
  const [role, setRole] = useState<(typeof roles)[number]>(roles[0]);
  const [visible, setVisible] = useState(false);
  const [password, setPassword] = useState<string>(role.password);
  const [state, formAction, isPending] = useActionState(loginAction, initialLoginState);
  const emailError = state.fieldErrors?.email?.[0];
  const passwordError = state.fieldErrors?.password?.[0];
  const formError = !emailError && !passwordError ? state.message : "";

  return (
    <main className="grid min-h-screen grid-cols-1 bg-white lg:grid-cols-2">
      <section className="relative hidden min-h-screen overflow-hidden bg-canvas px-[clamp(40px,4vw,72px)] py-10 lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-[280px] -top-[330px] h-[760px] w-[760px] rounded-full border border-brand/10 shadow-[0_0_0_90px_rgba(108,92,231,0.025),0_0_0_180px_rgba(108,92,231,0.018)]" />

        <div className="relative z-10 flex items-center justify-between gap-5">
          <Wordmark variant="plain" />
          <span className="inline-flex items-center gap-2 text-[11px] font-light text-muted">
            <ShieldCheck size={14} strokeWidth={1.8} /> Verified network access
          </span>
        </div>

        <div className="relative z-10 max-w-[610px] py-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/85 px-3 py-2 text-[11px] font-semibold text-success shadow-[0_2px_10px_rgba(18,183,106,0.06)]">
            <i className="h-1.5 w-1.5 rounded-full bg-current shadow-[0_0_0_4px_rgba(18,183,106,0.12)]" />
            Abuja network operational
          </span>
          <h1 className="mt-7 max-w-[610px] text-[clamp(36px,3.15vw,46px)] font-medium leading-[1.05] tracking-[-0.04em] text-ink">
            <span className="whitespace-nowrap">Critical blood coordination,</span> without the
            noise.
          </h1>
          <p className="mt-6 max-w-[510px] text-[15px] font-light leading-7 text-muted">
            One secure operational view connecting hospitals, screened inventory, and urgent
            transfers across the network.
          </p>
          <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3 text-[11px] text-[#46534f]">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck size={15} className="text-brand" /> Verified facilities
            </span>
            <span className="inline-flex items-center gap-2">
              <Activity size={15} className="text-brand" /> Live availability
            </span>
          </div>
        </div>

        <div className="relative z-10 rounded-[20px] border border-white/90 bg-white/78 p-5 shadow-[0_18px_48px_rgba(31,45,40,0.07)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-5">
            <div>
              <strong className="block text-[12px] font-semibold text-ink">
                Network visibility
              </strong>
              <span className="mt-1 block text-[10px] font-light text-muted">
                Live operational coverage across Abuja
              </span>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-success-soft px-2.5 py-1.5 text-[10px] font-semibold text-success">
              <i className="h-1.5 w-1.5 rounded-full bg-current" /> Live
            </span>
          </div>

          <div className="login-nodes my-1">
            <i />
            <i />
            <i />
            <i />
            <i />
            <svg viewBox="0 0 100 46" aria-hidden="true">
              <path d="M8 31 C24 7, 41 36, 53 18 S78 4, 92 28" />
            </svg>
          </div>

          <div className="grid grid-cols-3 border-t border-border pt-4">
            {[
              ["18", "Connected facilities"],
              ["1,284", "Units visible"],
              ["4", "Active transfers"],
            ].map(([value, label], index) => (
              <div
                className={cn("min-w-0", index > 0 && "border-l border-border pl-5")}
                key={label}
              >
                <strong className="block text-[17px] font-semibold tracking-[-0.025em] text-ink">
                  {value}
                </strong>
                <span className="mt-1 block text-[9.5px] font-light uppercase tracking-[0.035em] text-muted">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative flex min-h-screen items-center justify-center bg-white px-5 py-8 sm:px-10 sm:py-10 lg:px-[clamp(52px,5vw,88px)]">
        <div className="w-full max-w-[470px]">
          <div className="mb-12 lg:hidden">
            <Wordmark variant="plain" />
          </div>

          <div className="mb-7">
            <span className="mb-4 grid h-11 w-11 place-items-center rounded-xl border border-[#dcddfc] bg-brand-soft text-brand">
              <LockKeyhole size={19} strokeWidth={1.8} />
            </span>
            <p className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.1em] text-brand">
              Secure workspace
            </p>
            <h2 className="m-0 text-[32px] font-semibold tracking-[-0.045em] text-ink">
              Sign in to HemoGrid
            </h2>
            <p className="mt-3 max-w-[420px] text-[13px] font-light leading-6 text-muted">
              Select your organization workspace and continue to the coordination console.
            </p>
          </div>

          <form action={formAction} noValidate>
            <fieldset className="mb-6 border-0 p-0">
              <legend className="mb-2.5 text-[11.5px] font-medium text-[#35423f]">
                Workspace type
              </legend>
              <div className="grid grid-cols-3 gap-1 rounded-[15px] bg-surface-muted p-1.5">
                {roles.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => {
                      setRole(item);
                      setPassword(item.password);
                    }}
                    className={cn(
                      "relative flex min-h-[76px] min-w-0 flex-col items-start justify-center gap-2 rounded-[11px] px-3 text-left text-[10.5px] font-medium transition-all duration-150 disabled:cursor-wait",
                      item.id === role.id
                        ? "bg-white text-brand-dark shadow-[0_2px_10px_rgba(38,42,39,0.08)] ring-1 ring-border"
                        : "text-muted hover:bg-white/70 hover:text-ink",
                    )}
                    aria-pressed={item.id === role.id}
                    disabled={isPending}
                  >
                    <span
                      className={cn(
                        "grid h-7 w-7 place-items-center rounded-lg border",
                        item.id === role.id
                          ? "border-[#d7d8fb] bg-brand-soft text-brand"
                          : "border-border bg-white text-[#5d6966]",
                      )}
                    >
                      <item.icon size={16} strokeWidth={1.8} />
                    </span>
                    <span className="truncate">{item.label}</span>
                    {item.id === role.id && (
                      <Check size={13} className="absolute right-2.5 top-2.5 text-brand" />
                    )}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="mb-4">
              <label
                htmlFor="email"
                className="mb-2 block text-[11.5px] font-medium text-[#35423f]"
              >
                Work email
              </label>
              <div className="flex min-h-12 items-center gap-2.5 rounded-xl border border-border-strong bg-white px-3.5 text-muted-2 transition focus-within:border-brand/60 focus-within:text-brand focus-within:ring-4 focus-within:ring-brand-soft">
                <Mail size={16} strokeWidth={1.8} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={role.email}
                  readOnly
                  aria-invalid={Boolean(emailError)}
                  aria-describedby={emailError ? "email-error" : undefined}
                  className="min-h-[46px] min-w-0 flex-1 border-0 bg-transparent p-0 text-[13px] text-[#4e5b58] outline-none"
                />
              </div>
              {emailError && (
                <span
                  id="email-error"
                  className="mt-2 block text-[10.5px] text-critical"
                  role="alert"
                >
                  {emailError}
                </span>
              )}
            </div>

            <div className="mb-4">
              <div className="mb-2 flex items-baseline justify-between">
                <label htmlFor="password" className="text-[11.5px] font-medium text-[#35423f]">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[10.5px] font-medium text-brand hover:text-brand-dark"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="flex min-h-12 items-center gap-2.5 rounded-xl border border-border-strong bg-white pl-3.5 text-muted-2 transition focus-within:border-brand/60 focus-within:text-brand focus-within:ring-4 focus-within:ring-brand-soft">
                <LockKeyhole size={16} strokeWidth={1.8} />
                <input
                  id="password"
                  name="password"
                  type={visible ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  aria-invalid={Boolean(passwordError || formError)}
                  aria-describedby={passwordError || formError ? "login-error" : undefined}
                  className="min-h-[46px] min-w-0 flex-1 border-0 bg-transparent p-0 text-[13px] text-ink outline-none"
                />
                <button
                  type="button"
                  onClick={() => setVisible(!visible)}
                  aria-label={visible ? "Hide password" : "Show password"}
                  className="grid h-11 w-11 place-items-center border-0 bg-transparent text-muted transition-colors hover:text-ink"
                >
                  {visible ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {(passwordError || formError) && (
                <span
                  id="login-error"
                  className="mt-2 block text-[10.5px] text-critical"
                  role="alert"
                >
                  {passwordError || formError}
                </span>
              )}
            </div>

            <label className="mb-6 flex items-center gap-2.5 text-[11px] font-light text-[#53615e]">
              <input
                name="remember"
                type="checkbox"
                defaultChecked
                className="h-3.5 w-3.5 accent-brand"
              />
              <span>Keep me signed in on this device</span>
            </label>

            <Button
              type="submit"
              isLoading={isPending}
              loadingText="Opening workspace…"
              className="min-h-12 w-full text-[13px]"
            >
              Continue to workspace <ArrowRight size={16} />
            </Button>

            <div className="mt-6 flex items-start gap-2.5 border-t border-border pt-5 text-[10px] font-light leading-5 text-muted">
              <ShieldCheck size={14} className="mt-0.5 shrink-0 text-success" />
              <p className="m-0">
                Demo credentials are verified by the HemoGrid API. Your access token is kept in a
                secure HttpOnly session cookie.
              </p>
            </div>
          </form>

          <p className="mt-8 text-[9.5px] font-light uppercase tracking-[0.06em] text-muted-2">
            HemoGrid coordination console · Secure demo environment
          </p>
        </div>
      </section>
    </main>
  );
}
