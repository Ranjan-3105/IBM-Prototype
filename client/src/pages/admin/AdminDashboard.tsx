import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Bot, Briefcase, Target, Timer, Users } from "lucide-react";
import { Page } from "@/layouts/AppLayout";
import { ErrorState, ListSkeleton, PageHeader } from "@/components/common/States";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { adminApi } from "@/services/admin";
import { OPP_TYPES, APP_STATUS } from "@/types";
import { titleCase } from "@/lib/utils";

const PRIMARY = "oklch(0.51 0.1 186)";
const MUTED = "oklch(0.78 0.03 250)";

export default function AdminDashboard() {
  const q = useQuery({ queryKey: ["admin-stats"], queryFn: adminApi.stats });
  if (q.isLoading)
    return (
      <Page>
        <ListSkeleton rows={3} className="h-40" />
      </Page>
    );
  if (q.isError || !q.data)
    return (
      <Page>
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      </Page>
    );
  const s = q.data;
  const byType = OPP_TYPES.map((t) => ({ name: titleCase(t), count: s.opportunities.byType[t] ?? 0 }));
  const funnel = APP_STATUS.map((st) => ({ name: titleCase(st), count: s.applications[st] ?? 0 }));
  const totalUsers = Object.values(s.users).reduce((a, b) => a + b, 0);

  return (
    <Page>
      <PageHeader
        title="Platform stats"
        description="Prototype measurements on the Bhubaneswar seed data."
        actions={
          <Badge variant={s.aiEnabled ? "success" : "muted"} className="px-3 py-1 text-sm">
            <Bot className="size-4" aria-hidden /> {s.aiEnabled ? "Gemini connected" : "AI fallback mode"}
          </Badge>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Users" value={totalUsers} icon={<Users />} hint={`${s.users.SEEKER ?? 0} seekers · ${s.users.ORGANISATION ?? 0} organisations`} />
        <StatCard label="Open opportunities" value={s.matching.openOpportunities} icon={<Briefcase />} hint={`${s.opportunities.byStatus.CLOSED ?? 0} closed`} />
        <StatCard label="Match rate" value={`${s.matching.matchRate}%`} icon={<Target />} hint={`Seekers with ≥1 eligible match · ${s.matching.avgEligiblePerSeeker} vs ${s.matching.avgKeywordPerSeeker} per seeker with keyword-only matching`} />
        <StatCard label="Matching speed" value={`${s.matching.evalMs} ms`} icon={<Timer />} hint={`${s.matching.pairsEvaluated} seeker × opportunity pairs scored`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Skills in demand vs supply</CardTitle>
            <CardDescription>Open opportunities needing each skill, against seekers who list it — where training would help most.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={s.topDemand} margin={{ left: -16, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.92 0.008 255)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-25} textAnchor="end" height={70} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip cursor={{ fill: "oklch(0.96 0.03 186 / 0.6)" }} />
                <Legend />
                <Bar dataKey="demand" name="Opportunities needing it" fill={PRIMARY} radius={[4, 4, 0, 0]} />
                <Bar dataKey="supply" name="Seekers who have it" fill={MUTED} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Open opportunities by type</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byType} margin={{ left: -16 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" name="Opportunities" fill={PRIMARY} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Applications by status</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel} margin={{ left: -16 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" name="Applications" fill={PRIMARY} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
