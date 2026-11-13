import { Outlet } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/common/Logo";

export function AuthLayout() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-[oklch(0.3_0.06_200)] p-10 text-white lg:flex">
        <div className="[&_span]:text-white [&_.text-primary]:text-[oklch(0.85_0.1_180)]">
          <Logo />
        </div>
        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-semibold leading-tight">We don't ask what's on your resume. We work out what you can do.</h2>
          <ul className="mt-8 space-y-3 text-white/85">
            {["Skill-based matching, not keyword filters", "Every score explained in plain language", "Accessibility treated as a first-class need"].map((t) => (
              <li key={t} className="flex gap-3">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[oklch(0.85_0.1_180)]" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative z-10 text-sm text-white/60">Students · local workers · NGOs · small businesses — Bhubaneswar</p>
        <div aria-hidden className="absolute -right-24 -bottom-24 size-96 rounded-full bg-[oklch(0.5_0.1_186)] opacity-40 blur-3xl" />
      </aside>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
