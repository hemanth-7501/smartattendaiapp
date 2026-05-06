import { createFileRoute } from "@tanstack/react-router";
import {
  Bot,
  BellRing,
  ShieldCheck,
  BarChart3,
  MessageSquareText,
  Sparkles,
  ClipboardList,
  Users,
  GraduationCap,
  Lock,
  Languages,
  LineChart,
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — SmartAttendAI" },
      {
        name: "description",
        content:
          "Real-time attendance, NLP Telegram bot, automated red-flag alerts, role-based dashboards and analytics — every feature in SmartAttendAI.",
      },
      { property: "og:title", content: "Features — SmartAttendAI" },
      {
        property: "og:description",
        content:
          "Everything that powers SmartAttendAI: web dashboards, NLP bot, alerts and analytics.",
      },
    ],
  }),
  component: FeaturesPage,
});

const features = [
  { icon: ClipboardList, title: "Digital attendance", desc: "Replace paper registers with one-tap roll call across classes and sections." },
  { icon: Bot, title: "NLP Telegram bot", desc: "Parents type naturally — the bot understands intent and pulls accurate data." },
  { icon: BellRing, title: "Real-time alerts", desc: "Instant parent notifications the moment attendance or marks are saved." },
  { icon: ShieldCheck, title: "Role-based auth", desc: "Granular permissions for HODs, teachers and parents — secure by default." },
  { icon: BarChart3, title: "Attendance analytics", desc: "Visual dashboards expose trends, gaps and at-risk students at a glance." },
  { icon: MessageSquareText, title: "Auto red-flag alerts", desc: "Drops below 75% trigger automatic parent pings — no waiting for term-end." },
  { icon: GraduationCap, title: "Exam score tracking", desc: "Upload marks once. Parents and HODs get them instantly, in context." },
  { icon: Users, title: "Multi-class management", desc: "Teachers handle multiple classes from a single, organized dashboard." },
  { icon: Lock, title: "Secure data flow", desc: "Encrypted communication and strict access boundaries between roles." },
  { icon: LineChart, title: "Weekly & monthly summaries", desc: "Parents pull a quick recap from the bot — no calls to the school office." },
  { icon: Languages, title: "Future: multi-language bot", desc: "Roadmap support for regional languages so every family is included." },
  { icon: Sparkles, title: "Future: AI risk prediction", desc: "Predict which students may need early intervention — before grades slip." },
];

function FeaturesPage() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="Features"
        title={<>Everything in one <span className="text-gradient">connected</span> system.</>}
        description="From digital roll call to NLP-powered parent alerts — SmartAttendAI removes the busywork and closes the school–home gap."
      />
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border bg-card p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-elegant"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
