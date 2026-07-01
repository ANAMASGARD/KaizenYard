import { AttestationSection } from "@/components/landing/attestation-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HeroSection } from "@/components/landing/hero-section";
import { LandingFooter, PrivacySection } from "@/components/landing/privacy-section";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { RoadmapSection } from "@/components/landing/roadmap-section";

export function LandingPage() {
  return (
    <>
      <LandingNavbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <AttestationSection />
        <RoadmapSection />
        <PrivacySection />
      </main>
      <LandingFooter />
    </>
  );
}
