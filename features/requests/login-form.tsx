/** Accessible login experience backed directly by the Spring Boot API and shared session cookie. */

"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import { useRouter } from "next/navigation";
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
  ThermometerSnowflake,
} from "lucide-react";
import Link from "next/link";
import { z } from "zod";

import { syncSessionCookieAction } from "@/app/actions/auth";
import { Wordmark } from "@/components/layout/app-shell";
import { Button, FieldError, cn } from "@/components/ui/core";
import { login } from "@/lib/api/auth";
import { ApiClientError } from "@/lib/api/errors";
import { setClientSessionCookie } from "@/lib/auth/client-session";
import { initialLoginState, type LoginActionState } from "@/lib/auth/login-action-state";
import { workspacePathForRole } from "@/lib/auth/roles";

const loginSchema = z.object({
  email: z.email("Enter a valid work email address.").trim(),
  password: z.string().min(1, "Enter your password."),
  remember: z.boolean(),
});

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

// Stable, zero-event external store for the SSR -> hydrated client transition.
const subscribeHydration = () => () => {};
const readyClientSnapshot = () => true;
const unreadyServerSnapshot = () => false;

function fieldErrorsByName(error: ApiClientError): LoginActionState["fieldErrors"] {
  const grouped: NonNullable<LoginActionState["fieldErrors"]> = {};

  for (const fieldError of error.fieldErrors) {
    if (fieldError.field === "email" || fieldError.field === "password") {
      grouped[fieldError.field] = [...(grouped[fieldError.field] ?? []), fieldError.message];
    }
  }

  return grouped;
}

export function LoginForm() {
  const router = useRouter();
  const [role, setRole] = useState<(typeof roles)[number]>(roles[0]);
  const [visible, setVisible] = useState(false);
  const [password, setPassword] = useState<string>(role.password);
  const [state, setState] = useState<LoginActionState>(initialLoginState);
  const [isPending, setIsPending] = useState(false);
  // During SSR and hydration, the native submit remains disabled.
  // React switches to the client snapshot after hydration has completed.
  const isReady = useSyncExternalStore(
    subscribeHydration,
    readyClientSnapshot,
    unreadyServerSnapshot,
  );

  const emailError = state.fieldErrors?.email?.[0];
  const passwordError = state.fieldErrors?.password?.[0];
  const formError = !emailError && !passwordError ? state.message : "";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending || !isReady) return;

    const formData = new FormData(event.currentTarget);
    const validated = loginSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
      remember: formData.get("remember") === "on",
    });

    if (!validated.success) {
      const fields = z.flattenError(validated.error).fieldErrors;
      setState({
        message: "Check the highlighted fields and try again.",
        fieldErrors: {
          email: fields.email,
          password: fields.password,
        },
      });
      return;
    }

    setIsPending(true);
    setState(initialLoginState);

    try {
      const response = await login({
        email: validated.data.email,
        password: validated.data.password,
      });

      setClientSessionCookie(
        response.accessToken,
        response.expiresIn,
        validated.data.remember,
      );
      await syncSessionCookieAction(response, validated.data.remember);
      router.replace(workspacePathForRole(response.user.role));
    } catch (error) {
      setIsPending(false);
      if (error instanceof ApiClientError) {
        setState({
          message: error.status === 401 ? "The email or password is incorrect." : error.message,
          fieldErrors: fieldErrorsByName(error),
        });
        return;
      }

      setState({
        message: "Sign-in failed. Please try again.",
      });
    }
  }

  return (
    <main className="grid min-h-screen min-w-0 grid-cols-1 bg-[#f7f9fb] lg:grid-cols-[minmax(0,1.035fr)_minmax(0,0.965fr)]">
      <section className="relative hidden min-h-screen overflow-hidden bg-[#102b39] px-[clamp(36px,4.1vw,68px)] py-9 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -right-[240px] -top-[300px] h-[650px] w-[650px] rounded-full border border-[#70c3b6]/15" />
          <div className="absolute -right-[160px] -top-[210px] h-[480px] w-[480px] rounded-full border border-[#70c3b6]/15" />
          <div className="absolute -bottom-44 -left-48 h-[430px] w-[430px] rounded-full bg-[#234959]/40 blur-[90px]" />
        </div>

        <header className="relative z-10 flex items-center justify-between gap-4">
          <Link href="/login" className="inline-flex items-center gap-2.5 text-[16px] font-bold tracking-[-0.035em] text-white">
            <span className="grid h-8 w-8 place-items-center rounded-[10px] border border-[#80e1d1]/30 bg-[#80e1d1]/10">
              <Activity size={17} className="text-[#91f0dd]" strokeWidth={2.2} />
            </span>
            HemoGrid
          </Link>
          <span className="inline-flex items-center gap-2 text-[10px] font-medium text-[#b5cad2]">
            <ShieldCheck size={13} className="text-[#90e8d7]" />
            Synthetic demo workspace
          </span>
        </header>

        <div className="relative z-10 max-w-[610px] py-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#70c3b6]/25 bg-[#80e1d1]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#a2ecdd]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#9ce8db] motion-safe:animate-pulse" aria-hidden="true" />
            Emergency blood dispatch
          </span>

          <h1 className="mt-6 max-w-[600px] text-[clamp(38px,3.65vw,59px)] font-semibold leading-[1.075] tracking-[-0.052em] text-white">
            The closest blood bank{" "}
            <span className="text-[#92e8d7]">is not always</span>{" "}
            the right one.
          </h1>
          <p className="mt-5 max-w-[530px] text-[13.5px] leading-[1.9] text-[#c4d4da]">
            Proximity alone cannot confirm usable blood. HemoGrid helps teams review
            recorded stock, blood-group rules and cold-chain evidence, then coordinate
            supply across competing emergency requests.
          </p>

          <div className="mt-7 flex flex-wrap gap-x-5 gap-y-3">
            <span className="inline-flex items-center gap-2 text-[11px] font-medium text-[#e0efed]">
              <Building2 size={15} className="text-[#93e9d9]" /> Inventory-aware matching
            </span>
            <span className="inline-flex items-center gap-2 text-[11px] font-medium text-[#e0efed]">
              <ThermometerSnowflake size={15} className="text-[#93e9d9]" /> Cold-chain safeguards
            </span>
            <span className="inline-flex items-center gap-2 text-[11px] font-medium text-[#e0efed]">
              <Activity size={15} className="text-[#93e9d9]" /> Joint dispatch planning
            </span>
          </div>
        </div>

        <div className="relative z-10 rounded-[20px] border border-[#7398a3]/25 bg-white/[0.06] p-4 shadow-[0_16px_45px_rgba(1,15,24,0.16)] backdrop-blur-sm sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="m-0 text-[12px] font-semibold tracking-[-0.01em] text-white">
                A better dispatch decision
              </p>
              <p className="mb-0 mt-1 text-[10.5px] text-[#abc3cb]">
                An illustrative decision path, not live clinical data
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-[#8ee1d0]/20 bg-[#8ee1d0]/10 px-2.5 py-1 text-[10px] font-semibold text-[#b7f8ea]">
              Demo
            </span>
          </div>

          <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch gap-2.5">
            <div className="min-w-0 rounded-xl border border-[#ad7b7c]/20 bg-[#4b3039]/45 p-3">
              <span className="block text-[9.5px] font-bold uppercase tracking-[0.09em] text-[#f1b7b4]">
                Distance only
              </span>
              <strong className="mt-1.5 block text-[12px] font-semibold text-white">Nearest site</strong>
              <span className="mt-1 block text-[10px] leading-4 text-[#d1c3c9]">
                Stock and safety still unknown
              </span>
            </div>
            <div className="flex items-center justify-center" aria-hidden="true">
              <ArrowRight className="text-[#95e4d5]" size={17} />
            </div>
            <div className="min-w-0 rounded-xl border border-[#8bdccc]/30 bg-[#4d9b8f]/15 p-3">
              <span className="block text-[9.5px] font-bold uppercase tracking-[0.09em] text-[#9df0db]">
                Evidence-led
              </span>
              <strong className="mt-1.5 block text-[12px] font-semibold text-white">Eligible proposal</strong>
              <span className="mt-1 block text-[10px] leading-4 text-[#c6dedb]">
                Stock, compatibility and cold chain
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/15 pt-4">
            {[
              ["47", "Seeded facilities"],
              ["2–5", "Requests per plan"],
              ["3", "Staff workspaces"],
            ].map(([value, label]) => (
              <div key={label} className="min-w-0">
                <strong className="block text-[17px] font-semibold tracking-tight text-white tabular-nums">
                  {value}
                </strong>
                <span className="mt-1 block text-[9.5px] leading-4 text-[#aac2cb]">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative flex min-h-screen min-w-0 items-center justify-center bg-[#f7f9fb] px-4 py-8 sm:px-7 sm:py-10 lg:px-[clamp(32px,4.3vw,76px)]">
        <div className="w-full max-w-[476px] rounded-[24px] border border-[#e2e8eb] bg-white px-5 py-7 shadow-[0_24px_64px_rgba(19,42,55,0.055)] sm:px-9 sm:py-9">
          <div className="mb-7 lg:hidden">
            <Wordmark variant="plain" />
            <p className="mb-0 mt-4 max-w-[360px] text-[18px] font-semibold leading-[1.25] tracking-[-0.035em] text-[#123340]">
              The closest blood bank is not always the right one.
            </p>
            <p className="mb-0 mt-2 text-[11px] font-medium text-[#498176]">
              Emergency blood dispatch · Synthetic demonstration
            </p>
          </div>

          <div className="mb-6">
            <span className="mb-4 grid h-11 w-11 place-items-center rounded-xl border border-[#c9e3dc] bg-[#effaf6] text-[#217f71]">
              <LockKeyhole size={19} strokeWidth={1.8} />
            </span>
            <p className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.1em] text-brand">
              Your coordination workspace
            </p>
            <h2 className="m-0 text-[30px] font-semibold tracking-[-0.045em] text-ink sm:text-[32px]">
              Sign in to HemoGrid
            </h2>
            <p className="mt-3 max-w-[420px] text-[13px] font-light leading-6 text-muted">
              Choose a demo role to explore the hospital, blood-bank or network-coordination workflow.
            </p>
          </div>

          <form method="post" onSubmit={handleSubmit} noValidate>
            <fieldset className="mb-5 border-0 p-0">
              <legend className="mb-2.5 text-[11.5px] font-medium text-[#35423f]">
                Workspace type
              </legend>
              <div className="grid grid-cols-3 gap-1 rounded-[15px] border border-[#e5ebed] bg-[#f5f8f8] p-1.5">
                {roles.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => {
                      setRole(item);
                      setPassword(item.password);
                      setState(initialLoginState);
                    }}
                    className={cn(
                      "relative flex min-h-[75px] min-w-0 flex-col items-start justify-center gap-2 rounded-[11px] px-2.5 text-left text-[10.5px] font-medium transition-all duration-150 disabled:cursor-wait sm:px-3",
                      item.id === role.id
                        ? "bg-white text-brand-dark shadow-[0_2px_10px_rgba(38,42,39,0.08)] ring-1 ring-border"
                        : "text-muted hover:bg-white/70 hover:text-ink",
                    )}
                    aria-pressed={item.id === role.id}
                    disabled={isPending || !isReady}
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
                    <span className="max-w-full truncate">{item.label}</span>
                    {item.id === role.id && (
                      <Check size={13} className="absolute right-2.5 top-2.5 text-brand" />
                    )}
                  </button>
                ))}
              </div>
            </fieldset>

            <p className="mb-5 mt-2 text-[10.5px] leading-5 text-muted">Prefilled synthetic credentials. No patient data is required.</p>

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
              <FieldError id="email-error" message={emailError} />
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
              <FieldError id="login-error" message={passwordError || formError} />
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
              disabled={!isReady}
              isLoading={isPending}
              loadingText="Opening workspace…"
              className="min-h-12 w-full text-[13px]"
            >
              Continue to workspace <ArrowRight size={16} />
            </Button>

            <div className="mt-5 flex items-start gap-2.5 border-t border-border pt-4 text-[10px] font-normal leading-5 text-muted">
              <ShieldCheck size={14} className="mt-0.5 shrink-0 text-success" />
              <p className="m-0">
                Demo sign-in is verified by the HemoGrid API. Do not enter real patient information.
              </p>
            </div>
          </form>

          <p className="mt-5 text-center text-[9.5px] font-medium uppercase tracking-[0.11em] text-muted-2">
            HemoGrid · Emergency request and dispatch · Prototype
          </p>
        </div>
      </section>
    </main>
  );
}
