import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/assistant(.*)",
  "/calendar(.*)",
  "/tasks(.*)",
  "/notes(.*)",
  "/whiteboard(.*)",
  "/pages(.*)",
  "/templates(.*)",
  "/settings(.*)",
  "/api/liveblocks-auth(.*)",
  "/api/assemblyai/token(.*)",
  "/api/notes/ai-refine(.*)",
  "/api/whiteboard/ai-generate(.*)",
  "/api/templates/ai-generate(.*)",
  "/api/settings/export(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (req.nextUrl.pathname.startsWith("/templates/share/")) {
    return;
  }

  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
    // Always run for Clerk-specific frontend API routes
    "/__clerk/(.*)",
  ],
};
