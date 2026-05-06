import { createFileRoute, Link } from "@tanstack/react-router";
import { Bot, BellRing, MessageSquareText, ShieldCheck, ArrowRight } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/parents")({
  head: () => ({
    meta: [
      { title: "For Parents — SmartAttendAI" },
      {
        name: "description",
        content:
          "Stay updated on your child’s attendance and exam scores through a simple Telegram chat. No new apps. No extra logins.",
      },
      { property: "og:title", content: "Parents — Just chat. Get answers." },
      {
        property: "og:description",
        content:
          "SmartAttendAI sends real-time updates and red-flag alerts straight to your Telegram.",
      },
    ],
  }),
  component: ParentsPage,
});

function ParentsPage() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="For parents"
        title={<>Just chat. <span className="text-gradient">Get answers.</span></>}
        description="No portals, no passwords, no app stores. SmartAttendAI lives inside Telegram — the messenger you already use."
      >
        <Button asChild size="lg" className="bg-gradient-primary shadow-elegant">
          <Link to="/dashboard">Get the bot link <ArrowRight className="ml-1 h-4 w-4" /></Link>
        </Button>
      </PageHero>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-elegant">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground">
                <Bot className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-sm font-semibold">SmartAttendAI on Telegram</p>
                <p className="text-xs text-muted-foreground">always online in your chat</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <Bubble side="right">Was Aarav in school today?</Bubble>
              <Bubble side="left">Yes ✅ — present all 6 periods. Today’s attendance: 100%.</Bubble>
              <Bubble side="right">How is his Math?</Bubble>
              <Bubble side="left">
                Latest quiz: <strong>92/100</strong>. Term average: <strong>88%</strong>.
              </Bubble>
              <Bubble side="right">Send me this month’s summary</Bubble>
              <Bubble side="left">
                📅 March: 21/22 days present · 95.4% · 2 quizzes (avg 89%).
              </Bubble>
            </div>
          </div>

          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              What you can ask on Telegram
            </h2>
            <p className="mt-3 text-muted-foreground">
              Type the way you’d text a friend. The NLP engine maps your intent to your child’s
              real-time data in Telegram.
            </p>
            <ul className="mt-6 space-y-4">
              {items.map((it) => (
                <li
                  key={it.title}
                  className="flex gap-4 rounded-xl border border-border bg-card p-4 shadow-soft"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <it.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-display text-sm font-semibold">{it.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{it.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function Bubble({ side, children }: { side: "left" | "right"; children: React.ReactNode }) {
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

const items = [
  { icon: MessageSquareText, title: "Daily attendance", desc: "“Was my kid in class today?” — instantly verified." },
  { icon: BellRing, title: "Auto red-flag alerts", desc: "Get pinged when attendance drops below 75%." },
  { icon: Bot, title: "Exam scores in plain English", desc: "Ask about a subject. Get latest quiz, average, trend." },
  { icon: ShieldCheck, title: "Private & secure", desc: "Only verified parents see their own child’s data." },
];
