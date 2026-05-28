import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const form = await request.formData();
  const email = form.get("email")?.toString() ?? "";
  const password = form.get("password")?.toString() ?? "";

  const validEmail = import.meta.env.STUDY_EMAIL;
  const validPassword = import.meta.env.STUDY_PASSWORD;

  if (email !== validEmail || password !== validPassword) {
    return redirect("/login?error=1");
  }

  cookies.set("study_session", "authenticated", {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });

  return redirect("/");
};
