import { Card } from "@/components/retroui/Card";
import { Text } from "@/components/retroui/Text";

const FEATURES = [
  {
    title: "Anonymous attestation",
    description:
      "Verified members submit feedback with cryptographic proof of group membership — no names, no trails.",
    tag: "Core",
  },
  {
    title: "Private workspaces",
    description:
      "Your tasks, notes, and boards stay yours. Built for teams who take data sovereignty seriously.",
    tag: "Privacy",
  },
  {
    title: "Unified productivity",
    description:
      "Kanban boards, calendars, notes, and whiteboards in one flow — not ten disconnected tabs.",
    tag: "Tools",
  },
  {
    title: "Real-time collaboration",
    description:
      "Live cursors, presence, and sync across pages so teams move together without sacrificing privacy.",
    tag: "Live",
  },
  {
    title: "Voice intelligence",
    description:
      "Speech-to-text and voice commands woven into your workflow — hands-free when focus matters.",
    tag: "Voice",
  },
  {
    title: "Spaces & pages",
    description:
      "Organize work in nested spaces. Every project gets structure without corporate bloat.",
    tag: "Structure",
  },
] as const;

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="border-b-2 border-black bg-background px-6 py-20 sm:px-10 md:px-16 lg:px-20"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 max-w-2xl">
          <p className="mb-3 font-sans text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">
            Everything you need
          </p>
          <Text as="h2" className="mb-4">
            Productivity without the surveillance
          </Text>
          <p className="font-sans text-muted-foreground">
            Kaizenyard combines the tools teams expect with a privacy model
            they&apos;ve been waiting for.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <Card
              key={feature.title}
              className="flex h-full flex-col border-2 border-black bg-card p-6 shadow-md transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <span className="mb-4 inline-block w-fit border-2 border-black bg-primary px-2 py-0.5 font-sans text-[10px] font-bold uppercase tracking-wider">
                {feature.tag}
              </span>
              <Text as="h3" className="mb-2 text-xl">
                {feature.title}
              </Text>
              <p className="font-sans text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
