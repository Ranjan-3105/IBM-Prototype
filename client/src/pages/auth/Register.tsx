import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Building2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FieldError, Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { ORG_TYPES } from "@/types";
import { cn, errorMessage, titleCase } from "@/lib/utils";

const Schema = z
  .object({
    role: z.enum(["SEEKER", "ORGANISATION"]),
    name: z.string().trim().min(2, "At least 2 characters"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "At least 8 characters"),
    orgType: z.enum(ORG_TYPES).optional(),
  })
  .refine((d) => d.role !== "ORGANISATION" || !!d.orgType, { message: "Choose your organisation type", path: ["orgType"] });
type Form = z.infer<typeof Schema>;

export default function Register() {
  const { register: signup } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [busy, setBusy] = useState(false);
  const { register, handleSubmit, control, setValue, formState } = useForm<Form>({
    resolver: zodResolver(Schema),
    defaultValues: { role: params.get("role") === "ORGANISATION" ? "ORGANISATION" : "SEEKER" },
  });
  const role = useWatch({ control, name: "role" });

  const onSubmit = async (v: Form) => {
    setBusy(true);
    try {
      const u = await signup({ ...v, orgType: v.role === "ORGANISATION" ? v.orgType : undefined });
      toast.success(`Welcome, ${u.name.split(" ")[0]}!`);
      navigate(u.role === "ORGANISATION" ? "/org/profile" : "/seeker/assistant", { replace: true });
    } catch (e) {
      toast.error(errorMessage(e, "Registration failed"));
    } finally {
      setBusy(false);
    }
  };

  const roles = [
    { value: "SEEKER" as const, label: "I'm looking for opportunities", sub: "Student or local worker", icon: UserRound },
    { value: "ORGANISATION" as const, label: "I'm an organisation", sub: "NGO, small business or community group", icon: Building2 },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
      <p className="mt-1 text-muted-foreground">It takes under a minute.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-4" noValidate>
        <fieldset className="grid gap-2 sm:grid-cols-2">
          <legend className="sr-only">Account type</legend>
          {roles.map((r) => (
            <label
              key={r.value}
              className={cn("flex cursor-pointer flex-col gap-1 rounded-xl border bg-card p-4 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring", role === r.value && "border-primary bg-accent")}
            >
              <input type="radio" value={r.value} className="sr-only" checked={role === r.value} onChange={() => setValue("role", r.value)} />
              <r.icon className="size-5 text-primary" aria-hidden />
              <span className="font-medium">{r.label}</span>
              <span className="text-xs text-muted-foreground">{r.sub}</span>
            </label>
          ))}
        </fieldset>
        <div className="grid gap-1.5">
          <Label htmlFor="name">{role === "ORGANISATION" ? "Organisation name" : "Full name"}</Label>
          <Input id="name" autoComplete={role === "ORGANISATION" ? "organization" : "name"} aria-invalid={!!formState.errors.name} {...register("name")} />
          <FieldError message={formState.errors.name?.message} />
        </div>
        {role === "ORGANISATION" && (
          <div className="grid gap-1.5">
            <Label htmlFor="orgType">Organisation type</Label>
            <Select id="orgType" defaultValue="" aria-invalid={!!formState.errors.orgType} {...register("orgType")}>
              <option value="" disabled>
                Choose…
              </option>
              {ORG_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t === "NGO" ? "NGO" : titleCase(t)}
                </option>
              ))}
            </Select>
            <FieldError message={formState.errors.orgType?.message} />
          </div>
        )}
        <div className="grid gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" aria-invalid={!!formState.errors.email} {...register("email")} />
          <FieldError message={formState.errors.email?.message} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="new-password" aria-invalid={!!formState.errors.password} {...register("password")} />
          <FieldError message={formState.errors.password?.message} />
        </div>
        <Button type="submit" size="lg" disabled={busy}>
          {busy ? "Creating account…" : "Create account"}
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted-foreground">
        Already registered?{" "}
        <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
