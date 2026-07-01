"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import { clerkAppearance } from "@/components/dashboard/clerk-appearance";

export function ClerkProviderThemed({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        theme: shadcn,
        elements: clerkAppearance.elements,
      }}
    >
      {children}
    </ClerkProvider>
  );
}
