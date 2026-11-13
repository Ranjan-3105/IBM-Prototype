import { Link } from "react-router-dom";
import { ArrowRight, Building2, GraduationCap, HandHeart, Lightbulb, ScanSearch, ShieldCheck, Sparkles, Target } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { homeFor } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const PEOPLE = [
  { icon: GraduationCap, who: "College student", has: "React, Java, UI skills — no work experience", fails: "Filtered out by “experience required”" },
  { icon: HandHeart, who: "Local NGO", has: "Needs a simple website, no budget", fails: "Can't afford recruitment, never posts on job sites" },
  { icon: Building2, who: "Small business", has: "Needs social media help a few hours a week", fails: "The work is informal and never reaches job portals" },
];

const FEATURES = [
  { icon: Sparkles, title: "Skill DNA", text: "Describe what you can do in your own words. AI pulls out your skills; you confirm them." },
  { icon: Target, title: "Explainable matching", text: "Skills, availability, location, evidence and accessibility, scored deterministically and explained in plain English." },
  { icon: Lightbulb, title: "Gap Analyzer", text: "Instead of “not eligible”: what you have, what's missing, what to learn next, and what you already qualify for." },
  { icon: ShieldCheck, title: "Proof of ability", text: "Projects, GitHub and portfolios, plus endorsements from organisations you've worked with." },
];

export default function Landing() {
  const { user } = useAuth();
  const ctaTo = user ? (user.role === "SEEKER" ? "/seeker/assistant" : homeFor(user.role)) : "/register";
  return (
    <>
      <section className="relative overflow-hidden border-b bg-card">
        <div aria-hidden className="absolute -top-40 right-0 size-[36rem] rounded-full bg-accent blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-[1.15fr_1fr] md:py-24">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-sm text-muted-foreground">
              <span className="size-2 rounded-full bg-success" aria-hidden /> Live in Bhubaneswar
            </p>
            <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
              Opportunity <span className="text-primary">without barriers.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              SkillBridge connects students, local workers, NGOs and small businesses. We don't only ask what experience you have. We work out what you can do, what you want to do, and which opportunities you can realistically reach.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={ctaTo} className={buttonVariants({ size: "lg" })}>
                Try “Your Next Opportunity” <ArrowRight aria-hidden />
              </Link>
              <Link to="/opportunities" className={buttonVariants({ size: "lg", variant: "outline" })}>
                Browse opportunities
              </Link>
            </div>
          </div>
          <Card className="self-center p-5 shadow-lg">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">You type</p>
            <p className="mt-2 rounded-lg bg-muted p-3 text-sm italic">
              “I'm a 2nd-year engineering student, I know Java, React and basic SQL, I can work 2 hours a day, I prefer remote work and I have no experience.”
            </p>
            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">SkillBridge returns</p>
            <ul className="mt-2 space-y-2 text-sm">
              <li className="flex items-center gap-2"><ScanSearch className="size-4 text-primary" aria-hidden /> Your skill profile: Java · React · SQL · 14 h/week · remote</li>
              <li className="flex items-center gap-2"><Target className="size-4 text-primary" aria-hidden /> Top 3 matching opportunities with match %</li>
              <li className="flex items-center gap-2"><Lightbulb className="size-4 text-primary" aria-hidden /> One concrete next step to unlock more</li>
            </ul>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-semibold tracking-tight">Job portals filter people out by resume</h2>
        <p className="mt-2 text-muted-foreground">Three people in the same city who never find each other:</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {PEOPLE.map((p) => (
            <Card key={p.who} className="p-5">
              <p.icon className="size-6 text-primary" aria-hidden />
              <p className="mt-3 font-semibold">{p.who}</p>
              <p className="mt-1 text-sm">{p.has}</p>
              <p className="mt-3 text-sm text-destructive">{p.fails}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y bg-card">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <div key={f.title}>
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <f.icon className="size-5" aria-hidden />
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">0{i + 1}</span>
                </div>
                <p className="mt-3 font-semibold">{f.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 rounded-xl border bg-background p-5 text-sm">
            <p className="font-medium">The AI never decides who matches.</p>
            <p className="mt-1 text-muted-foreground">
              Hard filters remove what you can't realistically do, then a transparent formula scores the rest:{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">M = 0.40·Skills + 0.20·Availability + 0.15·Location + 0.15·Evidence + 0.10·Fit</code>. Gemini only explains the result in plain language.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-16 md:grid-cols-2">
        {[
          { title: "Looking for opportunities?", text: "Internships, part-time work, freelance gigs, volunteering and community projects — matched to what you can actually do.", to: "/register?role=SEEKER", cta: "Create your Skill DNA" },
          { title: "An NGO or small business?", text: "Post what you need in minutes. See applicants ranked by match, with the evidence behind every score.", to: "/register?role=ORGANISATION", cta: "Post an opportunity" },
        ].map((c) => (
          <Card key={c.title} className="flex flex-col p-6">
            <h3 className="text-xl font-semibold">{c.title}</h3>
            <p className="mt-2 flex-1 text-muted-foreground">{c.text}</p>
            <Link to={user ? homeFor(user.role) : c.to} className={cn(buttonVariants({ variant: "outline" }), "mt-5 self-start")}>
              {c.cta} <ArrowRight aria-hidden />
            </Link>
          </Card>
        ))}
      </section>
    </>
  );
}
