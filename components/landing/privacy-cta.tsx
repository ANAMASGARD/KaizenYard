"use client";

import { SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/retroui/Button";

export function PrivacyCta() {
  return (
    <SignUpButton mode="redirect" forceRedirectUrl="/">
      <Button size="lg" variant="secondary">
        Create your workspace
      </Button>
    </SignUpButton>
  );
}
