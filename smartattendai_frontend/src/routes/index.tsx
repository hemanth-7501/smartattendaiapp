import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  ShieldCheck,
  BellRing,
  BarChart3,
  MessageSquareText,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero-dashboard.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SmartAttendAI — Real-time attendance & parent alerts on Telegram" },
      {
        name: "description",
        content:
          "SmartAttendAI connects schools and parents through a Telegram chatbot. Automated attendance, exam scores and red-flag alerts — in plain English.",
      },
      { property: "og:title", content: "SmartAttendAI — Schools, Parents, in sync." },
      {
        property: "og:description",
        content:
          "A web dashboard for teachers and HODs, plus a smart Telegram bot for parents. Real-time updates, no clunky portals.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <SiteLayout>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 grid-bg opacity-60" aria-hidden />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:px-8 lg:py-28">
          <div className="flex flex-col justify-center">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              NLP-powered Telegram bot
            </span>
            <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Schools and parents,{" "}
              <span className="text-gradient">finally in sync.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
              SmartAttendAI gives teachers a clean web dashboard to mark attendance and exam
              scores — and gives parents instant, plain-English answers through a Telegram
              chatbot. No more end-of-term surprises.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-gradient-primary shadow-elegant">
                <Link to="/contact">
                  Get a demo <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/features">Explore features</Link>
              </Button>
            </div>
            <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-border/60 pt-6">
              {[
                { k: "Real-time", v: "attendance sync" },
                { k: "75%", v: "auto red-flag alerts" },
                { k: "0", v: "extra apps for parents" },
              ].map((s) => (
                <div key={s.v}>
                  <dt className="font-display text-2xl font-semibold">{s.k}</dt>
                  <dd className="mt-1 text-xs text-muted-foreground">{s.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-3xl bg-gradient-primary opacity-20 blur-3xl" />
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-elegant">
              <img
                src={heroImg}
                alt="SmartAttendAI dashboard preview with Telegram alerts"
                className="h-full w-full object-cover"
                loading="eager"
              />
            </div>
            <div className="absolute -bottom-4 -left-4 hidden rounded-xl border border-border bg-card p-4 shadow-soft sm:block">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <BellRing className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs text-muted-foreground">Alert sent</p>
                  <p className="font-display text-sm font-semibold">
                    Attendance below 75%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Why SmartAttendAI
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Everything schools need, nothing parents have to learn.
          </h2>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-border bg-card p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-elegant"
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

      {/* ROLES */}
      <section className="border-y border-border/60 bg-surface/60">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              One platform. Three roles. Zero friction.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Built around how schools actually work — with secure role-based access for HODs,
              teachers and parents.
            </p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {roles.map((r) => (
              <div
                key={r.title}
                className="rounded-2xl border border-border bg-card p-7 shadow-soft"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  {r.tag}
                </p>
                <h3 className="mt-2 font-display text-xl font-semibold">{r.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{r.desc}</p>
                <ul className="mt-5 space-y-2">
                  {r.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TELEGRAM DEMO */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              Telegram bot
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Parents just ask. The bot understands.
            </h2>
            <p className="mt-4 text-muted-foreground">
              No commands, no codes, no new apps. Powered by NLP, the bot pulls real-time
              attendance and exam data from natural-language questions like
              <em> “How did my kid do in Math?”</em>
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "Plain-English questions, instant answers",
                "Auto red-flag alerts when attendance drops below 75%",
                "Weekly & monthly summaries on demand",
              ].map((p) => (
                <li key={p} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Button asChild className="bg-gradient-primary shadow-elegant">
                <Link to="/parents">For parents <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-elegant">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground">
                <Bot className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-sm font-semibold">SmartAttendAI Bot</p>
                <p className="text-xs text-muted-foreground">online · typing…</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <ChatBubble side="right">How did Aarav do in Math this week?</ChatBubble>
              <ChatBubble side="left">
                Aarav scored <strong>92/100</strong> in the Algebra quiz on Tuesday and{" "}
                <strong>88%</strong> overall this week 📈
              </ChatBubble>
              <ChatBubble side="right">Was he in class today?</ChatBubble>
              <ChatBubble side="left">
                Yes — present in all 6 periods today. Monthly attendance:{" "}
                <strong>91%</strong>.
              </ChatBubble>
              <div className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs">
                ⚠️ Auto-alert: Riya’s attendance dropped to 72% — below the 75% threshold.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-primary p-10 text-primary-foreground shadow-elegant sm:p-14">
          <div className="absolute inset-0 grid-bg opacity-20" aria-hidden />
          <div className="relative grid items-center gap-6 lg:grid-cols-[1fr_auto]">
            <div>
              <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Ready to close the school–home gap?
              </h2>
              <p className="mt-3 max-w-2xl text-sm text-primary-foreground/85 sm:text-base">
                Bring SmartAttendAI to your school in days, not months. Free pilot for the
                first cohort.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="bg-background text-foreground hover:bg-background/90"
              >
                <Link to="/contact">Request a demo</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Link to="/features">See features</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function ChatBubble({ side, children }: { side: "left" | "right"; children: React.ReactNode }) {
  return (
    <div className={`flex ${side === "right" ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-soft ${
          side === "right"
            ? "rounded-br-sm bg-primary text-primary-foreground"
            : "rounded-bl-sm bg-secondary text-foreground"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

const features = [
  {
    icon: BellRing,
    title: "Instant parent alerts",
    desc: "The moment a teacher saves attendance, parents get a Telegram update. No SMS spam, no missed emails.",
  },
  {
    icon: Bot,
    title: "Conversational NLP bot",
    desc: "Parents ask questions like they’d text a friend. The bot understands intent and replies with real data.",
  },
  {
    icon: ShieldCheck,
    title: "Role-based access",
    desc: "Secure authentication for HODs, teachers and parents — each role sees only what they should.",
  },
  {
    icon: BarChart3,
    title: "Attendance analytics",
    desc: "Visual dashboards reveal trends, like classes consistently missing first period.",
  },
  {
    icon: MessageSquareText,
    title: "Auto red-flag system",
    desc: "Attendance drops below 75% and the system pings parents — long before a parent-teacher meeting.",
  },
  {
    icon: Sparkles,
    title: "No new apps to learn",
    desc: "Parents already use Telegram. We meet them where they are — no portal logins required.",
  },
];

const roles = [
  {
    tag: "Teachers",
    title: "Mark attendance in seconds",
    desc: "One clean dashboard replaces stacks of paper registers.",
    points: [
      "Digital roll call & instant save",
      "Upload exam marks in a click",
      "Auto notifications to parents",
    ],
  },
  {
    tag: "HODs",
    title: "See the big picture",
    desc: "Departmental trends and faculty management in one place.",
    points: ["Live class & section trends", "Faculty account management", "Exportable reports"],
  },
  {
    tag: "Parents",
    title: "Stay in the loop, effortlessly",
    desc: "Just chat with the bot on Telegram — no extra apps.",
    points: ["Daily attendance & marks", "Red-flag alerts <75%", "Weekly & monthly summaries"],
  },
];
