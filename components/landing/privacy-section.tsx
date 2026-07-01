import { PrivacyCta } from "@/components/landing/privacy-cta";
import { Card } from "@/components/retroui/Card";
import { Text } from "@/components/retroui/Text";

const PILLARS = [
  {
    title: "No surveillance capitalism",
    body: "We don't sell your data. Your workspace is a workspace — not a data mine.",
  },
  {
    title: "Minimal data collection",
    body: "Only what's needed to run the product. Attestation uses proofs, not profiles.",
  },
  {
    title: "You own your work",
    body: "Export anytime. Delete anytime. Your tasks and notes belong to you.",
  },
] as const;

export function PrivacySection() {
  return (
    <section
      id="privacy"
      className="border-b-2 border-black bg-foreground px-6 py-20 text-background sm:px-10 md:px-16 lg:px-20"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 max-w-2xl">
          <p className="mb-3 font-sans text-xs font-medium uppercase tracking-[0.25em] text-background/50">
            Privacy by design
          </p>
          <Text as="h2" className="mb-4 text-background">
            Trust is the product
          </Text>
          <p className="font-sans text-background/70">
            Kaizenyard is built for teams who need honest feedback and focused
            work — without trading privacy for productivity.
          </p>
        </div>

        <div className="mb-16 grid gap-6 md:grid-cols-3">
          {PILLARS.map((pillar) => (
            <Card
              key={pillar.title}
              className="border-2 border-background bg-background p-6 text-foreground shadow-[4px_4px_0_0_hsl(0_0%_100%)]"
            >
              <Text as="h3" className="mb-2 text-lg">
                {pillar.title}
              </Text>
              <p className="font-sans text-sm text-muted-foreground">
                {pillar.body}
              </p>
            </Card>
          ))}
        </div>

        <Card className="flex flex-col items-start justify-between gap-6 border-2 border-background bg-primary p-8 shadow-[6px_6px_0_0_hsl(0_0%_100%)] md:flex-row md:items-center">
          <div>
            <Text as="h3" className="mb-2 text-2xl">
              Ready to work privately?
            </Text>
            <p className="font-sans text-sm text-foreground/80">
              Join Kaizenyard — productivity with attestation built in.
            </p>
          </div>
          <PrivacyCta />
        </Card>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="bg-background px-6 py-10 sm:px-10 md:px-16 lg:px-20">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="font-head text-sm font-bold tracking-tight">Kaizenyard</p>
        <p className="font-sans text-xs text-muted-foreground">
          Privacy-first productivity. Anonymous attestation.
        </p>
        <p className="font-sans text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
