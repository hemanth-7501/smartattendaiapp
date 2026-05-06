import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — SmartAttendAI" },
      {
        name: "description",
        content: "Talk to the SmartAttendAI team. Book a demo or pilot the platform at your school.",
      },
      { property: "og:title", content: "Contact SmartAttendAI" },
      { property: "og:description", content: "Reach the team to book a demo or pilot." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [sending, setSending] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      (e.target as HTMLFormElement).reset();
      toast.success("Thanks! We’ll get back within one business day.");
    }, 700);
  };

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Contact"
        title={<>Let’s bring SmartAttendAI to <span className="text-gradient">your school.</span></>}
        description="Tell us a bit about your institution and we’ll set up a personalized walkthrough."
      />

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-6">
            {info.map((i) => (
              <div key={i.title} className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 shadow-soft">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <i.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-display text-sm font-semibold">{i.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{i.value}</p>
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={onSubmit}
            className="rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-8"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" name="name" required placeholder="Jane Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input id="role" name="role" placeholder="Principal, HOD, Teacher…" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required placeholder="you@school.edu" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="school">School / Institution</Label>
                <Input id="school" name="school" placeholder="Greenwood High" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  placeholder="Tell us about your school size and what you’d like to solve…"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={sending}
              size="lg"
              className="mt-6 w-full bg-gradient-primary shadow-elegant sm:w-auto"
            >
              {sending ? "Sending…" : (<>Send message <Send className="ml-1 h-4 w-4" /></>)}
            </Button>
          </form>
        </div>
      </section>
    </SiteLayout>
  );
}

const info = [
  { icon: Mail, title: "Email", value: "hello@smartattendai.com" },
  { icon: Phone, title: "Phone", value: "+91 80 0000 0000" },
  { icon: MapPin, title: "Address", value: "Bengaluru, Karnataka, India" },
];
