import { ArrowRight, BarChart3, Briefcase, Clock3, ShieldCheck, Users } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";

const featureCards = [
  {
    title: "Track employee productivity",
    description: "Monitor work hours, active sessions, and performance trends from a unified dashboard.",
    icon: BarChart3
  },
  {
    title: "Manage projects and tasks",
    description: "Give teams visibility into priorities, assignments, and deadlines across the organization.",
    icon: Briefcase
  },
  {
    title: "Monitor activity with clarity",
    description: "Review activity insights, tracked time, and screenshots with role-based access controls.",
    icon: ShieldCheck
  }
];

const benefits = [
  "Analyze work performance with productivity trends and usage insights.",
  "Reduce manual reporting with centralized timesheets and tracked-time views.",
  "Support distributed teams with a consistent employee and admin experience."
];

const Index = () => {
  const location = useLocation();

  return (
    <>
      <SEO
        title="TaskHive - Employee Monitoring & Productivity Platform"
        description="TaskHive is a modern employee monitoring and productivity tracking platform for companies."
        path={location.pathname}
      />

      <div className="min-h-screen bg-[linear-gradient(180deg,rgba(109,163,250,0.15),transparent_30%),radial-gradient(circle_at_top_left,rgba(219,188,156,0.28),transparent_32%),hsl(var(--background))]">
        <header className="border-b border-border/70 bg-background/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <div>
              <p className="text-lg font-semibold tracking-tight text-foreground">TaskHive</p>
              <p className="text-sm text-muted-foreground">Employee Monitoring & Productivity Platform</p>
            </div>
            <div className="flex items-center gap-3">
              <Button asChild variant="ghost">
                <Link to="/home">Explore</Link>
              </Button>
              <Button asChild>
                <Link to="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </header>

        <main>
          <section className="mx-auto grid max-w-6xl gap-10 px-6 py-20 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                Built for modern teams that need visibility and accountability
              </div>
              <div className="space-y-5">
                <h1 className="max-w-3xl text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
                  TaskHive helps companies track productivity, monitor activity, and manage work in one platform.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                  Monitor employee productivity, analyze work patterns, manage projects, and keep reporting organized with clean dashboards for admins and employees.
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <Button asChild size="lg" className="gap-2">
                  <Link to="/login">
                    Start with TaskHive
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/home">View platform overview</Link>
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm">
                  <p className="text-3xl font-semibold text-foreground">24/7</p>
                  <p className="mt-2 text-sm text-muted-foreground">Visibility into workforce activity and tracked time.</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm">
                  <p className="text-3xl font-semibold text-foreground">1 hub</p>
                  <p className="mt-2 text-sm text-muted-foreground">Projects, tasks, reports, and employee insights in one workflow.</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm">
                  <p className="text-3xl font-semibold text-foreground">Role-based</p>
                  <p className="mt-2 text-sm text-muted-foreground">Separate admin and employee experiences with controlled access.</p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-border/70 bg-card/85 p-8 shadow-2xl shadow-primary/10">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-secondary/60 p-5">
                  <Clock3 className="h-8 w-8 text-primary" />
                  <h2 className="mt-4 text-xl font-semibold text-foreground">Time tracking</h2>
                  <p className="mt-2 text-sm text-muted-foreground">Track employee productivity with session data, timers, and timesheets.</p>
                </div>
                <div className="rounded-2xl bg-muted/50 p-5">
                  <Users className="h-8 w-8 text-primary" />
                  <h2 className="mt-4 text-xl font-semibold text-foreground">Team visibility</h2>
                  <p className="mt-2 text-sm text-muted-foreground">Monitor activity, attendance, and productivity trends across teams.</p>
                </div>
                <div className="rounded-2xl bg-muted/40 p-5 sm:col-span-2">
                  <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Core outcomes</p>
                  <ul className="mt-4 grid gap-3 text-sm text-foreground sm:grid-cols-2">
                    <li>Monitor activity</li>
                    <li>Manage projects</li>
                    <li>Analyze work performance</li>
                    <li>Improve operational accountability</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-6 py-8">
            <div className="grid gap-6 md:grid-cols-3">
              {featureCards.map((feature) => (
                <article key={feature.title} className="rounded-3xl border border-border/70 bg-card/80 p-7 shadow-sm">
                  <feature.icon className="h-10 w-10 text-primary" />
                  <h2 className="mt-5 text-2xl font-semibold text-foreground">{feature.title}</h2>
                  <p className="mt-3 text-base leading-7 text-muted-foreground">{feature.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-6 py-20">
            <div className="grid gap-10 rounded-[2rem] border border-border/70 bg-card/85 p-8 lg:grid-cols-[0.9fr_1.1fr] lg:p-12">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Productivity benefits</p>
                <h2 className="mt-4 text-4xl font-bold tracking-tight text-foreground">SEO-friendly content backed by real platform value.</h2>
                <p className="mt-4 text-lg leading-8 text-muted-foreground">
                  TaskHive gives companies a structured way to understand employee output, improve reporting quality, and keep work aligned with business goals.
                </p>
              </div>
              <div className="grid gap-4">
                {benefits.map((benefit) => (
                  <div key={benefit} className="rounded-2xl border border-border/70 bg-background/70 p-5">
                    <p className="text-base leading-7 text-foreground">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-6 pb-24">
            <div className="rounded-[2rem] bg-[linear-gradient(135deg,hsl(var(--primary))/0.16,hsl(var(--muted))/0.28)] p-10 text-center shadow-xl shadow-primary/10">
              <h2 className="text-4xl font-bold tracking-tight text-foreground">Bring employee monitoring and productivity tracking into one system.</h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
                Give your organization clean dashboards, reporting visibility, and role-based workflows with TaskHive.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Button asChild size="lg">
                  <Link to="/login">Sign in to TaskHive</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/home">Learn more</Link>
                </Button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
};

export default Index;
