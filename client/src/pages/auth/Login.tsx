import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError, Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { homeFor } from "@/context/AuthContext";
import { errorMessage } from "@/lib/utils";

const Schema = z.object({ email: z.string().email("Enter a valid email"), password: z.string().min(1, "Enter your password") });
type Form = z.infer<typeof Schema>;

const DEMO = [
  { role: "Seeker (student)", email: "student@demo.skillbridge" },
  { role: "Organisation (NGO)", email: "ngo@demo.skillbridge" },
  { role: "Admin", email: "admin@demo.skillbridge" },
  { role: "Seeker (wheelchair user)", email: "sourav@demo.skillbridge" },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const { register, handleSubmit, setValue, formState } = useForm<Form>({ resolver: zodResolver(Schema) });

  const onSubmit = async (v: Form) => {
    setBusy(true);
    try {
      const u = await login(v.email, v.password);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? homeFor(u.role), { replace: true });
    } catch (e) {
      toast.error(errorMessage(e, "Login failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-1 text-muted-foreground">Log in to see your matches.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-4" noValidate>
        <div className="grid gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" aria-invalid={!!formState.errors.email} {...register("email")} />
          <FieldError message={formState.errors.email?.message} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="current-password" aria-invalid={!!formState.errors.password} {...register("password")} />
          <FieldError message={formState.errors.password?.message} />
        </div>
        <Button type="submit" size="lg" disabled={busy}>
          {busy ? "Logging in…" : "Log in"}
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted-foreground">
        New here?{" "}
        <Link to="/register" className="font-medium text-primary underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>

      <div className="mt-8 rounded-xl border bg-card p-4">
        <p className="text-sm font-medium">Demo accounts for judges</p>
        <p className="text-xs text-muted-foreground">
          Password for all: <code className="rounded bg-muted px-1 font-mono">Demo@1234</code> — click to fill
        </p>
        <ul className="mt-3 grid gap-1.5">
          {DEMO.map((d) => (
            <li key={d.email}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted cursor-pointer"
                onClick={() => {
                  setValue("email", d.email);
                  setValue("password", "Demo@1234");
                }}
              >
                <span className="text-muted-foreground">{d.role}</span>
                <span className="font-mono text-xs">{d.email}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
