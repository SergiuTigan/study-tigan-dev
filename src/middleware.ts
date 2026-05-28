import { defineMiddleware } from "astro:middleware";

const PUBLIC_PATHS = ["/login", "/api/login", "/api/logout"];

export const onRequest = defineMiddleware((context, next) => {
  const { pathname } = context.url;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return next();
  }

  // Allow static assets
  if (pathname.startsWith("/_astro/") || pathname.match(/\.\w+$/)) {
    return next();
  }

  const session = context.cookies.get("study_session");
  if (session?.value !== "authenticated") {
    return context.redirect("/login");
  }

  return next();
});
