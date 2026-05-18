import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { getWeeks } from "@/lib/content";
import Sidebar from "@/components/Sidebar";

export default async function StudyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isAuthenticated();
  if (!authed) redirect("/login");

  const weeks = getWeeks();

  return (
    <div className="flex h-full">
      <Sidebar weeks={weeks} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
