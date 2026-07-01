"use client";

import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/retroui/Button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#attestation", label: "Attestation" },
  { href: "#roadmap", label: "Roadmap" },
  { href: "#privacy", label: "Privacy" },
] as const;

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);
  const onHero = !scrolled;

  return (
    <>
      <header
        className={cn(
          "fixed top-0 z-50 w-full transition-all duration-300",
          scrolled
            ? "border-b-2 border-border bg-background/95 shadow-sm backdrop-blur-md"
            : "border-b-0 bg-transparent",
        )}
      >
        <div className="mx-auto flex h-16 items-center justify-between px-6 sm:px-10 md:h-20 md:px-16 lg:px-20">
          <Link
            href="/"
            className={cn(
              "flex items-center gap-3 font-head text-lg tracking-tight transition-opacity hover:opacity-80",
              onHero ? "text-white" : "text-foreground",
            )}
          >
            <Logo />
            <span>Kaizenyard</span>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Main">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={cn(
                  "font-sans text-xs font-medium uppercase tracking-[0.2em] transition-colors duration-200",
                  onHero
                    ? "text-white/80 hover:text-white"
                    : "text-foreground/70 hover:text-foreground",
                )}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <ThemeToggle onHero={onHero} />
            <Show when="signed-out">
              <SignInButton mode="redirect" forceRedirectUrl="/dashboard">
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "text-xs uppercase tracking-[0.15em]",
                    onHero &&
                      "border-white text-white shadow-[2px_2px_0_0_#fff] hover:bg-white/10 hover:text-white",
                  )}
                >
                  Sign in
                </Button>
              </SignInButton>
              <SignUpButton mode="redirect" forceRedirectUrl="/dashboard">
                <Button
                  size="sm"
                  className={cn(
                    "text-xs uppercase tracking-[0.15em]",
                    onHero &&
                      "bg-primary text-primary-foreground hover:bg-primary-hover",
                  )}
                >
                  Get started
                </Button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "border-2 border-border shadow-md",
                  },
                }}
              />
            </Show>
          </div>

          <button
            type="button"
            className="flex flex-col gap-1.5 p-2 lg:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span
              className={cn(
                "block h-[2px] w-6 transition-all duration-300 ease-out",
                onHero ? "bg-white" : "bg-foreground",
                menuOpen && "translate-y-[6.5px] rotate-45",
              )}
            />
            <span
              className={cn(
                "block h-[2px] w-6 transition-all duration-300 ease-out",
                onHero ? "bg-white" : "bg-foreground",
                menuOpen && "scale-0 opacity-0",
              )}
            />
            <span
              className={cn(
                "block h-[2px] w-6 transition-all duration-300 ease-out",
                onHero ? "bg-white" : "bg-foreground",
                menuOpen && "-translate-y-[6.5px] -rotate-45",
              )}
            />
          </button>
        </div>
      </header>

      <div
        className={cn(
          "fixed inset-0 z-40 flex flex-col bg-background transition-opacity duration-500 lg:hidden",
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden={!menuOpen}
      >
        <div className="flex items-center justify-end px-6 pt-5 sm:px-10">
          <ThemeToggle />
        </div>
        <nav className="flex flex-1 flex-col justify-center px-6 sm:px-10">
          {NAV_LINKS.map((link, index) => (
            <a
              key={link.href}
              href={link.href}
              onClick={closeMenu}
              className="animate-mobile-nav-link flex items-center justify-between border-b-2 border-border/10 py-5 font-head text-2xl font-normal tracking-tight sm:text-3xl"
              style={{ animationDelay: `${index * 60 + 150}ms` }}
            >
              {link.label}
              <span className="font-sans text-xs text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </span>
            </a>
          ))}
        </nav>

        <div
          className="animate-mobile-nav-buttons flex flex-col gap-3 border-t-2 border-border px-6 py-8 sm:px-10"
          style={{ animationDelay: "400ms" }}
        >
          <Show when="signed-out">
            <SignInButton mode="redirect" forceRedirectUrl="/dashboard">
              <Button
                variant="outline"
                size="lg"
                className="w-full py-4"
                onClick={closeMenu}
              >
                Sign in
              </Button>
            </SignInButton>
            <SignUpButton mode="redirect" forceRedirectUrl="/dashboard">
              <Button size="lg" className="w-full py-4" onClick={closeMenu}>
                Get started
              </Button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <div className="flex justify-center py-2">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "border-2 border-border shadow-md",
                  },
                }}
              />
            </div>
          </Show>
        </div>
      </div>
    </>
  );
}
