import type { Metadata } from "next";
import { Archivo_Black, Space_Grotesk } from "next/font/google";
import { ClerkProviderThemed } from "@/components/clerk-provider-themed";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemedToaster } from "@/components/theme/themed-toaster";
import "./globals.css";
import { cn } from "@/lib/utils";

const archivoBlack = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-head",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kaizenyard",
  description:
    "Privacy-first productivity with anonymous attestation. Verified feedback without identity exposure.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full antialiased",
        archivoBlack.variable,
        spaceGrotesk.variable,
      )}
    >
      <body className="min-h-full font-sans">
        <ThemeProvider>
          <ClerkProviderThemed>
            {children}
            <ThemedToaster />
          </ClerkProviderThemed>
        </ThemeProvider>
      </body>
    </html>
  );
}
