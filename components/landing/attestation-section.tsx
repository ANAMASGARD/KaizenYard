import { Badge } from "@/components/retroui/Badge";
import { Card } from "@/components/retroui/Card";
import { Text } from "@/components/retroui/Text";

const STEPS = [
  {
    step: "01",
    title: "Join a verified group",
    body: "Employees or customers authenticate once. Kaizenyard confirms membership — not identity in feedback.",
  },
  {
    step: "02",
    title: "Submit blind feedback",
    body: "Share honest input on products, culture, or processes. Your message is stripped of identifying metadata.",
  },
  {
    step: "03",
    title: "Attest without exposing",
    body: "Cryptographic attestation proves the feedback came from a real group member. Recipients see truth, not names.",
  },
] as const;

export function AttestationSection() {
  return (
    <section
      id="attestation"
      className="border-b-2 border-border bg-primary px-6 py-20 sm:px-10 md:px-16 lg:px-20"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <Badge
              variant="outline"
              size="sm"
              className="mb-4 border-2 border-border bg-background"
            >
              Flagship feature
            </Badge>
            <Text as="h2" className="mb-4">
              Anonymous feedback, provably real
            </Text>
            <p className="font-sans text-foreground/80">
              Most feedback tools force a choice: honest or anonymous. Kaizenyard
              gives you both — verified attestation that preserves individual
              privacy.
            </p>
          </div>
          <Card className="w-full max-w-sm border-2 border-border bg-background p-6 shadow-lg lg:w-auto">
            <p className="font-head text-sm font-bold uppercase tracking-wide">
              The promise
            </p>
            <p className="mt-2 font-sans text-sm text-muted-foreground">
              &ldquo;We know this came from a real customer. We don&apos;t know
              which one.&rdquo;
            </p>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map((item) => (
            <Card
              key={item.step}
              className="border-2 border-border bg-background p-6 shadow-md"
            >
              <span className="font-head text-4xl font-bold text-muted-foreground/40">
                {item.step}
              </span>
              <Text as="h3" className="mb-2 mt-4 text-lg">
                {item.title}
              </Text>
              <p className="font-sans text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
