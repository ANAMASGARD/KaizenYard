import Link from "next/link";
import { SettingsSectionCard } from "@/components/settings/settings-section-card";
import { buttonVariants } from "@/components/retroui/Button";
import { cn } from "@/lib/utils";

const APP_VERSION = "0.1.0";

const LINKS = [
  { label: "What's new", href: "/dashboard" },
  { label: "Help center", href: "https://github.com" },
  { label: "Contact support", href: "mailto:support@kaizenyard.app" },
  { label: "Terms of service", href: "/" },
  { label: "Privacy policy", href: "/" },
];

export function AboutSection() {
  return (
    <SettingsSectionCard title="About" description="Kaizenyard app information.">
      <div className="space-y-4">
        <div>
          <p className="font-head text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Version
          </p>
          <p className="mt-1 font-sans text-lg">{APP_VERSION}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {LINKS.map((link) => {
            const className = cn(buttonVariants({ variant: "outline", size: "sm" }));
            if (link.href.startsWith("http") || link.href.startsWith("mailto:")) {
              return (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.href.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  className={className}
                >
                  {link.label}
                </a>
              );
            }
            return (
              <Link key={link.label} href={link.href} className={className}>
                {link.label}
              </Link>
            );
          })}
        </div>

        <p className="font-sans text-sm text-muted-foreground">
          Settings are saved automatically per account. Changes apply across devices when
          you sign in with the same account.
        </p>
      </div>
    </SettingsSectionCard>
  );
}
