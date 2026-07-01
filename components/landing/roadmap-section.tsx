import { Card } from "@/components/retroui/Card";
import { Text } from "@/components/retroui/Text";

const ROADMAP = [
  { num: "01", title: "Project setup", status: "done" },
  { num: "02", title: "DB + auth", status: "done" },
  { num: "03", title: "Dashboard layout", status: "next" },
  { num: "04", title: "Calendar", status: "planned" },
  { num: "05", title: "Kanban board", status: "planned" },
  { num: "06", title: "Notes", status: "planned" },
  { num: "07", title: "Whiteboard", status: "planned" },
  { num: "08", title: "Spaces & pages", status: "planned" },
  { num: "09", title: "Attestation", status: "planned" },
  { num: "10", title: "AI assistant", status: "planned" },
] as const;

function statusStyles(status: (typeof ROADMAP)[number]["status"]) {
  switch (status) {
    case "done":
      return "bg-foreground text-background";
    case "next":
      return "bg-primary text-primary-foreground border-2 border-black";
    case "planned":
      return "bg-muted text-muted-foreground";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function RoadmapSection() {
  return (
    <section
      id="roadmap"
      className="border-b-2 border-black bg-background px-6 py-20 sm:px-10 md:px-16 lg:px-20"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 max-w-2xl">
          <p className="mb-3 font-sans text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">
            Development chapters
          </p>
          <Text as="h2" className="mb-4">
            Built in deliberate stages
          </Text>
          <p className="font-sans text-muted-foreground">
            Collaboration and voice intelligence woven across every chapter —
            starting with foundations, ending with AI-assisted workflows.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {ROADMAP.map((item) => (
            <Card
              key={item.num}
              className="group border-2 border-black p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="font-head text-xs font-bold text-muted-foreground">
                  {item.num}
                </span>
                <span
                  className={`px-1.5 py-0.5 font-sans text-[9px] font-bold uppercase tracking-wider ${statusStyles(item.status)}`}
                >
                  {item.status}
                </span>
              </div>
              <p className="font-head text-sm font-semibold leading-tight">
                {item.title}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
