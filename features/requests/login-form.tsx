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
    <main className="grid h-dvh min-h-0 min-w-0 grid-cols-1 overflow-hidden bg-[#f6f8f8] lg:grid-cols-[minmax(0,1.035fr)_minmax(0,0.965fr)]">
      <section className="relative hidden h-full min-h-0 overflow-hidden bg-[#102b39] px-[clamp(32px,4.2vw,70px)] py-[clamp(20px,3.8vh,38px)] text-white lg:flex lg:flex-col" aria-label="HemoGrid dispatch mission">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -right-40 -top-52 h-[540px] w-[540px] rounded-full border border-[#8ce7d5]/10" />
          <div className="absolute -right-24 -top-36 h-[390px] w-[390px] rounded-full border border-[#8ce7d5]/10" />
          <div className="absolute -bottom-52 -left-44 h-[450px] w-[450px] rounded-full bg-[#29535c]/25 blur-[100px]" />
        </div>

        <header className="relative z-10 flex shrink-0 items-center justify-between gap-4">
          <Link href="/login" className="inline-flex items-center gap-2.5 text-[16px] font-bold tracking-[-0.035em] text-white">
            <span className="grid h-8 w-8 place-items-center rounded-[10px] border border-[#a1ecde]/25 bg-[#a1ecde]/10">
              <Activity size={17} strokeWidth={2} className="text-[#a0e8d9]" />
            </span>
            HemoGrid
          </Link>
          <span className="text-[10px] font-medium text-[#a9c2cb]">Synthetic demo</span>
        </header>

        <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-center py-5">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#8ce7d5]/25 bg-[#8ce7d5]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#a4eedd]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#a4eedd]" aria-hidden="true" />
            Emergency blood dispatch
          </span>
          <h1 className="mt-5 max-w-[650px] text-[clamp(35px,3.55vw,58px)] font-semibold leading-[1.09] tracking-[-0.05em] text-white">
            The closest blood bank{" "}
            <span className="text-[#9ae6d9]">is not always</span>{" "}
            the right one.
          </h1>
          <p className="mt-5 max-w-[470px] text-[13px] leading-[1.75] text-[#c3d5da]">
            Match available blood, not just distance. Make every urgent dispatch
            decision with stock, compatibility and cold-chain evidence.
          </p>

          <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2.5 text-[11px] font-medium text-[#d5ecea]">
            <span className="inline-flex items-center gap-1.5"><Building2 size={14} className="text-[#9ae6d9]" /> Available stock</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} className="text-[#9ae6d9]" /> Compatible supply</span>
            <span className="inline-flex items-center gap-1.5"><ThermometerSnowflake size={14} className="text-[#9ae6d9]" /> Cold-chain checks</span>
          </div>
        </div>

        <footer className="relative z-10 flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-t border-white/15 pt-4 text-[10px] text-[#9fbfc7]">
          <span>47 synthetic facilities</span>
          <span className="text-[#8ce7d5]" aria-hidden="true">·</span>
          <span>Joint dispatch planning</span>
          <span className="text-[#8ce7d5]" aria-hidden="true">·</span>
          <span>Human approval required</span>
        </footer>
      </section>

      <section className="flex h-full min-h-0 min-w-0 items-center justify-center overflow-y-auto bg-[#f6f8f8] px-4 py-3 sm:px-6 lg:px-[clamp(28px,4vw,70px)]" aria-label="Sign in">
        <div className="w-full max-w-[430px] rounded-[22px] border border-[#e5eaea] bg-white px-5 py-5 shadow-[0_20px_60px_rgba(16,43,57,0.055)] sm:px-7 sm:py-6">
          <div className="mb-4 lg:hidden">
            <Wordmark variant="plain" />
            <p className="mb-0 mt-3 text-[18px] font-semibold leading-[1.2] tracking-[-0.035em] text-[#102b39]">
              The closest blood bank is not always the right one.
            </p>
          </div>

          <header className="mb-4">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#14796c]">Demo workspace</p>
            <h2 className="m-0 text-[27px] font-semibold leading-[1.15] tracking-[-0.045em] text-[#102b39]">
              Sign in to HemoGrid
            </h2>
          </header>

          <form method="post" onSubmit={handleSubmit} noValidate>
            <fieldset className="mb-3 border-0 p-0">
              <legend className="mb-1.5 text-[11px] font-semibold text-[#344a50]">Choose a demo role</legend>
              <div className="grid grid-cols-3 gap-1 rounded-xl border border-[#e1e9e8] bg-[#f3f7f6] p-1">
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
                      "relative flex min-h-[57px] min-w-0 flex-col items-start justify-center gap-1 rounded-[9px] px-2 text-left text-[10px] font-medium transition-colors disabled:cursor-wait sm:px-3",
                      item.id === role.id
                        ? "bg-white text-[#086b60] shadow-sm ring-1 ring-[#c6dcd6]"
                        : "text-[#657982] hover:bg-white/75 hover:text-[#102b39]",
                    )}
                    aria-pressed={item.id === role.id}
                    disabled={isPending || !isReady}
                  >
                    <item.icon size={15} strokeWidth={1.8} />
                    <span className="max-w-full truncate">{item.label}</span>
                    {item.id === role.id && <Check size={12} className="absolute right-1.5 top-1.5 text-[#087668]" />}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="mb-3">
              <label htmlFor="email" className="mb-1 block text-[11px] font-semibold text-[#344a50]">Work email</label>
              <div className="flex min-h-[42px] items-center gap-2.5 rounded-[10px] border border-[#d6e2e1] bg-white px-3 text-[#78929a] transition-colors focus-within:border-[#168778] focus-within:ring-2 focus-within:ring-[#ddf4ef]">
                <Mail size={15} strokeWidth={1.8} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={role.email}
                  readOnly
                  aria-invalid={Boolean(emailError)}
                  aria-describedby={emailError ? "email-error" : undefined}
                  className="h-[42px] min-w-0 flex-1 border-0 bg-transparent p-0 text-[12px] text-[#253b43] outline-none"
                />
              </div>
              <FieldError id="email-error" message={emailError} />
            </div>

            <div className="mb-3">
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <label htmlFor="password" className="text-[11px] font-semibold text-[#344a50]">Demo password</label>
                <span className="text-[10px] font-medium text-[#087668]">Already filled</span>
              </div>
              <div className="flex min-h-[42px] items-center gap-2.5 rounded-[10px] border border-[#d6e2e1] bg-white pl-3 text-[#78929a] transition-colors focus-within:border-[#168778] focus-within:ring-2 focus-within:ring-[#ddf4ef]">
                <LockKeyhole size={15} strokeWidth={1.8} />
                <input
                  id="password"
                  name="password"
                  type={visible ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  aria-invalid={Boolean(passwordError || formError)}
                  aria-describedby={passwordError || formError ? "login-error" : undefined}
                  className="h-[42px] min-w-0 flex-1 border-0 bg-transparent p-0 text-[12px] text-[#253b43] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setVisible(!visible)}
                  aria-label={visible ? "Hide password" : "Show password"}
                  className="grid h-[42px] w-[42px] shrink-0 place-items-center border-0 bg-transparent text-[#78929a] hover:text-[#102b39]"
                >
                  {visible ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <FieldError id="login-error" message={passwordError || formError} />
            </div>

            <label className="mb-4 flex items-center gap-2 text-[10.5px] text-[#60757b]">
              <input name="remember" type="checkbox" defaultChecked className="h-3.5 w-3.5 accent-[#0c766a]" />
              <span>Keep me signed in</span>
            </label>

            <Button
              type="submit"
              disabled={!isReady}
              isLoading={isPending}
              loadingText="Opening workspace…"
              className="min-h-[44px] w-full !border-[#0b7469] !bg-[#0b7469] text-[12px] !text-white hover:!bg-[#095e56]"
            >
              Continue to workspace <ArrowRight size={16} />
            </Button>
          </form>

          <div className="mt-4 flex items-center gap-1.5 border-t border-[#edf1f0] pt-3 text-[10px] text-[#6b8086]">
            <ShieldCheck size={13} className="shrink-0 text-[#168778]" />
            <span>Credentials are prefilled. Choose a role and click Continue. Do not use your personal password.</span>
          </div>
        </div>
      </section>
    </main>

  );
}
