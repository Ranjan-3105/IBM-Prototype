import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

export function StatCard({ label, value, hint, icon }: { label: string; value: ReactNode; hint?: ReactNode; icon?: ReactNode }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
        </div>
        {icon && <div className="rounded-lg bg-accent p-2 text-accent-foreground [&_svg]:size-5">{icon}</div>}
      </div>
      {hint && <div className="mt-2 text-xs text-muted-foreground">{hint}</div>}
    </Card>
  );
}
