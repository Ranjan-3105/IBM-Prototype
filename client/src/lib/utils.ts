import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Pulls a readable message out of an axios / API error. */
export function errorMessage(err: unknown, fallback = "Something went wrong") {
  const e = err as { response?: { data?: { message?: string; issues?: { path?: (string | number)[]; message: string }[] } }; message?: string };
  const data = e?.response?.data;
  if (data?.issues?.length) {
    const first = data.issues[0]!;
    return `${first.path?.join(".") ?? ""} ${first.message}`.trim();
  }
  return data?.message ?? e?.message ?? fallback;
}

export const inr = (n?: number | null) =>
  n == null ? "" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export const titleCase = (s: string) => s.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export const formatDate = (d?: string | Date | null) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";
