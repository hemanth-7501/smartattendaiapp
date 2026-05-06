import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ClipboardList, Upload, BarChart3, Users, ArrowRight, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { WalkthroughModal } from "@/components/ui/WalkthroughModal";
import { MarksManagement } from "@/components/ui/MarksManagement";
import { SignInModal } from "@/components/ui/SignInModal";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export const Route = createFileRoute("/teachers")({
  head: () => ({
    meta: [
      { title: "For Teachers & HODs — SmartAttendAI" },
      {
        name: "description",
        content:
          "A clean, fast web dashboard for teachers to mark attendance and upload marks — and for HODs to monitor departmental trends.",
      },
      { property: "og:title", content: "Teachers & HODs — Less paperwork, more teaching." },
      {
        property: "og:description",
        content:
          "One dashboard for daily roll call, exam uploads and live class analytics.",
      },
    ],
  }),
  component: TeachersPage,
});

function TeachersPage() {
  const [walkthroughOpen, setWalkthroughOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const { isSignedIn, user } = useAuth();
  const navigate = useNavigate();

  const handleBookWalkthrough = () => {
    navigate({ to: "/dashboard/teacher" });
  };
  return (
    <SiteLayout>
      <PageHero
        eyebrow="For teachers & HODs"
        title={<>Less paperwork. <span className="text-gradient">More teaching.</span></>}
        description="Mark attendance, upload exam scores, and watch live trends — all from one focused dashboard built for the classroom."
      >
        <Button onClick={handleBookWalkthrough} size="lg" className="bg-gradient-primary shadow-elegant">
          Book a walkthrough <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </PageHero>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2">
          {capabilities.map((c) => (
            <div key={c.title} className="rounded-2xl border border-border bg-card p-7 shadow-soft">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <c.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 font-display text-lg font-semibold">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.desc}</p>
              <ul className="mt-5 space-y-2">
                {c.points.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* mock dashboard preview */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-elegant">
          <div className="flex items-center justify-between border-b border-border bg-surface/60 px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
            </div>
            <p className="text-xs text-muted-foreground">app.smartattendai.com / dashboard</p>
            <span />
          </div>
          <div className="grid gap-6 p-6 md:grid-cols-3">
            <div className="rounded-xl border border-border p-5">
              <p className="text-xs text-muted-foreground">Class average</p>
              <p className="mt-2 font-display text-3xl font-semibold">92.4%</p>
              <p className="mt-1 text-xs text-success">▲ 2.1% vs last week</p>
            </div>
            <div className="rounded-xl border border-border p-5">
              <p className="text-xs text-muted-foreground">At-risk students</p>
              <p className="mt-2 font-display text-3xl font-semibold">4</p>
              <p className="mt-1 text-xs text-warning">Below 75% threshold</p>
            </div>
            <div className="rounded-xl border border-border p-5">
              <p className="text-xs text-muted-foreground">Alerts sent today</p>
              <p className="mt-2 font-display text-3xl font-semibold">37</p>
              <p className="mt-1 text-xs text-muted-foreground">via Telegram</p>
            </div>
            <div className="md:col-span-3 rounded-xl border border-border p-5">
              <div className="flex items-center justify-between">
                <p className="font-display text-sm font-semibold">Weekly attendance</p>
                <p className="text-xs text-muted-foreground">CSE · Sem 4 · Section A</p>
              </div>
              <div className="mt-6 flex h-40 items-end gap-3">
                {[78, 84, 91, 88, 95, 72, 90].map((v, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-2">
                    <div
                      className="w-full rounded-md bg-gradient-primary"
                      style={{ height: `${v}%` }}
                    />
                    <span className="text-[10px] text-muted-foreground">
                      {["M", "T", "W", "T", "F", "S", "S"][i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marks Management Section */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border bg-card shadow-elegant p-6 sm:p-8">
          <MarksManagement />
        </div>
      </section>

      <WalkthroughModal open={walkthroughOpen} onOpenChange={setWalkthroughOpen} />
      <SignInModal open={signInOpen} onOpenChange={setSignInOpen} />
    </SiteLayout>
  );
}

const capabilities = [
  {
    icon: ClipboardList,
    title: "One-tap roll call",
    desc: "Take attendance for any class in under 30 seconds.",
    points: ["Bulk mark present/absent", "Auto-saves to the cloud", "Triggers parent alerts instantly"],
  },
  {
    icon: Upload,
    title: "Exam score uploads",
    desc: "Add marks in bulk. Parents see them right away.",
    points: ["CSV upload or manual entry", "Per-subject and per-quiz", "History maintained per student"],
  },
  {
    icon: BarChart3,
    title: "Live analytics (HOD)",
    desc: "Departmental dashboards reveal hidden patterns.",
    points: ["Class-level trends", "First-period absenteeism flags", "Exportable reports"],
  },
  {
    icon: Users,
    title: "Faculty management",
    desc: "Onboard teachers and manage permissions easily.",
    points: ["Role-based access", "Section assignments", "Audit logs"],
  },
];
