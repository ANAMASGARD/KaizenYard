import { HeroDashboardCta } from "@/components/landing/hero-dashboard-cta";

const STATS = [
  { value: "100%", label: "Anonymous", className: "animate-hero-stat-1" },
  { value: "ZERO", label: "Identity leak", className: "animate-hero-stat-2" },
  { value: "REAL", label: "Attestation", className: "animate-hero-stat-3" },
] as const;

export function HeroSection() {
  return (
    <section className="relative h-screen w-full overflow-hidden border-b-2 border-border bg-black">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="animate-hero-video absolute inset-0 h-full w-full object-cover"
      >
        <source
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_202655_a7f5aca0-2f80-4bc9-bcb5-96ac95662003.mp4"
          type="video/mp4"
        />
      </video>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-[55%] bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

      <div className="relative z-10 flex h-full flex-col justify-end px-6 pb-12 sm:px-10 md:pb-16 md:px-16 lg:px-20 lg:pb-20">
        <p className="animate-hero-label mb-8 font-sans text-[10px] font-medium uppercase tracking-[0.3em] text-white/60 sm:text-xs md:mb-12">
          Privacy-first productivity. By Kaizenyard.
        </p>

        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between lg:gap-20">
          <div className="shrink-0">
            <h1 className="animate-hero-title font-head text-[clamp(2.5rem,8vw,5rem)] font-bold uppercase leading-[0.9] tracking-[-0.06em] text-white">
              Work
              <br />
              Together.
              <br />
              Privately.
            </h1>

            <div className="animate-hero-meta mt-6 flex flex-wrap items-center gap-4 font-sans text-[10px] font-medium uppercase tracking-wider text-white/50 sm:gap-6 sm:text-xs">
              <span>Mode: Anonymous</span>
              <span className="animate-hero-divider inline-block h-[1px] w-8 bg-white/30" />
              <span>Trust: Verified</span>
            </div>
          </div>

          <div className="flex max-w-md flex-col gap-8">
            <p className="animate-hero-description font-sans text-xs leading-relaxed text-white/60 sm:text-sm">
              Verified feedback from real members — without identifying who.
            </p>

            <HeroDashboardCta />

            <div className="flex items-end gap-8 sm:gap-12">
              {STATS.map((stat) => (
                <div
                  key={stat.label}
                  className={`${stat.className} flex flex-col gap-1`}
                >
                  <span className="font-head text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    {stat.value}
                  </span>
                  <span className="font-sans text-[10px] font-medium uppercase tracking-wider text-white/40 sm:text-xs">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
