import { SettingsSectionCard } from "@/components/settings/settings-section-card";
import { Badge } from "@/components/retroui/Badge";

const INTEGRATIONS = [
  { name: "Google Calendar", description: "Sync events two-way." },
  { name: "Slack", description: "Task and reminder notifications." },
  { name: "Notion", description: "Import pages and databases." },
];

export function IntegrationsSection() {
  return (
    <SettingsSectionCard
      title="Integrations"
      description="Connect external tools to Kaizenyard."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {INTEGRATIONS.map((integration) => (
          <div
            key={integration.name}
            className="rounded border-2 border-border bg-card p-4 shadow-sm"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="font-head text-sm">{integration.name}</p>
              <Badge variant="outline">Coming soon</Badge>
            </div>
            <p className="font-sans text-sm text-muted-foreground">
              {integration.description}
            </p>
          </div>
        ))}
      </div>
    </SettingsSectionCard>
  );
}
