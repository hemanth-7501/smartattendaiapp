import { createFileRoute } from "@tanstack/react-router";
import { Target, Eye, Heart, Zap } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — SmartAttendAI" },
      {
        name: "description",
        content:
          "SmartAttendAI was built to close the communication gap between schools and parents using a simple, conversational platform.",
      },
      { property: "og:title", content: "About SmartAttendAI" },
      {
        property: "og:description",
        content: "Why we built SmartAttendAI and what we believe.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="About"
        title={<>Closing the gap between <span className="text-gradient">school and home.</span></>}
        description="Even with all today’s tech, parents still find out about issues weeks too late. SmartAttendAI fixes that with a real-time, conversational platform."
      />

      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="prose prose-neutral max-w-none text-base leading-relaxed text-foreground/90">
          <p>
            Schools rely on attendance and exam data, but communication between teachers and
            parents is still stuck in the past — paper registers, lost SMS, ignored emails.
            By the time a parent learns their child is falling behind, it’s often too late
            to help.
          </p>
          <p className="mt-4 text-muted-foreground">
            We built SmartAttendAI to flip that: instant updates, automated red-flag alerts,
            and a Telegram bot that understands plain English. Teachers focus on teaching,
            HODs see the bigger picture, and parents stay genuinely involved — without
            learning a single new app.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          {values.map((v) => (
            <div key={v.title} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <v.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 font-display text-lg font-semibold">{v.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}

const values = [
  { icon: Target, title: "Mission", desc: "Make every school–parent interaction real-time, transparent and effortless." },
  { icon: Eye, title: "Vision", desc: "A future where no child slips through the cracks because the data arrived too late." },
  { icon: Heart, title: "Values", desc: "Simplicity for users, security for data, empathy for every family we serve." },
  { icon: Zap, title: "Approach", desc: "Meet people where they are. Telegram, plain English, instant answers." },
];
